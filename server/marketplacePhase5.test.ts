// @vitest-environment node
import crypto from 'crypto';
import fs from 'fs';
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
import { clearX402SettlementRegistry } from './x402PaymentService.js';
import {
  createVerifiedReceiptsRouter,
  getPublicReceiptKey,
  clearVerifiedReceiptsStore,
  canonicalJsonStringify
} from './verifiedReceiptsService.js';
import {
  createMarketplaceRailRouter,
  clearMarketplaceRailStore,
  setMarketplaceTestingHooks
} from './marketplaceRailService.js';
import {
  setMarketplacePayoutTestingHooks,
  resetMarketplacePayoutTestingHooks,
  sanitizeMarketplaceError
} from './marketplacePayoutService.js';
import {
  agentTelemetryRouter,
  clearTelemetryState,
  getMarketplaceFunnelMetrics
} from './agentTelemetry.js';

const MARKETPLACE_WALLET = '0x9999999999999999999999999999999999999999';
const BUYER_WALLET = '0x1111111111111111111111111111111111111111';
const SELLER_WALLET = '0x2222222222222222222222222222222222222222';
const ADMIN_KEY = 'marketplace_phase5_admin_secret_2026';

function buildBuyPaymentHeader(nonceHex: string, amount = '50000', payer = BUYER_WALLET) {
  return encodePaymentSignatureHeader({
    x402Version: 2,
    accepted: {
      scheme: 'exact',
      network: 'eip155:8453',
      amount,
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      payTo: MARKETPLACE_WALLET
    },
    payload: {
      signature: '0x' + 'cd'.repeat(65),
      authorization: {
        from: payer,
        to: MARKETPLACE_WALLET,
        value: amount,
        validAfter: '0',
        validBefore: '1999999999',
        nonce: nonceHex
      }
    }
  } as any);
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/.well-known/receipts-pubkey.json', (_req, res) => {
    res.status(200).json(getPublicReceiptKey());
  });
  app.use('/api/v1/receipts', createVerifiedReceiptsRouter());
  app.use('/api/v1/marketplace', createMarketplaceRailRouter());
  app.use('/api/v1/telemetry', agentTelemetryRouter);
  return app;
}

