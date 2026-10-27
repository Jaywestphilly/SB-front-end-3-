import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { validateDiscoveryExtension } from '@x402/extensions';
import { decodePaymentRequiredHeader } from '@x402/core/http';
import {
  BAZAAR_DISCOVERY_EXTENSIONS,
  PRICED_ENDPOINTS,
  requireX402Payment,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import { resetFacilitatorMock } from './testSetup/facilitatorMock.js';

describe('Bazaar Discovery Extensions & 402 Metadata Verification', () => {
  let tempDir: string;
  const originalEnv = { ...process.env };
  const TARGET_PAY_TO = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-bazaar-test-'));
    process.env.SB_DATA_DIR = tempDir;
    process.env.X402_RECIPIENT_ADDRESS = TARGET_PAY_TO;
    resetFacilitatorMock();
    clearX402SettlementRegistry();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it('validates discovery extensions for market_data, sec_13f_intel, and sec_job', () => {
    const mdResult = validateDiscoveryExtension(BAZAAR_DISCOVERY_EXTENSIONS.market_data.bazaar);
    expect(mdResult.valid).toBe(true);

    const sec13fResult = validateDiscoveryExtension(BAZAAR_DISCOVERY_EXTENSIONS.sec_13f_intel.bazaar);
    expect(sec13fResult.valid).toBe(true);

    const secJobResult = validateDiscoveryExtension(BAZAAR_DISCOVERY_EXTENSIONS.sec_job.bazaar);
    expect(secJobResult.valid).toBe(true);
  });

  it('verifies market_data info.input.queryParams and schema properties include symbol and omit bloc', () => {
    const md = BAZAAR_DISCOVERY_EXTENSIONS.market_data.bazaar;

    expect(md.info.input.queryParams).toHaveProperty('ticker');
    expect(md.info.input.queryParams.ticker).toBe('AAPL');
    expect(md.info.input.queryParams).not.toHaveProperty('bloc');

    const queryParamsProps = md.schema.properties.input.properties.queryParams.properties;
    expect(queryParamsProps).toHaveProperty('ticker');
    expect(queryParamsProps).not.toHaveProperty('bloc');
  });

  it('verifies sec_job info.input.body and schema body properties contain ticker, filingType, and mode with correct enum', () => {
    const sj = BAZAAR_DISCOVERY_EXTENSIONS.sec_job.bazaar;

    expect(sj.info.input.body).toHaveProperty('ticker');
    expect(sj.info.input.body).toHaveProperty('filingType');
    expect(sj.info.input.body).toHaveProperty('mode');
    expect(sj.info.input.body.ticker).toBe('AAPL');
    expect(sj.info.input.body.filingType).toBe('10-K');
    expect(sj.info.input.body.mode).toBe('diff');

    const bodyProps = sj.schema.properties.input.properties.body.properties;
    expect(bodyProps).toHaveProperty('ticker');
    expect(bodyProps).toHaveProperty('filingType');
    expect(bodyProps).toHaveProperty('mode');
    expect(bodyProps.mode.enum).toEqual(['standard', 'diff']);
  });

  it('ensures JSON.stringify of all three entries contains none of the old fake/invented values', () => {
    const serialized = JSON.stringify([
      BAZAAR_DISCOVERY_EXTENSIONS.market_data,
      BAZAAR_DISCOVERY_EXTENSIONS.sec_13f_intel,
      BAZAAR_DISCOVERY_EXTENSIONS.sec_job
    ]);

    expect(serialized).not.toContain('super_sonic_tsunami');
    expect(serialized).not.toContain('138.25');
    expect(serialized).not.toContain('ACCUMULATE');
    expect(serialized).not.toContain('STRONG ACCUMULATION');
  });

  it('returns HTTP 402 with amount 10000 and target payTo for unpaid GET /api/data/market', async () => {
    const app = express();
    app.use(express.json());
    app.get('/api/data/market', requireX402Payment(PRICED_ENDPOINTS.market_data), (req, res) => {
      res.json({ success: true, feed: 'market' });
    });

    const res = await request(app).get('/api/data/market');

    expect(res.status).toBe(402);
    expect(res.headers['payment-required']).toBeDefined();

    const decoded = decodePaymentRequiredHeader(res.headers['payment-required']);
    expect(decoded.accepts).toBeDefined();
    expect(decoded.accepts.length).toBeGreaterThan(0);
    expect(decoded.accepts[0].amount).toBe('10000');
    expect(decoded.accepts[0].payTo).toBe(TARGET_PAY_TO);
  });
});
