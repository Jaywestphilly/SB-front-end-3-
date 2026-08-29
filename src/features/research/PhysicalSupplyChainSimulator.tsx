import React, { useState, useMemo } from "react";
import {
  Zap,
  Cpu,
  Flame,
  Activity,
  Sliders,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Building2,
  RefreshCw,
  Info,
  CheckCircle2,
  Share2,
  Download
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

interface LayerImpact {
  level: number;
  layerName: string;
  sharePercent: number;
  projectedRevenue: number; // in Billions
  bottleneckSeverity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  growthRate: number; // YoY %
  topPurePlays: Array<{
    ticker: string;
    company: string;
    asymmetryScore: number;
    catalyst: string;
    projectedMargin: string;
  }>;
  chokepointAnalysis: string;
}

export const PhysicalSupplyChainSimulator: React.FC = () => {
  // Simulator Controls
  const [totalCapexBillions, setTotalCapexBillions] = useState<number>(280); // $280B base hyperscaler annual capex
  const [transformerDelayMonths, setTransformerDelayMonths] = useState<number>(36); // 36 months average
  const [nuclearPpaGigawatts, setNuclearPpaGigawatts] = useState<number>(15); // 15 GW
  const [liquidCoolingPenetration, setLiquidCoolingPenetration] = useState<number>(65); // 65% liquid cooling adoption
  const [opticalSpeed, setOpticalSpeed] = useState<"800G" | "1.6T" | "3.2T">("1.6T");
  const [copperSupplyDeficit, setCopperSupplyDeficit] = useState<number>(18); // 18% deficit
  const [selectedLayerLevel, setSelectedLayerLevel] = useState<number | null>(null);

  // Dynamic Cascade Calculations
  const simulationResults = useMemo(() => {
    // Multipliers derived from real physics and supply constraints
    const capexScale = totalCapexBillions / 200; // normalized to $200B baseline
    const powerBottleneckMultiplier = (transformerDelayMonths / 24) * (1 + (20 - nuclearPpaGigawatts) * 0.02);
    const coolingMultiplier = (liquidCoolingPenetration / 50);
    const opticalMultiplier = opticalSpeed === "3.2T" ? 1.6 : opticalSpeed === "1.6T" ? 1.3 : 1.0;
    const commodityMultiplier = 1 + (copperSupplyDeficit / 100) * 1.5;

    const layers: LayerImpact[] = [
      {
        level: 1,
        layerName: "Hyperscalers & Sovereign Clouds",
        sharePercent: 100,
        projectedRevenue: totalCapexBillions,
        bottleneckSeverity: "MODERATE",
        growthRate: Math.round(28 * capexScale),
        topPurePlays: [
          { ticker: "MSFT", company: "Microsoft Azure", asymmetryScore: 92, catalyst: "OpenAI exclusive cloud & Copilot monetized run-rate", projectedMargin: "44%" },
          { ticker: "GOOGL", company: "Alphabet / GCP", asymmetryScore: 94, catalyst: "Trillium TPU v6 cost-efficiency & Gemini multimodal integration", projectedMargin: "41%" },
          { ticker: "AMZN", company: "Amazon AWS", asymmetryScore: 90, catalyst: "Trainium2 hyperscale cluster deployments & Bedrock", projectedMargin: "38%" },
          { ticker: "ORCL", company: "Oracle Cloud OCI", asymmetryScore: 96, catalyst: "Bare-metal GPU superclusters for xAI and OpenAI", projectedMargin: "36%" }
        ],
        chokepointAnalysis: "Hyperscaler cash-flow generation remains staggering, but deployment velocity is gated entirely by physical substation power delivery."
      },
      {
        level: 2,
        layerName: "Baseload Power, Nuclear & Fuel Cells",
        sharePercent: 16,
        projectedRevenue: Math.round(totalCapexBillions * 0.16 * powerBottleneckMultiplier),
        bottleneckSeverity: transformerDelayMonths > 30 ? "CRITICAL" : "HIGH",
        growthRate: Math.round(42 * powerBottleneckMultiplier),
        topPurePlays: [
          { ticker: "CEG", company: "Constellation Energy", asymmetryScore: 98, catalyst: "835MW Three Mile Island 20-year exclusive PPA with Microsoft", projectedMargin: "58%" },
          { ticker: "VST", company: "Vistra Corp", asymmetryScore: 95, catalyst: "Comanche Peak nuclear fleet & ERCOT power price spikes", projectedMargin: "52%" },
          { ticker: "TLN", company: "Talen Energy", asymmetryScore: 96, catalyst: "2.5GW Susquehanna nuclear campus co-located with AWS", projectedMargin: "61%" },
          { ticker: "BE", company: "Bloom Energy", asymmetryScore: 93, catalyst: "Behind-the-meter solid oxide fuel cells bypassing 5-yr utility queue", projectedMargin: "39%" }
        ],
        chokepointAnalysis: "Datacenter operators are paying 300% premiums for behind-the-meter nuclear and on-site fuel cells to bypass 5-year interconnection queues."
      },
      {
        level: 3,
        layerName: "Grid Infrastructure, High-Voltage & EPC",
        sharePercent: 12,
        projectedRevenue: Math.round(totalCapexBillions * 0.12 * powerBottleneckMultiplier * 1.15),
        bottleneckSeverity: "CRITICAL",
        growthRate: Math.round(38 * powerBottleneckMultiplier),
        topPurePlays: [
          { ticker: "ETN", company: "Eaton Corporation", asymmetryScore: 97, catalyst: "Multi-billion substation transformer backlog extending to 2028", projectedMargin: "33%" },
          { ticker: "GEV", company: "GE Vernova", asymmetryScore: 94, catalyst: "Heavy-duty gas turbines & grid electrical transmission solutions", projectedMargin: "29%" },
          { ticker: "PWR", company: "Quanta Services", asymmetryScore: 91, catalyst: "Premier EPC contractor building high-voltage transmission lines", projectedMargin: "21%" },
          { ticker: "POWL", company: "Powell Industries", asymmetryScore: 95, catalyst: "Custom switchgear & power distribution for mega-datacenters", projectedMargin: "36%" }
        ],
        chokepointAnalysis: "Large power transformers (LPTs) currently have 36 to 48 month lead times. High pricing power allows Eaton and Powell to lock in record gross margins."
      },
      {
        level: 4,
        layerName: "Direct Liquid Cooling & Thermal Dissipation",
        sharePercent: 9,
        projectedRevenue: Math.round(totalCapexBillions * 0.09 * coolingMultiplier),
        bottleneckSeverity: liquidCoolingPenetration > 60 ? "HIGH" : "MODERATE",
        growthRate: Math.round(55 * coolingMultiplier),
        topPurePlays: [
          { ticker: "VRT", company: "Vertiv Holdings", asymmetryScore: 98, catalyst: "Coolant Distribution Units (CDUs) & liquid manifolds for NVIDIA Blackwell", projectedMargin: "42%" },
          { ticker: "MOD", company: "Modine Manufacturing", asymmetryScore: 92, catalyst: "Chillers & precision datacenter evaporative cooling systems", projectedMargin: "28%" },
          { ticker: "NVT", company: "nVent Electric", asymmetryScore: 91, catalyst: "Liquid cooling manifolds and high-density server rack enclosures", projectedMargin: "34%" }
        ],
        chokepointAnalysis: "Next-gen AI chips consume 1,200W+ per processor, making legacy air-cooling physically obsolete. Liquid-to-chip CDUs are a mandatory hardware bottleneck."
      },
      {
        level: 5,
        layerName: "Optical Interconnects & Photonics",
        sharePercent: 11,
        projectedRevenue: Math.round(totalCapexBillions * 0.11 * opticalMultiplier),
        bottleneckSeverity: opticalSpeed === "3.2T" ? "CRITICAL" : "HIGH",
        growthRate: Math.round(48 * opticalMultiplier),
        topPurePlays: [
          { ticker: "COHR", company: "Coherent Corp", asymmetryScore: 97, catalyst: "800G/1.6T EML lasers and Optical Transceivers for GPU superclusters", projectedMargin: "45%" },
          { ticker: "ANET", company: "Arista Networks", asymmetryScore: 95, catalyst: "Ethernet switching dominance in AI backend fabrics", projectedMargin: "64%" },
          { ticker: "CRDO", company: "Credo Technology", asymmetryScore: 94, catalyst: "Active Electrical Cables (AEC) and low-power SerDes DSPs", projectedMargin: "59%" },
          { ticker: "LITE", company: "Lumentum Holdings", asymmetryScore: 92, catalyst: "High-power continuous wave (CW) lasers for Co-Packaged Optics", projectedMargin: "38%" }
        ],
        chokepointAnalysis: "Copper cables hit severe physical distance limits at 1.6T speeds. Scale-up GPU clusters require thousands of photonic transceivers per rack."
      },
      {
        level: 6,
        layerName: "Silicon Processors, CoWoS Packaging & WFE",
        sharePercent: 32,
        projectedRevenue: Math.round(totalCapexBillions * 0.32 * capexScale),
        bottleneckSeverity: "HIGH",
        growthRate: Math.round(35 * capexScale),
        topPurePlays: [
          { ticker: "NVDA", company: "NVIDIA Corporation", asymmetryScore: 99, catalyst: "Blackwell B200 / GB200 full-stack computing monopoly", projectedMargin: "75%" },
          { ticker: "TSM", company: "Taiwan Semiconductor", asymmetryScore: 98, catalyst: "CoWoS advanced packaging monopoly & 3nm/2nm foundry nodes", projectedMargin: "54%" },
          { ticker: "ASML", company: "ASML Holding", asymmetryScore: 96, catalyst: "High-NA Extreme Ultraviolet (EUV) lithography systems", projectedMargin: "51%" },
          { ticker: "AMAT", company: "Applied Materials", asymmetryScore: 92, catalyst: "Deposition & etch tools for complex multi-die 3D stacking", projectedMargin: "47%" }
        ],
        chokepointAnalysis: "TSMC CoWoS advanced packaging capacity remains booked solid for the next 18 months, limiting total worldwide AI accelerator production."
      },
      {
        level: 7,
        layerName: "High-Bandwidth Memory (HBM) & Mass Storage",
        sharePercent: 14,
        projectedRevenue: Math.round(totalCapexBillions * 0.14 * capexScale),
        bottleneckSeverity: "HIGH",
        growthRate: Math.round(44 * capexScale),
        topPurePlays: [
          { ticker: "MU", company: "Micron Technology", asymmetryScore: 96, catalyst: "HBM3E 12-high memory yield ramp for NVIDIA and AMD GPUs", projectedMargin: "48%" },
          { ticker: "WDC", company: "Western Digital", asymmetryScore: 90, catalyst: "Enterprise high-capacity Nearline HDDs & NAND flash memory", projectedMargin: "36%" },
          { ticker: "PSTG", company: "Pure Storage", asymmetryScore: 92, catalyst: "All-flash enterprise arrays displacing legacy disk in AI inference", projectedMargin: "71%" }
        ],
        chokepointAnalysis: "HBM3E memory requires 3x the silicon wafer area of standard DDR5 DRAM, starving traditional memory supply and causing a sharp memory supercycle."
      },
      {
        level: 8,
        layerName: "Physical Commodities, Space & Site Conversions",
        sharePercent: 8,
        projectedRevenue: Math.round(totalCapexBillions * 0.08 * commodityMultiplier),
        bottleneckSeverity: copperSupplyDeficit > 15 ? "CRITICAL" : "MODERATE",
        growthRate: Math.round(32 * commodityMultiplier),
        topPurePlays: [
          { ticker: "FCX", company: "Freeport-McMoRan", asymmetryScore: 95, catalyst: "Massive copper supply deficit driven by datacenter electrification", projectedMargin: "46%" },
          { ticker: "CPER", company: "United States Copper Index", asymmetryScore: 91, catalyst: "Direct commodity price exposure to global electrification", projectedMargin: "N/A" },
          { ticker: "CORZ", company: "Core Scientific", asymmetryScore: 97, catalyst: "Converting 500MW+ energized crypto sites into AI GPU hosting", projectedMargin: "55%" },
          { ticker: "RKLB", company: "Rocket Lab USA", asymmetryScore: 93, catalyst: "Neutron medium-lift rocket & satellite bus constellation deployment", projectedMargin: "31%" }
        ],
        chokepointAnalysis: "Each 1GW datacenter requires over 50,000 metric tons of copper. Energized sites with existing substations are being acquired at up to $5M per Megawatt."
      }
    ];

    const totalCascadedRevenue = layers.reduce((acc, l) => acc + l.projectedRevenue, 0);

    return {
      layers,
      totalCascadedRevenue,
      highestGrowthLayer: [...layers].sort((a, b) => b.growthRate - a.growthRate)[0],
      mostSevereBottleneck: layers.find((l) => l.bottleneckSeverity === "CRITICAL") || layers[1]
    };
  }, [totalCapexBillions, transformerDelayMonths, nuclearPpaGigawatts, liquidCoolingPenetration, opticalSpeed, copperSupplyDeficit]);

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c081e] via-[#120b2e] to-[#04020a] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Physics & Capital Arbitrage Engine
          </span>
          <span className="text-xs font-mono font-bold text-neutral-400">
            Real-Time CapEx Cascade Model
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Physical Constraint & Supply Chain Bottleneck Simulator
        </h2>
        <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed mt-1.5">
          Simulate how hundreds of billions of dollars in AI CapEx physically flow through the global supply chain. Adjust real-world physical constraints—transformer lead times, nuclear PPAs, liquid cooling adoption, and copper deficits—to uncover high-asymmetry pure plays before the market prices them.
        </p>

        {/* KEY HIGHLIGHT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Total Annual CapEx</span>
            <p className="text-base font-black text-cyan-300 font-mono">${totalCapexBillions}B</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Cascaded Total Flow</span>
            <p className="text-base font-black text-emerald-400 font-mono">${simulationResults.totalCascadedRevenue}B</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Fastest Growing Tier</span>
            <p className="text-xs font-bold text-amber-300 truncate">{simulationResults.highestGrowthLayer.layerName}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-white/5 space-y-0.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Primary Chokepoint</span>
            <p className="text-xs font-bold text-rose-400 truncate">{simulationResults.mostSevereBottleneck.layerName}</p>
          </div>
        </div>
      </div>

      {/* CONTROLS DASHBOARD */}
      <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Physical Constraint Inputs & Sliders
          </h3>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setTotalCapexBillions(280);
              setTransformerDelayMonths(36);
              setNuclearPpaGigawatts(15);
              setLiquidCoolingPenetration(65);
              setOpticalSpeed("1.6T");
              setCopperSupplyDeficit(18);
            }}
            className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* SLIDER 1: Hyperscaler CapEx */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300 font-bold">Hyperscaler Annual CapEx</span>
              <span className="text-cyan-300 font-bold">${totalCapexBillions} Billion</span>
            </div>
            <input
              type="range"
              min={100}
              max={600}
              step={10}
              value={totalCapexBillions}
              onChange={(e) => setTotalCapexBillions(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>$100B (Conservative)</span>
              <span>$600B (Supercycle)</span>
            </div>
          </div>

          {/* SLIDER 2: Transformer Delay */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300 font-bold">LPT Transformer Lead Time</span>
              <span className="text-amber-300 font-bold">{transformerDelayMonths} Months</span>
            </div>
            <input
              type="range"
              min={12}
              max={60}
              step={3}
              value={transformerDelayMonths}
              onChange={(e) => setTransformerDelayMonths(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>12 Mo (Fast Grid)</span>
              <span>60 Mo (Severe Backlog)</span>
            </div>
          </div>

          {/* SLIDER 3: Nuclear & Behind-the-Meter PPAs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300 font-bold">Direct Nuclear / SMR PPAs</span>
              <span className="text-emerald-300 font-bold">{nuclearPpaGigawatts} GW Allocated</span>
            </div>
            <input
              type="range"
              min={2}
              max={40}
              step={1}
              value={nuclearPpaGigawatts}
              onChange={(e) => setNuclearPpaGigawatts(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>2 GW (Early Pilot)</span>
              <span>40 GW (Hyperscale Baseline)</span>
            </div>
          </div>

          {/* SLIDER 4: Liquid Cooling Adoption */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300 font-bold">Liquid-to-Chip Penetration</span>
              <span className="text-cyan-300 font-bold">{liquidCoolingPenetration}% of Racks</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={liquidCoolingPenetration}
              onChange={(e) => setLiquidCoolingPenetration(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>10% (Air Dominant)</span>
              <span>100% (Pure Liquid)</span>
            </div>
          </div>

          {/* SELECTOR 5: Optical Speed Standard */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300 font-bold">Optical Network Speed</span>
              <span className="text-purple-300 font-bold">{opticalSpeed} Interconnect</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["800G", "1.6T", "3.2T"] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    triggerHaptic("selection");
                    setOpticalSpeed(spd);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    opticalSpeed === spd
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                      : "bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {/* SLIDER 6: Copper Deficit */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-300 font-bold">Global Copper Supply Deficit</span>
              <span className="text-rose-300 font-bold">{copperSupplyDeficit}% Shortfall</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={2}
              value={copperSupplyDeficit}
              onChange={(e) => setCopperSupplyDeficit(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>0% (Balanced)</span>
              <span>40% (Extreme Squeeze)</span>
            </div>
          </div>
        </div>
      </div>

      {/* CASCADE OUTPUT HIERARCHY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Cascaded Value Distribution by Layer
            </h3>
            <p className="text-xs text-neutral-400">
              Click any layer to view detailed pure-play asymmetry ratings and pricing power catalysts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulationResults.layers.map((layer) => {
            const isSelected = selectedLayerLevel === layer.level;
            const severityColor =
              layer.bottleneckSeverity === "CRITICAL"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : layer.bottleneckSeverity === "HIGH"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";

            return (
              <div
                key={layer.level}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedLayerLevel(isSelected ? null : layer.level);
                }}
                className={`p-5 rounded-2xl bg-black/60 border transition-all cursor-pointer shadow-xl space-y-3 ${
                  isSelected
                    ? "border-cyan-400 ring-1 ring-cyan-400/50 bg-neutral-900/90"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-mono font-black text-sm text-white border border-white/20">
                      L{layer.level}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{layer.layerName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold border ${severityColor}`}>
                          {layer.bottleneckSeverity} BOTTLENECK
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          +{layer.growthRate}% YoY Growth
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs text-neutral-400 block">Est. Revenue</span>
                    <span className="text-base font-black text-cyan-300">${layer.projectedRevenue}B</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {layer.chokepointAnalysis}
                </p>

                {/* Pure plays preview */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase">
                    <span>Key Beneficiaries & Asymmetry</span>
                    <span>Projected Margin</span>
                  </div>

                  <div className="space-y-1.5">
                    {layer.topPurePlays.map((stock) => (
                      <div
                        key={stock.ticker}
                        className="p-2 rounded-xl bg-neutral-900/90 border border-white/5 flex items-center justify-between text-xs hover:border-cyan-400/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {stock.ticker}
                          </span>
                          <div>
                            <span className="font-bold text-white block text-[11px]">{stock.company}</span>
                            <span className="text-[10px] text-neutral-400 line-clamp-1">{stock.catalyst}</span>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0 pl-2">
                          <span className="text-emerald-400 font-bold text-xs">{stock.projectedMargin}</span>
                          <span className="text-[10px] text-amber-300 block">★ {stock.asymmetryScore}/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
