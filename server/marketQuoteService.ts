import { MarketDataService } from '../src/services/marketDataService.js';

export interface RealQuoteResult {
  symbol: string;
  ticker?: string;
  name: string;
  price: number;
  previousClose: number | null;
  previousCloseDate: string | null;
  change: number | null;
  changePercent: number | null;
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

export function clearQuoteCache(): void {
  quoteCache.clear();
}

const FIXED_HOLIDAYS = new Set([
  '01-01', // New Year's Day
  '06-19', // Juneteenth
  '07-04', // Independence Day
  '12-25'  // Christmas
]);

const FLOATING_HOLIDAYS = new Set([
  // 2025
  '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26', '2025-09-01', '2025-11-27',
  // 2026
  '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-09-07', '2026-11-26',
  // 2027
  '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-09-06', '2027-11-25'
]);

/**
 * Formats a Date into YYYY-MM-DD in America/New_York (Eastern Time).
 */
export function formatETDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '1970';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

/**
 * Returns the ISO-8601 UTC timestamp corresponding to 4:00 PM ET (16:00:00 America/New_York) on the given YYYY-MM-DD date.
 */
export function getFourPmEtIso(dateET: string): string {
  // Check whether dateET in America/New_York is EDT (UTC-4 -> 20:00Z) or EST (UTC-5 -> 21:00Z)
  const candidateEdt = new Date(`${dateET}T20:00:00.000Z`);
  if (!isNaN(candidateEdt.getTime())) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      hour12: false
    });
    const hourStr = formatter.formatToParts(candidateEdt).find(p => p.type === 'hour')?.value;
    if (hourStr === '16') {
      return candidateEdt.toISOString();
    }
  }
  const candidateEst = new Date(`${dateET}T21:00:00.000Z`);
  if (!isNaN(candidateEst.getTime())) {
    return candidateEst.toISOString();
  }
  return new Date().toISOString();
}

function isUSTradingDay(dateET: string): boolean {
  const d = new Date(`${dateET}T16:00:00.000Z`);
  if (isNaN(d.getTime())) return false;
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short'
  }).format(d);
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const mmdd = dateET.slice(5);
  if (FIXED_HOLIDAYS.has(mmdd) || FLOATING_HOLIDAYS.has(dateET)) return false;
  return true;
}

export function getPreviousTradingDayET(dateET: string): string {
  const base = new Date(`${dateET}T16:00:00.000Z`);
  if (isNaN(base.getTime())) return dateET;
  for (let i = 1; i <= 10; i++) {
    const prev = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    const prevET = formatETDate(prev);
    if (isUSTradingDay(prevET)) {
      return prevET;
    }
  }
  return dateET;
}

