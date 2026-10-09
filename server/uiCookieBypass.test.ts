// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { requireX402Payment, clearX402SettlementRegistry } from './x402PaymentService.js';
import { issueUiCookie, resetUiBypassLimiter } from './uiSession.js';

describe('UI Cookie Bypass Security Suite', () => {
  let app: express.Application;
  let tempDir: string;
  let validCookie: string;
  const originalEnv = { ...process.env };
  const TEST_COOKIE_SECRET = 'test_sb_ui_cookie_secret_32bytes_min_len_key!';

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-test-data-'));
    process.env.SB_DATA_DIR = tempDir;
    process.env.SB_UI_COOKIE_SECRET = TEST_COOKIE_SECRET;
    process.env.X402_RECIPIENT_ADDRESS = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
    clearX402SettlementRegistry();
    resetUiBypassLimiter();

    // Generate valid cookie value
    const dummyRes: any = {
      cookie: (_name: string, val: string) => {
        validCookie = val;
      },
      setHeader: () => {}
    };
    validCookie = issueUiCookie(dummyRes);

    // Minimal express app with stub handlers returning 200 { ok: true }
    app = express();
    app.use(express.json());

    app.get('/api/v1/market/quote', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });

    app.get('/api/data/market', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });

    app.get('/api/data/sec', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });

    app.get('/api/13f/filings', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });

    app.post('/api/v1/sec/job', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });

    app.post('/api/v1/intelligence/research', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });

    app.post('/api/v1/intelligence/forecasts', requireX402Payment(), (_req, res) => {
      res.json({ ok: true });
    });
  });

  afterAll(() => {
    process.env = { ...originalEnv };
    try {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
  });

  const spoofedHeaders = {
    'Accept': 'text/html',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-dest': 'document',
    'Origin': 'https://stockbloc.ai.studio',
    'Referer': 'https://stockbloc.ai.studio'
  };

  it('1. Spoofed browser headers without cookie get 402 with PAYMENT-REQUIRED header across paid endpoints', async () => {
    // GET /api/v1/market/quote?symbol=AAPL
    const resQuote = await request(app)
      .get('/api/v1/market/quote?symbol=AAPL')
      .set(spoofedHeaders);
    expect(resQuote.status).toBe(402);
    expect(resQuote.headers['payment-required']).toBeDefined();

    // GET /api/data/market
    const resMarket = await request(app)
      .get('/api/data/market')
      .set(spoofedHeaders);
    expect(resMarket.status).toBe(402);
    expect(resMarket.headers['payment-required']).toBeDefined();

    // GET /api/data/sec
    const resSec = await request(app)
      .get('/api/data/sec')
      .set(spoofedHeaders);
    expect(resSec.status).toBe(402);
    expect(resSec.headers['payment-required']).toBeDefined();

    // POST /api/v1/sec/job
    const resJob = await request(app)
      .post('/api/v1/sec/job')
      .set(spoofedHeaders)
      .send({ ticker: 'AAPL', filingType: '10-K' });
    expect(resJob.status).toBe(402);
    expect(resJob.headers['payment-required']).toBeDefined();

    // POST /api/v1/intelligence/research
    const resResearch = await request(app)
      .post('/api/v1/intelligence/research')
      .set(spoofedHeaders)
      .send({
        title: 'AI Infrastructure Memo',
        summary: 'Executive summary',
        thesis: 'Long term secular growth in compute demand'
      });
    expect(resResearch.status).toBe(402);
    expect(resResearch.headers['payment-required']).toBeDefined();

    // POST /api/v1/intelligence/forecasts
    const resForecast = await request(app)
      .post('/api/v1/intelligence/forecasts')
      .set(spoofedHeaders)
      .send({
        question: 'Will AAPL exceed $250 by Q4?',
        asset: 'AAPL',
        direction: 'UP',
        timeHorizon: '90d',
        resolutionCriteria: 'Official close above 250',
        probability: 0.75
      });
    expect(resForecast.status).toBe(402);
    expect(resForecast.headers['payment-required']).toBeDefined();
  });

  it('2. Valid cookie from issueUiCookie: GET /api/v1/market/quote?symbol=AAPL, GET /api/data/market, and GET /api/13f/filings return 200', async () => {
    const resQuote = await request(app)
      .get('/api/v1/market/quote?symbol=AAPL')
      .set('Cookie', `sb_ui=${validCookie}`);
    expect(resQuote.status).toBe(200);
    expect(resQuote.body).toEqual({ ok: true });

    const resMarket = await request(app)
      .get('/api/data/market')
      .set('Cookie', `sb_ui=${validCookie}`);
    expect(resMarket.status).toBe(200);
    expect(resMarket.body).toEqual({ ok: true });

    const res13f = await request(app)
      .get('/api/13f/filings')
      .set('Cookie', `sb_ui=${validCookie}`);
    expect(res13f.status).toBe(200);
    expect(res13f.body).toEqual({ ok: true });
  });

  it('3. POST /api/v1/sec/job with a valid cookie still returns 402', async () => {
    const resJob = await request(app)
      .post('/api/v1/sec/job')
      .set('Cookie', `sb_ui=${validCookie}`)
      .send({ ticker: 'AAPL', filingType: '10-K' });
    expect(resJob.status).toBe(402);
    expect(resJob.headers['payment-required']).toBeDefined();
  });

  it('4. Tampered cookie, expired cookie, and garbage value each return 402', async () => {
    // Tampered cookie (one HMAC character flipped)
    const parts = validCookie.split('.');
    const lastChar = parts[2].slice(-1);
    const flippedChar = lastChar === 'a' ? 'b' : 'a';
    const tamperedCookie = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -1)}${flippedChar}`;

    const resTampered = await request(app)
      .get('/api/data/market')
      .set('Cookie', `sb_ui=${tamperedCookie}`);
    expect(resTampered.status).toBe(402);
    expect(resTampered.headers['payment-required']).toBeDefined();

    // Expired cookie
    const expiredMs = Date.now() - 60000;
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiredPayload = `${expiredMs}.${nonce}`;
    const expiredHmac = crypto.createHmac('sha256', TEST_COOKIE_SECRET).update(expiredPayload).digest('base64url');
    const expiredCookie = `${expiredPayload}.${expiredHmac}`;

    const resExpired = await request(app)
      .get('/api/data/market')
      .set('Cookie', `sb_ui=${expiredCookie}`);
    expect(resExpired.status).toBe(402);
    expect(resExpired.headers['payment-required']).toBeDefined();

    // Garbage value
    const resGarbage = await request(app)
      .get('/api/data/market')
      .set('Cookie', 'sb_ui=totally_invalid_garbage_value_here');
    expect(resGarbage.status).toBe(402);
    expect(resGarbage.headers['payment-required']).toBeDefined();
  });

  it('5. GET / on an app with the step-2 middleware returns a Set-Cookie containing sb_ui=, HttpOnly, and SameSite=Strict', async () => {
    const step2App = express();
    step2App.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        const basename = path.basename(req.path);
        if (!basename.includes('.')) {
          issueUiCookie(res);
        }
      }
      next();
    });
    step2App.get('/', (_req, res) => {
      res.send('<!DOCTYPE html><html><body>Stock Bloc</body></html>');
    });

    const res = await request(step2App).get('/');
    expect(res.status).toBe(200);

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);

    expect(cookieHeader).toContain('sb_ui=');
    expect(cookieHeader).toMatch(/HttpOnly/i);
    expect(cookieHeader).toMatch(/SameSite=Strict/i);
  });
});
