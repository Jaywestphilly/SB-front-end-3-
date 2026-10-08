import fs from 'fs';
import path from 'path';
import { getHoldings, runWithLimit } from '../../server/sec13fHoldings.js';

export interface SecFilingItem {
  form_type: string;
  filing_date: string;
  description: string;
  doc_url: string;
}

export interface Holding13F {
  symbol: string;
  name: string;
  shares: string;
  valueMillions: number;
  portfolioPercent: number;
  changeType: "NEW" | "INCREASED" | "DECREASED" | "HOLD" | "SOLD_OUT";
  changePercent: number;
  sector: string;
  thesis: string;
  cusip?: string;
  valueUsd?: number;
}

export interface SectorAlloc {
  sector: string;
  percent: number;
  valueMillions: number;
  color: string;
}

export interface SecFundData {
  id: string;
  fund_name: string;
  fundName: string;
  cik: string;
  manager: string;
  filing_date: string;
  filingDate: string;
  quarter: string;
  aum: string;
  aumRaw?: number;
  mandate: string;
  doc_url: string;
  holdings_status?: string;
  filings: SecFilingItem[];
  topHoldings: Holding13F[];
  sectorAllocation: SectorAlloc[];
  quarterFlows: {
    newPositionsCount: number;
    increasedCount: number;
    decreasedCount: number;
    soldOutCount: number;
    totalPositions: number;
  };
  holdingsError?: string;
  thesis?: string;
  holdingsAsOf?: string;
  holdingsAccession?: string;
  holdingsFiledOn?: string;
  holdingsSourceUrl?: string;
  totalValueUsd?: number;
}

export interface ConsensusHolding {
  symbol: string;
  name: string;
  fundCount: number;
  totalValueMillions: number;
  avgPortfolioWeight: number;
  overallSentiment: string;
  sector: string;
  topHolders: string[];
  cusip?: string;
}

export interface SecFeedData {
  status: "success" | "stale" | "error";
  updated_at: string;
  source: string;
  stale: boolean;
  totalFundsTracked: number;
  quarterCycle: string;
  funds: SecFundData[];
  consensusHoldings: ConsensusHolding[];
  macroSummary: string;
}

export class SecIntelService {
  public static TRACKED_CIKS = [
    { id: "situational_awareness", name: "Situational Awareness LP", cik: "0002045724", manager: "Leopold Aschenbrenner" },
    { id: "appaloosa", name: "Appaloosa LP", cik: "0001656456", manager: "David Tepper" },
    { id: "thirdpoint", name: "Third Point LLC", cik: "0001040273", manager: "Daniel Loeb" },
    { id: "bridgewater", name: "Bridgewater Associates, LP", cik: "0001350694", manager: "Ray Dalio" },
    { id: "point72", name: "Point72 Asset Management, L.P.", cik: "0001603466", manager: "Steve Cohen" },
    { id: "berkshire", name: "Berkshire Hathaway Inc.", cik: "0001067983", manager: "Warren Buffett" },
    { id: "ark", name: "ARK Investment Management LLC", cik: "0001697748", manager: "Cathie Wood" },
    { id: "duquesne", name: "Duquesne Family Office LLC", cik: "0001536411", manager: "Stanley Druckenmiller" },
    { id: "scion", name: "Scion Asset Management LLC", cik: "0001649339", manager: "Michael Burry" },
    { id: "pershing", name: "Pershing Square Capital Management", cik: "0001336528", manager: "Bill Ackman" },
    { id: "citadel", name: "Citadel Advisors LLC", cik: "0001423053", manager: "Ken Griffin" },
    { id: "millennium", name: "Millennium Management LLC", cik: "0001273087", manager: "Israel Englander" },
    { id: "tiger", name: "Tiger Global Management LLC", cik: "0001167483", manager: "Chase Coleman" }
  ];

  private static cache: { data: SecFeedData; timestamp: number } | null = null;
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  public static getDataDir(): string {
    return process.env.SB_DATA_DIR || path.join(process.cwd(), 'server', 'data');
  }

  public static getTargetFiles(): string[] {
    return [
      path.join(SecIntelService.getDataDir(), "sec_intel_data.json")
    ];
  }

