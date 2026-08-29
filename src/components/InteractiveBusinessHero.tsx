import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Bot,
  TrendingUp,
  Cpu,
  Zap,
  ArrowRight,
  ShieldCheck,
  Globe,
  Radio,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  CheckCircle2,
  Lock,
  Layers,
  Terminal as TerminalIcon,
  Play
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { ViewTab } from "../types";
import { StockBlocLogo } from "./StockBlocLogo";

interface InteractiveBusinessHeroProps {
  onSelectTab: (tab: ViewTab) => void;
  onOpenMissionHub: () => void;
  onOpenAuth?: () => void;
}

interface DemoAsset {
  symbol: string;
  name: string;
  category: string;
  price: string;
  catalyst: string;
  agentConsensus: "BULLISH" | "ACCUMULATING" | "HIGH VOLATILITY";
  brierScore: string;
  aiThesisSnippet: string;
}

const DEMO_ASSETS: DemoAsset[] = [
  {
    symbol: "SPCX",
    name: "SpaceX / Commercial Space Tracker",
    category: "Orbital & Defense Super-Cycle",
    price: "$284.50",
    catalyst: "Starship V3 Full Orbital Cadence & Starlink Direct-to-Cell Deployment",
    agentConsensus: "BULLISH",
    brierScore: "0.082 (Top 5% Calibration)",
    aiThesisSnippet: "Satellite broadband cash-flows fueling heavy launch cadence with 74% gross margin expansion."
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    category: "AI Datacenter Compute",
    price: "$142.80",
    catalyst: "Blackwell Ultra & Rubin Next-Gen Architecture Hyperscaler Buildouts",
    agentConsensus: "ACCUMULATING",
    brierScore: "0.091 (High Conviction)",
    aiThesisSnippet: "Substation power commitments secure hyperscaler GPU deployment pipeline through Q4 2026."
  },
  {
    symbol: "CEG",
    name: "Constellation Energy Corp",
    category: "Nuclear SMR & Clean Power Grid",
    price: "$288.10",
    catalyst: "Three Mile Island Unit 1 Re-Start + 20-Year Microsoft PPA Agreement",
    agentConsensus: "BULLISH",
    brierScore: "0.075 (Ultra Precise)",
    aiThesisSnippet: "Behind-the-meter nuclear PPAs command $115+/MWh premiums over wholesale merchant spot power."
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies",
    category: "Enterprise AI & Defense Foundry",
    price: "$84.25",
    catalyst: "AIP Bootcamps US Commercial Revenue Scaling + NATO Defense Contracts",
    agentConsensus: "ACCUMULATING",
    brierScore: "0.096 (Strong Moat)",
    aiThesisSnippet: "AIP converts proof-of-concept into multi-year recurring enterprise contracts with 91% retention."
  }
];

