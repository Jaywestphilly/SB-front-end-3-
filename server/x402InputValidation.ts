import { lookupTickerCik } from './secTickerLookup.js';

export interface ValidationSuccess {
  valid: true;
}

export interface ValidationFailure {
  valid: false;
  status: number;
  code: string;
  error: string;
  message: string;
  field?: string;
  example?: any;
  charged: false;
  allowHeader?: string;
  customJson?: any;
}

export type PricedValidationResult = ValidationSuccess | ValidationFailure;

// Accepted symbol format: starts with alphanumeric, followed by up to 19 valid characters
// Accepts NVDA, BRK.B, 0700.HK, RELIANCE.NS, 500325.BO, BTC-USD
const SYMBOL_REGEX = /^[A-Z0-9][A-Z0-9._-]{0,19}$/;

export function isValidSymbolFormat(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  const trimmed = symbol.trim().toUpperCase();
  return SYMBOL_REGEX.test(trimmed);
}

/**
 * Validates request format and constraints before issuing any x402 challenge or processing payment.
 * Ensures malformed requests fail free (charged: false) without touching facilitators or internal handlers.
 */
export async function validatePricedRequestInput(
  endpointId: string,
  rawPath: string,
  method: string,
  query: any = {},
  body: any = {}
): Promise<PricedValidationResult> {
  const normMethod = (method || 'GET').toUpperCase();
  if (normMethod === 'OPTIONS') {
    return { valid: true };
  }
  const normalizedPath = rawPath.split('?')[0].toLowerCase();

  // 1. market_data
  if (endpointId === 'market_data') {
    // GET only, except POST /api/live-quotes/batch
    if (normalizedPath === '/api/live-quotes/batch') {
      if (normMethod !== 'POST') {
        return {
          valid: false,
          status: 405,
          code: 'METHOD_NOT_ALLOWED',
          error: 'Method Not Allowed. Use POST for batch live quotes.',
          message: 'Method Not Allowed. Use POST for batch live quotes.',
          allowHeader: 'POST',
          charged: false
        };
      }
      if (body?.symbols !== undefined) {
        if (!Array.isArray(body.symbols) || body.symbols.length === 0) {
          return {
            valid: false,
            status: 400,
            code: 'INVALID_INPUT',
            error: 'Invalid input: "symbols" must be a non-empty array of strings.',
            message: 'Invalid input: "symbols" must be a non-empty array of strings.',
            field: 'symbols',
            charged: false
          };
        }
        for (const s of body.symbols) {
          if (!isValidSymbolFormat(String(s))) {
            return {
              valid: false,
              status: 400,
              code: 'INVALID_INPUT',
              error: `Invalid symbol format: "${s}".`,
              message: `Invalid symbol format: "${s}".`,
              field: 'symbols',
              charged: false
            };
          }
        }
      }
      return { valid: true };
    }

    if (normMethod !== 'GET') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. market_data endpoints require GET.',
        message: 'Method Not Allowed. market_data endpoints require GET.',
        allowHeader: 'GET',
        charged: false
      };
    }

    // Exact /api/v1/market/quote and /api/live-quote (requires symbol or ticker)
    if (normalizedPath === '/api/v1/market/quote' || normalizedPath === '/api/live-quote') {
      const sym = query.symbol || query.ticker;
      if (!sym || typeof sym !== 'string' || !sym.trim()) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: 'Validation error: "symbol" or "ticker" query parameter is required.',
          message: 'Validation error: "symbol" or "ticker" query parameter is required.',
          field: 'symbol',
          example: {
            method: 'GET',
            url: 'https://stockbloc.ai.studio/api/v1/market/quote?ticker=AAPL'
          },
          charged: false
        };
      }
      if (!isValidSymbolFormat(String(sym))) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Invalid symbol format: "${sym}".`,
          message: `Invalid symbol format: "${sym}".`,
          field: 'symbol',
          example: {
            method: 'GET',
            url: 'https://stockbloc.ai.studio/api/v1/market/quote?ticker=AAPL'
          },
          charged: false
        };
      }
      try {
        const { cik, secReachable } = await lookupTickerCik(String(sym));
        if (!cik && secReachable) {
          return {
            valid: false,
            status: 404,
            code: 'UNKNOWN_TICKER',
            error: 'unknown_ticker',
            message: 'unknown_ticker',
            customJson: { error: 'unknown_ticker' },
            charged: false
          } as any;
        }
      } catch {}
      return { valid: true };
    }

    // Param path forms: /api/v1/market/quote/:symbol and /api/live-quote/:symbol
    if (normalizedPath.startsWith('/api/v1/market/quote/') || normalizedPath.startsWith('/api/live-quote/')) {
      const prefix = normalizedPath.startsWith('/api/v1/market/quote/')
        ? '/api/v1/market/quote/'
        : '/api/live-quote/';
      const rawSegment = normalizedPath.substring(prefix.length);
      const decoded = decodeURIComponent(rawSegment.split('/')[0] || '').trim();
      if (!decoded || !isValidSymbolFormat(decoded)) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Invalid symbol format in path: "${decoded}".`,
          message: `Invalid symbol format in path: "${decoded}".`,
          field: 'symbol',
          example: {
            method: 'GET',
            url: 'https://stockbloc.ai.studio/api/v1/market/quote?symbol=AAPL'
          },
          charged: false
        };
      }
      try {
        const { cik, secReachable } = await lookupTickerCik(decoded);
        if (!cik && secReachable) {
          return {
            valid: false,
            status: 404,
            code: 'UNKNOWN_TICKER',
            error: 'unknown_ticker',
            message: 'unknown_ticker',
            customJson: { error: 'unknown_ticker' },
            charged: false
          } as any;
        }
      } catch {}
      return { valid: true };
    }

    // GET /api/data/market and /api/data/market.csv
    if (normalizedPath === '/api/data/market' || normalizedPath === '/api/data/market.csv') {
      const sym = query.symbol || query.ticker;
      if (sym && !isValidSymbolFormat(String(sym))) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Invalid symbol format: "${sym}".`,
          message: `Invalid symbol format: "${sym}".`,
          field: 'symbol',
          charged: false
        };
      }
      return { valid: true };
    }

    // Any other path that matched only by prefix returns 400 unknown_route
    return {
      valid: false,
      status: 400,
      code: 'INVALID_INPUT',
      error: 'unknown_route: Unrecognized market_data path.',
      message: 'unknown_route: Unrecognized market_data path.',
      charged: false
    };
  }

  // 2. sb_score
  if (endpointId === 'sb_score') {
    if (normMethod !== 'GET') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. sb_score endpoints require GET.',
        message: 'Method Not Allowed. sb_score endpoints require GET.',
        allowHeader: 'GET',
        charged: false
      };
    }
    const isHistory = normalizedPath.includes('/sb-score/history');
    const ticker = query.ticker || query.symbol;
    if (isHistory) {
      if (!ticker || typeof ticker !== 'string' || !ticker.trim()) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: 'Validation error: "ticker" query parameter is required for score history.',
          message: 'Validation error: "ticker" query parameter is required for score history.',
          field: 'ticker',
          charged: false
        };
      }
      if (!isValidSymbolFormat(String(ticker))) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Invalid ticker format: "${ticker}".`,
          message: `Invalid ticker format: "${ticker}".`,
          field: 'ticker',
          charged: false
        };
      }
    } else if (ticker && !isValidSymbolFormat(String(ticker))) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: `Invalid ticker format: "${ticker}".`,
        message: `Invalid ticker format: "${ticker}".`,
        field: 'ticker',
        charged: false
      };
    }
    return { valid: true };
  }

  // 3. earnings_pack
  if (endpointId === 'earnings_pack') {
    if (normMethod !== 'GET') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. earnings_pack requires GET.',
        message: 'Method Not Allowed. earnings_pack requires GET.',
        allowHeader: 'GET',
        charged: false
      };
    }
    const ticker = query.ticker || query.symbol;
    if (!ticker || typeof ticker !== 'string' || !ticker.trim()) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: 'Validation error: "ticker" query parameter is required for earnings pack.',
        message: 'Validation error: "ticker" query parameter is required for earnings pack.',
        field: 'ticker',
        example: {
          method: 'GET',
          url: 'https://stockbloc.ai.studio/api/v1/intelligence/earnings-pack?ticker=AAPL'
        },
        charged: false
      };
    }
    if (!isValidSymbolFormat(String(ticker))) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: `Invalid ticker format: "${ticker}".`,
        message: `Invalid ticker format: "${ticker}".`,
        field: 'ticker',
        example: {
          method: 'GET',
          url: 'https://stockbloc.ai.studio/api/v1/intelligence/earnings-pack?ticker=AAPL'
        },
        charged: false
      };
    }
    return { valid: true };
  }

  // 4. sec_job
  if (endpointId === 'sec_job') {
    if (normMethod !== 'POST') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. sec_job endpoints require POST.',
        message: 'Method Not Allowed. sec_job endpoints require POST.',
        allowHeader: 'POST',
        charged: false
      };
    }
    const { ticker, filingType, mode } = body || {};
    const normFilingType = String(filingType || '').trim().toUpperCase();

    if (normFilingType === '10-Q' || normFilingType === '10Q') {
      return {
        valid: false,
        status: 400,
        code: '10Q_UNAVAILABLE',
        error: '10-Q diff temporarily unavailable. Use filingType 10-K.',
        message: '10-Q diff temporarily unavailable. Use filingType 10-K.',
        charged: false,
        customJson: {
          error: '10-Q diff temporarily unavailable. Use filingType 10-K.',
          supportedFilingTypes: ['10-K']
        }
      };
    }

    const secJobExample = {
      method: 'POST',
      url: normalizedPath.includes('/analyst')
        ? 'https://stockbloc.ai.studio/api/v1/sec/analyst'
        : 'https://stockbloc.ai.studio/api/v1/sec/job',
      body: {
        ticker: 'AAPL',
        filingType: '10-K'
      }
    };

    if (!ticker || typeof ticker !== 'string' || !ticker.trim()) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: 'Validation error: "ticker" is required and cannot be empty.',
        message: 'Validation error: "ticker" is required and cannot be empty.',
        field: 'ticker',
        example: secJobExample,
        charged: false
      };
    }
    if (!isValidSymbolFormat(String(ticker))) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: `Invalid ticker format: "${ticker}".`,
        message: `Invalid ticker format: "${ticker}".`,
        field: 'ticker',
        example: secJobExample,
        charged: false
      };
    }
    const allowedTypes = ['10-K', '10-Q', '8-K'];
    if (!normFilingType || !allowedTypes.includes(normFilingType)) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: `Validation error: "filingType" must be one of: ${allowedTypes.join(', ')}.`,
        message: `Validation error: "filingType" must be one of: ${allowedTypes.join(', ')}.`,
        field: 'filingType',
        example: secJobExample,
        charged: false
      };
    }

    if (mode !== undefined && mode !== null) {
      if (typeof mode !== 'string' || (mode !== 'standard' && mode !== 'diff')) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: 'Validation error: "mode" must be one of: standard, diff.',
          message: 'Validation error: "mode" must be one of: standard, diff.',
          field: 'mode',
          example: secJobExample,
          charged: false
        };
      }
      if (mode === 'diff' && normFilingType === '8-K') {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: 'Validation error: mode "diff" supports 10-K and 10-Q only. Received: 8-K.',
          message: 'Validation error: mode "diff" supports 10-K and 10-Q only. Received: 8-K.',
          field: 'filingType',
          example: secJobExample,
          charged: false
        };
      }
    }

    // Pre-402 CIK lookup
    try {
      const { cik, secReachable } = await lookupTickerCik(String(ticker));
      if (!cik) {
        if (!secReachable) {
          return {
            valid: false,
            status: 503,
            code: 'SEC_UNREACHABLE',
            error: 'Service Unavailable: U.S. SEC EDGAR system unreachable.',
            message: 'Service Unavailable: U.S. SEC EDGAR system unreachable.',
            charged: false
          };
        }
        return {
          valid: false,
          status: 404,
          code: 'TICKER_NOT_FOUND',
          error: `Ticker "${ticker.toUpperCase().trim()}" not found in U.S. SEC EDGAR directory.`,
          message: `Ticker "${ticker.toUpperCase().trim()}" not found in U.S. SEC EDGAR directory.`,
          field: 'ticker',
          charged: false
        };
      }
    } catch {
      return {
        valid: false,
        status: 503,
        code: 'SEC_UNREACHABLE',
        error: 'Service Unavailable: SEC directory check failed.',
        message: 'Service Unavailable: SEC directory check failed.',
        charged: false
      };
    }

    return { valid: true };
  }

  // 5. sec_13f_intel
  if (endpointId === 'sec_13f_intel') {
    if (normMethod !== 'GET') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. sec_13f_intel requires GET.',
        message: 'Method Not Allowed. sec_13f_intel requires GET.',
        allowHeader: 'GET',
        charged: false
      };
    }
    return { valid: true };
  }

  // 6. research
  if (endpointId === 'research') {
    if (normMethod !== 'POST') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. research endpoints require POST.',
        message: 'Method Not Allowed. research endpoints require POST.',
        allowHeader: 'POST',
        charged: false
      };
    }
    if (normalizedPath.endsWith('/theses')) {
      const { asset, direction, thesis } = body || {};
      if (!asset || !direction || !thesis) {
        const missing = !asset ? 'asset' : (!direction ? 'direction' : 'thesis');
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Validation error: "${missing}" is required for research thesis.`,
          message: `Validation error: "${missing}" is required for research thesis.`,
          field: missing,
          charged: false
        };
      }
    } else {
      const { title, summary, thesis } = body || {};
      if (!title || !summary || !thesis) {
        const missing = !title ? 'title' : (!summary ? 'summary' : 'thesis');
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Validation error: "${missing}" is required for research memo.`,
          message: `Validation error: "${missing}" is required for research memo.`,
          field: missing,
          charged: false
        };
      }
    }
    return { valid: true };
  }

  // 7. forecast
  if (endpointId === 'forecast') {
    if (normMethod !== 'POST') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. forecast endpoints require POST.',
        message: 'Method Not Allowed. forecast endpoints require POST.',
        allowHeader: 'POST',
        charged: false
      };
    }
    const { question, asset, direction, timeHorizon, resolutionCriteria, probability } = body || {};
    const required = [
      { key: 'question', val: question },
      { key: 'asset', val: asset },
      { key: 'direction', val: direction },
      { key: 'timeHorizon', val: timeHorizon },
      { key: 'resolutionCriteria', val: resolutionCriteria }
    ];
    for (const r of required) {
      if (!r.val || typeof r.val !== 'string' || !r.val.trim()) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Validation error: "${r.key}" is required for forecast.`,
          message: `Validation error: "${r.key}" is required for forecast.`,
          field: r.key,
          charged: false
        };
      }
    }
    if (typeof probability !== 'number' || isNaN(probability) || probability < 0 || probability > 100) {
      return {
        valid: false,
        status: 400,
        code: 'INVALID_INPUT',
        error: 'Validation error: "probability" must be a numeric value between 0 and 100.',
        message: 'Validation error: "probability" must be a numeric value between 0 and 100.',
        field: 'probability',
        charged: false
      };
    }
    return { valid: true };
  }

  // 8. strategy_eval
  if (endpointId === 'strategy_eval') {
    if (normMethod !== 'POST') {
      return {
        valid: false,
        status: 405,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method Not Allowed. strategy_eval endpoints require POST.',
        message: 'Method Not Allowed. strategy_eval endpoints require POST.',
        allowHeader: 'POST',
        charged: false
      };
    }
    if (normalizedPath.endsWith('/submit-performance')) {
      const tickerOrAsset = body?.ticker || body?.asset;
      const rationaleOrThesis = body?.rationale || body?.thesis;
      if (!tickerOrAsset || !rationaleOrThesis) {
        const missing = !tickerOrAsset ? 'ticker' : 'rationale';
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: `Validation error: "${missing}" is required for performance submission.`,
          message: `Validation error: "${missing}" is required for performance submission.`,
          field: missing,
          charged: false
        };
      }
      if (body?.action !== undefined) {
        const allowedActions = ['LONG', 'BUY', 'ACCUMULATE', 'CALL', 'SHORT', 'HEDGE'];
        const actionStr = String(body.action).trim().toUpperCase();
        if (!allowedActions.includes(actionStr)) {
          return {
            valid: false,
            status: 400,
            code: 'INVALID_INPUT',
            error: `Validation error: "action" must be one of: ${allowedActions.join(', ')}.`,
            message: `Validation error: "action" must be one of: ${allowedActions.join(', ')}.`,
            field: 'action',
            charged: false
          };
        }
      }
      return { valid: true };
    }

    if (body?.allocation !== undefined) {
      const alloc = body.allocation;
      if (!alloc || typeof alloc !== 'object' || Array.isArray(alloc) || Object.keys(alloc).length === 0) {
        return {
          valid: false,
          status: 400,
          code: 'INVALID_INPUT',
          error: 'Validation error: "allocation" must be a non-empty object with non-negative numeric weights.',
          message: 'Validation error: "allocation" must be a non-empty object with non-negative numeric weights.',
          field: 'allocation',
          charged: false
        };
      }
      for (const [k, v] of Object.entries(alloc)) {
        if (typeof v !== 'number' || isNaN(v) || (v as number) < 0) {
          return {
            valid: false,
            status: 400,
            code: 'INVALID_INPUT',
            error: `Validation error: allocation for "${k}" must be a non-negative number.`,
            message: `Validation error: allocation for "${k}" must be a non-negative number.`,
            field: 'allocation',
            charged: false
          };
        }
      }
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Validates the optional 'limit' query parameter for SEC 13F intelligence (GET /api/data/sec, /api/v1/data/sec).
 * Valid limits are integers between 1 and 50 inclusive.
 * Rejects bad values with 400 (to be evaluated AFTER payment verification).
 */
export function validateSecLimit(limitParam: any): { valid: boolean; limit?: number; error?: string } {
  if (limitParam === undefined || limitParam === null || limitParam === '') {
    return { valid: true };
  }
  const str = String(limitParam).trim();
  if (!/^-?\d+$/.test(str)) {
    return { valid: false, error: 'Query parameter "limit" must be an integer between 1 and 50.' };
  }
  const parsed = parseInt(str, 10);
  if (parsed < 1 || parsed > 50) {
    return { valid: false, error: 'Query parameter "limit" must be an integer between 1 and 50.' };
  }
  return { valid: true, limit: parsed };
}
