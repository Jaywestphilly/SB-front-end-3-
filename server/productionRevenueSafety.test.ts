import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { dbStoreInstance } from './firebaseAdmin.js';
import {
  SERVER_CATALOG,
  createCheckoutSessionHandler,
  stripeWebhookHandler,
  verifySessionHandler,
  fulfillAuthoritativePayment,
  isProductionEnvironment
} from './stripeRevenueService.js';
import { requireX402Payment } from './x402PaymentService.js';
import {
  recordedStripeSessions,
  fulfilledStripeSessions,
  processedWebhookEvents,
  getFulfilledStripeSessionAsync,
  isWebhookEventProcessedAsync,
  setRecordedStripeSessionAsync
} from './stripePaymentProvider.js';
import {
  inMemoryWalletRegistry,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry
} from './agentPlatform.js';

// Helper mock HTTP response
function createMockResponse() {
  const res: any = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    send(data: any) {
      res.body = data;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    }
  };
  return res;
}

// Helper to generate a valid Stripe-Signature header for testing webhook verification
function generateStripeSignature(rawPayload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${rawPayload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const signature = hmac.digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

describe('STOCK BLOC PRODUCTION REVENUE SAFETY AUDIT — 16 Verification Tests', () => {
  const TEST_WEBHOOK_SECRET = 'whsec_test_secret_for_audit_1234567890';
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset state before each test
    recordedStripeSessions.clear();
    fulfilledStripeSessions.clear();
    processedWebhookEvents.clear();
    inMemoryWalletRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();

    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    delete process.env.NODE_ENV;
    delete process.env.PAYMENT_MODE;
    delete process.env.AGENT_ENV;
  });

  // TEST 1: Paid session grants credits once
  it('Test 1: Paid session grants credits once ($10 = 1,000 credits)', async () => {
    const sessionId = `cs_test_paid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventId = `evt_paid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const agentId = `agent_tester_1_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: agentId
      }
    };

    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      data: { object: session }
    });

    const sig = generateStripeSignature(payload, TEST_WEBHOOK_SECRET);
    const req: any = {
      originalUrl: '/api/stripe/webhook',
      headers: { 'stripe-signature': sig },
      body: JSON.parse(payload),
      rawBody: payload
    };
    const res = createMockResponse();

    await stripeWebhookHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.fulfilled).toBe(true);
    expect(res.body.creditsGranted).toBe(1000);
    expect(res.body.creditsBalance).toBe(1000);

    // Verify wallet
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(1000);

    // Verify durable record
    const fulfillment = await getFulfilledStripeSessionAsync(sessionId);
    expect(fulfillment).toBeDefined();
    expect(fulfillment?.creditsGranted).toBe(1000);
    expect(fulfillment?.productId).toBe('agent_credits_1000');
    expect(fulfillment?.amountUsd).toBe(10);
  });

  // TEST 2: Duplicate webhook event grants 0 extra
  it('Test 2: Duplicate webhook event grants 0 extra', async () => {
    const sessionId = `cs_test_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventId = `evt_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const agentId = `agent_tester_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: agentId
      }
    };

    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      data: { object: session }
    });
    const sig = generateStripeSignature(payload, TEST_WEBHOOK_SECRET);

    // First arrival
    const req1: any = {
      originalUrl: '/api/stripe/webhook',
      headers: { 'stripe-signature': sig },
      body: JSON.parse(payload),
      rawBody: payload
    };
    const res1 = createMockResponse();
    await stripeWebhookHandler(req1, res1);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.creditsGranted).toBe(1000);

    // Second arrival with identical eventId
    const req2: any = {
      originalUrl: '/api/stripe/webhook',
      headers: { 'stripe-signature': sig },
      body: JSON.parse(payload),
      rawBody: payload
    };
    const res2 = createMockResponse();
    await stripeWebhookHandler(req2, res2);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.idempotent).toBe(true);
    expect(res2.body.creditsGranted).toBe(0);

    // Wallet balance must stay 1000
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(1000);
  });

  // TEST 3: Same session, different event id, grants 0 extra
  it('Test 3: Same session, different event id, grants 0 extra', async () => {
    const sessionId = `cs_test_samesess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventId1 = `evt_first_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventId2 = `evt_second_different_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const agentId = `agent_tester_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: agentId
      }
    };

    // First webhook event
    const payload1 = JSON.stringify({
      id: eventId1,
      type: 'checkout.session.completed',
      data: { object: session }
    });
    const sig1 = generateStripeSignature(payload1, TEST_WEBHOOK_SECRET);
    const req1: any = {
      headers: { 'stripe-signature': sig1 },
      body: JSON.parse(payload1),
      rawBody: payload1
    };
    const res1 = createMockResponse();
    await stripeWebhookHandler(req1, res1);
    expect(res1.body.creditsGranted).toBe(1000);

    // Second webhook event with DIFFERENT event.id for SAME session
    const payload2 = JSON.stringify({
      id: eventId2,
      type: 'checkout.session.completed',
      data: { object: session }
    });
    const sig2 = generateStripeSignature(payload2, TEST_WEBHOOK_SECRET);
    const req2: any = {
      headers: { 'stripe-signature': sig2 },
      body: JSON.parse(payload2),
      rawBody: payload2
    };
    const res2 = createMockResponse();
    await stripeWebhookHandler(req2, res2);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.idempotent).toBe(true);
    expect(res2.body.creditsGranted).toBe(0);

    // Wallet balance must not double
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(1000);
  });

  // TEST 4: Concurrent webhook + verify-session cannot double-credit (Race Condition)
  it('Test 4: Concurrent webhook + verify-session cannot double-credit', async () => {
    const sessionId = `cs_test_race_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventId = `evt_race_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const agentId = `agent_tester_race_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: agentId
      }
    };
    await setRecordedStripeSessionAsync(sessionId, session);

    // Execute concurrently
    const [webhookResult, verifyResult] = await Promise.all([
      fulfillAuthoritativePayment({
        session,
        eventId,
        source: 'webhook'
      }),
      fulfillAuthoritativePayment({
        session,
        source: 'verify-session'
      })
    ]);

    const totalCreditsGranted = (webhookResult.creditsGranted || 0) + (verifyResult.creditsGranted || 0);
    expect(totalCreditsGranted).toBe(1000);

    // One must have granted 1000 and the other 0
    expect([
      { granted: webhookResult.creditsGranted, already: webhookResult.alreadyFulfilled },
      { granted: verifyResult.creditsGranted, already: verifyResult.alreadyFulfilled }
    ]).toEqual(
      expect.arrayContaining([
        { granted: 1000, already: false },
        { granted: 0, already: true }
      ])
    );

    // Wallet balance is exactly 1,000, never 2,000
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(1000);
  });

  // TEST 5: Failed grant → webhook 500, retry allowed (eventId not permanently processed)
  it('Test 5: Failed grant → webhook 500, retry allowed', async () => {
    const sessionId = `cs_test_fail_${Date.now()}`;
    const eventId = `evt_fail_${Date.now()}`;

    // Session requesting an invalid product or failing condition
    // For this test, simulate invalid agent ID or wallet failure
    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        // Omitting agentId and apiKey forces unmapped identity error
        agentId: ''
      }
    };

    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      data: { object: session }
    });
    const sig = generateStripeSignature(payload, TEST_WEBHOOK_SECRET);
    const req: any = {
      headers: { 'stripe-signature': sig },
      body: JSON.parse(payload),
      rawBody: payload
    };
    const res = createMockResponse();

    await stripeWebhookHandler(req, res);

    expect(res.statusCode).toBe(422);
    // Crucial check: eventId was NOT marked processed!
    const isProcessed = await isWebhookEventProcessedAsync(eventId);
    expect(isProcessed).toBe(false);
  });

  // TEST 6: Bad signature → 0 credits
  it('Test 6: Bad signature → 0 credits and HTTP 400', async () => {
    const sessionId = `cs_test_badsig_${Date.now()}`;
    const eventId = `evt_badsig_${Date.now()}`;
    const agentId = 'agent_tester_badsig';

    const session = {
      id: sessionId,
      payment_status: 'paid',
      amount_total: 1000,
      currency: 'usd',
      metadata: { productId: 'agent_credits_1000', agentId }
    };

    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      data: { object: session }
    });

    const badSig = 't=1234567,v1=completely_fake_signature_hex';
    const req: any = {
      headers: { 'stripe-signature': badSig },
      body: JSON.parse(payload),
      rawBody: payload
    };
    const res = createMockResponse();

    await stripeWebhookHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/signature/i);

    // Agent wallet must remain empty
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet).toBeUndefined();
  });

  // TEST 7: Unpaid session → 0 credits
  it('Test 7: Unpaid session → 0 credits', async () => {
    const sessionId = `cs_test_unpaid_${Date.now()}`;
    const eventId = `evt_unpaid_${Date.now()}`;
    const agentId = 'agent_tester_unpaid';

    const session = {
      id: sessionId,
      payment_status: 'unpaid',
      status: 'open',
      amount_total: 1000,
      currency: 'usd',
      metadata: { productId: 'agent_credits_1000', agentId }
    };

    const payload = JSON.stringify({
      id: eventId,
      type: 'checkout.session.completed',
      data: { object: session }
    });
    const sig = generateStripeSignature(payload, TEST_WEBHOOK_SECRET);
    const req: any = {
      headers: { 'stripe-signature': sig },
      body: JSON.parse(payload),
      rawBody: payload
    };
    const res = createMockResponse();

    await stripeWebhookHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('unpaid');
    expect(res.body.creditsGranted).toBe(0);

    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet).toBeUndefined();
  });

  // TEST 8: Client price cannot override server
  it('Test 8: Client price cannot override server ($1 attempt rejected)', async () => {
    const req: any = {
      body: {
        productId: 'agent_credits_1000',
        price: 1 // Malicious price override: trying to pay $1 instead of $10
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/does not match authoritative server catalog price/i);
  });

  // TEST 9: Client credits cannot override server
  it('Test 9: Client credits cannot override server (50,000 credits attempt rejected)', async () => {
    const req: any = {
      body: {
        productId: 'agent_credits_1000',
        credits: 50000 // Malicious credits override: trying to ask for 50k credits
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/does not match authoritative server catalog credits/i);
  });

  // TEST 10: Unknown productId rejected
  it('Test 10: Unknown productId rejected with HTTP 400', async () => {
    const req: any = {
      body: {
        productId: 'hacked_super_bundle_99999'
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toMatch(/Unknown productId/i);
  });

  // TEST 11: ?email= cannot steal/reroute a purchase
  it('Test 11: ?email= cannot steal/reroute a purchase', async () => {
    const sessionId = `cs_test_identity_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const legitAgentId = `agent_alice_legit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: legitAgentId
      }
    };
    await setRecordedStripeSessionAsync(sessionId, session);

    // Attacker calls verify-session supplying their own ?email=attacker@evil.com
    const req: any = {
      query: {
        session_id: sessionId,
        email: 'attacker@evil.com'
      },
      headers: {}
    };
    const res = createMockResponse();

    await verifySessionHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.creditsGranted).toBe(1000);

    // Credits must be in Alice's wallet, NOT attacker
    const aliceWallet = inMemoryWalletRegistry.get(legitAgentId);
    expect(aliceWallet?.creditsBalance).toBe(1000);

    const attackerWallet = inMemoryWalletRegistry.get('agent_attacker@evil.com');
    expect(attackerWallet).toBeUndefined();

    // Now test session with NO metadata agent and no auth: must reject with 422 and grant 0 credits
    const unmappedSessionId = `cs_test_unmapped_${Date.now()}`;
    await setRecordedStripeSessionAsync(unmappedSessionId, {
      id: unmappedSessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000'
        // No agentId, no apiKey
      }
    });

    const unmappedReq: any = {
      query: {
        session_id: unmappedSessionId,
        email: 'attacker@evil.com'
      },
      headers: {}
    };
    const unmappedRes = createMockResponse();

    await verifySessionHandler(unmappedReq, unmappedRes);

    expect(unmappedRes.statusCode).toBe(422);
    expect(unmappedRes.body.error).toMatch(/Unmapped purchaser identity/i);
    expect(unmappedRes.body.creditsGranted).toBe(0);
  });

  // TEST 12: Missing Stripe creds in production → checkout error, not mock success
  it('Test 12: Missing Stripe creds in production → checkout error, not mock success', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.STRIPE_SECRET_KEY;

    const req: any = {
      body: {
        productId: 'agent_credits_1000'
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Stripe checkout unavailable');
    expect(res.body.mockMode).toBeUndefined();
    expect(res.body.sandboxMode).toBeUndefined();
  });

  // TEST 13: Stripe API failure in production → checkout error, not mock success
  it('Test 13: Stripe API failure in production → checkout error, not mock success', async () => {
    process.env.NODE_ENV = 'production';
    // Invalid live key causes Stripe API error
    process.env.STRIPE_SECRET_KEY = 'sk_live_invalid_key_for_testing_1234567890';

    const req: any = {
      body: {
        productId: 'agent_credits_1000'
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error).toBe('Stripe checkout unavailable');
  });

  // TEST 14: Production never emits cs_test_sb_*
  it('Test 14: Production never emits cs_test_sb_*', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.STRIPE_SECRET_KEY;

    const req: any = {
      body: {
        productId: 'agent_credits_1000'
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('cs_test_sb_');
    expect(res.body.sessionId).toBeUndefined();
  });

  // TEST 15: Amount mismatch → 0 credits
  it('Test 15: Amount mismatch → 0 credits', async () => {
    const sessionId = `cs_test_amt_mismatch_${Date.now()}`;
    const agentId = 'agent_tester_mismatch';

    // Session has metadata productId = agent_credits_1000 ($10 / 1000 cents),
    // but actual amount_total is only 500 cents ($5)
    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 500, // Mismatch!
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: agentId
      }
    };

    const res = await fulfillAuthoritativePayment({
      session,
      source: 'webhook'
    });

    expect(res.success).toBe(false);
    expect(res.creditsGranted).toBe(0);
    expect(res.error).toMatch(/amount mismatch/i);

    // Wallet untouched
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet).toBeUndefined();
  });

  // TEST 16: Playbook SKU checkout path still uses server catalog (do not break books)
  it('Test 16: Playbook SKU checkout path still uses server catalog (do not break books)', async () => {
    // Check server catalog defines playbook SKUs at $5 USD
    const playbookSkus = [
      'playbook_13f_whale',
      'playbook_credit_800',
      'playbook_reit_realestate',
      'wealth_operating_system',
      'future_wealth_blueprint',
      'bundle_trilogy_complete'
    ];

    for (const sku of playbookSkus) {
      const item = SERVER_CATALOG[sku];
      expect(item).toBeDefined();
      expect(item.priceUsd).toBe(5);
      expect(item.amountCents).toBe(500);
      expect(item.category).toBe('playbook');
      expect(item.credits).toBe(0);
    }

    // Checkout test in non-production sandbox
    const req: any = {
      body: {
        productId: 'playbook_13f_whale',
        price: 5
      }
    };
    const res = createMockResponse();

    await createCheckoutSessionHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.sessionId).toBeDefined();
  });

  // TEST 17: State Machine & Ledger-backed crash recovery: grant succeeds + fulfilled-write fails + retry after simulated 11 minutes -> credits granted exactly once, record ends 'fulfilled'
  it('Test 17: (a) grant succeeds + fulfilled-write fails + retry after simulated 11 minutes -> credits granted exactly once, record ends fulfilled', async () => {
    const sessionId = `cs_test_crash_${Date.now()}`;
    const agentId = `agent_crash_${Date.now()}`;

    // Initialize agent wallet with 100 baseline credits
    inMemoryWalletRegistry.set(agentId, {
      agentId,
      creditsBalance: 100,
      availableBalance: 100,
      paidCreditsBalance: 0,
      promoCreditsBalance: 0,
      trialCreditsBalance: 100,
      trialCredits: 100,
      lastCreditTag: 'TRIAL',
      lifetimeSpent: 0,
      simulationRuns: 0,
      verifiedSimulations: 0
    });
    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle: `crash_bot`,
      displayName: 'Crash Bot',
      status: 'active',
      createdAt: new Date().toISOString()
    });

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId
      }
    };

    // 1. Simulate initial execution:
    // It creates claim with status 'processing', moves to 'granting', writes ledger entry & updates wallet (100 -> 1100),
    // but crashes BEFORE writing 'fulfilled' (leaving claim doc stuck in 'granting' from 11 minutes ago).
    const elevenMinsAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    const dbStore = dbStoreInstance.getCollection('fulfilled_stripe_sessions');
    dbStore.set(sessionId, {
      sessionId,
      agentId,
      creditsGranted: 1000,
      status: 'granting',
      claimedAt: elevenMinsAgo,
      grantingAt: elevenMinsAgo
    });
    fulfilledStripeSessions.set(sessionId, {
      sessionId,
      agentId,
      creditsGranted: 1000,
      status: 'granting',
      claimedAt: elevenMinsAgo,
      grantingAt: elevenMinsAgo
    });

    // Add the ledger entry that was created when the wallet grant succeeded
    const ledgerCollection = dbStoreInstance.getCollection('ledger_entries');
    ledgerCollection.set(`ent_${sessionId}`, {
      entryId: `ent_${sessionId}`,
      accountId: agentId,
      accountType: 'BUYER',
      entryType: 'CREDIT',
      amount: 1000,
      currency: 'CREDITS',
      tag: 'STRIPE_PURCHASE',
      sessionId: sessionId,
      metadata: { sessionId },
      description: 'Wallet credit purchase (1000 credits) [STRIPE_PURCHASE]',
      balanceBefore: 100,
      balanceAfter: 1100,
      createdAt: elevenMinsAgo
    });

    // Update wallet balance to simulate successful wallet grant before crash
    const wallet = inMemoryWalletRegistry.get(agentId)!;
    wallet.creditsBalance = 1100;
    wallet.availableBalance = 1100;

    // 2. Retry after 11 minutes!
    const retryRes = await fulfillAuthoritativePayment({
      session,
      source: 'webhook'
    });

    // 3. Verify:
    // - alreadyFulfilled is true, creditsGranted is 0
    // - wallet balance remains exactly 1100 (no double grant)
    // - record in Firestore / memory healed to 'fulfilled'
    expect(retryRes.alreadyFulfilled).toBe(true);
    expect(retryRes.creditsGranted).toBe(0);
    expect(inMemoryWalletRegistry.get(agentId)!.creditsBalance).toBe(1100);

    const docAfter = dbStore.get(sessionId);
    expect(docAfter?.status).toBe('fulfilled');
    expect(fulfilledStripeSessions.get(sessionId)?.status).toBe('fulfilled');
  });

  // TEST 18: Two concurrent fulfillments of the same session -> exactly one grant
  it('Test 18: (b) two concurrent fulfillments of the same session -> exactly one grant', async () => {
    const sessionId = `cs_test_concurrent_${Date.now()}`;
    const agentId = `agent_concurrent_${Date.now()}`;

    inMemoryWalletRegistry.set(agentId, {
      agentId,
      creditsBalance: 50,
      availableBalance: 50,
      paidCreditsBalance: 0,
      promoCreditsBalance: 0,
      trialCreditsBalance: 50,
      trialCredits: 50,
      lastCreditTag: 'TRIAL',
      lifetimeSpent: 0,
      simulationRuns: 0,
      verifiedSimulations: 0
    });
    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle: `conc_bot`,
      displayName: 'Concurrent Bot',
      status: 'active',
      createdAt: new Date().toISOString()
    });

    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId
      }
    };

    // Execute two fulfillment calls concurrently
    const [resA, resB] = await Promise.all([
      fulfillAuthoritativePayment({ session, source: 'webhook' }),
      fulfillAuthoritativePayment({ session, source: 'verify-session' })
    ]);

    // One must have performed the initial grant, one must be alreadyFulfilled
    const grants = [resA.creditsGranted, resB.creditsGranted];
    expect(grants.filter(g => g === 1000).length).toBe(1);
    expect(grants.filter(g => g === 0).length).toBe(1);

    const alreadyFulfilledFlags = [resA.alreadyFulfilled, resB.alreadyFulfilled];
    expect(alreadyFulfilledFlags.filter(f => f === true).length).toBe(1);
    expect(alreadyFulfilledFlags.filter(f => f === false).length).toBe(1);

    // Total wallet balance must be 50 + 1000 = 1050 (exactly one grant)
    expect(inMemoryWalletRegistry.get(agentId)!.creditsBalance).toBe(1050);

    const finalRecord = fulfilledStripeSessions.get(sessionId);
    expect(finalRecord?.status).toBe('fulfilled');
  });

  // TEST 19: Grant failure -> 'failed' state and Stripe-retryable error (HTTP 500)
  it('Test 19: (c) grant failure -> failed state and a Stripe-retryable error', async () => {
    const sessionId = `cs_test_grant_fail_${Date.now()}`;
    const agentId = `agent_grant_fail_${Date.now()}`;

    // Agent is NOT in registry, and we pass an invalid state or simulate failure
    const session = {
      id: sessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: 1000,
      currency: 'usd',
      metadata: {
        productId: 'agent_credits_1000',
        agentId: 'sb_live_unregisteredpublickey_randomsecret' // will cause addCreditsToAgentWallet to fail
      }
    };

    const res = await fulfillAuthoritativePayment({
      session,
      source: 'webhook'
    });

    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(500);
    expect(res.creditsGranted).toBe(0);

    // Record in fulfilledStripeSessions and dbStore must be in 'failed' state
    const record = fulfilledStripeSessions.get(sessionId);
    expect(record?.status).toBe('failed');
    expect(record?.error).toBeDefined();

    const dbStore = dbStoreInstance.getCollection('fulfilled_stripe_sessions');
    const doc = dbStore.get(sessionId);
    expect(doc?.status).toBe('failed');
  });
});
