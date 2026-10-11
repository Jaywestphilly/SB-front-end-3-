import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  fillDiscoveryFields,
  BAZAAR_DISCOVERY_EXTENSIONS,
  PRICED_ENDPOINTS,
  requireX402Payment,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import {
  resetFacilitatorMock,
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler,
  mockFacilitatorVerify,
  mockFacilitatorSettle
} from './testSetup/facilitatorMock.js';

describe('Bazaar Discovery Fill & Settle Integration Suite', () => {
  let tempDir: string;
  const originalEnv = { ...process.env };
  const TARGET_PAY_TO = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-fill-test-'));
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

  it('3a. Payload with no resource and no extensions has resource and extensions.bazaar filled', async () => {
    const advertised = {
      resource: {
        url: 'https://stockbloc.ai.studio/api/v1/intelligence/sb-score?ticker=AAPL',
        description: 'Stock Bloc SB Score Quant Intelligence',
        mimeType: 'application/json',
        serviceName: 'Stock Bloc',
        tags: ['stocks']
      },
      extensions: {
        bazaar: BAZAAR_DISCOVERY_EXTENSIONS.sb_score.bazaar
      }
    };

    const originalPayload = {
      x402Version: 2,
      payload: {
        signature: '0x_sig_a',
        authorization: {
          from: '0xPayerA',
          to: TARGET_PAY_TO,
          value: '50000',
          nonce: '0x_nonce_a'
        }
      },
      accepted: {
        scheme: 'exact',
        network: 'eip155:8453',
        amount: '50000',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        payTo: TARGET_PAY_TO
      }
    };

    const snapshot = structuredClone(originalPayload);
    const filled = fillDiscoveryFields(originalPayload, advertised);

    expect(filled.resource.url).toBe(advertised.resource.url);
    expect(filled.extensions.bazaar).toEqual(advertised.extensions.bazaar);
    expect(originalPayload).toEqual(snapshot);

    // Test in full HTTP request flow
    setFacilitatorVerifyHandler(async () => ({ isValid: true, payer: '0xPayerA' }));
    setFacilitatorSettleHandler(async () => ({ success: true, txHash: '0x_tx_a', payer: '0xPayerA' }));

    const app = express();
    app.use(express.json());
    app.get('/api/v1/intelligence/sb-score', requireX402Payment(PRICED_ENDPOINTS.sb_score), (req, res) => {
      res.json({ success: true, ticker: 'AAPL', sbScore: 88 });
    });

    const res = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=AAPL')
      .set('payment-signature', JSON.stringify(originalPayload));

    expect(res.status).toBe(200);
    expect(mockFacilitatorVerify).toHaveBeenCalledTimes(1);
    expect(mockFacilitatorSettle).toHaveBeenCalledTimes(1);

    const verifiedPayload = mockFacilitatorVerify.mock.calls[0][0];
    const settledPayload = mockFacilitatorSettle.mock.calls[0][0];

    expect(verifiedPayload.resource.url).toContain('/api/v1/intelligence/sb-score?ticker=AAPL');
    expect(verifiedPayload.extensions.bazaar).toEqual(BAZAAR_DISCOVERY_EXTENSIONS.sb_score.bazaar);
    expect(settledPayload.resource.url).toContain('/api/v1/intelligence/sb-score?ticker=AAPL');
    expect(settledPayload.extensions.bazaar).toEqual(BAZAAR_DISCOVERY_EXTENSIONS.sb_score.bazaar);
  });

  it('3b. Payload with its own resource and extensions keeps them exactly', () => {
    const advertised = {
      resource: { url: 'https://advertised.com/api', description: 'Advertised' },
      extensions: { bazaar: { info: { advertised: true } } }
    };

    const originalPayload = {
      x402Version: 2,
      resource: { url: 'https://client.example/x' },
      extensions: {
        bazaar: { info: { custom: true } },
        other: { a: 1 }
      },
      payload: { signature: '0xsig' },
      accepted: { amount: '10000' }
    };

    const snapshot = structuredClone(originalPayload);
    const filled = fillDiscoveryFields(originalPayload, advertised);

    expect(filled.resource.url).toBe('https://client.example/x');
    expect(filled.extensions.bazaar).toEqual({ info: { custom: true } });
    expect(filled.extensions.other).toEqual({ a: 1 });
    expect(originalPayload).toEqual(snapshot);
  });

  it('3c. Payload whose extensions has no bazaar but has other keeps other and adds bazaar', () => {
    const advertised = {
      resource: { url: 'https://advertised.com/api' },
      extensions: { bazaar: { info: { advertised: true } } }
    };

    const originalPayload = {
      x402Version: 2,
      extensions: { other: { a: 1 } },
      payload: { signature: '0xsig' },
      accepted: { amount: '10000' }
    };

    const filled = fillDiscoveryFields(originalPayload, advertised);

    expect(filled.extensions.other).toEqual({ a: 1 });
    expect(filled.extensions.bazaar).toEqual({ info: { advertised: true } });
  });

  it('3d. Original payload object is not mutated and x402Version/payload/accepted are copied by reference', () => {
    const advertised = {
      resource: { url: 'https://advertised.com/api' },
      extensions: { bazaar: { info: { advertised: true } } }
    };

    const originalPayload = {
      x402Version: 2,
      payload: { signature: '0x_sig_ref', authorization: { from: '0xA' } },
      accepted: { amount: '10000', payTo: TARGET_PAY_TO }
    };

    const snapshot = structuredClone(originalPayload);
    const filled = fillDiscoveryFields(originalPayload, advertised);

    expect(originalPayload).toEqual(snapshot);
    expect(filled.x402Version).toBe(originalPayload.x402Version);
    expect(filled.payload).toBe(originalPayload.payload);
    expect(filled.accepted).toBe(originalPayload.accepted);
  });

  it('3e. A mismatch fails verify, request ends in 402, settle is NOT called, and verify receives server requirement', async () => {
    setFacilitatorVerifyHandler(async (payload, reqs) => {
      if (reqs.amount !== '10000' || payload.accepted.amount !== reqs.amount) {
        return { isValid: false, reason: 'Amount mismatch' };
      }
      return { isValid: true, payer: '0xPayerE' };
    });

    const app = express();
    app.use(express.json());
    app.get('/api/data/market', requireX402Payment(PRICED_ENDPOINTS.market_data), (req, res) => {
      res.json({ success: true });
    });

    const mismatchedPayload = {
      x402Version: 2,
      payload: { signature: '0xsig_e', authorization: { from: '0xPayerE' } },
      accepted: { amount: '1' }
    };

    const res = await request(app)
      .get('/api/data/market')
      .set('payment-signature', JSON.stringify(mismatchedPayload));

    expect(res.status).toBe(402);
    expect(mockFacilitatorVerify).toHaveBeenCalledTimes(1);
    expect(mockFacilitatorSettle).not.toHaveBeenCalled();

    const requirementPassedToVerify = mockFacilitatorVerify.mock.calls[0][1];
    expect(requirementPassedToVerify.amount).toBe(PRICED_ENDPOINTS.market_data.atomicAmount);
    expect(requirementPassedToVerify.payTo).toBe(TARGET_PAY_TO);
  });

  it('3f. JSON.stringify of sb_score and earnings_pack contain none of the outdated/invented values', () => {
    const sbStr = JSON.stringify(BAZAAR_DISCOVERY_EXTENSIONS.sb_score);
    const epStr = JSON.stringify(BAZAAR_DISCOVERY_EXTENSIONS.earnings_pack);

    [sbStr, epStr].forEach((str) => {
      expect(str).not.toContain('NVDA');
      expect(str).not.toContain('138.25');
      expect(str).not.toContain('STRONG BUY');
      expect(str).not.toContain('BULLISH');
      expect(str).not.toContain('0001045810-26-000075');
    });
  });
});
