/**
 * Stock Bloc Verified Delivery Receipts Service (Trust Layer for Every Paid Call)
 *
 * Every settled x402 call across Stock Bloc's priced endpoints and marketplace rail
 * receives an Ed25519-signed delivery receipt binding payment to the exact JSON payload
 * delivered:
 *
 *   {
 *     "receiptId": "rcpt_...",
 *     "endpoint": "/api/v1/sec/analyst",
 *     "ticker": "AAPL",
 *     "payer": "0x...",
 *     "payTo": "0x6A6f526d8686D0c9edEfc65252e720bFa5eA5708",
 *     "amountUsd": 0.05,
 *     "paymentTxHash": "0x...",
 *     "payloadHash": "<sha256 of the exact JSON payload delivered>",
 *     "challengedAt": "ISO timestamp of the 402",
 *     "paidAt": "ISO timestamp of verified payment",
 *     "deliveredAt": "ISO timestamp of delivery",
 *     "signature": "Ed25519 signature over canonical JSON of receipt fields"
 *   }
 *
 * Public key published at /.well-known/receipts-pubkey.json (alias /.well-known/receipt-key.json).
 * Private signing key lives only in server secrets / private local key store and is never exposed.
 * Receipts persist in Firestore (`verified_delivery_receipts`) for after-the-fact verification.
 * Privacy guarantee: never stores payer identity beyond the wallet address in the payment.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { db } from './firebaseAdmin.js';

export const RECEIPT_VERSION = '1.0' as const;
export const RECEIPT_ALGORITHM = 'Ed25519' as const;
export const RECEIPT_ISSUER = 'Stock Bloc' as const;
export const RECEIPT_VERIFY_BASE_URL = 'https://stockbloc.ai.studio/api/v1/receipts';
export const RECEIPT_PUBKEY_URL = 'https://stockbloc.ai.studio/.well-known/receipts-pubkey.json';

export interface UnsignedVerifiedDeliveryReceipt {
  receiptId: string;
  listingId?: string;
  endpoint: string;
  ticker: string | null;
  payer: string;
  payTo: string;
  amountUsd: number;
  paymentTxHash: string;
  payloadHash: string;
  challengedAt: string;
  paidAt: string;
  deliveredAt: string;
}

export interface VerifiedDeliveryReceipt extends UnsignedVerifiedDeliveryReceipt {
  signature: string;
}

export interface StoredReceiptRecord {
  receiptId: string;
  keyId: string;
  receipt: VerifiedDeliveryReceipt;
  canonicalPayloadHash?: string;
  recordedPayloadHash: string;
  recordedPayloadJson?: string;
  payloadBytes: number;
  marketplaceMeta?: {
    listingId?: string;
    listingSlug?: string;
    saleId?: string;
    takeRateBps?: number;
    platformFeeAtomic?: string;
    sellerNetAtomic?: string;
    amountAtomic?: string;
    network?: string;
    asset?: string;
  };
  createdAt: string;
}

export interface IssueReceiptInput {
  listingId?: string;
  endpoint: string;
  ticker?: string | null;
  payer: string;
  payTo: string;
  amountUsd: number;
  paymentTxHash: string;
  /** Raw JSON string (or Buffer) of the delivered payload WITHOUT the `receipt` field */
  rawPayload: string | Buffer;
  /** Optional pre-parsed payload object to also compute canonical sorted-key SHA-256 */
  parsedPayload?: unknown;
  challengedAt?: string;
  paidAt?: string;
  deliveredAt?: string;
  marketplaceMeta?: StoredReceiptRecord['marketplaceMeta'];
}

export interface PublicReceiptKeyInfo {
  keyId: string;
  issuer: typeof RECEIPT_ISSUER;
  algorithm: typeof RECEIPT_ALGORITHM;
  canonicalization: string;
  publicKeyPem: string;
  jwk: JsonWebKey;
  verifyEndpoint: string;
}

