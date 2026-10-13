// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app } from '../server.impl.js';
import {
  BAZAAR_DISCOVERY_EXTENSIONS,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import { validateDiscoveryExtension } from '@x402/extensions';
import {
  resetFacilitatorMock,
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler
} from './testSetup/facilitatorMock.js';

describe('OpenAPI & Bazaar Discovery Compliance Suite', () => {
  const TARGET_PAY_TO = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
  const openapiPath = path.join(process.cwd(), 'public', 'openapi.json');
  const openapiDoc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

  beforeEach(() => {
    resetFacilitatorMock();
    clearX402SettlementRegistry();
  });

  afterEach(() => {
    resetFacilitatorMock();
    clearX402SettlementRegistry();
  });

  it('1. Every paid operation in public/openapi.json has a non-empty parameters or a requestBody', () => {
    let paidOpCount = 0;
    for (const [routePath, methods] of Object.entries<any>(openapiDoc.paths)) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        if (operation['x-payment-info']) {
          paidOpCount++;
          const hasParams = Array.isArray(operation.parameters) && operation.parameters.length > 0;
          const hasBody = Boolean(operation.requestBody);
          expect(
            hasParams || hasBody,
            `Paid endpoint ${method.toUpperCase()} ${routePath} must have non-empty parameters or requestBody`
          ).toBe(true);
        }
      }
    }
    expect(paidOpCount).toBeGreaterThan(0);
  });

  it('2. The 3 legacy alias routes have deprecated: true and prefixed summaries', () => {
    const market = openapiDoc.paths['/api/data/market']?.get;
    expect(market).toBeDefined();
    expect(market.deprecated).toBe(true);
    expect(market.summary).toMatch(/^Deprecated alias of \/api\/v1\/market\/quote\./);

    const sec = openapiDoc.paths['/api/data/sec']?.get;
    expect(sec).toBeDefined();
    expect(sec.deprecated).toBe(true);
    expect(sec.summary).toMatch(/^Deprecated alias of \/api\/v1\/data\/sec\./);

    const evalStrategy = openapiDoc.paths['/api/v1/agent/evaluate-strategy']?.post;
    expect(evalStrategy).toBeDefined();
    expect(evalStrategy.deprecated).toBe(true);
    expect(evalStrategy.summary).toMatch(/^Deprecated alias of \/api\/v1\/agent\/strategy\/evaluate\./);
  });

  it('3. GET /api/v1/data/sec with limit query param handling and unpaid probe behavior', async () => {
    // A. Unpaid request with limit=abc must return HTTP 402 with PAYMENT-REQUIRED header
    const unpaidRes = await request(app).get('/api/v1/data/sec?limit=abc');
    expect(unpaidRes.status).toBe(402);
    expect(unpaidRes.headers['payment-required']).toBeDefined();

    // Mock facilitator to approve valid payments for 0.10 USDC ($100000 atomic)
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xTestPayer13F' }));
    setFacilitatorSettleHandler(async () => ({ success: true, txHash: '0x_tx_13f', payer: '0xTestPayer13F' }));

    const validPaidPayload = {
      x402Version: 2,
      payload: {
        signature: '0x_sig_13f',
        authorization: {
          from: '0xTestPayer13F',
          to: TARGET_PAY_TO,
          value: '100000',
          nonce: '0x_nonce_13f'
        }
      },
      accepted: {
        scheme: 'exact',
        network: 'eip155:8453',
        amount: '100000',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        payTo: TARGET_PAY_TO
      }
    };

    // B. Paid request with limit=3 returns exactly 3 consensusHoldings
    const paidResValid = await request(app)
      .get('/api/v1/data/sec?limit=3')
      .set('payment-signature', JSON.stringify(validPaidPayload));

    expect(paidResValid.status).toBe(200);
    expect(Array.isArray(paidResValid.body.consensusHoldings)).toBe(true);
    expect(paidResValid.body.consensusHoldings.length).toBe(3);

    // C. Paid request with limit=0 returns HTTP 400
    const payloadLimit0 = {
      ...validPaidPayload,
      payload: {
        ...validPaidPayload.payload,
        authorization: { ...validPaidPayload.payload.authorization, nonce: '0x_nonce_limit0' }
      }
    };
    const paidResZero = await request(app)
      .get('/api/v1/data/sec?limit=0')
      .set('payment-signature', JSON.stringify(payloadLimit0));

    expect(paidResZero.status).toBe(400);
    expect(paidResZero.body.status).toBe('error');

    // D. Paid request with limit=abc returns HTTP 400
    const payloadLimitAbc = {
      ...validPaidPayload,
      payload: {
        ...validPaidPayload.payload,
        authorization: { ...validPaidPayload.payload.authorization, nonce: '0x_nonce_limitabc' }
      }
    };
    const paidResAbc = await request(app)
      .get('/api/v1/data/sec?limit=abc')
      .set('payment-signature', JSON.stringify(payloadLimitAbc));

    expect(paidResAbc.status).toBe(400);
    expect(paidResAbc.body.status).toBe('error');
  });

  it('4. For sb_score and earnings_pack, output.properties.example is an object and validateDiscoveryExtension passes', () => {
    ['sb_score', 'earnings_pack'].forEach((key) => {
      const ext = BAZAAR_DISCOVERY_EXTENSIONS[key];
      expect(ext, `Extension for ${key} must exist`).toBeDefined();

      const exampleSchema = ext.bazaar.schema?.properties?.output?.properties?.example;
      expect(typeof exampleSchema).toBe('object');
      expect(exampleSchema).not.toBeNull();

      const validation = validateDiscoveryExtension(ext.bazaar);
      expect(validation.valid, `validateDiscoveryExtension for ${key} must return valid: true`).toBe(true);
    });
  });

  it('5. No example value in sb_score and earnings_pack output is a number (type placeholders only)', () => {
    function assertNoNumericValues(obj: any, currentPath = '') {
      expect(typeof obj).not.toBe('number');
      if (typeof obj === 'object' && obj !== null) {
        for (const [k, v] of Object.entries(obj)) {
          assertNoNumericValues(v, currentPath ? `${currentPath}.${k}` : k);
        }
      }
    }

    ['sb_score', 'earnings_pack'].forEach((key) => {
      const outputExample = BAZAAR_DISCOVERY_EXTENSIONS[key].bazaar.info.output.example;
      expect(outputExample).toBeDefined();
      expect(typeof outputExample).toBe('object');
      assertNoNumericValues(outputExample, key);
    });
  });
});
