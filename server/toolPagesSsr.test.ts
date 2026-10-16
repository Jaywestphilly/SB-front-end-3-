// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../server.impl.js';
import { TOOL_PAGES, resolveToolSpec, renderToolPageHtml } from './toolPagesSsr.js';

describe('Tool Pages SSR & 404 Routing', () => {
  it('returns 404 for unknown /tools/* slugs', async () => {
    const res1 = await request(app).get('/tools/unknown-slug');
    expect(res1.status).toBe(404);
    expect(res1.text).toContain('404 Tool Not Found');
    expect(res1.text).toContain('unknown-slug');

    const res2 = await request(app).get('/tools/fake-tool');
    expect(res2.status).toBe(404);

    const res3 = await request(app).get('/tools');
    expect(res3.status).toBe(404);

    const res4 = await request(app).get('/tools/');
    expect(res4.status).toBe(404);

    const res5 = await request(app).get('/tools/sec/nested/fake');
    expect(res5.status).toBe(404);
  });

  it('SEC page: returns 200 with POST /api/v1/sec/job ($0.05) and GET /api/v1/sec/analyst free info page', async () => {
    const res = await request(app).get('/tools/sec');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    // Title & Meta
    expect(res.text).toContain('<title>Stock Bloc SEC Analyst | Form 10-K, 10-Q &amp; 8-K Filing Analysis</title>');
    expect(res.text).toMatch(/<meta\s+name="description"\s+content="[^"]*POST \/api\/v1\/sec\/job[^"]*\$0\.05[^"]*GET \/api\/v1\/sec\/analyst[^"]*"/i);

    // OpenGraph
    expect(res.text).toContain('<meta property="og:title" content="Stock Bloc SEC Analyst | Form 10-K, 10-Q &amp; 8-K Filing Analysis" />');
    expect(res.text).toContain('property="og:url" content="https://');
    expect(res.text).toContain('/tools/sec"');

    // Structured <section> server-side rendered
    expect(res.text).toContain('<section id="tool-details" class="tool-spec" data-tool="sec"');
    expect(res.text).toContain('POST /api/v1/sec/job');
    expect(res.text).toContain('{"ticker":"AAPL","filingType":"10-K"}');
    expect(res.text).toContain('$0.05');
    expect(res.text).toContain('GET /api/v1/sec/analyst');

    // Discovery links
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('https://stockbloc.ai.studio/openapi.json');
    expect(res.text).toContain('https://stockbloc.ai.studio/agents/manifest.json');
  });

  it('Market data page: returns 200, says "Stock quotes for US tickers", GET /api/v1/market/quote?symbol=AAPL, $0.01, and no "real-time" or "OHLCV, movers"', async () => {
    const res = await request(app).get('/tools/market-data');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    // Title & Description
    expect(res.text).toContain('Stock quotes for US tickers');
    expect(res.text).toContain('GET /api/v1/market/quote?symbol=AAPL');
    expect(res.text).toContain('$0.01');

    // Prohibited words check on tool spec and structured section
    const tool = TOOL_PAGES['market-data'];
    expect(tool.name).toBe('Stock quotes for US tickers');
    expect(tool.description).not.toMatch(/real-time/i);
    expect(tool.description).not.toMatch(/ohlcv/i);
    expect(tool.description).not.toMatch(/movers/i);
    expect(tool.structuredSection).not.toMatch(/real-time/i);
    expect(tool.structuredSection).not.toMatch(/ohlcv/i);
    expect(tool.structuredSection).not.toMatch(/movers/i);

    // Structured <section>
    expect(res.text).toContain('<section id="tool-details" class="tool-spec" data-tool="market-data"');
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('https://stockbloc.ai.studio/openapi.json');
  });

  it('13F page: says holdings are from quarterly SEC 13F-HR filings, not real-time, GET /api/data/sec, $0.10', async () => {
    const res = await request(app).get('/tools/13f');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    expect(res.text).toContain('quarterly SEC 13F-HR filings, not real-time');
    expect(res.text).toContain('GET /api/data/sec');
    expect(res.text).toContain('$0.10');

    expect(res.text).toContain('<section id="tool-details" class="tool-spec" data-tool="13f"');
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('https://stockbloc.ai.studio/openapi.json');
  });

  it('Forecast page: POST /api/v1/intelligence/forecasts ($0.05)', async () => {
    const res = await request(app).get('/tools/forecast');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    expect(res.text).toContain('POST /api/v1/intelligence/forecasts');
    expect(res.text).toContain('$0.05');
    expect(res.text).toContain('<section id="tool-details" class="tool-spec" data-tool="forecast"');
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('https://stockbloc.ai.studio/openapi.json');
  });

  it('Research memo page: POST /api/v1/intelligence/research ($0.10)', async () => {
    const res = await request(app).get('/tools/research');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    expect(res.text).toContain('POST /api/v1/intelligence/research');
    expect(res.text).toContain('$0.10');
    expect(res.text).toContain('<section id="tool-details" class="tool-spec" data-tool="research"');
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('https://stockbloc.ai.studio/openapi.json');
  });

  it('SB Score page: GET /api/v1/intelligence/sb-score?ticker=AAPL ($0.05)', async () => {
    const res = await request(app).get('/tools/sb-score');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');

    expect(res.text).toContain('GET /api/v1/intelligence/sb-score?ticker=AAPL');
    expect(res.text).toContain('$0.05');
    expect(res.text).toContain('<section id="tool-details" class="tool-spec" data-tool="sb-score"');
    expect(res.text).toContain('https://stockbloc.ai.studio/.well-known/x402');
    expect(res.text).toContain('https://stockbloc.ai.studio/openapi.json');
  });

  it('sitemap.xml includes all six /tools/* URLs with lastmod', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('xml');

    const expectedTools = [
      'https://stockbloc.ai.studio/tools/sec',
      'https://stockbloc.ai.studio/tools/market-data',
      'https://stockbloc.ai.studio/tools/13f',
      'https://stockbloc.ai.studio/tools/forecast',
      'https://stockbloc.ai.studio/tools/research',
      'https://stockbloc.ai.studio/tools/sb-score',
    ];

    for (const toolUrl of expectedTools) {
      expect(res.text).toContain(`<loc>${toolUrl}</loc>`);
      // Check lastmod follows loc
      const locIndex = res.text.indexOf(`<loc>${toolUrl}</loc>`);
      expect(locIndex).toBeGreaterThan(-1);
      const followingSlice = res.text.slice(locIndex, locIndex + 150);
      expect(followingSlice).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    }
  });

  it('redirects old tool URLs to current locations preserving path and query', async () => {
    const resSec = await request(app).get('/tools/sec-analyst');
    expect(resSec.status).toBe(301);
    expect(resSec.headers.location).toBe('/tools/sec');

    const res13f = await request(app).get('/tools/sec-13f');
    expect(res13f.status).toBe(301);
    expect(res13f.headers.location).toBe('/tools/13f');

    const resResearch = await request(app).get('/tools/research-memo');
    expect(resResearch.status).toBe(301);
    expect(resResearch.headers.location).toBe('/tools/research');

    // Preserves sub-path and query
    const resSub = await request(app).get('/tools/sec-analyst/history?ticker=NVDA');
    expect(resSub.status).toBe(301);
    expect(resSub.headers.location).toBe('/tools/sec/history?ticker=NVDA');
  });
});
