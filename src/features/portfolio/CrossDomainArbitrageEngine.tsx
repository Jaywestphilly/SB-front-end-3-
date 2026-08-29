import React, { useState, useMemo } from "react";
import {
  Building2,
  Zap,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Sliders,
  DollarSign,
  Calculator,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

export const CrossDomainArbitrageEngine: React.FC = () => {
  // Real Estate & Power Substation Conversion Inputs
  const [substationCapacityMw, setSubstationCapacityMw] = useState<number>(25); // 25 Megawatts
  const [acquisitionCostMillions, setAcquisitionCostMillions] = useState<number>(8.5); // $8.5M warehouse acquisition
  const [zeroPercentCreditStack, setZeroPercentCreditStack] = useState<number>(250000); // $250k 0% business credit
  const [hyperscaleLeaseRateKwMonth, setHyperscaleLeaseRateKwMonth] = useState<number>(145); // $145/kW/month triple-net
  const [gridEnergizationStatus, setGridEnergizationStatus] = useState<"ACTIVE_ENERGIZED" | "SUBSTATION_APPROVED" | "QUEUE_PENDING">("ACTIVE_ENERGIZED");

  const financialModel = useMemo(() => {
    // 1 MW = 1,000 kW
    const totalKw = substationCapacityMw * 1000;
    
    // Status multipliers for enterprise datacenter valuation
    const statusValuationPerMw = 
      gridEnergizationStatus === "ACTIVE_ENERGIZED" ? 3.5 : // $3.5M per MW buyout value
      gridEnergizationStatus === "SUBSTATION_APPROVED" ? 1.8 : 0.6; // $1.8M / $0.6M per MW

    const grossAnnualLeaseRevenue = (totalKw * hyperscaleLeaseRateKwMonth * 12) / 1_000_000; // in Millions
    const netOperatingIncome = grossAnnualLeaseRevenue * 0.88; // 88% NOI after management/insurance
    const estimatedEnterpriseBuyout = substationCapacityMw * statusValuationPerMw; // in Millions
    const equityCreated = Math.max(0, estimatedEnterpriseBuyout - acquisitionCostMillions);
    const returnOnInvestedCapital = acquisitionCostMillions > 0 ? (equityCreated / acquisitionCostMillions) * 100 : 0;
    const interestSaved0Percent = (zeroPercentCreditStack * 0.18); // assuming 18% APR saved vs conventional debt

    return {
      totalKw,
      grossAnnualLeaseRevenue: grossAnnualLeaseRevenue.toFixed(2),
      netOperatingIncome: netOperatingIncome.toFixed(2),
      estimatedEnterpriseBuyout: estimatedEnterpriseBuyout.toFixed(2),
      equityCreated: equityCreated.toFixed(2),
      returnOnInvestedCapital: returnOnInvestedCapital.toFixed(0),
      interestSaved0Percent: Math.round(interestSaved0Percent),
      monthlyCashFlow: Math.round((netOperatingIncome * 1_000_000) / 12)
    };
  }, [substationCapacityMw, acquisitionCostMillions, zeroPercentCreditStack, hyperscaleLeaseRateKwMonth, gridEnergizationStatus]);

  return (
    <div className="space-y-6 font-sans">
      {/* BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#061c14] via-[#09261b] to-[#020d09] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Cross-Domain Asymmetry Engine
          </span>
          <span className="text-xs font-mono font-bold text-neutral-400">
            Real Estate + 0% Credit + AI Compute Arbitrage
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Brownfield Datacenter & Power Substation Conversion Model
        </h2>
        <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed mt-1.5">
          Wall Street prices datacenter operators at 25x multiples, but the underlying assets are physical warehouses with energized power substations. Use this institutional model to calculate the enterprise buyout premium of converting commercial real estate into high-density AI hosting campuses.
        </p>

        {/* METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Enterprise Buyout Value</span>
            <p className="text-base font-black text-emerald-300 font-mono">${financialModel.estimatedEnterpriseBuyout}M</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Net Value Created</span>
            <p className="text-base font-black text-cyan-400 font-mono">+${financialModel.equityCreated}M</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Projected Net ROI</span>
            <p className="text-base font-black text-amber-300 font-mono">{financialModel.returnOnInvestedCapital}%</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Monthly Net Cash Flow</span>
            <p className="text-base font-black text-purple-300 font-mono">${(financialModel.monthlyCashFlow / 1000).toFixed(0)}k/mo</p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Asset & Energization Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SUBSTATION POWER */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-300 font-bold">Substation Energized Capacity</span>
                <span className="text-emerald-300 font-bold">{substationCapacityMw} MW ({substationCapacityMw * 1000} kW)</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={substationCapacityMw}
                onChange={(e) => setSubstationCapacityMw(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>5 MW (Small Edge)</span>
                <span>100 MW (Hyperscale Mega-Campus)</span>
              </div>
            </div>

            {/* ACQUISITION COST */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-300 font-bold">Warehouse Acquisition Cost</span>
                <span className="text-cyan-300 font-bold">${acquisitionCostMillions} Million</span>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                step={0.5}
                value={acquisitionCostMillions}
                onChange={(e) => setAcquisitionCostMillions(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$2M (Distressed Industrial)</span>
                <span>$40M (Prime Suburb)</span>
              </div>
            </div>

            {/* LEASE RATE */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-300 font-bold">Hyperscale Lease Rate / kW / Mo</span>
                <span className="text-amber-300 font-bold">${hyperscaleLeaseRateKwMonth} / kW / mo</span>
              </div>
              <input
                type="range"
                min={90}
                max={250}
                step={5}
                value={hyperscaleLeaseRateKwMonth}
                onChange={(e) => setHyperscaleLeaseRateKwMonth(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$90/kW (Wholesale Shell)</span>
                <span>$250/kW (Powered Shell + Liquid)</span>
              </div>
            </div>

            {/* 0% CREDIT STACK */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-neutral-300 font-bold">0% Business Credit Stack (Working Cap)</span>
                <span className="text-purple-300 font-bold">${(zeroPercentCreditStack / 1000).toFixed(0)}k at 0% APR</span>
              </div>
              <input
                type="range"
                min={50000}
                max={500000}
                step={25000}
                value={zeroPercentCreditStack}
                onChange={(e) => setZeroPercentCreditStack(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>$50k (1 Entity)</span>
                <span>$500k (Multi-Entity Stacking)</span>
              </div>
            </div>
          </div>

          {/* GRID STATUS TOGGLE */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <span className="text-xs font-bold text-neutral-300 font-mono">
              Utility Interconnection & Transformer Status
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ACTIVE_ENERGIZED", label: "⚡ Active Energized", desc: "$3.5M / MW Multiple" },
                { id: "SUBSTATION_APPROVED", label: "📋 Permitted / Approved", desc: "$1.8M / MW Multiple" },
                { id: "QUEUE_PENDING", label: "⏳ Queue Pending (3-5 Yr)", desc: "$0.6M / MW Multiple" }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setGridEnergizationStatus(st.id as any);
                  }}
                  className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                    gridEnergizationStatus === st.id
                      ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <span className="text-xs font-bold font-mono block text-white">{st.label}</span>
                  <span className="text-[10px] font-mono text-neutral-400">{st.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 0% ARBITRAGE BLUEPRINT */}
        <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3.5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3 font-mono">
              <CreditCard className="w-4 h-4 text-purple-400" />
              0% APR Arbitrage Breakdown
            </h3>

            <div className="space-y-2.5 text-xs mt-3">
              <div className="p-3 rounded-xl bg-neutral-900/90 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">
                  Annual Interest Avoided
                </span>
                <p className="text-base font-black text-white font-mono">
                  +${financialModel.interestSaved0Percent.toLocaleString()} / year
                </p>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  By utilizing 0% APR 12-to-18 month introductory business credit lines for architectural pre-development and deposits.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/90 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">
                  Annual Net Operating Income (NOI)
                </span>
                <p className="text-base font-black text-emerald-400 font-mono">
                  ${financialModel.netOperatingIncome}M / year
                </p>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Long-term 15-year triple-net (NNN) lease backed by investment-grade hyperscalers.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>100% Free Unlocked Tool for StockBloc Investors</span>
          </div>
        </div>
      </div>
    </div>
  );
};
