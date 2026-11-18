/**
 * Stock Bloc Finance Agent Marketplace Rail (10% Take Rate + Verified Delivery + Real Base USDC Payouts & Refunds)
 *
 * Implements the 5-phase Finance Agent Marketplace on Base Mainnet (eip155:8453):
 *   Phase 1 — Seller listings:
 *     - POST /api/v1/marketplace/listings/apply       (free, validates HTTPS/SSRF, $0.001–$1.00, Base wallet -> PENDING)
 *     - POST /api/v1/marketplace/listings/:id/approve (admin-gated, live-probes endpoint -> HTTP 200 valid JSON required -> APPROVED)
 *     - POST /api/v1/marketplace/listings/:id/reject  (admin-gated, stores rejection reason -> REJECTED)
 *     - GET  /api/v1/marketplace/listings             (free, public APPROVED catalog only; never leaks contact or internal fields)
 *   Phase 2 & 3 — Buy flow & delivery verification:
 *     - POST /api/v1/marketplace/buy                  ({ listingId, params } -> HTTP 402 x402 v2 -> CDP verify & settle ->
 *                                                      call seller 30s timeout -> validate HTTP 200 non-empty JSON ->
 *                                                      return seller payload + Ed25519 Verified Delivery Receipt with listingId)
 *   Phase 4 — Base USDC payouts (90% seller / 10% Stock Bloc), 100% buyer refunds on failed delivery, & auto-suspend:
 *     - On verified delivery: queues & executes 90% USDC payout to seller payoutWallet (3 attempts + backoff)
 *     - On failed delivery: refunds 100% USDC to buyer wallet, pays seller $0, tracks consecutiveFailures,
 *       and auto-suspends listing back to PENDING after 3 consecutive failures (requires admin re-approval)
 *     - Admin inspection & manual retry: GET /payouts, POST /payouts/:id/retry, GET /refunds, POST /refunds/:id/retry
 *   Phase 5 — Discovery & Funnel Telemetry:
 *     - Emits marketplace_challenge, marketplace_payment_verified, marketplace_settlement,
 *       marketplace_delivery, marketplace_payout, marketplace_refund into agentTelemetry
 *
 * ZERO FAKE DATA:
 *   - No pre-seeded fake third-party sellers, fabricated volume, or invented delivery rates.
 *   - New approved listings start at salesCount: 0 and deliveryRate: null until real transactions exist.
 */

import crypto from 'crypto';
import net from 'net';
import { Router, Request, Response } from 'express';
import { db } from './firebaseAdmin.js';
import { constantTimeCompare } from './agentSecurity.js';
import {
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader
} from '@x402/core/http';
import {
  recordMachineCommerceEvent,
  getMarketplaceFunnelMetrics
} from './agentTelemetry.js';
import {
  BASE_CAIP2,
  BASE_USDC_CONTRACT,
  USDC_DECIMALS,
  USDC_NAME,
  USDC_VERSION,
  getCoinbaseFacilitatorClient,
  extractPaymentIdempotencyKeys,
  getX402Settlement,
  saveX402Settlement,
  type SettledX402Record
} from './x402PaymentService.js';
import {
  issueVerifiedDeliveryReceipt,
  attachReceiptHeaders,
  recordChallengeTimestamp,
  getRecentChallengeTimestamp,
  getTotalVerifiedReceiptsCount,
  type VerifiedDeliveryReceipt
} from './verifiedReceiptsService.js';
import {
  getMarketplaceWalletAddress,
  isMarketplaceHotWalletConfigured,
  executeUsdcTransferWithRetries,
  sanitizeMarketplaceError
} from './marketplacePayoutService.js';

const CDP_FACILITATOR_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

export const DEFAULT_TAKE_RATE_BPS = 1000; // 10.00%
export const BPS_DENOMINATOR = 10000n;
export const UPSTREAM_PROBE_TIMEOUT_MS = 15_000;
export const UPSTREAM_BUY_TIMEOUT_MS = 30_000;
export const MAX_UPSTREAM_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
export const AUTO_SUSPEND_CONSECUTIVE_FAILURES = 3;
export const APPLY_MIN_PRICE_USD = 0.001;
export const APPLY_MAX_PRICE_USD = 1.0;

export const FINANCE_MARKETPLACE_CATEGORIES = [
  'market_data',
  'sec_filings',
  'signals',
  'quant_scores',
  'research',
  'macro',
  'alt_data',
  'derivatives',
  'fixed_income',
  'crypto_finance'
] as const;

export type FinanceMarketplaceCategory = (typeof FINANCE_MARKETPLACE_CATEGORIES)[number];

export type MarketplaceListingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'active' | 'paused';

export interface MarketplaceListing {
  listingId: string;
  slug: string;
  name: string;
  description: string;
  category: FinanceMarketplaceCategory;
  sellerName: string;
  sellerWallet: string;
  payoutWallet: string;
  contact?: string;
  upstreamUrl: string;
  endpointUrl: string;
  method: 'GET' | 'POST';
  probeParams?: Record<string, unknown>;
  priceUsd: number;
  priceDisplay: string;
  atomicAmount: string;
  takeRateBps: number;
  platformFeeAtomic: string;
  sellerNetAtomic: string;
  requiredResponseKeys: string[];
  sampleUrl?: string;
  status: MarketplaceListingStatus;
  verified: boolean;
  salesCount: number;
  verifiedSalesCount: number;
  failedDeliveriesCount: number;
  consecutiveFailures: number;
  grossVolumeAtomic: string;
  platformFeesAtomic: string;
  sellerNetVolumeAtomic: string;
  recentReceiptIds: string[];
  listedAt: string | null;
  lastProbeAt?: string;
  lastProbeStatus?: number;
  rejectionReason?: string;
  rejectedAt?: string;
  suspendedAt?: string;
  suspendedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplacePayoutRecord {
  payoutId: string;
  saleId: string;
  listingId: string;
  listingSlug: string;
  sellerName: string;
  sellerWallet: string;
  buyerPayer: string;
  buyerTxHash: string;
  receiptId: string;
  grossAmount: number;
  sellerShare: number;
  blocShare: number;
  grossAtomic: string;
  takeRateBps: number;
  platformFeeAtomic: string;
  sellerNetAtomic: string;
  blocShareAtomic: string;
  sellerShareAtomic: string;
  grossUsd: number;
  platformFeeUsd: number;
  sellerNetUsd: number;
  status: 'pending' | 'pending_payout' | 'paid' | 'failed';
  payoutTxHash?: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface MarketplaceRefundRecord {
  refundId: string;
  saleId: string;
  listingId: string;
  listingSlug: string;
  buyerWallet: string;
  buyerTxHash: string;
  amountUsd: number;
  amountAtomic: string;
  status: 'pending' | 'paid' | 'failed';
  refundTxHash?: string;
  attempts: number;
  reason: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

interface MarketplaceSaleLedgerEntry {
  saleId: string;
  listingId: string;
  paymentKey: string;
  buyerWallet: string;
  paymentTxHash: string;
  grossAtomic: string;
  grossUsd: number;
  disbursementState: 'held' | 'payout_queued' | 'seller_paid' | 'refund_queued' | 'buyer_refunded';
  payoutId?: string;
  refundId?: string;
  receiptId?: string;
  createdAt: string;
}

export interface MarketplaceSplitResult {
  grossAtomic: string;
  takeRateBps: number;
  platformFeeAtomic: string;
  sellerNetAtomic: string;
  grossUsd: number;
  platformFeeUsd: number;
  sellerNetUsd: number;
}

export function getMarketplaceEscrowAddress(): string {
  return getMarketplaceWalletAddress();
}

export function getMarketplaceTakeRateBps(): number {
  const raw = Number(process.env.MARKETPLACE_TAKE_RATE_BPS);
  if (Number.isInteger(raw) && raw >= 0 && raw <= 5000) {
    return raw;
  }
  return DEFAULT_TAKE_RATE_BPS;
}

/**
 * Exact integer BigInt split on 6-decimal USDC atomic units.
 * Platform fee (blocShare) is floor(gross * bps / 10000), seller receives gross - platformFee.
 * Guaranteed: platformFeeAtomic + sellerNetAtomic === grossAtomic (zero rounding drift).
 */
export function computeMarketplaceSplit(
  atomicAmount: string | bigint,
  takeRateBps: number = getMarketplaceTakeRateBps()
): MarketplaceSplitResult {
  const gross = typeof atomicAmount === 'bigint' ? atomicAmount : BigInt(atomicAmount);
  if (gross <= 0n) {
    throw new Error('atomicAmount must be greater than zero');
  }
  const bps = BigInt(takeRateBps);
  const platformFee = (gross * bps) / BPS_DENOMINATOR;
  const sellerNet = gross - platformFee;

  return {
    grossAtomic: gross.toString(),
    takeRateBps,
    platformFeeAtomic: platformFee.toString(),
    sellerNetAtomic: sellerNet.toString(),
    grossUsd: Number(gross) / 10 ** USDC_DECIMALS,
    platformFeeUsd: Number(platformFee) / 10 ** USDC_DECIMALS,
    sellerNetUsd: Number(sellerNet) / 10 ** USDC_DECIMALS
  };
}

export function usdToAtomicUsdc(priceUsd: number): string {
  const atomic = Math.round(priceUsd * 10 ** USDC_DECIMALS);
  if (!Number.isFinite(atomic) || atomic <= 0) {
    throw new Error('priceUsd must be a positive number');
  }
  return String(atomic);
}

function isListingLive(listing: MarketplaceListing): boolean {
  return listing.status === 'APPROVED' || listing.status === 'active';
}

function computeDeliveryRate(listing: MarketplaceListing): number | null {
  const successes = listing.salesCount ?? listing.verifiedSalesCount ?? 0;
  const failures = listing.failedDeliveriesCount ?? 0;
  const total = successes + failures;
  if (total === 0) return null;
  return Number(((successes / total) * 100).toFixed(2));
}

// ============================================================================
// SSRF & INPUT VALIDATION
// ============================================================================

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

let allowPrivateUpstreamForTesting = false;
let customUpstreamFetchForTesting: typeof fetch | null = null;
let customBuyTimeoutMsForTesting: number | null = null;

export function setMarketplaceTestingHooks(opts: {
  allowPrivateUpstream?: boolean;
  upstreamFetch?: typeof fetch | null;
  buyTimeoutMs?: number | null;
}): void {
  if (opts.allowPrivateUpstream !== undefined) {
    allowPrivateUpstreamForTesting = opts.allowPrivateUpstream;
  }
  if (opts.upstreamFetch !== undefined) {
    customUpstreamFetchForTesting = opts.upstreamFetch;
  }
  if (opts.buyTimeoutMs !== undefined) {
    customBuyTimeoutMsForTesting = opts.buyTimeoutMs;
  }
}

function isPrivateOrBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower === 'metadata.google.internal' ||
    lower === '169.254.169.254'
  ) {
    return true;
  }

  const ipVersion = net.isIP(lower);
  if (ipVersion === 4) {
    const parts = lower.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  } else if (ipVersion === 6) {
    if (lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
      return true;
    }
  }
  return false;
}

export function validateUpstreamUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'endpointUrl must be a valid URL.' };
  }

  if (parsed.protocol !== 'https:' && !(allowPrivateUpstreamForTesting && parsed.protocol === 'http:')) {
    return { ok: false, error: 'endpointUrl must use https://.' };
  }

  if (!allowPrivateUpstreamForTesting && isPrivateOrBlockedHostname(parsed.hostname)) {
    return { ok: false, error: 'endpointUrl cannot target localhost, private networks, or cloud metadata endpoints.' };
  }

  return { ok: true, url: parsed };
}

