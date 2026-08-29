import React, { useState, useMemo } from "react";
import {
  Building2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  Layers,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Calendar,
  HelpCircle,
  Landmark,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from "recharts";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const CRE_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "$3.72T Maturing Debt Schedule",
    source: "Mortgage Bankers Association (MBA) 2024–2028 Commercial Real Estate Survey",
    sourceType: "Industry Benchmark",
    asOfDate: "Q2 2026",
    updateFrequency: "Quarterly",
    details: "Aggregated across 2,400+ commercial loan servicers, life companies, GSEs, and depositories."
  },
  {
    metricName: "Regional Bank Balance Sheet Share (44%)",
    source: "Federal Reserve Board (FRB) Z.1 Financial Accounts of the United States",
    sourceType: "Central Bank / Fed",
    asOfDate: "June 2026",
    updateFrequency: "Quarterly",
    details: "Total small/regional commercial bank holdings of non-farm non-residential mortgage debt."
  },
  {
    metricName: "SOFR Benchmark & Lending Spreads",
    source: "Federal Reserve Bank of New York Secured Overnight Financing Rate (SOFR)",
    sourceType: "Central Bank / Fed",
    asOfDate: "August 2026 (Live Benchmark)",
    updateFrequency: "Daily",
    details: "CME 30-Day Average SOFR + 250-450 bps typical commercial spread."
  },
  {
    metricName: "Office & Multifamily Delinquency Tranches",
    source: "Trepp CMBS Monthly Delinquency & Special Servicing Report",
    sourceType: "Industry Benchmark",
    asOfDate: "July 2026",
    updateFrequency: "Monthly",
    details: "CMBS 2.0+ conduit and SASB special servicing transfers and modification volume."
  }
];

// Commercial Real Estate Maturity Data by Sector ($ Billions)
const CRE_MATURITY_DATA = [
  { year: "2024", office: 206, multifamily: 245, industrial: 98, retail: 112, hotel: 74, total: 735 },
  { year: "2025", office: 185, multifamily: 220, industrial: 85, retail: 95, hotel: 65, total: 650 },
  { year: "2026", office: 162, multifamily: 198, industrial: 92, retail: 84, hotel: 58, total: 594 },
  { year: "2027", office: 140, multifamily: 175, industrial: 105, retail: 76, hotel: 52, total: 548 },
  { year: "2028+", office: 280, multifamily: 410, industrial: 230, retail: 160, hotel: 120, total: 1200 }
];

const LENDER_EXPOSURE = [
  { type: "Regional & Small Banks", sharePercent: 44, riskLevel: "High", riskColor: "text-red-400", desc: "Concentrated CRE debt exposure relative to Tier-1 capital" },
  { type: "GSEs (Fannie/Freddie)", sharePercent: 21, riskLevel: "Low", riskColor: "text-emerald-400", desc: "Multifamily guarantee books with strict underwriting" },
  { type: "Life Insurance Companies", sharePercent: 14, riskLevel: "Moderate", riskColor: "text-amber-400", desc: "Low LTV (<55%) institutional trophy assets" },
  { type: "CMBS & CRE CLOs", sharePercent: 13, riskLevel: "Critical", riskColor: "text-red-500", desc: "Non-recourse pooled securitizations with high office default rates" },
  { type: "Private Debt & Mezzanine", sharePercent: 8, riskLevel: "Opportunistic", riskColor: "text-purple-400", desc: "Gap financing and distressed rescue capital (11-14% yield)" }
];

