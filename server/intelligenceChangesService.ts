import { lookupTickerCik, normalizeCompanyName } from './secTickerLookup.js';
import { normalizeYahooSymbol } from './marketQuoteService.js';
import { parse8kItemCodes, format8kItemLabels } from './signals8kService.js';
import { computeQuantMetrics, calculateStockBlocSignal } from '../src/services/marketDataService.js';
import { SecIntelService } from '../src/services/secIntelService.js';
import { db } from './firebaseAdmin.js';

const SEC_USER_AGENT = 'StockBloc-SEC-Analyst/2.0 (contact@stockbloc.ai)';
const MAX_LOOKBACK_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type ChangeType = 'filing' | 'sb_score' | '13f';

export interface TickerChangeItem {
  type: ChangeType;
  what: string;
  detail: string;
  changedAt: string;
  link?: string;
}

export interface TickerIntelligenceChangesResponse {
  status: 'success';
  ticker: string;
  since: string;
  effectiveSince: string;
  windowClamped: boolean;
  windowNote?: string;
  asOf: string;
  coverageNote: string;
  summary: string;
  count: number;
  changes: TickerChangeItem[];
}

interface DailyBar {
  ts: number;
  iso: string;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface SbSnapshot {
  timestamp: string;
  price: number;
  sbScore: number;
  factors: {
    momentum: number;
    trend: number;
    relativeStrength: number;
    volume: number;
    volatility: number;
  };
}

const FACTOR_LABELS: Array<{ key: keyof SbSnapshot['factors']; label: string }> = [
  { key: 'momentum', label: 'Momentum' },
  { key: 'trend', label: 'Trend' },
  { key: 'relativeStrength', label: 'Relative Strength' },
  { key: 'volume', label: 'Volume' },
  { key: 'volatility', label: 'Volatility' },
];

function formatShortUtcDate(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function parseSecFilingTimestamp(acceptanceDateTime: string | null, filedDate: string): { ts: number; iso: string } {
  if (acceptanceDateTime) {
    const trimmed = acceptanceDateTime.trim();
    if (/^\d{14}$/.test(trimmed)) {
      const y = parseInt(trimmed.slice(0, 4), 10);
      const m = parseInt(trimmed.slice(4, 6), 10) - 1;
      const d = parseInt(trimmed.slice(6, 8), 10);
      const h = parseInt(trimmed.slice(8, 10), 10);
      const min = parseInt(trimmed.slice(10, 12), 10);
      const s = parseInt(trimmed.slice(12, 14), 10);
      const ts = Date.UTC(y, m, d, h, min, s);
      if (!Number.isNaN(ts)) return { ts, iso: new Date(ts).toISOString() };
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return { ts: parsed, iso: new Date(parsed).toISOString() };
  }
  const dayMs = Date.parse(`${filedDate}T23:59:59Z`);
  if (!Number.isNaN(dayMs)) {
    return { ts: dayMs, iso: `${filedDate}T00:00:00.000Z` };
  }
  return { ts: 0, iso: `${filedDate}T00:00:00.000Z` };
}

function computeSbSnapshotFromBars(ticker: string, bars: DailyBar[]): SbSnapshot | null {
  if (!bars || bars.length < 2) return null;
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const sparkline = bars.map((b) => b.close);
  const volSlice = bars.slice(-20).map((b) => b.volume).filter((v) => v > 0);
  const avgVol = volSlice.length > 0 ? volSlice.reduce((a, b) => a + b, 0) / volSlice.length : last.volume || 0;
  const high52 = Math.max(...bars.map((b) => b.high || b.close));
  const low52 = Math.min(...bars.map((b) => b.low || b.close));
  const changePct = prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0;

  const stockObj: any = {
    symbol: ticker,
    name: ticker,
    price: last.close,
    change: last.close - prev.close,
    percent_change: changePct,
    volume: last.volume,
    avgVolume: avgVol,
    high52,
    low52,
    sparkline,
  };

  const quant = computeQuantMetrics(stockObj);
  const sig = calculateStockBlocSignal(stockObj, quant);

  const getFactor = (substr: string) =>
    sig.components.find((c) => c.name.toLowerCase().includes(substr))?.score ?? 0;

  return {
    timestamp: last.iso,
    price: Number(last.close.toFixed(2)),
    sbScore: Math.round(sig.signalScore),
    factors: {
      momentum: Math.round(getFactor('momentum')),
      trend: Math.round(getFactor('trend')),
      relativeStrength: Math.round(getFactor('strength')),
      volume: Math.round(getFactor('volume')),
      volatility: Math.round(getFactor('volatility')),
    },
  };
}

async function fetchYahooDailyBars(ticker: string): Promise<DailyBar[]> {
  const yahooSym = normalizeYahooSymbol(ticker);
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?range=1y&interval=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?range=1y&interval=1d`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) continue;
      const data: any = await res.json();
      const result = data?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp || [];
      const quote = result?.indicators?.quote?.[0] || {};
      const closes: number[] = quote.close || [];
      const highs: number[] = quote.high || [];
      const lows: number[] = quote.low || [];
      const vols: number[] = quote.volume || [];

      const bars: DailyBar[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const c = closes[i];
        if (typeof c === 'number' && !Number.isNaN(c) && c > 0) {
          const tsMs = timestamps[i] * 1000;
          bars.push({
            ts: tsMs,
            iso: new Date(tsMs).toISOString(),
            close: c,
            high: typeof highs[i] === 'number' && highs[i] > 0 ? highs[i] : c,
            low: typeof lows[i] === 'number' && lows[i] > 0 ? lows[i] : c,
            volume: typeof vols[i] === 'number' && vols[i] >= 0 ? vols[i] : 0,
          });
        }
      }
      if (bars.length >= 2) {
        bars.sort((a, b) => a.ts - b.ts);
        return bars;
      }
    } catch {
      // try next mirror
    }
  }
  return [];
}

async function getSbScoreSnapshotsFromFirestore(
  ticker: string,
  effectiveSinceMs: number
): Promise<{ thenSnap: SbSnapshot | null; nowSnap: SbSnapshot | null }> {
  try {
    const snap = await db.collection('sb_scores').where('ticker', '==', ticker).get();
    if (!snap || snap.empty) return { thenSnap: null, nowSnap: null };
    const records = snap.docs
      .map((d: any) => d.data())
      .filter((r: any) => r && typeof r.sbScore === 'number' && r.timestamp)
      .map((r: any) => ({
        ts: Date.parse(r.timestamp),
        snap: {
          timestamp: new Date(Date.parse(r.timestamp)).toISOString(),
          price: Number(r.priceAtScore || 0),
          sbScore: Math.round(Number(r.sbScore)),
          factors: {
            momentum: Math.round(Number(r.components?.momentum ?? 0)),
            trend: Math.round(Number(r.components?.trend ?? 0)),
            relativeStrength: Math.round(Number(r.components?.relativeStrength ?? 0)),
            volume: Math.round(Number(r.components?.volume ?? 0)),
            volatility: Math.round(Number(r.components?.volatility ?? 0)),
          },
        } as SbSnapshot,
      }))
      .filter((r: any) => !Number.isNaN(r.ts))
      .sort((a: any, b: any) => a.ts - b.ts);

    if (records.length < 2) return { thenSnap: null, nowSnap: null };
    const before = records.filter((r: any) => r.ts <= effectiveSinceMs);
    const after = records.filter((r: any) => r.ts > effectiveSinceMs);
    if (before.length === 0 || after.length === 0) return { thenSnap: null, nowSnap: null };

    return {
      thenSnap: before[before.length - 1].snap,
      nowSnap: after[after.length - 1].snap,
    };
  } catch {
    return { thenSnap: null, nowSnap: null };
  }
}

async function checkSecFilings(
  ticker: string,
  cik: string,
  effectiveSinceMs: number
): Promise<{ changes: TickerChangeItem[]; companyName: string }> {
  const changes: TickerChangeItem[] = [];
  let companyName = ticker;

  try {
    const url = `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': SEC_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { changes, companyName };

    const json: any = await res.json();
    companyName = String(json?.name || ticker);
    const recent = json?.filings?.recent;
    if (!recent || !Array.isArray(recent.form)) return { changes, companyName };

    const cikNum = parseInt(cik, 10);
    const trackedForms = new Set(['8-K', '10-K', '10-Q']);

    for (let idx = 0; idx < recent.form.length; idx++) {
      const form = String(recent.form[idx] || '').trim();
      if (!trackedForms.has(form)) continue;

      const accessionNumber = String(recent.accessionNumber?.[idx] || '').trim();
      const filedDate = String(recent.filingDate?.[idx] || '').trim();
      if (!accessionNumber || !filedDate) continue;

      const acceptanceRaw = recent.acceptanceDateTime?.[idx] ? String(recent.acceptanceDateTime[idx]) : null;
      const { ts, iso } = parseSecFilingTimestamp(acceptanceRaw, filedDate);
      if (ts < effectiveSinceMs) continue;

      const primaryDoc = recent.primaryDocument?.[idx] ? String(recent.primaryDocument[idx]).trim() : '';
      const accClean = accessionNumber.replace(/-/g, '');
      const link = primaryDoc
        ? `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/${primaryDoc}`
        : `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/`;

      if (form === '8-K') {
        const items = parse8kItemCodes(recent.items?.[idx]);
        const itemLabels = format8kItemLabels(items);
        changes.push({
          type: 'filing',
          what: items.length > 0 ? `New Form 8-K filed (Items ${items.join(', ')})` : 'New Form 8-K filed',
          detail: `${companyName} filed Form 8-K on ${filedDate} (Accession ${accessionNumber})${itemLabels.length > 0 ? `: ${itemLabels.join('; ')}` : ''}`,
          changedAt: iso,
          link,
        });
      } else {
        changes.push({
          type: 'filing',
          what: `New Form ${form} filed`,
          detail: `${companyName} filed Form ${form} on ${filedDate} (Accession ${accessionNumber})`,
          changedAt: iso,
          link,
        });
      }
    }
  } catch {
    // Non-blocking if SEC EDGAR submissions momentarily unreachable
  }

  return { changes, companyName };
}

async function checkSbScoreChanges(
  ticker: string,
  effectiveSinceMs: number
): Promise<TickerChangeItem[]> {
  const changes: TickerChangeItem[] = [];
  let thenSnap: SbSnapshot | null = null;
  let nowSnap: SbSnapshot | null = null;

  const bars = await fetchYahooDailyBars(ticker);
  if (bars.length >= 2) {
    const thenBars = bars.filter((b) => b.ts <= effectiveSinceMs);
    if (thenBars.length >= 2) {
      thenSnap = computeSbSnapshotFromBars(ticker, thenBars);
      nowSnap = computeSbSnapshotFromBars(ticker, bars);
    }
  }

  if (!thenSnap || !nowSnap) {
    const fsSnaps = await getSbScoreSnapshotsFromFirestore(ticker, effectiveSinceMs);
    if (fsSnaps.thenSnap && fsSnaps.nowSnap) {
      thenSnap = fsSnaps.thenSnap;
      nowSnap = fsSnaps.nowSnap;
    }
  }

  if (!thenSnap || !nowSnap) return changes;

  const totalDelta = nowSnap.sbScore - thenSnap.sbScore;
  if (Math.abs(totalDelta) >= 2) {
    const sign = totalDelta > 0 ? '+' : '';
    const verb = totalDelta > 0 ? 'rose' : 'fell';
    changes.push({
      type: 'sb_score',
      what: `SB Score ${verb} from ${thenSnap.sbScore} to ${nowSnap.sbScore} (${sign}${totalDelta} pts)`,
      detail: `Composite SB Score: ${thenSnap.sbScore} -> ${nowSnap.sbScore} (${sign}${totalDelta}); price $${thenSnap.price} -> $${nowSnap.price}`,
      changedAt: nowSnap.timestamp,
    });
  }

  for (const { key, label } of FACTOR_LABELS) {
    const prevVal = thenSnap.factors[key];
    const currVal = nowSnap.factors[key];
    const delta = currVal - prevVal;
    if (Math.abs(delta) >= 3) {
      const sign = delta > 0 ? '+' : '';
      const verb = delta > 0 ? 'rose' : 'fell';
      changes.push({
        type: 'sb_score',
        what: `SB Score ${label} factor ${verb} from ${prevVal} to ${currVal} (${sign}${delta} pts)`,
        detail: `${label}: ${prevVal} -> ${currVal} (${sign}${delta} pts); overall SB Score ${thenSnap.sbScore} -> ${nowSnap.sbScore}`,
        changedAt: nowSnap.timestamp,
      });
    }
  }

  return changes;
}

async function check13fChanges(
  ticker: string,
  companyName: string,
  effectiveSinceMs: number
): Promise<TickerChangeItem[]> {
  const changes: TickerChangeItem[] = [];
  const normTargetName = normalizeCompanyName(companyName);

  try {
    let secData = SecIntelService.loadPersistedData();
    if (!secData || !Array.isArray(secData.funds) || secData.funds.length === 0) {
      secData = await SecIntelService.fetchLiveSecData().catch(() => null);
    }
    if (!secData || !Array.isArray(secData.funds)) return changes;

    for (const fund of secData.funds) {
      const filedOn = String(fund.holdingsFiledOn || fund.filingDate || fund.filing_date || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filedOn)) continue;

      const filedEndOfDayMs = Date.parse(`${filedOn}T23:59:59.999Z`);
      if (Number.isNaN(filedEndOfDayMs) || filedEndOfDayMs < effectiveSinceMs) continue;

      const holdings = Array.isArray(fund.topHoldings) ? fund.topHoldings : [];
      const matched = holdings.find((h: any) => {
        if (h?.symbol && String(h.symbol).toUpperCase() === ticker) return true;
        if (normTargetName && h?.name) {
          return normalizeCompanyName(String(h.name)) === normTargetName;
        }
        return false;
      });
      if (!matched) continue;

      const fundName = fund.fundName || fund.fund_name || 'Institutional Fund';
      const valM = matched.valueUsd ? `$${Math.round(matched.valueUsd / 1_000_000)}M` : `${matched.valueMillions ?? 0}M`;
      const pct = typeof matched.portfolioPercent === 'number' ? `${matched.portfolioPercent}% weight` : '';
      const accession = fund.holdingsAccession ? `Accession ${fund.holdingsAccession}` : 'SEC Form 13F-HR';
      const period = fund.holdingsAsOf ? `period ending ${fund.holdingsAsOf}` : 'latest 13F-HR';
      const detailParts = [
        `Filed ${filedOn} (${period})`,
        `${matched.shares || ''} shares`,
        valM,
        pct,
        accession,
      ].filter(Boolean);

      changes.push({
        type: '13f',
        what: `${fundName} reported ${ticker} in Form 13F-HR`,
        detail: detailParts.join(' | '),
        changedAt: `${filedOn}T00:00:00.000Z`,
        link: fund.holdingsSourceUrl || fund.doc_url,
      });
    }
  } catch {
    // Non-blocking if 13F dataset unavailable
  }

  return changes;
}

export async function fetchTickerIntelligenceChanges(options: {
  ticker?: string;
  since?: string;
}): Promise<{ status: number; body: any }> {
  const rawTicker = String(options.ticker || '').trim().toUpperCase();
  const rawSince = String(options.since || '').trim();

  if (!rawTicker) {
    return {
      status: 400,
      body: {
        status: 'error',
        code: 'INVALID_INPUT',
        error: 'Query parameter "ticker" is required (e.g. ?ticker=NVDA&since=2026-11-17T00:00:00Z).',
        message: 'Query parameter "ticker" is required (e.g. ?ticker=NVDA&since=2026-11-17T00:00:00Z).',
        charged: false,
      },
    };
  }

  const parsedSinceMs = Date.parse(rawSince);
  if (!rawSince || !/^\d{4}-\d{2}-\d{2}/.test(rawSince) || Number.isNaN(parsedSinceMs)) {
    return {
      status: 400,
      body: {
        status: 'error',
        code: 'INVALID_INPUT',
        error: 'Query parameter "since" is required and must be a valid ISO-8601 timestamp (e.g. 2026-11-17T00:00:00Z).',
        message: 'Query parameter "since" is required and must be a valid ISO-8601 timestamp (e.g. 2026-11-17T00:00:00Z).',
        charged: false,
      },
    };
  }

  const { cik, secReachable } = await lookupTickerCik(rawTicker);
  if (!cik && secReachable) {
    return {
      status: 404,
      body: {
        error: 'unknown_ticker',
        message: `Ticker "${rawTicker}" was not found in U.S. SEC EDGAR directory.`,
        charged: false,
      },
    };
  }

  const nowMs = Date.now();
  const asOf = new Date(nowMs).toISOString();
  const maxLookbackMs = nowMs - MAX_LOOKBACK_DAYS * MS_PER_DAY;
  const windowClamped = parsedSinceMs < maxLookbackMs;
  const effectiveSinceMs = windowClamped ? maxLookbackMs : parsedSinceMs;
  const effectiveSince = new Date(effectiveSinceMs).toISOString();

  const [filingResult, sbChanges] = await Promise.all([
    cik ? checkSecFilings(rawTicker, cik, effectiveSinceMs) : Promise.resolve({ changes: [], companyName: rawTicker }),
    checkSbScoreChanges(rawTicker, effectiveSinceMs),
  ]);

  const thirteenFChanges = await check13fChanges(rawTicker, filingResult.companyName, effectiveSinceMs);

  const changes: TickerChangeItem[] = [
    ...filingResult.changes,
    ...sbChanges,
    ...thirteenFChanges,
  ].sort((a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt));

  const sinceLabel = formatShortUtcDate(effectiveSinceMs);
  const clampSuffix = windowClamped ? ' (clamped to 90-day window)' : '';
  const summary =
    changes.length === 0
      ? `No changes since ${sinceLabel}${clampSuffix}`
      : `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} since ${sinceLabel}${clampSuffix}`;

  const body: TickerIntelligenceChangesResponse = {
    status: 'success',
    ticker: rawTicker,
    since: rawSince,
    effectiveSince,
    windowClamped,
    ...(windowClamped
      ? { windowNote: 'Requested "since" was more than 90 days ago; window clamped to the past 90 days.' }
      : {}),
    asOf,
    coverageNote:
      'Checks SEC EDGAR 8-K/10-K/10-Q filings, deterministic 5-factor SB Score vs daily bars as of since, and tracked institutional Form 13F-HR filings as of their reported filing timestamps (not real-time tick surveillance).',
    summary,
    count: changes.length,
    changes,
  };

  return { status: 200, body };
}
