// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { db, dbStoreInstance } from './firebaseAdmin.js';
import {
  SB_SCORE_METHODOLOGY_VERSION,
  SB_OUTCOME_METHODOLOGY_VERSION,
  QUANT_METHODOLOGY_VERSION,
  persistSBScore,
  calculateOutcomeForScore,
  runDailyOutcomeCalculationJob,
  getSBScoreHistory,
  persistQuantRun,
  setHistoricalPriceProvider,
  resetHistoricalPriceProvider,
  HistoricalSBScoreRecord
} from './historicalIntelligenceService.js';
import { agentIntelligenceRouter } from './agentIntelligenceApi.js';
import { MCP_TOOLS, PAID_MCP_TOOLS, MCP_TOOL_PRICING, handleMcpRpcRequest } from './mcpService.js';

describe('Stock Bloc Historical Intelligence Persistence & Outcome Engine', () => {
  const TEST_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

  beforeEach(() => {
    process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;

    // Clear test in-memory collections
    const sbScores = dbStoreInstance.getCollection('sb_scores');
    const outcomes = dbStoreInstance.getCollection('sb_score_outcomes');
    const quantRuns = dbStoreInstance.getCollection('quant_runs');
    sbScores.clear();
    outcomes.clear();
    quantRuns.clear();

    resetHistoricalPriceProvider();
  });

  afterEach(() => {
    resetHistoricalPriceProvider();
  });

  describe('1. Methodology Constants & Versioning', () => {
    it('exports SB_SCORE_METHODOLOGY_VERSION as SB_SCORE_V1', () => {
      expect(SB_SCORE_METHODOLOGY_VERSION).toBe('SB_SCORE_V1');
      expect(SB_OUTCOME_METHODOLOGY_VERSION).toBe('SB_OUTCOME_V1');
      expect(QUANT_METHODOLOGY_VERSION).toBe('QUANT_V1');
    });
  });

  describe('2. SB Score Immutable Snapshot Persistence', () => {
    it('persists a complete, schema-compliant SB Score snapshot to sb_scores', async () => {
      const record = await persistSBScore({
        ticker: 'nvda',
        priceAtScore: 138.25,
        sbScore: 88,
        signalLabel: 'STRONG BUY',
        components: {
          momentum: 24,
          trend: 24,
          relativeStrength: 18,
          volume: 12,
          volatility: 10
        },
        indicators: {
          rsi: 68.4,
          sma20: 130.5,
          sma50: 125.0,
          sma200: 105.2,
          volumeRatio: 1.45,
          volatility: 0.28,
          week52percentile: 0.94
        },
        dataSource: 'Yahoo Finance chart API',
        dataFreshnessSeconds: 0
      });

      expect(record.scoreId).toBeDefined();
      expect(record.ticker).toBe('NVDA'); // Normalized uppercase
      expect(record.priceAtScore).toBe(138.25);
      expect(record.sbScore).toBe(88);
      expect(record.signalLabel).toBe('STRONG BUY');
      expect(record.methodologyVersion).toBe(SB_SCORE_METHODOLOGY_VERSION);
      expect(record.components.momentum).toBe(24);
      expect(record.indicators.rsi).toBe(68.4);
      expect(new Date(record.timestamp).toISOString()).toBe(record.timestamp);

      // Verify persisted in Firestore collection
      const doc = await db.collection('sb_scores').doc(record.scoreId).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.ticker).toBe('NVDA');
    });

    it('enforces immutability: identical scoreId returns existing record without mutation', async () => {
      const original = await persistSBScore({
        scoreId: 'fixed-score-uuid-1',
        ticker: 'AAPL',
        priceAtScore: 180.0,
        sbScore: 75,
        signalLabel: 'BUY',
        components: { momentum: 20, trend: 20, relativeStrength: 15, volume: 10, volatility: 10 },
        indicators: { rsi: 55, sma20: 175, sma50: 170, sma200: 160, volumeRatio: 1.1, volatility: 0.22, week52percentile: 0.8 }
      });

      // Attempt to overwrite with different score and price
      const secondAttempt = await persistSBScore({
        scoreId: 'fixed-score-uuid-1',
        ticker: 'AAPL',
        priceAtScore: 999.99,
        sbScore: 10,
        signalLabel: 'STRONG SELL',
        components: { momentum: 0, trend: 0, relativeStrength: 0, volume: 0, volatility: 0 },
        indicators: { rsi: 10, sma20: 100, sma50: 100, sma200: 100, volumeRatio: 0.5, volatility: 0.5, week52percentile: 0.1 }
      });

      // Verify record was NOT mutated
      expect(secondAttempt.sbScore).toBe(75);
      expect(secondAttempt.priceAtScore).toBe(180.0);
      expect(secondAttempt.signalLabel).toBe('BUY');

      const doc = await db.collection('sb_scores').doc('fixed-score-uuid-1').get();
      expect(doc.data()?.priceAtScore).toBe(180.0);
      expect(doc.data()?.sbScore).toBe(75);
    });
  });

  describe('3. Outcome Tracking & Horizon Eligibility', () => {
    it('does not calculate any outcomes if score is less than 30 days old', async () => {
      const now = new Date('2026-10-01T12:00:00.000Z');
      const recentTimestamp = new Date('2026-09-20T12:00:00.000Z').toISOString(); // 11 days old

      const scoreRecord: HistoricalSBScoreRecord = {
        scoreId: 'score-recent',
        ticker: 'NVDA',
        timestamp: recentTimestamp,
        priceAtScore: 100.0,
        sbScore: 80,
        signalLabel: 'BUY',
        components: { momentum: 20, trend: 20, relativeStrength: 15, volume: 15, volatility: 10 },
        indicators: { rsi: 60, sma20: 95, sma50: 90, sma200: 80, volumeRatio: 1.2, volatility: 0.25, week52percentile: 0.85 },
        dataSource: 'Yahoo Finance chart API',
        dataFreshnessSeconds: 0,
        methodologyVersion: SB_SCORE_METHODOLOGY_VERSION,
        createdAt: recentTimestamp
      };

      const outcome = await calculateOutcomeForScore(scoreRecord, now);
      expect(outcome).toBeNull();

      const doc = await db.collection('sb_score_outcomes').doc('score-recent').get();
      expect(doc.exists).toBe(false);
    });

    it('calculates 30d outcome independently when age is 35 days (60d and 90d remain null)', async () => {
      const scoreDate = new Date('2026-08-01T12:00:00.000Z');
      const now = new Date(scoreDate.getTime() + 35 * 86400 * 1000); // 35 days later

      // Mock historical price provider
      setHistoricalPriceProvider(async (ticker, targetDate) => {
        return {
          price: 125.0, // +25% return
          observationTimestamp: targetDate.toISOString()
        };
      });

      const scoreRecord: HistoricalSBScoreRecord = {
        scoreId: 'score-35d',
        ticker: 'NVDA',
        timestamp: scoreDate.toISOString(),
        priceAtScore: 100.0,
        sbScore: 85,
        signalLabel: 'STRONG BUY',
        components: { momentum: 22, trend: 22, relativeStrength: 18, volume: 13, volatility: 10 },
        indicators: { rsi: 65, sma20: 98, sma50: 92, sma200: 85, volumeRatio: 1.3, volatility: 0.26, week52percentile: 0.9 },
        dataSource: 'Yahoo Finance chart API',
        dataFreshnessSeconds: 0,
        methodologyVersion: SB_SCORE_METHODOLOGY_VERSION,
        createdAt: scoreDate.toISOString()
      };

      const outcome = await calculateOutcomeForScore(scoreRecord, now);
      expect(outcome).not.toBeNull();
      expect(outcome?.price30d).toBe(125.0);
      expect(outcome?.return30d).toBe(25.0); // ((125 - 100)/100) * 100
      expect(outcome?.price60d).toBeNull();
      expect(outcome?.return60d).toBeNull();
      expect(outcome?.price90d).toBeNull();
      expect(outcome?.return90d).toBeNull();
      expect(outcome?.outcomeVersion).toBe(SB_OUTCOME_METHODOLOGY_VERSION);

      // Verify the original sb_scores document was NOT modified
      const originalDoc = await db.collection('sb_scores').doc('score-35d').get();
      expect(originalDoc.exists).toBe(false); // only stored in outcomes
    });

    it('calculates 60d outcome on Day 65 while preserving existing 30d outcome idempotently', async () => {
      const scoreDate = new Date('2026-07-01T12:00:00.000Z');
      const day35 = new Date(scoreDate.getTime() + 35 * 86400 * 1000);
      const day65 = new Date(scoreDate.getTime() + 65 * 86400 * 1000);

      const scoreRecord: HistoricalSBScoreRecord = {
        scoreId: 'score-multi-horizon',
        ticker: 'TSLA',
        timestamp: scoreDate.toISOString(),
        priceAtScore: 200.0,
        sbScore: 70,
        signalLabel: 'BUY',
        components: { momentum: 18, trend: 18, relativeStrength: 14, volume: 10, volatility: 10 },
        indicators: { rsi: 58, sma20: 195, sma50: 190, sma200: 180, volumeRatio: 1.0, volatility: 0.35, week52percentile: 0.75 },
        dataSource: 'Yahoo Finance chart API',
        dataFreshnessSeconds: 0,
        methodologyVersion: SB_SCORE_METHODOLOGY_VERSION,
        createdAt: scoreDate.toISOString()
      };

      // Step 1: Run on Day 35 (30d price = 220)
      setHistoricalPriceProvider(async () => ({ price: 220.0, observationTimestamp: '2026-08-01T00:00:00Z' }));
      const outcomeDay35 = await calculateOutcomeForScore(scoreRecord, day35);
      expect(outcomeDay35?.price30d).toBe(220.0);
      expect(outcomeDay35?.return30d).toBe(10.0);
      expect(outcomeDay35?.price60d).toBeNull();

      // Step 2: Run on Day 65 (60d price = 250)
      setHistoricalPriceProvider(async () => ({ price: 250.0, observationTimestamp: '2026-09-01T00:00:00Z' }));
      const outcomeDay65 = await calculateOutcomeForScore(scoreRecord, day65);
      expect(outcomeDay65?.price30d).toBe(220.0); // Preserved!
      expect(outcomeDay65?.return30d).toBe(10.0);  // Preserved!
      expect(outcomeDay65?.price60d).toBe(250.0); // Newly calculated
      expect(outcomeDay65?.return60d).toBe(25.0); // ((250 - 200)/200) * 100
      expect(outcomeDay65?.price90d).toBeNull();  // Not yet eligible
    });
  });

  describe('4. Daily Outcome Calculation Batch Job', () => {
    it('processes eligible historical scores, skips ineligible ones, and handles individual failures gracefully', async () => {
      const now = new Date('2026-10-01T12:00:00.000Z');
      const eligibleDate = new Date(now.getTime() - 40 * 86400 * 1000).toISOString(); // 40 days old
      const ineligibleDate = new Date(now.getTime() - 10 * 86400 * 1000).toISOString(); // 10 days old

      // Insert two scores
      await persistSBScore({
        scoreId: 'batch-score-eligible',
        ticker: 'NVDA',
        priceAtScore: 100.0,
        sbScore: 88,
        signalLabel: 'STRONG BUY',
        components: { momentum: 24, trend: 24, relativeStrength: 18, volume: 12, volatility: 10 },
        indicators: { rsi: 70, sma20: 95, sma50: 90, sma200: 80, volumeRatio: 1.5, volatility: 0.25, week52percentile: 0.95 },
        customTimestamp: eligibleDate
      });

      await persistSBScore({
        scoreId: 'batch-score-ineligible',
        ticker: 'MSFT',
        priceAtScore: 400.0,
        sbScore: 78,
        signalLabel: 'BUY',
        components: { momentum: 20, trend: 20, relativeStrength: 16, volume: 11, volatility: 11 },
        indicators: { rsi: 58, sma20: 395, sma50: 390, sma200: 380, volumeRatio: 1.1, volatility: 0.18, week52percentile: 0.85 },
        customTimestamp: ineligibleDate
      });

      setHistoricalPriceProvider(async (ticker) => {
        if (ticker === 'NVDA') return { price: 130.0, observationTimestamp: '2026-09-01T00:00:00Z' };
        return null;
      });

      const jobReport = await runDailyOutcomeCalculationJob(now, 50);
      expect(jobReport.processed).toBeGreaterThanOrEqual(1);
      expect(jobReport.updated).toBeGreaterThanOrEqual(1);

      // Verify outcomes stored
      const outcomeSnap = await db.collection('sb_score_outcomes').doc('batch-score-eligible').get();
      expect(outcomeSnap.exists).toBe(true);
      expect(outcomeSnap.data()?.price30d).toBe(130.0);
      expect(outcomeSnap.data()?.return30d).toBe(30.0);
    });
  });

  describe('5. Paid Historical Intelligence REST API ($0.05 USDC)', () => {
    let app: express.Application;

    beforeEach(async () => {
      app = express();
      app.use(express.json());
      app.use('/api/v1/intelligence', agentIntelligenceRouter);

      // Seed 2 historical score records with outcomes
      const date1 = new Date('2026-08-01T12:00:00.000Z').toISOString();
      const date2 = new Date('2026-08-15T12:00:00.000Z').toISOString();

      await persistSBScore({
        scoreId: 'score-hist-1',
        ticker: 'NVDA',
        priceAtScore: 120.0,
        sbScore: 82,
        signalLabel: 'BUY',
        components: { momentum: 22, trend: 22, relativeStrength: 16, volume: 12, volatility: 10 },
        indicators: { rsi: 64, sma20: 115, sma50: 110, sma200: 95, volumeRatio: 1.2, volatility: 0.25, week52percentile: 0.9 },
        customTimestamp: date1
      });

      await persistSBScore({
        scoreId: 'score-hist-2',
        ticker: 'NVDA',
        priceAtScore: 128.0,
        sbScore: 86,
        signalLabel: 'STRONG BUY',
        components: { momentum: 24, trend: 23, relativeStrength: 17, volume: 12, volatility: 10 },
        indicators: { rsi: 69, sma20: 122, sma50: 115, sma200: 100, volumeRatio: 1.4, volatility: 0.27, week52percentile: 0.95 },
        customTimestamp: date2
      });

      // Attach outcome to score-hist-1
      await db.collection('sb_score_outcomes').doc('score-hist-1').set({
        scoreId: 'score-hist-1',
        ticker: 'NVDA',
        price30d: 135.0,
        return30d: 12.5,
        price60d: null,
        return60d: null,
        price90d: null,
        return90d: null,
        calculatedAt: new Date().toISOString(),
        outcomeVersion: SB_OUTCOME_METHODOLOGY_VERSION
      });
    });

    it('returns HTTP 402 with valid x402 v2 challenge when unpaid', async () => {
      const res = await request(app)
        .get('/api/v1/intelligence/sb-score/history?ticker=NVDA');

      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();

      const decodedPayload = JSON.parse(Buffer.from(res.headers['payment-required'], 'base64').toString());
      expect(decodedPayload.x402Version).toBe(2);
      expect(decodedPayload.accepts[0].amount).toBe('50000'); // 0.05 USDC
      expect(decodedPayload.accepts[0].extra.priceUsd).toBe('$0.05');
    });

    it('returns structured historical snapshots with attached outcomes via getSBScoreHistory', async () => {
      const history = await getSBScoreHistory({ ticker: 'NVDA', limit: 10 });
      expect(history.status).toBe('success');
      expect(history.ticker).toBe('NVDA');
      expect(history.methodologyVersion).toBe(SB_SCORE_METHODOLOGY_VERSION);
      expect(history.items).toHaveLength(2);

      // Verify descending ordering
      expect(new Date(history.items[0].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(history.items[1].timestamp).getTime()
      );

      // Verify outcome attachment
      const itemWithOutcome = history.items.find(i => i.scoreId === 'score-hist-1');
      expect(itemWithOutcome).toBeDefined();
      expect(itemWithOutcome?.outcomes.price30d).toBe(135.0);
      expect(itemWithOutcome?.outcomes.return30d).toBe(12.5);
      expect(itemWithOutcome?.outcomes.price60d).toBeNull();
    });
  });

  describe('6. MCP Tool Registration & Pricing', () => {
    it('registers get_sb_score_history in MCP_TOOLS with correct schema', () => {
      const tool = MCP_TOOLS.find(t => t.name === 'get_sb_score_history');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('ticker');
    });

    it('registers get_sb_score_history as a paid MCP tool priced at $0.05 USDC', () => {
      expect(PAID_MCP_TOOLS.has('get_sb_score_history')).toBe(true);
      expect(MCP_TOOL_PRICING.get_sb_score_history).toBeDefined();
      expect(MCP_TOOL_PRICING.get_sb_score_history.priceUsd).toBe(0.05);
      expect(MCP_TOOL_PRICING.get_sb_score_history.atomicAmount).toBe('50000');
    });

    it('returns standard x402 MCP error response when calling get_sb_score_history without payment', async () => {
      const mcpApp = express();
      mcpApp.use(express.json());
      mcpApp.post('/api/mcp/rpc', handleMcpRpcRequest);

      const res = await request(mcpApp)
        .post('/api/mcp/rpc')
        .send({
          jsonrpc: '2.0',
          id: 'test-mcp-1',
          method: 'tools/call',
          params: {
            name: 'get_sb_score_history',
            arguments: { ticker: 'NVDA' }
          }
        });

      expect(res.status).toBe(200); // MCP returns 200 with isError: true
      expect(res.body.result?.isError).toBe(true);
      expect(res.body.result?._meta?.['x402/payment-required']).toBeDefined();
      expect(res.body.result?.structuredContent?.accepts[0]?.amount).toBe('50000'); // $0.05 USDC
      expect(res.body.result?.structuredContent?.accepts[0]?.asset).toBeDefined();
    });
  });

  describe('7. Quant Simulation Immutable Persistence', () => {
    it('persists completed quant simulation run to quant_runs collection', async () => {
      const run = await persistQuantRun({
        strategyName: 'Super Sonic Tsunami Momentum Test',
        parameters: { benchmark: 'super_sonic_tsunami', riskTolerance: 'moderate', horizonDays: 90 },
        inputPortfolio: { NVDA: 0.5, SPCX: 0.5 },
        lookbackDays: 90,
        assumptions: { riskFreeRate: 0.0425 },
        benchmark: 'super_sonic_tsunami',
        results: {
          return: 34.5,
          sharpe: 2.15,
          drawdown: -8.4,
          volatility: 22.1,
          winRate: 78.5
        }
      });

      expect(run.runId).toBeDefined();
      expect(run.strategyName).toBe('Super Sonic Tsunami Momentum Test');
      expect(run.methodologyVersion).toBe(QUANT_METHODOLOGY_VERSION);
      expect(run.results.sharpe).toBe(2.15);

      const doc = await db.collection('quant_runs').doc(run.runId).get();
      expect(doc.exists).toBe(true);
      expect(doc.data()?.results.sharpe).toBe(2.15);
    });

    it('enforces immutability: duplicate runId returns existing record without mutation', async () => {
      const original = await persistQuantRun({
        runId: 'quant-fixed-uuid',
        strategyName: 'Original Strategy',
        parameters: {},
        inputPortfolio: { AAPL: 1.0 },
        lookbackDays: 90,
        assumptions: {},
        benchmark: 'sp500',
        results: { return: 15.0, sharpe: 1.2, drawdown: -12.0, volatility: 18.0, winRate: 60.0 }
      });

      const attemptOverwrite = await persistQuantRun({
        runId: 'quant-fixed-uuid',
        strategyName: 'Overwritten Strategy',
        parameters: {},
        inputPortfolio: { TSLA: 1.0 },
        lookbackDays: 30,
        assumptions: {},
        benchmark: 'nasdaq100',
        results: { return: 99.0, sharpe: 5.0, drawdown: 0, volatility: 5.0, winRate: 100.0 }
      });

      expect(attemptOverwrite.strategyName).toBe('Original Strategy');
      expect(attemptOverwrite.results.sharpe).toBe(1.2);
    });
  });
});
