import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  validateProductionStartupSafety,
  getSystemReadinessStatus
} from './agentSecurity.js';
import {
  PolkadotUsdcPaymentProvider,
  clearPolkadotReplayRegistry,
  usedBlockchainTransactions
} from './polkadotPaymentProvider.js';
import {
  StripePaymentProvider,
  capturedPaymentIntents,
  refundedTransactions
} from './stripePaymentProvider.js';
import {
  PaymentOrchestrator,
  isValidStateTransition
} from './paymentService.js';
import {
  PlatformCreditsProvider,
  PLATFORM_ECONOMICS
} from './agentExchangeApi.js';

describe('FINAL PRODUCTION-READINESS PASS — Verification Suite', () => {
  beforeEach(() => {
    clearPolkadotReplayRegistry();
    capturedPaymentIntents.clear();
    refundedTransactions.clear();
  });

  describe('1. Production Startup Safety & Fail-Fast Validator', () => {
    it('throws error immediately in production when critical credentials are missing', () => {
      const origEnv = process.env.AGENT_ENV;
      const origNodeEnv = process.env.NODE_ENV;
      const origKey = process.env.AGENT_PLATFORM_MASTER_KEY;

      try {
        process.env.AGENT_ENV = 'production';
        process.env.AGENT_PLATFORM_MASTER_KEY = 'insecure_default_key';

        expect(() => validateProductionStartupSafety()).toThrow(/Production Startup Safety Check Failed|CRITICAL/);
      } finally {
        process.env.AGENT_ENV = origEnv;
        process.env.NODE_ENV = origNodeEnv;
        process.env.AGENT_PLATFORM_MASTER_KEY = origKey;
      }
    });

    it('validates production startup smoothly in development/sandbox mode', () => {
      const origEnv = process.env.AGENT_ENV;
      process.env.AGENT_ENV = 'sandbox';
      expect(() => validateProductionStartupSafety()).not.toThrow();
      process.env.AGENT_ENV = origEnv;
    });
  });

  describe('2. System Readiness Endpoint Model', () => {
    it('returns structured readiness status model with all core security and settlement components', () => {
      const readiness = getSystemReadinessStatus();
      expect(readiness).toBeDefined();
      expect(readiness.status).toMatch(/READY|CONFIGURATION_REQUIRED|NOT_READY/);
      expect(readiness.components).toBeDefined();
      expect(readiness.components.authentication).toBeDefined();
      expect(readiness.components.paymentRails).toBeDefined();
      expect(readiness.components.paymentRails.PLATFORM_CREDITS).toBeDefined();
      expect(readiness.components.paymentRails.POLKADOT_USDC).toBeDefined();
      expect(readiness.components.paymentRails.STRIPE).toBeDefined();
    });
  });

  describe('3-8. Evidence-Based Polkadot USDC Verification & Anti-Replay', () => {
    it('generates valid payment requirement and tracks expected parameters', async () => {
      const provider = new PolkadotUsdcPaymentProvider();
      const req = await provider.createPaymentRequirement('job_test_001', 50, 'USDC', 'buyer_agent_1');

      expect(req.paymentRef).toMatch(/^dot_req_/);
      expect(req.amount).toBe(50);
      expect(req.currency).toBe('USDC');
      expect(req.status).toBe('pending');
      expect(req.network).toBe('polkadot-asset-hub');
    });

    it('rejects invalid or missing extrinsic hash formats', async () => {
      const provider = new PolkadotUsdcPaymentProvider();
      const res = await provider.verifyPayment('dot_req_test', { txHash: 'not_a_valid_hash' });
      expect(res.verified).toBe(false);
      expect(res.ruleFailures).toContain('RULE_1_INVALID_HASH_FORMAT');
    });

    it('detects and prevents blockchain transaction replay attacks', async () => {
      const provider = new PolkadotUsdcPaymentProvider();
      const txHash = '0x' + crypto.randomBytes(32).toString('hex');

      // Register used transaction
      usedBlockchainTransactions.set(txHash, {
        settledAt: new Date().toISOString(),
        jobId: 'job_original_01',
        transactionId: 'tx_original_01'
      });

      const res = await provider.verifyPayment('dot_req_test', { txHash });
      expect(res.verified).toBe(false);
      expect(res.error).toMatch(/Replay Detected/);
      expect(res.ruleFailures).toContain('RULE_10_REPLAY_ATTACK_DETECTED');
    });

    it('rejects mismatched recipient address or asset ID against expected requirements', async () => {
      const provider = new PolkadotUsdcPaymentProvider();
      const txHash = '0x' + crypto.randomBytes(32).toString('hex');
      const req = await provider.createPaymentRequirement('job_test_002', 100, 'USDC');

      const res = await provider.verifyPayment(req.paymentRef, {
        txHash,
        amount: 100,
        recipientAddress: '1WrongRecipientAddressxxxxxxxxxxxxxxxxxxxxxxxx',
        assetId: '999999'
      });

      expect(res.verified).toBe(false);
      expect(res.ruleFailures?.some(r => r.includes('RECIPIENT_MISMATCH'))).toBe(true);
      expect(res.ruleFailures?.some(r => r.includes('ASSET_ID_MISMATCH'))).toBe(true);
    });
  });

  describe('9-12. Stripe Payment Provider Hardening & Idempotency', () => {
    it('verifies state transitions and prevents double-capture of payment intents', async () => {
      const provider = new StripePaymentProvider();
      const req = await provider.createPaymentRequirement('job_01', 100, 'USD', 'buyer_01', { sellerAgentId: 'seller_01' });
      const intentId = req.paymentRef;

      // Capture once
      const cap1 = await provider.capturePayment(intentId, 100, 5, 'seller_01', 'buyer_01', 'job_01');
      expect(cap1.success).toBe(true);
      expect(cap1.grossAmount).toBe(100);
      expect(cap1.netSellerAmount).toBe(95);

      // Capture twice (idempotent duplicate prevention)
      const cap2 = await provider.capturePayment(intentId, 100, 5, 'seller_01', 'buyer_01', 'job_01');
      expect(cap2.success).toBe(true);
      expect(capturedPaymentIntents.has(intentId)).toBe(true);
    });

    it('verifies anti-double-refund check', async () => {
      const provider = new StripePaymentProvider();
      const req = await provider.createPaymentRequirement('job_02', 100, 'USD', 'buyer_01', { sellerAgentId: 'seller_01' });
      const intentId = req.paymentRef;

      const ref1 = await provider.refundPayment(intentId, 'Job cancelled');
      expect(ref1).toBe(true);
      expect(refundedTransactions.has(intentId)).toBe(true);

      const ref2 = await provider.refundPayment(intentId, 'Job cancelled again');
      expect(ref2).toBe(true);
    });
  });

  describe('13-15. Financial Invariants & Conservation of Value', () => {
    it('strictly satisfies gross = netSellerAmount + platformFee invariant across double-entry ledger', async () => {
      const provider = new PlatformCreditsProvider();
      const buyerId = 'agent_buyer_inv_' + crypto.randomBytes(4).toString('hex');
      const sellerId = 'agent_seller_inv_' + crypto.randomBytes(4).toString('hex');

      await provider.getOrCreateWallet(buyerId, 1000);
      await provider.getOrCreateWallet(sellerId, 0);

      const grossAmount = 250;
      const feeBps = PLATFORM_ECONOMICS.platformFeeBps; // 500 bps = 5%
      const expectedFee = Math.max(1, Math.round((grossAmount * feeBps) / 10000));
      const expectedNet = grossAmount - expectedFee;

      const testNonce = crypto.randomBytes(4).toString('hex');
      const settlement = await provider.settlePayment({
        jobId: `job_inv_${testNonce}`,
        buyerAgentId: buyerId,
        sellerAgentId: sellerId,
        grossAmount,
        platformFeeBps: feeBps,
        idempotencyKey: `idemp_inv_${testNonce}`,
        currency: 'CREDITS',
        paymentRail: 'PLATFORM_CREDITS',
        description: 'Invariant settlement test'
      });

      expect(settlement.grossAmount).toBe(grossAmount);
      expect(settlement.platformFee).toBe(expectedFee);
      expect(settlement.netSellerAmount).toBe(expectedNet);
      expect(settlement.grossAmount).toBe(settlement.netSellerAmount + settlement.platformFee);

      // Verify wallet balances match exact ledger math
      const buyerWallet = await provider.getProviderBalance(buyerId);
      const sellerWallet = await provider.getProviderBalance(sellerId);
      expect(buyerWallet.creditsBalance).toBe(1000 - grossAmount);
      expect(sellerWallet.creditsBalance).toBe(expectedNet);
    });

    it('enforces atomic escrow authorization, retention, and release lifecycle', async () => {
      const orchestrator = new PaymentOrchestrator();
      const buyerId = 'agent_escrow_' + crypto.randomBytes(4).toString('hex');
      const creditsProvider = new PlatformCreditsProvider();

      await creditsProvider.getOrCreateWallet(buyerId, 500);

      // Step 1: Authorize Escrow
      const escrow = await orchestrator.authorizeEscrow({
        buyerAgentId: buyerId,
        amount: 200,
        jobId: 'job_escrow_01'
      });

      expect(escrow.success).toBe(true);
      expect(escrow.availableBalance).toBe(300);
      expect(escrow.reservedBalance).toBe(200);

      // Step 2: Release Escrow (e.g. cancellation)
      const released = await orchestrator.releaseEscrow(buyerId, 200);
      expect(released).toBe(true);

      const wallet = await creditsProvider.getProviderBalance(buyerId);
      expect(wallet.availableBalance).toBe(500);
      expect(wallet.reservedBalance).toBe(0);
    });
  });

  describe('16-18. Scoped Authorization & Single-Use Human Approval Tokens', () => {
    it('evaluates spending limits policy and enforces human operator approval above threshold', () => {
      const orchestrator = new PaymentOrchestrator();

      // Under small limit
      const policySmall = orchestrator.evaluateSpendingPolicy(100);
      expect(policySmall.approved).toBe(true);
      expect(policySmall.requiresHumanApproval).toBe(false);

      // High value ($600 = 60,000 credits, above 50,000 threshold)
      const policyHigh = orchestrator.evaluateSpendingPolicy(60000, ['payments:transact']);
      expect(policyHigh.approved).toBe(false);
      expect(policyHigh.requiresHumanApproval).toBe(true);
    });

    it('generates, validates, and strictly consumes single-use human approval tokens', () => {
      const orchestrator = new PaymentOrchestrator();
      const tokenReq = orchestrator.createHumanApprovalRequest({
        txIntentId: 'tx_req_01',
        jobId: 'job_high_val_01',
        amount: 60000,
        buyerAgentId: 'agent_buyer_01',
        sellerAgentId: 'agent_seller_01'
      });

      expect(tokenReq.token).toMatch(/^sb_appr_/);

      // First redemption: success
      const approved = orchestrator.approveTransactionWithToken(tokenReq.token, 'operator_uid_123');
      expect(approved).toBe(true);

      // Second redemption: must fail (anti-reuse protection)
      expect(() => orchestrator.approveTransactionWithToken(tokenReq.token, 'operator_uid_123')).toThrow(/status: APPROVED/);
    });
  });

  describe('Transaction State Machine Transitions', () => {
    it('validates canonical state transitions and rejects illegal skips', () => {
      expect(isValidStateTransition('CREATED', 'PAYMENT_REQUIRED')).toBe(true);
      expect(isValidStateTransition('PAYMENT_AUTHORIZED', 'JOB_ACCEPTED')).toBe(true);
      expect(isValidStateTransition('RESULT_VERIFIED', 'PAYMENT_CAPTURED')).toBe(true);
      expect(isValidStateTransition('PAYMENT_CAPTURED', 'SETTLED')).toBe(true);

      // Illegal jumps
      expect(isValidStateTransition('CREATED', 'SETTLED')).toBe(false);
      expect(isValidStateTransition('JOB_IN_PROGRESS', 'SETTLED')).toBe(false);
      expect(isValidStateTransition('SETTLED', 'CREATED')).toBe(false);
    });
  });
});
