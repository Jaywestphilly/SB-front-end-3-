import React, { useState } from "react";
import {
  RefreshCw,
  AlertTriangle,
  XCircle,
  Clock,
  CandlestickChart,
  LineChart,
  Target,
  HelpCircle,
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  ChevronDown,
  Orbit,
  ShieldAlert,
  Database,
  ExternalLink,
} from "lucide-react";
import { getMarketOpenStatus, getStockDataFreshness } from "../utils/signalCalculator";
import { triggerHaptic } from "../utils/haptics";
import { useMarketStore } from "../stores/marketStore";
import { SBScoreGuideModal } from "./SBScoreGuideModal";
import { ViewTab } from "../types";

interface WatchlistIntelligenceHeaderProps {
  isSyncing: boolean;
  onRefresh: () => void;
  marketDataUpdatedAt: string | null;
  marketDataSource: string | null;
  marketDataIsStale: boolean;
  totalStocks: number;
  onSelectTab?: (tab: ViewTab) => void;
  onOpenAuth?: () => void;
}

export const WatchlistIntelligenceHeader: React.FC<WatchlistIntelligenceHeaderProps> = ({
  isSyncing,
  onRefresh,
  marketDataUpdatedAt,
  marketDataSource,
  marketDataIsStale,
  totalStocks,
  onSelectTab,
  onOpenAuth,
}) => {
  const marketOpen = getMarketOpenStatus();
  const freshness = getStockDataFreshness(marketDataUpdatedAt);
  const { watchlistChartStyle, setWatchlistChartStyle } = useMarketStore();
  const [isSBGuideOpen, setIsSBGuideOpen] = useState(false);
  const [showScoreLegend, setShowScoreLegend] = useState(false);

  return (
    <div className="w-full px-2 sm:px-4 pt-2.5 pb-1 font-martian">
      <div className="obsidian-command-deck obsidian-specular-rim rounded-2xl p-3 sm:p-3.5 space-y-2.5">
        {/* Primary Command Row: Telemetry Pills + Chart Mode & Sync Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Market Status, Data Freshness, Asset Count & Feed Source */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Market Open Status */}
            <span
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-alien-hud flex items-center gap-1.5 ${marketOpen.colorClass}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{marketOpen.statusText}</span>
            </span>

            {/* Data Freshness */}
            <span
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-martian font-bold flex items-center gap-1.5 tabular-telemetry ${freshness.badgeClass}`}
              title={`Feed Provider: ${marketDataSource || "Verified Market Feed"}`}
            >
              <Clock className="w-3 h-3 text-current shrink-0" />
              <span>
                {freshness.label} · {freshness.ageText}
              </span>
            </span>

            {/* Active Assets Monitored */}
            <span className="px-2.5 py-1 rounded-lg border border-cyan-500/35 bg-cyan-950/40 text-cyan-200 text-[10px] font-martian font-bold flex items-center gap-1.5 tabular-telemetry">
              <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{totalStocks} ASSETS</span>
            </span>

            {/* Compact SB Score Tier Legend Toggle */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setShowScoreLegend((prev) => !prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                showScoreLegend
                  ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/60"
                  : "obsidian-pill-btn text-cyan-200/90 hover:text-white"
              }`}
              title="Toggle 5-Factor SB Score Quant Legend (0-100)"
            >
              <Target className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>SB SCORE 0–100</span>
              <span className="hidden sm:inline-flex items-center gap-1 ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  showScoreLegend ? "rotate-180 text-cyan-300" : "opacity-70"
                }`}
              />
            </button>

            {/* Direct SB Score Methodology Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setIsSBGuideOpen(true);
              }}
              className="px-2 py-1 rounded-lg obsidian-pill-btn text-cyan-300 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              title="Open comprehensive SB Score methodology explainer"
            >
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">GUIDE</span>
            </button>
          </div>

          {/* Right: Quick Hub Shortcuts, Chart Style Switcher & Sync Live */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Streamlined Quick-Access Pills (Consolidated from former separate rows) */}
            {onSelectTab && (
              <div className="hidden xl:flex items-center gap-1.5 pr-1.5 border-r border-cyan-500/20">
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    onSelectTab("intelligence");
                  }}
                  className="px-2.5 py-1 rounded-lg obsidian-pill-btn text-cyan-200 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  title="Open 13F Hedge Fund & SEC Filings Matrix"
                >
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>13F Intel</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    onSelectTab("dyson_swarm");
                  }}
                  className="px-2.5 py-1 rounded-lg obsidian-pill-btn text-amber-200 hover:text-amber-100 border-amber-500/35 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  title="Open Dyson Swarm & Orbital Compute Hub"
                >
                  <Orbit className="w-3 h-3 text-amber-400 animate-spin-slow" />
                  <span>Dyson Swarm</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    onSelectTab("war_gov_ufo");
                  }}
                  className="px-2.5 py-1 rounded-lg obsidian-pill-btn text-amber-200 hover:text-amber-100 border-amber-500/35 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  title="Open Defense Tech, Aerospace & Gov Contracts Matrix"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Defense / Gov</span>
                </button>
              </div>
            )}

            {onOpenAuth && (
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  onOpenAuth();
                }}
                className="hidden md:flex px-2.5 py-1 rounded-lg obsidian-pill-btn text-emerald-200 hover:text-emerald-100 border-emerald-500/35 text-[10px] font-mono font-bold items-center gap-1 cursor-pointer"
                title="Cloud Sync Watchlist & Portfolio"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Cloud Sync</span>
              </button>
            )}

            <a
              href="https://join.robinhood.com/jumannc3"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic("selection")}
              className="hidden sm:flex px-2.5 py-1 rounded-lg obsidian-pill-btn text-cyan-200 hover:text-white text-[10px] font-mono font-bold items-center gap-1 cursor-pointer"
              title="Open Brokerage Account (Partner)"
            >
              <span>Trade</span>
              <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
            </a>

            {/* Chart Style Mode Toggle (Line vs Heikin-Ashi Candlesticks) */}
            <div className="flex items-center p-0.5 bg-[#020813]/90 border border-cyan-500/35 rounded-lg">
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setWatchlistChartStyle("line");
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-alien-hud uppercase flex items-center gap-1 transition-all cursor-pointer ${
                  watchlistChartStyle === "line"
                    ? "bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                    : "text-slate-400 hover:text-cyan-200"
                }`}
                title="Smooth 24H Line Price Trend"
              >
                <LineChart className="w-3 h-3" />
                <span>Line</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setWatchlistChartStyle("candlestick");
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-alien-hud uppercase flex items-center gap-1 transition-all cursor-pointer ${
                  watchlistChartStyle === "candlestick"
                    ? "bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                    : "text-slate-400 hover:text-cyan-200"
                }`}
                title="Heikin-Ashi (平均足) Japanese Candlestick Bars"
              >
                <CandlestickChart className="w-3 h-3" />
                <span>Candles</span>
              </button>
            </div>

            {/* Manual Live Sync Button */}
            <button
              onClick={() => {
                triggerHaptic("refresh");
                onRefresh();
              }}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-alien-hud font-bold text-[10px] flex items-center gap-1.5 active:scale-95 transition-all shadow-[0_0_16px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 text-slate-950 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Live"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible SB Score 4-Tier Legend & 5-Factor Weights Drawer */}
        {showScoreLegend && (
          <div className="pt-2.5 border-t border-cyan-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Visual Signal Tiers Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 text-[10px] font-mono tabular-telemetry">
              <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-400/50 rounded-lg flex items-center justify-between">
                <span className="text-emerald-300 font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  75–100
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">BULLISH</span>
              </div>
              <div className="px-2.5 py-1 bg-cyan-950/60 border border-cyan-400/50 rounded-lg flex items-center justify-between">
                <span className="text-cyan-300 font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  60–74
                </span>
                <span className="text-[9px] text-cyan-400 font-bold">MODERATE</span>
              </div>
              <div className="px-2.5 py-1 bg-amber-950/60 border border-amber-400/50 rounded-lg flex items-center justify-between">
                <span className="text-amber-300 font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  40–59
                </span>
                <span className="text-[9px] text-amber-400 font-bold">NEUTRAL</span>
              </div>
              <div className="px-2.5 py-1 bg-rose-950/60 border border-rose-400/50 rounded-lg flex items-center justify-between">
                <span className="text-rose-300 font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  &lt;40
                </span>
                <span className="text-[9px] text-rose-400 font-bold">CAUTION</span>
              </div>
            </div>

            {/* 5-Factor Quantitative Weights Breakdown */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[9px] font-mono text-slate-300 shrink-0">
              <span className="text-cyan-400/80 font-bold uppercase">Weights:</span>
              <span className="px-2 py-0.5 bg-black/50 border border-cyan-500/25 rounded-md flex items-center gap-1 text-cyan-200">
                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                MOM 25%
              </span>
              <span className="px-2 py-0.5 bg-black/50 border border-cyan-500/25 rounded-md flex items-center gap-1 text-cyan-200">
                <TrendingUp className="w-2.5 h-2.5 text-blue-400" />
                TREND 25%
              </span>
              <span className="px-2 py-0.5 bg-black/50 border border-cyan-500/25 rounded-md flex items-center gap-1 text-cyan-200">
                <Target className="w-2.5 h-2.5 text-purple-400" />
                52W 20%
              </span>
              <span className="px-2 py-0.5 bg-black/50 border border-cyan-500/25 rounded-md flex items-center gap-1 text-cyan-200">
                <BarChart3 className="w-2.5 h-2.5 text-amber-400" />
                VOL 15%
              </span>
              <span className="px-2 py-0.5 bg-black/50 border border-cyan-500/25 rounded-md flex items-center gap-1 text-cyan-200">
                <Zap className="w-2.5 h-2.5 text-yellow-400" />
                STAB 15%
              </span>
            </div>
          </div>
        )}

        {/* Error / Stale Warning Banners */}
        {marketDataIsStale && (
          <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Market Data Stale:</strong> Showing last verified snapshot ({freshness.minutesAgo} min ago). Live market pipeline active.
            </span>
          </div>
        )}

        {totalStocks === 0 && (
          <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Market data temporarily unavailable. Click <strong>Sync Live</strong> to reload verified feed.
            </span>
          </div>
        )}
      </div>

      {/* SB Score Methodology Guide Modal */}
      <SBScoreGuideModal
        isOpen={isSBGuideOpen}
        onClose={() => setIsSBGuideOpen(false)}
      />
    </div>
  );
};



