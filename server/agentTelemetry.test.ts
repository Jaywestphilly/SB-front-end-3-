import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  recordAgentVisit,
  getAgentTelemetry24h,
  agentTelemetryRouter,
  trackAgentVisitMiddleware,
  clearTelemetryState,
  recordMachineCommerceEvent,
  getTransactionFunnelMetrics,
  getMachineRevenueMetrics,
  getRecentCommerceEvents
} from './agentTelemetry.js';

describe('Zero-Knowledge 24-Hour Agent Telemetry Counter (Honest Metrics)', () => {
  beforeEach(() => {
    clearTelemetryState();
  });

  it('1. Returns valid public aggregate payload with true tracked count and privacy guarantee', () => {
    const telemetry = getAgentTelemetry24h();
    expect(telemetry).toHaveProperty('activeAgents24h');
    expect(telemetry).toHaveProperty('totalAgentPings24h');
    expect(telemetry.windowHours).toBe(24);
    expect(telemetry.privacyGuaranteed).toBe(true);
    expect(telemetry.privacyNotice).toContain('Zero-knowledge');
    expect(typeof telemetry.activeAgents24h).toBe('number');
    // Pure real metric: starts at exactly 0 when clean
    expect(telemetry.activeAgents24h).toBe(0);
    expect(telemetry.totalAgentPings24h).toBe(0);
  });

  it('2. Exactly tracks true active agent set size with zero manufactured baselines', () => {
    expect(getAgentTelemetry24h().activeAgents24h).toBe(0);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(0);

    // Track 1st real agent
    recordAgentVisit('agent_alpha_quant_01');
    expect(getAgentTelemetry24h().activeAgents24h).toBe(1);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(1);

    // Track 2nd real agent
    recordAgentVisit('agent_beta_quant_02');
    expect(getAgentTelemetry24h().activeAgents24h).toBe(2);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(2);

    // Track 3rd real agent
    recordAgentVisit('agent_gamma_quant_03');
    expect(getAgentTelemetry24h().activeAgents24h).toBe(3);
    expect(getAgentTelemetry24h().totalAgentPings24h).toBe(3);
  });

  it('3. Zero-Knowledge: Anonymizes identifiers and does not expose raw keys or agent IDs', () => {
    const rawSecretAgentId = 'agent_top_secret_quant_fund_987';
    recordAgentVisit(rawSecretAgentId, 'api_access');

    const telemetry = getAgentTelemetry24h();
    const serialized = JSON.stringify(telemetry);

    // Strict verification: No trace of the raw secret agent ID in telemetry output
    expect(serialized).not.toContain(rawSecretAgentId);
    expect(serialized).not.toContain('top_secret');
    expect(serialized).not.toContain('quant_fund');
    expect(telemetry.activeAgents24h).toBe(1);
  });

  it('4. Repeated visits by same agent increment ping count while preserving unique count', () => {
    const agentId = 'agent_repeating_oracle_555';

    recordAgentVisit(agentId);
    const afterFirst = getAgentTelemetry24h();
    expect(afterFirst.activeAgents24h).toBe(1);
    expect(afterFirst.totalAgentPings24h).toBe(1);

    recordAgentVisit(agentId);
    recordAgentVisit(agentId);
    const afterRepeats = getAgentTelemetry24h();

    // Total pings increase to 3, unique agent count remains exactly 1
    expect(afterRepeats.totalAgentPings24h).toBe(3);
    expect(afterRepeats.activeAgents24h).toBe(1);
  });

  it('5. Public Express API route serves 24h count without authentication', async () => {
    recordAgentVisit('agent_live_query_001');

    const app = express();
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    const res = await request(app)
      .get('/api/v1/telemetry/agents-24h')
      .expect(200);

    expect(res.body).toHaveProperty('activeAgents24h');
    expect(res.body).toHaveProperty('totalAgentPings24h');
    expect(res.body.activeAgents24h).toBe(1);
    expect(res.body.windowHours).toBe(24);
    expect(res.body.privacyGuaranteed).toBe(true);
    expect(res.headers['cache-control']).toBeDefined();
  });

  it('6. Middleware automatically detects agent authorization headers and tracks true pings', async () => {
    const app = express();
    app.use(trackAgentVisitMiddleware);
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    expect(getAgentTelemetry24h().activeAgents24h).toBe(0);

    // Call with simulated agent key
    await request(app)
      .get('/api/v1/telemetry/agents-24h')
      .set('Authorization', 'Bearer sb_live_mock_agent_key_xyz123')
      .expect(200);

    const after = getAgentTelemetry24h();
    expect(after.activeAgents24h).toBe(1);
    expect(after.totalAgentPings24h).toBe(1);
  });
});

