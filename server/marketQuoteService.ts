import { MarketDataService } from '../src/services/marketDataService.js';

export interface RealQuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high52?: number;
  low52?: number;
  volume: string;
  lastUpdated: string;
  isRealTime: boolean;
  isStale?: boolean;
  staleReason?: string;
  refreshSchedule: string;
  dataAgeHours?: number;
}

interface CachedQuoteEntry {
  quote: RealQuoteResult;
  cachedAt: number;
}

const quoteCache = new Map<string, CachedQuoteEntry>();
const QUOTE_CACHE_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Normalizes ticker symbols for upstream Yahoo Finance lookup.
 * Supports:
 * - US equities: NVDA, AAPL, MSFT, TSLA, VST, ASTS, etc.
 * - Hong Kong: 0700.HK, 9988.HK, etc.
 * - India NSE: RELIANCE.NS, TCS.NS, INFY.NS, etc.
 * - India BSE: RELIANCE.BO, 500325.BO, etc.
 * - Crypto: BTC, ETH, SOL, DOGE, DOT -> mapped to *-USD
 */
export function normalizeYahooSymbol(symbol: string): string {
  const symUpper = symbol.toUpperCase().trim();
  const cryptoMap: Record<string, string> = {
    BTC: 'BTC-USD',
    ETH: 'ETH-USD',
    SOL: 'SOL-USD',
    DOGE: 'DOGE-USD',
    DOT: 'DOT-USD',
  };
  return cryptoMap[symUpper] || symUpper;
}

/**
 * Validates a symbol string format.
 */
export function isValidSymbolFormat(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  const s = symbol.trim();
  if (s.length === 0 || s.length > 20) return false;
  // Allow alphanumeric characters, dots, dashes, and underscores (e.g. 0700.HK, RELIANCE.NS, BRK.B, BTC-USD)
  return /^[A-Z0-9.\-_]+$/i.test(s);
}

/**
 * Fetches real stock quote directly from Yahoo Finance API.
 * Uses strict timeouts (3500ms max per attempt) with AbortController so connections never hang.
 * Returns null if symbol is not found (404/empty) or upstream fails. Never returns synthetic data.
 */
export async function fetchYahooQuote(symbol: string, timeoutMs = 3500): Promise<RealQuoteResult | null> {
  const symUpper = symbol.toUpperCase().trim();
  const yahooSym = normalizeYahooSymbol(symUpper);
  
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta && typeof meta.regularMarketPrice === 'number' && !isNaN(meta.regularMarketPrice) && meta.regularMarketPrice > 0) {
          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose || price;
          const change = Number((price - prevClose).toFixed(2));
          const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
          const vol = meta.regularMarketVolume;
          const volumeFormatted = vol 
            ? (vol > 1e9 ? `$${(vol/1e9).toFixed(1)}B` : vol > 1e6 ? `$${(vol/1e6).toFixed(1)}M` : `${vol}`)
            : 'N/A';

          return {
            symbol: symUpper,
            name: meta.longName || meta.shortName || symUpper,
            price: Number(price.toFixed(2)),
            change,
            changePercent,
            high52: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
            low52: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
            volume: volumeFormatted,
            lastUpdated: new Date().toISOString(),
            isRealTime: true,
            refreshSchedule: "Real-Time Live Streaming"
          };
        }
      }
    } catch {
      // Continue to failover URL or return null
    }
  }

  return null;
}

/**
 * Fetches real stock quote with caching and verified watchlist lookup failover.
 * NEVER returns synthetic or fabricated data.
 */
export async function fetchRealStockQuote(symbol: string, forceRefresh = false, timeoutMs = 3500): Promise<RealQuoteResult | null> {
  const symUpper = symbol.toUpperCase().trim();
  const now = Date.now();

  // 1. Check 30-second in-memory cache
  const cached = quoteCache.get(symUpper);
  if (!forceRefresh && cached && (now - cached.cachedAt < QUOTE_CACHE_DURATION_MS)) {
    return {
      ...cached.quote,
      dataAgeHours: Number(((now - cached.cachedAt) / 3600000).toFixed(2)),
      refreshSchedule: "Real-Time Live Streaming"
    };
  }

  // 2. Upstream Yahoo Finance real lookup
  let resultQuote = await fetchYahooQuote(symUpper, timeoutMs);

  // 3. Failover: Check persisted verified Super Sonic Tsunami dataset (for pre-computed snapshots)
  if (!resultQuote) {
    try {
      const persisted = MarketDataService.loadPersistedData();
      const found = persisted?.watchlist?.find((s: any) => 
        s.symbol.toUpperCase() === symUpper || 
        (symUpper === 'SPACEX' && s.symbol.toUpperCase() === 'SPCX')
      );
      if (found && typeof found.price === 'number' && found.price > 0) {
        resultQuote = {
          symbol: symUpper,
          name: found.name || symUpper,
          price: found.price,
          change: found.change || 0,
          changePercent: found.percent_change || 0,
          high52: found.high52,
          low52: found.low52,
          volume: found.volume ? String(found.volume) : "N/A",
          lastUpdated: found.last_updated || persisted?.updated_at || new Date().toISOString(),
          isRealTime: false,
          isStale: true,
          staleReason: "Live feed unavailable. Displaying last verified dataset snapshot.",
          refreshSchedule: "Verified Snapshot Cache"
        };
      }
    } catch {
      // Pass through
    }
  }

  if (resultQuote) {
    quoteCache.set(symUpper, { quote: resultQuote, cachedAt: now });
  }

  return resultQuote;
}
