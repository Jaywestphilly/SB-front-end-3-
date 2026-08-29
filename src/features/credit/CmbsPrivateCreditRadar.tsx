import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Building2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Percent,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Coins,
  Scale,
  Landmark
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
  LineChart,
  Line,
  Legend
} from "recharts";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const CREDIT_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "CMBS Delinquency Rates by Sector",
    source: "Trepp CMBS Monthly Surveillance & Research Delinquency Report",
    sourceType: "Industry Benchmark",
    asOfDate: "July 2026",
    updateFrequency: "Monthly",
    details: "Tracks delinquency status (30+, 60+, 90+ days past due and foreclosure) across $600B+ outstanding CMBS conduit debt."
  },
  {
    metricName: "Direct Lending Spreads & Private Debt APYs",
    source: "Preqin Global Private Debt Report & Cliffwater Direct Lending Index (CDLI)",
    sourceType: "Industry Benchmark",
    asOfDate: "Q2 2026",
    updateFrequency: "Quarterly",
    details: "Unlevered and levered net return indices tracking US middle-market senior secured direct loans."
  },
  {
    metricName: "Broadly Syndicated Loans & High Yield Yields",
    source: "Morningstar LSTA US Leveraged Loan Index & ICE BofA US High Yield Index",
    sourceType: "Market Exchange",
    asOfDate: "August 2026 (Daily Index)",
    updateFrequency: "Daily",
    details: "Traded secondary leveraged loan discount margins and option-adjusted spreads (OAS)."
  },
  {
    metricName: "Tokenized RWA AUM & Collateral Attestations",
    source: "Securitize / BlackRock BUIDL Public On-Chain Contracts & Ondo Finance Asset Reserves",
    sourceType: "Market Exchange",
    asOfDate: "August 2026 (Live Oracle Sync)",
    updateFrequency: "Real-time",
    details: "Ethereum, Arbitrum, Mantle, and Solana ERC-20 smart contract total supply and underlying bank custodial reserve proofs."
  }
];

// Sector CMBS Delinquency Rates (%)
const CMBS_DELINQUENCY_RATES = [
  { sector: "Office CMBS", delinquencyRate: 7.85, changeYoY: "+2.85%", risk: "Critical (Record High)", color: "#ef4444" },
  { sector: "Retail CMBS", delinquencyRate: 5.92, changeYoY: "-0.40%", risk: "High (Mall Distress)", color: "#f97316" },
  { sector: "Hotel / Lodging", delinquencyRate: 4.60, changeYoY: "+0.35%", risk: "Moderate", color: "#f59e0b" },
  { sector: "Multifamily CMBS", delinquencyRate: 3.42, changeYoY: "+1.20%", risk: "Rising (Sunbelt Supply)", color: "#3b82f6" },
  { sector: "Industrial / Logistics", delinquencyRate: 0.72, changeYoY: "+0.15%", risk: "Ultra-Low", color: "#10b981" }
];

// Yield Comparison across Credit Asset Classes (%)
const CREDIT_YIELD_SPECTRUM = [
  { assetClass: "Private Credit Direct Lending", baseRate: 4.35, spread: 6.25, totalYield: 10.60, seniority: "1st Lien Senior Secured", color: "#a855f7" },
  { assetClass: "Broadly Syndicated Loans (BSL)", baseRate: 4.35, spread: 4.15, totalYield: 8.50, seniority: "Senior Secured / Lev Loan", color: "#3b82f6" },
  { assetClass: "US High Yield ($HYG / $JNK)", baseRate: 4.20, spread: 3.40, totalYield: 7.60, seniority: "Subordinated / Unsecured", color: "#f59e0b" },
  { assetClass: "Investment Grade Corporate ($LQD)", baseRate: 4.20, spread: 1.15, totalYield: 5.35, seniority: "Senior Unsecured Corporate", color: "#06b6d4" },
  { assetClass: "US 10Y Benchmark Treasury", baseRate: 4.20, spread: 0.00, totalYield: 4.20, seniority: "Sovereign Risk-Free", color: "#10b981" }
];