  /**
   * Load baseline or persisted SEC data from disk
   */
  public static loadPersistedData(): SecFeedData | null {
    for (const filePath of SecIntelService.getTargetFiles()) {
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(content);
          if (json && Array.isArray(json.funds) && json.funds.length > 0) {
            const updatedAt = json.updated_at || new Date().toISOString();
            const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
            const isStale = ageSeconds > 86400; // 24 hours

            const loadedFunds = json.funds.map((f: any) => {
              const hasAccession = !!f.holdingsAccession;
              return {
                ...f,
                fund_name: f.fund_name || f.fundName,
                fundName: f.fundName || f.fund_name,
                filing_date: f.filing_date || f.filingDate || "2026-08-14",
                filingDate: f.filingDate || f.filing_date || "2026-08-14",
                topHoldings: hasAccession ? (f.topHoldings || []) : []
              };
            });

            const derived = SecIntelService.computeConsensusAndSummary(loadedFunds);

            return {
              status: isStale ? "stale" : "success",
              updated_at: updatedAt,
              source: json.source || "Preserved SEC Intel Cache",
              stale: isStale,
              totalFundsTracked: loadedFunds.length,
              quarterCycle: json.quarterCycle || "Q1/Q2 2026 SEC Form 13F Filings",
              funds: loadedFunds,
              consensusHoldings: derived.consensusHoldings,
              macroSummary: derived.macroSummary
            };
          }
        } catch (e) {
          console.error(`Failed to load persisted SEC data from ${filePath}:`, e);
        }
      }
    }
    return null;
  }

  /**
   * Fetch live SEC EDGAR submissions for tracked CIKs
   */
  public static async fetchLiveSecData(forceRefresh = false): Promise<SecFeedData> {
    const now = Date.now();
    if (!forceRefresh && SecIntelService.cache && (now - SecIntelService.cache.timestamp < SecIntelService.CACHE_TTL_MS)) {
      return SecIntelService.cache.data;
    }

    try {
      const holdingsResults = await runWithLimit(
        SecIntelService.TRACKED_CIKS,
        3,
        async (item) => {
          const res = await getHoldings(item.cik, item.id);
          return { item, res };
        }
      );

      const defaultFunds = SecIntelService.getDefaultFunds();
      const baseFundsMap = new Map<string, any>();
      for (const fund of defaultFunds) {
        if (fund && fund.id) {
          baseFundsMap.set(fund.id, fund);
        }
      }
      const baseFunds = Array.from(baseFundsMap.values());

      const mergedFunds: SecFundData[] = baseFunds.map((fund: any) => {
        const itemResult = holdingsResults.find(r => r.item.id === fund.id);
        const hold = itemResult?.res;
        if (hold && hold.ok === true && Array.isArray(hold.topHoldings) && hold.topHoldings.length > 0) {
          return {
            ...fund,
            filing_date: hold.holdingsFiledOn,
            filingDate: hold.holdingsFiledOn,
            quarter: `13F-HR period ending ${hold.holdingsAsOf}`,
            holdings_status: 'parsed_13f_information_table',
            holdingsAccession: hold.holdingsAccession,
            holdingsFiledOn: hold.holdingsFiledOn,
            holdingsAsOf: hold.holdingsAsOf,
            holdingsSourceUrl: hold.holdingsSourceUrl,
            totalValueUsd: hold.totalValueUsd,
            topHoldings: hold.topHoldings,
            filings: hold.filings || []
          };
        } else {
          const errReason = hold ? (hold.reason || 'parse_zero_equity_rows') : 'no_13f_hr';
          return {
            ...fund,
            topHoldings: [],
            holdings_status: 'metadata_only',
            holdingsError: errReason
          };
        }
      });

      const derived = SecIntelService.computeConsensusAndSummary(mergedFunds);

      const nowIso = new Date().toISOString();
      const dataset: SecFeedData = {
        status: "success",
        updated_at: nowIso,
        source: 'SEC EDGAR Form 13F-HR information tables',
        dataNote: "Positions as of each fund's latest 13F-HR period end; not real-time.",
        parsedFunds: derived.parsedCount,
        stale: false,
        totalFundsTracked: mergedFunds.length,
        quarterCycle: "Q1/Q2 2026 SEC Form 13F Filings",
        funds: mergedFunds,
        consensusHoldings: derived.consensusHoldings,
        macroSummary: derived.macroSummary
      } as any;

      if (mergedFunds.length >= SecIntelService.TRACKED_CIKS.length) {
        for (const filePath of SecIntelService.getTargetFiles()) {
          try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf-8');
          } catch (e) {
            // ignore disk write errors
          }
        }
      }

      SecIntelService.cache = {
        data: dataset,
        timestamp: Date.now()
      };

      return dataset;
    } catch (e) {
      console.error("[SecIntelService] Live fetch failed, falling back to persisted dataset:", e);
      const fallback = SecIntelService.loadPersistedData();
      if (fallback) return fallback;

      const nowIso = new Date().toISOString();
      const fallbackFunds = SecIntelService.getDefaultFunds();
      const derived = SecIntelService.computeConsensusAndSummary(fallbackFunds);
      return {
        status: "stale",
        updated_at: nowIso,
        source: "In-Memory Baseline Fallback",
        stale: true,
        totalFundsTracked: fallbackFunds.length,
        quarterCycle: "Q1/Q2 2026 SEC Form 13F Filings",
        funds: fallbackFunds,
        consensusHoldings: derived.consensusHoldings,
        macroSummary: derived.macroSummary
      };
    }
  }

  public static computeConsensusAndSummary(funds: SecFundData[]): { consensusHoldings: ConsensusHolding[]; macroSummary: string; parsedCount: number } {
    const parsedFunds = funds.filter(f => f.holdings_status === 'parsed_13f_information_table' && Array.isArray(f.topHoldings) && f.topHoldings.length > 0);
    const parsedCount = parsedFunds.length;
    
    const cusipMap = new Map<string, { symbol: string | null; name: string; cusip: string; fundNames: Set<string>; totalValueUsd: number }>();
    
    for (const fund of parsedFunds) {
      const topHoldings = fund.topHoldings || [];
      for (const holding of topHoldings) {
        if (!holding.cusip) continue;
        const key = holding.cusip.toUpperCase();
        if (!cusipMap.has(key)) {
          cusipMap.set(key, {
            symbol: holding.symbol,
            name: holding.name,
            cusip: holding.cusip,
            fundNames: new Set(),
            totalValueUsd: 0
          });
        }
        const entry = cusipMap.get(key)!;
        entry.fundNames.add(fund.fundName || fund.fund_name);
        entry.totalValueUsd += holding.valueUsd || 0;
      }
    }
    
    const consensusHoldings: any[] = [];
    for (const entry of cusipMap.values()) {
      if (entry.fundNames.size >= 2) {
        consensusHoldings.push({
          symbol: entry.symbol || null,
          name: entry.name,
          cusip: entry.cusip,
          fundCount: entry.fundNames.size,
          totalValueUsd: entry.totalValueUsd,
          topHolders: Array.from(entry.fundNames)
        });
      }
    }
    
    consensusHoldings.sort((a, b) => {
      if (b.fundCount !== a.fundCount) {
        return b.fundCount - a.fundCount;
      }
      return b.totalValueUsd - a.totalValueUsd;
    });
    
    const top10Consensus = consensusHoldings.slice(0, 10);
    
    let macroSummary = '13F holdings unavailable.';
    if (parsedCount > 0) {
      const periods = parsedFunds
        .map(f => f.holdingsAsOf)
        .filter(Boolean)
        .sort();
      const minPeriod = periods[0] || 'unknown';
      const maxPeriod = periods[periods.length - 1] || 'unknown';
      macroSummary = `Holdings parsed from SEC 13F-HR information tables for ${parsedCount} of 13 funds; periods ending ${minPeriod} to ${maxPeriod}.`;
    }
    
    return {
      consensusHoldings: top10Consensus,
      macroSummary,
      parsedCount
    };
  }

  public static getDefaultFunds(): SecFundData[] {
    return [
      { id: "situational_awareness", fund_name: "Situational Awareness LP", fundName: "Situational Awareness LP", cik: "0002045724", manager: "Leopold Aschenbrenner", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0002045724", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "appaloosa", fund_name: "Appaloosa LP", fundName: "Appaloosa LP", cik: "0001656456", manager: "David Tepper", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001656456", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "thirdpoint", fund_name: "Third Point LLC", fundName: "Third Point LLC", cik: "0001040273", manager: "Dan Loeb", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001040273", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "bridgewater", fund_name: "Bridgewater Associates, LP", fundName: "Bridgewater Associates, LP", cik: "0001350694", manager: "Ray Dalio", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001350694", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "point72", fund_name: "Point72 Asset Management, L.P.", fundName: "Point72 Asset Management, L.P.", cik: "0001603466", manager: "Steve Cohen", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001603466", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "berkshire", fund_name: "Berkshire Hathaway Inc.", fundName: "Berkshire Hathaway Inc.", cik: "0001067983", manager: "Warren Buffett", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001067983", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "ark", fund_name: "ARK Investment Management LLC", fundName: "ARK Investment Management LLC", cik: "0001697748", manager: "Cathie Wood", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001697748", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "duquesne", fund_name: "Duquesne Family Office LLC", fundName: "Duquesne Family Office LLC", cik: "0001536411", manager: "Stanley Druckenmiller", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001536411", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "scion", fund_name: "Scion Asset Management LLC", fundName: "Scion Asset Management LLC", cik: "0001649339", manager: "Michael Burry", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001649339", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "pershing", fund_name: "Pershing Square Capital Management", fundName: "Pershing Square Capital Management", cik: "0001336528", manager: "Bill Ackman", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001336528", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "citadel", fund_name: "Citadel Advisors LLC", fundName: "Citadel Advisors LLC", cik: "0001423053", manager: "Ken Griffin", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001423053", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "millennium", fund_name: "Millennium Management LLC", fundName: "Millennium Management LLC", cik: "0001273087", manager: "Israel Englander", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001273087", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } },
      { id: "tiger", fund_name: "Tiger Global Management LLC", fundName: "Tiger Global Management LLC", cik: "0001167483", manager: "Chase Coleman", doc_url: "https://www.sec.gov/edgar/browse/?CIK=0001167483", holdings_status: 'metadata_only', topHoldings: [], filings: [], sectorAllocation: [], quarterFlows: { newPositionsCount: 0, increasedCount: 0, decreasedCount: 0, soldOutCount: 0, totalPositions: 0 } }
    ] as any[];
  }
}
