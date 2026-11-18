import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileCheck2,
  ArrowUpRight,
  Lock
} from 'lucide-react';

interface MarketplaceStatsResponse {
  marketplace: string;
  vertical: string;
  economics: {
    takeRateBps: number;
    takeRatePercent: string;
    sellerSharePercent: string;
    listingFeeUsd: number;
    monthlyFeeUsd: number;
    network: string;
    asset: string;
    escrowAddress: string;
  };
  guarantees: {
    verifiedDeliveryBeforeSettlement: boolean;
    buyerChargedOnFailedDelivery: boolean;
    signedReceiptsAlgorithm: string;
    receiptPublicKeyUrl: string;
  };
  liveMetrics: {
    activeThirdPartyListings: number;
    totalThirdPartyListings: number;
    verifiedMarketplaceSales: number;
    failedDeliveriesBlocked: number;
    deliverySuccessRate: number | null;
    grossVolumeUsd: number;
    platformRevenueUsd: number;
    sellerNetPendingUsd: number;
    sellerNetPaidUsd: number;
    totalVerifiedReceiptsIssued: number;
  };
  asOf: string;
}

interface PublicMarketplaceListing {
  listingId: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  seller: string;
  sellerName: string;
  sellerWallet: string;
  verified: boolean;
  salesCount: number;
  deliveryRate: number | null;
  listedAt: string | null;
  method: 'GET' | 'POST';
  buyUrl?: string;
  buyPath?: string;
  callUrl: string;
  callPath: string;
  sampleUrl: string | null;
  priceUsd: number;
  priceDisplay: string;
  atomicAmount: string;
  takeRateBps: number;
  takeRatePercent: string;
  requiredResponseKeys: string[];
  status: string;
  reputation: {
    verifiedSalesCount: number;
    failedDeliveriesCount: number;
    deliverySuccessRate: number | null;
    grossVolumeUsd: number;
    recentReceiptIds: string[];
  };
}

interface VerifiedDeliveryReceipt {
  receiptId: string;
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
  signature: string;
}

interface PublicKeyResponse {
  keyId: string;
  issuer: string;
  algorithm: string;
  canonicalization?: string;
  publicKeyPem: string;
  jwk: Record<string, unknown>;
  verifyEndpoint: string;
}

interface VerifyResponse {
  verified: boolean;
  receiptId: string | null;
  keyId: string | null;
  signatureValid: boolean;
  payloadChecked: boolean;
  payloadHashMatches: boolean | null;
  payloadMatches: boolean | null;
  payloadComparisonMode: string;
  expectedPayloadHash: string | null;
  actualPayloadHash: string | null;
  receipt?: VerifiedDeliveryReceipt;
  reason?: string;
  error?: string;
}

const FIRST_PARTY_RECEIPT_ENDPOINTS = [
  {
    name: 'SEC Filing Analyst (10-K / 10-Q / 8-K)',
    method: 'POST',
    path: '/api/v1/sec/analyst',
    price: '$0.05',
    note: 'Deferred settlement: settled only after EDGAR analysis succeeds; returns embedded receipt + headers.'
  },
  {
    name: '8-K Event Monitor',
    method: 'GET',
    path: '/api/v1/signals/8k?ticker=NVDA',
    price: '$0.05',
    note: 'Real-time SEC Form 8-K item classification with embedded Ed25519 delivery receipt.'
  },
  {
    name: 'Change-Detection Delta',
    method: 'GET',
    path: '/api/v1/intelligence/changes?ticker=NVDA&since=2026-11-17T00:00:00Z',
    price: '$0.01',
    note: 'Diff-only filings, SB Score, and 13F polling feed with embedded Ed25519 delivery receipt.'
  },
  {
    name: 'SEC Form 4 Insider Trades',
    method: 'GET',
    path: '/api/v1/data/insider?ticker=NVDA',
    price: '$0.02',
    note: 'Live EDGAR Form 4 executive transactions with embedded Ed25519 delivery receipt.'
  },
  {
    name: 'Congressional Trade Disclosures',
    method: 'GET',
    path: '/api/v1/data/congress?ticker=NVDA',
    price: '$0.02',
    note: 'Live House Clerk & Senate eFD disclosures with embedded Ed25519 delivery receipt.'
  }
];

