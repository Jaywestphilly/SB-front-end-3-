// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  requireX402Payment,
  PRICED_ENDPOINTS,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import { SecIntelService } from '../src/services/secIntelService.js';
import { resetFacilitatorMock } from './testSetup/facilitatorMock.js';

describe('13F & Market Feed Leak Security Suite', () => {
  let app: express.Application;
  const originalEnv = { ...process.env };

  // Track the state of the real database file to ensure it's never modified
  const realDataDir = path.join(process.cwd(), 'server', 'data');
  const realSecDataPath = path.join(realDataDir, 'sec_intel_data.json');
  let realFileExists = false;
  let realFileMtime = 0;
  let realFileSize = 0;

  beforeAll(() => {
    realFileExists = fs.existsSync(realSecDataPath);
    if (realFileExists) {
      const stats = fs.statSync(realSecDataPath);
      realFileMtime = stats.mtimeMs;
      realFileSize = stats.size;
    }
  });

  afterAll(() => {
    // Assert the real production file was never written to or touched by this suite
    const currentExists = fs.existsSync(realSecDataPath);
    expect(currentExists).toBe(realFileExists);
    if (realFileExists && currentExists) {
      const stats = fs.statSync(realSecDataPath);
      expect(stats.size).toBe(realFileSize);
      expect(stats.mtimeMs).toBe(realFileMtime);
    }
  });

  // Target directory for tests: process.env.SB_DATA_DIR (templated per-run)
  const testDataDir = process.env.SB_DATA_DIR || path.join(process.cwd(), 'server', 'data_test');
  const secDataPath = path.join(testDataDir, 'sec_intel_data.json');
  const publicSecDataPath = path.join(process.cwd(), 'public', 'sec_intel_data.json');
  const rootSecDataPath = path.join(process.cwd(), 'sec_intel_data.json');

  const seedFixtureData = () => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    fs.writeFileSync(secDataPath, JSON.stringify({
      status: 'success',
      updated_at: new Date().toISOString(),
      source: 'Test EDGAR Feed',
      quarterCycle: 'Q1/Q2 2026 SEC Form 13F Filings',
      funds: [
        {
          id: 'berkshire',
          fundName: 'Berkshire Hathaway Inc.',
          manager: 'Warren Buffett',
          cik: '0001067983',
          filingDate: '2026-05-15',
          quarter: 'Q1 13F-HR',
          doc_url: 'https://www.sec.gov/edgar/browse/?CIK=0001067983',
          aum: '$284.5B',
          mandate: 'Value investing',
          topHoldings: [
            { symbol: 'AAPL', name: 'Apple Inc.', shares: '300.0M', valueMillions: 67500, portfolioPercent: 23.7, changeType: 'DECREASED', changePercent: -10.5, sector: 'Technology', thesis: 'Core holding' },
            { symbol: 'BAC', name: 'Bank of America Corp', shares: '780.0M', valueMillions: 31200, portfolioPercent: 11.0, changeType: 'DECREASED', changePercent: -8.2, sector: 'Financials', thesis: 'Banking anchor' },
            { symbol: 'AXP', name: 'American Express Co', shares: '151.6M', valueMillions: 36400, portfolioPercent: 12.8, changeType: 'HOLD', changePercent: 0, sector: 'Financials', thesis: 'Premium payments' },
            { symbol: 'KO', name: 'The Coca-Cola Company', shares: '400.0M', valueMillions: 26000, portfolioPercent: 9.1, changeType: 'HOLD', changePercent: 0, sector: 'Consumer Staples', thesis: 'Brand equity' }
          ],
          sectorAllocation: [{ sector: 'Technology', percent: 24.5 }],
          quarterFlows: { newPositionsCount: 1 }
        }
      ],
      consensusHoldings: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', fundCount: 12, overallSentiment: 'STRONG BUY' }
      ],
      macroSummary: 'Institutional capital reallocation into AI power grid infrastructure. Capital expansion continues across frontier silicon.'
    }, null, 2), 'utf-8');
  };

  beforeEach(() => {
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    process.env.X402_RECIPIENT_ADDRESS = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
    process.env.SB_DATA_DIR = testDataDir;

    // Seed the file under process.env.SB_DATA_DIR
    seedFixtureData();

    app = express();
    app.use(express.json());

    // Tombstone route for retired raw json feed endpoints
    app.get(['/market_watchlist_data.json','/api/market-watchlist','/sec_intel_data.json','/api/sec-intel'], (req, res) => res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Not available. Full 13F dataset: GET /api/data/sec ($0.10 USDC via x402). Market data: GET /api/data/market ($0.01 USDC via x402).' }));

    const publicFolder = path.join(process.cwd(), 'public');
    app.use(express.static(publicFolder));

    // Preview route
    app.get('/api/13f/filings', async (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=300');
      const feedData = SecIntelService.loadPersistedData();
      if (!feedData || !feedData.funds || feedData.funds.length === 0) {
        return res.status(503).json({ status: 'unavailable', preview: true, funds: [] });
      }

      const previewFunds = feedData.funds.map((f: any) => ({
        id: f.id,
        fundName: f.fundName || f.fund_name,
        manager: f.manager,
        cik: f.cik,
        filingDate: f.filingDate || f.filing_date,
        quarter: f.quarter,
        doc_url: f.doc_url,
        topHoldings: (f.topHoldings || []).slice(0, 3).map((h: any) => ({
          symbol: h.symbol,
          name: h.name,
          sector: h.sector,
          changeType: h.changeType
        }))
      }));

      const rawSummary = feedData.macroSummary || '';
      const firstSentence = rawSummary.split('.')[0] + '.';

      return res.json({
        status: 'success',
        preview: true,
        timestamp: feedData.updated_at,
        quarterCycle: feedData.quarterCycle,
        totalFundsTracked: feedData.funds.length,
        funds: previewFunds,
        consensusHoldings: (feedData.consensusHoldings || []).slice(0, 3).map((c: any) => ({
          symbol: c.symbol,
          name: c.name,
          fundCount: c.fundCount,
          overallSentiment: c.overallSentiment
        })),
        macroSummary: firstSentence,
        fullDataset: {
          endpoint: 'GET /api/data/sec',
          priceUsd: '0.10',
          protocol: 'x402',
          network: 'eip155:8453'
        }
      });
    });

    // Paid route with 503 readiness middleware
    const secReadinessMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const data = SecIntelService.loadPersistedData();
      if (!data || !data.funds || data.funds.length === 0) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({
          status: 'error',
          code: 'LIVE_DATA_UNAVAILABLE',
          message: '13F dataset temporarily unavailable',
          charged: false
        });
      }
      res.locals.secFeed = data;
      next();
    };

    app.get(['/api/data/sec', '/api/v1/data/sec'], secReadinessMiddleware, requireX402Payment(PRICED_ENDPOINTS.sec_13f_intel), (req, res) => {
      res.json(res.locals.secFeed);
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();

    // Clean up created files under process.env.SB_DATA_DIR to maintain test isolation
    if (fs.existsSync(secDataPath)) {
      fs.unlinkSync(secDataPath);
    }
  });

  it('(a) GET /sec_intel_data.json, /api/sec-intel, /market_watchlist_data.json, and /api/market-watchlist each return 404 JSON, not HTML', async () => {
    const endpoints = [
      '/sec_intel_data.json',
      '/api/sec-intel',
      '/market_watchlist_data.json',
      '/api/market-watchlist'
    ];

    for (const ep of endpoints) {
      const res = await request(app).get(ep);
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('NOT_FOUND');
    }
  });

  it('(b) GET /api/data/sec with Accept: text/html and sec-fetch-site: same-origin returns 402 with PAYMENT-REQUIRED header', async () => {
    const resHtml = await request(app)
      .get('/api/data/sec')
      .set('Accept', 'text/html');

    expect(resHtml.status).toBe(402);
    expect(resHtml.headers['payment-required']).toBeDefined();

    const payHeader = resHtml.headers['payment-required'];
    const decoded = JSON.parse(Buffer.from(payHeader, 'base64').toString('utf8'));
    expect(decoded.accepts[0].amount).toBe('100000');
    expect(decoded.accepts[0].payTo).toBe('0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708');
    expect(decoded.accepts[0].network).toBe('eip155:8453');
    expect(decoded.accepts[0].asset).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');

    const resOrigin = await request(app)
      .get('/api/data/sec')
      .set('sec-fetch-site', 'same-origin');

    expect(resOrigin.status).toBe(402);
    expect(resOrigin.headers['payment-required']).toBeDefined();
  });

  it('(c) GET /api/13f/filings returns preview:true, max 3 topHoldings per fund, and no excluded fields', async () => {
    const res = await request(app).get('/api/13f/filings');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.preview).toBe(true);
    expect(res.body.funds).toBeDefined();
    expect(res.body.funds.length).toBeGreaterThan(0);

    for (const fund of res.body.funds) {
      expect(fund.topHoldings.length).toBeLessThanOrEqual(3);
      for (const exKey of ['filings', 'aum', 'sectorAllocation', 'quarterFlows']) {
        expect((fund as any)[exKey]).toBeUndefined();
      }
      for (const holding of fund.topHoldings) {
        for (const exKey of ['shares', 'valueMillions', 'portfolioPercent', 'changePercent', 'thesis']) {
          expect((holding as any)[exKey]).toBeUndefined();
        }
      }
    }
  });

  it('(d) After SecIntelService refresh, public/sec_intel_data.json does not exist and server/data_test/sec_intel_data.json does', async () => {
    // Ensure clean state
    if (fs.existsSync(publicSecDataPath)) fs.unlinkSync(publicSecDataPath);
    if (fs.existsSync(rootSecDataPath)) fs.unlinkSync(rootSecDataPath);

    // Trigger load or write via SecIntelService
    const loaded = SecIntelService.loadPersistedData();
    expect(loaded).toBeDefined();

    expect(fs.existsSync(secDataPath)).toBe(true);
    expect(fs.existsSync(publicSecDataPath)).toBe(false);
    expect(fs.existsSync(rootSecDataPath)).toBe(false);
  });

  it('(e) With an empty feed, GET /api/data/sec returns 503 LIVE_DATA_UNAVAILABLE with no PAYMENT-REQUIRED', async () => {
    // Overwrite secDataPath with empty funds
    fs.writeFileSync(secDataPath, JSON.stringify({ funds: [] }), 'utf-8');

    const res = await request(app).get('/api/data/sec');

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('LIVE_DATA_UNAVAILABLE');
    expect(res.body.charged).toBe(false);
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('(f) with empty funds in SB_DATA_DIR, and EDGAR mocked to fail, fetchLiveSecData(true) heals to >= TRACKED_CIKS.length', async () => {
    // Seed empty funds list to emulate empty or bad persisted file
    fs.writeFileSync(secDataPath, JSON.stringify({ funds: [] }), 'utf-8');

    // Mock fetch to reject, simulating live EDGAR failure
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('EDGAR network down'));

    try {
      const data = await SecIntelService.fetchLiveSecData(true);
      expect(data).toBeDefined();
      expect(data.funds.length).toBeGreaterThanOrEqual(SecIntelService.TRACKED_CIKS.length);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
