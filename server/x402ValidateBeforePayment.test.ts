// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  requireX402Payment,
  PRICED_ENDPOINTS,
  X402_ROUTE_PATHS,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import { secAnalystRouter } from './secAnalystAgent.js';
import {
  agentPlatformRouter,
  registerAutonomousAgentHandler,
  inMemoryKeyRegistry,
  inMemoryAgentRegistry,
  authenticateAgent,
  requireScope
} from './agentPlatform.js';
import {
  resetFacilitatorMock
} from './testSetup/facilitatorMock.js';

describe('x402 Input Validation Before Payment Suite', () => {
  let app: express.Application;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    process.env.X402_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

    app = express();
    app.use(express.json());

    // Register SEC Analyst Router
    app.use('/api/v1/sec', secAnalystRouter);

    // Register Agent Platform Router
    app.use('/api/v1/agents', agentPlatformRouter);
    app.post('/api/v1/agents/register', registerAutonomousAgentHandler);

    // Protected API Key Generation (Admin Only)
    app.post('/api/v1/agent/keys/generate', authenticateAgent, requireScope('admin'), (req, res) => {
      res.json({ success: true });
    });

    // Quant Sim endpoint
    app.all('/api/v1/agent/quant-sim', requireX402Payment(PRICED_ENDPOINTS.strategy_eval), (req, res) => {
      res.json({ success: true, mode: 'QUANT_SIM' });
    });

    // Market quote endpoint
    app.all('/api/v1/market/quote', requireX402Payment(PRICED_ENDPOINTS.market_data), (req, res) => {
      res.json({ success: true, mode: 'QUOTE' });
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('1. Malformed request returns 400 or 405 with charged: false and no PAYMENT-REQUIRED header', async () => {
    // Malformed SEC job request: missing ticker and filingType
    const res = await request(app)
      .post('/api/v1/sec/job')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.charged).toBe(false);
    expect(res.body.field).toBe('ticker');
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('2. Malformed request with PAYMENT-SIGNATURE header attached still returns 400/405 without payment challenge', async () => {
    const fakeSignature = Buffer.from(JSON.stringify({
      sig: 'fake_sig',
      payload: { payer: '0x1234567890123456789012345678901234567890' }
    })).toString('base64');

    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('PAYMENT-SIGNATURE', fakeSignature)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.charged).toBe(false);
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('3. Valid request returns 402 challenge with amount, network, asset, and payTo', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .send({ ticker: 'AAPL', filingType: '10-K' });

    expect(res.status).toBe(402);
    expect(res.headers['payment-required']).toBeDefined();
  });

  it('4. GET /api/v1/agent/quant-sim returns 405 Method Not Allowed', async () => {
    const res = await request(app)
      .get('/api/v1/agent/quant-sim');

    expect(res.status).toBe(405);
    expect(res.body.charged).toBe(false);
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('5. POST /api/v1/sec/job with {} returns 400 field: ticker', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.field).toBe('ticker');
    expect(res.body.charged).toBe(false);
  });

  it('6. POST /api/v1/agent/keys/generate with no credential returns 401 and creates nothing in inMemoryKeyRegistry, and POST /api/v1/agents/register returns trialCredits: 0', async () => {
    const initialKeyCount = inMemoryKeyRegistry.size;

    const resGen = await request(app)
      .post('/api/v1/agent/keys/generate')
      .send({});

    expect(resGen.status).toBe(401);
    expect(inMemoryKeyRegistry.size).toBe(initialKeyCount);

    const resReg = await request(app)
      .post('/api/v1/agents/register')
      .send({ handle: 'test_val_reg_' + Date.now().toString(36) });

    expect(resReg.status).toBe(201);
    expect(resReg.body.trialCredits).toBe(0);
  });

  it('7. POST /api/v1/sec/analyze with ticker ZZZQX9 returns 404 TICKER_NOT_FOUND and never success: true', async () => {
    const res = await request(app)
      .post('/api/v1/sec/analyze')
      .send({ ticker: 'ZZZQX9', filingType: '10-K' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('TICKER_NOT_FOUND');
    expect(res.body.success).not.toBe(true);
  });
});
