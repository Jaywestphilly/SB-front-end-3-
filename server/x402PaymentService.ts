import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, auth } from './firebaseAdmin.js';
import { hashSecret, constantTimeCompare } from './agentSecurity.js';
import { facilitator as defaultFacilitator, createFacilitatorConfig } from '@coinbase/x402';
import {
  HTTPFacilitatorClient,
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http';
import { declareDiscoveryExtension, validateDiscoveryExtension } from '@x402/extensions';
import { inMemoryAgentRegistry, inMemoryKeyRegistry, inMemoryWalletRegistry, verifyAndDebitAgentCredit } from './agentPlatform.js';
import { inMemorySettlementRegistry } from './agentExchangeApi.js';

// ============================================================================
// COINBASE CDP X402 CONSTANTS & SPECIFICATION (BASE MAINNET)
// ============================================================================

export const BASE_CHAIN_ID = 8453;
export const BASE_CAIP2 = 'eip155:8453' as const;
export const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const USDC_DECIMALS = 6;
export const USDC_NAME = 'USD Coin';
export const USDC_VERSION = '2';

export interface X402PricedEndpoint {
  id: string;
  name: string;
  category: 'market_data' | 'sb_score' | 'sec_13f_intel' | 'research' | 'forecast' | 'strategy_eval' | 'earnings_pack';
  priceUsd: number;
  priceDisplay: string;
  atomicAmount: string; // 6 decimal string
  description: string;
  discoveryExtension?: any;
}

export const PRICED_ENDPOINTS: Record<string, X402PricedEndpoint> = {
  // Earnings Prep Pack Bundle ($0.35 USDC)
  earnings_pack: {
    id: 'earnings_pack',
    name: 'Stock Bloc Earnings Prep Pack Bundle',
    category: 'earnings_pack',
    priceUsd: 0.35,
    priceDisplay: '$0.35',
    atomicAmount: '350000', // 0.35 * 10^6
    description: 'Comprehensive earnings preparation pack combining SEC 13F whale accumulation, 10-K/10-Q filing audit, and investment thesis memo.'
  },
  // Market Data Endpoints ($0.01 USDC)
  market_data: {
    id: 'market_data',
    name: 'Stock Bloc Real-Time Market Data',
    category: 'market_data',
    priceUsd: 0.01,
    priceDisplay: '$0.01',
    atomicAmount: '10000', // 0.01 * 10^6
    description: 'Real-time verified market data, Super Sonic Tsunami watchlist, and ticker prices.'
  },
  // SB Score Quant Intelligence ($0.05 USDC)
  sb_score: {
    id: 'sb_score',
    name: 'Stock Bloc SB Score Quant Intelligence',
    category: 'sb_score',
    priceUsd: 0.05,
    priceDisplay: '$0.05',
    atomicAmount: '50000', // 0.05 * 10^6
    description: '0-100 SB Score with 5-factor quantitative breakout: Momentum, Trend, RSI, Volume, and Volatility.'
  },
  // SEC & 13F Whale Intelligence ($0.10 USDC)
  sec_13f_intel: {
    id: 'sec_13f_intel',
    name: 'SEC 13F Institutional Accumulation & Filing Intel',
    category: 'sec_13f_intel',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000', // 0.10 * 10^6
    description: 'Institutional 13F whale filings, hedge fund shifts, and audited EDGAR risk intelligence.'
  },
  // Deep SEC Analyst Audit Job ($0.25 USDC)
  sec_job: {
    id: 'sec_job',
    name: 'Deep SEC 10-K/10-Q Production Filing Audit',
    category: 'sec_13f_intel',
    priceUsd: 0.25,
    priceDisplay: '$0.25',
    atomicAmount: '250000', // 0.25 * 10^6
    description: 'Multi-layer autonomous SEC 10-K/10-Q filing analysis, revenue quality check, and forensic audit.'
  },
  // Institutional Research Memo ($0.10 USDC)
  research: {
    id: 'research',
    name: 'Stock Bloc Institutional Research Memo',
    category: 'research',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000', // 0.10 * 10^6
    description: 'Publish and access peer-reviewed quantitative investment research memos and thesis models.'
  },
  // Brier-Calibrated Price Forecast ($0.05 USDC)
  forecast: {
    id: 'forecast',
    name: 'Brier-Calibrated Quantitative Forecast',
    category: 'forecast',
    priceUsd: 0.05,
    priceDisplay: '$0.05',
    atomicAmount: '50000', // 0.05 * 10^6
    description: 'Submit and query mathematically verified Brier-tracked price target probability distributions.'
  },
  // Strategy Evaluation & Quant Simulation ($0.10 USDC)
  strategy_eval: {
    id: 'strategy_eval',
    name: 'Quantitative Strategy Backtest & Simulation',
    category: 'strategy_eval',
    priceUsd: 0.10,
    priceDisplay: '$0.10',
    atomicAmount: '100000', // 0.10 * 10^6
    description: 'Multi-year quantitative simulation and backtesting against the Super Sonic Tsunami benchmark.'
  }
};

// Programmatically verify every resource description is under 500 characters
Object.values(PRICED_ENDPOINTS).forEach((ep) => {
  if (ep.description.length > 500) {
    throw new Error(`Endpoint ${ep.id} description exceeds 500 characters: ${ep.description.length}`);
  }
});

// ============================================================================
// BAZAAR DISCOVERY EXTENSIONS (@x402/extensions v2)
// Spec-compliant declaration helpers per priced endpoint
// ============================================================================

const declareDiscovery = declareDiscoveryExtension as (config: any) => { bazaar: any };

export const BAZAAR_DISCOVERY_EXTENSIONS: Record<string, { bazaar: any }> = {
  earnings_pack: declareDiscovery({
    method: 'GET',
    input: { ticker: 'NVDA' },
    output: {
      example: {
        ticker: 'NVDA',
        asOf: '2026-09-29T00:00:00.000Z',
        thirteenF: {
          quarterCycle: 'Q1/Q2 2026 SEC Form 13F Filings',
          consensus: { fundCount: 6, totalValueMillions: 2240, overallSentiment: 'STRONG ACCUMULATION' }
        },
        filingAudit: {
          accessionNumber: '0001045810-26-000075',
          filingType: '10-Q',
          companyName: 'NVIDIA CORP',
          managementTone: 'BULLISH',
          executiveSummary: 'Form 10-Q filed with SEC EDGAR. Datacenter revenue accelerated.'
        },
        memo: {
          title: 'Earnings Prep & Institutional Positioning: NVDA',
          thesis: 'NVDA displays STRONG ACCUMULATION with BULLISH management tone.'
        }
      }
    }
  }),

  market_data: declareDiscovery({
    method: 'GET',
    input: { bloc: 'super_sonic_tsunami' },
    output: {
      example: {
        status: 'success',
        feed: 'market',
        updated_at: '2026-09-29T00:00:00.000Z',
        total_assets: 20,
        watchlist: [
          { symbol: 'NVDA', price: 138.25, changePercent: 2.45, sbScore: 88, action: 'ACCUMULATE' }
        ]
      }
    }
  }),

  sb_score: declareDiscovery({
    method: 'GET',
    input: { ticker: 'NVDA' },
    output: {
      example: {
        status: 'success',
        ticker: 'NVDA',
        price: 138.25,
        sbScore: 88,
        signalLabel: 'STRONG BUY',
        confidence: 'HIGH',
        factorBreakdown: { momentum: 24, trend: 24, relativeStrength: 18, volume: 12, volatility: 10 }
      }
    }
  }),

  sec_13f_intel: declareDiscovery({
    method: 'GET',
    input: { symbol: 'NVDA' },
    output: {
      example: {
        status: 'success',
        quarterCycle: 'Q1/Q2 2026 SEC Form 13F Filings',
        totalFundsTracked: 13,
        consensusHoldings: [
          { symbol: 'NVDA', fundCount: 6, totalValueMillions: 2240, overallSentiment: 'STRONG ACCUMULATION' }
        ]
      }
    }
  }),

  sec_job: declareDiscovery({
    method: 'POST',
    bodyType: 'json',
    input: { ticker: 'NVDA', filingType: '10-Q' },
    output: {
      example: {
        success: true,
        jobId: 'job_sec_1790616000000_a1b2',
        output: {
          ticker: 'NVDA',
          filingType: '10-Q',
          companyName: 'NVIDIA CORP',
          managementTone: 'BULLISH',
          executiveSummary: 'Form 10-Q filed with SEC EDGAR. Datacenter revenue accelerated.'
        }
      }
    }
  }),

  research: declareDiscovery({
    method: 'POST',
    bodyType: 'json',
    input: { title: 'NVDA Thesis', summary: 'AI Compute expansion', thesis: 'Hyperscale demand acceleration' },
    output: {
      example: {
        id: 'res_1790616000000',
        status: 'created',
        version: 1,
        title: 'NVDA Thesis',
        publishedAt: '2026-09-29T00:00:00.000Z'
      }
    }
  }),

  forecast: declareDiscovery({
    method: 'POST',
    bodyType: 'json',
    input: { symbol: 'NVDA', targetPrice: 160, probability: 75 },
    output: {
      example: {
        id: 'fc_1790616000000',
        status: 'OPEN',
        symbol: 'NVDA',
        targetPrice: 160,
        probability: 75,
        currentPrice: 138.25,
        createdAt: '2026-09-29T00:00:00.000Z'
      }
    }
  }),

  strategy_eval: declareDiscovery({
    method: 'POST',
    bodyType: 'json',
    input: { allocations: { NVDA: 0.5, VST: 0.5 }, lookbackDays: 90 },
    output: {
      example: {
        status: 'success',
        annualizedReturn: 0.428,
        sharpeRatio: 2.65,
        maxDrawdown: -0.092,
        benchmarkReturn: 0.312,
        alpha: 0.116,
        evaluatedAt: '2026-09-29T00:00:00.000Z'
      }
    }
  })
};

// Validate all discovery extensions locally and attach to PRICED_ENDPOINTS
Object.entries(BAZAAR_DISCOVERY_EXTENSIONS).forEach(([id, ext]) => {
  const result = validateDiscoveryExtension(ext.bazaar);
  if (!result.valid) {
    throw new Error(`Bazaar discovery extension validation failed for endpoint ${id}: ${result.errors?.join(', ')}`);
  }
  if (PRICED_ENDPOINTS[id]) {
    PRICED_ENDPOINTS[id].discoveryExtension = ext.bazaar;
  }
});

// Canonical HTTP route paths matched by each priced endpoint
export const X402_ROUTE_PATHS: Record<string, string[]> = {
  market_data: [
    '/api/data/market',
    '/api/data/market.csv',
    '/api/v1/market/quote',
    '/api/live-quote/:symbol'
  ],
  sb_score: [
    '/api/v1/intelligence/sb-score',
    '/api/v1/intelligence/signal',
    '/api/intelligence/sb-score',
    '/api/intelligence/signal'
  ],
  sec_13f_intel: [
    '/api/data/sec',
    '/api/v1/data/sec'
  ],
  sec_job: [
    '/api/v1/sec/job',
    '/api/sec/job'
  ],
  research: [
    '/api/v1/intelligence/research',
    '/api/v1/intelligence/theses'
  ],
  forecast: [
    '/api/v1/intelligence/forecasts'
  ],
  strategy_eval: [
    '/api/v1/agent/strategy/evaluate',
    '/api/v1/agent/quant-sim',
    '/api/v1/agent/submit-performance'
  ],
  earnings_pack: [
    '/api/v1/intelligence/earnings-pack',
    '/api/intelligence/earnings-pack'
  ]
};

// ============================================================================
// FACILITATOR CLIENT INITIALIZATION
// ============================================================================

export function getCoinbaseFacilitatorClient(): HTTPFacilitatorClient {
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  const config = apiKeyId && apiKeySecret
    ? createFacilitatorConfig(apiKeyId, apiKeySecret)
    : defaultFacilitator;

  // Allow custom override if specified in environment
  if (process.env.X402_FACILITATOR_URL) {
    return new HTTPFacilitatorClient({
      url: process.env.X402_FACILITATOR_URL,
      createAuthHeaders: config.createAuthHeaders,
    });
  }

  return new HTTPFacilitatorClient(config);
}

// ============================================================================
// AUTHORITATIVE X402 SETTLEMENT REGISTRY & IDEMPOTENCY STORE
// ============================================================================

export interface SettledX402Record {
  txHash: string;
  payer?: string;
  settleResult: any;
  responseHeader: string;
  settledAt: string;
  endpointId?: string;
}

export const inMemoryX402SettlementRegistry = new Map<string, SettledX402Record>();
export const inFlightX402SettlementRegistry = new Map<string, Promise<any>>();

export function clearX402SettlementRegistry(): void {
  inMemoryX402SettlementRegistry.clear();
  inFlightX402SettlementRegistry.clear();
}

export function extractPaymentIdempotencyKeys(paymentPayload: any, rawPaymentHeader?: string): {
  payloadHash: string;
  nonceKey?: string;
} {
  let rawStr = '';
  if (typeof rawPaymentHeader === 'string' && rawPaymentHeader.trim()) {
    rawStr = rawPaymentHeader.trim();
  } else {
    try {
      rawStr = JSON.stringify(paymentPayload);
    } catch {
      rawStr = String(paymentPayload);
    }
  }
  const payloadHash = crypto.createHash('sha256').update(rawStr).digest('hex');

  const auth =
    paymentPayload?.payload?.authorization ||
    paymentPayload?.authorization ||
    paymentPayload?.payload?.message ||
    paymentPayload?.message ||
    paymentPayload?.payload;

  let nonceKey: string | undefined;
  if (auth && typeof auth === 'object') {
    const from = auth.from || auth.authorizer || paymentPayload?.payer;
    const nonce = auth.nonce;
    if (from && nonce !== undefined && nonce !== null) {
      nonceKey = `nonce:${String(from).toLowerCase()}:${String(nonce).toLowerCase()}`;
    }
  }

  return { payloadHash, nonceKey };
}

export function getX402Settlement(payloadHash: string, nonceKey?: string): SettledX402Record | undefined {
  if (inMemoryX402SettlementRegistry.has(payloadHash)) {
    return inMemoryX402SettlementRegistry.get(payloadHash);
  }
  if (nonceKey && inMemoryX402SettlementRegistry.has(nonceKey)) {
    return inMemoryX402SettlementRegistry.get(nonceKey);
  }
  return undefined;
}

export function saveX402Settlement(
  keys: { payloadHash: string; nonceKey?: string },
  record: SettledX402Record
): void {
  inMemoryX402SettlementRegistry.set(keys.payloadHash, record);
  if (keys.nonceKey) {
    inMemoryX402SettlementRegistry.set(keys.nonceKey, record);
  }
  if (record.txHash) {
    inMemoryX402SettlementRegistry.set(`tx:${record.txHash.toLowerCase()}`, record);
  }
}

// Get recipient address from environment variable
export function getX402RecipientAddress(): string | null {
  const addr = process.env.X402_RECIPIENT_ADDRESS?.trim();
  return addr && addr.length > 0 ? addr : null;
}

// Server-side allowlist of the web terminal human UI data-fetch paths
export const HUMAN_UI_FREE_PATHS = new Set([
  '/api/data/market',
  '/api/data/market.csv',
  '/api/live-quote',
  '/api/data/sec',
  '/api/13f/filings',
  '/api/v1/market/quote',
  '/api/v1/intelligence/sb-score',
  '/api/v1/intelligence/signal',
  '/api/v1/intelligence/earnings-pack',
  '/api/intelligence/sb-score',
  '/api/intelligence/signal',
  '/api/intelligence/earnings-pack',
  '/api/sec/job',
  '/api/v1/sec/job'
]);

export function isHumanUiFreePath(path: string): boolean {
  const normalized = path.split('?')[0].toLowerCase();
  if (HUMAN_UI_FREE_PATHS.has(normalized)) return true;
  if (normalized.startsWith('/api/live-quote/') || normalized.startsWith('/api/v1/market/quote/')) {
    return true;
  }
  return false;
}

// Helper to detect requests originating from the frontend web application (browsers)
export function isFrontendWebRequest(req: Request): boolean {
  // If the request explicitly provides an x402 payment header or agent key, treat as agent request
  if (
    req.header('payment-signature') ||
    req.header('PAYMENT-SIGNATURE') ||
    req.header('x-payment') ||
    req.header('X-PAYMENT') ||
    req.header('x-agent-key') ||
    req.header('X-Agent-Key') ||
    req.header('x-402-payment-proof') ||
    req.header('X-402-Payment-Proof')
  ) {
    return false;
  }

  const rawAuth = req.headers.authorization;
  if (rawAuth && (rawAuth.includes('sb_live_') || rawAuth.startsWith('sb_live_'))) {
    return false;
  }

  // Same-origin browser fetch
  const secFetchSite = req.header('sec-fetch-site');
  if (secFetchSite === 'same-origin') {
    return true;
  }

  // Browser navigation or document request
  const secFetchDest = req.header('sec-fetch-dest');
  if (secFetchDest === 'document') {
    return true;
  }

  // Referer matching request host
  const referer = req.header('referer') || '';
  const host = req.get('host') || '';
  if (referer && host && (referer.includes(host) || referer.includes('localhost') || referer.includes('127.0.0.1'))) {
    return true;
  }

  // Direct browser accept header
  const accept = req.header('accept') || '';
  if (accept.includes('text/html')) {
    return true;
  }

  // Custom client headers (e.g. x-stockbloc-client) are strictly ignored for security
  return false;
}

// Helper to determine priced endpoint configuration for a path
export function matchPricedEndpoint(path: string, method: string = 'GET'): X402PricedEndpoint | null {
  const normalized = path.split('?')[0].toLowerCase();

  // Earnings Prep Pack Bundle ($0.35 USDC)
  if (
    normalized === '/api/v1/intelligence/earnings-pack' ||
    normalized === '/api/intelligence/earnings-pack'
  ) {
    return PRICED_ENDPOINTS.earnings_pack;
  }

  // SEC Job
  if (normalized === '/api/v1/sec/job' || normalized === '/api/sec/job') {
    return PRICED_ENDPOINTS.sec_job;
  }

  // SEC & 13F Intel - specifically /api/data/sec (does NOT block /api/13f/filings, /sec_intel_data.json, etc.)
  if (normalized === '/api/data/sec' || normalized === '/api/v1/data/sec') {
    return PRICED_ENDPOINTS.sec_13f_intel;
  }

  // SB Score & Quantitative Signals
  if (
    normalized === '/api/v1/intelligence/sb-score' ||
    normalized === '/api/v1/intelligence/signal' ||
    normalized === '/api/intelligence/sb-score' ||
    normalized === '/api/intelligence/signal'
  ) {
    return PRICED_ENDPOINTS.sb_score;
  }

  // Research Endpoints (POST / PUT)
  if (
    (normalized === '/api/v1/intelligence/research' || normalized === '/api/v1/intelligence/theses') &&
    (method === 'POST' || method === 'PUT')
  ) {
    return PRICED_ENDPOINTS.research;
  }

  // Forecast Endpoints (POST / PUT)
  if (normalized === '/api/v1/intelligence/forecasts' && (method === 'POST' || method === 'PUT')) {
    return PRICED_ENDPOINTS.forecast;
  }

  // Strategy Evaluation / Quant Sim
  if (
    normalized === '/api/v1/agent/strategy/evaluate' ||
    normalized === '/api/v1/agent/quant-sim' ||
    normalized === '/api/v1/agent/submit-performance'
  ) {
    return PRICED_ENDPOINTS.strategy_eval;
  }

  // Market Data Watchlist & Live Quotes
  if (
    normalized === '/api/data/market' ||
    normalized === '/api/data/market.csv' ||
    normalized.startsWith('/api/v1/market/quote') ||
    normalized.startsWith('/api/live-quote')
  ) {
    return PRICED_ENDPOINTS.market_data;
  }

  return null;
}

// ============================================================================
// AGENT IDENTITY RESOLUTION HELPER
// ============================================================================

export async function resolveAgentIdentityFromKey(
  authHeader?: string
): Promise<{ agentId: string; handle: string; displayName?: string } | null> {
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  if (!token) return null;

  if (
    token === process.env.AGENT_API_SECRET_KEY ||
    token === 'YOUR_AGENT_SECRET_KEY' ||
    token === 'stock_bloc_agent_secret_2026'
  ) {
    return {
      agentId: 'agent_spark_01',
      handle: 'spark_agent',
      displayName: 'Gemini Spark Alpha'
    };
  }

  if (token.startsWith('sb_live_')) {
    const parts = token.split('_');
    if (parts.length === 4) {
      const publicId = parts[2];
      const secret = parts[3];

      let keyRecord = inMemoryKeyRegistry.get(publicId) || inMemoryKeyRegistry.get(token);
      if (!keyRecord && db) {
        try {
          let snap = await db.collection('api_keys').doc(publicId).get();
          if (!snap.exists) snap = await db.collection('agent_api_keys').doc(publicId).get();
          if (snap.exists) {
            keyRecord = snap.data();
            inMemoryKeyRegistry.set(publicId, keyRecord);
          }
        } catch (_) {}
      }

      if (keyRecord && keyRecord.status === 'active') {
        const expectedHash = keyRecord.secretHash || keyRecord.keyHash;
        const actualHash = crypto.createHash('sha256').update(secret).digest('hex');
        if (expectedHash && (expectedHash === actualHash || constantTimeCompare(expectedHash, actualHash))) {
          const agentId = keyRecord.agentId;
          let agent = inMemoryAgentRegistry.get(agentId) || (keyRecord.handle ? inMemoryAgentRegistry.get(keyRecord.handle.toLowerCase()) : undefined);
          if (!agent && db) {
            try {
              const agentSnap = await db.collection('users').doc(agentId).get();
              if (agentSnap.exists) {
                agent = agentSnap.data();
                inMemoryAgentRegistry.set(agentId, agent);
              }
            } catch (_) {}
          }
          return {
            agentId,
            handle: agent?.handle || keyRecord.handle || `agent_${publicId.substring(0, 6)}`,
            displayName: agent?.displayName || 'Autonomous Agent'
          };
        }
      }
    }
  }
  return null;
}

// ============================================================================
// EXPRESS MIDDLEWARE: REAL COINBASE X402 ENFORCEMENT
// ============================================================================

export function requireX402Payment(forcedConfig?: X402PricedEndpoint) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Defense-in-depth: If already verified & settled or credits debited on this request, avoid duplicate payment/debit
    if ((req as any).x402Payment?.verified && (req as any).x402Payment?.settled) {
      return next();
    }
    if ((req as any).creditsDebited) {
      return next();
    }

    const fullPath = (req.originalUrl || (req.baseUrl ? req.baseUrl + req.path : req.path) || '').split('?')[0];

    const forwardNext = () => {
      return next();
    };

    // 1. Identify priced endpoint configuration
    const endpointConfig = forcedConfig || matchPricedEndpoint(fullPath, req.method) || matchPricedEndpoint(req.path, req.method);
    if (!endpointConfig) {
      return forwardNext();
    }

    // 2. Free Human Browser UI Access (Server-side allowlist for web terminal frontend)
    // Server decides based on authentic browser request headers matching UI free paths (never trusts client bypass headers)
    if (isFrontendWebRequest(req) && isHumanUiFreePath(fullPath)) {
      return forwardNext();
    }

    const paymentHeader =
      req.header('payment-signature') ||
      req.header('PAYMENT-SIGNATURE') ||
      req.header('x-payment') ||
      req.header('X-PAYMENT') ||
      req.header('x-402-payment-proof') ||
      req.header('X-402-Payment-Proof');

    const rawAuth = req.headers.authorization || (req.headers['x-agent-key'] as string);
    const isAgentKey = rawAuth && (
      rawAuth.includes('sb_live_') ||
      rawAuth.startsWith('sb_live_') ||
      req.headers['x-agent-key'] !== undefined ||
      (rawAuth.startsWith('Bearer ') && (
        rawAuth.substring(7).trim().startsWith('sb_live_') ||
        rawAuth.substring(7).trim() === process.env.AGENT_API_SECRET_KEY ||
        rawAuth.substring(7).trim() === 'YOUR_AGENT_SECRET_KEY' ||
        rawAuth.substring(7).trim() === 'stock_bloc_agent_secret_2026'
      ))
    );

    const recipientAddress = getX402RecipientAddress();

    const buildPaymentRequirements = () => {
      if (!recipientAddress) return null;
      const paymentRequirement = {
        scheme: 'exact' as const,
        network: BASE_CAIP2, // 'eip155:8453' (Base mainnet)
        amount: endpointConfig.atomicAmount,
        asset: BASE_USDC_CONTRACT, // Base USDC
        payTo: recipientAddress,
        maxTimeoutSeconds: 300,
        extra: {
          name: USDC_NAME,
          version: USDC_VERSION,
          symbol: 'USDC',
          decimals: USDC_DECIMALS,
          priceUsd: endpointConfig.priceDisplay
        }
      };

      const discoveryExt = BAZAAR_DISCOVERY_EXTENSIONS[endpointConfig.id]?.bazaar || endpointConfig.discoveryExtension;

      const paymentRequiredPayload = {
        x402Version: 2 as const,
        accepts: [paymentRequirement],
        resource: {
          url: `${req.protocol}://${req.get('host') || 'stockbloc.ai.studio'}${req.originalUrl || req.url || '/'}` || 'https://stockbloc.ai.studio',
          description: (endpointConfig.description || '').slice(0, 500),
          mimeType: 'application/json',
          serviceName: 'Stock Bloc',
          tags: ['stocks', 'sec', '13f', 'quant', 'forecasting']
        },
        extensions: {
          bazaar: discoveryExt
        }
      };

      return { paymentRequirement, paymentRequiredPayload };
    };

    // ========================================================================
    // REQUIRED FLOW STEP 1: x402 PAYMENT-SIGNATURE Header Present
    // Verify and settle via the Coinbase CDP facilitator path FIRST, regardless of credit balance.
    // On success, serve the request. Do not also debit credits (no double charge).
    // Attribute the call to the sb_live_ identity if a valid agent key is also present.
    // ========================================================================
    if (paymentHeader) {
      if (!recipientAddress) {
        return res.status(500).json({
          status: 'error',
          code: 'CONFIGURATION_ERROR',
          message:
            'Configuration Error: X402_RECIPIENT_ADDRESS environment variable is not configured. Server cannot accept x402 micropayments or generate payment requirements.',
          endpoint: endpointConfig.name,
          price: endpointConfig.priceDisplay,
          network: 'Base',
          asset: 'USDC'
        });
      }

      const reqs = buildPaymentRequirements();
      if (!reqs) {
        return res.status(500).json({
          status: 'error',
          code: 'CONFIGURATION_ERROR',
          message: 'Failed to construct payment requirement.'
        });
      }

      const { paymentRequirement } = reqs;

      let paymentPayload: any;
      if (typeof paymentHeader === 'string') {
        const trimmed = paymentHeader.trim();
        if (trimmed.startsWith('{')) {
          paymentPayload = JSON.parse(trimmed);
        } else {
          try {
            paymentPayload = decodePaymentSignatureHeader(trimmed);
          } catch {
            const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
            paymentPayload = JSON.parse(decoded);
          }
        }
      } else {
        paymentPayload = paymentHeader;
      }

      const keys = extractPaymentIdempotencyKeys(
        paymentPayload,
        typeof paymentHeader === 'string' ? paymentHeader : undefined
      );

      // 1. Check existing authoritative settlement (Idempotent replay)
      const existingSettlement = getX402Settlement(keys.payloadHash, keys.nonceKey);
      if (existingSettlement) {
        res.setHeader('PAYMENT-RESPONSE', existingSettlement.responseHeader);
        (req as any).x402Payment = {
          verified: true,
          settled: true,
          settleResult: existingSettlement.settleResult,
          payer: existingSettlement.payer,
          txHash: existingSettlement.txHash,
          idempotentReplay: true
        };

        if (isAgentKey) {
          try {
            const authHeader = rawAuth.startsWith('Bearer ') ? rawAuth : `Bearer ${rawAuth}`;
            const resolvedAgent = await resolveAgentIdentityFromKey(authHeader);
            if (resolvedAgent) {
              (req as any).agent = resolvedAgent;
            }
          } catch (bookkeepingErr: any) {
            console.error('Non-fatal agent resolution error on idempotent replay:', bookkeepingErr?.message || bookkeepingErr);
          }
        } else {
          const payer = existingSettlement.payer || '0x_payer';
          const payerHandle = payer.startsWith('0x') && payer.length > 10
            ? `wallet_${payer.substring(0, 6)}...${payer.substring(payer.length - 4)}`
            : `wallet_${payer}`;
          if (!(req as any).agent) {
            (req as any).agent = {
              agentId: payer.toLowerCase(),
              handle: payerHandle,
              displayName: `Web3 Payer (${payer.substring(0, 6)}...${payer.substring(payer.length - 4)})`,
              walletAddress: payer,
              status: 'active',
              isX402Payer: true,
              createdAt: new Date().toISOString()
            };
          }
          if (!(req as any).agentKey) {
            (req as any).agentKey = {
              keyId: `x402_${payer.toLowerCase()}`,
              agentId: payer.toLowerCase(),
              handle: payerHandle,
              scopes: ['*'],
              status: 'active',
              isX402Payment: true
            };
          }
        }

        return forwardNext();
      }

      // 2. Concurrency Check: Is this exact payment payload settling in-flight?
      const inFlightPromise = inFlightX402SettlementRegistry.get(keys.payloadHash) ||
        (keys.nonceKey ? inFlightX402SettlementRegistry.get(keys.nonceKey) : undefined);
      if (inFlightPromise) {
        try {
          const settled = await inFlightPromise;
          if (settled) {
            res.setHeader('PAYMENT-RESPONSE', settled.responseHeader);
            (req as any).x402Payment = {
              verified: true,
              settled: true,
              settleResult: settled.settleResult,
              payer: settled.payer,
              txHash: settled.txHash,
              idempotentReplay: true
            };
            return forwardNext();
          }
        } catch (_) {
          // In-flight settlement failed, fall through to fresh attempt
        }
      }

      const facilitatorClient = getCoinbaseFacilitatorClient();

      try {
        // Step A: Verify payment through facilitator
        let verifyResult: any;
        try {
          verifyResult = await facilitatorClient.verify(paymentPayload, paymentRequirement as any);
        } catch (verifyErr: any) {
          // If verify throws due to execution reverted / used nonce, check if already settled
          const postCheck = getX402Settlement(keys.payloadHash, keys.nonceKey);
          if (postCheck) {
            res.setHeader('PAYMENT-RESPONSE', postCheck.responseHeader);
            (req as any).x402Payment = {
              verified: true,
              settled: true,
              settleResult: postCheck.settleResult,
              payer: postCheck.payer,
              txHash: postCheck.txHash,
              idempotentReplay: true
            };
            return forwardNext();
          }
          throw verifyErr;
        }

        if (!verifyResult || (verifyResult as any).isValid === false) {
          const postCheck = getX402Settlement(keys.payloadHash, keys.nonceKey);
          if (postCheck) {
            res.setHeader('PAYMENT-RESPONSE', postCheck.responseHeader);
            (req as any).x402Payment = {
              verified: true,
              settled: true,
              settleResult: postCheck.settleResult,
              payer: postCheck.payer,
              txHash: postCheck.txHash,
              idempotentReplay: true
            };
            return forwardNext();
          }

          return res.status(402).json({
            status: 'payment_verification_failed',
            code: 402,
            error: 'x402 payment verification failed through Coinbase CDP facilitator.',
            reason: (verifyResult as any)?.reason || 'Invalid signature, invalid nonce, or expired authorization.'
          });
        }

        // Step B: Settle payment through facilitator BEFORE serving response
        let settleResult: any;
        const settleExecutionPromise = (async () => {
          return await facilitatorClient.settle(paymentPayload, paymentRequirement as any);
        })();

        inFlightX402SettlementRegistry.set(keys.payloadHash, settleExecutionPromise as any);
        if (keys.nonceKey) {
          inFlightX402SettlementRegistry.set(keys.nonceKey, settleExecutionPromise as any);
        }

        try {
          settleResult = await settleExecutionPromise;
        } finally {
          inFlightX402SettlementRegistry.delete(keys.payloadHash);
          if (keys.nonceKey) {
            inFlightX402SettlementRegistry.delete(keys.nonceKey);
          }
        }

        const txHash = (settleResult as any)?.txHash || (settleResult as any)?.transaction;
        const isSettleSuccess = Boolean(
          settleResult && (
            settleResult.success === true ||
            (typeof txHash === 'string' && txHash.length > 0)
          )
        );

        if (!isSettleSuccess) {
          return res.status(402).json({
            status: 'payment_settlement_failed',
            code: 402,
            error: 'x402 payment settlement failed through Coinbase CDP facilitator.',
            reason: (settleResult as any)?.error || (settleResult as any)?.errorMessage || 'On-chain settlement transaction could not be executed.'
          });
        }

        // Settlement succeeded! Authoritative on-chain transaction hash acquired.
        let responseHeader = '';
        try {
          responseHeader = encodePaymentResponseHeader(settleResult);
        } catch (headerErr) {
          console.error('Non-fatal error encoding payment response header:', headerErr);
          responseHeader = Buffer.from(JSON.stringify({
            success: true,
            txHash: txHash || '0x_settled',
            payer: (settleResult as any)?.payer || paymentPayload?.payer
          })).toString('base64');
        }

        res.setHeader('PAYMENT-RESPONSE', responseHeader);

        const settlementRecord: SettledX402Record = {
          txHash: txHash || '0x_settled',
          payer: (settleResult as any)?.payer || paymentPayload?.payer,
          settleResult,
          responseHeader,
          settledAt: new Date().toISOString(),
          endpointId: endpointConfig.id
        };

        saveX402Settlement(keys, settlementRecord);

        (req as any).x402Payment = {
          verified: true,
          settled: true,
          settleResult,
          payer: settlementRecord.payer,
          txHash: settlementRecord.txHash
        };

        // Post-settlement bookkeeping (ISOLATED: MUST NEVER REJECT OR CONVERT A SETTLED PAYMENT TO 402)
        try {
          if (isAgentKey) {
            const authHeader = rawAuth.startsWith('Bearer ') ? rawAuth : `Bearer ${rawAuth}`;
            const resolvedAgent = await resolveAgentIdentityFromKey(authHeader);
            if (resolvedAgent) {
              (req as any).agent = resolvedAgent;
            }
          } else {
            const payer = settlementRecord.payer || '0x_payer';
            const payerHandle = payer.startsWith('0x') && payer.length > 10
              ? `wallet_${payer.substring(0, 6)}...${payer.substring(payer.length - 4)}`
              : `wallet_${payer}`;
            if (!(req as any).agent) {
              (req as any).agent = {
                agentId: payer.toLowerCase(),
                handle: payerHandle,
                displayName: `Web3 Payer (${payer.substring(0, 6)}...${payer.substring(payer.length - 4)})`,
                walletAddress: payer,
                status: 'active',
                isX402Payer: true,
                createdAt: new Date().toISOString()
              };
            }
            if (!(req as any).agentKey) {
              (req as any).agentKey = {
                keyId: `x402_${payer.toLowerCase()}`,
                agentId: payer.toLowerCase(),
                handle: payerHandle,
                scopes: ['*'],
                status: 'active',
                isX402Payment: true
              };
            }
          }
        } catch (bookkeepingErr: any) {
          console.error('Post-settlement bookkeeping error (non-fatal):', bookkeepingErr?.message || bookkeepingErr);
        }

        // Do not also debit credits (no double charge).
        return forwardNext();
      } catch (err: any) {
        // If an error occurs, check if this payment was actually settled (authoritative check)
        const settledCheck = getX402Settlement(keys.payloadHash, keys.nonceKey);
        if (settledCheck) {
          console.warn('Recovered from facilitator error using authoritative settled record:', settledCheck.txHash);
          res.setHeader('PAYMENT-RESPONSE', settledCheck.responseHeader);
          (req as any).x402Payment = {
            verified: true,
            settled: true,
            settleResult: settledCheck.settleResult,
            payer: settledCheck.payer,
            txHash: settledCheck.txHash,
            idempotentReplay: true
          };
          return forwardNext();
        }

        console.error('Coinbase x402 facilitator error:', err.message);
        return res.status(402).json({
          status: 'payment_rejected',
          code: 402,
          error: 'x402 payment rejected by Coinbase CDP facilitator.',
          details: err.message
        });
      }
    }

    // ========================================================================
    // REQUIRED FLOW STEP 2: Else if valid sb_live_ agent key is present
    // Attempt platform-credit debit as today.
    // 2a. Debit succeeds: serve the request (unchanged).
    // 2b. Debit fails with INSUFFICIENT_FUNDS: do NOT return the plain error JSON.
    //     Fall through to standard x402 flow and return HTTP 402 with complete
    //     valid x402 PAYMENT-REQUIRED payload.
    // ========================================================================
    let isCreditsExhausted = false;
    if (isAgentKey) {
      const authHeader = rawAuth.startsWith('Bearer ') ? rawAuth : `Bearer ${rawAuth}`;

      // Check if this request is an idempotent replay for sec_job
      const idempotencyKey = (
        req.body?.idempotencyKey ||
        (req.headers['idempotency-key'] as string) ||
        (req.headers['x-idempotency-key'] as string)
      );
      const jobId = req.body?.jobId as string | undefined;
      const isIdempotentReplay = Boolean(
        endpointConfig.id === 'sec_job' && (
          (idempotencyKey && inMemorySettlementRegistry.has(idempotencyKey)) ||
          (jobId && inMemorySettlementRegistry.has(jobId))
        )
      );

      if (isIdempotentReplay) {
        const resolvedAgent = await resolveAgentIdentityFromKey(authHeader);
        if (resolvedAgent) {
          (req as any).agent = resolvedAgent;
        }
        return forwardNext();
      }

      const creditCost = Math.max(1, Math.round(endpointConfig.priceUsd * 100));
      const debitResult = await verifyAndDebitAgentCredit(authHeader, creditCost, {
        endpoint: fullPath,
        method: req.method,
        description: `x402 credit access to ${endpointConfig.name} (${req.method} ${fullPath})`
      });

      // 2a: Debit succeeds
      if (debitResult.valid) {
        (req as any).creditsDebited = true;
        (req as any).agent = {
          agentId: debitResult.agentId,
          handle: debitResult.handle,
          displayName: debitResult.displayName
        };
        (req as any).creditsRemaining = debitResult.creditsRemaining;
        return forwardNext();
      }

      // If invalid/revoked/expired API key (401), return 401 Unauthorized
      if (debitResult.statusCode === 401) {
        return res.status(401).json({
          status: 'error',
          code: 'UNAUTHORIZED',
          error: debitResult.error || 'Unauthorized: Invalid Agent API key.'
        });
      }

      // 2b: Debit fails with INSUFFICIENT_FUNDS (402)
      // Do NOT return early plain error JSON! Fall through to standard x402 flow below.
      isCreditsExhausted = true;
      if (debitResult.agentId) {
        (req as any).agent = {
          agentId: debitResult.agentId,
          handle: debitResult.handle,
          displayName: debitResult.displayName
        };
      }
    }

    // ========================================================================
    // REQUIRED FLOW STEP 3: Return complete valid x402 PAYMENT-REQUIRED payload
    // (Reached by anonymous requests, or registered agents with exhausted credits)
    // ========================================================================
    if (!recipientAddress) {
      return res.status(500).json({
        status: 'error',
        code: 'CONFIGURATION_ERROR',
        message:
          'Configuration Error: X402_RECIPIENT_ADDRESS environment variable is not configured. Server cannot accept x402 micropayments or generate payment requirements.',
        endpoint: endpointConfig.name,
        price: endpointConfig.priceDisplay,
        network: 'Base',
        asset: 'USDC'
      });
    }

    const reqs = buildPaymentRequirements();
    if (!reqs) {
      return res.status(500).json({
        status: 'error',
        code: 'CONFIGURATION_ERROR',
        message: 'Failed to construct payment requirement.'
      });
    }

    const { paymentRequiredPayload } = reqs;

    const encodedHeader = encodePaymentRequiredHeader(paymentRequiredPayload);
    res.setHeader('PAYMENT-REQUIRED', encodedHeader);
    res.setHeader('Cache-Control', 'no-store, private');
    return res.status(402).json({
      status: 'payment_required',
      code: 'PAYMENT_REQUIRED',
      statusCode: 402,
      ...paymentRequiredPayload,
      paymentDetails: {
        protocol: 'x402',
        asset: 'USDC',
        network: 'Base',
        networkCaip2: BASE_CAIP2,
        chainId: BASE_CHAIN_ID,
        contractAddress: BASE_USDC_CONTRACT,
        priceUsd: endpointConfig.priceUsd,
        priceDisplay: endpointConfig.priceDisplay,
        amountAtomic: endpointConfig.atomicAmount,
        recipientAddress,
        facilitator: 'Coinbase Developer Platform (CDP) Facilitator',
        facilitatorUrl: 'https://api.cdp.coinbase.com/platform/v2/x402',
        instructions:
          "Sign a USDC transferWithAuthorization (EIP-3009) or permit2 on Base (chain ID 8453) for the required amount and retry with the signed payment payload in the 'PAYMENT-SIGNATURE' header."
      },
      ...(isCreditsExhausted
        ? {
            error: 'Trial credit balance exhausted (0 credits remaining). Pay per call via x402 USDC on Base to continue.',
            creditsRemaining: 0
          }
        : {})
    });
  };
}
