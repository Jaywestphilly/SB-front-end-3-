import zlib from 'zlib';
import { runWithLimit } from './sec13fHoldings.js';
import { isValidSymbolFormat } from './x402InputValidation.js';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const INDEX_CACHE_TTL_MS = 15 * 60 * 1000;
const SENATE_SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_PARSED_PTR_CACHE = 2000;
const DEFAULT_COLD_FILING_SCAN_CAP = 90;

export interface CongressTradeItem {
  person: string;
  chamber: 'House' | 'Senate';
  ticker: string | null;
  transactionDate: string;
  disclosedDate: string;
  transactionType: 'purchase' | 'sale';
  amountRange: string;
  sourceUrl: string;
  asOf: string;
}

export interface CongressTradesResponse {
  status: 'success';
  query: {
    ticker?: string;
    person?: string;
  };
  count: number;
  asOf: string;
  since?: string;
  chamberStatus: {
    house: 'available' | 'unavailable';
    senate: 'available' | 'unavailable';
  };
  coverageNote: string;
  trades: CongressTradeItem[];
}

interface HousePtrFilingMeta {
  year: number;
  person: string;
  last: string;
  first: string;
  disclosedDate: string;
  docId: string;
  sourceUrl: string;
}

interface SenatePtrFilingMeta {
  uuid: string;
  person: string;
  last: string;
  first: string;
  disclosedDate: string;
  sourceUrl: string;
}

type ParsedPtrRow = Omit<CongressTradeItem, 'asOf'>;

const houseIndexCache = new Map<number, { fetchedAt: number; filings: HousePtrFilingMeta[] }>();
const senateIndexCache = new Map<string, { fetchedAt: number; filings: SenatePtrFilingMeta[] }>();
const parsedPtrCache = new Map<string, ParsedPtrRow[]>();
let senateSessionCache: { fetchedAt: number; cookies: string; csrfToken: string } | null = null;

export function clearCongressTradesCache(): void {
  houseIndexCache.clear();
  senateIndexCache.clear();
  parsedPtrCache.clear();
  senateSessionCache = null;
}

function cacheParsedPtr(key: string, rows: ParsedPtrRow[]): void {
  if (parsedPtrCache.size >= MAX_PARSED_PTR_CACHE) {
    const oldestKey = parsedPtrCache.keys().next().value;
    if (oldestKey) parsedPtrCache.delete(oldestKey);
  }
  parsedPtrCache.set(key, rows);
}

function mmddyyyyToIso(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const month = m[1].padStart(2, '0');
  const day = m[2].padStart(2, '0');
  const year = m[3];
  return `${year}-${month}-${day}`;
}

function normalizeAmountRange(raw: string): string {
  const trimmed = raw.replace(/\s+/g, ' ').trim();
  return trimmed.replace(/\$\s*([0-9,]+)\s*-\s*\$\s*([0-9,]+)/, '$$$1 - $$$2');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractXmlFromZipBuffer(buf: Buffer): string | null {
  const eocdSig = 0x06054b50;
  let eocdPos = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === eocdSig) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos < 0) return null;

  const cdOffset = buf.readUInt32LE(eocdPos + 16);
  const cdCount = buf.readUInt16LE(eocdPos + 10);
  let pos = cdOffset;

  for (let i = 0; i < cdCount && pos + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const compMethod = buf.readUInt16LE(pos + 10);
    const compSize = buf.readUInt32LE(pos + 20);
    const fnameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const lfhOffset = buf.readUInt32LE(pos + 42);
    const fname = buf.toString('utf8', pos + 46, pos + 46 + fnameLen);

    if (fname.toLowerCase().endsWith('.xml') && lfhOffset + 30 <= buf.length) {
      const lfhFnameLen = buf.readUInt16LE(lfhOffset + 26);
      const lfhExtraLen = buf.readUInt16LE(lfhOffset + 28);
      const dataStart = lfhOffset + 30 + lfhFnameLen + lfhExtraLen;
      const slice = buf.subarray(dataStart, dataStart + compSize);
      if (compMethod === 8) {
        return zlib.inflateRawSync(slice).toString('utf8');
      }
      if (compMethod === 0) {
        return slice.toString('utf8');
      }
    }

    pos += 46 + fnameLen + extraLen + commentLen;
  }

  return null;
}

