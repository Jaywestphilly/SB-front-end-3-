import { MarketDataService } from '../src/services/marketDataService.js';

export interface RealQuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  previousCloseDate: string | null;
  high52?: number;
  low52?: number;
  volume: number | string;
  dollarVolume?: string;
  lastUpdated: string;
  data_as_of?: string;
  servedAt?: string;
  isRealTime: boolean;
  priceLabel?: string;
  isStale?: boolean;
  staleReason?: string;
  note?: string;
  refreshSchedule: string;
  marketState?: string;
  dataAgeHours?: number;
}

interface CachedQuoteEntry {
  quote: RealQuoteResult;
  cachedAt: number;
}

const quoteCache = new Map<string, CachedQuoteEntry>();
const QUOTE_CACHE_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Converts a Unix timestamp in seconds to a YYYY-MM-DD date string in US Eastern time (America/New_York).
 */
function getNYDateStr(tsSec: number): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(new Date(tsSec * 1000));
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return new Date(tsSec * 1000).toISOString().split('T')[0];
  }
}

/**
 * Checks whether US stock markets are currently open (9:30 AM - 4:00 PM Eastern Time, Mon-Fri, excluding holidays).
 */
export function isUSMarketOpen(date: Date = new Date()): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    const weekday = getPart('weekday');
    if (weekday === 'Sat' || weekday === 'Sun') {
      return false;
    }

    const month = parseInt(getPart('month'), 10);
    const day = parseInt(getPart('day'), 10);
    const year = parseInt(getPart('year'), 10);
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);

    const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const yyyymmdd = `${year}-${mmdd}`;

    // Standard fixed US market holidays
    const fixedHolidays = new Set([
      '01-01', // New Year's Day
      '06-19', // Juneteenth
      '07-04', // Independence Day
      '12-25'  // Christmas
    ]);
    if (fixedHolidays.has(mmdd)) {
      return false;
    }

    // Common floating market holidays
    const floatingHolidays = new Set([
      // 2025
      '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26', '2025-09-01', '2025-11-27',
      // 2026
      '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-09-07', '2026-11-26',
      // 2027
      '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-09-06', '2027-11-25'
    ]);
    if (floatingHolidays.has(yyyymmdd)) {
      return false;
    }

    // Trading hours: 9:30 AM (570 mins) to 4:00 PM (960 mins)
    const totalMinutes = hour * 60 + minute;
    if (totalMinutes < 570 || totalMinutes >= 960) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes ticker symbols for upstream Yahoo Finance lookup.
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
  return /^[A-Z0-9.\-_]+$/i.test(s);
}

/**
 * Fetches real stock quote directly from Yahoo Finance API.
 */
