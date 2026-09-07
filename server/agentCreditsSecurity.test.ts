import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import {
  agentPlatformRouter,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry,
  addCreditsToAgentWallet,
  authenticateAgent,
  requireScope,
  handleCreditsRefill
} from './agentPlatform.js';
import type { AgentApiKeyRecord, AgentIdentity } from '../src/types.js';

describe('CREDIT MINT AUTHORITY HARDENING — 12 Canonical Security Tests', () => {
  let app: express.Express;
  let origWebhookSecret: string | undefined;

  const targetAgentId = 'agent_secure_test_target';
  const initialCredits = 250;

  // Normal agent WITH payments:transact scope (normal authenticated agent)
  const normalKeyId = 'key_normal_agent_01';
  const normalRawKey = `sb_live_${normalKeyId}_secretnormalpayments12345`;
  const normalAgentId = 'agent_normal_transact';

  // Another agent (victim or peer)
  const peerAgentId = 'agent_peer_target_999';

  // Internal Admin Secret Key
  const adminSecretKey = 'test_internal_admin_secret_key_2026';

  // Stripe test webhook setup
  const stripeWebhookSecret = 'whsec_test_credit_mint_secret_hardening_2026';
  const stripeClient = new Stripe('sk_test_mock_secret_key_12345', {
    apiVersion: '2024-12-18.acacia' as any
  });
  const processedEvents = new Set<string>();
  const fulfilledSessions = new Map<string, any>();

  beforeEach(async () => {
    origWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // Set admin secret in environment for test
    process.env.AGENT_API_SECRET_KEY = adminSecretKey;
    process.env.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;

    app = express();

    // Raw body parser for webhook signature verification
    app.use(
      express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf.toString('utf8');
        }
      })
    );

    // Mount agent router at both standard prefixes
    app.use(['/api/v1/agents', '/api/v1/agent'], agentPlatformRouter);

    // Mount direct route matching server.ts root app handlers with requireScope('admin')
    app.post(
      ['/api/v1/agent/credits/refill', '/api/v1/agents/credits/refill', '/api/agents/credits/refill'],
      authenticateAgent,
      requireScope('admin'),
      handleCreditsRefill
    );

    // Stripe Webhook Endpoint matching server.ts architecture
    app.post(['/api/stripe/webhook', '/api/webhooks/stripe'], async (req: any, res) => {
      const sig = req.headers['stripe-signature'] as string;
      if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      let event: Stripe.Event;
      try {
        const rawPayload = req.rawBody || JSON.stringify(req.body);
        event = stripeClient.webhooks.constructEvent(rawPayload, sig, stripeWebhookSecret);
      } catch (err: any) {
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }

      if (!event || !event.type) {
        return res.status(400).json({ error: 'Invalid event payload' });
      }

      // Idempotency check on event ID
      if (processedEvents.has(event.id)) {
        return res.status(200).json({ received: true, idempotent: true, eventId: event.id });
      }
      processedEvents.add(event.id);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session) {
          return res.status(400).json({ error: 'Missing session object' });
        }

        const isPaid = session.payment_status === 'paid' || session.status === 'complete';
        if (!isPaid) {
          return res.status(200).json({ received: true, status: 'unpaid' });
        }

        // Session idempotency check
        if (fulfilledSessions.has(session.id)) {
          const prior = fulfilledSessions.get(session.id);
          return res.status(200).json({
            received: true,
            idempotent: true,
            sessionId: session.id,
            creditsBalance: prior.creditsBalance
          });
        }

        const metadata = session.metadata || {};
        const creditsToAdd = metadata.credits ? parseInt(metadata.credits, 10) : 1000;
        const target = metadata.agentId || 'agent_purchaser';

        const result = await addCreditsToAgentWallet(target, creditsToAdd);
        fulfilledSessions.set(session.id, {
          agentId: target,
          creditsGranted: creditsToAdd,
          creditsBalance: result.creditsBalance
        });

        return res.status(200).json({
          status: 'ok',
          received: true,
          sessionId: session.id,
          creditsBalance: result.creditsBalance
        });
      }

      return res.status(200).json({ received: true });
    });

    // Reset state & registries
    inMemoryWalletRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
    processedEvents.clear();
    fulfilledSessions.clear();

    // Seed target agent wallet with known balance
    inMemoryWalletRegistry.set(targetAgentId, {
      agentId: targetAgentId,
      creditsBalance: initialCredits,
      updatedAt: new Date().toISOString()
    });

    // Seed normal agent with payments:transact scope
    const normalAgent: AgentIdentity = {
      agentId: normalAgentId,
      handle: 'normal_agent',
      displayName: 'Normal Autonomous Agent',
      description: 'Test agent with payments:transact scope',
      avatar: '',
      ownerUid: 'owner_normal',
      status: 'active',
      authorType: 'agent',
      verificationStatus: 'verified',
      lastSeenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryAgentRegistry.set(normalAgentId, normalAgent);
    inMemoryAgentRegistry.set('normal_agent', normalAgent);

    const normalKeyRecord: AgentApiKeyRecord = {
      keyId: normalKeyId,
      agentId: normalAgentId,
      ownerUid: 'owner_normal',
      scopes: ['services:read', 'payments:transact'],
      createdAt: new Date(),
      status: 'active'
    };
    inMemoryKeyRegistry.set(normalRawKey, normalKeyRecord);
    inMemoryKeyRegistry.set(normalKeyId, normalKeyRecord);

    // Seed peer agent wallet
    inMemoryWalletRegistry.set(peerAgentId, {
      agentId: peerAgentId,
      creditsBalance: 50,
      updatedAt: new Date().toISOString()
    });
  });

  afterEach(() => {
    if (origWebhookSecret !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = origWebhookSecret;
    } else {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    }
  });

  // 1. Normal agent + payments:transact + target own wallet → reject if this endpoint is admin-only (403)
  it('1. Normal agent + payments:transact + target own wallet → 403 Forbidden', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${normalRawKey}`)
      .send({ agentId: normalAgentId, credits: 1000 });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/scope|authority|forbidden/i);

    // Normal agent wallet balance must be completely unchanged
    const wallet = inMemoryWalletRegistry.get(normalAgentId);
    expect(wallet).toBeUndefined(); // never created or credited
  });

  // 2. Normal agent + payments:transact + another agent → 403 Forbidden
  it('2. Normal agent + payments:transact + another agent → 403 Forbidden', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${normalRawKey}`)
      .send({ agentId: peerAgentId, credits: 5000 });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/scope|authority|forbidden/i);

    // Peer agent balance must remain strictly unchanged (50 credits)
    const wallet = inMemoryWalletRegistry.get(peerAgentId);
    expect(wallet.creditsBalance).toBe(50);
  });

  // 3. Normal agent + admin-like body field → 403 Forbidden
  it('3. Normal agent + admin-like body field → 403 Forbidden', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${normalRawKey}`)
      .send({
        agentId: peerAgentId,
        credits: 5000,
        role: 'admin',
        isAdmin: true,
        isMaster: true,
        adminSecret: 'bypass'
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/scope|authority|forbidden/i);

    const wallet = inMemoryWalletRegistry.get(peerAgentId);
    expect(wallet.creditsBalance).toBe(50);
  });

  // 4. Normal agent + credits field manipulation → 403 Forbidden
  it('4. Normal agent + credits field manipulation → 403 Forbidden', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${normalRawKey}`)
      .send({ agentId: peerAgentId, credits: -9999999 });

    expect(response.status).toBe(403);

    const wallet = inMemoryWalletRegistry.get(peerAgentId);
    expect(wallet.creditsBalance).toBe(50);
  });

  // 5. Unauthenticated → 401 Unauthorized
  it('5. Unauthenticated → 401 Unauthorized', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .send({ agentId: targetAgentId, credits: 500 });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/unauthorized|missing/i);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  // 6. Admin + valid target + positive credits → succeeds
  it('6. Admin + valid target + positive credits → succeeds (200 OK)', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${adminSecretKey}`)
      .send({ agentId: targetAgentId, credits: 1000 });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.creditsBalance).toBe(initialCredits + 1000);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits + 1000);
  });

  // 7. Admin + negative credits → 400 Bad Request
  it('7. Admin + negative credits → 400 Bad Request', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${adminSecretKey}`)
      .send({ agentId: targetAgentId, credits: -500 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid credits/i);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  // 8. Admin + zero credits → 400 Bad Request
  it('8. Admin + zero credits → 400 Bad Request', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${adminSecretKey}`)
      .send({ agentId: targetAgentId, credits: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid credits/i);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  // 9. Admin + missing credits → 400 Bad Request
  it('9. Admin + missing credits → 400 Bad Request', async () => {
    const response = await request(app)
      .post('/api/v1/agent/credits/refill')
      .set('Authorization', `Bearer ${adminSecretKey}`)
      .send({ agentId: targetAgentId });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/missing credits parameter/i);

    const wallet = inMemoryWalletRegistry.get(targetAgentId);
    expect(wallet.creditsBalance).toBe(initialCredits);
  });

  // 10. Stripe verified purchase → credits correctly
  it('10. Stripe verified purchase → credits purchasing agent correctly', async () => {
    const purchaserAgentId = `agent_stripe_purchaser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      id: `evt_test_${Date.now()}_purchase`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}_session`,
          payment_status: 'paid',
          status: 'complete',
          amount_total: 1000,
          metadata: {
            agentId: purchaserAgentId,
            credits: '1000'
          }
        }
      }
    };
    const payloadString = JSON.stringify(payload);
    const validSignature = stripeClient.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeWebhookSecret
    });

    const response = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', validSignature)
      .set('content-type', 'application/json')
      .send(payloadString);

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);
    expect(response.body.creditsBalance).toBe(1000);

    const wallet = inMemoryWalletRegistry.get(purchaserAgentId);
    expect(wallet.creditsBalance).toBe(1000);
  });

  // 11. Duplicate Stripe webhook → no double credit (idempotency)
  it('11. Duplicate Stripe webhook → no double credit (idempotent)', async () => {
    const purchaserAgentId = `agent_stripe_purchaser_idem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const eventId = `evt_test_${Date.now()}_idempotent`;
    const sessionId = `cs_test_${Date.now()}_idempotent_session`;
    const payload = {
      id: eventId,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          payment_status: 'paid',
          status: 'complete',
          amount_total: 2500,
          metadata: {
            agentId: purchaserAgentId,
            credits: '2500'
          }
        }
      }
    };
    const payloadString = JSON.stringify(payload);
    const validSignature = stripeClient.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret: stripeWebhookSecret
    });

    // First arrival
    const firstRes = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', validSignature)
      .set('content-type', 'application/json')
      .send(payloadString);

    expect(firstRes.status).toBe(200);
    expect(firstRes.body.creditsBalance).toBe(2500);

    // Duplicate webhook arrival
    const secondRes = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', validSignature)
      .set('content-type', 'application/json')
      .send(payloadString);

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.idempotent).toBe(true);

    // Balance must be strictly 2500 (NO double credit)
    const wallet = inMemoryWalletRegistry.get(purchaserAgentId);
    expect(wallet.creditsBalance).toBe(2500);
  });

  // 12. Invalid Stripe signature → no credit
  it('12. Invalid Stripe signature → rejected with 400 and no credit granted', async () => {
    const victimAgentId = 'agent_stripe_victim_003';
    const payload = {
      id: `evt_test_${Date.now()}_fake`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}_fake_session`,
          payment_status: 'paid',
          status: 'complete',
          amount_total: 5000,
          metadata: {
            agentId: victimAgentId,
            credits: '5000'
          }
        }
      }
    };
    const payloadString = JSON.stringify(payload);

    const response = await request(app)
      .post('/api/stripe/webhook')
      .set('stripe-signature', 't=12345,v1=invalid_forged_signature_hash_9999')
      .set('content-type', 'application/json')
      .send(payloadString);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/signature verification failed/i);

    // Wallet must NOT exist or be credited
    const wallet = inMemoryWalletRegistry.get(victimAgentId);
    expect(wallet).toBeUndefined();
  });
});
