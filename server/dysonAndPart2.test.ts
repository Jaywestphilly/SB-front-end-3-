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
import {
  PRICED_ENDPOINTS,
  BAZAAR_DISCOVERY_EXTENSIONS,
} from './x402PaymentService.js';
import { MCP_TOOLS } from './mcpService.js';
import {
  getStarlinkCatalogSummary,
  getUpcomingAndRecentLaunches,
  getSpaceNewsFeed,
} from './spaceTelemetryService.js';

const EXPECTED_PAY_TO = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';

describe('Dyson Swarm Live Telemetry & Part 2 x402 Streams Suite', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    process.env.X402_RECIPIENT_ADDRESS = EXPECTED_PAY_TO;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-space-test-'));
    process.env.SB_DATA_DIR = tmpDir;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFacilitatorMock();
    delete process.env.SB_DATA_DIR;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup issues
    }
  });

  it('1. All 8 new zero-fetch /sample routes return 200 with sample === true and make 0 global.fetch calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const sampleRoutes = [
      '/api/v1/intelligence/sb-score/sample',
      '/api/v1/intelligence/earnings-pack/sample',
      '/api/v1/market/quote/sample',
      '/api/v1/agent/strategy/evaluate/sample',
      '/api/v1/intelligence/forecasts/sample',
      '/api/v1/sec/8k-events/sample',
      '/api/v1/intelligence/changes/sample',
      '/api/v1/space/telemetry/sample',
    ];

    for (const route of sampleRoutes) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.headers['x-stock-bloc-sample']).toBe('true');
      expect(res.body.sample).toBe(true);
      expect(res.body.paidRoute).toBeDefined();
      expect(res.body.output).toBeDefined();
    }

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('2. Unpaid requests to Part 2 paid routes return 402 with exact atomic amounts (50000, 10000, 50000) and payTo', async () => {
    const cases = [
      { path: '/api/v1/sec/8k-events?ticker=NVDA', expectedAmount: '50000' },
      { path: '/api/sec/8k-events?ticker=NVDA', expectedAmount: '50000' },
      { path: '/api/v1/intelligence/changes?since=2026-11-17T00:00:00Z', expectedAmount: '10000' },
      { path: '/api/intelligence/changes?since=2026-11-17T00:00:00Z', expectedAmount: '10000' },
      { path: '/api/v1/space/telemetry', expectedAmount: '50000' },
    ];

    for (const c of cases) {
      const res = await request(app).get(c.path);
      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();
      const decoded = JSON.parse(
        Buffer.from(res.headers['payment-required'], 'base64').toString('utf8')
      );
      expect(decoded.accepts[0].amount).toBe(c.expectedAmount);
      expect(decoded.accepts[0].payTo.toLowerCase()).toBe(EXPECTED_PAY_TO.toLowerCase());
      expect(decoded.accepts[0].network).toBe('eip155:8453');
    }
  });

  it('3. Pre-payment validation returns HTTP 400 (charged: false) on malformed query inputs', async () => {
    const badTicker = await request(app).get('/api/v1/sec/8k-events?ticker=INVALID_123456!');
    expect(badTicker.status).toBe(400);
    expect(badTicker.body.charged).toBe(false);

    const badLimit = await request(app).get('/api/v1/sec/8k-events?ticker=NVDA&limit=999');
    expect(badLimit.status).toBe(400);
    expect(badLimit.body.charged).toBe(false);

    const badSince = await request(app).get('/api/v1/intelligence/changes?since=not-a-date');
    expect(badSince.status).toBe(400);
    expect(badSince.body.charged).toBe(false);
  });

  it('4. Paid x402 call to GET /api/v1/space/telemetry settles once and returns structured payload', async () => {
    const settleSpy = vi.fn().mockResolvedValue({
      success: true,
      payer: '0xBuyer',
      txHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    });
    setFacilitatorVerifyHandler(async () => ({ isValid: true }));
    setFacilitatorSettleHandler(settleSpy);

    const originalFetch = global.fetch;
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('celestrak.org/satcat')) {
        return new Response(
          JSON.stringify([
            { OBJECT_NAME: 'STARLINK-1', OPS_STATUS_CODE: '+', INCLINATION: 53.2, LAUNCH_DATE: '2026-11-13', DECAY_DATE: '' },
            { OBJECT_NAME: 'STARLINK-2', OPS_STATUS_CODE: 'P', INCLINATION: 97.6, LAUNCH_DATE: '2026-11-13', DECAY_DATE: '' },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('ll.thespacedevs.com')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 'll2_1',
                name: 'Falcon 9 Block 5 | Starlink Test',
                net: '2026-12-01T12:00:00Z',
                lsp_name: 'SpaceX',
                location: 'Cape Canaveral',
                status: { name: 'Go for Launch', abbrev: 'Go' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('api.spaceflightnewsapi.net')) {
        return new Response(
          JSON.stringify({ results: [{ id: 1, title: 'News', url: 'https://example.com', news_site: 'SpaceNews', summary: 'Summary', published_at: '2026-11-18T10:00:00Z' }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return originalFetch(input, init);
    });

    const sig = Buffer.from(
      JSON.stringify({ x402Version: 2, authorization: { from: '0xBuyer', to: EXPECTED_PAY_TO, value: '50000' } })
    ).toString('base64');

    const res = await request(app)
      .get('/api/v1/space/telemetry')
      .set('PAYMENT-SIGNATURE', sig);

    expect(res.status).toBe(200);
    expect(settleSpy).toHaveBeenCalledTimes(1);
    expect(res.body.status).toBe('success');
    expect(res.body.starlinkConstellation).toBeDefined();
    expect(res.body.starlinkConstellation.operationalCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.launches?.upcoming)).toBe(true);
    expect(Array.isArray(res.body.spaceAndPowerEquities?.quotes)).toBe(true);
  });

  it('5. CelesTrak SATCAT summary & Launch Library 2 handle upstream failures with honest stale signaling', async () => {
    // First populate disk cache via a mocked 200 response
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.includes('celestrak.org/satcat')) {
        return new Response(
          JSON.stringify([
            { OBJECT_NAME: 'SL-1', OPS_STATUS_CODE: '+', INCLINATION: 53.0, LAUNCH_DATE: '2026-11-10', DECAY_DATE: '' },
            { OBJECT_NAME: 'SL-2', OPS_STATUS_CODE: '+', INCLINATION: 43.0, LAUNCH_DATE: '2026-11-11', DECAY_DATE: '' },
            { OBJECT_NAME: 'SL-3', OPS_STATUS_CODE: '', INCLINATION: 97.6, LAUNCH_DATE: '2026-11-12', DECAY_DATE: '' },
            { OBJECT_NAME: 'SL-DECAYED', OPS_STATUS_CODE: 'D', INCLINATION: 53.0, LAUNCH_DATE: '2020-01-01', DECAY_DATE: '2025-05-01' },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('ll.thespacedevs.com')) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    });

    const satcat = await getStarlinkCatalogSummary(true);
    expect(satcat.totalInOrbit).toBe(3);
    expect(satcat.operationalCount).toBe(2);
    expect(satcat.raisingOrPartialCount).toBe(1);
    expect(satcat.decayedCount).toBe(1);
    expect(satcat.stale).toBe(false);

    // Now simulate upstream failure with forceRefresh=true -> stale cache fallback
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network down'));
    const satcatFallback = await getStarlinkCatalogSummary(true);
    expect(satcatFallback.stale).toBe(true);
    expect(satcatFallback.operationalCount).toBe(2);

    const launchFallback = await getUpcomingAndRecentLaunches(true);
    expect(launchFallback.stale).toBe(true);

    const newsFallback = await getSpaceNewsFeed(true);
    expect(newsFallback.stale).toBe(true);
  });

  it('6. Discovery registries include Part 2 priced endpoints & MCP tools cleanly without breaking original endpoints', () => {
    expect(PRICED_ENDPOINTS.sec_8k_events.id).toBe('sec_8k_events');
    expect(PRICED_ENDPOINTS.sec_8k_events.atomicAmount).toBe('50000');
    expect(PRICED_ENDPOINTS.delta_changes.atomicAmount).toBe('10000');
    expect(PRICED_ENDPOINTS.space_telemetry.atomicAmount).toBe('50000');

    expect(BAZAAR_DISCOVERY_EXTENSIONS.sec_8k_events).toBeDefined();
    expect(BAZAAR_DISCOVERY_EXTENSIONS.delta_changes).toBeDefined();
    expect(BAZAAR_DISCOVERY_EXTENSIONS.space_telemetry).toBeDefined();

    const toolNames = MCP_TOOLS.map((t) => t.name);
    expect(toolNames).toContain('get_sec_8k_events');
    expect(toolNames).toContain('get_intelligence_changes');
    expect(toolNames).toContain('get_space_telemetry');
    expect(toolNames).toHaveLength(17);
  });
});