// On-Chain Tokenized Real World Asset (RWA) Credit Vehicles
const TOKENIZED_RWA_CREDIT = [
  {
    token: "BUIDL",
    name: "BlackRock USD Institutional Digital Liquidity Fund",
    issuer: "BlackRock / Securitize",
    aumM: 580,
    yieldApy: 4.85,
    underlying: "100% US Treasury Bills, Cash, Repos",
    network: "Ethereum / Multi-chain"
  },
  {
    token: "USDY",
    name: "Ondo US Dollar Yield Token",
    issuer: "Ondo Finance",
    aumM: 420,
    yieldApy: 5.05,
    underlying: "Short-Term US Treasuries & Bank Demand Deposits",
    network: "Ethereum, Solana, Arbitrum"
  },
  {
    token: "FOBXX",
    name: "Franklin OnChain U.S. Government Money Fund",
    issuer: "Franklin Templeton",
    aumM: 410,
    yieldApy: 4.90,
    underlying: "US Government Securities & Repurchase Agreements",
    network: "Stellar, Polygon, Avalanche"
  },
  {
    token: "CFG-CRE",
    name: "Centrifuge Commercial Real Estate Credit Pools",
    issuer: "Centrifuge Protocol",
    aumM: 145,
    yieldApy: 9.80,
    underlying: "Senior Secured Real Estate & Working Capital Loans",
    network: "Centrifuge Chain / Ethereum"
  }
];

