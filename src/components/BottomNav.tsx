import React, { useState } from "react";
import { ViewTab } from "../types";
import {
  TrendingUp,
  Cpu,
  Building2,
  ShieldCheck,
  GraduationCap,
  Layers,
  Orbit,
  ShieldAlert,
  BookOpen,
  Sparkles,
  ShoppingBag,
  UserCheck,
  ArrowRight,
  X,
  ChevronRight,
  Home,
  Briefcase,
  Radio,
  FileText,
  Terminal,
  Globe,
  BarChart3,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface BottomNavProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenTerminal?: () => void;
  isTerminalOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTerminal,
  isTerminalOpen = false,
}) => {
  const [activeSheet, setActiveSheet] = useState<
    "markets" | "ai" | "education" | null
  >(null);

  const handleOpenSheet = (sheet: "markets" | "ai" | "education") => {
    triggerHaptic("selection");
    setActiveSheet((prev) => (prev === sheet ? null : sheet));
  };

  const handleNavigate = (tab: ViewTab) => {
    triggerHaptic("medium");
    setActiveSheet(null);
    onSelectTab(tab);
  };

  const isMarketsActive =
    !isTerminalOpen &&
    ["watchlist", "brand", "macro", "intelligence"].includes(activeTab);
  const isAiActive =
    !isTerminalOpen &&
    ["dyson_swarm", "war_gov_ufo", "ai_insights", "ai_revolution", "satellite_map"].includes(activeTab);
  const isRealEstateActive = !isTerminalOpen && activeTab === "real_estate";
  const isCreditActive = !isTerminalOpen && activeTab === "credit";
  const isEducationActive =
    !isTerminalOpen &&
    ["investopedia", "small_business", "youtube", "terminal_guide", "mit_courses"].includes(activeTab);

  return (
    <>
      {/* 5 Core Streamlined Floating Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-[98%] max-w-xl font-mono select-none"
      >
        <div className="bg-[#020b14]/95 backdrop-blur-2xl border-2 border-cyan-500/50 alien-block-cut p-1.5 shadow-2xl shadow-cyan-500/20 grid grid-cols-6 gap-1 relative">
          {/* Corner Ticks */}
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* TAB 1: YOUTUBE & INTEL FEED (FIRST TAB) */}
          <button
            onClick={() => handleNavigate("news")}
            className={`min-h-[48px] py-1.5 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer w-full focus-visible:outline-none ${
              !isTerminalOpen && activeTab === "news"
                ? "bg-cyan-400 text-black font-black shadow-lg shadow-cyan-400/40 border border-cyan-200"
                : "text-cyan-300/80 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/20"
            }`}
          >
            <div className="flex items-center justify-center">
              <Globe className="w-4 h-4 shrink-0 text-cyan-400" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
              INTEL
            </span>
          </button>

          {/* TAB 2: MARKETS */}
          <button
            onClick={() => handleOpenSheet("markets")}
            className={`min-h-[48px] py-1.5 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer w-full focus-visible:outline-none ${
              isMarketsActive || activeSheet === "markets"
                ? "bg-cyan-400 text-black font-black shadow-lg shadow-cyan-400/40 border border-cyan-200"
                : "text-cyan-300/80 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/20"
            }`}
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
              MARKETS
            </span>
          </button>

          {/* TAB 3: AI */}
          <button
            onClick={() => handleOpenSheet("ai")}
            className={`min-h-[48px] py-1.5 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer w-full focus-visible:outline-none ${
              isAiActive || activeSheet === "ai"
                ? "bg-purple-400 text-black font-black shadow-lg shadow-purple-400/40 border border-purple-200"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40 border border-purple-500/20"
            }`}
          >
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
              AI
            </span>
          </button>

          {/* TAB 4: REAL ESTATE */}
          <button
            onClick={() => handleNavigate("real_estate")}
            className={`min-h-[48px] py-1 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer w-full focus-visible:outline-none ${
              isRealEstateActive
                ? "bg-amber-400 text-black font-black shadow-lg shadow-amber-400/40 border border-amber-200"
                : "text-amber-300/80 hover:text-white hover:bg-amber-950/40 border border-amber-500/20"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-center leading-[1.05] flex flex-col items-center">
              <span>REAL</span>
              <span>ESTATE</span>
            </span>
          </button>

          {/* TAB 5: CREDIT */}
          <button
            onClick={() => handleNavigate("credit")}
            className={`min-h-[48px] py-1.5 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer w-full focus-visible:outline-none ${
              isCreditActive
                ? "bg-emerald-400 text-black font-black shadow-lg shadow-emerald-400/40 border border-emerald-200"
                : "text-emerald-300/80 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/20"
            }`}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
              CREDIT
            </span>
          </button>

          {/* TAB 6: EDUCATION */}
          <button
            onClick={() => handleOpenSheet("education")}
            className={`min-h-[48px] py-1.5 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer w-full focus-visible:outline-none ${
              isEducationActive || activeSheet === "education"
                ? "bg-rose-400 text-black font-black shadow-lg shadow-rose-400/40 border border-rose-200"
                : "text-rose-300/80 hover:text-white hover:bg-rose-950/40 border border-rose-500/20"
            }`}
          >
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap leading-none">
              EDUCATION
            </span>
          </button>
        </div>
      </nav>

      {/* MARKETS CATEGORY BOTTOM SHEET */}
      {activeSheet === "markets" && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-2 sm:p-4 font-mono"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full max-w-lg bg-[#020b14] border-2 border-cyan-500/60 rounded-t-2xl alien-block-cut p-4 sm:p-6 shadow-2xl shadow-cyan-500/30 space-y-4 relative text-cyan-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                  MARKETS CATEGORY
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1.5 bg-neutral-900 border border-cyan-500/40 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate("watchlist")}
                className="p-3.5 bg-neutral-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                    Live Watchlist Workstation
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-cyan-300/70 mt-0.5">
                    Live stock quotes, heatmap visualizer & technical screeners.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("intelligence")}
                className="p-3.5 bg-neutral-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                    13F Hedge Fund Intel
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-cyan-300/70 mt-0.5">
                    Institutional SEC filings, whale portfolio tracking & Senate trades.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("macro")}
                className="p-3.5 bg-neutral-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                    Macro Economic Briefings
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-cyan-300/70 mt-0.5">
                    Fed rates, treasury yield curves & global liquidity trackers.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("brand")}
                className="p-3.5 bg-neutral-900/90 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 flex items-center justify-between">
                    Stock Bloc Brand Landing
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-cyan-300/70 mt-0.5">
                    Platform philosophy, architecture overview & core mission.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI CATEGORY BOTTOM SHEET */}
      {activeSheet === "ai" && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-2 sm:p-4 font-mono"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full max-w-lg bg-[#020b14] border-2 border-purple-500/60 rounded-t-2xl alien-block-cut p-4 sm:p-6 shadow-2xl shadow-purple-500/30 space-y-4 relative text-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                  AI & TECH CATEGORY
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1.5 bg-neutral-900 border border-purple-500/40 rounded-lg text-purple-400 hover:text-white hover:bg-purple-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate("ai_revolution")}
                className="p-3.5 bg-neutral-900/90 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-300 flex items-center justify-between">
                    AI Infra & MS Value Chain
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </h4>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Morgan Stanley Heatmap, Power Generation, Data Centers & Chips.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("dyson_swarm")}
                className="p-3.5 bg-neutral-900/90 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                  <Orbit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 flex items-center justify-between">
                    Dyson Swarm & Compute
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </h4>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">
                    SpaceX orbital launches, space telemetry & energy Megawatt grids.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("war_gov_ufo")}
                className="p-3.5 bg-neutral-900/90 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 flex items-center justify-between">
                    Defense Tech & Aerospace
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </h4>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">
                    Autonomous defense systems, government procurement & aerospace moats.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("agents")}
                className="p-3.5 bg-neutral-900/90 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 flex items-center justify-between">
                    AI Agent Directory
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </h4>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">
                    Discover independently created AI agents analyzing the market.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("developers")}
                className="p-3.5 bg-neutral-900/90 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 flex items-center justify-between">
                    Developer Portal
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </h4>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">
                    Register external AI agents and provision API keys for the matrix.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDUCATION CATEGORY BOTTOM SHEET */}
      {activeSheet === "education" && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-2 sm:p-4 font-mono"
          onClick={() => setActiveSheet(null)}
        >
          <div
            className="w-full max-w-lg bg-[#020b14] border-2 border-rose-500/60 rounded-t-2xl alien-block-cut p-4 sm:p-6 shadow-2xl shadow-rose-500/30 space-y-4 relative text-rose-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                  EDUCATION CATEGORY
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1.5 bg-neutral-900 border border-rose-500/40 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate("mit_courses")}
                className="p-3.5 bg-neutral-900/90 border border-purple-500/50 hover:border-purple-400 hover:bg-purple-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                  <GraduationCap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-purple-300 flex items-center justify-between">
                    MIT & University Courses
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </h4>
                  <p className="text-[11px] text-purple-300/80 mt-0.5">
                    Free official lectures & playlists from MIT OpenCourseWare, Yale, and Stanford.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("terminal_guide")}
                className="p-3.5 bg-neutral-900/90 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
                  <Terminal className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-300 flex items-center justify-between">
                    Terminal Guide & Manual
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </h4>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    How to use the Stock Bloc Terminal, command codes & cheat sheet.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("investopedia")}
                className="p-3.5 bg-neutral-900/90 border border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-rose-300 flex items-center justify-between">
                    Investopedia Free Trading Game
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </h4>
                  <p className="text-[11px] text-rose-300/70 mt-0.5">
                    Zero-risk paper trading simulator with live market order books.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("small_business")}
                className="p-3.5 bg-neutral-900/90 border border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-rose-300 flex items-center justify-between">
                    Small Business & QSBS Tax Hub
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </h4>
                  <p className="text-[11px] text-rose-300/70 mt-0.5">
                    100% tax-free QSBS capital gains frameworks & SAFE term sheets.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate("youtube")}
                className="p-3.5 bg-neutral-900/90 border border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/40 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95"
              >
                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-rose-300 flex items-center justify-between">
                    Free Game Educational Videos
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </h4>
                  <p className="text-[11px] text-rose-300/70 mt-0.5">
                    Curated YouTube breakdown videos & quantitative playbooks.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

