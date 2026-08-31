import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { dbStoreInstance } from './firebaseAdmin.js';
import {
  inMemoryWalletRegistry,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
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
    const jobs = dbStoreInstance.getCollection('agent_jobs');
    const services = dbStoreInstance.getCollection('agent_services');

    wallets.clear();
    transactions.clear();
    idempotency.clear();
    ledgerEntries.clear();
    jobs.clear();
    services.clear();

    inMemoryWalletRegistry.clear();
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemorySecJobRegistry.clear();
    inMemorySecIdempotencyMap.clear();

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

    // Fund Buyer Wallet with 100 credits
    inMemoryWalletRegistry.set(buyerId, {
      agentId: buyerId,
      creditsBalance: 100,
      availableBalance: 100,
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
    expect(SEC_ANALYST_SERVICE_RECORD.price).toBe(25);
    expect(SEC_ANALYST_SERVICE_RECORD.currency).toBe('CREDITS');
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

  it('Requirement 4: HTTP Security — Unauthenticated paid job request is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/unauthorized|authentication required|invalid/i);
  });

  it('Requirement 5: HTTP Security — Request with invalid or revoked API key is rejected with 401', async () => {
    // 1. Invalid key format/secret
    const resInvalid = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', 'Bearer sb_live_fakekey_invalidsignature123456')
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(resInvalid.status).toBe(401);

    // 2. Revoked key
    const keyToRevoke = inMemoryKeyRegistry.get(buyerKeyId);
    keyToRevoke.status = 'revoked';

    const resRevoked = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(resRevoked.status).toBe(401);
    expect(resRevoked.body.error).toMatch(/revoked|invalid/i);
  });

  it('Requirement 6: HTTP Security — Request with missing required scope is rejected with 403', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerNoTransactScopeKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|scope/i);
  });

  it('Requirement 7: HTTP Security — Buyer identity spoofing in request body is rejected with 403', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q',
        buyerAgentId: 'victim_other_agent_99' // Mismatched body trying to spoof another buyer
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('IDENTITY_SPOOFING_REJECTED');
    expect(res.body.error).toMatch(/identity spoofing/i);
  });

  it('Requirement 8: Economic Integrity — Price tampering in request body is ignored and canonical 25 credits is enforced', async () => {
    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q',
        price: 1 // Malicious attempt to get 25-credit service for 1 credit
      });

    expect(res.status).toBe(200);
    expect(res.body.settlement.grossAmount).toBe(25);
    expect(res.body.settlement.sellerNet).toBe(24);
    expect(res.body.settlement.platformFee).toBe(1);

    // Buyer wallet correctly debited canonical 25 credits
    const buyerWallet = inMemoryWalletRegistry.get(buyerId)!;
    expect(buyerWallet.creditsBalance).toBe(75);
  });

  it('Requirement 9: Economic Integrity — Insufficient funds returns 402 Payment Required', async () => {
    // Set buyer balance to 10 credits (less than required 25)
    inMemoryWalletRegistry.get(buyerId)!.creditsBalance = 10;
    inMemoryWalletRegistry.get(buyerId)!.availableBalance = 10;

    const res = await request(app)
      .post('/api/v1/sec/job')
      .set('Authorization', `Bearer ${buyerApiKey}`)
      .send({
        ticker: 'AAPL',
        filingType: '10-Q'
      });

    expect(res.status).toBe(402);
    expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it('Requirement 10: Idempotency — Repeated requests with same idempotency key return cached result without double charging', async () => {
    const idempotencyKey = 'idem_sec_unique_order_999';

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
    expect(res1.body.settlement.grossAmount).toBe(25);

    // Buyer debited once: 100 -> 75
    expect(inMemoryWalletRegistry.get(buyerId)!.creditsBalance).toBe(75);
    expect(secAnalystStats.jobsCompleted).toBe(1);
    expect(secAnalystStats.revenue).toBe(25);

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
    expect(res2.body.idempotentReplay).toBe(true);

    // Zero double debit: balance remains 75, stats stay at 1 job / 25 revenue
    expect(inMemoryWalletRegistry.get(buyerId)!.creditsBalance).toBe(75);
    expect(secAnalystStats.jobsCompleted).toBe(1);
    expect(secAnalystStats.revenue).toBe(25);
    expect(secAnalystStats.netRevenue).toBe(24);
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
});
