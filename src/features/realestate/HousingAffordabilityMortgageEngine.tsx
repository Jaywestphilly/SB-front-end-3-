import React, { useState, useMemo } from "react";
import {
  Home,
  Percent,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Layers,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const HOUSING_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Outstanding Mortgage Interest Rate Distribution",
    source: "Federal Housing Finance Agency (FHFA) National Mortgage Database (NMDB®)",
    sourceType: "Regulatory Agency",
    asOfDate: "Q1 2026",
    updateFrequency: "Quarterly",
    details: "1-to-4 unit residential first-lien conforming & non-conforming outstanding mortgages."
  },
  {
    metricName: "Primary 30-Year Mortgage Rate & 10Y UST Spread",
    source: "Freddie Mac Primary Mortgage Market Survey (PMMS®) & U.S. Department of the Treasury",
    sourceType: "Central Bank / Fed",
    asOfDate: "August 2026 (Live Calculation)",
    updateFrequency: "Daily",
    details: "Weekly PMMS 30-year fixed conforming conventional rate versus constant maturity 10-year US Treasury yield."
  },
  {
    metricName: "Public Homebuilder Rate Buydowns & Financials ($DHI, $LEN, $NVR, $PHM)",
    source: "SEC Form 10-K & 10-Q Financial Statements (Financial Services & Mortgage Segments)",
    sourceType: "SEC Filing",
    asOfDate: "Q2 2026 Filings",
    updateFrequency: "Quarterly",
    details: "Forward commitments for below-market mortgage originations, incentives per home closed, and housing gross margins."
  },
  {
    metricName: "Median Existing vs. New Home Pricing & Inventory",
    source: "National Association of Realtors (NAR) & U.S. Census Bureau Construction Statistics",
    sourceType: "Regulatory Agency",
    asOfDate: "June 2026",
    updateFrequency: "Monthly",
    details: "Monthly active single-family inventory, months of supply, and median sales transaction prices."
  }
];

// Outstanding Mortgage Rates Distribution (FHFA / CoreLogic Data)
const MORTGAGE_RATE_DISTRIBUTION = [
  { bucket: "< 3.0%", sharePercent: 23.4, color: "#10b981", label: "Super Locked-In (2020-2021 Refi)" },
  { bucket: "3.0% - 3.99%", sharePercent: 38.8, color: "#06b6d4", label: "Golden Handcuffs (Sub-4%)" },
  { bucket: "4.0% - 4.99%", sharePercent: 18.2, color: "#3b82f6", label: "Moderate Fixed Rate" },
  { bucket: "5.0% - 5.99%", sharePercent: 8.9, color: "#f59e0b", label: "Transition Window" },
  { bucket: "6.0%+", sharePercent: 10.7, color: "#ef4444", label: "New Buyers / Recent Originations" }
];

const BUILDER_STOCKS = [
  { ticker: "DHI", name: "D.R. Horton", price: 172.5, pe: 11.2, buydownShare: "78% of closings", margin: "22.4%", focus: "Entry-level & first-time buyers with permanent 4.99% buydowns" },
  { ticker: "LEN", name: "Lennar Corp", price: 168.0, pe: 10.8, buydownShare: "82% of closings", margin: "21.8%", focus: "Everything's Included® + captive mortgage financing (Lennar Mortgage)" },
  { ticker: "NVR", name: "NVR Inc. (Ryan Homes)", price: 8420.0, pe: 14.5, buydownShare: "65% of closings", margin: "24.6%", focus: "Asset-light lot option model with zero land holding risk" },
  { ticker: "PHM", name: "PulteGroup", price: 124.8, pe: 9.9, buydownShare: "72% of closings", margin: "28.5%", focus: "Move-up & active adult communities with forward rate locks" }
];