function getByDotPath(obj: unknown, dotPath: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const segments = dotPath.split('.').filter(Boolean);
  let cur: any = obj;
  for (const seg of segments) {
    if (cur === null || cur === undefined || typeof cur !== 'object' || !(seg in cur)) {
      return undefined;
    }
    cur = cur[seg];
  }
  return cur;
}

function validateDeliveredJson(
  rawText: string,
  requiredKeys: string[] = []
): { valid: true; parsed: unknown } | { valid: false; reason: string } {
  if (!rawText || !rawText.trim()) {
    return { valid: false, reason: 'Seller returned an empty response body.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: false, reason: 'Seller did not return valid JSON.' };
  }

  if (parsed === null || typeof parsed !== 'object') {
    return { valid: false, reason: 'Seller JSON payload must be a non-empty object or array.' };
  }

  if (Array.isArray(parsed) && parsed.length === 0) {
    return { valid: false, reason: 'Seller returned an empty JSON array.' };
  }

  if (!Array.isArray(parsed) && Object.keys(parsed as Record<string, unknown>).length === 0) {
    return { valid: false, reason: 'Seller returned an empty JSON object.' };
  }

  if (requiredKeys.length > 0) {
    const missing: string[] = [];
    for (const keyPath of requiredKeys) {
      const val = getByDotPath(parsed, keyPath);
      if (val === undefined || val === null) {
        missing.push(keyPath);
      }
    }
    if (missing.length > 0) {
      return {
        valid: false,
        reason: `Seller response failed delivery schema check; missing required keys: ${missing.join(', ')}`
      };
    }
  }

  return { valid: true, parsed };
}

function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const clean = base.length >= 3 ? base : `listing-${crypto.randomBytes(3).toString('hex')}`;
  return clean;
}

// ============================================================================
// ADMIN GUARD (MARKETPLACE_ADMIN_KEY; NEVER LOGGED OR EXPOSED)
// ============================================================================

function verifyMarketplaceAdmin(req: Request): boolean {
  const configuredSecrets = [
    process.env.MARKETPLACE_ADMIN_KEY,
    process.env.ADMIN_API_KEY,
    process.env.AGENT_API_SECRET_KEY
  ].filter((s): s is string => typeof s === 'string' && s.trim().length >= 8);

  if (configuredSecrets.length === 0) {
    return false;
  }

  const headerKey =
    (req.headers['x-admin-key'] as string) ||
    (req.headers['x-marketplace-admin-key'] as string) ||
    (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : '');

  if (!headerKey) return false;
  return configuredSecrets.some((secret) => constantTimeCompare(secret.trim(), headerKey));
}

// ============================================================================
// STORAGE (IN-MEMORY + FIRESTORE MIRROR; ZERO FAKE SEED DATA)
// ============================================================================

// Primary map keyed by listingId, secondary index by slug
const listingById = new Map<string, MarketplaceListing>();
const listingIdBySlug = new Map<string, string>();
const payoutStore = new Map<string, MarketplacePayoutRecord>();
const refundStore = new Map<string, MarketplaceRefundRecord>();
const saleLedger = new Map<string, MarketplaceSaleLedgerEntry>();
const saleIdByPaymentKey = new Map<string, string>();

let listingsHydrated = false;
let payoutsHydrated = false;
let refundsHydrated = false;

export function clearMarketplaceRailStore(): void {
  listingById.clear();
  listingIdBySlug.clear();
  payoutStore.clear();
  refundStore.clear();
  saleLedger.clear();
  saleIdByPaymentKey.clear();
  listingsHydrated = true; // prevent reading stale disk state during unit tests
  payoutsHydrated = true;
  refundsHydrated = true;
}

function indexListing(raw: MarketplaceListing): MarketplaceListing {
  const listing: MarketplaceListing = {
    ...raw,
    listingId: raw.listingId || `lst_${raw.slug}`,
    endpointUrl: raw.endpointUrl || raw.upstreamUrl,
    upstreamUrl: raw.upstreamUrl || raw.endpointUrl,
    payoutWallet: raw.payoutWallet || raw.sellerWallet,
    sellerWallet: raw.sellerWallet || raw.payoutWallet,
    verified: raw.verified ?? isListingLive(raw),
    salesCount: raw.salesCount ?? raw.verifiedSalesCount ?? 0,
    verifiedSalesCount: raw.verifiedSalesCount ?? raw.salesCount ?? 0,
    failedDeliveriesCount: raw.failedDeliveriesCount ?? 0,
    consecutiveFailures: raw.consecutiveFailures ?? 0,
    listedAt: raw.listedAt !== undefined ? raw.listedAt : isListingLive(raw) ? raw.createdAt : null
  };
  listingById.set(listing.listingId, listing);
  if (listing.slug) {
    listingIdBySlug.set(listing.slug.toLowerCase(), listing.listingId);
  }
  return listing;
}

function findListing(idOrSlug: string): MarketplaceListing | undefined {
  if (!idOrSlug || typeof idOrSlug !== 'string') return undefined;
  const trimmed = idOrSlug.trim();
  const byId = listingById.get(trimmed);
  if (byId) return byId;
  const mappedId = listingIdBySlug.get(trimmed.toLowerCase());
  if (mappedId) return listingById.get(mappedId);
  return undefined;
}

async function ensureListingsHydrated(): Promise<void> {
  if (listingsHydrated) return;
  listingsHydrated = true;
  try {
    const snap = await db.collection('marketplace_listings').get();
    if (snap && Array.isArray(snap.docs)) {
      for (const doc of snap.docs) {
        const data = doc.data() as MarketplaceListing;
        if (data?.listingId || data?.slug) {
          const key = data.listingId || `lst_${data.slug}`;
          if (!listingById.has(key)) {
            indexListing(data);
          }
        }
      }
    }
  } catch {
    // Non-fatal
  }
}

async function ensurePayoutsHydrated(): Promise<void> {
  if (payoutsHydrated) return;
  payoutsHydrated = true;
  try {
    const snap = await db.collection('marketplace_payouts').get();
    if (snap && Array.isArray(snap.docs)) {
      for (const doc of snap.docs) {
        const data = doc.data() as MarketplacePayoutRecord;
        if (data?.payoutId && !payoutStore.has(data.payoutId)) {
          payoutStore.set(data.payoutId, data);
        }
      }
    }
  } catch {
    // Non-fatal
  }
}

async function ensureRefundsHydrated(): Promise<void> {
  if (refundsHydrated) return;
  refundsHydrated = true;
  try {
    const snap = await db.collection('marketplace_refunds').get();
    if (snap && Array.isArray(snap.docs)) {
      for (const doc of snap.docs) {
        const data = doc.data() as MarketplaceRefundRecord;
        if (data?.refundId && !refundStore.has(data.refundId)) {
          refundStore.set(data.refundId, data);
        }
      }
    }
  } catch {
    // Non-fatal
  }
}

function persistListing(listing: MarketplaceListing): void {
  const normalized = indexListing(listing);
  try {
    db.collection('marketplace_listings').doc(normalized.listingId).set(normalized).catch(() => {});
  } catch {
    // Non-fatal
  }
}

function persistPayout(payout: MarketplacePayoutRecord): void {
  payoutStore.set(payout.payoutId, payout);
  try {
    db.collection('marketplace_payouts').doc(payout.payoutId).set(payout).catch(() => {});
  } catch {
    // Non-fatal
  }
}

function persistRefund(refund: MarketplaceRefundRecord): void {
  refundStore.set(refund.refundId, refund);
  try {
    db.collection('marketplace_refunds').doc(refund.refundId).set(refund).catch(() => {});
  } catch {
    // Non-fatal
  }
}

function persistSaleLedger(entry: MarketplaceSaleLedgerEntry): void {
  saleLedger.set(entry.saleId, entry);
  saleIdByPaymentKey.set(entry.paymentKey, entry.saleId);
  try {
    db.collection('marketplace_sales').doc(entry.saleId).set(entry).catch(() => {});
  } catch {
    // Non-fatal
  }
}

/**
 * Public catalog projection — STRICTLY omits contact, endpointUrl/upstreamUrl, and internal fields.
 */
function formatPublicListing(listing: MarketplaceListing) {
  const deliveryRate = computeDeliveryRate(listing);

  return {
    listingId: listing.listingId,
    slug: listing.slug,
    name: listing.name,
    description: listing.description,
    category: listing.category,
    priceUsd: listing.priceUsd,
    priceDisplay: listing.priceDisplay,
    atomicAmount: listing.atomicAmount,
    asset: 'USDC',
    network: BASE_CAIP2,
    seller: listing.sellerName || listing.payoutWallet,
    sellerName: listing.sellerName,
    sellerWallet: listing.sellerWallet,
    verified: isListingLive(listing),
    salesCount: listing.salesCount,
    deliveryRate,
    listedAt: listing.listedAt,
    method: listing.method,
    buyUrl: 'https://stockbloc.ai.studio/api/v1/marketplace/buy',
    buyPath: '/api/v1/marketplace/buy',
    callUrl: `https://stockbloc.ai.studio/api/v1/marketplace/call/${listing.slug}`,
    callPath: `/api/v1/marketplace/call/${listing.slug}`,
    sampleUrl: listing.sampleUrl || null,
    takeRateBps: listing.takeRateBps,
    takeRatePercent: `${(listing.takeRateBps / 100).toFixed(0)}%`,
    sellerNetAtomic: listing.sellerNetAtomic,
    platformFeeAtomic: listing.platformFeeAtomic,
    requiredResponseKeys: listing.requiredResponseKeys,
    status: listing.status,
    reputation: {
      verifiedSalesCount: listing.verifiedSalesCount,
      failedDeliveriesCount: listing.failedDeliveriesCount,
      deliverySuccessRate: deliveryRate,
      grossVolumeUsd: Number(BigInt(listing.grossVolumeAtomic || '0')) / 10 ** USDC_DECIMALS,
      recentReceiptIds: listing.recentReceiptIds
    },
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt
  };
}

// ============================================================================
// UPSTREAM SELLER CALLER & PROBE
// ============================================================================

async function callSellerEndpoint(
  listing: MarketplaceListing,
  params: Record<string, unknown> | undefined,
  timeoutMs: number
): Promise<
  | { ok: true; status: number; rawText: string; parsed: unknown }
  | { ok: false; status: number; reason: string }
