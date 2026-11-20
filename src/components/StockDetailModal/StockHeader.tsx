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
import { useUserStore } from "../../stores/userStore";
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
  Star,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { getInstitutionalDataForStock } from "../../utils/institutionalHelper";
import { runFullTradeScreener } from "../../utils/tradeScreenerEngine";
import { computeDeterministicSignal, getSBScoreColor } from "../../utils/signalCalculator";

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



export const StockHeader = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;
  
  const { starredTickers, toggleStarredTicker } = useUserStore();
  const isStarred = stock ? starredTickers.includes(stock.symbol) : false;

  const tradeScreener = useMemo(() => {
    return stock ? runFullTradeScreener(stock) : null;
  }, [stock]);

  if (!stock) return null;

  const isQuotePending =
    (Boolean(stock.quotePending) || !stock.price || stock.price <= 0) &&
    !(realHistory && realHistory.length > 0);
  const isHovered = hoverIndex !== null && !isQuotePending && hoveredPoint?.price > 0;
  const currentPrice = isHovered
    ? hoveredPoint.price
    : stock.price > 0
      ? stock.price
      : realHistory && realHistory.length > 0
        ? realHistory[realHistory.length - 1].price
        : 0;
  const basePrice = stockBasePrice || (stock.price - stock.change);
  const diff = isHovered ? currentPrice - basePrice : stock.change;
  const diffPct = isHovered
    ? basePrice > 0
      ? (diff / basePrice) * 100
      : 0
    : stock.changePercent;
  const isDiffPositive = diff >= 0;

  return (
    <>
      {/* Modal Top Header (Symbol, Name, Actions) */}
      <div className="flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-[#00f5d4]/20 mb-4 relative z-10 bg-[#020608]/92 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarredTicker(stock.symbol);
              triggerHaptic("light");
            }}
            className="group p-1.5 -ml-1.5 rounded-full hover:bg-[#00f5d4]/10 transition-colors"
          >
            <Star
              className={`w-6 h-6 transition-all duration-300 ${isStarred ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "text-slate-400 group-hover:text-[#00f5d4]"}`}
            />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pulsing Live-Node Beacon */}
              <span className="relative flex h-2.5 w-2.5 shrink-0" title={isQuotePending ? "Awaiting live market quote" : "Live quote feed active"}>
                <span
                  className={`xeno-beacon-ring absolute inline-flex h-full w-full rounded-full ${
                    isQuotePending ? "bg-amber-400" : "bg-[#00f5d4]"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isQuotePending
                      ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                      : "bg-[#00ff9d] shadow-[0_0_8px_#00f5d4]"
                  }`}
                />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none font-display">
                {stock.symbol}
              </h2>
              {!isQuotePending ? (
                (() => {
                  const signal = computeDeterministicSignal(stock);
                  const sbStyle = getSBScoreColor(signal.score);
                  return (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border alien-block-cut-sm transition-all ${sbStyle.badgeClass}`}
                      title={`Stock Bloc Rating: ${signal.score}/100 (${sbStyle.tier} - ${sbStyle.tierDescription})`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sbStyle.dotClass}`} />
                      <span className={`text-[10px] font-martian font-black tracking-tight ${sbStyle.textClass}`}>
                        SB {signal.score}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-400/45 bg-amber-500/12 text-amber-300 alien-block-cut-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                    QUOTE PENDING
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-cyan-200/75 font-medium mt-1">
              {stock.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onShare(stock)}
            className="p-2 sm:p-2.5 bg-[#04141d]/90 border border-[#00f5d4]/25 text-cyan-200 hover:border-[#00f5d4]/60 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 bg-[#04141d]/90 border border-[#00f5d4]/25 text-cyan-200 hover:border-[#00f5d4]/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Price & Change Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 px-6 pt-2">
        <div>
          {isQuotePending ? (
            <>
              <div className="text-2xl sm:text-3xl font-black tracking-wider font-mono text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                QUOTE PENDING
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs font-mono text-cyan-200/80">
                <span className="px-2 py-0.5 bg-[#04141d] border border-[#00f5d4]/30 text-[#00f5d4]">
                  LIVE FEED ONLY
                </span>
                {stock.symbol.toUpperCase() === "ANT" ? (
                  <span className="text-slate-300">
                    Nasdaq Debut Nov 19 · IPO $83.00 · First-Day Close $97.17 (+17.07%)
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Awaiting live market quote telemetry
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl font-black tracking-tight font-mono tabular-nums-strict text-white drop-shadow-[0_0_16px_rgba(0,245,212,0.2)]">
                $
                {currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`flex items-center font-bold text-sm font-mono tabular-nums-strict ${isDiffPositive ? "text-[#00ff9d]" : "text-rose-400"}`}
                >
                  {isDiffPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {isDiffPositive ? "+" : ""}${Math.abs(diff).toFixed(2)} (
                  {isDiffPositive ? "+" : ""}
                  {diffPct.toFixed(2)}%)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {isHovered ? "" : timeframe === "1D" ? "Today" : `Past ${timeframe}`}
                </span>
                {isHovered && (
                  <span className="text-xs text-[#00f5d4] font-mono bg-[#04141d] px-2.5 py-0.5 border border-[#00f5d4]/40">
                    {hoveredPoint.time}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tags & Screener Quick Badges */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 max-w-[300px]">
          {tradeScreener && !isQuotePending && (
            <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-400/40 text-[10px] font-martian font-bold flex items-center gap-1 shadow-sm">
                <Zap className="w-3 h-3 text-amber-400" />
                DAY: {tradeScreener.dayTrade.bias} ({tradeScreener.dayTrade.conviction}%)
              </span>
              <span className="px-2 py-0.5 bg-[#00f5d4]/12 text-[#00f5d4] border border-[#00f5d4]/40 text-[10px] font-martian font-bold flex items-center gap-1 shadow-sm">
                <TrendingUp className="w-3 h-3 text-[#00f5d4]" />
                SWING: 1:{tradeScreener.swingTrade.rewardToRiskRatio} R/R
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {stock.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#04141d]/90 border border-[#00f5d4]/25 text-cyan-200/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
