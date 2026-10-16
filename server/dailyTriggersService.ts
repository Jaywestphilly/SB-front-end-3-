import { resolveTickerCik } from './secTickerLookup.js';
import { SecIntelService } from '../src/services/secIntelService.js';

export interface DailyTriggerItem {
  ticker: string;
  event: string;
  filedDate: string;
  recommended_endpoint: string;
}

export interface DailyTriggersResponse {
  asOf: string;
  windowHours: number;
  triggers: DailyTriggerItem[];
  error?: string;
}

const SEC_USER_AGENT = 'StockBloc-SEC-Analyst/1.0 (contact@stockbloc.ai)';

// Watchlist tickers representing Stock Bloc's core coverage
export const WATCHLIST_TICKERS = [
  'AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META',
  'AMD', 'INTC', 'QCOM', 'PLTR', 'COIN', 'AVGO', 'CRM',
  'NFLX', 'ORCL', 'SMCI', 'AEHR', 'VST', 'ASTS', 'SPCX', 'BE',
  'ARM', 'DELL', 'MU', 'CEG', 'TLN', 'SMR', 'OKLO', 'RKLB',
  'HOOD', 'SOFI', 'MP', 'ALAB', 'AMTM', 'QUBT', 'MRVL', 'ANET'
];

const WATCHLIST_SET = new Set<string>(WATCHLIST_TICKERS);

interface CacheEntry {
  data: DailyTriggersResponse;
  timestamp: number;
}

let triggersCache: CacheEntry | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minute cache

export function clearDailyTriggersCache(): void {
  triggersCache = null;
}

