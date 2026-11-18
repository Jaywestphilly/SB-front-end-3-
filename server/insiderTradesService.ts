import { lookupTickerCik } from './secTickerLookup.js';
import { runWithLimit } from './sec13fHoldings.js';

const SEC_USER_AGENT = 'StockBloc-SEC-Analyst/2.0 (contact@stockbloc.ai)';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_FORM4_FILINGS_TO_FETCH = 30;

export interface InsiderTradeItem {
  ticker: string;
  insiderName: string;
  insiderTitle: string;
  transactionDate: string;
  filedDate: string;
  transactionType: 'buy' | 'sell';
  shares: number;
  pricePerShare: number | null;
  totalValue: number | null;
  sharesOwnedAfter: number | null;
  filingUrl: string;
  asOf: string;
}

export interface InsiderTradesResponse {
  status: 'success';
  source: string;
  ticker: string;
  companyName: string;
  cik: string;
  count: number;
  asOf: string;
  since?: string;
  coverageNote: string;
  transactions: InsiderTradeItem[];
}

interface ParsedForm4File {
  transactions: Omit<InsiderTradeItem, 'asOf'>[];
}

const form4Cache = new Map<string, ParsedForm4File>();
const submissionsCache = new Map<string, { data: any; fetchedAt: number }>();

