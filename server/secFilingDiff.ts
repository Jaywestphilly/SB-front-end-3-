import fs from 'node:fs';
import path from 'node:path';
import { resolveTickerCik } from './secTickerLookup.js';
import { findMatchingFact } from './secAnalystAgent.js';

export interface FilingRef {
  accession: string;
  periodEnd: string;
  form: string;
  filedDate: string;
  url: string;
}

export interface FinancialChange {
  metric: string;
  prior: number | null;
  current: number;
  changePct: number | null;
  marginChangePp?: number | null;
  unit: string;
  xbrlTag: string;
  priorAccession: string;
  currentAccession: string;
}

export interface RiskFactorItem {
  title: string;
  snippet: string;
  accession: string;
  priorSnippet?: string;
  priorAccession?: string;
}

export interface RiskFactorChanges {
  added: RiskFactorItem[];
  removed: RiskFactorItem[];
  changed: RiskFactorItem[];
  addedTotal: number;
  removedTotal: number;
  changedTotal: number;
}

export interface RiskDelta {
  added: number;
  removed: number;
  changed: number;
  netNewRisks: number;
  churnPct: number | null;
  sectionLengthChangePct: number | null;
  headline: string;
  method: string;
}

export interface FilingDiffResult {
  riskDelta?: RiskDelta;
  mode: 'diff';
  ticker: string;
  filingType: '10-K' | '10-Q';
  comparisonBasis: 'annual' | 'same_quarter_prior_year' | 'sequential';
  currentFiling: FilingRef;
  priorFiling: FilingRef | null;
  financialChanges: FinancialChange[];
  riskFactorChanges?: RiskFactorChanges;
  riskSectionChars?: { prior: number; current: number };
  summary: string[];
  sources: string[];
  dataNote: string;
}

export interface CompactRiskItem {
  title: string;
  text?: string;
}

export interface CompactFilingDiffResult {
  mode: 'diff';
  ticker: string;
  filingType: '10-K' | '10-Q';
  currentFiling: { form: string; filedDate: string; url: string };
  priorFiling: { form: string; filedDate: string; url: string } | null;
  riskDelta: RiskDelta;
  riskFactorChanges?: {
    added: CompactRiskItem[];
    removed: CompactRiskItem[];
    changed: CompactRiskItem[];
    addedTotal: number;
    removedTotal: number;
    changedTotal: number;
  };
  financialChanges: Array<[string, number | null, number, number | null]>;
  sources: string[];
}

const SEC_USER_AGENT = 'StockBloc-SEC-Analyst/1.0 (contact@stockbloc.ai)';
const SEC_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache: key -> { result, timestamp }
const inMemoryDiffCache = new Map<string, { result: FilingDiffResult; timestamp: number }>();

export function clearDiffCache(): void {
  inMemoryDiffCache.clear();
}

function getCacheDir(): string {
  const dir = process.env.SB_DATA_DIR || path.join(process.cwd(), 'server', 'data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore directory creation errors if mocked/read-only
    }
  }
  return dir;
}

function getCacheKey(currentAcc: string, priorAcc: string | null): string {
  return `${currentAcc}|${priorAcc || 'none'}`;
}

function getCachedDiff(cacheKey: string): FilingDiffResult | null {
  const mem = inMemoryDiffCache.get(cacheKey);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.result;
  }

  const safeFilename = `diff_${cacheKey.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const filePath = path.join(getCacheDir(), safeFilename);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.result) {
        inMemoryDiffCache.set(cacheKey, { result: parsed.result, timestamp: parsed.timestamp });
        return parsed.result;
      }
    } catch {
      // Ignore cache read failures
    }
  }
  return null;
}

function setCachedDiff(cacheKey: string, result: FilingDiffResult): void {
  const timestamp = Date.now();
  inMemoryDiffCache.set(cacheKey, { result, timestamp });

  try {
    const safeFilename = `diff_${cacheKey.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const filePath = path.join(getCacheDir(), safeFilename);
    fs.writeFileSync(filePath, JSON.stringify({ timestamp, result }, null, 2), 'utf8');
  } catch {
    // Ignore cache write failures
  }
}

function stripHtmlTagsOnly(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\r/g, '\n');
}

