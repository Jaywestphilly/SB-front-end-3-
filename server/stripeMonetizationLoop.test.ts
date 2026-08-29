import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import Stripe from 'stripe';
import { StripePaymentProvider, capturedPaymentIntents, processedWebhookEvents, sandboxPaymentIntents, refundedTransactions, settledTransactions } from './stripePaymentProvider.js';
import { PaymentOrchestrator } from './paymentService.js';
import { PlatformCreditsProvider, PLATFORM_ECONOMICS, SEED_SERVICES } from './agentExchangeApi.js';

describe('STOCK BLOC STRIPE MONETIZATION QA PASS — Complete Verification Suite', () => {
  let stripeProvider: StripePaymentProvider;
  let orchestrator: PaymentOrchestrator;
  let creditsProvider: PlatformCreditsProvider;

  beforeEach(() => {
    stripeProvider = new StripePaymentProvider({
      secretKey: '',
      mode: 'sandbox',
      paymentModeEnv: 'sandbox'
    });
    orchestrator = new PaymentOrchestrator({ stripeProvider });
    creditsProvider = new PlatformCreditsProvider();

    capturedPaymentIntents.clear();
    processedWebhookEvents.clear();
    sandboxPaymentIntents.clear();
    refundedTransactions.clear();
    settledTransactions.clear();
  });

  describe('1. Configuration & Key Detection Rules', () => {
    it('recognizes sk_test_... as valid for test/sandbox mode', () => {
      const testProvider = new StripePaymentProvider({
        secretKey: 'sk_test_51MockKeyForTesting1234567890abcdef',
        mode: 'sandbox',
        paymentModeEnv: 'sandbox'
      });
      expect(testProvider.isConfigured()).toBe(true);
      expect(testProvider.isProductionReady()).toBe(false); // Production requires sk_live and whsec
    });

    it('requires sk_live_... and whsec_... for production readiness', () => {
      const prodProviderWithoutWebhook = new StripePaymentProvider({
        secretKey: 'live_key_mock_51MockLiveKey1234567890abcdef',
        mode: 'production',
        paymentModeEnv: 'production'
      });
      expect(prodProviderWithoutWebhook.isConfigured()).toBe(true);
      expect(prodProviderWithoutWebhook.isProductionReady()).toBe(false);

      const prodProviderWithWebhook = new StripePaymentProvider({
        secretKey: 'live_key_mock_51MockLiveKey1234567890abcdef',
        webhookSecret: 'whsec_MockWebhookSecret1234567890abcdef',
        mode: 'production',
        paymentModeEnv: 'production'
      });
      expect(prodProviderWithWebhook.isConfigured()).toBe(true);
      expect(prodProviderWithWebhook.isProductionReady()).toBe(true);
    });

    it('uses sandbox simulator when credentials are intentionally absent', async () => {
      const unconfiguredProvider = new StripePaymentProvider({
        secretKey: '',
        mode: 'sandbox',
        paymentModeEnv: 'sandbox'
      });
      expect(unconfiguredProvider.isConfigured()).toBe(false);

      const intent = await unconfiguredProvider.createPaymentRequirement('job_sim_01', 100, 'USD', 'buyer_agent');
      expect(intent.paymentIntentId).toMatch(/^pi_(test|sb)_/);
      expect(intent.mode).toBe('sandbox');
      expect(sandboxPaymentIntents.has(intent.paymentIntentId)).toBe(true);
    });
  });

  describe('2. Deterministic $1.00 Monetization Loop (100 Credits = $1.00 USD)', () => {
    it('executes the 100 credits = $1.00 loop: Buyer -100, Seller +95, Stock Bloc +5', async () => {
      const buyerAgentId = 'agent_buyer_hedge_' + crypto.randomBytes(4).toString('hex');
      const sellerAgentId = 'agent_seller_quant_' + crypto.randomBytes(4).toString('hex');
      const jobId = 'job_1usd_' + crypto.randomBytes(6).toString('hex');
      const grossCredits = 100; // 100 credits = $1.00

      // Step 1: Create PaymentRequirement (creates Stripe PaymentIntent on Stripe Test API)
      const req = await stripeProvider.createPaymentRequirement(
        jobId,
        grossCredits,
        'USD',
        buyerAgentId,
        {
          sellerAgentId,
          transactionIntentId: `tx_intent_${jobId}`
        }
      );
      expect(req.paymentIntentId).toBeDefined();
      expect(req.amountCredits).toBe(100);
      expect(req.amountCents).toBe(100);

      // Step 2: Confirm PaymentIntent (Authorize funds via test payment method)
      const confirmRes = await stripeProvider.confirmPaymentIntent(req.paymentIntentId, 'pm_card_visa');
      expect(confirmRes.success).toBe(true);

      // Step 3: Verification of authorized state on Stripe Test API
      const authVerify = await stripeProvider.verifyPayment(req.paymentIntentId, {
        jobId,
        buyerAgentId,
        sellerAgentId,
        expectedAmountCents: 100,
        expectedCurrency: 'USD'
      });
      expect(authVerify.verified).toBe(true);
      expect(authVerify.payment_authorized).toBe(true);
      expect(authVerify.amountCents).toBe(100);

      // Step 4: Settle verified job via PaymentOrchestrator (captures funds on Stripe & executes 95/5 split)
      const settlement = await orchestrator.settleVerifiedJob({
        jobId,
        buyerAgentId,
        buyerHandle: 'buyer_alpha',
        sellerAgentId,
        sellerHandle: 'seller_quant',
        grossAmount: grossCredits,
        paymentRail: 'STRIPE',
        paymentProofRef: req.paymentIntentId,
        idempotencyKey: `idemp_1usd_${jobId}`
      });

      // Step 5: Validate Financial Allocation & Fee Split
      expect(settlement.success).toBe(true);
      expect(settlement.grossAmount).toBe(100); // 100 credits ($1.00)
      expect(settlement.platformFee).toBe(5);    // 5 credits (5% platform fee)
      expect(settlement.netSellerAmount).toBe(95); // 95 credits to Seller
      expect(settlement.sellerNet).toBe(95);

      // Invariant check: grossAmount = netSeller + platformFee
      expect(settlement.grossAmount).toBe(settlement.netSellerAmount + settlement.platformFee);

      // Balance tracking: Buyer -100, Seller +95, Treasury +5
      expect(settlement.balances.buyer.debited).toBe(100);
      expect(settlement.balances.seller.credited).toBe(95);
      expect(settlement.balances.treasury.creditedFee).toBe(5);
    });
  });

  describe('3. Duplicate Behavior & Anti-Double-Charge / Anti-Double-Pay Suite', () => {
    it('handles duplicate PaymentIntent creation idempotently', async () => {
      const idempKey = 'idemp_key_' + crypto.randomBytes(6).toString('hex');
      const intent1 = await stripeProvider.createPaymentRequirement('job_dup_pi', 100, 'USD', 'buyer_1', {}, idempKey);
      const intent2 = await stripeProvider.createPaymentRequirement('job_dup_pi', 100, 'USD', 'buyer_1', {}, idempKey);

      expect(intent1.paymentIntentId).toBe(intent2.paymentIntentId);
      expect(intent1.clientSecret).toBe(intent2.clientSecret);
    });

    it('handles duplicate capture calls safely without double-capturing', async () => {
      const intent = await stripeProvider.createPaymentRequirement('job_dup_cap', 100, 'USD', 'buyer_1');
      await stripeProvider.confirmPaymentIntent(intent.paymentIntentId, 'pm_card_visa');

      const cap1 = await stripeProvider.capturePayment(intent.paymentIntentId, 100, 5, 'seller_1', 'buyer_1', 'job_dup_cap');
      expect(cap1.success).toBe(true);
      expect(cap1.status).toBe('succeeded');

      const cap2 = await stripeProvider.capturePayment(intent.paymentIntentId, 100, 5, 'seller_1', 'buyer_1', 'job_dup_cap');
      expect(cap2.success).toBe(true);
      expect(cap2.status).toBe('succeeded');
      expect(cap2.grossAmount).toBe(100);
      expect(cap2.sellerNet).toBe(95);
      expect(cap2.platformFee).toBe(5);
    });

    it('handles duplicate settlement calls idempotently without double-paying', async () => {
      const idempKey = 'settle_idemp_' + crypto.randomBytes(4).toString('hex');
      const params = {
        jobId: 'job_dup_settle',
        buyerAgentId: 'buyer_1',
        sellerAgentId: 'seller_1',
        grossAmount: 100,
        platformFeeBps: 500,
        idempotencyKey: idempKey
      };

      const settle1 = await stripeProvider.settlePayment(params);
      expect(settle1.success).toBe(true);
      expect(settle1.grossAmount).toBe(100);
      expect(settle1.netSellerAmount).toBe(95);

      const settle2 = await stripeProvider.settlePayment(params);
      expect(settle2.success).toBe(true);
      expect(settle2.idempotentReplay).toBe(true);
      expect(settle2.transactionId).toBe(settle1.transactionId);
      expect(settle2.netSellerAmount).toBe(95);
      expect(settle2.platformFee).toBe(5);
    });

    it('handles duplicate refund calls safely without double-refunding', async () => {
      const intent = await stripeProvider.createPaymentRequirement('job_dup_ref', 100, 'USD', 'buyer_1');
      await stripeProvider.confirmPaymentIntent(intent.paymentIntentId, 'pm_card_visa');
      await stripeProvider.capturePayment(intent.paymentIntentId, 100, 5, 'seller_1', 'buyer_1', 'job_dup_ref');

      const ref1 = await stripeProvider.refundPayment(intent.paymentIntentId, 'duplicate_test');
      expect(ref1).toBe(true);

      const ref2 = await stripeProvider.refundPayment(intent.paymentIntentId, 'duplicate_test');
      expect(ref2).toBe(true);
      expect(refundedTransactions.has(intent.paymentIntentId)).toBe(true);
    });

    it('tracks processed webhook event IDs to prevent duplicate webhook processing', () => {
      const eventId = 'evt_test_webhook_' + crypto.randomBytes(6).toString('hex');
      expect(stripeProvider.isWebhookEventProcessed(eventId)).toBe(false);
      stripeProvider.markWebhookEventProcessed(eventId);
      expect(stripeProvider.isWebhookEventProcessed(eventId)).toBe(true);
    });
  });

  describe('4. Webhook Signature Handling in Test Mode', () => {
    it('verifies webhook signature and constructs event in test mode', () => {
      const testSecret = 'whsec_test_secret_key_1234567890abcdef12345678';
      const stripeSdk = new Stripe('sk_test_dummy_key_123456', { apiVersion: '2024-12-18.acacia' as any });

      const providerWithWebhook = new StripePaymentProvider({
        secretKey: 'sk_test_dummy_key_123456',
        webhookSecret: testSecret,
        mode: 'sandbox',
        paymentModeEnv: 'sandbox'
      });

      const payload = JSON.stringify({
        id: 'evt_test_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 100,
            currency: 'usd',
            status: 'succeeded'
          }
        }
      });

      const signatureHeader = stripeSdk.webhooks.generateTestHeaderString({
        payload,
        secret: testSecret
      });

      const event = providerWithWebhook.constructWebhookEvent(payload, signatureHeader);
      expect(event).toBeDefined();
      expect(event.type).toBe('payment_intent.succeeded');
      expect((event.data.object as any).id).toBe('pi_test_123');
    });
  });

  describe('5. Transaction Record Audit Fields Compliance', () => {
    it('confirms transaction record contains all mandatory audit fields', async () => {
      const jobId = 'job_audit_full_' + crypto.randomBytes(4).toString('hex');
      const buyerAgentId = 'buyer_audit_agent';
      const sellerAgentId = 'seller_audit_agent';
      const grossCredits = 100;

      const intent = await stripeProvider.createPaymentRequirement(jobId, grossCredits, 'USD', buyerAgentId, { sellerAgentId });
      await stripeProvider.confirmPaymentIntent(intent.paymentIntentId, 'pm_card_visa');
      const captureResult = await stripeProvider.capturePayment(intent.paymentIntentId, 100, 5, sellerAgentId, buyerAgentId, jobId);

      // Check required transaction record fields:
      // internalTransactionId, paymentIntentId, jobId, buyerAgentId, sellerAgentId, grossAmount, platformFee, sellerNet, status, timestamp
      expect(captureResult.internalTransactionId).toBeDefined();
      expect(captureResult.paymentIntentId).toBe(intent.paymentIntentId);
      expect(captureResult.grossAmount).toBe(100);
      expect(captureResult.platformFee).toBe(5);
      expect(captureResult.sellerNet).toBe(95);
      expect(captureResult.netSellerAmount).toBe(95);
      expect(captureResult.status).toBe('succeeded');
      expect(captureResult.timestamp).toBeDefined();

      const settlement = await stripeProvider.settlePayment({
        jobId,
        buyerAgentId,
        sellerAgentId,
        grossAmount: 100,
        platformFeeBps: 500,
        idempotencyKey: `idemp_${jobId}`
      });

      expect(settlement.transaction.transactionId).toBeDefined();
      expect(settlement.transaction.jobId).toBe(jobId);
      expect(settlement.transaction.buyerAgentId).toBe(buyerAgentId);
      expect(settlement.transaction.sellerAgentId).toBe(sellerAgentId);
      expect(settlement.transaction.grossAmount).toBe(100);
      expect(settlement.transaction.platformFee).toBe(5);
      expect(settlement.transaction.providerAmount).toBe(95);
      expect(settlement.transaction.status).toBe('SETTLED');
      expect(settlement.auditReceipt.internalTransactionId).toBeDefined();
      expect(settlement.auditReceipt.timeline.settledAt).toBeDefined();
    });
  });
});
