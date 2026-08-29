import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  DollarSign,
  Sliders,
  Activity,
  Info,
  Target,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Gauge,
  Percent,
  Clock,
  TrendingUpIcon,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export type StrategyType =
  | "covered_call"
  | "protective_put"
  | "long_call"
  | "long_put"
  | "cash_secured_put"
  | "bull_call_spread"
  | "bear_put_spread"
  | "iron_condor"
  | "jade_lizard";

interface StrategyConfig {
  id: StrategyType;
  name: string;
  badge: string;
  category: "Income" | "Hedging" | "Speculation" | "Spread" | "Neutral";
  description: string;
  defaultStockPrice: number;
  defaultStrikeA: number;
  defaultStrikeB?: number;
  defaultPremiumA: number;
  defaultPremiumB?: number;
  probabilityOfProfit: string;
  upsideRisk: string;
  downsideRisk: string;
}

const STRATEGIES: StrategyConfig[] = [
  {
    id: "iron_condor",
    name: "Iron Condor",
    badge: "High Win-Rate Neutral",
    category: "Neutral",
    description:
      "Sell an out-of-the-money Put spread and Call spread simultaneously. Profits if stock remains bounded in a range.",
    defaultStockPrice: 100,
    defaultStrikeA: 90,
    defaultStrikeB: 110,
    defaultPremiumA: 3.5, // Net Credit
    probabilityOfProfit: "~75% 82%",
    upsideRisk: "Capped (Call Spread Width Credit)",
    downsideRisk: "Capped (Put Spread Width Credit)",
  },
  {
    id: "jade_lizard",
    name: "Jade Lizard",
    badge: "Zero Upside Risk Yield",
    category: "Income",
    description:
      "Sell an OTM Put and a Bear Call Spread. Credit collected ($3.50) exceeds call spread width ($2.50), eliminating all upside loss!",
    defaultStockPrice: 100,
    defaultStrikeA: 90,
    defaultStrikeB: 110,
    defaultPremiumA: 3.5, // Total Credit
    probabilityOfProfit: "~85% 90%",
    upsideRisk: "Zero ($0 Risk Guaranteed Profit if Stock Soars)",
    downsideRisk: "Substantial (If stock plunges below $90)",
  },
  {
    id: "covered_call",
    name: "Covered Call",
    badge: "Popular Income Strategy",
    category: "Income",
    description:
      "Own 100 shares of stock and sell an out-of-the-money Call option to collect instant cash income.",
    defaultStockPrice: 100,
    defaultStrikeA: 110,
    defaultPremiumA: 4.5,
    probabilityOfProfit: "~68%",
    upsideRisk: "Capped upside gains above Strike A",
    downsideRisk: "Full stock downside risk minus premium",
  },
  {
    id: "protective_put",
    name: "Protective Put",
    badge: "Stock Insurance",
    category: "Hedging",
    description:
      "Own 100 shares of stock and buy a Put option to set a guaranteed floor price, protecting against market crashes.",
    defaultStockPrice: 100,
    defaultStrikeA: 90,
    defaultPremiumA: 3.8,
    probabilityOfProfit: "~45%",
    upsideRisk: "Unlimited upside minus premium cost",
    downsideRisk: "Guaranteed Floor at Strike Price",
  },
  {
    id: "bull_call_spread",
    name: "Bull Call Vertical Spread",
    badge: "Capped Risk & Reward",
    category: "Spread",
    description:
      "Buy a lower Strike Call and sell a higher Strike Call to reduce upfront cost while capping max profit.",
    defaultStockPrice: 100,
    defaultStrikeA: 100,
    defaultStrikeB: 115,
    defaultPremiumA: 6.5,
    defaultPremiumB: 2.2,
    probabilityOfProfit: "~55%",
    upsideRisk: "Max Profit capped at Strike Spread minus Debit",
    downsideRisk: "Capped at Net Premium Paid ($430)",
  },
  {
    id: "bear_put_spread",
    name: "Bear Put Vertical Spread",
    badge: "Defined Risk Short",
    category: "Spread",
    description:
      "Buy a higher Strike Put and sell a lower Strike Put to profit from falling prices with lower capital outlay.",
    defaultStockPrice: 100,
    defaultStrikeA: 100,
    defaultStrikeB: 85,
    defaultPremiumA: 5.5,
    defaultPremiumB: 1.8,
    probabilityOfProfit: "~58%",
    upsideRisk: "Capped at Net Premium Paid ($370)",
    downsideRisk: "Max Profit reached below Strike B",
  },
  {
    id: "cash_secured_put",
    name: "Cash-Secured Put",
    badge: "Discount Buy & Yield",
    category: "Income",
    description:
      "Sell a Put option at a strike price below market. Collect cash income now and agree to buy stock if it dips.",
    defaultStockPrice: 100,
    defaultStrikeA: 95,
    defaultPremiumA: 3.5,
    probabilityOfProfit: "~78%",
    upsideRisk: "Capped at Premium Collected ($350)",
    downsideRisk: "Stock assignment at Strike minus premium",
  },
  {
    id: "long_call",
    name: "Long Call",
    badge: "Bullish Leverage",
    category: "Speculation",
    description:
      "Buy a Call option expecting the stock price to surge higher with capped downside risk.",
    defaultStockPrice: 100,
    defaultStrikeA: 105,
    defaultPremiumA: 5.0,
    probabilityOfProfit: "~38%",
    upsideRisk: "Unlimited upside potential",
    downsideRisk: "Capped at Premium Paid ($500)",
  },
  {
    id: "long_put",
    name: "Long Put",
    badge: "Bearish Bet",
    category: "Speculation",
    description:
      "Buy a Put option expecting the stock price to drop significantly.",
    defaultStockPrice: 100,
    defaultStrikeA: 95,
    defaultPremiumA: 4.2,
    probabilityOfProfit: "~35%",
    upsideRisk: "Capped at Premium Paid ($420)",
    downsideRisk: "Huge profit if stock plunges towards zero",
  },
];