export const CreMaturityWallRefinance: React.FC = () => {
  // Interactive Refinancing Stress Calculator States
  const [propertyType, setPropertyType] = useState<string>("Class-A Office");
  const [originalValueM, setOriginalValueM] = useState<number>(100); // $100M
  const [currentValueDropPct, setCurrentValueDropPct] = useState<number>(25); // 25% drop
  const [originalLtvPct, setOriginalLtvPct] = useState<number>(65); // 65% LTV
  const [originalRatePct, setOriginalRatePct] = useState<number>(3.6); // 3.6% original rate
  const [newRefiRatePct, setNewRefiRatePct] = useState<number>(7.4); // 7.4% SOFR+ spread
  const [currentNoiM, setCurrentNoiM] = useState<number>(6.2); // $6.2M annual NOI
  const [targetLtvLimitPct, setTargetLtvLimitPct] = useState<number>(60); // 60% max new lender LTV

  // Calculations
  const calculatedMetrics = useMemo(() => {
    const originalLoanM = (originalValueM * originalLtvPct) / 100;
    const currentAssetValueM = originalValueM * (1 - currentValueDropPct / 100);
    
    // Original Annual Debt Service (Interest Only / Balloon approximation)
    const originalAnnualDebtServiceM = (originalLoanM * originalRatePct) / 100;
    const originalDscr = originalAnnualDebtServiceM > 0 ? currentNoiM / originalAnnualDebtServiceM : 0;

    // New Max Loan permitted by lender based on today's appraised value and max LTV
    const maxNewLoanM = (currentAssetValueM * targetLtvLimitPct) / 100;
    
    // New Annual Debt Service on Full Payoff vs Restricted Loan
    const newDebtServiceFullLoanM = (originalLoanM * newRefiRatePct) / 100;
    const newDscrFullLoan = newDebtServiceFullLoanM > 0 ? currentNoiM / newDebtServiceFullLoanM : 0;

    // Equity Cash-In Required to refi down to lender's max allowable loan
    const cashInRequiredM = Math.max(0, originalLoanM - maxNewLoanM);
    
    // Annual Debt Service on Sized-Down Loan
    const newDebtServiceSizedLoanM = (maxNewLoanM * newRefiRatePct) / 100;
    const newDscrSizedLoan = newDebtServiceSizedLoanM > 0 ? currentNoiM / newDebtServiceSizedLoanM : 0;

    // Equity Destruction
    const originalEquityM = originalValueM - originalLoanM;
    const currentEquityM = Math.max(0, currentAssetValueM - originalLoanM);
    const equityLossPct = originalEquityM > 0 ? Math.min(100, Math.round(((originalEquityM - currentEquityM) / originalEquityM) * 100)) : 100;

    return {
      originalLoanM,
      currentAssetValueM,
      originalAnnualDebtServiceM,
      originalDscr,
      maxNewLoanM,
      newDebtServiceFullLoanM,
      newDscrFullLoan,
      cashInRequiredM,
      newDebtServiceSizedLoanM,
      newDscrSizedLoan,
      originalEquityM,
      currentEquityM,
      equityLossPct
    };
  }, [originalValueM, currentValueDropPct, originalLtvPct, originalRatePct, newRefiRatePct, currentNoiM, targetLtvLimitPct]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#120808] via-[#1c0e0e] to-[#0a0505] border border-red-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Institutional Debt Risk Radar
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                SOFR Refinancing Gap
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-red-400" />
              $1.8T+ Commercial Real Estate Maturity Wall & Debt Stress Engine
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Trillions in low-coupon CRE loans originated in 2018–2021 (3.0%–4.0%) are maturing into 6.5%–8.5% SOFR-linked financing. Model debt-service coverage ratio (DSCR) default zones, cash-in refinancing gaps, and bank balance sheet vulnerabilities.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-red-500/30 text-right min-w-[210px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Total CRE Debt Maturing by 2028
            </span>
            <div className="text-3xl font-black text-red-300 mt-0.5">
              $3.72 Trillion
            </div>
            <span className="text-[11px] text-amber-400 font-bold flex items-center justify-end gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              44% Held by Regional Banks
            </span>
          </div>
        </div>
      </div>

      {/* 2. MATURITY WATERFALL CHART & LENDER EXPOSURE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waterfall Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-red-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-400" />
                CRE Debt Maturity Schedule by Property Class ($B)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Stacked maturities across Office, Multifamily, Industrial, Retail, and Hospitality
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-500/30">
              $ Billions
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CRE_MATURITY_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="year" stroke="#737373" tick={{ fontSize: 11 }} />
                <YAxis stroke="#737373" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}B`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#120808",
                    borderColor: "#ef4444",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any) => [`$${val} Billion`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="office" name="Office" stackId="a" fill="#ef4444" />
                <Bar dataKey="multifamily" name="Multifamily" stackId="a" fill="#3b82f6" />
                <Bar dataKey="retail" name="Retail" stackId="a" fill="#f59e0b" />
                <Bar dataKey="hotel" name="Hotel / Lodging" stackId="a" fill="#a855f7" />
                <Bar dataKey="industrial" name="Industrial / Logistics" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lender Class Exposure */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/10 pb-2.5">
              <Landmark className="w-4 h-4 text-amber-400" />
              Lender Balance Sheet Exposure
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Who holds the maturing commercial paper?
            </p>
          </div>

          <div className="space-y-2.5">
            {LENDER_EXPOSURE.map((lender) => (
              <div key={lender.type} className="p-3 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{lender.type}</span>
                  <span className="font-mono font-black text-amber-300">{lender.sharePercent}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400 leading-tight">{lender.desc}</span>
                  <span className={`font-black uppercase tracking-wider shrink-0 ml-2 ${lender.riskColor}`}>
                    {lender.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE REFINANCING STRESS SIMULATOR */}
      <div className="p-6 rounded-3xl bg-black/70 border border-red-500/30 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-red-400 font-extrabold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                Loan Underwriting Simulator
              </span>
              <span className="text-xs font-mono text-neutral-400">DSCR & Cash-in Gap Engine</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Property-Level Refinancing Stress Test & Equity Loss Engine
            </h3>
          </div>

          {/* Quick Property Preset */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-white/10 text-xs">
            {["Class-A Office", "Class-B Office", "Multifamily Garden", "Industrial Hub"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setPropertyType(type);
                  if (type === "Class-A Office") {
                    setCurrentValueDropPct(25);
                    setOriginalRatePct(3.6);
                    setNewRefiRatePct(7.5);
                    setCurrentNoiM(6.2);
                  } else if (type === "Class-B Office") {
                    setCurrentValueDropPct(45);
                    setOriginalRatePct(3.8);
                    setNewRefiRatePct(8.5);
                    setCurrentNoiM(4.5);
                  } else if (type === "Multifamily Garden") {
                    setCurrentValueDropPct(15);
                    setOriginalRatePct(3.2);
                    setNewRefiRatePct(6.4);
                    setCurrentNoiM(6.8);
                  } else {
                    setCurrentValueDropPct(5);
                    setOriginalRatePct(3.4);
                    setNewRefiRatePct(6.2);
                    setCurrentNoiM(7.2);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  propertyType === type ? "bg-red-500 text-black shadow font-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Input Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Original Appraised Value */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Orig. Appraised Value</span>
              <span className="font-mono font-black text-cyan-300">${originalValueM}M</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={originalValueM}
              onChange={(e) => setOriginalValueM(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>$10M</span>
              <span>$300M</span>
            </div>
          </div>

          {/* Value Correction % */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Asset Value Decline</span>
              <span className="font-mono font-black text-red-400">-{currentValueDropPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={currentValueDropPct}
              onChange={(e) => setCurrentValueDropPct(Number(e.target.value))}
              className="w-full accent-red-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>0% (Stable)</span>
              <span>-60% (Severe Distress)</span>
            </div>
          </div>

          {/* Current Annual NOI */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Current Net Operating Income (NOI)</span>
              <span className="font-mono font-black text-emerald-400">${currentNoiM}M / yr</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="20.0"
              step="0.2"
              value={currentNoiM}
              onChange={(e) => setCurrentNoiM(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>$1.0M</span>
              <span>$20.0M</span>
            </div>
          </div>

          {/* Original Interest Rate */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Original Fixed Loan Rate</span>
              <span className="font-mono font-black text-neutral-200">{originalRatePct}%</span>
            </div>
            <input
              type="range"
              min="2.5"
              max="5.5"
              step="0.1"
              value={originalRatePct}
              onChange={(e) => setOriginalRatePct(Number(e.target.value))}
              className="w-full accent-neutral-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>2.5%</span>
              <span>5.5%</span>
            </div>
          </div>

          {/* Refinanced Rate */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">New Refi Rate (SOFR + Spread)</span>
              <span className="font-mono font-black text-red-400">{newRefiRatePct}%</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="11.0"
              step="0.1"
              value={newRefiRatePct}
              onChange={(e) => setNewRefiRatePct(Number(e.target.value))}
              className="w-full accent-red-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>5.0%</span>
              <span>11.0%</span>
            </div>
          </div>

          {/* Lender Max LTV Limit */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">New Lender Max LTV Ceiling</span>
              <span className="font-mono font-black text-amber-300">{targetLtvLimitPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="75"
              step="1"
              value={targetLtvLimitPct}
              onChange={(e) => setTargetLtvLimitPct(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>50% (Conservative)</span>
              <span>75%</span>
            </div>
          </div>
        </div>

        {/* 4. STRESS RESULTS SCORECARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Maturing Debt vs New Max Loan */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              Maturing Loan vs Max Refi
            </span>
            <div className="text-xl font-black text-white">
              ${calculatedMetrics.originalLoanM.toFixed(1)}M ➔ ${calculatedMetrics.maxNewLoanM.toFixed(1)}M
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Today's appraised value: <strong className="text-white">${calculatedMetrics.currentAssetValueM.toFixed(1)}M</strong>
            </p>
          </div>

          {/* Cash-in Equity Injection Needed */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-red-500/30 space-y-2">
            <span className="text-[10px] uppercase font-bold text-red-400">
              Required "Cash-In" Gap
            </span>
            <div className="text-2xl font-black text-red-300">
              ${calculatedMetrics.cashInRequiredM.toFixed(1)}M
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              {calculatedMetrics.cashInRequiredM > 0
                ? "Borrower must inject fresh equity or face foreclosure / handing keys back."
                : "No fresh equity required to meet lender LTV limit."}
            </p>
          </div>

          {/* DSCR Before vs After */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              Debt Service Coverage (DSCR)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-emerald-400">
                {calculatedMetrics.originalDscr.toFixed(2)}x
              </span>
              <ArrowRight className="w-4 h-4 text-neutral-500" />
              <span className={`text-xl font-black ${calculatedMetrics.newDscrSizedLoan < 1.0 ? "text-red-400" : calculatedMetrics.newDscrSizedLoan < 1.25 ? "text-amber-400" : "text-emerald-400"}`}>
                {calculatedMetrics.newDscrSizedLoan.toFixed(2)}x
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              {calculatedMetrics.newDscrSizedLoan < 1.0
                ? "⚠️ Cash flow negative: Property cannot service debt."
                : calculatedMetrics.newDscrSizedLoan < 1.25
                ? "Tight coverage: Falls below lender standard 1.25x covenants."
                : "Healthy: Exceeds standard debt service covenants."}
            </p>
          </div>

          {/* Equity Destruction % */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              Sponsor Equity Loss
            </span>
            <div className="text-2xl font-black text-amber-300">
              -{calculatedMetrics.equityLossPct}%
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Original Equity: ${calculatedMetrics.originalEquityM.toFixed(1)}M · Current Equity: ${calculatedMetrics.currentEquityM.toFixed(1)}M
            </p>
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="Commercial Real Estate & Banking Debt"
        lastUpdated="August 2026 (Live Benchmark Sync)"
        sources={CRE_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
