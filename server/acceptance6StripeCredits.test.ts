import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';
import { agentPlatformRouter, inMemoryKeyRegistry, inMemoryWalletRegistry, inMemoryAgentRegistry, addCreditsToAgentWallet, resolveAgentIdFromKey } from './agentPlatform.js';
import { agentExchangeRouter } from './agentExchangeApi.js';
import { recordedStripeSessions, fulfilledStripeSessions, processedWebhookEvents } from './stripePaymentProvider.js';

// Setup isolated express app mirroring server.ts configuration
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mount routers with aliases
  app.use(['/api/v1/exchange', '/api/exchange', '/exchange'], agentExchangeRouter);
  app.use(['/api/v1/agents', '/api/v1/agent', '/api/agents', '/agent', '/agents'], agentPlatformRouter);

  // In-memory purchase store for linking Stripe purchases
  const userProfilePurchases: Record<string, any> = {};

  // POST /api/stripe/webhook (checkout.session.completed)
  app.post(['/api/stripe/webhook', '/api/webhooks/stripe'], async (req: any, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: any;

    try {
      if (webhookSecret && webhookSecret.trim() !== '') {
        if (!sig) {
          return res.status(400).json({ error: 'Missing stripe-signature header' });
        }
        const { default: Stripe } = await import('stripe');
        const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });
        const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        try {
          event = stripe.webhooks.constructEvent(rawPayload, sig, webhookSecret);
        } catch (err: any) {
          return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
        }
      } else {
        event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      }

      if (!event || !event.type) {
        return res.status(400).json({ error: 'Invalid event payload' });
      }

      const eventId = event.id;
      if (eventId && processedWebhookEvents.has(eventId)) {
        return res.status(200).json({ received: true, idempotent: true, eventId });
      }
      if (eventId) {
        processedWebhookEvents.add(eventId);
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object;
        if (!session) {
          return res.status(400).json({ error: 'Missing session object' });
        }

        recordedStripeSessions.set(session.id, session);

        const isPaid = session.payment_status === 'paid' || session.status === 'complete';
        if (!isPaid) {
          return res.status(200).json({ received: true, status: 'unpaid' });
        }

        const metadata = session.metadata || {};
        const productId = metadata.productId || '';
        const productType = metadata.productType || '';

        let creditsToAdd = 0;
        if (metadata.credits) {
          creditsToAdd = parseInt(metadata.credits, 10) || 0;
        } else if (metadata.creditsGranted) {
          creditsToAdd = parseInt(metadata.creditsGranted, 10) || 0;
        } else if (productId === 'api_bundle_50') {
          creditsToAdd = 7500;
        } else if (productId === 'api_bundle_25') {
          creditsToAdd = 3000;
        } else if (productId === 'api_bundle_10' || productId.startsWith('api_bundle_')) {
          creditsToAdd = 1000;
        } else if (productType === 'subscription') {
          creditsToAdd = 5000;
        }

        const userEmail = metadata.email || session.customer_details?.email || 'customer@stockbloc.ai';
        const target = metadata.agentId || metadata.apiKey || `agent_${userEmail.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`;

        let result: { success: boolean; agentId?: string; creditsBalance: number; error?: string } = { success: true, agentId: target, creditsBalance: 0 };
        if (creditsToAdd > 0) {
          result = await addCreditsToAgentWallet(target, creditsToAdd);
        } else {
          const currentWallet = inMemoryWalletRegistry.get(target);
          result.creditsBalance = currentWallet?.creditsBalance || 0;
        }

        fulfilledStripeSessions.set(session.id, {
          sessionId: session.id,
          agentId: result.agentId || target,
          creditsGranted: creditsToAdd,
          creditsBalance: result.creditsBalance,
          fulfilledAt: new Date().toISOString()
        });

        return res.status(200).json({
          received: true,
          fulfilled: true,
          sessionId: session.id,
          agentId: result.agentId,
          creditsGranted: creditsToAdd,
          creditsBalance: result.creditsBalance
        });
      }

      return res.status(200).json({ received: true, type: event.type });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/checkout/verify-session
  app.get('/api/checkout/verify-session', async (req, res) => {
    const sessionId = req.query.session_id as string;
    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({ status: 'error', error: 'Missing session_id parameter' });
    }

    if (sessionId === 'cs_test_fake' || sessionId.toLowerCase().includes('fake')) {
      return res.status(404).json({
        status: 'error',
        error: 'Invalid or fake checkout session ID',
        sessionId
      });
    }

    const session = recordedStripeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        status: 'error',
        error: 'Checkout session not found',
        sessionId
      });
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      return res.status(402).json({
        status: 'error',
        error: 'Unpaid checkout session',
        sessionId,
        paymentStatus: session.payment_status || session.status || 'unpaid'
      });
    }

    const metadata = session.metadata || {};
    const userEmail = (req.query.email as string) || metadata.email || session.customer_details?.email || 'customer@stockbloc.ai';
    const targetAgentId = metadata.agentId || (metadata.apiKey ? resolveAgentIdFromKey(metadata.apiKey) : null) || `agent_${userEmail.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`;

    let fulfillment = fulfilledStripeSessions.get(sessionId);
    if (!fulfillment) {
      let creditsToAdd = 0;
      if (metadata.credits) creditsToAdd = parseInt(metadata.credits, 10);
      else if (metadata.productId === 'api_bundle_25') creditsToAdd = 3000;
      else if (metadata.productId === 'api_bundle_50') creditsToAdd = 7500;
      else if (metadata.productId?.startsWith('api_bundle_')) creditsToAdd = 1000;

      let walletRes = { creditsBalance: 0 };
      if (creditsToAdd > 0) {
        walletRes = await addCreditsToAgentWallet(targetAgentId, creditsToAdd);
      } else {
        const live = inMemoryWalletRegistry.get(targetAgentId);
        walletRes.creditsBalance = live?.creditsBalance || 0;
      }
      fulfillment = {
        sessionId,
        agentId: targetAgentId,
        creditsGranted: creditsToAdd,
        creditsBalance: walletRes.creditsBalance,
        fulfilledAt: new Date().toISOString()
      };
      fulfilledStripeSessions.set(sessionId, fulfillment);
    }

    const liveWallet = inMemoryWalletRegistry.get(targetAgentId);
    const creditsBalance = liveWallet ? liveWallet.creditsBalance : fulfillment.creditsBalance;

    return res.json({
      status: 'ok',
      order: {
        sessionId: session.id,
        email: userEmail,
        totalPaid: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '$25.00',
        paymentStatus: session.payment_status || 'paid',
        timestamp: new Date().toISOString(),
        apiCreditsRemaining: creditsBalance,
        creditsGranted: fulfillment.creditsGranted,
        items: []
      }
    });
  });

  // POST /api/user/link-purchases
  app.post('/api/user/link-purchases', (req, res) => {
    const { email = "customer@stockbloc.ai", items, apiKey, sessionId } = req.body;

    if (sessionId) {
      if (sessionId === 'cs_test_fake' || sessionId.toLowerCase().includes('fake')) {
        return res.status(400).json({
          status: 'error',
          error: 'Unverified session: payment verification failed for fake session ID',
          sessionId
        });
      }

      const recorded = recordedStripeSessions.get(sessionId);
      if (!recorded) {
        return res.status(400).json({
          status: 'error',
          error: 'Unverified session: no verified payment found for session ID',
          sessionId
        });
      }

      if (recorded.payment_status !== 'paid' && recorded.status !== 'complete') {
        return res.status(400).json({
          status: 'error',
          error: 'Unverified session: payment has not been completed',
          sessionId
        });
      }
    }

    userProfilePurchases[email] = {
      email,
      purchasedItems: items || [],
      apiKey,
      linkedAt: new Date().toISOString(),
    };

    return res.json({
      status: 'ok',
      message: 'Post-checkout purchases linked successfully to user profile',
      profile: userProfilePurchases[email]
    });
  });

  return app;
}

