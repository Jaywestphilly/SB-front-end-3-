import { StockTicker } from "../types";

export interface SignalComponent {
  name: string;
  points: number; // max points contributed (e.g. 18 out of 25)
  maxPoints: number; // weight maximum (e.g. 25, 25, 15, 20, 15)
  detail: string;
}

export interface DeterministicSignal {
  score: number;
  label: "BULLISH" | "NEUTRAL" | "BEARISH" | "CAUTION";
  momentum: SignalComponent;
  trend: SignalComponent;
  volume: SignalComponent;
  relativeStrength: SignalComponent;
  volatility: SignalComponent;
}

export interface SBScoreColorStyle {
  color: "green" | "blue" | "yellow" | "red";
  tier: "BULLISH" | "MOD BULL" | "NEUTRAL" | "BEARISH";
  tierDescription: string;
  badgeClass: string;
  badgeStyle: {
    backgroundColor: string;
    borderColor: string;
    color: string;
    boxShadow: string;
  };
  textClass: string;
  borderClass: string;
  bgClass: string;
  dotClass: string;
  glowClass: string;
  implication: {
    dayTrade: string;
    swingTrade: string;
    longTermHold: string;
    summary: string;
  };
}

/**
 * Returns color-coded style and trade setup implications for a 0-100 SB Score:
 * - Green: 75-100 (Bullish)
 * - Blue: 60-74 (Moderate Bullish)
 * - Yellow: 40-59 (Neutral / Consolidation)
 * - Red: <40 (Bearish / Caution)
 */
export function getSBScoreColor(score: number): SBScoreColorStyle {
  if (score >= 75) {
    return {
      color: "green",
      tier: "BULLISH",
      tierDescription: "Strong Bullish / High Conviction",
      badgeClass: "bg-emerald-950/85 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]",
      badgeStyle: {
        backgroundColor: "rgba(6, 44, 30, 0.9)",
        borderColor: "#10b981",
        color: "#6ee7b7",
        boxShadow: "0 0 10px rgba(16, 185, 129, 0.35)",
      },
      textClass: "text-emerald-300",
      borderClass: "border-emerald-400/70",
      bgClass: "bg-emerald-950/85",
      dotClass: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
      glowClass: "glow-emerald",
      implication: {
        dayTrade: "High-probability momentum & breakout plays with volume confirmation.",
        swingTrade: "Optimal multi-day/multi-week trend following with moving averages stacked in favor.",
        longTermHold: "Excellent fundamental and technical accumulation window.",
        summary: "Asset exhibits synchronized bullish momentum, trend alignment, and healthy volume."
      }
    };
  } else if (score >= 60) {
    return {
      color: "blue",
      tier: "MOD BULL",
      tierDescription: "Moderate Bullish / Accumulation",
      badgeClass: "bg-blue-950/85 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.35)]",
      badgeStyle: {
        backgroundColor: "rgba(8, 30, 58, 0.9)",
        borderColor: "#06b6d4",
        color: "#67e8f9",
        boxShadow: "0 0 10px rgba(6, 182, 212, 0.35)",
      },
      textClass: "text-cyan-300",
      borderClass: "border-cyan-400/70",
      bgClass: "bg-blue-950/85",
      dotClass: "bg-cyan-400 shadow-[0_0_8px_#06b6d4]",
      glowClass: "glow-cyan",
      implication: {
        dayTrade: "Solid long-side dip buys and pullbacks to intraday support (VWAP/EMA).",
        swingTrade: "Quality swing trade with constructive accumulation underway.",
        longTermHold: "Good entry or DCA addition; macro posture is constructive.",
        summary: "Asset has strong structural support with moderate upward momentum."
      }
    };
  } else if (score >= 40) {
    return {
      color: "yellow",
      tier: "NEUTRAL",
      tierDescription: "Neutral / Consolidation",
      badgeClass: "bg-amber-950/85 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)]",
      badgeStyle: {
        backgroundColor: "rgba(45, 26, 4, 0.9)",
        borderColor: "#f59e0b",
        color: "#fcd34d",
        boxShadow: "0 0 10px rgba(245, 158, 11, 0.35)",
      },
      textClass: "text-amber-300",
      borderClass: "border-amber-400/70",
      bgClass: "bg-amber-950/85",
      dotClass: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
      glowClass: "glow-amber",
      implication: {
        dayTrade: "Range-bound; best for scalp trading between well-defined support and resistance levels.",
        swingTrade: "Wait for clear breakout above resistance or breakdown before committing capital.",
        longTermHold: "Hold existing core allocations; pause aggressive new accumulation.",
        summary: "Asset is in chop or consolidation with balanced bulls and bears."
      }
    };
  } else {
    return {
      color: "red",
      tier: "BEARISH",
      tierDescription: "Bearish / Weakness / Caution",
      badgeClass: "bg-rose-950/85 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.35)]",
      badgeStyle: {
        backgroundColor: "rgba(48, 8, 18, 0.9)",
        borderColor: "#f43f5e",
        color: "#fda4af",
        boxShadow: "0 0 10px rgba(244, 63, 94, 0.35)",
      },
      textClass: "text-rose-300",
      borderClass: "border-rose-400/70",
      bgClass: "bg-rose-950/85",
      dotClass: "bg-rose-400 shadow-[0_0_8px_#f43f5e]",
      glowClass: "glow-rose",
      implication: {
        dayTrade: "Favor short setups or avoid; elevated risk of sudden sharp intraday flushes.",
        swingTrade: "High risk for long swings; look for breakdown targets or hedge existing exposure.",
        longTermHold: "Underperformance risk; monitor structural support or trim weak positions.",
        summary: "Technical breakdown below key moving averages, declining relative volume or distribution."
      }
    };
  }
}

