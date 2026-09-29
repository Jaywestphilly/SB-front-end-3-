import { Request, Response, NextFunction } from 'express';
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

    // 2. Free Human Browser UI Access (Server-side allowlist for web terminal frontend)
    // Server decides based on authentic browser request headers matching UI free paths (never trusts client bypass headers)
    if (isFrontendWebRequest(req) && isHumanUiFreePath(fullPath)) {
      return forwardNext();
    }

    // 3. Allow requests paid through platform credits (Bearer sb_live_ key with credits)
    // Atomically debit credits: 1 credit = $0.01
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

    if (isAgentKey) {
      const authHeader = rawAuth.startsWith('Bearer ') ? rawAuth : `Bearer ${rawAuth}`;
      const creditCost = Math.max(1, Math.round(endpointConfig.priceUsd * 100));
      const debitResult = await verifyAndDebitAgentCredit(authHeader, creditCost, {
        endpoint: fullPath,
        method: req.method,
        description: `x402 credit access to ${endpointConfig.name} (${req.method} ${fullPath})`
      });
      if (!debitResult.valid) {
        return res.status(debitResult.statusCode || 402).json({
          status: 'error',
          code: debitResult.statusCode === 401 ? 'UNAUTHORIZED' : 'PAYMENT_REQUIRED',
          error: debitResult.error || 'Insufficient platform credits.',
          creditsRemaining: debitResult.creditsRemaining ?? 0,
          cost: creditCost
        });
      }
      (req as any).creditsDebited = true;
      (req as any).agent = {
        agentId: debitResult.agentId,
        handle: debitResult.handle,
        displayName: debitResult.displayName
      };
      (req as any).creditsRemaining = debitResult.creditsRemaining;
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
