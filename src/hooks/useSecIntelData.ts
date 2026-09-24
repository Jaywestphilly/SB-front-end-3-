import { useState, useEffect } from 'react';
import { formatUtcTimestamp, isDataStale } from '../utils/timeUtils';
import { fetchWithPaywallHandling } from '../utils/apiClient';

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
  const [isPaywall, setIsPaywall] = useState<boolean>(false);
  const [isConfigError, setIsConfigError] = useState<boolean>(false);
  const [updatedAtFormatted, setUpdatedAtFormatted] = useState<string>("");
  const [isStale, setIsStale] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>("U.S. SEC EDGAR API");

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        setLoading(true);
        setIsPaywall(false);
        setIsConfigError(false);
        setError(null);

        // Try live backend first
        let fetchedData: SecIntelData | null = null;
        let sourceName = "U.S. SEC EDGAR API";

        try {
          const apiResult = await fetchWithPaywallHandling("/api/13f/filings");
          if (apiResult.ok && apiResult.data) {
            const apiJson = apiResult.data;
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
          } else if (apiResult.isPaywall) {
            setIsPaywall(true);
          } else if (apiResult.isConfigError) {
            setIsConfigError(true);
          }
        } catch {
          // Ignore and fallback to raw cdn
        }

        if (!fetchedData && !isPaywall) {
          const secResult = await fetchWithPaywallHandling<SecIntelData>("/api/data/sec");
          if (secResult.ok && secResult.data) {
            fetchedData = secResult.data;
            sourceName = "CDN Proxy / SEC Edgar";
          } else if (secResult.isPaywall) {
            setIsPaywall(true);
            setError(secResult.error || "Unlock live data with Quant Suite Pro — $5/mo");
          } else if (secResult.isConfigError) {
            setIsConfigError(true);
            setError("Data temporarily unavailable");
          } else {
            throw new Error(secResult.error || "Failed to fetch SEC Intel data");
          }
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

  return { data, loading, error, isPaywall, isConfigError, updatedAtFormatted, isStale, dataSource };
};