/**
 * Deterministically computes the Stock Bloc Signal and component points breakdown from verified market metrics.
 */
export function computeDeterministicSignal(stock: StockTicker): DeterministicSignal {
  const price = stock.price || 100;
  const changePct = stock.changePercent || 0;
  const rsi = stock.rsi ?? (stock.quantMetrics?.rsi14 ?? 50);

  // 1. Momentum (Max 25 pts)
  let momentumPts = 12.5;
  if (rsi >= 50 && rsi <= 70) {
    momentumPts = 17.5 + ((rsi - 50) / 20) * 7.5; // 17.5 to 25
  } else if (rsi > 70) {
    momentumPts = 20 - ((rsi - 70) / 30) * 10; // overbought penalty
  } else if (rsi < 30) {
    momentumPts = 7.5; // oversold
  } else {
    momentumPts = 10 + ((rsi - 30) / 20) * 5;
  }
  if (changePct > 0) momentumPts = Math.min(25, momentumPts + Math.min(3.75, changePct * 0.5));
  if (changePct < 0) momentumPts = Math.max(0, momentumPts - Math.min(3.75, Math.abs(changePct) * 0.5));

  const momentumComp: SignalComponent = {
    name: "Momentum",
    points: Math.round(momentumPts),
    maxPoints: 25,
    detail: `RSI(14): ${rsi.toFixed(1)} with 1D change of ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
  };

  // 2. Trend (Max 25 pts)
  let trendPts = 12.5;
  const sma20 = stock.quantMetrics?.sma20;
  const sma50 = stock.quantMetrics?.sma50;
  const sma200 = stock.quantMetrics?.sma200;

  let trendDetail = "Baseline trend alignment";
  if (sma20 !== undefined && sma20 !== null) {
    const above20 = price >= sma20;
    const above50 = sma50 ? price >= sma50 : above20;
    const above200 = sma200 ? price >= sma200 : above50;

    if (above20 && above50 && above200) trendPts = 22 + Math.min(3, Math.max(0, changePct * 0.2));
    else if (above20 && above50) trendPts = 17;
    else if (above20) trendPts = 13;
    else trendPts = 6;

    if (above20 && above50 && above200) trendDetail = "Above 20D / 50D / 200D";
    else if (above20 && above50) trendDetail = "Above 20D / 50D";
    else if (above20) trendDetail = "Above 20D SMA";
    else trendDetail = "Below 20D / 50D / 200D";
  }

  const trendComp: SignalComponent = {
    name: "Trend",
    points: Math.round(trendPts),
    maxPoints: 25,
    detail: trendDetail
  };

  // 3. Volume (Max 15 pts)
  let volRatio = stock.volumeVsAvgRatio ?? 1.0;
  if (!volRatio || volRatio === 0) {
    if (stock.volumeNum && stock.avgVolumeNum && stock.avgVolumeNum > 0) {
      volRatio = Number((stock.volumeNum / stock.avgVolumeNum).toFixed(2));
    } else {
      volRatio = 1.0;
    }
  }

  let volumePts = 7.5;
  if (volRatio > 1.2 && changePct > 0) volumePts = 13 + Math.min(2, (volRatio - 1.2) * 2);
  else if (volRatio >= 1.0) volumePts = 10;
  else if (volRatio < 0.7) volumePts = 5;

  const volumeComp: SignalComponent = {
    name: "Volume",
    points: Math.round(volumePts),
    maxPoints: 15,
    detail: `${volRatio}x average volume`
  };

  // 4. Relative Strength / 52W Range (Max 20 pts)
  const high52 = stock.high52;
  const low52 = stock.low52;
  let percentile52 = 50;
  let rsDetail = "Midband range positioning";
  if (high52 && low52 && high52 > low52) {
    percentile52 = Math.round(((price - low52) / (high52 - low52)) * 100);
    rsDetail = `${percentile52}th percentile of 52-week corridor`;
  }

  let rsPts = 10;
  if (percentile52 >= 70 && percentile52 <= 95) rsPts = 17 + ((percentile52 - 70) / 25) * 3;
  else if (percentile52 > 95) rsPts = 16;
  else if (percentile52 < 30) rsPts = 6;
  else rsPts = 8 + ((percentile52 - 30) / 40) * 6;

  const rsComp: SignalComponent = {
    name: "Relative Strength",
    points: Math.round(rsPts),
    maxPoints: 20,
    detail: rsDetail
  };

  // 5. Volatility (Max 15 pts)
  let volPts = 9;
  const sparkline = stock.sparkline || [price];
  const minSpark = Math.min(...sparkline, price);
  const maxSpark = Math.max(...sparkline, price);
  const approxVol = minSpark > 0 ? ((maxSpark - minSpark) / minSpark) * 100 : 10;

  if (approxVol < 15) volPts = 13;
  else if (approxVol < 30) volPts = 10;
  else if (approxVol < 50) volPts = 7;
  else volPts = 4;

  const volComp: SignalComponent = {
    name: "Volatility",
    points: Math.round(volPts),
    maxPoints: 15,
    detail: `Sparkline variance ~${approxVol.toFixed(1)}%`
  };

  // Composite Sum
  const totalScore = Math.min(100, Math.max(0, 
    momentumComp.points + trendComp.points + volumeComp.points + rsComp.points + volComp.points
  ));

  let label: DeterministicSignal["label"] = "NEUTRAL";
  if (totalScore >= 75) label = "BULLISH";
  else if (totalScore >= 60) label = "BULLISH";
  else if (totalScore >= 40) label = "NEUTRAL";
  else if (totalScore >= 25) label = "CAUTION";
  else label = "BEARISH";

  return {
    score: totalScore,
    label,
    momentum: momentumComp,
    trend: trendComp,
    volume: volumeComp,
    relativeStrength: rsComp,
    volatility: volComp
  };
}

/**
 * Calculates freshness state from updated_at / last_updated ISO string
 */
export function getStockDataFreshness(lastUpdatedIso?: string | null): {
  status: "FRESH" | "DELAYED" | "STALE" | "UNAVAILABLE";
  label: string;
  badgeClass: string;
  ageText: string;
  minutesAgo: number;
} {
  if (!lastUpdatedIso) {
    return {
      status: "UNAVAILABLE",
      label: "UNAVAILABLE",
      badgeClass: "bg-neutral-800 text-neutral-400 border-neutral-700",
      ageText: "Unavailable",
      minutesAgo: 9999
    };
  }

  const date = new Date(lastUpdatedIso);
  if (isNaN(date.getTime())) {
    return {
      status: "UNAVAILABLE",
      label: "UNAVAILABLE",
      badgeClass: "bg-neutral-800 text-neutral-400 border-neutral-700",
      ageText: "Invalid timestamp",
      minutesAgo: 9999
    };
  }

  const now = Date.now();
  const ageMs = Math.max(0, now - date.getTime());
  const ageSec = Math.floor(ageMs / 1000);
  const minutesAgo = Math.floor(ageSec / 60);

  if (ageSec < 300) {
    const secText = ageSec < 60 ? `${ageSec} sec ago` : `${Math.floor(ageSec / 60)}m ${ageSec % 60}s ago`;
    return {
      status: "FRESH",
      label: "LIVE / FRESH",
      badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      ageText: `Fresh · ${secText}`,
      minutesAgo
    };
  } else if (ageSec < 1800) {
    return {
      status: "DELAYED",
      label: "DELAYED",
      badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      ageText: `Delayed · ${minutesAgo} min ago`,
      minutesAgo
    };
  } else {
    return {
      status: "STALE",
      label: "STALE",
      badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      ageText: `Stale · ${minutesAgo > 60 ? Math.floor(minutesAgo / 60) + 'h ago' : minutesAgo + ' min ago'}`,
      minutesAgo
    };
  }
}

/**
 * Calculates current US Stock Market Open/Closed Status
 */
export function getMarketOpenStatus(): {
  isOpen: boolean;
  statusText: string;
  colorClass: string;
} {
  const now = new Date();
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etString);

  const day = etDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = etDate.getHours();
  const minutes = etDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;

  const marketOpenMins = 9 * 60 + 30; // 9:30 AM ET
  const marketCloseMins = 16 * 60; // 4:00 PM ET
  const preMarketOpenMins = 4 * 60; // 4:00 AM ET
  const afterHoursCloseMins = 20 * 60; // 8:00 PM ET

  if (isWeekend) {
    return {
      isOpen: false,
      statusText: "MARKET CLOSED (Weekend)",
      colorClass: "bg-rose-500/20 text-rose-300 border-rose-500/40"
    };
  }

  if (timeInMinutes >= marketOpenMins && timeInMinutes < marketCloseMins) {
    return {
      isOpen: true,
      statusText: "MARKET OPEN (Live Session)",
      colorClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
    };
  } else if (timeInMinutes >= preMarketOpenMins && timeInMinutes < marketOpenMins) {
    return {
      isOpen: false,
      statusText: "PRE-MARKET (Early Session)",
      colorClass: "bg-amber-500/20 text-amber-300 border-amber-500/40"
    };
  } else if (timeInMinutes >= marketCloseMins && timeInMinutes < afterHoursCloseMins) {
    return {
      isOpen: false,
      statusText: "AFTER-HOURS (Extended Session)",
      colorClass: "bg-purple-500/20 text-purple-300 border-purple-500/40"
    };
  } else {
    return {
      isOpen: false,
      statusText: "MARKET CLOSED",
      colorClass: "bg-rose-500/20 text-rose-300 border-rose-500/40"
    };
  }
}