export async function fetchYahooQuote(symbol: string, timeoutMs = 3500): Promise<RealQuoteResult | null> {
  const symUpper = symbol.toUpperCase().trim();
  const yahooSym = normalizeYahooSymbol(symUpper);
  
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=10d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=10d`
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
        const result = data.chart?.result?.[0];
        const meta = result?.meta;

        if (meta && typeof meta.regularMarketPrice === 'number' && !isNaN(meta.regularMarketPrice) && meta.regularMarketPrice > 0) {
          const price = Number(meta.regularMarketPrice.toFixed(2));
          const timestamps: number[] = result.timestamp || [];
          const quoteCloses: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

          // Group valid daily trading sessions
          const sessionMap = new Map<string, { dateStr: string; close: number; timeSec: number }>();
          for (let i = 0; i < timestamps.length; i++) {
            const ts = timestamps[i];
            const cl = quoteCloses[i];
            if (typeof ts === 'number' && typeof cl === 'number' && !isNaN(cl) && cl > 0) {
              const dateStr = getNYDateStr(ts);
              sessionMap.set(dateStr, { dateStr, close: cl, timeSec: ts });
            }
          }
          const sessions = Array.from(sessionMap.values()).sort((a, b) => a.timeSec - b.timeSec);

          const priceTsSec = typeof meta.regularMarketTime === 'number' && meta.regularMarketTime > 0
            ? meta.regularMarketTime
            : (sessions.length > 0 ? sessions[sessions.length - 1].timeSec : Math.floor(Date.now() / 1000));

          const priceTimeIso = new Date(priceTsSec * 1000).toISOString();

          let prevSession: { dateStr: string; close: number; timeSec: number } | null = null;
          if (sessions.length > 0) {
            const currentDateStr = getNYDateStr(priceTsSec);
            const currentIdx = sessions.findIndex(s => s.dateStr === currentDateStr);

            if (currentIdx > 0) {
              prevSession = sessions[currentIdx - 1];
            } else if (currentIdx === -1 && sessions.length >= 1) {
              prevSession = sessions[sessions.length - 1];
            } else if (currentIdx === 0 && sessions.length >= 2) {
              prevSession = sessions[0];
            }
          }

          let previousClose: number | null = null;
          let previousCloseDate: string | null = null;
          let change: number | null = null;
          let changePercent: number | null = null;
          let note: string | undefined = undefined;

          if (prevSession && typeof prevSession.close === 'number' && prevSession.close > 0) {
            previousClose = Number(prevSession.close.toFixed(2));
            previousCloseDate = prevSession.dateStr;
            change = Number((price - previousClose).toFixed(2));
            changePercent = Number((((price - previousClose) / previousClose) * 100).toFixed(2));
          } else {
            note = 'Valid previous close data unavailable';
          }

          const shareVol = typeof meta.regularMarketVolume === 'number' ? meta.regularMarketVolume : 0;
          const dollarVol = shareVol * price;
          const dollarVolumeFormatted = dollarVol > 0
            ? (dollarVol >= 1e9 ? `$${(dollarVol/1e9).toFixed(1)}B` : dollarVol >= 1e6 ? `$${(dollarVol/1e6).toFixed(1)}M` : `$${Math.round(dollarVol).toLocaleString()}`)
            : 'N/A';

          const open = isUSMarketOpen();
          const yahooState = meta.marketState ? String(meta.marketState).toUpperCase() : '';
          const isAfterHours = yahooState === 'POST' || yahooState === 'POSTPOST' || yahooState === 'PRE' || yahooState === 'PREPRE';

          let priceLabel = 'Last Close';
          let refreshSchedule = 'Market Closed - Last Close';

          if (open) {
            priceLabel = 'Real-Time Live';
            refreshSchedule = 'Real-Time Live Streaming';
          } else if (isAfterHours) {
            priceLabel = 'After-Hours';
            refreshSchedule = 'After-Hours Close';
          } else {
            priceLabel = 'Last Close';
            refreshSchedule = 'Market Closed - Last Close';
          }

          const servedAt = new Date().toISOString();

          return {
            symbol: symUpper,
            name: meta.longName || meta.shortName || symUpper,
            price,
            change,
            changePercent,
            previousClose,
            previousCloseDate,
            high52: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
            low52: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
            volume: shareVol,
            dollarVolume: dollarVolumeFormatted,
            lastUpdated: priceTimeIso,
            data_as_of: priceTimeIso,
            servedAt,
            isRealTime: open,
            priceLabel,
            marketState: meta.marketState,
            refreshSchedule,
            ...(note ? { note } : {})
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
 */
export async function fetchRealStockQuote(symbol: string, forceRefresh = false, timeoutMs = 3500): Promise<RealQuoteResult | null> {
  const symUpper = symbol.toUpperCase().trim();
  const now = Date.now();

  // 1. Check 30-second in-memory cache
  const cached = quoteCache.get(symUpper);
  if (!forceRefresh && cached && (now - cached.cachedAt < QUOTE_CACHE_DURATION_MS)) {
    const open = isUSMarketOpen();
    const servedAt = new Date().toISOString();
    return {
      ...cached.quote,
      servedAt,
      isRealTime: open ? cached.quote.isRealTime : false,
      dataAgeHours: Number(((now - cached.cachedAt) / 3600000).toFixed(2)),
      priceLabel: open ? (cached.quote.priceLabel || 'Real-Time Live') : 'Last Close',
      refreshSchedule: open
        ? "Real-Time Live Streaming"
        : (cached.quote.priceLabel === 'After-Hours' ? "After-Hours Close" : "Market Closed - Last Close")
    };
  }

  // 2. Upstream Yahoo Finance real lookup
  let resultQuote = await fetchYahooQuote(symUpper, timeoutMs);

  // 3. Failover: Check persisted verified Super Sonic Tsunami dataset
  if (!resultQuote) {
    try {
      const persisted = MarketDataService.loadPersistedData();
      const found = persisted?.watchlist?.find((s: any) => 
        s.symbol.toUpperCase() === symUpper || 
        (symUpper === 'SPACEX' && s.symbol.toUpperCase() === 'SPCX')
      );
      if (found && typeof found.price === 'number' && found.price > 0) {
        const shareVol = typeof found.volume === 'number' ? found.volume : (parseFloat(String(found.volume || '0')) || 0);
        const dollarVol = shareVol * found.price;
        const dollarVolumeFormatted = dollarVol > 0
          ? (dollarVol >= 1e9 ? `$${(dollarVol/1e9).toFixed(1)}B` : dollarVol >= 1e6 ? `$${(dollarVol/1e6).toFixed(1)}M` : `$${Math.round(dollarVol).toLocaleString()}`)
          : 'N/A';

        const prevClose = typeof found.previousClose === 'number' ? found.previousClose : (typeof found.previous_close === 'number' ? found.previous_close : null);
        const prevCloseDate = found.previousCloseDate || found.previous_close_date || null;

        let change: number | null = null;
        let changePercent: number | null = null;
        let note: string | undefined = undefined;

        if (prevClose && prevClose > 0) {
          change = Number((found.price - prevClose).toFixed(2));
          changePercent = Number((((found.price - prevClose) / prevClose) * 100).toFixed(2));
        } else {
          note = "Valid previous close data unavailable in verified dataset snapshot";
        }

        const servedAt = new Date().toISOString();
        const priceTimeIso = found.last_updated || persisted?.updated_at || servedAt;

        resultQuote = {
          symbol: symUpper,
          name: found.name || symUpper,
          price: found.price,
          change,
          changePercent,
          previousClose: prevClose,
          previousCloseDate: prevCloseDate,
          high52: found.high52,
          low52: found.low52,
          volume: shareVol,
          dollarVolume: dollarVolumeFormatted,
          lastUpdated: priceTimeIso,
          data_as_of: priceTimeIso,
          servedAt,
          isRealTime: false,
          isStale: true,
          staleReason: "Live feed unavailable. Displaying last verified dataset snapshot.",
          priceLabel: "Last Close",
          refreshSchedule: "Verified Snapshot Cache",
          ...(note ? { note } : {})
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

