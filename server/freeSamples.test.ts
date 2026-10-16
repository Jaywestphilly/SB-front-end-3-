// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server.impl.js';
import { PRICED_ENDPOINTS } from './x402PaymentService.js';

describe('Free Static Sample Endpoints Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Both sample routes return 200 without PAYMENT-SIGNATURE, with sample === true, capturedAt, paidRoute.url and paidRoute.price present', async () => {
    const resJob = await request(app).get('/api/v1/sec/job/sample');
    expect(resJob.status).toBe(200);
    expect(resJob.headers['x-stock-bloc-sample']).toBe('true');
    expect(resJob.headers['cache-control']).toContain('max-age=3600');
    expect(resJob.body.sample).toBe(true);
    expect(resJob.body.capturedAt).toBeDefined();
    expect(resJob.body.paidRoute).toBeDefined();
    expect(resJob.body.paidRoute.url).toBe('https://stockbloc.ai.studio/api/v1/sec/job');
    expect(resJob.body.paidRoute.price).toBe('$0.05 USDC (x402, Base)');

    const res13f = await request(app).get('/api/v1/data/sec/sample');
    expect(res13f.status).toBe(200);
    expect(res13f.headers['x-stock-bloc-sample']).toBe('true');
    expect(res13f.headers['cache-control']).toContain('max-age=3600');
    expect(res13f.body.sample).toBe(true);
    expect(res13f.body.capturedAt).toBeDefined();
    expect(res13f.body.paidRoute).toBeDefined();
    expect(res13f.body.paidRoute.url).toBe('https://stockbloc.ai.studio/api/v1/data/sec');
    expect(res13f.body.paidRoute.price).toBe('$0.10 USDC (x402, Base)');

    // Verify /api/data/sec/sample alias returns identical 200 JSON sample
    const res13fAlias = await request(app).get('/api/data/sec/sample');
    expect(res13fAlias.status).toBe(200);
    expect(res13fAlias.headers['x-stock-bloc-sample']).toBe('true');
    expect(res13fAlias.headers['content-type']).toContain('application/json');
    expect(res13fAlias.body.sample).toBe(true);
    expect(res13fAlias.body.sampleNote).toBeDefined();
  });

  it('2. Mock global.fetch: must be called 0 times during both sample requests (no SEC/EDGAR calls)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    await request(app).get('/api/v1/sec/job/sample');
    await request(app).get('/api/v1/data/sec/sample');
    await request(app).get('/api/data/sec/sample');

    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it('3. Unpaid POST /api/v1/sec/job and unpaid GET /api/v1/data/sec still return 402 with amounts 250000 and 100000', async () => {
    const unpaidJob = await request(app)
      .post('/api/v1/sec/job')
      .send({ ticker: 'AAPL', filingType: '10-K' });

    expect(unpaidJob.status).toBe(402);
    expect(unpaidJob.headers['payment-required']).toBeDefined();
    const decodedJob = JSON.parse(
      Buffer.from(unpaidJob.headers['payment-required'], 'base64').toString('utf8')
    );
    expect(decodedJob.accepts[0].amount).toBe('250000');

    const unpaidSec = await request(app).get('/api/v1/data/sec');
    expect(unpaidSec.status).toBe(402);
    expect(unpaidSec.headers['payment-required']).toBeDefined();
    const decodedSec = JSON.parse(
      Buffer.from(unpaidSec.headers['payment-required'], 'base64').toString('utf8')
    );
    expect(decodedSec.accepts[0].amount).toBe('100000');
  });

  it('4. The sec_job and sec_13f_intel 402 descriptions contain "Free sample: https://stockbloc.ai.studio/api/v1/"', async () => {
    const unpaidJob = await request(app)
      .post('/api/v1/sec/job')
      .send({ ticker: 'AAPL', filingType: '10-K' });
    const decodedJob = JSON.parse(
      Buffer.from(unpaidJob.headers['payment-required'], 'base64').toString('utf8')
    );
    expect(decodedJob.resource.description).toContain('Free sample: https://stockbloc.ai.studio/api/v1/sec/job/sample');

    const unpaidSec = await request(app).get('/api/v1/data/sec');
    const decodedSec = JSON.parse(
      Buffer.from(unpaidSec.headers['payment-required'], 'base64').toString('utf8')
    );
    expect(decodedSec.resource.description).toContain('Free sample: https://stockbloc.ai.studio/api/v1/data/sec/sample');

    // Also assert directly on PRICED_ENDPOINTS descriptions
    expect(PRICED_ENDPOINTS.sec_job.description).toContain('Free sample: https://stockbloc.ai.studio/api/v1/sec/job/sample');
    expect(PRICED_ENDPOINTS.sec_13f_intel.description).toContain('Free sample: https://stockbloc.ai.studio/api/v1/data/sec/sample');
  });

  it('5. The sec-job sample has riskFactorChanges.added.length + removed.length + changed.length === 3, and addedTotal === 13, removedTotal === 22, changedTotal === 20', async () => {
    const resJob = await request(app).get('/api/v1/sec/job/sample');
    expect(resJob.status).toBe(200);

    const rfc = resJob.body.output?.riskFactorChanges;
    expect(rfc).toBeDefined();
    const totalItems = (rfc.added?.length || 0) + (rfc.removed?.length || 0) + (rfc.changed?.length || 0);
    expect(totalItems).toBe(3);
    expect(rfc.addedTotal).toBe(13);
    expect(rfc.removedTotal).toBe(22);
    expect(rfc.changedTotal).toBe(20);
  });
});
