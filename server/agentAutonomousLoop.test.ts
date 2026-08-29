import { describe, it, expect, beforeEach } from 'vitest';
import { dbStoreInstance } from './firebaseAdmin.js';
import {
  PlatformCreditsProvider,
  inMemoryWalletRegistry,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  PLATFORM_TREASURY_ACCOUNT_ID,
  PLATFORM_ECONOMICS
} from './agentExchangeApi.js';
import { generateApiKeyPair, hashSecret, constantTimeCompare } from './agentSecurity.js';
import { PolkadotUsdcPaymentProvider, clearPolkadotReplayRegistry } from './polkadotPaymentProvider.js';
import { StripePaymentProvider } from './stripePaymentProvider.js';
import { paymentOrchestrator, HUMAN_APPROVAL_THRESHOLD_CREDITS } from './paymentService.js';
import { computeCompositeReputation } from './agentReputation.js';

describe('Autonomous Agent Marketplace & Economic Network Loop', () => {
  const buyerId = 'agent_buyer_quant_test';
  const sellerId = 'agent_seller_research_test';

  beforeEach(() => {
    // Clear both in-memory DB store and registry caches
    const wallets = dbStoreInstance.getCollection('agent_wallets');
    const transactions = dbStoreInstance.getCollection('platform_transactions');
    const idempotency = dbStoreInstance.getCollection('idempotency_keys');
    const ledgerEntries = dbStoreInstance.getCollection('ledger_entries');
    const blockchainTxs = dbStoreInstance.getCollection('blockchain_settled_transactions');

    wallets.clear();
    transactions.clear();
    idempotency.clear();
    ledgerEntries.clear();
    blockchainTxs.clear();

    inMemoryWalletRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();
    clearPolkadotReplayRegistry();

    // Fund buyer with 1,000 credits
    inMemoryWalletRegistry.set(buyerId, {
      agentId: buyerId,
      creditsBalance: 1000,
      availableBalance: 1000,
      reservedBalance: 0,
      lifetimeSpent: 0,
      lifetimeEarnings: 0
    });

    // Seller starts with 0
    inMemoryWalletRegistry.set(sellerId, {
      agentId: sellerId,
      creditsBalance: 0,
      availableBalance: 0,
      reservedBalance: 0,
      lifetimeSpent: 0,
      lifetimeEarnings: 0
    });

    // Treasury starts at 0
    inMemoryWalletRegistry.set(PLATFORM_TREASURY_ACCOUNT_ID, {
      agentId: PLATFORM_TREASURY_ACCOUNT_ID,
      creditsBalance: 0,
      availableBalance: 0,
      reservedBalance: 0,
      lifetimeSpent: 0,
      lifetimeEarnings: 0
    });
  });

  it('Phase 1: Generates cryptographically secure API keys with hashed secret storage', () => {
    const { keyId, rawKey, keyRecord } = generateApiKeyPair(buyerId, 'buyer_quant', ['services:read', 'payments:transact']);
    expect(keyId).toBeDefined();
    expect(rawKey).toContain(`sb_live_${keyId}_`);
    expect(keyRecord.keyHash).toBeDefined();
    // Raw secret is never identical to stored keyHash
    expect(rawKey).not.toEqual(keyRecord.keyHash);

    // Constant time comparison works
    const secretPart = rawKey.split('_')[3];
    const testHash = hashSecret(secretPart);
    expect(constantTimeCompare(keyRecord.keyHash || '', testHash)).toBe(true);
    expect(constantTimeCompare(keyRecord.keyHash || '', 'wrong_hash')).toBe(false);
  });

  it('Phase 2 & 7: Escrow Authorization isolates funds without premature seller payout', async () => {
    const jobAmount = 100;
    const authResult = await paymentOrchestrator.authorizeEscrow({
      buyerAgentId: buyerId,
      amount: jobAmount,
      jobId: 'job_escrow_test_01'
    });

    expect(authResult.success).toBe(true);
    expect(authResult.availableBalance).toBe(900);
    expect(authResult.reservedBalance).toBe(100);

    const buyerWallet = inMemoryWalletRegistry.get(buyerId)!;
    expect(buyerWallet.availableBalance).toBe(900);
    expect(buyerWallet.reservedBalance).toBe(100);

    // Seller and treasury balances remain 0 until verification
    const sellerWallet = inMemoryWalletRegistry.get(sellerId)!;
    const treasuryWallet = inMemoryWalletRegistry.get(PLATFORM_TREASURY_ACCOUNT_ID)!;
    expect(sellerWallet.availableBalance || 0).toBe(0);
    expect(treasuryWallet.availableBalance || 0).toBe(0);
  });

  it('Phase 4, 6 & 28: Full End-to-End Settlement enforces exact 5% platform fee and conservation invariant', async () => {
    const provider = new PlatformCreditsProvider();
    const grossAmount = 100;
    const idempotencyKey = 'idem_autonomous_loop_9988';

    const result = await provider.settlePayment({
      jobId: 'job_auto_9988',
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount,
      currency: 'CREDITS',
      idempotencyKey
    });

    expect(result.success).toBe(true);
    expect(result.grossAmount).toBe(100);
    expect(result.platformFee).toBe(5); // 5% default
    expect(result.sellerNet).toBe(95);

    // CRITICAL INVARIANT: grossAmount === sellerNet + platformFee
    expect(result.grossAmount).toBe(result.sellerNet + result.platformFee);

    // Verify Balances from settlement result and in-memory registry
    expect(result.balances.buyer.currentBalance).toBe(900);
    expect(result.balances.seller.currentBalance).toBe(95);
    expect(result.balances.treasury.currentBalance).toBe(5);

    const buyerWallet = inMemoryWalletRegistry.get(buyerId)!;
    const sellerWallet = inMemoryWalletRegistry.get(sellerId)!;
    const treasuryWallet = inMemoryWalletRegistry.get(PLATFORM_TREASURY_ACCOUNT_ID)!;

    expect(buyerWallet.creditsBalance).toBe(900);
    expect(sellerWallet.creditsBalance).toBe(95);
    expect(treasuryWallet.creditsBalance).toBe(5);

    // Total system credits conserved (1000 before === 900 + 95 + 5 after)
    const totalCredits = (buyerWallet.creditsBalance || 0) + (sellerWallet.creditsBalance || 0) + (treasuryWallet.creditsBalance || 0);
    expect(totalCredits).toBe(1000);
  });

  it('Phase 12, 13 & 14: Polkadot USDC Payment Provider generates valid requirement & extrinsic verification', async () => {
    const polkadotProvider = new PolkadotUsdcPaymentProvider();
    const req = await polkadotProvider.createPaymentRequirement('job_dot_01', 50, 'USDC');

    expect(req.paymentRef).toMatch(/^dot_req_/);
    expect(req.network).toBe('polkadot-asset-hub');
    expect(req.recipientAddress).toBeDefined();
    expect(req.tokenDecimals).toBe(6);
    expect(req.assetId).toBe('1337');
    expect(req.explorerTrackingUrl).toContain('subscan.io');

    const validHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const verifyResult = await polkadotProvider.verifyPayment(req.paymentRef, {
      extrinsicHash: validHash,
      amount: 50,
      senderAddress: '15oF...Sender'
    });

    expect(verifyResult.verified).toBe(true);
    expect(verifyResult.network).toBe('polkadot-asset-hub');
    expect(verifyResult.explorerUrl).toContain(validHash);
    expect(verifyResult.transaction?.assetId).toBe('1337');
    expect(verifyResult.transaction?.status).toBe('SUCCESS');

    // Rule 10: Anti-Replay Protection Test
    // Settle once with this hash
    await polkadotProvider.settlePayment({
      jobId: 'job_dot_01',
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount: 50,
      currency: 'USDC',
      extrinsicHash: validHash
    });

    // Attempting to verify or settle the same hash again MUST fail due to replay detection
    const replayVerify = await polkadotProvider.verifyPayment(req.paymentRef, {
      extrinsicHash: validHash,
      amount: 50
    });
    expect(replayVerify.verified).toBe(false);
    expect(replayVerify.ruleFailures).toContain('RULE_10_REPLAY_ATTACK_DETECTED');

    // Bad hash format rejection test
    const badFormatVerify = await polkadotProvider.verifyPayment(req.paymentRef, {
      extrinsicHash: 'invalid_non_hex_hash'
    });
    expect(badFormatVerify.verified).toBe(false);
    expect(badFormatVerify.ruleFailures).toContain('RULE_1_INVALID_HASH_FORMAT');

    // Wrong assetId rejection test
    const wrongAssetHash = '0x9999999999abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const wrongAssetVerify = await polkadotProvider.verifyPayment(req.paymentRef, {
      extrinsicHash: wrongAssetHash,
      assetId: '99999' // mismatch with 1337
    });
    expect(wrongAssetVerify.verified).toBe(false);
    expect(wrongAssetVerify.ruleFailures?.some(f => f.includes('RULE_5_ASSET_ID_MISMATCH'))).toBe(true);
  });

  it('Phase 11: Stripe Payment Provider converts fiat to credits, enforces verification, and executes capture', async () => {
    const stripeProvider = new StripePaymentProvider({ secretKey: '', mode: 'sandbox', paymentModeEnv: 'sandbox' });
    const req = await stripeProvider.createPaymentRequirement('job_stripe_01', 1000, 'USD', buyerId, {
      sellerAgentId: sellerId,
      transactionIntentId: 'intent_stripe_test_01'
    });

    expect(req.amountCredits).toBe(1000);
    expect(req.amountCents).toBe(1000); // 1000 credits = $10.00 = 1000 cents
    expect(req.clientSecret).toBeDefined();
    expect(['requires_payment_method', 'requires_capture', 'succeeded']).toContain(req.status);

    // Verify valid payment
    const verify = await stripeProvider.verifyPayment(req.paymentRef, {
      expectedAmountCents: 1000,
      expectedCurrency: 'usd',
      jobId: 'job_stripe_01'
    });
    expect(verify.verified).toBe(true);
    expect(verify.amountCents).toBe(1000);

    // Verify amount mismatch rejection
    const mismatchVerify = await stripeProvider.verifyPayment(req.paymentRef, {
      expectedAmountCents: 5000 // mismatch
    });
    expect(mismatchVerify.verified).toBe(false);

    // Capture payment
    const capture = await stripeProvider.capturePayment(
      req.paymentRef,
      10,
      1,
      sellerId,
      buyerId,
      'job_stripe_01'
    );
    if (!capture.success) {
      console.error('TEST CAPTURE FAILURE:', capture);
    }
    expect(capture.success).toBe(true);
    expect(capture.status).toBe('succeeded');
    expect(capture.chargeId).toBeDefined();

    // Settle and verify audit receipt
    const settlement = await stripeProvider.settlePayment({
      jobId: 'job_stripe_01',
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount: 10,
      currency: 'USD'
    });

    expect(settlement.success).toBe(true);
    expect(settlement.paymentRail).toBe('STRIPE');
    expect(settlement.auditReceipt).toBeDefined();
    expect(settlement.auditReceipt?.receiptHash).toBeDefined();
    expect(settlement.auditReceipt?.internalTransactionId).toMatch(/^tx_stripe_/);
    expect(settlement.auditReceipt?.externalPaymentProof?.stripePaymentIntentId).toBeDefined();
  });

  it('Phase 17 & 18: Spending Limit Policy & Human Operator Approval for high-value transactions', () => {
    // Standard tier (< 500)
    const policySmall = paymentOrchestrator.evaluateSpendingPolicy(100, ['services:read']);
    expect(policySmall.approved).toBe(true);
    expect(policySmall.requiresHumanApproval).toBe(false);

    // Large transaction requiring human operator approval (> 50,000 credits / $500)
    const policyLarge = paymentOrchestrator.evaluateSpendingPolicy(75000, ['payments:transact']);
    expect(policyLarge.approved).toBe(false);
    expect(policyLarge.requiresHumanApproval).toBe(true);

    // Generate Human Approval Token
    const approvalReq = paymentOrchestrator.createHumanApprovalRequest({
      txIntentId: 'intent_123',
      jobId: 'job_high_val_01',
      amount: 75000,
      buyerAgentId: buyerId,
      sellerAgentId: sellerId
    });

    expect(approvalReq.token).toMatch(/^sb_appr_/);

    // Operator approves with token
    const approved = paymentOrchestrator.approveTransactionWithToken(approvalReq.token, 'operator_jumanne_01');
    expect(approved).toBe(true);
  });

  it('Phase 9: Composite Algorithmic Reputation multi-factor scoring', () => {
    const rep = computeCompositeReputation({
      agentId: sellerId,
      handle: 'seller_research',
      displayName: 'Stock Bloc Research Pro',
      totalJobsAssigned: 20,
      totalJobsCompleted: 19,
      totalJobsVerified: 19,
      totalBountiesCompleted: 3,
      brierScore: 0.12,
      forecastWinRate: 82.5,
      totalForecasts: 25,
      resolvedForecasts: 18,
      calibrationScore: 92,
      customerRatingAverage: 4.95,
      totalRatingsCount: 15,
      averageLatencySeconds: 8.5,
      slaUptimePercent: 99.9,
      disputesInitiated: 0,
      disputesLost: 0,
      refundCount: 0
    });

    expect(rep.compositeScore).toBeGreaterThanOrEqual(85);
    expect(rep.tier).toBe('DIAMOND_QUANT');
    expect(rep.breakdown.taskPerformanceScore).toBeGreaterThan(30);
    expect(rep.breakdown.forecastAccuracyScore).toBeGreaterThan(15);
    expect(rep.breakdown.disputePenalty).toBe(0);
  });
});
