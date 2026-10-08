import fs from 'fs';
import path from 'path';
import { getTitleToTickerMap, normalizeCompanyName } from './secTickerLookup.js';

const UA = 'StockBloc/1.0 (contact@stockbloc.ai)';

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function formatShares(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(1);
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export interface Latest13FResult {
  accession: string;
  filedOn: string;
  periodEnd: string;
  filings: any[];
}

export async function getLatest13F(cik: string): Promise<Latest13FResult | null> {
  const paddedCik = String(cik).padStart(10, '0');
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) {
      throw new Error(`submissions_http_${res.status}`);
    }
    const json: any = await res.json();
    const recent = json.filings?.recent;
    if (!recent || !Array.isArray(recent.form)) {
      return null;
    }
    const forms = recent.form;
    const accessions = recent.accessionNumber;
    const filingDates = recent.filingDate;
    const reportDates = recent.reportDate;

    let accession = '';
    let filedOn = '';
    let periodEnd = '';
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] === '13F-HR') {
        accession = accessions[i];
        filedOn = filingDates[i];
        periodEnd = reportDates[i];
        break;
      }
    }

    if (!accession) {
      return null;
    }

    // Build the latest 8 filings of any form to keep user experience intact
    const filings: any[] = [];
    const count = Math.min(forms.length, 8);
    for (let j = 0; j < count; j++) {
      const formType = forms[j];
      const fDate = filingDates[j];
      const acc = accessions[j] ? String(accessions[j]).replace(/-/g, '') : '';
      const doc = recent.primaryDocument?.[j] || '';
      const desc = (recent.primaryDocDescription && recent.primaryDocDescription[j]) || `SEC Form ${formType} Submission`;
      const cikInt = parseInt(paddedCik, 10).toString();
      const docUrl = (acc && doc)
        ? `https://www.sec.gov/Archives/edgar/data/${cikInt}/${acc}/${doc}`
        : `https://www.sec.gov/edgar/browse/?CIK=${paddedCik}`;

      filings.push({
        form_type: formType,
        filing_date: fDate,
        description: desc,
        doc_url: docUrl
      });
    }

    return {
      accession,
      filedOn,
      periodEnd,
      filings
    };
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.message === 'fetch user aborted') {
      throw new Error('timeout');
    }
    throw err;
  }
  return null;
}

export async function fetchInfoTable(cik: string, accession: string): Promise<{ url: string; xml: string }> {
  const cleanAccession = accession.replace(/-/g, '');
  const cikInt = parseInt(cik, 10);
  const indexUrl = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${cleanAccession}/index.json`;
  
  try {
    const indexRes = await fetch(indexUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000)
    });
    if (!indexRes.ok) {
      throw new Error(`index_http_${indexRes.status}`);
    }
    const indexJson: any = await indexRes.json();
    const items = indexJson?.directory?.item || [];
    let xmlFilename: string | null = null;
    
    for (const item of items) {
      const name = item.name || '';
      if (name.endsWith('.xml') && name !== 'primary_doc.xml') {
        xmlFilename = name;
        break;
      }
    }
    
    if (!xmlFilename) {
      throw new Error('no_infotable_xml');
    }
    
    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${cleanAccession}/${xmlFilename}`;
    const xmlRes = await fetch(xmlUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(30000) // 30 s timeout
    });
    
    if (!xmlRes.ok) {
      throw new Error(`infotable_http_${xmlRes.status}`);
    }
    
    const xmlText = await xmlRes.text();
    return { url: xmlUrl, xml: xmlText };
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.message === 'fetch user aborted') {
      throw new Error('timeout');
    }
    throw err;
  }
}

export interface ParsedInfoTableItem {
  cusip: string;
  nameOfIssuer: string;
  value: number;
  shrs: number;
}

