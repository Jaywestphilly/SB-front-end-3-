import React, { useMemo } from "react";
import { StockTicker } from "../types";
import { TrendingUp, TrendingDown, Activity, Flame, Zap } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface TrendSentimentData {
  score: number; // 0 to 100
  label: "Strong Bear" | "Bearish" | "Neutral" | "Bullish" | "Strong Bull";
  colorClass: string;
  bgClass: string;
  borderColor: string;
  barGradient: string;
  momentum24h: number;
  direction: "up" | "down" | "flat";
}

export function calculateTrendSentiment(
  stock: StockTicker,
): TrendSentimentData {
  const changePct = stock.changePercent || 0;

  // 1. Base Score from 24h % change (50 is neutral 0%)
  let baseScore = 50 + changePct * 3.5;

  // 2. Intraday Sparkline Trajectory Bonus
  const sparkline =
    stock.history?.["1D"]?.map((p) => p.price) || stock.sparkline || [];
  let trajectoryBonus = 0;
  if (sparkline.length >= 2) {
    const half = Math.floor(sparkline.length / 2);
    const firstHalfAvg =
      sparkline.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
    const secondHalfAvg =
      sparkline.slice(half).reduce((a, b) => a + b, 0) /
      (sparkline.length - half || 1);
    const recentDiff =
      ((secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)) * 100;
    trajectoryBonus = Math.max(-12, Math.min(12, recentDiff * 4));
  }

  // 3. 7-Day Trend momentum if available
  const weekPrices = stock.history?.["1W"]?.map((p) => p.price);
  let weekBonus = 0;
  if (weekPrices && weekPrices.length >= 2) {
    const weekStart = weekPrices[0];
    const weekEnd = weekPrices[weekPrices.length - 1];
    const weekChangePct = ((weekEnd - weekStart) / (weekStart || 1)) * 100;
    weekBonus = Math.max(-10, Math.min(10, weekChangePct * 1.5));
  }

  let finalScore = Math.round(baseScore + trajectoryBonus + weekBonus);
  finalScore = Math.max(5, Math.min(98, finalScore)); // Clamp between 5 and 98

  let label: "Strong Bear" | "Bearish" | "Neutral" | "Bullish" | "Strong Bull" =
    "Neutral";
  let colorClass = "text-cyan-300";
  let bgClass = "bg-cyan-950/80";
  let borderColor = "border-cyan-500/40";
  let barGradient = "from-cyan-500 to-teal-400";

  if (finalScore >= 75) {
    label = "Strong Bull";
    colorClass = "text-emerald-300";
    bgClass = "bg-emerald-950/90";
    borderColor = "border-emerald-400/60";
    barGradient = "from-emerald-500 via-teal-400 to-emerald-300";
  } else if (finalScore >= 58) {
    label = "Bullish";
    colorClass = "text-emerald-400";
    bgClass = "bg-emerald-950/60";
    borderColor = "border-emerald-500/40";
    barGradient = "from-teal-500 to-emerald-400";
  } else if (finalScore <= 25) {
    label = "Strong Bear";
    colorClass = "text-rose-300";
    bgClass = "bg-rose-950/90";
    borderColor = "border-rose-400/60";
    barGradient = "from-red-600 via-rose-500 to-amber-500";
  } else if (finalScore <= 42) {
    label = "Bearish";
    colorClass = "text-rose-400";
    bgClass = "bg-rose-950/60";
    borderColor = "border-rose-500/40";
    barGradient = "from-rose-500 to-amber-500";
  }

  return {
    score: finalScore,
    label,
    colorClass,
    bgClass,
    borderColor,
    barGradient,
    momentum24h: changePct,
    direction: changePct > 0.05 ? "up" : changePct < -0.05 ? "down" : "flat",
  };
}

interface TrendSentimentVisualizerProps {
  stock: StockTicker;
  compact?: boolean;
}

export const TrendSentimentVisualizer: React.FC<
  TrendSentimentVisualizerProps
> = ({ stock, compact = true }) => {
  const trend = useMemo(() => calculateTrendSentiment(stock), [stock]);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg border alien-block-cut-sm transition-all group/trend cursor-pointer hover:scale-105"
      style={{
        backgroundColor: "rgba(2, 11, 22, 0.85)",
      }}
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic("selection");
      }}
      title={`Price Action Trend Score: ${trend.score}/100 (${trend.label})\nDerived from 24h Change (${trend.momentum24h >= 0 ? "+" : ""}${trend.momentum24h.toFixed(2)}%) & Price Trajectory.`}
    >
      {/* Mini Trend Score Icon */}
      {trend.direction === "up" ? (
        <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : trend.direction === "down" ? (
        <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />
      ) : (
        <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
      )}

      {/* Numerical Trend Score */}
      <span
        className={`text-[10px] font-black font-mono tracking-tight ${trend.colorClass}`}
      >
        {trend.score}
      </span>

      {/* Mini Progress Meter Bar */}
      <div className="relative w-8 h-1.5 rounded-full bg-neutral-900 border border-white/10 overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${trend.barGradient} transition-all duration-500`}
          style={{ width: `${trend.score}%` }}
        />
      </div>
    </div>
  );
};
