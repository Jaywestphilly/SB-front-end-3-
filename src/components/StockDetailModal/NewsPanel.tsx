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



export const NewsPanel = (props: StockDetailSubProps) => {
  const { stock, onClose, onTogglePin, onShare, onOpenBloombergTerminal, onOpenBrokerages, timeframe, setTimeframe, hoverIndex, setHoverIndex, aiAnalysis, setAiAnalysis, isAiLoading, setIsAiLoading, aiError, setAiError, displayStock, setDisplayStock, activeStock, chartMode, setChartMode, zoomLevel, setZoomLevel, panOffset, setPanOffset, showSMA, setShowSMA, showVWAP, setShowVWAP, showRSI, setShowRSI, touchStartDistRef, touchStartZoomRef, isDraggingPanRef, dragStartXRef, dragStartPanRef, isTrendlineActive, setIsTrendlineActive, isDrawingTrendline, setIsDrawingTrendline, trendline, setTrendline, paperTrades, setPaperTrades, showPaperForm, setShowPaperForm, sharesInput, setSharesInput, entryPriceInput, setEntryPriceInput, tradeType, setTradeType, tradeSuccessMsg, setTradeSuccessMsg, showAllInstitutionalHolders, setShowAllInstitutionalHolders, institutionalData, earningsReminder, setEarningsReminder, showEarningsHistory, setShowEarningsHistory, showAnalystFirms, setShowAnalystFirms, handleToggleEarningsReminder, isPrivateCompany, tickerHeadlines, analystConsensusData, symbolPaperTrades, portfolioAggregates, handleExecutePaperTrade, handleClosePosition, realHistory, setRealHistory, showOverlay, setShowOverlay, benchmarkSymbol, setBenchmarkSymbol, benchmarkHistory, setBenchmarkHistory, rsiData, fullCandleOHLCData, candleOHLCData, fullSmaValues, visibleSmaValues, fullVwapValues, visibleVwapValues, fullMacdData, macdData, fullRsiValues, visibleRsiValues, getChartCoords, startTrendline, updateTrendline, finishTrendline, trendlineMetrics, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheelZoom, handleMouseDown, handleMouseMove, handleMouseUp, history, isPositive, prices, minPrice, maxPrice, priceRange, BENCHMARK_CONFIGS, activeBenchmark, stockBasePrice, stockReturns, benchHistoryPoints, benchBasePrice, benchReturns, svgWidth, svgHeight, rightMargin, plotWidth, plotTop, plotBottom, plotHeight, minVal, maxVal, valRange, zeroY, benchmarkPathD, candleAllPrices, activeCandle, activeSma, activeVwap, activeMacd, activeRsi, activeRsiStatus, macdStatus, hoveredPoint, maxVolume, yAxisTicks, linePathD, areaPathD, smaPathD, vwapPathD, macdSvgHeight, macdMaxAbs, macdY0, getMacdY, macdLinePath, macdSignalPath, timeTicks, handleSubchartHover, rsiSvgHeight, getRsiY, rsiLinePath, pathD, areaD, activeHoverIdx, hoveredStockReturn, hoveredBenchReturn, hoveredAlpha, fetchAiAnalysis } = props;
  if (!stock) return null;
  return (
    <>
{/* LATEST MARKET HEADLINES & NEWS WIRE */}
              <div className="p-5 alien-block-cut bg-gradient-to-b from-[#031326] to-[#010912] border border-cyan-500/40 space-y-4 shadow-2xl shadow-cyan-950/40">
                <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/30 pb-3 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 alien-block-cut-sm bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-md">
                      <Newspaper className="w-5 h-5 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black font-alien-hud uppercase tracking-wider text-white">
                          {stock.symbol} Live News Wire & Intelligence
                        </h4>
                        <span className="text-[10px] font-martian px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold uppercase">
                          Priority Wire
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">
                        Breaking financial reporting, company releases & institutional market sentiment
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase block px-2.5 py-1 bg-black/60 border border-cyan-500/30 alien-block-cut-sm">
                      {tickerHeadlines.length} Verified Stories
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tickerHeadlines.length === 0 ? (
                    <div className="col-span-full p-6 alien-block-cut-sm bg-black/50 border border-white/5 text-center text-xs text-neutral-400">
                      No active news alerts reported for {stock.symbol}.
                    </div>
                  ) : (
                    tickerHeadlines.map((hl) => (
                      <a
                        key={hl.id}
                        href={hl.url || "#"}
                        target={hl.url ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="p-3.5 alien-block-cut-sm bg-[#040e1a]/90 hover:bg-[#071a30] border border-cyan-900/60 hover:border-cyan-400/60 transition-all flex flex-col justify-between gap-3 group cursor-pointer"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-martian font-black uppercase px-2 py-0.5 rounded ${
                                  hl.sentiment === "Bullish"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : hl.sentiment === "Bearish"
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                    : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                                }`}
                              >
                                {hl.sentiment}
                              </span>
                              <span className="text-[10px] font-martian text-cyan-400/90 font-bold">
                                {hl.source}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-sans">
                              {hl.timeAgo}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-neutral-100 group-hover:text-cyan-300 transition-colors leading-snug">
                            {hl.title}
                          </h5>
                        </div>
                        <div className="flex items-center justify-end text-[11px] font-alien-hud uppercase text-cyan-400 group-hover:translate-x-0.5 transition-transform pt-1 border-t border-cyan-950/60">
                          <span>Read Full Story</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>

              
    </>
  );
};
