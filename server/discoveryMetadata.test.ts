// @vitest-environment node
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../server.impl.js';
import { PRICED_ENDPOINTS } from './x402PaymentService.js';

describe('Discovery Metadata & Self-Correcting 400 Examples Suite', () => {
  const publicOpenapi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'openapi.json'), 'utf8'));
  const apiV1Openapi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'api', 'v1', 'openapi.json'), 'utf8'));

  // =========================================================================
  // REQUIREMENT 1: OpenAPI Metadata Specifications
  // =========================================================================
  describe('1. OpenAPI Specifications (public/openapi.json & public/api/v1/openapi.json)', () => {
    [
      { name: 'public/openapi.json', doc: publicOpenapi },
      { name: 'public/api/v1/openapi.json', doc: apiV1Openapi }
    ].forEach(({ name, doc }) => {
      it(`${name} - GET /api/v1/intelligence/earnings-pack has required ticker param with example AAPL and x-example-request`, () => {
        const op = doc.paths['/api/v1/intelligence/earnings-pack']?.get;
        expect(op).toBeDefined();

        const tickerParam = op.parameters?.find((p: any) => p.name === 'ticker');
        expect(tickerParam).toBeDefined();
        expect(tickerParam.required).toBe(true);
        expect(tickerParam.example).toBe('AAPL');

        expect(op['x-example-request']).toBe('https://stockbloc.ai.studio/api/v1/intelligence/earnings-pack?ticker=AAPL');
      });

      it(`${name} - GET /api/v1/market/quote has required symbol with example AAPL, ticker documented alias, and x-example-request`, () => {
        const op = doc.paths['/api/v1/market/quote']?.get;
        expect(op).toBeDefined();

        const symbolParam = op.parameters?.find((p: any) => p.name === 'symbol');
        expect(symbolParam).toBeDefined();
        expect(symbolParam.required).toBe(true);
        expect(symbolParam.example).toBe('AAPL');

        const tickerAlias = op.parameters?.find((p: any) => p.name === 'ticker');
        expect(tickerAlias).toBeDefined();
        expect(tickerAlias.example).toBe('AAPL');

        expect(op['x-example-request']).toBe('https://stockbloc.ai.studio/api/v1/market/quote?symbol=AAPL');
      });

      it(`${name} - POST /api/v1/sec/job and POST /api/v1/sec/analyst have requestBody example and x-example-request`, () => {
        const secJob = doc.paths['/api/v1/sec/job']?.post;
        expect(secJob).toBeDefined();

        const secJobReqBody = secJob.requestBody?.content?.['application/json'];
        expect(secJobReqBody).toBeDefined();
        expect(secJobReqBody.example).toEqual({ ticker: 'AAPL', filingType: '10-K' });

        expect(secJob['x-example-request']).toEqual({
          method: 'POST',
          url: 'https://stockbloc.ai.studio/api/v1/sec/job',
          body: { ticker: 'AAPL', filingType: '10-K' }
        });

        const secAnalyst = doc.paths['/api/v1/sec/analyst']?.post;
        expect(secAnalyst).toBeDefined();

        const secAnalystReqBody = secAnalyst.requestBody?.content?.['application/json'];
        expect(secAnalystReqBody).toBeDefined();
        expect(secAnalystReqBody.example).toEqual({ ticker: 'AAPL', filingType: '10-K' });

        expect(secAnalyst['x-example-request']).toEqual({
          method: 'POST',
          url: 'https://stockbloc.ai.studio/api/v1/sec/analyst',
          body: { ticker: 'AAPL', filingType: '10-K' }
        });
      });
    });
  });

  // =========================================================================
  // REQUIREMENT 2: GET /.well-known/x402 Discovery Endpoint
  // =========================================================================
  describe('2. GET /.well-known/x402 Discovery Metadata', () => {
    it('returns exampleRequest per resource matching the required formats', async () => {
      const res = await request(app).get('/.well-known/x402');
      expect(res.status).toBe(200);
      expect(res.body.x402Version).toBe(2);
      expect(Array.isArray(res.body.endpoints)).toBe(true);

      const endpoints = res.body.endpoints;

      const market = endpoints.find((e: any) => e.id === 'market_data');
      expect(market).toBeDefined();
      expect(market.exampleRequest).toEqual({
        method: 'GET',
        url: 'https://stockbloc.ai.studio/api/v1/market/quote?symbol=AAPL'
      });

      const earnings = endpoints.find((e: any) => e.id === 'earnings_pack');
      expect(earnings).toBeDefined();
      expect(earnings.exampleRequest).toEqual({
        method: 'GET',
        url: 'https://stockbloc.ai.studio/api/v1/intelligence/earnings-pack?ticker=AAPL'
      });

      const secJob = endpoints.find((e: any) => e.id === 'sec_job');
      expect(secJob).toBeDefined();
      expect(secJob.exampleRequest).toEqual({
        method: 'POST',
        url: 'https://stockbloc.ai.studio/api/v1/sec/job',
        body: {
          ticker: 'AAPL',
          filingType: '10-K'
        }
      });
    });
  });

  // =========================================================================
  // REQUIREMENT 3: Self-Correcting 400 INVALID_INPUT Bodies with Examples
  // =========================================================================
  describe('3. 400 INVALID_INPUT Body contains example field and quotes no payment', () => {
    it('GET /api/v1/market/quote (bare GET) returns 400 INVALID_INPUT with example and charged: false', async () => {
      const res = await request(app).get('/api/v1/market/quote');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
      expect(res.body.charged).toBe(false);
      expect(res.headers['payment-required']).toBeUndefined();
      expect(res.body.example).toEqual({
        method: 'GET',
        url: 'https://stockbloc.ai.studio/api/v1/market/quote?symbol=AAPL'
      });
    });

    it('GET /api/v1/intelligence/earnings-pack (bare GET) returns 400 INVALID_INPUT with example and charged: false', async () => {
      const res = await request(app).get('/api/v1/intelligence/earnings-pack');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
      expect(res.body.charged).toBe(false);
      expect(res.headers['payment-required']).toBeUndefined();
      expect(res.body.example).toEqual({
        method: 'GET',
        url: 'https://stockbloc.ai.studio/api/v1/intelligence/earnings-pack?ticker=AAPL'
      });
    });

    it('POST /api/v1/sec/job (missing fields) returns 400 INVALID_INPUT with example and charged: false', async () => {
      const res = await request(app).post('/api/v1/sec/job').send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
      expect(res.body.charged).toBe(false);
      expect(res.headers['payment-required']).toBeUndefined();
      expect(res.body.example).toEqual({
        method: 'POST',
        url: 'https://stockbloc.ai.studio/api/v1/sec/job',
        body: {
          ticker: 'AAPL',
          filingType: '10-K'
        }
      });
    });

    it('POST /api/v1/sec/analyst (missing fields) returns 400 INVALID_INPUT with example and charged: false', async () => {
      const res = await request(app).post('/api/v1/sec/analyst').send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_INPUT');
      expect(res.body.charged).toBe(false);
      expect(res.headers['payment-required']).toBeUndefined();
      expect(res.body.example).toEqual({
        method: 'POST',
        url: 'https://stockbloc.ai.studio/api/v1/sec/analyst',
        body: {
          ticker: 'AAPL',
          filingType: '10-K'
        }
      });
    });
  });

  // =========================================================================
  // REQUIREMENT 4: Unpaid Valid Requests Return 402 with Unchanged Prices
  // =========================================================================
  describe('4. Valid Unpaid Requests return 402 with Unchanged Prices', () => {
    it('GET /api/v1/market/quote?symbol=AAPL returns 402 with $0.01 price', async () => {
      const res = await request(app).get('/api/v1/market/quote?symbol=AAPL');
      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();
      expect(PRICED_ENDPOINTS.market_data.priceUsd).toBe(0.01);
      expect(PRICED_ENDPOINTS.market_data.priceDisplay).toBe('$0.01');
    });

    it('GET /api/v1/intelligence/earnings-pack?ticker=AAPL returns 402 with $0.35 price', async () => {
      const res = await request(app).get('/api/v1/intelligence/earnings-pack?ticker=AAPL');
      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();
      expect(PRICED_ENDPOINTS.earnings_pack.priceUsd).toBe(0.35);
      expect(PRICED_ENDPOINTS.earnings_pack.priceDisplay).toBe('$0.35');
    });

    it('POST /api/v1/sec/job with example body returns 402 with $0.25 price', async () => {
      const res = await request(app).post('/api/v1/sec/job').send({
        ticker: 'AAPL',
        filingType: '10-K'
      });
      expect(res.status).toBe(402);
      expect(res.headers['payment-required']).toBeDefined();
      expect(PRICED_ENDPOINTS.sec_job.priceUsd).toBe(0.25);
      expect(PRICED_ENDPOINTS.sec_job.priceDisplay).toBe('$0.25');
    });
  });
});