function shortHash(val: string, head = 10, tail = 6): string {
  if (!val || val.length <= head + tail + 3) return val || '—';
  return `${val.slice(0, head)}...${val.slice(-tail)}`;
}

export const VerifiedMarketplacePanel: React.FC = () => {
  const [stats, setStats] = useState<MarketplaceStatsResponse | null>(null);
  const [listings, setListings] = useState<PublicMarketplaceListing[]>([]);
  const [receipts, setReceipts] = useState<VerifiedDeliveryReceipt[]>([]);
  const [publicKey, setPublicKey] = useState<PublicKeyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  const [receiptInput, setReceiptInput] = useState('');
  const [payloadInput, setPayloadInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listingsRes, receiptsRes, keyRes] = await Promise.all([
        fetch('/api/v1/marketplace/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/v1/marketplace/listings').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/v1/receipts?limit=15').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/.well-known/receipts-pubkey.json').then((r) => (r.ok ? r.json() : null)).catch(() => null)
      ]);
      if (statsRes) setStats(statsRes);
      if (listingsRes?.listings) setListings(listingsRes.listings);
      if (receiptsRes?.receipts) setReceipts(receiptsRes.receipts);
      if (keyRes) setPublicKey(keyRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCopyPem = async () => {
    if (!publicKey?.publicKeyPem) return;
    try {
      await navigator.clipboard.writeText(publicKey.publicKeyPem);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted iframes
    }
  };

  const handleVerifyReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = receiptInput.trim();
    if (!trimmed) return;

    setVerifying(true);
    setVerifyResult(null);
    try {
      let data: VerifyResponse;
      if (!trimmed.startsWith('{') && !payloadInput.trim()) {
        const res = await fetch(`/api/v1/receipts/verify?receiptId=${encodeURIComponent(trimmed)}`);
        data = (await res.json()) as VerifyResponse;
      } else {
        const body: Record<string, unknown> = {};
        if (trimmed.startsWith('{')) {
          try {
            body.receipt = JSON.parse(trimmed);
          } catch {
            setVerifyResult({
              verified: false,
              receiptId: null,
              keyId: null,
              signatureValid: false,
              payloadChecked: false,
              payloadHashMatches: null,
              payloadMatches: null,
              payloadComparisonMode: 'none',
              expectedPayloadHash: null,
              actualPayloadHash: null,
              reason: 'Invalid receipt JSON syntax.'
            });
            setVerifying(false);
            return;
          }
        } else {
          body.receiptId = trimmed;
        }

        if (payloadInput.trim()) {
          body.rawPayload = payloadInput;
        }

        const res = await fetch('/api/v1/receipts/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        data = (await res.json()) as VerifyResponse;
      }
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({
        verified: false,
        receiptId: null,
        keyId: null,
        signatureValid: false,
        payloadChecked: false,
        payloadHashMatches: null,
        payloadMatches: null,
        payloadComparisonMode: 'none',
        expectedPayloadHash: null,
        actualPayloadHash: null,
        reason: err?.message || 'Verification request failed.'
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="p-6 rounded-2xl bg-neutral-900/70 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Finance Agent Marketplace &bull; x402 Base USDC &bull; Ed25519 Verified Delivery Receipts
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Cryptographic Proof of Delivery on Every Paid Call
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Every paid x402 response on Stock Bloc returns a signed Ed25519 <code className="text-cyan-300">receipt</code> binding the Base USDC payment transaction hash to the exact SHA-256 <code className="text-cyan-300">payloadHash</code> delivered. Curated third-party listings use a 10% take rate only on verified completed deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start lg:self-center">
          <a
            href="/.well-known/receipts-pubkey.json"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 hover:border-white/25 text-xs font-mono text-neutral-200 flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            Public Key JSON
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
          <button
            onClick={loadAll}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-white/10 hover:border-white/25 text-xs font-mono text-neutral-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Honest Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10">
          <div className="text-[11px] font-mono uppercase text-neutral-400">Marketplace Take Rate</div>
          <div className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
            {stats?.economics?.takeRatePercent ?? '10%'}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-1">
            {stats?.economics?.sellerSharePercent ?? '90%'} seller net &bull; $0 listing fee
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10">
          <div className="text-[11px] font-mono uppercase text-neutral-400">Active External Sellers</div>
          <div className="text-2xl font-black font-mono text-white mt-1 tabular-nums">
            {stats?.liveMetrics?.activeThirdPartyListings ?? 0}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-1">
            Finance-only curated listings
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10">
          <div className="text-[11px] font-mono uppercase text-neutral-400">Verified Marketplace Sales</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1 tabular-nums">
            {stats?.liveMetrics?.verifiedMarketplaceSales ?? 0}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-1">
            {stats?.liveMetrics?.failedDeliveriesBlocked ?? 0} failed deliveries blocked ($0 charged)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/10">
          <div className="text-[11px] font-mono uppercase text-neutral-400">Signed Receipts Issued</div>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-1 tabular-nums">
            {stats?.liveMetrics?.totalVerifiedReceiptsIssued ?? receipts.length}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-1">
            Ed25519 + SHA-256 payload bound
          </div>
        </div>
      </div>

      {/* Section 1: Curated Third-Party Listings */}
      <div className="rounded-2xl bg-neutral-900/60 border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Curated Third-Party Finance Listings
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Every listing below is hand-onboarded, validated on every call before settlement, and backed by signed receipts.
            </p>
          </div>
          <a
            href="/api/v1/marketplace/listings"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            GET /api/v1/marketplace/listings
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {listings.length === 0 ? (
          <div className="p-6 text-sm text-neutral-300 space-y-3">
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="font-semibold text-white">
                  0 third-party finance sellers onboarded yet
                </div>
                <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                  Stock Bloc does not list unverified endpoints or fabricated placeholder sellers. External finance APIs apply free at <code className="text-cyan-300">POST /api/v1/marketplace/listings/apply</code>, are live-probed before approval, and execute via <code className="text-cyan-300">POST /api/v1/marketplace/buy</code> with a 10% take rate on verified deliveries and an automatic 100% USDC refund on failed deliveries.
                </p>
              </div>
              <div className="text-xs font-mono text-neutral-400 shrink-0 bg-neutral-900 px-3 py-2 rounded-lg border border-white/5">
                Escrow: {shortHash(stats?.economics?.escrowAddress || '', 8, 6)}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                Stock Bloc First-Party Receipt-Backed Endpoints (Live Today)
              </div>
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl bg-neutral-950/60">
                {FIRST_PARTY_RECEIPT_ENDPOINTS.map((ep) => (
                  <div key={ep.path} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white">{ep.name}</div>
                      <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                        {ep.method} {ep.path}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{ep.note}</div>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                      {ep.price} USDC
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {listings.map((item) => (
              <div key={item.listingId || item.slug} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.name}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      {item.listingId}
                    </span>
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      by {item.seller || item.sellerName}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 max-w-2xl">{item.description}</p>
                  <div className="text-[11px] font-mono text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-cyan-300">POST /api/v1/marketplace/buy</span>
                    <span>Payout wallet: {shortHash(item.sellerWallet)}</span>
                    <span>Sales: {item.salesCount ?? item.reputation?.verifiedSalesCount ?? 0}</span>
                    <span>
                      Delivery rate:{' '}
                      {item.deliveryRate !== null && item.deliveryRate !== undefined
                        ? `${item.deliveryRate}%`
                        : 'No transactions yet'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black font-mono text-emerald-400">
                      {item.priceDisplay} USDC
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      Base x402 &bull; {item.takeRatePercent} fee &bull; 100% refund on fail
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Cryptographic Receipt Verifier + Recent Verified Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Receipt Verifier */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Verify a Delivery Receipt
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Enter a <code className="text-cyan-300">receiptId</code> (uses <code className="text-cyan-300">GET /api/v1/receipts/verify</code>) or paste a receipt JSON + delivered payload (<code className="text-cyan-300">POST /api/v1/receipts/verify</code>).
            </p>
          </div>

          <form onSubmit={handleVerifyReceipt} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                Receipt ID (rcpt_...) or Full Receipt JSON
              </label>
              <input
                type="text"
                value={receiptInput}
                onChange={(e) => setReceiptInput(e.target.value)}
                placeholder="rcpt_... or paste signed receipt JSON"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 focus:border-cyan-500/60 focus:outline-none text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                Delivered JSON Payload (Optional — checks SHA-256 payloadHash)
              </label>
              <textarea
                rows={4}
                value={payloadInput}
                onChange={(e) => setPayloadInput(e.target.value)}
                placeholder='Paste JSON response body returned by the endpoint to verify payloadHash...'
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 focus:border-cyan-500/60 focus:outline-none text-xs font-mono text-white resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !receiptInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              {verifying ? 'Verifying Signature...' : 'Verify Ed25519 Receipt'}
            </button>
          </form>

          {verifyResult && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                verifyResult.verified
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {verifyResult.verified ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    VERIFIED DELIVERY RECEIPT
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    VERIFICATION FAILED
                  </>
                )}
              </div>
              <div className="text-neutral-200 font-sans text-xs">{verifyResult.reason || verifyResult.error}</div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>Signature Valid: <span className="font-bold">{String(verifyResult.signatureValid)}</span></div>
                <div>
                  Payload Hash Match:{' '}
                  <span className="font-bold">
                    {verifyResult.payloadChecked ? String(verifyResult.payloadHashMatches) : 'Not checked'}
                  </span>
                </div>
                {verifyResult.receipt?.paymentTxHash && (
                  <div className="col-span-2 truncate">
                    TxHash: {verifyResult.receipt.paymentTxHash}
                  </div>
                )}
                {verifyResult.expectedPayloadHash && (
                  <div className="col-span-2 truncate">
                    Signed payloadHash: {verifyResult.expectedPayloadHash}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Public Ed25519 Key + Recent Receipts Feed */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                Ed25519 Signing Public Key
              </h3>
              <button
                onClick={handleCopyPem}
                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-white/10 hover:border-white/25 text-[11px] font-mono text-neutral-300 flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey ? 'Copied' : 'Copy PEM'}
              </button>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Key ID: <span className="text-white">{publicKey?.keyId || 'Loading...'}</span> &bull; Algorithm: <span className="text-cyan-300">{publicKey?.algorithm || 'Ed25519'}</span>
            </div>
            <pre className="p-3 rounded-xl bg-neutral-950 border border-white/10 text-[10px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
              {publicKey?.publicKeyPem || 'Loading public key from /.well-known/receipts-pubkey.json...'}
            </pre>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Verified Delivery Receipts
              </h3>
              <a
                href="/api/v1/receipts"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
              >
                JSON Feed
              </a>
            </div>

            {receipts.length === 0 ? (
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-white/5 text-xs text-neutral-400">
                No paid x402 deliveries recorded yet. Every completed paid call embeds a signed <code className="text-cyan-300">receipt</code> object in the response JSON and persists it to Firestore for verification at <code className="text-cyan-300">GET /api/v1/receipts/verify?receiptId=rcpt_...</code>.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto border border-white/5 rounded-xl bg-neutral-950/60">
                {receipts.map((r) => (
                  <button
                    key={r.receiptId}
                    type="button"
                    onClick={() => setReceiptInput(r.receiptId)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-cyan-300 truncate">{r.receiptId}</div>
                      <div className="text-[11px] font-mono text-neutral-400 truncate">
                        {r.endpoint} {r.ticker ? `(${r.ticker})` : ''} &bull; tx {shortHash(r.paymentTxHash, 8, 4)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ${Number(r.amountUsd).toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        {new Date(r.deliveredAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
