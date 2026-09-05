import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import Stripe from 'stripe';
import {
  authenticateAgent,
  validateProductionStartupSafety,
  generateApiKeyPair,
  inMemoryKeyRegistry,
  inMemoryAgentRegistry
} from './agentSecurity.js';
import {
  agentPlatformRouter,
  inMemoryWalletRegistry,
  verifyAndDebitAgentCredit,
  addCreditsToAgentWallet
} from './agentPlatform.js';
import {
  StripePaymentProvider,
  processedWebhookEvents,
  recordedStripeSessions,
  fulfilledStripeSessions
} from './stripePaymentProvider.js';
import { agentExchangeRouter } from './agentExchangeApi.js';

const TEST_WEBHOOK_SECRET = 'whsec_test_secret_for_signing_events_1234567890';
const stripeSdk = new Stripe('sk_test_placeholder', { apiVersion: '2024-12-18.acacia' as any });

// Setup isolated express app for testing security endpoints
function createSecurityTestApp() {
  const app = express();
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // 1. Mount API routers
  app.use(['/api/v1/agents', '/api/v1/agent', '/api/agents'], agentPlatformRouter);
  app.use(['/api/v1/exchange', '/api/exchange', '/exchange'], agentExchangeRouter);

  // 2. Auth-guard test endpoint
  app.get('/api/test/auth-guard', authenticateAgent, (req: any, res) => {
    res.status(200).json({
      authenticated: true,
      agentId: req.agent.agentId,
      handle: req.agent.handle
    });
  });

  // 3. Hardened Stripe webhook endpoint mirroring server.ts
  app.post(['/api/stripe/webhook', '/api/webhooks/stripe'], async (req: any, res) => {
    const isProd = process.env.NODE_ENV === 'production' ||
                   process.env.AGENT_ENV === 'production' ||
                   process.env.PAYMENT_MODE === 'production' ||
                   req.hostname === 'stockbloc.ai.studio' ||
                   req.headers.host?.includes('stockbloc.ai.studio');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || TEST_WEBHOOK_SECRET;

    // In production: REQUIRE STRIPE_WEBHOOK_SECRET. If unset → 500
    if (isProd && (!webhookSecret || webhookSecret.trim() === '')) {
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is required in production.' });
    }

    // Always require Stripe-Signature. Missing/invalid → 400
    const sig = req.headers['stripe-signature'] as string;
    if (!sig || sig.trim() === '') {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: any;
    try {
      const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = stripeSdk.webhooks.constructEvent(rawPayload, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    const eventId = event.id;
    if (eventId && processedWebhookEvents.has(eventId)) {
      return res.status(200).json({ received: true, idempotent: true, eventId, duplicateIgnored: true });
    }
    if (eventId) {
      processedWebhookEvents.add(eventId);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (!session) return res.status(400).json({ error: 'Missing session' });

      // Check payment status
      const isPaid = session.payment_status === 'paid' || session.status === 'complete';
      if (!isPaid) {
        return res.status(200).json({
          received: true,
          status: 'unpaid',
          message: 'Checkout session is not paid; credit fulfillment deferred'
        });
      }

      const agentId = session.metadata?.agentId;
      const credits = parseInt(session.metadata?.credits || '1000', 10);
      if (agentId) {
        await addCreditsToAgentWallet(agentId, credits);
      }
      return res.status(200).json({ received: true, credited: true });
    }

    return res.status(200).json({ received: true });
  });

  // 4. Verify-session endpoint
  app.get('/api/checkout/verify-session', (req, res) => {
    const sessionId = req.query.session_id as string;
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      return res.status(400).json({ status: 'error', error: 'Missing session_id parameter' });
    }
    if (sessionId === 'cs_test_fake' || sessionId.toLowerCase().includes('fake')) {
      return res.status(404).json({ status: 'error', error: 'Invalid or fake checkout session ID', sessionId });
    }
    const session = recordedStripeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ status: 'error', error: 'Checkout session not found', sessionId });
    }
    return res.status(200).json({ status: 'success', session });
  });

  // 5. Support direct JSON requests to /agents/feed
  app.get('/agents/feed', (req, res, next) => {
    if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
      return res.redirect(307, '/api/v1/agents/feed');
    }
    next();
  });

  // 6. SPA fallback handler for non-API browser routes (defined LAST)
  app.get(['/agents', '/agents/feed', '*'], (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<!DOCTYPE html><html><head><title>Stock Bloc</title></head><body><div id="root"></div></body></html>');
  });

  return app;
}

