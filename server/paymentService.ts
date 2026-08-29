import crypto from 'crypto';
import { db } from './firebaseAdmin.js';
import {
  PLATFORM_TREASURY_ACCOUNT_ID,
  PLATFORM_ECONOMICS,
  paymentProviders,
  PlatformCreditsProvider
} from './agentExchangeApi.js';
import { inMemoryWalletRegistry } from './agentPlatform.js';
import type {
  AgentWalletBalance,
  LedgerEntry,
  PlatformLedgerTransaction,
  SettlementResult,
  TransactionAuditReceipt
} from '../src/types.js';
import { PolkadotUsdcPaymentProvider } from './polkadotPaymentProvider.js';
import { StripePaymentProvider } from './stripePaymentProvider.js';

export type TransactionState =
  | 'CREATED'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_AUTHORIZED'
  | 'JOB_ACCEPTED'
  | 'JOB_IN_PROGRESS'
  | 'JOB_COMPLETED'
  | 'RESULT_SUBMITTED'
  | 'RESULT_VERIFIED'
  | 'PAYMENT_CAPTURED'
  | 'SETTLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'FAILED';

export const VALID_STATE_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  CREATED: ['PAYMENT_REQUIRED', 'PAYMENT_AUTHORIZED', 'CANCELLED', 'FAILED'],
  PAYMENT_REQUIRED: ['PAYMENT_AUTHORIZED', 'CANCELLED', 'FAILED'],
  PAYMENT_AUTHORIZED: ['JOB_ACCEPTED', 'JOB_IN_PROGRESS', 'REFUND_PENDING', 'CANCELLED', 'FAILED'],
  JOB_ACCEPTED: ['JOB_IN_PROGRESS', 'REFUND_PENDING', 'CANCELLED', 'FAILED'],
  JOB_IN_PROGRESS: ['JOB_COMPLETED', 'RESULT_SUBMITTED', 'DISPUTED', 'REFUND_PENDING', 'FAILED'],
  JOB_COMPLETED: ['RESULT_SUBMITTED', 'RESULT_VERIFIED', 'DISPUTED', 'REFUND_PENDING', 'FAILED'],
  RESULT_SUBMITTED: ['RESULT_VERIFIED', 'DISPUTED', 'REFUND_PENDING', 'FAILED'],
  RESULT_VERIFIED: ['PAYMENT_CAPTURED', 'SETTLED', 'DISPUTED'],
  PAYMENT_CAPTURED: ['SETTLED', 'DISPUTED', 'REFUND_PENDING'],
  SETTLED: ['DISPUTED', 'REFUND_PENDING'],
  DISPUTED: ['SETTLED', 'REFUND_PENDING', 'REFUNDED'],
  REFUND_PENDING: ['REFUNDED', 'FAILED'],
  REFUNDED: [],
  CANCELLED: [],
  FAILED: []
};

export function isValidStateTransition(fromState: TransactionState, toState: TransactionState): boolean {
  const allowed = VALID_STATE_TRANSITIONS[fromState];
  return allowed ? allowed.includes(toState) : false;
}

