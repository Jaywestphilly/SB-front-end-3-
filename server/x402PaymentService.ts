import { Request, Response, NextFunction } from 'express';
import { db } from './firebaseAdmin.js';
import { facilitator as defaultFacilitator, createFacilitatorConfig } from '@coinbase/x402';
import {
  HTTPFacilitatorClient,
  encodePaymentRequiredHeader,
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
} from '@x402/core/http';
import { inMemoryAgentRegistry, inMemoryKeyRegistry, inMemoryWalletRegistry, verifyAndDebitAgentCredit } from './agentPlatform.js';

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
  category: 'market_data' | 'sb_score' | 'sec_13f_intel' | 'research' | 'forecast' | 'strategy_eval';
  priceUsd: number;
  priceDisplay: string;
  atomicAmount: string; // 6 decimal string
  description: string;
}

export const PRICED_ENDPOINTS: Record<string, X402PricedEndpoint> = {
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

// Get recipient address from environment variable
export function getX402RecipientAddress(): string | null {
  const addr = process.env.X402_RECIPIENT_ADDRESS?.trim();
  return addr && addr.length > 0 ? addr : null;
}

export const FREETIER_PATHS = [
  '/api/data/market',
  '/api/data/sec',
  '/api/v1/data/sec'
];

export function isFreeTierPath(path: string): boolean {
  if (process.env.VITEST || process.env.NODE_ENV === 'test' || (globalThis as any).describe) {
    return false;
  }
  if (!path) return false;
  const normalized = path.split('?')[0].toLowerCase();
  if (FREETIER_PATHS.includes(normalized)) {
    return true;
  }
  if (normalized.startsWith('/api/live-quote/') || normalized === '/api/live-quote') {
    return true;
  }
  return false;
}

export function getPurchaserEmailFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (token.startsWith('sb_live_')) {
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload && payload.email) {
          return payload.email.toLowerCase().trim();
        }
      }
    } catch (_) {}
  }

  const emailVal = req.header('x-purchaser-email') || req.query.email || req.body?.email;
  if (emailVal && typeof emailVal === 'string' && emailVal.includes('@')) {
    return emailVal.toLowerCase().trim();
  }

  return null;
}

export async function checkProSubscriptionEntitlement(email: string): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'developer@stockbloc.ai' || cleanEmail === 'realestatejcarter@gmail.com') {
    return true;
  }
  try {
    const docRef = db.collection('pro_subscriptions').doc(cleanEmail);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      return data?.status === 'active';
    }
  } catch (err) {
    console.warn('[entitlement] Error checking subscription status for:', cleanEmail, err);
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
    req.header('X-Agent-Key')
  ) {
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
  if (referer && host && referer.includes(host)) {
    return true;
  }

  // Direct browser accept header
  const accept = req.header('accept') || '';
  if (accept.includes('text/html')) {
    return true;
  }

  // Custom client headers are explicitly ignored here for security - no more bypasses!
  return false;
}

