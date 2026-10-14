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
const WATCHLIST_TICKERS = [
  'AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META',
  'AMD', 'INTC', 'QCOM', 'PLTR', 'COIN', 'AVGO', 'CRM',
  'NFLX', 'ORCL', 'SMCI', 'AEHR', 'VST', 'ASTS', 'SPCX', 'BE'
];

interface CacheEntry {
  data: DailyTriggersResponse;
  timestamp: number;
}

let triggersCache: CacheEntry | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minute cache

export async function fetchDailyTriggers(): Promise<{ status: number; body: DailyTriggersResponse }> {
  const nowMs = Date.now();
  if (triggersCache && (nowMs - triggersCache.timestamp < CACHE_TTL_MS)) {
    return { status: triggersCache.data.error ? 503 : 200, body: triggersCache.data };
  }

  const asOf = new Date().toISOString();
  const windowMs = 24 * 60 * 60 * 1000;
  const cutoffMs = nowMs - windowMs;

  const triggers: DailyTriggerItem[] = [];
  let secSuccessCount = 0;
  let secErrorCount = 0;

  // Process watchlist tickers with batching to respect SEC EDGAR rate limits
  const batchSize = 5;
  for (let i = 0; i < WATCHLIST_TICKERS.length; i += batchSize) {
    const batch = WATCHLIST_TICKERS.slice(i, i + batchSize);
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

            let filingTimestamp = 0;
            const rawAcceptance = acceptances[idx];
            if (rawAcceptance) {
              const parsedDate = new Date(rawAcceptance).getTime();
              if (!isNaN(parsedDate)) {
                filingTimestamp = parsedDate;
              }
            }
            if (!filingTimestamp) {
              filingTimestamp = new Date(`${filedDate}T23:59:59Z`).getTime();
            }

            if (filingTimestamp >= cutoffMs && filingTimestamp <= nowMs + 3600000) {
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

  // Check 13F existing dataset
  try {
    const secIntel = SecIntelService.loadPersistedData();
    if (secIntel && Array.isArray(secIntel.funds)) {
      for (const fund of secIntel.funds) {
        const filedDate = fund.filing_date || fund.filingDate;
        if (!filedDate) continue;
        const filingTimestamp = new Date(`${filedDate}T23:59:59Z`).getTime();
        if (filingTimestamp >= cutoffMs && filingTimestamp <= nowMs + 3600000) {
          const displayTicker = (fund.manager || fund.fund_name || fund.id || '13F').toUpperCase().slice(0, 10);
          triggers.push({
            ticker: displayTicker,
            event: '13F',
            filedDate,
            recommended_endpoint: '/api/v1/data/sec'
          });
          break; // Only include one if present in window
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

  triggersCache = {
    data: responseBody,
    timestamp: nowMs
  };

  return { status: 200, body: responseBody };
}