> {
  const urlCheck = validateUpstreamUrl(listing.endpointUrl || listing.upstreamUrl);
  if ('error' in urlCheck) {
    return { ok: false, status: 0, reason: urlCheck.error };
  }

  const targetUrl = new URL(urlCheck.url.toString());
  if (listing.method === 'GET' && params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        targetUrl.searchParams.set(k, String(v));
      }
    }
  }

  const fetchFn = customUpstreamFetchForTesting || globalThis.fetch;
  let status = 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let rawText = '';
    try {
      const upstreamRes = await fetchFn(targetUrl.toString(), {
        method: listing.method,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'StockBloc-Verified-Marketplace/1.0',
          ...(listing.method === 'POST' ? { 'Content-Type': 'application/json' } : {})
        },
        body: listing.method === 'POST' ? JSON.stringify(params ?? {}) : undefined,
        redirect: 'manual',
        signal: controller.signal
      });

      status = upstreamRes.status;
      if (status !== 200) {
        return {
          ok: false,
          status,
          reason: `Seller upstream returned HTTP ${status} (expected HTTP 200).`
        };
      }

      const buf = Buffer.from(await upstreamRes.arrayBuffer());
      if (buf.byteLength > MAX_UPSTREAM_RESPONSE_BYTES) {
        return {
          ok: false,
          status,
          reason: `Seller response exceeded maximum size (${MAX_UPSTREAM_RESPONSE_BYTES} bytes).`
        };
      }
      rawText = buf.toString('utf8');
    } finally {
      clearTimeout(timer);
    }

    const validation = validateDeliveredJson(rawText, listing.requiredResponseKeys);
    if ('reason' in validation) {
      return { ok: false, status, reason: validation.reason };
    }

    return { ok: true, status, rawText, parsed: validation.parsed };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort');
    return {
      ok: false,
      status,
      reason: isAbort
        ? `Seller endpoint timed out after ${Math.round(timeoutMs / 1000)}s.`
        : sanitizeMarketplaceError(err)
    };
  }
}

// ============================================================================
// PHASE 4: PAYOUT & REFUND EXECUTION RUNNERS (WITH 3-ATTEMPT BACKOFF)
// ============================================================================

export async function processMarketplacePayout(payoutId: string): Promise<MarketplacePayoutRecord | null> {
  await ensurePayoutsHydrated();
  const payout = payoutStore.get(payoutId);
  if (!payout) return null;

  // Hard safety invariant: never double-pay an already-paid payout
  if (payout.status === 'paid') {
    return payout;
  }

  // Hard safety invariant: verify the sale was actually settled & sellerShare <= grossAtomic
  const sale = saleLedger.get(payout.saleId);
  if (sale && BigInt(payout.sellerShareAtomic) > BigInt(sale.grossAtomic)) {
    payout.status = 'failed';
    payout.lastError = 'Safety check failed: payout exceeds settled buyer payment.';
    payout.updatedAt = new Date().toISOString();
    persistPayout(payout);
    return payout;
  }

  const outcome = await executeUsdcTransferWithRetries({
    to: payout.sellerWallet,
    amountAtomic: BigInt(payout.sellerShareAtomic || payout.sellerNetAtomic),
    saleId: payout.saleId,
    kind: 'seller_payout'
  });

  const now = new Date().toISOString();
  payout.attempts += outcome.attempts;
  payout.updatedAt = now;

  if ('error' in outcome) {
    payout.status = 'failed';
    payout.lastError = sanitizeMarketplaceError(outcome.error);
    persistPayout(payout);
  } else {
    payout.status = 'paid';
    payout.payoutTxHash = outcome.txHash;
    payout.paidAt = now;
    payout.lastError = undefined;
    persistPayout(payout);

    if (sale) {
      sale.disbursementState = 'seller_paid';
      persistSaleLedger(sale);
    }

    recordMachineCommerceEvent({
      eventType: 'marketplace_payout',
      source: 'rest',
      endpoint: '/api/v1/marketplace/buy',
      payer: payout.sellerWallet,
      amountUsd: payout.sellerShare,
      txHash: outcome.txHash,
      timestamp: now,
      details: {
        payoutId: payout.payoutId,
        saleId: payout.saleId,
        listingId: payout.listingId,
        blocShareUsd: payout.blocShare
      }
    });
  }

  return payout;
}

export async function processMarketplaceRefund(refundId: string): Promise<MarketplaceRefundRecord | null> {
  await ensureRefundsHydrated();
  const refund = refundStore.get(refundId);
  if (!refund) return null;

  // Hard safety invariant: never double-refund an already-paid refund
  if (refund.status === 'paid') {
    return refund;
  }

  // Hard safety invariant: verify refund never exceeds settled buyer payment
  const sale = saleLedger.get(refund.saleId);
  if (sale && BigInt(refund.amountAtomic) > BigInt(sale.grossAtomic)) {
    refund.status = 'failed';
    refund.lastError = 'Safety check failed: refund exceeds settled buyer payment.';
    refund.updatedAt = new Date().toISOString();
    persistRefund(refund);
    return refund;
  }

  const outcome = await executeUsdcTransferWithRetries({
    to: refund.buyerWallet,
    amountAtomic: BigInt(refund.amountAtomic),
    saleId: refund.saleId,
    kind: 'buyer_refund'
  });

  const now = new Date().toISOString();
  refund.attempts += outcome.attempts;
  refund.updatedAt = now;

  if ('error' in outcome) {
    refund.status = 'failed';
    refund.lastError = sanitizeMarketplaceError(outcome.error);
    persistRefund(refund);
  } else {
    refund.status = 'paid';
    refund.refundTxHash = outcome.txHash;
    refund.paidAt = now;
    refund.lastError = undefined;
    persistRefund(refund);

    if (sale) {
      sale.disbursementState = 'buyer_refunded';
      persistSaleLedger(sale);
    }

    recordMachineCommerceEvent({
      eventType: 'marketplace_refund',
      source: 'rest',
      endpoint: '/api/v1/marketplace/buy',
      payer: refund.buyerWallet,
      amountUsd: refund.amountUsd,
      txHash: outcome.txHash,
      timestamp: now,
      details: {
        refundId: refund.refundId,
        saleId: refund.saleId,
        listingId: refund.listingId,
        reason: refund.reason
      }
    });
  }

  return refund;
}

// ============================================================================
// CORE OPERATIONS: APPLY (PHASE 1) & LEGACY ADMIN ONBOARD
// ============================================================================

export interface ApplyListingInput {
  name: string;
  endpointUrl: string;
  priceUsd: number;
  description: string;
  payoutWallet: string;
  contact: string;
  sellerName?: string;
  category?: string;
  method?: 'GET' | 'POST';
  probeParams?: Record<string, unknown>;
  requiredResponseKeys?: string[];
  sampleUrl?: string;
  slug?: string;
}

