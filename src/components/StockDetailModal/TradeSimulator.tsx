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



export const TradeSimulator = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;
  if (!stock) return null;
  return (
    <>
{/* PORTFOLIO POSITION TRACKER & P/L CALCULATOR */}
              {(showPaperForm || paperTrades.length > 0) && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-neutral-900 to-teal-950/50 border border-emerald-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                        <Calculator className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">
                            Portfolio Position Tracker
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                            {stock.symbol}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans">
                          Calculate live position market value, cost basis, and
                          unrealized gain/loss ($ & %)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setShowPaperForm(!showPaperForm);
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      {showPaperForm
                        ? "Hide Calculator"
                        : "+ Tracker Calculator"}
                    </button>
                  </div>

                  {/* Portfolio Tracker & P/L Calculator Controls */}
                  {showPaperForm &&
                    (() => {
                      const currentShares = Math.max(0, sharesInput || 0);
                      const costBasis = Math.max(0, entryPriceInput || 0);
                      const totalCurrentValue = currentShares * stock.price;
                      const totalCostBasis = currentShares * costBasis;
                      const unrealizedPLDollar =
                        tradeType === "BUY"
                          ? totalCurrentValue - totalCostBasis
                          : totalCostBasis - totalCurrentValue;
                      const unrealizedPLPercent =
                        totalCostBasis > 0
                          ? (unrealizedPLDollar / totalCostBasis) * 100
                          : 0;
                      const isProfitable = unrealizedPLDollar >= 0;
                      const dailyPL = currentShares * stock.change;

                      return (
                        <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/20 space-y-4">
                          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                            <span className="font-extrabold text-white flex items-center gap-1.5">
                              <Activity className="w-4 h-4 text-emerald-400" />{" "}
                              Live Position P/L Metrics
                            </span>
                            {tradeSuccessMsg && (
                              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                                <Check className="w-3.5 h-3.5" />{" "}
                                {tradeSuccessMsg}
                              </span>
                            )}
                          </div>

                          {/* Real time Calculated P/L Output Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {/* Current Position Value */}
                            <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 space-y-1">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Total Value
                              </span>
                              <span className="text-sm sm:text-base font-black font-mono text-white block">
                                $
                                {totalCurrentValue.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-[9px] text-neutral-500 font-mono block truncate">
                                {currentShares} sh @ ${stock.price.toFixed(2)}
                              </span>
                            </div>

                            {/* Cost Basis */}
                            <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 space-y-1">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Cost Basis
                              </span>
                              <span className="text-sm sm:text-base font-black font-mono text-neutral-300 block">
                                $
                                {totalCostBasis.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-[9px] text-neutral-500 font-mono block truncate">
                                Avg ${costBasis.toFixed(2)} / sh
                              </span>
                            </div>

                            {/* Unrealized P/L */}
                            <div
                              className={`p-3 rounded-xl bg-neutral-950 border space-y-1 ${
                                isProfitable
                                  ? "border-emerald-500/40 bg-emerald-950/20"
                                  : "border-rose-500/40 bg-rose-950/20"
                              }`}
                            >
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Unrealized P/L
                              </span>
                              <span
                                className={`text-sm sm:text-base font-black font-mono flex items-center gap-0.5 ${
                                  isProfitable
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {isProfitable ? "+" : ""}$
                                {unrealizedPLDollar.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold block ${
                                  isProfitable
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {isProfitable ? "+" : ""}
                                {unrealizedPLPercent.toFixed(2)}%
                              </span>
                            </div>

                            {/* Today's Return */}
                            <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 space-y-1">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                                Today's P/L
                              </span>
                              <span
                                className={`text-sm sm:text-base font-black font-mono block ${
                                  dailyPL >= 0
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {dailyPL >= 0 ? "+" : ""}$
                                {dailyPL.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-[9px] text-neutral-500 font-mono block truncate">
                                {stock.changePercent >= 0 ? "+" : ""}
                                {stock.changePercent.toFixed(2)}% 1D
                              </span>
                            </div>
                          </div>

                          {/* Position Inputs Form */}
                          <div className="space-y-3 pt-1">
                            {/* Order Type Toggle */}
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                              <button
                                onClick={() => setTradeType("BUY")}
                                className={`py-2 rounded-xl transition-all cursor-pointer ${
                                  tradeType === "BUY"
                                    ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                                }`}
                              >
                                LONG (BUY)
                              </button>
                              <button
                                onClick={() => setTradeType("SHORT")}
                                className={`py-2 rounded-xl transition-all cursor-pointer ${
                                  tradeType === "SHORT"
                                    ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/20"
                                    : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                                }`}
                              >
                                SHORT (SELL)
                              </button>
                            </div>

                            {/* Shares Input & Presets */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-extrabold text-neutral-300 uppercase">
                                  Number of Shares
                                </label>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  Position Quantity
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={sharesInput}
                                  onChange={(e) =>
                                    setSharesInput(
                                      Math.max(1, Number(e.target.value)),
                                    )
                                  }
                                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 font-mono font-bold text-white text-sm focus:outline-none focus:border-emerald-500"
                                  placeholder="Quantity"
                                />
                                <div className="flex gap-1 flex-wrap">
                                  {[10, 25, 50, 100, 500].map((preset) => (
                                    <button
                                      key={preset}
                                      onClick={() => {
                                        triggerHaptic("selection");
                                        setSharesInput(preset);
                                      }}
                                      className={`px-2.5 py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                                        sharesInput === preset
                                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                                          : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
                                      }`}
                                    >
                                      {preset}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Cost Basis Input */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-extrabold text-neutral-300 uppercase">
                                  Average Cost Basis ($/Share)
                                </label>
                                <button
                                  onClick={() => {
                                    triggerHaptic("selection");
                                    setEntryPriceInput(stock.price);
                                  }}
                                  className="text-[10px] font-extrabold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  Use Market Price (${stock.price.toFixed(2)})
                                </button>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                value={entryPriceInput}
                                onChange={(e) =>
                                  setEntryPriceInput(Number(e.target.value))
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 font-mono font-bold text-white text-sm focus:outline-none focus:border-emerald-500"
                                placeholder="Average buy price per share"
                              />
                            </div>

                            {/* Submit Button */}
                            <button
                              onClick={handleExecutePaperTrade}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Save Position to Portfolio Tracker</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Active Positions List for this Symbol */}
                  {symbolPaperTrades.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">
                        Tracked Positions for {stock.symbol} (
                        {symbolPaperTrades.length})
                      </span>
                      <div className="space-y-2">
                        {symbolPaperTrades.map((pt) => {
                          const totalCost = pt.shares * pt.entryPrice;
                          const currentValue = pt.shares * stock.price;
                          const plDollar =
                            pt.type === "BUY"
                              ? currentValue - totalCost
                              : totalCost - currentValue;
                          const plPercent =
                            pt.entryPrice > 0
                              ? (plDollar / totalCost) * 100
                              : 0;
                          const isProfitable = plDollar >= 0;

                          return (
                            <div
                              key={pt.id}
                              className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                      pt.type === "BUY"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-rose-500/20 text-rose-400"
                                    }`}
                                  >
                                    {pt.type}
                                  </span>
                                  <span className="font-extrabold text-white">
                                    {pt.shares} Shares @ $
                                    {pt.entryPrice.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    ({pt.entryDate})
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-300 font-mono">
                                  Cost: $
                                  {totalCost.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}{" "}
                                  • Value: $
                                  {currentValue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <div className="text-right">
                                  <span
                                    className={`block font-black text-sm font-mono ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}
                                  >
                                    {isProfitable ? "+" : ""}$
                                    {plDollar.toFixed(2)} (
                                    {isProfitable ? "+" : ""}
                                    {plPercent.toFixed(2)}%)
                                  </span>
                                  <span className="text-[9px] text-neutral-500 uppercase font-bold">
                                    Unrealized P/L
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleClosePosition(pt.id)}
                                  className="p-2 rounded-lg bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition-all cursor-pointer"
                                  title="Close / Remove Position"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PORTFOLIO OVERVIEW & AGGREGATE BREAKDOWN */}
                  {portfolioAggregates.distribution.length > 0 && (
                    <div className="p-4 rounded-xl bg-black/70 border border-emerald-500/20 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                          <PieChartIcon className="w-4 h-4 text-emerald-400" />
                          <span>
                            Portfolio Overview & Holdings Distribution
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          {portfolioAggregates.distribution.length} Assets •{" "}
                          {portfolioAggregates.totalPositions} Positions
                        </span>
                      </div>

                      {/* Aggregate Stat Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {/* Total Equity Card */}
                        <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase font-bold">
                            <Wallet className="w-3 h-3 text-cyan-400" />
                            <span>Total Equity</span>
                          </div>
                          <div className="text-base font-black font-mono text-white">
                            $
                            {portfolioAggregates.totalEquity.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </div>
                        </div>

                        {/* Total Cost Basis Card */}
                        <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase font-bold">
                            <DollarSign className="w-3 h-3 text-amber-400" />
                            <span>Total Cost Basis</span>
                          </div>
                          <div className="text-base font-black font-mono text-neutral-300">
                            $
                            {portfolioAggregates.totalCost.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </div>
                        </div>

                        {/* Total Gain/Loss Card */}
                        <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                          <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase font-bold">
                            {portfolioAggregates.totalGainLoss >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-400" />
                            )}
                            <span>Total Gain / Loss</span>
                          </div>
                          <div
                            className={`text-base font-black font-mono ${portfolioAggregates.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {portfolioAggregates.totalGainLoss >= 0 ? "+" : ""}$
                            {portfolioAggregates.totalGainLoss.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}{" "}
                            ({portfolioAggregates.totalGainLoss >= 0 ? "+" : ""}
                            {portfolioAggregates.totalGainLossPercent.toFixed(
                              2,
                            )}
                            %)
                          </div>
                        </div>
                      </div>

                      {/* Pie Chart & Holdings Allocation Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                        {/* Recharts Pie Chart */}
                        <div className="h-48 w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={portfolioAggregates.distribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                                nameKey="name"
                              >
                                {portfolioAggregates.distribution.map(
                                  (entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                      stroke="#000"
                                      strokeWidth={2}
                                    />
                                  ),
                                )}
                              </Pie>
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/20 text-xs space-y-1 font-mono shadow-2xl">
                                        <div className="font-extrabold text-white flex items-center gap-1.5">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{
                                              backgroundColor: data.color,
                                            }}
                                          />
                                          <span>{data.name}</span>
                                          <span className="text-[10px] text-neutral-400 font-sans">
                                            ({data.allocationPercent.toFixed(1)}
                                            %)
                                          </span>
                                        </div>
                                        <div className="text-emerald-400 font-bold">
                                          $
                                          {data.value.toLocaleString(
                                            undefined,
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            },
                                          )}
                                        </div>
                                        <div className="text-[10px] text-neutral-400 font-sans">
                                          {data.shares} Shares • P/L:{" "}
                                          <span
                                            className={
                                              data.gainLoss >= 0
                                                ? "text-emerald-400 font-bold"
                                                : "text-rose-400 font-bold"
                                            }
                                          >
                                            {data.gainLoss >= 0 ? "+" : ""}$
                                            {data.gainLoss.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Donut Center Label */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                              Holdings
                            </span>
                            <span className="text-xs font-black font-mono text-emerald-400">
                              {portfolioAggregates.distribution.length} Assets
                            </span>
                          </div>
                        </div>

                        {/* Holdings List with Allocation Progress Bars */}
                        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                          <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block">
                            Distribution Breakdown
                          </span>
                          {portfolioAggregates.distribution.map((item) => (
                            <div
                              key={item.name}
                              className="p-2 rounded-lg bg-neutral-950/80 border border-white/5 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-bold text-white">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span>{item.name}</span>
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    ({item.shares} sh)
                                  </span>
                                </div>
                                <div className="text-right font-mono font-extrabold text-white text-[11px]">
                                  $
                                  {item.value.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  <span className="text-[10px] text-cyan-400 ml-1.5 font-sans font-bold">
                                    {item.allocationPercent.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              {/* Allocation Progress Bar */}
                              <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, item.allocationPercent)}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Paper Trade Form */}
                  {showPaperForm && (
                    <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/20 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Calculator className="w-4 h-4 text-emerald-400" />{" "}
                          Virtual Trade Calculator
                        </span>
                        {tradeSuccessMsg && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> {tradeSuccessMsg}
                          </span>
                        )}
                      </div>

                      {/* Order Type Toggle */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <button
                          onClick={() => setTradeType("BUY")}
                          className={`py-2 rounded-xl transition-all cursor-pointer ${
                            tradeType === "BUY"
                              ? "bg-emerald-500 text-black font-black"
                              : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                          }`}
                        >
                          BUY (LONG)
                        </button>
                        <button
                          onClick={() => setTradeType("SHORT")}
                          className={`py-2 rounded-xl transition-all cursor-pointer ${
                            tradeType === "SHORT"
                              ? "bg-rose-500 text-white font-black"
                              : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                          }`}
                        >
                          SELL (SHORT)
                        </button>
                      </div>

                      {/* Shares Input & Quick Presets */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 uppercase block">
                          Position Size (Shares)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={sharesInput}
                            onChange={(e) =>
                              setSharesInput(
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 font-mono font-bold text-white text-sm focus:outline-none focus:border-emerald-500"
                          />
                          <div className="flex gap-1">
                            {[10, 50, 100, 500].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => setSharesInput(preset)}
                                className="px-2.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-mono font-bold cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Entry Price Input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 uppercase block">
                          Virtual Entry Price ($)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={entryPriceInput}
                            onChange={(e) =>
                              setEntryPriceInput(Number(e.target.value))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 font-mono font-bold text-white text-sm focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => setEntryPriceInput(stock.price)}
                            className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer"
                          >
                            Use Market Price
                          </button>
                        </div>
                      </div>

                      {/* Total Virtual Cost Summary */}
                      <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-400 font-sans">
                          Total Position Value:
                        </span>
                        <span className="text-emerald-400 font-extrabold text-sm">
                          $
                          {(sharesInput * entryPriceInput).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleExecutePaperTrade}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Confirm Virtual Position</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              
    </>
  );
};
