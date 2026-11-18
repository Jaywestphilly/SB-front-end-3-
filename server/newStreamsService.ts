import { resolveTickerCik } from './secTickerLookup.js';
import { fetchDailyTriggers, WATCHLIST_TICKERS } from './dailyTriggersService.js';
import { MarketDataService } from '../src/services/marketDataService.js';
import { db } from './firebaseAdmin.js';
import {
  getUpcomingAndRecentLaunches,
  getStarlinkCatalogSummary,
  getSpaceTelemetryQuotes,
} from './spaceTelemetryService.js';

const SEC_USER_AGENT = 'StockBloc-SEC-Analyst/2.0 (contact@stockbloc.ai)';

const SEC_8K_ITEM_DESCRIPTIONS: Record<string, string> = {
  '1.01': 'Entry into a Material Definitive Agreement',
  '1.02': 'Termination of a Material Definitive Agreement',
  '1.03': 'Bankruptcy or Receivership',
  '1.05': 'Material Cybersecurity Incidents',
  '2.01': 'Completion of Acquisition or Disposition of Assets',
  '2.02': 'Results of Operations and Financial Condition',
  '2.03': 'Creation of a Direct Financial Obligation',
  '2.05': 'Costs Associated with Exit or Disposal Activities',
  '3.01': 'Notice of Delisting or Transfer',
  '3.02': 'Unregistered Sales of Equity Securities',
  '4.01': "Changes in Registrant's Certifying Accountant",
  '4.02': 'Non-Reliance on Previously Issued Financial Statements',
  '5.01': 'Changes in Control of Registrant',
  '5.02': 'Departure/Election of Directors or Certain Officers',
  '5.03': 'Amendments to Articles of Incorporation or Bylaws',
  '5.07': 'Submission of Matters to a Vote of Security Holders',
  '7.01': 'Regulation FD Disclosure',
  '8.01': 'Other Events',
  '9.01': 'Financial Statements and Exhibits',
};

export interface Sec8kEventRecord {
  ticker: string;
  companyName: string;
  cik: string;
  form: '8-K';
  filingDate: string;
  reportDate: string | null;
  acceptanceDateTime: string | null;
  accessionNumber: string;
  items: Array<{ code: string; title: string }>;
  primaryDocument: string | null;
  filingUrl: string;
}

export interface Sec8kEventsResponse {
  status: 'success';
  source: string;
  ticker: string;
  asOf: string;
  count: number;
  events: Sec8kEventRecord[];
}

function parse8kItemsDetailed(raw: any): Array<{ code: string; title: string }> {
  const rawList: string[] = Array.isArray(raw)
    ? raw.map((x) => String(x))
    : typeof raw === 'string'
    ? raw.split(/[,;]+/)
    : [];

  return rawList
    .map((s) => s.replace(/^Item\s+/i, '').trim())
    .filter(Boolean)
    .map((code) => ({
      code,
      title: SEC_8K_ITEM_DESCRIPTIONS[code] || `Item ${code} Material Disclosure`,
    }));
}

