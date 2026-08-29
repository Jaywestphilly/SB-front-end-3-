import { describe, it, expect, beforeEach } from 'vitest';
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
  executeSecAnalystJob,
  initializeSecAnalystAgent,
  secAnalystStats
} from './secAnalystAgent.js';

describe('Stock Bloc Native SEC Analyst Agent — Verification & Deterministic Settlement Suite', () => {
  const buyerId = 'agent_buyer_quant_test';
  const buyerHandle = 'quant_buyer';

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

    // Reset SEC Analyst statistics
    secAnalystStats.jobsCompleted = 0;
    secAnalystStats.revenue = 0;
    secAnalystStats.netRevenue = 0;
    secAnalystStats.averageJobValue = 25;
    secAnalystStats.successRate = 100;
    secAnalystStats.averageResponseTime = 1200;
    secAnalystStats.reputationScore = 92;

    // Bootstrap SEC Analyst Agent & Service
    await initializeSecAnalystAgent();

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

  it('Requirement 1: Registers as a Stock Bloc-native verified agent with designated capabilities', () => {
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

    // Service definition check
    expect(SEC_ANALYST_SERVICE_RECORD.serviceId).toBe(SEC_ANALYST_SERVICE_ID);
    expect(SEC_ANALYST_SERVICE_RECORD.name).toBe(SEC_ANALYST_SERVICE_NAME);
    expect(SEC_ANALYST_SERVICE_RECORD.price).toBe(25);
    expect(SEC_ANALYST_SERVICE_RECORD.currency).toBe('CREDITS');
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
    expect(executionResult.reputation.compositeScore).toBeGreaterThanOrEqual(60);
    expect(['GOLD_RESEARCHER', 'PLATINUM_ANALYST', 'DIAMOND_QUANT']).toContain(executionResult.reputation.tier);
  });

  it('Requirement 4: Supports 10-K Annual and 8-K Current filing analysis across multiple companies', () => {
    // 10-K analysis
    const nvda10k = analyzeSecFiling({ ticker: 'NVDA', filingType: '10-K' });
    expect(nvda10k.ticker).toBe('NVDA');
    expect(nvda10k.filingType).toBe('10-K');
    expect(nvda10k.companyName).toBe('NVIDIA Corporation');
    expect(nvda10k.revenueHighlights.totalRevenue).toBe('$60.922B');
    expect(nvda10k.sourceReferences[0].form).toBe('10-K');

    // 8-K analysis
    const msft8k = analyzeSecFiling({ ticker: 'MSFT', filingType: '8-K' });
    expect(msft8k.ticker).toBe('MSFT');
    expect(msft8k.filingType).toBe('8-K');
    expect(msft8k.companyName).toBe('Microsoft Corporation');
    expect(msft8k.sourceReferences[0].form).toBe('8-K');

    // TSLA 10-Q analysis
    const tsla10q = analyzeSecFiling({ ticker: 'TSLA', filingType: '10-Q' });
    expect(tsla10q.ticker).toBe('TSLA');
    expect(tsla10q.filingType).toBe('10-Q');
    expect(tsla10q.companyName).toBe('Tesla, Inc.');
    expect(tsla10q.earningsHighlights.grossMargin).toContain('19.84%');
  });

  it('Requirement 5: Rejects malformed input requests with meaningful validation errors', () => {
    expect(() => analyzeSecFiling({} as any)).toThrowError(/ticker.*required/i);
    expect(() => analyzeSecFiling({ ticker: 'AAPL', filingType: 'INVALID_FORM' as any })).toThrowError(/filingType.*must be one of/i);
  });
});
