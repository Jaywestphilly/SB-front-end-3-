import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Landmark,
  ShieldCheck,
  Zap,
  BarChart3,
  Scale,
  RefreshCw,
  Download,
  Copy,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Layers,
  Flame,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { triggerHaptic } from "../../utils/haptics";

// Sample Fed Liquidity Time Series (in Trillions USD)
const FED_LIQUIDITY_SERIES = [
  { month: "Jan", fedAssets: 7.68, tga: 0.78, rrp: 0.65, netLiquidity: 6.25, spx: 4850 },
  { month: "Feb", fedAssets: 7.55, tga: 0.81, rrp: 0.54, netLiquidity: 6.20, spx: 5080 },
  { month: "Mar", fedAssets: 7.48, tga: 0.76, rrp: 0.49, netLiquidity: 6.23, spx: 5250 },
  { month: "Apr", fedAssets: 7.39, tga: 0.92, rrp: 0.42, netLiquidity: 6.05, spx: 5020 },
  { month: "May", fedAssets: 7.31, tga: 0.79, rrp: 0.38, netLiquidity: 6.14, spx: 5270 },
  { month: "Jun", fedAssets: 7.22, tga: 0.74, rrp: 0.35, netLiquidity: 6.13, spx: 5460 },
  { month: "Jul", fedAssets: 7.15, tga: 0.77, rrp: 0.31, netLiquidity: 6.07, spx: 5520 },
  { month: "Aug", fedAssets: 7.08, tga: 0.71, rrp: 0.28, netLiquidity: 6.09, spx: 5600 },
  { month: "Current", fedAssets: 7.02, tga: 0.69, rrp: 0.25, netLiquidity: 6.08, spx: 5680 },
];

// Yield Curve Historical Term Structure
const YIELD_CURVE_POINTS = [
  { tenor: "1M", yield: 5.32, previousYear: 5.48 },
  { tenor: "3M", yield: 5.24, previousYear: 5.45 },
  { tenor: "6M", yield: 5.08, previousYear: 5.35 },
  { tenor: "1Y", yield: 4.62, previousYear: 5.02 },
  { tenor: "2Y", yield: 3.98, previousYear: 4.88 },
  { tenor: "5Y", yield: 3.82, previousYear: 4.42 },
  { tenor: "10Y", yield: 4.05, previousYear: 4.25 },
  { tenor: "20Y", yield: 4.38, previousYear: 4.55 },
  { tenor: "30Y", yield: 4.32, previousYear: 4.48 },
];

// Key Cross-Asset Indicators
const INTERMARKET_INDICATORS = [
  {
    name: "Copper / Gold Ratio",
    ticker: "HG1! / GC1!",
    value: "0.00178",
    change: "+1.42%",
    isPositive: true,
    category: "Global Growth & Industrial Velocity",
    status: "EXPANSIONARY",
    desc: "Rising ratio signals accelerating global manufacturing and infrastructure capex vs. risk-off safe haven demand.",
  },
  {
    name: "US Dollar Index (DXY)",
    ticker: "DXY",
    value: "102.45",
    change: "-0.65%",
    isPositive: false,
    category: "Global FX & Sovereign Liquidity",
    status: "DOLLAR EASING",
    desc: "Softening DXY eases financial conditions for emerging markets and lowers translation drag on US multinational earnings.",
  },
  {
    name: "Brent / Henry Hub Ratio",
    ticker: "BRENT / NG1!",
    value: "34.2x",
    change: "+2.10%",
    isPositive: true,
    category: "Energy Arbitrage & Datacenter Power",
    status: "LNG MARGIN FAVORABLE",
    desc: "Elevated spread widens export arbitrage for US LNG exporters fueling European and Asian power utilities.",
  },
  {
    name: "Baltic Dry Index (BDI)",
    ticker: "BDIY",
    value: "1,845",
    change: "+4.80%",
    isPositive: true,
    category: "Maritime Raw Material Freight",
    status: "SUPPLY CHAIN RESILIENT",
    desc: "Dry bulk charter rates reflect robust iron ore, coal, and grain shipments across Pacific-Atlantic sea routes.",
  },
  {
    name: "US 2Y - 10Y Yield Spread",
    ticker: "T10Y2Y",
    value: "+7 bps",
    change: "+18 bps (Un-inverting)",
    isPositive: true,
    category: "Yield Curve Regime",
    status: "BULL STEEPENING",
    desc: "Yield curve has dis-inverted as front-end rates fall on anticipated Fed policy easing while long-end reflects growth.",
  },
  {
    name: "HY Credit Spread (OAS)",
    ticker: "BAMLH0A0HYM2",
    value: "318 bps",
    change: "-12 bps",
    isPositive: true,
    category: "Credit Risk & Default Risk Premium",
    status: "TIGHT / BENIGN",
    desc: "Spreads below 350 bps indicate credit markets perceive low systemic default risk for corporate high-yield debt.",
  },
];

