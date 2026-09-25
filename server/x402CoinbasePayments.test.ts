import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  requireX402Payment,
  PRICED_ENDPOINTS,
  BASE_CAIP2,
  BASE_USDC_CONTRACT,
  getX402RecipientAddress
} from './x402PaymentService.js';
import { decodePaymentRequiredHeader } from '@x402/core/http';

describe('Coinbase CDP x402 Real Payment Protocol Integration', () => {
  const originalEnv = { ...process.env };
  const TEST_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

  beforeEach(() => {
    delete process.env.X402_RECIPIENT_ADDRESS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // Helper to construct a test Express application with x402 middleware
  const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Public endpoint: registration
    app.post('/api/v1/agents/register', (req, res) => {
      res.status(201).json({ status: 'registered', apiKey: 'sb_live_test' });
    });

    // Mount x402 payment protection
    app.use(requireX402Payment());

    // Priced endpoints
    app.get('/api/data/market', (req, res) => {
      res.json({ status: 'success', feed: 'market', watchlist: [{ symbol: 'NVDA', price: 138.25 }] });
    });

    app.get('/api/v1/intelligence/sb-score', (req, res) => {
      res.json({ status: 'success', ticker: 'NVDA', sbScore: 88, signalLabel: 'STRONG BUY' });
    });

    app.get('/api/data/sec', (req, res) => {
      res.json({ status: 'success', filings: [{ form: '10-K', company: 'NVIDIA' }] });
    });

    app.post('/api/v1/sec/job', (req, res) => {
      res.json({ status: 'success', jobId: 'sec_job_001', auditPassed: true });
    });

    app.post('/api/v1/intelligence/research', (req, res) => {
      res.json({ status: 'success', researchId: 'res_001', published: true });
    });

    app.post('/api/v1/intelligence/forecasts', (req, res) => {
      res.json({ status: 'success', forecastId: 'fc_001', brierTarget: 0.12 });
    });

    app.post('/api/v1/agent/strategy/evaluate', (req, res) => {
      res.json({ status: 'success', annualizedReturn: 0.42, sharpeRatio: 2.5 });
    });

    return app;
  };

  describe('Configuration Safety: X402_RECIPIENT_ADDRESS Enforcement', () => {
    it('returns a clear configuration error on priced endpoints when X402_RECIPIENT_ADDRESS is not set', async () => {
      delete process.env.X402_RECIPIENT_ADDRESS;
      expect(getX402RecipientAddress()).toBeNull();

      const app = createTestApp();

      // Test across multiple priced endpoint categories
      const resSb = await request(app).get('/api/v1/intelligence/sb-score');
      expect(resSb.status).toBe(500);
      expect(resSb.body.code).toBe('CONFIGURATION_ERROR');
      expect(resSb.body.message).toContain('X402_RECIPIENT_ADDRESS');

      const resMarket = await request(app).get('/api/data/market');
      expect(resMarket.status).toBe(500);
      expect(resMarket.body.code).toBe('CONFIGURATION_ERROR');

      const resSec = await request(app).get('/api/data/sec');
      expect(resSec.status).toBe(500);
      expect(resSec.body.code).toBe('CONFIGURATION_ERROR');
    });

    it('never emits mock lightning invoices or fake preimages when unconfigured', async () => {
      delete process.env.X402_RECIPIENT_ADDRESS;
      const app = createTestApp();

      const res = await request(app).get('/api/v1/intelligence/sb-score');
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('mock_lightning_invoice');
      expect(bodyStr).not.toContain('mock_');
      expect(bodyStr).not.toContain('preimage');
    });

    it('allows public unpriced endpoints (registration) even if X402_RECIPIENT_ADDRESS is not set', async () => {
      delete process.env.X402_RECIPIENT_ADDRESS;
      const app = createTestApp();

      const res = await request(app)
        .post('/api/v1/agents/register')
        .send({ handle: 'test_bot', displayName: 'Test Bot' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('registered');
    });
  });

  describe('Real x402 HTTP 402 Challenge & Payment Requirements', () => {
    beforeEach(() => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
    });

    it('returns HTTP 402 with real x402 Base USDC requirements for Market Data ($0.01)', async () => {
      const app = createTestApp();
      const res = await request(app).get('/api/data/market');

      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();

      // Verify decoded PAYMENT-REQUIRED header
      const headerObj = decodePaymentRequiredHeader(res.headers['payment-required']);
      expect(headerObj.x402Version).toBe(2);
      expect(headerObj.accepts[0].network).toBe(BASE_CAIP2); // eip155:8453
      expect(headerObj.accepts[0].asset).toBe(BASE_USDC_CONTRACT);
      expect(headerObj.accepts[0].amount).toBe('10000'); // $0.01
      expect(headerObj.accepts[0].payTo).toBe(TEST_RECIPIENT_ADDRESS);

      // Verify response body
      expect(res.body.status).toBe('payment_required');
      expect(res.body.paymentDetails.asset).toBe('USDC');
      expect(res.body.paymentDetails.network).toBe('Base');
      expect(res.body.paymentDetails.priceUsd).toBe(0.01);
      expect(res.body.paymentDetails.recipientAddress).toBe(TEST_RECIPIENT_ADDRESS);
    });

    it('returns HTTP 402 with real x402 Base USDC requirements for SB Score ($0.05)', async () => {
      const app = createTestApp();
      const res = await request(app).get('/api/v1/intelligence/sb-score');

      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();

      const headerObj = decodePaymentRequiredHeader(res.headers['payment-required']);
      expect(headerObj.accepts[0].amount).toBe('50000'); // $0.05
      expect(headerObj.accepts[0].network).toBe(BASE_CAIP2);
      expect(headerObj.accepts[0].asset).toBe(BASE_USDC_CONTRACT);
      expect(headerObj.accepts[0].payTo).toBe(TEST_RECIPIENT_ADDRESS);
    });

    it('returns HTTP 402 with real x402 Base USDC requirements for SEC 13F Intel ($0.10)', async () => {
      const app = createTestApp();
      const res = await request(app).get('/api/data/sec');

      expect(res.status).toBe(402);
      const headerObj = decodePaymentRequiredHeader(res.headers['payment-required']);
      expect(headerObj.accepts[0].amount).toBe('100000'); // $0.10
      expect(headerObj.accepts[0].asset).toBe(BASE_USDC_CONTRACT);
    });

    it('returns HTTP 402 with real x402 Base USDC requirements for Deep SEC Job ($0.25)', async () => {
      const app = createTestApp();
      const res = await request(app).post('/api/v1/sec/job').send({ ticker: 'NVDA' });

      expect(res.status).toBe(402);
      const headerObj = decodePaymentRequiredHeader(res.headers['payment-required']);
      expect(headerObj.accepts[0].amount).toBe('250000'); // $0.25
      expect(headerObj.accepts[0].network).toBe(BASE_CAIP2);
    });

    it('returns HTTP 402 with real x402 Base USDC requirements for Research ($0.10) & Forecast ($0.05)', async () => {
      const app = createTestApp();

      const resResearch = await request(app).post('/api/v1/intelligence/research').send({ title: 'AI Infrastructure' });
      expect(resResearch.status).toBe(402);
      const resObj1 = decodePaymentRequiredHeader(resResearch.headers['payment-required']);
      expect(resObj1.accepts[0].amount).toBe('100000'); // $0.10

      const resForecast = await request(app).post('/api/v1/intelligence/forecasts').send({ symbol: 'NVDA', targetPrice: 160 });
      expect(resForecast.status).toBe(402);
      const resObj2 = decodePaymentRequiredHeader(resForecast.headers['payment-required']);
      expect(resObj2.accepts[0].amount).toBe('50000'); // $0.05
    });
  });

  describe('Payment Verification & Settlement Integrity', () => {
    beforeEach(() => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
    });

    it('rejects fake or fabricated payment signatures through facilitator and never serves paid content', async () => {
      const app = createTestApp();

      const fakePaymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: {
            from: '0xFakeBuyer',
            to: TEST_RECIPIENT_ADDRESS,
            value: '50000',
            nonce: '0xfake',
            v: 27,
            r: '0xfake',
            s: '0xfake'
          }
        })
      ).toString('base64');

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('PAYMENT-SIGNATURE', fakePaymentHeader);

      // Must be rejected with 402
      expect(res.status).toBe(402);
      expect(res.body.status).not.toBe('success');
      expect(res.body).not.toHaveProperty('sbScore');
    });
  });

  describe('Server API Endpoints & Discovery Verification', () => {
    it('verifies that old mock endpoints /api/v1/web3/x402/quote and settle are completely removed', async () => {
      const { web3DotBtcRouter } = await import('./web3DotBtcApi.js');
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/v1/web3', web3DotBtcRouter);

      const resQuote = await request(testApp).post('/api/v1/web3/x402/quote').send({ asset: 'BTC_LIGHTNING' });
      expect(resQuote.status).toBe(404);

      const resSettle = await request(testApp).post('/api/v1/web3/x402/settle').send({ invoiceId: '123' });
      expect(resSettle.status).toBe(404);
    });

    it('verifies manifest.json contains x402 payment details for priced endpoints', async () => {
      const fs = await import('fs');
      const manifest = JSON.parse(fs.readFileSync('public/agents/manifest.json', 'utf8'));

      expect(manifest.paymentProtocols).toBeDefined();
      expect(manifest.paymentProtocols.x402.standard).toBe('x402 Payment Protocol v2');
      expect(manifest.paymentProtocols.x402.network).toBe('Base');
      expect(manifest.paymentProtocols.x402.asset).toBe('USDC');

      // Verify priced endpoints have x402 details
      expect(manifest.endpoints.marketData.x402.priceDisplay).toBe('$0.01 USDC');
      expect(manifest.endpoints.sbScore.x402.priceDisplay).toBe('$0.05 USDC');
      expect(manifest.endpoints.sec13fIntel.x402.priceDisplay).toBe('$0.10 USDC');
      expect(manifest.endpoints.secJob.x402.priceDisplay).toBe('$0.25 USDC');
      expect(manifest.endpoints.publishResearch.x402.priceDisplay).toBe('$0.10 USDC');
      expect(manifest.endpoints.publishForecast.x402.priceDisplay).toBe('$0.05 USDC');
      expect(manifest.endpoints.evaluateStrategy.x402.priceDisplay).toBe('$0.10 USDC');
    });

    it('verifies skill.md contains Paying with x402 section and full flow curl examples', async () => {
      const fs = await import('fs');
      const skillMd = fs.readFileSync('public/agents/skill.md', 'utf8');

      expect(skillMd).toContain('## Paying with x402');
      expect(skillMd).toContain('Coinbase Developer Platform');
      expect(skillMd).toContain('USDC on Base');
      expect(skillMd).toContain('PAYMENT-REQUIRED');
      expect(skillMd).toContain('PAYMENT-SIGNATURE');
      expect(skillMd).toContain('curl -i -X GET');
    });
  });

  describe('Verified Purchaser Identity & Pro Subscription Entitlement Security', () => {
    const SUBSCRIBER_EMAIL = 'pro.subscriber@example.com';
    const TEST_ADMIN_EMAIL = 'admin.operator@stockbloc.ai';
    const createMockJwt = (email: string, uid = 'usr_' + Math.random().toString(36).slice(2)) => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ uid, sub: uid, email })).toString('base64');
      return `${header}.${payload}.sig`;
    };

    beforeEach(async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      delete process.env.PRO_ADMIN_EMAILS;
      const { db } = await import('./firebaseAdmin.js');
      // Set active Pro subscription for legitimate subscriber
      await db.collection('pro_subscriptions').doc(SUBSCRIBER_EMAIL).set({
        email: SUBSCRIBER_EMAIL,
        status: 'active'
      });
      // Ensure inactive/no subscription for other test emails
      await db.collection('pro_subscriptions').doc('developer@stockbloc.ai').set({
        email: 'developer@stockbloc.ai',
        status: 'inactive'
      });
      await db.collection('pro_subscriptions').doc('realestatejcarter@gmail.com').set({
        email: 'realestatejcarter@gmail.com',
        status: 'inactive'
      });
      await db.collection('pro_subscriptions').doc('attacker@evil.com').set({
        email: 'attacker@evil.com',
        status: 'inactive'
      });
    });

    it('spoofed x-purchaser-email header carrying a real subscriber email must NOT skip x402 (expect 402)', async () => {
      const app = createTestApp();

      // Attempt spoof via x-purchaser-email header
      const resHeader = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('x-purchaser-email', SUBSCRIBER_EMAIL);

      expect(resHeader.status).toBe(402);
      expect(resHeader.body.status).toBe('payment_required');

      // Attempt spoof via query param ?email=
      const resQuery = await request(app)
        .get(`/api/v1/intelligence/sb-score?email=${encodeURIComponent(SUBSCRIBER_EMAIL)}`);

      expect(resQuery.status).toBe(402);
      expect(resQuery.body.status).toBe('payment_required');

      // Attempt spoof via body.email
      const resBody = await request(app)
        .post('/api/v1/sec/job')
        .send({ ticker: 'NVDA', email: SUBSCRIBER_EMAIL });

      expect(resBody.status).toBe(402);
      expect(resBody.body.status).toBe('payment_required');
    });

    it('verified JWT for an active subscriber must skip x402 payment challenge', async () => {
      const app = createTestApp();
      const subscriberJwt = createMockJwt(SUBSCRIBER_EMAIL, 'uid_subscriber_01');

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${subscriberJwt}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.ticker).toBe('NVDA');
      expect(res.body.sbScore).toBe(88);
    });

    it('verified API key linked to registered agent with verified email on file skips x402', async () => {
      const { inMemoryKeyRegistry, inMemoryAgentRegistry } = await import('./agentPlatform.js');
      const crypto = await import('crypto');

      const publicId = crypto.randomBytes(8).toString('hex');
      const secret = crypto.randomBytes(24).toString('hex');
      const rawKey = `sb_live_${publicId}_${secret}`;
      const keyHash = crypto.createHash('sha256').update(secret).digest('hex');
      const agentId = 'agent_sub_' + publicId;

      inMemoryKeyRegistry.set(publicId, {
        keyId: publicId,
        agentId,
        keyHash,
        scopes: ['services:read', 'jobs:read'],
        status: 'active',
        createdAt: new Date().toISOString()
      } as any);

      inMemoryAgentRegistry.set(agentId, {
        agentId,
        handle: 'subscriber_bot',
        displayName: 'Subscriber Bot',
        email: SUBSCRIBER_EMAIL,
        status: 'active'
      });

      const app = createTestApp();

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('x-agent-key', rawKey);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.sbScore).toBe(88);
    });

    it('the two formerly hard-coded emails must NOT bypass with PRO_ADMIN_EMAILS unset', async () => {
      delete process.env.PRO_ADMIN_EMAILS;
      const app = createTestApp();

      const devJwt = createMockJwt('developer@stockbloc.ai', 'uid_dev');
      const resDev = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${devJwt}`);

      expect(resDev.status).toBe(402);
      expect(resDev.body.status).toBe('payment_required');

      const carterJwt = createMockJwt('realestatejcarter@gmail.com', 'uid_carter');
      const resCarter = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${carterJwt}`);

      expect(resCarter.status).toBe(402);
      expect(resCarter.body.status).toBe('payment_required');
    });

    it('allows admin bypass only when email is explicitly present in PRO_ADMIN_EMAILS', async () => {
      process.env.PRO_ADMIN_EMAILS = `developer@stockbloc.ai, ${TEST_ADMIN_EMAIL}`;
      const app = createTestApp();

      // developer@stockbloc.ai is in PRO_ADMIN_EMAILS -> allowed
      const devJwt = createMockJwt('developer@stockbloc.ai', 'uid_dev');
      const resDev = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${devJwt}`);

      expect(resDev.status).toBe(200);
      expect(resDev.body.status).toBe('success');

      // admin.operator@stockbloc.ai is in PRO_ADMIN_EMAILS -> allowed
      const adminJwt = createMockJwt(TEST_ADMIN_EMAIL, 'uid_admin');
      const resAdmin = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${adminJwt}`);

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.status).toBe('success');

      // realestatejcarter@gmail.com is NOT in PRO_ADMIN_EMAILS -> 402
      const carterJwt = createMockJwt('realestatejcarter@gmail.com', 'uid_carter');
      const resCarter = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${carterJwt}`);

      expect(resCarter.status).toBe(402);
      expect(resCarter.body.status).toBe('payment_required');
    });
  });
});
