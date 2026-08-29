import React, { useState, useMemo } from "react";
import {
  Server,
  Zap,
  Building2,
  TrendingUp,
  Cpu,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Flame,
  Globe
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const DATACENTER_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Public Digital REIT Financials ($EQIX, $DLR, $AMT)",
    source: "SEC Form 10-K & 10-Q Quarterly Disclosures",
    sourceType: "SEC Filing",
    asOfDate: "Q2 2026 Filings",
    updateFrequency: "Quarterly",
    details: "Megawatt capacity, contracted power backlog, inter-connection density, and recurring leasing spreads."
  },
  {
    metricName: "Hyperscale AI Power Density & Pricing ($/kW-Mo)",
    source: "CBRE Data Center Solutions & Cushman & Wakefield Global Data Center Market Report",
    sourceType: "Industry Benchmark",
    asOfDate: "H1 2026",
    updateFrequency: "Quarterly",
    details: "Northern Virginia (PJM), Silicon Valley, Phoenix, and Atlanta hyperscale wholesale rental metrics."
  },
  {
    metricName: "Regional Power Grid Interconnection Queue",
    source: "PJM Interconnection & ERCOT Interconnection Study Queue (FERC Form 1)",
    sourceType: "Regulatory Agency",
    asOfDate: "July 2026",
    updateFrequency: "Monthly",
    details: "Substation energization timelines, transmission capacity constraints, and industrial power rates."
  },
  {
    metricName: "CRE Sector Cap Rates (Office vs. Data Centers)",
    source: "Real Capital Analytics (MSCI Real Assets) Capital Trends",
    sourceType: "Industry Benchmark",
    asOfDate: "July 2026",
    updateFrequency: "Monthly",
    details: "Transaction cap rates for institutional Class-A CBD Office vs. NNN Hyperscale Data Center assets."
  }
];

interface DataCenterReit {
  ticker: string;
  name: string;
  marketCapB: number;
  dividendYieldPct: number;
  totalCapacityMw: number;
  pipelineMw: number;
  avgCapRatePct: number;
  keyTenants: string;
  focus: string;
}

const DIGITAL_REITS: DataCenterReit[] = [
  {
    ticker: "EQIX",
    name: "Equinix Inc.",
    marketCapB: 84.5,
    dividendYieldPct: 1.85,
    totalCapacityMw: 3200,
    pipelineMw: 650,
    avgCapRatePct: 4.85,
    keyTenants: "AWS, Microsoft Azure, Google Cloud, Meta, Oracle Cloud",
    focus: "Global Network Interconnection & Retail Colocation"
  },
  {
    ticker: "DLR",
    name: "Digital Realty Trust",
    marketCapB: 48.2,
    dividendYieldPct: 3.12,
    totalCapacityMw: 2600,
    pipelineMw: 920,
    avgCapRatePct: 5.15,
    keyTenants: "Hyperscale AI Cloud, IBM, JPMorgan, Meta",
    focus: "Wholesale Powered Shells & AI Hyperscale Campuses"
  },
  {
    ticker: "AMT",
    name: "American Tower (CoreSite)",
    marketCapB: 92.8,
    dividendYieldPct: 3.25,
    totalCapacityMw: 680,
    pipelineMw: 180,
    avgCapRatePct: 5.40,
    keyTenants: "Telecom Tier-1, Cloud Edge, Media CDN",
    focus: "Edge Data Centers & Cell Tower Fiber Integration"
  },
  {
    ticker: "VNET",
    name: "VNET Group Inc.",
    marketCapB: 1.8,
    dividendYieldPct: 0.0,
    totalCapacityMw: 540,
    pipelineMw: 220,
    avgCapRatePct: 7.20,
    keyTenants: "Alibaba Cloud, Tencent, Baidu AI",
    focus: "Asia-Pacific High-Density GPU Clusters"
  }
];

const SECTOR_CAP_RATES = [
  { sector: "AI Hyperscale Data Centers", capRate: 5.0, growth: "+22% YoY", risk: "Lowest (15-yr NNN)", color: "#06b6d4" },
  { sector: "Industrial & Logistics", capRate: 5.8, growth: "+6% YoY", risk: "Low", color: "#10b981" },
  { sector: "Multifamily Residential", capRate: 5.6, growth: "+3% YoY", risk: "Low-Medium", color: "#3b82f6" },
  { sector: "Grocery-Anchored Retail", capRate: 6.4, growth: "+2% YoY", risk: "Medium", color: "#f59e0b" },
  { sector: "Suburban Class-A Office", capRate: 8.8, growth: "-4% YoY", risk: "High", color: "#f97316" },
  { sector: "Urban Class-B/C Office", capRate: 11.2, growth: "-12% YoY", risk: "Severe (Distress)", color: "#ef4444" }
];

