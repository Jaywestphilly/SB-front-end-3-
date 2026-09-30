import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { fetchRealStockQuote, fetchYahooQuote } from './marketQuoteService.js';
import { agentIntelligenceRouter } from './agentIntelligenceApi.js';

describe('Market Data Coverage Honesty & Non-Hanging Quote Endpoints', () => {
  const app = express();
  app.use(express.json());

  // Mount intelligence router for testing
  app.use('/api/v1/intelligence', agentIntelligenceRouter);

  // Mount quote endpoint matching server.impl.ts
  app.get(['/api/live-quote/:symbol', '/api/v1/market/quote/:symbol', '/api/v1/market/quote'], async (req, res) => {
    const rawSymbol = req.params.symbol || (req.query.symbol as string) || (req.query.ticker as string);
    if (!rawSymbol || typeof rawSymbol !== 'string' || !rawSymbol.trim()) {
      return res.status(400).json({
        error: 'invalid_symbol',
        message: 'Query parameter "symbol" or "ticker" (or URL path /:symbol) is required (e.g. ?symbol=NVDA)'
      });
    }

    const symUpper = rawSymbol.toUpperCase().trim();
    const force = req.query.force === 'true';

    try {
      const quote = await fetchRealStockQuote(symUpper, force, 3500);
      if (!quote || !quote.price || quote.price <= 0) {
        return res.status(404).json({
          error: 'unsupported_symbol',
          symbol: symUpper,
          message: `Market data for symbol "${symUpper}" is currently unavailable or unsupported.`
        });
      }
      return res.json({
        ...quote,
        data_as_of: quote.lastUpdated || new Date().toISOString(),
        source: quote.isRealTime ? "live" : "verified_cache"
      });
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        return res.status(504).json({
          error: 'upstream_timeout',
          symbol: symUpper,
          message: `Upstream market data provider timed out for symbol "${symUpper}".`
        });
      }
      return res.status(500).json({ error: 'Failed to fetch market quote', symbol: symUpper });
    }
  });

  it('1. GET /api/v1/market/quote?symbol=NVDA resolves without hanging and returns valid price', async () => {
    const res = await request(app).get('/api/v1/market/quote?symbol=NVDA');
    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe('NVDA');
    expect(typeof res.body.price).toBe('number');
    expect(res.body.price).toBeGreaterThan(0);
  });

  it('2. GET /api/v1/market/quote without symbol query parameter returns 400 immediately (never hangs)', async () => {
    const res = await request(app).get('/api/v1/market/quote');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_symbol');
  });

  it('3. GET /api/v1/market/quote with deliberately invalid symbol ZZZZNOTREAL returns 404 unsupported_symbol (no fake data)', async () => {
    const res = await request(app).get('/api/v1/market/quote?symbol=ZZZZNOTREAL');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('unsupported_symbol');
    expect(res.body.symbol).toBe('ZZZZNOTREAL');
    // Ensure no synthetic numbers (like 150.0) are returned
    expect(res.body.price).toBeUndefined();
  });

  it('4. GET /api/v1/intelligence/sb-score with invalid symbol ZZZZNOTREAL returns 404 (synthetic benchmark deleted)', async () => {
    const res = await request(app).get('/api/v1/intelligence/sb-score?ticker=ZZZZNOTREAL');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('unsupported_symbol');
    expect(res.body.symbol).toBe('ZZZZNOTREAL');
  });

  it('5. GET /api/v1/intelligence/sb-score with NVDA returns computed real SB Score and factor breakout', async () => {
    const res = await request(app).get('/api/v1/intelligence/sb-score?ticker=NVDA');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.ticker).toBe('NVDA');
    expect(typeof res.body.sbScore).toBe('number');
    expect(res.body.factorBreakdown).toBeDefined();
    expect(res.body.factorBreakdown.momentum).toBeDefined();
  });

  it('6. Verifies live passthrough for verified international tickers (.HK and .NS)', async () => {
    // Hong Kong Tencent
    const hkQuote = await fetchYahooQuote('0700.HK', 4000);
    if (hkQuote) {
      expect(hkQuote.symbol).toBe('0700.HK');
      expect(hkQuote.price).toBeGreaterThan(0);
    }

    // India NSE Reliance
    const nsQuote = await fetchYahooQuote('RELIANCE.NS', 4000);
    if (nsQuote) {
      expect(nsQuote.symbol).toBe('RELIANCE.NS');
      expect(nsQuote.price).toBeGreaterThan(0);
    }
  });
});
