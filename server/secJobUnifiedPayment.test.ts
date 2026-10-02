// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import http from 'http';
import crypto from 'crypto';
import { secAnalystRouter } from './secAnalystAgent.js';
import { handleMcpRpcRequest } from './mcpService.js';
import {
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry,
  DEFAULT_AUTONOMOUS_SCOPES
} from './agentPlatform.js';
import { inMemorySettlementRegistry } from './agentExchangeApi.js';

describe('SEC Job Unified Payment Architecture Suite', () => {
  let server: http.Server;
  const originalEnv = { ...process.env };
  const TEST_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

  beforeAll(async () => {
    process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;

    const testApp = express();
    testApp.use(express.json());

    // Mount secAnalystRouter at canonical endpoint /api/v1/sec
    testApp.use('/api/v1/sec', secAnalystRouter);

    // Mount MCP RPC handler
    testApp.post(['/api/mcp/rpc', '/mcp'], handleMcpRpcRequest);

    // Spin up test server on ephemeral port for authentic loopback requests
    await new Promise<void>((resolve) => {
      server = testApp.listen(0, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    process.env = { ...originalEnv };
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryWalletRegistry.clear();
    inMemorySettlementRegistry.clear();
  });

  const registerTestAgent = (creditsBalance = 100, paidCreditsBalance = 0) => {
    const agentId = `agent_sec_test_${crypto.randomBytes(4).toString('hex')}`;
    const publicId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(16).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const rawApiKey = `sb_live_${publicId}_${secret}`;
    const handle = `sec_tester_${publicId.substring(0, 6)}`;

    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: `SEC Test Agent ${publicId.substring(0, 4)}`,
      status: 'active'
    });

    const keyRecord = {
      keyId: publicId,
      agentId,
      handle,
      secretHash,
      keyHash: secretHash,
      status: 'active',
      scopes: [...DEFAULT_AUTONOMOUS_SCOPES],
      createdAt: new Date().toISOString()
    };

    inMemoryKeyRegistry.set(publicId, keyRecord as any);
    inMemoryKeyRegistry.set(rawApiKey, keyRecord as any);

    inMemoryWalletRegistry.set(agentId, {
      agentId,
      creditsBalance,
      availableBalance: creditsBalance,
      paidCreditsBalance,
      trialCredits: creditsBalance - paidCreditsBalance,
      lifetimeSpent: 0
    });

    return { agentId, rawApiKey, handle };
  };

  // --------------------------------------------------------------------------
  // A. Agent with >=25 trial credits: success, exactly 25 debited, no paid-bucket involvement.
  // --------------------------------------------------------------------------
  it('A. Agent with >=25 trial credits: succeeds, exactly 25 debited, no paid-bucket involvement', async () => {
    // 100 purely trial credits (0 paid credits)
    const { agentId, rawApiKey } = registerTestAgent(100, 0);

    const res = await request(server)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        ticker: 'NVDA',
        filingType: '10-Q',
        question: 'Analyze data center growth'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settlement.grossAmount).toBe(25);

    const wallet = inMemoryWalletRegistry.get(agentId);
    // Exactly 25 debited from trial/platform credits: 100 - 25 = 75
    expect(wallet?.creditsBalance).toBe(75);
    // Paid credits bucket remained untouched at 0
    expect(wallet?.paidCreditsBalance).toBe(0);
  });

  // --------------------------------------------------------------------------
  // B. Agent with <25 credits: HTTP 402 with valid x402 challenge ($0.25 Base USDC), zero dead SKU or pricing URLs in the response.
  // --------------------------------------------------------------------------
  it('B. Agent with <25 credits: HTTP 402 with valid x402 challenge ($0.25 Base USDC), zero dead SKU or pricing URLs', async () => {
    // 10 credits remaining (less than the required 25 credits / $0.25)
    const { rawApiKey } = registerTestAgent(10, 0);

    const res = await request(server)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-K'
      });

    expect(res.status).toBe(402);
    // Valid x402 v2 challenge
    expect(res.body.x402Version).toBe(2);
    expect(Array.isArray(res.body.accepts)).toBe(true);
    expect(res.body.accepts[0].amount).toBe('250000'); // $0.25 USDC
    expect(res.body.accepts[0].network).toBe('eip155:8453'); // Base
    expect(res.headers['payment-required']).toBeDefined();

    // Confirm ZERO dead SKU or pricing checkout URLs in error response
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('agent_credits_1000');
    expect(bodyStr).not.toContain('api_bundle');
    expect(bodyStr).not.toContain('https://stockbloc.ai.studio/pricing');
    expect(bodyStr).not.toContain('/pricing');
    expect(res.body.checkoutUrl).toBeUndefined();
    expect(res.body.purchaseOption).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // C. MCP analyze_sec_filing with funded key: real SEC analysis, 25 credits debited.
  // --------------------------------------------------------------------------
  it('C. MCP analyze_sec_filing with funded key: real SEC analysis, 25 credits debited', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100, 0);

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'mcp_sec_analysis_test',
        method: 'tools/call',
        params: {
          name: 'analyze_sec_filing',
          arguments: {
            ticker: 'NVDA',
            filingType: '10-Q',
            question: 'What is the gross margin trend?'
          }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.content[0].type).toBe('text');

    const parsed = JSON.parse(res.body.result.content[0].text);
    expect(parsed.jobId).toBeDefined();
    expect(parsed.output).toBeDefined();
    expect(parsed.output.ticker).toBe('NVDA');

    // 25 credits debited: 100 - 25 = 75
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(75);
  });

  // --------------------------------------------------------------------------
  // D. Retry idempotency: no double debit.
  // --------------------------------------------------------------------------
  it('D. Retry idempotency: no double debit', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100, 0);
    const idempotencyKey = 'idem_sec_retry_unique_9999';

    // 1st request
    const res1 = await request(server)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        ticker: 'MSFT',
        filingType: '10-Q'
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(inMemoryWalletRegistry.get(agentId)?.creditsBalance).toBe(75);

    // 2nd request with same idempotency key
    const res2 = await request(server)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        ticker: 'MSFT',
        filingType: '10-Q'
      });

    expect(res2.status).toBe(200);
    expect(res2.body.idempotentReplay).toBe(true);

    // Balance remains 75 (no double debit!)
    expect(inMemoryWalletRegistry.get(agentId)?.creditsBalance).toBe(75);
  });

  // --------------------------------------------------------------------------
  // E. Anonymous request: standard x402 402 flow.
  // --------------------------------------------------------------------------
  it('E. Anonymous request: standard x402 402 flow', async () => {
    const res = await request(server)
      .post('/api/v1/sec/job')
      .send({
        ticker: 'AAPL',
        filingType: '10-K'
      });

    expect(res.status).toBe(402);
    expect(res.body.x402Version).toBe(2);
    expect(res.body.accepts[0].amount).toBe('250000'); // $0.25 USDC
    expect(res.body.accepts[0].network).toBe('eip155:8453'); // Base
    expect(res.headers['payment-required']).toBeDefined();

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('agent_credits_1000');
    expect(bodyStr).not.toContain('https://stockbloc.ai.studio/pricing');
  });
});
