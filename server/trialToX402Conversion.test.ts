import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import {
  requireX402Payment,
  PRICED_ENDPOINTS,
  BASE_CAIP2,
  BASE_USDC_CONTRACT,
  getX402RecipientAddress
} from './x402PaymentService.js';
import { decodePaymentRequiredHeader } from '@x402/core/http';
import {
  resetFacilitatorMock,
  setFacilitatorVerifyHandler,
  setFacilitatorSettleHandler
} from './testSetup/facilitatorMock.js';
import {
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  inMemoryWalletRegistry
} from './agentPlatform.js';

describe('Trial-to-x402 Payment Conversion Engine', () => {
  const originalEnv = { ...process.env };
  const TEST_RECIPIENT_ADDRESS = '0x0123456789abcdef0123456789abcdef01234567';

  beforeEach(() => {
    process.env.X402_RECIPIENT_ADDRESS = TEST_RECIPIENT_ADDRESS;
    resetFacilitatorMock();
    inMemoryAgentRegistry.clear();
    inMemoryKeyRegistry.clear();
    inMemoryWalletRegistry.clear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // Construct isolated Express test app
  const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Mount x402 payment protection
    app.use(requireX402Payment());

    // Priced endpoints
    app.get('/api/v1/intelligence/sb-score', (req, res) => {
      res.json({
        status: 'success',
        ticker: req.query.ticker || 'NVDA',
        sbScore: 88,
        signalLabel: 'STRONG BUY',
        attributedAgent: (req as any).agent?.agentId || null
      });
    });

    app.post('/api/v1/sec/job', (req, res) => {
      res.json({
        status: 'success',
        jobId: 'sec_job_test_001',
        auditPassed: true,
        attributedAgent: (req as any).agent?.agentId || null
      });
    });

    return app;
  };

  // Helper to register an autonomous agent with explicit credit balance
  const registerTestAgent = (creditsBalance = 100) => {
    const agentId = `agent_auto_${crypto.randomBytes(4).toString('hex')}`;
    const publicId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(16).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');
    const rawApiKey = `sb_live_${publicId}_${secret}`;
    const handle = `quant_bot_${publicId.substring(0, 6)}`;

    inMemoryAgentRegistry.set(agentId, {
      agentId,
      handle,
      displayName: `Quant Bot ${publicId.substring(0, 4)}`,
      status: 'active'
    });

    inMemoryKeyRegistry.set(publicId, {
      keyId: publicId,
      agentId,
      handle,
      secretHash,
      keyHash: secretHash,
      status: 'active',
      scopes: ['services:read', 'payments:transact'] as any,
      createdAt: new Date().toISOString()
    } as any);

    inMemoryKeyRegistry.set(rawApiKey, {
      keyId: publicId,
      agentId,
      handle,
      secretHash,
      keyHash: secretHash,
      status: 'active',
      scopes: ['services:read', 'payments:transact'] as any,
      createdAt: new Date().toISOString()
    } as any);

    inMemoryWalletRegistry.set(agentId, {
      agentId,
      creditsBalance,
      availableBalance: creditsBalance,
      paidCreditsBalance: creditsBalance,
      lifetimeSpent: 0
    });

    return { agentId, rawApiKey, handle };
  };

  // --------------------------------------------------------------------------
  // A. Registered agent, sufficient credits: success, credits debited.
  // --------------------------------------------------------------------------
  it('A. Registered agent with sufficient credits: serves response and debits credits cleanly', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100);
    const app = createTestApp();

    const res = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('Authorization', `Bearer ${rawApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.sbScore).toBe(88);
    expect(res.body.attributedAgent).toBe(agentId);

    // sb-score costs $0.05 = 5 credits: 100 - 5 = 95
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(95);
  });

  // --------------------------------------------------------------------------
  // B. Registered agent, insufficient credits, no PAYMENT-SIGNATURE:
  //    HTTP 402 with valid x402 PAYMENT-REQUIRED payload and Base USDC instructions.
  // --------------------------------------------------------------------------
  it('B. Registered agent with insufficient credits and no PAYMENT-SIGNATURE: falls through to valid x402 402 challenge', async () => {
    const { agentId, rawApiKey } = registerTestAgent(0); // 0 credits remaining
    const app = createTestApp();

    const res = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('Authorization', `Bearer ${rawApiKey}`);

    expect(res.status).toBe(402);

    // 1. Verify PAYMENT-REQUIRED header is present and validly encoded
    const headerVal = res.headers['payment-required'];
    expect(headerVal).toBeDefined();
    const decodedHeader = decodePaymentRequiredHeader(headerVal);
    expect(decodedHeader.x402Version).toBe(2);
    expect(decodedHeader.accepts.length).toBeGreaterThan(0);
    expect(decodedHeader.accepts[0].network).toBe(BASE_CAIP2);
    expect(decodedHeader.accepts[0].asset).toBe(BASE_USDC_CONTRACT);

    // 2. Verify response body matches x402 specification
    expect(res.body.status).toBe('payment_required');
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
    expect(res.body.x402Version).toBe(2);
    expect(res.body.accepts[0].network).toBe(BASE_CAIP2);
    expect(res.body.accepts[0].amount).toBe('50000'); // $0.05 USDC = 50,000 atomic units
    expect(res.body.accepts[0].payTo).toBe(TEST_RECIPIENT_ADDRESS);

    // 3. Clear Base USDC payment instructions are provided
    expect(res.body.paymentDetails).toBeDefined();
    expect(res.body.paymentDetails.asset).toBe('USDC');
    expect(res.body.paymentDetails.network).toBe('Base');
    expect(res.body.paymentDetails.chainId).toBe(8453);
    expect(res.body.paymentDetails.instructions).toContain('USDC transferWithAuthorization');
    expect(res.body.paymentDetails.instructions).toContain('PAYMENT-SIGNATURE');

    // 4. Informs agent of trial credit exhaustion
    expect(res.body.error).toContain('Trial credit balance exhausted');
    expect(res.body.creditsRemaining).toBe(0);

    // 5. Never serves paid content!
    expect(res.body.sbScore).toBeUndefined();
    expect(res.body.signalLabel).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // C. Registered agent, insufficient credits, valid PAYMENT-SIGNATURE:
  //    x402 verification, settlement, paid response served.
  // --------------------------------------------------------------------------
  it('C. Registered agent with insufficient credits and valid PAYMENT-SIGNATURE: verifies, settles, and serves paid content', async () => {
    const { agentId, rawApiKey } = registerTestAgent(0); // Exhausted trial credits
    const app = createTestApp();

    const mockSignaturePayload = {
      version: '1',
      payer: '0x1111222233334444555566667777888899990000',
      signature: '0xabc123mockvalidsignature',
      authorization: { nonce: '0x01', validUntil: 1999999999 }
    };

    setFacilitatorVerifyHandler(async () => ({ isValid: true }));
    setFacilitatorSettleHandler(async () => ({
      success: true,
      txHash: '0xabcdef1234567890base_tx_hash',
      payer: mockSignaturePayload.payer
    }));

    const res = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .set('PAYMENT-SIGNATURE', JSON.stringify(mockSignaturePayload));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.sbScore).toBe(88);
    expect(res.body.attributedAgent).toBe(agentId);
    expect(res.headers['payment-response']).toBeDefined();

    // Verify credits were NOT debited (remains 0, no negative balance)
    expect(inMemoryWalletRegistry.get(agentId)?.creditsBalance).toBe(0);
  });

  // --------------------------------------------------------------------------
  // D. Registered agent, sufficient credits, PAYMENT-SIGNATURE supplied:
  //    Deterministic single charge, never double.
  // --------------------------------------------------------------------------
  it('D. Registered agent with sufficient credits who supplies PAYMENT-SIGNATURE: settled on-chain once, never double-charged against credits', async () => {
    const { agentId, rawApiKey } = registerTestAgent(100); // 100 credits available
    const app = createTestApp();

    const mockSignaturePayload = {
      version: '1',
      payer: '0x2222333344445555666677778888999900001111',
      signature: '0xdeadbeefvalidsignature',
      authorization: { nonce: '0x02', validUntil: 1999999999 }
    };

    setFacilitatorVerifyHandler(async () => ({ isValid: true }));
    setFacilitatorSettleHandler(async () => ({
      success: true,
      txHash: '0xsingle_charge_tx_hash',
      payer: mockSignaturePayload.payer
    }));

    const res = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('Authorization', `Bearer ${rawApiKey}`)
      .set('PAYMENT-SIGNATURE', JSON.stringify(mockSignaturePayload));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.attributedAgent).toBe(agentId);
    expect(res.headers['payment-response']).toBeDefined();

    // DETERMINISTIC SINGLE CHARGE: Credits balance must remain untouched at 100!
    const wallet = inMemoryWalletRegistry.get(agentId);
    expect(wallet?.creditsBalance).toBe(100);
  });

  // --------------------------------------------------------------------------
  // E. Anonymous request: normal x402 402 flow.
  // --------------------------------------------------------------------------
  it('E. Anonymous unpaid request: returns normal x402 402 challenge flow', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/v1/intelligence/sb-score?ticker=NVDA');

    expect(res.status).toBe(402);
    expect(res.body.status).toBe('payment_required');
    expect(res.body.x402Version).toBe(2);
    expect(res.body.accepts[0].network).toBe(BASE_CAIP2);
    expect(res.body.accepts[0].amount).toBe('50000');
    expect(res.headers['payment-required']).toBeDefined();
    expect(res.body.sbScore).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // F. Invalid x402 payment: HTTP 402, no content, no false success.
  // --------------------------------------------------------------------------
  it('F. Invalid x402 payment: rejected with HTTP 402 and never serves paid content', async () => {
    const app = createTestApp();

    // 1. Verification rejection
    setFacilitatorVerifyHandler(async () => ({
      isValid: false,
      reason: 'Cryptographic signature mismatch on Base'
    }));

    const resVerifyFail = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('PAYMENT-SIGNATURE', JSON.stringify({ signature: '0xbad' }));

    expect(resVerifyFail.status).toBe(402);
    expect(resVerifyFail.body.status).toBe('payment_verification_failed');
    expect(resVerifyFail.body.sbScore).toBeUndefined();

    // 2. Settlement rejection
    setFacilitatorVerifyHandler(async () => ({ isValid: true }));
    setFacilitatorSettleHandler(async () => ({
      success: false,
      error: 'On-chain execution reverted: Insufficient funds'
    }));

    const resSettleFail = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('PAYMENT-SIGNATURE', JSON.stringify({ signature: '0xvalid_sig_but_broke_wallet' }));

    expect(resSettleFail.status).toBe(402);
    expect(resSettleFail.body.status).toBe('payment_settlement_failed');
    expect(resSettleFail.body.sbScore).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // G. Duplicate/replayed payment: idempotency protections intact.
  // --------------------------------------------------------------------------
  it('G. Duplicate or replayed payment: fails settlement when nonce is replayed', async () => {
    const app = createTestApp();

    setFacilitatorVerifyHandler(async () => ({ isValid: true }));
    // Facilitator rejects already-consumed nonce
    setFacilitatorSettleHandler(async () => ({
      success: false,
      error: 'Nonce already used on Base network'
    }));

    const resReplay = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('PAYMENT-SIGNATURE', JSON.stringify({ nonce: '0xreplayed_nonce' }));

    expect(resReplay.status).toBe(402);
    expect(resReplay.body.status).toBe('payment_settlement_failed');
    expect(resReplay.body.reason).toContain('Nonce already used');
    expect(resReplay.body.sbScore).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // H. Human browser free paths: behavior unchanged.
  // --------------------------------------------------------------------------
  it('H. Human browser free paths: serves data freely for same-origin browser visits', async () => {
    const app = createTestApp();

    // Same-origin browser fetch without any agent key or payment signature
    const res = await request(app)
      .get('/api/v1/intelligence/sb-score?ticker=NVDA')
      .set('sec-fetch-site', 'same-origin');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.sbScore).toBe(88);
  });
});