export interface VerifyReceiptResult {
  verified: boolean;
  receiptId: string | null;
  keyId: string | null;
  signatureValid: boolean;
  payloadChecked: boolean;
  payloadHashMatches: boolean | null;
  payloadMatches: boolean | null;
  payloadComparisonMode: 'exact_json' | 'canonical_json' | 'stored_record' | 'none';
  expectedPayloadHash: string | null;
  expectedPayloadSha256: string | null;
  actualPayloadHash: string | null;
  actualPayloadSha256: string | null;
  receipt?: VerifiedDeliveryReceipt;
  publicKeyUrl: string;
  reason?: string;
}

// ============================================================================
// CANONICAL JSON & SHA-256 HELPERS
// ============================================================================

function canonicalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const v = (value as Record<string, unknown>)[key];
    if (v !== undefined) {
      sorted[key] = canonicalizeValue(v);
    }
  }
  return sorted;
}

/**
 * Deterministic canonical JSON: recursively sorted object keys, zero extra whitespace.
 */
export function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalizeValue(value));
}

export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function stripReceiptFromPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'receipt' in (payload as Record<string, unknown>)) {
    const { receipt: _r, ...rest } = payload as Record<string, unknown>;
    return rest;
  }
  return payload;
}

export function hashDeliveredPayload(rawPayload: string | Buffer, parsedPayload?: unknown): {
  payloadHash: string;
  canonicalPayloadHash?: string;
  payloadBytes: number;
  serializedText: string;
} {
  const buf = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(rawPayload, 'utf8');
  const serializedText = buf.toString('utf8');
  const payloadHash = sha256Hex(buf);

  let canonicalPayloadHash: string | undefined;
  try {
    const obj = parsedPayload !== undefined ? parsedPayload : JSON.parse(serializedText);
    canonicalPayloadHash = sha256Hex(canonicalJsonStringify(stripReceiptFromPayload(obj)));
  } catch {
    // Non-JSON payload
  }

  return {
    payloadHash,
    canonicalPayloadHash,
    payloadBytes: buf.byteLength,
    serializedText
  };
}

// ============================================================================
// ED25519 KEYPAIR MANAGEMENT (PRIVATE KEY NEVER IN REPO OR RESPONSES)
// ============================================================================

interface SigningKeyMaterial {
  keyId: string;
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
  publicKeyPem: string;
  jwk: JsonWebKey;
}

let cachedKeyMaterial: SigningKeyMaterial | null = null;

function getKeyFilePath(): string {
  const dataDir = process.env.SB_DATA_DIR || path.resolve(process.cwd(), 'server', 'data');
  return path.join(dataDir, 'receipt_signing_key.json');
}

function buildKeyMaterial(privateKey: crypto.KeyObject, publicKey: crypto.KeyObject): SigningKeyMaterial {
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const jwk = publicKey.export({ format: 'jwk' }) as JsonWebKey;
  const fingerprint = crypto
    .createHash('sha256')
    .update(publicKey.export({ type: 'spki', format: 'der' }))
    .digest('hex')
    .slice(0, 16);
  const keyId = `sb_ed25519_${fingerprint}`;
  return {
    keyId,
    privateKey,
    publicKey,
    publicKeyPem,
    jwk: {
      ...jwk,
      kid: keyId,
      use: 'sig',
      alg: 'EdDSA'
    } as JsonWebKey
  };
}

