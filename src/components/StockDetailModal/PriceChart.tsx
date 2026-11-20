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
  CandlestickChart,
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



// Monotone cubic spline curve generator (Fritsch-Carlson)
function monotoneCubicCurve(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  if (n === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  const deltas: number[] = new Array(n - 1);
  const dxs: number[] = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    dxs[i] = dx;
    deltas[i] = dx !== 0 ? dy / dx : 0;
  }

  const m: number[] = new Array(n);
  m[0] = deltas[0];
  m[n - 1] = deltas[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (deltas[i - 1] * deltas[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (deltas[i - 1] + deltas[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / deltas[i];
      const beta = m[i + 1] / deltas[i];
      const sumSq = alpha * alpha + beta * beta;
      if (sumSq > 9) {
        const tau = 3 / Math.sqrt(sumSq);
        m[i] = tau * alpha * deltas[i];
        m[i + 1] = tau * beta * deltas[i];
      }
    }
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = dxs[i] / 3;
    const cp1x = (p0.x + dx).toFixed(2);
    const cp1y = (p0.y + m[i] * dx).toFixed(2);
    const cp2x = (p1.x - dx).toFixed(2);
    const cp2y = (p1.y - m[i + 1] * dx).toFixed(2);
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return d;
}

function smoothPathD(pathStr: string): string {
  if (!pathStr) return "";
  const points: { x: number; y: number }[] = [];
  const regex = /[ML]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(pathStr)) !== null) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  if (points.length < 2) return pathStr;
  return monotoneCubicCurve(points);
}

export const PriceChart = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;

  // Monotone cubic smoothed paths for price and indicator lines
  const smoothedLineD = useMemo(() => {
    if (candleOHLCData && candleOHLCData.length > 0) {
      const points = candleOHLCData.map((c, idx) => ({
        x: (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth,
        y: plotBottom - ((c.close - minVal) / valRange) * plotHeight,
      }));
      return monotoneCubicCurve(points);
    }
    return smoothPathD(linePathD);
  }, [candleOHLCData, plotWidth, plotBottom, minVal, valRange, plotHeight, linePathD]);

  const smoothedAreaD = useMemo(() => {
    if (!smoothedLineD) return "";
    return `${smoothedLineD} L ${plotWidth.toFixed(2)} ${plotBottom} L 0 ${plotBottom} Z`;
  }, [smoothedLineD, plotWidth, plotBottom]);

  const smoothedSmaPathD = useMemo(() => smoothPathD(smaPathD), [smaPathD]);
  const smoothedVwapPathD = useMemo(() => smoothPathD(vwapPathD), [vwapPathD]);
  const smoothedRsiPathD = useMemo(() => smoothPathD(rsiLinePath), [rsiLinePath]);
  const smoothedMacdLinePath = useMemo(() => smoothPathD(macdLinePath), [macdLinePath]);
  const smoothedMacdSignalPath = useMemo(() => smoothPathD(macdSignalPath), [macdSignalPath]);

  const isQuotePending =
    !candleOHLCData ||
    candleOHLCData.length === 0 ||
    ((Boolean(activeStock?.quotePending) || !activeStock?.price || activeStock.price <= 0) &&
      !(realHistory && realHistory.length > 0));

  const mainLineColor = isPositive ? "#00f5d4" : "#fb7185";
  const accentMint = "#00ff9d";
  const accentViolet = "#a855f7";
  const accentAmber = "#f59e0b";

  if (!stock) return null;
  return (
    <>
      {/* Alien Holographic Chamber Chart Stage */}
      <div className="xeno-holo-chamber relative p-4 overflow-hidden">
        {/* Micro-Beveled Chamber Corner Brackets */}
        <svg className="pointer-events-none absolute top-1.5 left-1.5 w-4 h-4 z-20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M1 15V5L5 1H15" stroke="#00f5d4" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
        <svg className="pointer-events-none absolute top-1.5 right-1.5 w-4 h-4 z-20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M1 1H11L15 5V15" stroke="#00f5d4" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
        <svg className="pointer-events-none absolute bottom-1.5 left-1.5 w-4 h-4 z-20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M1 1V11L5 15H15" stroke="#00f5d4" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
        <svg className="pointer-events-none absolute bottom-1.5 right-1.5 w-4 h-4 z-20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M1 15H11L15 11V1" stroke="#00f5d4" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="square" />
        </svg>

        {/* Controls Bar: Timeframe & Technical Indicator Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#00f5d4]/20 text-xs">
          {/* Timeframe Selector & Chart Style Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#04141d]/90 p-1 border border-[#00f5d4]/25">
              {(["1D", "1W", "1M", "1Y", "ALL"] as TimeFrame[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    triggerHaptic("selection");
                    setTimeframe(tf);
                    setHoverIndex(null);
                  }}
                  className={`px-3 py-1 transition-all cursor-pointer active:scale-95 text-xs font-mono font-bold ${
                    timeframe === tf
                      ? "bg-[#00f5d4] text-[#020608] font-black shadow-[0_0_14px_rgba(0,245,212,0.5)]"
                      : "text-cyan-200/75 hover:text-white hover:bg-[#00f5d4]/10"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart Style Switcher: Line vs Candles */}
            <div className="flex items-center gap-1 bg-[#04141d]/90 p-1 border border-[#00f5d4]/25">
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setChartMode("line");
                  try {
                    localStorage.setItem("stockbloc_modal_chart_style", "line");
                  } catch (e) {}
                }}
                className={`px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold ${
                  chartMode === "line"
                    ? "bg-[#00f5d4]/20 text-[#00f5d4] border border-[#00f5d4]/60 shadow-[0_0_12px_rgba(0,245,212,0.28)]"
                    : "text-slate-400 hover:text-cyan-200 hover:bg-[#00f5d4]/10 border border-transparent"
                }`}
                title="Holographic Plasma Line Beam"
              >
                <LineChart className="w-3.5 h-3.5 text-[#00f5d4]" />
                <span>Beam</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setChartMode("candle");
                  try {
                    localStorage.setItem("stockbloc_modal_chart_style", "candle");
                  } catch (e) {}
                }}
                className={`px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold ${
                  chartMode === "candle"
                    ? "bg-[#00f5d4]/20 text-[#00f5d4] border border-[#00f5d4]/60 shadow-[0_0_12px_rgba(0,245,212,0.28)]"
                    : "text-slate-400 hover:text-cyan-200 hover:bg-[#00f5d4]/10 border border-transparent"
                }`}
                title="Heikin-Ashi Crystal Candles"
              >
                <CandlestickChart className="w-3.5 h-3.5 text-[#00f5d4]" />
                <span>Candles</span>
              </button>
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
              className={`px-2.5 py-1 border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                showSMA
                  ? "bg-amber-500/18 text-amber-300 border-amber-400/55 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  : "bg-[#04141d]/85 text-slate-400 border-[#00f5d4]/20 hover:text-cyan-200"
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
              className={`px-2.5 py-1 border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                showVWAP
                  ? "bg-purple-500/20 text-purple-300 border-purple-400/55 shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                  : "bg-[#04141d]/85 text-slate-400 border-[#00f5d4]/20 hover:text-cyan-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
              <span>VWAP</span>
            </button>

            {/* RSI Toggle */}
            <button
              onClick={() => {
                triggerHaptic("selection");
                setShowRSI(!showRSI);
              }}
              className={`px-2.5 py-1 border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                showRSI
                  ? "bg-[#00e5ff]/18 text-[#00e5ff] border-[#00e5ff]/55"
                  : "bg-[#04141d]/85 text-slate-400 border-[#00f5d4]/20 hover:text-cyan-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>RSI (14)</span>
            </button>

            {/* Trendline Tool Toggle */}
            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsTrendlineActive(!isTrendlineActive);
              }}
              className={`px-2.5 py-1 border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                isTrendlineActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/55"
                  : "bg-[#04141d]/85 text-slate-400 border-[#00f5d4]/20 hover:text-cyan-200"
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              <span>Vector</span>
            </button>

            {/* Benchmark Overlay Toggle */}
            <button
              onClick={() => {
                triggerHaptic("selection");
                setShowOverlay(!showOverlay);
                setHoverIndex(null);
              }}
              className={`px-2.5 py-1 border font-mono font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer active:scale-95 ${
                showOverlay
                  ? "bg-[#00f5d4]/18 text-[#00f5d4] border-[#00f5d4]/55"
                  : "bg-[#04141d]/85 text-slate-400 border-[#00f5d4]/20 hover:text-cyan-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00f5d4]" />
              <span>Overlay</span>
            </button>

            {/* Benchmark Selector when Overlay is ON */}
            {showOverlay && (
              <div className="flex items-center gap-1 bg-[#04141d] p-0.5 border border-[#00f5d4]/25">
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
                      className={`px-2 py-0.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#00f5d4] text-[#020608]"
                          : "text-cyan-200/75 hover:text-white"
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
        {showOverlay && !isQuotePending && (
          <div className="mb-3 p-2.5 bg-[#04141d]/90 border border-[#00f5d4]/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-1"
                  style={{
                    backgroundColor: isPositive ? "#00ff9d" : "#fb7185",
                  }}
                />
                <span className="font-extrabold text-white">
                  ${stock.symbol}:
                </span>
                <span
                  className={`font-black tabular-nums-strict ${hoveredStockReturn >= 0 ? "text-[#00ff9d]" : "text-rose-400"}`}
                >
                  {hoveredStockReturn >= 0 ? "+" : ""}
                  {hoveredStockReturn.toFixed(2)}%
                </span>
              </div>

              <span className="text-cyan-900">|</span>

              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 border-t-2 border-dashed"
                  style={{ borderColor: activeBenchmark.color }}
                />
                <span className="font-extrabold text-cyan-100">
                  {benchmarkSymbol}:
                </span>
                <span
                  className={`font-black tabular-nums-strict ${hoveredBenchReturn >= 0 ? "text-[#00ff9d]" : "text-rose-400"}`}
                >
                  {hoveredBenchReturn >= 0 ? "+" : ""}
                  {hoveredBenchReturn.toFixed(2)}%
                </span>
              </div>
            </div>

            <div
              className={`px-2 py-0.5 border text-[11px] font-black flex items-center gap-1 tabular-nums-strict ${
                hoveredAlpha >= 0
                  ? "bg-[#00ff9d]/15 text-[#00ff9d] border-[#00ff9d]/40"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/40"
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

        {/* High Density Holographic Telemetry Strip */}
        <div className="mb-2.5 px-3 py-2 bg-[#04141d]/85 border border-[#00f5d4]/22 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-cyan-100 font-bold flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`xeno-beacon-ring absolute inline-flex h-full w-full rounded-full ${
                    isQuotePending
                      ? "bg-amber-400"
                      : isPositive
                        ? "bg-[#00f5d4]"
                        : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isQuotePending
                      ? "bg-amber-400"
                      : isPositive
                        ? "bg-[#00ff9d]"
                        : "bg-rose-400"
                  }`}
                />
              </span>
              <span className="text-white font-extrabold tracking-wider">
                {stock.symbol}
              </span>
              <span className="text-cyan-300/75 text-[11px]">
                {isQuotePending
                  ? "[AWAITING FEED]"
                  : `(${hoverIndex !== null ? activeCandle.time : "LIVE BEAM"})`}
              </span>
            </span>

            {isQuotePending ? (
              <span className="text-amber-300 font-bold tracking-wider uppercase text-[11px]">
                QUOTE PENDING · LIVE NASDAQ TELEMETRY ONLY
              </span>
            ) : chartMode === "line" ? (
              <>
                <span className="text-cyan-300/70">
                  LOCK{" "}
                  <strong className="text-white font-bold text-sm tabular-nums-strict">
                    ${activeCandle.close.toFixed(2)}
                  </strong>
                </span>
                <span className="text-cyan-300/70 border-l border-[#00f5d4]/20 pl-2.5">
                  VOL{" "}
                  <strong className="text-[#00f5d4] tabular-nums-strict">
                    {activeCandle.volume
                      ? `${(activeCandle.volume / 1000).toFixed(1)}k`
                      : "—"}
                  </strong>
                </span>
              </>
            ) : (
              <>
                <span className="text-cyan-300/70">
                  O <strong className="text-slate-100 tabular-nums-strict">${activeCandle.open.toFixed(2)}</strong>
                </span>
                <span className="text-cyan-300/70">
                  H <strong className="text-[#00ff9d] tabular-nums-strict">${activeCandle.high.toFixed(2)}</strong>
                </span>
                <span className="text-cyan-300/70">
                  L <strong className="text-rose-400 tabular-nums-strict">${activeCandle.low.toFixed(2)}</strong>
                </span>
                <span className="text-cyan-300/70">
                  C{" "}
                  <strong className={`tabular-nums-strict font-bold ${activeCandle.isUp ? "text-[#00ff9d]" : "text-rose-400"}`}>
                    ${activeCandle.close.toFixed(2)}
                  </strong>
                </span>
                <span className="text-cyan-300/70 border-l border-[#00f5d4]/20 pl-2">
                  VOL{" "}
                  <strong className="text-[#00f5d4] tabular-nums-strict">
                    {activeCandle.volume
                      ? `${(activeCandle.volume / 1000).toFixed(1)}k`
                      : "—"}
                  </strong>
                </span>
              </>
            )}

            {!isQuotePending && showSMA && activeSma !== undefined && (
              <span className="text-cyan-300/70 border-l border-[#00f5d4]/20 pl-2.5">
                SMA(50) <strong className="text-amber-300 tabular-nums-strict">${activeSma.toFixed(2)}</strong>
              </span>
            )}
            {!isQuotePending && showVWAP && activeVwap !== undefined && (
              <span className="text-cyan-300/70 border-l border-[#00f5d4]/20 pl-2.5">
                VWAP <strong className="text-purple-300 tabular-nums-strict">${activeVwap.toFixed(2)}</strong>
              </span>
            )}
            {!isQuotePending && showRSI && activeRsi !== undefined && (
              <span className="text-cyan-300/70 border-l border-[#00f5d4]/20 pl-2.5">
                RSI(14){" "}
                <strong
                  className={`tabular-nums-strict font-bold ${
                    activeRsi >= 70
                      ? "text-amber-300"
                      : activeRsi <= 30
                        ? "text-[#00ff9d]"
                        : "text-[#00e5ff]"
                  }`}
                >
                  {activeRsi.toFixed(1)}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {!isQuotePending && (
              <div className="flex items-center gap-1 bg-[#020608]/90 p-0.5 border border-[#00f5d4]/25">
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    const next = Math.max(1.0, Number((zoomLevel - 0.5).toFixed(1)));
                    setZoomLevel(next);
                    if (next === 1.0) setPanOffset(0.0);
                  }}
                  disabled={zoomLevel <= 1.0}
                  title="Zoom Out"
                  className="p-1 text-cyan-300/80 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <span className="px-1 text-[11px] font-mono text-cyan-200 min-w-[28px] text-center tabular-nums-strict">
                  {zoomLevel.toFixed(1)}x
                </span>

                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setZoomLevel((z) => Math.min(5.0, Number((z + 0.5).toFixed(1))));
                  }}
                  disabled={zoomLevel >= 5.0}
                  title="Zoom In"
                  className="p-1 text-cyan-300/80 hover:text-white disabled:opacity-30 cursor-pointer"
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
                    className="p-1 ml-0.5 text-rose-400 hover:bg-rose-500/20 cursor-pointer text-[10px] font-bold"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {!isQuotePending && (
              <span
                className={`px-2 py-0.5 text-[11px] font-bold font-mono tabular-nums-strict border ${
                  activeCandle.isUp
                    ? "bg-[#00ff9d]/12 text-[#00ff9d] border-[#00ff9d]/40"
                    : "bg-rose-500/12 text-rose-300 border-rose-500/40"
                }`}
              >
                {activeCandle.isUp ? "+" : ""}
                {activeCandle.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>

        {/* Interactive Alien Holographic Chamber Viewport */}
        <div
          className="relative w-full h-64 sm:h-72 md:h-80 select-none touch-none cursor-crosshair overflow-hidden border border-[#00f5d4]/30 bg-[#020608] shadow-[inset_0_0_54px_rgba(0,245,212,0.08)]"
          style={{ touchAction: "none" }}
          onTouchStart={!isQuotePending ? handleTouchStart : undefined}
          onTouchMove={!isQuotePending ? handleTouchMove : undefined}
          onTouchEnd={!isQuotePending ? handleTouchEnd : undefined}
          onWheel={!isQuotePending ? handleWheelZoom : undefined}
          onMouseDown={!isQuotePending ? handleMouseDown : undefined}
          onMouseMove={!isQuotePending ? handleMouseMove : undefined}
          onMouseUp={!isQuotePending ? handleMouseUp : undefined}
          onMouseLeave={() => {
            handleMouseUp();
            setHoverIndex(null);
          }}
        >
          {isQuotePending ? (
            /* Authentic Holographic Chamber Standby State (ZERO Fabricated Prices or Candles) */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              <svg
                viewBox="0 0 600 280"
                className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="pendingChamberGlow" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.16" />
                    <stop offset="55%" stopColor="#a855f7" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#020608" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="600" height="280" fill="#020608" />
                <ellipse cx="300" cy="140" rx="250" ry="118" fill="url(#pendingChamberGlow)" />
                <ellipse cx="300" cy="140" rx="220" ry="102" fill="none" stroke="rgba(0,245,212,0.14)" strokeWidth="1" strokeDasharray="4 6" />
                <ellipse cx="300" cy="140" rx="150" ry="70" fill="none" stroke="rgba(0,229,255,0.16)" strokeWidth="1" strokeDasharray="3 5" />
                <circle cx="300" cy="140" r="46" fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="1" strokeDasharray="6 4" className="xeno-reticle-orbit" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="rgba(0,245,212,0.12)" strokeWidth="1" strokeDasharray="3 6" />
                <line x1="300" y1="0" x2="300" y2="280" stroke="rgba(0,245,212,0.12)" strokeWidth="1" strokeDasharray="3 6" />
              </svg>

              <div className="relative z-10 max-w-md px-5 py-4 bg-[#04141d]/88 border border-[#00f5d4]/35 backdrop-blur-xl shadow-[0_0_32px_rgba(0,245,212,0.14)]">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 mb-2.5 bg-amber-500/15 border border-amber-400/45 text-amber-300 text-[10px] font-mono font-bold tracking-[0.16em] uppercase">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>LIVE QUOTE PENDING</span>
                </div>
                <h4 className="text-sm sm:text-base font-display font-black tracking-wider text-white uppercase">
                  {stock.symbol} · {stock.name}
                </h4>
                <p className="text-xs font-mono text-cyan-100/80 mt-1.5 leading-relaxed">
                  {stock.symbol.toUpperCase() === "ANT"
                    ? "Live on Nasdaq (Debuted Nov 19, 2026 · IPO $83.00 · First-Day Close $97.17, +17.07%). Awaiting live market quote & intraday candle feed — synthetic chart data is disabled."
                    : "Awaiting verified live quote ticks from exchange feed. Stock Bloc never fabricates price curves or volume bars."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Floating Chamber Telemetry & Zoom Readout */}
              <div className="absolute top-2 left-2 z-10 px-2.5 py-1 bg-[#04141d]/88 border border-[#00f5d4]/35 text-[10px] font-mono text-[#00f5d4] flex items-center gap-1.5 shadow-lg backdrop-blur-md pointer-events-none">
                {zoomLevel > 1.05 ? (
                  <>
                    <Move className="w-3 h-3 text-[#00f5d4] animate-pulse" />
                    <span>OPTICAL LOCK {zoomLevel.toFixed(1)}x · DRAG TO PAN</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3 h-3 text-[#00f5d4]" />
                    <span>HOLO-CHAMBER · SCRUB OR SCROLL TO ZOOM</span>
                  </>
                )}
              </div>

              {/* Floating Guidance for Trendline Tool */}
              {isTrendlineActive && (
                <div className="absolute top-2 right-16 z-10 px-2.5 py-1 bg-[#181004]/90 border border-amber-400/55 text-[10px] font-mono text-amber-300 flex items-center gap-1.5 shadow-lg backdrop-blur-md pointer-events-none">
                  <PenTool className="w-3 h-3 text-amber-400 animate-bounce" />
                  <span>
                    {trendline
                      ? "Drag to re-calibrate vector"
                      : "Click & drag to project vector"}
                  </span>
                </div>
              )}

              {/* Refractive Dark-Teal Liquid-Glass Targeting HUD Tooltip */}
              {hoverIndex !== null && activeCandle && (
                <div
                  className="absolute pointer-events-none z-20 px-3 py-2 bg-[#04141d]/92 border border-[#00f5d4]/50 backdrop-blur-xl text-xs flex flex-col gap-0.5 shadow-[0_0_24px_rgba(0,245,212,0.22)] transition-all duration-75"
                  style={{
                    left: Math.min(
                      Math.max(
                        8,
                        (hoverIndex / Math.max(1, candleOHLCData.length - 1)) *
                          plotWidth -
                          70,
                      ),
                      plotWidth - 152,
                    ),
                    top: 10,
                  }}
                >
                  <span className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff9d]" />
                  <span className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5d4]" />
                  <div className="flex items-center justify-between gap-3 text-[10px] text-cyan-200/80 font-mono">
                    <span className="font-bold uppercase tracking-wider">{activeCandle.time}</span>
                    <span
                      className={`font-black tabular-nums-strict ${
                        activeCandle.isUp ? "text-[#00ff9d]" : "text-rose-400"
                      }`}
                    >
                      {activeCandle.isUp ? "+" : ""}
                      {activeCandle.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-white font-black text-base tabular-nums-strict font-mono drop-shadow-[0_0_8px_rgba(0,245,212,0.35)]">
                    ${activeCandle.close.toFixed(2)}
                  </div>
                  {activeCandle.volume ? (
                    <div className="text-[10px] text-[#00f5d4] font-mono tabular-nums-strict">
                      CRYSTAL VOL: {(activeCandle.volume / 1000).toFixed(1)}k
                    </div>
                  ) : null}
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
              >
                <defs>
                  {/* Wide Atmospheric Outer Plasma Beam Bloom Filter */}
                  <filter id="plasmaBeamOuterGlow" x="-20%" y="-35%" width="140%" height="170%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4.8" result="outerBlur" />
                    <feComponentTransfer in="outerBlur" result="softPlasma">
                      <feFuncA type="linear" slope="0.72" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="softPlasma" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Crisp Core Glow Filter */}
                  <filter id="softLineGlow" x="-15%" y="-25%" width="130%" height="150%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.1" result="blur" />
                    <feComponentTransfer in="blur" result="lowOpacityGlow">
                      <feFuncA type="linear" slope="0.55" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="lowOpacityGlow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Chamber Deep Bioluminescent Radial Backdrop */}
                  <radialGradient id="chamberRadialCore" cx="48%" cy="32%" r="68%">
                    <stop offset="0%" stopColor={isPositive ? "#00f5d4" : "#a855f7"} stopOpacity="0.11" />
                    <stop offset="48%" stopColor="#041926" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#020608" stopOpacity="0.98" />
                  </radialGradient>

                  {/* Dual-Layer Beam Horizontal Stroke Gradients */}
                  <linearGradient id="beamStrokeUp" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="50%" stopColor="#00f5d4" />
                    <stop offset="100%" stopColor="#00ff9d" />
                  </linearGradient>
                  <linearGradient id="beamStrokeDown" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="55%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>

                  {/* Holographic Energy Veil Under Price Beam */}
                  <linearGradient id="rhGradientUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.34" />
                    <stop offset="45%" stopColor="#00ff9d" stopOpacity="0.11" />
                    <stop offset="85%" stopColor="#a855f7" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="#020608" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="rhGradientDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity="0.32" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#020608" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Crystal Volume Pillar Gradients */}
                  <linearGradient id="volCrystalUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff9d" stopOpacity="0.62" />
                    <stop offset="38%" stopColor="#00f5d4" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.08" />
                  </linearGradient>
                  <linearGradient id="volCrystalDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity="0.58" />
                    <stop offset="42%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#581c87" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* #020608 Obsidian Holographic Chamber Base */}
                <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#020608" />
                <rect x="0" y="0" width={plotWidth} height={plotBottom} fill="url(#chamberRadialCore)" />

                {/* Alien Orbital Gridlines & Concentric Calibration Arcs */}
                <g className="pointer-events-none" opacity="0.9">
                  <ellipse
                    cx={plotWidth * 0.5}
                    cy={plotTop + plotHeight * 0.54}
                    rx={plotWidth * 0.44}
                    ry={plotHeight * 0.48}
                    fill="none"
                    stroke="rgba(0, 245, 212, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="3 6"
                  />
                  <ellipse
                    cx={plotWidth * 0.5}
                    cy={plotTop + plotHeight * 0.54}
                    rx={plotWidth * 0.29}
                    ry={plotHeight * 0.32}
                    fill="none"
                    stroke="rgba(0, 229, 255, 0.12)"
                    strokeWidth="0.9"
                    strokeDasharray="2 5"
                  />
                  <circle
                    cx={plotWidth * 0.5}
                    cy={plotTop + plotHeight * 0.54}
                    r={plotHeight * 0.16}
                    fill="none"
                    stroke="rgba(168, 85, 247, 0.16)"
                    strokeWidth="0.85"
                    strokeDasharray="4 4"
                  />
                  {/* Subtle vertical orbital meridian guides */}
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <line
                      key={`meridian-${ratio}`}
                      x1={plotWidth * ratio}
                      y1={plotTop}
                      x2={plotWidth * ratio}
                      y2={plotBottom}
                      stroke="rgba(0, 245, 212, 0.06)"
                      strokeWidth="0.8"
                      strokeDasharray="2 6"
                    />
                  ))}
                </g>

                {/* Horizontal Telemetry Gridlines & Right Y-Axis Scale */}
                {yAxisTicks.map((tick, i) => (
                  <g key={tick.label + "_" + i}>
                    <line
                      x1="0"
                      y1={tick.y}
                      x2={plotWidth}
                      y2={tick.y}
                      stroke="rgba(0, 245, 212, 0.11)"
                      strokeWidth="0.9"
                      strokeDasharray="3 5"
                    />
                    <line
                      x1={plotWidth - 4}
                      y1={tick.y}
                      x2={plotWidth}
                      y2={tick.y}
                      stroke="rgba(0, 245, 212, 0.45)"
                      strokeWidth="1"
                    />
                    <text
                      x={plotWidth + 6}
                      y={tick.y + 3.5}
                      fill="rgba(165, 243, 252, 0.68)"
                      fontSize="10"
                      fontFamily="'JetBrains Mono', monospace"
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
                      stroke="rgba(0, 245, 212, 0.35)"
                      strokeWidth="1.25"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={plotWidth - 88}
                      y={zeroY - 4}
                      fill="rgba(0, 245, 212, 0.75)"
                      fontSize="10"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="bold"
                    >
                      0.0% BASELINE
                    </text>
                  </>
                )}

                {/* Chamber Floor Baseline Rail */}
                <line
                  x1="0"
                  y1={plotBottom}
                  x2={plotWidth}
                  y2={plotBottom}
                  stroke="rgba(0, 245, 212, 0.28)"
                  strokeWidth="1"
                />
                {/* Right Axis Divider Rail */}
                <line
                  x1={plotWidth}
                  y1={plotTop}
                  x2={plotWidth}
                  y2={plotBottom}
                  stroke="rgba(0, 245, 212, 0.16)"
                  strokeWidth="1"
                />

                {/* Crystal Volume Pillars (Faceted Translucent Pillars + Luminous Top Cap Rim) */}
                <g>
                  {candleOHLCData.map((c, idx) => {
                    const x =
                      (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
                    const pointSpacing =
                      plotWidth / Math.max(1, candleOHLCData.length - 1);
                    const barW = Math.max(3, Math.min(12, pointSpacing * 0.62));
                    const vol = c.volume || 1000;
                    const volH = Math.max(4, (vol / maxVolume) * 34);
                    const volY = plotBottom - volH;
                    const leftX = x - barW / 2;
                    const isFocused = hoverIndex === idx;
                    const capColor = c.isUp ? "#00ff9d" : "#fb7185";
                    return (
                      <g key={`vol-crystal-${idx}`} opacity={isFocused ? 1 : 0.82}>
                        {/* Faceted Crystal Body */}
                        <polygon
                          points={`${leftX},${plotBottom} ${leftX},${volY + 1.5} ${x},${volY} ${leftX + barW},${volY + 1.5} ${leftX + barW},${plotBottom}`}
                          fill={c.isUp ? "url(#volCrystalUp)" : "url(#volCrystalDown)"}
                          stroke={isFocused ? capColor : "rgba(0, 245, 212, 0.18)"}
                          strokeWidth={isFocused ? "0.9" : "0.45"}
                        />
                        {/* Internal Specular Crystal Facet Spine */}
                        <line
                          x1={x}
                          y1={volY + 0.5}
                          x2={x}
                          y2={plotBottom}
                          stroke="rgba(255, 255, 255, 0.18)"
                          strokeWidth="0.6"
                        />
                        {/* Luminous Top Crystal Cap Highlight */}
                        <line
                          x1={leftX + 0.5}
                          y1={volY + 1}
                          x2={leftX + barW - 0.5}
                          y2={volY + 1}
                          stroke={capColor}
                          strokeWidth={isFocused ? "2" : "1.3"}
                          strokeOpacity={isFocused ? "1" : "0.85"}
                        />
                      </g>
                    );
                  })}
                </g>

                {/* X-Axis Time Ticks along bottom */}
                <g>
                  {timeTicks.map((tick, i) => (
                    <g key={`time-tick-${i}`}>
                      <line
                        x1={tick.x}
                        y1={plotBottom}
                        x2={tick.x}
                        y2={plotBottom + 4}
                        stroke="rgba(0, 245, 212, 0.35)"
                        strokeWidth="1"
                      />
                      <text
                        x={tick.x}
                        y={plotBottom + 16}
                        textAnchor="middle"
                        fill="rgba(165, 243, 252, 0.62)"
                        fontSize="10"
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight="600"
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}
                </g>

                {/* Benchmark Overlay Path */}
                {showOverlay && benchmarkPathD && (
                  <path
                    d={benchmarkPathD}
                    fill="none"
                    stroke={activeBenchmark.color}
                    strokeWidth="2.2"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 50-Day Simple Moving Average (SMA) Overlay Line */}
                {showSMA && smoothedSmaPathD && (
                  <g className="pointer-events-none">
                    <path
                      d={smoothedSmaPathD}
                      fill="none"
                      stroke={accentAmber}
                      strokeWidth="1.5"
                      opacity="0.85"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-150 drop-shadow-[0_0_6px_rgba(245,158,11,0.55)]"
                    />
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
                            ((visibleSmaValues[hoverIndex] - minVal) / valRange) *
                              plotHeight
                          }
                          r="4"
                          fill={accentAmber}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      )}
                  </g>
                )}

                {/* Volume-Weighted Average Price (VWAP) Overlay Line */}
                {showVWAP && smoothedVwapPathD && (
                  <g className="pointer-events-none">
                    <path
                      d={smoothedVwapPathD}
                      fill="none"
                      stroke={accentViolet}
                      strokeWidth="1.5"
                      opacity="0.85"
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-150 drop-shadow-[0_0_6px_rgba(168,85,247,0.65)]"
                    />
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
                            ((visibleVwapValues[hoverIndex] - minVal) / valRange) *
                              plotHeight
                          }
                          r="4"
                          fill={accentViolet}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      )}
                  </g>
                )}

                {/* ALIEN DUAL-LAYER GLOWING PRICE BEAM (Line Mode) */}
                {chartMode === "line" && (
                  <g>
                    {/* Dotted Reference Baseline */}
                    {stockBasePrice > 0 && (
                      <line
                        x1={0}
                        y1={
                          plotBottom -
                          ((stockBasePrice - minVal) / valRange) * plotHeight
                        }
                        x2={plotWidth}
                        y2={
                          plotBottom -
                          ((stockBasePrice - minVal) / valRange) * plotHeight
                        }
                        stroke="rgba(0, 245, 212, 0.2)"
                        strokeDasharray="3 4"
                        strokeWidth="1"
                      />
                    )}

                    {/* Holographic Gradient Energy Veil Under Beam */}
                    {smoothedAreaD && (
                      <path
                        d={smoothedAreaD}
                        fill={isPositive ? "url(#rhGradientUp)" : "url(#rhGradientDown)"}
                        className="transition-all duration-200"
                      />
                    )}

                    {/* LAYER 1: Wide Atmospheric Outer Plasma Aura */}
                    {smoothedLineD && (
                      <path
                        d={smoothedLineD}
                        fill="none"
                        stroke={isPositive ? "url(#beamStrokeUp)" : "url(#beamStrokeDown)"}
                        strokeWidth="6.5"
                        strokeOpacity="0.42"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#plasmaBeamOuterGlow)"
                      />
                    )}

                    {/* LAYER 2: Razor-Sharp High-Luminance Inner Plasma Core Beam */}
                    {smoothedLineD && (
                      <>
                        <path
                          d={smoothedLineD}
                          fill="none"
                          stroke={isPositive ? "url(#beamStrokeUp)" : "url(#beamStrokeDown)"}
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#softLineGlow)"
                        />
                        <path
                          d={smoothedLineD}
                          fill="none"
                          stroke={isPositive ? "#e8fff9" : "#ffe4ea"}
                          strokeWidth="0.9"
                          strokeOpacity="0.88"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </>
                    )}

                    {/* Live Price End-Point Bioluminescent Node Beacon (when not scrubbing) */}
                    {hoverIndex === null && candleOHLCData.length > 0 && (() => {
                      const endY =
                        plotBottom -
                        ((candleOHLCData[candleOHLCData.length - 1].close - minVal) /
                          valRange) *
                          plotHeight;
                      return (
                        <g className="pointer-events-none">
                          <circle
                            cx={plotWidth}
                            cy={endY}
                            r="10"
                            fill="none"
                            stroke={isPositive ? accentMint : "#fb7185"}
                            strokeWidth="1"
                            strokeOpacity="0.45"
                            strokeDasharray="3 2"
                            className="xeno-reticle-orbit"
                          />
                          <circle
                            cx={plotWidth}
                            cy={endY}
                            r="6.5"
                            fill={isPositive ? "#00f5d4" : "#fb7185"}
                            fillOpacity="0.28"
                            className="animate-ping"
                          />
                          <circle
                            cx={plotWidth}
                            cy={endY}
                            r="3.5"
                            fill="#ffffff"
                            stroke={isPositive ? accentMint : "#fb7185"}
                            strokeWidth="1.6"
                          />
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* HEIKIN-ASHI CRYSTAL CANDLESTICK CHART (Candle Mode) */}
                {chartMode === "candle" && (
                  <g>
                    {candleOHLCData.map((c, idx) => {
                      const x =
                        (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
                      const yOpen =
                        plotBottom - ((c.open - minVal) / valRange) * plotHeight;
                      const yClose =
                        plotBottom - ((c.close - minVal) / valRange) * plotHeight;
                      const yHigh =
                        plotBottom - ((c.high - minVal) / valRange) * plotHeight;
                      const yLow =
                        plotBottom - ((c.low - minVal) / valRange) * plotHeight;

                      const isUp = c.close >= c.open;
                      const color = isUp ? "#00ff9d" : "#fb7185";
                      const edgeColor = isUp ? "#00f5d4" : "#a855f7";

                      const rectY = Math.min(yOpen, yClose);
                      const rectHeight = Math.max(1.5, Math.abs(yOpen - yClose));

                      const pointSpacing =
                        plotWidth / Math.max(1, candleOHLCData.length - 1);
                      const barW = Math.max(1.8, pointSpacing * 0.68);

                      return (
                        <g key={`candle-${idx}`}>
                          <line
                            x1={x}
                            y1={yHigh}
                            x2={x}
                            y2={yLow}
                            stroke={edgeColor}
                            strokeWidth={Math.max(1, barW * 0.2)}
                          />
                          <rect
                            x={x - barW / 2}
                            y={rectY}
                            width={barW}
                            height={rectHeight}
                            fill={color}
                            fillOpacity="0.88"
                            stroke={edgeColor}
                            strokeWidth={0.8}
                            rx={barW > 3 ? 1 : 0}
                          />
                        </g>
                      );
                    })}

                    {/* Live Current Price Horizontal Laser Rail */}
                    {candleOHLCData.length > 0 && (
                      <line
                        x1={0}
                        y1={
                          plotBottom -
                          ((candleOHLCData[candleOHLCData.length - 1].close - minVal) /
                            valRange) *
                            plotHeight
                        }
                        x2={plotWidth}
                        y2={
                          plotBottom -
                          ((candleOHLCData[candleOHLCData.length - 1].close - minVal) /
                            valRange) *
                            plotHeight
                        }
                        stroke={
                          candleOHLCData[candleOHLCData.length - 1].close >=
                          candleOHLCData[candleOHLCData.length - 1].open
                            ? "#00f5d4"
                            : "#fb7185"
                        }
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        opacity="0.55"
                      />
                    )}
                  </g>
                )}

                {/* Interactive Scrubbing Columns (both modes) */}
                {candleOHLCData.map((_, idx) => {
                  const x =
                    (idx / Math.max(1, candleOHLCData.length - 1)) * plotWidth;
                  const pointSpacing =
                    plotWidth / Math.max(1, candleOHLCData.length - 1);
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

                {/* Live Price Badge & Targeting-Reticle Crosshair HUD */}
                {(() => {
                  const MIN_BADGE_SEPARATION = 22;
                  const clampY = (y: number, h: number) =>
                    Math.max(4, Math.min(plotBottom - h - 2, y));

                  const liveDisplayPrice =
                    activeStock && activeStock.price > 0
                      ? activeStock.price
                      : candleOHLCData[candleOHLCData.length - 1]?.close || 0;

                  const liveBadgeY = liveDisplayPrice > 0
                    ? clampY(
                        plotBottom -
                          ((liveDisplayPrice - minVal) / valRange) * plotHeight -
                          9,
                        18,
                      )
                    : 0;

                  const hoverX =
                    hoverIndex !== null
                      ? (hoverIndex / Math.max(1, candleOHLCData.length - 1)) *
                        plotWidth
                      : 0;
                  const hoverY =
                    hoverIndex !== null && activeCandle
                      ? plotBottom -
                        ((activeCandle.close - minVal) / valRange) * plotHeight
                      : 0;

                  let hoverBadgeY =
                    hoverIndex !== null && activeCandle
                      ? clampY(hoverY - 10, 20)
                      : 0;

                  if (
                    liveDisplayPrice > 0 &&
                    hoverIndex !== null &&
                    activeCandle &&
                    Math.abs(hoverBadgeY - liveBadgeY) < MIN_BADGE_SEPARATION
                  ) {
                    const preferBelow = hoverBadgeY >= liveBadgeY;
                    let candidate = preferBelow
                      ? liveBadgeY + MIN_BADGE_SEPARATION
                      : liveBadgeY - MIN_BADGE_SEPARATION;
                    if (candidate < 4 || candidate > plotBottom - 22) {
                      candidate = preferBelow
                        ? liveBadgeY - MIN_BADGE_SEPARATION
                        : liveBadgeY + MIN_BADGE_SEPARATION;
                    }
                    hoverBadgeY = clampY(candidate, 20);
                  }

                  const reticleColor = isPositive ? "#00f5d4" : "#fb7185";

                  return (
                    <>
                      {liveDisplayPrice > 0 && (
                        <g transform={`translate(${plotWidth + 2}, ${liveBadgeY})`}>
                          <rect
                            x="0"
                            y="0"
                            width="60"
                            height="18"
                            rx="2"
                            fill={isPositive ? "#00ff9d" : "#fb7185"}
                          />
                          <text
                            x="30"
                            y="12.5"
                            textAnchor="middle"
                            fill="#020608"
                            fontSize="9.5"
                            fontFamily="'JetBrains Mono', monospace"
                            fontWeight="800"
                          >
                            ${liveDisplayPrice.toFixed(2)}
                          </text>
                        </g>
                      )}

                      {/* ALIEN TARGETING-RETICLE CROSSHAIR HUD */}
                      {hoverIndex !== null && activeCandle && (
                        <g className="pointer-events-none">
                          {/* Vertical Laser Crosshair Beam */}
                          <line
                            x1={hoverX}
                            y1={plotTop}
                            x2={hoverX}
                            y2={plotBottom}
                            stroke="rgba(0, 245, 212, 0.55)"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          {/* Horizontal Laser Crosshair Beam */}
                          <line
                            x1="0"
                            y1={hoverY}
                            x2={plotWidth}
                            y2={hoverY}
                            stroke="rgba(0, 229, 255, 0.45)"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />

                          {/* Multi-Ring Alien Targeting-Reticle Centered on Active Node */}
                          <g transform={`translate(${hoverX}, ${hoverY})`}>
                            {/* Outer Rotating Segmented Orbital Lock Ring */}
                            <circle
                              r="15"
                              fill="none"
                              stroke={reticleColor}
                              strokeOpacity="0.65"
                              strokeWidth="1.15"
                              strokeDasharray="5 4"
                              className="xeno-reticle-orbit"
                            />
                            {/* Inner Calibration Ring */}
                            <circle
                              r="8.5"
                              fill={reticleColor}
                              fillOpacity="0.12"
                              stroke={reticleColor}
                              strokeOpacity="0.9"
                              strokeWidth="1"
                            />
                            {/* 4 Cardinal Precision Targeting Ticks */}
                            <line x1="-20" y1="0" x2="-11" y2="0" stroke="#00f5d4" strokeWidth="1.2" />
                            <line x1="11" y1="0" x2="20" y2="0" stroke="#00f5d4" strokeWidth="1.2" />
                            <line x1="0" y1="-20" x2="0" y2="-11" stroke="#00f5d4" strokeWidth="1.2" />
                            <line x1="0" y1="11" x2="0" y2="20" stroke="#00f5d4" strokeWidth="1.2" />
                            {/* Glowing Central Lock Core */}
                            <circle
                              r="3.2"
                              fill="#ffffff"
                              stroke={reticleColor}
                              strokeWidth="1.8"
                              filter="url(#softLineGlow)"
                            />
                          </g>

                          {/* Right Y-Axis Collision-Protected Target Lock Price Badge */}
                          <g transform={`translate(${plotWidth + 2}, ${hoverBadgeY})`}>
                            <rect
                              x="0"
                              y="0"
                              width="60"
                              height="20"
                              rx="2"
                              fill="#04141d"
                              stroke={reticleColor}
                              strokeWidth="1.3"
                            />
                            <text
                              x="30"
                              y="13"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="9.5"
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight="bold"
                            >
                              ${activeCandle.close.toFixed(2)}
                            </text>
                          </g>

                          {/* Bottom X-Axis Target Lock Timestamp Badge */}
                          <g
                            transform={`translate(${Math.max(30, Math.min(plotWidth - 34, hoverX)) - 32}, ${plotBottom + 24})`}
                          >
                            <rect
                              x="0"
                              y="0"
                              width="64"
                              height="16"
                              rx="2"
                              fill="#04141d"
                              stroke={reticleColor}
                              strokeWidth="1"
                            />
                            <text
                              x="32"
                              y="11"
                              textAnchor="middle"
                              fill={reticleColor}
                              fontSize="8.5"
                              fontFamily="'JetBrains Mono', monospace"
                              fontWeight="bold"
                            >
                              {activeCandle.time}
                            </text>
                          </g>
                        </g>
                      )}
                    </>
                  );
                })()}

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
                </>
              )}
            </div>

            {/* Trendline Slope & Technical Analysis Display Panel */}
            {!isQuotePending && trendline && trendlineMetrics && (
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
                {!isQuotePending && zoomLevel > 1.05 && (
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
              {!isQuotePending && (
              <>
              <div className="liquid-glass-slab p-4 rounded-2xl border border-cyan-500/30 space-y-3 shadow-lg">
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

                      {/* RSI Line Path (1.5px, smoothed, 80% opacity, same color) */}
                      {smoothedRsiPathD && (
                        <path
                          d={smoothedRsiPathD}
                          fill="none"
                          stroke="#00f2ff"
                          strokeWidth="1.5"
                          opacity="0.8"
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
              <div className="liquid-glass-slab p-4 rounded-2xl border border-cyan-500/30 space-y-3 shadow-lg">
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

                    {/* MACD Line (Cyan) - 1.5px, smoothed, 80% opacity, same color */}
                    {smoothedMacdLinePath && (
                      <path
                        d={smoothedMacdLinePath}
                        fill="none"
                        stroke="#00f2ff"
                        strokeWidth="1.5"
                        opacity="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_6px_rgba(0,242,255,0.6)]"
                      />
                    )}

                    {/* Signal Line (Fuchsia) - 1.5px, smoothed, 80% opacity, same color */}
                    {smoothedMacdSignalPath && (
                      <path
                        d={smoothedMacdSignalPath}
                        fill="none"
                        stroke="#e879f9"
                        strokeWidth="1.5"
                        opacity="0.8"
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
              )}
    </>
  );
};
