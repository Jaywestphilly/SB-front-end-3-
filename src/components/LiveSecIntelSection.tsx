import React from 'react';
import { useSecIntelData } from "../hooks/useSecIntelData";
import { ExternalLink, Database, Loader, Briefcase, FileText } from 'lucide-react';

export const LiveSecIntelSection: React.FC = () => {
  const { data, loading, error, updatedAtFormatted, isStale, dataSource } = useSecIntelData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-cyan-400 space-y-4">
        <Loader className="w-10 h-10 animate-spin" />
        <div className="text-xs uppercase font-black tracking-widest animate-pulse">Initializing Cyber-Terminal SEC Uplink...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 alien-block-cut bg-rose-950/40 border border-rose-500/50 text-rose-400 font-mono text-xs text-center">
        Error establishing SEC uplink: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cyan-400/80 font-mono uppercase tracking-widest bg-black/40 p-3 alien-block-cut border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Source: {dataSource}</span>
          <span className="text-neutral-500">•</span>
          <span>Last updated: {updatedAtFormatted || data.updated_at}</span>
        </div>

        <div className="flex items-center gap-2">
          {isStale ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              STALE DATA (&gt;24H)
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
              SEC EDGAR LIVE
            </span>
          )}
        </div>
      </div>
      
      {data.funds.map((fund, idx) => (
        <div key={idx} className="p-5 alien-block-cut bg-black/60 border border-cyan-500/30">
          <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">{fund.fund_name}</h3>
              <p className="text-xs text-cyan-400/80 font-mono mt-1">Manager: {fund.manager} | CIK: {fund.cik}</p>
            </div>
            <div className="p-2 alien-block-cut-sm bg-cyan-900/40 text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-cyan-300 tracking-wider">Recent Filings & Disclosures</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fund.filings.map((filing, fIdx) => (
                <div key={fIdx} className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm flex flex-col justify-between space-y-3 hover:bg-cyan-950/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase">{filing.form_type}</span>
                      <span className="text-[10px] text-cyan-400/70 font-mono">{filing.filing_date}</span>
                    </div>
                    <p className="text-xs text-white font-bold mt-2">{filing.description}</p>
                  </div>
                  
                  <button
                    onClick={() => window.open(filing.doc_url, "_blank")}
                    className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-400 hover:text-black text-cyan-300 border border-cyan-500/30 font-black text-[10px] flex items-center justify-center gap-1.5 alien-block-cut-sm transition-all uppercase"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View SEC Report
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