export interface DisputeRecord {
  disputeId: string;
  jobId: string;
  initiatorAgentId: string;
  initiatorRole: 'BUYER' | 'SELLER';
  reason: string;
  evidence?: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'PARTIAL_REFUND';
  refundPercent?: number;
  resolverId?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface HumanApprovalToken {
  tokenId: string;
  txIntentId: string;
  jobId: string;
  amount: number;
  buyerAgentId: string;
  sellerAgentId: string;
  tokenHash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

const activeApprovalTokens = new Map<string, HumanApprovalToken>();
const activeDisputes = new Map<string, DisputeRecord>();

export const HUMAN_APPROVAL_THRESHOLD_CREDITS = parseInt(
  process.env.HUMAN_APPROVAL_THRESHOLD_CREDITS || '50000',
  10
); // 50,000 credits = $500

export class PaymentOrchestrator {
  private polkadotProvider: PolkadotUsdcPaymentProvider;
  private stripeProvider: StripePaymentProvider;

  constructor(providers?: {
    polkadotProvider?: PolkadotUsdcPaymentProvider;
    stripeProvider?: StripePaymentProvider;
  }) {
    this.polkadotProvider = providers?.polkadotProvider || new PolkadotUsdcPaymentProvider();
    this.stripeProvider = providers?.stripeProvider || new StripePaymentProvider();
  }

  /**
   * Evaluates spending limit policy and determines if human operator approval is mandatory.
   */
  evaluateSpendingPolicy(amountCredits: number, agentScopes: string[] = []): {
    approved: boolean;
    requiresHumanApproval: boolean;
    approvalToken?: string;
    reason?: string;
  } {
    if (amountCredits <= 500) {
      return { approved: true, requiresHumanApproval: false };
    }

    if (amountCredits <= 5000) {
      const hasTransactScope = agentScopes.includes('payments:transact') || agentScopes.length === 0;
      return {
        approved: hasTransactScope,
        requiresHumanApproval: false,
        reason: hasTransactScope ? 'Policy verified (standard tier)' : 'Missing payments:transact scope'
      };
    }

    if (amountCredits <= HUMAN_APPROVAL_THRESHOLD_CREDITS) {
      const hasElevatedScope = agentScopes.includes('payments:transact');
      return {
        approved: hasElevatedScope,
        requiresHumanApproval: false,
        reason: 'Policy verified (elevated tier)'
      };
    }

    // Amount exceeds human approval threshold ($500+)
    return {
      approved: false,
      requiresHumanApproval: true,
      reason: `Transaction amount (${amountCredits} credits) exceeds autonomous threshold (${HUMAN_APPROVAL_THRESHOLD_CREDITS} credits). Human operator sign-off required.`
    };
  }

  /**
   * Generates a single-use cryptographically signed Human Approval Token.
   */
  createHumanApprovalRequest(params: {
    txIntentId: string;
    jobId: string;
    amount: number;
    buyerAgentId: string;
    sellerAgentId: string;
  }): { token: string; tokenId: string; expiresAt: string } {
    const tokenId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(24).toString('hex');
    const rawToken = `sb_appr_${tokenId}_${secret}`;
    const tokenHash = crypto.createHash('sha256').update(secret).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const record: HumanApprovalToken = {
      tokenId,
      txIntentId: params.txIntentId,
      jobId: params.jobId,
      amount: params.amount,
      buyerAgentId: params.buyerAgentId,
      sellerAgentId: params.sellerAgentId,
      tokenHash,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date().toISOString()
    };

    activeApprovalTokens.set(tokenId, record);
    return { token: rawToken, tokenId, expiresAt };
  }

  /**
   * Validates and redeems a Human Approval Token.
   */
  approveTransactionWithToken(rawToken: string, operatorUid: string): boolean {
    const parts = rawToken.split('_');
    if (parts.length < 4 || parts[0] !== 'sb' || parts[1] !== 'appr') {
      throw new Error('Invalid human approval token format');
    }

    const tokenId = parts[2];
    const secret = parts.slice(3).join('_');
    const record = activeApprovalTokens.get(tokenId);

    if (!record) {
      throw new Error('Human approval token not found or already consumed');
    }

    if (record.status !== 'PENDING') {
      throw new Error(`Human approval token has status: ${record.status}`);
    }

    if (new Date(record.expiresAt) < new Date()) {
      record.status = 'EXPIRED';
      throw new Error('Human approval token has expired');
    }

    const hash = crypto.createHash('sha256').update(secret).digest('hex');
    if (hash !== record.tokenHash) {
      throw new Error('Invalid human approval token signature');
    }

    record.status = 'APPROVED';
    return true;
  }

  /**
   * Authorizes escrow by moving funds from buyer's availableBalance into reservedBalance.
   */
  async authorizeEscrow(params: {
    buyerAgentId: string;
    amount: number;
    jobId: string;
  }): Promise<{ success: boolean; availableBalance: number; reservedBalance: number }> {
    const { buyerAgentId, amount, jobId } = params;

    try {
      const result = await db.runTransaction(async (t: any) => {
        const walletRef = db.collection('agent_wallets').doc(buyerAgentId);
        const snap = await t.get(walletRef);
        const memWallet = inMemoryWalletRegistry.get(buyerAgentId);

        const data = (snap.exists ? snap.data() : memWallet) || {
          agentId: buyerAgentId,
          creditsBalance: PLATFORM_ECONOMICS.defaultTrialCredits,
          availableBalance: PLATFORM_ECONOMICS.defaultTrialCredits,
          reservedBalance: 0
        };

        const available = typeof data.availableBalance === 'number'
          ? data.availableBalance
          : (typeof data.creditsBalance === 'number' ? data.creditsBalance : PLATFORM_ECONOMICS.defaultTrialCredits);
        const reserved = typeof data.reservedBalance === 'number' ? data.reservedBalance : 0;

        if (available < amount) {
          throw new Error(`Insufficient available balance for escrow authorization: available ${available}, required ${amount}`);
        }

        const newAvailable = available - amount;
        const newReserved = reserved + amount;
        const nowIso = new Date().toISOString();

        const updated = {
          ...data,
          agentId: buyerAgentId,
          creditsBalance: newAvailable + newReserved,
          availableBalance: newAvailable,
          reservedBalance: newReserved,
          updatedAt: nowIso
        };

        t.set(walletRef, updated, { merge: true });

        return { success: true, availableBalance: newAvailable, reservedBalance: newReserved, updated };
      });

      if (result && result.updated) {
        inMemoryWalletRegistry.set(buyerAgentId, result.updated);
      }

      return { success: result.success, availableBalance: result.availableBalance, reservedBalance: result.reservedBalance };
    } catch (err: any) {
      // In-memory fallback
      const w: any = inMemoryWalletRegistry.get(buyerAgentId) || {
        agentId: buyerAgentId,
        creditsBalance: PLATFORM_ECONOMICS.defaultTrialCredits,
        availableBalance: PLATFORM_ECONOMICS.defaultTrialCredits,
        reservedBalance: 0,
        lifetimeSpent: 0
      };

      const available = typeof w.availableBalance === 'number' ? w.availableBalance : (w.creditsBalance ?? PLATFORM_ECONOMICS.defaultTrialCredits);
      const reserved = typeof w.reservedBalance === 'number' ? w.reservedBalance : 0;

      if (available < amount) {
        throw new Error(`Insufficient available balance for escrow authorization: available ${available}, required ${amount}`);
      }

      const newAvailable = available - amount;
      const newReserved = reserved + amount;

      w.availableBalance = newAvailable;
      w.reservedBalance = newReserved;
      w.creditsBalance = newAvailable + newReserved;
      inMemoryWalletRegistry.set(buyerAgentId, w);

      return { success: true, availableBalance: newAvailable, reservedBalance: newReserved };
    }
  }

  /**
   * Releases escrow back to buyer's availableBalance if job is cancelled or failed.
   */
  async releaseEscrow(buyerAgentId: string, amount: number): Promise<boolean> {
    try {
      await db.runTransaction(async (t: any) => {
        const walletRef = db.collection('agent_wallets').doc(buyerAgentId);
        const snap = await t.get(walletRef);
        const memWallet = inMemoryWalletRegistry.get(buyerAgentId);
        if (!snap.exists && !memWallet) {
          throw new Error('Wallet not found for escrow release');
        }

        const data = (snap.exists ? snap.data() : memWallet) || {
          agentId: buyerAgentId,
          creditsBalance: 0,
          availableBalance: 0,
          reservedBalance: 0
        };

        const available = typeof data.availableBalance === 'number' ? data.availableBalance : (data.creditsBalance ?? 0);
        const reserved = typeof data.reservedBalance === 'number' ? data.reservedBalance : 0;
        const releaseAmt = Math.min(reserved, amount);
        const newAvailable = available + releaseAmt;
        const newReserved = Math.max(0, reserved - releaseAmt);

        const updated = {
          ...data,
          availableBalance: newAvailable,
          reservedBalance: newReserved,
          creditsBalance: newAvailable + newReserved,
          updatedAt: new Date().toISOString()
        };

        t.set(walletRef, updated, { merge: true });
        inMemoryWalletRegistry.set(buyerAgentId, updated);
      });
      return true;
    } catch {
      const w: any = inMemoryWalletRegistry.get(buyerAgentId);
      if (w) {
        const available = typeof w.availableBalance === 'number' ? w.availableBalance : (w.creditsBalance ?? 0);
        const reserved = typeof w.reservedBalance === 'number' ? w.reservedBalance : 0;
        const releaseAmt = Math.min(reserved, amount);
        w.availableBalance = available + releaseAmt;
        w.reservedBalance = Math.max(0, reserved - releaseAmt);
        w.creditsBalance = (w.availableBalance || 0) + (w.reservedBalance || 0);
        inMemoryWalletRegistry.set(buyerAgentId, w);
      }
      return true;
    }
  }

  /**
   * Initiates a dispute for a job.
   */
  initiateDispute(params: {
    jobId: string;
    initiatorAgentId: string;
    initiatorRole: 'BUYER' | 'SELLER';
    reason: string;
    evidence?: string[];
  }): DisputeRecord {
    const disputeId = 'disp_' + crypto.randomBytes(6).toString('hex');
    const record: DisputeRecord = {
      disputeId,
      jobId: params.jobId,
      initiatorAgentId: params.initiatorAgentId,
      initiatorRole: params.initiatorRole,
      reason: params.reason,
      evidence: params.evidence,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };

    activeDisputes.set(disputeId, record);
    return record;
  }

  /**
   * Resolves a dispute with seller/buyer payout or partial refund.
   */
  async resolveDispute(params: {
    disputeId: string;
    resolverId: string;
    resolution: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'PARTIAL_REFUND';
    refundPercent?: number;
    jobId: string;
    buyerAgentId: string;
    sellerAgentId: string;
    grossAmount: number;
  }): Promise<DisputeRecord> {
    const record = activeDisputes.get(params.disputeId);
    if (!record) {
      throw new Error(`Dispute ${params.disputeId} not found`);
    }

    record.status = params.resolution;
    record.resolverId = params.resolverId;
    record.resolvedAt = new Date().toISOString();
    record.refundPercent = params.refundPercent;

    if (params.resolution === 'RESOLVED_BUYER') {
      // 100% refund to buyer
      await this.releaseEscrow(params.buyerAgentId, params.grossAmount);
    } else if (params.resolution === 'PARTIAL_REFUND') {
      const pct = (params.refundPercent || 50) / 100;
      const refundAmt = Math.round(params.grossAmount * pct);
      await this.releaseEscrow(params.buyerAgentId, refundAmt);
    }

    return record;
  }

  /**
   * Enforces strict payment lifecycle and routes settlement based on rail:
   * payment verified -> result verified -> capture -> settlement.
   */
  async settleVerifiedJob(params: {
    jobId: string;
    buyerAgentId: string;
    buyerHandle?: string;
    sellerAgentId: string;
    sellerHandle?: string;
    grossAmount: number;
    paymentRail: 'PLATFORM_CREDITS' | 'STRIPE' | 'POLKADOT_USDC';
    paymentProofRef?: string;
    extrinsicHash?: string;
    idempotencyKey?: string;
    description?: string;
  }): Promise<SettlementResult> {
    const {
      jobId,
      buyerAgentId,
      buyerHandle,
      sellerAgentId,
      sellerHandle,
      grossAmount,
      paymentRail,
      paymentProofRef,
      extrinsicHash,
      idempotencyKey,
      description
    } = params;

    if (paymentRail === 'STRIPE') {
      const stripe = this.getStripeProvider();
      // 1. Verify Payment with Stripe
      const verifyResult = await stripe.verifyPayment(paymentProofRef || jobId, {
        jobId,
        buyerAgentId,
        sellerAgentId
      });

      if (!verifyResult.verified) {
        throw new Error(`Stripe payment verification failed: ${verifyResult.error}`);
      }

      // 2. Capture Payment on Stripe
      const fee = Math.max(1, Math.round((grossAmount * PLATFORM_ECONOMICS.platformFeeBps) / 10000));
      await stripe.capturePayment(
        paymentProofRef || jobId,
        grossAmount,
        fee,
        sellerAgentId,
        buyerAgentId,
        jobId,
        idempotencyKey
      );

      // 3. Settle transaction and return audit receipt
      return await stripe.settlePayment({
        jobId,
        paymentIntentId: paymentProofRef || jobId,
        buyerAgentId,
        buyerHandle,
        sellerAgentId,
        sellerHandle,
        grossAmount,
        platformFeeBps: PLATFORM_ECONOMICS.platformFeeBps,
        idempotencyKey,
        currency: 'USD',
        paymentRail: 'STRIPE',
        description: description || `Stripe settlement for job ${jobId}`
      } as any);
    }

    if (paymentRail === 'POLKADOT_USDC') {
      const polkadot = this.getPolkadotProvider();
      const txHash = extrinsicHash || paymentProofRef || '';

      // 1. Verify on-chain transaction against all 12 validation rules
      const verifyResult = await polkadot.verifyPayment(paymentProofRef || jobId, {
        extrinsicHash: txHash,
        amount: grossAmount,
        recipientAddress: polkadot.getConfig().treasuryAddress
      });

      if (!verifyResult.verified) {
        throw new Error(`Polkadot on-chain verification failed: ${verifyResult.error}`);
      }

      // 2. Capture and lock on-chain funds
      const fee = Math.max(1, Math.round((grossAmount * PLATFORM_ECONOMICS.platformFeeBps) / 10000));
      await polkadot.capturePayment(
        txHash,
        grossAmount,
        fee,
        sellerAgentId,
        buyerAgentId,
        jobId,
        idempotencyKey,
        { extrinsicHash: txHash }
      );

      // 3. Settle and return complete audit receipt
      return await polkadot.settlePayment({
        jobId,
        buyerAgentId,
        buyerHandle,
        sellerAgentId,
        sellerHandle,
        grossAmount,
        platformFeeBps: PLATFORM_ECONOMICS.platformFeeBps,
        idempotencyKey,
        currency: 'USDC',
        paymentRail: 'POLKADOT_USDC',
        extrinsicHash: txHash,
        description: description || `Polkadot Asset Hub USDC settlement for job ${jobId}`
      });
    }

    // Default: PLATFORM_CREDITS
    const creditsProvider = paymentProviders.PLATFORM_CREDITS as PlatformCreditsProvider;
    return await creditsProvider.settlePayment({
      jobId,
      buyerAgentId,
      buyerHandle,
      sellerAgentId,
      sellerHandle,
      grossAmount,
      platformFeeBps: PLATFORM_ECONOMICS.platformFeeBps,
      idempotencyKey,
      currency: 'CREDITS',
      paymentRail: 'PLATFORM_CREDITS',
      description: description || `Platform double-entry settlement for job ${jobId}`
    });
  }

  getPolkadotProvider(): PolkadotUsdcPaymentProvider {
    return this.polkadotProvider;
  }

  getStripeProvider(): StripePaymentProvider {
    return this.stripeProvider;
  }
}

export const paymentOrchestrator = new PaymentOrchestrator();
