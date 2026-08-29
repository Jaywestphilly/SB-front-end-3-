import React, { useState } from "react";
import { REGULATORY_CAPTURE_DATA } from "../../data/market_trackers";
import { RegulatoryCaptureItem } from "../../types";
import {
  ShieldCheck,
  Sparkles,
  Building2,
  Landmark,
  Award,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";

export const RegulatoryCaptureTracker: React.FC = () => {
  const [selectedItem, setSelectedItem] =
    useState<RegulatoryCaptureItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/80 via-neutral-900 to-yellow-950/60 border border-amber-500/30 p-6 shadow-2xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5" />
              <span>Policy & Regulatory Moat Monitor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Regulatory Capture & Policy Moat Tracker
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
              Analyze how industry titans leverage government licensing, federal
              defense contracts, export controls, and regulatory barriers to
              build unassailable monopolies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
              <span className="block text-2xl font-black text-amber-400">
                9.5/10
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Avg Moat Score
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-center">
              <span className="block text-2xl font-black text-yellow-400">
                $15B+
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">
                Gov Backlog
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Regulatory Moat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REGULATORY_CAPTURE_DATA.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedItem(item)}
            className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-4 group shadow-xl hover:scale-[1.01]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                    {item.companyName}
                  </h3>
                  <span className="text-xs font-black font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                    ${item.symbol}
                  </span>
                </div>
                <span className="text-xs text-neutral-400 font-medium">
                  {item.moatType}
                </span>
              </div>

              {/* Moat Score Badge */}
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl text-amber-400 font-mono font-black text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{item.regulatoryMoatRating}/10</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            {/* Regulatory Agencies Tags */}
            <div className="flex flex-wrap gap-1.5">
              {item.regulatoryAgencies.map((agency, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold font-mono bg-neutral-950 px-2 py-0.5 rounded text-neutral-300 border border-neutral-800"
                >
                  {agency}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800/80">
              <span className="text-[11px] text-amber-300 font-extrabold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {item.lobbyingImpactScore}
              </span>

              <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px] group-hover:translate-x-1 transition-transform">
                Policy Dossier <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Detail View */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="w-full max-w-xl bg-neutral-950 border border-neutral-700 rounded-3xl p-6 shadow-2xl relative text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                Regulatory Moat & Policy Dossier
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white">
                  {selectedItem.companyName}
                </h3>
                <span className="text-sm font-black font-mono text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-500/30">
                  ${selectedItem.symbol}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Primary Mechanism: {selectedItem.moatType}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-neutral-400">
                Capture Dynamics & Regulatory Protection
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30">
              <h4 className="text-xs uppercase font-extrabold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Key Policy & Defense
                Developments
              </h4>
              <ul className="space-y-2 text-xs text-neutral-200">
                {selectedItem.keyPolicyDevelopments.map((dev, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{dev}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-center font-mono">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="block text-[10px] text-neutral-400 uppercase font-sans">
                  Regulatory Moat Score
                </span>
                <span className="font-extrabold text-amber-400 text-sm">
                  {selectedItem.regulatoryMoatRating} / 10
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="block text-[10px] text-neutral-400 uppercase font-sans">
                  Gov Contracts / Protection
                </span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {selectedItem.govContractValue ||
                    selectedItem.lobbyingImpactScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
