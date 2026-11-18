// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler,
  resetFacilitatorMock,
} from './testSetup/facilitatorMock.js';
import { app } from '../server.impl.js';
import { clearX402SettlementRegistry } from './x402PaymentService.js';
import {
  clearTelemetryState,
  getTransactionFunnelMetrics,
  getMachineRevenueMetrics,
} from './agentTelemetry.js';

const EXPECTED_PAY_TO = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
const USDC_ASSET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function makePaidHeader(nonce: string) {
  return JSON.stringify({
    x402Version: 2,
    payload: {
      signature: '0x_sig_changes_' + nonce,
      authorization: {
        from: '0xBuyerWalletChanges',
        to: EXPECTED_PAY_TO,
        value: '10000',
        nonce,
      },
    },
    accepted: {
      scheme: 'exact',
      network: 'eip155:8453',
      amount: '10000',
      asset: USDC_ASSET,
      payTo: EXPECTED_PAY_TO,
    },
  });
}

function buildYahooChartPayload(days: number, mode: 'flat' | 'surge') {
  const nowSec = Math.floor(Date.now() / 1000);
  const timestamps: number[] = [];
  const closes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const volumes: number[] = [];

  for (let i = days; i >= 0; i--) {
    const t = nowSec - i * 86400;
    timestamps.push(t);
    let price = 150;
    let vol = 40_000_000;
    if (mode === 'surge' && i === 0) {
      // Single-day jump +8% with 2.2x volume on latest bar -> drives Momentum & Volume factors >= 3 pts
      price = 162;
      vol = 90_000_000;
    } else if (mode === 'flat') {
      // Completely steady price and volume -> 0 factor deltas
      price = 150;
      vol = 40_000_000;
    } else {
      // Gentle uptrend prior bars
      price = 148 + ((days - i) % 3) * 0.5;
    }
    closes.push(price);
    highs.push(price + 1);
    lows.push(price - 1);
    volumes.push(vol);
  }

  return {
    chart: {
      result: [
        {
          timestamp: timestamps,
          indicators: {
            quote: [{ close: closes, high: highs, low: lows, volume: volumes }],
          },
        },
      ],
    },
  };
}

