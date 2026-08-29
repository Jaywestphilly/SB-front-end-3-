import React, { useState, useMemo } from "react";
import { StockTicker } from "../../types";
import {
  runFullTradeScreener,
  calculateTradePositionSizing,
  DayTradeSetup,
  SwingTradeSetup,
} from "../../utils/tradeScreenerEngine";
import { triggerHaptic } from "../../utils/haptics";
import {
  Zap,
  TrendingUp,
  Target,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Layers,
  Activity,
  Sliders,
  DollarSign,
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  Info,
} from "lucide-react";

interface TradeScreenerPanelProps {
  stock: StockTicker;
  onSelectPaperTradeLevel?: (price: number, type: "BUY" | "SELL") => void;
}

export const TradeScreenerPanel: React.FC<TradeScreenerPanelProps> = ({
  stock,
  onSelectPaperTradeLevel,
}) => {
  const [activeTab, setActiveTab] = useState<"day" | "swing" | "sbscore" | "calculator">("day");
  const [riskBudget, setRiskBudget] = useState<number>(250);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const screenerData = useMemo(() => {
    return runFullTradeScreener(stock);
  }, [stock]);

  const { dayTrade, swingTrade, overallRating, headlineBadge, beginnerVerdict, sbScore } = screenerData;

  const currentSetup = activeTab === "day" ? dayTrade : swingTrade;

  // Position sizing calculation based on active tab
  const posSizing = useMemo(() => {
    const entry = activeTab === "day" ? dayTrade.entryZone.optimal : swingTrade.keyLevels.entryPrice;
    const stop = activeTab === "day" ? dayTrade.stopLoss : swingTrade.keyLevels.invalidationPrice;
    const target = activeTab === "day" ? dayTrade.target1 : swingTrade.keyLevels.targetPrice;
    return calculateTradePositionSizing(riskBudget, entry, stop, target);
  }, [activeTab, dayTrade, swingTrade, riskBudget]);

  const handleCopyLevels = (text: string, key: string) => {
    triggerHaptic("selection");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Traffic light colors helper
  const getActionBadgeStyle = () => {
    switch (beginnerVerdict.action) {
      case "STRONG BUY":
        return {
          bg: "bg-emerald-500/20 border-emerald-400 text-emerald-300",
          light: "bg-emerald-400 shadow-[0_0_12px_#00ff88]",
          cardBorder: "border-emerald-500/40",
          cardBg: "from-emerald-950/40 via-black to-[#021020]",
        };
      case "BUY / ACCUMULATE":
        return {
          bg: "bg-green-500/20 border-green-400 text-green-300",
          light: "bg-green-400 shadow-[0_0_12px_#22c55e]",
          cardBorder: "border-green-500/40",
          cardBg: "from-green-950/40 via-black to-[#021020]",
        };
      case "BEARISH / AVOID":
        return {
          bg: "bg-rose-500/20 border-rose-400 text-rose-300",
          light: "bg-rose-400 shadow-[0_0_12px_#ff3b3b]",
          cardBorder: "border-rose-500/40",
          cardBg: "from-rose-950/40 via-black to-[#021020]",
        };
      default:
        return {
          bg: "bg-amber-500/20 border-amber-400 text-amber-300",
          light: "bg-amber-400 shadow-[0_0_12px_#f59e0b]",
          cardBorder: "border-amber-500/40",
          cardBg: "from-amber-950/40 via-black to-[#021020]",
        };
    }
  };

  const badgeStyle = getActionBadgeStyle();

  return (
    <div className="w-full bg-[#040e1a] border border-cyan-500/40 alien-block-cut shadow-xl shadow-cyan-950/40 overflow-hidden font-martian text-white space-y-0">
      {/* ========================================================================= */}
      {/* BEGINNER-FRIENDLY "BUY / SELL / HOLD" SIGNAL BANNER */}
      {/* ========================================================================= */}
      <div className={`p-4 sm:p-5 bg-gradient-to-r ${badgeStyle.cardBg} border-b ${badgeStyle.cardBorder}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-alien-hud uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Beginner Quick Verdict:
              </span>
              <div className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-black font-alien-hud flex items-center gap-2 ${badgeStyle.bg}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${badgeStyle.light} animate-pulse`} />
                <span>{beginnerVerdict.action}</span>
              </div>
              <div
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveTab("sbscore");
                }}
                className="px-2.5 py-0.5 text-xs font-mono font-black rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 cursor-pointer hover:bg-cyan-900 transition-all flex items-center gap-1 shadow-sm"
                title="Click to view 5-factor mathematical SB Score breakdown"
              >
                <span>SB SCORE:</span>
                <span className="text-white font-bold">{sbScore.totalScore}/100</span>
                <span className="text-[9px] text-cyan-400 uppercase font-sans">({sbScore.ratingTier})</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-neutral-300 font-sans">
                Risk: <strong>{beginnerVerdict.beginnerRiskLevel}</strong>
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-cyan-300 font-sans">
                Best For: <strong>{beginnerVerdict.idealFor}</strong>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-200 font-sans leading-relaxed pt-0.5">
              {beginnerVerdict.simpleExplanation}
            </p>
          </div>

          {/* Quick Metrics Summary for Beginners */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-black/60 border border-cyan-500/30 p-2.5 alien-block-cut-sm text-center">
            <div className="px-2">
              <div className="text-[10px] text-neutral-400 font-bold uppercase">Day Setup</div>
              <div className="text-xs font-black text-amber-300 font-mono">{dayTrade.bias} ({dayTrade.conviction}%)</div>
            </div>
            <div className="w-[1px] h-6 bg-cyan-900/60" />
            <div className="px-2">
              <div className="text-[10px] text-neutral-400 font-bold uppercase">Swing R/R</div>
              <div className="text-xs font-black text-emerald-400 font-mono">1:{swingTrade.rewardToRiskRatio} (+{swingTrade.expectedReturnPct}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Banner: Title & Tab Navigation */}
      <div className="p-4 bg-gradient-to-r from-[#021020] via-[#051c33] to-[#021020] border-b border-cyan-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/40 text-cyan-400">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black font-alien-hud uppercase tracking-wider text-cyan-300">
                  Detailed Trade Setup Screener
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-martian font-extrabold uppercase rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                  Live Algorithmic Levels
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Exact price entries, take-profit targets, stop-loss protection, and share calculator.
              </p>
            </div>
          </div>

          {/* Screener Signal Tag */}
          <div className="px-3 py-1.5 alien-block-cut-sm bg-black/60 border border-cyan-400/40 text-right">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              STRATEGY STATUS
            </div>
            <div className="text-xs font-black text-cyan-200 font-martian">
              {headlineBadge}
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-cyan-900/50">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("day");
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 alien-block-cut-sm text-xs font-alien-hud font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "day"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black border border-amber-300 shadow-md glow-amber"
                : "bg-black/40 text-neutral-300 hover:text-white border border-cyan-900/60"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>DAY TRADE</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded ${activeTab === "day" ? "bg-black/30 text-amber-100" : "bg-cyan-950 text-cyan-400"}`}>
              {dayTrade.conviction}%
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("swing");
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 alien-block-cut-sm text-xs font-alien-hud font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "swing"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black border border-cyan-300 shadow-md glow-cyan"
                : "bg-black/40 text-neutral-300 hover:text-white border border-cyan-900/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>SWING TRADE</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded ${activeTab === "swing" ? "bg-black/30 text-cyan-950" : "bg-cyan-950 text-cyan-400"}`}>
              1:{swingTrade.rewardToRiskRatio}
            </span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("sbscore");
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 alien-block-cut-sm text-xs font-alien-hud font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "sbscore"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white border border-purple-300 shadow-md glow-purple"
                : "bg-black/40 text-purple-300 hover:text-white border border-purple-900/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>SB SCORE ({sbScore.totalScore}/100)</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab("calculator");
            }}
            className={`flex-1 sm:flex-initial px-3.5 py-2 alien-block-cut-sm text-xs font-alien-hud font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "calculator"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-black border border-emerald-300 shadow-md glow-emerald"
                : "bg-black/40 text-neutral-300 hover:text-white border border-cyan-900/60"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>POSITION SIZER</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 space-y-4">
        {/* ======================= DAY TRADE TAB ======================= */}
        {activeTab === "day" && (
          <div className="space-y-4">
            {/* Setup Highlight Card */}
            <div className="p-3.5 alien-block-cut-sm bg-amber-950/20 border border-amber-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-alien-hud font-extrabold uppercase rounded bg-amber-500/30 text-amber-200 border border-amber-400/50">
                    {dayTrade.bias} BIAS
                  </span>
                  <span className="text-sm font-black text-amber-300 font-martian">
                    {dayTrade.signalName}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-sans">
                  <strong>Trigger Rule:</strong> {dayTrade.triggerCondition}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-amber-400 font-bold uppercase">Conviction</div>
                  <div className="text-lg font-black text-amber-300">{dayTrade.conviction}%</div>
                </div>
                <div className="text-right border-l border-amber-500/30 pl-3">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Target 1 R/R</div>
                  <div className="text-lg font-black text-emerald-400">{dayTrade.rewardToRiskRatio}:1</div>
                </div>
              </div>
            </div>

            {/* Key Day Trade Action Levels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Entry Zone */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-cyan-500/30 space-y-1">
                <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center justify-between">
                  <span>Entry Zone</span>
                  <span className="text-[9px] text-neutral-500">Optimal</span>
                </div>
                <div className="text-base font-black text-cyan-200 font-mono">
                  ${dayTrade.entryZone.optimal.toFixed(2)}
                </div>
                <div className="text-[10px] text-neutral-400">
                  ${dayTrade.entryZone.min.toFixed(2)} - ${dayTrade.entryZone.max.toFixed(2)}
                </div>
              </div>

              {/* Take Profit 1 */}
              <div className="p-3 alien-block-cut-sm bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-between">
                  <span>Take Profit 1</span>
                  <span className="text-[9px] font-extrabold text-emerald-300">+{dayTrade.expectedReturnPctT1}%</span>
                </div>
                <div className="text-base font-black text-emerald-300 font-mono">
                  ${dayTrade.target1.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400/80">Conservative Scalp (+1.4 ATR)</div>
              </div>

              {/* Take Profit 2 */}
              <div className="p-3 alien-block-cut-sm bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-between">
                  <span>Take Profit 2</span>
                  <span className="text-[9px] font-extrabold text-emerald-300">+{dayTrade.expectedReturnPctT2}%</span>
                </div>
                <div className="text-base font-black text-emerald-300 font-mono">
                  ${dayTrade.target2.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400/80">Runner Target (+2.8 ATR)</div>
              </div>

              {/* Stop Loss */}
              <div className="p-3 alien-block-cut-sm bg-rose-950/30 border border-rose-500/40 space-y-1">
                <div className="text-[10px] text-rose-400 font-bold uppercase flex items-center justify-between">
                  <span>Stop Loss</span>
                  <span className="text-[9px] font-extrabold text-rose-300">-{dayTrade.maxRiskPct}%</span>
                </div>
                <div className="text-base font-black text-rose-300 font-mono">
                  ${dayTrade.stopLoss.toFixed(2)}
                </div>
                <div className="text-[10px] text-rose-400/80">Under VWAP / Invalidation</div>
              </div>
            </div>

            {/* Risk/Reward Visual Thermometer */}
            <div className="p-3.5 alien-block-cut-sm bg-black/60 border border-cyan-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="text-rose-400 font-bold">Stop: ${dayTrade.stopLoss.toFixed(2)}</span>
                <span className="text-cyan-300 font-bold">Entry: ${dayTrade.entryZone.optimal.toFixed(2)}</span>
                <span className="text-emerald-400 font-bold">T1: ${dayTrade.target1.toFixed(2)}</span>
                <span className="text-emerald-300 font-bold">T2: ${dayTrade.target2.toFixed(2)}</span>
              </div>
              <div className="relative w-full h-3 rounded-full bg-neutral-900 overflow-hidden flex border border-cyan-900/80">
                <div className="h-full bg-rose-600/80 w-[20%]" title="Risk Zone" />
                <div className="h-full bg-cyan-400 w-[5%] shadow-md" title="Entry Pivot" />
                <div className="h-full bg-emerald-500/70 w-[45%]" title="Target 1 Zone" />
                <div className="h-full bg-emerald-400 w-[30%]" title="Runner Target 2 Zone" />
              </div>
              <div className="text-[11px] text-neutral-400 font-sans flex items-center justify-between">
                <span>VWAP: <strong>${dayTrade.vwapEstimate.toFixed(2)}</strong></span>
                <span>RelVol: <strong>{dayTrade.relVol.toFixed(1)}x</strong></span>
                <span>Intraday RSI: <strong>{dayTrade.intradayRsi.toFixed(1)}</strong></span>
                <span>ATR Volatility: <strong>${dayTrade.atrEstimate.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* 4-Point Rule Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dayTrade.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 alien-block-cut-sm border flex items-start gap-2 text-xs ${
                    item.passed
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                      : "bg-neutral-900/60 border-neutral-700 text-neutral-400"
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-white">{item.label}</div>
                    <div className="text-[11px] font-sans text-neutral-300 mt-0.5">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= SWING TRADE TAB ======================= */}
        {activeTab === "swing" && (
          <div className="space-y-4">
            {/* Setup Highlight Card */}
            <div className="p-3.5 alien-block-cut-sm bg-cyan-950/20 border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-alien-hud font-extrabold uppercase rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/50">
                    {swingTrade.bias} SWING
                  </span>
                  <span className="text-sm font-black text-cyan-300 font-martian">
                    {swingTrade.setupName}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-sans">
                  <strong>Macro Thesis:</strong> {swingTrade.setupRationale}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase">Horizon</div>
                  <div className="text-sm font-black text-cyan-200">{swingTrade.horizon}</div>
                </div>
                <div className="text-right border-l border-cyan-500/30 pl-3">
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Reward / Risk</div>
                  <div className="text-lg font-black text-emerald-400">{swingTrade.rewardToRiskRatio}:1</div>
                </div>
              </div>
            </div>

            {/* Key Swing Levels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Swing Entry */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-cyan-500/30 space-y-1">
                <div className="text-[10px] text-cyan-400 font-bold uppercase">Swing Entry Trigger</div>
                <div className="text-base font-black text-cyan-200 font-mono">
                  ${swingTrade.keyLevels.entryPrice.toFixed(2)}
                </div>
                <div className="text-[10px] text-neutral-400">Current Market Pivot</div>
              </div>

              {/* Swing Target */}
              <div className="p-3 alien-block-cut-sm bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-between">
                  <span>Price Target</span>
                  <span className="text-[9px] font-extrabold text-emerald-300">+{swingTrade.expectedReturnPct}%</span>
                </div>
                <div className="text-base font-black text-emerald-300 font-mono">
                  ${swingTrade.keyLevels.targetPrice.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400/80">2-6 Week Objective</div>
              </div>

              {/* Invalidation Stop */}
              <div className="p-3 alien-block-cut-sm bg-rose-950/30 border border-rose-500/40 space-y-1">
                <div className="text-[10px] text-rose-400 font-bold uppercase flex items-center justify-between">
                  <span>Invalidation Stop</span>
                  <span className="text-[9px] font-extrabold text-rose-300">-{swingTrade.maxRiskPct}%</span>
                </div>
                <div className="text-base font-black text-rose-300 font-mono">
                  ${swingTrade.keyLevels.invalidationPrice.toFixed(2)}
                </div>
                <div className="text-[10px] text-rose-400/80">Structural Floor Loss</div>
              </div>

              {/* Break-Even Trigger */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-amber-500/30 space-y-1">
                <div className="text-[10px] text-amber-400 font-bold uppercase">Trailing Stop Pivot</div>
                <div className="text-base font-black text-amber-200 font-mono">
                  ${swingTrade.keyLevels.breakEvenTrigger.toFixed(2)}
                </div>
                <div className="text-[10px] text-neutral-400">Move Stop to Entry (+35% target)</div>
              </div>
            </div>

            {/* Moving Average Ribbon & 13F Flow Confluence */}
            <div className="p-3.5 alien-block-cut-sm bg-black/60 border border-cyan-900/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-cyan-900/50 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-cyan-300">Technical Moving Average Ribbon</span>
                </div>
                <span className="text-[11px] text-neutral-400">{swingTrade.smaAlignment.summary}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-neutral-900/60 border border-neutral-800 rounded">
                  <div className="text-[10px] text-neutral-400">20 EMA</div>
                  <div className="font-mono font-bold text-cyan-200">${swingTrade.smaAlignment.sma20.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-neutral-900/60 border border-neutral-800 rounded">
                  <div className="text-[10px] text-neutral-400">50 SMA</div>
                  <div className="font-mono font-bold text-cyan-200">${swingTrade.smaAlignment.sma50.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-neutral-900/60 border border-neutral-800 rounded">
                  <div className="text-[10px] text-neutral-400">200 SMA</div>
                  <div className="font-mono font-bold text-cyan-200">${swingTrade.smaAlignment.sma200.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <div className="text-neutral-300">
                  52W Corridor: <strong>{swingTrade.percentile52W}th Percentile</strong>
                </div>
                <div className="text-cyan-300">
                  Institutional 13F Sentiment: <strong>{swingTrade.institutionalFlow.summary}</strong>
                </div>
              </div>
            </div>

            {/* Swing Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {swingTrade.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 alien-block-cut-sm border flex items-start gap-2 text-xs ${
                    item.passed
                      ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-200"
                      : "bg-neutral-900/60 border-neutral-700 text-neutral-400"
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-white">{item.label}</div>
                    <div className="text-[11px] font-sans text-neutral-300 mt-0.5">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= SB SCORE BREAKDOWN TAB ======================= */}
        {activeTab === "sbscore" && (
          <div className="space-y-4">
            {/* SB Score Hero Summary Card */}
            <div className="p-4 alien-block-cut-sm bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black border border-purple-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/50 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-alien-hud font-extrabold uppercase rounded bg-purple-500/30 text-purple-200 border border-purple-400/50">
                      QUANTITATIVE MULTI-FACTOR ENGINE
                    </span>
                    <span className="text-sm font-black text-purple-200 font-martian">
                      {sbScore.ratingTier}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-sans">
                    Weighted algorithmic score based on real technical moving averages, RSI momentum, relative volume velocity, 52W range percentile, and institutional 13F flows.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 bg-black/60 border border-purple-400/40 px-3.5 py-2 alien-block-cut-sm">
                  <div className="text-right">
                    <div className="text-[10px] text-purple-300 font-bold uppercase">SB Score</div>
                    <div className="text-2xl font-black text-white font-mono">{sbScore.totalScore}<span className="text-sm text-purple-400 font-normal">/100</span></div>
                  </div>
                </div>
              </div>

              {/* Highlights Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-neutral-400 uppercase font-bold">Key Drivers:</span>
                {sbScore.keyFactorHighlights.map((hl, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[11px] font-sans rounded bg-purple-950/60 border border-purple-500/30 text-purple-200"
                  >
                    ✓ {hl}
                  </span>
                ))}
              </div>
            </div>

            {/* 5 Real-Data Factor Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Factor 1: Moving Average Trend */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-bold uppercase text-[10px]">1. Trend Alignment</span>
                  <span className="font-mono font-bold text-cyan-200">{sbScore.factors.trendAlignment.score}/25 pts</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all"
                    style={{ width: `${(sbScore.factors.trendAlignment.score / 25) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Status: <strong className="text-cyan-300">{sbScore.factors.trendAlignment.status}</strong> (20 EMA / 50 SMA / 200 SMA stack)
                </div>
              </div>

              {/* Factor 2: Momentum RSI */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400 font-bold uppercase text-[10px]">2. RSI-14 Momentum</span>
                  <span className="font-mono font-bold text-purple-200">{sbScore.factors.momentumRsi.score}/25 pts</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all"
                    style={{ width: `${(sbScore.factors.momentumRsi.score / 25) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-300 font-sans leading-tight">
                  RSI-14: <strong className="text-purple-300">{sbScore.factors.momentumRsi.value.toFixed(1)}</strong> (Optimal corridor: 52 - 74)
                </div>
              </div>

              {/* Factor 3: Volume Velocity */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold uppercase text-[10px]">3. Volume Velocity</span>
                  <span className="font-mono font-bold text-amber-200">{sbScore.factors.volumeVelocity.score}/20 pts</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all"
                    style={{ width: `${(sbScore.factors.volumeVelocity.score / 20) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Relative Volume: <strong className="text-amber-300">{sbScore.factors.volumeVelocity.relVol.toFixed(1)}x</strong> vs 30-day baseline
                </div>
              </div>

              {/* Factor 4: 52-Week Range */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">4. 52-Week Corridor</span>
                  <span className="font-mono font-bold text-emerald-200">{sbScore.factors.corridor52W.score}/15 pts</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all"
                    style={{ width: `${(sbScore.factors.corridor52W.score / 15) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Range: <strong className="text-emerald-300">{sbScore.factors.corridor52W.percentile}th Percentile</strong> between 52W Low & High
                </div>
              </div>

              {/* Factor 5: Institutional Flow */}
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-blue-500/30 space-y-2 sm:col-span-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-400 font-bold uppercase text-[10px]">5. Institutional 13F Flow</span>
                  <span className="font-mono font-bold text-blue-200">{sbScore.factors.institutionalFlow.score}/15 pts</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${(sbScore.factors.institutionalFlow.score / 15) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-neutral-300 font-sans leading-tight">
                  Net 13F Smart Money: <strong className="text-blue-300">{sbScore.factors.institutionalFlow.flow}</strong> ({swingTrade.institutionalFlow.summary})
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= POSITION SIZER TAB ======================= */}
        {activeTab === "calculator" && (
          <div className="space-y-4">
            <div className="p-3.5 alien-block-cut-sm bg-emerald-950/20 border border-emerald-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-black text-emerald-300 font-martian flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    <span>Risk-Managed Position Size Sizer</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-sans">
                    Calculates exact share count so you never risk more than your predefined dollar threshold.
                  </p>
                </div>

                {/* Preset Risk Buttons */}
                <div className="flex items-center gap-1.5">
                  {[100, 250, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        triggerHaptic("selection");
                        setRiskBudget(preset);
                      }}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                        riskBudget === preset
                          ? "bg-emerald-400 text-black shadow-md glow-emerald"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="flex items-center gap-3 pt-2 border-t border-emerald-900/40">
                <label className="text-xs text-neutral-300 font-bold shrink-0">
                  Custom Max Dollar Risk:
                </label>
                <div className="relative flex-1 max-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">$</span>
                  <input
                    type="number"
                    value={riskBudget}
                    onChange={(e) => setRiskBudget(Math.max(10, Number(e.target.value) || 0))}
                    className="w-full bg-black/60 border border-emerald-500/40 rounded px-7 py-1.5 text-sm font-mono text-emerald-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Position Size Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 alien-block-cut-sm bg-black/50 border border-emerald-500/30 space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Recommended Size</div>
                <div className="text-xl font-black text-emerald-300 font-mono">
                  {posSizing.shares} <span className="text-xs font-sans text-neutral-400 font-normal">Shares</span>
                </div>
                <div className="text-[10px] text-neutral-400">Based on ${riskBudget} Max Risk</div>
              </div>

              <div className="p-3 alien-block-cut-sm bg-black/50 border border-cyan-500/30 space-y-1">
                <div className="text-[10px] text-cyan-400 font-bold uppercase">Total Capital Required</div>
                <div className="text-xl font-black text-cyan-200 font-mono">
                  ${posSizing.totalCost.toLocaleString()}
                </div>
                <div className="text-[10px] text-neutral-400">@ ${stock.price.toFixed(2)} / share</div>
              </div>

              <div className="p-3 alien-block-cut-sm bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">Potential Profit</div>
                <div className="text-xl font-black text-emerald-300 font-mono">
                  +${posSizing.expectedProfitUsd.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400/80">At Target 1 Level</div>
              </div>

              <div className="p-3 alien-block-cut-sm bg-rose-950/30 border border-rose-500/40 space-y-1">
                <div className="text-[10px] text-rose-400 font-bold uppercase">Max Capital at Risk</div>
                <div className="text-xl font-black text-rose-300 font-mono">
                  -${posSizing.maxRiskUsd.toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-400/80">If Invalidation Hit</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Footer: Copy Trade Plan */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-cyan-900/50 text-xs">
          <div className="text-neutral-400 font-sans">
            Plan: <strong>${stock.symbol}</strong> · Entry ${activeTab === "day" ? dayTrade.entryZone.optimal.toFixed(2) : swingTrade.keyLevels.entryPrice.toFixed(2)} · Stop ${activeTab === "day" ? dayTrade.stopLoss.toFixed(2) : swingTrade.keyLevels.invalidationPrice.toFixed(2)} · Target ${activeTab === "day" ? dayTrade.target1.toFixed(2) : swingTrade.keyLevels.targetPrice.toFixed(2)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const plan = `[Stock Bloc Screener Plan: ${stock.symbol}]\nStrategy: ${activeTab === "day" ? dayTrade.signalName : swingTrade.setupName}\nEntry: $${activeTab === "day" ? dayTrade.entryZone.optimal.toFixed(2) : swingTrade.keyLevels.entryPrice.toFixed(2)}\nStop Loss: $${activeTab === "day" ? dayTrade.stopLoss.toFixed(2) : swingTrade.keyLevels.invalidationPrice.toFixed(2)}\nTarget 1: $${activeTab === "day" ? dayTrade.target1.toFixed(2) : swingTrade.keyLevels.targetPrice.toFixed(2)}\nReward/Risk: ${activeTab === "day" ? dayTrade.rewardToRiskRatio : swingTrade.rewardToRiskRatio}:1`;
                handleCopyLevels(plan, "plan");
              }}
              className="px-3 py-1.5 alien-block-cut-sm bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-xs font-alien-hud flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedKey === "plan" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedKey === "plan" ? "Copied to Clipboard!" : "Copy Trade Plan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
