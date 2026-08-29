import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Database,
  ExternalLink,
  ShieldCheck,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
  Landmark
} from "lucide-react";

export interface DataProvenanceItem {
  metricName: string;
  source: string;
  sourceType: "SEC Filing" | "Regulatory Agency" | "Central Bank / Fed" | "Physics Constant" | "Industry Benchmark" | "Market Exchange";
  asOfDate: string;
  updateFrequency: "Real-time" | "Daily" | "Monthly" | "Quarterly" | "Annual" | "Permanent Physics";
  details?: string;
  citationUrl?: string;
}

interface DataProvenanceCardProps {
  title?: string;
  category: string;
  lastUpdated?: string;
  sources: DataProvenanceItem[];
  defaultExpanded?: boolean;
}

export const DataProvenanceCard: React.FC<DataProvenanceCardProps> = ({
  title = "Data Provenance, Methodology & Source Attribution",
  category,
  lastUpdated = "August 2026 (Live Calculation)",
  sources,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/80 border border-white/10 text-xs text-neutral-300 space-y-3">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight">{title}</h4>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">
                {category}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-neutral-500" />
              <span>Vintage / As-of: <strong>{lastUpdated}</strong></span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-400">Primary regulatory & empirical data sources</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Collapse Sources</span>
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            </>
          ) : (
            <>
              <span>View Data Sources ({sources.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </>
          )}
        </button>
      </div>

      {/* Summary Chips (Visible Always) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
        <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">Key Data Feeds:</span>
        {sources.slice(0, 3).map((s, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded bg-neutral-900 border border-white/5 text-[10px] text-neutral-300 font-medium"
          >
            <strong className="text-white">{s.metricName}:</strong> {s.source} ({s.asOfDate})
          </span>
        ))}
        {sources.length > 3 && !isExpanded && (
          <span className="text-[10px] text-neutral-500 font-mono">
            +{sources.length - 3} more sources...
          </span>
        )}
      </div>

      {/* Expanded Details Table */}
      {isExpanded && (
        <div className="pt-2 space-y-2 border-t border-white/10 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sources.map((source, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-neutral-900/90 border border-white/5 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[12px]">{source.metricName}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      source.sourceType === "SEC Filing"
                        ? "bg-purple-950/80 text-purple-300 border border-purple-500/30"
                        : source.sourceType === "Regulatory Agency"
                        ? "bg-blue-950/80 text-blue-300 border border-blue-500/30"
                        : source.sourceType === "Central Bank / Fed"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                        : source.sourceType === "Physics Constant"
                        ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/30"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {source.sourceType}
                  </span>
                </div>

                <div className="space-y-0.5 text-[11px] text-neutral-300">
                  <p>
                    <strong className="text-neutral-400">Primary Authority:</strong> {source.source}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>As-Of Date: <strong className="text-white">{source.asOfDate}</strong></span>
                    <span>Frequency: <strong className="text-neutral-300">{source.updateFrequency}</strong></span>
                  </div>
                  {source.details && (
                    <p className="text-[10px] text-neutral-400 pt-0.5 leading-snug">
                      {source.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