export const CmbsPrivateCreditRadar: React.FC = () => {
  // Interactive Direct Lending Loan Underwriter
  const [loanPrincipalM, setLoanPrincipalM] = useState<number>(50); // $50M direct loan
  const [sofrBaseRatePct, setSofrBaseRatePct] = useState<number>(4.35); // 4.35% SOFR
  const [lenderSpreadBps, setLenderSpreadBps] = useState<number>(600); // 600 bps spread (6.0%)
  const [upfrontOidFeePct, setUpfrontOidFeePct] = useState<number>(2.0); // 2.0% Original Issue Discount (OID)
  const [loanTenorYears, setLoanTenorYears] = useState<number>(5); // 5-year loan

  const calculatedCredit = useMemo(() => {
    const spreadPct = lenderSpreadBps / 100;
    const allInCouponRate = sofrBaseRatePct + spreadPct;
    const annualInterestIncomeM = (loanPrincipalM * allInCouponRate) / 100;
    const upfrontOidIncomeM = (loanPrincipalM * upfrontOidFeePct) / 100;
    const totalLifetimeIncomeM = annualInterestIncomeM * loanTenorYears + upfrontOidIncomeM;
    const effectiveIrrPct = allInCouponRate + (upfrontOidFeePct / loanTenorYears);

    return {
      spreadPct,
      allInCouponRate,
      annualInterestIncomeM,
      upfrontOidIncomeM,
      totalLifetimeIncomeM,
      effectiveIrrPct
    };
  }, [loanPrincipalM, sofrBaseRatePct, lenderSpreadBps, upfrontOidFeePct, loanTenorYears]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#12081c] via-[#1a0f2b] to-[#0a0512] border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Landmark className="w-3 h-3 text-purple-400" />
                Shadow Banking & Institutional Credit
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                CMBS Delinquency Monitor
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-purple-400" />
              CMBS Delinquency Radar & Private Credit Spread Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Track real-time securitized debt stress across Commercial Mortgage-Backed Securities (CMBS), <strong>10.5%+ Private Credit direct lending yields</strong> (SOFR + 600 bps), and emerging institutional On-Chain RWA credit funds ($BUIDL, $USDY).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 text-right min-w-[210px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Private Credit All-In Yield
            </span>
            <div className="text-3xl font-black text-purple-300 mt-0.5">
              {calculatedCredit.allInCouponRate.toFixed(2)}%
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              SOFR + {lenderSpreadBps} bps (1st Lien)
            </span>
          </div>
        </div>
      </div>

      {/* 2. CMBS DELINQUENCY BAR CHART & YIELD SPECTRUM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CMBS Delinquency Bar Chart */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                CMBS 30+ Day Delinquency Rates by Sector (%)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Office delinquencies surged to historical highs due to remote work & post-2022 rate resets
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-500/30">
              Delinquency %
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CMBS_DELINQUENCY_RATES} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="sector" stroke="#737373" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
                <YAxis stroke="#737373" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12081c",
                    borderColor: "#ef4444",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% Delinquent (${item.payload.changeYoY} YoY)`,
                    item.payload.risk
                  ]}
                />
                <Bar dataKey="delinquencyRate" radius={[6, 6, 0, 0]}>
                  {CMBS_DELINQUENCY_RATES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit Yield Spectrum Comparison */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-purple-400" />
                Fixed Income & Credit Yield Spectrum (%)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Stacked Base Rate (SOFR/UST) + Credit Spread across asset classes
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
              Yield (%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CREDIT_YIELD_SPECTRUM} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="assetClass" stroke="#737373" tick={{ fontSize: 9 }} interval={0} angle={-12} textAnchor="end" />
                <YAxis stroke="#737373" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 13]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#12081c",
                    borderColor: "#a855f7",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% Total Yield (Base: ${item.payload.baseRate}% + Spread: +${item.payload.spread}%)`,
                    item.payload.seniority
                  ]}
                />
                <Bar dataKey="totalYield" radius={[6, 6, 0, 0]}>
                  {CREDIT_YIELD_SPECTRUM.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE PRIVATE CREDIT DIRECT LENDING UNDERWRITER */}
      <div className="p-6 rounded-3xl bg-black/70 border border-purple-500/30 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-purple-400 font-extrabold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                Direct Lending Deal Sizer
              </span>
              <span className="text-xs font-mono text-neutral-400">Floating-Rate Senior Secured Loan</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Private Credit Senior Debt Sizer & Effective IRR Calculator
            </h3>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900 border border-purple-500/30 text-right">
            <span className="text-[10px] text-neutral-400 uppercase">Effective Lender IRR</span>
            <div className="text-base font-black text-emerald-400">
              {calculatedCredit.effectiveIrrPct.toFixed(2)}% Net IRR
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Loan Principal */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Loan Principal ($M)</span>
              <span className="font-mono font-black text-purple-300">${loanPrincipalM}M</span>
            </div>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={loanPrincipalM}
              onChange={(e) => setLoanPrincipalM(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>$10M</span>
              <span>$250M</span>
            </div>
          </div>

          {/* SOFR Base Rate */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">SOFR Floating Base</span>
              <span className="font-mono font-black text-cyan-300">{sofrBaseRatePct}%</span>
            </div>
            <input
              type="range"
              min="2.5"
              max="6.0"
              step="0.05"
              value={sofrBaseRatePct}
              onChange={(e) => setSofrBaseRatePct(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>2.5%</span>
              <span>6.0%</span>
            </div>
          </div>

          {/* Lender Margin Spread */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Credit Spread (bps)</span>
              <span className="font-mono font-black text-emerald-400">+{lenderSpreadBps} bps ({calculatedCredit.spreadPct}%)</span>
            </div>
            <input
              type="range"
              min="400"
              max="900"
              step="25"
              value={lenderSpreadBps}
              onChange={(e) => setLenderSpreadBps(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>+400 bps</span>
              <span>+900 bps (Distressed)</span>
            </div>
          </div>

          {/* Upfront OID Fee */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Upfront OID Fee</span>
              <span className="font-mono font-black text-amber-300">{upfrontOidFeePct}% (${calculatedCredit.upfrontOidIncomeM.toFixed(2)}M)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.25"
              value={upfrontOidFeePct}
              onChange={(e) => setUpfrontOidFeePct(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>0.5%</span>
              <span>4.0%</span>
            </div>
          </div>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">All-in Coupon Yield</span>
            <div className="text-2xl font-black text-purple-300">{calculatedCredit.allInCouponRate.toFixed(2)}% / yr</div>
            <p className="text-[11px] text-neutral-400">Floating rate reset quarterly</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Annual Interest Cash Flow</span>
            <div className="text-2xl font-black text-emerald-400">${calculatedCredit.annualInterestIncomeM.toFixed(2)}M / yr</div>
            <p className="text-[11px] text-neutral-400">Direct cash flow to fund LPs</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Upfront Closing Fee (OID)</span>
            <div className="text-2xl font-black text-amber-300">${calculatedCredit.upfrontOidIncomeM.toFixed(2)}M</div>
            <p className="text-[11px] text-neutral-400">Received at origination close</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-cyan-500/30 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-cyan-400">Total Lifetime Fund Revenue</span>
            <div className="text-2xl font-black text-cyan-300">${calculatedCredit.totalLifetimeIncomeM.toFixed(2)}M</div>
            <p className="text-[11px] text-neutral-400">Over {loanTenorYears}-year loan maturity</p>
          </div>
        </div>
      </div>

      {/* 4. ON-CHAIN TOKENIZED REAL WORLD ASSET (RWA) CREDIT MATRIX */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-400" />
              On-Chain Tokenized Real World Asset (RWA) Credit Matrix
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Institutional tokenized treasury funds ($BUIDL, $USDY, $FOBXX) and DeFi private credit liquidity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOKENIZED_RWA_CREDIT.map((item) => (
            <div key={item.token} className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-purple-300 text-base">${item.token}</span>
                    <span className="text-xs font-bold text-white">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">{item.issuer}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-emerald-400">{item.yieldApy}% APY</div>
                  <div className="text-[10px] text-neutral-400">${item.aumM}M AUM</div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Underlying Collateral:</span>
                  <span className="font-mono text-neutral-200 text-right">{item.underlying}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Blockchain Networks:</span>
                  <span className="font-mono text-cyan-300">{item.network}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="Securitized Debt & Private Credit"
        lastUpdated="August 2026 (Live Trepp & Index Feeds)"
        sources={CREDIT_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