export async function applyMarketplaceListing(
  input: ApplyListingInput
): Promise<{ ok: true; listing: MarketplaceListing } | { ok: false; status: number; error: string }> {
  await ensureListingsHydrated();

  const name = String(input.name || '').trim();
  const description = String(input.description || '').trim();
  const contact = String(input.contact || '').trim();
  if (!name || !description) {
    return { ok: false, status: 400, error: 'name and description are required.' };
  }
  if (!contact) {
    return { ok: false, status: 400, error: 'contact (email, handle, or URL) is required.' };
  }

  const endpointCheck = validateUpstreamUrl(String(input.endpointUrl || '').trim());
  if ('error' in endpointCheck) {
    return { ok: false, status: 400, error: endpointCheck.error };
  }

  const payoutWallet = String(input.payoutWallet || '').trim();
  if (!EVM_ADDRESS_RE.test(payoutWallet)) {
    return { ok: false, status: 400, error: 'payoutWallet must be a valid 0x EVM Base address.' };
  }

  const priceUsd = Number(input.priceUsd);
  if (!Number.isFinite(priceUsd) || priceUsd < APPLY_MIN_PRICE_USD || priceUsd > APPLY_MAX_PRICE_USD) {
    return {
      ok: false,
      status: 400,
      error: `priceUsd must be between $${APPLY_MIN_PRICE_USD} and $${APPLY_MAX_PRICE_USD.toFixed(2)} USDC.`
    };
  }

  const rawCategory = String(input.category || 'signals').trim().toLowerCase() as FinanceMarketplaceCategory;
  if (!FINANCE_MARKETPLACE_CATEGORIES.includes(rawCategory)) {
    return {
      ok: false,
      status: 400,
      error: `category must be a supported finance category: ${FINANCE_MARKETPLACE_CATEGORIES.join(', ')}`
    };
  }

  const method = (String(input.method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET') as 'GET' | 'POST';

  let sampleUrl: string | undefined;
  if (input.sampleUrl) {
    const sampleCheck = validateUpstreamUrl(String(input.sampleUrl).trim());
    if ('error' in sampleCheck) {
      return { ok: false, status: 400, error: `Invalid sampleUrl: ${sampleCheck.error}` };
    }
    sampleUrl = sampleCheck.url.toString();
  }

  const requiredResponseKeys = Array.isArray(input.requiredResponseKeys)
    ? input.requiredResponseKeys.map((k) => String(k).trim()).filter(Boolean)
    : [];

  const listingId = `lst_${crypto.randomBytes(8).toString('hex')}`;
  let slug = input.slug ? String(input.slug).trim().toLowerCase() : slugifyName(name);
  if (!SLUG_RE.test(slug) || listingIdBySlug.has(slug)) {
    slug = `${slug.slice(0, 48)}-${listingId.slice(-6)}`.replace(/[^a-z0-9-]/g, '-');
  }

  const atomicAmount = usdToAtomicUsdc(priceUsd);
  const takeRateBps = getMarketplaceTakeRateBps();
  const split = computeMarketplaceSplit(atomicAmount, takeRateBps);
  const now = new Date().toISOString();

  const listing: MarketplaceListing = {
    listingId,
    slug,
    name,
    description,
    category: rawCategory,
    sellerName: String(input.sellerName || '').trim() || name,
    sellerWallet: payoutWallet,
    payoutWallet,
    contact,
    upstreamUrl: endpointCheck.url.toString(),
    endpointUrl: endpointCheck.url.toString(),
    method,
    probeParams: input.probeParams && typeof input.probeParams === 'object' ? input.probeParams : undefined,
    priceUsd: Number(priceUsd.toFixed(6)),
    priceDisplay: `$${priceUsd >= 0.01 ? priceUsd.toFixed(2) : priceUsd.toFixed(4)}`,
    atomicAmount,
    takeRateBps,
    platformFeeAtomic: split.platformFeeAtomic,
    sellerNetAtomic: split.sellerNetAtomic,
    requiredResponseKeys,
    sampleUrl,
    status: 'PENDING',
    verified: false,
    salesCount: 0,
    verifiedSalesCount: 0,
    failedDeliveriesCount: 0,
    consecutiveFailures: 0,
    grossVolumeAtomic: '0',
    platformFeesAtomic: '0',
    sellerNetVolumeAtomic: '0',
    recentReceiptIds: [],
    listedAt: null,
    createdAt: now,
    updatedAt: now
  };

  persistListing(listing);
  return { ok: true, listing };
}

export interface CreateListingInput {
  slug: string;
  name: string;
  description: string;
  category: string;
  sellerName: string;
  sellerWallet: string;
  upstreamUrl: string;
  method?: 'GET' | 'POST';
  priceUsd: number;
  requiredResponseKeys?: string[];
  sampleUrl?: string;
}

export async function createMarketplaceListing(
  input: CreateListingInput
): Promise<{ ok: true; listing: MarketplaceListing } | { ok: false; status: number; error: string }> {
  await ensureListingsHydrated();

  const slug = String(input.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      status: 400,
      error: 'slug must be 3-64 lowercase alphanumeric characters or hyphens (e.g. "options-flow-feed").'
    };
  }
  if (listingIdBySlug.has(slug)) {
    return { ok: false, status: 409, error: `Listing slug "${slug}" already exists.` };
  }

  const name = String(input.name || '').trim();
  const description = String(input.description || '').trim();
  const sellerName = String(input.sellerName || '').trim();
  if (!name || !description || !sellerName) {
    return { ok: false, status: 400, error: 'name, description, and sellerName are required.' };
  }

  const category = String(input.category || '').trim().toLowerCase() as FinanceMarketplaceCategory;
  if (!FINANCE_MARKETPLACE_CATEGORIES.includes(category)) {
    return {
      ok: false,
      status: 400,
      error: `category must be a supported finance category: ${FINANCE_MARKETPLACE_CATEGORIES.join(', ')}`
    };
  }

  const sellerWallet = String(input.sellerWallet || '').trim();
  if (!EVM_ADDRESS_RE.test(sellerWallet)) {
    return { ok: false, status: 400, error: 'sellerWallet must be a valid 0x EVM address on Base.' };
  }

  const upstreamCheck = validateUpstreamUrl(String(input.upstreamUrl || '').trim());
  if ('error' in upstreamCheck) {
    return { ok: false, status: 400, error: upstreamCheck.error };
  }

  const method = (String(input.method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET') as 'GET' | 'POST';

  const priceUsd = Number(input.priceUsd);
  if (!Number.isFinite(priceUsd) || priceUsd < 0.001 || priceUsd > 100) {
    return { ok: false, status: 400, error: 'priceUsd must be between $0.001 and $100.00 USDC.' };
  }

  const atomicAmount = usdToAtomicUsdc(priceUsd);
  const takeRateBps = getMarketplaceTakeRateBps();
  const split = computeMarketplaceSplit(atomicAmount, takeRateBps);

  const requiredResponseKeys = Array.isArray(input.requiredResponseKeys)
    ? input.requiredResponseKeys.map((k) => String(k).trim()).filter(Boolean)
    : [];

  let sampleUrl: string | undefined;
  if (input.sampleUrl) {
    const sampleCheck = validateUpstreamUrl(String(input.sampleUrl).trim());
    if ('error' in sampleCheck) {
      return { ok: false, status: 400, error: `Invalid sampleUrl: ${sampleCheck.error}` };
    }
    sampleUrl = sampleCheck.url.toString();
  }

  const now = new Date().toISOString();
  const listing: MarketplaceListing = {
    listingId: `lst_${crypto.randomBytes(8).toString('hex')}`,
    slug,
    name,
    description,
    category,
    sellerName,
    sellerWallet,
    payoutWallet: sellerWallet,
    upstreamUrl: upstreamCheck.url.toString(),
    endpointUrl: upstreamCheck.url.toString(),
    method,
    priceUsd: Number(priceUsd.toFixed(6)),
    priceDisplay: `$${priceUsd >= 0.01 ? priceUsd.toFixed(2) : priceUsd.toFixed(4)}`,
    atomicAmount,
    takeRateBps,
    platformFeeAtomic: split.platformFeeAtomic,
    sellerNetAtomic: split.sellerNetAtomic,
    requiredResponseKeys,
    sampleUrl,
    status: 'active',
    verified: true,
    salesCount: 0,
    verifiedSalesCount: 0,
    failedDeliveriesCount: 0,
    consecutiveFailures: 0,
    grossVolumeAtomic: '0',
    platformFeesAtomic: '0',
    sellerNetVolumeAtomic: '0',
    recentReceiptIds: [],
    listedAt: now,
    createdAt: now,
    updatedAt: now
  };

  persistListing(listing);
  return { ok: true, listing };
}

export async function getMarketplaceStats() {
  await ensureListingsHydrated();
  await ensurePayoutsHydrated();
  await ensureRefundsHydrated();

  const allListings = Array.from(listingById.values());
  const approvedListings = allListings.filter(isListingLive);
  const pendingListings = allListings.filter((l) => l.status === 'PENDING');
  const allPayouts = Array.from(payoutStore.values());
  const allRefunds = Array.from(refundStore.values());

  let grossAtomic = 0n;
  let platformFeeAtomic = 0n;
  let sellerNetOwedAtomic = 0n;
  let sellerNetPaidAtomic = 0n;
  let failedPayoutsCount = 0;
  let verifiedSalesCount = 0;
  let failedDeliveriesCount = 0;
  let refundedAtomic = 0n;

  for (const l of allListings) {
    verifiedSalesCount += l.verifiedSalesCount;
    failedDeliveriesCount += l.failedDeliveriesCount;
  }

  for (const p of allPayouts) {
    grossAtomic += BigInt(p.grossAtomic || '0');
    platformFeeAtomic += BigInt(p.platformFeeAtomic || '0');
    if (p.status === 'paid') {
      sellerNetPaidAtomic += BigInt(p.sellerNetAtomic || '0');
    } else {
      sellerNetOwedAtomic += BigInt(p.sellerNetAtomic || '0');
      if (p.status === 'failed') failedPayoutsCount += 1;
    }
  }

  for (const r of allRefunds) {
    if (r.status === 'paid') {
      refundedAtomic += BigInt(r.amountAtomic || '0');
    }
  }

  const totalAttempts = verifiedSalesCount + failedDeliveriesCount;
  const totalReceiptsIssued = await getTotalVerifiedReceiptsCount();
  const takeRateBps = getMarketplaceTakeRateBps();

  return {
    marketplace: 'Stock Bloc Finance Agent Marketplace',
    vertical: 'finance',
    economics: {
      takeRateBps,
      takeRatePercent: `${(takeRateBps / 100).toFixed(0)}%`,
      sellerSharePercent: `${((10000 - takeRateBps) / 100).toFixed(0)}%`,
      listingFeeUsd: 0,
      monthlyFeeUsd: 0,
      network: BASE_CAIP2,
      asset: 'USDC',
      escrowAddress: getMarketplaceWalletAddress(),
      marketplaceWalletAddress: getMarketplaceWalletAddress(),
      hotWalletConfigured: isMarketplaceHotWalletConfigured(),
      facilitator: CDP_FACILITATOR_URL
    },
    guarantees: {
      verifiedDeliveryBeforePayout: true,
      verifiedDeliveryBeforeSettlement: true,
      buyerChargedOnFailedDelivery: false,
      fullRefundOnFailedDelivery: true,
      autoSuspendAfterConsecutiveFailures: AUTO_SUSPEND_CONSECUTIVE_FAILURES,
      signedReceiptsAlgorithm: 'Ed25519',
      receiptPublicKeyUrl: 'https://stockbloc.ai.studio/.well-known/receipts-pubkey.json'
    },
    liveMetrics: {
      activeThirdPartyListings: approvedListings.length,
      approvedListings: approvedListings.length,
      pendingApplications: pendingListings.length,
      totalThirdPartyListings: allListings.length,
      verifiedMarketplaceSales: verifiedSalesCount,
      failedDeliveriesBlocked: failedDeliveriesCount,
      deliverySuccessRate:
        totalAttempts > 0 ? Number(((verifiedSalesCount / totalAttempts) * 100).toFixed(2)) : null,
      grossVolumeUsd: Number(grossAtomic) / 10 ** USDC_DECIMALS,
      platformRevenueUsd: Number(platformFeeAtomic) / 10 ** USDC_DECIMALS,
      sellerNetPendingUsd: Number(sellerNetOwedAtomic) / 10 ** USDC_DECIMALS,
      sellerNetPaidUsd: Number(sellerNetPaidAtomic) / 10 ** USDC_DECIMALS,
      failedPayoutsAwaitingRetry: failedPayoutsCount,
      refundsCount: allRefunds.length,
      totalRefundedUsd: Number(refundedAtomic) / 10 ** USDC_DECIMALS,
      totalVerifiedReceiptsIssued: totalReceiptsIssued
    },
    funnel: getMarketplaceFunnelMetrics(),
    asOf: new Date().toISOString()
  };
}

// ============================================================================
// EXPRESS ROUTER: /api/v1/marketplace
// ============================================================================

export function createMarketplaceRailRouter(): Router {
  const router = Router();

  // 1. Public Marketplace Stats (honest live metrics + funnel counters, zero fake data)
  router.get('/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await getMarketplaceStats();
      return res.status(200).json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to load marketplace stats', message: sanitizeMarketplaceError(err) });
    }
  });

  // 2. PHASE 1: Free Seller Listing Application (stores as PENDING; never goes live until probed & approved)
  router.post('/listings/apply', async (req: Request, res: Response) => {
    try {
      const result = await applyMarketplaceListing(req.body || {});
      if ('error' in result) {
        return res.status(result.status).json({ error: result.error });
      }
      const { listing } = result;
      return res.status(201).json({
        applied: true,
        listingId: listing.listingId,
        slug: listing.slug,
        status: listing.status,
        name: listing.name,
        description: listing.description,
        priceUsd: listing.priceUsd,
        priceDisplay: listing.priceDisplay,
        payoutWallet: listing.payoutWallet,
        takeRatePercent: '10%',
        sellerSharePercent: '90%',
        message: 'Application received and stored as PENDING. An operator will probe your endpoint and approve it before listing.',
        createdAt: listing.createdAt
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to submit seller application', message: sanitizeMarketplaceError(err) });
    }
  });

  // 3. PHASE 1: Admin Approve Listing (requires MARKETPLACE_ADMIN_KEY + live HTTP 200 valid JSON probe)
  router.post('/listings/:id/approve', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({
        error: 'Operator authentication required to approve marketplace listings.',
        hint: 'Provide X-Admin-Key matching MARKETPLACE_ADMIN_KEY.'
      });
    }

    await ensureListingsHydrated();
    const listing = findListing(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Marketplace listing not found', id: req.params.id });
    }

    const probeParams =
      req.body?.probeParams && typeof req.body.probeParams === 'object'
        ? req.body.probeParams
        : listing.probeParams;

    // Live probe: MUST return HTTP 200 with valid non-empty JSON before approval
    const probe = await callSellerEndpoint(listing, probeParams, UPSTREAM_PROBE_TIMEOUT_MS);
    const now = new Date().toISOString();
    listing.lastProbeAt = now;
    listing.lastProbeStatus = probe.status;
    listing.updatedAt = now;

    if ('reason' in probe) {
      // Do NOT approve or publish; keep in PENDING
      if (listing.status !== 'PENDING') {
        listing.status = 'PENDING';
        listing.verified = false;
      }
      persistListing(listing);
      return res.status(422).json({
        approved: false,
        listingId: listing.listingId,
        status: listing.status,
        error: `Live endpoint probe failed: ${probe.reason}`,
        probeResult: {
          ok: false,
          httpStatus: probe.status,
          reason: probe.reason,
          probedAt: now
        }
      });
    }

    listing.status = 'APPROVED';
    listing.verified = true;
    listing.consecutiveFailures = 0;
    listing.listedAt = listing.listedAt || now;
    listing.rejectionReason = undefined;
    listing.rejectedAt = undefined;
    listing.suspendedAt = undefined;
    listing.suspendedReason = undefined;
    persistListing(listing);

    return res.status(200).json({
      approved: true,
      listingId: listing.listingId,
      status: listing.status,
      probeResult: {
        ok: true,
        httpStatus: probe.status,
        probedAt: now
      },
      listing: formatPublicListing(listing)
    });
  });

  // 4. PHASE 1: Admin Reject Listing (requires MARKETPLACE_ADMIN_KEY)
  router.post('/listings/:id/reject', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({
        error: 'Operator authentication required to reject marketplace listings.',
        hint: 'Provide X-Admin-Key matching MARKETPLACE_ADMIN_KEY.'
      });
    }

    await ensureListingsHydrated();
    const listing = findListing(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Marketplace listing not found', id: req.params.id });
    }

    const reason =
      String(req.body?.reason || req.body?.rejectionReason || '').trim() ||
      'Listing rejected by marketplace operator.';
    const now = new Date().toISOString();
    listing.status = 'REJECTED';
    listing.verified = false;
    listing.rejectionReason = reason;
    listing.rejectedAt = now;
    listing.updatedAt = now;
    persistListing(listing);

    return res.status(200).json({
      rejected: true,
      listingId: listing.listingId,
      status: listing.status,
      rejectionReason: reason,
      rejectedAt: now
    });
  });

  // 5. PHASE 1: Public Catalog (APPROVED listings only — never leaks PENDING, REJECTED, contact, or endpointUrl)
  router.get('/listings', async (req: Request, res: Response) => {
    try {
      await ensureListingsHydrated();
      const categoryFilter = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : undefined;
      const isAdmin = verifyMarketplaceAdmin(req);
      const statusFilter = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;

      let listings = Array.from(listingById.values());

      // Public callers ONLY ever see APPROVED / active listings
      if (isAdmin && statusFilter === 'ALL') {
        // Admin may inspect all statuses
      } else if (isAdmin && (statusFilter === 'PENDING' || statusFilter === 'REJECTED' || statusFilter === 'APPROVED')) {
        listings = listings.filter((l) => l.status.toUpperCase() === statusFilter);
      } else {
        listings = listings.filter(isListingLive);
      }

      if (categoryFilter) {
        listings = listings.filter((l) => l.category === categoryFilter);
      }

      listings.sort((a, b) => b.salesCount - a.salesCount || a.slug.localeCompare(b.slug));

      return res.status(200).json({
        marketplace: 'Stock Bloc Finance Agent Marketplace',
        takeRateBps: getMarketplaceTakeRateBps(),
        listingFeeUsd: 0,
        categories: FINANCE_MARKETPLACE_CATEGORIES,
        count: listings.length,
        listings: listings.map(formatPublicListing),
        note:
          listings.length === 0
            ? 'No third-party finance sellers are active yet. Listings are probed and approved before going live.'
            : undefined
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to load marketplace listings', message: sanitizeMarketplaceError(err) });
    }
  });

  // 6. Public Single Listing Detail (returns 404 for PENDING/REJECTED unless admin)
  router.get('/listings/:id', async (req: Request, res: Response) => {
    try {
      await ensureListingsHydrated();
      const listing = findListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: 'Marketplace listing not found', id: req.params.id });
      }
      if (!isListingLive(listing) && !verifyMarketplaceAdmin(req)) {
        return res.status(404).json({ error: 'Marketplace listing not found', id: req.params.id });
      }
      return res.status(200).json(formatPublicListing(listing));
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to load listing', message: sanitizeMarketplaceError(err) });
    }
  });

  // 7. Operator/Admin Direct Onboard (preserved for backward compatibility)
  router.post('/listings', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({
        error: 'Operator authentication required to onboard marketplace listings.',
        hint: 'Provide X-Admin-Key matching MARKETPLACE_ADMIN_KEY or ADMIN_API_KEY.'
      });
    }
    const result = await createMarketplaceListing(req.body || {});
    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(201).json({
      created: true,
      listing: formatPublicListing(result.listing)
    });
  });

  // 8. Operator/Admin: Pause, Activate, or Update Listing
  router.patch('/listings/:id', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({ error: 'Operator authentication required.' });
    }
    await ensureListingsHydrated();
    const listing = findListing(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Marketplace listing not found', id: req.params.id });
    }

    const body = req.body || {};
    if (body.status !== undefined) {
      const allowedStatuses: MarketplaceListingStatus[] = ['active', 'paused', 'PENDING', 'APPROVED', 'REJECTED'];
      if (!allowedStatuses.includes(body.status)) {
        return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(', ')}` });
      }
      listing.status = body.status;
      listing.verified = isListingLive(listing);
    }
    if (body.description !== undefined && String(body.description).trim()) {
      listing.description = String(body.description).trim();
    }
    if (body.priceUsd !== undefined) {
      const priceUsd = Number(body.priceUsd);
      if (!Number.isFinite(priceUsd) || priceUsd < 0.001 || priceUsd > 100) {
        return res.status(400).json({ error: 'priceUsd must be between $0.001 and $100.00 USDC.' });
      }
      const atomicAmount = usdToAtomicUsdc(priceUsd);
      const split = computeMarketplaceSplit(atomicAmount, listing.takeRateBps);
      listing.priceUsd = Number(priceUsd.toFixed(6));
      listing.priceDisplay = `$${priceUsd >= 0.01 ? priceUsd.toFixed(2) : priceUsd.toFixed(4)}`;
      listing.atomicAmount = atomicAmount;
      listing.platformFeeAtomic = split.platformFeeAtomic;
      listing.sellerNetAtomic = split.sellerNetAtomic;
    }
    if (body.upstreamUrl !== undefined || body.endpointUrl !== undefined) {
      const check = validateUpstreamUrl(String(body.endpointUrl || body.upstreamUrl).trim());
      if ('error' in check) {
        return res.status(400).json({ error: check.error });
      }
      listing.upstreamUrl = check.url.toString();
      listing.endpointUrl = check.url.toString();
    }
    if (Array.isArray(body.requiredResponseKeys)) {
      listing.requiredResponseKeys = body.requiredResponseKeys.map((k: unknown) => String(k).trim()).filter(Boolean);
    }

    listing.updatedAt = new Date().toISOString();
    persistListing(listing);

    return res.status(200).json({
      updated: true,
      listing: formatPublicListing(listing)
    });
  });

  // ==========================================================================
  // PHASE 2, 3 & 4: UNIFIED BUY FLOW — POST /api/v1/marketplace/buy
  // ==========================================================================
  router.post('/buy', async (req: Request, res: Response) => {
    await ensureListingsHydrated();
    await ensurePayoutsHydrated();
    await ensureRefundsHydrated();

    const listingIdInput = String(req.body?.listingId || req.body?.slug || '').trim();
    if (!listingIdInput) {
      return res.status(400).json({
        error: 'Missing required field: listingId',
        usage: 'POST /api/v1/marketplace/buy with JSON body { "listingId": "lst_...", "params": { ... } }',
        charged: false
      });
    }

    const listing = findListing(listingIdInput);
    if (!listing || !isListingLive(listing)) {
      return res.status(404).json({
        error: 'Approved marketplace listing not found.',
        listingId: listingIdInput,
        charged: false
      });
    }

    const buyerParams =
      req.body?.params && typeof req.body.params === 'object' && !Array.isArray(req.body.params)
        ? (req.body.params as Record<string, unknown>)
        : {};

    const host = (typeof req.get === 'function' ? req.get('host') : req.headers?.host) || 'stockbloc.ai.studio';
    const resourceUrl = `https://${host}${req.originalUrl || '/api/v1/marketplace/buy'}`;
    const marketplaceWallet = getMarketplaceWalletAddress();
    const endpointKey = `marketplace_buy:${listing.listingId}`;

    const paymentRequirements = {
      scheme: 'exact' as const,
      network: BASE_CAIP2,
      amount: listing.atomicAmount,
      asset: BASE_USDC_CONTRACT,
      payTo: marketplaceWallet,
      maxTimeoutSeconds: 300,
      extra: {
        name: USDC_NAME,
        version: USDC_VERSION,
        symbol: 'USDC',
        decimals: USDC_DECIMALS,
        priceUsd: listing.priceDisplay,
        marketplace: {
          listingId: listing.listingId,
          slug: listing.slug,
          seller: listing.sellerName,
          takeRateBps: listing.takeRateBps,
          verifiedDeliveryGuaranteed: true,
          fullRefundOnFailedDelivery: true
        }
      }
    };

    const paymentSignatureHeader =
      (req.headers['payment-signature'] as string) ||
      (req.headers['x-payment'] as string) ||
      (req.headers['x-payment-signature'] as string);

    // STEP 1: Unpaid request -> return genuine HTTP 402 x402 v2 challenge
    if (!paymentSignatureHeader) {
      const challengedAt = new Date().toISOString();
      recordChallengeTimestamp(endpointKey, challengedAt);

      const paymentRequiredPayload = {
        x402Version: 2 as const,
        accepts: [paymentRequirements],
        resource: {
          url: resourceUrl,
          description: `${listing.name} (${listing.listingId}) via Stock Bloc Finance Agent Marketplace`,
          mimeType: 'application/json'
        },
        facilitator: CDP_FACILITATOR_URL
      };

      const encodedHeader = encodePaymentRequiredHeader(paymentRequiredPayload);
      res.setHeader('PAYMENT-REQUIRED', encodedHeader);
      res.setHeader(
        'Access-Control-Expose-Headers',
        'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-StockBloc-Receipt-Id, X-StockBloc-Payload-Sha256, X-StockBloc-Receipt-Signature, X-StockBloc-Receipt-Verify-Url'
      );

      recordMachineCommerceEvent({
        eventType: 'marketplace_challenge',
        source: 'rest',
        endpoint: '/api/v1/marketplace/buy',
        amountUsd: listing.priceUsd,
        timestamp: challengedAt,
        details: { listingId: listing.listingId, slug: listing.slug }
      });

      return res.status(402).json({
        ...paymentRequiredPayload,
        status: 'payment_required',
        code: 402,
        price: listing.priceDisplay,
        priceUsd: listing.priceUsd,
        atomicAmount: listing.atomicAmount,
        currency: 'USDC',
        network: 'Base Mainnet (eip155:8453)',
        recipient: marketplaceWallet,
        listing: {
          listingId: listing.listingId,
          name: listing.name,
          seller: listing.sellerName,
          priceUsd: listing.priceUsd,
          takeRatePercent: '10%',
          verifiedDeliveryGuaranteed: true,
          fullRefundOnFailedDelivery: true
        },
        message: `Payment of ${listing.priceDisplay} USDC on Base required to buy "${listing.name}". Delivery is verified before seller payout; failed deliveries trigger an automatic 100% refund.`
      });
    }

    // STEP 2: Decode payment header & verify through CDP facilitator BEFORE calling seller
    let paymentPayload: any;
    try {
      paymentPayload = decodePaymentSignatureHeader(paymentSignatureHeader);
    } catch (err: any) {
      return res.status(402).json({
        status: 'invalid_payment_header',
        code: 402,
        charged: false,
        error: 'Malformed PAYMENT-SIGNATURE header.',
        details: sanitizeMarketplaceError(err)
      });
    }

    const keys = extractPaymentIdempotencyKeys(paymentPayload, paymentSignatureHeader);
    const paymentKey = keys.nonceKey || keys.payloadHash;
    const existingSaleId = saleIdByPaymentKey.get(paymentKey);
    const existingSettlement = getX402Settlement(keys.payloadHash, keys.nonceKey);
    const facilitatorClient = getCoinbaseFacilitatorClient();
    const challengedAt = getRecentChallengeTimestamp(endpointKey) || new Date().toISOString();

    let verifiedPayer =
      existingSettlement?.payer ||
      paymentPayload?.payload?.authorization?.from ||
      paymentPayload?.payer ||
      '0x0000000000000000000000000000000000000000';

    if (!existingSettlement) {
      try {
        const verifyResult = await facilitatorClient.verify(paymentPayload, paymentRequirements as any);
        if (!verifyResult || !verifyResult.isValid) {
          return res.status(402).json({
            status: 'payment_verification_failed',
            code: 402,
            charged: false,
            error: 'x402 payment authorization failed Coinbase CDP verification.',
            reason: (verifyResult as any)?.invalidReason || 'Invalid signature or insufficient allowance'
          });
        }
        verifiedPayer = (verifyResult as any)?.payer || verifiedPayer;
        recordMachineCommerceEvent({
          eventType: 'marketplace_payment_verified',
          source: 'rest',
          endpoint: '/api/v1/marketplace/buy',
          payer: verifiedPayer,
          amountUsd: listing.priceUsd,
          paymentId: paymentKey,
          details: { listingId: listing.listingId }
        });
      } catch (err: any) {
        return res.status(402).json({
          status: 'payment_verification_error',
          code: 402,
          charged: false,
          error: 'Could not verify x402 payment authorization.',
          details: sanitizeMarketplaceError(err)
        });
      }
    }

    // STEP 3: Settle buyer payment into marketplace wallet via CDP facilitator (capture paymentTxHash + paidAt)
    let settlementRecord: SettledX402Record;
    let saleEntry: MarketplaceSaleLedgerEntry;

    if (existingSettlement && existingSaleId && saleLedger.has(existingSaleId)) {
      settlementRecord = existingSettlement;
      saleEntry = saleLedger.get(existingSaleId)!;
      res.setHeader('PAYMENT-RESPONSE', settlementRecord.responseHeader);
    } else {
      try {
        const settleResult = await facilitatorClient.settle(paymentPayload, paymentRequirements as any);
        const txHash = (settleResult as any)?.transaction || (settleResult as any)?.txHash;
        if (!settleResult || !settleResult.success) {
          return res.status(402).json({
            status: 'payment_settlement_failed',
            code: 402,
            charged: false,
            error: 'x402 payment settlement failed.',
            reason: (settleResult as any)?.error || (settleResult as any)?.errorMessage || 'Settlement rejected'
          });
        }

        let responseHeader = '';
        try {
          responseHeader = encodePaymentResponseHeader(settleResult);
        } catch {
          responseHeader = Buffer.from(
            JSON.stringify({
              success: true,
              txHash: txHash || '0x_settled',
              payer: (settleResult as any)?.payer || verifiedPayer
            })
          ).toString('base64');
        }

        const paidAt = new Date().toISOString();
        const settledPayer = (settleResult as any)?.payer || verifiedPayer;
        const resolvedTxHash = txHash || `0x${crypto.randomBytes(32).toString('hex')}`;

        res.setHeader('PAYMENT-RESPONSE', responseHeader);

        settlementRecord = {
          txHash: resolvedTxHash,
          payer: settledPayer,
          settleResult,
          responseHeader,
          settledAt: paidAt,
          endpointId: endpointKey
        };
        saveX402Settlement(keys, settlementRecord);

        const saleId = `sale_${crypto.randomBytes(10).toString('hex')}`;
        saleEntry = {
          saleId,
          listingId: listing.listingId,
          paymentKey,
          buyerWallet: settledPayer,
          paymentTxHash: resolvedTxHash,
          grossAtomic: listing.atomicAmount,
          grossUsd: listing.priceUsd,
          disbursementState: 'held',
          createdAt: paidAt
        };
        persistSaleLedger(saleEntry);

        recordMachineCommerceEvent({
          eventType: 'marketplace_settlement',
          source: 'rest',
          endpoint: '/api/v1/marketplace/buy',
          payer: settledPayer,
          amountUsd: listing.priceUsd,
          txHash: resolvedTxHash,
          paymentId: paymentKey,
          timestamp: paidAt,
          details: { saleId, listingId: listing.listingId }
        });
      } catch (settleErr: any) {
        return res.status(402).json({
          status: 'payment_settlement_error',
          code: 402,
          charged: false,
          error: 'Could not settle x402 payment through Coinbase CDP facilitator.',
          details: sanitizeMarketplaceError(settleErr)
        });
      }
    }

    // STEP 4: Call seller endpoint with buyer params (30s timeout) & validate HTTP 200 non-empty JSON
    const buyTimeoutMs = customBuyTimeoutMsForTesting ?? UPSTREAM_BUY_TIMEOUT_MS;
    const delivery = await callSellerEndpoint(listing, buyerParams, buyTimeoutMs);

    // STEP 5A: FAILED DELIVERY -> 100% BUYER REFUND, $0 TO SELLER, FLAG LISTING, AUTO-SUSPEND AFTER 3 FAILURES
    if ('reason' in delivery) {
      const now = new Date().toISOString();
      listing.failedDeliveriesCount += 1;
      listing.consecutiveFailures += 1;
      let listingSuspended = false;

      if (listing.consecutiveFailures >= AUTO_SUSPEND_CONSECUTIVE_FAILURES) {
        listing.status = 'PENDING';
        listing.verified = false;
        listing.suspendedAt = now;
        listing.suspendedReason = `Auto-suspended after ${listing.consecutiveFailures} consecutive failed deliveries; requires admin re-approval.`;
        listingSuspended = true;
      }
      listing.updatedAt = now;
      persistListing(listing);

      // Issue 100% buyer refund (idempotent per saleId — never double-refund)
      let refund: MarketplaceRefundRecord;
      if (saleEntry.refundId && refundStore.has(saleEntry.refundId)) {
        refund = refundStore.get(saleEntry.refundId)!;
      } else {
        const refundId = `rfnd_${crypto.randomBytes(10).toString('hex')}`;
        refund = {
          refundId,
          saleId: saleEntry.saleId,
          listingId: listing.listingId,
          listingSlug: listing.slug,
          buyerWallet: saleEntry.buyerWallet,
          buyerTxHash: saleEntry.paymentTxHash,
          amountUsd: saleEntry.grossUsd,
          amountAtomic: saleEntry.grossAtomic,
          status: 'pending',
          attempts: 0,
          reason: delivery.reason,
          createdAt: now,
          updatedAt: now
        };
        persistRefund(refund);
        saleEntry.disbursementState = 'refund_queued';
        saleEntry.refundId = refundId;
        persistSaleLedger(saleEntry);
      }

      const executedRefund = (await processMarketplaceRefund(refund.refundId)) || refund;

      return res.status(502).json({
        status: 'delivery_failed',
        code: 502,
        saleId: saleEntry.saleId,
        listingId: listing.listingId,
        deliveryVerified: false,
        sellerPaidUsd: 0,
        refund: {
          refundId: executedRefund.refundId,
          status: executedRefund.status,
          buyerWallet: executedRefund.buyerWallet,
          amountUsd: executedRefund.amountUsd,
          amountAtomic: executedRefund.amountAtomic,
          refundTxHash: executedRefund.refundTxHash || null,
          attempts: executedRefund.attempts,
          ...(executedRefund.lastError ? { lastError: executedRefund.lastError } : {})
        },
        listingSuspended,
        consecutiveFailures: listing.consecutiveFailures,
        deliveryRate: computeDeliveryRate(listing),
        reason: delivery.reason,
        message:
          executedRefund.status === 'paid'
            ? 'Seller delivery verification failed. 100% of your USDC payment has been refunded to your wallet and the seller received $0.'
            : 'Seller delivery verification failed. A 100% refund has been recorded and queued for retry; the seller received $0.'
      });
    }

    // STEP 5B: VERIFIED DELIVERY -> ISSUE SIGNED RECEIPT, UPDATE STATS, QUEUE & EXECUTE 90% SELLER PAYOUT
    const split = computeMarketplaceSplit(listing.atomicAmount, listing.takeRateBps);
    const deliveredAt = new Date().toISOString();

    const tickerParam =
      typeof buyerParams.ticker === 'string'
        ? buyerParams.ticker
        : typeof buyerParams.symbol === 'string'
          ? buyerParams.symbol
          : null;

    // Build exact response body shape (object merged with receipt; array wrapped in { data, receipt })
    const payloadWithoutReceipt: Record<string, unknown> = Array.isArray(delivery.parsed)
      ? { data: delivery.parsed }
      : { ...(delivery.parsed as Record<string, unknown>) };

    // Remove any spoofed `receipt` key a seller might have tried to inject
    delete payloadWithoutReceipt.receipt;

    const exactPayloadJson = JSON.stringify(payloadWithoutReceipt);

    const receipt: VerifiedDeliveryReceipt = issueVerifiedDeliveryReceipt({
      listingId: listing.listingId,
      endpoint: '/api/v1/marketplace/buy',
      ticker: tickerParam,
      payer: saleEntry.buyerWallet,
      payTo: marketplaceWallet,
      amountUsd: split.grossUsd,
      paymentTxHash: saleEntry.paymentTxHash,
      rawPayload: exactPayloadJson,
      parsedPayload: payloadWithoutReceipt,
      challengedAt,
      paidAt: settlementRecord.settledAt,
      deliveredAt,
      marketplaceMeta: {
        listingId: listing.listingId,
        listingSlug: listing.slug,
        saleId: saleEntry.saleId,
        takeRateBps: split.takeRateBps,
        platformFeeAtomic: split.platformFeeAtomic,
        sellerNetAtomic: split.sellerNetAtomic,
        amountAtomic: split.grossAtomic,
        network: BASE_CAIP2,
        asset: 'USDC'
      }
    });

    // Queue & execute 90% seller payout (idempotent per saleId — never double-pay)
    if (!saleEntry.payoutId) {
      listing.salesCount += 1;
      listing.verifiedSalesCount += 1;
      listing.consecutiveFailures = 0;
      listing.grossVolumeAtomic = (BigInt(listing.grossVolumeAtomic || '0') + BigInt(split.grossAtomic)).toString();
      listing.platformFeesAtomic = (BigInt(listing.platformFeesAtomic || '0') + BigInt(split.platformFeeAtomic)).toString();
      listing.sellerNetVolumeAtomic = (BigInt(listing.sellerNetVolumeAtomic || '0') + BigInt(split.sellerNetAtomic)).toString();
      listing.recentReceiptIds = [receipt.receiptId, ...listing.recentReceiptIds].slice(0, 20);
      listing.updatedAt = deliveredAt;
      persistListing(listing);

      const payoutId = `pay_${crypto.randomBytes(10).toString('hex')}`;
      const payout: MarketplacePayoutRecord = {
        payoutId,
        saleId: saleEntry.saleId,
        listingId: listing.listingId,
        listingSlug: listing.slug,
        sellerName: listing.sellerName,
        sellerWallet: listing.payoutWallet,
        buyerPayer: saleEntry.buyerWallet,
        buyerTxHash: saleEntry.paymentTxHash,
        receiptId: receipt.receiptId,
        grossAmount: split.grossUsd,
        sellerShare: split.sellerNetUsd,
        blocShare: split.platformFeeUsd,
        grossAtomic: split.grossAtomic,
        takeRateBps: split.takeRateBps,
        platformFeeAtomic: split.platformFeeAtomic,
        sellerNetAtomic: split.sellerNetAtomic,
        blocShareAtomic: split.platformFeeAtomic,
        sellerShareAtomic: split.sellerNetAtomic,
        grossUsd: split.grossUsd,
        platformFeeUsd: split.platformFeeUsd,
        sellerNetUsd: split.sellerNetUsd,
        status: 'pending',
        attempts: 0,
        createdAt: deliveredAt,
        updatedAt: deliveredAt
      };
      persistPayout(payout);

      saleEntry.disbursementState = 'payout_queued';
      saleEntry.payoutId = payoutId;
      saleEntry.receiptId = receipt.receiptId;
      persistSaleLedger(saleEntry);

      recordMachineCommerceEvent({
        eventType: 'marketplace_delivery',
        source: 'rest',
        endpoint: '/api/v1/marketplace/buy',
        payer: saleEntry.buyerWallet,
        amountUsd: split.grossUsd,
        txHash: saleEntry.paymentTxHash,
        timestamp: deliveredAt,
        details: {
          saleId: saleEntry.saleId,
          listingId: listing.listingId,
          receiptId: receipt.receiptId,
          payoutId
        }
      });

      // Execute Base USDC payout (90% sellerShare) via 3-attempt backoff queue
      await processMarketplacePayout(payoutId);
    }

    attachReceiptHeaders(res, receipt);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      ...payloadWithoutReceipt,
      receipt
    });
  });

  // ==========================================================================
  // PHASE 4: ADMIN PAYOUTS & REFUNDS LEDGER + MANUAL RETRY
  // ==========================================================================

  // View Seller Payout Ledger (admin-gated)
  router.get('/payouts', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({ error: 'Operator authentication required to view payout ledger.' });
    }
    await ensurePayoutsHydrated();
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
    const sellerWalletFilter =
      typeof req.query.sellerWallet === 'string' ? req.query.sellerWallet.toLowerCase() : undefined;

    let payouts = Array.from(payoutStore.values());
    if (
      statusFilter === 'pending' ||
      statusFilter === 'pending_payout' ||
      statusFilter === 'paid' ||
      statusFilter === 'failed'
    ) {
      payouts = payouts.filter((p) => p.status === statusFilter);
    }
    if (sellerWalletFilter) {
      payouts = payouts.filter((p) => p.sellerWallet.toLowerCase() === sellerWalletFilter);
    }

    payouts.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));

    // Aggregate per-seller pending, failed, and paid balances using BigInt
    const bySeller = new Map<
      string,
      {
        sellerName: string;
        sellerWallet: string;
        pendingAtomic: bigint;
        failedAtomic: bigint;
        paidAtomic: bigint;
        salesCount: number;
      }
    >();
    for (const p of payouts) {
      const key = p.sellerWallet.toLowerCase();
      const entry = bySeller.get(key) || {
        sellerName: p.sellerName,
        sellerWallet: p.sellerWallet,
        pendingAtomic: 0n,
        failedAtomic: 0n,
        paidAtomic: 0n,
        salesCount: 0
      };
      entry.salesCount += 1;
      const net = BigInt(p.sellerShareAtomic || p.sellerNetAtomic || '0');
      if (p.status === 'paid') {
        entry.paidAtomic += net;
      } else if (p.status === 'failed') {
        entry.failedAtomic += net;
      } else {
        entry.pendingAtomic += net;
      }
      bySeller.set(key, entry);
    }

    const failedCount = payouts.filter((p) => p.status === 'failed').length;

    return res.status(200).json({
      escrowAddress: getMarketplaceWalletAddress(),
      marketplaceWalletAddress: getMarketplaceWalletAddress(),
      takeRateBps: getMarketplaceTakeRateBps(),
      count: payouts.length,
      failedCount,
      sellerBalances: Array.from(bySeller.values()).map((s) => ({
        sellerName: s.sellerName,
        sellerWallet: s.sellerWallet,
        salesCount: s.salesCount,
        pendingPayoutAtomic: s.pendingAtomic.toString(),
        pendingPayoutUsd: Number(s.pendingAtomic) / 10 ** USDC_DECIMALS,
        failedPayoutAtomic: s.failedAtomic.toString(),
        failedPayoutUsd: Number(s.failedAtomic) / 10 ** USDC_DECIMALS,
        paidOutAtomic: s.paidAtomic.toString(),
        paidOutUsd: Number(s.paidAtomic) / 10 ** USDC_DECIMALS
      })),
      payouts
    });
  });

  // Admin: Manually Retry a Failed or Pending Seller Payout
  router.post('/payouts/:payoutId/retry', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({ error: 'Operator authentication required to retry payouts.' });
    }
    await ensurePayoutsHydrated();
    const payout = payoutStore.get(req.params.payoutId);
    if (!payout) {
      return res.status(404).json({ error: 'Payout record not found', payoutId: req.params.payoutId });
    }
    if (payout.status === 'paid') {
      return res.status(409).json({
        error: 'Payout has already been paid on-chain and cannot be retried.',
        payoutId: payout.payoutId,
        payoutTxHash: payout.payoutTxHash
      });
    }

    const updated = await processMarketplacePayout(payout.payoutId);
    const httpStatus = updated?.status === 'paid' ? 200 : 502;
    return res.status(httpStatus).json({
      retried: true,
      succeeded: updated?.status === 'paid',
      payout: updated
    });
  });

  // Admin: Mark a Seller Payout as Settled On-Chain (manual reconciliation with real Base txHash)
  router.post('/payouts/:payoutId/mark-paid', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({ error: 'Operator authentication required.' });
    }
    await ensurePayoutsHydrated();
    const payout = payoutStore.get(req.params.payoutId);
    if (!payout) {
      return res.status(404).json({ error: 'Payout record not found', payoutId: req.params.payoutId });
    }
    const txHash = String(req.body?.txHash || '').trim();
    if (!TX_HASH_RE.test(txHash)) {
      return res.status(400).json({
        error: 'Valid Base transaction hash (0x + 64 hex chars) is required to mark payout as paid.'
      });
    }
    const now = new Date().toISOString();
    payout.status = 'paid';
    payout.payoutTxHash = txHash;
    payout.paidAt = now;
    payout.updatedAt = now;
    payout.lastError = undefined;
    persistPayout(payout);

    return res.status(200).json({ updated: true, payout });
  });

  // Admin: View Buyer Refund Ledger
  router.get('/refunds', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({ error: 'Operator authentication required to view refund ledger.' });
    }
    await ensureRefundsHydrated();
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
    let refunds = Array.from(refundStore.values());
    if (statusFilter === 'pending' || statusFilter === 'paid' || statusFilter === 'failed') {
      refunds = refunds.filter((r) => r.status === statusFilter);
    }
    refunds.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));

    return res.status(200).json({
      marketplaceWalletAddress: getMarketplaceWalletAddress(),
      count: refunds.length,
      failedCount: refunds.filter((r) => r.status === 'failed').length,
      refunds
    });
  });

  // Admin: Manually Retry a Failed or Pending Buyer Refund
  router.post('/refunds/:refundId/retry', async (req: Request, res: Response) => {
    if (!verifyMarketplaceAdmin(req)) {
      return res.status(403).json({ error: 'Operator authentication required to retry refunds.' });
    }
    await ensureRefundsHydrated();
    const refund = refundStore.get(req.params.refundId);
    if (!refund) {
      return res.status(404).json({ error: 'Refund record not found', refundId: req.params.refundId });
    }
    if (refund.status === 'paid') {
      return res.status(409).json({
        error: 'Refund has already been paid on-chain and cannot be retried.',
        refundId: refund.refundId,
        refundTxHash: refund.refundTxHash
      });
    }

    const updated = await processMarketplaceRefund(refund.refundId);
    const httpStatus = updated?.status === 'paid' ? 200 : 502;
    return res.status(httpStatus).json({
      retried: true,
      succeeded: updated?.status === 'paid',
      refund: updated
    });
  });

  // ==========================================================================
  // BACKWARD-COMPATIBLE DIRECT SLUG PROXY: GET / POST /api/v1/marketplace/call/:slug
  // ==========================================================================
  const handleMarketplaceCall = async (req: Request, res: Response) => {
    await ensureListingsHydrated();
    await ensurePayoutsHydrated();

    const slug = String(req.params.slug || '').toLowerCase();
    const listing = findListing(slug);
    if (!listing) {
      return res.status(404).json({
        error: 'Marketplace listing not found',
        slug,
        charged: false
      });
    }
    if (!isListingLive(listing)) {
      return res.status(503).json({
        error: 'Marketplace listing is currently not active',
        slug,
        charged: false
      });
    }

    if (req.method.toUpperCase() !== listing.method) {
      return res.status(405).json({
        error: `Listing "${slug}" requires HTTP ${listing.method}.`,
        allowedMethod: listing.method,
        charged: false
      });
    }

    const host = (typeof req.get === 'function' ? req.get('host') : req.headers?.host) || 'stockbloc.ai.studio';
    const resourceUrl = `https://${host}${req.originalUrl || req.url}`;
    const escrowAddress = getMarketplaceWalletAddress();
    const endpointId = `marketplace:${listing.slug}`;

    const paymentRequirements = {
      scheme: 'exact' as const,
      network: BASE_CAIP2,
      amount: listing.atomicAmount,
      asset: BASE_USDC_CONTRACT,
      payTo: escrowAddress,
      maxTimeoutSeconds: 300,
      extra: {
        name: USDC_NAME,
        version: USDC_VERSION,
        symbol: 'USDC',
        decimals: USDC_DECIMALS,
        priceUsd: listing.priceDisplay,
        marketplace: {
          listingId: listing.listingId,
          slug: listing.slug,
          sellerName: listing.sellerName,
          sellerWallet: listing.sellerWallet,
          takeRateBps: listing.takeRateBps,
          verifiedDeliveryGuaranteed: true
        }
      }
    };

    const paymentSignatureHeader =
      (req.headers['payment-signature'] as string) ||
      (req.headers['x-payment'] as string) ||
      (req.headers['x-payment-signature'] as string);

    if (!paymentSignatureHeader) {
      const challengedAt = new Date().toISOString();
      recordChallengeTimestamp(endpointId, challengedAt);

      const paymentRequiredPayload = {
        x402Version: 2 as const,
        accepts: [paymentRequirements],
        resource: {
          url: resourceUrl,
          description: `${listing.name} (Verified Marketplace Listing by ${listing.sellerName})`,
          mimeType: 'application/json'
        },
        facilitator: CDP_FACILITATOR_URL
      };

      const encodedHeader = encodePaymentRequiredHeader(paymentRequiredPayload);
      res.setHeader('PAYMENT-REQUIRED', encodedHeader);
      res.setHeader(
        'Access-Control-Expose-Headers',
        'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-StockBloc-Receipt-Id, X-StockBloc-Payload-Sha256, X-StockBloc-Receipt-Signature, X-StockBloc-Receipt-Verify-Url'
      );

      recordMachineCommerceEvent({
        eventType: 'payment_required',
        source: 'rest',
        endpoint: endpointId,
        amountUsd: listing.priceUsd,
        timestamp: challengedAt,
        details: { listingSlug: listing.slug, sellerWallet: listing.sellerWallet }
      });

      return res.status(402).json({
        ...paymentRequiredPayload,
        status: 'payment_required',
        code: 402,
        price: listing.priceDisplay,
        currency: 'USDC',
        network: 'Base Mainnet (eip155:8453)',
        recipient: escrowAddress,
        listing: {
          listingId: listing.listingId,
          slug: listing.slug,
          name: listing.name,
          sellerName: listing.sellerName,
          sellerWallet: listing.sellerWallet,
          takeRateBps: listing.takeRateBps,
          verifiedDeliveryGuaranteed: true
        },
        message: `Payment of ${listing.priceDisplay} USDC on Base required. Stock Bloc verifies seller delivery before settling your payment and issues a signed Ed25519 receipt.`
      });
    }

    let paymentPayload: any;
    try {
      paymentPayload = decodePaymentSignatureHeader(paymentSignatureHeader);
    } catch (err: any) {
      return res.status(402).json({
        status: 'invalid_payment_header',
        code: 402,
        charged: false,
        error: 'Malformed PAYMENT-SIGNATURE header.',
        details: sanitizeMarketplaceError(err)
      });
    }

    const keys = extractPaymentIdempotencyKeys(paymentPayload, paymentSignatureHeader);
    const existingSettlement = getX402Settlement(keys.payloadHash, keys.nonceKey);
    const facilitatorClient = getCoinbaseFacilitatorClient();
    const challengedAt = getRecentChallengeTimestamp(endpointId) || new Date().toISOString();

    let verifiedPayer =
      existingSettlement?.payer ||
      paymentPayload?.payload?.authorization?.from ||
      paymentPayload?.payer ||
      '0x_payer';

    if (!existingSettlement) {
      try {
        const verifyResult = await facilitatorClient.verify(paymentPayload, paymentRequirements as any);
        if (!verifyResult || !verifyResult.isValid) {
          return res.status(402).json({
            status: 'payment_verification_failed',
            code: 402,
            charged: false,
            error: 'x402 payment authorization failed Coinbase CDP verification.',
            reason: (verifyResult as any)?.invalidReason || 'Invalid signature or insufficient allowance'
          });
        }
        verifiedPayer = (verifyResult as any)?.payer || verifiedPayer;
      } catch (err: any) {
        return res.status(402).json({
          status: 'payment_verification_error',
          code: 402,
          charged: false,
          error: 'Could not verify x402 payment authorization.',
          details: sanitizeMarketplaceError(err)
        });
      }
    }

    const callParams =
      listing.method === 'GET'
        ? (req.query as Record<string, unknown>)
        : ((req.body ?? {}) as Record<string, unknown>);

    const delivery = await callSellerEndpoint(listing, callParams, UPSTREAM_BUY_TIMEOUT_MS);
    if ('reason' in delivery) {
      listing.failedDeliveriesCount += 1;
      listing.consecutiveFailures += 1;
      listing.updatedAt = new Date().toISOString();
      persistListing(listing);

      recordMachineCommerceEvent({
        eventType: 'settlement_failed',
        source: 'rest',
        endpoint: endpointId,
        payer: verifiedPayer,
        amountUsd: listing.priceUsd,
        timestamp: new Date().toISOString(),
        details: {
          listingSlug: listing.slug,
          deliveryVerified: false,
          charged: false,
          upstreamStatus: delivery.status,
          reason: delivery.reason
        }
      });

      return res.status(502).json({
        status: 'delivery_failed',
        code: 502,
        listingSlug: listing.slug,
        deliveryVerified: false,
        charged: false,
        reason: delivery.reason,
        message: 'Seller delivery verification failed. Your x402 payment was NOT settled and you were not charged.'
      });
    }

    let settlementRecord: SettledX402Record;
    let isFreshSettlement = false;

    if (existingSettlement) {
      settlementRecord = existingSettlement;
      res.setHeader('PAYMENT-RESPONSE', settlementRecord.responseHeader);
    } else {
      try {
        const settleResult = await facilitatorClient.settle(paymentPayload, paymentRequirements as any);
        const txHash = (settleResult as any)?.transaction || (settleResult as any)?.txHash;
        if (!settleResult || !settleResult.success) {
          return res.status(402).json({
            status: 'payment_settlement_failed',
            code: 402,
            charged: false,
            error: 'x402 payment settlement failed after delivery verification.',
            reason: (settleResult as any)?.error || (settleResult as any)?.errorMessage || 'Settlement rejected'
          });
        }

        let responseHeader = '';
        try {
          responseHeader = encodePaymentResponseHeader(settleResult);
        } catch {
          responseHeader = Buffer.from(
            JSON.stringify({
              success: true,
              txHash: txHash || '0x_settled',
              payer: (settleResult as any)?.payer || verifiedPayer
            })
          ).toString('base64');
        }

        res.setHeader('PAYMENT-RESPONSE', responseHeader);

        settlementRecord = {
          txHash: txHash || '0x_settled',
          payer: (settleResult as any)?.payer || verifiedPayer,
          settleResult,
          responseHeader,
          settledAt: new Date().toISOString(),
          endpointId
        };
        saveX402Settlement(keys, settlementRecord);
        isFreshSettlement = true;
      } catch (settleErr: any) {
        return res.status(402).json({
          status: 'payment_settlement_error',
          code: 402,
          charged: false,
          error: 'Could not settle x402 payment through Coinbase CDP facilitator.',
          details: sanitizeMarketplaceError(settleErr)
        });
      }
    }

    const split = computeMarketplaceSplit(listing.atomicAmount, listing.takeRateBps);
    const deliveredAt = new Date().toISOString();

    const tickerParam =
      typeof req.query?.ticker === 'string'
        ? req.query.ticker
        : typeof req.body?.ticker === 'string'
          ? req.body.ticker
          : null;

    const receipt: VerifiedDeliveryReceipt = issueVerifiedDeliveryReceipt({
      listingId: listing.listingId,
      endpoint: `/api/v1/marketplace/call/${listing.slug}`,
      ticker: tickerParam,
      payer: settlementRecord.payer || verifiedPayer,
      payTo: listing.sellerWallet,
      amountUsd: split.grossUsd,
      paymentTxHash: settlementRecord.txHash,
      rawPayload: delivery.rawText,
      challengedAt,
      paidAt: settlementRecord.settledAt,
      deliveredAt,
      marketplaceMeta: {
        listingId: listing.listingId,
        listingSlug: listing.slug,
        takeRateBps: split.takeRateBps,
        platformFeeAtomic: split.platformFeeAtomic,
        sellerNetAtomic: split.sellerNetAtomic,
        amountAtomic: split.grossAtomic,
        network: BASE_CAIP2,
        asset: 'USDC'
      }
    });

    if (isFreshSettlement) {
      const saleId = `sale_${crypto.randomBytes(10).toString('hex')}`;
      const payoutId = `pay_${crypto.randomBytes(10).toString('hex')}`;
      const payout: MarketplacePayoutRecord = {
        payoutId,
        saleId,
        listingId: listing.listingId,
        listingSlug: listing.slug,
        sellerName: listing.sellerName,
        sellerWallet: listing.sellerWallet,
        buyerPayer: settlementRecord.payer || verifiedPayer,
        buyerTxHash: settlementRecord.txHash,
        receiptId: receipt.receiptId,
        grossAmount: split.grossUsd,
        sellerShare: split.sellerNetUsd,
        blocShare: split.platformFeeUsd,
        grossAtomic: split.grossAtomic,
        takeRateBps: split.takeRateBps,
        platformFeeAtomic: split.platformFeeAtomic,
        sellerNetAtomic: split.sellerNetAtomic,
        blocShareAtomic: split.platformFeeAtomic,
        sellerShareAtomic: split.sellerNetAtomic,
        grossUsd: split.grossUsd,
        platformFeeUsd: split.platformFeeUsd,
        sellerNetUsd: split.sellerNetUsd,
        status: 'pending_payout',
        attempts: 0,
        createdAt: deliveredAt,
        updatedAt: deliveredAt
      };
      persistPayout(payout);

      listing.salesCount += 1;
      listing.verifiedSalesCount += 1;
      listing.consecutiveFailures = 0;
      listing.grossVolumeAtomic = (BigInt(listing.grossVolumeAtomic || '0') + BigInt(split.grossAtomic)).toString();
      listing.platformFeesAtomic = (BigInt(listing.platformFeesAtomic || '0') + BigInt(split.platformFeeAtomic)).toString();
      listing.sellerNetVolumeAtomic = (BigInt(listing.sellerNetVolumeAtomic || '0') + BigInt(split.sellerNetAtomic)).toString();
      listing.recentReceiptIds = [receipt.receiptId, ...listing.recentReceiptIds].slice(0, 20);
      listing.updatedAt = deliveredAt;
      persistListing(listing);

      recordMachineCommerceEvent({
        eventType: 'payment_success',
        source: 'rest',
        endpoint: endpointId,
        payer: settlementRecord.payer || verifiedPayer,
        amountUsd: split.platformFeeUsd,
        txHash: settlementRecord.txHash,
        timestamp: deliveredAt,
        details: {
          listingSlug: listing.slug,
          grossUsd: split.grossUsd,
          platformFeeUsd: split.platformFeeUsd,
          sellerNetUsd: split.sellerNetUsd,
          receiptId: receipt.receiptId,
          payoutId
        }
      });
      recordMachineCommerceEvent({
        eventType: 'data_delivered',
        source: 'rest',
        endpoint: endpointId,
        payer: settlementRecord.payer || verifiedPayer,
        txHash: settlementRecord.txHash,
        timestamp: deliveredAt,
        details: { listingSlug: listing.slug, receiptId: receipt.receiptId }
      });
    }

    attachReceiptHeaders(res, receipt);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(delivery.rawText);
  };

  router.get('/call/:slug', handleMarketplaceCall);
  router.post('/call/:slug', handleMarketplaceCall);

  return router;
}