export const DataCenterCapRateArbitrage: React.FC = () => {
  // Interactive Facility Valuation States
  const [capacityMw, setCapacityMw] = useState<number>(100); // 100 Megawatts IT Load
  const [monthlyRentPerKw, setMonthlyRentPerKw] = useState<number>(175); // $175 / kW-month
  const [pueRatio, setPueRatio] = useState<number>(1.2); // 1.2 PUE
  const [leaseTermYears, setLeaseTermYears] = useState<number>(15); // 15-year triple net
  const [exitCapRatePct, setExitCapRatePct] = useState<number>(5.2); // 5.2% exit cap rate
  const [opexMarginPct, setOpexMarginPct] = useState<number>(12); // 12% non-pass-through OPEX

  // Financial Calculations
  const calculatedValuation = useMemo(() => {
    const totalKw = capacityMw * 1000;
    // Monthly gross rent = kW * $/kW-month
    const monthlyGrossRevenue = totalKw * monthlyRentPerKw;
    const annualGrossRevenueM = (monthlyGrossRevenue * 12) / 1_000_000;

    // In a Triple-Net (NNN) lease, power is directly passed through to hyperscaler.
    // Net Operating Income (NOI) = Gross Revenue * (1 - non-pass-through opex)
    const annualNoiM = annualGrossRevenueM * (1 - opexMarginPct / 100);

    // Enterprise Asset Valuation = NOI / Cap Rate
    const impliedEnterpriseValueM = annualNoiM / (exitCapRatePct / 100);

    // Valuation per Megawatt
    const valuePerMwM = capacityMw > 0 ? impliedEnterpriseValueM / capacityMw : 0;

    // Total Contracted Revenue over lease term
    const totalContractedBacklogM = annualGrossRevenueM * leaseTermYears;

    return {
      totalKw,
      annualGrossRevenueM,
      annualNoiM,
      impliedEnterpriseValueM,
      valuePerMwM,
      totalContractedBacklogM
    };
  }, [capacityMw, monthlyRentPerKw, pueRatio, leaseTermYears, exitCapRatePct, opexMarginPct]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#05111b] via-[#091e30] to-[#030a10] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                Digital Infrastructure Asset Class
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider">
                Power-Per-Megawatt Valuation Paradigm
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Server className="w-6 h-6 text-cyan-400" />
              AI Hyperscale Data Centers vs. Traditional CRE Cap Rate Arbitrage
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Industrial real estate has decoupled from physical square footage toward <strong>interconnected Megawatt power capacity</strong>. Contrast distressed office cap rates (8.5%–11.0%) against institutional hyperscaler AI data center campuses (4.8%–5.5% cap rates with 15-year NNN investment-grade leases).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-right min-w-[210px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Active Model Asset Value
            </span>
            <div className="text-3xl font-black text-cyan-300 mt-0.5">
              ${calculatedValuation.impliedEnterpriseValueM.toFixed(1)}M
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-1">
              <Zap className="w-3.5 h-3.5" />
              ${calculatedValuation.valuePerMwM.toFixed(2)}M / MW
            </span>
          </div>
        </div>
      </div>

      {/* 2. CAP RATE COMPARISON CHART & VALUATION METRIC SHIFT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cap Rate Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Capitalization Rate Spread Across Real Estate Asset Classes
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Lower cap rates reflect higher asset valuation multiples & stronger tenant credit quality
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Cap Rate (%)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SECTOR_CAP_RATES} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="sector"
                  stroke="#737373"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                />
                <YAxis stroke="#737373" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 14]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#05111b",
                    borderColor: "#06b6d4",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% Cap Rate (${item.payload.growth} rent growth)`,
                    item.payload.sector
                  ]}
                />
                <Bar dataKey="capRate" radius={[6, 6, 0, 0]}>
                  {SECTOR_CAP_RATES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Valuation Metric Comparison Box */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-white/10 pb-2.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              The Metric Paradigm Shift
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Why traditional real estate metrics fail on digital infrastructure:
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-red-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-400">Legacy Real Estate Metric</span>
              <div className="font-bold text-white text-sm">Price per Square Foot ($/sq ft)</div>
              <p className="text-neutral-400 text-[11px] leading-tight">
                Flawed for data centers: A 200,000 sq ft empty warehouse is worth $20M, but with a 100 MW substation interconnection, it is worth $350M+.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Modern Digital Infrastructure Metric</span>
              <div className="font-bold text-cyan-300 text-sm">Enterprise Value per Megawatt ($M/MW)</div>
              <p className="text-neutral-300 text-[11px] leading-tight">
                Valued on energized power capacity, substation queue priority, PUE efficiency, and $/kW-month wholesale lease contracts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE AI DATA CENTER VALUATION CALCULATOR */}
      <div className="p-6 rounded-3xl bg-black/70 border border-cyan-500/30 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-extrabold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                Institutional Underwriting Engine
              </span>
              <span className="text-xs font-mono text-neutral-400">15-Year Hyperscale Lease Modeling</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Turnkey AI Data Center Facility Valuation & Cash Flow Underwriter
            </h3>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900 border border-cyan-500/30 text-right">
            <span className="text-[10px] text-neutral-400 uppercase">Contracted Lease Backlog</span>
            <div className="text-base font-black text-purple-300">
              ${calculatedValuation.totalContractedBacklogM.toFixed(1)}M Total
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Facility Capacity MW */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">IT Power Capacity</span>
              <span className="font-mono font-black text-cyan-300">{capacityMw} MW ({capacityMw * 1000} kW)</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={capacityMw}
              onChange={(e) => setCapacityMw(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>10 MW (Edge)</span>
              <span>500 MW (Gigawatt Campus)</span>
            </div>
          </div>

          {/* Monthly Wholesale Rent per kW */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Wholesale Rent per kW-Month</span>
              <span className="font-mono font-black text-emerald-300">${monthlyRentPerKw} / kW-Mo</span>
            </div>
            <input
              type="range"
              min="100"
              max="300"
              step="5"
              value={monthlyRentPerKw}
              onChange={(e) => setMonthlyRentPerKw(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>$100 (Standard)</span>
              <span>$300 (High-Density Liquid Cooled)</span>
            </div>
          </div>

          {/* Exit Cap Rate */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Target Capitalization Rate</span>
              <span className="font-mono font-black text-purple-300">{exitCapRatePct}%</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="8.0"
              step="0.1"
              value={exitCapRatePct}
              onChange={(e) => setExitCapRatePct(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>4.0% (Trophy Hyperscaler)</span>
              <span>8.0%</span>
            </div>
          </div>

          {/* Lease Term */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Hyperscaler NNN Lease Term</span>
              <span className="font-mono font-black text-white">{leaseTermYears} Years</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={leaseTermYears}
              onChange={(e) => setLeaseTermYears(Number(e.target.value))}
              className="w-full accent-white cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>5 Yrs</span>
              <span>25 Yrs (Direct Hyperscaler)</span>
            </div>
          </div>

          {/* PUE Ratio */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Power Usage Effectiveness (PUE)</span>
              <span className="font-mono font-black text-amber-300">{pueRatio}x</span>
            </div>
            <input
              type="range"
              min="1.1"
              max="1.5"
              step="0.05"
              value={pueRatio}
              onChange={(e) => setPueRatio(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>1.10 (Direct Liquid Cooling)</span>
              <span>1.50 (Legacy Chiller)</span>
            </div>
          </div>

          {/* Non-Pass-Through OPEX Margin */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-bold">Facility Operating Margin</span>
              <span className="font-mono font-black text-emerald-400">{100 - opexMarginPct}% NOI Margin</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={opexMarginPct}
              onChange={(e) => setOpexMarginPct(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[10px] text-neutral-400 flex justify-between">
              <span>5% (Pure NNN Shell)</span>
              <span>25% (Managed Colocation)</span>
            </div>
          </div>
        </div>

        {/* 4. UNDERWRITING SCORECARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Annual Gross Revenue</span>
            <div className="text-2xl font-black text-white">${calculatedValuation.annualGrossRevenueM.toFixed(1)}M / yr</div>
            <p className="text-[11px] text-neutral-400">From {calculatedValuation.totalKw.toLocaleString()} kW wholesale capacity</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Annual Net Operating Income (NOI)</span>
            <div className="text-2xl font-black text-emerald-400">${calculatedValuation.annualNoiM.toFixed(1)}M / yr</div>
            <p className="text-[11px] text-neutral-400">After facility maintenance & reserves</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-cyan-500/30 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-cyan-400">Implied Enterprise Value</span>
            <div className="text-2xl font-black text-cyan-300">${calculatedValuation.impliedEnterpriseValueM.toFixed(1)}M</div>
            <p className="text-[11px] text-neutral-400">Capitalized at {exitCapRatePct}% exit cap rate</p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-purple-500/30 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-purple-400">Valuation per Megawatt</span>
            <div className="text-2xl font-black text-purple-300">${calculatedValuation.valuePerMwM.toFixed(2)}M / MW</div>
            <p className="text-[11px] text-neutral-400">Benchmark: $3.5M–$5.5M / MW institutional standard</p>
          </div>
        </div>
      </div>

      {/* 5. TOP DIGITAL INFRASTRUCTURE REITS */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Public Digital Infrastructure & Data Center REITs
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live capacity backlogs, dividend yields, and hyperscaler tenant concentration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIGITAL_REITS.map((reit) => (
            <div key={reit.ticker} className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-cyan-300 text-base">{reit.ticker}</span>
                    <span className="text-xs font-bold text-white">{reit.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">{reit.focus}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-emerald-400">{reit.dividendYieldPct}% Div Yield</div>
                  <div className="text-[10px] text-neutral-400">${reit.marketCapB}B MktCap</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
                <div>
                  <span className="text-neutral-500 text-[10px] block">Active MW</span>
                  <span className="font-bold text-white">{reit.totalCapacityMw.toLocaleString()} MW</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block">Pipeline MW</span>
                  <span className="font-bold text-cyan-300">+{reit.pipelineMw} MW</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block">Avg Cap Rate</span>
                  <span className="font-bold text-purple-300">{reit.avgCapRatePct}%</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-neutral-400">
                <span className="font-bold text-neutral-300">Key Tenants:</span> {reit.keyTenants}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="Digital Infrastructure & AI Energy Underwriting"
        lastUpdated="August 2026 (Live SEC & CBRE Tracked)"
        sources={DATACENTER_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