function loadOrCreateSigningKey(): SigningKeyMaterial {
  if (cachedKeyMaterial) return cachedKeyMaterial;

  // 1. Explicit env secret (RECEIPT_SIGNING_PRIVATE_KEY PEM)
  const envPrivatePem = process.env.RECEIPT_SIGNING_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (envPrivatePem) {
    try {
      const privateKey = crypto.createPrivateKey(envPrivatePem);
      const publicKey = crypto.createPublicKey(privateKey);
      cachedKeyMaterial = buildKeyMaterial(privateKey, publicKey);
      return cachedKeyMaterial;
    } catch (err: any) {
      console.warn('[VerifiedReceipts] Invalid RECEIPT_SIGNING_PRIVATE_KEY env var, falling back to persisted key:', err?.message);
    }
  }

  // 2. Persisted private key outside repo/public (in server/data/, gitignored, chmod 0600)
  const keyFile = getKeyFilePath();
  try {
    if (fs.existsSync(keyFile)) {
      const raw = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
      if (raw?.privateKeyPem) {
        const privateKey = crypto.createPrivateKey(raw.privateKeyPem);
        const publicKey = crypto.createPublicKey(privateKey);
        cachedKeyMaterial = buildKeyMaterial(privateKey, publicKey);
        return cachedKeyMaterial;
      }
    }
  } catch (err: any) {
    console.warn('[VerifiedReceipts] Could not read persisted receipt key, regenerating:', err?.message);
  }

  // 3. Generate fresh Ed25519 keypair and persist with owner-only permissions
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const material = buildKeyMaterial(privateKey, publicKey);

  try {
    fs.mkdirSync(path.dirname(keyFile), { recursive: true });
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    fs.writeFileSync(
      keyFile,
      JSON.stringify(
        {
          keyId: material.keyId,
          algorithm: RECEIPT_ALGORITHM,
          createdAt: new Date().toISOString(),
          privateKeyPem,
          publicKeyPem: material.publicKeyPem
        },
        null,
        2
      ),
      { mode: 0o600 }
    );
  } catch (err: any) {
    console.warn('[VerifiedReceipts] Could not persist receipt signing key (running in-memory):', err?.message);
  }

  cachedKeyMaterial = material;
  return material;
}

export function getPublicReceiptKey(): PublicReceiptKeyInfo {
  const material = loadOrCreateSigningKey();
  return {
    keyId: material.keyId,
    issuer: RECEIPT_ISSUER,
    algorithm: RECEIPT_ALGORITHM,
    canonicalization: 'canonical JSON (sorted keys, no whitespace)',
    publicKeyPem: material.publicKeyPem,
    jwk: material.jwk,
    verifyEndpoint: `${RECEIPT_VERIFY_BASE_URL}/verify`
  };
}

// ============================================================================
// RECEIPT STORAGE (IN-MEMORY + FIRESTORE `verified_delivery_receipts`)
// ============================================================================

const MAX_IN_MEMORY_RECEIPTS = 2000;
const MAX_STORED_PAYLOAD_BYTES = 450 * 1024; // stay safely under Firestore 1 MiB doc limit
const storedRecordById = new Map<string, StoredReceiptRecord>();
const receiptOrder: string[] = [];
let receiptDbIsolatedForTest = false;

const recentChallengeTimestamps = new Map<string, string>();

export function recordChallengeTimestamp(endpointKey: string, timestamp: string = new Date().toISOString()): void {
  recentChallengeTimestamps.set(endpointKey, timestamp);
  if (recentChallengeTimestamps.size > 500) {
    const oldestKey = recentChallengeTimestamps.keys().next().value;
    if (oldestKey) recentChallengeTimestamps.delete(oldestKey);
  }
}

export function getRecentChallengeTimestamp(endpointKey: string): string | undefined {
  return recentChallengeTimestamps.get(endpointKey);
}

export function clearVerifiedReceiptsStore(): void {
  storedRecordById.clear();
  receiptOrder.length = 0;
  recentChallengeTimestamps.clear();
  receiptDbIsolatedForTest = true;
}

function stripSignature(receipt: VerifiedDeliveryReceipt): Record<string, unknown> {
  const { signature: _sig, ...unsigned } = receipt;
  return unsigned;
}

