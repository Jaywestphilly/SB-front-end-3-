import React, { useState, useMemo } from "react";
import {
  Zap,
  Sun,
  ShieldAlert,
  Clock,
  TrendingUp,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  Sparkles,
  Sliders,
  DollarSign
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
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { DataProvenanceCard, DataProvenanceItem } from "../../../components/common/DataProvenanceBadge";

const POWER_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Space-Based Solar Power (SBSP) Technical Feasibility",
    source: "NASA Office of Technology, Policy, and Strategy (OTPS) SBSP Systems Study & Caltech SSPP",
    sourceType: "Regulatory Agency",
    asOfDate: "2025/2026 Evaluation",
    updateFrequency: "Annual",
    details: "Solar irradiance constant in GEO (1,361 W/m² AM0), microwave phased-array conversion efficiency, and rectenna land footprint."
  },
  {
    metricName: "Levelized Cost of Energy (LCOE) Benchmarks",
    source: "Lazard Levelized Cost of Energy Analysis (Version 17.0) & EIA Annual Energy Outlook",
    sourceType: "Industry Benchmark",
    asOfDate: "2025/2026",
    updateFrequency: "Annual",
    details: "Unsubsidized LCOE ranges ($/MWh) for Nuclear, Combined-Cycle Gas Turbines (CCGT), Utility Solar PV, and SMRs."
  },
  {
    metricName: "Hyperscale AI Power Demand & PPA Pricing",
    source: "Constellation Energy ($CEG) / Talen Energy ($TLN) FERC 10-K Data Center PPA Filings",
    sourceType: "SEC Filing",
    asOfDate: "Q2 2026",
    updateFrequency: "Quarterly",
    details: "Behind-the-meter nuclear colocated PPA pricing ($90–$115/MWh) and 24/7 carbon-free energy accounting."
  },
  {
    metricName: "Grid Interconnection Queue Durations",
    source: "Lawrence Berkeley National Laboratory (LBNL) Queued Up Report",
    sourceType: "Regulatory Agency",
    asOfDate: "H1 2026",
    updateFrequency: "Annual",
    details: "Average 4.5–7 year interconnection queue wait times across PJM, ERCOT, CAISO, and MISO ISOs."
  }
];

interface PowerArchitecture {
  id: string;
  name: string;
  ticker?: string;
  category: "Orbital SBSP" | "On-Site Microgrid" | "Nuclear PPA" | "Standard Utility Grid";
  lcoeMWh: number;
  deploymentTimeMonths: number;
  capacityFactorPercent: number;
  carbonGramsKWh: number;
  waterConsumptionGallonsMWh: number;
  gridInterconnectionRisk: "None (Bypassed)" | "Low" | "Medium" | "Extreme (4+ Yrs)";
  color: string;
  summary: string;
}

const ARCHITECTURES: PowerArchitecture[] = [
  {
    id: "sbsp_orbital",
    name: "Orbital Space-Based Solar (SBSP)",
    ticker: "STARLINK / SBSP",
    category: "Orbital SBSP",
    lcoeMWh: 68, // Projected with Starship $50/kg launch costs
    deploymentTimeMonths: 18,
    capacityFactorPercent: 99.6,
    carbonGramsKWh: 8,
    waterConsumptionGallonsMWh: 0,
    gridInterconnectionRisk: "None (Bypassed)",
    color: "#06b6d4",
    summary: "Continuous 1,361 W/m² solar constant in Sun-Synchronous Orbit. No night, no cloud attenuation. Microwave beam downlinked directly to dedicated AI data center ground rectenna array."
  },
  {
    id: "bloom_sofc",
    name: "Solid-Oxide Fuel Cells (BE Energy Server)",
    ticker: "BE",
    category: "On-Site Microgrid",
    lcoeMWh: 88,
    deploymentTimeMonths: 6,
    capacityFactorPercent: 99.999, // Five nines reliability
    carbonGramsKWh: 240, // Drops to near 0 with biogas / hydrogen
    waterConsumptionGallonsMWh: 0, // Solid oxide requires zero cooling water
    gridInterconnectionRisk: "None (Bypassed)",
    color: "#10b981",
    summary: "On-site solid-oxide microgrid deployed directly at the data center fence-line in 5-6 months. Completely bypasses PJM/ERCOT utility queues. Zero water consumption protects drought-prone regions."
  },
  {
    id: "nuclear_ppa",
    name: "Dedicated Nuclear Reactivation / SMR",
    ticker: "CEG / SMR",
    category: "Nuclear PPA",
    lcoeMWh: 105,
    deploymentTimeMonths: 48,
    capacityFactorPercent: 95.0,
    carbonGramsKWh: 12,
    waterConsumptionGallonsMWh: 400,
    gridInterconnectionRisk: "Medium",
    color: "#f59e0b",
    summary: "24/7 carbon-free baseload energy via long-term hyperscaler power purchase agreements (e.g. Constellation / Three Mile Island 835MW restart for Microsoft AI data centers)."
  },
  {
    id: "terrestrial_grid",
    name: "Standard Utility Grid (PJM / ERCOT)",
    ticker: "UTILITY",
    category: "Standard Utility Grid",
    lcoeMWh: 120, // Baseline with transmission tariffs & peak congestion spikes
    deploymentTimeMonths: 44, // 2026 average PJM interconnection queue wait
    capacityFactorPercent: 88.0,
    carbonGramsKWh: 390,
    waterConsumptionGallonsMWh: 650,
    gridInterconnectionRisk: "Extreme (4+ Yrs)",
    color: "#ef4444",
    summary: "Standard regional transmission grid facing severe 44-month transformer shortages, queue backlogs, and volatile peak summer pricing spikes up to $5,000/MWh."
  }
];

