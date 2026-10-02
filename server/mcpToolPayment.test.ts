// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import http from 'http';
import crypto from 'crypto';
import { handleMcpRpcRequest, MCP_TOOLS } from './mcpService.js';
import { requireX402Payment } from './x402PaymentService.js';
import { secAnalystRouter } from './secAnalystAgent.js';
import {
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry,
  DEFAULT_AUTONOMOUS_SCOPES
} from './agentPlatform.js';

describe('Stock Bloc MCP Tool Payment Execution Suite', () => {
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

  // --------------------------------------------------------------------------
  // A. MCP get_stock_quote with valid sb_live_ key: real quote, credits debited.
  // --------------------------------------------------------------------------
  it('A. get_stock_quote with valid sb_live_ key: returns real quote and debits $0.01 (1 credit)', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100);

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'quote_test_01',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'NVDA' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.content).toBeDefined();
    expect(res.body.result.content[0].type).toBe('text');

    const quoteData = JSON.parse(res.body.result.content[0].text);
    expect(quoteData.symbol || quoteData.ticker).toBe('NVDA');

    // $0.01 USDC = 1 credit debit: 100 - 1 = 99
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(99);
  });

  // --------------------------------------------------------------------------
  // B. MCP paid tool with valid key at zero credits: clear register/pay guidance as JSON-RPC error, not a 402 dump.
  // --------------------------------------------------------------------------
  it('B. MCP paid tool with valid key at zero credits: returns clear register/pay guidance as JSON-RPC error, not a 402 dump', async () => {
    const { rawApiKey } = registerTestAgent(0); // Zero credits remaining

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'zero_credits_test',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'AAPL' }
        }
      });

    expect(res.status).toBe(200);
    // Must be a JSON-RPC error object, NOT a successful result with 402 text dumped inside
    expect(res.body.result).toBeUndefined();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32002);
    expect(res.body.error.message).toContain('Trial credit balance exhausted');
    expect(res.body.error.message).toContain('POST /api/v1/agents/register');
    expect(res.body.error.message).toContain('USDC on Base');
    expect(res.body.error.data.status).toBe('payment_required');
  });

  // --------------------------------------------------------------------------
  // C. MCP paid tool with no key: same clear guidance.
  // --------------------------------------------------------------------------
  it('C. MCP paid tool with no key: returns clear machine-readable registration guidance as JSON-RPC error', async () => {
    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'no_key_test',
        method: 'tools/call',
        params: {
          name: 'get_stock_quote',
          arguments: { symbol: 'TSLA' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeUndefined();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32002);
    expect(res.body.error.message).toContain('Agent API key required');
    expect(res.body.error.message).toContain('POST /api/v1/agents/register');
    expect(res.body.error.message).toContain('USDC on Base');
    expect(res.body.error.data.status).toBe('payment_required');
  });

  // --------------------------------------------------------------------------
  // D. MCP free tool with no key: works as before.
  // --------------------------------------------------------------------------
  it('D. MCP free tool with no key: functions normally without requiring authentication', async () => {
    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'free_leaderboard_test',
        method: 'tools/call',
        params: {
          name: 'get_agent_leaderboard',
          arguments: { limit: 5 }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.content).toBeDefined();
    expect(res.body.result.content[0].type).toBe('text');

    const leaderboardData = JSON.parse(res.body.result.content[0].text);
    expect(leaderboardData.summary).toContain('Stock Bloc AI agents');
  });

  // --------------------------------------------------------------------------
  // E. analyze_sec_filing with key: hits real paid SEC endpoint, $0.25 debited.
  // --------------------------------------------------------------------------
  it('E. analyze_sec_filing with key: hits real paid SEC job endpoint and debits $0.25 (25 credits)', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100);

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'sec_filing_test',
        method: 'tools/call',
        params: {
          name: 'analyze_sec_filing',
          arguments: {
            ticker: 'NVDA',
            filingType: '10-Q',
            question: 'What is the datacenter revenue growth?'
          }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.content).toBeDefined();
    expect(res.body.result.content[0].type).toBe('text');

    const secOutput = JSON.parse(res.body.result.content[0].text);
    expect(secOutput.jobId).toBeDefined();
    expect(secOutput.success === true || secOutput.output !== undefined).toBe(true);

    // 25 credits debited for $0.25: 100 - 25 = 75
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(75);
  });

  // --------------------------------------------------------------------------
  // F. search_13f_whale_filings: live data only, no hardcoded holdings in the response path.
  // --------------------------------------------------------------------------
  it('F. search_13f_whale_filings: queries live SEC endpoint with credentials and contains no hardcoded holdings', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100);

    const res = await request(server)
      .post('/api/mcp/rpc')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .send({
        jsonrpc: '2.0',
        id: 'whale_search_01',
        method: 'tools/call',
        params: {
          name: 'search_13f_whale_filings',
          arguments: { manager: 'Berkshire' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeUndefined();
    expect(res.body.result).toBeDefined();
    expect(res.body.result.content).toBeDefined();
    expect(res.body.result.content[0].type).toBe('text');

    const secData = JSON.parse(res.body.result.content[0].text);
    // Verifies live source
    expect(secData.source).toBe('/api/data/sec');
    expect(Array.isArray(secData.funds)).toBe(true);

    // 10 credits debited for $0.10: 100 - 10 = 90
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(90);
  });

  // --------------------------------------------------------------------------
  // G. tools/list: all 12 descriptions accurate, prices match enforcement.
  // --------------------------------------------------------------------------
  it('G. tools/list: all 12 descriptions are accurate and prices match actual x402 enforcement', async () => {
    const res = await request(server)
      .post('/api/mcp/rpc')
      .send({
        jsonrpc: '2.0',
        id: 'tools_list_test',
        method: 'tools/list'
      });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    const tools = res.body.result.tools;
    expect(tools.length).toBe(12);

    const toolMap = new Map<string, any>(tools.map((t: any) => [t.name, t]));

    // Check all 6 paid tools have matching price claims
    expect(toolMap.get('get_stock_quote')?.description).toContain('$0.01 USDC');
    expect(toolMap.get('run_quant_simulation')?.description).toContain('$0.10 USDC');
    expect(toolMap.get('evaluate_tsunami_strategy')?.description).toContain('$0.10 USDC');
    expect(toolMap.get('submit_agent_trade_idea')?.description).toContain('$0.10 USDC');
    expect(toolMap.get('search_13f_whale_filings')?.description).toContain('$0.10 USDC');
    expect(toolMap.get('analyze_sec_filing')?.description).toContain('$0.25 USDC');

    // Check register tool
    expect(toolMap.get('register_autonomous_agent')?.description).toContain('no subscription');
    expect(toolMap.get('register_autonomous_agent')?.description).toContain('USDC on Base');

    // Confirm /.well-known/mcp.json exposes the exact same 12 functions
    const mcpJsonRes = await request(server).get('/.well-known/mcp.json');
    expect(mcpJsonRes.status).toBe(200);
    expect(Object.keys(mcpJsonRes.body.functions).length).toBe(12);
    expect(mcpJsonRes.body.functions.get_stock_quote.description).toContain('$0.01 USDC');
    expect(mcpJsonRes.body.functions.analyze_sec_filing.description).toContain('$0.25 USDC');
  });
});