// Helper to calculate P&L per share for any strategy
const calculatePayoffPerShare = (
  strategyId: StrategyType,
  priceAtExpiry: number,
  stockPrice: number,
  strikeA: number,
  strikeB: number,
  premiumA: number,
  premiumB: number,
): number => {
  switch (strategyId) {
    case "covered_call": {
      const stockPnL = priceAtExpiry - stockPrice;
      const callPnL =
        priceAtExpiry > strikeA ? strikeA - priceAtExpiry + premiumA : premiumA;
      return stockPnL + callPnL;
    }
    case "protective_put": {
      const stockPnL = priceAtExpiry - stockPrice;
      const putVal = Math.max(0, strikeA - priceAtExpiry);
      return stockPnL + putVal - premiumA;
    }
    case "long_call":
      return Math.max(0, priceAtExpiry - strikeA) - premiumA;
    case "long_put":
      return Math.max(0, strikeA - priceAtExpiry) - premiumA;
    case "cash_secured_put":
      return priceAtExpiry >= strikeA
        ? premiumA
        : priceAtExpiry - strikeA + premiumA;
    case "bull_call_spread": {
      const netDebit = premiumA - premiumB;
      const longC = Math.max(0, priceAtExpiry - strikeA);
      const shortC = Math.max(0, priceAtExpiry - strikeB);
      return longC - shortC - netDebit;
    }
    case "bear_put_spread": {
      const netDebit = premiumA - premiumB;
      const longP = Math.max(0, strikeA - priceAtExpiry);
      const shortP = Math.max(0, strikeB - priceAtExpiry);
      return longP - shortP - netDebit;
    }
    case "iron_condor": {
      const netCredit = premiumA;
      const putBuy = strikeA - 10;
      const putSell = strikeA;
      const callSell = strikeB;
      const callBuy = strikeB + 10;
      let loss = 0;
      if (priceAtExpiry < putSell) {
        loss = Math.min(putSell - putBuy, putSell - priceAtExpiry);
      } else if (priceAtExpiry > callSell) {
        loss = Math.min(callBuy - callSell, priceAtExpiry - callSell);
      }
      return netCredit - loss;
    }
    case "jade_lizard": {
      const netCredit = premiumA;
      const putSell = strikeA;
      const callSell = strikeB;
      const callBuy = strikeB + 5;
      let loss = 0;
      if (priceAtExpiry < putSell) {
        loss = putSell - priceAtExpiry;
      } else if (priceAtExpiry > callSell) {
        loss = Math.min(callBuy - callSell, priceAtExpiry - callSell);
      }
      return netCredit - loss;
    }
    default:
      return 0;
  }
};

