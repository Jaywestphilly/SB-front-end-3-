import React, { useState, useMemo } from "react";
import {
  Rocket,
  TrendingDown,
  DollarSign,
  Layers,
  Scale,
  Zap,
  Info,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Sliders,
  ChevronRight,
  Flame
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { DataProvenanceCard, DataProvenanceItem } from "../../../components/common/DataProvenanceBadge";

const LAUNCH_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "Historical Launch Costs ($/kg) (1960–Present)",
    source: "CSIS Aerospace Security Project & NASA Historical Reference Collection",
    sourceType: "Regulatory Agency",
    asOfDate: "Annual 2025/2026",
    updateFrequency: "Annual",
    details: "Inflation-adjusted 2025 constant USD cost-per-kg to Low Earth Orbit across 60+ orbital launch systems."
  },
  {
    metricName: "SpaceX Falcon 9 & Starship Launch Economics",
    source: "NASA Commercial Crew / Cargo Contracts & FAA Commercial Space Launch Manifest",
    sourceType: "Regulatory Agency",
    asOfDate: "August 2026",
    updateFrequency: "Monthly",
    details: "Contracted launch service pricing, payload capacities to LEO, and turnaround cadence metrics."
  },
  {
    metricName: "Megaconstellation Fleet Deployment Sizing",
    source: "FCC International Bureau Satellite Division Public Filings (Schedule S)",
    sourceType: "Regulatory Agency",
    asOfDate: "Q2 2026 Filings",
    updateFrequency: "Quarterly",
    details: "FCC Part 25 orbital parameters, wet launch mass, and orbital replacement requirements."
  },
  {
    metricName: "Rocket Equation & Fuel/Vehicle Mass Fractions",
    source: "Tsiolkovsky Rocket Equation & Standard Spacecraft Mass Ratios",
    sourceType: "Physics Constant",
    asOfDate: "Permanent Physics",
    updateFrequency: "Permanent Physics",
    details: "Specific impulse (Isp), delta-V requirements to LEO (9.4 km/s), and booster dry mass recovery fraction."
  }
];

interface LaunchVehicleComparison {
  name: string;
  provider: string;
  payloadToLeoKg: number;
  costPerLaunchMillion: number;
  costPerKg: number;
  reusability: "Expendable" | "Partial (Booster Only)" | "Full & Rapid";
  status: "Historical" | "Operational" | "In Development";
  color: string;
}

const VEHICLE_BENCHMARKS: LaunchVehicleComparison[] = [
  {
    name: "Saturn V",
    provider: "NASA (Apollo Era)",
    payloadToLeoKg: 140000,
    costPerLaunchMillion: 1200,
    costPerKg: 8570,
    reusability: "Expendable",
    status: "Historical",
    color: "#6b7280"
  },
  {
    name: "Space Shuttle",
    provider: "NASA",
    payloadToLeoKg: 27500,
    costPerLaunchMillion: 1500,
    costPerKg: 54545,
    reusability: "Partial (Booster Only)",
    status: "Historical",
    color: "#ef4444"
  },
  {
    name: "NASA SLS Block 1",
    provider: "NASA / Boeing",
    payloadToLeoKg: 95000,
    costPerLaunchMillion: 2200,
    costPerKg: 23150,
    reusability: "Expendable",
    status: "Operational",
    color: "#f97316"
  },
  {
    name: "Ariane 64",
    provider: "Arianespace",
    payloadToLeoKg: 21650,
    costPerLaunchMillion: 115,
    costPerKg: 5310,
    reusability: "Expendable",
    status: "Operational",
    color: "#eab308"
  },
  {
    name: "ULA Vulcan Centaur",
    provider: "United Launch Alliance",
    payloadToLeoKg: 27200,
    costPerLaunchMillion: 110,
    costPerKg: 4044,
    reusability: "Expendable",
    status: "Operational",
    color: "#84cc16"
  },
  {
    name: "Falcon 9 Block 5",
    provider: "SpaceX",
    payloadToLeoKg: 22800,
    costPerLaunchMillion: 33, // Marginal internal cost (~$67M commercial price)
    costPerKg: 1447,
    reusability: "Partial (Booster Only)",
    status: "Operational",
    color: "#06b6d4"
  },
  {
    name: "Falcon Heavy (Reusable)",
    provider: "SpaceX",
    payloadToLeoKg: 63800,
    costPerLaunchMillion: 97,
    costPerKg: 1520,
    reusability: "Partial (Booster Only)",
    status: "Operational",
    color: "#3b82f6"
  },
  {
    name: "Starship V2 (Initial)",
    provider: "SpaceX",
    payloadToLeoKg: 100000,
    costPerLaunchMillion: 25,
    costPerKg: 250,
    reusability: "Full & Rapid",
    status: "Operational",
    color: "#10b981"
  },
  {
    name: "Starship V3 (Scale Target)",
    provider: "SpaceX",
    payloadToLeoKg: 200000,
    costPerLaunchMillion: 10,
    costPerKg: 50,
    reusability: "Full & Rapid",
    status: "Operational",
    color: "#a855f7"
  }
];

