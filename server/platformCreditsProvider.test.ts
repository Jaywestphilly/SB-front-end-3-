import { describe, it, expect, beforeEach } from 'vitest';
import { dbStoreInstance } from './firebaseAdmin.js';
import { PlatformCreditsProvider, PLATFORM_TREASURY_ACCOUNT_ID, PLATFORM_ECONOMICS, inMemoryWalletRegistry } from './agentExchangeApi.js';

describe('PlatformCreditsProvider Double-Entry Ledger', () => {
  let provider: PlatformCreditsProvider;

  beforeEach(() => {
    // Reset in-memory test database collections
    const wallets = dbStoreInstance.getCollection('agent_wallets');
    const transactions = dbStoreInstance.getCollection('platform_transactions');
    const idempotency = dbStoreInstance.getCollection('idempotency_keys');
    const ledgerEntries = dbStoreInstance.getCollection('ledger_entries');

    wallets.clear();
    transactions.clear();
    idempotency.clear();
    ledgerEntries.clear();
    inMemoryWalletRegistry.clear();

    provider = new PlatformCreditsProvider();
  });

  it('atomically debits buyer, credits seller net of fee, and credits platform treasury', async () => {
    const buyerId = 'agent_buyer_alpha';
    const sellerId = 'agent_seller_beta';
    const jobId = 'job_test_001';
    const grossAmount = 50; // 50 credits
    // Platform fee: 5% of 50 = 2.5 rounded -> 3 credits (or based on platformFeeBps)
    const platformFeeBps = 500; // 5%
    const expectedFee = Math.max(1, Math.round((50 * 500) / 10000)); // 3
    const expectedNetSeller = 50 - expectedFee; // 47

    // 1. Initialize buyer wallet with 100 credits, seller with 0
    await provider.getOrCreateWallet(buyerId, 100);
    await provider.getOrCreateWallet(sellerId, 0);

    // 2. Perform atomic settlement
    const settlement = await provider.settlePayment({
      jobId,
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount,
      platformFeeBps,
      idempotencyKey: `idemp_${jobId}_${grossAmount}`,
      description: 'Test quantitative research delivery'
    });

    expect(settlement.success).toBe(true);
    expect(settlement.status).toBe('SETTLED');
    expect(settlement.grossAmount).toBe(50);
    expect(settlement.platformFee).toBe(expectedFee);
    expect(settlement.netSellerAmount).toBe(expectedNetSeller);

    // Verify Invariant: Gross = Net Seller + Treasury Fee
    expect(settlement.grossAmount).toBe(settlement.netSellerAmount + settlement.platformFee);

    // Verify Balances Returned
    expect(settlement.balances.buyer.previousBalance).toBe(100);
    expect(settlement.balances.buyer.currentBalance).toBe(50);
    expect(settlement.balances.buyer.debited).toBe(50);

    expect(settlement.balances.seller.previousBalance).toBe(0);
    expect(settlement.balances.seller.currentBalance).toBe(expectedNetSeller);
    expect(settlement.balances.seller.credited).toBe(expectedNetSeller);

    expect(settlement.balances.treasury.previousBalance).toBe(0);
    expect(settlement.balances.treasury.currentBalance).toBe(expectedFee);
    expect(settlement.balances.treasury.creditedFee).toBe(expectedFee);

    // Verify double-entry ledger journal entries
    expect(settlement.ledgerEntries.length).toBe(3);
    const debitEntries = settlement.ledgerEntries.filter(e => e.entryType === 'DEBIT');
    const creditEntries = settlement.ledgerEntries.filter(e => e.entryType === 'CREDIT');

    const totalDebits = debitEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = creditEntries.reduce((sum, e) => sum + e.amount, 0);
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(50);

    // 3. Verify persistent storage in agent_wallets
    const buyerWallet = await provider.getProviderBalance(buyerId);
    expect(buyerWallet.creditsBalance).toBe(50);
    expect(buyerWallet.lifetimeSpent).toBe(50);

    const sellerWallet = await provider.getProviderBalance(sellerId);
    expect(sellerWallet.creditsBalance).toBe(expectedNetSeller);
    expect(sellerWallet.lifetimeGrossEarnings).toBe(50);
    expect(sellerWallet.lifetimeNetEarnings).toBe(expectedNetSeller);
    expect(sellerWallet.lifetimePlatformFeesPaid).toBe(expectedFee);

    const treasury = await provider.getTreasuryBalance();
    expect(treasury.creditsBalance).toBe(expectedFee);
    expect(treasury.totalSettledVolume).toBe(50);
  });

  it('rejects settlement when buyer has insufficient credits without mutating any balances', async () => {
    const buyerId = 'agent_broke_buyer';
    const sellerId = 'agent_seller_gamma';
    const jobId = 'job_test_002';
    const grossAmount = 80;

    // Seed buyer with only 20 credits
    const wallets = dbStoreInstance.getCollection('agent_wallets');
    wallets.set(buyerId, { agentId: buyerId, creditsBalance: 20, lifetimeSpent: 0 });
    wallets.set(sellerId, { agentId: sellerId, creditsBalance: 10, lifetimeGrossEarnings: 0 });

    // Attempt settlement
    await expect(
      provider.settlePayment({
        jobId,
        buyerAgentId: buyerId,
        sellerAgentId: sellerId,
        grossAmount,
        idempotencyKey: `idemp_${jobId}`
      })
    ).rejects.toThrow(/Insufficient credits balance/);

    // Verify wallets are unmodified (atomic rollback)
    const buyerW = await provider.getProviderBalance(buyerId);
    expect(buyerW.creditsBalance).toBe(20);

    const sellerW = await provider.getProviderBalance(sellerId);
    expect(sellerW.creditsBalance).toBe(10);

    const treasury = await provider.getTreasuryBalance();
    expect(treasury.creditsBalance).toBe(0);
  });

  it('enforces idempotency key so multiple submissions return identical result without double debit/credit', async () => {
    const buyerId = 'agent_idemp_buyer';
    const sellerId = 'agent_idemp_seller';
    const jobId = 'job_test_003';
    const grossAmount = 30;
    const idempotencyKey = `idemp_unique_key_${jobId}`;

    await provider.getOrCreateWallet(buyerId, 100);
    await provider.getOrCreateWallet(sellerId, 0);

    // 1st Settlement Call
    const res1 = await provider.settlePayment({
      jobId,
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount,
      idempotencyKey
    });

    expect(res1.success).toBe(true);
    expect(res1.idempotentReplay).toBeFalsy();
    const txId1 = res1.transactionId;

    // 2nd Settlement Call with SAME Idempotency Key
    const res2 = await provider.settlePayment({
      jobId,
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount,
      idempotencyKey
    });

    expect(res2.success).toBe(true);
    expect(res2.idempotentReplay).toBe(true);
    expect(res2.transactionId).toBe(txId1);

    // Verify buyer was only debited ONCE
    const buyerW = await provider.getProviderBalance(buyerId);
    expect(buyerW.creditsBalance).toBe(70); // 100 - 30, NOT 40

    // Verify seller was only credited ONCE
    const sellerW = await provider.getProviderBalance(sellerId);
    expect(sellerW.creditsBalance).toBe(res1.netSellerAmount);

    // Verify treasury was only credited ONCE
    const treasury = await provider.getTreasuryBalance();
    expect(treasury.creditsBalance).toBe(res1.platformFee);
  });

  it('records immutable ledger entries queryable by accountId', async () => {
    const buyerId = 'agent_ledger_buyer';
    const sellerId = 'agent_ledger_seller';

    await provider.getOrCreateWallet(buyerId, 100);
    await provider.getOrCreateWallet(sellerId, 0);

    await provider.settlePayment({
      jobId: 'job_ledger_1',
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount: 20,
      idempotencyKey: 'idemp_ledger_1'
    });

    await provider.settlePayment({
      jobId: 'job_ledger_2',
      buyerAgentId: buyerId,
      sellerAgentId: sellerId,
      grossAmount: 30,
      idempotencyKey: 'idemp_ledger_2'
    });

    const buyerLedger = await provider.getAccountLedger(buyerId);
    expect(buyerLedger.length).toBe(2);
    expect(buyerLedger.every(e => e.entryType === 'DEBIT')).toBe(true);

    const sellerLedger = await provider.getAccountLedger(sellerId);
    expect(sellerLedger.length).toBe(2);
    expect(sellerLedger.every(e => e.entryType === 'CREDIT')).toBe(true);

    const treasuryLedger = await provider.getAccountLedger(PLATFORM_TREASURY_ACCOUNT_ID);
    expect(treasuryLedger.length).toBe(2);
    expect(treasuryLedger.every(e => e.accountType === 'PLATFORM_TREASURY')).toBe(true);
  });
});
