import { resolveTickerCik, lookupTickerCik } from './secTickerLookup.js';
import { WATCHLIST_TICKERS } from './dailyTriggersService.js';

const SEC_USER_AGENT = 'StockBloc-SEC-Analyst/2.0 (contact@stockbloc.ai)';

export const SEC_8K_ITEM_LABELS: Record<string, string> = {
  '1.01': 'Entry into a Material Definitive Agreement',
  '1.02': 'Termination of a Material Definitive Agreement',
  '1.03': 'Bankruptcy or Receivership',
  '1.04': 'Mine Safety - Reporting of Shutdowns and Patterns of Violations',
  '1.05': 'Material Cybersecurity Incidents',
  '2.01': 'Completion of Acquisition or Disposition of Assets',
  '2.02': 'Results of Operations and Financial Condition',
  '2.03': 'Creation of a Direct Financial Obligation',
  '2.04': 'Triggering Events That Accelerate or Increase a Direct Financial Obligation',
  '2.05': 'Costs Associated with Exit or Disposal Activities',
  '2.06': 'Material Impairments',
  '3.01': 'Notice of Delisting or Failure to Satisfy a Continued Listing Rule',
  '3.02': 'Unregistered Sales of Equity Securities',
  '3.03': 'Material Modification to Rights of Security Holders',
  '4.01': "Changes in Registrant's Certifying Accountant",
  '4.02': 'Non-Reliance on Previously Issued Financial Statements',
  '5.01': 'Changes in Control of Registrant',
  '5.02': 'Departure of Directors or Certain Officers; Election of Directors; Appointment of Certain Officers',
  '5.03': 'Amendments to Articles of Incorporation or Bylaws',
  '5.04': 'Temporary Suspension of Trading Under Employee Benefit Plans',
  '5.05': 'Amendments to Code of Ethics or Waiver',
  '5.07': 'Submission of Matters to a Vote of Security Holders',
  '5.08': 'Shareholder Director Nominations',
  '7.01': 'Regulation FD Disclosure',
  '8.01': 'Other Events',
  '9.01': 'Financial Statements and Exhibits',
};

export interface Signal8kFiling {
  ticker: string;
  companyName: string;
  filedDate: string;
  acceptanceDateTime: string | null;
  accessionNumber: string;
  filingUrl: string;
  items: string[];
  itemLabels: string[];
  summary: string;
}

export interface Signal8kResponse {
  status: 'success';
  source: string;
  since: string;
  asOf: string;
  count: number;
  filings: Signal8kFiling[];
}

// Cache extracted summaries by immutable SEC accessionNumber
const filingSummaryCache = new Map<string, string>();
const MAX_SUMMARY_CACHE_SIZE = 500;

export function clearSignals8kCache(): void {
  filingSummaryCache.clear();
}

export function parse8kItemCodes(raw: any): string[] {
  const list: string[] = Array.isArray(raw)
    ? raw.map((x) => String(x))
    : typeof raw === 'string'
    ? raw.split(/[,;]+/)
    : [];

  return list
    .map((s) => s.replace(/^Item\s+/i, '').trim())
    .filter(Boolean);
}

export function format8kItemLabels(items: string[]): string[] {
  return items.map((code) => {
    const label = SEC_8K_ITEM_LABELS[code];
    return label ? `${code}: ${label}` : `${code}: Material Current Report Item`;
  });
}