// Standard normal cumulative distribution function (CDF)
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

// Statistical Probability of Profit (PoP) & Volatility Expected Move Calculation
function calculateDynamicPoP(
  strategyId: StrategyType,
  stockPrice: number,
  strikeA: number,
  strikeB: number,
  premiumA: number,
  premiumB: number,
  ivPct: number, // e.g. 30 for 30%
  dte: number, // e.g. 45 days
): {
  popPct: number;
  expectedMove: number;
  lower1SD: number;
  upper1SD: number;
} {
  const sigma = Math.max(0.05, ivPct / 100);
  const t = Math.max(1, dte) / 365;
  const sigmaT = sigma * Math.sqrt(t);

  // 1-Standard Deviation Expected Move = S * IV * sqrt(DTE/365)
  const expectedMove = stockPrice * sigmaT;
  const lower1SD = Math.max(0.01, stockPrice - expectedMove);
  const upper1SD = stockPrice + expectedMove;

  // Integrate probability mass over grid
  const steps = 400;
  const minP = Math.max(0.01, stockPrice * Math.exp(-3.5 * sigmaT));
  const maxP = stockPrice * Math.exp(3.5 * sigmaT);
  const stepSize = (maxP - minP) / steps;

  let totalProbWin = 0;
  let totalProb = 0;

  for (let i = 0; i < steps; i++) {
    const p1 = minP + i * stepSize;
    const p2 = p1 + stepSize;
    const pMid = (p1 + p2) / 2;

    const z1 = (Math.log(p1 / stockPrice) + 0.5 * sigmaT * sigmaT) / sigmaT;
    const z2 = (Math.log(p2 / stockPrice) + 0.5 * sigmaT * sigmaT) / sigmaT;
    const probInterval = Math.max(0, normCDF(z2) - normCDF(z1));

    totalProb += probInterval;

    const pnl = calculatePayoffPerShare(
      strategyId,
      pMid,
      stockPrice,
      strikeA,
      strikeB,
      premiumA,
      premiumB,
    );
    if (pnl > 0.001) {
      // Profitable outcome
      totalProbWin += probInterval;
    } else if (pnl >= -0.001) {
      // Breakeven
      totalProbWin += probInterval * 0.5;
    }
  }

  const popPct =
    totalProb > 0
      ? Math.min(99.9, Math.max(0.1, (totalProbWin / totalProb) * 100))
      : 50;
  return {
    popPct: Number(popPct.toFixed(1)),
    expectedMove: Number(expectedMove.toFixed(2)),
    lower1SD: Number(lower1SD.toFixed(2)),
    upper1SD: Number(upper1SD.toFixed(2)),
  };
}