describe('Transaction Funnel Telemetry & Conversion Engine (Blocker 3)', () => {
  beforeEach(() => {
    clearTelemetryState();
  });

  it('1. Tracks complete funnel stages: 402 challenge -> attempt -> verification -> settlement -> data delivered', () => {
    // Stage 1: 402 Challenge served
    recordMachineCommerceEvent({
      eventType: 'payment_required',
      source: 'rest',
      endpoint: 'sec_job',
      amountUsd: 0.25,
      timestamp: new Date().toISOString(),
      details: { priceDisplay: '$0.25' }
    });

    let funnel = getTransactionFunnelMetrics();
    expect(funnel.challengesServed).toBe(1);
    expect(funnel.paymentAttempts).toBe(0);
    expect(funnel.settlementsSucceeded).toBe(0);

    // Stage 2: Payment Attempt detected
    const testPaymentId = 'pay_hash_nvda_001';
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0x1111222233334444555566667777888899990001',
      amountUsd: 0.25,
      paymentId: testPaymentId,
      timestamp: new Date().toISOString()
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.challengesServed).toBe(1);
    expect(funnel.paymentAttempts).toBe(1);
    expect(funnel.conversionRates.challengeToAttempt).toBe(1.0);

    // Stage 3: Payment Verified
    recordMachineCommerceEvent({
      eventType: 'payment_verified',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0x1111222233334444555566667777888899990001',
      amountUsd: 0.25,
      paymentId: testPaymentId,
      timestamp: new Date().toISOString()
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.paymentsVerified).toBe(1);

    // Stage 4: Successful Settlement
    const testTxHash = '0xsettled_tx_hash_abc_123';
    recordMachineCommerceEvent({
      eventType: 'payment_success',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0x1111222233334444555566667777888899990001',
      amountUsd: 0.25,
      txHash: testTxHash,
      paymentId: testPaymentId,
      timestamp: new Date().toISOString()
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.settlementsSucceeded).toBe(1);
    expect(funnel.conversionRates.attemptToSettlement).toBe(1.0);
    expect(funnel.firstPaidAgents).toBe(1);

    // Stage 5: Paid Request / Data Delivered
    recordMachineCommerceEvent({
      eventType: 'data_delivered',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0x1111222233334444555566667777888899990001',
      amountUsd: 0.25,
      txHash: testTxHash,
      paymentId: testPaymentId,
      timestamp: new Date().toISOString()
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.dataDelivered).toBe(1);
    expect(funnel.conversionRates.settlementToDelivery).toBe(1.0);
  });

  it('2. Distinguishes payment verification failures from settlement failures', () => {
    // 402 challenge
    recordMachineCommerceEvent({
      eventType: 'payment_required',
      source: 'rest',
      endpoint: 'sec_job',
      amountUsd: 0.25
    });

    // Verification failure (invalid signature)
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xfake_agent_wallet',
      paymentId: 'fake_attempt_1',
      amountUsd: 0.25
    });
    recordMachineCommerceEvent({
      eventType: 'verification_failed',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xfake_agent_wallet',
      paymentId: 'fake_attempt_1',
      amountUsd: 0.25,
      details: { reason: 'Invalid EIP-3009 signature' }
    });

    let funnel = getTransactionFunnelMetrics();
    expect(funnel.challengesServed).toBe(1);
    expect(funnel.paymentAttempts).toBe(1);
    expect(funnel.verificationFailures).toBe(1);
    expect(funnel.settlementFailures).toBe(0);
    expect(funnel.settlementsSucceeded).toBe(0);

    // Another attempt passes verification but fails settlement
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xbroke_agent_wallet',
      paymentId: 'attempt_broke_2',
      amountUsd: 0.25
    });
    recordMachineCommerceEvent({
      eventType: 'payment_verified',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xbroke_agent_wallet',
      paymentId: 'attempt_broke_2',
      amountUsd: 0.25
    });
    recordMachineCommerceEvent({
      eventType: 'settlement_failed',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xbroke_agent_wallet',
      paymentId: 'attempt_broke_2',
      amountUsd: 0.25,
      details: { reason: 'Insufficient USDC balance on Base' }
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.paymentAttempts).toBe(2);
    expect(funnel.paymentsVerified).toBe(1);
    expect(funnel.verificationFailures).toBe(1);
    expect(funnel.settlementFailures).toBe(1);
    expect(funnel.settlementsSucceeded).toBe(0);
    expect(funnel.conversionRates.attemptToSettlement).toBe(0);
  });

  it('3. Idempotency: Replayed payment attempts or replayed settlements do not artificially inflate funnel counts', () => {
    const paymentId = 'pay_idempotent_test_999';
    const txHash = '0xidempotent_tx_999';

    // 1st attempt
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xidempotent_agent',
      paymentId,
      amountUsd: 0.25
    });
    expect(getTransactionFunnelMetrics().paymentAttempts).toBe(1);

    // Replayed attempt with same paymentId
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xidempotent_agent',
      paymentId,
      amountUsd: 0.25
    });
    // Count remains 1!
    expect(getTransactionFunnelMetrics().paymentAttempts).toBe(1);

    // Settle 1st time
    recordMachineCommerceEvent({
      eventType: 'payment_success',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xidempotent_agent',
      paymentId,
      txHash,
      amountUsd: 0.25
    });
    expect(getTransactionFunnelMetrics().settlementsSucceeded).toBe(1);

    // Replay settle
    recordMachineCommerceEvent({
      eventType: 'payment_success',
      source: 'rest',
      endpoint: 'sec_job',
      payer: '0xidempotent_agent',
      paymentId,
      txHash,
      amountUsd: 0.25
    });
    // Count and revenue remain strictly 1!
    expect(getTransactionFunnelMetrics().settlementsSucceeded).toBe(1);
    expect(getMachineRevenueMetrics().totalUsdcRevenue).toBe(0.25);
  });

  it('4. Tracks first-to-repeat paid agent conversion correctly', () => {
    const payer1 = '0xagent_one_1111';
    const payer2 = '0xagent_two_2222';

    // Payer 1 first payment
    recordMachineCommerceEvent({
      eventType: 'payment_success',
      payer: payer1,
      endpoint: 'sec_job',
      amountUsd: 0.25,
      txHash: '0xtx_1'
    });

    let funnel = getTransactionFunnelMetrics();
    expect(funnel.firstPaidAgents).toBe(1);
    expect(funnel.repeatPaidAgents).toBe(0);
    expect(funnel.conversionRates.firstToRepeatPaid).toBe(0);

    // Payer 2 first payment
    recordMachineCommerceEvent({
      eventType: 'payment_success',
      payer: payer2,
      endpoint: 'sec_job',
      amountUsd: 0.25,
      txHash: '0xtx_2'
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.firstPaidAgents).toBe(2);
    expect(funnel.repeatPaidAgents).toBe(0);

    // Payer 1 makes second payment (repeat paid agent!)
    recordMachineCommerceEvent({
      eventType: 'payment_success',
      payer: payer1,
      endpoint: 'sb_score',
      amountUsd: 0.05,
      txHash: '0xtx_3'
    });

    funnel = getTransactionFunnelMetrics();
    expect(funnel.firstPaidAgents).toBe(2);
    expect(funnel.repeatPaidAgents).toBe(1);
    // 1 repeat out of 2 first-paid agents = 50%
    expect(funnel.conversionRates.firstToRepeatPaid).toBe(0.5);
  });

  it('5. Public API route GET /api/v1/telemetry/funnel serves full transaction funnel metrics', async () => {
    recordMachineCommerceEvent({
      eventType: 'payment_required',
      endpoint: 'sec_job',
      amountUsd: 0.25
    });
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      endpoint: 'sec_job',
      paymentId: 'api_test_attempt',
      amountUsd: 0.25
    });

    const app = express();
    app.use('/api/v1/telemetry', agentTelemetryRouter);

    const res = await request(app)
      .get('/api/v1/telemetry/funnel')
      .expect(200);

    expect(res.body).toHaveProperty('challengesServed', 1);
    expect(res.body).toHaveProperty('paymentAttempts', 1);
    expect(res.body).toHaveProperty('conversionRates');
    expect(res.body.conversionRates.challengeToAttempt).toBe(1.0);
  });

  it('6. Privacy & Safety: Events contain safe identifiers and do not expose private keys or secrets', () => {
    recordMachineCommerceEvent({
      eventType: 'payment_attempt',
      endpoint: 'sec_job',
      payer: '0x9999888877776666555544443333222211110000',
      paymentId: 'hash_safe_payload_123',
      txHash: '0xsafe_tx_hash_456',
      amountUsd: 0.25
    });

    const events = getRecentCommerceEvents(10);
    expect(events.length).toBeGreaterThan(0);
    const lastEvent = events[events.length - 1];

    expect(lastEvent.payer).toBe('0x9999888877776666555544443333222211110000');
    expect(lastEvent.endpoint).toBe('sec_job');
    expect(lastEvent.paymentId).toBe('hash_safe_payload_123');
    expect(lastEvent.txHash).toBe('0xsafe_tx_hash_456');

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('privateKey');
    expect(serialized).not.toContain('secret');
  });
});