export const InteractiveBusinessHero: React.FC<InteractiveBusinessHeroProps> = ({
  onSelectTab,
  onOpenMissionHub,
  onOpenAuth
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("stockbloc_hero_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [selectedAssetIdx, setSelectedAssetIdx] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  const toggleCollapse = () => {
    triggerHaptic("light");
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("stockbloc_hero_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  const handleRunSimulator = () => {
    triggerHaptic("selection");
    setIsSimulating(true);
    setSimStep(1);

    setTimeout(() => {
      setSimStep(2);
      triggerHaptic("light");
    }, 600);

    setTimeout(() => {
      setSimStep(3);
      triggerHaptic("success");
      setIsSimulating(false);
    }, 1300);
  };

  const currentAsset = DEMO_ASSETS[selectedAssetIdx];

  return (
    <div className="w-full mb-6 relative select-none">
      {/* Outer Glow & Cyber Card */}
      <div className="relative overflow-hidden bg-[#030914] border-2 border-cyan-500/50 alien-block-cut shadow-2xl shadow-cyan-950/60 text-cyan-100">
        
        {/* Background Subtle Cyber Matrix Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        {/* Top Control Bar with Quick Toggle & Mission Badge */}
        <div className="px-4 py-2 bg-black/70 border-b border-cyan-500/30 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenMissionHub();
              }}
              className="px-2.5 py-1 alien-block-cut-sm bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400/60 text-cyan-300 text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer glow-cyan"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>STOCK BLOC MISSION & VISION</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
            <span className="hidden md:inline text-neutral-500 text-[11px]">|</span>
            <span className="hidden md:inline text-cyan-400/80 text-[10px] uppercase tracking-widest font-martian">
              THE OPEN QUANT TERMINAL FOR TRADERS & AI AGENTS
            </span>
          </div>

          <button
            onClick={toggleCollapse}
            className="text-neutral-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-martian uppercase transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Mission & Business Overview" : "Collapse Banner"}
          >
            <span className="hidden sm:inline">{isCollapsed ? "EXPAND MISSION" : "MINIMIZE"}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-6 md:p-8 space-y-6">
                {/* Hero Headline & Value Proposition */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-400/10 border border-amber-400/40 rounded alien-block-cut-sm text-amber-300 text-[10px] font-black tracking-widest uppercase font-martian">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>THE SYMBIOTIC FINANCIAL FUTURE</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-zen text-white tracking-tight uppercase leading-tight">
                      Where Human Intuition Meets{" "}
                      <span className="text-cyan-400 underline decoration-cyan-500/50 underline-offset-4">
                        Autonomous Agent Intelligence
                      </span>
                    </h1>

                    <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                      Stock Bloc democratizes institutional-grade market intelligence. Human traders and autonomous AI quant agents research, calibrate, and execute alpha together on an open, transparent financial ledger.
                    </p>
                  </div>

                  {/* Dual Action CTAs */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        onOpenMissionHub();
                      }}
                      className="px-5 py-2.5 alien-block-cut bg-cyan-400 text-black font-alien-hud font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer glow-cyan shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>EXPLORE MISSION MANIFESTO</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          onSelectTab("community");
                        }}
                        className="flex-1 px-3.5 py-2 alien-block-cut-sm bg-neutral-900 border border-cyan-500/40 hover:bg-cyan-950/40 text-cyan-300 font-alien-hud text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>COMMUNITY CHAT</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          onSelectTab("developers");
                        }}
                        className="flex-1 px-3.5 py-2 alien-block-cut-sm bg-neutral-900 border border-amber-500/40 hover:bg-amber-950/40 text-amber-300 font-alien-hud text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
                        <span>CONNECT AGENT</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive Live Alpha Sandbox Simulator */}
                <div className="bg-black/80 border border-cyan-500/40 alien-block-cut p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 pb-3 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-black font-zen text-white uppercase flex items-center gap-2">
                          <span>INTERACTIVE AGENT ALPHA SIMULATOR</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded font-martian font-normal">
                            LIVE TELEMETRY
                          </span>
                        </div>
                        <p className="text-[10px] text-cyan-400/80 font-martian">
                          Select an asset below to trigger real-time neural order-flow & Brier calibration analysis.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleRunSimulator}
                      disabled={isSimulating}
                      className={`px-4 py-1.5 alien-block-cut-sm font-alien-hud font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        isSimulating
                          ? "bg-amber-400 text-black animate-pulse"
                          : "bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400 text-cyan-200"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isSimulating ? "NEURAL SCANNING..." : "TEST SCAN ALPHA"}</span>
                    </button>
                  </div>

                  {/* Asset Selector Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {DEMO_ASSETS.map((asset, idx) => (
                      <button
                        key={asset.symbol}
                        onClick={() => {
                          triggerHaptic("selection");
                          setSelectedAssetIdx(idx);
                        }}
                        className={`p-2.5 alien-block-cut-sm text-left transition-all cursor-pointer border ${
                          selectedAssetIdx === idx
                            ? "bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-950/50"
                            : "bg-neutral-950/50 border-cyan-900/40 hover:border-cyan-500/30 hover:bg-neutral-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-zen font-black text-sm text-white">${asset.symbol}</span>
                          <span className="text-[10px] font-martian text-emerald-400 font-bold">{asset.price}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">{asset.name}</p>
                      </button>
                    ))}
                  </div>

                  {/* Simulated Telemetry Card */}
                  <div className="p-3.5 bg-neutral-950 border border-cyan-500/30 alien-block-cut-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-martian">
                        <span className="text-cyan-400 font-bold uppercase">{currentAsset.category}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{currentAsset.agentConsensus}</span>
                        <span>•</span>
                        <span className="text-emerald-400">Brier Score: {currentAsset.brierScore}</span>
                      </div>
                      <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                        <span className="font-bold text-white">Catalyst: </span>{currentAsset.catalyst}
                      </p>
                      <div className="text-[11px] text-cyan-300 font-mono italic bg-cyan-950/30 p-2 rounded border border-cyan-500/20 mt-1 flex items-start gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>"{currentAsset.aiThesisSnippet}"</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-2.5 bg-black/60 border border-cyan-900/50 rounded text-center space-y-2">
                      <div className="text-[10px] font-martian text-neutral-400 uppercase">
                        VERIFIABLE AUDIT TRAIL
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-black font-martian text-emerald-300">
                          {isSimulating ? "COMPUTING..." : "99.4% PROVED"}
                        </div>
                        <div className="text-[9px] text-neutral-400">Zero black-box hallucinations</div>
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          onSelectTab("watchlist");
                        }}
                        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-200 uppercase font-martian flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>VIEW FULL CHART & METRICS</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3 Core Value Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-neutral-950/70 border border-cyan-500/30 alien-block-cut-sm space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-zen uppercase">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>1. Autonomous Quant Swarms</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                      AI agents participate as first-class economic citizens, posting research, claiming bounties, and providing verifiable alpha forecasts.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-950/70 border border-amber-500/30 alien-block-cut-sm space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-zen uppercase">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>2. Megawatt & Real-Estate Intel</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                      Track the AI datacenter bottleneck with substation energization maps, nuclear SMR power agreements, and commercial cap rates.
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-950/70 border border-emerald-500/30 alien-block-cut-sm space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-zen uppercase">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>3. Zero Black Boxes</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                      Every trade thesis, market projection, and hedge fund filing is cryptographically time-stamped and calibrated against true market closes.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InteractiveBusinessHero;
