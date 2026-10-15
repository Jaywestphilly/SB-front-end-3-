import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  isUSMarketOpen,
  fetchYahooQuote,
  fetchRealStockQuote
} from './marketQuoteService.js';

describe('Market Quote Service & US Market Hours Unit Tests', () => {
  it('1. isUSMarketOpen correctly identifies open vs closed US market hours', () => {
    // Saturday in ET -> Closed
    const saturdayET = new Date('2026-10-10T14:00:00-04:00'); // Oct 10 2026 is Saturday
    expect(isUSMarketOpen(saturdayET)).toBe(false);

    // Sunday in ET -> Closed
    const sundayET = new Date('2026-10-11T14:00:00-04:00');
    expect(isUSMarketOpen(sundayET)).toBe(false);

    // Wednesday at 10:30 AM ET -> Open
    const wednesdayOpenET = new Date('2026-10-14T10:30:00-04:00');
    expect(isUSMarketOpen(wednesdayOpenET)).toBe(true);

    // Wednesday at 8:00 AM ET (pre-market) -> Closed
    const wednesdayPreMarketET = new Date('2026-10-14T08:00:00-04:00');
    expect(isUSMarketOpen(wednesdayPreMarketET)).toBe(false);

    // Wednesday at 5:00 PM ET (after-hours) -> Closed
    const wednesdayAfterHoursET = new Date('2026-10-14T17:00:00-04:00');
    expect(isUSMarketOpen(wednesdayAfterHoursET)).toBe(false);

    // Christmas Day (Dec 25 2026) -> Holiday Closed
    const christmasET = new Date('2026-12-25T11:00:00-05:00');
    expect(isUSMarketOpen(christmasET)).toBe(false);
  });

  it('2. fetchRealStockQuote returns share volume in volume, formatted dollarVolume, and evaluates isRealTime based on market hours', async () => {
    const quote = await fetchRealStockQuote('NVDA', true, 4000);
    if (quote) {
      expect(quote.symbol).toBe('NVDA');
      expect(typeof quote.price).toBe('number');
      expect(quote.price).toBeGreaterThan(0);

      // Share volume as a number
      expect(typeof quote.volume).toBe('number');
      expect(quote.volume).toBeGreaterThan(0);

      // Dollar volume field as a formatted string
      expect(quote.dollarVolume).toBeDefined();
      expect(typeof quote.dollarVolume).toBe('string');
      expect(quote.dollarVolume).toMatch(/^\$[0-9.]+[MBK]$/);

      // isRealTime is boolean
      expect(typeof quote.isRealTime).toBe('boolean');

      // Check refreshSchedule is not "Real-Time Live Streaming" if isRealTime is false
      if (!quote.isRealTime) {
        expect(quote.refreshSchedule).not.toBe('Real-Time Live Streaming');
      } else {
        expect(quote.refreshSchedule).toBe('Real-Time Live Streaming');
      }
    }
  });

  it('3. Market quote route GET /api/v1/market/quote returns dollarVolume and reflects isRealTime status', async () => {
    const app = express();
    app.get('/api/v1/market/quote', async (req, res) => {
      const sym = String(req.query.symbol || 'AAPL').toUpperCase().trim();
      const quote = await fetchRealStockQuote(sym, false, 4000);
      if (!quote) return res.status(404).json({ error: 'unsupported' });
      return res.json(quote);
    });

    const res = await request(app).get('/api/v1/market/quote?symbol=AAPL');
    expect(res.status).toBe(200);
    expect(res.body.symbol).toBe('AAPL');
    expect(typeof res.body.price).toBe('number');
    expect(typeof res.body.volume).toBe('number');
    expect(res.body.dollarVolume).toBeDefined();
    expect(typeof res.body.isRealTime).toBe('boolean');
    expect(res.body).toHaveProperty('previousClose');
    expect(res.body).toHaveProperty('previousCloseDate');
    expect(res.body).toHaveProperty('data_as_of');
    expect(res.body).toHaveProperty('servedAt');

    if (!res.body.isRealTime) {
      expect(res.body.refreshSchedule).not.toBe('Real-Time Live Streaming');
      expect(['Last Close', 'After-Hours', 'Market Closed - Last Close', 'Verified Snapshot Cache']).toContain(res.body.priceLabel || res.body.refreshSchedule);
    }
  });
});