function buildSec8kUrl(cik: string, accessionNumber: string, primaryDocument?: string | null): string {
  const cikNum = parseInt(cik, 10);
  const accClean = accessionNumber.replace(/-/g, '');
  if (primaryDocument) {
    return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/${primaryDocument}`;
  }
  return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/`;
}

function parseAcceptanceOrFiledTimestamp(acceptanceDateTime: string | null, filedDate: string): number {
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
      if (!Number.isNaN(ts)) return ts;
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (filedDate) {
    const endOfDay = Date.parse(`${filedDate}T23:59:59Z`);
    if (!Number.isNaN(endOfDay)) return endOfDay;
  }
  return 0;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = parseInt(dec, 10);
      if (code === 160) return ' ';
      if (code === 8217 || code === 8216) return "'";
      if (code === 8220 || code === 8221) return '"';
      if (code === 8211 || code === 8212) return '-';
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : ' ';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const code = parseInt(hex, 16);
      if (code === 0xa0) return ' ';
      if (code === 0x2019 || code === 0x2018) return "'";
      if (code === 0x201c || code === 0x201d) return '"';
      if (code === 0x2013 || code === 0x2014) return '-';
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : ' ';
    })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&quot;/gi, '"')
    .replace(/&mdash;|&ndash;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Extracts 2-3 factual sentences directly from the substantive Item section of an SEC Form 8-K HTML document.
 * Never fabricates or extrapolates outside the filing text.
 */
export function extract8kSummaryFromHtml(html: string): string | null {
  if (!html || typeof html !== 'string') return null;

  const cleanedHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<ix:header[\s\S]*?<\/ix:header>/gi, ' ')
    .replace(/<ix:hidden[\s\S]*?<\/ix:hidden>/gi, ' ');

  const plainText = decodeHtmlEntities(cleanedHtml.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText || plainText.length < 40) return null;

  // Jump past cover-page boilerplate if present
  const coverEndMarkers = [
    /Extended transition period[\s\S]{0,160}?Exchange Act\.?/i,
    /Emerging Growth Company[\s\S]{0,160}?Exchange Act\.?/i,
    /Securities registered pursuant to Section 12[\s\S]{0,300}?Exchange\b/i,
  ];
  let searchStart = 0;
  for (const re of coverEndMarkers) {
    const m = plainText.match(re);
    if (m && typeof m.index === 'number') {
      searchStart = Math.max(searchStart, m.index + m[0].length);
    }
  }

  let bodyText = plainText.slice(searchStart).trim();

  // Locate first Item X.XX heading
  const itemHeaderRegex = /\bItem\s+\d\.\d{2}\.?\s+/i;
  const itemMatch = bodyText.match(itemHeaderRegex);
  if (itemMatch && typeof itemMatch.index === 'number') {
    bodyText = bodyText.slice(itemMatch.index);
  }

  // Strip the Item X.XX + official title line prefix if followed immediately by narrative text ("On ...", "The ...", etc.)
  bodyText = bodyText
    .replace(
      /^Item\s+\d\.\d{2}\.?\s+(?:Entry into a Material Definitive Agreement|Termination of a Material Definitive Agreement|Bankruptcy or Receivership|Material Cybersecurity Incidents|Completion of Acquisition or Disposition of Assets|Results of Operations and Financial Condition|Creation of a Direct Financial Obligation[^.]*|Costs Associated with Exit or Disposal Activities|Material Impairments|Notice of Delisting[^.]*|Unregistered Sales of Equity Securities|Material Modification[^.]*|Changes in Registrant[^.]*|Non-Reliance on Previously Issued Financial Statements[^.]*|Changes in Control of Registrant|Departure of Directors[^.]*|Amendments to Articles[^.]*|Submission of Matters to a Vote of Security Holders|Regulation FD Disclosure|Other Events|Financial Statements and Exhibits)\.?\s*/i,
      ''
    )
    .trim();

  // Cut off before signature / exhibit table boilerplate
  const stopMarkers = [
    /\bSIGNATURE[S]?\s+Pursuant to the requirements/i,
    /\bItem\s+9\.01\.?\s+Financial Statements and Exhibits/i,
    /\bThe (?:press release|information in this Current Report|information included in this Item)[\s\S]*?(?:shall not be deemed|Section 18 of the Securities Exchange Act)/i,
    /\bForward-Looking Statements\b/i,
  ];
  for (const stopRe of stopMarkers) {
    const sm = bodyText.match(stopRe);
    if (sm && typeof sm.index === 'number' && sm.index > 60) {
      bodyText = bodyText.slice(0, sm.index).trim();
    }
  }

  if (!bodyText || bodyText.length < 30) return null;

  // Split into sentences conservatively (preserve abbreviations like Inc., Corp., Co., No., U.S., Exhibit 99.1)
  const protectedText = bodyText
    .replace(/\b(Inc|Corp|Co|Ltd|LLC|L\.P|No|Dr|Mr|Ms|St|vs|approx|Jan|Feb|Mar|Apr|Aug|Sept|Oct|Nov|Dec|U\.S|S\.E\.C|Ex|Sec)\./gi, '$1<DOT>')
    .replace(/(\d)\.(\d)/g, '$1<DOT>$2');

  const rawSentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z"(])/)
    .map((s) => s.replace(/<DOT>/g, '.').trim())
    .filter((s) => s.length >= 20 && !/^Exhibit\s+\d+/i.test(s));

  if (rawSentences.length === 0) {
    return bodyText.slice(0, 420).trim();
  }

  const picked: string[] = [];
  let charCount = 0;
  for (const sentence of rawSentences) {
    if (picked.length >= 3) break;
    if (picked.length >= 2 && charCount + sentence.length > 520) break;
    picked.push(sentence);
    charCount += sentence.length + 1;
  }

  const joined = picked.join(' ').trim();
  return joined || null;
}

