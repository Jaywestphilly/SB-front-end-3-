// @vitest-environment node
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encodePaymentSignatureHeader,
  decodePaymentRequiredHeader
} from '@x402/core/http';
import {
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler,
  resetFacilitatorMock
} from './testSetup/facilitatorMock.js';
import {
  requireX402Payment,
  PRICED_ENDPOINTS,
  clearX402SettlementRegistry
} from './x402PaymentService.js';
import {
  createVerifiedReceiptsRouter,
  getPublicReceiptKey,
  clearVerifiedReceiptsStore,
  canonicalJsonStringify
} from './verifiedReceiptsService.js';
import {
  createMarketplaceRailRouter,
  clearMarketplaceRailStore,
  computeMarketplaceSplit,
  setMarketplaceTestingHooks
} from './marketplaceRailService.js';

function buildSignedPaymentHeader(nonceHex: string, payer = '0x1111111111111111111111111111111111111111', amount = '50000') {
  return encodePaymentSignatureHeader({
    x402Version: 2,
    accepted: {
      scheme: 'exact',
      network: 'eip155:8453',
      amount,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      payTo: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708'
    },
    payload: {
      signature: '0x' + 'ab'.repeat(65),
      authorization: {
        from: payer,
        to: '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708',
        value: amount,
        validAfter: '0',
        validBefore: '1999999999',
        nonce: nonceHex
      }
    }
  } as any);
}

function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get(['/.well-known/receipts-pubkey.json', '/.well-known/receipt-key.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(getPublicReceiptKey());
  });

  app.use('/api/v1/receipts', createVerifiedReceiptsRouter());
  app.use('/api/v1/marketplace', createMarketplaceRailRouter());

  // First-party immediate-settlement x402 route
  app.get(
    '/api/v1/signals/8k',
    requireX402Payment(PRICED_ENDPOINTS.signals_8k),
    (_req, res) => {
      return res.status(200).json({
        status: 'success',
        ticker: 'NVDA',
        filings: [{ accessionNumber: '0001045810-26-000123', items: ['2.02'] }]
      });
    }
  );

  // First-party deferred-settlement x402 route (like POST /api/v1/sec/analyst & /api/v1/sec/job)
  app.post(
    '/api/v1/sec/analyst',
    requireX402Payment(PRICED_ENDPOINTS.sec_job, { deferSettlement: true }),
    async (req, res) => {
      if ((req as any).x402Payment && !(req as any).x402Payment.settled) {
        await (req as any).x402Payment.settle();
      }
      return res.status(200).json({
        status: 'completed',
        ticker: req.body?.ticker || 'AAPL',
        filingType: '10-K',
        executiveSummary: 'Verified deferred-settlement SEC audit payload.'
      });
    }
  );

  return app;
}

