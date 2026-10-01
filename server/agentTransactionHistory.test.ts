import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { db, dbStoreInstance } from './firebaseAdmin.js';
import {
  agentPlatformRouter,
  handleGetAgentTransactions,
  verifyAndDebitAgentCredit,
  addCreditsToAgentWallet,
  inMemoryKeyRegistry,
  inMemoryAgentRegistry,
  inMemoryWalletRegistry,
  registerAutonomousAgentHandler
} from './agentPlatform.js';
import { authenticateAgent } from './agentSecurity.js';

describe('Agent Transaction History & Itemized Receipts API', () => {
  const app = express();
  app.use(express.json());
  app.use(['/api/v1/agents', '/api/v1/agent', '/api/agents'], agentPlatformRouter);
  app.get(['/agent/me/transactions', '/agents/me/transactions'], authenticateAgent, handleGetAgentTransactions);

  beforeEach(() => {
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryWalletRegistry.clear();
    dbStoreInstance.getCollection('ledger_entries').clear();
    dbStoreInstance.getCollection('agent_wallets').clear();
    dbStoreInstance.getCollection('users').clear();
    dbStoreInstance.getCollection('api_keys').clear();
  });

  // Helper to register an autonomous agent and return credentials
  async function createTestAgent(prefix = 'test_agent') {
    const handle = `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
    const req = {
      body: {
        handle,
        displayName: `Agent ${handle}`,
        specialties: ['Market Intel']
      }
    };
    let resData: any = null;
    let resStatus = 200;
    const res = {
      status: (code: number) => {
        resStatus = code;
        return {
          json: (data: any) => {
            resData = data;
            return resData;
          }
        };
      },
      json: (data: any) => {
        resData = data;
        return resData;
      }
    };

    await registerAutonomousAgentHandler(req as any, res as any);
    return {
      agentId: resData.agentId,
      handle: resData.handle,
      apiKey: resData.apiKey,
      wallet: resData.wallet
    };
  }

  // 1. Unauthenticated request returns 401
  it('1. Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/v1/agents/me/transactions');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // 2. Invalid or revoked key returns 401
  it('2. Invalid or revoked API key returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/agents/me/transactions')
      .set('Authorization', 'Bearer sb_live_fakekey12345678_notarealkeyatall');
    expect(res.status).toBe(401);
  });

  // 3. Fresh agent with zero transactions returns empty list with 200 OK
  it('3. Fresh agent with zero transactions returns empty entries array with 200 OK', async () => {
    const agent = await createTestAgent('empty_agent');
    const res = await request(app)
      .get('/api/v1/agents/me/transactions')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.agentId).toBe(agent.agentId);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.entries.length).toBe(0);
    expect(res.body.pagination).toEqual({
      limit: 25,
      nextCursor: null,
      hasMore: false
    });
  });

  // 4. Scoping isolation: Agent A cannot see Agent B's ledger entries
  it('4. Scoping isolation: Agent A cannot see Agent B entries under any parameter variation', async () => {
    const agentA = await createTestAgent('agent_a');
    const agentB = await createTestAgent('agent_b');

    // Debit Agent B for an API call
    await verifyAndDebitAgentCredit(`Bearer ${agentB.apiKey}`, 5, {
      endpoint: '/api/v1/intelligence/sb-score',
      method: 'GET',
      tag: 'METERED_API',
      description: 'x402 credit access to SB Score (GET /api/v1/intelligence/sb-score)'
    });

    // Agent A queries transactions
    const resA = await request(app)
      .get('/api/v1/agents/me/transactions')
      .set('Authorization', `Bearer ${agentA.apiKey}`);

    expect(resA.status).toBe(200);
    expect(resA.body.agentId).toBe(agentA.agentId);
    expect(resA.body.entries.length).toBe(0);

    // Agent A attempts to spoof Agent B via query param
    const resSpoof = await request(app)
      .get(`/api/v1/agents/me/transactions?agentId=${agentB.agentId}&accountId=${agentB.agentId}`)
      .set('Authorization', `Bearer ${agentA.apiKey}`)
      .set('X-Agent-Id', agentB.agentId);

    expect(resSpoof.status).toBe(200);
    expect(resSpoof.body.agentId).toBe(agentA.agentId);
    expect(resSpoof.body.entries.length).toBe(0);

    // Agent B sees its own transaction
    const resB = await request(app)
      .get('/api/v1/agents/me/transactions')
      .set('Authorization', `Bearer ${agentB.apiKey}`);

    expect(resB.status).toBe(200);
    expect(resB.body.agentId).toBe(agentB.agentId);
    expect(resB.body.entries.length).toBe(1);
    expect(resB.body.entries[0].amountCredits).toBe(5);
  });

  // 5. Itemized response shape matches spec exactly
  it('5. Response shape matches the receipt specification exactly', async () => {
    const agent = await createTestAgent('shape_agent');

    // Record a 5-credit debit
    const debitRes = await verifyAndDebitAgentCredit(`Bearer ${agent.apiKey}`, 5, {
      endpoint: '/api/v1/intelligence/sb-score',
      method: 'GET',
      tag: 'METERED_API',
      description: 'x402 credit access to SB Score (GET /api/v1/intelligence/sb-score)'
    });
    expect(debitRes.valid).toBe(true);

    const res = await request(app)
      .get('/api/v1/agents/me/transactions')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.agentId).toBe(agent.agentId);
    expect(res.body.entries.length).toBe(1);

    const entry = res.body.entries[0];
    expect(entry.entryId).toMatch(/^led_/);
    expect(typeof entry.timestamp).toBe('string');
    expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
    expect(entry.type).toBe('DEBIT');
    expect(entry.amountCredits).toBe(5);
    expect(entry.usdEquivalent).toBe(0.05); // 5 * 0.01 = 0.05
    expect(entry.endpoint).toBe('GET /api/v1/intelligence/sb-score');
    expect(entry.method).toBe('GET');
    expect(entry.description).toBe('x402 credit access to SB Score (GET /api/v1/intelligence/sb-score)');
    expect(entry.balanceAfter).toBe(95); // 100 - 5 = 95
  });

  // 6. Pagination: limit, cursor, nextCursor, and hasMore across multiple pages
  it('6. Pagination respects limit, provides cursor, and navigates across pages', async () => {
    const agent = await createTestAgent('pager_agent');

    // Create 4 distinct transactions with slight delay to ensure distinct timestamps
    for (let i = 1; i <= 4; i++) {
      await verifyAndDebitAgentCredit(`Bearer ${agent.apiKey}`, 1, {
        endpoint: `/api/v1/market/quote?symbol=TICKER${i}`,
        method: 'GET',
        tag: 'METERED_API',
        description: `Market quote lookup ${i}`
      });
      // Small pause so timestamps differ
      await new Promise(r => setTimeout(r, 10));
    }

    // Page 1: limit 2
    const page1Res = await request(app)
      .get('/api/v1/agents/me/transactions?limit=2')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.entries.length).toBe(2);
    expect(page1Res.body.pagination.limit).toBe(2);
    expect(page1Res.body.pagination.hasMore).toBe(true);
    expect(typeof page1Res.body.pagination.nextCursor).toBe('string');

    const cursor = page1Res.body.pagination.nextCursor;
    const page1Ids = page1Res.body.entries.map((e: any) => e.entryId);

    // Page 2: with cursor
    const page2Res = await request(app)
      .get(`/api/v1/agents/me/transactions?limit=2&cursor=${cursor}`)
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.entries.length).toBe(2);
    const page2Ids = page2Res.body.entries.map((e: any) => e.entryId);

    // Ensure no overlapping entries
    expect(page1Ids).not.toEqual(page2Ids);
    page1Ids.forEach((id: string) => {
      expect(page2Ids).not.toContain(id);
    });

    // Page 2 should be the end
    expect(page2Res.body.pagination.hasMore).toBe(false);
    expect(page2Res.body.pagination.nextCursor).toBeNull();
  });

  // 7. Filtering: type=DEBIT and type=CREDIT
  it('7. Filters correctly by transaction type (DEBIT and CREDIT)', async () => {
    const agent = await createTestAgent('filter_agent');

    // 1 debit
    await verifyAndDebitAgentCredit(`Bearer ${agent.apiKey}`, 10, {
      endpoint: '/api/v1/intelligence/research',
      method: 'POST',
      tag: 'RESEARCH'
    });

    // 1 credit
    await addCreditsToAgentWallet(agent.agentId, 50, 'STRIPE_PURCHASE', {
      sessionId: 'cs_test_sample'
    });

    // Filter type=DEBIT
    const debitRes = await request(app)
      .get('/api/v1/agents/me/transactions?type=DEBIT')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(debitRes.status).toBe(200);
    expect(debitRes.body.entries.length).toBe(1);
    expect(debitRes.body.entries[0].type).toBe('DEBIT');
    expect(debitRes.body.entries[0].amountCredits).toBe(10);

    // Filter type=CREDIT
    const creditRes = await request(app)
      .get('/api/v1/agents/me/transactions?type=CREDIT')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(creditRes.status).toBe(200);
    expect(creditRes.body.entries.length).toBe(1);
    expect(creditRes.body.entries[0].type).toBe('CREDIT');
    expect(creditRes.body.entries[0].amountCredits).toBe(50);
  });

  // 8. Filtering: tag and since filters
  it('8. Filters correctly by tag and since ISO-8601 timestamp', async () => {
    const agent = await createTestAgent('tag_since_agent');

    const pastTime = new Date(Date.now() - 60000).toISOString();

    // Entry 1 with tag METERED_API
    await verifyAndDebitAgentCredit(`Bearer ${agent.apiKey}`, 1, {
      endpoint: '/api/data/market',
      method: 'GET',
      tag: 'METERED_API',
      description: 'Market data call'
    });

    // Entry 2 with tag RESEARCH
    await verifyAndDebitAgentCredit(`Bearer ${agent.apiKey}`, 10, {
      endpoint: '/api/v1/intelligence/research',
      method: 'POST',
      tag: 'RESEARCH',
      description: 'Research memo'
    });

    // Filter by tag=METERED_API
    const tagRes = await request(app)
      .get('/api/v1/agents/me/transactions?tag=METERED_API')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(tagRes.status).toBe(200);
    expect(tagRes.body.entries.length).toBe(1);
    expect(tagRes.body.entries[0].amountCredits).toBe(1);

    // Filter by since (past time)
    const sinceRes = await request(app)
      .get(`/api/v1/agents/me/transactions?since=${encodeURIComponent(pastTime)}`)
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(sinceRes.status).toBe(200);
    expect(sinceRes.body.entries.length).toBe(2);

    // Filter by future since time -> empty
    const futureTime = new Date(Date.now() + 60000).toISOString();
    const futureRes = await request(app)
      .get(`/api/v1/agents/me/transactions?since=${encodeURIComponent(futureTime)}`)
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(futureRes.status).toBe(200);
    expect(futureRes.body.entries.length).toBe(0);
  });

  // 9. Endpoint aliases work consistently
  it('9. Endpoint aliases (/agent/me/transactions and /agents/me/transactions) resolve identically', async () => {
    const agent = await createTestAgent('alias_agent');

    await verifyAndDebitAgentCredit(`Bearer ${agent.apiKey}`, 2, {
      endpoint: '/api/v1/sec/job',
      method: 'POST',
      tag: 'SEC_AUDIT'
    });

    const res1 = await request(app)
      .get('/api/v1/agent/me/transactions')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    const res2 = await request(app)
      .get('/agent/me/transactions')
      .set('Authorization', `Bearer ${agent.apiKey}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.entries.length).toBe(1);
    expect(res2.body.entries.length).toBe(1);
    expect(res1.body.entries[0].entryId).toBe(res2.body.entries[0].entryId);
  });
});