function getMostRecentCompletedTradingDayET(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  const todayET = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const hour = parseInt(getPart('hour'), 10);
  const minute = parseInt(getPart('minute'), 10);
  const totalMinutes = hour * 60 + minute;

  if (isUSTradingDay(todayET) && totalMinutes >= 960) {
    return todayET;
  }
  return getPreviousTradingDayET(todayET);
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

    if (FIXED_HOLIDAYS.has(mmdd)) {
      return false;
    }

    if (FLOATING_HOLIDAYS.has(yyyymmdd)) {
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
        const chartResult = data.chart?.result?.[0];
        const meta = chartResult?.meta;
        if (meta && typeof meta.regularMarketPrice === 'number' && !isNaN(meta.regularMarketPrice) && meta.regularMarketPrice > 0) {
          const price = Number(meta.regularMarketPrice.toFixed(2));
          const timestamps: any[] = Array.isArray(chartResult?.timestamp) ? chartResult.timestamp : [];
          const closes: any[] = Array.isArray(chartResult?.indicators?.quote?.[0]?.close)
            ? chartResult.indicators.quote[0].close
            : [];

          const dailyBars: Array<{ ts: number; dateET: string; close: number }> = [];
          for (let i = 0; i < Math.min(timestamps.length, closes.length); i++) {
            const ts = timestamps[i];
            const cl = closes[i];
            if (typeof ts === 'number' && ts > 0 && typeof cl === 'number' && !isNaN(cl) && cl > 0) {
              const dateET = formatETDate(new Date(ts * 1000));
              const existingIdx = dailyBars.findIndex(b => b.dateET === dateET);
              if (existingIdx >= 0) {
                dailyBars[existingIdx] = { ts, dateET, close: cl };
              } else {
                dailyBars.push({ ts, dateET, close: cl });
              }
            }
          }

          const hasMarketTime = typeof meta.regularMarketTime === 'number' && meta.regularMarketTime > 0;
          const currentPriceDateET = hasMarketTime
            ? formatETDate(new Date(meta.regularMarketTime * 1000))
            : (dailyBars.length > 0 ? dailyBars[dailyBars.length - 1].dateET : getMostRecentCompletedTradingDayET());

          // Determine the previous trading day's official close from daily bars strictly prior to currentPriceDateET
          let previousClose: number | null = null;
          let previousCloseDate: string | null = null;

          const priorBars = dailyBars.filter(b => b.dateET < currentPriceDateET);
          if (priorBars.length > 0) {
            const prevBar = priorBars[priorBars.length - 1];
            previousClose = Number(prevBar.close.toFixed(2));
            previousCloseDate = prevBar.dateET;
          } else if (dailyBars.length >= 2) {
            const prevBar = dailyBars[dailyBars.length - 2];
            previousClose = Number(prevBar.close.toFixed(2));
            previousCloseDate = prevBar.dateET;
          } else if (typeof meta.previousClose === 'number' && !isNaN(meta.previousClose) && meta.previousClose > 0) {
            // Only use explicit meta.previousClose (never meta.chartPreviousClose from a 5d range, which is 5 trading days old)
            previousClose = Number(meta.previousClose.toFixed(2));
            previousCloseDate = getPreviousTradingDayET(currentPriceDateET);
          }

          let change: number | null = null;
          let changePercent: number | null = null;
          let note: string | undefined = undefined;

          if (previousClose !== null && previousClose > 0) {
            change = Number((price - previousClose).toFixed(2));
            changePercent = Number((((price - previousClose) / previousClose) * 100).toFixed(2));
          } else {
            previousClose = null;
            previousCloseDate = null;
            change = null;
            changePercent = null;
            note = 'Previous trading day official close is unavailable; change and changePercent are null.';
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

          // Price timestamp: live trade time when market is open, 4:00 PM ET close of the price's trading day when market is closed
          const priceTimestampIso = open
            ? (hasMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString())
            : getFourPmEtIso(currentPriceDateET);

          const servedAt = new Date().toISOString();

          return {
            symbol: symUpper,
            ticker: symUpper,
            name: meta.longName || meta.shortName || symUpper,
            price,
            previousClose,
            previousCloseDate,
            change,
            changePercent,
            ...(note ? { note } : {}),
            high52: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
            low52: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
            volume: shareVol,
            dollarVolume: dollarVolumeFormatted,
            lastUpdated: priceTimestampIso,
            data_as_of: priceTimestampIso,
            servedAt,
            isRealTime: open,
            priceLabel,
            marketState: meta.marketState,
            refreshSchedule
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
  const servedAt = new Date(now).toISOString();

  // 1. Check 30-second in-memory cache
  const cached = quoteCache.get(symUpper);
  if (!forceRefresh && cached && (now - cached.cachedAt < QUOTE_CACHE_DURATION_MS)) {
    const open = isUSMarketOpen();
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

        const hasValidPrevClose = typeof found.previousClose === 'number' && !isNaN(found.previousClose) && found.previousClose > 0;
        const prevClose = hasValidPrevClose ? Number(found.previousClose.toFixed(2)) : null;
        const prevCloseDate = hasValidPrevClose && typeof found.previousCloseDate === 'string' ? found.previousCloseDate : null;
        const priceNum = Number(found.price.toFixed(2));
        const change = prevClose !== null ? Number((priceNum - prevClose).toFixed(2)) : null;
        const changePercent = prevClose !== null ? Number((((priceNum - prevClose) / prevClose) * 100).toFixed(2)) : null;
        const rawSnapshotTime = found.last_updated || persisted?.updated_at;
        const priceAsOf = rawSnapshotTime
          ? new Date(rawSnapshotTime).toISOString()
          : getFourPmEtIso(getMostRecentCompletedTradingDayET());

        resultQuote = {
          symbol: symUpper,
          ticker: symUpper,
          name: found.name || symUpper,
          price: priceNum,
          previousClose: prevClose,
          previousCloseDate: prevCloseDate,
          change,
          changePercent,
          ...(prevClose === null ? { note: 'Previous trading day official close is unavailable in cached snapshot; change and changePercent are null.' } : {}),
          high52: found.high52,
          low52: found.low52,
          volume: shareVol,
          dollarVolume: dollarVolumeFormatted,
          lastUpdated: priceAsOf,
          data_as_of: priceAsOf,
          servedAt,
          isRealTime: false,
          isStale: true,
          staleReason: "Live feed unavailable. Displaying last verified dataset snapshot.",
          priceLabel: "Last Close",
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
