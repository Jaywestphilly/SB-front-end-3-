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
import { VolcanicMagmaShader } from "./ui/VolcanicMagmaShader";

interface BottomNavProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenTerminal?: () => void;
  isTerminalOpen?: boolean;
  demoted?: boolean;
  magmaMode?: "standard" | "surge" | "slow" | "off";
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenTerminal,
  isTerminalOpen = false,
  demoted = false,
  magmaMode = "standard",
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

  const isIntelActive = !isTerminalOpen && activeTab === "news";
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
      {/* 5-6 Core Streamlined Floating Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={
          demoted
            ? "fixed bottom-2 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-xl font-mono select-none md:hidden opacity-90 hover:opacity-100 transition-all overflow-hidden"
            : "fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-xl font-mono select-none overflow-hidden"
        }
      >
        <div className="obsidian-magma-dock alien-block-cut p-1 sm:p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar overscroll-contain relative sm:grid sm:grid-cols-6">
          {/* Volcanic Magma WebGL Shader: continuous domain-warped molten flow rolling beneath translucent pads */}
          {magmaMode !== "off" && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <VolcanicMagmaShader
                speed={magmaMode === "surge" ? 0.28 : magmaMode === "slow" ? 0.10 : 0.18}
                viscosity={2.6}
                crustThreshold={0.54}
                heatIntensity={2.3}
              />
              {/* Deep obsidian gravitational absorption vignette */}
              <div 
                className="absolute inset-0 pointer-events-none z-[1]"
                style={{
                  background: "radial-gradient(140% 120% at 50% 100%, rgba(4, 2, 6, 0.32) 0%, rgba(2, 1, 4, 0.82) 100%)",
                }}
              />
            </div>
          )}

          {/* Corner Ticks */}
          <div className="hud-corner-tl z-10" />
          <div className="hud-corner-tr z-10" />
          <div className="hud-corner-bl z-10" />
          <div className="hud-corner-br z-10" />

          {/* TAB 1: YOUTUBE & INTEL FEED */}
          <button
            onClick={() => handleNavigate("news")}
            className={`min-h-[48px] py-1 px-1 sm:py-1.5 sm:px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shrink-0 flex-1 min-w-[54px] sm:min-w-0 focus-visible:outline-none dark-matter-pad group z-10 ${
              isIntelActive
                ? "dark-matter-pad-active pad-intel text-cyan-200 font-black"
                : "text-cyan-300/80 hover:text-white"
            }`}
          >
            {/* Gravitational Singularity Lens Flare */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden"
              style={{
                background: isIntelActive 
                  ? "radial-gradient(100% 100% at 50% 0%, rgba(34, 211, 238, 0.28) 0%, transparent 75%)"
                  : "radial-gradient(100% 100% at 50% 100%, rgba(255, 90, 0, 0.08) 0%, transparent 60%)"
              }}
            />
            <div className="relative z-10 flex items-center justify-center">
              <Globe className={`w-4 h-4 shrink-0 transition-transform ${isIntelActive ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.85)] scale-110" : "text-cyan-400 group-hover:scale-105"}`} />
            </div>
            <span className={`relative z-10 text-[8.5px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider whitespace-nowrap leading-none ${isIntelActive ? "text-cyan-100 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]" : "text-cyan-300/80"}`}>
              INTEL
            </span>
          </button>

          {/* TAB 2: MARKETS */}
          <button
            onClick={() => handleOpenSheet("markets")}
            className={`min-h-[48px] py-1 px-1 sm:py-1.5 sm:px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shrink-0 flex-1 min-w-[56px] sm:min-w-0 focus-visible:outline-none dark-matter-pad group z-10 ${
              isMarketsActive || activeSheet === "markets"
                ? "dark-matter-pad-active pad-markets text-cyan-200 font-black"
                : "text-cyan-300/80 hover:text-white"
            }`}
          >
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden"
              style={{
                background: (isMarketsActive || activeSheet === "markets")
                  ? "radial-gradient(100% 100% at 50% 0%, rgba(6, 182, 212, 0.3) 0%, transparent 75%)"
                  : "radial-gradient(100% 100% at 50% 100%, rgba(255, 90, 0, 0.08) 0%, transparent 60%)"
              }}
            />
            <TrendingUp className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${(isMarketsActive || activeSheet === "markets") ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.85)] scale-110" : "text-cyan-400 group-hover:scale-105"}`} />
            <span className={`relative z-10 text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-wider whitespace-nowrap leading-none ${(isMarketsActive || activeSheet === "markets") ? "text-cyan-100 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" : "text-cyan-300/80"}`}>
              MARKETS
            </span>
          </button>

          {/* TAB 3: AI */}
          <button
            onClick={() => handleOpenSheet("ai")}
            className={`min-h-[48px] py-1 px-1 sm:py-1.5 sm:px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shrink-0 flex-1 min-w-[48px] sm:min-w-0 focus-visible:outline-none dark-matter-pad group z-10 ${
              isAiActive || activeSheet === "ai"
                ? "dark-matter-pad-active pad-ai text-purple-200 font-black"
                : "text-purple-300/80 hover:text-white"
            }`}
          >
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden"
              style={{
                background: (isAiActive || activeSheet === "ai")
                  ? "radial-gradient(100% 100% at 50% 0%, rgba(168, 85, 247, 0.32) 0%, transparent 75%)"
                  : "radial-gradient(100% 100% at 50% 100%, rgba(255, 90, 0, 0.08) 0%, transparent 60%)"
              }}
            />
            <Cpu className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${(isAiActive || activeSheet === "ai") ? "text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.85)] scale-110" : "text-purple-400 group-hover:scale-105"}`} />
            <span className={`relative z-10 text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-wider whitespace-nowrap leading-none ${(isAiActive || activeSheet === "ai") ? "text-purple-100 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]" : "text-purple-300/80"}`}>
              AI
            </span>
          </button>

          {/* TAB 4: REAL ESTATE */}
          <button
            onClick={() => handleNavigate("real_estate")}
            className={`min-h-[48px] py-1 px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer shrink-0 flex-1 min-w-[54px] sm:min-w-0 focus-visible:outline-none dark-matter-pad group z-10 ${
              isRealEstateActive
                ? "dark-matter-pad-active pad-realestate text-amber-200 font-black"
                : "text-amber-300/80 hover:text-white"
            }`}
          >
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden"
              style={{
                background: isRealEstateActive 
                  ? "radial-gradient(100% 100% at 50% 0%, rgba(245, 158, 11, 0.32) 0%, transparent 75%)"
                  : "radial-gradient(100% 100% at 50% 100%, rgba(255, 90, 0, 0.08) 0%, transparent 60%)"
              }}
            />
            <Building2 className={`relative z-10 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${isRealEstateActive ? "text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] scale-110" : "text-amber-400 group-hover:scale-105"}`} />
            <span className={`relative z-10 text-[7.5px] sm:text-[9px] font-black uppercase tracking-tight text-center leading-[1.05] flex flex-col items-center ${isRealEstateActive ? "text-amber-100 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" : "text-amber-300/80"}`}>
              <span>REAL</span>
              <span>ESTATE</span>
            </span>
          </button>

          {/* TAB 5: CREDIT */}
          <button
            onClick={() => handleNavigate("credit")}
            className={`min-h-[48px] py-1 px-1 sm:py-1.5 sm:px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shrink-0 flex-1 min-w-[54px] sm:min-w-0 focus-visible:outline-none dark-matter-pad group z-10 ${
              isCreditActive
                ? "dark-matter-pad-active pad-credit text-emerald-200 font-black"
                : "text-emerald-300/80 hover:text-white"
            }`}
          >
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden"
              style={{
                background: isCreditActive 
                  ? "radial-gradient(100% 100% at 50% 0%, rgba(16, 185, 129, 0.32) 0%, transparent 75%)"
                  : "radial-gradient(100% 100% at 50% 100%, rgba(255, 90, 0, 0.08) 0%, transparent 60%)"
              }}
            />
            <ShieldCheck className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${isCreditActive ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.85)] scale-110" : "text-emerald-400 group-hover:scale-105"}`} />
            <span className={`relative z-10 text-[8.5px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-wider whitespace-nowrap leading-none ${isCreditActive ? "text-emerald-100 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "text-emerald-300/80"}`}>
              CREDIT
            </span>
          </button>

          {/* TAB 6: EDUCATION */}
          <button
            onClick={() => handleOpenSheet("education")}
            className={`min-h-[48px] py-1 px-1 sm:py-1.5 sm:px-0.5 alien-block-cut-sm flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all active:scale-95 cursor-pointer shrink-0 flex-1 min-w-[58px] sm:min-w-0 focus-visible:outline-none dark-matter-pad group z-10 ${
              isEducationActive || activeSheet === "education"
                ? "dark-matter-pad-active pad-education text-rose-200 font-black"
                : "text-rose-300/80 hover:text-white"
            }`}
          >
            <div 
              className="absolute inset-0 pointer-events-none rounded-[inherit] z-0 overflow-hidden"
              style={{
                background: (isEducationActive || activeSheet === "education")
                  ? "radial-gradient(100% 100% at 50% 0%, rgba(244, 63, 94, 0.32) 0%, transparent 75%)"
                  : "radial-gradient(100% 100% at 50% 100%, rgba(255, 90, 0, 0.08) 0%, transparent 60%)"
              }}
            />
            <GraduationCap className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${(isEducationActive || activeSheet === "education") ? "text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.85)] scale-110" : "text-rose-400 group-hover:scale-105"}`} />
            <span className={`relative z-10 text-[8px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider whitespace-nowrap leading-none ${(isEducationActive || activeSheet === "education") ? "text-rose-100 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" : "text-rose-300/80"}`}>
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
            className="w-full max-w-lg obsidian-magma-dock border-2 border-cyan-500/50 rounded-t-2xl alien-block-cut p-4 sm:p-6 shadow-2xl shadow-cyan-500/20 space-y-4 relative text-cyan-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {magmaMode !== "off" && (
              <div className="absolute inset-0 pointer-events-none z-0 opacity-60">
                <VolcanicMagmaShader
                  speed={0.12}
                  viscosity={2.8}
                  crustThreshold={0.58}
                  heatIntensity={1.8}
                />
              </div>
            )}
            <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                  MARKETS CATEGORY
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1.5 dark-matter-pad rounded-lg text-cyan-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate("watchlist")}
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-cyan-500/30 hover:border-cyan-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-cyan-500/30 hover:border-cyan-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-cyan-500/30 hover:border-cyan-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-cyan-500/30 hover:border-cyan-400"
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
            className="w-full max-w-lg obsidian-magma-dock border-2 border-purple-500/50 rounded-t-2xl alien-block-cut p-4 sm:p-6 shadow-2xl shadow-purple-500/20 space-y-4 relative text-purple-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {magmaMode !== "off" && (
              <div className="absolute inset-0 pointer-events-none z-0 opacity-60">
                <VolcanicMagmaShader
                  speed={0.12}
                  viscosity={2.8}
                  crustThreshold={0.58}
                  heatIntensity={1.8}
                />
              </div>
            )}
            <div className="relative z-10 flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                  AI & TECH CATEGORY
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1.5 dark-matter-pad rounded-lg text-purple-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate("ai_revolution")}
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-amber-500/40 hover:border-amber-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-purple-500/30 hover:border-purple-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-purple-500/30 hover:border-purple-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-purple-500/30 hover:border-purple-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-purple-500/30 hover:border-purple-400"
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
            className="w-full max-w-lg obsidian-magma-dock border-2 border-rose-500/50 rounded-t-2xl alien-block-cut p-4 sm:p-6 shadow-2xl shadow-rose-500/20 space-y-4 relative text-rose-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {magmaMode !== "off" && (
              <div className="absolute inset-0 pointer-events-none z-0 opacity-60">
                <VolcanicMagmaShader
                  speed={0.12}
                  viscosity={2.8}
                  crustThreshold={0.58}
                  heatIntensity={1.8}
                />
              </div>
            )}
            <div className="relative z-10 flex items-center justify-between border-b border-rose-500/30 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-rose-400" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                  EDUCATION CATEGORY
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-1.5 dark-matter-pad rounded-lg text-rose-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleNavigate("mit_courses")}
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-purple-500/40 hover:border-purple-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-amber-500/40 hover:border-amber-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-rose-500/30 hover:border-rose-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-rose-500/30 hover:border-rose-400"
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
                className="p-3.5 dark-matter-pad rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer active:scale-95 border border-rose-500/30 hover:border-rose-400"
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

