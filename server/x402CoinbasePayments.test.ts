import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import {
  requireX402Payment,
  PRICED_ENDPOINTS,
  BASE_CAIP2,
  BASE_USDC_CONTRACT,
  getX402RecipientAddress,
  X402_ROUTE_PATHS,
  BAZAAR_DISCOVERY_EXTENSIONS,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import { decodePaymentRequiredHeader } from '@x402/core/http';
import { validateDiscoveryExtension } from '@x402/extensions';
import {
  resetFacilitatorMock,
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler
} from './testSetup/facilitatorMock.js';
import {
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry
} from './agentPlatform.js';

describe('Coinbase CDP x402 Real Payment Protocol Integration', () => {
  const originalEnv = { ...process.env };
  const TEST_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

  beforeEach(() => {
    delete process.env.X402_RECIPIENT_ADDRESS;
    resetFacilitatorMock();
    clearX402SettlementRegistry();
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

    app.get('/api/v1/intelligence/earnings-pack', (req, res) => {
      res.json({ status: 'success', ticker: 'NVDA', bundle: 'earnings_pack' });
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

    it('returns HTTP 402 with real x402 Base USDC requirements for Earnings Prep Pack ($0.35)', async () => {
      const app = createTestApp();
      const res = await request(app).get('/api/v1/intelligence/earnings-pack?ticker=NVDA');

      expect(res.status).toBe(402);
      const headerObj = decodePaymentRequiredHeader(res.headers['payment-required']);
      expect(headerObj.accepts[0].amount).toBe('350000'); // $0.35
      expect(headerObj.accepts[0].asset).toBe(BASE_USDC_CONTRACT);
      expect(headerObj.accepts[0].network).toBe(BASE_CAIP2);
      expect(headerObj.accepts[0].extra.priceUsd).toBe('$0.35');
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

    it('rejects settlement by default even if verification passes, unless test explicitly opts into successful settlement', async () => {
      const app = createTestApp();
      setFacilitatorVerifyHandler(async () => ({ isValid: true }));
      // settleHandler remains default (rejects)

      const paymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: { from: '0xBuyer', to: TEST_RECIPIENT_ADDRESS, value: '50000' }
        })
      ).toString('base64');

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('PAYMENT-SIGNATURE', paymentHeader);

      expect(res.status).toBe(402);
      expect(res.body.status).toBe('payment_rejected');
      expect(res.body).not.toHaveProperty('sbScore');
    });

    it('allows per-test override to simulate a complete verified and settled transport decision', async () => {
      const app = createTestApp();
      setFacilitatorVerifyHandler(async () => ({ isValid: true }));
      setFacilitatorSettleHandler(async () => ({
        success: true,
        payer: '0xBuyer',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }));

      const paymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: { from: '0xBuyer', to: TEST_RECIPIENT_ADDRESS, value: '50000' }
        })
      ).toString('base64');

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('PAYMENT-SIGNATURE', paymentHeader);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.sbScore).toBe(88);
      expect(res.headers['payment-response']).toBeDefined();
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
      expect(manifest.endpoints.earningsPack.x402.priceDisplay).toBe('$0.35 USDC');
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
      expect(skillMd).toContain('## Earnings Prep Pack Bundle');
      expect(skillMd).toContain('$0.35 USDC');
    });
  });

  describe('Free Human Browser UI Access & Programmatic Enforcement Security', () => {
    beforeEach(async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
    });

    it('browser-style request with sec-fetch-site same-origin returns 200 with no key on free UI paths', async () => {
      const app = createTestApp();

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('sec-fetch-site', 'same-origin');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.sbScore).toBe(88);
    });

    it('browser-style request with matching Referer header returns 200 with no key on free UI paths', async () => {
      const app = createTestApp();

      const res = await request(app)
        .get('/api/data/market')
        .set('referer', 'https://stockbloc.ai.studio/')
        .set('host', 'stockbloc.ai.studio');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.watchlist).toBeDefined();
    });

    it('plain programmatic request with no browser headers to priced endpoint returns 402 with x402 challenge', async () => {
      const app = createTestApp();

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score');

      expect(res.status).toBe(402);
      expect(res.body.status).toBe('payment_required');
      expect(res.body.accepts).toBeDefined();
      expect(res.headers['payment-required']).toBeDefined();
    });

    it('spoofed client headers (e.g. x-stockbloc-client, x-purchaser-email) must NOT skip x402 on programmatic calls', async () => {
      const app = createTestApp();

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('x-stockbloc-client', 'web-ui')
        .set('x-purchaser-email', 'anyone@example.com');

      expect(res.status).toBe(402);
      expect(res.body.status).toBe('payment_required');
    });

    it('plain programmatic request with valid agent key debits credits and returns 200', async () => {
      const { inMemoryKeyRegistry, inMemoryAgentRegistry, inMemoryWalletRegistry } = await import('./agentPlatform.js');
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
        status: 'active'
      });

      inMemoryWalletRegistry.set(agentId, {
        agentId,
        creditsBalance: 50,
        availableBalance: 50,
        paidCreditsBalance: 50,
        lifetimeSpent: 0,
        status: 'active'
      });

      const app = createTestApp();

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${rawKey}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.sbScore).toBe(88);
    });

    it('includes Bazaar discovery extensions in the 402 challenge header and body with info, schema, and enriched resource', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const app = createTestApp();

      const res = await request(app).get('/api/data/market');
      expect(res.status).toBe(402);

      const headerObj = decodePaymentRequiredHeader(res.headers['payment-required']);
      expect(headerObj.extensions).toBeDefined();
      const bazaarHeader = headerObj.extensions?.bazaar as any;
      expect(bazaarHeader).toBeDefined();
      expect(bazaarHeader.info).toBeDefined();
      expect(bazaarHeader.schema).toBeDefined();

      // Validate decoded header Bazaar extension via validateDiscoveryExtension
      const headerValidation = validateDiscoveryExtension(bazaarHeader);
      expect(headerValidation.valid).toBe(true);

      // Verify enriched resource
      expect(headerObj.resource?.url).toBeTruthy();
      expect(headerObj.resource?.description?.length).toBeLessThan(500);
      expect((headerObj.resource as any)?.serviceName).toBe('Stock Bloc');
      expect((headerObj.resource as any)?.tags).toEqual(['stocks', 'sec', '13f', 'quant', 'forecasting']);

      // Verify 402 body carries extensions.bazaar.info + extensions.bazaar.schema
      const bazaarBody = res.body.extensions?.bazaar as any;
      expect(bazaarBody).toBeDefined();
      expect(bazaarBody.info).toBeDefined();
      expect(bazaarBody.schema).toBeDefined();
      const bodyValidation = validateDiscoveryExtension(bazaarBody);
      expect(bodyValidation.valid).toBe(true);
    });

    it('asserts Bazaar discovery extension validation passes for all 8 priced endpoints', () => {
      const endpointIds = Object.keys(PRICED_ENDPOINTS);
      expect(endpointIds).toHaveLength(8);

      for (const id of endpointIds) {
        const ext = BAZAAR_DISCOVERY_EXTENSIONS[id];
        expect(ext).toBeDefined();
        expect(ext.bazaar).toBeDefined();
        expect(ext.bazaar.info).toBeDefined();
        expect(ext.bazaar.schema).toBeDefined();
        expect(ext.bazaar.info.input).toBeDefined();
        expect(ext.bazaar.info.input.type).toBe('http');
        expect(ext.bazaar.info.output).toBeDefined();
        expect(ext.bazaar.info.output.type).toBe('json');
        expect(ext.bazaar.info.output.example).toBeDefined();

        const validation = validateDiscoveryExtension(ext.bazaar);
        expect(validation.valid).toBe(true);
      }
    });

    it('exports X402_ROUTE_PATHS covering all priced endpoints with valid routes', () => {
      const endpointIds = Object.keys(PRICED_ENDPOINTS);
      expect(endpointIds).toHaveLength(8);

      for (const id of endpointIds) {
        const paths = X402_ROUTE_PATHS[id];
        expect(paths).toBeDefined();
        expect(Array.isArray(paths)).toBe(true);
        expect(paths.length).toBeGreaterThan(0);
        for (const p of paths) {
          expect(p.startsWith('/api/')).toBe(true);
        }
      }
    });

    it('double-mount regression: paid request with double-mounted middleware calls settle exactly once and returns 200', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const app = express();
      app.use(express.json());
      // Explicitly simulate double-mounting requireX402Payment
      app.use(requireX402Payment());
      app.use('/api/v1/intelligence', requireX402Payment());
      app.get('/api/v1/intelligence/sb-score', (req, res) => {
        res.json({ status: 'success', ticker: 'NVDA', sbScore: 88 });
      });

      const settleSpy = vi.fn().mockResolvedValue({
        success: true,
        payer: '0xBuyer',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      });
      setFacilitatorVerifyHandler(async () => ({ isValid: true }));
      setFacilitatorSettleHandler(settleSpy);

      const paymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: { from: '0xBuyer', to: TEST_RECIPIENT_ADDRESS, value: '50000' }
        })
      ).toString('base64');

      const res = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('PAYMENT-SIGNATURE', paymentHeader);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.sbScore).toBe(88);
      // Settle must be executed exactly once
      expect(settleSpy).toHaveBeenCalledTimes(1);
    });

    it('credit debit: agent balance drops by endpoint price in credits, subsequent call with 0 balance gets 402', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const agentId = 'agent_test_debit_regression';
      const publicId = 'debitpub123';
      const secret = 'debitsecret123456789012345678901234567890123456789012345678901234';
      const rawApiKey = `sb_live_${publicId}_${secret}`;
      const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

      inMemoryAgentRegistry.set(agentId, {
        agentId,
        handle: 'debit_bot',
        displayName: 'Debit Bot',
        status: 'active'
      });
      inMemoryKeyRegistry.set(publicId, {
        keyId: publicId,
        agentId,
        secretHash,
        status: 'active',
        scopes: ['services:read', 'payments:transact'] as any,
        createdAt: new Date().toISOString()
      });
      // Initial balance: exactly 5 credits (cost of sb_score: $0.05 = 5 credits)
      inMemoryWalletRegistry.set(agentId, {
        agentId,
        creditsBalance: 5,
        availableBalance: 5,
        paidCreditsBalance: 5,
        lifetimeSpent: 0
      });

      const app = createTestApp();

      // First call: spends 5 credits, drops balance to 0, succeeds with 200
      const res1 = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${rawApiKey}`);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('success');
      expect(inMemoryWalletRegistry.get(agentId)!.creditsBalance).toBe(0);

      // Second call: 0 credits remaining, must be rejected with 402 Payment Required
      const res2 = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('Authorization', `Bearer ${rawApiKey}`);

      expect(res2.status).toBe(402);
      expect(res2.body.error).toContain('Trial credit balance exhausted');
    });

    it('manifest parity: every priced endpoint in manifest.json returns 402 for unauthenticated requests with no free-tier bypass', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const manifest = JSON.parse(fs.readFileSync('public/agents/manifest.json', 'utf8'));
      const app = createTestApp();

      // Find all priced endpoints with x402 blocks in manifest
      const pricedEntries = Object.entries(manifest.endpoints).filter(([, ep]: [string, any]) => !!ep.x402);
      expect(pricedEntries.length).toBeGreaterThanOrEqual(7);

      for (const [name, ep] of pricedEntries as [string, any][]) {
        const method = (ep.method || 'GET').toUpperCase();
        const path = ep.path;

        let reqBuilder: request.Test;
        if (method === 'POST') {
          reqBuilder = request(app).post(path).send({ ticker: 'NVDA' });
        } else {
          reqBuilder = request(app).get(path);
        }

        const res = await reqBuilder;
        expect(res.status, `Endpoint ${name} at ${path} must require payment (HTTP 402)`).toBe(402);
        expect(res.body.status).toBe('payment_required');
      }
    });

    it('serves complete Earnings Prep Pack payload with thirteenF, filingAudit, and memo upon verified settlement', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const { agentIntelligenceRouter } = await import('./agentIntelligenceApi.js');
      const testApp = express();
      testApp.use(express.json());
      testApp.use(requireX402Payment());
      testApp.use('/api/v1/intelligence', agentIntelligenceRouter);

      setFacilitatorVerifyHandler(async () => ({ isValid: true }));
      setFacilitatorSettleHandler(async () => ({
        success: true,
        payer: '0xBuyer',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }));

      const paymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: { from: '0xBuyer', to: TEST_RECIPIENT_ADDRESS, value: '350000' }
        })
      ).toString('base64');

      const res = await request(testApp)
        .get('/api/v1/intelligence/earnings-pack?ticker=NVDA')
        .set('PAYMENT-SIGNATURE', paymentHeader);

      expect(res.status).toBe(200);
      expect(res.body.ticker).toBe('NVDA');
      expect(res.body.asOf).toBeDefined();
      expect(res.body.thirteenF).toBeDefined();
      expect(res.body.thirteenF.quarterCycle).toBeDefined();
      expect(res.body.filingAudit).toBeDefined();
      expect(res.body.filingAudit.executiveSummary).toBeDefined();
      expect(res.body.memo).toBeDefined();
      expect(res.body.memo.title).toContain('NVDA');
      expect(res.body.memo.thesis).toBeDefined();
      expect(res.body.memo.bullCase).toBeDefined();
      expect(res.body.memo.bearCase).toBeDefined();
      expect(Array.isArray(res.body.memo.catalysts)).toBe(true);
      expect(Array.isArray(res.body.memo.risks)).toBe(true);
      expect(Array.isArray(res.body.memo.evidence)).toBe(true);
    });

    it('REGRESSION: mock facilitator settle success followed by a verify that reverts with a used nonce, assert the endpoint returns 200', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const app = createTestApp();

      const settleSpy = vi.fn().mockResolvedValue({
        success: true,
        payer: '0xPayer123',
        txHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef'
      });

      // 1. First invocation: verify succeeds, settle succeeds
      setFacilitatorVerifyHandler(async () => ({ isValid: true }));
      setFacilitatorSettleHandler(settleSpy);

      const paymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: {
            from: '0xPayer123',
            to: TEST_RECIPIENT_ADDRESS,
            value: '250000',
            nonce: '0xdeadbeef00000001'
          }
        })
      ).toString('base64');

      // Request 1: Settle succeeds on chain
      const res1 = await request(app)
        .get('/api/data/sec?symbol=NVDA')
        .set('X-PAYMENT', paymentHeader);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('success');
      expect(settleSpy).toHaveBeenCalledTimes(1);

      // 2. Simulate subsequent verify reverting on-chain due to used nonce (e.g. on client retry)
      setFacilitatorVerifyHandler(async () => {
        const revertError: any = new Error('invalid_payload: contract call failed: unable to call contract: execution reverted');
        revertError.status = 400;
        throw revertError;
      });

      // Request 2: Replay of same payment payload (used nonce)
      const res2 = await request(app)
        .get('/api/data/sec?symbol=NVDA')
        .set('X-PAYMENT', paymentHeader);

      // Settle must be authoritative - response must be 200 (NOT 402 payment_rejected)
      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('success');
      // Settle must NOT have been called again (idempotent, single on-chain charge)
      expect(settleSpy).toHaveBeenCalledTimes(1);
    });

    it('IDEMPOTENCY: identical X-PAYMENT payload arrives twice, does not settle twice, returns 200 both times', async () => {
      process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
      const app = createTestApp();

      const settleSpy = vi.fn().mockResolvedValue({
        success: true,
        payer: '0xIdempotentPayer',
        txHash: '0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999'
      });

      setFacilitatorVerifyHandler(async () => ({ isValid: true }));
      setFacilitatorSettleHandler(settleSpy);

      const paymentHeader = Buffer.from(
        JSON.stringify({
          x402Version: 2,
          authorization: {
            from: '0xIdempotentPayer',
            to: TEST_RECIPIENT_ADDRESS,
            value: '50000',
            nonce: '0xnonce_idempotent_01'
          }
        })
      ).toString('base64');

      const res1 = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('PAYMENT-SIGNATURE', paymentHeader);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('success');
      expect(res1.body.sbScore).toBe(88);

      const res2 = await request(app)
        .get('/api/v1/intelligence/sb-score')
        .set('PAYMENT-SIGNATURE', paymentHeader);

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('success');
      expect(res2.body.sbScore).toBe(88);

      expect(settleSpy).toHaveBeenCalledTimes(1);
    });
  });
});