function build8kFilingUrl(cik: string, accessionNumber: string, primaryDocument?: string): string {
  const cikNum = parseInt(cik, 10);
  const accClean = accessionNumber.replace(/-/g, '');
  if (primaryDocument) {
    return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/${primaryDocument}`;
  }
  return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/`;
}

const sec8kCache = new Map<string, { ts: number; data: Sec8kEventsResponse }>();
const SEC_8K_CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchSec8kEvents(options: {
  ticker?: string;
  limit?: number;
}): Promise<{ status: number; body: any }> {
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 25);
  const normTicker = options.ticker ? String(options.ticker).trim().toUpperCase() : '';
  const cacheKey = `${normTicker || 'WATCHLIST'}:${limit}`;

  const cached = sec8kCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEC_8K_CACHE_TTL_MS) {
    return { status: 200, body: cached.data };
  }

  const tickersToFetch = normTicker ? [normTicker] : WATCHLIST_TICKERS.slice(0, 8);
  const events: Sec8kEventRecord[] = [];
  let secReachableCount = 0;

  if (normTicker) {
    const cik = await resolveTickerCik(normTicker);
    if (!cik) {
      return {
        status: 404,
        body: {
          status: 'error',
          error: 'unknown_ticker',
          message: `Ticker "${normTicker}" was not found in U.S. SEC EDGAR directory.`,
        },
      };
    }
  }

  const batchSize = 4;
  for (let i = 0; i < tickersToFetch.length; i += batchSize) {
    const batch = tickersToFetch.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (ticker) => {
        try {
          const cik = await resolveTickerCik(ticker);
          if (!cik) return;

          const url = `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`;
          const res = await fetch(url, {
            headers: { 'User-Agent': SEC_USER_AGENT },
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) return;
          secReachableCount++;
          const json: any = await res.json();
          const companyName = String(json?.name || ticker);
          const recent = json?.filings?.recent;
          if (!recent || !Array.isArray(recent.form)) return;

          const perTickerMax = normTicker ? limit : 3;
          let added = 0;
          for (let idx = 0; idx < recent.form.length && added < perTickerMax; idx++) {
            if (recent.form[idx] !== '8-K') continue;
            const accessionNumber = String(recent.accessionNumber?.[idx] || '');
            const filingDate = String(recent.filingDate?.[idx] || '');
            const reportDate = recent.reportDate?.[idx] ? String(recent.reportDate[idx]) : null;
            const acceptanceDateTime = recent.acceptanceDateTime?.[idx]
              ? String(recent.acceptanceDateTime[idx])
              : null;
            const primaryDocument = recent.primaryDocument?.[idx]
              ? String(recent.primaryDocument[idx])
              : null;

            if (!accessionNumber || !filingDate) continue;

            events.push({
              ticker,
              companyName,
              cik,
              form: '8-K',
              filingDate,
              reportDate,
              acceptanceDateTime,
              accessionNumber,
              items: parse8kItemsDetailed(recent.items?.[idx]),
              primaryDocument,
              filingUrl: build8kFilingUrl(cik, accessionNumber, primaryDocument || undefined),
            });
            added++;
          }
        } catch {
          // Skip failing individual ticker request
        }
      })
    );
  }

  if (secReachableCount === 0) {
    return {
      status: 503,
      body: {
        status: 'error',
        error: 'sec_unavailable',
        message: 'SEC EDGAR Submissions API temporarily unavailable.',
        retryable: true,
      },
    };
  }

  events.sort((a, b) => (b.filingDate || '').localeCompare(a.filingDate || ''));
  const sliced = events.slice(0, limit);

  const responseBody: Sec8kEventsResponse = {
    status: 'success',
    source: 'SEC EDGAR Submissions API (data.sec.gov/submissions)',
    ticker: normTicker || 'WATCHLIST',
    asOf: new Date().toISOString(),
    count: sliced.length,
    events: sliced,
  };

  sec8kCache.set(cacheKey, { ts: Date.now(), data: responseBody });
  return { status: 200, body: responseBody };
}