export function issueVerifiedDeliveryReceipt(input: IssueReceiptInput): VerifiedDeliveryReceipt {
  const key = loadOrCreateSigningKey();
  const deliveredAt = input.deliveredAt || new Date().toISOString();
  const paidAt = input.paidAt || deliveredAt;
  const challengedAt =
    input.challengedAt ||
    getRecentChallengeTimestamp(input.endpoint) ||
    paidAt;

  const { payloadHash, canonicalPayloadHash, payloadBytes, serializedText } = hashDeliveredPayload(
    input.rawPayload,
    input.parsedPayload
  );

  const normalizedTicker =
    typeof input.ticker === 'string' && input.ticker.trim().length > 0
      ? input.ticker.trim().toUpperCase()
      : null;

  const receiptId = `rcpt_${crypto.randomBytes(12).toString('hex')}`;
  const unsigned: UnsignedVerifiedDeliveryReceipt = {
    receiptId,
    ...(input.listingId ? { listingId: input.listingId } : {}),
    endpoint: input.endpoint,
    ticker: normalizedTicker,
    payer: input.payer || '0x0000000000000000000000000000000000000000',
    payTo: input.payTo,
    amountUsd: Number(input.amountUsd),
    paymentTxHash: input.paymentTxHash,
    payloadHash,
    challengedAt,
    paidAt,
    deliveredAt
  };

  // Sign canonical JSON (sorted keys, no whitespace) over all receipt fields
  const canonicalMessage = Buffer.from(canonicalJsonStringify(unsigned), 'utf8');
  const signature = crypto.sign(null, canonicalMessage, key.privateKey).toString('base64');

  const signedReceipt: VerifiedDeliveryReceipt = {
    ...unsigned,
    signature
  };

  const storedRecord: StoredReceiptRecord = {
    receiptId,
    keyId: key.keyId,
    receipt: signedReceipt,
    canonicalPayloadHash,
    recordedPayloadHash: payloadHash,
    ...(payloadBytes <= MAX_STORED_PAYLOAD_BYTES ? { recordedPayloadJson: serializedText } : {}),
    payloadBytes,
    ...(input.marketplaceMeta ? { marketplaceMeta: input.marketplaceMeta } : {}),
    createdAt: deliveredAt
  };

  storedRecordById.set(receiptId, storedRecord);
  receiptOrder.unshift(receiptId);
  if (receiptOrder.length > MAX_IN_MEMORY_RECEIPTS) {
    const evicted = receiptOrder.pop();
    if (evicted) storedRecordById.delete(evicted);
  }

  // Persist to Firestore (same db store as agent keys and wallets)
  try {
    db.collection('verified_delivery_receipts')
      .doc(receiptId)
      .set(storedRecord)
      .catch(() => {});
  } catch {
    // Non-fatal persistence fallback
  }

  return signedReceipt;
}

async function getStoredReceiptRecord(receiptId: string): Promise<StoredReceiptRecord | null> {
  if (!receiptId || typeof receiptId !== 'string') return null;
  const cached = storedRecordById.get(receiptId);
  if (cached) return cached;
  if (receiptDbIsolatedForTest) return null;

  try {
    const snap = await db.collection('verified_delivery_receipts').doc(receiptId).get();
    if (snap.exists) {
      const data = snap.data() as any;
      if (data?.receipt?.receiptId) {
        const record = data as StoredReceiptRecord;
        storedRecordById.set(receiptId, record);
        return record;
      }
      // Handle legacy stored shape if any existed directly as VerifiedDeliveryReceipt
      if (data?.receiptId) {
        const legacyRecord: StoredReceiptRecord = {
          receiptId: data.receiptId,
          keyId: data.keyId || loadOrCreateSigningKey().keyId,
          receipt: data,
          recordedPayloadHash: data.payloadHash || data.delivery?.payloadSha256,
          payloadBytes: data.delivery?.payloadBytes || 0,
          createdAt: data.deliveredAt || data.timestamps?.deliveredAt || new Date().toISOString()
        };
        storedRecordById.set(receiptId, legacyRecord);
        return legacyRecord;
      }
    }
  } catch {
    // Ignore DB read errors
  }
  return null;
}

export async function getVerifiedReceipt(receiptId: string): Promise<VerifiedDeliveryReceipt | null> {
  const rec = await getStoredReceiptRecord(receiptId);
  return rec?.receipt || null;
}

