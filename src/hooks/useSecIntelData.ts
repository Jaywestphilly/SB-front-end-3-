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
  const [dataSource, setDataSource] = useState<string>("SEC EDGAR 13F (preview)");

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        setLoading(true);
        setIsPaywall(false);
        setIsConfigError(false);
        setError(null);

        const apiResult = await fetchWithPaywallHandling("/api/13f/filings");
        if (apiResult.ok && apiResult.data) {
          const apiJson = apiResult.data;
          if (apiJson && apiJson.funds) {
            const fetchedData: SecIntelData = {
              updated_at: apiJson.timestamp || apiJson.updated_at || new Date().toISOString(),
              funds: (apiJson.funds || []).map((f: any) => ({
                fund_name: f.fundName || f.fund_name || 'Hedge Fund',
                manager: f.manager || 'Manager',
                cik: f.cik || '0000000000',
                filings: (f.topHoldings || []).map((h: any) => ({
                  form_type: "13F-HR",
                  filing_date: f.filingDate || "2026-05-15",
                  description: `${h.changeType || 'HOLD'} ${h.symbol || ''} (${h.name || h.symbol || ''})`,
                  doc_url: f.doc_url || `https://www.sec.gov/edgar/browse/?CIK=${f.cik}`
                }))
              }))
            };
            setData(fetchedData);
            const rawTime = fetchedData.updated_at || new Date().toISOString();
            setUpdatedAtFormatted(formatUtcTimestamp(rawTime));
            setIsStale(isDataStale(rawTime));
            setDataSource("SEC EDGAR 13F (preview)");
          }
        } else if (apiResult.isPaywall) {
          setIsPaywall(true);
        } else if (apiResult.isConfigError) {
          setIsConfigError(true);
        } else {
          setError(apiResult.error || "Failed to fetch SEC Intel data");
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