describe('Finance Agent Marketplace (Prompt 5 — All 5 Phases)', () => {
  let app: express.Express;
  let verifySpy: ReturnType<typeof vi.fn<(...args: any[]) => Promise<any>>>;
  let settleSpy: ReturnType<typeof vi.fn<(...args: any[]) => Promise<any>>>;
  let usdcTransferSpy: ReturnType<typeof vi.fn<(...args: any[]) => Promise<{ txHash: string; from?: string }>>>;
  let txCounter: number;

  beforeEach(() => {
    process.env.MARKETPLACE_ADMIN_KEY = ADMIN_KEY;
    process.env.MARKETPLACE_WALLET_ADDRESS = MARKETPLACE_WALLET;
    process.env.MARKETPLACE_WALLET_KEY = '0x' + '1a'.repeat(32);

    txCounter = 1;
    resetFacilitatorMock();
    clearX402SettlementRegistry();
    clearVerifiedReceiptsStore();
    clearMarketplaceRailStore();
    clearTelemetryState();
    setMarketplaceTestingHooks({ allowPrivateUpstream: false, upstreamFetch: null, buyTimeoutMs: null });
    resetMarketplacePayoutTestingHooks();

    verifySpy = vi.fn(async () => ({
      isValid: true,
      payer: BUYER_WALLET
    }));
    setFacilitatorVerifyHandler((payload, reqs) => verifySpy(payload, reqs));

    settleSpy = vi.fn(async () => ({
      success: true,
      transaction: `0x${String(txCounter++).padStart(64, 'b')}`,
      payer: BUYER_WALLET,
      network: 'eip155:8453'
    }));
    setFacilitatorSettleHandler((payload, reqs) => settleSpy(payload, reqs));

    usdcTransferSpy = vi.fn(async () => ({
      txHash: `0x${String(txCounter++).padStart(64, 'e')}`,
      from: MARKETPLACE_WALLET
    }));
    setMarketplacePayoutTestingHooks({
      transferExecutor: (req) => usdcTransferSpy(req),
      balanceReader: async () => 10_000_000n, // $10.00 USDC balance
      retryDelaysMs: [0, 0]
    });

    app = buildApp();
  });

  afterEach(() => {
    resetFacilitatorMock();
    setMarketplaceTestingHooks({ allowPrivateUpstream: false, upstreamFetch: null, buyTimeoutMs: null });
    resetMarketplacePayoutTestingHooks();
    delete process.env.MARKETPLACE_ADMIN_KEY;
    delete process.env.MARKETPLACE_WALLET_ADDRESS;
    delete process.env.MARKETPLACE_WALLET_KEY;
  });

  async function applyAndApproveListing(
    overrides: Record<string, any> = {},
    probeResponse: () => Response = () =>
      new Response(JSON.stringify({ ticker: 'NVDA', signal: 'ACCUMULATE', score: 91 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
  ): Promise<string> {
    const applyRes = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Alpha Flow Radar',
        endpointUrl: 'https://seller.alphaflow.example/v1/signal',
        priceUsd: 0.05,
        description: 'Institutional dark-pool and sweep order-flow signals.',
        payoutWallet: SELLER_WALLET,
        contact: 'ops@alphaflow.example',
        sellerName: 'AlphaFlow Labs',
        category: 'signals',
        method: 'GET',
        ...overrides
      });
    expect(applyRes.status).toBe(201);
    const listingId = applyRes.body.listingId as string;

    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () => probeResponse()) as any
    });

    const approveRes = await request(app)
      .post(`/api/v1/marketplace/listings/${listingId}/approve`)
      .set('X-Admin-Key', ADMIN_KEY)
      .send({});
    expect(approveRes.status).toBe(200);
    return listingId;
  }

  // ==========================================================================
  // PHASE 1: APPLY, VALIDATE, PROBE-GATED APPROVE, REJECT, PUBLIC CATALOG
  // ==========================================================================

  it('Phase 1: validates seller applications, keeps PENDING hidden, probes before approve, and never leaks contact', async () => {
    // Reject HTTP (non-HTTPS)
    const httpErr = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Bad HTTP Feed',
        endpointUrl: 'http://seller.example/v1/data',
        priceUsd: 0.05,
        description: 'Insecure feed',
        payoutWallet: SELLER_WALLET,
        contact: 'a@b.com'
      });
    expect(httpErr.status).toBe(400);

    // Reject SSRF private IP
    const ssrfErr = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'SSRF Feed',
        endpointUrl: 'https://169.254.169.254/latest/meta-data',
        priceUsd: 0.05,
        description: 'Metadata attack',
        payoutWallet: SELLER_WALLET,
        contact: 'a@b.com'
      });
    expect(ssrfErr.status).toBe(400);

    // Reject out-of-range priceUsd ($0.0001 and $1.50)
    const tooCheap = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Too Cheap',
        endpointUrl: 'https://seller.example/v1/data',
        priceUsd: 0.0001,
        description: 'Below min',
        payoutWallet: SELLER_WALLET,
        contact: 'a@b.com'
      });
    expect(tooCheap.status).toBe(400);

    const tooExpensive = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Too Expensive',
        endpointUrl: 'https://seller.example/v1/data',
        priceUsd: 1.5,
        description: 'Above $1.00 cap',
        payoutWallet: SELLER_WALLET,
        contact: 'a@b.com'
      });
    expect(tooExpensive.status).toBe(400);

    // Reject invalid Base wallet
    const badWallet = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Bad Wallet',
        endpointUrl: 'https://seller.example/v1/data',
        priceUsd: 0.05,
        description: 'Invalid address',
        payoutWallet: 'not-a-wallet',
        contact: 'a@b.com'
      });
    expect(badWallet.status).toBe(400);

    // Valid application -> stored as PENDING, hidden from public GET /listings
    const applyRes = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Dark Pool Pulse',
        endpointUrl: 'https://seller.darkpool.example/v1/pulse',
        priceUsd: 0.05,
        description: 'Real-time institutional block trade alerts.',
        payoutWallet: SELLER_WALLET,
        contact: 'private-founder@darkpool.example',
        sellerName: 'DarkPool Desk'
      });
    expect(applyRes.status).toBe(201);
    expect(applyRes.body.status).toBe('PENDING');
    const listingId = applyRes.body.listingId;
    expect(listingId).toMatch(/^lst_[a-f0-9]{16}$/);

    // Public catalog MUST be empty while PENDING
    const publicBefore = await request(app).get('/api/v1/marketplace/listings');
    expect(publicBefore.status).toBe(200);
    expect(publicBefore.body.count).toBe(0);
    expect(publicBefore.body.listings).toEqual([]);

    // Admin auth required for approve
    const unauthApprove = await request(app).post(`/api/v1/marketplace/listings/${listingId}/approve`);
    expect(unauthApprove.status).toBe(403);

    // Probe fails (HTTP 500) -> approve returns 422 and keeps listing PENDING!
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () => new Response('Server down', { status: 500 })) as any
    });
    const failedProbe = await request(app)
      .post(`/api/v1/marketplace/listings/${listingId}/approve`)
      .set('X-Admin-Key', ADMIN_KEY);
    expect(failedProbe.status).toBe(422);
    expect(failedProbe.body.approved).toBe(false);
    expect(failedProbe.body.status).toBe('PENDING');

    const stillHidden = await request(app).get('/api/v1/marketplace/listings');
    expect(stillHidden.body.count).toBe(0);

    // Probe succeeds (HTTP 200 valid non-empty JSON) -> APPROVED & visible!
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () =>
        new Response(JSON.stringify({ ticker: 'NVDA', blocks: 14 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      ) as any
    });
    const okApprove = await request(app)
      .post(`/api/v1/marketplace/listings/${listingId}/approve`)
      .set('X-Admin-Key', ADMIN_KEY);
    expect(okApprove.status).toBe(200);
    expect(okApprove.body.approved).toBe(true);
    expect(okApprove.body.status).toBe('APPROVED');

    // Public listing includes required fields and NEVER leaks contact or endpointUrl
    const publicAfter = await request(app).get('/api/v1/marketplace/listings');
    expect(publicAfter.status).toBe(200);
    expect(publicAfter.body.count).toBe(1);
    const pub = publicAfter.body.listings[0];
    expect(pub.listingId).toBe(listingId);
    expect(pub.name).toBe('Dark Pool Pulse');
    expect(pub.priceUsd).toBe(0.05);
    expect(pub.seller).toBe('DarkPool Desk');
    expect(pub.verified).toBe(true);
    expect(pub.salesCount).toBe(0);
    expect(pub.deliveryRate).toBeNull();
    expect(pub.listedAt).toBeTruthy();
    expect(pub.contact).toBeUndefined();
    expect(pub.endpointUrl).toBeUndefined();
    expect(pub.upstreamUrl).toBeUndefined();
    expect(JSON.stringify(publicAfter.body)).not.toContain('private-founder@darkpool.example');
    expect(JSON.stringify(publicAfter.body)).not.toContain('seller.darkpool.example');

    // Test reject endpoint stores reason and hides listing
    const secondApply = await request(app)
      .post('/api/v1/marketplace/listings/apply')
      .send({
        name: 'Spam Bot',
        endpointUrl: 'https://spam.example/v1/data',
        priceUsd: 0.02,
        description: 'Unrelated feed',
        payoutWallet: SELLER_WALLET,
        contact: 'spam@example.com'
      });
    const rejectRes = await request(app)
      .post(`/api/v1/marketplace/listings/${secondApply.body.listingId}/reject`)
      .set('X-Admin-Key', ADMIN_KEY)
      .send({ reason: 'Not a finance endpoint' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('REJECTED');
    expect(rejectRes.body.rejectionReason).toBe('Not a finance endpoint');

    const publicFinal = await request(app).get('/api/v1/marketplace/listings');
    expect(publicFinal.body.count).toBe(1);
  });

  // ==========================================================================
  // PHASE 2, 3 & 4 (HAPPY PATH): 402 -> BUY -> RECEIPT -> 90% PAYOUT -> FUNNEL
  // ==========================================================================

  it('Phases 2, 3 & 4: executes 402 challenge, CDP verify+settle, verified delivery receipt with listingId, and 90% USDC seller payout', async () => {
    const listingId = await applyAndApproveListing({ priceUsd: 0.05 });

    // 1. Unpaid buy -> HTTP 402 with exact atomicAmount & MARKETPLACE_WALLET_ADDRESS
    const unpaid = await request(app)
      .post('/api/v1/marketplace/buy')
      .send({ listingId, params: { ticker: 'NVDA' } });
    expect(unpaid.status).toBe(402);
    expect(unpaid.headers['payment-required']).toBeTruthy();
    const decoded = decodePaymentRequiredHeader(unpaid.headers['payment-required']);
    expect(decoded.accepts[0].amount).toBe('50000');
    expect(decoded.accepts[0].network).toBe('eip155:8453');
    expect(decoded.accepts[0].payTo).toBe(MARKETPLACE_WALLET);
    expect(settleSpy).not.toHaveBeenCalled();

    // 2. Unverified payment rejected BEFORE calling seller
    const sellerSpy = vi.fn(async () =>
      new Response(JSON.stringify({ ticker: 'NVDA', alphaScore: 94.2, signal: 'STRONG_BUY' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    setMarketplaceTestingHooks({ upstreamFetch: sellerSpy as any });
    setFacilitatorVerifyHandler(async () => ({ isValid: false, invalidReason: 'Bad signature' }));

    const badPay = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x2001', '50000'))
      .send({ listingId, params: { ticker: 'NVDA' } });
    expect(badPay.status).toBe(402);
    expect(sellerSpy).not.toHaveBeenCalled();
    expect(usdcTransferSpy).not.toHaveBeenCalled();

    // Restore valid verify handler
    setFacilitatorVerifyHandler((p, r) => verifySpy(p, r));

    // 3. Valid paid buy -> settles, calls seller, returns payload + signed receipt, pays seller 90% (45000 atomic)
    const buyRes = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x2002', '50000'))
      .send({ listingId, params: { ticker: 'NVDA' } });

    expect(buyRes.status).toBe(200);
    expect(buyRes.body.ticker).toBe('NVDA');
    expect(buyRes.body.alphaScore).toBe(94.2);
    expect(buyRes.body.receipt).toBeDefined();

    const receipt = buyRes.body.receipt;
    expect(receipt.receiptId).toMatch(/^rcpt_[a-f0-9]{24}$/);
    expect(receipt.listingId).toBe(listingId);
    expect(receipt.endpoint).toBe('/api/v1/marketplace/buy');
    expect(receipt.ticker).toBe('NVDA');
    expect(receipt.payer).toBe(BUYER_WALLET);
    expect(receipt.payTo).toBe(MARKETPLACE_WALLET);
    expect(receipt.amountUsd).toBe(0.05);
    expect(receipt.paymentTxHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(receipt.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.challengedAt).toBeTruthy();
    expect(receipt.paidAt).toBeTruthy();
    expect(receipt.deliveredAt).toBeTruthy();
    expect(receipt.signature).toBeTruthy();

    // Offline Ed25519 signature check
    const pubKey = crypto.createPublicKey(getPublicReceiptKey().publicKeyPem);
    const { signature, ...unsigned } = receipt;
    expect(
      crypto.verify(null, Buffer.from(canonicalJsonStringify(unsigned), 'utf8'), pubKey, Buffer.from(signature, 'base64'))
    ).toBe(true);

    // Public GET & POST receipt verification endpoints
    const getVerify = await request(app).get(`/api/v1/receipts/verify?receiptId=${receipt.receiptId}`);
    expect(getVerify.status).toBe(200);
    expect(getVerify.body.verified).toBe(true);
    expect(getVerify.body.receipt.listingId).toBe(listingId);

    const { receipt: _r, ...deliveredPayload } = buyRes.body;
    const postVerify = await request(app)
      .post('/api/v1/receipts/verify')
      .send({ receipt, payload: deliveredPayload });
    expect(postVerify.status).toBe(200);
    expect(postVerify.body.verified).toBe(true);

    // Verify 90% seller USDC transfer was executed (45000 atomic = $0.045, Stock Bloc keeps 5000 = $0.005)
    expect(usdcTransferSpy).toHaveBeenCalledTimes(1);
    const transferArg = usdcTransferSpy.mock.calls[0][0];
    expect(transferArg.to).toBe(SELLER_WALLET);
    expect(transferArg.amountAtomic).toBe(45000n);
    expect(transferArg.kind).toBe('seller_payout');

    // Payout recorded in admin ledger as 'paid' with payoutTxHash; duplicate retry refused (409)
    const payoutsRes = await request(app).get('/api/v1/marketplace/payouts').set('X-Admin-Key', ADMIN_KEY);
    expect(payoutsRes.status).toBe(200);
    expect(payoutsRes.body.count).toBe(1);
    const payout = payoutsRes.body.payouts[0];
    expect(payout.status).toBe('paid');
    expect(payout.listingId).toBe(listingId);
    expect(payout.grossAmount).toBe(0.05);
    expect(payout.sellerShare).toBe(0.045);
    expect(payout.blocShare).toBe(0.005);
    expect(payout.payoutTxHash).toMatch(/^0x[a-f0-9]{64}$/);

    const dupRetry = await request(app)
      .post(`/api/v1/marketplace/payouts/${payout.payoutId}/retry`)
      .set('X-Admin-Key', ADMIN_KEY);
    expect(dupRetry.status).toBe(409);

    // Listing stats updated honestly
    const listingDetail = await request(app).get(`/api/v1/marketplace/listings/${listingId}`);
    expect(listingDetail.body.salesCount).toBe(1);
    expect(listingDetail.body.deliveryRate).toBe(100);

    // Phase 5: Marketplace funnel telemetry reflects exact steps
    const funnelRes = await request(app).get('/api/v1/telemetry/funnel');
    expect(funnelRes.status).toBe(200);
    expect(funnelRes.body.marketplace).toEqual({
      challenges: 1,
      verifiedPayments: 1,
      settlements: 1,
      deliveries: 1,
      payouts: 1,
      refunds: 0
    });
  });

  // ==========================================================================
  // PHASE 4: PAYOUT RETRY QUEUE (3 ATTEMPTS + MANUAL RETRY) & BALANCE GUARD
  // ==========================================================================

  it('Phase 4: retries failed seller payouts 3 times, marks failed if still failing, and supports manual admin retry', async () => {
    const listingId = await applyAndApproveListing({ priceUsd: 0.1 });

    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () =>
        new Response(JSON.stringify({ ticker: 'AAPL', rating: 'OUTPERFORM' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      ) as any
    });

    // Fail all 3 initial transfer attempts with an error containing the secret key to verify redaction too!
    const failingTransfer = vi.fn(async () => {
      throw new Error(`RPC timeout using ${process.env.MARKETPLACE_WALLET_KEY}`);
    });
    setMarketplacePayoutTestingHooks({
      transferExecutor: failingTransfer,
      retryDelaysMs: [0, 0]
    });

    const buyRes = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x3001', '100000'))
      .send({ listingId, params: { ticker: 'AAPL' } });

    // Buyer still gets their verified data & receipt
    expect(buyRes.status).toBe(200);
    expect(buyRes.body.receipt.listingId).toBe(listingId);
    // Payout runner retried exactly 3 times
    expect(failingTransfer).toHaveBeenCalledTimes(3);

    // Payout is preserved in 'failed' status (never lost) and secret key is redacted!
    const payoutsRes = await request(app).get('/api/v1/marketplace/payouts').set('X-Admin-Key', ADMIN_KEY);
    expect(payoutsRes.status).toBe(200);
    expect(payoutsRes.body.failedCount).toBe(1);
    const failedPayout = payoutsRes.body.payouts[0];
    expect(failedPayout.status).toBe('failed');
    expect(failedPayout.attempts).toBe(3);
    expect(failedPayout.lastError).toContain('[REDACTED]');
    expect(failedPayout.lastError).not.toContain(process.env.MARKETPLACE_WALLET_KEY);

    // Now RPC recovers -> manual admin retry succeeds on attempt 1
    setMarketplacePayoutTestingHooks({
      transferExecutor: usdcTransferSpy,
      retryDelaysMs: [0, 0]
    });
    const retryRes = await request(app)
      .post(`/api/v1/marketplace/payouts/${failedPayout.payoutId}/retry`)
      .set('X-Admin-Key', ADMIN_KEY);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.succeeded).toBe(true);
    expect(retryRes.body.payout.status).toBe('paid');
    expect(retryRes.body.payout.payoutTxHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('Phase 4 Safety: blocks overdraft payout when marketplace wallet USDC balance is insufficient', async () => {
    const listingId = await applyAndApproveListing({ priceUsd: 0.5 });

    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () =>
        new Response(JSON.stringify({ ticker: 'MSFT', delta: 1.5 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      ) as any
    });

    // Wallet only holds 100000 atomic ($0.10), cannot send 450000 ($0.45)
    setMarketplacePayoutTestingHooks({
      balanceReader: async () => 100_000n,
      transferExecutor: usdcTransferSpy,
      retryDelaysMs: [0, 0]
    });

    const buyRes = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x3055', '500000'))
      .send({ listingId, params: { ticker: 'MSFT' } });
    expect(buyRes.status).toBe(200);
    expect(usdcTransferSpy).not.toHaveBeenCalled();

    const payoutsRes = await request(app).get('/api/v1/marketplace/payouts').set('X-Admin-Key', ADMIN_KEY);
    expect(payoutsRes.body.payouts[0].status).toBe('failed');
    expect(payoutsRes.body.payouts[0].lastError).toContain('Insufficient marketplace USDC balance');
  });

  // ==========================================================================
  // PHASE 4: FAILED DELIVERY -> 100% BUYER REFUND, $0 SELLER, AUTO-SUSPEND AT 3
  // ==========================================================================

  it('Phase 4: refunds 100% to buyer on failed seller delivery, pays seller $0, and auto-suspends listing to PENDING after 3 consecutive failures', async () => {
    const listingId = await applyAndApproveListing({ priceUsd: 0.05 });

    // Failure 1: Seller returns HTTP 500
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () => new Response('Internal error', { status: 500 })) as any
    });
    const fail1 = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x4001', '50000'))
      .send({ listingId, params: { ticker: 'NVDA' } });

    expect(fail1.status).toBe(502);
    expect(fail1.body.deliveryVerified).toBe(false);
    expect(fail1.body.sellerPaidUsd).toBe(0);
    expect(fail1.body.listingSuspended).toBe(false);
    expect(fail1.body.consecutiveFailures).toBe(1);
    expect(fail1.body.refund.status).toBe('paid');
    expect(fail1.body.refund.amountUsd).toBe(0.05);
    expect(fail1.body.refund.buyerWallet).toBe(BUYER_WALLET);
    expect(fail1.body.refund.refundTxHash).toMatch(/^0x[a-f0-9]{64}$/);

    // Verify 100% refund transfer (50000 atomic) went to BUYER_WALLET, not seller
    expect(usdcTransferSpy).toHaveBeenCalledTimes(1);
    expect(usdcTransferSpy.mock.calls[0][0].to).toBe(BUYER_WALLET);
    expect(usdcTransferSpy.mock.calls[0][0].amountAtomic).toBe(50000n);
    expect(usdcTransferSpy.mock.calls[0][0].kind).toBe('buyer_refund');

    // Failure 2: Seller returns invalid JSON
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () => new Response('<html>not json</html>', { status: 200 })) as any
    });
    const fail2 = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x4002', '50000'))
      .send({ listingId, params: { ticker: 'NVDA' } });
    expect(fail2.status).toBe(502);
    expect(fail2.body.consecutiveFailures).toBe(2);
    expect(fail2.body.listingSuspended).toBe(false);

    // Failure 3: Seller returns empty JSON object {} -> AUTO-SUSPEND to PENDING!
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () => new Response('{}', { status: 200 })) as any
    });
    const fail3 = await request(app)
      .post('/api/v1/marketplace/buy')
      .set('PAYMENT-SIGNATURE', buildBuyPaymentHeader('0x4003', '50000'))
      .send({ listingId, params: { ticker: 'NVDA' } });
    expect(fail3.status).toBe(502);
    expect(fail3.body.consecutiveFailures).toBe(3);
    expect(fail3.body.listingSuspended).toBe(true);
    expect(fail3.body.refund.status).toBe('paid');

    // Listing is now suspended (PENDING) -> removed from public catalog & buy returns 404!
    const publicList = await request(app).get('/api/v1/marketplace/listings');
    expect(publicList.body.count).toBe(0);

    const buyAfterSuspend = await request(app)
      .post('/api/v1/marketplace/buy')
      .send({ listingId, params: { ticker: 'NVDA' } });
    expect(buyAfterSuspend.status).toBe(404);

    // Seller got $0 (0 payouts recorded) and 3 refunds recorded
    const payoutsRes = await request(app).get('/api/v1/marketplace/payouts').set('X-Admin-Key', ADMIN_KEY);
    expect(payoutsRes.body.count).toBe(0);

    const refundsRes = await request(app).get('/api/v1/marketplace/refunds').set('X-Admin-Key', ADMIN_KEY);
    expect(refundsRes.body.count).toBe(3);
    expect(getMarketplaceFunnelMetrics().refunds).toBe(3);
    expect(getMarketplaceFunnelMetrics().payouts).toBe(0);

    // Admin can re-approve once seller fixes endpoint (probe passes)
    setMarketplaceTestingHooks({
      upstreamFetch: vi.fn(async () =>
        new Response(JSON.stringify({ ticker: 'NVDA', recovered: true }), { status: 200 })
      ) as any
    });
    const reapprove = await request(app)
      .post(`/api/v1/marketplace/listings/${listingId}/approve`)
      .set('X-Admin-Key', ADMIN_KEY);
    expect(reapprove.status).toBe(200);
    expect(reapprove.body.status).toBe('APPROVED');

    const restoredList = await request(app).get('/api/v1/marketplace/listings');
    expect(restoredList.body.count).toBe(1);
  });

  // ==========================================================================
  // PHASE 5: DOCS, MANIFEST, OPENAPI & SECRET SANITIZATION CHECKS
  // ==========================================================================

  it('Phase 5: manifest.json, openapi.json, llms.txt, skill.md, and secret sanitization are valid and aligned', () => {
    const manifest = JSON.parse(fs.readFileSync('public/agents/manifest.json', 'utf8'));
    expect(manifest.endpoints.marketplaceListings.path).toBe('/api/v1/marketplace/listings');
    expect(manifest.endpoints.marketplaceApply.path).toBe('/api/v1/marketplace/listings/apply');
    expect(manifest.endpoints.marketplaceBuy.path).toBe('/api/v1/marketplace/buy');
    expect(manifest.endpoints.marketplaceBuy.payment.pricingMode).toBe('variable_per_listing');

    const rootOpenApi = JSON.parse(fs.readFileSync('public/openapi.json', 'utf8'));
    expect(rootOpenApi.paths['/api/v1/marketplace/buy'].post).toBeDefined();
    expect(rootOpenApi.paths['/api/v1/marketplace/listings/apply'].post).toBeDefined();

    const v1OpenApi = JSON.parse(fs.readFileSync('public/api/v1/openapi.json', 'utf8'));
    expect(v1OpenApi.paths['/api/v1/marketplace/buy'].post).toBeDefined();
    expect(v1OpenApi.paths['/api/v1/marketplace/listings/apply'].post).toBeDefined();

    const llms = fs.readFileSync('public/llms.txt', 'utf8');
    expect(llms).toContain('/api/v1/marketplace/buy');
    expect(llms).toContain('/api/v1/marketplace/listings/apply');
    expect(llms).toContain('10% take rate');

    const skill = fs.readFileSync('public/agents/skill.md', 'utf8');
    expect(skill).toContain('/api/v1/marketplace/buy');
    expect(skill).toContain('/api/v1/marketplace/listings/apply');
    expect(skill).not.toMatch(/bearer|sb_live|registered agents|platform credits|register monetization/gi);

    const sanitized = sanitizeMarketplaceError(
      new Error(`Failed with ${process.env.MARKETPLACE_WALLET_KEY} and ${ADMIN_KEY}`)
    );
    expect(sanitized).not.toContain(process.env.MARKETPLACE_WALLET_KEY);
    expect(sanitized).not.toContain(ADMIN_KEY);
    expect(sanitized).toContain('[REDACTED]');
  });
});