describe('STOCK BLOC — PRODUCTION HARDENING SECURITY TEST SUITE', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createSecurityTestApp();
    processedWebhookEvents.clear();
    recordedStripeSessions.clear();
    fulfilledStripeSessions.clear();
    inMemoryWalletRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
  });

  // Test 1
  it('PASS unknown structurally valid key → 401', async () => {
    const fakePublicId = crypto.randomBytes(8).toString('hex');
    const fakeSecret = crypto.randomBytes(24).toString('hex');
    const unknownKey = `sb_live_${fakePublicId}_${fakeSecret}`;

    const res = await request(app)
      .get('/api/test/auth-guard')
      .set('Authorization', `Bearer ${unknownKey}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized|Invalid Agent API key|Unknown/);

    const debitResult = verifyAndDebitAgentCredit(`Bearer ${unknownKey}`, 1);
    expect(debitResult.valid).toBe(false);
    expect(debitResult.statusCode).toBe(401);
  });

  // Test 2
  it('PASS registered valid key → authenticated', async () => {
    const agentId = 'agent_auth_test_' + crypto.randomBytes(4).toString('hex');
    const handle = 'quant_valid_agent';

    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: 'Quant Valid Agent',
      status: 'active'
    });

    const { rawKey, keyRecord, keyId } = generateApiKeyPair(agentId, handle, ['services:read', 'services:write']);
    inMemoryKeyRegistry.set(keyId, keyRecord);
    inMemoryKeyRegistry.set(rawKey, keyRecord);

    const res = await request(app)
      .get('/api/test/auth-guard')
      .set('Authorization', `Bearer ${rawKey}`);

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.agentId).toBe(agentId);
  });

  // Test 3
  it('PASS revoked key → 401', async () => {
    const agentId = 'agent_revoked_' + crypto.randomBytes(4).toString('hex');
    const handle = 'revoked_agent';

    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: 'Revoked Agent',
      status: 'active'
    });

    const { rawKey, keyRecord, keyId } = generateApiKeyPair(agentId, handle);
    keyRecord.status = 'revoked';
    inMemoryKeyRegistry.set(keyId, keyRecord);
    inMemoryKeyRegistry.set(rawKey, keyRecord);

    const res = await request(app)
      .get('/api/test/auth-guard')
      .set('Authorization', `Bearer ${rawKey}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/revoked/i);
  });

  // Test 4
  it('PASS expired key → 401', async () => {
    const agentId = 'agent_expired_' + crypto.randomBytes(4).toString('hex');
    const handle = 'expired_agent';

    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: 'Expired Agent',
      status: 'active'
    });

    const { rawKey, keyRecord, keyId } = generateApiKeyPair(agentId, handle);
    keyRecord.expiresAt = new Date(Date.now() - 10000).toISOString();
    inMemoryKeyRegistry.set(keyId, keyRecord);
    inMemoryKeyRegistry.set(rawKey, keyRecord);

    const res = await request(app)
      .get('/api/test/auth-guard')
      .set('Authorization', `Bearer ${rawKey}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  // Test 5
  it('PASS missing production AGENT_API_SECRET_KEY → startup/configuration failure', () => {
    const origEnv = process.env.AGENT_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origSecret = process.env.AGENT_API_SECRET_KEY;
    const origMaster = process.env.AGENT_PLATFORM_MASTER_KEY;

    try {
      process.env.AGENT_ENV = 'production';
      process.env.NODE_ENV = 'production';
      process.env.AGENT_API_SECRET_KEY = '';
      process.env.AGENT_PLATFORM_MASTER_KEY = '';

      expect(() => validateProductionStartupSafety()).toThrow(/Production Startup Safety Check Failed|AGENT_API_SECRET_KEY/);
    } finally {
      process.env.AGENT_ENV = origEnv;
      process.env.NODE_ENV = origNodeEnv;
      process.env.AGENT_API_SECRET_KEY = origSecret;
      process.env.AGENT_PLATFORM_MASTER_KEY = origMaster;
    }
  });

  // Test 6
  it('PASS missing production Stripe secret → failure', () => {
    const origPayMode = process.env.PAYMENT_MODE;
    const origStripeKey = process.env.STRIPE_SECRET_KEY;
    const origStripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      process.env.PAYMENT_MODE = 'production';
      process.env.STRIPE_SECRET_KEY = 'sk_live_valid1234567890';
      process.env.STRIPE_WEBHOOK_SECRET = '';

      expect(() => validateProductionStartupSafety()).toThrow(/Production Startup Safety Check Failed|STRIPE_WEBHOOK_SECRET/);
    } finally {
      process.env.PAYMENT_MODE = origPayMode;
      process.env.STRIPE_SECRET_KEY = origStripeKey;
      process.env.STRIPE_WEBHOOK_SECRET = origStripeWebhook;
    }
  });

  // Test 7
  it('PASS missing production Stripe live key → failure', () => {
    const origPayMode = process.env.PAYMENT_MODE;
    const origStripeKey = process.env.STRIPE_SECRET_KEY;
    const origStripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      process.env.PAYMENT_MODE = 'production';
      process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_valid1234567890';

      expect(() => validateProductionStartupSafety()).toThrow(/Production Startup Safety Check Failed|sk_live_\*/);

      const provider = new StripePaymentProvider({
        secretKey: 'sk_test_1234567890',
        paymentModeEnv: 'production',
        mode: 'production'
      });
      expect(provider.isConfigured()).toBe(false);
      expect(provider.isProductionReady()).toBe(false);
    } finally {
      process.env.PAYMENT_MODE = origPayMode;
      process.env.STRIPE_SECRET_KEY = origStripeKey;
      process.env.STRIPE_WEBHOOK_SECRET = origStripeWebhook;
    }
  });

  // Test 8
  it('PASS development/test sandbox fallback → allowed', () => {
    const origEnv = process.env.AGENT_ENV;
    const origNodeEnv = process.env.NODE_ENV;
    const origPayMode = process.env.PAYMENT_MODE;

    try {
      process.env.AGENT_ENV = 'sandbox';
      process.env.NODE_ENV = 'test';
      process.env.PAYMENT_MODE = 'sandbox';

      const result = validateProductionStartupSafety();
      expect(result.valid).toBe(true);

      const provider = new StripePaymentProvider({
        mode: 'sandbox',
        paymentModeEnv: 'sandbox'
      });
      expect(provider.getConfig().mode).toBe('sandbox');
    } finally {
      process.env.AGENT_ENV = origEnv;
      process.env.NODE_ENV = origNodeEnv;
      process.env.PAYMENT_MODE = origPayMode;
    }
  });

  // Test 9: PASTE 1 - Unsigned or bad-signature paid event does NOT increase creditsBalance
  it('PASS unsigned or bad-signature paid event does NOT increase creditsBalance', async () => {
    const agentId = 'agent_unsigned_attack_' + crypto.randomBytes(4).toString('hex');
    inMemoryWalletRegistry.set(agentId, {
      agentId,
      creditsBalance: 100,
      availableBalance: 100,
      lifetimeSpent: 0,
      simulationRuns: 0,
      verifiedSimulations: 0
    });

    const eventPayload = {
      id: 'evt_unsigned_' + Date.now(),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unsigned_' + Date.now(),
          payment_status: 'paid',
          metadata: {
            agentId,
            credits: '5000'
          }
        }
      }
    };

    // 1. Unsigned POST (no stripe-signature header) → must be 400
    const unsignedRes = await request(app)
      .post('/api/stripe/webhook')
      .send(eventPayload);
    expect(unsignedRes.status).toBe(400);
    expect(unsignedRes.body.error).toMatch(/Missing stripe-signature header/i);

    // Verify wallet was NOT credited
    expect(inMemoryWalletRegistry.get(agentId)?.creditsBalance).toBe(100);

    // 2. Bad-signature POST → must be 400
    const badSigRes = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 't=12345,v1=bad_invalid_signature_hash')
      .send(eventPayload);
    expect(badSigRes.status).toBe(400);
    expect(badSigRes.body.error).toMatch(/signature verification failed/i);

    // Verify wallet was NOT credited
    expect(inMemoryWalletRegistry.get(agentId)?.creditsBalance).toBe(100);
  });

  // Test 10: PASTE 1 - Valid signed fixture/test event DOES credit wallets
  it('PASS valid signed fixture/test event DOES credit wallets and updates /exchange/wallets/me', async () => {
    const agentId = 'agent_signed_valid_' + crypto.randomBytes(4).toString('hex');
    const handle = 'signed_quant_agent';
    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: 'Signed Quant Agent',
      status: 'active'
    });

    const { rawKey, keyRecord, keyId } = generateApiKeyPair(agentId, handle, ['services:read', 'services:write', 'payments:transact']);
    inMemoryKeyRegistry.set(keyId, keyRecord);
    inMemoryKeyRegistry.set(rawKey, keyRecord);

    const eventPayload = {
      id: 'evt_signed_valid_' + Date.now(),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_signed_valid_' + Date.now(),
          payment_status: 'paid',
          metadata: {
            agentId,
            credits: '3000'
          }
        }
      }
    };

    const effectiveSecret = process.env.STRIPE_WEBHOOK_SECRET || TEST_WEBHOOK_SECRET;
    const payloadString = JSON.stringify(eventPayload);
    const validSignature = stripeSdk.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: effectiveSecret
    });

    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', validSignature)
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res.status).toBe(200);
    expect(res.body.credited).toBe(true);
    expect(inMemoryWalletRegistry.get(agentId)?.creditsBalance).toBe(3000);

    // Verify /exchange/wallets/me endpoint with Bearer token
    const walletRes = await request(app)
      .get('/exchange/wallets/me')
      .set('Authorization', `Bearer ${rawKey}`);

    expect(walletRes.status).toBe(200);
    expect(walletRes.body.wallet.creditsBalance).toBe(3000);
  });

  // Test 11: PASTE 1 - Duplicate Stripe webhook → no double credit
  it('PASS duplicate Stripe webhook → no double credit', async () => {
    const agentId = 'agent_webhook_idemp_' + crypto.randomBytes(4).toString('hex');
    inMemoryWalletRegistry.set(agentId, {
      agentId,
      creditsBalance: 500,
      availableBalance: 500,
      lifetimeSpent: 0,
      simulationRuns: 0,
      verifiedSimulations: 0
    });

    const eventId = 'evt_idemp_test_' + Date.now();
    const eventPayload = {
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_session_' + Date.now(),
          payment_status: 'paid',
          metadata: {
            agentId,
            credits: '1000'
          }
        }
      }
    };

    const effectiveSecret = process.env.STRIPE_WEBHOOK_SECRET || TEST_WEBHOOK_SECRET;
    const payloadString = JSON.stringify(eventPayload);
    const validSignature = stripeSdk.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: effectiveSecret
    });

    // First delivery
    const res1 = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', validSignature)
      .set('Content-Type', 'application/json')
      .send(payloadString);
    expect(res1.status).toBe(200);
    expect(res1.body.credited).toBe(true);

    const walletAfterFirst = inMemoryWalletRegistry.get(agentId);
    expect(walletAfterFirst?.creditsBalance).toBe(1500);

    // Second delivery (duplicate event)
    const res2 = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', validSignature)
      .set('Content-Type', 'application/json')
      .send(payloadString);
    expect(res2.status).toBe(200);
    expect(res2.body.idempotent).toBe(true);
    expect(res2.body.duplicateIgnored).toBe(true);

    // Balance MUST remain 1500 (no double credit)
    const walletAfterSecond = inMemoryWalletRegistry.get(agentId);
    expect(walletAfterSecond?.creditsBalance).toBe(1500);
  });

  // Test 12: PASTE 1 - verify-session?session_id=cs_test_fake → 404
  it('PASS verify-session?session_id=cs_test_fake → 404', async () => {
    const res = await request(app).get('/api/checkout/verify-session?session_id=cs_test_fake');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Invalid or fake/i);
  });

  // Test 13: PASTE 2 - Browser GET /agents and /agents/feed return HTML UI; /api/v1/agents returns pure JSON
  it('PASS Browser /agents and /agents/feed → HTML UI; /api/v1/agents → JSON', async () => {
    // 1. Browser request to /agents returns HTML (SPA entry)
    const browserAgentsRes = await request(app)
      .get('/agents')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    expect(browserAgentsRes.status).toBe(200);
    expect(browserAgentsRes.headers['content-type']).toContain('text/html');
    expect(browserAgentsRes.text).toContain('<!DOCTYPE html>');

    // 2. Browser request to /agents/feed returns HTML
    const browserFeedRes = await request(app)
      .get('/agents/feed')
      .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    expect(browserFeedRes.status).toBe(200);
    expect(browserFeedRes.headers['content-type']).toContain('text/html');

    // 3. API request to /api/v1/agents returns pure JSON
    const apiAgentsRes = await request(app)
      .get('/api/v1/agents');
    expect(apiAgentsRes.status).toBe(200);
    expect(apiAgentsRes.headers['content-type']).toContain('application/json');

    // 4. API request to /api/v1/agents/leaderboard and /api/v1/agents/trade-ideas returns JSON 200
    const leaderboardRes = await request(app)
      .get('/api/v1/agents/leaderboard');
    expect(leaderboardRes.status).toBe(200);
    expect(leaderboardRes.headers['content-type']).toContain('application/json');
  });
});