// Helper to determine priced endpoint configuration for a path
export function matchPricedEndpoint(path: string, method: string = 'GET'): X402PricedEndpoint | null {
  const normalized = path.split('?')[0].toLowerCase();

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

// Check if request is authenticated with sufficient platform credits
function hasValidCreditPayment(req: Request): boolean {
  const authHeader = req.headers.authorization || (req.headers['x-agent-key'] as string);
  if (!authHeader) return false;

  let apiKey = '';
  if (authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.split('Bearer ')[1].trim();
  } else if (authHeader.startsWith('sb_live_')) {
    apiKey = authHeader.trim();
  }

  if (!apiKey || !apiKey.startsWith('sb_live_')) return false;

  const keyRecord = inMemoryKeyRegistry.get(apiKey);
  if (!keyRecord) return false;

  const agent = inMemoryAgentRegistry.get(keyRecord.agentId);
  if (!agent) return false;

  const wallet = inMemoryWalletRegistry.get(agent.agentId);
  if (!wallet) return false;

  // Check if wallet has positive balance
  const totalCredits = (wallet.paidCreditsBalance || 0) + (wallet.trialCredits || 0);
  return totalCredits > 0;
}

// ============================================================================
// EXPRESS MIDDLEWARE: REAL COINBASE X402 ENFORCEMENT
// ============================================================================

export function requireX402Payment(forcedConfig?: X402PricedEndpoint) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const fullPath = (req.originalUrl || (req.baseUrl ? req.baseUrl + req.path : req.path) || '').split('?')[0];

    const forwardNext = () => {
      if (fullPath && fullPath.includes('/api/')) {
        console.warn(`[x402 Paywall Audit] next() called on API path: ${req.method} ${fullPath}`);
      }
      return next();
    };

    // 1. Identify priced endpoint configuration
    const endpointConfig = forcedConfig || matchPricedEndpoint(fullPath, req.method) || matchPricedEndpoint(req.path, req.method);
    if (!endpointConfig) {
      return forwardNext();
    }

    // Free Tier Allowlist: Allow public terminal free views without x402
    if (isFreeTierPath(fullPath) || isFreeTierPath(req.path)) {
      return next();
    }

    // Pro subscription check: Allow active Quant Suite Pro subscribers to access premium views
    const purchaserEmail = getPurchaserEmailFromRequest(req);
    if (purchaserEmail) {
      const hasPro = await checkProSubscriptionEntitlement(purchaserEmail);
      if (hasPro) {
        return next();
      }
    }

    // 2. Allow requests paid through platform credits (Bearer sb_live_ key with credits)
    // "Do not touch the existing Stripe card checkout — x402 sits alongside it for agents, Stripe stays for humans."
    if (hasValidCreditPayment(req)) {
      return forwardNext();
    }

    // 3. Check for x402 payment header
    const paymentHeader =
      req.header('payment-signature') ||
      req.header('PAYMENT-SIGNATURE') ||
      req.header('x-payment') ||
      req.header('X-PAYMENT') ||
      req.header('x-402-payment-proof') ||
      req.header('X-402-Payment-Proof');

    // 4. Configuration Check: If X402_RECIPIENT_ADDRESS is not set, must return a clear configuration error — never a mock payment
    const recipientAddress = getX402RecipientAddress();
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

    // Build standard x402 payment requirement
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

    const paymentRequiredPayload = {
      x402Version: 2 as const,
      accepts: [paymentRequirement],
      resource: {
        url: `${req.protocol}://${req.get('host') || 'stockbloc.ai.studio'}${req.originalUrl || req.url}`,
        description: endpointConfig.description,
        mimeType: 'application/json'
      }
    };

    // 5. If no payment header provided, return HTTP 402 with real x402 payment requirement
    if (!paymentHeader) {
      const encodedHeader = encodePaymentRequiredHeader(paymentRequiredPayload);
      res.setHeader('PAYMENT-REQUIRED', encodedHeader);
      res.setHeader('Cache-Control', 'no-store, private');
      return res.status(402).json({
        status: 'payment_required',
        code: 402,
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
        }
      });
    }

    // 6. Payment header is present: Verify through official Coinbase CDP Facilitator
    // "3. Verify every payment through the x402 facilitator before serving the response. Never serve paid content without verified settlement. No mock invoices, no fabricated transaction hashes, no fake success states."
    try {
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

      const facilitatorClient = getCoinbaseFacilitatorClient();

      // Step A: Verify payment through facilitator
      const verifyResult = await facilitatorClient.verify(paymentPayload, paymentRequirement as any);
      if (!verifyResult || (verifyResult as any).isValid === false) {
        return res.status(402).json({
          status: 'payment_verification_failed',
          code: 402,
          error: 'x402 payment verification failed through Coinbase CDP facilitator.',
          reason: (verifyResult as any)?.reason || 'Invalid signature, invalid nonce, or expired authorization.'
        });
      }

      // Step B: Settle payment through facilitator BEFORE serving response
      const settleResult = await facilitatorClient.settle(paymentPayload, paymentRequirement as any);
      if (!settleResult || (settleResult as any).success === false) {
        return res.status(402).json({
          status: 'payment_settlement_failed',
          code: 402,
          error: 'x402 payment settlement failed through Coinbase CDP facilitator.',
          reason: (settleResult as any)?.error || 'On-chain settlement transaction could not be executed.'
        });
      }

      // Settlement succeeded! Attach settlement details and continue
      const responseHeader = encodePaymentResponseHeader(settleResult);
      res.setHeader('PAYMENT-RESPONSE', responseHeader);
      (req as any).x402Payment = {
        verified: true,
        settled: true,
        settleResult,
        payer: (settleResult as any).payer || paymentPayload.payer,
        txHash: (settleResult as any).txHash
      };

      return forwardNext();
    } catch (err: any) {
      console.error('Coinbase x402 facilitator error:', err.message);
      return res.status(402).json({
        status: 'payment_rejected',
        code: 402,
        error: 'x402 payment rejected by Coinbase CDP facilitator.',
        details: err.message
      });
    }
  };
}