export const InteractiveOptionsStrategyVisualizer: React.FC = () => {
  const [isCompareMode, setIsCompareMode] = useState<boolean>(true);
  const [strategyAId, setStrategyAId] = useState<StrategyType>("iron_condor");
  const [strategyBId, setStrategyBId] = useState<StrategyType>("jade_lizard");

  // Shared Parameters
  const [stockPrice, setStockPrice] = useState<number>(100);
  const [strikeA, setStrikeA] = useState<number>(90);
  const [strikeB, setStrikeB] = useState<number>(110);
  const [premiumA, setPremiumA] = useState<number>(3.5);
  const [premiumB, setPremiumB] = useState<number>(2.0);

  // Volatility & Time Parameters
  const [ivPct, setIvPct] = useState<number>(30); // 30% Implied Volatility
  const [dte, setDte] = useState<number>(45); // 45 Days to Expiration

  const [hoveredPricePoint, setHoveredPricePoint] = useState<number | null>(
    null,
  );

  const stratA = useMemo(
    () => STRATEGIES.find((s) => s.id === strategyAId) || STRATEGIES[0],
    [strategyAId],
  );
  const stratB = useMemo(
    () => STRATEGIES.find((s) => s.id === strategyBId) || STRATEGIES[1],
    [strategyBId],
  );

  // Handle Switching Primary Strategy A
  const handleSelectStrategyA = (strat: StrategyConfig) => {
    triggerHaptic("selection");
    setStrategyAId(strat.id);
    setStockPrice(strat.defaultStockPrice);
    setStrikeA(strat.defaultStrikeA);
    setPremiumA(strat.defaultPremiumA);
    if (strat.defaultStrikeB !== undefined) setStrikeB(strat.defaultStrikeB);
    if (strat.defaultPremiumB !== undefined) setPremiumB(strat.defaultPremiumB);
    setHoveredPricePoint(null);
  };

  // Handle Switching Secondary Strategy B
  const handleSelectStrategyB = (strat: StrategyConfig) => {
    triggerHaptic("selection");
    setStrategyBId(strat.id);
    setHoveredPricePoint(null);
  };

  // Dynamic Probability of Profit (PoP) & Volatility Metrics
  const popDataA = useMemo(() => {
    return calculateDynamicPoP(
      strategyAId,
      stockPrice,
      strikeA,
      strikeB,
      premiumA,
      premiumB,
      ivPct,
      dte,
    );
  }, [
    strategyAId,
    stockPrice,
    strikeA,
    strikeB,
    premiumA,
    premiumB,
    ivPct,
    dte,
  ]);

  const popDataB = useMemo(() => {
    return calculateDynamicPoP(
      strategyBId,
      stockPrice,
      strikeA,
      strikeB,
      premiumA,
      premiumB,
      ivPct,
      dte,
    );
  }, [
    strategyBId,
    stockPrice,
    strikeA,
    strikeB,
    premiumA,
    premiumB,
    ivPct,
    dte,
  ]);

  // Generate 60 points across X-axis range
  const chartData = useMemo(() => {
    const minPrice = Math.max(10, Math.floor(stockPrice * 0.4));
    const maxPrice = Math.ceil(stockPrice * 1.6);
    const step = (maxPrice - minPrice) / 60;

    const points: { price: number; pnlA: number; pnlB: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const p = Number((minPrice + i * step).toFixed(2));
      const pnlA =
        calculatePayoffPerShare(
          strategyAId,
          p,
          stockPrice,
          strikeA,
          strikeB,
          premiumA,
          premiumB,
        ) * 100;
      const pnlB =
        calculatePayoffPerShare(
          strategyBId,
          p,
          stockPrice,
          strikeA,
          strikeB,
          premiumA,
          premiumB,
        ) * 100;
      points.push({
        price: p,
        pnlA: Number(pnlA.toFixed(2)),
        pnlB: Number(pnlB.toFixed(2)),
      });
    }
    return { minPrice, maxPrice, points };
  }, [
    strategyAId,
    strategyBId,
    stockPrice,
    strikeA,
    strikeB,
    premiumA,
    premiumB,
  ]);

  // Max Profit / Loss Metrics for A & B
  const metricsA = useMemo(() => {
    let maxP = -Infinity;
    let maxL = Infinity;
    chartData.points.forEach((pt) => {
      if (pt.pnlA > maxP) maxP = pt.pnlA;
      if (pt.pnlA < maxL) maxL = pt.pnlA;
    });
    return {
      maxProfit: maxP > 100000 ? "Unlimited" : `$${maxP.toFixed(2)}`,
      maxLoss: maxL < -100000 ? "Unlimited" : `$${Math.abs(maxL).toFixed(2)}`,
    };
  }, [chartData]);

  const metricsB = useMemo(() => {
    let maxP = -Infinity;
    let maxL = Infinity;
    chartData.points.forEach((pt) => {
      if (pt.pnlB > maxP) maxP = pt.pnlB;
      if (pt.pnlB < maxL) maxL = pt.pnlB;
    });
    return {
      maxProfit: maxP > 100000 ? "Unlimited" : `$${maxP.toFixed(2)}`,
      maxLoss: maxL < -100000 ? "Unlimited" : `$${Math.abs(maxL).toFixed(2)}`,
    };
  }, [chartData]);

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 240;
  const padding = 40;

  const { minPrice, maxPrice, points } = chartData;

  const maxPnLAbs = useMemo(() => {
    let maxAbs = 10;
    points.forEach((pt) => {
      const absA = Math.abs(pt.pnlA);
      const absB = Math.abs(pt.pnlB);
      if (absA > maxAbs) maxAbs = absA;
      if (isCompareMode && absB > maxAbs) maxAbs = absB;
    });
    return Math.max(50, Math.ceil(maxAbs * 1.15));
  }, [points, isCompareMode]);

  const mapX = (price: number) => {
    return (
      padding +
      ((price - minPrice) / (maxPrice - minPrice)) * (svgWidth - 2 * padding)
    );
  };

  const mapY = (pnlContract: number) => {
    const centerY = svgHeight / 2;
    const scaleY = (svgHeight / 2 - padding) / maxPnLAbs;
    return centerY - pnlContract * scaleY;
  };

  const pathDA = useMemo(() => {
    return points.reduce((acc, pt, idx) => {
      const x = mapX(pt.price);
      const y = mapY(pt.pnlA);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [points, maxPnLAbs]);

  const pathDB = useMemo(() => {
    return points.reduce((acc, pt, idx) => {
      const x = mapX(pt.price);
      const y = mapY(pt.pnlB);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [points, maxPnLAbs]);

  // Hover Data
  const hoverData = useMemo(() => {
    if (hoveredPricePoint === null) return null;
    const pnlA =
      calculatePayoffPerShare(
        strategyAId,
        hoveredPricePoint,
        stockPrice,
        strikeA,
        strikeB,
        premiumA,
        premiumB,
      ) * 100;
    const pnlB =
      calculatePayoffPerShare(
        strategyBId,
        hoveredPricePoint,
        stockPrice,
        strikeA,
        strikeB,
        premiumA,
        premiumB,
      ) * 100;
    return {
      price: hoveredPricePoint,
      pnlA: Number(pnlA.toFixed(2)),
      pnlB: Number(pnlB.toFixed(2)),
      diff: Number((pnlA - pnlB).toFixed(2)),
    };
  }, [
    hoveredPricePoint,
    strategyAId,
    strategyBId,
    stockPrice,
    strikeA,
    strikeB,
    premiumA,
    premiumB,
  ]);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-950 via-slate-900 to-black border border-cyan-500/40 shadow-2xl space-y-6 select-none">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
            <GitCompare className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Options Strategy Dual Visualizer & Probability Engine
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                VOLATILITY & PoP ENGINE
              </span>
            </div>
            <p className="text-xs font-tech text-neutral-300 tracking-wide mt-0.5">
              Compare Iron Condors vs Jade Lizards, Covered Calls & Spreads
              side-by-side with real time Probability of Profit (PoP)
            </p>
          </div>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setIsCompareMode(!isCompareMode);
            }}
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isCompareMode
                ? "bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-lg shadow-purple-500/20"
                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
            }`}
          >
            <GitCompare className="w-4 h-4 text-purple-400" />
            <span>
              {isCompareMode ? "Dual Overlay Mode: ON" : "Single View Mode"}
            </span>
          </button>

          <button
            onClick={() => {
              handleSelectStrategyA(STRATEGIES[0]);
              setStrategyBId("jade_lizard");
              setIvPct(30);
              setDte(45);
            }}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition-all cursor-pointer"
            title="Reset All"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Probability of Profit (PoP) Live Scorecard Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border border-cyan-500/30 shadow-lg font-mono space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Dynamic Probability of Profit (PoP) Indicator
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-300">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> IV:{" "}
              <strong className="text-white">{ivPct}%</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> DTE:{" "}
              <strong className="text-white">{dte} Days</strong>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUpIcon className="w-3.5 h-3.5 text-emerald-400" />{" "}
              Expected Move:{" "}
              <strong className="text-emerald-300">
                ±${popDataA.expectedMove}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PoP Card Strategy A */}
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Strategy A: {stratA.name}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                PoP: {popDataA.popPct}%
              </span>
            </div>

            {/* Progress Meter Bar */}
            <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-cyan-500/30 p-0.5 flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${popDataA.popPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>
                Win Prob:{" "}
                <strong className="text-emerald-400">{popDataA.popPct}%</strong>
              </span>
              <span>
                1-SD Range:{" "}
                <strong className="text-neutral-200">
                  ${popDataA.lower1SD} ${popDataA.upper1SD}
                </strong>
              </span>
            </div>
          </div>

          {/* PoP Card Strategy B */}
          {isCompareMode ? (
            <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  Strategy B: {stratB.name}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PoP: {popDataB.popPct}%
                </span>
              </div>

              {/* Progress Meter Bar */}
              <div className="w-full bg-black/60 rounded-full h-2.5 overflow-hidden border border-purple-500/30 p-0.5 flex">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-purple-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${popDataB.popPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>
                  Win Prob:{" "}
                  <strong className="text-emerald-400">
                    {popDataB.popPct}%
                  </strong>
                </span>
                <span>
                  Advantage:{" "}
                  <strong
                    className={
                      popDataB.popPct >= popDataA.popPct
                        ? "text-purple-300"
                        : "text-cyan-300"
                    }
                  >
                    {popDataB.popPct >= popDataA.popPct
                      ? `Strat B +${(popDataB.popPct - popDataA.popPct).toFixed(1)}%`
                      : `Strat A +${(popDataA.popPct - popDataB.popPct).toFixed(1)}%`}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-black/40 border border-neutral-800 flex items-center justify-center text-xs text-neutral-400 font-sans">
              <Info className="w-4 h-4 text-cyan-400 mr-2" /> Enable Dual
              Overlay Mode to compare Probability of Profit against a secondary
              strategy.
            </div>
          )}
        </div>
      </div>

      {/* Dual Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy A Selector */}
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              Strategy A (Primary Line)
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Cyan Path
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            {STRATEGIES.map((strat) => (
              <button
                key={`a_${strat.id}`}
                onClick={() => handleSelectStrategyA(strat)}
                className={`p-2 rounded-lg text-left transition-all cursor-pointer border ${
                  strategyAId === strat.id
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold"
                    : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
              >
                <span className="text-[10px] block font-bold truncate">
                  {strat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Strategy B Selector (Only shown in compare mode or enabled) */}
        <div
          className={`p-3.5 rounded-xl border space-y-2 transition-all ${
            isCompareMode
              ? "bg-purple-950/20 border-purple-500/30"
              : "bg-neutral-900/40 border-neutral-800 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
              Strategy B (Comparison Overlay)
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Purple Path
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            {STRATEGIES.map((strat) => (
              <button
                key={`b_${strat.id}`}
                disabled={!isCompareMode}
                onClick={() => handleSelectStrategyB(strat)}
                className={`p-2 rounded-lg text-left transition-all cursor-pointer border ${
                  strategyBId === strat.id
                    ? "bg-purple-500/20 text-purple-300 border-purple-400 font-bold"
                    : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
              >
                <span className="text-[10px] block font-bold truncate">
                  {strat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Dual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Parameters (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-black/80 border border-neutral-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-bold text-white uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Market, Volatility & Strike Sliders
            </span>
            <span className="text-[10px] text-neutral-400">
              1 Contract = 100 Shares
            </span>
          </div>

          {/* Slider 1: Stock Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 text-[11px] font-bold">
                Underlying Stock Price ($):
              </label>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                ${stockPrice}.00
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              step="1"
              value={stockPrice}
              onChange={(e) => setStockPrice(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Slider 2: Implied Volatility (IV %) */}
          <div className="space-y-1.5 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <label className="text-cyan-300 text-[11px] font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Implied Volatility (IV %):
              </label>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                {ivPct}% IV
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="1"
              value={ivPct}
              onChange={(e) => setIvPct(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1 pt-1">
              {[
                { label: "Low 20%", val: 20 },
                { label: "Avg 30%", val: 30 },
                { label: "Earnings 60%", val: 60 },
                { label: "High 90%", val: 90 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setIvPct(preset.val)}
                  className={`px-1.5 py-0.5 rounded text-[9px] border cursor-pointer ${
                    ivPct === preset.val
                      ? "bg-cyan-500/30 text-cyan-300 border-cyan-400"
                      : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 3: Days to Expiration (DTE) */}
          <div className="space-y-1.5 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <label className="text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Days to Expiration (DTE):
              </label>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                {dte} Days
              </span>
            </div>
            <input
              type="range"
              min="7"
              max="180"
              step="1"
              value={dte}
              onChange={(e) => setDte(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1 pt-1">
              {[
                { label: "7D", val: 7 },
                { label: "30D", val: 30 },
                { label: "45D", val: 45 },
                { label: "60D", val: 60 },
                { label: "90D", val: 90 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setDte(preset.val)}
                  className={`px-1.5 py-0.5 rounded text-[9px] border cursor-pointer ${
                    dte === preset.val
                      ? "bg-amber-500/30 text-amber-300 border-amber-400"
                      : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 4: Strike A (Put or Lower Strike) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 text-[11px] font-bold">
                Put / Lower Strike A ($):
              </label>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                ${strikeA}.00
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              step="1"
              value={strikeA}
              onChange={(e) => setStrikeA(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider 5: Strike B (Call or Upper Strike) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 text-[11px] font-bold">
                Call / Upper Strike B ($):
              </label>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
                ${strikeB}.00
              </span>
            </div>
            <input
              type="range"
              min={strikeA + 1}
              max="190"
              step="1"
              value={strikeB}
              onChange={(e) => setStrikeB(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Slider 6: Net Premium / Credit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 text-[11px] font-bold">
                Net Premium / Credit ($):
              </label>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                ${premiumA.toFixed(2)} (${(premiumA * 100).toFixed(0)} total)
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="15.00"
              step="0.10"
              value={premiumA}
              onChange={(e) => setPremiumA(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Quick Trade-off Summary */}
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                  Strat A: {stratA.name}
                </span>
                <div className="text-xs font-black text-white">
                  Max Win: {metricsA.maxProfit}
                </div>
                <div className="text-[10px] font-bold text-emerald-400">
                  Calculated PoP: {popDataA.popPct}%
                </div>
              </div>

              {isCompareMode && (
                <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 space-y-1">
                  <span className="text-[10px] text-purple-400 uppercase font-bold block">
                    Strat B: {stratB.name}
                  </span>
                  <div className="text-xs font-black text-white">
                    Max Win: {metricsB.maxProfit}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-400">
                    Calculated PoP: {popDataB.popPct}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SVG Chart & Dual Hover Readout (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-black/90 border border-cyan-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-bold font-mono text-white text-xs uppercase">
                Payoff Curve & 1-SD Expected Move Band
              </span>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />{" "}
                {stratA.name}
              </span>
              {isCompareMode && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />{" "}
                  {stratB.name}
                </span>
              )}
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800 p-2">
            <svg
              className="w-full h-auto overflow-visible cursor-crosshair"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = mouseX / rect.width;
                const price = minPrice + ratio * (maxPrice - minPrice);
                setHoveredPricePoint(Number(price.toFixed(1)));
              }}
              onMouseLeave={() => setHoveredPricePoint(null)}
            >
              {/* 1-Standard Deviation Expected Move Band Shading */}
              {popDataA.lower1SD >= minPrice &&
                popDataA.upper1SD <= maxPrice && (
                  <rect
                    x={mapX(popDataA.lower1SD)}
                    y={padding}
                    width={mapX(popDataA.upper1SD) - mapX(popDataA.lower1SD)}
                    height={svgHeight - 2 * padding}
                    fill="#10b981"
                    fillOpacity="0.08"
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

              {/* $0 P&L Zero Line */}
              <line
                x1={padding}
                y1={mapY(0)}
                x2={svgWidth - padding}
                y2={mapY(0)}
                stroke="#555"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={svgWidth - padding + 5}
                y={mapY(0) + 4}
                fill="#888"
                fontSize="10"
                fontFamily="monospace"
              >
                $0 P&L
              </text>

              {/* Entry Stock Price Line */}
              <line
                x1={mapX(stockPrice)}
                y1={padding}
                x2={mapX(stockPrice)}
                y2={svgHeight - padding}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={mapX(stockPrice)}
                y={padding - 8}
                textAnchor="middle"
                fill="#10b981"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Stock ${stockPrice}
              </text>

              {/* Strategy A Path (Cyan) */}
              <path d={pathDA} fill="none" stroke="#06b6d4" strokeWidth="3.5" />

              {/* Strategy B Path (Purple Overlay) */}
              {isCompareMode && (
                <path
                  d={pathDB}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                />
              )}

              {/* Interactive Crosshair & Hover Dots */}
              {hoverData && (
                <g>
                  <line
                    x1={mapX(hoverData.price)}
                    y1={padding}
                    x2={mapX(hoverData.price)}
                    y2={svgHeight - padding}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Dot A */}
                  <circle
                    cx={mapX(hoverData.price)}
                    cy={mapY(hoverData.pnlA)}
                    r="5"
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Dot B */}
                  {isCompareMode && (
                    <circle
                      cx={mapX(hoverData.price)}
                      cy={mapY(hoverData.pnlB)}
                      r="5"
                      fill="#c084fc"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )}
            </svg>
          </div>

          {/* Simultaneous Dual Hover P&L Readout Card */}
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs space-y-2">
            {hoverData ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase block">
                    Price at Expiration
                  </span>
                  <span className="text-sm font-black text-white">
                    ${hoverData.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-cyan-400 text-[10px] uppercase font-bold block">
                      {stratA.name}
                    </span>
                    <strong
                      className={
                        hoverData.pnlA >= 0
                          ? "text-emerald-400 font-black"
                          : "text-rose-400 font-black"
                      }
                    >
                      {hoverData.pnlA >= 0
                        ? `+$${hoverData.pnlA.toFixed(2)}`
                        : `-$${Math.abs(hoverData.pnlA).toFixed(2)}`}
                    </strong>
                  </div>

                  {isCompareMode && (
                    <>
                      <div className="border-l border-neutral-700 h-6" />
                      <div>
                        <span className="text-purple-400 text-[10px] uppercase font-bold block">
                          {stratB.name}
                        </span>
                        <strong
                          className={
                            hoverData.pnlB >= 0
                              ? "text-emerald-400 font-black"
                              : "text-rose-400 font-black"
                          }
                        >
                          {hoverData.pnlB >= 0
                            ? `+$${hoverData.pnlB.toFixed(2)}`
                            : `-$${Math.abs(hoverData.pnlB).toFixed(2)}`}
                        </strong>
                      </div>

                      <div className="border-l border-neutral-700 h-6" />
                      <div>
                        <span className="text-amber-400 text-[10px] uppercase font-bold block">
                          Delta Difference
                        </span>
                        <strong
                          className={
                            hoverData.diff >= 0
                              ? "text-cyan-300 font-black"
                              : "text-purple-300 font-black"
                          }
                        >
                          {hoverData.diff >= 0
                            ? `A +$${hoverData.diff.toFixed(2)}`
                            : `B +$${Math.abs(hoverData.diff).toFixed(2)}`}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-neutral-400 text-[11px] font-sans flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Green shaded box shows the 68% (1-Standard Deviation)
                statistical expected move range (${popDataA.lower1SD} $
                {popDataA.upper1SD})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trade-Off Matrix Breakdown Table (When Comparison Active) */}
      {isCompareMode && (
        <div className="p-5 rounded-xl bg-black/90 border border-purple-500/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Scale className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-black font-mono text-purple-300 uppercase">
              Trade-Off Breakdown & Statistical Win Probability: {stratA.name}{" "}
              vs. {stratB.name}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Card A */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="font-bold text-cyan-300 font-mono">
                  {stratA.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Calculated PoP: {popDataA.popPct}%
                </span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                {stratA.description}
              </p>
              <div className="font-mono text-[11px] space-y-1 text-neutral-200 pt-1">
                <div>
                  <strong className="text-cyan-400">Upside Risk:</strong>{" "}
                  {stratA.upsideRisk}
                </div>
                <div>
                  <strong className="text-cyan-400">Downside Risk:</strong>{" "}
                  {stratA.downsideRisk}
                </div>
                <div>
                  <strong className="text-emerald-400">
                    Win Rate at {ivPct}% IV / {dte}DTE:
                  </strong>{" "}
                  {popDataA.popPct}% likelihood of net profit
                </div>
              </div>
            </div>

            {/* Card B */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="font-bold text-purple-300 font-mono">
                  {stratB.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  Calculated PoP: {popDataB.popPct}%
                </span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                {stratB.description}
              </p>
              <div className="font-mono text-[11px] space-y-1 text-neutral-200 pt-1">
                <div>
                  <strong className="text-purple-400">Upside Risk:</strong>{" "}
                  {stratB.upsideRisk}
                </div>
                <div>
                  <strong className="text-purple-400">Downside Risk:</strong>{" "}
                  {stratB.downsideRisk}
                </div>
                <div>
                  <strong className="text-emerald-400">
                    Win Rate at {ivPct}% IV / {dte}DTE:
                  </strong>{" "}
                  {popDataB.popPct}% likelihood of net profit
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