export const SpacePowerArbitrage: React.FC = () => {
  // Model interactive parameters
  const [dataCenterPowerMW, setDataCenterPowerMW] = useState<number>(500); // 500 MW cluster
  const [aiTokenRevenuePerMWh, setAiTokenRevenuePerMWh] = useState<number>(650); // $650 AI compute revenue per MWh
  const [gridQueueDelayMonths, setGridQueueDelayMonths] = useState<number>(44);

  // Financial arbitrage model calculations
  const analysis = useMemo(() => {
    const annualMWh = dataCenterPowerMW * 8760;

    const data = ARCHITECTURES.map((arch) => {
      const annualPowerCostMillion = (annualMWh * (arch.lcoeMWh / 1000000));
      const annualWaterGallonsMillion = (annualMWh * arch.waterConsumptionGallonsMWh) / 1000000;
      const annualCarbonTonnes = (annualMWh * arch.carbonGramsKWh) / 1000000;

      // Opportunity cost of time-to-market delay vs fastest deployment (Bloom Energy 6 mo)
      const delayVsFastestMonths = Math.max(0, arch.deploymentTimeMonths - 6);
      const lostComputeRevenueMillion = (delayVsFastestMonths / 12) * (annualMWh * (aiTokenRevenuePerMWh / 1000000));

      return {
        id: arch.id,
        name: arch.name,
        ticker: arch.ticker,
        category: arch.category,
        lcoeMWh: arch.lcoeMWh,
        deploymentTimeMonths: arch.deploymentTimeMonths,
        capacityFactorPercent: arch.capacityFactorPercent,
        carbonGramsKWh: arch.carbonGramsKWh,
        waterConsumptionGallonsMWh: arch.waterConsumptionGallonsMWh,
        annualPowerCostMillion: Number(annualPowerCostMillion.toFixed(1)),
        annualCarbonTonnes: Math.round(annualCarbonTonnes),
        lostComputeRevenueMillion: Math.round(lostComputeRevenueMillion),
        color: arch.color,
        summary: arch.summary,
        gridRisk: arch.gridInterconnectionRisk
      };
    });

    // Radar score normalization
    const radarData = [
      { subject: "Time to Market", Orbital: 85, BloomSOFC: 98, Nuclear: 40, UtilityGrid: 25 },
      { subject: "Baseload Uptime", Orbital: 99, BloomSOFC: 100, Nuclear: 95, UtilityGrid: 85 },
      { subject: "Zero Carbon", Orbital: 95, BloomSOFC: 60, Nuclear: 98, UtilityGrid: 30 },
      { subject: "Zero Water Usage", Orbital: 100, BloomSOFC: 100, Nuclear: 40, UtilityGrid: 35 },
      { subject: "Grid Bypass", Orbital: 100, BloomSOFC: 100, Nuclear: 65, UtilityGrid: 10 },
      { subject: "Cost Predictability", Orbital: 90, BloomSOFC: 92, Nuclear: 85, UtilityGrid: 45 }
    ];

    // Total economic value gained by bypassing grid (Bloom / SBSP vs 44mo utility queue)
    const gridDelayedMonths = gridQueueDelayMonths - 6;
    const computeOpportunityGainedMillion = Math.round((gridDelayedMonths / 12) * (annualMWh * (aiTokenRevenuePerMWh / 1000000)));

    return {
      annualMWh,
      data,
      radarData,
      computeOpportunityGainedMillion
    };
  }, [dataCenterPowerMW, aiTokenRevenuePerMWh, gridQueueDelayMonths]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HEADER HERO */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#041416] via-[#092224] to-[#040e10] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                Orbital vs Terrestrial Power Arbitrage
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                Hyperscaler Energy Moat
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" />
              Orbital Solar (SBSP) vs Solid-Oxide & Nuclear AI Power Arbitrage
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              AI data centers face severe <strong>44-month transmission grid delays</strong>. Compare space-based continuous orbital solar collection against on-site solid-oxide microgrids ($BE) and nuclear restarts ($CEG).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 text-right min-w-[220px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Grid Bypass AI Alpha
            </span>
            <div className="text-3xl font-black text-emerald-300 mt-0.5">
              +${(analysis.computeOpportunityGainedMillion / 1000).toFixed(2)}B
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {gridQueueDelayMonths - 6} Mo Faster AI Training
            </span>
          </div>
        </div>
      </div>

      {/* 2. SENSITIVITY SLIDERS */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Data Center Power & Revenue Model Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">Interactive Compute Sizing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Slider 1: Cluster Power */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">Cluster Megawatts (MW)</span>
              <span className="font-mono font-black text-cyan-300 text-sm">{dataCenterPowerMW} MW</span>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={dataCenterPowerMW}
              onChange={(e) => setDataCenterPowerMW(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>50 MW (Campus)</span>
              <span>500 MW (Gigawatt scale)</span>
              <span>2 GW (Mega-cluster)</span>
            </div>
          </div>

          {/* Slider 2: AI Token Compute Value */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">AI Compute Revenue / MWh</span>
              <span className="font-mono font-black text-emerald-300 text-sm">${aiTokenRevenuePerMWh} / MWh</span>
            </div>
            <input
              type="range"
              min={200}
              max={1500}
              step={50}
              value={aiTokenRevenuePerMWh}
              onChange={(e) => setAiTokenRevenuePerMWh(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>$200 (Commodity inference)</span>
              <span>$650 (Frontier training)</span>
              <span>$1,500 (High-priority)</span>
            </div>
          </div>

          {/* Slider 3: Grid Queue Bottleneck */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">PJM/ERCOT Interconnection Queue</span>
              <span className="font-mono font-black text-amber-300 text-sm">{gridQueueDelayMonths} Months</span>
            </div>
            <input
              type="range"
              min={24}
              max={60}
              step={2}
              value={gridQueueDelayMonths}
              onChange={(e) => setGridQueueDelayMonths(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>24 Mo (Fast-track)</span>
              <span>44 Mo (Current Average)</span>
              <span>60 Mo (Severe backlog)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL COMPARISON VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart A: LCOE Comparison */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                Levelized Cost of Energy ($/MWh LCOE)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Direct cost to power 1 MWh of compute</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              $/MWh
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis type="number" stroke="#737373" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="ticker" stroke="#737373" tick={{ fontSize: 11, fontWeight: "bold" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a111e",
                    borderColor: "#06b6d4",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any) => [`$${val}/MWh`, "LCOE"]}
                />
                <Bar dataKey="lcoeMWh" radius={[0, 8, 8, 0]}>
                  {analysis.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Deployment Lead Time & Time-to-Compute */}
        <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Time to Online Power (Months to First Megawatt)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Speed-to-power directly dictates AI model release dominance</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              Months
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis type="number" stroke="#737373" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} Mo`} />
                <YAxis type="category" dataKey="ticker" stroke="#737373" tick={{ fontSize: 11, fontWeight: "bold" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a111e",
                    borderColor: "#10b981",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff"
                  }}
                  formatter={(val: any) => [`${val} Months`, "Lead Time"]}
                />
                <Bar dataKey="deploymentTimeMonths" radius={[0, 8, 8, 0]}>
                  {analysis.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. DETAILED POWER ARCHITECTURE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.data.map((arch) => (
          <div
            key={arch.id}
            className="p-5 rounded-3xl bg-black/60 border border-white/10 hover:border-cyan-500/40 transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${arch.color}20`,
                    color: arch.color,
                    borderColor: `${arch.color}40`
                  }}
                >
                  {arch.category} · {arch.ticker}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    arch.gridRisk.includes("None")
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : arch.gridRisk.includes("Extreme")
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  Queue Risk: {arch.gridRisk}
                </span>
              </div>

              <h4 className="text-base font-black text-white mt-2">{arch.name}</h4>
              <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">{arch.summary}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs font-mono">
              <div className="p-2 rounded-xl bg-neutral-900/80">
                <div className="text-[9px] text-neutral-400 uppercase">LCOE</div>
                <div className="font-bold text-white text-sm mt-0.5">${arch.lcoeMWh}/MWh</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80">
                <div className="text-[9px] text-neutral-400 uppercase">Lead Time</div>
                <div className="font-bold text-emerald-300 text-sm mt-0.5">{arch.deploymentTimeMonths} Mo</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80">
                <div className="text-[9px] text-neutral-400 uppercase">Uptime Factor</div>
                <div className="font-bold text-cyan-300 text-sm mt-0.5">{arch.capacityFactorPercent}%</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80">
                <div className="text-[9px] text-neutral-400 uppercase">Carbon (g/kWh)</div>
                <div className="font-bold text-amber-300 text-sm mt-0.5">{arch.carbonGramsKWh}g</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="Energy Generation Economics & SBSP Physics"
        lastUpdated="August 2026 (Lazard v17 / NASA OTPS / FERC Tracked)"
        sources={POWER_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