describe('Per-Ticker Change-Detection Endpoint (GET /api/v1/intelligence/changes) Suite', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearTelemetryState();
    process.env.X402_RECIPIENT_ADDRESS = EXPECTED_PAY_TO;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-changes-test-'));
    process.env.SB_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearTelemetryState();
    delete process.env.SB_DATA_DIR;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('1. GET /api/v1/intelligence/changes/sample returns real NVDA Nov 17 example with 0 network calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    for (const route of ['/api/v1/intelligence/changes/sample', '/api/intelligence/changes/sample']) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.headers['x-stock-bloc-sample']).toBe('true');
      expect(res.body.sample).toBe(true);
      expect(res.body.paidRoute.price).toBe('$0.01 USDC (x402, Base)');
      expect(res.body.paidRoute.atomicAmount).toBe('10000');
      expect(res.body.output.ticker).toBe('NVDA');
      expect(res.body.output.since).toBe('2026-11-17T00:00:00Z');
      expect(Array.isArray(res.body.output.changes)).toBe(true);
      expect(res.body.output.changes.length).toBeGreaterThanOrEqual(1);
    }

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('2. Unpaid valid call returns genuine HTTP 402 ($0.01 USDC / 10000 atomic)', async () => {
    const res = await request(app).get('/api/v1/intelligence/changes?ticker=NVDA&since=2026-11-17T00:00:00Z');
    expect(res.status).toBe(402);
    expect(res.headers['payment-required']).toBeDefined();
    const decoded = JSON.parse(
      Buffer.from(res.headers['payment-required'], 'base64').toString('utf8')
    );
    expect(decoded.x402Version).toBe(2);
    expect(decoded.accepts[0].amount).toBe('10000');
    expect(decoded.accepts[0].asset).toBe(USDC_ASSET);
    expect(decoded.accepts[0].network).toBe('eip155:8453');
    expect(decoded.accepts[0].payTo.toLowerCase()).toBe(EXPECTED_PAY_TO.toLowerCase());
  });

  it('3. Missing/invalid since or missing ticker returns free HTTP 400 (charged: false), unknown ticker returns free HTTP 404', async () => {
    const originalFetch = global.fetch;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('sec.gov/files/company_tickers.json')) {
        return new Response(
          JSON.stringify({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(input, init);
    });

    const missingTicker = await request(app).get('/api/v1/intelligence/changes?since=2026-11-17T00:00:00Z');
    expect(missingTicker.status).toBe(400);
    expect(missingTicker.headers['payment-required']).toBeUndefined();
    expect(missingTicker.body.charged).toBe(false);

    const missingSince = await request(app).get('/api/v1/intelligence/changes?ticker=NVDA');
    expect(missingSince.status).toBe(400);
    expect(missingSince.headers['payment-required']).toBeUndefined();
    expect(missingSince.body.charged).toBe(false);
    expect(missingSince.body.message).toMatch(/since/i);

    const badSince = await request(app).get('/api/v1/intelligence/changes?ticker=NVDA&since=not-a-timestamp');
    expect(badSince.status).toBe(400);
    expect(badSince.headers['payment-required']).toBeUndefined();
    expect(badSince.body.charged).toBe(false);

    const unknownTicker = await request(app).get('/api/v1/intelligence/changes?ticker=ZZZZZZ999&since=2026-11-17T00:00:00Z');
    expect(unknownTicker.status).toBe(404);
    expect(unknownTicker.headers['payment-required']).toBeUndefined();
    expect(unknownTicker.body.charged).toBe(false);
    expect(unknownTicker.body.error).toBe('unknown_ticker');
  });

  it('4. Paid call detects filing, sb_score (>=2 total or >=3 factor), and 13f changes and records funnel telemetry', async () => {
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.slice(0, 10);
    const yesterdayIso = new Date(Date.now() - 86400 * 1000).toISOString();

    // Seed local 13F cache file in temp SB_DATA_DIR with a recent 13F-HR naming NVDA
    fs.writeFileSync(
      path.join(tmpDir, 'sec_intel_data.json'),
      JSON.stringify({
        status: 'success',
        updated_at: nowIso,
        source: 'SEC EDGAR Form 13F-HR information tables',
        stale: false,
        totalFundsTracked: 1,
        quarterCycle: 'Q3 2026',
        funds: [
          {
            id: 'appaloosa',
            fundName: 'Appaloosa LP',
            fund_name: 'Appaloosa LP',
            cik: '0001656456',
            manager: 'David Tepper',
            filingDate: todayDate,
            filing_date: todayDate,
            holdingsFiledOn: todayDate,
            holdingsAsOf: '2026-09-30',
            holdingsAccession: '0001656456-26-000004',
            holdingsSourceUrl: 'https://www.sec.gov/Archives/edgar/data/1656456/000165645626000004/Form13FInfoTable.xml',
            topHoldings: [
              {
                symbol: 'NVDA',
                name: 'NVIDIA CORP',
                shares: '2.0M',
                valueUsd: 456760000,
                portfolioPercent: 6.04,
              },
            ],
          },
        ],
      }),
      'utf8'
    );

    const settleSpy = vi.fn().mockResolvedValue({
      success: true,
      payer: '0xBuyerWalletChanges',
      txHash: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    });
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerWalletChanges' }));
    setFacilitatorSettleHandler(settleSpy);

    const originalFetch = global.fetch;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('sec.gov/files/company_tickers.json')) {
        return new Response(
          JSON.stringify({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('CIK0001045810.json')) {
        return new Response(
          JSON.stringify({
            name: 'NVIDIA CORP',
            filings: {
              recent: {
                form: ['8-K', '10-Q'],
                filingDate: [todayDate, '2026-06-01'],
                acceptanceDateTime: [nowIso, '2026-06-01T20:00:00.000Z'],
                accessionNumber: ['0001045810-26-000088', '0001045810-26-000050'],
                primaryDocument: ['nvda-20261117.htm', 'nvda-10q.htm'],
                items: ['2.02,9.01', ''],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('finance.yahoo.com/v8/finance/chart/NVDA')) {
        return new Response(JSON.stringify(buildYahooChartPayload(45, 'surge')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    });

    const unpaidRes = await request(app).get(
      `/api/v1/intelligence/changes?ticker=NVDA&since=${encodeURIComponent(yesterdayIso)}`
    );
    expect(unpaidRes.status).toBe(402);

    const paidRes = await request(app)
      .get(`/api/v1/intelligence/changes?ticker=NVDA&since=${encodeURIComponent(yesterdayIso)}`)
      .set('PAYMENT-SIGNATURE', makePaidHeader('0xnonce_changes_1'));

    expect(paidRes.status).toBe(200);
    expect(settleSpy).toHaveBeenCalledTimes(1);
    expect(paidRes.body.status).toBe('success');
    expect(paidRes.body.ticker).toBe('NVDA');
    expect(paidRes.body.since).toBe(yesterdayIso);
    expect(typeof paidRes.body.asOf).toBe('string');
    expect(paidRes.body.windowClamped).toBe(false);
    expect(paidRes.body.summary).toMatch(/changes? since/i);

    const types = new Set(paidRes.body.changes.map((c: any) => c.type));
    expect(types.has('filing')).toBe(true);
    expect(types.has('sb_score')).toBe(true);
    expect(types.has('13f')).toBe(true);

    const filingChange = paidRes.body.changes.find((c: any) => c.type === 'filing');
    expect(filingChange.link).toContain('000104581026000088/nvda-20261117.htm');

    const thirteenFChange = paidRes.body.changes.find((c: any) => c.type === '13f');
    expect(thirteenFChange.what).toContain('Appaloosa LP');
    expect(thirteenFChange.link).toContain('Form13FInfoTable.xml');

    const funnel = getTransactionFunnelMetrics();
    expect(funnel.challengesServed).toBe(1);
    expect(funnel.paymentAttempts).toBe(1);
    expect(funnel.paymentsVerified).toBe(1);
    expect(funnel.settlementsSucceeded).toBe(1);
    expect(funnel.dataDelivered).toBe(1);

    const rev = getMachineRevenueMetrics();
    expect(rev.revenueByEndpoint.intelligence_changes).toBe(0.01);
  });

  it('5. Paid call with nothing changed returns HTTP 200 with empty changes array and asOf', async () => {
    const yesterdayIso = new Date(Date.now() - 86400 * 1000).toISOString();

    fs.writeFileSync(
      path.join(tmpDir, 'sec_intel_data.json'),
      JSON.stringify({
        status: 'success',
        updated_at: new Date().toISOString(),
        source: 'SEC EDGAR Form 13F-HR information tables',
        stale: false,
        totalFundsTracked: 1,
        quarterCycle: 'Q2 2026',
        funds: [
          {
            id: 'appaloosa',
            fundName: 'Appaloosa LP',
            cik: '0001656456',
            manager: 'David Tepper',
            filingDate: '2026-08-14',
            holdingsFiledOn: '2026-08-14',
            holdingsAsOf: '2026-06-30',
            holdingsAccession: '0001656456-26-000003',
            topHoldings: [{ symbol: 'NVDA', name: 'NVIDIA CORP', shares: '1.0M', valueUsd: 200000000, portfolioPercent: 4.0 }],
          },
        ],
      }),
      'utf8'
    );

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerWalletChanges' }));
    setFacilitatorSettleHandler(async () => ({
      success: true,
      payer: '0xBuyerWalletChanges',
      txHash: '0x2222333344445555666677778888999900001111aaaabbbbccccddddeeeeffff',
    }));

    const originalFetch = global.fetch;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('sec.gov/files/company_tickers.json')) {
        return new Response(
          JSON.stringify({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('CIK0001045810.json')) {
        return new Response(
          JSON.stringify({
            name: 'NVIDIA CORP',
            filings: {
              recent: {
                form: ['10-Q'],
                filingDate: ['2026-06-01'],
                acceptanceDateTime: ['2026-06-01T20:00:00.000Z'],
                accessionNumber: ['0001045810-26-000050'],
                primaryDocument: ['nvda-10q.htm'],
                items: [''],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('finance.yahoo.com/v8/finance/chart/NVDA')) {
        return new Response(JSON.stringify(buildYahooChartPayload(45, 'flat')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    });

    const paidRes = await request(app)
      .get(`/api/v1/intelligence/changes?ticker=NVDA&since=${encodeURIComponent(yesterdayIso)}`)
      .set('PAYMENT-SIGNATURE', makePaidHeader('0xnonce_changes_empty'));

    expect(paidRes.status).toBe(200);
    expect(paidRes.body.status).toBe('success');
    expect(paidRes.body.changes).toEqual([]);
    expect(paidRes.body.count).toBe(0);
    expect(paidRes.body.summary).toMatch(/^No changes since /);
    expect(typeof paidRes.body.asOf).toBe('string');
  });

  it('6. Clamps since > 90 days ago to 90 days and states windowClamped + windowNote in response', async () => {
    const over90DaysIso = new Date(Date.now() - 180 * 86400 * 1000).toISOString();
    const oldFilingIso = new Date(Date.now() - 120 * 86400 * 1000).toISOString();

    fs.writeFileSync(
      path.join(tmpDir, 'sec_intel_data.json'),
      JSON.stringify({
        status: 'success',
        updated_at: new Date().toISOString(),
        source: 'SEC EDGAR Form 13F-HR information tables',
        stale: false,
        totalFundsTracked: 1,
        quarterCycle: 'Q2 2026',
        funds: [
          {
            id: 'appaloosa',
            fundName: 'Appaloosa LP',
            cik: '0001656456',
            manager: 'David Tepper',
            filingDate: oldFilingIso.slice(0, 10),
            holdingsFiledOn: oldFilingIso.slice(0, 10),
            holdingsAsOf: '2026-06-30',
            holdingsAccession: '0001656456-26-000002',
            topHoldings: [{ symbol: 'NVDA', name: 'NVIDIA CORP', shares: '1.0M', valueUsd: 200000000, portfolioPercent: 4.0 }],
          },
        ],
      }),
      'utf8'
    );

    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerWalletChanges' }));
    setFacilitatorSettleHandler(async () => ({
      success: true,
      payer: '0xBuyerWalletChanges',
      txHash: '0x3333444455556666777788889999000011112222aaaabbbbccccddddeeeeffff',
    }));

    const originalFetch = global.fetch;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('sec.gov/files/company_tickers.json')) {
        return new Response(
          JSON.stringify({ '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('CIK0001045810.json')) {
        return new Response(
          JSON.stringify({
            name: 'NVIDIA CORP',
            filings: {
              recent: {
                form: ['10-Q'],
                filingDate: [oldFilingIso.slice(0, 10)],
                acceptanceDateTime: [oldFilingIso],
                accessionNumber: ['0001045810-26-000010'],
                primaryDocument: ['nvda-old-10q.htm'],
                items: [''],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('finance.yahoo.com/v8/finance/chart/NVDA')) {
        return new Response(JSON.stringify(buildYahooChartPayload(120, 'flat')), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    });

    const paidRes = await request(app)
      .get(`/api/v1/intelligence/changes?ticker=NVDA&since=${encodeURIComponent(over90DaysIso)}`)
      .set('PAYMENT-SIGNATURE', makePaidHeader('0xnonce_changes_clamp'));

    expect(paidRes.status).toBe(200);
    expect(paidRes.body.since).toBe(over90DaysIso);
    expect(paidRes.body.windowClamped).toBe(true);
    expect(paidRes.body.windowNote).toMatch(/90 days/i);
    // 120-day-old filing and 13F must be excluded by the 90-day clamp
    expect(paidRes.body.changes).toEqual([]);
  });

  it('7. Advertises intelligence_changes in /.well-known/x402, manifest, OpenAPI, llms.txt, and skill.md', async () => {
    const x402Res = await request(app).get('/.well-known/x402');
    expect(x402Res.status).toBe(200);
    const entry = x402Res.body.endpoints.find((ep: any) => ep.id === 'intelligence_changes');
    expect(entry).toBeDefined();
    expect(entry.priceUsd).toBe(0.01);
    expect(entry.atomicAmount).toBe('10000');
    expect(entry.paths).toContain('/api/v1/intelligence/changes');

    const manifestRes = await request(app).get('/api/v1/agents/manifest.json');
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.endpoints.intelligenceChanges).toBeDefined();
    expect(manifestRes.body.endpoints.intelligenceChanges.path).toBe('/api/v1/intelligence/changes');
    expect(manifestRes.body.endpoints.intelligenceChanges.x402.priceUsd).toBe(0.01);

    for (const file of ['public/openapi.json', 'public/api/v1/openapi.json']) {
      const doc = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
      const op = doc.paths['/api/v1/intelligence/changes']?.get;
      expect(op).toBeDefined();
      expect(op['x-payment-info']).toBeDefined();
      expect(op.parameters.map((p: any) => p.name)).toContain('ticker');
      expect(op.parameters.map((p: any) => p.name)).toContain('since');
      expect(doc.paths['/api/v1/intelligence/changes/sample']?.get).toBeDefined();
    }

    const llmsTxt = fs.readFileSync(path.join(process.cwd(), 'public', 'llms.txt'), 'utf8');
    expect(llmsTxt).toContain('/api/v1/intelligence/changes?ticker=NVDA');
    expect(llmsTxt).toContain('$0.01 USDC');

    const skillMd = fs.readFileSync(path.join(process.cwd(), 'public', 'agents', 'skill.md'), 'utf8');
    expect(skillMd).toContain('/api/v1/intelligence/changes?ticker=NVDA');
    expect(skillMd).toContain('$0.01 USDC');
  });
});
