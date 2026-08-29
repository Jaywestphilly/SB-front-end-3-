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



export const FinancialMetrics = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;
  if (!stock) return null;
  return (
    <>
{/* CORPORATE FINANCIALS / PRIVATE CAPITAL STRUCTURE WIDGET */}
              {isPrivateCompany ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-neutral-900 to-purple-950/50 border border-indigo-500/40 space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                        <Building2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            Private Corporate Capital Structure
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                            Pre-IPO / Reg D
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans">
                          Institutional secondary tender disclosures for{" "}
                          <strong className="text-neutral-200">
                            {stock.name} ({stock.symbol})
                          </strong>
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-mono font-bold text-indigo-300">
                      SEC Reg D Exemption
                    </div>
                  </div>

                  {/* Private Financial Disclosures Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-neutral-950 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Valuation Method</span>
                        <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-lg font-black font-mono text-white block">
                          Tender Offer Markups
                        </span>
                        <span className="text-[11px] text-neutral-400 font-sans block mt-1">
                          Est. Valuation: <strong className="text-indigo-300">{stock.marketCap || "$350B - $400B"}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Primary Revenue Engines</span>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-200 block leading-snug">
                          Starlink Orbit Constellation & Launch Manifests
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-1">
                          Starship V3 & Falcon 9 Commercial Payload Contracts
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>SEC Filing Notice</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">
                          No Public Quarterly SEC EPS
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-1">
                          Private entity. Does not issue public 10-Q SEC reports.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/70 via-neutral-900 to-yellow-950/40 border border-amber-500/30 space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                        <Calendar className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            Corporate SEC Earnings Filings
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                            Official Calendar
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans">
                          SEC EDGAR quarterly filing tracking & official corporate reports for{" "}
                          <strong className="text-neutral-200">
                            {stock.symbol}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleEarningsReminder}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                        earningsReminder
                          ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 font-black"
                          : "bg-neutral-900/80 text-amber-300 border-amber-500/30 hover:bg-neutral-800"
                      }`}
                    >
                      {earningsReminder ? (
                        <>
                          <BellRing className="w-3.5 h-3.5 text-black animate-bounce" />
                          <span>Alert Active</span>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>Track Filings</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Public Corporate Filing Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Filing Status</span>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-amber-300 block">
                          Next Fiscal Quarter
                        </span>
                        <span className="text-[11px] text-white block mt-1">
                          Official Date Pending SEC Distribution
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Price Target Consensus</span>
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <span className="text-xl font-black font-mono text-white block">
                          {stock.targetPrice ? `$${stock.targetPrice.toFixed(2)}` : "N/A"}
                        </span>
                        <span className="text-[11px] text-cyan-400 font-bold block mt-1">
                          Rating: {stock.rating || "Moderate Buy"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Corporate Reporting Policy</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">
                          Real-time SEC EDGAR Sync
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-1">
                          Official 10-Q & 8-K press releases are updated immediately upon distribution.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
{/* ANALYST CONSENSUS WIDGET */}
              {analystConsensusData && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-neutral-900 to-cyan-950/40 border border-emerald-500/30 space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                        <Target className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            Analyst Consensus & Price Targets
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                            {analystConsensusData.totalAnalysts} Analysts
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans">
                          Wall Street rating distribution and consensus price
                          targets for{" "}
                          <strong className="text-neutral-200">
                            {stock.symbol}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Toggle Firm Breakdown Drawer */}
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setShowAnalystFirms(!showAnalystFirms);
                      }}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 bg-neutral-900/80 text-emerald-300 border-emerald-500/30 hover:bg-neutral-800"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {showAnalystFirms
                          ? "Hide Firm Ratings"
                          : "Wall Street Ratings"}
                      </span>
                      {showAnalystFirms ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Primary Overview Cards: Consensus Rating & Average Price Target */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Consensus Rating Card */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-emerald-500/30 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Consensus Recommendation</span>
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <span
                          className={`inline-block text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${analystConsensusData.labelBadgeColor}`}
                        >
                          {analystConsensusData.consensusLabel}
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="text-2xl font-black font-mono text-white">
                            {analystConsensusData.consensusScore}
                          </span>
                          <span className="text-xs font-mono text-neutral-400 font-semibold">
                            / 5.0 Rating Score
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Average Price Target Card */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Avg Price Target</span>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono text-emerald-400">
                            ${analystConsensusData.avgPriceTarget.toFixed(2)}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            +{analystConsensusData.upsidePercent}% Upside
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-neutral-400 block mt-1">
                          Current:{" "}
                          <strong className="text-white">
                            ${analystConsensusData.currentPrice.toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Target Range (Low vs High) */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Price Target Range</span>
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-rose-400 font-bold">
                            Low: $
                            {analystConsensusData.lowPriceTarget.toFixed(2)}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            High: $
                            {analystConsensusData.highPriceTarget.toFixed(2)}
                          </span>
                        </div>
                        {/* Range slider visual representation */}
                        <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden relative border border-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <p className="text-[10px] text-neutral-400 text-center font-mono">
                          Wall Street Spread: $
                          {(
                            analystConsensusData.highPriceTarget -
                            analystConsensusData.lowPriceTarget
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution Visual Bar & Counts */}
                  <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Rating Breakdown ({analystConsensusData.totalAnalysts}{" "}
                          Total Analysts)
                        </span>
                      </span>
                    </div>

                    {/* Stacked Percentage Bar */}
                    <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden flex border border-white/10">
                      {analystConsensusData.strongBuyPct > 0 && (
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{
                            width: `${analystConsensusData.strongBuyPct}%`,
                          }}
                          title={`Strong Buy: ${analystConsensusData.strongBuyCount} (${analystConsensusData.strongBuyPct}%)`}
                        />
                      )}
                      {analystConsensusData.buyPct > 0 && (
                        <div
                          className="h-full bg-emerald-400/80 transition-all duration-300"
                          style={{ width: `${analystConsensusData.buyPct}%` }}
                          title={`Buy: ${analystConsensusData.buyCount} (${analystConsensusData.buyPct}%)`}
                        />
                      )}
                      {analystConsensusData.holdPct > 0 && (
                        <div
                          className="h-full bg-amber-400 transition-all duration-300"
                          style={{ width: `${analystConsensusData.holdPct}%` }}
                          title={`Hold: ${analystConsensusData.holdCount} (${analystConsensusData.holdPct}%)`}
                        />
                      )}
                      {analystConsensusData.sellPct > 0 && (
                        <div
                          className="h-full bg-orange-500 transition-all duration-300"
                          style={{ width: `${analystConsensusData.sellPct}%` }}
                          title={`Sell: ${analystConsensusData.sellCount} (${analystConsensusData.sellPct}%)`}
                        />
                      )}
                      {analystConsensusData.strongSellPct > 0 && (
                        <div
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{
                            width: `${analystConsensusData.strongSellPct}%`,
                          }}
                          title={`Strong Sell: ${analystConsensusData.strongSellCount} (${analystConsensusData.strongSellPct}%)`}
                        />
                      )}
                    </div>

                    {/* Interactive Legend Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-neutral-900 border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-neutral-300 font-bold">
                            Strong Buy
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-400">
                          {analystConsensusData.strongBuyCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-900 border border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                          <span className="text-neutral-300 font-bold">
                            Buy
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-300">
                          {analystConsensusData.buyCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-900 border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="text-neutral-300 font-bold">
                            Hold
                          </span>
                        </div>
                        <span className="font-extrabold text-amber-400">
                          {analystConsensusData.holdCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-900 border border-orange-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          <span className="text-neutral-300 font-bold">
                            Sell
                          </span>
                        </div>
                        <span className="font-extrabold text-orange-400">
                          {analystConsensusData.sellCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-neutral-900 border border-rose-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span className="text-neutral-300 font-bold">
                            Strong Sell
                          </span>
                        </div>
                        <span className="font-extrabold text-rose-400">
                          {analystConsensusData.strongSellCount}
                        </span>
                      </div>
                    </div>

                    {/* Wall Street Firm Ratings Drawer */}
                    {showAnalystFirms && (
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">
                          Recent Major Wall Street Firm Price Targets
                        </span>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          {analystConsensusData.firms.map((firm) => (
                            <div
                              key={firm.name}
                              className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-400" />
                                <div>
                                  <span className="font-bold text-white block">
                                    {firm.name}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    {firm.analyst} • {firm.date}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {firm.rating}
                                </span>
                                <div className="text-right">
                                  <span className="text-xs font-black text-white block">
                                    ${firm.target}
                                  </span>
                                  <span className="text-[9px] text-emerald-400 font-bold uppercase">
                                    {firm.action}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Statistics Grid */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  Key Metrics
                </h4>

                {/* Asymmetry Matrix Banner if applicable */}
                {(stock.asymmetryPotentialStars !== undefined ||
                  stock.probabilityOfSuccess) && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {stock.asymmetryPotentialStars !== undefined && (
                      <div>
                        <span className="text-[10px] text-amber-400/80 font-mono font-bold uppercase block">
                          Asymmetry Upside Potential
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-amber-300 font-extrabold text-sm">
                            {"★".repeat(
                              Math.floor(stock.asymmetryPotentialStars),
                            )}
                            {stock.asymmetryPotentialStars % 1 !== 0 ? "½" : ""}
                          </span>
                          <span className="text-amber-200 font-mono font-black text-xs">
                            ({stock.asymmetryPotentialStars} Stars)
                          </span>
                        </div>
                      </div>
                    )}

                    {stock.probabilityOfSuccess && (
                      <div>
                        <span className="text-[10px] text-amber-400/80 font-mono font-bold uppercase block">
                          Probability of Success
                        </span>
                        <span className="text-emerald-400 font-mono font-black text-xs mt-0.5 block">
                          {stock.probabilityOfSuccess}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-neutral-400 font-medium">
                      Market Cap
                    </p>
                    <p className="text-base font-bold font-mono text-white mt-0.5">
                      {stock.marketCap}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-neutral-400 font-medium">
                      Volume
                    </p>
                    <p className="text-base font-bold font-mono text-white mt-0.5">
                      {stock.volume}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-neutral-400 font-medium">
                      52W High
                    </p>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                      ${stock.high52.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] text-neutral-400 font-medium">
                      52W Low
                    </p>
                    <p className="text-base font-bold font-mono text-rose-400 mt-0.5">
                      ${stock.low52.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-cyan-300 font-medium flex items-center justify-between">
                      <span>RSI (14)</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          rsiData.status === "Overbought"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : rsiData.status === "Oversold"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {rsiData.status}
                      </span>
                    </p>
                    <p
                      className={`text-base font-black font-mono mt-0.5 ${
                        rsiData.status === "Overbought"
                          ? "text-amber-300"
                          : rsiData.status === "Oversold"
                            ? "text-emerald-300"
                            : "text-cyan-200"
                      }`}
                    >
                      {rsiData.rsi.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              
    </>
  );
};
