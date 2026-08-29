import React, { useState } from "react";
import { IPO_TRACKER_DATA } from "../../data/market_trackers";
import { IpoTrackerItem } from "../../types";
import {
  Rocket,
  Sparkles,
  Building2,
  TrendingUp,
  ShieldAlert,
  FileText,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";

export const IpoTracker: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [selectedIpo, setSelectedIpo] = useState<IpoTrackerItem | null>(null);

  const filters = ["All", "Filed S-1", "Rumored", "Expected Q3/Q4", "Priced"];

  const filteredData =
    selectedFilter === "All"
      ? IPO_TRACKER_DATA
      : IPO_TRACKER_DATA.filter((item) => item.status === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-950/80 via-neutral-900 to-emerald-950/60 border border-cyan-500/30 p-6 shadow-2xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Rocket className="w-3.5 h-3.5" />
              <span>Stock Bloc Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              & Tech IPO Tracker
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              Track S-1 SEC filings, pre IPO valuations, lead underwriters, and
              strategic market signals for high-demand infrastructure, cloud,
              and fintech leaders.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
              <span className="block text-2xl font-black text-cyan-400">
                {IPO_TRACKER_DATA.length}
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Tracked Deals
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
              <span className="block text-2xl font-black text-emerald-400">
                $350B+
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Pipeline Value
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === f
                ? "bg-cyan-500 text-neutral-950 shadow-lg shadow-cyan-500/20"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid of IPO Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((ipo) => (
          <motion.div
            key={ipo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedIpo(ipo)}
            className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-4 group shadow-xl hover:scale-[1.01]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                    {ipo.companyName}
                  </h3>
                  <span className="text-xs font-extrabold font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    ${ipo.symbolPlaceholder}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-medium">
                  {ipo.sector}
                </span>
              </div>

              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  ipo.status === "Filed S-1"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : ipo.status === "Priced"
                      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                      : ipo.status === "Rumored"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                }`}
              >
                {ipo.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs font-mono">
              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-sans">
                  Valuation
                </span>
                <span className="font-extrabold text-white text-sm">
                  {ipo.expectedValuation}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-sans">
                  Timeline
                </span>
                <span className="font-extrabold text-neutral-200">
                  {ipo.filingDate}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              {ipo.description}
            </p>

            {/* Key Metrics Chips */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-800/80">
              {ipo.keyMetrics.map((m, idx) => (
                <div
                  key={idx}
                  className="text-[10px] bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 flex items-center gap-1.5"
                >
                  <span className="text-neutral-400">{m.label}:</span>
                  <span className="font-bold text-cyan-300">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Underwriters: {ipo.leadUnderwriters.slice(0, 2).join(", ")}
              </span>

              <span className="text-cyan-400 font-bold flex items-center gap-1 text-[11px] group-hover:translate-x-1 transition-transform">
                View Intelligence <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Detail View */}
      {selectedIpo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="w-full max-w-xl bg-neutral-950 border border-neutral-700 rounded-3xl p-6 shadow-2xl relative text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedIpo(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider">
                IPO Intelligence Dossier
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white">
                  {selectedIpo.companyName}
                </h3>
                <span className="text-sm font-black font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  ${selectedIpo.symbolPlaceholder}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                {selectedIpo.sector} • {selectedIpo.status}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-neutral-400">
                Overview & Business Model
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed">
                {selectedIpo.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Stock Bloc Strategic Take
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                {selectedIpo.strategicRationale}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="block text-[10px] text-neutral-400 uppercase">
                  Valuation
                </span>
                <span className="font-extrabold text-cyan-300">
                  {selectedIpo.expectedValuation}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="block text-[10px] text-neutral-400 uppercase">
                  Filing Date
                </span>
                <span className="font-extrabold text-white">
                  {selectedIpo.filingDate}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="block text-[10px] text-neutral-400 uppercase">
                  SB Rating
                </span>
                <span className="font-extrabold text-emerald-400">
                  {selectedIpo.signal}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">
                Lead Underwriters
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedIpo.leadUnderwriters.map((u, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-neutral-900 px-3 py-1 rounded-xl border border-neutral-800 text-neutral-200"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