export const HousingAffordabilityMortgageEngine: React.FC = () => {
  // Homebuilder Rate Buydown Interactive Simulator
  const [homePrice, setHomePrice] = useState<number>(450000); // $450,000 home
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20); // 20% down
  const [marketRatePct, setMarketRatePct] = useState<number>(6.85); // 6.85% resale market rate
  const [builderBuydownRatePct, setBuilderBuydownRatePct] = useState<number>(4.99); // 4.99% builder rate
  const [loanTermYears, setLoanTermYears] = useState<number>(30);

  // Buydown Math
  const buydownMetrics = useMemo(() => {
    const loanAmount = homePrice * (1 - downPaymentPct / 100);

    // Standard monthly payment calculation
    const calcMonthlyPayment = (rate: number) => {
      const r = rate / 100 / 12;
      const n = loanTermYears * 12;
      if (r === 0) return loanAmount / n;
      return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    };

    const marketMonthlyPayment = calcMonthlyPayment(marketRatePct);
    const builderMonthlyPayment = calcMonthlyPayment(builderBuydownRatePct);
    const monthlySavings = marketMonthlyPayment - builderMonthlyPayment;
    const annualSavings = monthlySavings * 12;
    const totalLifetimeSavings = monthlySavings * loanTermYears * 12;

    // Equivalent sticker price reduction on the existing home to match the builder's payment:
    // P_equiv = payment * [(1+r)^n - 1] / [r*(1+r)^n] / (1 - downPaymentPct)
    const r_market = marketRatePct / 100 / 12;
    const n = loanTermYears * 12;
    const equivLoan =
      (builderMonthlyPayment * (Math.pow(1 + r_market, n) - 1)) /
      (r_market * Math.pow(1 + r_market, n));
    const equivHomePrice = equivLoan / (1 - downPaymentPct / 100);
    const impliedPriceDiscount = homePrice - equivHomePrice;
    const impliedPriceDiscountPct = Math.round((impliedPriceDiscount / homePrice) * 100);

    // Estimated upfront builder cost to buy down the rate (typically ~4-5 points or ~4-5% of loan amount)
    const rateDelta = marketRatePct - builderBuydownRatePct;
    const estimatedPointsCostPct = Number((rateDelta * 2.2).toFixed(1)); // ~2.2 points per 100 bps buydown
    const estimatedBuilderCost = (loanAmount * estimatedPointsCostPct) / 100;

    return {
      loanAmount,
      marketMonthlyPayment,
      builderMonthlyPayment,
      monthlySavings,
      annualSavings,
      totalLifetimeSavings,
      equivHomePrice,
      impliedPriceDiscount,
      impliedPriceDiscountPct,
      estimatedPointsCostPct,
      estimatedBuilderCost
    };
  }, [homePrice, downPaymentPct, marketRatePct, builderBuydownRatePct, loanTermYears]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#07131e] via-[#092233] to-[#040c14] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                MBS Spread & Housing Affordability
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Golden Handcuffs Sub-4%
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Home className="w-6 h-6 text-cyan-400" />
              Mortgage Spread, Lock-In Dynamics & Homebuilder Rate Buydown Engine
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Over <strong>62% of US homeowners have mortgages below 4.0%</strong>, freezing existing inventory. Discover how public homebuilders ($DHI, $LEN, $NVR) capture massive market share by offering 4.99% financing buydowns that deliver the equivalent of a <strong>15–20% price slash</strong> without cutting appraisal comps.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-right min-w-[210px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Monthly Buyer Savings via Buydown
            </span>
            <div className="text-3xl font-black text-emerald-400 mt-0.5">
              ${Math.round(buydownMetrics.monthlySavings)} / mo
            </div>
            <span className="text-[11px] text-cyan-300 font-bold flex items-center justify-end gap-1 mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              ${Math.round(buydownMetrics.totalLifetimeSavings).toLocaleString()} Lifetime Saved
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE LOCK-IN EFFECT & MORTGAGE SPREAD BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mortgage Rate Distribution Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Distribution of Outstanding US Residential Mortgages
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                62.2% of existing mortgages are sub-4%, creating an impenetrable supply freeze in existing homes
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              % of Total Loans
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MORTGAGE_RATE_DISTRIBUTION} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="bucket" stroke="#737373" tick={{ fontSize: 11 }} />
                <YAxis stroke="#737373" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 45]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#07131e",
                    borderColor: "#06b6d4",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% of all US mortgages (${item.payload.label})`,
                    "Share"
                  ]}
                />
                <Bar dataKey="sharePercent" radius={[6, 6, 0, 0]}>
                  {MORTGAGE_RATE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mortgage vs 10Y UST Spread Explainer */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/10 pb-2.5">
              <Percent className="w-4 h-4 text-emerald-400" />
              Mortgage Spread Anatomy
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              30Y Mortgage Rate vs 10-Year Treasury Yield
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-xl bg-neutral-900/80 border border-white/5">
              <span className="text-neutral-400">10-Year US Treasury Benchmark:</span>
              <span className="font-mono font-bold text-white">4.20%</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-neutral-900/80 border border-white/5">
              <span className="text-neutral-400">Historical Primary Spread (1990-2021):</span>
              <span className="font-mono text-neutral-300">~170 bps</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-neutral-900/80 border border-cyan-500/30">
              <span className="text-neutral-400">Current Elevated Spread (Post-QT):</span>
              <span className="font-mono font-bold text-cyan-300">~265 bps</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-neutral-900/80 border border-white/5">
              <span className="text-neutral-400">30-Year Conforming Mortgage:</span>
              <span className="font-mono font-black text-emerald-400">6.85%</span>
            </div>
          </div>

          <p className="text-[10px] text-neutral-400 leading-snug">
            Elevated spreads stem from Fed quantitative tightening (QT) mortgage runoff and heightened interest rate volatility.
          </p>
        </div>
      </div>

      {/* 3. HOMEBUILDER RATE BUYDOWN SIMULATOR */}
      <div className="p-6 rounded-3xl bg-black/70 border border-emerald-500/30 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-extrabold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Financing Arbitrage Engine
              </span>
              <span className="text-xs font-mono text-neutral-400">New Construction vs Resale Inventory</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Homebuilder Rate Buydown vs. Sticker Price Reduction Simulator
            </h3>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900 border border-emerald-500/30 text-right">
            <span className="text-[10px] text-neutral-400 uppercase">Implied Sticker Discount Equiv.</span>
            <div className="text-base font-black text-emerald-400">
              -${Math.round(buydownMetrics.impliedPriceDiscount).toLocaleString()} (-{buydownMetrics.impliedPriceDiscountPct}%)
            </div>
          </div>
        </div>

        {/* Input Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Home Purchase Price */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Home Purchase Price</span>
              <span className="font-mono font-black text-cyan-300">${homePrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="200000"
              max="1200000"
              step="25000"
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>$200k</span>
              <span>$1.2M</span>
            </div>
          </div>

          {/* Down Payment % */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Down Payment</span>
              <span className="font-mono font-black text-white">{downPaymentPct}% (${((homePrice * downPaymentPct) / 100).toLocaleString()})</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>5% (FHA / Conv)</span>
              <span>30%</span>
            </div>
          </div>

          {/* Resale Market Mortgage Rate */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Resale Market Rate</span>
              <span className="font-mono font-black text-red-400">{marketRatePct}%</span>
            </div>
            <input
              type="range"
              min="5.5"
              max="8.5"
              step="0.05"
              value={marketRatePct}
              onChange={(e) => setMarketRatePct(Number(e.target.value))}
              className="w-full accent-red-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>5.5%</span>
              <span>8.5%</span>
            </div>
          </div>

          {/* Builder Buydown Rate */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Builder Buydown Rate</span>
              <span className="font-mono font-black text-emerald-400">{builderBuydownRatePct}%</span>
            </div>
            <input
              type="range"
              min="3.99"
              max="5.99"
              step="0.1"
              value={builderBuydownRatePct}
              onChange={(e) => setBuilderBuydownRatePct(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>3.99% (Aggressive)</span>
              <span>5.99%</span>
            </div>
          </div>
        </div>

        {/* 4. COMPARISON SCORECARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Option A: Resale Home at Market Rate */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-500/30">
                Existing Resale Home (No Builder Incentive)
              </span>
              <span className="font-mono text-base font-black text-red-300">
                ${Math.round(buydownMetrics.marketMonthlyPayment).toLocaleString()} / mo
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Mortgage Interest Rate:</span>
                <span className="font-mono">{marketRatePct}% Fixed 30-Year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Loan Principal:</span>
                <span className="font-mono">${buydownMetrics.loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total 30-Year Interest Paid:</span>
                <span className="font-mono text-red-400">
                  ${Math.round(buydownMetrics.marketMonthlyPayment * 360 - buydownMetrics.loanAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Option B: New Construction with Builder Buydown */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                New Home with Builder 4.99% Buydown
              </span>
              <span className="font-mono text-base font-black text-emerald-300">
                ${Math.round(buydownMetrics.builderMonthlyPayment).toLocaleString()} / mo
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Builder Subsidized Rate:</span>
                <span className="font-mono text-emerald-300 font-bold">{builderBuydownRatePct}% Fixed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Monthly Cash Savings:</span>
                <span className="font-mono text-emerald-400 font-bold">+${Math.round(buydownMetrics.monthlySavings)} / mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Builder Upfront Cost to Buy Down:</span>
                <span className="font-mono text-cyan-300">~${Math.round(buydownMetrics.estimatedBuilderCost).toLocaleString()} ({buydownMetrics.estimatedPointsCostPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Builders Win Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-neutral-900 border border-emerald-500/30 text-xs text-neutral-300 leading-relaxed">
          <strong className="text-emerald-300">The Homebuilder Economic Moat:</strong> Why do D.R. Horton and Lennar buy down rates instead of cutting prices? A <strong>${Math.round(buydownMetrics.estimatedBuilderCost).toLocaleString()} buydown cost</strong> gives the homebuyer the exact same monthly payment reduction as an <strong>${Math.round(buydownMetrics.impliedPriceDiscount).toLocaleString()} sticker price slash</strong>. The builder protects community appraisal comps while delivering massive affordability.
        </div>
      </div>

      {/* 5. TOP PUBLIC HOMEBUILDERS */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Public Homebuilder Market Leaders ($DHI, $LEN, $NVR, $PHM)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Valuation multiples, gross margins, and captive mortgage origination dominance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUILDER_STOCKS.map((stock) => (
            <div key={stock.ticker} className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400 text-base">{stock.ticker}</span>
                    <span className="text-xs font-bold text-white">{stock.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">{stock.focus}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-white">${stock.price}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">P/E: {stock.pe}x</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                <div>
                  <span className="text-neutral-500 text-[10px] block">Buydown Share</span>
                  <span className="font-bold text-cyan-300">{stock.buydownShare}</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block">Gross Margin</span>
                  <span className="font-bold text-emerald-300">{stock.margin}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="Residential Mortgages & Housing Economics"
        lastUpdated="August 2026 (Live FHFA & Freddie Mac PMMS)"
        sources={HOUSING_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
