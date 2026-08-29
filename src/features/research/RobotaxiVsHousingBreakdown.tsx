import React, { useState } from "react";
import {
  Car,
  Home,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldAlert,
  Sliders,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Zap,
  BarChart3,
  Layers,
  Building2,
  HelpCircle,
} from "lucide-react";

export const RobotaxiVsHousingBreakdown: React.FC = () => {
  // Sensitivity Simulator State
  const [milesPerDay, setMilesPerDay] = useState<number>(250);
  const [teslaFeePct, setTeslaFeePct] = useState<number>(25);
  const [opexPerMile, setOpexPerMile] = useState<number>(0.22);
  const [farePerMile, setFarePerMile] = useState<number>(0.90);
  const [vehicleCost, setVehicleCost] = useState<number>(30000);
  const [numVehicles, setNumVehicles] = useState<number>(50);

  // Real Estate Sensitivity
  const [homePrice, setHomePrice] = useState<number>(1500000);
  const [monthlyRent, setMonthlyRent] = useState<number>(4200);
  const [homeNoiYear, setHomeNoiYear] = useState<number>(20000);

  // Dynamic Calculations for Robotaxi
  const totalMilesYear = milesPerDay * 365; // e.g. 250 * 365 = 91,250 miles/year
  const grossRevenuePerVehicle = totalMilesYear * farePerMile; // e.g. 91,250 * $0.90 = $82,125 gross (or image baseline $58,500)
  const netTeslaFee = grossRevenuePerVehicle * (teslaFeePct / 100);
  const totalOpex = totalMilesYear * opexPerMile;
  const netPerVehicleYear = Math.max(0, grossRevenuePerVehicle - netTeslaFee - totalOpex);
  const fleetCapitalRequired = vehicleCost * numVehicles;
  const fleetTotalNetYear = netPerVehicleYear * numVehicles;
  const paybackMonths = netPerVehicleYear > 0 ? (vehicleCost / netPerVehicleYear) * 12 : 0;

  // Real Estate Calculations
  const homesNeededForFleetNet = netPerVehicleYear > 0 ? Math.ceil(fleetTotalNetYear / homeNoiYear) : 50;
  const realEstateAssetBase = homesNeededForFleetNet * homePrice;
  const capitalEfficiencyRatio = fleetCapitalRequired > 0 ? (realEstateAssetBase / fleetCapitalRequired).toFixed(1) : "50.0";

  const resetDefaults = () => {
    setMilesPerDay(250);
    setTeslaFeePct(25);
    setOpexPerMile(0.22);
    setFarePerMile(0.64); // $58,500 / 91,250 miles ~ $0.641/mi fare
    setVehicleCost(30000);
    setNumVehicles(50);
    setHomePrice(1500000);
    setMonthlyRent(4200);
    setHomeNoiYear(20000);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#081220] via-[#040a14] to-[#02060d] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quant Wealth Matrix Analysis
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              2027+ Private Owner Thesis
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Robotaxi vs. Rental Housing: <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              The $1M/Year Capital Efficiency Gap
            </span>
          </h1>

          <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
            Comparing $1.5M in autonomous fleet deployment against $75M in Bay Area real estate to generate ~$1M in annual net cash flow. An asymmetric comparison of capital intensity, payback horizons, and unit economics.
          </p>
        </div>
      </div>

      {/* Hero Visual Card - Matching Graphic layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ROBOTAXI PANEL */}
        <div className="rounded-2xl border border-amber-500/30 bg-[#070e18]/90 p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-400 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-bl-xl shadow-lg">
            High Capital Efficiency
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Robotaxi (Cybercab)</h3>
                <p className="text-xs text-amber-300/80 font-mono">Autonomous Fleet Deployment</p>
              </div>
            </div>

            {/* Vehicle Card Graphic */}
            <div className="rounded-xl border border-amber-500/20 bg-black/40 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                <span>Vehicle Fleet Model</span>
                <span className="text-amber-300 font-bold">Cybercab / Model 2</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Vehicle Cost</span>
                  <span className="text-sm font-black text-white">${vehicleCost.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Gross / Year</span>
                  <span className="text-sm font-black text-amber-300">${Math.round(grossRevenuePerVehicle).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Net / Veh / Yr</span>
                  <span className="text-sm font-black text-emerald-400">${Math.round(netPerVehicleYear).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Units for ~$1M</span>
                  <span className="text-sm font-black text-white">{numVehicles} vehicles</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Capital Required</span>
                  <span className="text-sm font-black text-amber-300">${(fleetCapitalRequired / 1e6).toFixed(2)}M</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Payback</span>
                  <span className="text-sm font-black text-cyan-300">{paybackMonths > 0 ? `${paybackMonths.toFixed(0)} mos` : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Assumptions Badges */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-neutral-300">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-amber-300 font-bold">{milesPerDay}</span> mi/day
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-amber-300 font-bold">{teslaFeePct}%</span> Tesla Fee
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-amber-300 font-bold">${opexPerMile.toFixed(2)}</span> /mi cost
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs text-center font-medium">
            📅 Private-owner access likely 2027+ horizon
          </div>
        </div>

        {/* HOUSING PANEL */}
        <div className="rounded-2xl border border-cyan-500/30 bg-[#070e18]/90 p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-400 text-black font-extrabold text-[11px] uppercase tracking-wider rounded-bl-xl shadow-lg">
            High Asset Base
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Bay Area Housing</h3>
                <p className="text-xs text-cyan-300/80 font-mono">Traditional Rental Real Estate</p>
              </div>
            </div>

            {/* Housing Card Graphic */}
            <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                <span>Asset Archetype</span>
                <span className="text-cyan-300 font-bold">Single Family Rental (SFR)</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Home Price (Avg)</span>
                  <span className="font-bold text-white">${(homePrice / 1e6).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Monthly Gross Rent</span>
                  <span className="font-bold text-cyan-300">${monthlyRent.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">NOI / Home / Year</span>
                  <span className="font-bold text-emerald-400">${homeNoiYear.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Homes Needed for ~$1M Net</span>
                  <span className="font-bold text-white">{homesNeededForFleetNet} homes</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Total Asset Base</span>
                  <span className="font-bold text-amber-300">${(realEstateAssetBase / 1e6).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              ⚠️ Levered cash flow with mortgages at 6.5%+ interest rates: <strong className="text-rose-200">Negative or Near Zero</strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-200 text-xs text-center font-medium">
            ⏳ Wealth Path Horizon: ~10 Years (Equity Accumulation)
          </div>
        </div>
      </div>

      {/* The Three Visual Comparisons (A. Capital Required, B. Units Needed, C. Path to Cash Flow) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart A: Capital Required */}
        <div className="rounded-2xl border border-white/10 bg-[#081220] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              A. Capital Required
            </h4>
            <span className="text-[10px] font-mono text-neutral-400">For ~$1M/yr</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-amber-300 font-bold">Robotaxi (50 Fleet)</span>
                <span className="text-amber-300 font-bold">${(fleetCapitalRequired / 1e6).toFixed(1)}M</span>
              </div>
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(3, (fleetCapitalRequired / realEstateAssetBase) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-cyan-300 font-bold">Bay Area Housing</span>
                <span className="text-cyan-300 font-bold">${(realEstateAssetBase / 1e6).toFixed(1)}M</span>
              </div>
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full w-full" />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 font-mono text-center pt-2">
              ⚡ Robotaxi uses <strong className="text-emerald-400">{capitalEfficiencyRatio}x less capital</strong> for equal cash flow.
            </p>
          </div>
        </div>

        {/* Chart B: Units Needed */}
        <div className="rounded-2xl border border-white/10 bg-[#081220] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              B. Units Needed for ~$1M
            </h4>
            <span className="text-[10px] font-mono text-neutral-400">Physical Units</span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-300">Robotaxi Fleet</span>
                <span className="font-black text-white text-base">{numVehicles} Vehicles</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1 opacity-80">
                {Array.from({ length: Math.min(25, numVehicles) }).map((_, i) => (
                  <Car key={i} className="w-3.5 h-3.5 text-amber-400" />
                ))}
                {numVehicles > 25 && <span className="text-[10px] text-amber-300 font-bold">+{numVehicles - 25}</span>}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-cyan-300">Bay Area Homes</span>
                <span className="font-black text-white text-base">{homesNeededForFleetNet} Properties</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1 opacity-80">
                {Array.from({ length: Math.min(25, homesNeededForFleetNet) }).map((_, i) => (
                  <Home key={i} className="w-3.5 h-3.5 text-cyan-400" />
                ))}
                {homesNeededForFleetNet > 25 && <span className="text-[10px] text-cyan-300 font-bold">+{homesNeededForFleetNet - 25}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Chart C: Path to Cash Flow */}
        <div className="rounded-2xl border border-white/10 bg-[#081220] p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              C. Path to Cash Flow
            </h4>
            <span className="text-[10px] font-mono text-neutral-400">Payback Timeline</span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-300">Robotaxi Payback</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {paybackMonths > 0 ? `${paybackMonths.toFixed(0)} Months` : "N/A"}
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, (paybackMonths / 120) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-300">Housing Wealth Horizon</span>
                <span className="font-extrabold text-blue-400 text-sm">10 Years</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full w-full" />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-snug">
              Robotaxi offers rapid capital recycling, while housing relies on long-term appreciation and principal paydown.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Unit Economics Table */}
      <div className="rounded-2xl border border-white/10 bg-[#081220] p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Side-by-Side Unit Economics Breakdown</h3>
            <p className="text-xs text-neutral-400">Granular financial metrics comparing single-unit performance and scale requirements.</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-neutral-300">
            Baseline Unit Comparison
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Financial Metric</th>
                <th className="py-3 px-4 text-amber-300 bg-amber-500/5">Robotaxi (1 Vehicle)</th>
                <th className="py-3 px-4 text-cyan-300 bg-cyan-500/5">Bay Area SFR (1 Home)</th>
                <th className="py-3 px-4 text-neutral-300">Delta / Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-200">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Initial Asset Purchase Price</td>
                <td className="py-3 px-4 font-bold text-amber-300 bg-amber-500/5">${vehicleCost.toLocaleString()}</td>
                <td className="py-3 px-4 font-bold text-cyan-300 bg-cyan-500/5">${homePrice.toLocaleString()}</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">50x Lower Cost</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Annual Gross Revenue</td>
                <td className="py-3 px-4 font-bold text-amber-300 bg-amber-500/5">${Math.round(grossRevenuePerVehicle).toLocaleString()}</td>
                <td className="py-3 px-4 text-cyan-300 bg-cyan-500/5">${(monthlyRent * 12).toLocaleString()} ($4,200/mo)</td>
                <td className="py-3 px-4 text-amber-300 font-bold">1.16x Higher Gross</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Platform / Operating Expenses</td>
                <td className="py-3 px-4 text-amber-300 bg-amber-500/5">
                  ${Math.round(netTeslaFee + totalOpex).toLocaleString()} ({teslaFeePct}% fee + ${opexPerMile}/mi)
                </td>
                <td className="py-3 px-4 text-cyan-300 bg-cyan-500/5">$30,400 (Taxes, Ins, Maint, Vacancy)</td>
                <td className="py-3 px-4 text-neutral-400">Variable vs Property Expenses</td>
              </tr>
              <tr className="hover:bg-white/[0.02] bg-emerald-500/5">
                <td className="py-3 px-4 font-bold text-white">Net Operating Income (NOI) / Year</td>
                <td className="py-3 px-4 font-black text-emerald-400 bg-amber-500/5">${Math.round(netPerVehicleYear).toLocaleString()}</td>
                <td className="py-3 px-4 font-black text-cyan-300 bg-cyan-500/5">${homeNoiYear.toLocaleString()}</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Near Parity Net Income</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Unlevered Cash-on-Cash Return</td>
                <td className="py-3 px-4 font-bold text-amber-300 bg-amber-500/5">
                  {vehicleCost > 0 ? ((netPerVehicleYear / vehicleCost) * 100).toFixed(1) : 0}%
                </td>
                <td className="py-3 px-4 text-cyan-300 bg-cyan-500/5">
                  {homePrice > 0 ? ((homeNoiYear / homePrice) * 100).toFixed(1) : 0}% Cap Rate
                </td>
                <td className="py-3 px-4 text-emerald-400 font-bold">~50x Higher Yield</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">Units Needed for $1,000,000 Net</td>
                <td className="py-3 px-4 font-bold text-amber-300 bg-amber-500/5">{numVehicles} Vehicles</td>
                <td className="py-3 px-4 text-cyan-300 bg-cyan-500/5">{homesNeededForFleetNet} Properties</td>
                <td className="py-3 px-4 text-white">Equal Scale Target</td>
              </tr>
              <tr className="hover:bg-white/[0.02] bg-amber-500/10">
                <td className="py-3 px-4 font-bold text-white">Total Capital Required for $1M Net</td>
                <td className="py-3 px-4 font-black text-amber-300 bg-amber-500/5">${(fleetCapitalRequired / 1e6).toFixed(2)} Million</td>
                <td className="py-3 px-4 font-black text-cyan-300 bg-cyan-500/5">${(realEstateAssetBase / 1e6).toFixed(1)} Million</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">${((realEstateAssetBase - fleetCapitalRequired) / 1e6).toFixed(1)}M Less Capital</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Sensitivity & Risk Simulator */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#081220] p-6 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Interactive Sensitivity & Stress-Test Calculator
            </h3>
            <p className="text-xs text-neutral-300">
              Adjust variables to test how utilization drops, network fee increases, or higher maintenance reserves compress net cash flow.
            </p>
          </div>

          <button
            onClick={resetDefaults}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Miles per Day */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="text-neutral-300 font-bold">Daily Utilization (Miles/Day)</label>
              <span className="font-mono text-amber-300 font-black">{milesPerDay} mi/day</span>
            </div>
            <input
              type="range"
              min="100"
              max="350"
              step="10"
              value={milesPerDay}
              onChange={(e) => setMilesPerDay(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>100 mi (Low demand)</span>
              <span>250 mi (Base)</span>
              <span>350 mi (24/7)</span>
            </div>
          </div>

          {/* Slider 2: Tesla Network Fee */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="text-neutral-300 font-bold">Tesla Network Platform Fee</label>
              <span className="font-mono text-cyan-300 font-black">{teslaFeePct}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="1"
              value={teslaFeePct}
              onChange={(e) => setTeslaFeePct(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>15% (Optimistic)</span>
              <span>25-30% (Base)</span>
              <span>45% (Uber level)</span>
            </div>
          </div>

          {/* Slider 3: Opex Per Mile */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="text-neutral-300 font-bold">Operating Expense per Mile</label>
              <span className="font-mono text-emerald-300 font-black">${opexPerMile.toFixed(2)}/mi</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.01"
              value={opexPerMile}
              onChange={(e) => setOpexPerMile(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>$0.15 (Low wear)</span>
              <span>$0.22 (Base)</span>
              <span>$0.40 (High tires/ins)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Result Box */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-emerald-500/10 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Annual Miles / Vehicle</span>
            <span className="text-lg font-black text-white">{totalMilesYear.toLocaleString()} mi</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Net / Vehicle / Year</span>
            <span className="text-lg font-black text-emerald-400">${Math.round(netPerVehicleYear).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Fleet Net ({numVehicles} Units)</span>
            <span className="text-lg font-black text-amber-300">${Math.round(fleetTotalNetYear).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Simulated Payback</span>
            <span className="text-lg font-black text-cyan-300">{paybackMonths > 0 ? `${paybackMonths.toFixed(1)} mos` : "Unprofitable"}</span>
          </div>
        </div>
      </div>

      {/* Critical Risk & Sensitivity Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Drivers */}
        <div className="rounded-2xl border border-white/10 bg-[#081220] p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Assumptions Driving the $19.8k Net / Vehicle
          </h3>

          <ul className="space-y-3 text-xs text-neutral-300">
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">250 Miles / Day Utilization:</strong>
                Equivalent to ~91,250 miles/year per vehicle in urban/suburban ride-hailing networks.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">25–30% Tesla Platform Fee:</strong>
                Covers autonomous fleet dispatch, software routing, telemetry monitoring, and customer network infrastructure.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">$0.20–$0.25 / Mile Operating Cost:</strong>
                Covers electricity charging costs (~$0.05/mi), commercial insurance reserves, routine interior detailing, tires, and maintenance.
              </div>
            </li>
          </ul>
        </div>

        {/* Risk Factors & Friction Points */}
        <div className="rounded-2xl border border-rose-500/30 bg-[#081220] p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Key Variables & Risk Factors
          </h3>

          <ul className="space-y-3 text-xs text-neutral-300">
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">High Mileage Vehicle Longevity:</strong>
                At 90k+ miles/year, a vehicle reaches 300,000 miles in ~3.3 years. Battery degradation, suspension replacement, and seat wear become real costs.
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Timeline & Geographic Licensing:</strong>
                Private owner access to the Tesla Network is projected for 2027+, requiring regulatory approval city-by-city (e.g. California CPUC, Texas DOT).
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Commercial Fleet Insurance:</strong>
                Until autonomous safety statistics mature, commercial liability insurance per vehicle could temporarily compress initial margins.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Comparison to Waymo Context */}
      <div className="rounded-2xl border border-cyan-500/20 bg-[#081220] p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Industry Benchmark Context: Tesla Cybercab vs. Waymo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <span className="text-amber-300 font-bold uppercase tracking-wider block text-[11px]">Tesla Vision-Only Architecture</span>
            <p className="text-neutral-300 leading-relaxed font-sans">
              Uses standard cameras + custom AI inference silicon (FSD Hardware 4/5). Designed for high-volume consumer vehicle prices ($30,000 target purchase price), allowing decentralized private owner fleet deployment.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <span className="text-cyan-300 font-bold uppercase tracking-wider block text-[11px]">Waymo LiDAR + Radar Hardware Suite</span>
            <p className="text-neutral-300 leading-relaxed font-sans">
              Uses high-precision multi-LiDAR, radar, and sensor pods integrated onto Jaguar I-PACE platforms. Vehicle hardware cost is estimated at $100,000 - $150,000+, operated via centralized corporate fleet ownership.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Line Framing & Disclaimer */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-black to-cyan-500/10 p-6 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          Bottom Line Framing
        </h4>

        <p className="text-xs text-neutral-300 leading-relaxed">
          This model is an educational capital efficiency comparison under stated assumptions rather than a guaranteed yield forecast. The order-of-magnitude capital difference ($1.5M vs $75M) is so wide that even under heavily discounted utilization scenarios (e.g., 180 miles/day or higher insurance reserves), autonomous fleet deployment remains an asymmetric capital-efficiency case study relative to high-cost coastal real estate.
        </p>

        <p className="text-[11px] text-neutral-500 font-mono italic">
          Disclaimer: Informational analysis only. Not financial, investment, or real estate advice.
        </p>
      </div>
    </div>
  );
};
