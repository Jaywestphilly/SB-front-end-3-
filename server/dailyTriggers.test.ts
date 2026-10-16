// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../server.impl.js';
import { clearDailyTriggersCache } from './dailyTriggersService.js';
import { MCP_TOOLS } from './mcpService.js';

describe('Daily Triggers & 8-K SEC Job Guard Suite', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearDailyTriggersCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearDailyTriggersCache();
    vi.restoreAllMocks();
  });

  describe('1. POST /api/v1/sec/job 8-K Rejection', () => {
    it('returns free 400 before payment check when filingType is 8-K', async () => {
      const res = await request(app)
        .post('/api/v1/sec/job')
        .send({
          ticker: 'AAPL',
          filingType: '8-K'
        });

      expect(res.status).toBe(400);
      expect(res.headers['payment-required']).toBeUndefined();
      expect(res.body).toEqual({
        error: '8-K analysis is not available yet. Use filingType 10-K or 10-Q.',
        supportedFilingTypes: ['10-K', '10-Q']
      });
    });

    it('returns free 400 on alias /api/v1/sec/analyst when filingType is 8-K', async () => {
      const res = await request(app)
        .post('/api/v1/sec/analyst')
        .send({
          ticker: 'MSFT',
          filingType: '8-K'
        });

      expect(res.status).toBe(400);
      expect(res.headers['payment-required']).toBeUndefined();
      expect(res.body).toEqual({
        error: '8-K analysis is not available yet. Use filingType 10-K or 10-Q.',
        supportedFilingTypes: ['10-K', '10-Q']
      });
    });

    it('lists only 10-K and 10-Q in openapi.json for sec/job and sec/analyst', () => {
      const openapiPath = path.join(process.cwd(), 'public', 'openapi.json');
      const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

      const jobFilingType = openapiDoc.paths['/api/v1/sec/job']?.post?.requestBody?.content?.['application/json']?.schema?.properties?.filingType;
      expect(jobFilingType?.enum).toEqual(['10-K', '10-Q']);

      const analystFilingType = openapiDoc.paths['/api/v1/sec/analyst']?.post?.requestBody?.content?.['application/json']?.schema?.properties?.filingType;
      expect(analystFilingType?.enum).toEqual(['10-K', '10-Q']);
    });

    it('lists only 10-K and 10-Q in MCP tool descriptions for analyze_sec_filing and sec_analyst', () => {
      const analyzeTool = MCP_TOOLS.find((t: any) => t.name === 'analyze_sec_filing');
      expect(analyzeTool?.inputSchema?.properties?.filingType?.enum).toEqual(['10-K', '10-Q']);

      const analystTool = MCP_TOOLS.find((t: any) => t.name === 'sec_analyst');
      expect(analystTool?.inputSchema?.properties?.filingType?.enum).toEqual(['10-K', '10-Q']);
    });
  });

  describe('2. GET /api/v1/signals/daily-triggers', () => {
    it('returns 200 with empty triggers when no filings happened in the last 24 hours', async () => {
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

    it('sets recommended_endpoint null, items, and filingUrl for 8-K triggers, and points 10-Q to /api/v1/sec/job', async () => {
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
                  filingDate: [todayStr, todayStr],
                  acceptanceDateTime: [nowIso, nowIso],
                  accessionNumber: ['0000320193-26-000100', '0000320193-26-000099'],
                  primaryDocument: ['aapl-20261016.htm', 'aapl-10q.htm'],
                  items: ['5.02,9.01', '']
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
      expect(res.body.triggers.length).toBe(2);

      const trigger8k = res.body.triggers.find((t: any) => t.event === '8-K');
      expect(trigger8k).toBeDefined();
      expect(trigger8k.ticker).toBe('AAPL');
      expect(trigger8k.filedDate).toBe(todayStr);
      expect(trigger8k.recommended_endpoint).toBeNull();
      expect(trigger8k.items).toEqual(['5.02', '9.01']);
      expect(trigger8k.filingUrl).toContain('/Archives/edgar/data/');
      expect(trigger8k.filingUrl).toContain('aapl-20261016.htm');

      const trigger10q = res.body.triggers.find((t: any) => t.event === '10-Q');
      expect(trigger10q).toBeDefined();
      expect(trigger10q.ticker).toBe('AAPL');
      expect(trigger10q.filedDate).toBe(todayStr);
      expect(trigger10q.recommended_endpoint).toBe('/api/v1/sec/job');
    });

    it('returns 503 with empty triggers array when SEC EDGAR fails', async () => {
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

    it('free route is never 402, never prompts for payment', async () => {
      const res = await request(app).get('/api/v1/signals/daily-triggers');
      expect(res.status).not.toBe(402);
      expect(res.headers['payment-required']).toBeUndefined();
    });

    it('exists in openapi.json with exact required description and free (no price)', () => {
      const openapiPath = path.join(process.cwd(), 'public', 'openapi.json');
      const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

      const route = openapiDoc.paths['/api/v1/signals/daily-triggers']?.get;
      expect(route).toBeDefined();
      expect(route['x-payment-info']).toBeUndefined();
      expect(route.description).toBe(
        'Real SEC events from the last 24 hours on the watchlist: new 10-K, 10-Q or 8-K filings, each with the paid route to inspect it. Empty list when nothing was filed. Free.'
      );
    });

    it('exists in /.well-known/x402 with exact description, free, and no price fields', async () => {
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

    it('exists in MCP tool list with exact description', () => {
      const tool = MCP_TOOLS.find((t: any) => t.name === 'get_daily_triggers');
      expect(tool).toBeDefined();
      expect(tool?.description).toBe(
        'Real SEC events from the last 24 hours on the watchlist: new 10-K, 10-Q or 8-K filings, each with the paid route to inspect it. Empty list when nothing was filed. Free.'
      );
    });
  });
});
