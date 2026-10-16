// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../server.impl.js';
import { clearDailyTriggersCache } from './dailyTriggersService.js';
import { MCP_TOOLS } from './mcpService.js';

describe('GET /api/v1/signals/daily-triggers', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearDailyTriggersCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearDailyTriggersCache();
    vi.restoreAllMocks();
  });

  it('1. Returns 200 with empty triggers when no filings happened in the last 24 hours', async () => {
    // Mock SEC EDGAR returning filings from months ago (outside 24h window)
    globalThis.fetch = vi.fn().mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('data.sec.gov/submissions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            filings: {
              recent: {
                form: ['10-K', '10-Q'],
                filingDate: ['2025-10-15', '2025-06-15'],
                acceptanceDateTime: ['2025-10-15T16:30:00.000Z', '2025-06-15T16:30:00.000Z']
              }
            }
          })
        };
      }
      return originalFetch(url);
    });

    const res = await request(app).get('/api/v1/signals/daily-triggers?ticker=AAPL');
    expect(res.status).toBe(200);
    expect(res.headers['payment-required']).toBeUndefined();
    expect(res.body.windowHours).toBe(24);
    expect(typeof res.body.asOf).toBe('string');
    expect(Array.isArray(res.body.triggers)).toBe(true);
    expect(res.body.triggers.length).toBe(0);
  });

  it('2. Captures real events from the last 24 hours with recommended_endpoint', async () => {
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.slice(0, 10);

    globalThis.fetch = vi.fn().mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('data.sec.gov/submissions')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            filings: {
              recent: {
                form: ['8-K', '10-Q'],
                filingDate: [todayStr, '2025-01-01'],
                acceptanceDateTime: [nowIso, '2025-01-01T16:00:00Z']
              }
            }
          })
        };
      }
      return originalFetch(url);
    });

    const res = await request(app).get('/api/v1/signals/daily-triggers?ticker=AAPL');
    expect(res.status).toBe(200);
    expect(res.headers['payment-required']).toBeUndefined();
    expect(res.body.triggers.length).toBe(1);
    expect(res.body.triggers[0]).toEqual({
      ticker: 'AAPL',
      event: '8-K',
      filedDate: todayStr,
      recommended_endpoint: '/api/v1/sec/job'
    });
  });

  it('3. Returns 503 with empty triggers array when SEC EDGAR fails', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('data.sec.gov/submissions')) {
        return {
          ok: false,
          status: 503,
          json: async () => ({ error: 'SEC EDGAR maintenance' })
        };
      }
      return originalFetch(url);
    });

    const res = await request(app).get('/api/v1/signals/daily-triggers?ticker=AAPL');
    expect(res.status).toBe(503);
    expect(res.headers['payment-required']).toBeUndefined();
    expect(res.body.windowHours).toBe(24);
    expect(Array.isArray(res.body.triggers)).toBe(true);
    expect(res.body.triggers.length).toBe(0);
    expect(res.body.error).toBeDefined();
  });

  it('4. Free route is never 402, never prompts for payment', async () => {
    const res = await request(app).get('/api/v1/signals/daily-triggers');
    expect(res.status).not.toBe(402);
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('5. Exists in openapi.json with exact required description and free (no price)', () => {
    const openapiPath = path.join(process.cwd(), 'public', 'openapi.json');
    const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

    const route = openapiDoc.paths['/api/v1/signals/daily-triggers']?.get;
    expect(route).toBeDefined();
    expect(route['x-payment-info']).toBeUndefined();
    expect(route.description).toBe(
      'Real SEC events from the last 24 hours on the watchlist: new 10-K, 10-Q or 8-K filings, each with the paid route to inspect it. Empty list when nothing was filed. Free.'
    );
  });

  it('6. Exists in /.well-known/x402 with exact description, free, and no price fields', async () => {
    const res = await request(app).get('/.well-known/x402');
    expect(res.status).toBe(200);

    const dailyTriggers = res.body.endpoints.find((ep: any) => ep.id === 'daily_triggers');
    expect(dailyTriggers).toBeDefined();
    expect(dailyTriggers.paths).toContain('/api/v1/signals/daily-triggers');
    expect(dailyTriggers.priceUsd).toBeUndefined();
    expect(dailyTriggers.priceDisplay).toBeUndefined();
    expect(dailyTriggers.atomicAmount).toBeUndefined();
    expect(dailyTriggers.description).toBe(
      'Real SEC events from the last 24 hours on the watchlist: new 10-K, 10-Q or 8-K filings, each with the paid route to inspect it. Empty list when nothing was filed. Free.'
    );
  });

  it('7. Exists in MCP tool list with exact description', () => {
    const tool = MCP_TOOLS.find((t: any) => t.name === 'get_daily_triggers');
    expect(tool).toBeDefined();
    expect(tool?.description).toBe(
      'Real SEC events from the last 24 hours on the watchlist: new 10-K, 10-Q or 8-K filings, each with the paid route to inspect it. Empty list when nothing was filed. Free.'
    );
  });
});