function parseSecTimestamp(rawAcceptance: string | undefined, filedDate: string): number {
  if (rawAcceptance && typeof rawAcceptance === 'string') {
    const trimmed = rawAcceptance.trim();
    if (/^\d{14}$/.test(trimmed)) {
      const y = parseInt(trimmed.slice(0, 4), 10);
      const m = parseInt(trimmed.slice(4, 6), 10) - 1;
      const d = parseInt(trimmed.slice(6, 8), 10);
      const h = parseInt(trimmed.slice(8, 10), 10);
      const min = parseInt(trimmed.slice(10, 12), 10);
      const s = parseInt(trimmed.slice(12, 14), 10);
      const ts = Date.UTC(y, m, d, h, min, s);
      if (!isNaN(ts)) return ts;
    }
    const parsed = new Date(trimmed).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  if (filedDate && typeof filedDate === 'string') {
    const etTime = new Date(`${filedDate}T17:30:00-04:00`).getTime();
    if (!isNaN(etTime)) return etTime;
    const dt = new Date(`${filedDate}T23:59:59Z`).getTime();
    if (!isNaN(dt)) return dt;
  }
  return 0;
}

function isInsideWindow(filingTs: number, filedDate: string, cutoffMs: number, nowMs: number): boolean {
  if (filingTs > 0) {
    return filingTs >= cutoffMs && filingTs <= nowMs + 3600000;
  }
  const todayStr = new Date(nowMs).toISOString().slice(0, 10);
  const yesterdayStr = new Date(cutoffMs).toISOString().slice(0, 10);
  return filedDate === todayStr || filedDate === yesterdayStr;
}

export async function fetchDailyTriggers(requestedTicker?: string): Promise<{ status: number; body: DailyTriggersResponse }> {
  const nowMs = Date.now();
  const isTest = process.env.NODE_ENV === 'test';

  if (!requestedTicker && !isTest && triggersCache && (nowMs - triggersCache.timestamp < CACHE_TTL_MS)) {
    return { status: triggersCache.data.error ? 503 : 200, body: triggersCache.data };
  }

  const asOf = new Date(nowMs).toISOString();
  const windowMs = 24 * 60 * 60 * 1000;
  const cutoffMs = nowMs - windowMs;

  const normTicker = requestedTicker ? String(requestedTicker).trim().toUpperCase() : null;

  // If a specific ticker was requested, verify it is on Stock Bloc's watchlist
  if (normTicker && !WATCHLIST_SET.has(normTicker)) {
    return {
      status: 200,
      body: {
        asOf,
        windowHours: 24,
        triggers: []
      }
    };
  }

  const tickersToScan = normTicker ? [normTicker] : WATCHLIST_TICKERS;
  const triggers: DailyTriggerItem[] = [];
  let secSuccessCount = 0;
  let secErrorCount = 0;

  try {
    // Process watchlist tickers with batching to respect SEC EDGAR rate limits (max 10 req/s)
    const batchSize = 5;
    for (let i = 0; i < tickersToScan.length; i += batchSize) {
      const batch = tickersToScan.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (ticker) => {
          try {
            const cik = await resolveTickerCik(ticker);
            if (!cik) return;

            const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`;
            const res = await fetch(submissionsUrl, {
              headers: { 'User-Agent': SEC_USER_AGENT },
              signal: AbortSignal.timeout(4000)
            });

            if (!res.ok) {
              secErrorCount++;
              return;
            }

            secSuccessCount++;
            const json: any = await res.json();
            const recent = json?.filings?.recent;
            if (!recent || !Array.isArray(recent.form)) return;

            const forms: string[] = recent.form;
            const filingDates: string[] = recent.filingDate;
            const acceptances: string[] = recent.acceptanceDateTime || [];

            for (let idx = 0; idx < forms.length; idx++) {
              const form = forms[idx];
              if (!['10-K', '10-Q', '8-K'].includes(form)) continue;

              const filedDate = filingDates[idx];
              if (!filedDate) continue;

              const filingTimestamp = parseSecTimestamp(acceptances[idx], filedDate);
              if (isInsideWindow(filingTimestamp, filedDate, cutoffMs, nowMs)) {
                triggers.push({
                  ticker,
                  event: form,
                  filedDate,
                  recommended_endpoint: '/api/v1/sec/job'
                });
              }
            }
          } catch {
            secErrorCount++;
          }
        })
      );
    }
  } catch {
    secErrorCount++;
  }

  // Check 13F existing dataset
  try {
    const secIntel = SecIntelService.loadPersistedData();
    if (secIntel && Array.isArray(secIntel.funds)) {
      for (const fund of secIntel.funds) {
        const filedDate = fund.filing_date || fund.filingDate;
        if (!filedDate) continue;
        const filingTimestamp = parseSecTimestamp(undefined, filedDate);
        if (isInsideWindow(filingTimestamp, filedDate, cutoffMs, nowMs)) {
          const displayTicker = (fund.manager || fund.fund_name || fund.id || '13F').toUpperCase().slice(0, 10);
          if (!normTicker || displayTicker === normTicker) {
            triggers.push({
              ticker: displayTicker,
              event: '13F',
              filedDate,
              recommended_endpoint: '/api/v1/data/sec'
            });
            break; // Include only one when present in window
          }
        }
      }
    }
  } catch {
    // Ignore 13F load errors
  }

  // Deduplicate triggers by ticker + event + filedDate
  const uniqueTriggersMap = new Map<string, DailyTriggerItem>();
  for (const item of triggers) {
    const key = `${item.ticker}|${item.event}|${item.filedDate}`;
    if (!uniqueTriggersMap.has(key)) {
      uniqueTriggersMap.set(key, item);
    }
  }
  const uniqueTriggers = Array.from(uniqueTriggersMap.values());

  // If all SEC network attempts failed and no success occurred, return 503
  if (secSuccessCount === 0 && secErrorCount > 0) {
    const errResp: DailyTriggersResponse = {
      asOf,
      windowHours: 24,
      triggers: [],
      error: 'SEC EDGAR source unavailable'
    };
    return { status: 503, body: errResp };
  }

  const responseBody: DailyTriggersResponse = {
    asOf,
    windowHours: 24,
    triggers: uniqueTriggers
  };

  if (!requestedTicker && !isTest) {
    triggersCache = {
      data: responseBody,
      timestamp: nowMs
    };
  }

  return { status: 200, body: responseBody };
}
