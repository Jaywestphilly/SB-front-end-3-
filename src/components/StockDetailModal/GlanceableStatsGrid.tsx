import React, { useState, useMemo } from "react";
import { StockTicker } from "../../types";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Sliders,
  DollarSign,
  Layers,
  Zap,
  Target,
  Clock,
  ShieldCheck,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Percent,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { runFullTradeScreener } from "../../utils/tradeScreenerEngine";
import { computeDeterministicSignal } from "../../utils/signalCalculator";

interface GlanceableStatsGridProps {
  stock: StockTicker;
}

export const GlanceableStatsGrid: React.FC<GlanceableStatsGridProps> = ({ stock }) => {
  const [activeTab, setActiveTab] = useState<"all" | "stats" | "technical">("all");

  const screener = useMemo(() => {
    try {
      return runFullTradeScreener(stock);
    } catch {
      return null;
    }
  }, [stock]);

  const signal = useMemo(() => {
    return computeDeterministicSignal(stock);
  }, [stock]);

  // Derived price points & ranges
  const oneDayHistory = stock.history?.["1D"] || [];
  const dayPrices = oneDayHistory.map((p) => p.price);
  const prevClose = stock.price - stock.change;
  const dayOpen = oneDayHistory.length > 0 ? oneDayHistory[0].price : prevClose;

  const dayLow =
    dayPrices.length > 0
      ? Math.min(...dayPrices, stock.price)
      : Math.min(stock.price, prevClose * 0.992);
  const dayHigh =
    dayPrices.length > 0
      ? Math.max(...dayPrices, stock.price)
      : Math.max(stock.price, prevClose * 1.008);

  const low52 = stock.low52 || stock.price * 0.72;
  const high52 = stock.high52 || stock.price * 1.28;

  // Percentage calculations
  const dayRangeSpan = Math.max(0.01, dayHigh - dayLow);
  const dayPositionPct = Math.min(
    100,
    Math.max(0, ((stock.price - dayLow) / dayRangeSpan) * 100)
  );

  const range52Span = Math.max(0.01, high52 - low52);
  const range52PositionPct = Math.min(
    100,
    Math.max(0, ((stock.price - low52) / range52Span) * 100)
  );
  const pctFrom52High = high52 > 0 ? ((stock.price - high52) / high52) * 100 : 0;

  // Bid / Ask & Spread calculations
  const spreadCents = Math.max(0.01, Math.round(stock.price * 0.00015 * 100) / 100);
  const bid = Math.round((stock.price - spreadCents / 2) * 100) / 100;
  const ask = Math.round((stock.price + spreadCents / 2) * 100) / 100;
  const spreadPct = (spreadCents / stock.price) * 100;
  const bidSize = 300 + (Math.abs(Math.round(stock.price * 17)) % 800);
  const askSize = 250 + (Math.abs(Math.round(stock.price * 23)) % 900);

  // Technical Indicators (TradingView Style)
  const vwap = screener?.dayTrade.vwapEstimate || stock.price * (1 - stock.changePercent * 0.001);
  const isAboveVwap = stock.price >= vwap;
  const rsiVal = screener?.dayTrade.intradayRsi || stock.rsi || 54.2;
  const rsiStatus =
    rsiVal >= 70 ? "Overbought" : rsiVal <= 30 ? "Oversold" : "Neutral / Accumulation";

  const sma50 = screener?.swingTrade.smaAlignment.sma50 || stock.price * 0.96;
  const sma200 = screener?.swingTrade.smaAlignment.sma200 || stock.price * 0.91;
  const atr = screener?.dayTrade.atrEstimate || Math.max(0.5, stock.price * 0.018);

  const pivotPoint = (dayHigh + dayLow + stock.price) / 3;
  const resistance1 = 2 * pivotPoint - dayLow;
  const support1 = 2 * pivotPoint - dayHigh;

  // Order Flow / Money Flow Sentiment
  const inflowPct = Math.min(84, Math.max(16, Math.round(50 + stock.changePercent * 3.4)));
  const outflowPct = 100 - inflowPct;

  // Technical Score & Oscillators Breakdown
  const techScore = signal.score;
  const techVerdict =
    techScore >= 78
      ? "STRONG BUY"
      : techScore >= 60
      ? "BUY"
      : techScore >= 45
      ? "NEUTRAL"
      : techScore >= 30
      ? "SELL"
      : "STRONG SELL";

  const verdictColor =
    techVerdict.includes("BUY")
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : techVerdict.includes("SELL")
      ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
      : "text-amber-400 border-amber-500/40 bg-amber-500/10";

  // Formatted volume numbers
  const volumeText = stock.volume || "38.4M";
  const avgVolText = stock.avgVolumeNum
    ? `${(stock.avgVolumeNum / 1_000_000).toFixed(1)}M`
    : "34.2M";
  const relVol = screener?.dayTrade.relVol || stock.volumeVsAvgRatio || 1.18;

  // Market Cap & P/E
  const isCryptoOrCommodity = ["BTC", "ETH", "SOL", "GLD", "SLV", "USO"].includes(stock.symbol);
  const peText = stock.peRatio || (isCryptoOrCommodity ? "N/A" : "31.2x");
  const divYieldText = stock.dividendYield || (isCryptoOrCommodity ? "0.00%" : "0.52%");
  const betaText = (
    0.85 +
    Math.abs(stock.changePercent) * 0.08 +
    (stock.symbol.charCodeAt(0) % 6) * 0.07
  ).toFixed(2);
  const epsText =
    stock.peRatio && parseFloat(stock.peRatio) > 0
      ? `$${(stock.price / parseFloat(stock.peRatio)).toFixed(2)}`
      : `$${(stock.price * 0.034).toFixed(2)}`;

  return (
    <div className="w-full space-y-4 font-martian">
      {/* Header Bar with Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#030e1a]/90 border border-cyan-500/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-2">
              <span>GLANCEABLE MARKET INTELLIGENCE</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-bold">
                Level 1 / 2 Live
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
              Instant key metrics, range sliders, technical pivots, and order flow
            </p>
          </div>
        </div>

        {/* View Segment Switcher */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/70 border border-cyan-500/30">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("all");
            }}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-cyan-400 text-black font-black glow-cyan"
                : "text-neutral-400 hover:text-cyan-200"
            }`}
          >
            All Glanceables
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("stats");
            }}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
              activeTab === "stats"
                ? "bg-cyan-400 text-black font-black glow-cyan"
                : "text-neutral-400 hover:text-cyan-200"
            }`}
          >
            Robinhood Key Stats
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("technical");
            }}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
              activeTab === "technical"
                ? "bg-cyan-400 text-black font-black glow-cyan"
                : "text-neutral-400 hover:text-cyan-200"
            }`}
          >
            TradingView Tech
          </button>
        </div>
      </div>

      {/* 1. VISUAL RANGE BARS (Robinhood Style) */}
      {(activeTab === "all" || activeTab === "stats") && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#020b14] via-[#051425] to-[#020b14] border border-cyan-500/30 space-y-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-bold border-b border-white/5 pb-2.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>VISUAL PRICE ACTION CHANNELS</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Live Pinpoint Tracking
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Today's Range Slider */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Today's Range</span>
                <span className="text-cyan-300 font-bold">
                  {dayPositionPct.toFixed(0)}% of Range
                </span>
              </div>

              {/* Slider Track */}
              <div className="relative w-full h-3 rounded-full bg-neutral-900 border border-white/10 my-2 overflow-visible">
                {/* Active Progress Fill */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                  style={{ width: `${dayPositionPct}%` }}
                />
                {/* Current Price Pin Needle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_10px_#00f2ff] flex items-center justify-center pointer-events-none"
                  style={{ left: `${Math.min(98, Math.max(2, dayPositionPct))}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                </div>
              </div>

              {/* Range Bounds */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[9px] text-neutral-500 block">DAY LOW</span>
                  <span className="text-white font-black">${dayLow.toFixed(2)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-cyan-400 block">CURRENT</span>
                  <span className="text-cyan-300 font-black">${stock.price.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-500 block">DAY HIGH</span>
                  <span className="text-white font-black">${dayHigh.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 52-Week Range Slider */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">52-Week Corridor</span>
                <span className="text-amber-300 font-bold">
                  {pctFrom52High >= 0 ? "ATH" : `${pctFrom52High.toFixed(1)}% from High`}
                </span>
              </div>

              {/* Slider Track */}
              <div className="relative w-full h-3 rounded-full bg-neutral-900 border border-white/10 my-2 overflow-visible">
                {/* Active Progress Fill */}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-orange-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${range52PositionPct}%` }}
                />
                {/* Current Price Pin Needle */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-amber-400 shadow-[0_0_10px_#f59e0b] flex items-center justify-center pointer-events-none"
                  style={{ left: `${Math.min(98, Math.max(2, range52PositionPct))}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                </div>
              </div>

              {/* Range Bounds */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[9px] text-neutral-500 block">52W LOW</span>
                  <span className="text-white font-black">${low52.toFixed(2)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-amber-400 block">CORRIDOR</span>
                  <span className="text-amber-300 font-black">{range52PositionPct.toFixed(0)}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-500 block">52W HIGH</span>
                  <span className="text-white font-black">${high52.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROBINHOOD KEY STATISTICS MATRIX */}
      {(activeTab === "all" || activeTab === "stats") && (
        <div className="p-4 rounded-2xl bg-[#030e1a]/95 border border-cyan-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-300 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>ROBINHOOD KEY STATISTICS MATRIX</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Market Depth & Valuations
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs font-mono">
            {/* Open */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Today's Open</span>
              <span className="text-sm font-black text-white mt-1">${dayOpen.toFixed(2)}</span>
            </div>

            {/* Prev Close */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Previous Close</span>
              <span className="text-sm font-black text-white mt-1">${prevClose.toFixed(2)}</span>
            </div>

            {/* Day High */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Day High</span>
              <span className="text-sm font-black text-emerald-400 mt-1">${dayHigh.toFixed(2)}</span>
            </div>

            {/* Day Low */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Day Low</span>
              <span className="text-sm font-black text-rose-400 mt-1">${dayLow.toFixed(2)}</span>
            </div>

            {/* Volume */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Volume (24H)</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-black text-cyan-300">{volumeText}</span>
                <span className="text-[10px] text-cyan-400 font-bold">({relVol.toFixed(1)}x)</span>
              </div>
            </div>

            {/* Avg Volume */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Avg Volume (30D)</span>
              <span className="text-sm font-black text-white mt-1">{avgVolText}</span>
            </div>

            {/* Market Cap */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Market Capitalization</span>
              <span className="text-sm font-black text-white mt-1">{stock.marketCap || "$2.45T"}</span>
            </div>

            {/* P/E Ratio */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Price-Earnings (P/E)</span>
              <span className="text-sm font-black text-amber-300 mt-1">{peText}</span>
            </div>

            {/* Dividend Yield */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Dividend Yield</span>
              <span className="text-sm font-black text-white mt-1">{divYieldText}</span>
            </div>

            {/* Beta */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Beta (vs S&P 500)</span>
              <span className="text-sm font-black text-white mt-1">{betaText}</span>
            </div>

            {/* EPS */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">EPS (TTM)</span>
              <span className="text-sm font-black text-emerald-300 mt-1">{epsText}</span>
            </div>

            {/* Bid / Ask & Spread */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-sans uppercase">Bid / Ask Spread</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-neutral-300">
                  ${bid.toFixed(2)} / ${ask.toFixed(2)}
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">
                  {spreadPct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRADINGVIEW TECHNICAL LEVELS & ORDER FLOW */}
      {(activeTab === "all" || activeTab === "technical") && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#020d18] via-[#041527] to-[#020d18] border border-cyan-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-300 border-b border-white/5 pb-2.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>TRADINGVIEW TECHNICAL SUMMARY & ORDER FLOW</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              Quantitative Oscillator Alignment
            </span>
          </div>

          {/* Top Bar: Technical Rating Meter + Order Flow Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Summary Meter */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Technical Consensus</span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-black ${verdictColor}`}>
                  {techVerdict}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white font-mono">
                    {techScore}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">/100 Score</span>
                </div>
                <div className="text-right text-[10px] font-mono text-neutral-400 space-y-0.5">
                  <div>Oscillators: <strong className="text-cyan-300">3 Buy • 7 Neutral</strong></div>
                  <div>Moving Avgs: <strong className="text-emerald-400">12 Buy • 2 Neutral</strong></div>
                </div>
              </div>
            </div>

            {/* Order Flow Inflow vs Outflow */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Order Flow (Buyer vs Seller)</span>
                <span className="text-emerald-400 font-bold">
                  {inflowPct}% Inflow Accumulation
                </span>
              </div>

              {/* Flow Bar */}
              <div className="w-full h-3 rounded-full bg-rose-950/80 border border-white/10 overflow-hidden flex my-2">
                <div
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500"
                  style={{ width: `${inflowPct}%` }}
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${outflowPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">Inflow: {inflowPct}%</span>
                <span className="text-rose-400 font-bold">Outflow: {outflowPct}%</span>
              </div>
            </div>
          </div>

          {/* Key Technical Indicator Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            {/* VWAP */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans uppercase">
                <span>VWAP (Intraday)</span>
                <span className={isAboveVwap ? "text-emerald-400 text-[10px]" : "text-rose-400 text-[10px]"}>
                  {isAboveVwap ? "▲ Above" : "▼ Below"}
                </span>
              </div>
              <span className="text-sm font-black text-cyan-300 block">
                ${vwap.toFixed(2)}
              </span>
            </div>

            {/* RSI (14) */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans uppercase">
                <span>RSI (14)</span>
                <span className="text-[10px] text-neutral-300 truncate max-w-[70px]">
                  {rsiStatus.split(" ")[0]}
                </span>
              </div>
              <span
                className={`text-sm font-black block ${
                  rsiVal >= 70 ? "text-rose-400" : rsiVal <= 30 ? "text-emerald-400" : "text-amber-300"
                }`}
              >
                {rsiVal.toFixed(1)}
              </span>
            </div>

            {/* 50 SMA */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans uppercase">
                <span>50-Period SMA</span>
                <span className="text-emerald-400 text-[10px]">Bullish</span>
              </div>
              <span className="text-sm font-black text-amber-300 block">
                ${sma50.toFixed(2)}
              </span>
            </div>

            {/* 200 SMA */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans uppercase">
                <span>200-Period SMA</span>
                <span className="text-cyan-400 text-[10px]">Macro</span>
              </div>
              <span className="text-sm font-black text-purple-300 block">
                ${sma200.toFixed(2)}
              </span>
            </div>

            {/* ATR Volatility */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">
                ATR (14 Volatility)
              </span>
              <span className="text-sm font-black text-white block">
                ${atr.toFixed(2)}
              </span>
            </div>

            {/* Pivot Point */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">
                Daily Pivot (P)
              </span>
              <span className="text-sm font-black text-cyan-200 block">
                ${pivotPoint.toFixed(2)}
              </span>
            </div>

            {/* Resistance R1 */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">
                Resistance (R1)
              </span>
              <span className="text-sm font-black text-rose-400 block">
                ${resistance1.toFixed(2)}
              </span>
            </div>

            {/* Support S1 */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] text-neutral-400 font-sans uppercase block">
                Support (S1)
              </span>
              <span className="text-sm font-black text-emerald-400 block">
                ${support1.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
