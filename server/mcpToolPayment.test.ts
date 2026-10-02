// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import http from 'http';
import crypto from 'crypto';
import { handleMcpRpcRequest, MCP_TOOLS, PAID_MCP_TOOLS, MCP_TOOL_PRICING } from './mcpService.js';
import { requireX402Payment, clearX402SettlementRegistry, PRICED_ENDPOINTS, BASE_USDC_CONTRACT, BASE_CAIP2 } from './x402PaymentService.js';
import { secAnalystRouter } from './secAnalystAgent.js';
import {
  resetFacilitatorMock,
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler,
  mockFacilitatorVerify,
  mockFacilitatorSettle
} from './testSetup/facilitatorMock.js';
import {
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry,
  DEFAULT_AUTONOMOUS_SCOPES
} from './agentPlatform.js';
import {
  getMachineRevenueMetrics,
  clearTelemetryState
} from './agentTelemetry.js';

describe('Stock Bloc Native MCP x402 Payment Flow & Tool Execution Suite', () => {
  let server: http.Server;
  const originalEnv = { ...process.env };
  const TEST_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

  beforeAll(async () => {
    process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;

    const testApp = express();
    testApp.use(express.json());

    // Mount x402 payment protection middleware globally
    testApp.use(requireX402Payment());

    // Real sec analyst router which handles POST /api/v1/sec/job with credits & settlement
    testApp.use('/api/v1/sec', secAnalystRouter);

    // Live quote endpoint matching server.impl.ts ($0.01 / 1 credit)
    testApp.get(['/api/live-quote/:symbol', '/api/v1/market/quote/:symbol'], (req, res) => {
      res.json({
        symbol: (req.params.symbol || 'AAPL').toUpperCase(),
        price: 138.25,
        change: 2.45,
        volume: '45.2M',
        status: 'success'
      });
    });

    // Live SEC endpoint matching server.impl.ts ($0.10 / 10 credits)
    testApp.get('/api/data/sec', (req, res) => {
      res.json({
        source: '/api/data/sec',
        updated_at: new Date().toISOString(),
        stale: false,
        funds: [
          { fund_name: 'Berkshire Hathaway', manager: 'Warren Buffett', topHoldings: [{ ticker: 'AAPL', shares: '300M' }] },
          { fund_name: 'ARK Invest', manager: 'Cathie Wood', topHoldings: [{ ticker: 'TSLA', shares: '3.4M' }] },
          { fund_name: 'Duquesne Family Office', manager: 'Stanley Druckenmiller', topHoldings: [{ ticker: 'NVDA', shares: '1.8M' }] }
        ],
        macroSummary: 'Institutional 13F whale accumulation observed in AI compute.'
      });
    });

    // Quant simulation endpoint ($0.10 / 10 credits)
    testApp.post('/api/v1/agent/quant-sim', (req, res) => {
      res.json({
        status: 'simulation_complete',
        metrics: {
          sharpe_ratio: 2.45,
          annualized_alpha_percent: '+28.4%',
          max_drawdown_percent: '-8.2%',
          win_rate_percent: '74%'
        }
      });
    });

    // Strategy evaluation endpoint ($0.10 / 10 credits)
    testApp.post('/api/v1/agent/strategy/evaluate', (req, res) => {
      res.json({
        status: 'success',
        annualizedReturn: 0.428,
        sharpeRatio: 2.65,
        maxDrawdown: -0.092,
        benchmarkReturn: 0.312,
        alpha: 0.116
      });
    });

    // Submit performance / trade thesis ($0.10 / 10 credits)
    testApp.post('/api/v1/agent/submit-performance', (req, res) => {
      res.json({
        status: 'success',
        tradeId: 'tr_test_001',
        published: true,
        ticker: req.body?.ticker || 'NVDA'
      });
    });

    // Public read-only endpoints (free)
    testApp.get('/api/v1/agent/leaderboard', (req, res) => {
      res.json({
        status: 'success',
        totalAgentsRanked: 10,
        leaderboard: [
          { rank: 1, handle: 'spark_agent', displayName: 'Gemini Spark Alpha', winRate: 88 }
        ]
      });
    });

    testApp.get('/api/v1/agent/trade-ideas', (req, res) => {
      res.json({
        status: 'success',
        tradeIdeas: [
          { ticker: 'NVDA', action: 'BUY', targetPrice: 160 }
        ]
      });
    });

    testApp.post('/api/v1/agents/register', (req, res) => {
      res.status(201).json({
        status: 'registered',
        agentId: 'agent_test_reg',
        apiKey: 'sb_live_test_key_123',
        trialCredits: 100
      });
    });

    // MCP JSON manifest endpoint
    testApp.get('/.well-known/mcp.json', (req, res) => {
      const functions: Record<string, { description: string; parameters: any }> = {};
      for (const tool of MCP_TOOLS) {
        functions[tool.name] = {
          description: tool.description,
          parameters: tool.inputSchema
        };
      }

      res.json({
        mcpVersion: "1.0",
        name: "stock-bloc",
        version: "2.1.0",
        description: "Stock Bloc MCP server: market data, SEC 13F/filings, quant scores, forecasts for autonomous agents. Paid REST endpoints use x402 (USDC, Base eip155:8453).",
        functions
      });
    });

    // Mount MCP RPC handler
    testApp.post(['/api/mcp/rpc', '/mcp', '/api/v1/mcp'], handleMcpRpcRequest);

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
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearTelemetryState();
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryWalletRegistry.clear();
  });

  // Helper to register an autonomous agent with deterministic credits and scopes
  const registerTestAgent = (creditsBalance = 100) => {
    const agentId = `agent_auto_${crypto.randomBytes(4).toString('hex')}`;
    const publicId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(16).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const rawApiKey = `sb_live_${publicId}_${secret}`;
    const handle = `mcp_agent_${publicId.substring(0, 6)}`;

    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: `MCP Agent ${publicId.substring(0, 4)}`,
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
      paidCreditsBalance: creditsBalance,
      lifetimeSpent: 0
    });

    return { agentId, rawApiKey, handle };
  };

  // Helper to create valid EIP-3009 payment payload
  const createMockPaymentPayload = (payer = '0x111122223333444455556666777788889999aaaa') => {
    const nonce = '0x' + crypto.randomBytes(32).toString('hex');
    return {
      x402Version: 2,
      scheme: 'exact',
      network: BASE_CAIP2,
      payer,
      payload: {
        authorization: {
          from: payer,
          to: TEST_RECIPIENT_ADDRESS,
          value: '10000',
          validAfter: 0,
          validBefore: Math.floor(Date.now() / 1000) + 3600,
          nonce,
          v: 27,
          r: '0x' + crypto.randomBytes(32).toString('hex'),
          s: '0x' + crypto.randomBytes(32).toString('hex')
        }
      }
    };
  };

  // --------------------------------------------------------------------------
  // 1. Paid MCP tool without payment: returns JSON-RPC success envelope with isError: true and PaymentRequired
  // --------------------------------------------------------------------------
  it('1. Paid MCP tool without payment: returns JSON-RPC success envelope, result, isError: true, and machine-readable PaymentRequired', async () => {
    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'unpaid_quote_01',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'NVDA' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.jsonrpc).toBe('2.0');
    expect(res.body.id).toBe('unpaid_quote_01');
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.isError).toBe(true);

    // Verify machine-readable PaymentRequired data in structuredContent and _meta
    const structured = res.body.result.structuredContent;
    expect(structured).toBeDefined();
    expect(structured.x402Version).toBe(2);
    expect(Array.isArray(structured.accepts)).toBe(true);
    expect(structured.accepts[0].scheme).toBe('exact');
    expect(structured.accepts[0].network).toBe(BASE_CAIP2);
    expect(structured.accepts[0].amount).toBe('10000'); // $0.01
    expect(structured.accepts[0].asset).toBe(BASE_USDC_CONTRACT);
    expect(structured.accepts[0].payTo).toBe(TEST_RECIPIENT_ADDRESS);

    // Verify content contains equivalent machine-readable payment information
    expect(Array.isArray(res.body.result.content)).toBe(true);
    expect(res.body.result.content[0].type).toBe('text');
    const parsedContent = JSON.parse(res.body.result.content[0].text);
    expect(parsedContent.x402Version).toBe(2);
    expect(parsedContent.accepts[0].amount).toBe('10000');

    // Verify _meta["x402/payment-required"]
    expect(res.body.result._meta?.['x402/payment-required']).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 2. Paid MCP tool with valid _meta["x402/payment"]: verifies, settles, executes tool, returns _meta["x402/payment-response"]
  // --------------------------------------------------------------------------
  it('2. Paid MCP tool with valid _meta["x402/payment"]: verifies, settles on-chain, executes tool, and returns _meta["x402/payment-response"]', async () => {
    const payerWallet = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
    const paymentPayload = createMockPaymentPayload(payerWallet);
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');

    setFacilitatorVerifyHandler(async (payload) => ({
      isValid: true,
      payer: payerWallet,
      scheme: payload.scheme || 'exact',
      network: payload.network || BASE_CAIP2
    }));

    setFacilitatorSettleHandler(async () => ({
      success: true,
      txHash: mockTxHash,
      transaction: mockTxHash,
      network: BASE_CAIP2,
      payer: payerWallet
    }));

    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'paid_quote_01',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'NVDA' },
          _meta: {
            'x402/payment': paymentPayload
          }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.isError).toBeUndefined();

    // Verify tool execution output
    const quoteData = JSON.parse(res.body.result.content[0].text);
    expect(quoteData.symbol).toBe('NVDA');
    expect(quoteData.price).toBe(138.25);

    // Verify _meta["x402/payment-response"]
    const paymentResponse = res.body.result._meta?.['x402/payment-response'];
    expect(paymentResponse).toBeDefined();
    expect(paymentResponse.txHash || paymentResponse.transaction).toBe(mockTxHash);

    // Verify facilitator verify & settle were called exactly once
    expect(mockFacilitatorVerify).toHaveBeenCalledTimes(1);
    expect(mockFacilitatorSettle).toHaveBeenCalledTimes(1);

    // Verify revenue telemetry was recorded
    const metrics = getMachineRevenueMetrics();
    expect(metrics.paymentSuccessCount).toBe(1);
    expect(metrics.totalUsdcRevenue).toBe(0.01);
    expect(metrics.revenueByEndpoint['market_data'] || metrics.revenueByEndpoint['get_stock_quote']).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 3. Repeat payment from same agent: tracks first_paid_call, second_paid_call, and repeat_payer KPI
  // --------------------------------------------------------------------------
  it('3. Repeat payment from same agent: tracks first_paid_call, second_paid_call, and repeat_payer KPI', async () => {
    const payerWallet = '0x9999888877776666555544443333222211110000';
    const payment1 = createMockPaymentPayload(payerWallet);
    const payment2 = createMockPaymentPayload(payerWallet);
    const tx1 = '0x' + crypto.randomBytes(32).toString('hex');
    const tx2 = '0x' + crypto.randomBytes(32).toString('hex');

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: payerWallet }));

    let callCount = 0;
    setFacilitatorSettleHandler(async () => {
      callCount++;
      return {
        success: true,
        txHash: callCount === 1 ? tx1 : tx2,
        network: BASE_CAIP2,
        payer: payerWallet
      };
    });

    // First paid call ($0.01)
    const res1 = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'call_1',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'NVDA' },
          _meta: { 'x402/payment': payment1 }
        }
      });
    expect(res1.status).toBe(200);
    expect(res1.body.result._meta?.['x402/payment-response']).toBeDefined();

    let metrics = getMachineRevenueMetrics();
    expect(metrics.firstPaidCallsCount).toBe(1);
    expect(metrics.secondPaidCallsCount).toBe(0);
    expect(metrics.repeatPayersCount).toBe(0);

    // Second paid call from same wallet ($0.10)
    const res2 = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'call_2',
        method: 'tools/call',
        params: {
          name: 'search_13f_whale_filings',
          arguments: { manager: 'Berkshire' },
          _meta: { 'x402/payment': payment2 }
        }
      });
    expect(res2.status).toBe(200);
    expect(res2.body.result._meta?.['x402/payment-response']).toBeDefined();

    metrics = getMachineRevenueMetrics();
    expect(metrics.firstPaidCallsCount).toBe(1);
    expect(metrics.secondPaidCallsCount).toBe(1);
    expect(metrics.repeatPayersCount).toBe(1);
    expect(metrics.primaryKpi.value).toBe(1); // 1 repeat paying agent
    expect(metrics.totalUsdcRevenue).toBe(0.11);
  });

  // --------------------------------------------------------------------------
  // 4. Idempotency & Replay Protection: identical payment payload returns original result without re-settling
  // --------------------------------------------------------------------------
  it('4. Replay protection: identical payment payload returns original result without settling on-chain again', async () => {
    const payerWallet = '0x1234123412341234123412341234123412341234';
    const paymentPayload = createMockPaymentPayload(payerWallet);
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: payerWallet }));
    setFacilitatorSettleHandler(async () => ({ success: true, txHash, network: BASE_CAIP2, payer: payerWallet }));

    // Call 1: settled on-chain
    const res1 = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'call_replay_1',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'AAPL' },
          _meta: { 'x402/payment': paymentPayload }
        }
      });
    expect(res1.status).toBe(200);
    expect(mockFacilitatorSettle).toHaveBeenCalledTimes(1);

    // Call 2 with identical payload (replay)
    const res2 = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'call_replay_2',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'AAPL' },
          _meta: { 'x402/payment': paymentPayload }
        }
      });
    expect(res2.status).toBe(200);
    expect(res2.body.result).toBeDefined();
    // Settle was NOT called a second time
    expect(mockFacilitatorSettle).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // 5. Invalid payment payload: returns structured error in result
  // --------------------------------------------------------------------------
  it('5. Invalid payment payload: returns structured error in result with isError: true', async () => {
    setFacilitatorVerifyHandler(async () => {
      throw new Error('execution reverted: invalid EIP-3009 signature');
    });

    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'invalid_pay_01',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'NVDA' },
          _meta: {
            'x402/payment': { invalid: 'payload' }
          }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.isError).toBe(true);
    expect(res.body.result._meta?.['x402/payment-error'] || res.body.result._meta?.['x402/payment-required']).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 6. Exhausted trial credits (0 remaining) transitions seamlessly to x402 PaymentRequired
  // --------------------------------------------------------------------------
  it('6. Exhausted trial credits: returns native MCP PaymentRequired for seamless transition to x402', async () => {
    const { rawApiKey } = registerTestAgent(0); // 0 credits

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'exhausted_trial_01',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'AAPL' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.isError).toBe(true);
    expect(res.body.result.structuredContent.status).toBe('payment_required');
    expect(res.body.result.structuredContent.accepts[0].amount).toBe('10000');
    expect(res.body.result._meta?.['x402/payment-required']).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 7. Valid trial credits (100 remaining): debits credits and executes tool
  // --------------------------------------------------------------------------
  it('7. Valid trial credits: debits credits and executes tool successfully', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100);

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'credit_quote_01',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'NVDA' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.isError).toBeUndefined();

    const quoteData = JSON.parse(res.body.result.content[0].text);
    expect(quoteData.symbol).toBe('NVDA');

    // 100 - 1 = 99 credits
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(99);
  });

  // --------------------------------------------------------------------------
  // 8. All 6 paid MCP tools have matching pricing with REST catalog
  // --------------------------------------------------------------------------
  it('8. All 6 paid MCP tools have exact matching pricing with REST catalog', () => {
    expect(MCP_TOOL_PRICING.get_stock_quote.priceUsd).toBe(PRICED_ENDPOINTS.market_data.priceUsd);
    expect(MCP_TOOL_PRICING.get_stock_quote.atomicAmount).toBe(PRICED_ENDPOINTS.market_data.atomicAmount);

    expect(MCP_TOOL_PRICING.search_13f_whale_filings.priceUsd).toBe(PRICED_ENDPOINTS.sec_13f_intel.priceUsd);
    expect(MCP_TOOL_PRICING.search_13f_whale_filings.atomicAmount).toBe(PRICED_ENDPOINTS.sec_13f_intel.atomicAmount);

    expect(MCP_TOOL_PRICING.analyze_sec_filing.priceUsd).toBe(PRICED_ENDPOINTS.sec_job.priceUsd);
    expect(MCP_TOOL_PRICING.analyze_sec_filing.atomicAmount).toBe(PRICED_ENDPOINTS.sec_job.atomicAmount);

    expect(MCP_TOOL_PRICING.evaluate_tsunami_strategy.priceUsd).toBe(PRICED_ENDPOINTS.strategy_eval.priceUsd);
    expect(MCP_TOOL_PRICING.evaluate_tsunami_strategy.atomicAmount).toBe(PRICED_ENDPOINTS.strategy_eval.atomicAmount);

    expect(MCP_TOOL_PRICING.run_quant_simulation.priceUsd).toBe(PRICED_ENDPOINTS.strategy_eval.priceUsd);
    expect(MCP_TOOL_PRICING.run_quant_simulation.atomicAmount).toBe(PRICED_ENDPOINTS.strategy_eval.atomicAmount);

    expect(MCP_TOOL_PRICING.submit_agent_trade_idea.priceUsd).toBe(PRICED_ENDPOINTS.strategy_eval.priceUsd);
    expect(MCP_TOOL_PRICING.submit_agent_trade_idea.atomicAmount).toBe(PRICED_ENDPOINTS.strategy_eval.atomicAmount);
  });

  // --------------------------------------------------------------------------
  // 9. Free tools execute without payment requirement or credentials
  // --------------------------------------------------------------------------
  it('9. Free tools execute without requiring payment or credentials', async () => {
    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'free_tool_01',
        method: 'tools/call',
        params: {
          name: 'get_agent_leaderboard',
          arguments: { limit: 5 }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.isError).toBeUndefined();
    const data = JSON.parse(res.body.result.content[0].text);
    expect(data.summary).toContain('Stock Bloc AI agents');
  });

  // --------------------------------------------------------------------------
  // 10. No accidental Stripe or credit pack path in MCP
  // --------------------------------------------------------------------------
  it('10. No accidental Stripe or credit pack paths exist in MCP', async () => {
    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'tools_list_test',
        method: 'tools/list'
      });

    const toolNames = res.body.result.tools.map((t: any) => t.name);
    expect(toolNames.some((n: string) => n.includes('stripe') || n.includes('credit_pack') || n.includes('checkout'))).toBe(false);
  });
});