export interface ListReceiptsFilter {
  seller?: string;
  payer?: string;
  endpoint?: string;
  listingId?: string;
  ticker?: string;
  txHash?: string;
  limit?: number;
}

export async function listVerifiedReceipts(filter: ListReceiptsFilter = {}): Promise<VerifiedDeliveryReceipt[]> {
  const limit = Math.min(Math.max(Number(filter.limit) || 25, 1), 100);

  const merged = new Map<string, VerifiedDeliveryReceipt>();
  for (const id of receiptOrder) {
    const rec = storedRecordById.get(id);
    if (rec?.receipt) merged.set(rec.receipt.receiptId, rec.receipt);
  }

  if (!receiptDbIsolatedForTest && merged.size < limit) {
    try {
      const snap = await db.collection('verified_delivery_receipts').get();
      if (snap && Array.isArray(snap.docs)) {
        for (const doc of snap.docs) {
          const data = doc.data() as any;
          const r: VerifiedDeliveryReceipt | undefined = data?.receipt?.receiptId ? data.receipt : data?.receiptId ? data : undefined;
          if (r?.receiptId && !merged.has(r.receiptId)) {
            merged.set(r.receiptId, r);
          }
        }
      }
    } catch {
      // Non-fatal
    }
  }

  let results = Array.from(merged.values());
  if (filter.seller) {
    const target = filter.seller.toLowerCase();
    results = results.filter((r) => r.payTo?.toLowerCase() === target);
  }
  if (filter.payer) {
    const target = filter.payer.toLowerCase();
    results = results.filter((r) => r.payer?.toLowerCase() === target);
  }
  if (filter.endpoint) {
    const target = filter.endpoint.toLowerCase();
    results = results.filter((r) => r.endpoint?.toLowerCase() === target);
  }
  if (filter.listingId) {
    const target = filter.listingId.toLowerCase();
    results = results.filter((r) => r.listingId?.toLowerCase() === target);
  }
  if (filter.ticker) {
    const target = filter.ticker.toUpperCase();
    results = results.filter((r) => r.ticker?.toUpperCase() === target);
  }
  if (filter.txHash) {
    const target = filter.txHash.toLowerCase();
    results = results.filter((r) => r.paymentTxHash?.toLowerCase() === target);
  }

  results.sort((a, b) => {
    const ta = Date.parse(a.deliveredAt || '') || 0;
    const tb = Date.parse(b.deliveredAt || '') || 0;
    return tb - ta;
  });

  return results.slice(0, limit);
}

export async function getTotalVerifiedReceiptsCount(): Promise<number> {
  const ids = new Set<string>(storedRecordById.keys());
  if (receiptDbIsolatedForTest) return ids.size;
  try {
    const snap = await db.collection('verified_delivery_receipts').get();
    if (snap && Array.isArray(snap.docs)) {
      for (const doc of snap.docs) {
        if (doc.id) ids.add(doc.id);
      }
    }
  } catch {
    // Non-fatal
  }
  return ids.size;
}

// ============================================================================
// CRYPTOGRAPHIC VERIFICATION (GET ?receiptId=... & POST { receipt, payload })
// ============================================================================