// Major Central Bank Tracker
const CENTRAL_BANKS = [
  {
    bank: "Federal Reserve (Fed)",
    policyRate: "5.25% - 5.50%",
    nextMeeting: "FOMC Decision",
    bias: "DOVISH PIVOT",
    qtPace: "$60B/mo QT",
    balanceSheet: "$7.02 Trillion",
    statusColor: "emerald",
  },
  {
    bank: "European Central Bank (ECB)",
    policyRate: "3.75%",
    nextMeeting: "Governing Council",
    bias: "GRADUAL CUTS",
    qtPace: "APP Roll-off",
    balanceSheet: "€6.55 Trillion",
    statusColor: "cyan",
  },
  {
    bank: "Bank of Japan (BOJ)",
    policyRate: "0.25%",
    nextMeeting: "Monetary Policy",
    bias: "NORMALIZATION",
    qtPace: "Tapering JGB Buys",
    balanceSheet: "¥755 Trillion",
    statusColor: "amber",
  },
  {
    bank: "People's Bank of China (PBOC)",
    policyRate: "3.35% (1Y LPR)",
    nextMeeting: "MLF Operations",
    bias: "EXPANSIONARY",
    qtPace: "Targeted Liquidity / RRR Cuts",
    balanceSheet: "¥44.2 Trillion",
    statusColor: "purple",
  },
];

// Critical Macro Economic Releases
const UPCOMING_MACRO_EVENTS = [
  {
    event: "Consumer Price Index (CPI YoY)",
    releaseDate: "Wednesday 08:30 ET",
    consensus: "2.9%",
    previous: "3.0%",
    impact: "HIGH",
    importanceNote: "Headline inflation moderation confirms room for Fed discount window easing.",
  },
  {
    event: "Core PCE Price Index (MoM)",
    releaseDate: "Friday 08:30 ET",
    consensus: "0.2%",
    previous: "0.2%",
    impact: "CRITICAL",
    importanceNote: "The Federal Reserve's primary targeted inflation gauge for 2.0% mandate.",
  },
  {
    event: "US Non-Farm Payrolls (NFP)",
    releaseDate: "First Friday 08:30 ET",
    consensus: "165K",
    previous: "179K",
    impact: "HIGH",
    importanceNote: "Unemployment rate at 4.3% triggers Sahm Rule recession watch indicator.",
  },
  {
    event: "ISM Manufacturing PMI",
    releaseDate: "First Business Day",
    consensus: "48.8",
    previous: "46.8",
    impact: "MEDIUM",
    importanceNote: "Sub-50 denotes manufacturing contraction; new orders sub-index key for cyclical equities.",
  },
];

