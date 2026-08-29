import React, { useState } from "react";
import { MA_TRACKER_DATA } from "../../data/market_trackers";
import { MaTrackerItem } from "../../types";
import {
  Scale,
  Sparkles,
  Building,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

export const MaTracker: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [selectedDeal, setSelectedDeal] = useState<MaTrackerItem | null>(null);

  const filters = [
    "All",
    "Pending Regulatory Approval",
    "Under FTC/DOJ Review",
    "Completed",
  ];

  const filteredData =
    selectedFilter === "All"
      ? MA_TRACKER_DATA
      : MA_TRACKER_DATA.filter((item) => item.status === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/80 via-neutral-900 to-indigo-950/60 border border-purple-500/30 p-6 shadow-2xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Institutional Arbitrage Desk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mergers & Acquisitions (M&A) Tracker
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              Monitor multi-billion dollar mega-mergers, acquiring vs target
              assets, arbitrage spreads, regulatory agency reviews (FTC, DOJ,
              EU), and strategic synergies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
              <span className="block text-2xl font-black text-purple-400">
                {MA_TRACKER_DATA.length}
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Tracked Deals
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
              <span className="block text-2xl font-black text-emerald-400">
                $95B+
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Volume Value
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
                ? "bg-purple-500 text-neutral-950 shadow-lg shadow-purple-500/20"
                : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid of M&A Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((deal) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedDeal(deal)}
            className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-purple-500/40 transition-all cursor-pointer space-y-4 group shadow-xl hover:scale-[1.01]"
          >
            {/* Acquirer & Target Matchup */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 max-w-[45%]">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-purple-400">
                    Acquirer
                  </span>
                  <span className="text-sm font-black text-white truncate">
                    {deal.acquirerName}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-purple-300 block">
                    ${deal.acquirerSymbol}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0 px-2">
                <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                <span className="text-[9px] font-mono text-neutral-400">
                  {deal.dealType}
                </span>
              </div>

              <div className="flex items-center gap-2 max-w-[45%] text-right">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-cyan-400">
                    Target
                  </span>
                  <span className="text-sm font-black text-white truncate">
                    {deal.targetName}
                  </span>
                  {deal.targetSymbol && (
                    <span className="text-[10px] font-mono font-bold text-cyan-300 block">
                      ${deal.targetSymbol}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Deal Valuation & Status */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-sans block">
                  Deal Valuation
                </span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {deal.dealValue}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase font-sans block">
                  Status
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    deal.status === "Completed"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : deal.status === "Under FTC/DOJ Review"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                  }`}
                >
                  {deal.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              {deal.strategicRationale}
            </p>

            {/* Regulatory & Arbitrage Spread */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800/80 font-mono">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                Agencies: {deal.regulatoryBodies.slice(0, 2).join(", ")}
              </span>

              {deal.arbitrageSpreadPercent !== undefined &&
                deal.arbitrageSpreadPercent > 0 && (
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                    Spread: +{deal.arbitrageSpreadPercent}%
                  </span>
                )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Detail View */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="w-full max-w-xl bg-neutral-950 border border-neutral-700 rounded-3xl p-6 shadow-2xl relative text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDeal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                M&A Arbitrage Intelligence
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-purple-300">
                  {selectedDeal.acquirerName} (${selectedDeal.acquirerSymbol})
                </span>
                <span className="text-neutral-400">Acquiring</span>
                <span className="text-cyan-300">{selectedDeal.targetName}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-neutral-800 pt-2">
                <span>
                  Deal Structure:{" "}
                  <strong className="text-white">
                    {selectedDeal.dealType}
                  </strong>
                </span>
                <span>
                  Valuation:{" "}
                  <strong className="text-emerald-400">
                    {selectedDeal.dealValue}
                  </strong>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Strategic Rationale & Synergies
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                {selectedDeal.strategicRationale}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-sans">
                  Antitrust Risk Level
                </span>
                <span
                  className={`block font-extrabold text-sm ${
                    selectedDeal.antitrustRiskLevel === "High"
                      ? "text-rose-400"
                      : selectedDeal.antitrustRiskLevel === "Moderate"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {selectedDeal.antitrustRiskLevel} Antitrust Risk
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-400 uppercase font-sans">
                  Arbitrage Spread
                </span>
                <span className="block font-extrabold text-sm text-emerald-400 font-mono">
                  {selectedDeal.arbitrageSpreadPercent
                    ? `+${selectedDeal.arbitrageSpreadPercent}% Yield`
                    : "Merged"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">
                Regulatory Reviewing Agencies
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedDeal.regulatoryBodies.map((agency, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-neutral-900 px-3 py-1 rounded-xl border border-neutral-800 text-neutral-200"
                  >
                    {agency}
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