describe('Verified Delivery Receipts (Prompt 4) & Finance Agent Marketplace Rail', () => {
  const ADMIN_KEY = 'test_marketplace_admin_secret_key_2026';
  let verifySpy: ReturnType<typeof vi.fn<(...args: any[]) => Promise<any>>>;
  let settleSpy: ReturnType<typeof vi.fn<(...args: any[]) => Promise<any>>>;
  let app: express.Express;

  beforeEach(() => {
    process.env.MARKETPLACE_ADMIN_KEY = ADMIN_KEY;
    process.env.X402_RECIPIENT_ADDRESS = '0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708';
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearVerifiedReceiptsStore();
    clearMarketplaceRailStore();
    setMarketplaceTestingHooks({ allowPrivateUpstream: false, upstreamFetch: null });

    verifySpy = vi.fn(async () => ({
      isValid: true,
      payer: '0x1111111111111111111111111111111111111111'
    }));
    setFacilitatorVerifyHandler((payload, reqs) => verifySpy(payload, reqs));

    let txCounter = 1;
    settleSpy = vi.fn(async () => ({
      success: true,
      transaction: `0x${String(txCounter++).padStart(64, 'a')}`,
      payer: '0x1111111111111111111111111111111111111111',
      network: 'eip155:8453'
    }));
    setFacilitatorSettleHandler((payload, reqs) => settleSpy(payload, reqs));

    app = buildTestApp();
  });

  afterEach(() => {
    resetFacilitatorMock();
    setMarketplaceTestingHooks({ allowPrivateUpstream: false, upstreamFetch: null });
    delete process.env.MARKETPLACE_ADMIN_KEY;
  });

  // ==========================================================================
  // 1. PUBLIC KEY DISCOVERY
  // ==========================================================================

  it('publishes Ed25519 public key at /.well-known/receipts-pubkey.json and /api/v1/receipts/public-key without exposing private key', async () => {
    const wellKnown = await request(app).get('/.well-known/receipts-pubkey.json');
    expect(wellKnown.status).toBe(200);
    expect(wellKnown.headers['content-type']).toContain('application/json');
    expect(wellKnown.body.algorithm).toBe('Ed25519');
    expect(wellKnown.body.keyId).toMatch(/^sb_ed25519_[a-f0-9]{16}$/);
    expect(wellKnown.body.publicKeyPem).toContain('BEGIN PUBLIC KEY');
    expect(wellKnown.body.jwk?.kty).toBe('OKP');
    expect(wellKnown.body.jwk?.crv).toBe('Ed25519');
    expect(JSON.stringify(wellKnown.body)).not.toContain('PRIVATE KEY');

    const apiAlias = await request(app).get('/api/v1/receipts/public-key');
    expect(apiAlias.status).toBe(200);
    expect(apiAlias.body.keyId).toBe(wellKnown.body.keyId);
    expect(apiAlias.body.publicKeyPem).toBe(wellKnown.body.publicKeyPem);
  });

  // ==========================================================================
  // 2. EMBEDDED RECEIPT + OFFLINE VERIFICATION + GET/POST VERIFY ENDPOINTS
  // ==========================================================================

  it('embeds signed Ed25519 receipt inside every paid response and verifies via GET ?receiptId=..., POST { receipt, payload }, and offline Ed25519 check', async () => {
    // Step 1: Unpaid call records challengedAt and returns 402 without modifying 402 flow
    const unpaid = await request(app).get('/api/v1/signals/8k?ticker=NVDA');
    expect(unpaid.status).toBe(402);

    // Step 2: Paid call returns original fields + embedded receipt
    const paid = await request(app)
      .get('/api/v1/signals/8k?ticker=NVDA')
      .set('PAYMENT-SIGNATURE', buildSignedPaymentHeader('0x0001'));

    expect(paid.status).toBe(200);
    expect(paid.body.status).toBe('success');
    expect(paid.body.ticker).toBe('NVDA');

    const receipt = paid.body.receipt;
    expect(receipt).toBeDefined();
    expect(receipt.receiptId).toMatch(/^rcpt_[a-f0-9]{24}$/);
    expect(receipt.endpoint).toBe('/api/v1/signals/8k');
    expect(receipt.ticker).toBe('NVDA');
    expect(receipt.payer).toBe('0x1111111111111111111111111111111111111111');
    expect(receipt.payTo).toBe('0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708');
    expect(receipt.amountUsd).toBe(0.05);
    expect(receipt.paymentTxHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(receipt.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.challengedAt).toBeTruthy();
    expect(receipt.paidAt).toBeTruthy();
    expect(receipt.deliveredAt).toBeTruthy();
    expect(receipt.signature).toBeTruthy();

    // Receipt headers match embedded receipt
    expect(paid.headers['x-stockbloc-receipt-id']).toBe(receipt.receiptId);
    expect(paid.headers['x-stockbloc-payload-sha256']).toBe(receipt.payloadHash);
    expect(paid.headers['x-stockbloc-receipt-signature']).toBe(receipt.signature);

    // Strip receipt from response body to verify delivered payload hash directly
    const { receipt: _stripped, ...deliveredPayload } = paid.body;
    const localSha = crypto.createHash('sha256').update(JSON.stringify(deliveredPayload), 'utf8').digest('hex');
    expect(localSha).toBe(receipt.payloadHash);

    // Offline Ed25519 verification using /.well-known/receipts-pubkey.json
    const keyRes = await request(app).get('/.well-known/receipts-pubkey.json');
    const pubKey = crypto.createPublicKey(keyRes.body.publicKeyPem);
    const { signature: sig, ...unsignedReceipt } = receipt;
    const offlineOk = crypto.verify(
      null,
      Buffer.from(canonicalJsonStringify(unsignedReceipt), 'utf8'),
      pubKey,
      Buffer.from(sig, 'base64')
    );
    expect(offlineOk).toBe(true);

    // GET /api/v1/receipts/verify?receiptId=rcpt_... (free verification against stored Firestore/DB record)
    const getVerify = await request(app).get(`/api/v1/receipts/verify?receiptId=${receipt.receiptId}`);
    expect(getVerify.status).toBe(200);
    expect(getVerify.body.verified).toBe(true);
    expect(getVerify.body.signatureValid).toBe(true);
    expect(getVerify.body.payloadHashMatches).toBe(true);
    expect(getVerify.body.receipt).toEqual(receipt);

    // POST /api/v1/receipts/verify with { receipt, payload } (even if caller passes full body or stripped payload)
    const postVerify = await request(app)
      .post('/api/v1/receipts/verify')
      .send({ receipt, payload: deliveredPayload });
    expect(postVerify.status).toBe(200);
    expect(postVerify.body.verified).toBe(true);
    expect(postVerify.body.signatureValid).toBe(true);
    expect(postVerify.body.payloadHashMatches).toBe(true);

    // POST verify fails when payload is tampered by 1 character
    const postTampered = await request(app)
      .post('/api/v1/receipts/verify')
      .send({ receipt, payload: { ...deliveredPayload, ticker: 'NVDX' } });
    expect(postTampered.status).toBe(200);
    expect(postTampered.body.verified).toBe(false);
    expect(postTampered.body.signatureValid).toBe(true);
    expect(postTampered.body.payloadHashMatches).toBe(false);

    // POST verify fails when receipt amount is forged
    const postForged = await request(app)
      .post('/api/v1/receipts/verify')
      .send({ receipt: { ...receipt, amountUsd: 0.99 }, payload: deliveredPayload });
    expect(postForged.status).toBe(200);
    expect(postForged.body.verified).toBe(false);
    expect(postForged.body.signatureValid).toBe(false);
  });

  it('embeds signed Verified Delivery Receipt on deferred-settlement endpoints (POST /api/v1/sec/analyst)', async () => {
    const paid = await request(app)
      .post('/api/v1/sec/analyst')
      .set('PAYMENT-SIGNATURE', buildSignedPaymentHeader('0x0002'))
      .send({ ticker: 'AAPL', filingType: '10-K' });

    expect(paid.status).toBe(200);
    expect(paid.body.receipt).toBeDefined();
    expect(paid.body.receipt.endpoint).toBe('/api/v1/sec/analyst');
    expect(paid.body.receipt.ticker).toBe('AAPL');
    expect(paid.body.receipt.amountUsd).toBe(0.05);

    const getVerify = await request(app).get(`/api/v1/receipts/verify?receiptId=${paid.body.receipt.receiptId}`);
    expect(getVerify.status).toBe(200);
    expect(getVerify.body.verified).toBe(true);
    expect(getVerify.body.signatureValid).toBe(true);
    expect(getVerify.body.payloadHashMatches).toBe(true);
  });

  // ==========================================================================
  // 3. ZERO FAKE DATA & EXACT 10% TAKE RATE ARITHMETIC
  // ==========================================================================

  it('starts honestly with zero fabricated sellers, sales, or volume', async () => {
    const listingsRes = await request(app).get('/api/v1/marketplace/listings');
    expect(listingsRes.status).toBe(200);
    expect(listingsRes.body.count).toBe(0);
    expect(listingsRes.body.listings).toEqual([]);
    expect(listingsRes.body.takeRateBps).toBe(1000);
    expect(listingsRes.body.listingFeeUsd).toBe(0);

    const statsRes = await request(app).get('/api/v1/marketplace/stats');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.economics.takeRateBps).toBe(1000);
    expect(statsRes.body.economics.takeRatePercent).toBe('10%');
    expect(statsRes.body.economics.sellerSharePercent).toBe('90%');
    expect(statsRes.body.liveMetrics.activeThirdPartyListings).toBe(0);
    expect(statsRes.body.liveMetrics.verifiedMarketplaceSales).toBe(0);
    expect(statsRes.body.liveMetrics.grossVolumeUsd).toBe(0);
    expect(statsRes.body.liveMetrics.totalVerifiedReceiptsIssued).toBe(0);
  });

  it('computes exact BigInt 90/10 atomic USDC splits with zero rounding drift', () => {
    const exact10c = computeMarketplaceSplit('100000', 1000);
    expect(exact10c.platformFeeAtomic).toBe('10000');
    expect(exact10c.sellerNetAtomic).toBe('90000');
    expect(exact10c.platformFeeUsd).toBe(0.01);
    expect(exact10c.sellerNetUsd).toBe(0.09);

    const oddAtomic = computeMarketplaceSplit('33333', 1000);
    expect(BigInt(oddAtomic.platformFeeAtomic) + BigInt(oddAtomic.sellerNetAtomic)).toBe(33333n);
    expect(oddAtomic.platformFeeAtomic).toBe('3333');
    expect(oddAtomic.sellerNetAtomic).toBe('30000');
  });

  // ==========================================================================
  // 4. CURATED SELLER ONBOARDING & SSRF PROTECTION
  // ==========================================================================

  it('enforces operator auth, finance categories, and SSRF protection when onboarding listings', async () => {
    const basePayload = {
      slug: 'options-flow-radar',
      name: 'Unusual Options Flow Radar',
      description: 'Real-time institutional equity options sweep feed.',
      category: 'derivatives',
      sellerName: 'QuantFlow Labs',
      sellerWallet: '0x2222222222222222222222222222222222222222',
      upstreamUrl: 'https://api.quantflow.example/v1/sweeps',
      method: 'GET',
      priceUsd: 0.1,
      requiredResponseKeys: ['ticker', 'sweeps']
    };

    const unauth = await request(app).post('/api/v1/marketplace/listings').send(basePayload);
    expect(unauth.status).toBe(403);

    const ssrf = await request(app)
      .post('/api/v1/marketplace/listings')
      .set('X-Admin-Key', ADMIN_KEY)
      .send({ ...basePayload, upstreamUrl: 'https://127.0.0.1:8080/secret' });
    expect(ssrf.status).toBe(400);

    const nonFinance = await request(app)
      .post('/api/v1/marketplace/listings')
      .set('X-Admin-Key', ADMIN_KEY)
      .send({ ...basePayload, category: 'weather_jokes' });
    expect(nonFinance.status).toBe(400);

    const created = await request(app)
      .post('/api/v1/marketplace/listings')
      .set('X-Admin-Key', ADMIN_KEY)
      .send(basePayload);
    expect(created.status).toBe(201);
    expect(created.body.listing.slug).toBe('options-flow-radar');
    expect(created.body.listing.atomicAmount).toBe('100000');
    expect(created.body.listing.platformFeeAtomic).toBe('10000');
    expect(created.body.listing.sellerNetAtomic).toBe('90000');
  });

  // ==========================================================================
  // 5. VERIFIED-DELIVERY-BEFORE-SETTLEMENT PROXY & PAYOUT LEDGER
  // ==========================================================================

  it('verifies delivery BEFORE settling payment: blocks charge on failed seller delivery, settles & splits 90/10 on verified delivery', async () => {
    const sellerWallet = '0x3333333333333333333333333333333333333333';
    const onboard = await request(app)
      .post('/api/v1/marketplace/listings')
      .set('X-Admin-Key', ADMIN_KEY)
      .send({
        slug: 'credit-spread-pulse',
        name: 'HY Credit Spread Pulse',
        description: 'Live OAS credit spread feed for corporate bond issuers.',
        category: 'fixed_income',
        sellerName: 'SpreadDesk Analytics',
        sellerWallet,
        upstreamUrl: 'https://api.spreaddesk.example/v1/oas',
        method: 'GET',
        priceUsd: 0.1,
        requiredResponseKeys: ['issuer', 'oasBps']
      });
    expect(onboard.status).toBe(201);

    const unpaid = await request(app).get('/api/v1/marketplace/call/credit-spread-pulse?issuer=NVDA');
    expect(unpaid.status).toBe(402);
    const decodedReq = decodePaymentRequiredHeader(unpaid.headers['payment-required']);
    expect(decodedReq.accepts[0].amount).toBe('100000');
    expect(decodedReq.accepts[0].network).toBe('eip155:8453');
    expect((decodedReq.accepts[0].extra as any).marketplace.takeRateBps).toBe(1000);
    expect(settleSpy).not.toHaveBeenCalled();

    // Paid call when seller returns HTTP 500 -> DO NOT SETTLE (buyer charged $0!)
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () => new Response('Internal Server Error', { status: 500 })) as any
    });

    const failed500 = await request(app)
      .get('/api/v1/marketplace/call/credit-spread-pulse?issuer=NVDA')
      .set('PAYMENT-SIGNATURE', buildSignedPaymentHeader('0x1001', '0x1111111111111111111111111111111111111111', '100000'));
    expect(failed500.status).toBe(502);
    expect(failed500.body.charged).toBe(false);
    expect(failed500.body.deliveryVerified).toBe(false);
    expect(verifySpy).toHaveBeenCalledTimes(1);
    expect(settleSpy).not.toHaveBeenCalled();

    // Paid call when seller omits required schema key -> DO NOT SETTLE!
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () =>
        new Response(JSON.stringify({ issuer: 'NVDA', note: 'missing oasBps' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      ) as any
    });

    const failedSchema = await request(app)
      .get('/api/v1/marketplace/call/credit-spread-pulse?issuer=NVDA')
      .set('PAYMENT-SIGNATURE', buildSignedPaymentHeader('0x1002', '0x1111111111111111111111111111111111111111', '100000'));
    expect(failedSchema.status).toBe(502);
    expect(failedSchema.body.charged).toBe(false);
    expect(failedSchema.body.reason).toContain('oasBps');
    expect(settleSpy).not.toHaveBeenCalled();

    // Paid call when seller delivers valid HTTP 200 JSON matching schema -> SETTLE + 90/10 PAYOUT + SIGNED RECEIPT!
    const exactSellerPayload = JSON.stringify({
      issuer: 'NVDA',
      oasBps: 42.5,
      asOf: '2026-11-18T15:00:00Z'
    });
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () =>
        new Response(exactSellerPayload, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      ) as any
    });

    const success = await request(app)
      .get('/api/v1/marketplace/call/credit-spread-pulse?issuer=NVDA')
      .set('PAYMENT-SIGNATURE', buildSignedPaymentHeader('0x1003', '0x1111111111111111111111111111111111111111', '100000'));

    expect(success.status).toBe(200);
    expect(success.text).toBe(exactSellerPayload);
    expect(settleSpy).toHaveBeenCalledTimes(1);
    expect(success.headers['payment-response']).toBeTruthy();

    const receiptId = success.headers['x-stockbloc-receipt-id'];
    expect(receiptId).toMatch(/^rcpt_[a-f0-9]{24}$/);

    // Verify via GET ?receiptId=... and POST { receiptId, rawPayload }
    const getVerifyRes = await request(app).get(`/api/v1/receipts/verify?receiptId=${receiptId}`);
    expect(getVerifyRes.status).toBe(200);
    expect(getVerifyRes.body.verified).toBe(true);
    expect(getVerifyRes.body.receipt.payTo).toBe(sellerWallet);

    const postVerifyRes = await request(app)
      .post('/api/v1/receipts/verify')
      .send({ receiptId, rawPayload: success.text });
    expect(postVerifyRes.status).toBe(200);
    expect(postVerifyRes.body.verified).toBe(true);

    // Listing reputation & payout ledger checks
    const listingDetail = await request(app).get('/api/v1/marketplace/listings/credit-spread-pulse');
    expect(listingDetail.status).toBe(200);
    expect(listingDetail.body.reputation.verifiedSalesCount).toBe(1);
    expect(listingDetail.body.reputation.failedDeliveriesCount).toBe(2);
    expect(listingDetail.body.reputation.deliverySuccessRate).toBe(33.33);
    expect(listingDetail.body.reputation.recentReceiptIds).toContain(receiptId);

    const payoutsRes = await request(app)
      .get('/api/v1/marketplace/payouts')
      .set('X-Admin-Key', ADMIN_KEY);
    expect(payoutsRes.status).toBe(200);
    expect(payoutsRes.body.count).toBe(1);
    expect(payoutsRes.body.payouts[0].status).toBe('pending_payout');
    expect(payoutsRes.body.payouts[0].sellerNetAtomic).toBe('90000');
    expect(payoutsRes.body.payouts[0].platformFeeAtomic).toBe('10000');

    const payoutId = payoutsRes.body.payouts[0].payoutId;
    const realBaseTxHash = '0x' + '9f'.repeat(32);
    const markPaid = await request(app)
      .post(`/api/v1/marketplace/payouts/${payoutId}/mark-paid`)
      .set('X-Admin-Key', ADMIN_KEY)
      .send({ txHash: realBaseTxHash });
    expect(markPaid.status).toBe(200);
    expect(markPaid.body.payout.status).toBe('paid');

    const statsAfter = await request(app).get('/api/v1/marketplace/stats');
    expect(statsAfter.status).toBe(200);
    expect(statsAfter.body.liveMetrics.activeThirdPartyListings).toBe(1);
    expect(statsAfter.body.liveMetrics.verifiedMarketplaceSales).toBe(1);
    expect(statsAfter.body.liveMetrics.failedDeliveriesBlocked).toBe(2);
    expect(statsAfter.body.liveMetrics.grossVolumeUsd).toBe(0.1);
    expect(statsAfter.body.liveMetrics.platformRevenueUsd).toBe(0.01);
    expect(statsAfter.body.liveMetrics.sellerNetPendingUsd).toBe(0);
    expect(statsAfter.body.liveMetrics.sellerNetPaidUsd).toBe(0.09);
  });
});