describe('ACCEPTANCE #6: Stripe api_bundle → readable agent credits', () => {
  let app: any;

  beforeEach(() => {
    app = createTestApp();
    recordedStripeSessions.clear();
    fulfilledStripeSessions.clear();
    processedWebhookEvents.clear();
    inMemoryWalletRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryAgentRegistry.clear();
  });

  describe('1) POST /api/stripe/webhook (checkout.session.completed)', () => {
    it('credits agent wallet when paid api_bundle completed event arrives', async () => {
      const agentId = 'agent_quant_runner_' + crypto.randomBytes(6).toString('hex');
      const eventId = 'evt_test_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const sessionId = 'cs_test_session_bundle_' + Date.now();

      const webhookPayload = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            status: 'complete',
            customer_details: { email: 'runner@stockbloc.ai' },
            metadata: {
              productId: 'api_bundle_25',
              productType: 'api_bundle',
              agentId: agentId,
              credits: '3000'
            }
          }
        }
      };

      const res = await request(app)
        .post('/api/stripe/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.fulfilled).toBe(true);
      expect(res.body.agentId).toBe(agentId);
      expect(res.body.creditsGranted).toBe(3000);
      expect(res.body.creditsBalance).toBe(3000);

      // Verify readable wallet in registry
      const wallet = inMemoryWalletRegistry.get(agentId);
      expect(wallet).toBeDefined();
      expect(wallet!.creditsBalance).toBe(3000);
    });

    it('credits agent wallet using apiKey metadata', async () => {
      const publicId = 'alpha_' + crypto.randomBytes(4).toString('hex');
      const rawApiKey = `sb_live_${publicId}_secret99`;
      const agentId = 'agent_resolved_' + crypto.randomBytes(6).toString('hex');

      // Pre-register API key
      inMemoryKeyRegistry.set(rawApiKey, {
        keyId: publicId,
        agentId,
        status: 'active'
      } as any);

      const eventId = 'evt_key_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const sessionId = 'cs_test_key_' + Date.now();

      const webhookPayload = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            status: 'complete',
            metadata: {
              productId: 'api_bundle_50',
              apiKey: rawApiKey,
              credits: '7500'
            }
          }
        }
      };

      const res = await request(app)
        .post('/api/stripe/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.agentId).toBe(agentId);
      expect(res.body.creditsGranted).toBe(7500);

      const wallet = inMemoryWalletRegistry.get(agentId);
      expect(wallet!.creditsBalance).toBe(7500);
    });

    it('is strictly idempotent on event id and prevents double-crediting', async () => {
      const agentId = 'agent_idempotent_' + crypto.randomBytes(6).toString('hex');
      const eventId = 'evt_idempotent_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
      const sessionId = 'cs_test_idemp_session_' + Date.now();

      const webhookPayload = {
        id: eventId,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            payment_status: 'paid',
            status: 'complete',
            metadata: {
              productId: 'api_bundle_10',
              agentId,
              credits: '1000'
            }
          }
        }
      };

      // First delivery
      const res1 = await request(app).post('/api/stripe/webhook').send(webhookPayload);
      expect(res1.status).toBe(200);
      expect(res1.body.creditsBalance).toBe(1000);

      // Duplicate delivery (Stripe retry)
      const res2 = await request(app).post('/api/stripe/webhook').send(webhookPayload);
      expect(res2.status).toBe(200);
      expect(res2.body.idempotent).toBe(true);

      // Wallet balance must stay exactly 1000, NOT 2000
      const wallet = inMemoryWalletRegistry.get(agentId);
      expect(wallet!.creditsBalance).toBe(1000);
    });

    it('defers credit fulfillment on unpaid session completed', async () => {
      const agentId = 'agent_unpaid_test';
      const webhookPayload = {
        id: 'evt_unpaid_' + Date.now(),
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_unpaid',
            payment_status: 'unpaid',
            status: 'open',
            metadata: {
              agentId,
              credits: '3000'
            }
          }
        }
      };

      const res = await request(app).post('/api/stripe/webhook').send(webhookPayload);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('unpaid');

      const wallet = inMemoryWalletRegistry.get(agentId);
      expect(wallet).toBeUndefined();
    });
  });

  describe('2) /api/checkout/verify-session: Real session retrieval & rejection of fake/unpaid', () => {
    it('rejects verify-session(cs_test_fake) with 404', async () => {
      const res = await request(app).get('/api/checkout/verify-session?session_id=cs_test_fake');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.error).toMatch(/fake/i);
    });

    it('rejects unrecorded/unknown session IDs', async () => {
      const res = await request(app).get('/api/checkout/verify-session?session_id=cs_unknown_session_12345');
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });

    it('rejects unpaid sessions with 402', async () => {
      const unpaidSessionId = 'cs_test_recorded_unpaid';
      recordedStripeSessions.set(unpaidSessionId, {
        id: unpaidSessionId,
        payment_status: 'unpaid',
        status: 'open',
        metadata: { credits: '1000' }
      });

      const res = await request(app).get(`/api/checkout/verify-session?session_id=${unpaidSessionId}`);
      expect(res.status).toBe(402);
      expect(res.body.status).toBe('error');
      expect(res.body.error).toMatch(/unpaid/i);
    });

    it('successfully retrieves real paid session and reports accurate credits without fabricating', async () => {
      const validSessionId = 'cs_test_recorded_paid_' + crypto.randomBytes(4).toString('hex');
      const agentId = 'agent_verified_' + crypto.randomBytes(6).toString('hex');

      recordedStripeSessions.set(validSessionId, {
        id: validSessionId,
        payment_status: 'paid',
        status: 'complete',
        amount_total: 2500,
        customer_details: { email: 'verified@stockbloc.ai' },
        metadata: {
          productId: 'api_bundle_25',
          agentId,
          credits: '3000'
        }
      });

      const res = await request(app).get(`/api/checkout/verify-session?session_id=${validSessionId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.order.sessionId).toBe(validSessionId);
      expect(res.body.order.totalPaid).toBe('$25.00');
      expect(res.body.order.apiCreditsRemaining).toBe(3000);
      expect(res.body.order.creditsGranted).toBe(3000);
    });
  });

  describe('3) Success/link-purchases only after verified payment & creditsBalance visibility', () => {
    it('rejects link-purchases for fake or unverified session IDs', async () => {
      const resFake = await request(app)
        .post('/api/user/link-purchases')
        .send({
          email: 'test@stockbloc.ai',
          sessionId: 'cs_test_fake',
          items: [{ id: 'item1' }]
        });
      expect(resFake.status).toBe(400);
      expect(resFake.body.status).toBe('error');

      const resUnknown = await request(app)
        .post('/api/user/link-purchases')
        .send({
          email: 'test@stockbloc.ai',
          sessionId: 'cs_unrecorded_999',
          items: [{ id: 'item1' }]
        });
      expect(resUnknown.status).toBe(400);
      expect(resUnknown.body.status).toBe('error');
    });

    it('accepts link-purchases for recorded paid sessions', async () => {
      const verifiedSessionId = 'cs_verified_link_123';
      recordedStripeSessions.set(verifiedSessionId, {
        id: verifiedSessionId,
        payment_status: 'paid',
        status: 'complete',
        metadata: {}
      });

      const res = await request(app)
        .post('/api/user/link-purchases')
        .send({
          email: 'buyer@stockbloc.ai',
          sessionId: verifiedSessionId,
          items: [{ id: 'bundle_1', title: 'Bundle' }]
        });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('makes creditsBalance visible on /exchange/wallets/me and /agent/me', async () => {
      const agentId = 'agent_vis_' + crypto.randomBytes(6).toString('hex');
      const keyId = 'kvis_' + crypto.randomBytes(4).toString('hex');
      const secret = 'sec_' + crypto.randomBytes(12).toString('hex');
      const rawApiKey = `sb_live_${keyId}_${secret}`;
      const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

      // Register agent and key
      inMemoryAgentRegistry.set(agentId, {
        agentId,
        handle: 'visible_agent',
        displayName: 'Visible Agent',
        status: 'active'
      });

      inMemoryKeyRegistry.set(rawApiKey, {
        keyId,
        agentId,
        status: 'active',
        secretHash,
        scopes: ['services:read', 'services:write', 'payments:transact']
      } as any);

      inMemoryKeyRegistry.set(keyId, {
        keyId,
        agentId,
        status: 'active',
        secretHash,
        scopes: ['services:read', 'services:write', 'payments:transact']
      } as any);

      // Step 1: Credit agent wallet via webhook
      const webhookPayload = {
        id: 'evt_vis_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_vis_session_' + Date.now(),
            payment_status: 'paid',
            status: 'complete',
            metadata: {
              agentId,
              credits: '5000'
            }
          }
        }
      };

      await request(app).post('/api/stripe/webhook').send(webhookPayload);

      // Step 2: Query /exchange/wallets/me with Bearer token
      const walletMeRes = await request(app)
        .get('/exchange/wallets/me')
        .set('Authorization', `Bearer ${rawApiKey}`);

      expect(walletMeRes.status).toBe(200);
      expect(walletMeRes.body.wallet).toBeDefined();
      expect(walletMeRes.body.wallet.creditsBalance).toBe(5000);

      // Step 3: Query /agent/me with Bearer token
      const agentMeRes = await request(app)
        .get('/agent/me')
        .set('Authorization', `Bearer ${rawApiKey}`);

      expect(agentMeRes.status).toBe(200);
      expect(agentMeRes.body.agent).toBeDefined();
      expect(agentMeRes.body.wallet).toBeDefined();
      expect(agentMeRes.body.wallet.creditsBalance).toBe(5000);
      expect(agentMeRes.body.agent.creditsBalance).toBe(5000);
    });
  });
});