export async function verifyDeliveryReceipt(params: {
  receipt?: VerifiedDeliveryReceipt;
  receiptId?: string;
  payload?: unknown;
  rawPayload?: string;
}): Promise<VerifyReceiptResult> {
  let storedRecord: StoredReceiptRecord | null = null;
  let receipt: VerifiedDeliveryReceipt | null = params.receipt || null;

  const lookupId = params.receiptId || receipt?.receiptId;
  if (lookupId) {
    storedRecord = await getStoredReceiptRecord(lookupId);
    if (!receipt && storedRecord) {
      receipt = storedRecord.receipt;
    }
  }

  if (!receipt || typeof receipt !== 'object' || !receipt.signature || !receipt.payloadHash) {
    return {
      verified: false,
      receiptId: lookupId || null,
      keyId: null,
      signatureValid: false,
      payloadChecked: false,
      payloadHashMatches: null,
      payloadMatches: null,
      payloadComparisonMode: 'none',
      expectedPayloadHash: null,
      expectedPayloadSha256: null,
      actualPayloadHash: null,
      actualPayloadSha256: null,
      publicKeyUrl: RECEIPT_PUBKEY_URL,
      reason: 'Receipt not found or missing required fields (signature, payloadHash).'
    };
  }

  const key = loadOrCreateSigningKey();
  const unsigned = stripSignature(receipt);
  const canonicalMessage = Buffer.from(canonicalJsonStringify(unsigned), 'utf8');

  let signatureValid = false;
  try {
    const sigBuf = Buffer.from(receipt.signature, 'base64');
    signatureValid = crypto.verify(null, canonicalMessage, key.publicKey, sigBuf);
  } catch {
    signatureValid = false;
  }

  const hasRawPayload = typeof params.rawPayload === 'string';
  const hasPayload = params.payload !== undefined;

  // Case A: Caller supplied a payload via POST /api/v1/receipts/verify
  if (hasRawPayload || hasPayload) {
    let payloadHashMatches = false;
    let actualHash = '';
    let mode: 'exact_json' | 'canonical_json' = 'exact_json';

    if (hasRawPayload) {
      const rawStr = params.rawPayload as string;
      const strippedRaw = (() => {
        try {
          const parsed = JSON.parse(rawStr);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'receipt' in parsed) {
            return JSON.stringify(stripReceiptFromPayload(parsed));
          }
        } catch {
          // keep rawStr as-is
        }
        return rawStr;
      })();

      actualHash = sha256Hex(Buffer.from(strippedRaw, 'utf8'));
      if (actualHash === receipt.payloadHash) {
        payloadHashMatches = true;
        mode = 'exact_json';
      } else {
        try {
          const parsed = stripReceiptFromPayload(JSON.parse(rawStr));
          const canonicalHash = sha256Hex(canonicalJsonStringify(parsed));
          if (canonicalHash === receipt.payloadHash || (storedRecord?.canonicalPayloadHash && canonicalHash === storedRecord.canonicalPayloadHash)) {
            payloadHashMatches = true;
            mode = 'canonical_json';
            actualHash = canonicalHash;
          }
        } catch {
          // Not JSON
        }
      }
    } else if (typeof params.payload === 'string') {
      const str = params.payload;
      actualHash = sha256Hex(Buffer.from(str, 'utf8'));
      if (actualHash === receipt.payloadHash) {
        payloadHashMatches = true;
        mode = 'exact_json';
      } else {
        try {
          const parsed = stripReceiptFromPayload(JSON.parse(str));
          const canonicalHash = sha256Hex(canonicalJsonStringify(parsed));
          if (sha256Hex(JSON.stringify(parsed)) === receipt.payloadHash) {
            payloadHashMatches = true;
            mode = 'exact_json';
            actualHash = receipt.payloadHash;
          } else if (canonicalHash === receipt.payloadHash || (storedRecord?.canonicalPayloadHash && canonicalHash === storedRecord.canonicalPayloadHash)) {
            payloadHashMatches = true;
            mode = 'canonical_json';
            actualHash = canonicalHash;
          }
        } catch {
          // Mismatch
        }
      }
    } else {
      const cleanObj = stripReceiptFromPayload(params.payload);
      const exactJsonHash = sha256Hex(Buffer.from(JSON.stringify(cleanObj), 'utf8'));
      const canonicalHash = sha256Hex(canonicalJsonStringify(cleanObj));
      if (exactJsonHash === receipt.payloadHash) {
        payloadHashMatches = true;
        actualHash = exactJsonHash;
        mode = 'exact_json';
      } else if (
        canonicalHash === receipt.payloadHash ||
        (storedRecord?.canonicalPayloadHash && canonicalHash === storedRecord.canonicalPayloadHash)
      ) {
        payloadHashMatches = true;
        actualHash = canonicalHash;
        mode = 'canonical_json';
      } else {
        actualHash = exactJsonHash;
      }
    }

    const verified = signatureValid && payloadHashMatches;
    return {
      verified,
      receiptId: receipt.receiptId,
      keyId: key.keyId,
      signatureValid,
      payloadChecked: true,
      payloadHashMatches,
      payloadMatches: payloadHashMatches,
      payloadComparisonMode: mode,
      expectedPayloadHash: receipt.payloadHash,
      expectedPayloadSha256: receipt.payloadHash,
      actualPayloadHash: actualHash,
      actualPayloadSha256: actualHash,
      receipt,
      publicKeyUrl: RECEIPT_PUBKEY_URL,
      reason: verified
        ? 'Ed25519 signature and payload SHA-256 hash verified.'
        : !signatureValid
          ? 'Ed25519 signature verification failed — receipt is invalid or modified.'
          : 'Payload SHA-256 hash does not match the payloadHash signed in this receipt.'
    };
  }

  // Case B: GET /api/v1/receipts/verify?receiptId=rcpt_... (verify stored receipt & stored payload on record)
  if (storedRecord) {
    let actualStoredHash = storedRecord.recordedPayloadHash;
    if (storedRecord.recordedPayloadJson !== undefined) {
      actualStoredHash = sha256Hex(Buffer.from(storedRecord.recordedPayloadJson, 'utf8'));
    }
    const payloadHashMatches = actualStoredHash === receipt.payloadHash;
    const verified = signatureValid && payloadHashMatches;

    return {
      verified,
      receiptId: receipt.receiptId,
      keyId: storedRecord.keyId || key.keyId,
      signatureValid,
      payloadChecked: true,
      payloadHashMatches,
      payloadMatches: payloadHashMatches,
      payloadComparisonMode: 'stored_record',
      expectedPayloadHash: receipt.payloadHash,
      expectedPayloadSha256: receipt.payloadHash,
      actualPayloadHash: actualStoredHash,
      actualPayloadSha256: actualStoredHash,
      receipt,
      publicKeyUrl: RECEIPT_PUBKEY_URL,
      reason: verified
        ? 'Stored receipt Ed25519 signature verified and payloadHash matches the payload on record.'
        : !signatureValid
          ? 'Stored receipt Ed25519 signature verification failed.'
          : 'Stored payload hash does not match receipt.payloadHash.'
    };
  }

  // Case C: Caller posted a receipt without payload and without a stored DB record
  return {
    verified: signatureValid,
    receiptId: receipt.receiptId,
    keyId: key.keyId,
    signatureValid,
    payloadChecked: false,
    payloadHashMatches: null,
    payloadMatches: null,
    payloadComparisonMode: 'none',
    expectedPayloadHash: receipt.payloadHash,
    expectedPayloadSha256: receipt.payloadHash,
    actualPayloadHash: null,
    actualPayloadSha256: null,
    receipt,
    publicKeyUrl: RECEIPT_PUBKEY_URL,
    reason: signatureValid
      ? 'Ed25519 signature verified against Stock Bloc public key. Provide payload to also verify payloadHash.'
      : 'Ed25519 signature verification failed.'
  };
}

