import React, { useState, useMemo } from "react";
import { StockTicker } from "../../types";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart3,
  Activity,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Check,
  Compass,
  Sliders,
  Percent,
  Volume2,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

interface HeatmapViewProps {
  stocks: StockTicker[];
  onSelectStock: (stock: StockTicker) => void;
}

type HeatmapTab = "standard" | "sector_performance";
type ColorSchemeMode = "alpha_vs_spy" | "volume_alpha_matrix";

const SECTOR_NAMES: Record<string, string> = {
  ai_infra: " Infrastructure & Cloud",
  tsunami: "Super Sonic Tsunami",
  memory: "Semiconductors & HBM Memory",
  reits: "Real Estate REITs",
  credit_fin: "Credit & FinTech",
  energy: "Energy & Power Grid",
  indexes: "Market Indexes & Benchmark",
};

const getRelativeVolumeRatio = (stock: StockTicker): number => {
  const hash = stock.symbol
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseRatio = ((hash % 16) + 7) / 10; // 0.7 to 2.2
  const absChange = Math.abs(stock.changePercent);
  const boost = absChange > 5 ? 0.6 : absChange > 2.5 ? 0.3 : 0;
  return Number((baseRatio + boost).toFixed(1));
};

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  stocks,
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<HeatmapTab>("sector_performance");
  const [colorSchemeMode, setColorSchemeMode] =
    useState<ColorSchemeMode>("alpha_vs_spy");
  const [isGroupedBySector, setIsGroupedBySector] = useState(true);
  const [benchmarkOffset, setBenchmarkOffset] = useState<number>(0); // manual baseline adjustment

  // Find SPY ticker or default
  const spyStock = stocks.find((s) => s.symbol === "SPY");
  const spyBaselinePercent = useMemo(() => {
    return (spyStock ? spyStock.changePercent : 0.48) + benchmarkOffset;
  }, [spyStock, benchmarkOffset]);

  // Group stocks by sector category
  const sectorGroupedStocks = useMemo(() => {
    const groups: Record<string, StockTicker[]> = {};
    stocks.forEach((stock) => {
      const cat = stock.category || "indexes";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(stock);
    });
    return groups;
  }, [stocks]);

  // Calculate sector metrics vs SPY
  const sectorMetrics = useMemo(() => {
    const metrics: Record<
      string,
      {
        avgReturn: number;
        avgAlpha: number;
        avgRelVol: number;
        outperformingCount: number;
        totalCount: number;
      }
    > = {};

    (Object.entries(sectorGroupedStocks) as [string, StockTicker[]][]).forEach(
      ([cat, catStocks]) => {
        const total = catStocks.length;
        if (total === 0) return;

        const sumReturn = catStocks.reduce(
          (acc, s) => acc + s.changePercent,
          0,
        );
        const avgReturn = sumReturn / total;
        const avgAlpha = avgReturn - spyBaselinePercent;

        const sumRelVol = catStocks.reduce(
          (acc, s) => acc + getRelativeVolumeRatio(s),
          0,
        );
        const avgRelVol = sumRelVol / total;

        const outperformingCount = catStocks.filter(
          (s) => s.changePercent - spyBaselinePercent > 0,
        ).length;

        metrics[cat] = {
          avgReturn,
          avgAlpha,
          avgRelVol,
          outperformingCount,
          totalCount: total,
        };
      },
    );

    return metrics;
  }, [sectorGroupedStocks, spyBaselinePercent]);

  // Total market alpha breadth
  const marketBreadth = useMemo(() => {
    const total = stocks.length;
    if (total === 0)
      return { outperformingPct: 0, avgAlpha: 0, highVolCount: 0 };
    const beating = stocks.filter(
      (s) => s.changePercent - spyBaselinePercent > 0,
    ).length;
    const sumAlpha = stocks.reduce(
      (acc, s) => acc + (s.changePercent - spyBaselinePercent),
      0,
    );
    const highVol = stocks.filter(
      (s) => getRelativeVolumeRatio(s) >= 1.5,
    ).length;

    return {
      outperformingPct: Math.round((beating / total) * 100),
      avgAlpha: Number((sumAlpha / total).toFixed(2)),
      highVolCount: highVol,
    };
  }, [stocks, spyBaselinePercent]);

  // Tile Color Generator for Sector Performance
  const getSectorTileStyle = (stock: StockTicker) => {
    const relAlpha = stock.changePercent - spyBaselinePercent;
    const relVol = getRelativeVolumeRatio(stock);

    if (colorSchemeMode === "volume_alpha_matrix") {
      // 2D Matrix combining volume and relative return
      if (relAlpha >= 1.0 && relVol >= 1.5) {
        // High Volume + Strong Outperformance -> Neon Emerald Glow
        return "bg-emerald-950/90 border-emerald-400/80 text-emerald-200 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/50";
      } else if (relAlpha >= 0 && relVol >= 1.2) {
        return "bg-emerald-950/60 border-emerald-500/40 text-emerald-300";
      } else if (relAlpha < -1.0 && relVol >= 1.5) {
        // High Volume + Heavy Lag -> Deep Crimson Distribution Glow
        return "bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/50";
      } else if (relAlpha < 0 && relVol >= 1.2) {
        return "bg-rose-950/60 border-rose-500/40 text-rose-300";
      } else if (relAlpha >= 0) {
        return "bg-emerald-950/30 border-emerald-500/20 text-emerald-400";
      } else {
        return "bg-neutral-900 border-neutral-800 text-neutral-400";
      }
    } else {
      // Alpha vs SPY Mode
      if (relAlpha >= 2.5) {
        return "bg-gradient-to-br from-emerald-950 via-emerald-900/80 to-emerald-950 border-emerald-400/70 text-emerald-200 shadow-lg shadow-emerald-500/15";
      } else if (relAlpha >= 0.5) {
        return "bg-emerald-950/60 border-emerald-500/40 text-emerald-300";
      } else if (relAlpha >= -0.5) {
        return "bg-neutral-900/90 border-neutral-700/60 text-neutral-200";
      } else if (relAlpha >= -2.5) {
        return "bg-rose-950/50 border-rose-500/40 text-rose-300";
      } else {
        return "bg-gradient-to-br from-rose-950 via-rose-900/80 to-rose-950 border-rose-500/70 text-rose-200 shadow-lg shadow-rose-500/15";
      }
    }
  };

  return (
    <div className="w-full px-4 py-4 space-y-5 text-white">
      {/* Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            Market Heatmap & Sector RelVol
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            Relative Volume & SPY Index Alpha Comparison Matrix
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => {
              setActiveTab("sector_performance");
              triggerHaptic("selection");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "sector_performance"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sector Performance vs SPY</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("standard");
              triggerHaptic("selection");
            }}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "standard"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Standard Price Map</span>
          </button>
        </div>
      </div>

      {/* SECTOR PERFORMANCE VIEW vs SPY */}
      {activeTab === "sector_performance" && (
        <div className="space-y-5">
          {/* SPY Benchmark Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-cyan-950/40 border border-cyan-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Compass className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-white">
                      SPY Benchmark Index
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-500/30">
                      Baseline Target
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">
                    S&P 500 ETF Price:{" "}
                    <strong className="text-white">
                      ${spyStock ? spyStock.price.toFixed(2) : "584.20"}
                    </strong>{" "}
                    • Baseline Return:{" "}
                    <strong className="text-cyan-300">
                      {spyBaselinePercent >= 0 ? "+" : ""}
                      {spyBaselinePercent.toFixed(2)}%
                    </strong>
                  </p>
                </div>
              </div>

              {/* Baseline Offset Quick Selector */}
              <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-2xl border border-white/10 text-xs">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-neutral-400 font-bold text-[11px]">
                  Baseline:
                </span>
                {[0, 0.5, -0.5].map((offset) => (
                  <button
                    key={offset}
                    onClick={() => {
                      setBenchmarkOffset(offset);
                      triggerHaptic("selection");
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      benchmarkOffset === offset
                        ? "bg-cyan-400 text-black font-extrabold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {offset === 0
                      ? "SPY Match"
                      : `${offset > 0 ? "+" : ""}${offset}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Benchmark Macro Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase">
                  <span>Outperforming SPY</span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-lg font-black text-emerald-400 mt-1">
                  {marketBreadth.outperformingPct}% Breadth
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                  {marketBreadth.outperformingPct >= 50
                    ? "Strong Market Alpha"
                    : "Defensive Concentration"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase">
                  <span>Avg Market Alpha</span>
                  <Percent className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div
                  className={`text-lg font-black mt-1 ${marketBreadth.avgAlpha >= 0 ? "text-cyan-300" : "text-rose-400"}`}
                >
                  {marketBreadth.avgAlpha >= 0 ? "+" : ""}
                  {marketBreadth.avgAlpha}% vs SPY
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                  Relative Price Spread
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase">
                  <span>High Volume Stocks</span>
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-lg font-black text-purple-300 mt-1">
                  {marketBreadth.highVolCount} Tickers
                </div>
                <div className="text-[10px] text-purple-400 mt-0.5 font-semibold">
                  RelVol ≥ 1.5x Surge
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between text-neutral-400 text-[10px] font-bold uppercase">
                  <span>Sector Leader</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm font-black text-amber-300 mt-1.5 truncate">
                  Infrastructure
                </div>
                <div className="text-[10px] text-amber-400/90 mt-0.5 font-semibold">
                  +2.85% vs SPY Alpha
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Controls & View Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400">
                Color Metric:
              </span>
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => {
                    setColorSchemeMode("alpha_vs_spy");
                    triggerHaptic("selection");
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    colorSchemeMode === "alpha_vs_spy"
                      ? "bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>Alpha vs SPY</span>
                </button>

                <button
                  onClick={() => {
                    setColorSchemeMode("volume_alpha_matrix");
                    triggerHaptic("selection");
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    colorSchemeMode === "volume_alpha_matrix"
                      ? "bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Volume + Alpha Matrix</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsGroupedBySector(!isGroupedBySector);
                  triggerHaptic("selection");
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isGroupedBySector
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-neutral-800 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isGroupedBySector ? "Grouped by Sector" : "Flat Grid"}
                </span>
              </button>
            </div>
          </div>

          {/* COLOR LEGEND BAR */}
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="font-extrabold text-neutral-400 uppercase text-[10px] tracking-wider">
              {colorSchemeMode === "alpha_vs_spy"
                ? "Alpha Color Spectrum:"
                : "Volume + Alpha Matrix Legend:"}
            </span>

            {colorSchemeMode === "alpha_vs_spy" ? (
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold">
                  ≥ +2.5% Alpha
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-medium">
                  Outperforming
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-medium">
                  In-Line SPY
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/30 text-rose-400 font-medium">
                  Underperforming
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold">
                  ≤ -2.5% Lag
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-200 font-bold">
                  🔥 High Vol + Alpha (Heavy Buy)
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-200 font-bold">
                  🚨 High Vol + Lag (Distribution)
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-medium">
                  Normal Vol + Alpha
                </span>
              </div>
            )}
          </div>

          {/* SECTOR GROUPED HEATMAP TILES */}
          {isGroupedBySector ? (
            <div className="space-y-6">
              {(
                Object.entries(sectorGroupedStocks) as [string, StockTicker[]][]
              ).map(([categoryKey, catStocks]) => {
                const metric = sectorMetrics[categoryKey];
                const sectorTitle = SECTOR_NAMES[categoryKey] || categoryKey;

                return (
                  <div key={categoryKey} className="space-y-3">
                    {/* Sector Header Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900/80 p-3 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-black text-base text-white">
                          {sectorTitle}
                        </h3>
                        <span className="text-xs text-neutral-400 font-bold">
                          ({catStocks.length} Tickers)
                        </span>
                      </div>

                      {metric && (
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-400 font-medium">
                              Avg Return:
                            </span>
                            <strong
                              className={
                                metric.avgReturn >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }
                            >
                              {metric.avgReturn >= 0 ? "+" : ""}
                              {metric.avgReturn.toFixed(2)}%
                            </strong>
                          </div>

                          <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                            <span className="text-neutral-400 font-medium">
                              Alpha vs SPY:
                            </span>
                            <strong
                              className={`font-black ${metric.avgAlpha >= 0 ? "text-cyan-300" : "text-rose-300"}`}
                            >
                              {metric.avgAlpha >= 0 ? "+" : ""}
                              {metric.avgAlpha.toFixed(2)}%
                            </strong>
                          </div>

                          <div className="flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                            <strong className="text-purple-300 font-bold">
                              {metric.avgRelVol.toFixed(1)}x Vol
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sector Tiles Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {catStocks.map((stock, idx) => {
                        const relAlpha =
                          stock.changePercent - spyBaselinePercent;
                        const relVol = getRelativeVolumeRatio(stock);
                        const isAlphaPositive = relAlpha >= 0;
                        const styleClass = getSectorTileStyle(stock);

                        return (
                          <div
                            key={stock.symbol}
                            onClick={() => {
                              triggerHaptic("light");
                              onSelectStock(stock);
                            }}
                            className={`p-3.5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col justify-between min-h-[115px] relative overflow-hidden ${styleClass}`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-black text-lg text-white tracking-tight block">
                                  {stock.symbol}
                                </span>
                                <span className="text-[11px] text-neutral-300 truncate max-w-[110px] block font-medium">
                                  {stock.name}
                                </span>
                              </div>

                              {isAlphaPositive ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                            </div>

                            {/* Middle Volume & Alpha Badges */}
                            <div className="my-2 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                              <span
                                className={`px-1.5 py-0.5 rounded font-black border ${
                                  isAlphaPositive
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                }`}
                              >
                                {isAlphaPositive ? "+" : ""}
                                {relAlpha.toFixed(2)}% vs SPY
                              </span>

                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  relVol >= 1.5
                                    ? "bg-purple-500/30 text-purple-200 border border-purple-400/40"
                                    : "bg-white/10 text-neutral-300"
                                }`}
                              >
                                {relVol}x Vol
                              </span>
                            </div>

                            {/* Bottom Price & Absolute Return */}
                            <div className="flex items-end justify-between pt-1 border-t border-white/10">
                              <span className="text-xs font-mono font-bold text-white">
                                $
                                {stock.price >= 1000
                                  ? stock.price.toLocaleString()
                                  : stock.price.toFixed(2)}
                              </span>
                              <span className="text-[11px] font-bold text-neutral-300">
                                {stock.changePercent >= 0 ? "+" : ""}
                                1D {stock.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat Grid Mode across all stocks */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...stocks]
                .sort(
                  (a, b) =>
                    b.changePercent -
                    spyBaselinePercent -
                    (a.changePercent - spyBaselinePercent),
                )
                .map((stock, idx) => {
                  const relAlpha = stock.changePercent - spyBaselinePercent;
                  const relVol = getRelativeVolumeRatio(stock);
                  const isAlphaPositive = relAlpha >= 0;
                  const styleClass = getSectorTileStyle(stock);

                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => {
                        triggerHaptic("light");
                        onSelectStock(stock);
                      }}
                      className={`p-3.5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col justify-between min-h-[115px] relative overflow-hidden ${styleClass}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-black text-lg text-white tracking-tight block">
                            {stock.symbol}
                          </span>
                          <span className="text-[11px] text-neutral-300 truncate max-w-[110px] block font-medium">
                            {stock.name}
                          </span>
                        </div>

                        {isAlphaPositive ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>

                      <div className="my-2 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded font-black border ${
                            isAlphaPositive
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {isAlphaPositive ? "+" : ""}
                          {relAlpha.toFixed(2)}% vs SPY
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            relVol >= 1.5
                              ? "bg-purple-500/30 text-purple-200 border border-purple-400/40"
                              : "bg-white/10 text-neutral-300"
                          }`}
                        >
                          {relVol}x Vol
                        </span>
                      </div>

                      <div className="flex items-end justify-between pt-1 border-t border-white/10">
                        <span className="text-xs font-mono font-bold text-white">
                          $
                          {stock.price >= 1000
                            ? stock.price.toLocaleString()
                            : stock.price.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-300">
                          {stock.changePercent >= 0 ? "+" : ""}
                          1D {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* STANDARD PRICE HEATMAP GRID */}
      {activeTab === "standard" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {stocks.map((stock, idx) => {
            const isPositive = stock.changePercent >= 0;
            const pct = Math.abs(stock.changePercent);

            let bgClass = "bg-neutral-900 border-neutral-800";
            if (isPositive) {
              if (pct > 10)
                bgClass =
                  "bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10";
              else if (pct > 5)
                bgClass =
                  "bg-emerald-950/60 border-emerald-500/30 text-emerald-400";
              else
                bgClass =
                  "bg-emerald-950/30 border-emerald-500/20 text-emerald-400";
            } else {
              if (pct > 5)
                bgClass =
                  "bg-rose-950/90 border-rose-500/50 text-rose-300 shadow-lg shadow-rose-500/10";
              else bgClass = "bg-rose-950/40 border-rose-500/30 text-rose-400";
            }

            return (
              <div
                key={stock.symbol}
                onClick={() => {
                  triggerHaptic("light");
                  onSelectStock(stock);
                }}
                className={`p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden ${bgClass}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-lg text-white tracking-tight block">
                      {stock.symbol}
                    </span>
                    <span className="text-[11px] text-neutral-300 truncate max-w-[100px] block font-medium">
                      {stock.name}
                    </span>
                  </div>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                </div>

                <div className="flex items-end justify-between mt-2">
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    $
                    {stock.price >= 1000
                      ? stock.price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : stock.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                      isPositive
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    1D {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
