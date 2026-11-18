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
import { clearSignals8kCache } from './signals8kService.js';
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
      signature: '0x_sig_8k_' + nonce,
      authorization: {
        from: '0xBuyerWallet8K',
        to: EXPECTED_PAY_TO,
        value: '50000',
        nonce,
      },
    },
    accepted: {
      scheme: 'exact',
      network: 'eip155:8453',
      amount: '50000',
      asset: USDC_ASSET,
      payTo: EXPECTED_PAY_TO,
    },
  });
}

function mockSecEdgarFor8k() {
  const originalFetch = global.fetch;
  return vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url || '';

    if (url.includes('sec.gov/files/company_tickers.json')) {
      return new Response(
        JSON.stringify({
          '0': { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' },
          '1': { cik_str: 1780312, ticker: 'ASTS', title: 'AST SpaceMobile, Inc.' },
          '2': { cik_str: 1849056, ticker: 'OKLO', title: 'Oklo Inc.' },
        }),
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
              filingDate: ['2026-11-17', '2026-11-15'],
              acceptanceDateTime: ['2026-11-17T21:20:51.000Z', '2026-11-15T20:00:00.000Z'],
              accessionNumber: ['0001045810-26-000088', '0001045810-26-000080'],
              primaryDocument: ['nvda-20261117.htm', 'nvda-10q.htm'],
              items: ['2.02,9.01', ''],
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('CIK0001780312.json')) {
      return new Response(
        JSON.stringify({
          name: 'AST SpaceMobile, Inc.',
          filings: {
            recent: {
              form: ['8-K', '8-K'],
              filingDate: ['2026-11-18', '2026-11-17'],
              acceptanceDateTime: ['2026-11-18T14:15:00.000Z', '2026-11-17T18:10:00.000Z'],
              accessionNumber: ['0001493152-26-053080', '0001493152-26-052865'],
              primaryDocument: ['form8-k.htm', 'form8-k.htm'],
              items: ['8.01,9.01', '8.01,9.01'],
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('CIK0001849056.json')) {
      return new Response(
        JSON.stringify({
          name: 'Oklo Inc.',
          filings: {
            recent: {
              form: ['8-K'],
              filingDate: ['2026-11-17'],
              acceptanceDateTime: ['2026-11-17T16:45:00.000Z'],
              accessionNumber: ['0001849056-26-000055'],
              primaryDocument: ['oklo-20261111.htm'],
              items: ['1.01,9.01'],
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (url.includes('000104581026000088/nvda-20261117.htm')) {
      return new Response(
        `<html><body>
          <p>Item 2.02 Results of Operations and Financial Condition.</p>
          <p>On November 17, 2026, NVIDIA Corporation issued a press release announcing its financial results for the third quarter ended October 25, 2026. Record data center revenue reached $51.2 billion during the fiscal quarter.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (url.includes('000149315226053080/form8-k.htm')) {
      return new Response(
        `<html><body>
          <p>Item 8.01 Other Events.</p>
          <p>AST SpaceMobile issued common shares in connection with the Ligado spectrum transaction milestone. The shares were issued pursuant to existing settlement terms.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (url.includes('000149315226052865/form8-k.htm')) {
      return new Response(
        `<html><body>
          <p>Item 8.01 Other Events.</p>
          <p>AST SpaceMobile completed a share issuance under its launch services agreement with Firefly Aerospace.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (url.includes('000184905626000055/oklo-20261111.htm')) {
      return new Response(
        `<html><body>
          <p>Item 1.01 Entry into a Material Definitive Agreement.</p>
          <p>Oklo Inc. entered into a HALEU fuel supply agreement with Centrus Energy Corp. to support initial Aurora powerhouse deployments. The agreement covers enrichment services and feedstock delivery milestones.</p>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return originalFetch(input, init);
  });
}

describe('8-K Event Monitor (GET /api/v1/signals/8k) Suite', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearSignals8kCache();
    clearTelemetryState();
    process.env.X402_RECIPIENT_ADDRESS = EXPECTED_PAY_TO;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-signals8k-test-'));
    process.env.SB_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearSignals8kCache();
    clearTelemetryState();
    delete process.env.SB_DATA_DIR;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup issues
    }
  });

  it('1. GET /api/v1/signals/8k/sample and alias return real NVDA 8-K static sample with 0 network calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    for (const route of ['/api/v1/signals/8k/sample', '/api/signals/8k/sample']) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.headers['x-stock-bloc-sample']).toBe('true');
      expect(res.body.sample).toBe(true);
      expect(res.body.paidRoute.url).toBe('https://stockbloc.ai.studio/api/v1/signals/8k?ticker=NVDA');
      expect(res.body.paidRoute.price).toBe('$0.05 USDC (x402, Base)');
      expect(res.body.output.count).toBe(1);
      expect(res.body.output.filings[0].ticker).toBe('NVDA');
      expect(res.body.output.filings[0].accessionNumber).toBe('0001045810-26-000088');
      expect(res.body.output.filings[0].items).toEqual(['2.02', '9.01']);
      expect(res.body.output.filings[0].itemLabels[0]).toContain('2.02:');
      expect(res.body.output.filings[0].filingUrl).toContain('000104581026000088/nvda-20261117.htm');
      expect(typeof res.body.output.filings[0].summary).toBe('string');
      expect(res.body.output.filings[0].summary.length).toBeGreaterThan(40);
    }

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('2. Unpaid requests return genuine HTTP 402 with $0.05 USDC (50000 atomic) x402 challenge', async () => {
    mockSecEdgarFor8k();

    const urls = [
      '/api/v1/signals/8k?ticker=NVDA',
      '/api/signals/8k?ticker=NVDA',
      '/api/v1/signals/8k?watchlist=NVDA,ASTS,OKLO&since=2026-11-17T00:00:00Z',
    ];

    for (const url of urls) {
      const res = await request(app).get(url);
      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();
      const decoded = JSON.parse(
        Buffer.from(res.headers['payment-required'], 'base64').toString('utf8')
      );
      expect(decoded.x402Version).toBe(2);
      expect(decoded.accepts[0].amount).toBe('50000');
      expect(decoded.accepts[0].asset).toBe(USDC_ASSET);
      expect(decoded.accepts[0].network).toBe('eip155:8453');
      expect(decoded.accepts[0].payTo.toLowerCase()).toBe(EXPECTED_PAY_TO.toLowerCase());
    }
  });

  it('3. Keeps GET /api/v1/signals/daily-triggers completely free (non-402)', async () => {
    mockSecEdgarFor8k();
    const res = await request(app).get('/api/v1/signals/daily-triggers?ticker=NVDA');
    expect(res.status).toBe(200);
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('4. Returns free 404 (charged: false, no 402) for unknown ticker or all-unknown watchlist', async () => {
    mockSecEdgarFor8k();

    const singleUnknown = await request(app).get('/api/v1/signals/8k?ticker=ZZZZZZ999');
    expect(singleUnknown.status).toBe(404);
    expect(singleUnknown.headers['payment-required']).toBeUndefined();
    expect(singleUnknown.body.charged).toBe(false);
    expect(singleUnknown.body.error).toBe('unknown_ticker');

    const watchlistUnknown = await request(app).get('/api/v1/signals/8k?watchlist=ZZZZZZ999,YYYYYY888');
    expect(watchlistUnknown.status).toBe(404);
    expect(watchlistUnknown.headers['payment-required']).toBeUndefined();
    expect(watchlistUnknown.body.charged).toBe(false);
  });

  it('5. Returns free 400 (charged: false, no 402) for invalid since, invalid limit, or >20 watchlist tickers', async () => {
    const badSince = await request(app).get('/api/v1/signals/8k?ticker=NVDA&since=not-a-date');
    expect(badSince.status).toBe(400);
    expect(badSince.headers['payment-required']).toBeUndefined();
    expect(badSince.body.charged).toBe(false);
    expect(badSince.body.message).toMatch(/since/i);

    const badLimit = await request(app).get('/api/v1/signals/8k?ticker=NVDA&limit=100');
    expect(badLimit.status).toBe(400);
    expect(badLimit.headers['payment-required']).toBeUndefined();
    expect(badLimit.body.charged).toBe(false);

    const tooMany = Array.from({ length: 21 }, (_, i) => `T${i}`).join(',');
    const badWatchlist = await request(app).get(`/api/v1/signals/8k?watchlist=${tooMany}`);
    expect(badWatchlist.status).toBe(400);
    expect(badWatchlist.headers['payment-required']).toBeUndefined();
    expect(badWatchlist.body.charged).toBe(false);
  });

  it('6. Paid x402 request returns newest-first 8-K filings with itemLabels, SEC links, filing-text summaries, and records funnel telemetry', async () => {
    const settleSpy = vi.fn().mockResolvedValue({
      success: true,
      payer: '0xBuyerWallet8K',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerWallet8K' }));
    setFacilitatorSettleHandler(settleSpy);
    mockSecEdgarFor8k();

    // First hit unpaid to generate challenge telemetry
    const challengeRes = await request(app).get(
      '/api/v1/signals/8k?watchlist=NVDA,ASTS,OKLO&since=2026-11-17T00:00:00Z'
    );
    expect(challengeRes.status).toBe(402);

    // Then pay & retry
    const paidRes = await request(app)
      .get('/api/v1/signals/8k?watchlist=NVDA,ASTS,OKLO&since=2026-11-17T00:00:00Z')
      .set('PAYMENT-SIGNATURE', makePaidHeader('0xnonce_paid_1'));

    expect(paidRes.status).toBe(200);
    expect(settleSpy).toHaveBeenCalledTimes(1);
    expect(paidRes.body.status).toBe('success');
    expect(paidRes.body.since).toBe('2026-11-17T00:00:00.000Z');
    expect(typeof paidRes.body.asOf).toBe('string');
    expect(paidRes.body.count).toBe(4);
    expect(paidRes.body.filings).toHaveLength(4);

    // Verify newest-first ordering
    expect(paidRes.body.filings[0].ticker).toBe('ASTS');
    expect(paidRes.body.filings[0].filedDate).toBe('2026-11-18');
    expect(paidRes.body.filings[1].ticker).toBe('NVDA');
    expect(paidRes.body.filings[1].accessionNumber).toBe('0001045810-26-000088');
    expect(paidRes.body.filings[1].items).toEqual(['2.02', '9.01']);
    expect(paidRes.body.filings[1].itemLabels).toContain('2.02: Results of Operations and Financial Condition');
    expect(paidRes.body.filings[1].filingUrl).toContain('000104581026000088/nvda-20261117.htm');
    expect(paidRes.body.filings[1].summary).toContain('$51.2 billion');
    expect(paidRes.body.filings[3].ticker).toBe('OKLO');
    expect(paidRes.body.filings[3].summary).toContain('Centrus Energy');

    // Verify funnel telemetry & revenue attribution
    const funnel = getTransactionFunnelMetrics();
    expect(funnel.challengesServed).toBe(1);
    expect(funnel.paymentAttempts).toBe(1);
    expect(funnel.paymentsVerified).toBe(1);
    expect(funnel.settlementsSucceeded).toBe(1);
    expect(funnel.dataDelivered).toBe(1);

    const rev = getMachineRevenueMetrics();
    expect(rev.revenueByEndpoint.signals_8k).toBe(0.05);
  });

  it('7. Paid x402 request with no matching 8-Ks since timestamp returns HTTP 200 with empty filings array and asOf', async () => {
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xBuyerWallet8K' }));
    setFacilitatorSettleHandler(async () => ({
      success: true,
      payer: '0xBuyerWallet8K',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    }));
    mockSecEdgarFor8k();

    const paidRes = await request(app)
      .get('/api/v1/signals/8k?ticker=NVDA&since=2026-11-18T00:00:00Z')
      .set('PAYMENT-SIGNATURE', makePaidHeader('0xnonce_empty_1'));

    expect(paidRes.status).toBe(200);
    expect(paidRes.body.status).toBe('success');
    expect(paidRes.body.count).toBe(0);
    expect(paidRes.body.filings).toEqual([]);
    expect(typeof paidRes.body.asOf).toBe('string');
  });

  it('8. Advertises signals_8k across /.well-known/x402, agent manifest, OpenAPI specs, llms.txt, and skill.md', async () => {
    const x402Res = await request(app).get('/.well-known/x402');
    expect(x402Res.status).toBe(200);
    const x402Entry = x402Res.body.endpoints.find((ep: any) => ep.id === 'signals_8k');
    expect(x402Entry).toBeDefined();
    expect(x402Entry.priceUsd).toBe(0.05);
    expect(x402Entry.atomicAmount).toBe('50000');
    expect(x402Entry.paths).toContain('/api/v1/signals/8k');

    const manifestRes = await request(app).get('/api/v1/agents/manifest.json');
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.endpoints.signals8k).toBeDefined();
    expect(manifestRes.body.endpoints.signals8k.path).toBe('/api/v1/signals/8k');
    expect(manifestRes.body.endpoints.signals8k.x402.priceUsd).toBe(0.05);

    const staticManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'agents', 'manifest.json'), 'utf8')
    );
    expect(staticManifest.endpoints.signals8k).toBeDefined();

    for (const file of ['public/openapi.json', 'public/api/v1/openapi.json']) {
      const doc = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
      expect(doc.paths['/api/v1/signals/8k']?.get).toBeDefined();
      expect(doc.paths['/api/v1/signals/8k']?.get['x-payment-info']).toBeDefined();
      expect(doc.paths['/api/v1/signals/8k/sample']?.get).toBeDefined();
    }

    const llmsTxt = fs.readFileSync(path.join(process.cwd(), 'public', 'llms.txt'), 'utf8');
    expect(llmsTxt).toContain('/api/v1/signals/8k');
    expect(llmsTxt).toContain('/api/v1/signals/8k/sample');
    expect(llmsTxt).toContain('$0.05 USDC');

    const skillMd = fs.readFileSync(path.join(process.cwd(), 'public', 'agents', 'skill.md'), 'utf8');
    expect(skillMd).toContain('/api/v1/signals/8k');
    expect(skillMd).toContain('$0.05 USDC');
  });
});
