/**
 * SEC Ticker CIK Resolution & Cache Module
 * Provides format checking, CIK lookup against static map and SEC's public company_tickers.json,
 * and 24-hour in-memory cache to ensure zero per-call network overhead on repeated probes.
 */

// High-confidence CIK mapping for market leaders
export const TICKER_TO_CIK: Record<string, string> = {
  AAPL: '0000320193',
  NVDA: '0001045810',
  MSFT: '0000789019',
  TSLA: '0001318605',
  GOOGL: '0001652044',
  GOOG: '0001652044',
  AMZN: '0001018724',
  META: '0001326801',
  AMD: '0000002488',
  INTC: '0000050863',
  QCOM: '0000804328',
  'BRK.A': '0001067983',
  'BRK.B': '0001067983',
  BRK: '0001067983',
  JPM: '0000019617',
  PLTR: '0001321655',
  COIN: '0001679788',
  AVGO: '0001730168',
  CRM: '0001108524',
  NFLX: '0001065280',
  ORCL: '0001341439',
  SMCI: '0001375365',
  AEHR: '0001040470'
};

// 24-hour cache for SEC company_tickers.json
let secCompanyTickersCache: Record<string, string> | null = null;
let titleToTickerCache: Record<string, string> | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
let cacheFetchPromise: Promise<Record<string, string> | null> | null = null;

export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    // strip punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    // strip suffixes
    .replace(/\b(INC|CORP|CO|LTD|PLC|CLASS\s+[A-Z0-9]|COM|NEW|GROUP|HOLDINGS?|PARTNERS?|ASSOCIATES?|LP|LLC|TRUST)\b/g, " ")
    // consolidate whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export async function getTitleToTickerMap(): Promise<Record<string, string>> {
  if (titleToTickerCache) return titleToTickerCache;
  try {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': 'StockBloc-SEC-Analyst/2.0 (contact@stockbloc.ai)' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data: any = await res.json();
      const map: Record<string, string> = {};
      for (const key of Object.keys(data)) {
        const item = data[key];
        if (item?.ticker && item?.title) {
          const rawTitle = String(item.title).toUpperCase();
          const cleanTitle = normalizeCompanyName(rawTitle);
          if (cleanTitle) {
            map[cleanTitle] = String(item.ticker).toUpperCase();
          }
        }
      }
      titleToTickerCache = map;
      return map;
    }
  } catch (err) {
    console.warn('[secTickerLookup] getTitleToTickerMap error:', err);
  }
  return {};
}

async function refreshSecCompanyTickersCache(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (secCompanyTickersCache && (now - lastCacheFetchTime < CACHE_TTL_MS)) {
    return secCompanyTickersCache;
  }
  if (cacheFetchPromise) {
    return cacheFetchPromise;
  }

  cacheFetchPromise = (async () => {
    try {
      const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
        headers: { 'User-Agent': 'StockBloc-SEC-Analyst/2.0 (contact@stockbloc.ai)' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data: any = await res.json();
        const map: Record<string, string> = {};
        for (const key of Object.keys(data)) {
          const item = data[key];
          if (item?.ticker && item?.cik_str) {
            const t = String(item.ticker).toUpperCase().trim();
            const cikStr = String(item.cik_str).padStart(10, '0');
            map[t] = cikStr;
          }
        }
        secCompanyTickersCache = map;
        lastCacheFetchTime = Date.now();
        return map;
      }
      return secCompanyTickersCache;
    } catch (err) {
      console.warn('[secTickerLookup] SEC company_tickers.json fetch warning:', (err as any)?.message || err);
      return secCompanyTickersCache;
    } finally {
      cacheFetchPromise = null;
    }
  })();

  return cacheFetchPromise;
}

export interface CikLookupResult {
  cik: string | null;
  secReachable: boolean;
}

/**
 * Resolves a ticker symbol to a 10-digit CIK string.
 * Returns { cik: string | null, secReachable: boolean }.
 */
export async function lookupTickerCik(ticker: string): Promise<CikLookupResult> {
  if (!ticker || typeof ticker !== 'string') {
    return { cik: null, secReachable: true };
  }
  const norm = ticker.toUpperCase().trim();
  if (TICKER_TO_CIK[norm]) {
    return { cik: TICKER_TO_CIK[norm], secReachable: true };
  }

  if (secCompanyTickersCache && secCompanyTickersCache[norm]) {
    return { cik: secCompanyTickersCache[norm], secReachable: true };
  }

  // Attempt refresh if not in static or existing cache
  const fullMap = await refreshSecCompanyTickersCache();
  if (fullMap && fullMap[norm]) {
    return { cik: fullMap[norm], secReachable: true };
  }

  // If fullMap is null and we had no cache, SEC might be unreachable
  const isReachable = Boolean(fullMap || secCompanyTickersCache || Object.keys(TICKER_TO_CIK).length > 0);
  return { cik: null, secReachable: isReachable };
}

/**
 * Backward-compatible helper returning string | null
 */
export async function resolveTickerCik(ticker: string): Promise<string | null> {
  const res = await lookupTickerCik(ticker);
  return res.cik;
}