// ============================================================================
// HTTP HEADER ATTACHMENT
// ============================================================================

export const RECEIPT_EXPOSED_HEADERS = [
  'X-StockBloc-Receipt-Id',
  'X-StockBloc-Payload-Sha256',
  'X-StockBloc-Receipt-Signature',
  'X-StockBloc-Receipt-Verify-Url'
] as const;

export function attachReceiptHeaders(res: Response, receipt: VerifiedDeliveryReceipt): void {
  if (res.headersSent) return;
  try {
    res.setHeader('X-StockBloc-Receipt-Id', receipt.receiptId);
    res.setHeader('X-StockBloc-Payload-Sha256', receipt.payloadHash);
    res.setHeader('X-StockBloc-Receipt-Signature', receipt.signature);
    res.setHeader('X-StockBloc-Receipt-Verify-Url', `${RECEIPT_VERIFY_BASE_URL}/verify?receiptId=${receipt.receiptId}`);

    const existingExpose = String(res.getHeader?.('Access-Control-Expose-Headers') || '');
    const exposeSet = new Set(
      existingExpose
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
    exposeSet.add('PAYMENT-REQUIRED');
    exposeSet.add('PAYMENT-RESPONSE');
    for (const h of RECEIPT_EXPOSED_HEADERS) {
      exposeSet.add(h);
    }
    res.setHeader('Access-Control-Expose-Headers', Array.from(exposeSet).join(', '));
  } catch {
    // Non-fatal
  }
}

// ============================================================================
// EXPRESS ROUTER: /api/v1/receipts
// ============================================================================

export function createVerifiedReceiptsRouter(): Router {
  const router = Router();

  // Public Ed25519 key (alias to /.well-known/receipts-pubkey.json)
  router.get('/public-key', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(getPublicReceiptKey());
  });

  // Free GET verification endpoint: GET /api/v1/receipts/verify?receiptId=rcpt_...
  router.get('/verify', async (req: Request, res: Response) => {
    try {
      const receiptId = typeof req.query.receiptId === 'string' ? req.query.receiptId.trim() : '';
      if (!receiptId) {
        return res.status(400).json({
          verified: false,
          error: 'Missing required query parameter: receiptId'
        });
      }
      const result = await verifyDeliveryReceipt({ receiptId });
      if (!result.receipt) {
        return res.status(404).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ verified: false, error: 'Verification error', message: err?.message });
    }
  });

  // Free POST verification endpoint: POST /api/v1/receipts/verify { receipt, payload }
  router.post('/verify', async (req: Request, res: Response) => {
    try {
      const { receipt, receiptId, payload, rawPayload } = req.body || {};
      if (!receipt && !receiptId) {
        return res.status(400).json({
          verified: false,
          error: 'Missing receipt or receiptId in request body.'
        });
      }
      const result = await verifyDeliveryReceipt({
        receipt,
        receiptId,
        payload,
        rawPayload
      });
      if (!result.receipt && receiptId) {
        return res.status(404).json(result);
      }
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ verified: false, error: 'Verification error', message: err?.message });
    }
  });

  // Public recent verified receipts ledger (real receipts only)
  router.get('/', async (req: Request, res: Response) => {
    try {
      const receipts = await listVerifiedReceipts({
        seller: typeof req.query.seller === 'string' ? req.query.seller : undefined,
        payer: typeof req.query.payer === 'string' ? req.query.payer : undefined,
        endpoint: typeof req.query.endpoint === 'string' ? req.query.endpoint : undefined,
        ticker: typeof req.query.ticker === 'string' ? req.query.ticker : undefined,
        txHash: typeof req.query.txHash === 'string' ? req.query.txHash : undefined,
        limit: typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 25
      });
      const totalReceipts = await getTotalVerifiedReceiptsCount();
      return res.status(200).json({
        issuer: RECEIPT_ISSUER,
        algorithm: RECEIPT_ALGORITHM,
        keyId: getPublicReceiptKey().keyId,
        publicKeyUrl: RECEIPT_PUBKEY_URL,
        verifyEndpoint: `${RECEIPT_VERIFY_BASE_URL}/verify`,
        totalReceipts,
        count: receipts.length,
        receipts
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to list verified delivery receipts', message: err?.message });
    }
  });

  // Fetch individual signed receipt by ID (registered AFTER /verify & /public-key)
  router.get('/:receiptId', async (req: Request, res: Response) => {
    try {
      const receipt = await getVerifiedReceipt(req.params.receiptId);
      if (!receipt) {
        return res.status(404).json({
          error: 'Receipt not found',
          receiptId: req.params.receiptId
        });
      }
      return res.status(200).json({
        ...receipt,
        publicKeyUrl: RECEIPT_PUBKEY_URL,
        verifyEndpoint: `${RECEIPT_VERIFY_BASE_URL}/verify?receiptId=${receipt.receiptId}`
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to load receipt', message: err?.message });
    }
  });

  return router;
}