export function clearInsiderTradesCache(): void {
  form4Cache.clear();
  submissionsCache.clear();
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTagValue(xml: string, tagName: string): string {
  const blockRe = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(blockRe);
  if (!match) return '';
  const inner = match[1];
  const valMatch = inner.match(/<value\b[^>]*>([\s\S]*?)<\/value>/i);
  if (valMatch) {
    return decodeXmlEntities(valMatch[1]);
  }
  return decodeXmlEntities(inner.replace(/<[^>]+>/g, ' '));
}

function parseFiniteNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function buildInsiderTitle(xml: string): string {
  const relMatch = xml.match(/<reportingOwnerRelationship\b[^>]*>([\s\S]*?)<\/reportingOwnerRelationship>/i);
  const relXml = relMatch ? relMatch[1] : xml;

  const isFlagTrue = (tag: string) => {
    const v = extractTagValue(relXml, tag).toLowerCase();
    return v === '1' || v === 'true';
  };

  const isOfficer = isFlagTrue('isOfficer');
  const isDirector = isFlagTrue('isDirector');
  const isTenPct = isFlagTrue('isTenPercentOwner');
  const isOther = isFlagTrue('isOther');
  const officerTitle = extractTagValue(relXml, 'officerTitle');
  const otherText = extractTagValue(relXml, 'otherText');

  if (isOfficer && officerTitle) {
    return officerTitle;
  }

  const roles: string[] = [];
  if (isOfficer) roles.push('Officer');
  if (isDirector) roles.push('Director');
  if (isTenPct) roles.push('10% Owner');
  if (isOther) roles.push(otherText || 'Other');

  return roles.length > 0 ? roles.join(', ') : 'Insider';
}

export function parseForm4Xml(
  xml: string,
  fallbackTicker: string,
  filedDate: string,
  filingUrl: string
): Omit<InsiderTradeItem, 'asOf'>[] {
  const issuerSym = extractTagValue(xml, 'issuerTradingSymbol').toUpperCase();
  const ticker = issuerSym || fallbackTicker.toUpperCase();
  const insiderName = extractTagValue(xml, 'rptOwnerName') || 'Reporting Owner';
  const insiderTitle = buildInsiderTitle(xml);

  const txBlocks = [...xml.matchAll(/<nonDerivativeTransaction\b[^>]*>([\s\S]*?)<\/nonDerivativeTransaction>/gi)];
  const results: Omit<InsiderTradeItem, 'asOf'>[] = [];

  for (const match of txBlocks) {
    const block = match[1];
    const txCode = extractTagValue(block, 'transactionCode').toUpperCase();
    // Map only open-market / private purchases (P) and sales (S) so gifts/grants/tax withholdings aren't mislabeled
    if (txCode !== 'P' && txCode !== 'S') continue;

    const transactionType: 'buy' | 'sell' = txCode === 'P' ? 'buy' : 'sell';
    const rawTxDate = extractTagValue(block, 'transactionDate');
    const transactionDate = /^\d{4}-\d{2}-\d{2}/.test(rawTxDate)
      ? rawTxDate.slice(0, 10)
      : filedDate;

    const shares = parseFiniteNumber(extractTagValue(block, 'transactionShares'));
    if (shares === null || shares <= 0) continue;

    const pricePerShare = parseFiniteNumber(extractTagValue(block, 'transactionPricePerShare'));
    const totalValue =
      pricePerShare !== null ? Math.round(shares * pricePerShare * 100) / 100 : null;
    const sharesOwnedAfter = parseFiniteNumber(
      extractTagValue(block, 'sharesOwnedFollowingTransaction')
    );

    results.push({
      ticker,
      insiderName,
      insiderTitle,
      transactionDate,
      filedDate,
      transactionType,
      shares,
      pricePerShare,
      totalValue,
      sharesOwnedAfter,
      filingUrl,
    });
  }

  return results;
}

async function fetchCikSubmissions(cik: string): Promise<any> {
  const padded = cik.padStart(10, '0');
  const cached = submissionsCache.get(padded);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `https://data.sec.gov/submissions/CIK${padded}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': SEC_USER_AGENT },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    throw new Error(`SEC EDGAR submissions returned HTTP ${res.status}`);
  }
  const data = await res.json();
  submissionsCache.set(padded, { data, fetchedAt: Date.now() });
  return data;
}

export async function fetchInsiderTrades(options: {
  ticker?: string;
  limit?: number;
  since?: string;
}): Promise<{ status: number; body: any }> {
  const rawTicker = String(options.ticker || '').trim().toUpperCase();
  if (!rawTicker) {
    return {
      status: 400,
      body: {
        status: 'error',
        code: 'INVALID_INPUT',
        error: 'Query parameter "ticker" is required (e.g. ?ticker=NVDA).',
        message: 'Query parameter "ticker" is required (e.g. ?ticker=NVDA).',
        charged: false,
      },
    };
  }

  let limit = 20;
  if (options.limit !== undefined) {
    if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 50) {
      return {
        status: 400,
        body: {
          status: 'error',
          code: 'INVALID_INPUT',
          error: 'Query parameter "limit" must be an integer between 1 and 50.',
          message: 'Query parameter "limit" must be an integer between 1 and 50.',
          charged: false,
        },
      };
    }
    limit = options.limit;
  }

  let sinceMs: number | null = null;
  let sinceIso: string | undefined;
  if (options.since !== undefined && String(options.since).trim().length > 0) {
    const rawSince = String(options.since).trim();
    const parsed = Date.parse(rawSince);
    if (!/^\d{4}-\d{2}-\d{2}/.test(rawSince) || Number.isNaN(parsed)) {
      return {
        status: 400,
        body: {
          status: 'error',
          code: 'INVALID_INPUT',
          error: 'Query parameter "since" must be a valid ISO-8601 timestamp (e.g. 2026-09-01T00:00:00Z).',
          message: 'Query parameter "since" must be a valid ISO-8601 timestamp (e.g. 2026-09-01T00:00:00Z).',
          charged: false,
        },
      };
    }
    sinceMs = parsed;
    sinceIso = rawSince;
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

  if (!cik) {
    return {
      status: 503,
      body: {
        status: 'error',
        error: 'sec_edgar_unavailable',
        message: 'SEC EDGAR ticker directory is temporarily unreachable.',
      },
    };
  }

  const submissions = await fetchCikSubmissions(cik);
  const companyName = String(submissions?.name || rawTicker);
  const recent = submissions?.filings?.recent;
  const cikNum = parseInt(cik, 10);
  const asOf = new Date().toISOString();

  if (!recent || !Array.isArray(recent.form)) {
    return {
      status: 200,
      body: {
        status: 'success',
        source: 'SEC EDGAR Form 4',
        ticker: rawTicker,
        companyName,
        cik: cik.padStart(10, '0'),
        count: 0,
        asOf,
        ...(sinceIso ? { since: sinceIso } : {}),
        coverageNote:
          'Covers open-market and private insider purchases (Form 4 code P) and sales (Form 4 code S) from SEC EDGAR recent submissions; excludes gifts, tax withholdings, and RSU grants.',
        transactions: [],
      } satisfies InsiderTradesResponse,
    };
  }

  const candidateFilings: Array<{
    accessionNumber: string;
    filedDate: string;
    primaryDoc: string;
    rawDoc: string;
    filingUrl: string;
    rawXmlUrl: string;
  }> = [];

  for (let i = 0; i < recent.form.length && candidateFilings.length < MAX_FORM4_FILINGS_TO_FETCH; i++) {
    const form = String(recent.form[i] || '').trim().toUpperCase();
    if (form !== '4' && form !== '4/A') continue;

    const accessionNumber = String(recent.accessionNumber?.[i] || '').trim();
    const filedDate = String(recent.filingDate?.[i] || '').trim();
    const primaryDoc = String(recent.primaryDocument?.[i] || '').trim();
    if (!accessionNumber || !filedDate || !primaryDoc) continue;

    // A transactionDate cannot be after filedDate, so filings filed strictly before since cannot match
    if (sinceMs !== null) {
      const filedEndMs = Date.parse(`${filedDate}T23:59:59.999Z`);
      if (!Number.isNaN(filedEndMs) && filedEndMs < sinceMs) continue;
    }

    const rawDoc = primaryDoc.replace(/^xsl[^/]+\//i, '');
    if (!rawDoc.toLowerCase().endsWith('.xml')) continue;

    const accClean = accessionNumber.replace(/-/g, '');
    candidateFilings.push({
      accessionNumber,
      filedDate,
      primaryDoc,
      rawDoc,
      filingUrl: `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/${primaryDoc}`,
      rawXmlUrl: `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accClean}/${rawDoc}`,
    });
  }

  const parsedBatches = await runWithLimit(candidateFilings, 6, async (f) => {
    const cacheKey = `${cik}:${f.accessionNumber}`;
    const cached = form4Cache.get(cacheKey);
    if (cached) return cached.transactions;

    try {
      const res = await fetch(f.rawXmlUrl, {
        headers: { 'User-Agent': SEC_USER_AGENT },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) return [];
      const xml = await res.text();
      const parsed = parseForm4Xml(xml, rawTicker, f.filedDate, f.filingUrl);
      form4Cache.set(cacheKey, { transactions: parsed });
      return parsed;
    } catch {
      return [];
    }
  });

  const allTransactions: InsiderTradeItem[] = [];
  for (const batch of parsedBatches) {
    for (const tx of batch) {
      if (sinceMs !== null) {
        const txEndMs = Date.parse(`${tx.transactionDate}T23:59:59.999Z`);
        if (!Number.isNaN(txEndMs) && txEndMs < sinceMs) continue;
      }
      allTransactions.push({
        ...tx,
        asOf,
      });
    }
  }

  allTransactions.sort((a, b) => {
    const dDiff = Date.parse(b.transactionDate) - Date.parse(a.transactionDate);
    if (dDiff !== 0) return dDiff;
    return Date.parse(b.filedDate) - Date.parse(a.filedDate);
  });

  const sliced = allTransactions.slice(0, limit);

  return {
    status: 200,
    body: {
      status: 'success',
      source: 'SEC EDGAR Form 4',
      ticker: rawTicker,
      companyName,
      cik: cik.padStart(10, '0'),
      count: sliced.length,
      asOf,
      ...(sinceIso ? { since: sinceIso } : {}),
      coverageNote:
        'Covers open-market and private insider purchases (Form 4 code P) and sales (Form 4 code S) from SEC EDGAR recent Form 4 XML filings; excludes gifts, tax withholdings, and equity awards.',
      transactions: sliced,
    } satisfies InsiderTradesResponse,
  };
}
