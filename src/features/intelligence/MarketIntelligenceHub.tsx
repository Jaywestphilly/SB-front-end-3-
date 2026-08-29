import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Trophy,
  Rocket,
  Scale,
  Landmark,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  Briefcase,
  BookOpen,
  FolderDown,
} from "lucide-react";
import { EarningsCalendar } from "./EarningsCalendar";
import { FinancialRankings } from "./FinancialRankings";
import { IpoTracker } from "./IpoTracker";
import { MaTracker } from "./MaTracker";
import { RegulatoryCaptureTracker } from "./RegulatoryCaptureTracker";
import { HedgeFund13F } from "./HedgeFund13F";
import { Intel13FDashboard } from "./Intel13FDashboard";
import { InvestopediaTab } from "../education/InvestopediaTab";
import { ReportRepository } from "./ReportRepository";
import { MacroEconomicsBriefing } from "./MacroEconomicsBriefing";
import { WhaleConsensusMatrix } from "./WhaleConsensusMatrix";
import { InterconnectionQueueRadar } from "./InterconnectionQueueRadar";
import { StockTicker } from "../../types";

export type IntelligenceSubTab =
  | "interconnection_queue"
  | "report_repository"
  | "macro_briefing"
  | "whale_consensus"
  | "intel_13f_dashboard"
  | "investopedia"
  | "hedge_funds"
  | "earnings"
  | "rankings"
  | "ipos"
  | "ma"
  | "regulatory";

interface MarketIntelligenceHubProps {
  initialSubTab?: IntelligenceSubTab;
  onSubTabChange?: (tab: IntelligenceSubTab) => void;
  stocks?: StockTicker[];
  activeTicker?: StockTicker | null;
  onSelectStock?: (stock: StockTicker) => void;
}

export const MarketIntelligenceHub: React.FC<MarketIntelligenceHubProps> = ({
  initialSubTab = "interconnection_queue",
  onSubTabChange,
  stocks,
  activeTicker,
  onSelectStock,
}) => {
  const [activeSubTab, setActiveSubTab] =
    useState<IntelligenceSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeSubTab]);

  const handleSelectTab = (tab: IntelligenceSubTab) => {
    setActiveSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  const subTabs: {
    id: IntelligenceSubTab;
    label: string;
    icon: React.ElementType;
    badge: string;
    color: string;
  }[] = [
    {
      id: "interconnection_queue",
      label: "Power & ISO Queue Radar",
      icon: Zap,
      badge: "Live FERC / NRC",
      color: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
    },
    {
      id: "report_repository",
      label: "Report Repository",
      icon: FolderDown,
      badge: "PDF & Dossiers",
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
    },
    {
      id: "macro_briefing",
      label: "Macro Economics Briefing",
      icon: Landmark,
      badge: "Net Fed Reserves",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "whale_consensus",
      label: "Whale Consensus Matrix",
      icon: Sparkles,
      badge: "45D Drift",
      color: "from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30",
    },
    {
      id: "intel_13f_dashboard",
      label: "13F Intel Dashboard",
      icon: Briefcase,
      badge: "Live 13F API",
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
    },
    {
      id: "investopedia",
      label: "Free Game Matrix",
      icon: BookOpen,
      badge: "Quick Study",
      color:
        "from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30",
    },
    {
      id: "hedge_funds",
      label: "13F Hedge Funds",
      icon: Briefcase,
      badge: "Leopold 13F",
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
    },
    {
      id: "earnings",
      label: "Earnings Calendar",
      icon: Calendar,
      badge: "Q2/Q3 Live",
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
    },
    {
      id: "rankings",
      label: "Financial Leaderboards",
      icon: Trophy,
      badge: "Top 100",
      color:
        "from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30",
    },
    {
      id: "ipos",
      label: "IPO Pipeline",
      icon: Rocket,
      badge: "Upcoming",
      color:
        "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
    },
    {
      id: "ma",
      label: "M&A Deals",
      icon: Scale,
      badge: "Antitrust Risk",
      color:
        "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "regulatory",
      label: "Regulatory Capture",
      icon: Landmark,
      badge: "Lobbying Intel",
      color:
        "from-rose-500/20 to-orange-500/20 text-rose-300 border-rose-500/30",
    },
  ];

  return (
    <div className="w-full space-y-5 select-none pb-12">
      {/* Consolidated Master Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-indigo-950/60 to-neutral-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase flex items-center gap-2 animate-periodic-text-glitch">
                  Market Intelligence Hub
                </h1>
                <p className="text-xs font-tech text-neutral-400 uppercase tracking-wide">
                  Consolidated financial intelligence: Earnings, Leaderboards,
                  IPOs, M&A Deals & Regulatory Tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-neutral-300 text-xs font-mono flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>5 Core Data Streams</span>
            </div>
          </div>
        </div>

        {/* Consolidated Sub-Nav Pill Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-white/10">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]"
                    : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-black" : "text-cyan-400"}`}
                />
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? "bg-black/20 text-black font-black"
                      : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sub-Tab Content View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeSubTab === "interconnection_queue" && <InterconnectionQueueRadar />}
          {activeSubTab === "report_repository" && <ReportRepository />}
          {activeSubTab === "macro_briefing" && <MacroEconomicsBriefing />}
          {activeSubTab === "whale_consensus" && <WhaleConsensusMatrix />}
          {activeSubTab === "intel_13f_dashboard" && <Intel13FDashboard />}
          {activeSubTab === "investopedia" && (
            <InvestopediaTab stocks={stocks} initialTicker={activeTicker} />
          )}
          {activeSubTab === "hedge_funds" && <HedgeFund13F />}
          {activeSubTab === "earnings" && <EarningsCalendar />}
          {activeSubTab === "rankings" && <FinancialRankings />}
          {activeSubTab === "ipos" && <IpoTracker />}
          {activeSubTab === "ma" && <MaTracker />}
          {activeSubTab === "regulatory" && <RegulatoryCaptureTracker />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
