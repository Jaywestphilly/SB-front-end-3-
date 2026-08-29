import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { StockTicker, TimeFrame, PaperTrade, StockDetailSubProps } from "../../types";
import { getTickerSentiment } from "../../utils/sentiment";
import { formatChartTimestamp, calculateCleanYAxisTicks } from "../../utils/chartFormatters";
import {
  X,
  Share2,
  Pin,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Zap,
  Briefcase,
  Calculator,
  Plus,
  Trash2,
  Check,
  DollarSign,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Terminal,
  Activity,
  Building2,
  Landmark,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  BarChart3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Calendar,
  Clock,
  Bell,
  BellRing,
  Target,
  ThumbsUp,
  Award,
  RotateCw,
  AlertTriangle,
  Loader2,
  Newspaper,
  PenTool,
  LineChart,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { getInstitutionalDataForStock } from "../../utils/institutionalHelper";

const PIE_COLORS = [
  "#10b981",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#f43f5e",
  "#a855f7",
  "#84cc16",
];

// Relative Strength Index (RSI 14) Calculation Helper
const calculateRSI = (
  priceList: number[],
  period = 14,
): { rsi: number; status: "Oversold" | "Neutral" | "Overbought" } => {
  if (!priceList || priceList.length < 2) {
    return { rsi: 50, status: "Neutral" };
  }

  const effectivePeriod = Math.min(period, priceList.length - 1);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= effectivePeriod; i++) {
    const diff = priceList[i] - priceList[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / effectivePeriod;
  let avgLoss = losses / effectivePeriod;

  for (let i = effectivePeriod + 1; i < priceList.length; i++) {
    const diff = priceList[i] - priceList[i - 1];
    const currentGain = diff >= 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (effectivePeriod - 1) + currentGain) / effectivePeriod;
    avgLoss = (avgLoss * (effectivePeriod - 1) + currentLoss) / effectivePeriod;
  }

  let currentRSI = 50;
  if (avgGain === 0 && avgLoss === 0) {
    currentRSI = 50;
  } else if (avgLoss === 0) {
    currentRSI = 100;
  } else {
    const rs = avgGain / avgLoss;
    currentRSI = 100 - 100 / (1 + rs);
  }

  const finalRSI = Math.min(100, Math.max(0, Math.round(currentRSI * 10) / 10));
  let status: "Oversold" | "Neutral" | "Overbought" = "Neutral";
  if (finalRSI >= 70) status = "Overbought";
  else if (finalRSI <= 30) status = "Oversold";

  return { rsi: finalRSI, status };
};

interface StockDetailModalProps {
  stock: StockTicker | null;
  onClose: () => void;
  onTogglePin: (symbol: string) => void;
  onShare: (stock: StockTicker) => void;
  onOpenBloombergTerminal?: (stock: StockTicker) => void;
  onOpenBrokerages?: (stock: StockTicker) => void;
}



export const PriceChart = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;
  if (!stock) return null;
  return (
    <>
{/* Interactive SVG Line & Candlestick Chart Stage */}
              <div className="relative bg-[#0b0e17] border border-slate-800 rounded-2xl p-4 overflow-hidden shadow-2xl">
                {/* Controls Bar: Timeframe & Technical Indicator Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80 text-xs">
                  {/* Timeframe Selector & Chart Type Indicator */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#121624] p-1 rounded-xl border border-slate-800">
                      {(["1D", "1W", "1M", "1Y", "ALL"] as TimeFrame[]).map(
                        (tf) => (
                          <button
                            key={tf}
                            onClick={() => {
                              triggerHaptic("selection");
                              setTimeframe(tf);
                              setHoverIndex(null);
                            }}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-95 text-xs font-mono font-bold ${
                              timeframe === tf
                                ? "bg-slate-700 text-white font-black shadow-sm"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            }`}
                          >
                            {tf}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Technical Indicator Toggles */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 50-Day SMA Toggle */}
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setShowSMA(!showSMA);
                      }}
                      className={`px-2.5 py-1.2 rounded-lg border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                        showSMA
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                          : "bg-[#121624] text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>50 SMA</span>
                    </button>

                    {/* VWAP Toggle */}
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setShowVWAP(!showVWAP);
                      }}
                      className={`px-2.5 py-1.2 rounded-lg border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                        showVWAP
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/40"
                          : "bg-[#121624] text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>VWAP</span>
                    </button>

                    {/* RSI Toggle */}
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setShowRSI(!showRSI);
                      }}
                      className={`px-2.5 py-1.2 rounded-lg border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                        showRSI
                          ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                          : "bg-[#121624] text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-sky-400" />
                      <span>RSI (14)</span>
                    </button>

                    {/* Trendline Tool Toggle */}
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setIsTrendlineActive(!isTrendlineActive);
                      }}
                      className={`px-2.5 py-1.2 rounded-lg border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                        isTrendlineActive
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                          : "bg-[#121624] text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span>Trendline</span>
                    </button>

                    {/* Benchmark Overlay Toggle */}
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setShowOverlay(!showOverlay);
                        setHoverIndex(null);
                      }}
                      className={`px-2.5 py-1.2 rounded-lg border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                        showOverlay
                          ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                          : "bg-[#121624] text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Overlay</span>
                    </button>

                    {/* Benchmark Selector Pills when Overlay is ON */}
                    {showOverlay && (
                      <div className="flex items-center gap-1 bg-[#121624] p-1 rounded-lg border border-slate-800">
                        {(["SPY", "QQQ", "DIA"] as const).map((sym) => {
                          const isActive = benchmarkSymbol === sym;
                          return (
                            <button
                              key={sym}
                              onClick={() => {
                                triggerHaptic("selection");
                                setBenchmarkSymbol(sym);
                                setHoverIndex(null);
                              }}
                              className={`px-2 py-0.5 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? "bg-slate-700 text-white"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              vs {sym}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Historical Benchmark Legend & Alpha Banner */}
                {showOverlay && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#030e1a]/90 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Main Stock Return */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-1 rounded-full"
                          style={{
                            backgroundColor: isPositive ? "#00ff88" : "#ff3b3b",
                          }}
                        />
                        <span className="font-extrabold text-white">
                          ${stock.symbol}:
                        </span>
                        <span
                          className={`font-black ${hoveredStockReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {hoveredStockReturn >= 0 ? "+" : ""}
                          {hoveredStockReturn.toFixed(2)}%
                        </span>
                      </div>

                      <span className="text-neutral-600">|</span>

                      {/* Benchmark Return */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-0.5 border-t-2 border-dashed"
                          style={{ borderColor: activeBenchmark.color }}
                        />
                        <span className="font-extrabold text-neutral-200">
                          {benchmarkSymbol}:
                        </span>
                        <span
                          className={`font-black ${hoveredBenchReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {hoveredBenchReturn >= 0 ? "+" : ""}
                          {hoveredBenchReturn.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Relative Alpha Performance Badge */}
                    <div
                      className={`px-2 py-0.5 rounded-lg border text-[11px] font-black flex items-center gap-1 ${
                        hoveredAlpha >= 0
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      <span>Alpha:</span>
                      <span>
                        {hoveredAlpha >= 0 ? "+" : ""}
                        {hoveredAlpha.toFixed(2)}%
                      </span>
                      <span className="text-[9px] uppercase font-bold opacity-80">
                        vs {benchmarkSymbol}
                      </span>
                    </div>
                  </div>
                )}

                {/* TradingView High Density Header HUD */}
                <div className="mb-2 p-2 rounded-lg bg-[#0d101b] border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-slate-400">
                        {stock.symbol} ({activeCandle.time}):
                      </span>
                    </span>
                    <span className="text-slate-400">
                      O{" "}
                      <strong className="text-slate-200">
                        ${activeCandle.open.toFixed(2)}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      H{" "}
                      <strong className="text-emerald-400">
                        ${activeCandle.high.toFixed(2)}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      L{" "}
                      <strong className="text-rose-400">
                        ${activeCandle.low.toFixed(2)}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      C{" "}
                      <strong
                        className={
                          activeCandle.isUp
                            ? "text-emerald-400 font-bold"
                            : "text-rose-400 font-bold"
                        }
                      >
                        ${activeCandle.close.toFixed(2)}
                      </strong>
                    </span>

                    {showSMA && activeSma !== undefined && (
                      <span className="text-slate-400 border-l border-slate-800 pl-2.5">
                        SMA(50){" "}
                        <strong className="text-amber-300">
                          ${activeSma.toFixed(2)}
                        </strong>
                      </span>
                    )}
                    {showVWAP && activeVwap !== undefined && (
                      <span className="text-slate-400 border-l border-slate-800 pl-2.5">
                        VWAP{" "}
                        <strong className="text-indigo-300">
                          ${activeVwap.toFixed(2)}
                        </strong>
                      </span>
                    )}
                    {showRSI && activeRsi !== undefined && (
                      <span className="text-slate-400 border-l border-slate-800 pl-2.5">
                        RSI(14){" "}
                        <strong
                          className={
                            activeRsi >= 70
                              ? "text-amber-300 font-bold"
                              : activeRsi <= 30
                                ? "text-emerald-300 font-bold"
                                : "text-sky-300 font-bold"
                          }
                        >
                          {activeRsi.toFixed(1)}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-[#121624] p-0.5 rounded border border-slate-800">
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          const next = Math.max(
                            1.0,
                            Number((zoomLevel - 0.5).toFixed(1)),
                          );
                          setZoomLevel(next);
                          if (next === 1.0) setPanOffset(0.0);
                        }}
                        disabled={zoomLevel <= 1.0}
                        title="Zoom Out"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-1 text-[11px] font-mono text-slate-300 min-w-[28px] text-center">
                        {zoomLevel.toFixed(1)}x
                      </span>

                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          setZoomLevel((z) =>
                            Math.min(5.0, Number((z + 0.5).toFixed(1))),
                          );
                        }}
                        disabled={zoomLevel >= 5.0}
                        title="Zoom In"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {zoomLevel > 1.01 && (
                        <button
                          onClick={() => {
                            triggerHaptic("selection");
                            setZoomLevel(1.0);
                            setPanOffset(0.0);
                          }}
                          title="Reset Zoom"
                          className="p-1 ml-0.5 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer text-[10px] font-bold"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${activeCandle.isUp ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"}`}
                    >
                      {activeCandle.isUp ? "+" : ""}
                      {activeCandle.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Interactive Chart Stage with Pinch-to-Zoom & Pan */}
                <div
                  className="relative w-full h-48 select-none touch-none cursor-crosshair overflow-hidden rounded-xl border border-white/10"
                  style={{ touchAction: "none" }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheelZoom}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    handleMouseUp();
                    setHoverIndex(null);
                  }}
                >
                  {/* Floating Gesture & Zoom Indicator */}
                  <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg backdrop-blur-md pointer-events-none">
                    {zoomLevel > 1.05 ? (
                      <>
                        <Move className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>
                          Zoomed {zoomLevel.toFixed(1)}x • Drag to Pan
                        </span>
                      </>
                    ) : (
                      <>
                        <ZoomIn className="w-3 h-3 text-cyan-400" />
                        <span>Pinch or scroll to Zoom</span>
                      </>
                    )}
                  </div>

                  {/* Floating Guidance for Trendline Tool */}
                  {isTrendlineActive && (
                    <div className="absolute top-2 right-16 z-10 px-2.5 py-1 rounded-lg bg-yellow-950/90 border border-yellow-500/50 text-[10px] font-mono text-yellow-300 flex items-center gap-1.5 shadow-lg backdrop-blur-md pointer-events-none">
                      <PenTool className="w-3 h-3 text-yellow-400 animate-bounce" />
                      <span>
                        {trendline
                          ? "Drag to re-draw line"
                          : "Click & drag across chart to draw line"}
                      </span>
                    </div>
                  )}

                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-full overflow-visible"
                  >
                    <defs>
                      <linearGradient
                        id="chartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#06b6d4"
                          stopOpacity="0.4"
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                      <linearGradient
                        id="rhGradientUp"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#00c805"
                          stopOpacity="0.45"
                        />
                        <stop
                          offset="100%"
                          stopColor="#00c805"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                      <linearGradient
                        id="rhGradientDown"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ff3b30"
                          stopOpacity="0.45"
                        />
                        <stop
                          offset="100%"
                          stopColor="#ff3b30"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>

                    {/* Dark TradingView Background Canvas */}
                    <rect
                      x="0"
                      y="0"
                      width={svgWidth}
                      height={svgHeight}
                      fill="#090d16"
                    />

                    {/* Horizontal Grid Lines & Y-Axis Scale */}
                    {yAxisTicks.map((tick, i) => (
                      <g key={tick.label + "_" + i}>
                        <line
                          x1="0"
                          y1={tick.y}
                          x2={plotWidth}
                          y2={tick.y}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={plotWidth + 6}
                          y={tick.y + 3}
                          fill="rgba(255, 255, 255, 0.45)"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* Zero % Baseline line when Overlay is ON */}
                    {showOverlay && (
                      <>
                        <line
                          x1="0"
                          y1={zeroY}
                          x2={plotWidth}
                          y2={zeroY}
                          stroke="rgba(255, 255, 255, 0.25)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={plotWidth - 80}
                          y={zeroY - 4}
                          fill="rgba(255, 255, 255, 0.5)"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          0.0% Baseline
                        </text>
                      </>
                    )}

                    {/* Vertical Time Gridlines */}
                    {timeTicks.map((tick, i) => (
                      <line
                        key={`vtick-${i}`}
                        x1={tick.x}
                        y1="0"
                        x2={tick.x}
                        y2={plotBottom}
                        stroke="rgba(255, 255, 255, 0.04)"
                        strokeDasharray="2 2"
                      />
                    ))}

                    {/* Volume Histogram Baseline */}
                    <line
                      x1="0"
                      y1={plotBottom}
                      x2={plotWidth}
                      y2={plotBottom}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="1"
                    />

                    {/* Bottom Volume Histogram Bars */}
                    <g>
                      {candleOHLCData.map((c, idx) => {
                        const x =
                          (idx / Math.max(1, candleOHLCData.length - 1)) *
                          plotWidth;
                        const pointSpacing =
                          plotWidth / Math.max(1, candleOHLCData.length - 1);
                        const barW = Math.max(2, pointSpacing * 0.65);
                        const vol = c.volume || 1000;
                        const volH = Math.max(2, (vol / maxVolume) * 22);
                        const volY = plotBottom - volH;
                        const color = c.isUp
                          ? "rgba(0, 200, 5, 0.28)"
                          : "rgba(255, 80, 0, 0.28)";
                        return (
                          <rect
                            key={`vol-${idx}`}
                            x={x - barW / 2}
                            y={volY}
                            width={barW}
                            height={volH}
                            fill={color}
                            rx="0.5"
                          />
                        );
                      })}
                    </g>

                    {/* X-Axis Time Ticks along bottom */}
                    <g>
                      {timeTicks.map((tick, i) => (
                        <text
                          key={`time-tick-${i}`}
                          x={tick.x}
                          y={plotBottom + 16}
                          textAnchor="middle"
                          fill="rgba(255, 255, 255, 0.45)"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {tick.label}
                        </text>
                      ))}
                    </g>

                    {/* Benchmark Overlay Path */}
                    {showOverlay && benchmarkPathD && (
                      <path
                        d={benchmarkPathD}
                        fill="none"
                        stroke={activeBenchmark.color}
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* 50-Day Simple Moving Average (SMA) Overlay Line */}
                    {showSMA && smaPathD && (
                      <g className="pointer-events-none">
                        <path
                          d={smaPathD}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-150 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                        />
                        {/* Interactive Hover indicator dot on SMA Line */}
                        {hoverIndex !== null &&
                          visibleSmaValues[hoverIndex] !== undefined && (
                            <circle
                              cx={
                                (hoverIndex /
                                  Math.max(1, visibleSmaValues.length - 1)) *
                                plotWidth
                              }
                              cy={
                                plotBottom -
                                ((visibleSmaValues[hoverIndex] - minVal) /
                                  valRange) *
                                  plotHeight
                              }
                              r="4.5"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )}
                      </g>
                    )}

                    {/* Volume-Weighted Average Price (VWAP) Overlay Line */}
                    {showVWAP && vwapPathD && (
                      <g className="pointer-events-none">
                        <path
                          d={vwapPathD}
                          fill="none"
                          stroke="#c084fc"
                          strokeWidth="2.5"
                          strokeDasharray="5 3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-all duration-150 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]"
                        />
                        {/* Interactive Hover indicator dot on VWAP Line */}
                        {hoverIndex !== null &&
                          visibleVwapValues[hoverIndex] !== undefined && (
                            <circle
                              cx={
                                (hoverIndex /
                                  Math.max(1, visibleVwapValues.length - 1)) *
                                plotWidth
                              }
                              cy={
                                plotBottom -
                                ((visibleVwapValues[hoverIndex] - minVal) /
                                  valRange) *
                                  plotHeight
                              }
                              r="4.5"
                              fill="#c084fc"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )}
                      </g>
                    )}

                    {/* TRADINGVIEW HIGH-TECH SVG CANDLESTICK CHART */}
                    <g>
                      {/* Candlesticks */}
                      {candleOHLCData.map((c, idx) => {
                        const x = (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
                        const yOpen = plotBottom - ((c.open - minVal) / valRange) * plotHeight;
                        const yClose = plotBottom - ((c.close - minVal) / valRange) * plotHeight;
                        const yHigh = plotBottom - ((c.high - minVal) / valRange) * plotHeight;
                        const yLow = plotBottom - ((c.low - minVal) / valRange) * plotHeight;
                        
                        const isUp = c.close >= c.open;
                        const color = isUp ? "#10b981" : "#ef4444";

                        const rectY = Math.min(yOpen, yClose);
                        const rectHeight = Math.max(1, Math.abs(yOpen - yClose));
                        
                        const pointSpacing = plotWidth / Math.max(1, candleOHLCData.length - 1);
                        const barW = Math.max(1, pointSpacing * 0.7);
                        
                        return (
                          <g key={`candle-${idx}`}>
                            {/* Wick */}
                            <line
                              x1={x}
                              y1={yHigh}
                              x2={x}
                              y2={yLow}
                              stroke={color}
                              strokeWidth={Math.max(1, barW * 0.2)}
                            />
                            {/* Body */}
                            <rect
                              x={x - barW / 2}
                              y={rectY}
                              width={barW}
                              height={rectHeight}
                              fill={isUp ? color : color}
                              stroke={color}
                              strokeWidth={1}
                              rx={barW > 3 ? 1 : 0}
                            />
                          </g>
                        );
                      })}
                      
                      {/* Live Current Price Horizontal Line */}
                      {candleOHLCData.length > 0 && (
                        <line
                          x1={0}
                          y1={plotBottom - ((candleOHLCData[candleOHLCData.length - 1].close - minVal) / valRange) * plotHeight}
                          x2={plotWidth}
                          y2={plotBottom - ((candleOHLCData[candleOHLCData.length - 1].close - minVal) / valRange) * plotHeight}
                          stroke={candleOHLCData[candleOHLCData.length - 1].close >= candleOHLCData[candleOHLCData.length - 1].open ? "#10b981" : "#ef4444"}
                          strokeDasharray="4 4"
                          strokeWidth="1"
                          opacity="0.5"
                        />
                      )}
                      
                      {/* Interactive Scrubbing Columns */}
                      {candleOHLCData.map((_, idx) => {
                        const x = (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
                        const pointSpacing = plotWidth / Math.max(1, candleOHLCData.length - 1);
                        const rectW = Math.max(4, pointSpacing);
                        return (
                          <rect
                            key={`scrub-col-${idx}`}
                            x={x - rectW / 2}
                            y="0"
                            width={rectW}
                            height={plotBottom}
                            fill="transparent"
                            className="cursor-crosshair"
                            onMouseEnter={() => setHoverIndex(idx)}
                            onTouchStart={() => setHoverIndex(idx)}
                          />
                        );
                      })}
                    </g>

                    {/* Live Current Price Scale Badge */}
                    {activeStock && (
                      <g
                        transform={`translate(${plotWidth + 2}, ${plotBottom - ((activeStock.price - minVal) / valRange) * plotHeight - 9})`}
                      >
                        <rect
                          x="0"
                          y="0"
                          width="58"
                          height="18"
                          rx="4"
                          fill={isPositive ? "#00c805" : "#ff3b30"}
                          className="shadow-md"
                        />
                        <text
                          x="29"
                          y="12"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ${activeStock.price.toFixed(2)}
                        </text>
                      </g>
                    )}

                    {/* TRADINGVIEW DYNAMIC CROSSHAIR & AXIS MAGNET BADGES */}
                    {hoverIndex !== null && activeCandle && (
                      <g className="pointer-events-none">
                        {/* Vertical Crosshair Line */}
                        <line
                          x1={
                            (hoverIndex /
                              Math.max(1, candleOHLCData.length - 1)) *
                            plotWidth
                          }
                          y1="0"
                          x2={
                            (hoverIndex /
                              Math.max(1, candleOHLCData.length - 1)) *
                            plotWidth
                          }
                          y2={265}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />
                        {/* Horizontal Crosshair Line */}
                        <line
                          x1="0"
                          y1={
                            plotBottom -
                            ((activeCandle.close - minVal) / valRange) *
                              plotHeight
                          }
                          x2={plotWidth}
                          y2={
                            plotBottom -
                            ((activeCandle.close - minVal) / valRange) *
                              plotHeight
                          }
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />
                        {/* Right Y-Axis Hover Price Badge */}
                        <g
                          transform={`translate(${plotWidth + 2}, ${plotBottom - ((activeCandle.close - minVal) / valRange) * plotHeight - 10})`}
                        >
                          <rect
                            x="0"
                            y="0"
                            width="58"
                            height="20"
                            rx="4"
                            fill="#0f172a"
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                          />
                          <text
                            x="29"
                            y="13"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            ${activeCandle.close.toFixed(2)}
                          </text>
                        </g>
                        {/* Bottom X-Axis Hover Timestamp Badge */}
                        <g
                          transform={`translate(${Math.max(25, Math.min(plotWidth - 35, (hoverIndex / Math.max(1, candleOHLCData.length - 1)) * plotWidth)) - 30}, 266)`}
                        >
                          <rect
                            x="0"
                            y="0"
                            width="60"
                            height="14"
                            rx="3"
                            fill="#0f172a"
                            stroke="#38bdf8"
                            strokeWidth="1"
                          />
                          <text
                            x="30"
                            y="10"
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {activeCandle.time}
                          </text>
                        </g>
                      </g>
                    )}

                    {/* Interactive User Trendline Overlay */}
                    {trendline && (
                      <g className="pointer-events-none">
                        {/* Outer Glow */}
                        <line
                          x1={trendline.x1}
                          y1={trendline.y1}
                          x2={trendline.x2}
                          y2={trendline.y2}
                          stroke={
                            trendlineMetrics?.isBullish ? "#00ff88" : "#ff3b3b"
                          }
                          strokeWidth="6"
                          strokeOpacity="0.35"
                          strokeLinecap="round"
                        />
                        {/* Core Line */}
                        <line
                          x1={trendline.x1}
                          y1={trendline.y1}
                          x2={trendline.x2}
                          y2={trendline.y2}
                          stroke={
                            trendlineMetrics?.isBullish ? "#00ff88" : "#ff3b3b"
                          }
                          strokeWidth="2.5"
                          strokeDasharray={isDrawingTrendline ? "4 2" : "none"}
                          strokeLinecap="round"
                        />
                        {/* Start Endpoint Handle */}
                        <circle
                          cx={trendline.x1}
                          cy={trendline.y1}
                          r="5"
                          fill={
                            trendlineMetrics?.isBullish ? "#00ff88" : "#ff3b3b"
                          }
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* End Endpoint Handle */}
                        <circle
                          cx={trendline.x2}
                          cy={trendline.y2}
                          r="5"
                          fill={
                            trendlineMetrics?.isBullish ? "#00ff88" : "#ff3b3b"
                          }
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        {/* Midpoint Slope Label Badge */}
                        {Math.hypot(
                          trendline.x2 - trendline.x1,
                          trendline.y2 - trendline.y1,
                        ) > 25 &&
                          trendlineMetrics && (
                            <g
                              transform={`translate(${(trendline.x1 + trendline.x2) / 2}, ${(trendline.y1 + trendline.y2) / 2 - 12})`}
                            >
                              <rect
                                x="-60"
                                y="-11"
                                width="120"
                                height="22"
                                rx="6"
                                fill="#09090b"
                                stroke={
                                  trendlineMetrics.isBullish
                                    ? "#00ff88"
                                    : "#ff3b3b"
                                }
                                strokeWidth="1.5"
                                fillOpacity="0.95"
                              />
                              <text
                                x="0"
                                y="3"
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {trendlineMetrics.isBullish ? "▲ " : "▼ "}
                                {trendlineMetrics.priceSlopePerBar >= 0
                                  ? "+"
                                  : ""}
                                {trendlineMetrics.priceSlopePerBar.toFixed(2)}
                                /candle (
                                {trendlineMetrics.percentChange >= 0 ? "+" : ""}
                                {trendlineMetrics.percentChange.toFixed(1)}%)
                              </text>
                            </g>
                          )}
                      </g>
                    )}
                  </svg>
                </div>

                {/* Trendline Slope & Technical Analysis Display Panel */}
                {trendline && trendlineMetrics && (
                  <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-neutral-950 via-yellow-950/20 to-neutral-950 border border-yellow-500/30 font-mono text-xs text-neutral-200 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider">
                        <PenTool className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Trendline Analysis</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-neutral-400 font-sans">
                          Points:
                        </span>
                        <span className="font-bold text-white">
                          ${trendline.price1.toFixed(2)} ({trendline.time1}) → $
                          {trendline.price2.toFixed(2)} ({trendline.time2})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Price Difference & % */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10">
                        <span className="text-neutral-400 text-[10px] uppercase font-sans">
                          Total Δ:
                        </span>
                        <span
                          className={`font-black ${trendlineMetrics.isBullish ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {trendlineMetrics.isBullish ? "+" : ""}$
                          {trendlineMetrics.priceDiff.toFixed(2)} (
                          {trendlineMetrics.isBullish ? "+" : ""}
                          {trendlineMetrics.percentChange.toFixed(2)}%)
                        </span>
                      </div>

                      {/* Calculated Slope per Candle */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 border border-yellow-500/30">
                        <span className="text-yellow-400 text-[10px] uppercase font-sans font-bold">
                          Slope:
                        </span>
                        <span
                          className={`font-black ${trendlineMetrics.isBullish ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {trendlineMetrics.isBullish ? "+" : ""}$
                          {trendlineMetrics.priceSlopePerBar.toFixed(2)} /
                          candle
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          ({trendlineMetrics.percentSlopePerBar >= 0 ? "+" : ""}
                          {trendlineMetrics.percentSlopePerBar.toFixed(2)}%/bar)
                        </span>
                      </div>

                      {/* Trajectory Angle */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-950/50 text-yellow-300 border border-yellow-500/30 text-[10px] font-bold">
                        <span>Trajectory:</span>
                        <span>
                          {trendlineMetrics.angleDeg >= 0 ? "+" : ""}
                          {trendlineMetrics.angleDeg.toFixed(1)}°
                        </span>
                      </div>

                      {/* Clear Button */}
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          setTrendline(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Clear trendline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mini Timeline Viewport Slider when Zoomed In */}
                {zoomLevel > 1.05 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                      <span>Start</span>
                      <span className="text-cyan-300 font-extrabold flex items-center gap-1">
                        Showing {candleOHLCData.length} of{" "}
                        {fullCandleOHLCData.length} Candles (
                        {Math.round(
                          (candleOHLCData.length / fullCandleOHLCData.length) *
                            100,
                        )}
                        % View)
                      </span>
                      <span>Latest</span>
                    </div>
                    <div
                      className="relative w-full h-2.5 rounded-full bg-neutral-950 border border-cyan-500/30 overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(
                          0,
                          Math.min(1, clickX / rect.width),
                        );
                        setPanOffset(Number(pct.toFixed(3)));
                      }}
                    >
                      <div
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all shadow-[0_0_8px_#06b6d4]"
                        style={{
                          left: `${panOffset * (100 - 100 / zoomLevel)}%`,
                          width: `${Math.max(10, 100 / zoomLevel)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Relative Strength Index (RSI 14) Visual Gauge & Subchart Indicator */}
              <div className="p-4 rounded-2xl bg-[#030e1a]/90 border border-cyan-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Activity className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-cyan-200 uppercase tracking-wider block">
                        Relative Strength Index (RSI 14)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Technical Momentum & Overbought / Oversold Oscillator
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black font-mono px-3 py-1 rounded-xl flex items-center gap-1.5 border ${activeRsiStatus.color}`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>RSI: {activeRsi.toFixed(1)}</span>
                      <span className="uppercase font-bold text-[10px]">
                        ({activeRsiStatus.label})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Interactive RSI Subchart SVG Stage */}
                {showRSI && (
                  <div
                    className="relative w-full h-[110px] select-none touch-none cursor-crosshair overflow-hidden bg-black/60 rounded-xl border border-cyan-500/20"
                    onMouseMove={(e) => handleSubchartHover(e, e.currentTarget)}
                    onTouchMove={(e) => handleSubchartHover(e, e.currentTarget)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <svg
                      viewBox={`0 0 ${svgWidth} ${rsiSvgHeight}`}
                      className="w-full h-full overflow-visible"
                    >
                      {/* Dark Background Canvas */}
                      <rect
                        x="0"
                        y="0"
                        width={svgWidth}
                        height={rsiSvgHeight}
                        fill="#070b14"
                      />

                      {/* Overbought 70% Shaded Zone */}
                      <rect
                        x="0"
                        y="0"
                        width={plotWidth}
                        height={getRsiY(70)}
                        fill="rgba(245, 158, 11, 0.08)"
                      />

                      {/* Oversold 30% Shaded Zone */}
                      <rect
                        x="0"
                        y={getRsiY(30)}
                        width={plotWidth}
                        height={rsiSvgHeight - getRsiY(30)}
                        fill="rgba(16, 185, 129, 0.08)"
                      />

                      {/* 70% Overbought Threshold Line */}
                      <line
                        x1="0"
                        y1={getRsiY(70)}
                        x2={plotWidth}
                        y2={getRsiY(70)}
                        stroke="rgba(245, 158, 11, 0.5)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={plotWidth + 6}
                        y={getRsiY(70) + 3}
                        fill="rgba(245, 158, 11, 0.85)"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        70 OB
                      </text>

                      {/* 50% Centerline */}
                      <line
                        x1="0"
                        y1={getRsiY(50)}
                        x2={plotWidth}
                        y2={getRsiY(50)}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      />
                      <text
                        x={plotWidth + 6}
                        y={getRsiY(50) + 3}
                        fill="rgba(255, 255, 255, 0.4)"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        50
                      </text>

                      {/* 30% Oversold Threshold Line */}
                      <line
                        x1="0"
                        y1={getRsiY(30)}
                        x2={plotWidth}
                        y2={getRsiY(30)}
                        stroke="rgba(16, 185, 129, 0.5)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={plotWidth + 6}
                        y={getRsiY(30) + 3}
                        fill="rgba(16, 185, 129, 0.85)"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        30 OS
                      </text>

                      {/* Active Hover vertical guide */}
                      {hoverIndex !== null && (
                        <line
                          x1={
                            (hoverIndex /
                              Math.max(1, visibleRsiValues.length - 1)) *
                            plotWidth
                          }
                          y1="0"
                          x2={
                            (hoverIndex /
                              Math.max(1, visibleRsiValues.length - 1)) *
                            plotWidth
                          }
                          y2={rsiSvgHeight}
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* RSI Line Path */}
                      {rsiLinePath && (
                        <path
                          d={rsiLinePath}
                          fill="none"
                          stroke="#00f2ff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="drop-shadow-[0_0_8px_rgba(0,242,255,0.7)]"
                        />
                      )}

                      {/* Hover indicator dot & Y-Axis Scale Badge */}
                      {hoverIndex !== null &&
                        visibleRsiValues[hoverIndex] !== undefined && (
                          <g className="pointer-events-none">
                            <circle
                              cx={
                                (hoverIndex /
                                  Math.max(1, visibleRsiValues.length - 1)) *
                                plotWidth
                              }
                              cy={getRsiY(visibleRsiValues[hoverIndex])}
                              r="4.5"
                              fill="#38bdf8"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className="animate-pulse"
                            />
                            <g
                              transform={`translate(${plotWidth + 2}, ${Math.max(4, Math.min(rsiSvgHeight - 20, getRsiY(visibleRsiValues[hoverIndex]) - 9))})`}
                            >
                              <rect
                                x="0"
                                y="0"
                                width="58"
                                height="18"
                                rx="4"
                                fill="#0f172a"
                                stroke="#38bdf8"
                                strokeWidth="1.2"
                              />
                              <text
                                x="29"
                                y="12"
                                textAnchor="middle"
                                fill={
                                  visibleRsiValues[hoverIndex] >= 70
                                    ? "#f59e0b"
                                    : visibleRsiValues[hoverIndex] <= 30
                                      ? "#10b981"
                                      : "#38bdf8"
                                }
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                RSI {visibleRsiValues[hoverIndex].toFixed(1)}
                              </text>
                            </g>
                          </g>
                        )}
                    </svg>
                  </div>
                )}

                {/* RSI Visual Spectrum Gauge */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative w-full h-3.5 rounded-full bg-neutral-900 overflow-hidden border border-white/10 flex">
                    {/* 0-30 Oversold Zone */}
                    <div
                      className="w-[30%] h-full bg-gradient-to-r from-emerald-600 to-emerald-400/80 opacity-80"
                      title="Oversold Zone (0 30)"
                    />
                    {/* 30-70 Neutral Zone */}
                    <div
                      className="w-[40%] h-full bg-gradient-to-r from-cyan-900 via-slate-700 to-cyan-900 opacity-60"
                      title="Neutral Zone (30 70)"
                    />
                    {/* 70-100 Overbought Zone */}
                    <div
                      className="w-[30%] h-full bg-gradient-to-r from-amber-500 to-rose-600 opacity-80"
                      title="Overbought Zone (70 100)"
                    />

                    {/* Threshold mark lines */}
                    <div className="absolute left-[30%] top-0 bottom-0 w-0.5 bg-emerald-300 z-10 shadow-[0_0_8px_#10b981]" />
                    <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-amber-300 z-10 shadow-[0_0_8px_#f59e0b]" />

                    {/* Pointer Pin */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_12px_#00f2ff] z-20 transition-all duration-300"
                      style={{
                        left: `${Math.min(98, Math.max(2, activeRsi))}%`,
                      }}
                    />
                  </div>

                  {/* Threshold Labels */}
                  <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-400 px-0.5">
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                      <span>0</span>
                      <span className="text-[9px] text-emerald-300/80">
                        (Oversold ≤30)
                      </span>
                    </span>
                    <span className="text-cyan-400 font-bold">50 Neutral</span>
                    <span className="text-amber-400 font-extrabold flex items-center gap-1">
                      <span className="text-[9px] text-amber-300/80">
                        (Overbought ≥70)
                      </span>
                      <span>100</span>
                    </span>
                  </div>
                </div>

                {/* Technical Condition Explanation */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-slate-200 flex items-start gap-2">
                  <div className="text-[11px] leading-relaxed">
                    {activeRsiStatus.label === "Overbought" && (
                      <span className="text-amber-200">
                        <strong className="text-amber-300 uppercase">
                          Overbought Warning ({activeRsi.toFixed(1)}):
                        </strong>{" "}
                        Stock price has expanded rapidly. High RSI indicates
                        strong momentum, but signals potential short term
                        exhaustion or consolidation risk.
                      </span>
                    )}
                    {activeRsiStatus.label === "Oversold" && (
                      <span className="text-emerald-200">
                        <strong className="text-emerald-300 uppercase">
                          Oversold Signal ({activeRsi.toFixed(1)}):
                        </strong>{" "}
                        Asset has experienced heavy downside pressure. Low RSI
                        indicates selling depletion, highlighting a potential
                        buy dip / rebound opportunity.
                      </span>
                    )}
                    {activeRsiStatus.label === "Neutral" && (
                      <span className="text-slate-300">
                        <strong className="text-cyan-300 uppercase">
                          Balanced Trend ({activeRsi.toFixed(1)}):
                        </strong>{" "}
                        RSI is oscillating smoothly in the 30 to 70 range,
                        reflecting market equilibrium between buyers and
                        sellers.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Moving Average Convergence Divergence (MACD 12, 26, 9) Panel */}
              <div className="p-4 rounded-2xl bg-[#030e1a]/90 border border-cyan-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-cyan-200 uppercase tracking-wider block">
                        MACD Indicator (12, 26, 9)
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Trend Momentum & Moving Average Crossover Signals
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-black font-mono px-2.5 py-1 rounded-xl flex items-center gap-1 border ${macdStatus.color}`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>{macdStatus.label}</span>
                    </span>
                  </div>
                </div>

                {/* MACD Value HUD Bar */}
                <div className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-3 flex-wrap text-[11px]">
                    <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" />
                      MACD Line:{" "}
                      <strong className="text-cyan-200">
                        {activeMacd.macd >= 0 ? "+" : ""}
                        {activeMacd.macd.toFixed(2)}
                      </strong>
                    </span>

                    <span className="flex items-center gap-1.5 text-fuchsia-300 font-bold">
                      <span className="w-2.5 h-0.5 bg-fuchsia-400 rounded-full" />
                      Signal Line:{" "}
                      <strong className="text-fuchsia-200">
                        {activeMacd.signal >= 0 ? "+" : ""}
                        {activeMacd.signal.toFixed(2)}
                      </strong>
                    </span>

                    <span className="flex items-center gap-1.5 font-bold">
                      <span
                        className={`w-2.5 h-2.5 rounded-sm ${activeMacd.histogram >= 0 ? "bg-emerald-400" : "bg-rose-500"}`}
                      />
                      Histogram:{" "}
                      <strong
                        className={
                          activeMacd.histogram >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
                        {activeMacd.histogram >= 0 ? "+" : ""}
                        {activeMacd.histogram.toFixed(2)}
                      </strong>
                    </span>
                  </div>

                  <span className="text-[10px] text-neutral-400 font-semibold">
                    Zero Line: <strong className="text-white">0.00</strong>
                  </span>
                </div>

                {/* Interactive MACD SVG Chart Stage */}
                <div
                  className="relative w-full h-[110px] select-none touch-none cursor-crosshair overflow-hidden bg-black/40 rounded-xl border border-cyan-500/20"
                  onMouseMove={(e) => handleSubchartHover(e, e.currentTarget)}
                  onTouchMove={(e) => handleSubchartHover(e, e.currentTarget)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <svg
                    viewBox={`0 0 ${svgWidth} ${macdSvgHeight}`}
                    className="w-full h-full overflow-visible"
                  >
                    {/* Zero-line baseline */}
                    <line
                      x1="0"
                      y1={macdY0}
                      x2={plotWidth}
                      y2={macdY0}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />

                    {/* Y-Axis Right Scale Ticks */}
                    <text
                      x={plotWidth + 6}
                      y={16}
                      fill="rgba(255, 255, 255, 0.45)"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      +{macdMaxAbs.toFixed(1)}
                    </text>
                    <text
                      x={plotWidth + 6}
                      y={macdY0 + 3}
                      fill="rgba(255, 255, 255, 0.55)"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      0.0
                    </text>
                    <text
                      x={plotWidth + 6}
                      y={macdSvgHeight - 8}
                      fill="rgba(255, 255, 255, 0.45)"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      -{macdMaxAbs.toFixed(1)}
                    </text>

                    {/* Active Hover vertical guide */}
                    {hoverIndex !== null && (
                      <line
                        x1={
                          (hoverIndex / Math.max(1, macdData.length - 1)) *
                          plotWidth
                        }
                        y1="0"
                        x2={
                          (hoverIndex / Math.max(1, macdData.length - 1)) *
                          plotWidth
                        }
                        y2={macdSvgHeight}
                        stroke="#00f2ff"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Histogram Vertical Bars */}
                    {macdData.map((d, i) => {
                      const x =
                        (i / Math.max(1, macdData.length - 1)) * plotWidth;
                      const barWidth = Math.max(
                        3,
                        Math.min(
                          16,
                          Math.floor(
                            (plotWidth / Math.max(1, macdData.length)) * 0.55,
                          ),
                        ),
                      );
                      const yVal = getMacdY(d.histogram);
                      const yTop = d.histogram >= 0 ? yVal : macdY0;
                      const h = Math.max(1.5, Math.abs(yVal - macdY0));
                      const isPositive = d.histogram >= 0;
                      const color = isPositive ? "#10b981" : "#f43f5e";

                      return (
                        <rect
                          key={`macd-hist-${i}`}
                          x={x - barWidth / 2}
                          y={yTop}
                          width={barWidth}
                          height={h}
                          fill={color}
                          opacity={hoverIndex === i ? 1 : 0.85}
                          rx="1"
                        />
                      );
                    })}

                    {/* MACD Line (Cyan) */}
                    {macdLinePath && (
                      <path
                        d={macdLinePath}
                        fill="none"
                        stroke="#00f2ff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_6px_rgba(0,242,255,0.6)]"
                      />
                    )}

                    {/* Signal Line (Fuchsia) */}
                    {macdSignalPath && (
                      <path
                        d={macdSignalPath}
                        fill="none"
                        stroke="#e879f9"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_6px_rgba(232,121,249,0.5)]"
                      />
                    )}

                    {/* Hover Points on MACD & Signal Lines & Y-Axis Hover Badge */}
                    {hoverIndex !== null && macdData[hoverIndex] && (
                      <g className="pointer-events-none">
                        <circle
                          cx={
                            (hoverIndex / Math.max(1, macdData.length - 1)) *
                            plotWidth
                          }
                          cy={getMacdY(macdData[hoverIndex].macd)}
                          r="3.5"
                          fill="#00f2ff"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={
                            (hoverIndex / Math.max(1, macdData.length - 1)) *
                            plotWidth
                          }
                          cy={getMacdY(macdData[hoverIndex].signal)}
                          r="3.5"
                          fill="#e879f9"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        {/* Active Right Y-Axis Badge */}
                        <g
                          transform={`translate(${plotWidth + 2}, ${Math.max(4, Math.min(macdSvgHeight - 20, getMacdY(macdData[hoverIndex].macd) - 9))})`}
                        >
                          <rect
                            x="0"
                            y="0"
                            width="58"
                            height="18"
                            rx="4"
                            fill="#0f172a"
                            stroke="#00f2ff"
                            strokeWidth="1.2"
                          />
                          <text
                            x="29"
                            y="12"
                            textAnchor="middle"
                            fill="#00f2ff"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {macdData[hoverIndex].histogram >= 0 ? "+" : ""}
                            {macdData[hoverIndex].histogram.toFixed(2)}
                          </text>
                        </g>
                      </g>
                    )}
                  </svg>
                </div>

                {/* MACD Signal Explanation Card */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 text-xs font-mono text-slate-200 flex items-start gap-2">
                  <div className="text-[11px] leading-relaxed">
                    {activeMacd.histogram >= 0 ? (
                      <span className="text-emerald-200">
                        <strong className="text-emerald-300 uppercase">
                          Bullish Momentum (+{activeMacd.histogram.toFixed(2)}):
                        </strong>{" "}
                        MACD line is trading above the signal line. Positive
                        histogram expansion indicates accelerating upward
                        pressure.
                      </span>
                    ) : (
                      <span className="text-rose-200">
                        <strong className="text-rose-300 uppercase">
                          Bearish Momentum ({activeMacd.histogram.toFixed(2)}):
                        </strong>{" "}
                        MACD line is trading below the signal line. Negative
                        histogram indicates downward pressure or pullbacks.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              
    </>
  );
};
