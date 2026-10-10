import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { requireX402Payment, PRICED_ENDPOINTS } from './x402PaymentService.js';
import {
  clearTelemetryState,
  rebuildTelemetryFromFirestore,
  getMachineRevenueMetrics,
  KNOWN_SELF_WALLETS,
  isSelfWallet
} from './agentTelemetry.js';
import { db } from './firebaseAdmin.js';

describe('Fix 1: Fake ticker on market quote validation before 402', () => {
  const app = express();
  app.use(express.json());
  app.get('/api/v1/market/quote', requireX402Payment(PRICED_ENDPOINTS.market_data), (_req, res) => {
    res.json({ symbol: 'AAPL', price: 150 });
  });
  app.get('/api/live-quote/:symbol', requireX402Payment(PRICED_ENDPOINTS.market_data), (_req, res) => {
    res.json({ symbol: 'AAPL', price: 150 });
  });

  it('1. GET /api/v1/market/quote?symbol=ZZZQX returns 404 with error unknown_ticker and no PAYMENT-REQUIRED header', async () => {
    const res = await request(app).get('/api/v1/market/quote?symbol=ZZZQX');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'unknown_ticker' });
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('2. GET /api/live-quote/ZZZQX returns 404 with error unknown_ticker and no PAYMENT-REQUIRED header', async () => {
    const res = await request(app).get('/api/live-quote/ZZZQX');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'unknown_ticker' });
    expect(res.headers['payment-required']).toBeUndefined();
  });

  it('3. GET /api/v1/market/quote?symbol=AAPL returns 402 with PAYMENT-REQUIRED header', async () => {
    const res = await request(app).get('/api/v1/market/quote?symbol=AAPL');
    expect(res.status).toBe(400 - 2 + 4); // 402
    expect(res.headers['payment-required']).toBeDefined();
    const decoded = Buffer.from(res.headers['payment-required'], 'base64').toString('utf8');
    expect(decoded).toContain('10000');
  });

  it('4. GET /api/live-quote/AAPL returns 402 with PAYMENT-REQUIRED header', async () => {
    const res = await request(app).get('/api/live-quote/AAPL');
    expect(res.status).toBe(402);
    expect(res.headers['payment-required']).toBeDefined();
    const decoded = Buffer.from(res.headers['payment-required'], 'base64').toString('utf8');
    expect(decoded).toContain('10000');
  });
});

describe('Fix 2: Telemetry rebuild from x402_settlements and self-wallet filtering', () => {
  beforeEach(() => {
    clearTelemetryState();
  });

  it('1. Correctly identifies known self-wallets', () => {
    expect(isSelfWallet('0x26b610a059dE2488ebe3e0EDa02Ae17907917419')).toBe(true);
    expect(isSelfWallet('0xB4807865A786E9E9E26E6A9610F2078e7fc507fB')).toBe(true);
    expect(isSelfWallet('0xd86cAdB414171d1155aA88076504763F7DE32805')).toBe(true);
    expect(isSelfWallet('0x1111111111111111111111111111111111111111')).toBe(false);
  });

  it('2. Rebuilds telemetry state from mocked Firestore x402_settlements', async () => {
    if (!db) return;

    const selfWallet = '0x26b610a059dE2488ebe3e0EDa02Ae17907917419';
    const externalWallet = '0x9999888877776666555544443333222211110000';

    // Mock docs in x402_settlements
    const mockSettlements = [
      {
        id: 'settle_self_01',
        data: () => ({
          payer: selfWallet,
          endpointId: 'market_data',
          amountUsd: 0.01,
          txHash: '0xtx_self_1',
          timestamp: '2026-10-09T20:00:00Z',
          source: 'rest'
        })
      },
      {
        id: 'settle_self_02',
        data: () => ({
          payer: selfWallet,
          endpointId: 'sec_job',
          amountUsd: 0.25,
          txHash: '0xtx_self_2',
          timestamp: '2026-10-09T20:05:00Z',
          source: 'rest'
        })
      },
      {
        id: 'settle_ext_01',
        data: () => ({
          payer: externalWallet,
          endpointId: 'market_data',
          amountUsd: 0.01,
          txHash: '0xtx_ext_1',
          timestamp: '2026-10-09T20:10:00Z',
          source: 'mcp'
        })
      },
      {
        id: 'settle_ext_02',
        data: () => ({
          payer: externalWallet,
          endpointId: 'sec_job',
          amountUsd: 0.25,
          txHash: '0xtx_ext_2',
          timestamp: '2026-10-09T20:15:00Z',
          source: 'mcp'
        })
      }
    ];

    // Mock db.collection('x402_settlements').get()
    const origCollection = db.collection.bind(db);
    db.collection = ((collName: string) => {
      if (collName === 'x402_settlements') {
        return {
          get: async () => ({
            empty: false,
            docs: mockSettlements
          })
        } as any;
      }
      return origCollection(collName);
    }) as any;

    try {
      await rebuildTelemetryFromFirestore();

      const metrics = getMachineRevenueMetrics();
      expect(metrics.totalUsdcRevenue).toBe(0.52);
      expect(metrics.revenueByEndpoint['market_data']).toBe(0.02);
      expect(metrics.revenueByEndpoint['sec_job']).toBe(0.50);
      expect(metrics.revenueBySource['self']).toBe(0.26);
      expect(metrics.revenueBySource['mcp']).toBe(0.26);
      expect(metrics.agentLifetimeSpend[selfWallet.toLowerCase()]).toBe(0.26);
      expect(metrics.agentLifetimeSpend[externalWallet.toLowerCase()]).toBe(0.26);

      // Repeat-payer external counts: self-wallets are excluded from external counts!
      expect(metrics.externalAgentsCount).toBe(1);
      expect(metrics.repeatPayersCount).toBe(1);
    } finally {
      db.collection = origCollection;
    }
  });
});