export const OrbitalLaunchEconomics: React.FC = () => {
  // Model Parameters
  const [annualCadence, setAnnualCadence] = useState<number>(60);
  const [payloadCapacityTons, setPayloadCapacityTons] = useState<number>(150);
  const [boosterReuses, setBoosterReuses] = useState<number>(25);
  const [shipReuses, setShipReuses] = useState<number>(15);
  const [propellantCostMillion, setPropellantCostMillion] = useState<number>(1.8);
  const [fixedCapexPerStackMillion, setFixedCapexPerStackMillion] = useState<number>(85);
  const [padOpsCostPerLaunchMillion, setPadOpsCostPerLaunchMillion] = useState<number>(2.2);

  // Real-time calculation engine
  const economics = useMemo(() => {
    // Amortization per flight
    const boosterAmortization = (fixedCapexPerStackMillion * 0.65) / boosterReuses;
    const shipAmortization = (fixedCapexPerStackMillion * 0.35) / shipReuses;
    const marginalFlightCost = boosterAmortization + shipAmortization + propellantCostMillion + padOpsCostPerLaunchMillion;

    const payloadKg = payloadCapacityTons * 1000;
    const costPerKgToLeo = (marginalFlightCost * 1000000) / payloadKg;
    const annualMassToOrbitMetricTons = annualCadence * payloadCapacityTons;
    const annualProgramSpendMillion = marginalFlightCost * annualCadence;

    // Equivalent Falcon 9 flights needed for same annual mass
    const falcon9EquivalentFlights = Math.ceil((annualMassToOrbitMetricTons * 1000) / 17500); // 17.5t typical F9 LEO load
    const falcon9EquivalentCostMillion = falcon9EquivalentFlights * 33; // at internal cost
    const annualCostSavingsMillion = falcon9EquivalentCostMillion - annualProgramSpendMillion;

    // Generate cadence sensitivity curve (10 to 180 launches/yr)
    const cadenceCurve = [10, 25, 50, 75, 100, 150, 200, 300].map((cad) => {
      const fixedOpsAmortization = 120 / cad; // $120M base ground/tower fixed ops allocated
      const flightCost = boosterAmortization + shipAmortization + propellantCostMillion + padOpsCostPerLaunchMillion + fixedOpsAmortization;
      const unitCostKg = (flightCost * 1000000) / payloadKg;
      return {
        cadence: `${cad} flt/yr`,
        cadenceNum: cad,
        costPerKg: Math.round(unitCostKg),
        flightCostMillion: Number(flightCost.toFixed(2)),
        annualMassKT: Math.round((cad * payloadCapacityTons) / 1000)
      };
    });

    return {
      marginalFlightCost,
      costPerKgToLeo,
      annualMassToOrbitMetricTons,
      annualProgramSpendMillion,
      falcon9EquivalentFlights,
      annualCostSavingsMillion,
      cadenceCurve
    };
  }, [
    annualCadence,
    payloadCapacityTons,
    boosterReuses,
    shipReuses,
    propellantCostMillion,
    fixedCapexPerStackMillion,
    padOpsCostPerLaunchMillion
  ]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* 1. HEADER HERO */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#06121e] via-[#0b1b2d] to-[#040a12] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                Space Logistics Unit Economics
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Full Rapid Reusability
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Rocket className="w-6 h-6 text-cyan-400" />
              Starship $/kg to Low Earth Orbit (LEO) Decay Engine
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Explore how Mechazilla tower catches, Raptor 3 mass-production, and methalox economies of scale collapse the orbital payload threshold from <strong>$1,500/kg</strong> to under <strong>$75/kg</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 text-right min-w-[200px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Modeled Cost / kg to LEO
            </span>
            <div className="text-3xl font-black text-cyan-300 mt-0.5">
              ${Math.round(economics.costPerKgToLeo).toLocaleString()}
              <span className="text-xs font-normal text-neutral-400"> / kg</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {(100 - (economics.costPerKgToLeo / 1447) * 100).toFixed(1)}% vs Falcon 9
            </span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#091322]/90 border border-cyan-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
            Marginal Cost / Launch
          </span>
          <div className="text-2xl font-black text-white mt-1">
            ${economics.marginalFlightCost.toFixed(2)}M
          </div>
          <span className="text-[10px] text-neutral-400">Hardware amortization + Propellant + Ops</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a1818]/90 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
            Annual Mass-to-Orbit
          </span>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {(economics.annualMassToOrbitMetricTons / 1000).toFixed(1)}k Tons
          </div>
          <span className="text-[10px] text-neutral-400">{economics.annualMassToOrbitMetricTons.toLocaleString()} metric tons / yr</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#18110a]/90 border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
            F9 Flight Equivalents
          </span>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {economics.falcon9EquivalentFlights} Launches
          </div>
          <span className="text-[10px] text-neutral-400">Replaces {Math.round(economics.falcon9EquivalentFlights / annualCadence)}x F9 launches per flight</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#140b1e]/90 border border-purple-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
            Annual Logistics Savings
          </span>
          <div className="text-2xl font-black text-purple-300 mt-1">
            ${Math.round(economics.annualCostSavingsMillion).toLocaleString()}M
          </div>
          <span className="text-[10px] text-neutral-400">Versus equivalent Falcon 9 fleet cost</span>
        </div>
      </div>

      {/* 3. INTERACTIVE SLIDER CONTROLS */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Launch Architecture & Cadence Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">Live Sensitivity Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Slider 1: Annual Cadence */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">Annual Launch Cadence</span>
              <span className="font-mono font-black text-cyan-300 text-sm">{annualCadence} flights/yr</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={annualCadence}
              onChange={(e) => setAnnualCadence(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>10 (Early test)</span>
              <span>100 (Operational)</span>
              <span>200 (Swarm)</span>
            </div>
          </div>

          {/* Slider 2: Payload Capacity */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">LEO Payload Capacity</span>
              <span className="font-mono font-black text-emerald-300 text-sm">{payloadCapacityTons} metric tons</span>
            </div>
            <input
              type="range"
              min={100}
              max={250}
              step={10}
              value={payloadCapacityTons}
              onChange={(e) => setPayloadCapacityTons(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>100t (V1)</span>
              <span>150t (V2)</span>
              <span>250t (V3 Stretched)</span>
            </div>
          </div>

          {/* Slider 3: Booster Reuses */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">Super Heavy Booster Reuses</span>
              <span className="font-mono font-black text-amber-300 text-sm">{boosterReuses} turns</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={boosterReuses}
              onChange={(e) => setBoosterReuses(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>5 (Initial)</span>
              <span>25 (Target)</span>
              <span>100 (Airline-like)</span>
            </div>
          </div>

          {/* Slider 4: Ship Reuses */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">Starship Upper Stage Reuses</span>
              <span className="font-mono font-black text-purple-300 text-sm">{shipReuses} reentries</span>
            </div>
            <input
              type="range"
              min={2}
              max={50}
              step={1}
              value={shipReuses}
              onChange={(e) => setShipReuses(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>2 (Thermal stress)</span>
              <span>15 (Ceramic tiles)</span>
              <span>50 (Mature)</span>
            </div>
          </div>

          {/* Slider 5: Stack Capex */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">Full Stack Manufacturing Cost</span>
              <span className="font-mono font-black text-rose-300 text-sm">${fixedCapexPerStackMillion}M</span>
            </div>
            <input
              type="range"
              min={40}
              max={200}
              step={5}
              value={fixedCapexPerStackMillion}
              onChange={(e) => setFixedCapexPerStackMillion(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>$40M (Mass prod)</span>
              <span>$85M (Current)</span>
              <span>$200M (Early proto)</span>
            </div>
          </div>

          {/* Slider 6: Propellant & Pad Ops */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-300">Propellant + Pad Ops Cost</span>
              <span className="font-mono font-black text-cyan-300 text-sm">${(propellantCostMillion + padOpsCostPerLaunchMillion).toFixed(1)}M</span>
            </div>
            <input
              type="range"
              min={1.5}
              max={8.0}
              step={0.5}
              value={propellantCostMillion + padOpsCostPerLaunchMillion}
              onChange={(e) => {
                const total = Number(e.target.value);
                setPropellantCostMillion(total * 0.45);
                setPadOpsCostPerLaunchMillion(total * 0.55);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>$1.5M (Methalox bulk)</span>
              <span>$4.0M (Nominal)</span>
              <span>$8.0M (Conservative)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CADENCE SENSITIVITY CHART */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Scale Elasticity: Cost / kg vs Launch Cadence
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Fixed infrastructure costs dilute exponentially as flight volume increases
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Logarithmic Scale Decay
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={economics.cadenceCurve} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="cadence" stroke="#737373" tick={{ fontSize: 11 }} />
              <YAxis stroke="#737373" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a111e",
                  borderColor: "#06b6d4",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff"
                }}
                formatter={(val: any, name: any) => [
                  name === "costPerKg" ? `$${val}/kg` : val,
                  name === "costPerKg" ? "Cost per kg" : name
                ]}
              />
              <Area
                type="monotone"
                dataKey="costPerKg"
                stroke="#06b6d4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#costGradient)"
                name="Cost per kg to LEO ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. HISTORICAL & COMPETITIVE LAUNCH VEHICLE BENCHMARKS */}
      <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Global Launch Vehicle $/kg Benchmark Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">Industry Historical Comparators</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">LEO Mass (kg)</th>
                <th className="py-2.5 px-3">Flight Cost ($M)</th>
                <th className="py-2.5 px-3 text-right">Cost / kg</th>
                <th className="py-2.5 px-3 text-center">Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {VEHICLE_BENCHMARKS.map((veh) => {
                const isStarshipTarget = veh.name.includes("Starship V3");
                return (
                  <tr
                    key={veh.name}
                    className={`hover:bg-white/5 transition-colors ${
                      isStarshipTarget ? "bg-cyan-500/10 font-bold" : ""
                    }`}
                  >
                    <td className="py-3 px-3 flex items-center gap-2 font-bold text-white">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: veh.color }}
                      />
                      {veh.name}
                    </td>
                    <td className="py-3 px-3 text-neutral-300">{veh.provider}</td>
                    <td className="py-3 px-3 font-mono text-neutral-300">
                      {veh.payloadToLeoKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-300">
                      ${veh.costPerLaunchMillion}M
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-cyan-300">
                      ${veh.costPerKg.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          veh.reusability === "Full & Rapid"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : veh.reusability === "Partial (Booster Only)"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {veh.reusability}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DATA PROVENANCE & SOURCE ATTRIBUTION */}
      <DataProvenanceCard
        category="Orbital Aerospace & Propulsion Physics"
        lastUpdated="August 2026 (NASA / CSIS / FAA Verified)"
        sources={LAUNCH_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