export function parseHouseFdXml(xml: string, year: number): HousePtrFilingMeta[] {
  const members = [...xml.matchAll(/<Member>[\s\S]*?<\/Member>/g)];
  const filings: HousePtrFilingMeta[] = [];

  for (const m of members) {
    const block = m[0];
    const getTag = (tag: string) =>
      block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim() || '';

    if (getTag('FilingType') !== 'P') continue;
    const docId = getTag('DocID');
    // Only electronic 200* PTRs contain machine-readable PDF text (others are scanned image PDFs)
    if (!docId || !docId.startsWith('200')) continue;

    const disclosedDate = mmddyyyyToIso(getTag('FilingDate'));
    if (!disclosedDate) continue;

    const prefix = getTag('Prefix');
    const first = getTag('First');
    const last = getTag('Last');
    const suffix = getTag('Suffix');
    const person = [prefix, first, last, suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (!person) continue;

    filings.push({
      year,
      person,
      last,
      first,
      disclosedDate,
      docId,
      sourceUrl: `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${year}/${docId}.pdf`,
    });
  }

  filings.sort((a, b) => Date.parse(b.disclosedDate) - Date.parse(a.disclosedDate));
  return filings;
}

export function parseHousePtrTextRows(
  pages: string[],
  meta: Pick<HousePtrFilingMeta, 'person' | 'disclosedDate' | 'sourceUrl'>
): ParsedPtrRow[] {
  const joined = pages
    .map((p) =>
      p
        .replace(/P\s+T\s+R\s+Clerk of the House[\s\S]*?20515/g, ' ')
        .replace(/F\s+I\s+Name:[\s\S]*?State\/District:\s*[A-Z0-9]+/g, ' ')
        .replace(/T?\s*ID Owner Asset TransactionTypeDate NotificationDateAmount Cap\.Gains >\$200\?/g, ' ')
        .replace(/Filing ID #\d+/g, ' ')
        .replace(/\* For the complete list of asset type abbreviations[\s\S]*$/g, ' ')
    )
    .join(' ')
    .replace(/\s+/g, ' ');

  const txRe =
    /\(\s*([A-Z0-9.\-]{1,10})\s*\)\s*\[([A-Z]{2,4})\]\s*(P|S(?:\s*\([^)]+\))?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\$[0-9,]+(?:\s*-\s*\$[0-9,]+|\.[0-9]{2})?|Over\s+\$[0-9,]+)/g;

  const rows: ParsedPtrRow[] = [];
  for (const match of joined.matchAll(txRe)) {
    const ticker = match[1].trim().toUpperCase();
    const rawType = match[3].trim().toUpperCase();
    const transactionType: 'purchase' | 'sale' = rawType.startsWith('P') ? 'purchase' : 'sale';
    const txIso = mmddyyyyToIso(match[4]);
    const notifIso = mmddyyyyToIso(match[5]) || meta.disclosedDate;
    if (!txIso) continue;

    rows.push({
      person: meta.person,
      chamber: 'House',
      ticker,
      transactionDate: txIso,
      disclosedDate: meta.disclosedDate || notifIso,
      transactionType,
      amountRange: normalizeAmountRange(match[6]),
      sourceUrl: meta.sourceUrl,
    });
  }

  return rows;
}

export function parseSenatePtrHtmlRows(
  html: string,
  meta: Pick<SenatePtrFilingMeta, 'person' | 'disclosedDate' | 'sourceUrl'>
): ParsedPtrRow[] {
  const tbody = html.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0];
  if (!tbody) return [];

  const rows: ParsedPtrRow[] = [];
  const trMatches = [...tbody.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const trMatch of trMatches) {
    const tds = [...trMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    if (tds.length < 8) continue;

    const txDateRaw = decodeHtmlEntities(tds[1].replace(/<[^>]+>/g, ''));
    const txIso = mmddyyyyToIso(txDateRaw);
    if (!txIso) continue;

    const anchorTicker = tds[3].match(/>([^<]+)<\/a>/i)?.[1];
    const rawTickerText = decodeHtmlEntities((anchorTicker ?? tds[3]).replace(/<[^>]+>/g, '')).toUpperCase();
    const ticker =
      rawTickerText && rawTickerText !== '--' && rawTickerText !== 'N/A' && isValidSymbolFormat(rawTickerText)
        ? rawTickerText
        : null;

    const rawTxType = decodeHtmlEntities(tds[6].replace(/<[^>]+>/g, '')).toLowerCase();
    let transactionType: 'purchase' | 'sale' | null = null;
    if (rawTxType.includes('purchase')) transactionType = 'purchase';
    else if (rawTxType.includes('sale')) transactionType = 'sale';
    if (!transactionType) continue;

    const amountRange = normalizeAmountRange(decodeHtmlEntities(tds[7].replace(/<[^>]+>/g, '')));
    if (!amountRange || amountRange === '--') continue;

    rows.push({
      person: meta.person,
      chamber: 'Senate',
      ticker,
      transactionDate: txIso,
      disclosedDate: meta.disclosedDate,
      transactionType,
      amountRange,
      sourceUrl: meta.sourceUrl,
    });
  }

  return rows;
}

async function fetchHouseIndexForYear(year: number): Promise<HousePtrFilingMeta[]> {
  const cached = houseIndexCache.get(year);
  if (cached && Date.now() - cached.fetchedAt < INDEX_CACHE_TTL_MS) {
    return cached.filings;
  }

  const res = await fetch(`https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.zip`, {
    headers: { 'User-Agent': BROWSER_UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`House Clerk ${year}FD.zip returned HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const xml = extractXmlFromZipBuffer(buf);
  if (!xml) {
    throw new Error(`House Clerk ${year}FD.zip missing XML index`);
  }
  const filings = parseHouseFdXml(xml, year);
  houseIndexCache.set(year, { fetchedAt: Date.now(), filings });
  return filings;
}

async function fetchHouseCongressTrades(options: {
  ticker?: string;
  person?: string;
  sinceMs: number | null;
  limit: number;
}): Promise<ParsedPtrRow[]> {
  const currentYear = new Date().getUTCFullYear();
  const years = [currentYear];
  if (
    options.person ||
    (options.sinceMs !== null && new Date(options.sinceMs).getUTCFullYear() < currentYear)
  ) {
    years.push(currentYear - 1);
  }

  const indexLists = await Promise.all(
    years.map((y) => fetchHouseIndexForYear(y).catch((err) => {
      if (y === currentYear) throw err;
      return [] as HousePtrFilingMeta[];
    }))
  );
  let candidates = indexLists.flat();

  if (options.person) {
    const needle = options.person.toLowerCase();
    candidates = candidates.filter((f) => f.person.toLowerCase().includes(needle));
  }

  if (options.sinceMs !== null) {
    candidates = candidates.filter((f) => {
      const disMs = Date.parse(`${f.disclosedDate}T23:59:59.999Z`);
      return Number.isNaN(disMs) || disMs >= options.sinceMs!;
    });
  }

  // Sort newest disclosed first; bound cold scans when querying across all members by ticker
  candidates.sort((a, b) => Date.parse(b.disclosedDate) - Date.parse(a.disclosedDate));
  const scanLimit = options.person ? Math.min(candidates.length, 30) : Math.min(candidates.length, DEFAULT_COLD_FILING_SCAN_CAP);
  const toScan = candidates.slice(0, scanLimit);

  const { extractText, getDocumentProxy } = await import('unpdf');
  const startTime = Date.now();
  const timeBudgetMs = 8000;

  const parsedGroups = await runWithLimit(toScan, 10, async (filing) => {
    const cacheKey = `house:${filing.year}:${filing.docId}`;
    const cachedRows = parsedPtrCache.get(cacheKey);
    if (cachedRows) return cachedRows;

    if (Date.now() - startTime > timeBudgetMs) return [] as ParsedPtrRow[];

    try {
      const pdfRes = await fetch(filing.sourceUrl, {
        headers: { 'User-Agent': BROWSER_UA },
        signal: AbortSignal.timeout(4500),
      });
      if (!pdfRes.ok) return [] as ParsedPtrRow[];

      const pdf = await getDocumentProxy(new Uint8Array(await pdfRes.arrayBuffer()));
      const { text } = await extractText(pdf, { mergePages: false });
      const rows = parseHousePtrTextRows(Array.isArray(text) ? text : [String(text || '')], filing);
      cacheParsedPtr(cacheKey, rows);
      return rows;
    } catch {
      return [] as ParsedPtrRow[];
    }
  });

  return filterParsedRows(parsedGroups.flat(), options);
}

async function getSenateSession(forceRefresh = false): Promise<{ cookies: string; csrfToken: string }> {
  if (!forceRefresh && senateSessionCache && Date.now() - senateSessionCache.fetchedAt < SENATE_SESSION_TTL_MS) {
    return senateSessionCache;
  }

  const homeRes = await fetch('https://efdsearch.senate.gov/search/home/', {
    headers: { 'User-Agent': BROWSER_UA },
    signal: AbortSignal.timeout(6000),
  });
  if (!homeRes.ok) {
    throw new Error(`Senate eFD home returned HTTP ${homeRes.status}`);
  }
  const setCookies1 = homeRes.headers.getSetCookie ? homeRes.headers.getSetCookie() : [];
  const homeHtml = await homeRes.text();
  const csrfInput = homeHtml.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/)?.[1];
  const cookieHeader1 = setCookies1.map((c) => c.split(';')[0]).join('; ');
  if (!csrfInput || !cookieHeader1) {
    throw new Error('Senate eFD CSRF handshake missing token or cookies');
  }

  const postRes = await fetch('https://efdsearch.senate.gov/search/home/', {
    method: 'POST',
    headers: {
      'User-Agent': BROWSER_UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://efdsearch.senate.gov/search/home/',
      Origin: 'https://efdsearch.senate.gov',
      Cookie: cookieHeader1,
    },
    body: new URLSearchParams({
      prohibition_agreement: '1',
      csrfmiddlewaretoken: csrfInput,
    }).toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(6000),
  });

  const setCookies2 = postRes.headers.getSetCookie ? postRes.headers.getSetCookie() : [];
  const cookieMap = new Map<string, string>();
  for (const raw of [...setCookies1, ...setCookies2]) {
    const kv = raw.split(';')[0];
    const eqIdx = kv.indexOf('=');
    if (eqIdx > 0) {
      cookieMap.set(kv.slice(0, eqIdx).trim(), kv.slice(eqIdx + 1).trim());
    }
  }
  const cookies = Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  const csrfToken = cookieMap.get('csrftoken') || csrfInput;

  if (!cookieMap.has('sessionid')) {
    throw new Error('Senate eFD consent verification did not return session cookie');
  }

  senateSessionCache = { fetchedAt: Date.now(), cookies, csrfToken };
  return senateSessionCache;
}

async function fetchSenatePtrIndex(person?: string): Promise<SenatePtrFilingMeta[]> {
  const cacheKey = (person || '*').toLowerCase();
  const cached = senateIndexCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < INDEX_CACHE_TTL_MS) {
    return cached.filings;
  }

  const session = await getSenateSession();
  const currentYear = new Date().getUTCFullYear();
  const startDate = `01/01/${currentYear - 1} 00:00:00`;

  const res = await fetch('https://efdsearch.senate.gov/search/report/data/', {
    method: 'POST',
    headers: {
      'User-Agent': BROWSER_UA,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-CSRFToken': session.csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      Referer: 'https://efdsearch.senate.gov/search/',
      Origin: 'https://efdsearch.senate.gov',
      Cookie: session.cookies,
    },
    body: new URLSearchParams({
      draw: '1',
      start: '0',
      length: '100',
      report_types: '[11]',
      filer_types: '[]',
      submitted_start_date: startDate,
      submitted_end_date: '',
      candidate_state: '',
      senator_state: '',
      office_id: '',
      first_name: '',
      last_name: person ? person.trim().split(/\s+/).slice(-1)[0] : '',
    }).toString(),
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    senateSessionCache = null;
    throw new Error(`Senate eFD report/data returned HTTP ${res.status}`);
  }

  const json: any = await res.json();
  const rows: any[][] = Array.isArray(json?.data) ? json.data : [];
  const filings: SenatePtrFilingMeta[] = [];

  for (const r of rows) {
    const first = String(r[0] || '').trim();
    const last = String(r[1] || '').trim();
    const linkHtml = String(r[3] || '');
    const disclosedIso = mmddyyyyToIso(String(r[4] || ''));
    const hrefMatch = linkHtml.match(/href="(\/search\/view\/ptr\/([^/"]+)\/)"/i);
    if (!hrefMatch || !disclosedIso) continue;

    const personName = `${first} ${last}`.replace(/\s+/g, ' ').trim();
    filings.push({
      uuid: hrefMatch[2],
      first,
      last,
      person: personName,
      disclosedDate: disclosedIso,
      sourceUrl: `https://efdsearch.senate.gov${hrefMatch[1]}`,
    });
  }

  senateIndexCache.set(cacheKey, { fetchedAt: Date.now(), filings });
  return filings;
}

async function fetchSenateCongressTrades(options: {
  ticker?: string;
  person?: string;
  sinceMs: number | null;
  limit: number;
}): Promise<ParsedPtrRow[]> {
  let candidates = await fetchSenatePtrIndex(options.person);

  if (options.person) {
    const needle = options.person.toLowerCase();
    candidates = candidates.filter((f) => f.person.toLowerCase().includes(needle));
  }

  if (options.sinceMs !== null) {
    candidates = candidates.filter((f) => {
      const disMs = Date.parse(`${f.disclosedDate}T23:59:59.999Z`);
      return Number.isNaN(disMs) || disMs >= options.sinceMs!;
    });
  }

  candidates.sort((a, b) => Date.parse(b.disclosedDate) - Date.parse(a.disclosedDate));
  const scanLimit = options.person ? Math.min(candidates.length, 30) : Math.min(candidates.length, DEFAULT_COLD_FILING_SCAN_CAP);
  const toScan = candidates.slice(0, scanLimit);

  const session = toScan.length > 0 ? await getSenateSession() : null;
  const startTime = Date.now();
  const timeBudgetMs = 8000;

  const parsedGroups = await runWithLimit(toScan, 10, async (filing) => {
    const cacheKey = `senate:${filing.uuid}`;
    const cachedRows = parsedPtrCache.get(cacheKey);
    if (cachedRows) return cachedRows;

    if (!session || Date.now() - startTime > timeBudgetMs) return [] as ParsedPtrRow[];

    try {
      const ptrRes = await fetch(filing.sourceUrl, {
        headers: {
          'User-Agent': BROWSER_UA,
          Cookie: session.cookies,
          Referer: 'https://efdsearch.senate.gov/search/',
        },
        signal: AbortSignal.timeout(4500),
      });
      if (!ptrRes.ok) return [] as ParsedPtrRow[];
      const html = await ptrRes.text();
      const rows = parseSenatePtrHtmlRows(html, filing);
      cacheParsedPtr(cacheKey, rows);
      return rows;
    } catch {
      return [] as ParsedPtrRow[];
    }
  });

  return filterParsedRows(parsedGroups.flat(), options);
}

function filterParsedRows(
  rows: ParsedPtrRow[],
  options: { ticker?: string; person?: string; sinceMs: number | null }
): ParsedPtrRow[] {
  const tickerUpper = options.ticker ? options.ticker.trim().toUpperCase() : undefined;
  const personLower = options.person ? options.person.trim().toLowerCase() : undefined;

  return rows.filter((row) => {
    if (tickerUpper && row.ticker !== tickerUpper) return false;
    if (personLower && !row.person.toLowerCase().includes(personLower)) return false;
    if (options.sinceMs !== null) {
      const txEndMs = Date.parse(`${row.transactionDate}T23:59:59.999Z`);
      if (!Number.isNaN(txEndMs) && txEndMs < options.sinceMs) return false;
    }
    return true;
  });
}

export async function fetchCongressTrades(options: {
  ticker?: string;
  person?: string;
  limit?: number;
  since?: string;
}): Promise<{ status: number; body: any }> {
  const rawTicker = options.ticker !== undefined ? String(options.ticker).trim().toUpperCase() : '';
  const rawPerson = options.person !== undefined ? String(options.person).trim() : '';

  if (!rawTicker && !rawPerson) {
    return {
      status: 400,
      body: {
        status: 'error',
        code: 'INVALID_INPUT',
        error: 'Provide at least one query parameter: "ticker" (e.g. ?ticker=NVDA) or "person" (e.g. ?person=Pelosi).',
        message: 'Provide at least one query parameter: "ticker" (e.g. ?ticker=NVDA) or "person" (e.g. ?person=Pelosi).',
        charged: false,
      },
    };
  }

  if (rawTicker && !isValidSymbolFormat(rawTicker)) {
    return {
      status: 400,
      body: {
        status: 'error',
        code: 'INVALID_INPUT',
        error: `Invalid ticker format: "${rawTicker}".`,
        message: `Invalid ticker format: "${rawTicker}".`,
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
          error: 'Query parameter "since" must be a valid ISO-8601 timestamp (e.g. 2026-01-01T00:00:00Z).',
          message: 'Query parameter "since" must be a valid ISO-8601 timestamp (e.g. 2026-01-01T00:00:00Z).',
          charged: false,
        },
      };
    }
    sinceMs = parsed;
    sinceIso = rawSince;
  }

  const filterOpts = {
    ticker: rawTicker || undefined,
    person: rawPerson || undefined,
    sinceMs,
    limit,
  };

  const [houseResult, senateResult] = await Promise.allSettled([
    fetchHouseCongressTrades(filterOpts),
    fetchSenateCongressTrades(filterOpts),
  ]);

  const houseAvailable = houseResult.status === 'fulfilled';
  const senateAvailable = senateResult.status === 'fulfilled';

  if (!houseAvailable && !senateAvailable) {
    return {
      status: 503,
      body: {
        status: 'error',
        error: 'congress_feeds_unavailable',
        message: 'Both U.S. House Clerk and Senate eFD disclosure feeds are temporarily unavailable.',
        chamberStatus: {
          house: 'unavailable',
          senate: 'unavailable',
        },
      },
    };
  }

  const asOf = new Date().toISOString();
  const combined: CongressTradeItem[] = [
    ...(houseAvailable ? houseResult.value : []),
    ...(senateAvailable ? senateResult.value : []),
  ].map((row) => ({
    ...row,
    asOf,
  }));

  combined.sort((a, b) => {
    const dDiff = Date.parse(b.transactionDate) - Date.parse(a.transactionDate);
    if (dDiff !== 0) return dDiff;
    return Date.parse(b.disclosedDate) - Date.parse(a.disclosedDate);
  });

  const sliced = combined.slice(0, limit);

  const coverageParts: string[] = [];
  if (houseAvailable) {
    coverageParts.push('House Clerk electronic Periodic Transaction Reports (200* PTR PDFs)');
  } else {
    coverageParts.push('House Clerk feed temporarily unavailable');
  }
  if (senateAvailable) {
    coverageParts.push('Senate eFD electronic Periodic Transaction Reports (HTML tables)');
  } else {
    coverageParts.push('Senate eFD feed temporarily unavailable');
  }

  return {
    status: 200,
    body: {
      status: 'success',
      query: {
        ...(rawTicker ? { ticker: rawTicker } : {}),
        ...(rawPerson ? { person: rawPerson } : {}),
      },
      count: sliced.length,
      asOf,
      ...(sinceIso ? { since: sinceIso } : {}),
      chamberStatus: {
        house: houseAvailable ? 'available' : 'unavailable',
        senate: senateAvailable ? 'available' : 'unavailable',
      },
      coverageNote: `${coverageParts.join('; ')}. Scanned paper PDFs are excluded unless electronically filed; amountRange reflects disclosed bracket verbatim.`,
      trades: sliced,
    } satisfies CongressTradesResponse,
  };
}
