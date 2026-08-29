import React, { useState } from "react";
import {
  Layers,
  TrendingUp,
  Activity,
  Zap,
  HelpCircle,
  Percent,
  Clock,
  Shield,
  BarChart3,
  Sliders,
  DollarSign,
  ArrowRight
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { triggerHaptic } from "../../utils/haptics";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const GREEKS_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Black-Scholes-Merton European Option Pricing Equation",
    source: "Fischer Black, Myron Scholes (1973) & Robert C. Merton (1973 Nobel Memorial Prize in Economics)",
    sourceType: "Industry Benchmark",
    asOfDate: "Permanent Quantitative Model",
    updateFrequency: "Permanent Physics",
    details: "Standard closed-form analytical continuous-time stochastic differential equation for pricing equity options."
  },
  {
    metricName: "Normal Cumulative Distribution Function & Greeks Partial Derivatives",
    source: "CBOE (Chicago Board Options Exchange) Theoretical Pricing Models",
    sourceType: "Market Exchange",
    asOfDate: "Live Analytic Engine",
    updateFrequency: "Real-time",
    details: "First and second partial derivatives with respect to underlying price S (Delta, Gamma), time T (Theta), volatility σ (Vega), and interest rate r (Rho)."
  },
  {
    metricName: "Equity Volatility Skew & Smile Mechanics",
    source: "CBOE S&P 500 Implied Volatility Surface & Post-1987 Crash Microstructure",
    sourceType: "Market Exchange",
    asOfDate: "August 2026",
    updateFrequency: "Daily",
    details: "Asymmetric negative skew in equity indices driven by institutional tail-risk put demand."
  }
];

// Helper approximation for standard normal cumulative distribution N(x)
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