export function parseInfoTable(xml: string): { items: ParsedInfoTableItem[]; totalValueUsd: number } {
  const rowRegex = /<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/g;
  let match: RegExpExecArray | null;
  const agg: Record<string, { nameOfIssuer: string; value: number; shrs: number }> = {};
  let totalValueUsd = 0;
  
  function getTagValue(rowXml: string, tagName: string): string {
    const m = rowXml.match(new RegExp('<(?:\\w+:)?' + tagName + '>\\s*([^<]*?)\\s*</(?:\\w+:)?' + tagName + '>'));
    return m ? m[1].trim() : '';
  }
  
  let rowCount = 0;
  while ((match = rowRegex.exec(xml)) !== null) {
    rowCount++;
    const row = match[1];
    const putCall = getTagValue(row, 'putCall');
    if (putCall) {
      continue; // Skip option rows
    }
    const rawCusip = getTagValue(row, 'cusip').toUpperCase();
    const rawIssuer = decodeEntities(getTagValue(row, 'nameOfIssuer'));
    const rawVal = parseFloat(getTagValue(row, 'value')) || 0;
    const rawShrs = parseFloat(getTagValue(row, 'sshPrnamt')) || 0;
    
    if (!rawCusip) continue;
    
    if (!agg[rawCusip]) {
      agg[rawCusip] = {
        nameOfIssuer: rawIssuer,
        value: 0,
        shrs: 0
      };
    }
    agg[rawCusip].value += rawVal;
    agg[rawCusip].shrs += rawShrs;
    totalValueUsd += rawVal;
  }
  
  if (rowCount === 0) {
    throw new Error('parse_zero_rows');
  }
  
  const items: ParsedInfoTableItem[] = Object.keys(agg).map((cusip) => ({
    cusip,
    nameOfIssuer: agg[cusip].nameOfIssuer,
    value: agg[cusip].value,
    shrs: agg[cusip].shrs
  })).sort((a, b) => b.value - a.value);
  
  return { items, totalValueUsd };
}

export async function getHoldings(cik: string, fundId?: string): Promise<any> {
  const fId = fundId || cik;
  try {
    const latest = await getLatest13F(cik);
    if (!latest) {
      return { ok: false, reason: 'no_13f_hr' };
    }
    
    const dataDir = process.env.SB_DATA_DIR || path.join(process.cwd(), 'server', 'data');
    const cachePath = path.join(dataDir, 'sec_13f_holdings_cache.json');
    
    let cacheData: Record<string, any> = {};
    if (fs.existsSync(cachePath)) {
      try {
        cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      } catch {
        // ignore bad cache file
      }
    }
    
    if (cacheData[latest.accession]) {
      return cacheData[latest.accession];
    }
    
    const infoTable = await fetchInfoTable(cik, latest.accession);
    const parsed = parseInfoTable(infoTable.xml);
    
    const titleToTicker = await getTitleToTickerMap();
    
    const topHoldings = parsed.items.slice(0, 10).map((item) => {
      const normName = normalizeCompanyName(item.nameOfIssuer);
      const symbol = titleToTicker[normName] || null;
      return {
        symbol,
        name: item.nameOfIssuer,
        cusip: item.cusip,
        shares: formatShares(item.shrs),
        valueUsd: item.value,
        portfolioPercent: parsed.totalValueUsd > 0 ? round2((item.value / parsed.totalValueUsd) * 100) : 0
      };
    });
    
    const result = {
      ok: true,
      holdingsAccession: latest.accession,
      holdingsFiledOn: latest.filedOn,
      holdingsAsOf: latest.periodEnd,
      holdingsSourceUrl: infoTable.url,
      totalValueUsd: parsed.totalValueUsd,
      topHoldings,
      filings: latest.filings
    };
    
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      cacheData[latest.accession] = result;
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
    } catch {
      // ignore cache write errors
    }
    
    return result;
  } catch (err: any) {
    const reason = err.message || String(err);
    console.warn('[13F]', fId, cik, reason);
    return { ok: false, reason };
  }
}

export async function runWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<any>[] = [];
  for (const item of items) {
    const p = fn(item).then((res) => {
      executing.splice(executing.indexOf(p), 1);
      return res;
    });
    results.push(p as any);
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}
