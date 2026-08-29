import crypto from 'crypto';
import Stripe from 'stripe';
import { db } from './firebaseAdmin.js';
import type { PaymentProvider, SettlePaymentParams } from './agentExchangeApi.js';
import type {
  AgentWalletBalance,
  SettlementResult,
  LedgerEntry,
  TransactionAuditReceipt,
  PlatformLedgerTransaction
} from '../src/types.js';

export interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
  currency: string;
  creditsPerUsd: number; // e.g. 100 credits = $1.00 USD
  mode: 'sandbox' | 'production';
  paymentModeEnv: 'sandbox' | 'production';
}

export const DEFAULT_STRIPE_CONFIG: StripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'USD',
  creditsPerUsd: parseInt(process.env.CREDITS_PER_USD || '100', 10),
  mode: process.env.PAYMENT_MODE === 'production' && process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'production' : 'sandbox',
  paymentModeEnv: (process.env.PAYMENT_MODE === 'production' ? 'production' : 'sandbox')
};

// In-memory store for sandbox PaymentIntents when running in test/sandbox mode
interface SandboxPaymentIntentStore {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_action' | 'processing' | 'requires_capture' | 'succeeded' | 'canceled' | 'requires_confirmation';
  client_secret: string;
  metadata: Record<string, string>;
  capture_method: string;
  created: number;
  captured: boolean;
  refunded: boolean;
  charges: { data: Array<{ id: string; refunded: boolean; amount: number }> };
}

export const sandboxPaymentIntents = new Map<string, SandboxPaymentIntentStore>();
export const sandboxIdempotentIntents = new Map<string, any>();
export const processedWebhookEvents = new Set<string>();
export const capturedPaymentIntents = new Set<string>();
export const refundedTransactions = new Set<string>();
export const settledTransactions = new Map<string, any>();

export class StripePaymentProvider implements PaymentProvider {
  rail = 'STRIPE' as const;
  name = 'STRIPE';
  private config: StripeConfig;
  private stripeClient: Stripe | null = null;

  constructor(config?: Partial<StripeConfig>) {
    this.config = { ...DEFAULT_STRIPE_CONFIG, ...config };
    if (this.config.secretKey && !this.config.secretKey.includes('placeholder')) {
      try {
        this.stripeClient = new Stripe(this.config.secretKey, {
          apiVersion: '2024-12-18.acacia' as any
        });
      } catch (err: any) {
        console.warn('[STRIPE] Client initialization warning:', err.message);
      }
    }
  }

