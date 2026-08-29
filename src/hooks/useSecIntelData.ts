import { useState, useEffect } from 'react';
import { formatUtcTimestamp, isDataStale } from '../utils/timeUtils';

export interface SecFiling {
  form_type: string;
  filing_date: string;
  description: string;
  doc_url: string;
}

export interface SecFund {
  fund_name: string;
  manager: string;
  cik: string;
  filings: SecFiling[];
}

export interface SecIntelData {
  updated_at: string;
  funds: SecFund[];
}

export const useSecIntelData = () => {
  const [data, setData] = useState<SecIntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAtFormatted, setUpdatedAtFormatted] = useState<string>("");
  const [isStale, setIsStale] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>("GitHub JSON");

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        setLoading(true);
        // Try live backend first
        let fetchedData: SecIntelData | null = null;
        let sourceName = "GitHub JSON";

        try {
          const apiRes = await fetch("/api/13f/filings");
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson && apiJson.funds) {
              fetchedData = {
                updated_at: apiJson.timestamp || apiJson.updated_at || new Date().toISOString(),
                funds: (apiJson.funds || []).map((f: any) => ({
                  fund_name: f.fundName || f.fund_name,
                  manager: f.manager,
                  cik: f.cik,
                  filings: (f.topHoldings || []).map((h: any) => ({
                    form_type: "13F-HR",
                    filing_date: f.filingDate || "2026-05-15",
                    description: `${h.changeType || 'HOLD'} ${h.symbol} (${h.name}): ${h.portfolioPercent}% portfolio weight. ${h.thesis || ''}`,
                    doc_url: `https://www.sec.gov/edgar/browse/?CIK=${f.cik}`
                  }))
                }))
              };
              sourceName = "Live SEC EDGAR API";
            }
          }
        } catch {
          // Ignore and fallback to raw github
        }

        if (!fetchedData) {
          const res = await fetch("/api/data/sec");
          if (!res.ok) throw new Error("Failed to fetch SEC Intel data");
          fetchedData = await res.json();
          sourceName = "CDN Proxy / SEC Edgar";
        }

        if (fetchedData) {
          setData(fetchedData);
          const rawTime = fetchedData.updated_at || new Date().toISOString();
          setUpdatedAtFormatted(formatUtcTimestamp(rawTime));
          setIsStale(isDataStale(rawTime));
          setDataSource(sourceName);
        }
      } catch (err: unknown) {
        setError((err as Error)?.message || "Failed to fetch SEC Intel data");
      } finally {
        setLoading(false);
      }
    };
    fetchIntel();
  }, []);

  return { data, loading, error, updatedAtFormatted, isStale, dataSource };
};
