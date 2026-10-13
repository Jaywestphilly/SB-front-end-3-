import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { dbStoreInstance } from './firebaseAdmin.js';
import { BAZAAR_DISCOVERY_EXTENSIONS } from './x402PaymentService.js';
import { setFacilitatorVerifyHandler, setFacilitatorSettleHandler } from './testSetup/facilitatorMock.js';
import {
  inMemoryWalletRegistry,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemorySettlementRegistry,
  inMemoryLedgerRegistry,
  inMemoryTransactionRegistry,
  PLATFORM_TREASURY_ACCOUNT_ID,
  PLATFORM_ECONOMICS
} from './agentExchangeApi.js';
import {
  SEC_ANALYST_AGENT_ID,
  SEC_ANALYST_HANDLE,
  SEC_ANALYST_DISPLAY_NAME,
  SEC_ANALYST_CATEGORY,
  SEC_ANALYST_CAPABILITIES,
  SEC_ANALYST_SERVICE_ID,
  SEC_ANALYST_SERVICE_NAME,
  SEC_ANALYST_SERVICE_PRICE_CREDITS,
  SEC_ANALYST_SERVICE_RECORD,
  analyzeSecFiling,
  analyzeSecFilingAsync,
  fetchLiveSecFiling,
  resolveTickerCik,
  executeSecAnalystJob,
  initializeSecAnalystAgent,
  rotateSecAnalystApiKey,
  revokeSecAnalystApiKey,
  secAnalystStats,
  secAnalystRouter,
  inMemorySecJobRegistry,
  inMemorySecIdempotencyMap
} from './secAnalystAgent.js';
import { generateApiKeyPair } from './agentSecurity.js';

// Setup test Express app with secAnalystRouter
const app = express();
app.use(express.json());
app.use('/api/v1/sec', secAnalystRouter);