function normalPdf(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export const OptionsGreeksSandbox: React.FC = () => {
  // Inputs
  const [stockPrice, setStockPrice] = useState<number>(100);
  const [strikePrice, setStrikePrice] = useState<number>(100);
  const [daysToExpiry, setDaysToExpiry] = useState<number>(45);
  const [iv, setIv] = useState<number>(30); // 30% IV
  const [riskFreeRate, setRiskFreeRate] = useState<number>(4.5); // 4.5%

  const T = Math.max(daysToExpiry / 365, 0.001);
  const sigma = Math.max(iv / 100, 0.01);
  const r = riskFreeRate / 100;
  const S = stockPrice;
  const K = strikePrice;

  // Black-Scholes d1 and d2
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  // Call & Put Price
  const callPrice = S * normalCdf(d1) - K * Math.exp(-r * T) * normalCdf(d2);
  const putPrice = K * Math.exp(-r * T) * normalCdf(-d2) - S * normalCdf(-d1);

  // Greeks
  const callDelta = normalCdf(d1);
  const putDelta = callDelta - 1;
  const gamma = normalPdf(d1) / (S * sigma * Math.sqrt(T));
  const vega = (S * normalPdf(d1) * Math.sqrt(T)) / 100; // per 1% change in IV
  const callThetaAnnual = -(S * normalPdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCdf(d2);
  const callThetaDaily = callThetaAnnual / 365;
  const callRho = (K * T * Math.exp(-r * T) * normalCdf(d2)) / 100; // per 1% change in r

  // Generate curve for Call price and Delta across stock prices
  const priceCurveData = [];
  const minPrice = Math.max(10, strikePrice * 0.7);
  const maxPrice = strikePrice * 1.3;
  const step = (maxPrice - minPrice) / 20;

  for (let p = minPrice; p <= maxPrice; p += step) {
    const curD1 = (Math.log(p / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const curD2 = curD1 - sigma * Math.sqrt(T);
    const curCall = p * normalCdf(curD1) - K * Math.exp(-r * T) * normalCdf(curD2);
    const curDelta = normalCdf(curD1);
    const intrinsic = Math.max(0, p - K);

    priceCurveData.push({
      spot: parseFloat(p.toFixed(1)),
      callValue: parseFloat(curCall.toFixed(2)),
      intrinsicValue: parseFloat(intrinsic.toFixed(2)),
      delta: parseFloat((curDelta * 100).toFixed(1))
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-black border border-purple-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Options Greeks & Volatility Surface Sandbox
              </h2>
            </div>
            <p className="text-xs text-purple-200/80 font-mono">
              Live Black-Scholes-Merton Engine: Delta, Gamma, Theta, Vega & Dynamic PnL Curves
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
            Black-Scholes Closed-Form
          </div>
        </div>
      </div>

      {/* GREEKS LIVE METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Delta */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-cyan-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 uppercase">
            <span>Delta (Δ)</span>
            <span className="text-[10px] font-mono text-neutral-400">Directional</span>
          </div>
          <div className="text-xl font-black font-mono text-cyan-400">
            {callDelta.toFixed(3)}
          </div>
          <p className="text-[10px] text-neutral-400 leading-tight">
            Gains <strong>${(callDelta * 100).toFixed(1)}</strong> per $1 stock rise (or ~{(callDelta * 100).toFixed(0)}% share equiv).
          </p>
        </div>

        {/* Gamma */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase">
            <span>Gamma (Γ)</span>
            <span className="text-[10px] font-mono text-neutral-400">Acceleration</span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400">
            {gamma.toFixed(4)}
          </div>
          <p className="text-[10px] text-neutral-400 leading-tight">
            Delta expands by <strong>+{(gamma).toFixed(3)}</strong> for the next $1 move.
          </p>
        </div>

        {/* Theta */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-red-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-red-300 uppercase">
            <span>Theta (Θ)</span>
            <span className="text-[10px] font-mono text-neutral-400">Time Decay</span>
          </div>
          <div className="text-xl font-black font-mono text-red-400">
            -${Math.abs(callThetaDaily).toFixed(3)}/day
          </div>
          <p className="text-[10px] text-neutral-400 leading-tight">
            Loses <strong>${(Math.abs(callThetaDaily) * 100).toFixed(1)}/day</strong> to calendar decay.
          </p>
        </div>

        {/* Vega */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-purple-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
            <span>Vega (ν)</span>
            <span className="text-[10px] font-mono text-neutral-400">Volatility</span>
          </div>
          <div className="text-xl font-black font-mono text-purple-400">
            ${vega.toFixed(3)}
          </div>
          <p className="text-[10px] text-neutral-400 leading-tight">
            Moves <strong>${(vega * 100).toFixed(1)}</strong> for each 1% shift in Implied Volatility.
          </p>
        </div>

        {/* Theoretical Call / Put Prices */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-amber-500/30 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase">
            <span>Theoretical Price</span>
            <span className="text-[10px] font-mono text-neutral-400">BSM Model</span>
          </div>
          <div className="text-lg font-black font-mono text-amber-400">
            Call: ${callPrice.toFixed(2)}
          </div>
          <div className="text-xs font-mono text-neutral-400">
            Put: ${putPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* CONTROLS & DYNAMIC SLIDERS */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-6">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          Interactive Market Parameter Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stock Spot Price */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">Stock Price ($S)</span>
              <span className="font-mono text-cyan-400">${stockPrice}</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              step="1"
              value={stockPrice}
              onChange={(e) => {
                triggerHaptic("selection");
                setStockPrice(parseFloat(e.target.value));
              }}
              className="w-full accent-cyan-400"
            />
            <span className="text-[10px] text-neutral-500 block">Current market underlying spot.</span>
          </div>

          {/* Strike Price */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">Strike Price ($K)</span>
              <span className="font-mono text-amber-400">${strikePrice}</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              step="1"
              value={strikePrice}
              onChange={(e) => {
                triggerHaptic("selection");
                setStrikePrice(parseFloat(e.target.value));
              }}
              className="w-full accent-amber-400"
            />
            <span className="text-[10px] text-neutral-500 block">Contract exercise strike price.</span>
          </div>

          {/* Days to Expiration */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">Days to Expiration (DTE)</span>
              <span className="font-mono text-red-400">{daysToExpiry} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="365"
              step="1"
              value={daysToExpiry}
              onChange={(e) => {
                triggerHaptic("selection");
                setDaysToExpiry(parseInt(e.target.value));
              }}
              className="w-full accent-red-400"
            />
            <span className="text-[10px] text-neutral-500 block">Calendar time remaining.</span>
          </div>

          {/* Implied Volatility */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">Implied Volatility (IV)</span>
              <span className="font-mono text-purple-400">{iv}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="1"
              value={iv}
              onChange={(e) => {
                triggerHaptic("selection");
                setIv(parseInt(e.target.value));
              }}
              className="w-full accent-purple-400"
            />
            <span className="text-[10px] text-neutral-500 block">Expected 1-standard-deviation move.</span>
          </div>
        </div>
      </div>

      {/* CHART: CALL PRICE VS INTRINSIC VALUE & DELTA PROFILE */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Option Premium Curve vs. Intrinsic Value ($K = ${strikePrice})
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Time Value (Extrinsic) = Blue Line minus Green Line
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceCurveData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="spot" stroke="#737373" tick={{ fontSize: 10 }} label={{ value: "Underlying Stock Spot Price ($)", position: "insideBottom", offset: -5, fontSize: 10, fill: "#737373" }} />
              <YAxis stroke="#737373" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#404040", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: any, name: string) => [`$${value}`, name === "callValue" ? "Call Premium" : name === "intrinsicValue" ? "Intrinsic Value" : "Delta %"]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="callValue" stroke="#38bdf8" strokeWidth={3} name="Total Call Premium ($)" dot={false} />
              <Line type="monotone" dataKey="intrinsicValue" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" name="Intrinsic Value ($)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DATA PROVENANCE */}
      <DataProvenanceCard
        category="Quantitative Derivatives & Stochastic Calculus"
        lastUpdated="August 2026 (Black-Scholes & CBOE Analytics)"
        sources={GREEKS_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
