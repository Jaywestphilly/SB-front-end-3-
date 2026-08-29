import React, { useState, useMemo } from "react";
import {
  Bot,
  Car,
  Cpu,
  Zap,
  TrendingUp,
  Sliders,
  DollarSign,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  BarChart3,
  Factory,
  Compass,
  Crosshair,
  Gauge,
  Navigation,
  Eye,
  RefreshCw,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

export const RoboticsAndSelfDrivingSuite: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<
    "robotaxi_economics" | "humanoid_bom" | "value_chain_tickers" | "disengagement_radar"
  >("robotaxi_economics");

  // --- TAB 1: ROBOTAXI SENSITIVITY STATE ---
  const [farePerMile, setFarePerMile] = useState<number>(1.25); // Consumer price vs human Uber $2.60/mi
  const [milesPerDay, setMilesPerDay] = useState<number>(240); // 24/7 autonomous utilization
  const [vehicleCost, setVehicleCost] = useState<number>(32000); // Dedicated robotaxi purchase price
  const [teleOpCostPerMile, setTeleOpCostPerMile] = useState<number>(0.05); // Remote human intervention fallback
  const [chargingMaintenancePerMile, setChargingMaintenancePerMile] = useState<number>(0.12);
  const [insuranceFleetPerMile, setInsuranceFleetPerMile] = useState<number>(0.09);
  const [platformTakeRate, setPlatformTakeRate] = useState<number>(25); // 25% to dispatch network (Tesla/Waymo)
  const [fleetSize, setFleetSize] = useState<number>(100); // Commercial fleet size

  // Calculations for Tab 1
  const robotaxiMetrics = useMemo(() => {
    const annualMilesPerCar = milesPerDay * 365;
    const totalOpexPerMile = teleOpCostPerMile + chargingMaintenancePerMile + insuranceFleetPerMile;
    const grossRevenuePerCar = annualMilesPerCar * farePerMile;
    const platformFeePerCar = grossRevenuePerCar * (platformTakeRate / 100);
    const totalOpexPerCar = annualMilesPerCar * totalOpexPerMile;
    const netProfitPerCar = Math.max(0, grossRevenuePerCar - platformFeePerCar - totalOpexPerCar);
    const fleetNetAnnual = netProfitPerCar * fleetSize;
    const fleetCapEx = vehicleCost * fleetSize;
    const paybackMonths = netProfitPerCar > 0 ? (vehicleCost / netProfitPerCar) * 12 : 999;
    const roiAnnual = fleetCapEx > 0 ? (fleetNetAnnual / fleetCapEx) * 100 : 0;
    const humanUberOpexPerMile = 2.60;
    const consumerSavingsPct = ((humanUberOpexPerMile - farePerMile) / humanUberOpexPerMile) * 100;

    return {
      annualMilesPerCar,
      totalOpexPerMile,
      grossRevenuePerCar,
      platformFeePerCar,
      totalOpexPerCar,
      netProfitPerCar,
      fleetNetAnnual,
      fleetCapEx,
      paybackMonths,
      roiAnnual,
      consumerSavingsPct,
    };
  }, [
    farePerMile,
    milesPerDay,
    vehicleCost,
    teleOpCostPerMile,
    chargingMaintenancePerMile,
    insuranceFleetPerMile,
    platformTakeRate,
    fleetSize,
  ]);

  // --- TAB 2: HUMANOID BOM & LABOR ARBITRAGE STATE ---
  const [humanHourlyWage, setHumanHourlyWage] = useState<number>(28); // $28/hr US manufacturing average
  const [shiftsPerDay, setShiftsPerDay] = useState<number>(2); // 16 hours daily uptime
  const [robotUnitCost, setRobotUnitCost] = useState<number>(25000); // Target Gen 2/3 mass production BOM
  const [robotKwhPerHour, setRobotKwhPerHour] = useState<number>(0.65); // Power consumption
  const [electricityCostKwh, setElectricityCostKwh] = useState<number>(0.14); // Commercial grid power
  const [annualMaintSpareParts, setAnnualMaintSpareParts] = useState<number>(2200); // Harmonic drives & joint replacement

  // Calculations for Tab 2
  const humanoidMetrics = useMemo(() => {
    const hoursPerDay = shiftsPerDay * 8;
    const workingDaysYear = 350;
    const totalAnnualHours = hoursPerDay * workingDaysYear;

    // Human Cost (including 25% payroll tax, healthcare, benefits)
    const humanEffectiveHourly = humanHourlyWage * 1.25;
    const annualHumanCost = humanEffectiveHourly * totalAnnualHours;

    // Humanoid Cost
    const annualPowerCost = totalAnnualHours * robotKwhPerHour * electricityCostKwh;
    const annualDepreciation = robotUnitCost / 4; // 4-year straight-line depreciation
    const totalAnnualRobotCost = annualPowerCost + annualMaintSpareParts + annualDepreciation;
    const robotEffectiveHourly = totalAnnualRobotCost / totalAnnualHours;

    const annualNetSavings = Math.max(0, annualHumanCost - totalAnnualRobotCost);
    const paybackMonths = annualNetSavings > 0 ? (robotUnitCost / annualNetSavings) * 12 : 999;
    const fiveYearNpvSavings = annualNetSavings * 5 - robotUnitCost;

    return {
      totalAnnualHours,
      annualHumanCost,
      annualPowerCost,
      totalAnnualRobotCost,
      robotEffectiveHourly,
      annualNetSavings,
      paybackMonths,
      fiveYearNpvSavings,
    };
  }, [
    humanHourlyWage,
    shiftsPerDay,
    robotUnitCost,
    robotKwhPerHour,
    electricityCostKwh,
    annualMaintSpareParts,
  ]);

  const handleExportBriefing = () => {
    triggerHaptic("success");
    const briefingText = `STOCK BLOC QUANT TERMINAL - ROBOTICS & AUTONOMOUS MOBILITY DOSSIER
================================================================================
Generated: ${new Date().toISOString()}
Target Sectors: L4 Autonomous Mobility, Humanoid Robotics & Physical AI Supply Chains

1. ROBOTAXI FLEET SENSITIVITY MODEL
--------------------------------------------------------------------------------
Consumer Fare: $${farePerMile.toFixed(2)}/mile (Savings vs Human Uber: ${robotaxiMetrics.consumerSavingsPct.toFixed(1)}%)
Daily Utilization: ${milesPerDay} miles/day (${robotaxiMetrics.annualMilesPerCar.toLocaleString()} mi/yr)
Vehicle CapEx: $${vehicleCost.toLocaleString()} per unit
Autonomous Opex: $${robotaxiMetrics.totalOpexPerMile.toFixed(2)}/mile
Net Cash Flow / Unit: $${Math.round(robotaxiMetrics.netProfitPerCar).toLocaleString()} / year
Fleet Size: ${fleetSize} units -> Total Fleet CapEx: $${Math.round(robotaxiMetrics.fleetCapEx).toLocaleString()}
Annual Fleet Net Profit: $${Math.round(robotaxiMetrics.fleetNetAnnual).toLocaleString()} / year
Capital Payback Horizon: ${robotaxiMetrics.paybackMonths.toFixed(1)} Months (${robotaxiMetrics.roiAnnual.toFixed(1)}% Annual Cash ROI)

2. HUMANOID ROBOTICS FACTORY ARBITRAGE MODEL
--------------------------------------------------------------------------------
Human Labor Baseline: $${humanHourlyWage}/hr ($${humanMetricsFormatted(humanoidMetrics.annualHumanCost)}/yr fully burdened)
Shifts per Day: ${shiftsPerDay} Shifts (${humanoidMetrics.totalAnnualHours.toLocaleString()} Operating Hours/yr)
Robot Acquisition BOM: $${robotUnitCost.toLocaleString()}
Robot Effective Cost: $${humanoidMetrics.robotEffectiveHourly.toFixed(2)}/hr ($${Math.round(humanoidMetrics.totalAnnualRobotCost).toLocaleString()}/yr)
Annual Cost Reduction: $${Math.round(humanoidMetrics.annualNetSavings).toLocaleString()} per station
Payback Period: ${humanoidMetrics.paybackMonths.toFixed(1)} Months
5-Year Net Labor Arbitrage NPV: $${Math.round(humanoidMetrics.fiveYearNpvSavings).toLocaleString()}

3. PURE-PLAY PHYSICAL AI TICKERS
--------------------------------------------------------------------------------
- TSLA: Cybercab Unsupervised FSD & Optimus Gen 3 Humanoid Robot
- GOOGL (Waymo): 150k+ Commercial Paid Autonomous Rides/Week in SF/PHX/LA/AUS
- AUR: Aurora Driver Class-8 Autonomous Freight Trucking Corridor
- ISRG: da Vinci 5 Surgical Multi-Quadrant Robotic Manipulation
- SYM: Autonomous AI Warehouse Robotics for Global Supply Chains
- TER: Universal Robots Cobots & Mobile Industrial Robotics (MiR)
- CGNX: Machine Vision & High-Speed Optical Inspection
- OUST / HSAI: High-Resolution Digital Flash & Automotive LiDAR

Generated by Stock Bloc Financial Intelligence Terminal
https://stock-bloc.ai.studio
`;

    const blob = new Blob([briefingText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StockBloc_Robotics_Autonomous_Intelligence_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function humanMetricsFormatted(val: number) {
    return Math.round(val).toLocaleString();
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 text-white font-sans">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-[#06111f] via-[#040913] to-[#0a1829] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 shadow-sm">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              Physical AI & Autonomous Mobility Terminal
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                End-to-End Neural Nets • Actuators • L4 Fleets
              </span>
              <button
                onClick={handleExportBriefing}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Export Quantitative Dossier"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Model</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Robotics, Humanoid Labor Arbitrage & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
              Robotaxi Fleet Unit Economics
            </span>
          </h1>

          <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
            Quantify the tectonic transition from software agents to physical AI. Model the $1.25/mile autonomous ride disruption against legacy rideshare and the &lt;8-month humanoid factory payback replacing $28/hr human labor.
          </p>

          {/* Sub-View Switcher */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveSubView("robotaxi_economics");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeSubView === "robotaxi_economics"
                  ? "bg-cyan-400 text-black font-extrabold shadow-lg shadow-cyan-400/30"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Robotaxi Fleet Economics
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveSubView("humanoid_bom");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeSubView === "humanoid_bom"
                  ? "bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-400/30"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              Humanoid BOM & Factory ROI
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveSubView("value_chain_tickers");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeSubView === "value_chain_tickers"
                  ? "bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-400/30"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Physical AI Pure-Play Tickers
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveSubView("disengagement_radar");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeSubView === "disengagement_radar"
                  ? "bg-purple-400 text-black font-extrabold shadow-lg shadow-purple-400/30"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              Disengagement & Safety Radar
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: ROBOTAXI FLEET ECONOMICS */}
      {activeSubView === "robotaxi_economics" && (
        <div className="space-y-6">
          {/* Key KPI Metrics Top Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Net Profit / Car
              </span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                ${Math.round(robotaxiMetrics.netProfitPerCar).toLocaleString()}
                <span className="text-xs text-neutral-400 font-normal"> / yr</span>
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold block">
                {robotaxiMetrics.annualMilesPerCar.toLocaleString()} miles/year
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Fleet Net Cash Flow ({fleetSize} cars)
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                ${(robotaxiMetrics.fleetNetAnnual / 1000000).toFixed(2)}M
                <span className="text-xs text-neutral-400 font-normal"> / yr</span>
              </p>
              <span className="text-[10px] text-neutral-400 block">
                Total CapEx: ${(robotaxiMetrics.fleetCapEx / 1000000).toFixed(2)}M
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Capital Payback Time
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                {robotaxiMetrics.paybackMonths.toFixed(1)}
                <span className="text-xs text-neutral-400 font-normal"> Mos</span>
              </p>
              <span className="text-[10px] text-amber-400 font-semibold block">
                {robotaxiMetrics.roiAnnual.toFixed(1)}% Annual ROI
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-purple-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                Consumer Fare vs Uber
              </span>
              <p className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                -{robotaxiMetrics.consumerSavingsPct.toFixed(0)}%
                <span className="text-xs text-neutral-400 font-normal"> Discount</span>
              </p>
              <span className="text-[10px] text-neutral-400 block">
                ${farePerMile.toFixed(2)}/mi vs $2.60 Uber
              </span>
            </div>
          </div>

          {/* Interactive Dials & Comparison Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sensitivity Controls Slider Box */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#06101c] border border-cyan-500/30 space-y-5">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Fleet Sensitivity Dials
                </h3>
                <button
                  onClick={() => {
                    setFarePerMile(1.25);
                    setMilesPerDay(240);
                    setVehicleCost(32000);
                    setTeleOpCostPerMile(0.05);
                    setChargingMaintenancePerMile(0.12);
                    setInsuranceFleetPerMile(0.09);
                    setPlatformTakeRate(25);
                    setFleetSize(100);
                    triggerHaptic("light");
                  }}
                  className="text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              {/* Slider 1: Fare per Mile */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Consumer Fare:</span>
                  <span className="text-cyan-400 font-bold">${farePerMile.toFixed(2)} / mile</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="2.50"
                  step="0.05"
                  value={farePerMile}
                  onChange={(e) => setFarePerMile(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                  <span>$0.50 (Marginal cost)</span>
                  <span>$1.25 (Disruption)</span>
                  <span>$2.50 (Legacy Uber)</span>
                </div>
              </div>

              {/* Slider 2: Daily Utilization */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Daily Utilization:</span>
                  <span className="text-emerald-400 font-bold">{milesPerDay} miles / day</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  value={milesPerDay}
                  onChange={(e) => setMilesPerDay(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                  <span>100 mi (Part-time)</span>
                  <span>240 mi (Active)</span>
                  <span>400 mi (24/7 Peak)</span>
                </div>
              </div>

              {/* Slider 3: Vehicle Purchase Price */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Vehicle Unit CapEx:</span>
                  <span className="text-amber-300 font-bold">${vehicleCost.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="90000"
                  step="1000"
                  value={vehicleCost}
                  onChange={(e) => setVehicleCost(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                  <span>$25k (Cybercab)</span>
                  <span>$32k (Model Y)</span>
                  <span>$80k+ (Zeekr LiDAR)</span>
                </div>
              </div>

              {/* Slider 4: Fleet Size */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Commercial Fleet Size:</span>
                  <span className="text-purple-300 font-bold">{fleetSize} Autonomous Cars</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              {/* Cost per Mile Breakdown */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
                <div className="text-[11px] font-bold text-neutral-300 border-b border-white/10 pb-1 flex justify-between">
                  <span>Autonomous Operating Cost Breakdown</span>
                  <span className="text-cyan-400 font-black">${robotaxiMetrics.totalOpexPerMile.toFixed(2)}/mi</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[10px]">
                  <span>Charging & Power:</span>
                  <span className="text-neutral-200">${chargingMaintenancePerMile.toFixed(2)}/mi</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[10px]">
                  <span>Remote Teleoperation Intervention:</span>
                  <span className="text-neutral-200">${teleOpCostPerMile.toFixed(2)}/mi</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[10px]">
                  <span>Commercial Fleet Insurance & Depot:</span>
                  <span className="text-neutral-200">${insuranceFleetPerMile.toFixed(2)}/mi</span>
                </div>
              </div>
            </div>

            {/* Visual Breakdown of Unit Economics: Autonomous vs Human Driver */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-2xl bg-[#081324] border border-cyan-500/30 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>Unit Economics Waterfall: $1.00 of Fare Revenue</span>
                  <span className="text-xs font-mono text-cyan-400">Autonomous vs Human</span>
                </h3>

                {/* Comparison Bars */}
                <div className="space-y-4 pt-2">
                  {/* Autonomous Robotaxi Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-emerald-400" />
                        Autonomous Robotaxi Stack ($1.25/mi fare)
                      </span>
                      <span className="text-emerald-400 font-black">
                        ${Math.round(robotaxiMetrics.netProfitPerCar).toLocaleString()} Net/yr ({(robotaxiMetrics.netProfitPerCar / (robotaxiMetrics.grossRevenuePerCar || 1) * 100).toFixed(0)}% Margin)
                      </span>
                    </div>
                    <div className="h-6 w-full rounded-xl overflow-hidden flex bg-neutral-900 border border-neutral-700">
                      <div
                        style={{ width: `${(robotaxiMetrics.netProfitPerCar / robotaxiMetrics.grossRevenuePerCar) * 100}%` }}
                        className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-black text-black"
                        title="Owner Net Profit"
                      >
                        Net Owner Profit
                      </div>
                      <div
                        style={{ width: `${platformTakeRate}%` }}
                        className="bg-cyan-500 h-full flex items-center justify-center text-[10px] font-bold text-black"
                        title="Dispatch Platform Fee (25%)"
                      >
                        Platform (25%)
                      </div>
                      <div
                        style={{ width: `${(robotaxiMetrics.totalOpexPerCar / robotaxiMetrics.grossRevenuePerCar) * 100}%` }}
                        className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-bold text-black"
                        title="Direct Opex (Power, Tires, Insurance)"
                      >
                        Opex
                      </div>
                    </div>
                  </div>

                  {/* Human Uber Driver Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        Legacy Human Driver Rideshare ($2.60/mi fare)
                      </span>
                      <span className="text-neutral-400 font-bold">~14% Net Driver Margin ($18k/yr)</span>
                    </div>
                    <div className="h-6 w-full rounded-xl overflow-hidden flex bg-neutral-900 border border-neutral-700 opacity-75">
                      <div style={{ width: "55%" }} className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white">
                        Human Labor ($1.43/mi)
                      </div>
                      <div style={{ width: "28%" }} className="bg-neutral-600 h-full flex items-center justify-center text-[10px] font-bold text-white">
                        Uber Take (28%)
                      </div>
                      <div style={{ width: "17%" }} className="bg-neutral-800 h-full flex items-center justify-center text-[10px] font-bold text-neutral-300">
                        Fuel/Deprec.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Institutional Takeaway Note */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300 font-bold block mb-0.5">
                      The $0.50-$1.25/Mile Autonomous Moat:
                    </strong>
                    Because human drivers represent ~55-60% of legacy rideshare cost, removing the steering wheel and driver creates an insurmountable cost structure advantage. Private fleet owners achieve 100%+ annual cash ROIs while simultaneously lowering consumer ride prices by 50%+.
                  </div>
                </div>
              </div>

              {/* Leading Commercial Robotaxi Fleets Tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Waymo (Alphabet)</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Commercial Leader
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Over 150,000 paid commercial driverless rides per week across Phoenix, SF, LA, and Austin. Powered by 6th-gen Zeekr sensor suite.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Tesla Cybercab</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Vision-Only E2E
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Purpose-built 2-seater with inductive wireless charging. Sub-$30,000 build cost utilizing end-to-end neural net FSD without LiDAR.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Amazon Zoox</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Bidirectional
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Four-wheel steering, custom carriage seating for 4 passengers, 133 kWh battery pack designed for 16-hour continuous city dispatch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: HUMANOID BOM & LABOR ARBITRAGE */}
      {activeSubView === "humanoid_bom" && (
        <div className="space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Robot Operating Cost
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                ${humanoidMetrics.robotEffectiveHourly.toFixed(2)}
                <span className="text-xs text-neutral-400 font-normal"> / hour</span>
              </p>
              <span className="text-[10px] text-neutral-400 block">
                vs ${(humanHourlyWage * 1.25).toFixed(2)}/hr human fully-loaded
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Annual Labor Savings
              </span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                ${Math.round(humanoidMetrics.annualNetSavings).toLocaleString()}
                <span className="text-xs text-neutral-400 font-normal"> / station</span>
              </p>
              <span className="text-[10px] text-cyan-400 font-semibold block">
                {humanoidMetrics.totalAnnualHours.toLocaleString()} operational hours/yr
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Factory Payback Horizon
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                {humanoidMetrics.paybackMonths.toFixed(1)}
                <span className="text-xs text-neutral-400 font-normal"> Months</span>
              </p>
              <span className="text-[10px] text-amber-400 font-semibold block">
                Full hardware return &lt; 1 Year
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-purple-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                5-Year Net Value Added
              </span>
              <p className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                +${Math.round(humanoidMetrics.fiveYearNpvSavings / 1000).toLocaleString()}k
                <span className="text-xs text-neutral-400 font-normal"> NPV</span>
              </p>
              <span className="text-[10px] text-neutral-400 block">
                Per robotic workcell deployed
              </span>
            </div>
          </div>

          {/* Dials and Bill of Materials breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Humanoid Sensitivity Controls */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#06101c] border border-emerald-500/30 space-y-5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Factory Labor Sensitivity Dials
                </h3>
              </div>

              {/* Slider 1: Human Hourly Wage */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Human Base Hourly Wage:</span>
                  <span className="text-emerald-400 font-bold">${humanHourlyWage} / hour</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="60"
                  step="1"
                  value={humanHourlyWage}
                  onChange={(e) => setHumanHourlyWage(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                  <span>$16/hr (Warehouse)</span>
                  <span>$28/hr (Auto Assembly)</span>
                  <span>$50/hr (Specialized)</span>
                </div>
              </div>

              {/* Slider 2: Shift Count */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Factory Shifts per Day:</span>
                  <span className="text-cyan-400 font-bold">{shiftsPerDay} Shifts ({shiftsPerDay * 8}h / day)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={shiftsPerDay}
                  onChange={(e) => setShiftsPerDay(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                  <span>1 Shift (8h)</span>
                  <span>2 Shifts (16h)</span>
                  <span>3 Shifts (24h continuous)</span>
                </div>
              </div>

              {/* Slider 3: Humanoid Robot Unit Cost */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-300">Humanoid Purchase BOM:</span>
                  <span className="text-amber-300 font-bold">${robotUnitCost.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="80000"
                  step="2500"
                  value={robotUnitCost}
                  onChange={(e) => setRobotUnitCost(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                  <span>$16k (Unitree G1)</span>
                  <span>$25k (Optimus Target)</span>
                  <span>$75k+ (Low-volume)</span>
                </div>
              </div>

              {/* Electricity & Spare Parts */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
                <div className="text-[11px] font-bold text-neutral-300 border-b border-white/10 pb-1 flex justify-between">
                  <span>Annual Operating Expenses</span>
                  <span className="text-emerald-400 font-bold">
                    ${Math.round(humanoidMetrics.annualPowerCost + annualMaintSpareParts).toLocaleString()} / yr
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[10px]">
                  <span>Power ({robotKwhPerHour} kW @ ${electricityCostKwh}/kWh):</span>
                  <span className="text-neutral-200">${Math.round(humanoidMetrics.annualPowerCost).toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[10px]">
                  <span>Harmonic Actuator & Joint Spares:</span>
                  <span className="text-neutral-200">${annualMaintSpareParts.toLocaleString()}/yr</span>
                </div>
              </div>
            </div>

            {/* Humanoid Robot Bill of Materials (BOM) Teardown */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-2xl bg-[#081324] border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Humanoid Hardware Bill of Materials (BOM)
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Target Mass Production: ~$20k - $25k
                  </span>
                </div>

                {/* BOM Components Table */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">Harmonic Drive Actuators & Planetary Reducers (28-40 Joints)</strong>
                      <span className="text-neutral-400 text-[11px]">Key suppliers: Harmonic Drive SE, Nabtesco, Maxon</span>
                    </div>
                    <span className="text-emerald-300 font-mono font-bold text-sm">~$7,200 (34%)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">Dexterous Robotic Hands & Tactile Tactile Sensors (22 DOF)</strong>
                      <span className="text-neutral-400 text-[11px]">Tendon-driven, six-axis force-torque sensors on each fingertip</span>
                    </div>
                    <span className="text-cyan-300 font-mono font-bold text-sm">~$4,500 (21%)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">Onboard AI Inference Compute & Stereo Vision SoC</strong>
                      <span className="text-neutral-400 text-[11px]">NVIDIA Thor / Tesla AI5 / Qualcomm Robotics RB5 (500-1000 TOPS)</span>
                    </div>
                    <span className="text-amber-300 font-mono font-bold text-sm">~$3,100 (15%)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">2.3 kWh Structural Battery Pack & Power Distribution</strong>
                      <span className="text-neutral-400 text-[11px]">High energy-density pouch/cylindrical cells for 8h working runtime</span>
                    </div>
                    <span className="text-purple-300 font-mono font-bold text-sm">~$1,800 (9%)</span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white block">Carbon Fiber Exoskeleton & Structural Castings</strong>
                      <span className="text-neutral-400 text-[11px]">Lightweight titanium/aluminum structural bones (total weight &lt;55 kg)</span>
                    </div>
                    <span className="text-neutral-300 font-mono font-bold text-sm">~$2,400 (11%)</span>
                  </div>
                </div>

                {/* Major Humanoid Competitor Profiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-bold text-white">Tesla Optimus Gen 3</span>
                    <p className="text-[10px] text-neutral-400">
                      22-DOF dexterous hands, custom in-house actuators, end-to-end neural net training on video tele-op.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-bold text-white">Figure AI (Figure 02)</span>
                    <p className="text-[10px] text-neutral-400">
                      Integrated with OpenAI speech reasoning models, BMW factory assembly pilot, 6x compute increase.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-xs font-bold text-white">Boston Dynamics Atlas</span>
                    <p className="text-[10px] text-neutral-400">
                      All-electric platform with 360-degree joint rotations, automotive manufacturing pilot with Hyundai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PHYSICAL AI & ROBOTICS VALUE CHAIN TICKER MATRIX */}
      {activeSubView === "value_chain_tickers" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#081324] border border-amber-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  Physical AI, Actuators & Autonomous Vehicle Pure-Plays
                </h3>
                <p className="text-xs text-neutral-400">
                  Institutional breakdown of pure-play winners across compute, machine vision, actuators, and commercial fleets.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30 shrink-0">
                12 Tracked Leaders
              </span>
            </div>

            {/* Category Tier Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ticker 1: TSLA */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-cyan-500/40 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-cyan-300">$TSLA</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold">
                      Robotaxi & Humanoid
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$245.80</span>
                </div>
                <strong className="text-xs text-white block">Tesla, Inc.</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  End-to-End Neural Net Autonomous Driving (FSD v12+), Cybercab fleet economics, and Optimus Gen 3 mass production humanoid robotics.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Level 4 Autonomous / Physical AI</span>
                  <span className="text-cyan-400 font-bold">Max Asymmetry ★★★★★</span>
                </div>
              </div>

              {/* Ticker 2: GOOGL */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$GOOGL</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-bold">
                      Commercial AV Leader
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$178.60</span>
                </div>
                <strong className="text-xs text-white block">Alphabet Inc. (Waymo)</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Commercial L4 driverless market leader. 150k+ weekly paid passenger trips in San Francisco, Phoenix, LA, and Austin without safety drivers.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Commercial Robotaxi Fleet</span>
                  <span className="text-emerald-400 font-bold">L4 Scale Leader</span>
                </div>
              </div>

              {/* Ticker 3: AUR */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-amber-300">$AUR</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                      Autonomous Trucking
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$5.40</span>
                </div>
                <strong className="text-xs text-white block">Aurora Innovation</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Aurora Driver commercial Class-8 heavy autonomous freight corridor between Dallas and Houston. Backed by Uber, PACCAR, and Volvo Trucks.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Autonomous Long-Haul Logistics</span>
                  <span className="text-amber-400 font-bold">Pure-Play AV</span>
                </div>
              </div>

              {/* Ticker 4: ISRG */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$ISRG</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold">
                      Surgical Robotics
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$498.20</span>
                </div>
                <strong className="text-xs text-white block">Intuitive Surgical, Inc.</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  da Vinci 5 multi-quadrant surgical robotic manipulation system with force feedback sensing and 10,000x compute increase for precision medicine.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Medical & Precision Robotics</span>
                  <span className="text-purple-400 font-bold">Moat: Razor & Blade</span>
                </div>
              </div>

              {/* Ticker 5: SYM */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$SYM</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-bold">
                      AI Warehouse Robotics
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$38.40</span>
                </div>
                <strong className="text-xs text-white block">Symbotic Inc.</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Autonomous mobile fleet bots for mega-scale supply chain fulfillment for Walmart, Target, and Albertsons. High-density vertical buffer automation.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Supply Chain Automation</span>
                  <span className="text-emerald-400 font-bold">Contract Backlog $23B+</span>
                </div>
              </div>

              {/* Ticker 6: TER */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$TER</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30 font-bold">
                      Industrial Cobots
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$122.50</span>
                </div>
                <strong className="text-xs text-white block">Teradyne (Universal Robots & MiR)</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Global market leader in collaborative robotic arms (Universal Robots UR) and Mobile Industrial Autonomous Mobile Robots (MiR).
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Collaborative Robotic Arms</span>
                  <span className="text-blue-400 font-bold">Global Cobot Leader</span>
                </div>
              </div>

              {/* Ticker 7: CGNX */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$CGNX</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold">
                      Machine Vision
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$42.80</span>
                </div>
                <strong className="text-xs text-white block">Cognex Corporation</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  High-speed industrial machine vision sensors, 3D laser profiling cameras, and deep learning vision systems powering robotic assembly.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Industrial Vision & Perception</span>
                  <span className="text-cyan-400 font-bold">High Gross Margins</span>
                </div>
              </div>

              {/* Ticker 8: OUST */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$OUST</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold">
                      Digital LiDAR
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$18.90</span>
                </div>
                <strong className="text-xs text-white block">Ouster, Inc.</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Digital flash LiDAR sensors for robotics, autonomous smart infrastructure, agriculture, and industrial mobile robots.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Solid-State & Digital LiDAR</span>
                  <span className="text-purple-400 font-bold">Robotics Sensor Pure-Play</span>
                </div>
              </div>

              {/* Ticker 9: MBLY */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-white">$MBLY</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-bold">
                      ADAS & AV Compute
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">$15.20</span>
                </div>
                <strong className="text-xs text-white block">Mobileye Global</strong>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  EyeQ6 silicon, SuperVision, and Chauffeur hands-free/eyes-off autonomous platforms deployed across global automotive OEMs.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/10">
                  <span>Stack: Automotive AV Silicon & Software</span>
                  <span className="text-emerald-400 font-bold">180M+ Cars Deployed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DISENGAGEMENT & SAFETY BENCHMARK RADAR */}
      {activeSubView === "disengagement_radar" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#081324] border border-purple-500/30 space-y-5">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-purple-400" />
                Autonomous Disengagement & Safety Benchmark Radar
              </h3>
              <p className="text-xs text-neutral-400">
                Miles driven between safety driver interventions based on California DMV filings, real-world fleet telemetry, and commercial deployment logs.
              </p>
            </div>

            {/* Radar Comparison Table */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Waymo (Alphabet)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      17,300+ Miles per Disengagement
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">5th/6th Gen Multi-Sensor (LiDAR + Radar + Cameras)</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-[95%]" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Operates fully driverless passenger transport with &gt;85% reduction in injury-causing collisions compared to human driver baselines across 25M+ commercial driverless miles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Tesla FSD Unsupervised (Vision-Only End-to-End)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      ~10,000+ Critical Miles per Disengagement (v13+ Target)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold">Vision-Only 8 Cameras (No LiDAR/HD Maps)</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[78%]" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Global fleet of over 6 million customer vehicles accumulating &gt;2 billion real-world miles, trained via generative AI world models and pure photon-to-control neural networks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Zoox (Amazon)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      12,000+ Miles per Disengagement
                    </span>
                  </div>
                  <span className="text-xs font-mono text-purple-400 font-bold">360° Symmetrical Redundant Sensor Architecture</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full w-[82%]" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Designed specifically for urban core high-density routes with no manual steering wheel, dual independent powertrain units, and bidirectional travel capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