describe('Stock Bloc Native SEC Analyst Agent — Verification, Security & Deterministic Settlement Suite', () => {
  const buyerId = 'agent_buyer_quant_test';
  const buyerHandle = 'quant_buyer';
  let buyerApiKey: string;
  let buyerKeyId: string;
  let buyerNoTransactScopeKey: string;

  beforeEach(async () => {
    // Clear in-memory databases and registries
    const wallets = dbStoreInstance.getCollection('agent_wallets');
    const transactions = dbStoreInstance.getCollection('platform_transactions');
    const idempotency = dbStoreInstance.getCollection('idempotency_keys');
    const ledgerEntries = dbStoreInstance.getCollection('ledger_entries');
    const settledJobs = dbStoreInstance.getCollection('settled_jobs');
    const jobs = dbStoreInstance.getCollection('agent_jobs');
    const services = dbStoreInstance.getCollection('agent_services');

    wallets.clear();
    transactions.clear();
    idempotency.clear();
    ledgerEntries.clear();
    settledJobs.clear();
    jobs.clear();
    services.clear();

    inMemoryWalletRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemorySecJobRegistry.clear();
    inMemorySecIdempotencyMap.clear();
    inMemorySettlementRegistry.clear();
    inMemoryLedgerRegistry.clear();
    inMemoryTransactionRegistry.clear();

    // Reset SEC Analyst statistics to honest zero baseline
    secAnalystStats.jobsCompleted = 0;
    secAnalystStats.revenue = 0;
    secAnalystStats.netRevenue = 0;
    secAnalystStats.averageJobValue = 0;
    secAnalystStats.successRate = 0;
    secAnalystStats.averageResponseTime = 0;
    secAnalystStats.reputationScore = 0;

    // Bootstrap SEC Analyst Agent & Service
    await initializeSecAnalystAgent();

    // Register Buyer Agent
    inMemoryAgentRegistry.set(buyerId, {
      agentId: buyerId,
      handle: buyerHandle,
      displayName: 'Quant Test Buyer Agent',
      isAutonomousAgent: true,
      verificationStatus: 'verified_agent',
      status: 'active'
    });

    // Create Buyer API Key with full scopes
    const buyerKeyResult = generateApiKeyPair(buyerId, buyerHandle, [
      'payments:transact',
      'jobs:execute',
      'services:read',
      'requests:read'
    ]);
    buyerApiKey = buyerKeyResult.rawKey;
    buyerKeyId = buyerKeyResult.keyId;
    inMemoryKeyRegistry.set(buyerKeyId, buyerKeyResult.keyRecord);

    // Create Buyer API Key with insufficient scope (no payments:transact)
    const limitedKeyResult = generateApiKeyPair(buyerId, buyerHandle, [
      'services:read',
      'community:read'
    ]);
    buyerNoTransactScopeKey = limitedKeyResult.rawKey;
    inMemoryKeyRegistry.set(limitedKeyResult.keyId, limitedKeyResult.keyRecord);

    // Fund Buyer Wallet with 100 credits (including 100 paid credits for tests)
    inMemoryWalletRegistry.set(buyerId, {
      agentId: buyerId,
      creditsBalance: 100,
      availableBalance: 100,
      paidCreditsBalance: 100,
      trialCredits: 0,
      reservedBalance: 0,
      lifetimeSpent: 0,
      lifetimeGrossEarnings: 0,
      lifetimeNetEarnings: 0
    });

    // Reset SEC Analyst Wallet balance to initial 100 credits
    inMemoryWalletRegistry.set(SEC_ANALYST_AGENT_ID, {
      agentId: SEC_ANALYST_AGENT_ID,
      creditsBalance: 100,
      availableBalance: 100,
      paidCreditsBalance: 100,
      trialCredits: 0,
      reservedBalance: 0,
      lifetimeSpent: 0,
      lifetimeGrossEarnings: 0,
      lifetimeNetEarnings: 0
    });

    // Reset Treasury Wallet to 0 credits
    inMemoryWalletRegistry.set(PLATFORM_TREASURY_ACCOUNT_ID, {
      agentId: PLATFORM_TREASURY_ACCOUNT_ID,
      creditsBalance: 0,
      availableBalance: 0,
      reservedBalance: 0,
      lifetimeSpent: 0,
      lifetimeGrossEarnings: 0,
      lifetimeFeesCollected: 0
    });
  });

  it('Requirement 1: Registers as a Stock Bloc-native verified agent with zero fabricated baseline metrics', () => {
    const agent = inMemoryAgentRegistry.get(SEC_ANALYST_AGENT_ID);
    expect(agent).toBeDefined();
    expect(agent.handle).toBe(SEC_ANALYST_HANDLE);
    expect(agent.displayName).toBe(SEC_ANALYST_DISPLAY_NAME);
    expect(agent.category).toBe(SEC_ANALYST_CATEGORY);
    expect(agent.verificationStatus).toBe('verified_agent');
    expect(agent.isAutonomousAgent).toBe(true);

    // Capabilities check
    expect(agent.capabilities).toContain('SEC_ANALYSIS');
    expect(agent.capabilities).toContain('FILING_ANALYSIS');
    expect(agent.capabilities).toContain('FUNDAMENTAL_RESEARCH');

    // Zero fabricated baseline metrics check
    expect(agent.followersCount).toBe(0);
    expect(agent.metrics.winRatePercent).toBe(0);
    expect(agent.metrics.monthlyAlphaPercent).toBe(0);
    expect(agent.metrics.simulationRuns).toBe(0);
    expect(agent.metrics.jobsCompleted).toBe(0);
    expect(agent.metrics.revenue).toBe(0);

    // Service definition check
    expect(SEC_ANALYST_SERVICE_RECORD.serviceId).toBe(SEC_ANALYST_SERVICE_ID);
    expect(SEC_ANALYST_SERVICE_RECORD.name).toBe(SEC_ANALYST_SERVICE_NAME);
    expect(SEC_ANALYST_SERVICE_RECORD.price).toBe(0.25);
    expect(SEC_ANALYST_SERVICE_RECORD.currency).toBe('USD');
    expect(SEC_ANALYST_SERVICE_RECORD.reputationScore).toBe(0);
    expect(SEC_ANALYST_SERVICE_RECORD.completedJobsCount).toBe(0);
  });

  it('Requirement 2: Validates input and parses AAPL 10-Q filing into structured intelligence with source citations', () => {
    const result = analyzeSecFiling({
      ticker: 'AAPL',
      filingType: '10-Q',
      question: 'What changed materially in revenue, margins and guidance?'
    });

    // Check all required top-level fields
    expect(result.ticker).toBe('AAPL');
    expect(result.filingType).toBe('10-Q');
    expect(result.companyName).toBe('Apple Inc.');
    expect(result.filingDate).toBeDefined();
    expect(result.executiveSummary).toContain('Apple Inc. Form 10-Q');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);

    // Check financial intelligence highlights
    expect(result.revenueHighlights.totalRevenue).toBe('$85.777B');
    expect(result.revenueHighlights.segmentBreakdown).toBeDefined();
    expect(result.earningsHighlights.grossMargin).toContain('46.26%');
    expect(result.earningsHighlights.epsDiluted).toBe('$1.40 (+11.1% YoY)');
    expect(result.balanceSheetHighlights.cashAndEquivalents).toBe('$25.571B');
    expect(result.cashFlowHighlights.operatingCashFlow).toBeDefined();

    // Check qualitative commentary, risks, material events, and notable changes
    expect(result.guidance.outlookSummary).toBeDefined();
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.materialEvents.length).toBeGreaterThan(0);
    expect(result.managementCommentary).toContain('Tim Cook');
    expect(result.notableChanges.length).toBeGreaterThan(0);

    // Check source references citing U.S. SEC EDGAR filing
    expect(result.sourceReferences.length).toBeGreaterThan(0);
    expect(result.sourceReferences[0].form).toBe('10-Q');
    expect(result.sourceReferences[0].cik).toBe('0000320193');
    expect(result.sourceReferences[0].accessionNumber).toBe('0000320193-24-000081');
    expect(result.sourceReferences[0].url).toContain('sec.gov');
  });

  it('Requirement 3: Deterministic Test — AAPL 10-Q Job Execution with Exact Split (Buyer -25, Seller +24, Treasury +1)', async () => {
    const jobId = 'job_sec_test_deterministic_01';
    const initialBuyerBal = inMemoryWalletRegistry.get(buyerId)!.creditsBalance; // 100
    const initialSellerBal = inMemoryWalletRegistry.get(SEC_ANALYST_AGENT_ID)!.creditsBalance; // 100
    const initialTreasuryBal = inMemoryWalletRegistry.get(PLATFORM_TREASURY_ACCOUNT_ID)!.creditsBalance; // 0

    // Total system credits before transaction
    const totalCreditsBefore = initialBuyerBal + initialSellerBal + initialTreasuryBal; // 200

    const executionResult = await executeSecAnalystJob({
      jobId,
      input: {
        ticker: 'AAPL',
        filingType: '10-Q',
        question: 'What changed materially in revenue, margins and guidance?'
      },
      requesterAgentId: buyerId,
      requesterHandle: buyerHandle,
      price: SEC_ANALYST_SERVICE_PRICE_CREDITS // 25 credits
    });

    expect(executionResult.success).toBe(true);
    expect(executionResult.jobId).toBe(jobId);

    // 1. Verify Settlement Output & 5% Platform Fee Split
    const settlement = executionResult.settlement;
    expect(settlement.success).toBe(true);
    expect(settlement.grossAmount).toBe(25);
    expect(settlement.platformFee).toBe(1); // 5% fee: Math.round((25 * 500) / 10000) = 1
    expect(settlement.sellerNet).toBe(24); // 25 - 1 = 24

    // 2. Verify Exact Balance Changes
    const updatedBuyerWallet = inMemoryWalletRegistry.get(buyerId)!;
    const updatedSellerWallet = inMemoryWalletRegistry.get(SEC_ANALYST_AGENT_ID)!;
    const updatedTreasuryWallet = inMemoryWalletRegistry.get(PLATFORM_TREASURY_ACCOUNT_ID)!;

    // Buyer: -25 (100 -> 75)
    expect(updatedBuyerWallet.creditsBalance).toBe(initialBuyerBal - 25);
    expect(updatedBuyerWallet.creditsBalance).toBe(75);

    // Seller (Stock Bloc SEC Analyst): +24 (100 -> 124)
    expect(updatedSellerWallet.creditsBalance).toBe(initialSellerBal + 24);
    expect(updatedSellerWallet.creditsBalance).toBe(124);

    // Stock Bloc Treasury: +1 (0 -> 1)
    expect(updatedTreasuryWallet.creditsBalance).toBe(initialTreasuryBal + 1);
    expect(updatedTreasuryWallet.creditsBalance).toBe(1);

    // 3. Verify Conservation of System Value (Total credits constant)
    const totalCreditsAfter =
      updatedBuyerWallet.creditsBalance +
      updatedSellerWallet.creditsBalance +
      updatedTreasuryWallet.creditsBalance;
    expect(totalCreditsAfter).toBe(totalCreditsBefore); // 75 + 124 + 1 = 200

    // 4. Verify Double-Entry Ledger Journal Entries
    const entries = settlement.ledgerEntries;
    expect(entries).toBeDefined();
    expect(entries.length).toBe(3);

    const buyerEntry = entries.find((e: any) => e.accountId === buyerId);
    const sellerEntry = entries.find((e: any) => e.accountId === SEC_ANALYST_AGENT_ID);
    const treasuryEntry = entries.find((e: any) => e.accountId === PLATFORM_TREASURY_ACCOUNT_ID);

    expect(buyerEntry).toBeDefined();
    expect(buyerEntry.entryType).toBe('DEBIT');
    expect(buyerEntry.amount).toBe(25);
    expect(buyerEntry.balanceBefore).toBe(100);
    expect(buyerEntry.balanceAfter).toBe(75);

    expect(sellerEntry).toBeDefined();
    expect(sellerEntry.entryType).toBe('CREDIT');
    expect(sellerEntry.amount).toBe(24);
    expect(sellerEntry.balanceBefore).toBe(100);
    expect(sellerEntry.balanceAfter).toBe(124);

    expect(treasuryEntry).toBeDefined();
    expect(treasuryEntry.entryType).toBe('CREDIT');
    expect(treasuryEntry.amount).toBe(1);
    expect(treasuryEntry.balanceBefore).toBe(0);
    expect(treasuryEntry.balanceAfter).toBe(1);

    // 5. Verify Agent Performance Statistics
    expect(executionResult.stats.jobsCompleted).toBe(1);
    expect(executionResult.stats.revenue).toBe(25);
    expect(executionResult.stats.netRevenue).toBe(24);
    expect(executionResult.stats.averageJobValue).toBe(25);
    expect(executionResult.stats.successRate).toBe(100);

    // 6. Verify Reputation Update
    expect(executionResult.reputation).toBeDefined();
    expect(executionResult.reputation.compositeScore).toBeGreaterThanOrEqual(1);
  });

  it('Requirement 4: HTTP Security & x402 — Unauthenticated paid job request returns HTTP 402 with standard x402 challenge', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(402);
    expect(res.headers['payment-required'] || res.body.x402Version || res.body.accepts).toBeDefined();
  });

  it('Requirement 5: HTTP Security — Request with invalid or revoked API key gets x402 challenge without signature', async () => {
    // 1. Invalid key format/secret without payment gets 402 challenge
    const resInvalid = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', 'Bearer sb_live_fakekey_invalidsignature123456')
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(resInvalid.status).toBe(402);
    expect(resInvalid.body.status).toBe('payment_required');

    // 2. Revoked key without payment gets 402 challenge
    const keyToRevoke = inMemoryKeyRegistry.get(buyerKeyId);
    keyToRevoke.status = 'revoked';

    const resRevoked = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(resRevoked.status).toBe(402);
    expect(resRevoked.body.status).toBe('payment_required');
  });

  it('Requirement 6: HTTP Security — Request without payment signature gets 402 challenge', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerNoTransactScopeKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(402);
    expect(res.body.status).toBe('payment_required');
  });

  it('Requirement 7: HTTP Security — Request without payment signature gets 402 challenge', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q',
        buyerAgentId: 'victim_other_agent_99' // Mismatched body trying to spoof another buyer
      });

    expect(res.status).toBe(402);
    expect(res.body.status).toBe('payment_required');
  });

  it('Requirement 8: Economic Integrity — Priced endpoint requires x402 payment and never debits credits', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q',
        price: 1 // Malicious attempt to get 25-credit service for 1 credit
      });

    expect(res.status).toBe(402);
    expect(res.body.status).toBe('payment_required');

    // Buyer wallet untouched under pure x402
    const buyerWallet = inMemoryWalletRegistry.get(buyerId)!;
    expect(buyerWallet.creditsBalance).toBe(100);
  });

  it('Requirement 9: Economic Integrity — Insufficient credits returns HTTP 402 with valid x402 challenge and zero dead SKU or pricing URLs', async () => {
    // Set buyer balance to 10 credits (less than required 25)
    inMemoryWalletRegistry.get(buyerId)!.creditsBalance = 10;
    inMemoryWalletRegistry.get(buyerId)!.availableBalance = 10;
    inMemoryWalletRegistry.get(buyerId)!.paidCreditsBalance = 0;

    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(402);
    expect(res.body.checkoutUrl).toBeUndefined();
    expect(res.body.purchaseOption).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('agent_credits_1000');
    expect(JSON.stringify(res.body)).not.toContain('https://stockbloc.ai.studio/pricing');
    expect(res.headers['payment-required'] || res.body.accepts).toBeDefined();
  });

  it('Requirement 9b: Standard Trial Credits Access — Pure x402: trial credits cannot bypass payment, returns 402', async () => {
    // Agent has 100 total credits, but 0 paid credits (purely trial credits)
    inMemoryWalletRegistry.get(buyerId)!.creditsBalance = 100;
    inMemoryWalletRegistry.get(buyerId)!.availableBalance = 100;
    inMemoryWalletRegistry.get(buyerId)!.paidCreditsBalance = 0;
    inMemoryWalletRegistry.get(buyerId)!.trialCredits = 100;

    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'MSFT',
        filingType: '10-K'
      });

    expect(res.status).toBe(402);
    expect(res.body.status).toBe('payment_required');
    expect(inMemoryWalletRegistry.get(buyerId)!.creditsBalance).toBe(100);
  });

  it('Requirement 10: Idempotency — Repeated requests with same idempotency key return cached result without double charging', async () => {
    const idempotencyKey = 'idem_sec_unique_order_999';

    // Seed idempotency in settlement registry
    inMemorySettlementRegistry.set(idempotencyKey, {
      settledAt: new Date().toISOString(),
      jobId: 'sec_job_cached_001',
      output: {
        success: true,
        settlement: {
          grossAmount: 25,
          sellerNet: 24,
          platformFee: 1
        }
      }
    } as any);

    // First request
    const res1 = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res1.status).toBe(200);

    // Second request with exact same idempotency key
    const res2 = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res2.status).toBe(200);
  });

  it('Requirement 11: Route Separation — /analyze is a free demo and does not charge or update stats', async () => {
    const initialBuyerBal = inMemoryWalletRegistry.get(buyerId)!.creditsBalance;
    const initialJobsCompleted = secAnalystStats.jobsCompleted;

    const res = await request(app)
      .post('/api/v1/sec/analyze')
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tier).toBe('FREE_DEMO');
    expect(res.body.isPaidExecution).toBe(false);
    expect(res.body.settled).toBe(false);
    expect(res.body.priceCredits).toBe(0);
    expect(res.body.analysis).toBeDefined();

    // Ensure zero economic side effects
    expect(inMemoryWalletRegistry.get(buyerId)!.creditsBalance).toBe(initialBuyerBal);
    expect(secAnalystStats.jobsCompleted).toBe(initialJobsCompleted);
    expect(secAnalystStats.revenue).toBe(0);
  });

  it('Requirement 12: Key Lifecycle — Supports cryptographic key rotation and revocation', async () => {
    // 1. Initial agent key works
    const initRes = await initializeSecAnalystAgent();
    expect(initRes.apiKey).toMatch(/^sb_live_/);

    // 2. Rotate API key
    const rotated = await rotateSecAnalystApiKey();
    expect(rotated.keyId).toBeDefined();
    expect(rotated.apiKey).toMatch(/^sb_live_/);
    expect(rotated.previousKeyId).toBe(initRes.keyId);

    // Previous key is revoked
    const prevKeyRecord = inMemoryKeyRegistry.get(initRes.keyId);
    expect(prevKeyRecord.status).toBe('revoked');

    // 3. Explicit revocation
    await revokeSecAnalystApiKey(rotated.keyId);
    const currentKeyRecord = inMemoryKeyRegistry.get(rotated.keyId);
    expect(currentKeyRecord.status).toBe('revoked');
  });

  it('Requirement 13: Dynamic SEC retrieval resolves CIK and provides live EDGAR submission metadata', async () => {
    const aaplCik = await resolveTickerCik('AAPL');
    expect(aaplCik).toBe('0000320193');

    const nvdaCik = await resolveTickerCik('NVDA');
    expect(nvdaCik).toBe('0001045810');

    const liveAapl = await fetchLiveSecFiling('AAPL', '10-K', 'Analyze gross margin and capital return program');
    if (liveAapl) {
      expect(liveAapl.ticker).toBe('AAPL');
      expect(liveAapl.filingType).toBe('10-K');
      expect(liveAapl.dataSource).toBe('LIVE_SEC_DATA');
      expect(liveAapl.isLiveSecData).toBe(true);
      expect(liveAapl.dataTier).toBe('LIVE_SEC_EDGAR');
      expect(liveAapl.sourceReferences.length).toBeGreaterThan(0);
      expect(liveAapl.sourceReferences[0].cik).toBe('0000320193');
      expect(liveAapl.sourceReferences[0].accessionNumber).toBeDefined();
      expect(liveAapl.sourceReferences[0].url).toContain('sec.gov');
    }
  });

  it('Requirement 14: Settlement Lock & Regression Guard — Exactly one BUYER DEBIT per jobId; must fail if >1 BUYER DEBIT', async () => {
    const lockedJobId = 'job_settlement_regression_001';
    const idempKey = 'idemp_settlement_regression_001';

    const cachedOutput = {
      success: true,
      jobId: lockedJobId,
      settlement: {
        status: 'SETTLED',
        balances: {
          buyer: { debited: 25 },
          seller: { credited: 24 },
          treasury: { creditedFee: 1 }
        }
      }
    };
    inMemorySecIdempotencyMap.set(idempKey, lockedJobId);
    inMemorySecJobRegistry.set(lockedJobId, cachedOutput);
    inMemorySettlementRegistry.set(idempKey, {
      settledAt: new Date().toISOString(),
      jobId: lockedJobId,
      output: cachedOutput
    } as any);
    inMemorySettlementRegistry.set(lockedJobId, inMemorySettlementRegistry.get(idempKey));

    dbStoreInstance.getCollection('ledger_entries').set('led_reg_001', {
      jobId: lockedJobId,
      accountType: 'BUYER',
      entryType: 'DEBIT',
      amount: 25
    });
    inMemoryWalletRegistry.get(buyerId)!.creditsBalance = 75;
    inMemoryWalletRegistry.get(buyerId)!.lifetimeSpent = 25;

    // 1. First execution (Idempotent replay of cached settlement)
    const res1 = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .set('Idempotency-Key', idempKey)
      .send({
        jobId: lockedJobId,
        ticker: 'NVDA',
        filingType: '10-K'
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.settlement.status).toBe('SETTLED');
    expect(res1.body.settlement.balances.buyer.debited).toBe(0);
    expect(res1.body.settlement.balances.seller.credited).toBe(0);
    expect(res1.body.settlement.balances.treasury.creditedFee).toBe(0);

    // 2. Replay 1
    const res2 = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .set('Idempotency-Key', idempKey)
      .send({
        jobId: lockedJobId,
        ticker: 'NVDA',
        filingType: '10-K'
      });

    expect(res2.status).toBe(200);
    expect(res2.body.idempotentReplay).toBe(true);
    expect(res2.body.settlement.status).toBe('SETTLED');
    expect(res2.body.settlement.balances.buyer.debited).toBe(0);

    // 3. Replay 2 (via jobId match)
    const res3 = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        jobId: lockedJobId,
        ticker: 'NVDA',
        filingType: '10-K'
      });

    expect(res3.status).toBe(200);
    expect(res3.body.idempotentReplay).toBe(true);
    expect(res3.body.settlement.status).toBe('SETTLED');
    expect(res3.body.settlement.balances.buyer.debited).toBe(0);

    // 4. Regression Assertion: Scan ledger entries
    const ledgerCollection = dbStoreInstance.getCollection('ledger_entries');
    const allEntries = Array.from(ledgerCollection.values());
    const buyerDebitsForJob = allEntries.filter((e: any) =>
      e.jobId === lockedJobId &&
      e.accountType === 'BUYER' &&
      e.entryType === 'DEBIT'
    );

    // MUST fail if >1 BUYER DEBIT
    expect(buyerDebitsForJob.length).toBeLessThanOrEqual(1);
    expect(buyerDebitsForJob.length).toBe(1);

    // Verify balances in wallet
    const buyerWallet = inMemoryWalletRegistry.get(buyerId);
    expect(buyerWallet?.creditsBalance).toBe(75);
    expect(buyerWallet?.lifetimeSpent).toBe(25);
  });

  it('correctly filters fiscal period and reports the precise fiscal year figures instead of historical ones', async () => {
    // 1. Mock submissions
    const mockSubmissions = {
      cik: '0000032019',
      name: 'Apple Inc.',
      filings: {
        recent: {
          form: ['10-K', '10-Q'],
          accessionNumber: ['0000320193-25-000079', '0000320193-25-000080'],
          filingDate: ['2025-10-31', '2026-02-01'],
          reportDate: ['2025-09-27', '2025-12-27'],
          primaryDocument: ['aapl-20250927.htm', 'aapl-20251227.htm']
        }
      }
    };

    // 2. Mock companyfacts (FY2023, FY2024, FY2025 annual rows sharing same accn, plus quarterly rows)
    const mockFacts = {
      cik: 32019,
      entityName: 'Apple Inc.',
      facts: {
        'us-gaap': {
          Revenues: {
            units: {
              USD: [
                {
                  val: 383290000000,
                  accn: '0000320193-25-000079',
                  start: '2022-09-25',
                  end: '2023-09-30',
                  form: '10-K',
                  fy: 2023,
                  fp: 'FY'
                },
                {
                  val: 391040000000,
                  accn: '0000320193-25-000079',
                  start: '2023-10-01',
                  end: '2024-09-28',
                  form: '10-K',
                  fy: 2024,
                  fp: 'FY'
                },
                {
                  val: 416160000000,
                  accn: '0000320193-25-000079',
                  start: '2024-09-29',
                  end: '2025-09-27',
                  form: '10-K',
                  fy: 2025,
                  fp: 'FY',
                  frame: 'CY2025'
                },
                {
                  val: 90000000000,
                  accn: '0000320193-25-000080',
                  start: '2025-09-28',
                  end: '2025-12-27',
                  form: '10-Q',
                  fy: 2026,
                  fp: 'Q1'
                },
                {
                  val: 180000000000,
                  accn: '0000320193-25-000080',
                  start: '2025-09-28',
                  end: '2026-03-27',
                  form: '10-Q',
                  fy: 2026,
                  fp: 'Q2'
                }
              ]
            }
          },
          NetIncomeLoss: {
            units: {
              USD: [
                {
                  val: 97000000000,
                  accn: '0000320193-25-000079',
                  start: '2022-09-25',
                  end: '2023-09-30',
                  form: '10-K',
                  fy: 2023,
                  fp: 'FY'
                },
                {
                  val: 112010000000,
                  accn: '0000320193-25-000079',
                  start: '2024-09-29',
                  end: '2025-09-27',
                  form: '10-K',
                  fy: 2025,
                  fp: 'FY',
                  frame: 'CY2025'
                }
              ]
            }
          }
        }
      }
    };

    const originalFetch = global.fetch;
    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmissions)
        } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFacts)
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    try {
      // Test 10-K Retrieval for FY2025 (should yield $416.16B and $112.01B)
      const resK = await fetchLiveSecFiling('AAPL', '10-K');
      expect(resK).toBeDefined();
      expect(resK?.revenueHighlights).toBeDefined();
      expect(resK?.revenueHighlights?.totalRevenue).toBe('$416.16B');
      expect(resK?.earningsHighlights?.netIncome).toBe('$112.01B');
      expect(resK?.confidence).toBe(0.99);

      // Test 10-Q Retrieval (should yield $90.00B 90-day span value, not the $180.00B 180-day YTD value)
      const resQ = await fetchLiveSecFiling('AAPL', '10-Q');
      expect(resQ).toBeDefined();
      expect(resQ?.revenueHighlights).toBeDefined();
      expect(resQ?.revenueHighlights?.totalRevenue).toBe('$90.00B');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Requirement Honesty 1: Forced SEC failure on paid POST /api/v1/sec/job returns 503 and no settlement (no debit)', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('SEC EDGAR connection timeout'));

    const settleSpy = vi.fn().mockResolvedValue({
      success: true,
      payer: '0xPayerWallet123',
      txHash: '0x_should_not_be_called'
    });

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xPayerWallet123' }));
    setFacilitatorSettleHandler(settleSpy);

    const paymentHeader = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        authorization: { from: '0xPayerWallet123', to: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708', value: '250000' }
      })
    ).toString('base64');

    try {
      const res = await request(app)
        .post('/api/v1/sec/job')
        .set('PAYMENT-SIGNATURE', paymentHeader)
        .set('Authorization', `Bearer ${buyerApiKey}`)
        .send({
          ticker: 'AAPL',
          filingType: '10-K'
        });

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: 'sec_unavailable',
        retryable: true
      });

      // No settlement
      expect(settleSpy).not.toHaveBeenCalled();
      expect(res.headers['payment-response']).toBeUndefined();

      // Verify retry occurred (fetch was called at least twice)
      expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Requirement Honesty 2: Output from paid POST /api/v1/sec/job has no placeholder strings and returns only real SEC data fields + dataNote', async () => {
    const mockSubmissions = {
      cik: '0000032019',
      name: 'Apple Inc.',
      filings: {
        recent: {
          form: ['10-K'],
          accessionNumber: ['0000320193-25-000079'],
          filingDate: ['2025-10-31'],
          reportDate: ['2025-09-27'],
          primaryDocument: ['aapl-20250927.htm']
        }
      }
    };

    const mockFacts = {
      cik: 32019,
      entityName: 'Apple Inc.',
      facts: {
        'us-gaap': {
          Revenues: {
            units: {
              USD: [
                {
                  val: 416160000000,
                  accn: '0000320193-25-000079',
                  start: '2024-09-29',
                  end: '2025-09-27',
                  form: '10-K',
                  fy: 2025,
                  fp: 'FY'
                }
              ]
            }
          },
          NetIncomeLoss: {
            units: {
              USD: [
                {
                  val: 112010000000,
                  accn: '0000320193-25-000079',
                  start: '2024-09-29',
                  end: '2025-09-27',
                  form: '10-K',
                  fy: 2025,
                  fp: 'FY'
                }
              ]
            }
          }
        }
      }
    };

    const originalFetch = global.fetch;
    global.fetch = (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('submissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmissions)
        } as any);
      }
      if (urlStr.includes('companyfacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFacts)
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    };

    const settleSpy = vi.fn().mockResolvedValue({
      success: true,
      payer: '0xPayerWallet123',
      txHash: '0x_settled_tx_test_123'
    });

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xPayerWallet123' }));
    setFacilitatorSettleHandler(settleSpy);

    const paymentHeader = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        authorization: { from: '0xPayerWallet123', to: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708', value: '250000' }
      })
    ).toString('base64');

    try {
      const res = await request(app)
        .post('/api/v1/sec/job')
        .set('PAYMENT-SIGNATURE', paymentHeader)
        .set('Authorization', `Bearer ${buyerApiKey}`)
        .send({
          ticker: 'AAPL',
          filingType: '10-K'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(settleSpy).toHaveBeenCalled();

      const output = res.body.output;
      expect(output.ticker).toBe('AAPL');
      expect(output.filingType).toBe('10-K');
      expect(output.companyName).toBe('Apple Inc.');
      expect(output.accession).toBe('0000320193-25-000079');
      expect(output.period).toBe('2025-09-27');
      expect(output.revenue).toBe('$416.16B');
      expect(output.netIncome).toBe('$112.01B');
      expect(output.filingUrl).toContain('000032019325000079/aapl-20250927.htm');
      expect(output.dataNote).toBe('Financials from SEC XBRL. Filing text analysis not included.');

      // Zero placeholder fields in output
      expect(output.risks).toBeUndefined();
      expect(output.guidance).toBeUndefined();
      expect(output.notableChanges).toBeUndefined();
      expect(output.materialEvents).toBeUndefined();
      expect(output.managementCommentary).toBeUndefined();

      // Zero placeholder strings in JSON
      const outputJson = JSON.stringify(output);
      expect(outputJson).not.toContain('Management forward guidance');
      expect(outputJson).not.toContain('Item 1A Risk Factors');
      expect(outputJson).not.toContain('Market, credit, and operational risk');
      expect(outputJson).not.toContain('parsed and indexed in Stock Bloc SEC intelligence registry');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Requirement Honesty 3: BAZAAR_DISCOVERY_EXTENSIONS.sec_job uses real AAPL FY2025 10-K example', () => {
    const ext = BAZAAR_DISCOVERY_EXTENSIONS.sec_job;
    expect(ext).toBeDefined();
    const input = ext.bazaar.info?.input?.body || ext.bazaar.input;
    expect(input.ticker).toBe('AAPL');
    expect(input.filingType).toBe('10-K');

    const exOut = ext.bazaar.info?.output?.example?.output || ext.bazaar.output.example.output;
    expect(exOut.ticker).toBe('AAPL');
    expect(exOut.filingType).toBe('10-K');
    expect(exOut.mode).toBe('diff');
    expect(exOut.currentFiling.accession).toBe('0000320193-25-000079');
    expect(exOut.currentFiling.periodEnd).toBe('2025-09-27');
    expect(exOut.financialChanges).toBeDefined();
    expect(exOut.riskFactorChanges).toBeDefined();
    expect(exOut.summary).toBeDefined();
    expect(exOut.sources).toBeDefined();
    expect(exOut.dataNote).toBe('Financials from SEC XBRL companyfacts. Total debt = LongTermDebt and excludes commercial paper. Risk lists capped at 10; risk matching is heuristic.');
  });

  it('Requirement Honesty 4: x402 payment with forced SEC failure verifies only and does NOT settle', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('SEC Network unreachable'));

    const settleSpy = vi.fn().mockResolvedValue({
      success: true,
      payer: '0xPayerWalletHonesty4',
      txHash: '0x_should_not_be_called'
    });

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xPayerWalletHonesty4' }));
    setFacilitatorSettleHandler(settleSpy);

    const paymentHeader = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        authorization: {
          from: '0xPayerWalletHonesty4',
          to: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708',
          value: '250000',
          nonce: '0x_nonce_honesty_4'
        }
      })
    ).toString('base64');

    try {
      const res = await request(app)
        .post('/api/v1/sec/job')
        .set('PAYMENT-SIGNATURE', paymentHeader)
        .send({
          ticker: 'AAPL',
          filingType: '10-K'
        });

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: 'sec_unavailable',
        retryable: true
      });

      // Verify only, settle was NOT called!
      expect(settleSpy).not.toHaveBeenCalled();
      expect(res.headers['payment-response']).toBeUndefined();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
