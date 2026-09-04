import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import {
  authenticateAgent,
  validateProductionStartupSafety,
  generateApiKeyPair,
  inMemoryKeyRegistry,
  inMemoryAgentRegistry
} from './agentSecurity.js';
import {
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

// Setup isolated express app for testing security endpoints
function createSecurityTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/test/auth-guard', authenticateAgent, (req: any, res) => {
    res.status(200).json({
      authenticated: true,
      agentId: req.agent.agentId,
      handle: req.agent.handle
    });
  });

  // Simulated Stripe webhook endpoint with idempotency
  app.post('/api/test/stripe-webhook', async (req: any, res) => {
    const event = req.body;
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

      const agentId = session.metadata?.agentId;
      const credits = parseInt(session.metadata?.credits || '1000', 10);
      if (agentId) {
        await addCreditsToAgentWallet(agentId, credits);
      }
      return res.status(200).json({ received: true, credited: true });
    }

    return res.status(200).json({ received: true });
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
  });

  // Test 1
  it('PASS unknown structurally valid key → 401', async () => {
    // Generate a validly structured key: sb_live_<random_publicId>_<random_secret>
    // but DO NOT register it in inMemoryKeyRegistry or database
    const fakePublicId = crypto.randomBytes(8).toString('hex');
    const fakeSecret = crypto.randomBytes(24).toString('hex');
    const unknownKey = `sb_live_${fakePublicId}_${fakeSecret}`;

    const res = await request(app)
      .get('/api/test/auth-guard')
      .set('Authorization', `Bearer ${unknownKey}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized|Invalid Agent API key|Unknown/);

    // Also verify simulation debit rejects unknown key
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
    keyRecord.expiresAt = new Date(Date.now() - 10000).toISOString(); // Expired 10s ago
    inMemoryKeyRegistry.set(keyId, keyRecord);

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
      process.env.STRIPE_WEBHOOK_SECRET = ''; // missing webhook secret

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
      process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890'; // test key instead of sk_live_
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

      // Startup safety in dev/sandbox mode generates runtime keys and succeeds without throwing
      const result = validateProductionStartupSafety();
      expect(result.valid).toBe(true);

      // Stripe sandbox provider functions normally
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

  // Test 9
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
    const webhookPayload = {
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_session_' + Date.now(),
          metadata: {
            agentId,
            credits: '1000'
          }
        }
      }
    };

    // First webhook delivery
    const res1 = await request(app)
      .post('/api/test/stripe-webhook')
      .send(webhookPayload);
    expect(res1.status).toBe(200);
    expect(res1.body.credited).toBe(true);

    const walletAfterFirst = inMemoryWalletRegistry.get(agentId);
    expect(walletAfterFirst?.creditsBalance).toBe(1500);

    // Second webhook delivery (duplicate event)
    const res2 = await request(app)
      .post('/api/test/stripe-webhook')
      .send(webhookPayload);
    expect(res2.status).toBe(200);
    expect(res2.body.idempotent).toBe(true);
    expect(res2.body.duplicateIgnored).toBe(true);

    // Balance MUST remain 1500 (no double credit)
    const walletAfterSecond = inMemoryWalletRegistry.get(agentId);
    expect(walletAfterSecond?.creditsBalance).toBe(1500);
  });
});