export async function fetchIntelligenceChanges(options: {
  since?: string;
  limit?: number;
}) {
  const nowMs = Date.now();
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const sinceMs = options.since ? new Date(options.since).getTime() : nowMs - 24 * 60 * 60 * 1000;
  const sinceIso = new Date(sinceMs).toISOString();

  const [triggersRes, launchesRes] = await Promise.all([
    fetchDailyTriggers().catch(() => ({
      status: 503,
      body: { asOf: new Date().toISOString(), windowHours: 24, triggers: [], error: 'SEC EDGAR source unavailable' },
    })),
    getUpcomingAndRecentLaunches().catch(() => ({
      upcoming: [],
      past: [],
      asOf: new Date().toISOString(),
      source: 'unavailable',
      stale: true,
    })),
  ]);

  // Real persisted watchlist movers (>= 2% move)
  const marketData = MarketDataService.loadPersistedData();
  const watchlistMovers = Array.isArray(marketData?.watchlist)
    ? marketData.watchlist
        .filter((item: any) => typeof item?.changePercent === 'number' && Math.abs(item.changePercent) >= 2.0)
        .slice(0, limit)
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          changePercent: item.changePercent,
          lastUpdated: item.lastUpdated || marketData.updated_at || null,
        }))
    : [];

  // Query recent research memos & forecasts safely from Firestore if configured
  let researchMemos: any[] = [];
  let forecasts: any[] = [];
  try {
    const rSnap = await db.collection('research').orderBy('createdAt', 'desc').limit(10).get();
    researchMemos = rSnap.docs
      .map((d: any) => ({ id: d.id, ...(d.data() || {}) }))
      .filter((r: any) => {
        const ts = r.createdAt?.toDate ? r.createdAt.toDate().getTime() : new Date(r.createdAt || 0).getTime();
        return !Number.isNaN(ts) && ts >= sinceMs;
      })
      .slice(0, limit)
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        asset: r.asset || r.ticker || null,
        summary: r.summary,
        createdAt: r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : r.createdAt,
      }));
  } catch {
    // Non-blocking when Firestore unavailable
  }

  try {
    const fSnap = await db.collection('forecasts').orderBy('createdAt', 'desc').limit(10).get();
    forecasts = fSnap.docs
      .map((d: any) => ({ id: d.id, ...(d.data() || {}) }))
      .filter((f: any) => {
        const ts = f.createdAt?.toDate ? f.createdAt.toDate().getTime() : new Date(f.createdAt || 0).getTime();
        return !Number.isNaN(ts) && ts >= sinceMs;
      })
      .slice(0, limit)
      .map((f: any) => ({
        id: f.id,
        asset: f.asset || f.symbol,
        direction: f.direction,
        probability: f.probability,
        status: f.status,
        createdAt: f.createdAt?.toDate ? f.createdAt.toDate().toISOString() : f.createdAt,
      }));
  } catch {
    // Non-blocking
  }

  const secFilings = (triggersRes.body?.triggers || []).slice(0, limit);
  const spaceEvents = launchesRes.upcoming.slice(0, Math.min(limit, 5)).map((l) => ({
    id: l.id,
    name: l.name,
    provider: l.provider,
    net: l.net,
    status: l.status,
  }));

  return {
    status: 'success',
    since: sinceIso,
    asOf: new Date(nowMs).toISOString(),
    secSourceAvailable: triggersRes.status === 200,
    marketAsOf: marketData?.updated_at || null,
    counts: {
      secFilings: secFilings.length,
      marketMovers: watchlistMovers.length,
      researchMemos: researchMemos.length,
      forecasts: forecasts.length,
      upcomingSpaceLaunches: spaceEvents.length,
    },
    secFilings,
    marketMovers: watchlistMovers,
    researchMemos,
    forecasts,
    upcomingSpaceLaunches: spaceEvents,
  };
}

export async function fetchSpaceTelemetryBundle() {
  const [launches, starlinkCatalog, equities] = await Promise.all([
    getUpcomingAndRecentLaunches(),
    getStarlinkCatalogSummary(),
    getSpaceTelemetryQuotes(),
  ]);

  return {
    status: 'success',
    asOf: new Date().toISOString(),
    sources: [starlinkCatalog.source, launches.source, 'Yahoo Finance Equity Telemetry'],
    starlinkConstellation: starlinkCatalog,
    launches: {
      asOf: launches.asOf,
      stale: launches.stale,
      upcoming: launches.upcoming.slice(0, 8),
      recent: launches.past.slice(0, 5),
    },
    spaceAndPowerEquities: equities,
  };
}