function preprocessItem1AHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(?:h[1-6]|b|strong|i|em)\b[^>]*>([\s\S]*?)<\/(?:h[1-6]|b|strong|i|em)>/gi, (_, inner) => {
      const clean = inner.replace(/<[^>]+>/g, '').trim();
      return clean.length >= 8 ? `\n\n<RISK_HEADING>${clean}</RISK_HEADING>\n\n` : clean;
    })
    .replace(/<(?:p|div|br|tr)\b[^>]*>/gi, '\n\n')
    .replace(/<(?!\/?RISK_HEADING\b)[^>]+>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function sliceItem1A(text: string): string | null {
  // Non-empty, trimmed lines. Matching ignores <RISK_HEADING> markers; output keeps them.
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const clean = (l: string) => l.replace(/<\/?RISK_HEADING>/gi, '').replace(/\s+/g, ' ').trim();

  // Split-tolerant patterns (SEC iXBRL often splits words across spans, e.g. "RIS K FACTORS").
  const RF = /R\s*I\s*S\s*K\s+F\s*A\s*C\s*T\s*O\s*R\s*S/i;
  const START = /^(?:P\s*A\s*R\s*T\s+I\s*[,.\-\u2013]?\s*)?I\s*t\s*e\s*m\s*1\s*A\b\s*[.:\-\u2013]?\s*/i;
  const END_ITEM = /^(?:P\s*A\s*R\s*T\s+I\s*[,.\-\u2013]?\s*)?I\s*t\s*e\s*m\s*(?:1\s*B|1\s*C|2)\b/i;
  const END_TITLE = /U\s*n\s*r\s*e\s*s\s*o\s*l\s*v\s*e\s*d\s+S\s*t\s*a\s*f\s*f|C\s*y\s*b\s*e\s*r\s*s\s*e\s*c\s*u\s*r\s*i\s*t\s*y|P\s*r\s*o\s*p\s*e\s*r\s*t\s*i\s*e\s*s/i;
  const MIN_CHARS = 5000;

  // A start is a line beginning with "Item 1A" (optionally "PART I"), with "Risk Factors"
  // immediately after it on the same line or the next two lines (<= 40 chars of gap).
  const isStart = (i: number): boolean => {
    const c = clean(lines[i]);
    const m = c.match(START);
    if (!m) return false;
    const rest = [c.slice(m[0].length), clean(lines[i + 1] || ''), clean(lines[i + 2] || '')].join(' ');
    const rf = rest.match(RF);
    return !!rf && (rf.index ?? 99) <= 40;
  };

  // An end is a line beginning with Item 1B / 1C / 2 whose title (same or next 2 lines) is
  // Unresolved Staff Comments / Cybersecurity / Properties, or a bare "Unresolved Staff Comments" line.
  const isEnd = (j: number): boolean => {
    const c = clean(lines[j]);
    if (/^U\s*n\s*r\s*e\s*s\s*o\s*l\s*v\s*e\s*d\s+S\s*t\s*a\s*f\s*f/i.test(c)) return true;
    if (!END_ITEM.test(c)) return false;
    const win = [c, clean(lines[j + 1] || ''), clean(lines[j + 2] || '')].join(' ');
    return END_TITLE.test(win);
  };

  // Take the first start whose section reaches MIN_CHARS. Table-of-contents entries end
  // within a few lines and are skipped; cross-references never start a line.
  for (let i = 0; i < lines.length; i++) {
    if (!isStart(i)) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (isEnd(j)) { end = j; break; }
    }
    const sliced = lines.slice(i, end).join('\n\n').trim();
    if (sliced.length >= MIN_CHARS) return sliced;
  }
  return null;
}

function isIntroParagraph(text: string): boolean {
  const clean = text.replace(/<\/?RISK_HEADING>/gi, '').trim();
  return (
    /^(?:The following summarizes|Because of the following factors|Our business, financial condition|The following risks and uncertainties|Risk Factors Summary)/i.test(
      clean
    )
  );
}

function normTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleSimilarity(a: string, b: string): number {
  const normA = normTitle(a);
  const normB = normTitle(b);
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const wordsA = new Set(normA.split(' ').filter(w => w.length > 1));
  const wordsB = new Set(normB.split(' ').filter(w => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function extractFirstSentence(text: string): string {
  const clean = text.replace(/<\/?RISK_HEADING>/gi, '').trim();
  const match = clean.match(/^([^.!?]+[.!?])/);
  if (match) {
    const sentence = match[1].trim();
    return sentence.length > 120 ? sentence.slice(0, 120).trim() : sentence;
  }
  return clean.length > 120 ? clean.slice(0, 120).trim() : clean;
}

interface ParsedRisk {
  title: string;
  normTitle: string;
  snippet: string;
  accession: string;
}

function parseRisksFromItem1A(text: string, accession: string): ParsedRisk[] {
  const rawParagraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const risks: ParsedRisk[] = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const para = rawParagraphs[i];
    if (isIntroParagraph(para)) continue;

    const headingMatch = para.match(/<RISK_HEADING>([\s\S]*?)<\/RISK_HEADING>/i);
    if (headingMatch) {
      const headingText = headingMatch[1].replace(/<\/?RISK_HEADING>/gi, '').trim();
      const bodyText = para.replace(/<\/?RISK_HEADING>/gi, '').trim();

      // If the paragraph is only the heading and there is a next paragraph that is body
      if (
        bodyText === headingText &&
        i + 1 < rawParagraphs.length &&
        !rawParagraphs[i + 1].includes('<RISK_HEADING>') &&
        !isIntroParagraph(rawParagraphs[i + 1])
      ) {
        const nextPara = rawParagraphs[i + 1].replace(/<\/?RISK_HEADING>/gi, '').trim();
        const fullSnippet = `${headingText} ${nextPara}`.slice(0, 300).trim();
        risks.push({
          title: headingText.length > 120 ? headingText.slice(0, 120).trim() : headingText,
          normTitle: normTitle(headingText),
          snippet: fullSnippet,
          accession
        });
        i++; // skip nextPara since consumed as body
        continue;
      }

      // Paragraph contains heading and body inline
      const fullSnippet = bodyText.slice(0, 300).trim();
      risks.push({
        title: headingText.length > 120 ? headingText.slice(0, 120).trim() : headingText,
        normTitle: normTitle(headingText),
        snippet: fullSnippet,
        accession
      });
      continue;
    }

    // Fallback: no explicit RISK_HEADING tag
    if (para.length > 40 && !/^(?:Item|ITEM)\s+1A/i.test(para) && !/^Table of Contents/i.test(para)) {
      const title = extractFirstSentence(para);
      if (title && title.length >= 10) {
        risks.push({
          title: title.length > 120 ? title.slice(0, 120).trim() : title,
          normTitle: normTitle(title),
          snippet: para.slice(0, 300).trim(),
          accession
        });
      }
    }
  }

  return risks;
}

function compareRiskFactors(
  currentRisks: ParsedRisk[],
  priorRisks: ParsedRisk[],
  currentAccession: string,
  priorAccession: string
): RiskFactorChanges {
  // Compute similarities for all pairs
  const candidates: Array<{ curIdx: number; priIdx: number; sim: number }> = [];

  for (let c = 0; c < currentRisks.length; c++) {
    for (let p = 0; p < priorRisks.length; p++) {
      const sim = titleSimilarity(currentRisks[c].title, priorRisks[p].title);
      if (sim >= 0.6) {
        candidates.push({ curIdx: c, priIdx: p, sim });
      }
    }
  }

  // Sort by similarity descending for greedy best-match pairing
  candidates.sort((a, b) => b.sim - a.sim);

  const matchedCur = new Set<number>();
  const matchedPri = new Set<number>();
  const changed: RiskFactorItem[] = [];

  for (const match of candidates) {
    if (matchedCur.has(match.curIdx) || matchedPri.has(match.priIdx)) continue;
    matchedCur.add(match.curIdx);
    matchedPri.add(match.priIdx);

    const cur = currentRisks[match.curIdx];
    const pri = priorRisks[match.priIdx];

    // If identical: unchanged (omit from all lists)
    if (match.sim >= 0.999 || cur.normTitle === pri.normTitle) {
      continue;
    }

    // Similar (0.6 <= sim < 1.0): changed!
    changed.push({
      title: cur.title,
      snippet: cur.snippet,
      accession: currentAccession,
      priorSnippet: pri.snippet,
      priorAccession
    });
  }

  const candidateAdded: RiskFactorItem[] = [];
  for (let c = 0; c < currentRisks.length; c++) {
    if (!matchedCur.has(c)) {
      candidateAdded.push({
        title: currentRisks[c].title,
        snippet: currentRisks[c].snippet,
        accession: currentAccession
      });
    }
  }

  const candidateRemoved: RiskFactorItem[] = [];
  for (let p = 0; p < priorRisks.length; p++) {
    if (!matchedPri.has(p)) {
      candidateRemoved.push({
        title: priorRisks[p].title,
        snippet: priorRisks[p].snippet,
        accession: priorAccession
      });
    }
  }

  // Any title that would appear in both added and removed must go to changed
  for (let i = candidateAdded.length - 1; i >= 0; i--) {
    const add = candidateAdded[i];
    const remIdx = candidateRemoved.findIndex(
      rem => titleSimilarity(add.title, rem.title) >= 0.6 || normTitle(add.title) === normTitle(rem.title)
    );
    if (remIdx !== -1) {
      const rem = candidateRemoved[remIdx];
      changed.push({
        ...add,
        priorSnippet: rem.snippet,
        priorAccession
      });
      candidateAdded.splice(i, 1);
      candidateRemoved.splice(remIdx, 1);
    }
  }

  const addedTotal = candidateAdded.length;
  const removedTotal = candidateRemoved.length;
  const changedTotal = changed.length;

  return {
    added: candidateAdded.slice(0, 10),
    removed: candidateRemoved.slice(0, 10),
    changed: changed.slice(0, 10),
    addedTotal,
    removedTotal,
    changedTotal
  };
}

function roundToTenth(n: number | null): number | null {
  if (n === null || isNaN(n)) return null;
  return Math.round(n * 10) / 10;
}

export function formatSummaryValue(val: number, unit: string): string {
  if (val === null || val === undefined || isNaN(val)) return '';

  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  const formatNumber = (num: number): string => {
    return num.toFixed(2).replace(/\.?0+$/, '');
  };

  if (unit === 'USD') {
    if (absVal >= 1e9) {
      return `${sign}$${formatNumber(absVal / 1e9)}B`;
    }
    if (absVal >= 1e6) {
      return `${sign}$${formatNumber(absVal / 1e6)}M`;
    }
    if (absVal >= 1e3) {
      return `${sign}$${formatNumber(absVal / 1e3)}K`;
    }
    return `${sign}$${formatNumber(absVal)}`;
  }

  if (unit === 'shares') {
    if (absVal >= 1e9) {
      return `${sign}${formatNumber(absVal / 1e9)}B shares`;
    }
    if (absVal >= 1e6) {
      return `${sign}${formatNumber(absVal / 1e6)}M shares`;
    }
    if (absVal >= 1e3) {
      return `${sign}${formatNumber(absVal / 1e3)}K shares`;
    }
    return `${sign}${formatNumber(absVal)} shares`;
  }

  if (unit === 'derived') {
    return `${val}`;
  }

  return `${val} ${unit}`;
}

function calcChangePct(current: number, prior: number | null): number | null {
  if (prior === null || prior === 0) return null;
  const pct = ((current - prior) / Math.abs(prior)) * 100;
  return roundToTenth(pct);
}

export function computeRiskDelta(params: {
  ticker: string;
  filingType: string;
  riskFactorChanges?: {
    addedTotal: number;
    removedTotal: number;
    changedTotal: number;
  } | null;
  riskSectionChars?: {
    prior: number;
    current: number;
  } | null;
  priorRiskCount?: number | null;
}): RiskDelta {
  const added = params.riskFactorChanges?.addedTotal ?? 0;
  const removed = params.riskFactorChanges?.removedTotal ?? 0;
  const changed = params.riskFactorChanges?.changedTotal ?? 0;
  const netNewRisks = added - removed;

  let churnPct: number | null = null;
  if (
    typeof params.priorRiskCount === 'number' &&
    params.priorRiskCount > 0 &&
    !isNaN(params.priorRiskCount)
  ) {
    const rawChurn = ((added + removed + changed) / params.priorRiskCount) * 100;
    churnPct = Math.round(rawChurn * 10) / 10;
  }

  let sectionLengthChangePct: number | null = null;
  if (
    params.riskSectionChars &&
    typeof params.riskSectionChars.prior === 'number' &&
    typeof params.riskSectionChars.current === 'number' &&
    params.riskSectionChars.prior > 0
  ) {
    const rawLenChange =
      ((params.riskSectionChars.current - params.riskSectionChars.prior) /
        params.riskSectionChars.prior) *
      100;
    sectionLengthChangePct = Math.round(rawLenChange * 10) / 10;
  }

  const headline = `${params.ticker} ${params.filingType}: ${added} risk factors added, ${removed} removed, ${changed} changed vs prior filing.`;
  const method =
    'Deterministic comparison of SEC Item 1A risk factors: added, removed, and changed from parsed title matching; netNewRisks = added - removed; churnPct = (added + removed + changed) / priorCount * 100; sectionLengthChangePct = (currentChars - priorChars) / priorChars * 100.';

  return {
    added,
    removed,
    changed,
    netNewRisks,
    churnPct,
    sectionLengthChangePct,
    headline,
    method
  };
}

export function formatCompactRiskItem(title: string, snippet?: string): CompactRiskItem {
  const normTitle = title.trim();
  let rawText = snippet ? snippet.trim() : '';

  if (rawText.toLowerCase().startsWith(normTitle.toLowerCase())) {
    rawText = rawText.slice(normTitle.length);
    rawText = rawText.replace(/^[:.\-\u2014,\s]+/, '').trim();
  }

  const text160 = rawText.slice(0, 160).trim();

  if (!text160 || text160.toLowerCase() === normTitle.toLowerCase()) {
    return { title: normTitle };
  }

  return { title: normTitle, text: text160 };
}

export function formatCompactDiffResult(diff: FilingDiffResult): CompactFilingDiffResult {
  const compactRfc = diff.riskFactorChanges
    ? {
        added: diff.riskFactorChanges.added.map(r => formatCompactRiskItem(r.title, r.snippet)),
        removed: diff.riskFactorChanges.removed.map(r => formatCompactRiskItem(r.title, r.snippet)),
        changed: diff.riskFactorChanges.changed.map(r => formatCompactRiskItem(r.title, r.snippet)),
        addedTotal: diff.riskFactorChanges.addedTotal,
        removedTotal: diff.riskFactorChanges.removedTotal,
        changedTotal: diff.riskFactorChanges.changedTotal
      }
    : undefined;

  const compactFinancials: Array<[string, number | null, number, number | null]> =
    diff.financialChanges.map(fc => [
      fc.metric,
      fc.prior,
      fc.current,
      fc.changePct
    ]);

  const compact: CompactFilingDiffResult = {
    mode: 'diff',
    ticker: diff.ticker,
    filingType: diff.filingType,
    currentFiling: {
      form: diff.currentFiling.form,
      filedDate: diff.currentFiling.filedDate,
      url: diff.currentFiling.url
    },
    priorFiling: diff.priorFiling
      ? {
          form: diff.priorFiling.form,
          filedDate: diff.priorFiling.filedDate,
          url: diff.priorFiling.url
        }
      : null,
    riskDelta: diff.riskDelta,
    ...(compactRfc ? { riskFactorChanges: compactRfc } : {}),
    financialChanges: compactFinancials,
    sources: diff.sources
  };

  return compact;
}

export async function buildFilingDiff(
  ticker: string,
  filingType: '10-K' | '10-Q',
  options: { compact: true }
): Promise<CompactFilingDiffResult>;
export async function buildFilingDiff(
  ticker: string,
  filingType: '10-K' | '10-Q',
  options?: { compact?: false }
): Promise<FilingDiffResult>;
export async function buildFilingDiff(
  ticker: string,
  filingType: '10-K' | '10-Q',
  options?: { compact?: boolean }
): Promise<FilingDiffResult | CompactFilingDiffResult>;
export async function buildFilingDiff(
  ticker: string,
  filingType: '10-K' | '10-Q',
  options?: { compact?: boolean }
): Promise<FilingDiffResult | CompactFilingDiffResult> {
  const normTicker = ticker.toUpperCase().trim();
  const cik = await resolveTickerCik(normTicker);
  if (!cik) {
    throw new Error(`Ticker "${normTicker}" not found in SEC EDGAR directory`);
  }

  const sources: string[] = [];
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`;
  sources.push(submissionsUrl);

  const subRes = await fetch(submissionsUrl, {
    headers: { 'User-Agent': SEC_USER_AGENT },
    signal: AbortSignal.timeout(SEC_TIMEOUT_MS)
  });

  if (!subRes.ok) {
    const err: any = new Error(`SEC EDGAR submissions unavailable (${subRes.status})`);
    err.status = 503;
    err.code = 'SEC_UNAVAILABLE';
    throw err;
  }

  const subData: any = await subRes.json();
  const recent = subData?.filings?.recent;
  if (!recent || !Array.isArray(recent.form)) {
    const err: any = new Error(`No recent filings found for ${normTicker}`);
    err.status = 503;
    err.code = 'SEC_UNAVAILABLE';
    throw err;
  }

  const matchingIndices: number[] = [];
  for (let i = 0; i < recent.form.length; i++) {
    if (recent.form[i] === filingType) {
      matchingIndices.push(i);
    }
  }

  if (matchingIndices.length === 0) {
    const err: any = new Error(`No Form ${filingType} filings found for ${normTicker}`);
    err.status = 503;
    err.code = 'SEC_UNAVAILABLE';
    throw err;
  }

  const cikNum = parseInt(cik, 10);
  const currentIdx = matchingIndices[0];
  const currentAccession = recent.accessionNumber[currentIdx];
  const currentAccClean = currentAccession.replace(/-/g, '');
  const currentFiledDate = recent.filingDate[currentIdx];
  const currentPeriodEnd = recent.reportDate[currentIdx] || currentFiledDate;
  const currentPrimaryDoc = recent.primaryDocument[currentIdx];
  const currentUrl = currentPrimaryDoc
    ? `https://www.sec.gov/ix?doc=/Archives/edgar/data/${cikNum}/${currentAccClean}/${currentPrimaryDoc}`
    : `https://www.sec.gov/edgar/browse/?CIK=${cik}`;

  const currentFiling: FilingRef = {
    accession: currentAccession,
    periodEnd: currentPeriodEnd,
    form: filingType,
    filedDate: currentFiledDate,
    url: currentUrl
  };

  let priorIdx: number | null = null;
  let comparisonBasis: 'annual' | 'same_quarter_prior_year' | 'sequential' = 'annual';

  if (filingType === '10-K') {
    comparisonBasis = 'annual';
    if (matchingIndices.length > 1) {
      priorIdx = matchingIndices[1];
    }
  } else {
    // 10-Q: find the 10-Q whose reportDate is 365 ±20 days before current
    const currentReportTime = new Date(currentPeriodEnd).getTime();
    let sameQuarterIdx: number | null = null;

    for (let k = 1; k < matchingIndices.length; k++) {
      const idx = matchingIndices[k];
      const repDate = recent.reportDate[idx] || recent.filingDate[idx];
      const repTime = new Date(repDate).getTime();
      const diffDays = (currentReportTime - repTime) / (1000 * 60 * 60 * 24);
      if (diffDays >= 345 && diffDays <= 385) {
        sameQuarterIdx = idx;
        break;
      }
    }

    if (sameQuarterIdx !== null) {
      priorIdx = sameQuarterIdx;
      comparisonBasis = 'same_quarter_prior_year';
    } else if (matchingIndices.length > 1) {
      priorIdx = matchingIndices[1];
      comparisonBasis = 'sequential';
    } else {
      priorIdx = null;
      comparisonBasis = 'sequential';
    }
  }

  // Handle case where no prior filing exists
  if (priorIdx === null) {
    const noPriorNote = `Financials from SEC XBRL companyfacts. total debt = LongTermDebt and excludes commercial paper. shares are cover-page counts with their dates (${currentPeriodEnd}). risk lists capped at 10; risk matching is heuristic. No prior Form ${filingType} found in EDGAR submissions history for comparison.`;
    const noPriorResult: FilingDiffResult = {
      riskDelta: computeRiskDelta({
        ticker: normTicker,
        filingType,
        riskFactorChanges: null,
        riskSectionChars: null,
        priorRiskCount: null
      }),
      mode: 'diff',
      ticker: normTicker,
      filingType,
      comparisonBasis,
      currentFiling,
      priorFiling: null,
      financialChanges: [],
      summary: [`Latest Form ${filingType} (${currentPeriodEnd}) retrieved. No prior ${filingType} filing found for comparison.`],
      sources,
      dataNote: noPriorNote
    };
    return options?.compact ? formatCompactDiffResult(noPriorResult) : noPriorResult;
  }

  const priorAccession = recent.accessionNumber[priorIdx];
  const priorAccClean = priorAccession.replace(/-/g, '');
  const priorFiledDate = recent.filingDate[priorIdx];
  const priorPeriodEnd = recent.reportDate[priorIdx] || priorFiledDate;
  const priorPrimaryDoc = recent.primaryDocument[priorIdx];
  const priorUrl = priorPrimaryDoc
    ? `https://www.sec.gov/ix?doc=/Archives/edgar/data/${cikNum}/${priorAccClean}/${priorPrimaryDoc}`
    : `https://www.sec.gov/edgar/browse/?CIK=${cik}`;

  const priorFiling: FilingRef = {
    accession: priorAccession,
    periodEnd: priorPeriodEnd,
    form: filingType,
    filedDate: priorFiledDate,
    url: priorUrl
  };

  // Cache check by `${currentAccession}|${priorAccession}`
  const cacheKey = getCacheKey(currentAccession, priorAccession);
  const cached = getCachedDiff(cacheKey);
  if (cached) {
    return options?.compact ? formatCompactDiffResult(cached) : cached;
  }

  // Fetch companyfacts
  const companyfactsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik.padStart(10, '0')}.json`;
  sources.push(companyfactsUrl);

  const factsRes = await fetch(companyfactsUrl, {
    headers: { 'User-Agent': SEC_USER_AGENT },
    signal: AbortSignal.timeout(SEC_TIMEOUT_MS)
  });

  if (!factsRes.ok) {
    const err: any = new Error(`SEC EDGAR companyfacts unavailable (${factsRes.status})`);
    err.status = 503;
    err.code = 'SEC_UNAVAILABLE';
    throw err;
  }

  const factsData: any = await factsRes.json();
  const gaap = factsData?.facts?.['us-gaap'] || {};
  const dei = factsData?.facts?.['dei'] || {};

  const financialChanges: FinancialChange[] = [];
  const omittedMetrics: string[] = [];

  // Helper to get fact value with duration check
  const getDurationFact = (concept: string, acc: string, repDate: string): any | null => {
    const units = gaap[concept]?.units?.USD;
    return findMatchingFact(units, acc, repDate, filingType, true);
  };

  // Helper to get instant fact value
  const getInstantFact = (concept: string, acc: string, repDate: string): any | null => {
    const units = gaap[concept]?.units?.USD;
    return findMatchingFact(units, acc, repDate, filingType, false);
  };

  // 1. Revenue
  const revTags = ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'];
  let curRev: { val: number; tag: string } | null = null;
  for (const tag of revTags) {
    const match = getDurationFact(tag, currentAccession, currentPeriodEnd);
    if (match && typeof match.val === 'number') {
      curRev = { val: match.val, tag };
      break;
    }
  }

  let priRev: { val: number; tag: string } | null = null;
  for (const tag of revTags) {
    const match = getDurationFact(tag, priorAccession, priorPeriodEnd);
    if (match && typeof match.val === 'number') {
      priRev = { val: match.val, tag };
      break;
    }
  }

  if (curRev && priRev) {
    financialChanges.push({
      metric: 'Revenue',
      prior: priRev.val,
      current: curRev.val,
      changePct: calcChangePct(curRev.val, priRev.val),
      unit: 'USD',
      xbrlTag: curRev.tag === priRev.tag ? curRev.tag : `${priRev.tag}/${curRev.tag}`,
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Revenue');
  }

  // 2. Net income
  const curNetInc = getDurationFact('NetIncomeLoss', currentAccession, currentPeriodEnd);
  const priNetInc = getDurationFact('NetIncomeLoss', priorAccession, priorPeriodEnd);
  if (curNetInc && typeof curNetInc.val === 'number' && priNetInc && typeof priNetInc.val === 'number') {
    financialChanges.push({
      metric: 'Net income',
      prior: priNetInc.val,
      current: curNetInc.val,
      changePct: calcChangePct(curNetInc.val, priNetInc.val),
      unit: 'USD',
      xbrlTag: 'NetIncomeLoss',
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Net income');
  }

  // 3. Operating income
  const curOpInc = getDurationFact('OperatingIncomeLoss', currentAccession, currentPeriodEnd);
  const priOpInc = getDurationFact('OperatingIncomeLoss', priorAccession, priorPeriodEnd);
  if (curOpInc && typeof curOpInc.val === 'number' && priOpInc && typeof priOpInc.val === 'number') {
    financialChanges.push({
      metric: 'Operating income',
      prior: priOpInc.val,
      current: curOpInc.val,
      changePct: calcChangePct(curOpInc.val, priOpInc.val),
      unit: 'USD',
      xbrlTag: 'OperatingIncomeLoss',
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Operating income');
  }

  // 4. Gross margin = GrossProfit / revenue
  const curGrossProfit = getDurationFact('GrossProfit', currentAccession, currentPeriodEnd);
  const priGrossProfit = getDurationFact('GrossProfit', priorAccession, priorPeriodEnd);
  if (
    curGrossProfit && typeof curGrossProfit.val === 'number' && curRev && curRev.val !== 0 &&
    priGrossProfit && typeof priGrossProfit.val === 'number' && priRev && priRev.val !== 0
  ) {
    const curMargin = curGrossProfit.val / curRev.val;
    const priMargin = priGrossProfit.val / priRev.val;
    const curMarginPct = curMargin * 100;
    const priMarginPct = priMargin * 100;
    const marginChangePp = Math.round((curMarginPct - priMarginPct) * 100) / 100;

    financialChanges.push({
      metric: 'Gross margin',
      prior: Math.round(priMargin * 10000) / 10000,
      current: Math.round(curMargin * 10000) / 10000,
      changePct: calcChangePct(curMargin, priMargin),
      marginChangePp,
      unit: 'derived',
      xbrlTag: 'GrossProfit/Revenue',
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Gross margin');
  }

  // 5. Total debt = LongTermDebt, else LongTermDebtNoncurrent + LongTermDebtCurrent
  const getTotalDebt = (acc: string, repDate: string): { val: number; tag: string } | null => {
    const ltd = getInstantFact('LongTermDebt', acc, repDate);
    if (ltd && typeof ltd.val === 'number') {
      return { val: ltd.val, tag: 'LongTermDebt' };
    }
    const noncurrent = getInstantFact('LongTermDebtNoncurrent', acc, repDate);
    const curr = getInstantFact('LongTermDebtCurrent', acc, repDate);
    if (noncurrent && typeof noncurrent.val === 'number' && curr && typeof curr.val === 'number') {
      return { val: noncurrent.val + curr.val, tag: 'LongTermDebtNoncurrent+LongTermDebtCurrent' };
    }
    if (noncurrent && typeof noncurrent.val === 'number') {
      return { val: noncurrent.val, tag: 'LongTermDebtNoncurrent' };
    }
    return null;
  };

  const curDebt = getTotalDebt(currentAccession, currentPeriodEnd);
  const priDebt = getTotalDebt(priorAccession, priorPeriodEnd);
  if (curDebt && priDebt) {
    financialChanges.push({
      metric: 'Total debt',
      prior: priDebt.val,
      current: curDebt.val,
      changePct: calcChangePct(curDebt.val, priDebt.val),
      unit: 'USD',
      xbrlTag: curDebt.tag === priDebt.tag ? curDebt.tag : `${priDebt.tag}/${curDebt.tag}`,
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Total debt');
  }

  // 6. Cash = CashAndCashEquivalentsAtCarryingValue (instant)
  const curCash = getInstantFact('CashAndCashEquivalentsAtCarryingValue', currentAccession, currentPeriodEnd);
  const priCash = getInstantFact('CashAndCashEquivalentsAtCarryingValue', priorAccession, priorPeriodEnd);
  if (curCash && typeof curCash.val === 'number' && priCash && typeof priCash.val === 'number') {
    financialChanges.push({
      metric: 'Cash',
      prior: priCash.val,
      current: curCash.val,
      changePct: calcChangePct(curCash.val, priCash.val),
      unit: 'USD',
      xbrlTag: 'CashAndCashEquivalentsAtCarryingValue',
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Cash');
  }

  // 7. Shares = dei:EntityCommonStockSharesOutstanding (match by accn only)
  const sharesUnits = dei['EntityCommonStockSharesOutstanding']?.units?.shares;
  const curShares = findMatchingFact(sharesUnits, currentAccession, undefined, undefined, false);
  const priShares = findMatchingFact(sharesUnits, priorAccession, undefined, undefined, false);
  let shareDatesNoteStr = `${currentFiling.periodEnd}${priorFiling ? ` / ${priorFiling.periodEnd}` : ''}`;
  if (curShares && curShares.end) {
    shareDatesNoteStr = curShares.end + (priShares && priShares.end ? ` / ${priShares.end}` : '');
  }

  if (curShares && typeof curShares.val === 'number' && priShares && typeof priShares.val === 'number') {
    financialChanges.push({
      metric: 'Shares',
      prior: priShares.val,
      current: curShares.val,
      changePct: calcChangePct(curShares.val, priShares.val),
      unit: 'shares',
      xbrlTag: 'dei:EntityCommonStockSharesOutstanding',
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Shares');
  }

  // 8. Capex = PaymentsToAcquirePropertyPlantAndEquipment
  const curCapex = getDurationFact('PaymentsToAcquirePropertyPlantAndEquipment', currentAccession, currentPeriodEnd);
  const priCapex = getDurationFact('PaymentsToAcquirePropertyPlantAndEquipment', priorAccession, priorPeriodEnd);
  if (curCapex && typeof curCapex.val === 'number' && priCapex && typeof priCapex.val === 'number') {
    financialChanges.push({
      metric: 'Capex',
      prior: priCapex.val,
      current: curCapex.val,
      changePct: calcChangePct(curCapex.val, priCapex.val),
      unit: 'USD',
      xbrlTag: 'PaymentsToAcquirePropertyPlantAndEquipment',
      priorAccession,
      currentAccession
    });
  } else {
    omittedMetrics.push('Capex');
  }

  // Fetch Item 1A primary documents for Risk Factor Changes
  let riskFactorChanges: RiskFactorChanges | undefined = undefined;
  let riskSectionChars: { prior: number; current: number } | undefined = undefined;
  let riskOmissionReason: string | null = null;
  let priorRiskFactorCount: number | null = null;

  if (currentPrimaryDoc && priorPrimaryDoc) {
    const curDocUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${currentAccClean}/${currentPrimaryDoc}`;
    const priDocUrl = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${priorAccClean}/${priorPrimaryDoc}`;
    sources.push(curDocUrl);
    sources.push(priDocUrl);

    try {
      const [curDocRes, priDocRes] = await Promise.all([
        fetch(curDocUrl, {
          headers: { 'User-Agent': SEC_USER_AGENT },
          signal: AbortSignal.timeout(SEC_TIMEOUT_MS)
        }),
        fetch(priDocUrl, {
          headers: { 'User-Agent': SEC_USER_AGENT },
          signal: AbortSignal.timeout(SEC_TIMEOUT_MS)
        })
      ]);

      if (!curDocRes.ok || !priDocRes.ok) {
        riskOmissionReason = `Primary document HTTP retrieval failed (current: ${curDocRes.status}, prior: ${priDocRes.status})`;
      } else {
        const [curHtml, priHtml] = await Promise.all([curDocRes.text(), priDocRes.text()]);

        const curProcessed = preprocessItem1AHtml(curHtml);
        const priProcessed = preprocessItem1AHtml(priHtml);

        let cur1A = sliceItem1A(curProcessed);
        let pri1A = sliceItem1A(priProcessed);

        if (!cur1A || cur1A.length < 500) {
          cur1A = sliceItem1A(stripHtmlTagsOnly(curHtml));
        }
        if (!pri1A || pri1A.length < 500) {
          pri1A = sliceItem1A(stripHtmlTagsOnly(priHtml));
        }

        const curLen = cur1A ? cur1A.length : 0;
        const priLen = pri1A ? pri1A.length : 0;
        riskSectionChars = { prior: priLen, current: curLen };

        if (!cur1A || !pri1A) {
          riskOmissionReason = 'Item 1A risk factors text could not be identified';
        } else if (curLen < 20000 || priLen < 20000) {
          riskOmissionReason = `Item 1A risk section length check failed: current section is ${curLen.toLocaleString()} chars, prior section is ${priLen.toLocaleString()} chars (minimum 20,000 required)`;
        } else if (curLen < 0.3 * priLen || priLen < 0.3 * curLen) {
          riskOmissionReason = `Item 1A risk section length ratio check failed: current section is ${curLen.toLocaleString()} chars, prior section is ${priLen.toLocaleString()} chars (must be at least 30% of each other)`;
        } else {
          const curRisks = parseRisksFromItem1A(cur1A, currentAccession);
          const priRisks = parseRisksFromItem1A(pri1A, priorAccession);
          priorRiskFactorCount = priRisks.length;

          riskFactorChanges = compareRiskFactors(curRisks, priRisks, currentAccession, priorAccession);
          (riskFactorChanges as any).priorTotal = priRisks.length;
        }
      }
    } catch (err: any) {
      riskOmissionReason = `Failed to retrieve or parse primary documents: ${err?.message || 'timeout'}`;
    }
  } else {
    riskOmissionReason = 'Primary document filenames not available in submissions metadata';
  }

  // Summary generation: at most 5 strings, built by template only
  const summary: string[] = [];
  const maxFinancialSummarySlots = riskFactorChanges ? 4 : 5;

  // If Gross margin is present, prioritize it in the summary as requested
  const grossMarginItem = financialChanges.find(
    fc => fc.metric === 'Gross margin' && typeof fc.marginChangePp === 'number'
  );

  const otherSortedFinancials = [...financialChanges]
    .filter(fc => fc.metric !== 'Gross margin' && fc.changePct !== null)
    .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!));

  const chosenFinancials: FinancialChange[] = [];
  if (grossMarginItem) {
    chosenFinancials.push(grossMarginItem);
  }
  for (const item of otherSortedFinancials) {
    if (chosenFinancials.length >= maxFinancialSummarySlots) break;
    chosenFinancials.push(item);
  }

  for (const fc of chosenFinancials) {
    const priorFormatted = formatSummaryValue(fc.prior, fc.unit);
    const curFormatted = formatSummaryValue(fc.current, fc.unit);

    if (fc.metric === 'Gross margin' && typeof fc.marginChangePp === 'number') {
      const signPp = fc.marginChangePp > 0 ? '+' : '';
      summary.push(`Gross margin changed ${signPp}${fc.marginChangePp} pp (from ${priorFormatted} to ${curFormatted})`);
    } else {
      const sign = (fc.changePct ?? 0) > 0 ? '+' : '';
      summary.push(`${fc.metric} changed ${sign}${fc.changePct}% (from ${priorFormatted} to ${curFormatted})`);
    }
  }

  if (riskFactorChanges) {
    summary.push(
      `Risk factors: ${riskFactorChanges.addedTotal} added, ${riskFactorChanges.removedTotal} removed, ${riskFactorChanges.changedTotal} modified (showing up to 10)`
    );
  }

  const finalSummary = summary.slice(0, 5);
  if (finalSummary.length === 0) {
    finalSummary.push(`Form ${filingType} cross-filing comparison computed for ${normTicker}.`);
  }

  // Assemble dataNote
  const dataNoteParts = [
    'Financials from SEC XBRL companyfacts.',
    'total debt = LongTermDebt and excludes commercial paper.',
    `shares are cover-page counts with their dates (${shareDatesNoteStr}).`,
    'risk lists capped at 10; risk matching is heuristic.'
  ];
  if (omittedMetrics.length > 0) {
    dataNoteParts.push(`Omitted metrics missing in prior or current filing: ${omittedMetrics.join(', ')}.`);
  }
  if (riskOmissionReason) {
    dataNoteParts.push(`Risk factor changes omitted: ${riskOmissionReason}.`);
  }
  const dataNote = dataNoteParts.join(' ');

  const priorCount = typeof priorRiskFactorCount === 'number'
    ? priorRiskFactorCount
    : (riskFactorChanges as any)?.priorTotal ?? null;

  const riskDelta = computeRiskDelta({
    ticker: normTicker,
    filingType,
    riskFactorChanges,
    riskSectionChars,
    priorRiskCount: priorCount
  });

  const result: FilingDiffResult = {
    riskDelta,
    mode: 'diff',
    ticker: normTicker,
    filingType,
    comparisonBasis,
    currentFiling,
    priorFiling,
    financialChanges,
    ...(riskFactorChanges ? { riskFactorChanges } : {}),
    ...(riskSectionChars ? { riskSectionChars } : {}),
    summary: finalSummary,
    sources,
    dataNote
  };

  // Cache result for 24h
  setCachedDiff(cacheKey, result);

  return options?.compact ? formatCompactDiffResult(result) : result;
}