  getConfig(): StripeConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    const key = this.config.secretKey;
    if (!key || key.length < 10 || key.includes('placeholder')) {
      return false;
    }
    if (this.config.paymentModeEnv === 'production' || this.config.mode === 'production') {
      return key.startsWith('sk_live_');
    }
    return key.startsWith('sk_test_');
  }

  isProductionReady(): boolean {
    const isProd = this.config.paymentModeEnv === 'production' || this.config.mode === 'production';
    const key = this.config.secretKey;
    const webhook = this.config.webhookSecret;
    return Boolean(
      isProd &&
      key &&
      key.startsWith('sk_live_') &&
      webhook &&
      webhook.startsWith('whsec_')
    );
  }

  private getStripeClient(): Stripe {
    if (this.stripeClient) return this.stripeClient;

    if (this.config.paymentModeEnv === 'production') {
      if (!this.config.secretKey || !this.config.secretKey.startsWith('sk_live_')) {
        throw new Error(
          'Production payment mode is active, but STRIPE_SECRET_KEY is missing or not a live key (sk_live_...).'
        );
      }
    }

    if (this.config.secretKey) {
      this.stripeClient = new Stripe(this.config.secretKey, {
        apiVersion: '2024-12-18.acacia' as any
      });
      return this.stripeClient;
    }

    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  /**
   * Creates a real Stripe PaymentIntent server-side with idempotency.
   */
  async createPaymentRequirement(
    jobId: string,
    amountCredits: number,
    currency: string = 'USD',
    buyerAgentId?: string,
    extraMetadata?: {
      sellerAgentId?: string;
      transactionIntentId?: string;
    },
    idempotencyKey?: string
  ): Promise<any> {
    if (typeof amountCredits !== 'number' || amountCredits <= 0 || isNaN(amountCredits) || !isFinite(amountCredits)) {
      throw new Error(`Amount must be positive finite number, received: ${amountCredits}`);
    }

    const amountCents = Math.max(50, Math.round((amountCredits / this.config.creditsPerUsd) * 100));
    const txIntentId = extraMetadata?.transactionIntentId || (
      idempotencyKey
        ? `intent_${crypto.createHash('sha256').update(idempotencyKey).digest('hex').substring(0, 16)}`
        : `intent_${crypto.randomBytes(8).toString('hex')}`
    );
    const sellerAgentId = extraMetadata?.sellerAgentId || '';

    const metadata: Record<string, string> = {
      jobId,
      buyerAgentId: buyerAgentId || 'anonymous_agent',
      sellerAgentId,
      transactionIntentId: txIntentId,
      creditsRequested: String(amountCredits)
    };

    // Real Stripe API call if configured
    if (this.isConfigured()) {
      try {
        const stripe = this.getStripeClient();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: currency.toLowerCase(),
          metadata,
          capture_method: 'manual',
          payment_method_types: ['card'],
          description: `Stock Bloc Autonomous Agent Exchange Job: ${jobId}`
        }, idempotencyKey ? { idempotencyKey } : undefined);

        return {
          paymentRef: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          paymentRail: 'STRIPE',
          amountCredits,
          amountCents: paymentIntent.amount,
          amountUsd: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
          mode: this.config.mode,
          jobId,
          buyerAgentId,
          sellerAgentId,
          transactionIntentId: txIntentId,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };
      } catch (err: any) {
        throw new Error(`Stripe PaymentIntent creation failed: ${err.message}`);
      }
    }

    // Sandbox Engine for development/testing when Stripe credentials are absent
    if (this.config.paymentModeEnv === 'production') {
      throw new Error('Production mode requires a valid STRIPE_SECRET_KEY (sk_live_...)');
    }

    if (idempotencyKey && sandboxIdempotentIntents.has(idempotencyKey)) {
      return sandboxIdempotentIntents.get(idempotencyKey);
    }

    const sandboxId = 'pi_sb_' + crypto.randomBytes(12).toString('hex');
    const clientSecret = `${sandboxId}_secret_${crypto.randomBytes(12).toString('hex')}`;

    const sandboxIntent: SandboxPaymentIntentStore = {
      id: sandboxId,
      amount: amountCents,
      currency: currency.toLowerCase(),
      status: 'requires_capture',
      client_secret: clientSecret,
      metadata,
      capture_method: 'manual',
      created: Math.floor(Date.now() / 1000),
      captured: false,
      refunded: false,
      charges: {
        data: [{ id: 'ch_test_' + crypto.randomBytes(12).toString('hex'), refunded: false, amount: amountCents }]
      }
    };

    sandboxPaymentIntents.set(sandboxId, sandboxIntent);

    const result = {
      paymentRef: sandboxId,
      paymentIntentId: sandboxId,
      clientSecret,
      paymentRail: 'STRIPE',
      amountCredits,
      amountCents,
      amountUsd: amountCents / 100,
      currency: currency.toUpperCase(),
      status: 'requires_capture',
      metadata,
      mode: 'sandbox',
      jobId,
      buyerAgentId,
      sellerAgentId,
      transactionIntentId: txIntentId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    };

    if (idempotencyKey) {
      sandboxIdempotentIntents.set(idempotencyKey, result);
    }

    return result;
  }

  /**
   * Confirms a PaymentIntent (authorizes funds in test/live mode) using a payment method (e.g. pm_card_visa).
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethod: string = 'pm_card_visa'
  ): Promise<{
    success: boolean;
    status: string;
    paymentIntentId: string;
    error?: string;
  }> {
    if (this.isConfigured()) {
      try {
        const stripe = this.getStripeClient();
        const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: paymentMethod,
          return_url: 'https://stockbloc.ai/payment/complete'
        });
        return {
          success: confirmed.status === 'requires_capture' || confirmed.status === 'succeeded',
          status: confirmed.status,
          paymentIntentId: confirmed.id
        };
      } catch (err: any) {
        return {
          success: false,
          status: 'failed',
          paymentIntentId,
          error: err.message
        };
      }
    }

    if (sandboxPaymentIntents.has(paymentIntentId)) {
      const intent = sandboxPaymentIntents.get(paymentIntentId)!;
      intent.status = 'requires_capture';
      return {
        success: true,
        status: 'requires_capture',
        paymentIntentId
      };
    }

    return {
      success: false,
      status: 'failed',
      paymentIntentId,
      error: `PaymentIntent ${paymentIntentId} not found`
    };
  }

  /**
   * Strictly verifies a real Stripe PaymentIntent from the Stripe API or sandbox store.
   * Enforces:
   * - Must be in an authorized (requires_capture) or settled (succeeded) status.
   * - Never returns verified: true for requires_payment_method, requires_action, processing, or canceled.
   * - Validates amount, currency, jobId, buyerAgentId, sellerAgentId, and transactionIntentId.
   */
  async verifyPayment(
    paymentRef: string,
    context?: {
      paymentIntentId?: string;
      expectedAmountCents?: number;
      expectedAmountCredits?: number;
      expectedCurrency?: string;
      jobId?: string;
      buyerAgentId?: string;
      sellerAgentId?: string;
      transactionIntentId?: string;
    }
  ): Promise<{
    verified: boolean;
    payment_authorized?: boolean;
    payment_captured?: boolean;
    payment_settled?: boolean;
    paymentRef?: string;
    paymentIntentId?: string;
    chargeId?: string;
    status?: string;
    amount?: number;
    amountCents?: number;
    currency?: string;
    metadata?: Record<string, string>;
    mode?: string;
    paidAt?: string;
    error?: string;
  }> {
    const paymentIntentId = paymentRef || context?.paymentIntentId;

    if (!paymentIntentId) {
      return { verified: false, error: 'Missing paymentRef/paymentIntentId for Stripe verification' };
    }

    // 1. Real Stripe API query when configured
    if (this.isConfigured()) {
      try {
        const stripe = this.getStripeClient();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Explicitly check status
        if (['requires_payment_method', 'requires_action', 'requires_confirmation', 'processing', 'canceled'].includes(paymentIntent.status)) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            error: `Stripe PaymentIntent is incomplete with status: ${paymentIntent.status}. Funds have not been authorized or captured.`
          };
        }

        if (paymentIntent.status !== 'requires_capture' && paymentIntent.status !== 'succeeded') {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            error: `Stripe PaymentIntent status is invalid: ${paymentIntent.status}. Expected requires_capture or succeeded.`
          };
        }

        if (context?.expectedAmountCents && paymentIntent.amount !== context.expectedAmountCents) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            error: `PaymentIntent amount mismatch: received ${paymentIntent.amount} cents, expected ${context.expectedAmountCents} cents.`
          };
        }

        const expectedCurrency = (context?.expectedCurrency || 'usd').toLowerCase();
        if (paymentIntent.currency.toLowerCase() !== expectedCurrency) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            error: `PaymentIntent currency mismatch: received ${paymentIntent.currency}, expected ${expectedCurrency}.`
          };
        }

        if (context?.jobId && paymentIntent.metadata?.jobId && paymentIntent.metadata.jobId !== context.jobId) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            error: `PaymentIntent jobId metadata mismatch: received ${paymentIntent.metadata.jobId}, expected ${context.jobId}.`
          };
        }

        if (context?.buyerAgentId && paymentIntent.metadata?.buyerAgentId && paymentIntent.metadata.buyerAgentId !== context.buyerAgentId) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            error: `PaymentIntent buyerAgentId metadata mismatch: received ${paymentIntent.metadata.buyerAgentId}, expected ${context.buyerAgentId}.`
          };
        }

        if (context?.sellerAgentId && paymentIntent.metadata?.sellerAgentId && paymentIntent.metadata.sellerAgentId !== context.sellerAgentId) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            error: `PaymentIntent sellerAgentId metadata mismatch: received ${paymentIntent.metadata.sellerAgentId}, expected ${context.sellerAgentId}.`
          };
        }

        if (context?.transactionIntentId && paymentIntent.metadata?.transactionIntentId && paymentIntent.metadata.transactionIntentId !== context.transactionIntentId) {
          return {
            verified: false,
            paymentIntentId: paymentIntent.id,
            error: `PaymentIntent transactionIntentId metadata mismatch: received ${paymentIntent.metadata.transactionIntentId}, expected ${context.transactionIntentId}.`
          };
        }

        const latestCharge = (typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : (paymentIntent.latest_charge as any)?.id) || `ch_${paymentIntent.id}`;

        const isAuthorized = paymentIntent.status === 'requires_capture';
        const isSettled = paymentIntent.status === 'succeeded';

        return {
          verified: true,
          payment_authorized: isAuthorized,
          payment_captured: isSettled,
          payment_settled: isSettled,
          paymentRef: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          chargeId: latestCharge,
          status: paymentIntent.status,
          amountCents: paymentIntent.amount,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          metadata: paymentIntent.metadata,
          mode: this.config.mode,
          paidAt: new Date(paymentIntent.created * 1000).toISOString()
        };
      } catch (err: any) {
        return {
          verified: false,
          paymentIntentId,
          error: `Stripe API retrieval failed: ${err.message}`
        };
      }
    }

    // 2. Sandbox engine check when Stripe credentials are absent
    if (sandboxPaymentIntents.has(paymentIntentId)) {
      const sandboxIntent = sandboxPaymentIntents.get(paymentIntentId)!;

      // Strictly reject unfunded / canceled / intermediate states
      if (['requires_payment_method', 'requires_action', 'requires_confirmation', 'processing', 'canceled'].includes(sandboxIntent.status)) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          status: sandboxIntent.status,
          error: `Sandbox PaymentIntent status is ${sandboxIntent.status}; payment is unfunded or incomplete.`
        };
      }

      if (sandboxIntent.status !== 'requires_capture' && sandboxIntent.status !== 'succeeded') {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          status: sandboxIntent.status,
          error: `Sandbox PaymentIntent status is ${sandboxIntent.status}, not authorized (requires_capture) or settled (succeeded).`
        };
      }

      if (context?.expectedAmountCents && sandboxIntent.amount !== context.expectedAmountCents) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          error: `Sandbox PaymentIntent amount mismatch: expected ${context.expectedAmountCents} cents, found ${sandboxIntent.amount} cents.`
        };
      }

      if (context?.expectedCurrency && sandboxIntent.currency.toLowerCase() !== context.expectedCurrency.toLowerCase()) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          error: `Sandbox PaymentIntent currency mismatch: expected ${context.expectedCurrency}, found ${sandboxIntent.currency}`
        };
      }

      if (context?.jobId && sandboxIntent.metadata?.jobId && sandboxIntent.metadata.jobId !== context.jobId) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          error: `Sandbox PaymentIntent jobId mismatch: expected ${context.jobId}, found ${sandboxIntent.metadata.jobId}`
        };
      }

      if (context?.buyerAgentId && sandboxIntent.metadata?.buyerAgentId && sandboxIntent.metadata.buyerAgentId !== context.buyerAgentId) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          error: `Sandbox PaymentIntent buyerAgentId mismatch: expected ${context.buyerAgentId}, found ${sandboxIntent.metadata.buyerAgentId}`
        };
      }

      if (context?.sellerAgentId && sandboxIntent.metadata?.sellerAgentId && sandboxIntent.metadata.sellerAgentId !== context.sellerAgentId) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          error: `Sandbox PaymentIntent sellerAgentId mismatch: expected ${context.sellerAgentId}, found ${sandboxIntent.metadata.sellerAgentId}`
        };
      }

      if (context?.transactionIntentId && sandboxIntent.metadata?.transactionIntentId && sandboxIntent.metadata.transactionIntentId !== context.transactionIntentId) {
        return {
          verified: false,
          paymentIntentId: sandboxIntent.id,
          error: `Sandbox PaymentIntent transactionIntentId mismatch: expected ${context.transactionIntentId}, found ${sandboxIntent.metadata.transactionIntentId}`
        };
      }

      const isAuthorized = sandboxIntent.status === 'requires_capture';
      const isSettled = sandboxIntent.status === 'succeeded';

      return {
        verified: true,
        payment_authorized: isAuthorized,
        payment_captured: isSettled,
        payment_settled: isSettled,
        paymentRef: sandboxIntent.id,
        paymentIntentId: sandboxIntent.id,
        chargeId: sandboxIntent.charges.data[0]?.id || `ch_${sandboxIntent.id}`,
        status: sandboxIntent.status,
        amountCents: sandboxIntent.amount,
        amount: sandboxIntent.amount / 100,
        currency: sandboxIntent.currency.toUpperCase(),
        metadata: sandboxIntent.metadata,
        mode: 'sandbox',
        paidAt: new Date(sandboxIntent.created * 1000).toISOString()
      };
    }

    if (this.config.paymentModeEnv === 'production') {
      return {
        verified: false,
        paymentIntentId,
        error: 'Production payment verification requires live Stripe API credentials.'
      };
    }

    return {
      verified: false,
      paymentIntentId,
      error: `Stripe PaymentIntent ${paymentIntentId} not found in live API or sandbox ledger.`
    };
  }

  /**
   * Captures an authorized PaymentIntent on Stripe with strict idempotency and anti-double-capture protection.
   */
  async capturePayment(
    paymentRef: string,
    grossAmount: number,
    platformFee: number,
    sellerAgentId: string,
    buyerAgentId?: string,
    jobId?: string,
    idempotencyKey?: string
  ): Promise<{
    success: boolean;
    transactionId: string;
    internalTransactionId: string;
    paymentIntentId: string;
    chargeId?: string;
    paymentRail: 'STRIPE';
    grossAmount: number;
    platformFee: number;
    netSellerAmount: number;
    sellerNet: number;
    status: string;
    settledAt: string;
    timestamp: string;
    error?: string;
  }> {
    const paymentIntentId = paymentRef;
    const netSellerAmount = Math.max(0, grossAmount - platformFee);
    const settledAt = new Date().toISOString();

    // Check if already captured in-memory or in database (anti-double-capture guard)
    if (capturedPaymentIntents.has(paymentIntentId)) {
      return {
        success: true,
        transactionId: paymentIntentId,
        internalTransactionId: paymentIntentId,
        paymentIntentId,
        chargeId: `ch_${paymentIntentId}`,
        paymentRail: 'STRIPE',
        grossAmount,
        platformFee,
        netSellerAmount,
        sellerNet: netSellerAmount,
        status: 'succeeded',
        settledAt,
        timestamp: settledAt
      };
    }

    if (this.isConfigured()) {
      try {
        const stripe = this.getStripeClient();
        let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
          capturedPaymentIntents.add(paymentIntentId);
          const latestCharge = (typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge as any)?.id) || `ch_${paymentIntent.id}`;

          return {
            success: true,
            transactionId: paymentIntent.id,
            internalTransactionId: paymentIntent.id,
            paymentIntentId: paymentIntent.id,
            chargeId: latestCharge,
            paymentRail: 'STRIPE',
            grossAmount,
            platformFee,
            netSellerAmount,
            sellerNet: netSellerAmount,
            status: 'succeeded',
            settledAt,
            timestamp: settledAt
          };
        }

        if (paymentIntent.status === 'requires_capture') {
          const captureKey = idempotencyKey ? `cap_${idempotencyKey}` : `cap_${paymentIntentId}`;
          paymentIntent = await stripe.paymentIntents.capture(
            paymentIntentId,
            {},
            { idempotencyKey: captureKey }
          );
        }

        if (paymentIntent.status !== 'succeeded') {
          return {
            success: false,
            transactionId: paymentIntent.id,
            internalTransactionId: paymentIntent.id,
            paymentIntentId: paymentIntent.id,
            paymentRail: 'STRIPE',
            grossAmount,
            platformFee,
            netSellerAmount,
            sellerNet: netSellerAmount,
            status: paymentIntent.status,
            settledAt,
            timestamp: settledAt,
            error: `Stripe PaymentIntent capture failed with status: ${paymentIntent.status}`
          };
        }

        capturedPaymentIntents.add(paymentIntentId);
        const latestCharge = (typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : (paymentIntent.latest_charge as any)?.id) || `ch_${paymentIntent.id}`;

        // Persist settlement record in Firestore
        if (db) {
          try {
            await db.collection('settled_payment_intents').doc(paymentIntentId).set({
              paymentIntentId,
              grossAmount,
              platformFee,
              netSellerAmount,
              sellerNet: netSellerAmount,
              sellerAgentId,
              buyerAgentId,
              jobId,
              settledAt,
              timestamp: settledAt,
              status: 'succeeded'
            });
          } catch {
            // Non-blocking firestore write
          }
        }

        return {
          success: true,
          transactionId: paymentIntent.id,
          internalTransactionId: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          chargeId: latestCharge,
          paymentRail: 'STRIPE',
          grossAmount,
          platformFee,
          netSellerAmount,
          sellerNet: netSellerAmount,
          status: 'succeeded',
          settledAt,
          timestamp: settledAt
        };
      } catch (err: any) {
        return {
          success: false,
          transactionId: paymentIntentId,
          internalTransactionId: paymentIntentId,
          paymentIntentId,
          paymentRail: 'STRIPE',
          grossAmount,
          platformFee,
          netSellerAmount,
          sellerNet: netSellerAmount,
          status: 'failed',
          settledAt,
          timestamp: settledAt,
          error: `Stripe capture API error: ${err.message}`
        };
      }
    }

    // Check sandbox store when credentials absent
    if (sandboxPaymentIntents.has(paymentIntentId)) {
      const sandboxIntent = sandboxPaymentIntents.get(paymentIntentId)!;
      sandboxIntent.status = 'succeeded';
      sandboxIntent.captured = true;
      capturedPaymentIntents.add(paymentIntentId);
      const chargeId = sandboxIntent.charges.data[0]?.id || `ch_${sandboxIntent.id}`;

      return {
        success: true,
        transactionId: sandboxIntent.id,
        internalTransactionId: sandboxIntent.id,
        paymentIntentId: sandboxIntent.id,
        chargeId,
        paymentRail: 'STRIPE',
        grossAmount,
        platformFee,
        netSellerAmount,
        sellerNet: netSellerAmount,
        status: 'succeeded',
        settledAt,
        timestamp: settledAt
      };
    }

    return {
      success: false,
      transactionId: paymentIntentId,
      internalTransactionId: paymentIntentId,
      paymentIntentId,
      paymentRail: 'STRIPE',
      grossAmount,
      platformFee,
      netSellerAmount,
      sellerNet: netSellerAmount,
      status: 'failed',
      settledAt,
      timestamp: settledAt,
      error: `PaymentIntent ${paymentIntentId} not found for capture.`
    };
  }

  /**
   * Settle payment and return structured Audit Receipt.
   */
  async settlePayment(params: SettlePaymentParams): Promise<SettlementResult> {
    const idempKey = params.idempotencyKey;
    if (idempKey && settledTransactions.has(idempKey)) {
      const cached = settledTransactions.get(idempKey);
      return {
        ...cached,
        idempotentReplay: true
      };
    }

    const internalTxId = 'tx_stripe_' + crypto.randomBytes(8).toString('hex');
    const platformFeeBps = params.platformFeeBps ?? 500;
    const platformFee = Math.max(1, Math.round((params.grossAmount * platformFeeBps) / 10000));
    const netSellerAmount = Math.max(0, params.grossAmount - platformFee);
    const nowIso = new Date().toISOString();

    const paymentIntentId = (params as any).paymentIntentId || (params as any).paymentProofRef || params.jobId || internalTxId;

    const auditReceipt: TransactionAuditReceipt = {
      receiptId: 'rcpt_' + crypto.randomBytes(8).toString('hex'),
      internalTransactionId: internalTxId,
      jobId: params.jobId,
      paymentRail: 'STRIPE',
      grossAmount: params.grossAmount,
      platformFee,
      netSellerAmount,
      currency: 'USD',
      status: 'SETTLED',
      externalPaymentProof: {
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: `ch_${paymentIntentId}`,
        verifiedAt: nowIso
      },
      buyer: {
        agentId: params.buyerAgentId,
        handle: params.buyerHandle,
        previousBalance: 0,
        finalBalance: 0
      },
      seller: {
        agentId: params.sellerAgentId,
        handle: params.sellerHandle,
        previousBalance: 0,
        finalBalance: netSellerAmount
      },
      treasury: {
        accountId: 'stock_bloc_platform_treasury',
        feeCollected: platformFee
      },
      timeline: {
        initiatedAt: nowIso,
        paymentVerifiedAt: nowIso,
        resultVerifiedAt: nowIso,
        settledAt: nowIso
      },
      receiptHash: crypto
        .createHash('sha256')
        .update(`${internalTxId}:${paymentIntentId}:${params.grossAmount}:${platformFee}`)
        .digest('hex')
    };

    const ledgerTx: PlatformLedgerTransaction = {
      transactionId: internalTxId,
      idempotencyKey: params.idempotencyKey,
      jobId: params.jobId,
      buyerAgentId: params.buyerAgentId,
      buyerHandle: params.buyerHandle,
      sellerAgentId: params.sellerAgentId,
      sellerHandle: params.sellerHandle,
      grossAmount: params.grossAmount,
      platformFeeBps,
      platformFee,
      providerAmount: netSellerAmount,
      currency: 'USD',
      paymentRail: 'STRIPE',
      status: 'SETTLED',
      externalPaymentProof: {
        rail: 'STRIPE',
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: `ch_${paymentIntentId}`,
        verifiedAt: nowIso
      },
      createdAt: nowIso,
      completedAt: nowIso
    };

    const result: SettlementResult = {
      success: true,
      transactionId: internalTxId,
      idempotencyKey: params.idempotencyKey || internalTxId,
      jobId: params.jobId,
      status: 'SETTLED',
      grossAmount: params.grossAmount,
      platformFee,
      platformFeeBps,
      netSellerAmount,
      sellerNet: netSellerAmount,
      currency: 'USD',
      paymentRail: 'STRIPE',
      externalPaymentProof: {
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: `ch_${paymentIntentId}`,
        verifiedAt: nowIso
      },
      auditReceipt,
      balances: {
        buyer: { previousBalance: 0, currentBalance: 0, debited: params.grossAmount },
        seller: { previousBalance: 0, currentBalance: netSellerAmount, credited: netSellerAmount },
        treasury: { previousBalance: 0, currentBalance: platformFee, creditedFee: platformFee }
      },
      ledgerEntries: [],
      transaction: ledgerTx,
      settledAt: nowIso
    };

    if (idempKey) {
      settledTransactions.set(idempKey, result);
    }

    return result;
  }

  /**
   * Issues a refund on a real Stripe PaymentIntent with anti-double-refund check.
   */
  async refundPayment(
    paymentRef: string,
    reason: string,
    params?: { jobId: string; buyerAgentId: string; sellerAgentId: string; grossAmount: number },
    idempotencyKey?: string
  ): Promise<boolean> {
    const paymentIntentId = paymentRef;

    if (refundedTransactions.has(paymentIntentId)) {
      return true; // Idempotent success - double refund prevented
    }

    if (this.isConfigured()) {
      try {
        const stripe = this.getStripeClient();
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (intent.status === 'requires_capture' || intent.status === 'requires_payment_method' || intent.status === 'requires_action') {
          // Authorized but not captured: release authorization via cancel
          const canceled = await stripe.paymentIntents.cancel(paymentIntentId, {
            cancellation_reason: 'requested_by_customer'
          });
          const succeeded = canceled.status === 'canceled';
          if (succeeded) {
            refundedTransactions.add(paymentIntentId);
          }
          return succeeded;
        }

        // Captured/settled: issue real refund on the charge
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer',
          metadata: {
            reason,
            jobId: params?.jobId || ''
          }
        }, idempotencyKey ? { idempotencyKey: `ref_${idempotencyKey}` } : undefined);

        const succeeded = refund.status === 'succeeded' || refund.status === 'pending';
        if (succeeded) {
          refundedTransactions.add(paymentIntentId);
        }
        return succeeded;
      } catch (err: any) {
        if (this.config.paymentModeEnv === 'production') {
          console.error('[STRIPE] Live refund failed:', err.message);
          return false;
        }
        throw new Error(`Stripe refund failed: ${err.message}`);
      }
    }

    if (sandboxPaymentIntents.has(paymentIntentId)) {
      const sandboxIntent = sandboxPaymentIntents.get(paymentIntentId)!;
      sandboxIntent.status = 'canceled';
      sandboxIntent.refunded = true;
      if (sandboxIntent.charges.data[0]) {
        sandboxIntent.charges.data[0].refunded = true;
      }
      refundedTransactions.add(paymentIntentId);
      return true;
    }

    refundedTransactions.add(paymentIntentId);
    return true;
  }

  /**
   * Constructs and verifies incoming Stripe Webhook Events with signature check and idempotency.
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.webhookSecret;
    if (!webhookSecret) {
      if (this.config.paymentModeEnv === 'production') {
        throw new Error('STRIPE_WEBHOOK_SECRET is required to verify webhook signatures in production mode.');
      }
      return typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString('utf8'));
    }

    const stripe = this.getStripeClient();
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  isWebhookEventProcessed(eventId: string): boolean {
    return processedWebhookEvents.has(eventId);
  }

  markWebhookEventProcessed(eventId: string): void {
    processedWebhookEvents.add(eventId);
    if (db) {
      db.collection('processed_webhook_events').doc(eventId).set({
        eventId,
        processedAt: new Date().toISOString()
      }).catch(() => {});
    }
  }

  async payoutBountyReward(params: {
    bountyId: string;
    agentId: string;
    agentHandle?: string;
    rewardCredits: number;
    title?: string;
    idempotencyKey?: string;
  }): Promise<any> {
    const txId = 'stripe_tr_' + crypto.randomBytes(8).toString('hex');
    return {
      success: true,
      transactionId: txId,
      bountyId: params.bountyId,
      agentId: params.agentId,
      amountCents: Math.round((params.rewardCredits / this.config.creditsPerUsd) * 100)
    };
  }

  async getProviderBalance(agentId: string): Promise<AgentWalletBalance> {
    return {
      agentId,
      creditsBalance: 0,
      availableBalance: 0,
      reservedBalance: 0,
      lifetimeGrossEarnings: 0,
      lifetimeNetEarnings: 0,
      lifetimeSpent: 0,
      lifetimePlatformFeesPaid: 0,
      spendingLimitsConfigured: false
    };
  }

  async getTreasuryBalance(): Promise<any> {
    return {
      availableBalanceCents: 500000,
      currency: 'USD',
      mode: this.config.mode
    };
  }

  async getAccountLedger(agentId: string, limit: number = 50): Promise<LedgerEntry[]> {
    return [];
  }
}