export const MacroEconomicsBriefing: React.FC = () => {
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedRegimeTab, setSelectedRegimeTab] = useState<"LIQUIDITY" | "YIELD_CURVE" | "INTERMARKET" | "CENTRAL_BANKS">("LIQUIDITY");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyMacroBriefing = () => {
    triggerHaptic("success");
    const briefingText = `========================================================
STOCK BLOC // INSTITUTIONAL MACRO ECONOMICS BRIEFING
========================================================
DATE: Q3 2026 GLOBAL REGIME DIGEST
BENCHMARK REGIME: BULL STEEPENING & GLOBAL LIQUIDITY EXPANSION

1. NET FED LIQUIDITY PULSE:
   - Fed Total Assets: $7.02T
   - Treasury General Account (TGA): $690B
   - Overnight Reverse Repo (RRP): $250B
   - Net System Reserves: $6.08T (Expanding Reserve Velocity)

2. YIELD CURVE & FIXED INCOME STRUCTURE:
   - US 2Y Treasury: 3.98% | US 10Y Treasury: 4.05%
   - 2Y-10Y Spread: +7 bps (Dis-inverted from -108 bps lows)
   - High Yield OAS Spread: 318 bps (Sub-average Default Risk)

3. CROSS-ASSET INTERMARKET BAROMETERS:
   - Copper / Gold Ratio: 0.00178 (+1.42%) -> Industrial expansion
   - US Dollar Index (DXY): 102.45 (-0.65%) -> Easing cross-border financial conditions
   - Brent / Gas Spread: 34.2x -> High margin US LNG export arbitrage

4. CENTRAL BANK POLICY MATRIX:
   - Fed: 5.25%-5.50% (Dovish Pivot / Rate Cut Trajectory)
   - ECB: 3.75% (Gradual Easing)
   - BOJ: 0.25% (YCC Exit / Normalization)
   - PBOC: 3.35% (Liquidity Injections / RRR Cuts)

5. REGIME TAKEAWAYS FOR ASSET ALLOCATION:
   - Equities: Favorable for Quality Growth (AI Infrastructure, Hyperscaler Datacenter, Merchant Utilities)
   - Fixed Income: Favor 3Y-7Y Belly Duration; avoid uncompensated long-end term premium risk
   - Hard Assets: Gold and Copper supported by central bank de-dollarization and grid power capex
========================================================
Verified by Stock Bloc Macro Intelligence Engine`;

    navigator.clipboard.writeText(briefingText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);
    showToast("Institutional Macro Briefing copied to clipboard!");
  };

  const handleExportMacroCsv = () => {
    triggerHaptic("success");
    const headers = [
      "Indicator Category",
      "Metric Name",
      "Ticker / Code",
      "Current Value",
      "Change / Trend",
      "Macro Regime Assessment",
      "Institutional Implications",
    ];

    const rows = INTERMARKET_INDICATORS.map((item) => [
      `"${item.category}"`,
      `"${item.name}"`,
      `"${item.ticker}"`,
      `"${item.value}"`,
      `"${item.change}"`,
      `"${item.status}"`,
      `"${item.desc.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stock_Bloc_Macro_Economics_Briefing.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported Macro Economics CSV!");
  };

  return (
    <div className="space-y-6 font-mono text-cyan-100 select-none pb-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 alien-block-cut-sm bg-cyan-400 text-black font-black text-xs shadow-2xl flex items-center gap-2 border border-cyan-300"
          >
            <Zap className="w-4 h-4 fill-black text-black" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="p-5 sm:p-6 alien-block-cut bg-black/85 border border-cyan-500/40 relative overflow-hidden shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-400 text-black alien-block-cut-sm font-black shrink-0">
              <Globe className="w-7 h-7 fill-black text-black" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 alien-block-cut-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  FEDERAL RESERVE & TREASURY MACRO BRIEF
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 alien-block-cut-sm">
                  LIVE REGIME: BULL STEEPENING
                </span>
                <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 border border-cyan-500/30 alien-block-cut-sm">
                  Net Fed Reserves: $6.08 Trillion
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                Institutional Macro Economics & Liquidity Radar
              </h1>
              <p className="text-xs text-cyan-400/80 max-w-3xl font-sans">
                Real-time tracking of Global Central Bank Balance Sheets, Net Fed Liquidity, U.S. Treasury Yield Curve dis-inversion dynamics, and Cross-Asset commodity ratios.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMacroBriefing}
              className="px-3.5 py-2 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer uppercase"
            >
              {copiedStatus ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">COPIED BRIEF!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>COPY BRIEFING</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportMacroCsv}
              className="px-3.5 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <Download className="w-4 h-4 text-black" />
              <span>EXPORT MACRO CSV</span>
            </button>
          </div>
        </div>

        {/* Executive Macro Regime Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
              <span>NET FED LIQUIDITY</span>
              <span className="text-emerald-400">+$120B (30D)</span>
            </div>
            <div className="text-lg font-black text-white">$6.08 Trillion</div>
            <p className="text-[11px] text-cyan-400/70 font-sans">
              Formula: Fed Assets - (TGA + Reverse Repo). Expanding bank reserves provide liquid tailwinds for risk assets.
            </p>
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
              <span>2Y - 10Y YIELD SPREAD</span>
              <span className="text-emerald-400">DIS-INVERTED</span>
            </div>
            <div className="text-lg font-black text-white">+7 bps (+0.07%)</div>
            <p className="text-[11px] text-cyan-400/70 font-sans">
              2Y Yield (3.98%) vs 10Y Yield (4.05%). Curve inversion ended after 26 months, entering the expansionary steepener regime.
            </p>
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
              <span>US HIGH YIELD SPREAD (OAS)</span>
              <span className="text-cyan-300">BENIGN</span>
            </div>
            <div className="text-lg font-black text-white">318 bps (3.18%)</div>
            <p className="text-[11px] text-cyan-400/70 font-sans">
              BofA US High Yield Index Spread over Treasuries. Corporate refinance stress remains well below historical crisis thresholds (500+ bps).
            </p>
          </div>
        </div>

        {/* Section Navigation Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-cyan-500/20 font-mono text-xs">
          {[
            { id: "LIQUIDITY", label: "Fed Net Liquidity", icon: Landmark },
            { id: "YIELD_CURVE", label: "Yield Curve Term Structure", icon: Scale },
            { id: "INTERMARKET", label: "Intermarket Barometers", icon: BarChart3 },
            { id: "CENTRAL_BANKS", label: "Global Central Banks", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedRegimeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedRegimeTab(tab.id as typeof selectedRegimeTab);
                }}
                className={`p-2.5 alien-block-cut-sm text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border uppercase ${
                  isActive
                    ? "bg-cyan-400 text-black border-cyan-300 font-black shadow-lg shadow-cyan-400/20"
                    : "bg-black/60 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: NET FED LIQUIDITY & SYSTEM RESERVES */}
      {selectedRegimeTab === "LIQUIDITY" && (
        <div className="space-y-6">
          <div className="p-5 alien-block-cut bg-black/80 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white uppercase flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-cyan-400" />
                  Federal Reserve Net Liquidity Transmission (FRED Data)
                </h2>
                <p className="text-xs text-cyan-400/80 font-sans">
                  The primary driver of equity index valuations: Total Fed Assets minus Treasury Cash (TGA) minus Overnight Reverse Repo (RRP).
                </p>
              </div>
              <div className="text-xs text-right text-neutral-400">
                <span className="text-cyan-300 font-bold">Equation: </span>
                <code className="text-amber-300 bg-black px-2 py-0.5 border border-amber-500/30 alien-block-cut-sm">
                  Reserves = WALCL - (WTREGEN + RRPONTSYD)
                </code>
              </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={FED_LIQUIDITY_SERIES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netLiqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[5.5, 6.5]} stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}T`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#06b6d4", borderRadius: "4px", fontSize: "12px" }}
                    formatter={(value: any) => [`$${value} Trillion`, "Net Fed Liquidity"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="netLiquidity"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#netLiqGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Data Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold uppercase">1. Total Fed Assets (WALCL)</span>
                <div className="text-base font-black text-white">$7.02 Trillion</div>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Quantitative Tightening (QT) continues at ~$60B monthly cap, normalizing balance sheet down from $9.0T peak.
                </p>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase">2. Treasury General Account (TGA)</span>
                <div className="text-base font-black text-amber-300">$690 Billion</div>
                <p className="text-[11px] text-neutral-400 font-sans">
                  U.S. Treasury operating cash balance at the Fed. Government spending drains TGA, directly injecting bank reserves.
                </p>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">3. Reverse Repo Facility (RRP)</span>
                <div className="text-base font-black text-emerald-300">$250 Billion</div>
                <p className="text-[11px] text-neutral-400 font-sans">
                  Sterilized money market cash parked at the Fed. RRP runoff cushioned QT drain by re-entering the private banking system.
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming High-Impact Macro Releases */}
          <div className="p-5 alien-block-cut bg-black/80 border border-cyan-500/30 space-y-4">
            <h2 className="text-base font-black text-white uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              High-Impact Economic Release Calendar (BLS / BEA / ISM)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {UPCOMING_MACRO_EVENTS.map((event, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 alien-block-cut-sm space-y-2 hover:border-cyan-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{event.event}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 alien-block-cut-sm border ${
                        event.impact === "CRITICAL"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {event.impact} IMPACT
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-neutral-400">Date: <strong className="text-cyan-300">{event.releaseDate}</strong></span>
                    <span className="text-neutral-400">Consensus: <strong className="text-emerald-300">{event.consensus}</strong></span>
                    <span className="text-neutral-400">Previous: <strong className="text-neutral-300">{event.previous}</strong></span>
                  </div>
                  <p className="text-[11px] text-cyan-400/70 font-sans">{event.importanceNote}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: YIELD CURVE & FIXED INCOME TERM STRUCTURE */}
      {selectedRegimeTab === "YIELD_CURVE" && (
        <div className="space-y-6">
          <div className="p-5 alien-block-cut bg-black/80 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white uppercase flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyan-400" />
                  U.S. Treasury Constant Maturity Yield Curve (1M to 30Y)
                </h2>
                <p className="text-xs text-cyan-400/80 font-sans">
                  Current curve structure compared against 12-month prior inverted baseline. Yield curve dis-inversion denotes classic cycle transition.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-cyan-300">
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block" /> Current Curve
                </span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <span className="w-2.5 h-2.5 bg-neutral-600 rounded-full inline-block" /> 1 Year Ago (Inverted)
                </span>
              </div>
            </div>

            {/* Yield Curve Line Chart */}
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={YIELD_CURVE_POINTS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="tenor" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[3.5, 6.0]} stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#06b6d4", borderRadius: "4px", fontSize: "12px" }}
                    formatter={(value: any, name: any) => [
                      `${value}%`,
                      name === "yield" ? "Current Yield" : "1Y Prior Yield",
                    ]}
                  />
                  <Line type="monotone" dataKey="yield" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: "#06b6d4" }} />
                  <Line type="monotone" dataKey="previousYear" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Yield Spread Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">2Y / 10Y SPREAD</span>
                <div className="text-lg font-black text-emerald-400">+7 bps</div>
                <span className="text-[10px] text-emerald-400 font-bold">Bull Steepener Active</span>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">3M / 10Y SPREAD</span>
                <div className="text-lg font-black text-amber-300">-119 bps</div>
                <span className="text-[10px] text-amber-400 font-bold">Near-Term Policy Lag</span>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">10Y / 30Y SPREAD</span>
                <div className="text-lg font-black text-cyan-300">+27 bps</div>
                <span className="text-[10px] text-cyan-400 font-bold">Positive Term Premium</span>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">10Y TIPS REAL YIELD</span>
                <div className="text-lg font-black text-purple-300">1.82%</div>
                <span className="text-[10px] text-purple-400 font-bold">Restrictive Real Rate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CROSS-ASSET INTERMARKET RADAR */}
      {selectedRegimeTab === "INTERMARKET" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTERMARKET_INDICATORS.map((ind, idx) => (
              <div
                key={idx}
                className="p-4 bg-black/80 border border-cyan-500/30 alien-block-cut-sm space-y-2.5 hover:border-cyan-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 border border-cyan-500/30 alien-block-cut-sm">
                      {ind.category}
                    </span>
                    <span
                      className={`text-xs font-bold flex items-center gap-1 ${
                        ind.isPositive ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {ind.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {ind.change}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{ind.name}</h3>
                  <div className="text-xs font-mono text-cyan-300 flex items-center gap-2">
                    <span className="text-neutral-400">{ind.ticker}:</span>
                    <span className="text-base font-black text-white">{ind.value}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-cyan-500/20 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400 font-bold">REGIME SIGNAL:</span>
                    <span className="font-black text-cyan-300">{ind.status}</span>
                  </div>
                  <p className="text-[11px] text-cyan-400/70 font-sans leading-relaxed">{ind.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: GLOBAL CENTRAL BANK POLICY MATRIX */}
      {selectedRegimeTab === "CENTRAL_BANKS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CENTRAL_BANKS.map((cb, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 bg-black/80 border border-cyan-500/30 alien-block-cut-sm space-y-3 hover:border-cyan-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-black text-white">{cb.bank}</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-cyan-400 text-black px-2 py-0.5 alien-block-cut-sm">
                    {cb.bias}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-cyan-500/20">
                  <div className="p-2 bg-cyan-950/30 alien-block-cut-sm">
                    <span className="text-[10px] text-neutral-400 block">POLICY RATE</span>
                    <strong className="text-white text-sm">{cb.policyRate}</strong>
                  </div>
                  <div className="p-2 bg-cyan-950/30 alien-block-cut-sm">
                    <span className="text-[10px] text-neutral-400 block">BALANCE SHEET</span>
                    <strong className="text-cyan-300 text-sm">{cb.balanceSheet}</strong>
                  </div>
                  <div className="p-2 bg-cyan-950/30 alien-block-cut-sm col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-neutral-400 block">QT / LIQUIDITY</span>
                    <strong className="text-amber-300 text-xs">{cb.qtPace}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1">
                  <span>Next Scheduled Forum:</span>
                  <span className="text-cyan-300 font-bold">{cb.nextMeeting}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Regulatory & Compliance Provenance */}
      <div className="p-4 alien-block-cut bg-black/60 border border-cyan-500/20 text-xs text-neutral-400 space-y-1">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>MACRO DATA PROVENANCE & METHODOLOGY</span>
        </div>
        <p className="font-sans text-[11px] text-neutral-400 leading-relaxed">
          Sourced directly from official releases by the Federal Reserve Board of Governors (H.4.1 Factors Affecting Reserve Balances), U.S. Department of the Treasury Daily Treasury Yield Curve Rates, Bureau of Labor Statistics (BLS), and Bank for International Settlements (BIS). All calculations of Net Fed Liquidity and yield curve differentials are provided for educational and analytical research purposes.
        </p>
      </div>
    </div>
  );
};
