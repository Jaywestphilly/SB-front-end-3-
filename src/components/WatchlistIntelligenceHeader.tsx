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
} from "lucide-react";
import { getMarketOpenStatus, getStockDataFreshness } from "../utils/signalCalculator";
import { triggerHaptic } from "../utils/haptics";
import { useMarketStore } from "../stores/marketStore";
import { SBScoreGuideModal } from "./SBScoreGuideModal";

interface WatchlistIntelligenceHeaderProps {
  isSyncing: boolean;
  onRefresh: () => void;
  marketDataUpdatedAt: string | null;
  marketDataSource: string | null;
  marketDataIsStale: boolean;
  totalStocks: number;
}

export const WatchlistIntelligenceHeader: React.FC<WatchlistIntelligenceHeaderProps> = ({
  isSyncing,
  onRefresh,
  marketDataUpdatedAt,
  marketDataSource,
  marketDataIsStale,
  totalStocks,
}) => {
  const marketOpen = getMarketOpenStatus();
  const freshness = getStockDataFreshness(marketDataUpdatedAt);
  const { watchlistChartStyle, setWatchlistChartStyle } = useMarketStore();
  const [isSBGuideOpen, setIsSBGuideOpen] = useState(false);

  return (
    <div className="w-full space-y-3 px-4 py-2 font-martian">
      {/* Top Banner: Dual-Column Layout with Market Feeds & SB Score Quant Legend */}
      <div className="p-3.5 alien-block-cut bg-[#020d18] border border-cyan-500/40 shadow-xl shadow-cyan-950/40 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
          
          {/* Left Column: Market Status, Feed Controls & Data Freshness */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Market Status Pill */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 alien-block-cut-sm border text-[10px] font-alien-hud flex items-center gap-1.5 ${marketOpen.colorClass}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>{marketOpen.statusText}</span>
                </span>

                {/* Freshness Badge */}
                <span className={`px-2.5 py-1 alien-block-cut-sm border text-[10px] font-martian font-bold flex items-center gap-1.5 ${freshness.badgeClass}`}>
                  <Clock className="w-3 h-3 text-current" />
                  <span>{freshness.label} ({freshness.ageText})</span>
                </span>
              </div>

              {/* Action Controls: Chart Style & Manual Refresh */}
              <div className="flex items-center gap-1.5">
                {/* Chart Style Mode Toggle (Line default vs Candlesticks) */}
                <div className="flex items-center p-0.5 bg-black/70 border border-cyan-500/40 alien-block-cut-sm">
                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      setWatchlistChartStyle("line");
                    }}
                    className={`px-2 py-1 text-[10px] font-alien-hud uppercase flex items-center gap-1 transition-all cursor-pointer ${
                      watchlistChartStyle === "line"
                        ? "bg-cyan-400 text-black font-black glow-cyan"
                        : "text-neutral-400 hover:text-cyan-200"
                    }`}
                    title="Smooth Line Price Trend (Default)"
                  >
                    <LineChart className="w-3 h-3" />
                    <span>Line</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      setWatchlistChartStyle("candlestick");
                    }}
                    className={`px-2 py-1 text-[10px] font-alien-hud uppercase flex items-center gap-1 transition-all cursor-pointer ${
                      watchlistChartStyle === "candlestick"
                        ? "bg-cyan-400 text-black font-black glow-cyan"
                        : "text-neutral-400 hover:text-cyan-200"
                    }`}
                    title="Heikin-Ashi (平均足) Japanese Candlestick Bars"
                  >
                    <CandlestickChart className="w-3 h-3" />
                    <span>Candles</span>
                  </button>
                </div>

                {/* Manual Refresh Button */}
                <button
                  onClick={() => {
                    triggerHaptic("refresh");
                    onRefresh();
                  }}
                  disabled={isSyncing}
                  className="px-3 py-1 alien-block-cut-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-alien-hud text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50 glow-cyan"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Live"}</span>
                </button>
              </div>
            </div>

            {/* Metadata Row: Source & Timestamp */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-cyan-400/80 pt-1.5 border-t border-cyan-900/50">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-500/70 font-alien-hud">FEED PROVIDER:</span>
                <span className="font-bold text-cyan-200">{marketDataSource || "Alpha Vantage Quant API"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-cyan-500/70 font-alien-hud">LAST VERIFIED:</span>
                <span className="font-bold text-neutral-200">
                  {marketDataUpdatedAt ? new Date(marketDataUpdatedAt).toLocaleTimeString() : "Recent Session"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: SB Score Legend & Quant Explainer Matrix */}
          <div className="lg:col-span-6 xl:col-span-7 bg-[#03111f]/90 border border-cyan-500/30 p-2.5 alien-block-cut-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 rounded">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black font-mono tracking-wider text-cyan-200 uppercase flex items-center gap-1.5">
                    SB SCORE QUANT MATRIX
                    <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950 border border-cyan-500/40 text-cyan-400 rounded font-mono">
                      0–100
                    </span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setIsSBGuideOpen(true);
                }}
                className="px-2 py-0.5 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 rounded transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Open comprehensive SB Score methodology explainer"
              >
                <HelpCircle className="w-3 h-3 text-cyan-400" />
                <span>EXPLAINER & GUIDE</span>
              </button>
            </div>

            {/* Visual Signal Tiers Bar (Green, Blue, Yellow, Red) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-mono">
              <div className="px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-400/60 rounded flex items-center justify-between shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                <span className="text-emerald-300 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  75–100
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">GREEN // BULL</span>
              </div>
              <div className="px-1.5 py-0.5 bg-blue-950/70 border border-cyan-400/60 rounded flex items-center justify-between shadow-[0_0_6px_rgba(6,182,212,0.2)]">
                <span className="text-cyan-300 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  60–74
                </span>
                <span className="text-[9px] text-cyan-400 font-bold">BLUE // MOD</span>
              </div>
              <div className="px-1.5 py-0.5 bg-amber-950/70 border border-amber-400/60 rounded flex items-center justify-between shadow-[0_0_6px_rgba(245,158,11,0.2)]">
                <span className="text-amber-300 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  40–59
                </span>
                <span className="text-[9px] text-amber-400 font-bold">YELLOW // NEUT</span>
              </div>
              <div className="px-1.5 py-0.5 bg-rose-950/70 border border-rose-400/60 rounded flex items-center justify-between shadow-[0_0_6px_rgba(244,63,94,0.2)]">
                <span className="text-rose-300 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  &lt;40
                </span>
                <span className="text-[9px] text-rose-400 font-bold">RED // CAUTION</span>
              </div>
            </div>

            {/* 5-Factor Quantitative Weights Breakdown */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 text-[9px] font-mono text-neutral-300">
              <span className="text-cyan-500/70 shrink-0 font-bold">WEIGHTS:</span>
              <span className="px-1.5 py-0.5 bg-black/40 border border-cyan-900/60 rounded shrink-0 flex items-center gap-1 text-cyan-300">
                <Activity className="w-2.5 h-2.5 text-cyan-400" />
                MOM 25%
              </span>
              <span className="px-1.5 py-0.5 bg-black/40 border border-cyan-900/60 rounded shrink-0 flex items-center gap-1 text-cyan-300">
                <TrendingUp className="w-2.5 h-2.5 text-blue-400" />
                TREND 25%
              </span>
              <span className="px-1.5 py-0.5 bg-black/40 border border-cyan-900/60 rounded shrink-0 flex items-center gap-1 text-cyan-300">
                <Target className="w-2.5 h-2.5 text-purple-400" />
                52W 20%
              </span>
              <span className="px-1.5 py-0.5 bg-black/40 border border-cyan-900/60 rounded shrink-0 flex items-center gap-1 text-cyan-300">
                <BarChart3 className="w-2.5 h-2.5 text-amber-400" />
                VOL 15%
              </span>
              <span className="px-1.5 py-0.5 bg-black/40 border border-cyan-900/60 rounded shrink-0 flex items-center gap-1 text-cyan-300">
                <Zap className="w-2.5 h-2.5 text-yellow-400" />
                STAB 15%
              </span>
            </div>
          </div>

        </div>

        {/* Error / Stale Warning Banners */}
        {marketDataIsStale && (
          <div className="p-2.5 alien-block-cut-sm bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Market Data Stale:</strong> Showing last verified snapshot ({freshness.minutesAgo} min ago). Live market pipeline active.
            </span>
          </div>
        )}

        {totalStocks === 0 && (
          <div className="p-3 alien-block-cut-sm bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Market data temporarily unavailable. Click <strong>Sync Live Prices</strong> to reload verified feed.</span>
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


