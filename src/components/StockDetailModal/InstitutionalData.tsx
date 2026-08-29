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



export const InstitutionalData = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;
  if (!stock) return null;
  return (
    <>
{/* INSTITUTIONAL OWNERSHIP % & SMART-MONEY ACTIVITY SECTION */}
              {institutionalData && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-neutral-900 to-slate-950/80 border border-indigo-500/30 space-y-4 shadow-xl">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                        <Landmark className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            Institutional Ownership & Smart-Money Flow
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                            SEC 13F
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans">
                          Hedge fund, ETF, and sovereign fund holdings tracking
                          for{" "}
                          <strong className="text-neutral-200">
                            {stock.symbol}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Flow Sentiment & Conviction Badges */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <div className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Conviction:</span>
                        <span className="text-white font-black">
                          {institutionalData.smartMoneyConvictionScore}/10
                        </span>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1 ${
                          institutionalData.flowSentiment === "Accumulation"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : institutionalData.flowSentiment === "Distribution"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="uppercase">
                          {institutionalData.flowSentiment}
                        </span>
                        <span className="text-[10px] opacity-80">
                          ({institutionalData.quarterlyNetFlow})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Institutional Metrics KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Institutional Ownership % */}
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-indigo-500/30 space-y-1.5 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Institutional Own %</span>
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                          {institutionalData.ownershipPercent.toFixed(1)}%
                        </span>
                      </div>
                      {/* Small progress meter */}
                      <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{
                            width: `${Math.min(100, institutionalData.ownershipPercent)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-neutral-400 font-mono block">
                        {institutionalData.ownershipPercent > 70
                          ? "High Smart-Money Support"
                          : "Moderate Institutional Support"}
                      </span>
                    </div>

                    {/* Active Funds Count */}
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Total Institutions</span>
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <span className="text-lg sm:text-xl font-black font-mono text-white block">
                        {institutionalData.holdersCount.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono block">
                        Filing SEC Form 13F
                      </span>
                    </div>

                    {/* 13F Value Held */}
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>13F Position Value</span>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 block">
                        {institutionalData.totalValue}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono block truncate">
                        {institutionalData.sharesHeld} Shares
                      </span>
                    </div>

                    {/* Quarterly Net Flow */}
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        <span>Q/Q Smart Flow</span>
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span
                        className={`text-lg sm:text-xl font-black font-mono block ${
                          institutionalData.quarterlyNetFlow.startsWith("+")
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {institutionalData.quarterlyNetFlow}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono block truncate">
                        {institutionalData.buyersCount} Buyers /{" "}
                        {institutionalData.sellersCount} Sellers
                      </span>
                    </div>
                  </div>

                  {/* Ownership Distribution Spectrum Bar */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-indigo-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-neutral-200 uppercase tracking-wider text-[11px]">
                        Shareholder Structure Breakdown
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        100% Total Shares
                      </span>
                    </div>

                    {/* Multi-segment Progress Bar */}
                    <div className="w-full h-3.5 rounded-full bg-neutral-900 overflow-hidden flex border border-white/10 p-0.5 gap-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-l-full transition-all duration-500"
                        style={{
                          width: `${institutionalData.ownershipPercent}%`,
                        }}
                        title={`Institutions: ${institutionalData.ownershipPercent}%`}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{
                          width: `${institutionalData.insiderOwnershipPercent}%`,
                        }}
                        title={`Insiders & Officers: ${institutionalData.insiderOwnershipPercent}%`}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-r-full transition-all duration-500"
                        style={{
                          width: `${institutionalData.retailOwnershipPercent}%`,
                        }}
                        title={`Public & Retail: ${institutionalData.retailOwnershipPercent}%`}
                      />
                    </div>

                    {/* Spectrum Legend Pills */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                        <span className="text-neutral-300 font-bold">
                          Institutional:
                        </span>
                        <span className="text-cyan-300 font-black">
                          {institutionalData.ownershipPercent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                        <span className="text-neutral-300 font-bold">
                          Insiders/Execs:
                        </span>
                        <span className="text-emerald-300 font-black">
                          {institutionalData.insiderOwnershipPercent.toFixed(1)}
                          %
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
                        <span className="text-neutral-300 font-bold">
                          Retail / Public:
                        </span>
                        <span className="text-purple-300 font-black">
                          {institutionalData.retailOwnershipPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Buyers vs Sellers Heat Bar */}
                  <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>
                          {institutionalData.buyersCount} Accumulating
                          Institutions (
                          {Math.round(
                            (institutionalData.buyersCount /
                              (institutionalData.buyersCount +
                                institutionalData.sellersCount)) *
                              100,
                          )}
                          %)
                        </span>
                      </span>
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span>
                          {institutionalData.sellersCount} Trimming (
                          {Math.round(
                            (institutionalData.sellersCount /
                              (institutionalData.buyersCount +
                                institutionalData.sellersCount)) *
                              100,
                          )}
                          %)
                        </span>
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-rose-950/80 overflow-hidden flex border border-white/10">
                      <div
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                        style={{
                          width: `${(institutionalData.buyersCount / (institutionalData.buyersCount + institutionalData.sellersCount)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Top Institutional Holders List */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-neutral-300 tracking-wider flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                        Top Institutional Holders ({stock.symbol})
                      </span>
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          setShowAllInstitutionalHolders(
                            !showAllInstitutionalHolders,
                          );
                        }}
                        className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>
                          {showAllInstitutionalHolders
                            ? "Show Less"
                            : "View All Funds"}
                        </span>
                        {showAllInstitutionalHolders ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(showAllInstitutionalHolders
                        ? institutionalData.topHolders
                        : institutionalData.topHolders.slice(0, 3)
                      ).map((holder, idx) => (
                        <div
                          key={holder.name}
                          className="p-3 rounded-xl bg-black/60 border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="font-extrabold text-white text-xs block font-sans">
                                {holder.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono block">
                                {holder.shares} Shares • Port Weight:{" "}
                                <strong className="text-cyan-300">
                                  {holder.portfolioWeight}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            <div className="text-left sm:text-right">
                              <span className="font-black text-emerald-400 text-xs block">
                                {holder.value}
                              </span>
                              <span className="text-[9px] text-neutral-500 uppercase block">
                                13F Position Value
                              </span>
                            </div>

                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border uppercase shrink-0 ${
                                holder.changeType === "INCREASED" ||
                                holder.changeType === "NEW"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : holder.changeType === "DECREASED"
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                    : "bg-neutral-800 text-neutral-300 border-neutral-700"
                              }`}
                            >
                              {holder.changePercent}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Money Insight Box */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white uppercase font-mono text-[11px] block mb-0.5">
                        Smart-Money Structural Analysis:
                      </strong>
                      With{" "}
                      <span className="text-cyan-300 font-extrabold font-mono">
                        {institutionalData.ownershipPercent.toFixed(1)}%
                      </span>{" "}
                      of floating shares backed by tier-1 institutional asset
                      managers (
                      {institutionalData.holdersCount.toLocaleString()} funds),{" "}
                      {stock.symbol} benefits from strong long term liquidity
                      and institutional floor support during broader market
                      pullbacks.
                    </div>
                  </div>
                </div>
              )}

              
    </>
  );
};