async function fetchFilingTextSummary(
  accessionNumber: string,
  filingUrl: string,
  fallbackMeta: { companyName: string; ticker: string; filedDate: string; itemLabels: string[] }
): Promise<string> {
  const cached = filingSummaryCache.get(accessionNumber);
  if (cached) return cached;

  const factualFallback = `Form 8-K filed by ${fallbackMeta.companyName} (${fallbackMeta.ticker}) on ${fallbackMeta.filedDate} reporting ${
    fallbackMeta.itemLabels.length > 0 ? fallbackMeta.itemLabels.join('; ') : 'material current events'
  }. Refer to filingUrl (${filingUrl}) for the full SEC EDGAR document.`;

  // Only attempt document fetch when URL points directly to a filing document (not directory index)
  if (!/\.(htm|html|txt)$/i.test(filingUrl)) {
    return factualFallback;
  }

  try {
    const res = await fetch(filingUrl, {
      headers: { 'User-Agent': SEC_USER_AGENT },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return factualFallback;
    const html = await res.text();
    const extracted = extract8kSummaryFromHtml(html);
    if (!extracted) return factualFallback;

    if (filingSummaryCache.size >= MAX_SUMMARY_CACHE_SIZE) {
      const oldestKey = filingSummaryCache.keys().next().value;
      if (oldestKey) filingSummaryCache.delete(oldestKey);
    }
    filingSummaryCache.set(accessionNumber, extracted);
    return extracted;
  } catch {
    return factualFallback;
  }
}

export async function fetchSignals8k(options: {
  ticker?: string;
  watchlist?: string | string[];
  since?: string;
  limit?: number;
}): Promise<{ status: number; body: any }> {
  const nowMs = Date.now();
  const asOf = new Date(nowMs).toISOString();

  // Parse limit (default 20, max 50)
  const rawLimit = options.limit !== undefined ? Number(options.limit) : 20;
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 20, 1), 50);

  // Parse since (default 24h ago)
  let sinceMs = nowMs - 24 * 60 * 60 * 1000;
  if (options.since !== undefined && String(options.since).trim().length > 0) {
    const parsed = Date.parse(String(options.since).trim());
    if (Number.isNaN(parsed)) {
      return {
        status: 400,
        body: {
          status: 'error',
          error: 'invalid_since',
          message: 'Invalid "since" timestamp. Provide a valid ISO-8601 timestamp (e.g. 2026-11-17T00:00:00Z).',
        },
      };
    }
    sinceMs = parsed;
  }
  const sinceIso = new Date(sinceMs).toISOString();

  // Resolve target tickers
  let tickers: string[] = [];
  const hasSingleTicker = Boolean(options.ticker && String(options.ticker).trim().length > 0);
  if (hasSingleTicker) {
    tickers = [String(options.ticker).trim().toUpperCase()];
  } else if (options.watchlist !== undefined) {
    const rawList = Array.isArray(options.watchlist)
      ? options.watchlist
      : String(options.watchlist).split(',');
    tickers = Array.from(
      new Set(
        rawList
          .map((t) => String(t).trim().toUpperCase())
          .filter(Boolean)
      )
    );
    if (tickers.length === 0) {
      return {
        status: 400,
        body: {
          status: 'error',
          error: 'invalid_watchlist',
          message: 'Query parameter "watchlist" must include at least 1 ticker (max 20).',
        },
      };
    }
    if (tickers.length > 20) {
      return {
        status: 400,
        body: {
          status: 'error',
          error: 'watchlist_limit_exceeded',
          message: 'Query parameter "watchlist" supports at most 20 tickers per call.',
        },
      };
    }
  } else {
    tickers = WATCHLIST_TICKERS.slice(0, 20);
  }

  // Verify CIK existence for explicit single ticker or watchlist
  const tickerToCik = new Map<string, string>();
  let secDirectoryReachable = false;

  if (hasSingleTicker || options.watchlist !== undefined) {
    await Promise.all(
      tickers.map(async (sym) => {
        const lookup = await lookupTickerCik(sym);
        if (lookup.secReachable) secDirectoryReachable = true;
        if (lookup.cik) {
          tickerToCik.set(sym, lookup.cik);
        }
      })
    );

    if (hasSingleTicker && !tickerToCik.has(tickers[0]) && secDirectoryReachable) {
      return {
        status: 404,
        body: {
          status: 'error',
          error: 'unknown_ticker',
          message: `Ticker "${tickers[0]}" was not found in U.S. SEC EDGAR directory.`,
        },
      };
    }

    if (options.watchlist !== undefined && tickerToCik.size === 0 && secDirectoryReachable) {
      return {
        status: 404,
        body: {
          status: 'error',
          error: 'unknown_ticker',
          message: `None of the requested watchlist tickers (${tickers.join(', ')}) were found in U.S. SEC EDGAR directory.`,
        },
      };
    }
  } else {
    await Promise.all(
      tickers.map(async (sym) => {
        const cik = await resolveTickerCik(sym);
        if (cik) tickerToCik.set(sym, cik);
      })
    );
  }

  interface Candidate8k {
    ticker: string;
    companyName: string;
    filedDate: string;
    acceptanceDateTime: string | null;
    filingTs: number;
    accessionNumber: string;
    filingUrl: string;
    items: string[];
    itemLabels: string[];
  }

  const candidates: Candidate8k[] = [];
  let secReachableCount = 0;

  const resolvedEntries = Array.from(tickerToCik.entries());
  const batchSize = 5;
  for (let i = 0; i < resolvedEntries.length; i += batchSize) {
    const batch = resolvedEntries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ([ticker, cik]) => {
        try {
          const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`;
          const res = await fetch(submissionsUrl, {
            headers: { 'User-Agent': SEC_USER_AGENT },
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) return;
          secReachableCount++;
          const json: any = await res.json();
          const companyName = String(json?.name || ticker);
          const recent = json?.filings?.recent;
          if (!recent || !Array.isArray(recent.form)) return;

          for (let idx = 0; idx < recent.form.length; idx++) {
            if (recent.form[idx] !== '8-K') continue;
            const accessionNumber = String(recent.accessionNumber?.[idx] || '').trim();
            const filedDate = String(recent.filingDate?.[idx] || '').trim();
            if (!accessionNumber || !filedDate) continue;

            const acceptanceDateTime = recent.acceptanceDateTime?.[idx]
              ? String(recent.acceptanceDateTime[idx])
              : null;
            const filingTs = parseAcceptanceOrFiledTimestamp(acceptanceDateTime, filedDate);
            if (filingTs < sinceMs) {
              // Submissions are generally reverse-chronological; continue safely across recent list
              continue;
            }

            const primaryDocument = recent.primaryDocument?.[idx]
              ? String(recent.primaryDocument[idx])
              : null;
            const items = parse8kItemCodes(recent.items?.[idx]);
            const itemLabels = format8kItemLabels(items);
            const filingUrl = buildSec8kUrl(cik, accessionNumber, primaryDocument);

            candidates.push({
              ticker,
              companyName,
              filedDate,
              acceptanceDateTime,
              filingTs,
              accessionNumber,
              filingUrl,
              items,
              itemLabels,
            });
          }
        } catch {
          // Skip individual ticker network errors while allowing others in batch
        }
      })
    );
  }

  if (resolvedEntries.length > 0 && secReachableCount === 0) {
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

  // Sort newest first by filing timestamp, then filedDate, then accessionNumber
  candidates.sort((a, b) => {
    if (b.filingTs !== a.filingTs) return b.filingTs - a.filingTs;
    const dateCmp = b.filedDate.localeCompare(a.filedDate);
    if (dateCmp !== 0) return dateCmp;
    return b.accessionNumber.localeCompare(a.accessionNumber);
  });

  const sliced = candidates.slice(0, limit);

  // Fetch filing HTML text & extract grounded 2-3 sentence summaries in small batches
  const filings: Signal8kFiling[] = [];
  const textBatchSize = 5;
  for (let i = 0; i < sliced.length; i += textBatchSize) {
    const batch = sliced.slice(i, i + textBatchSize);
    const enriched = await Promise.all(
      batch.map(async (item) => {
        const summary = await fetchFilingTextSummary(item.accessionNumber, item.filingUrl, {
          companyName: item.companyName,
          ticker: item.ticker,
          filedDate: item.filedDate,
          itemLabels: item.itemLabels,
        });
        return {
          ticker: item.ticker,
          companyName: item.companyName,
          filedDate: item.filedDate,
          acceptanceDateTime: item.acceptanceDateTime,
          accessionNumber: item.accessionNumber,
          filingUrl: item.filingUrl,
          items: item.items,
          itemLabels: item.itemLabels,
          summary,
        };
      })
    );
    filings.push(...enriched);
  }

  const responseBody: Signal8kResponse = {
    status: 'success',
    source: 'SEC EDGAR Submissions & Filing Text (sec.gov)',
    since: sinceIso,
    asOf,
    count: filings.length,
    filings,
  };

  return { status: 200, body: responseBody };
}
