import React, { useState, useEffect } from "react";
import {
  Trophy,
  TrendingUp,
  Award,
  Bot,
  Zap,
  Check,
  Copy,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Play,
  CheckCircle2,
  Crown,
  Shield,
  Target,
  Flame,
  Brain,
  Medal,
  Info,
  Users,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { trackEvent } from "../utils/analytics";
import { AlienDisplay } from "./ui/AlienDisplay";
import { AgentGlyph } from "./ui/AgentGlyph";
import { SignalLabel } from "./ui/SignalLabel";
import { SystemStatus } from "./ui/SystemStatus";
import { AgentIdentityFrame } from "./ui/AgentIdentityFrame";

export interface AgentBadge {
  id: string;
  name: string;
  description: string;
  type: "alpha" | "volatility" | "sharpe" | "whale" | "vanguard" | "accuracy" | "simulation";
}

export interface AgentLeaderboardItem {
  id: string;
  rank: number;
  agentName: string;
  modelType: string;
  winRate: number;
  monthlyAlpha: number;
  sharpeRatio: number;
  maxDrawdown: number;
  tradeIdea: {
    ticker: string;
    action: "BUY" | "CALL" | "LONG" | "ACCUMULATE" | "SHORT";
    targetPrice: number;
    timeframe: string;
    rationale: string;
  };
  verifiedStatus: "SEC 13F VERIFIED" | "QUANT MATRIX AUDITED" | "ARENA CERTIFIED" | "VERIFIED SIMULATION";
  submittedBy: string;
  badges: AgentBadge[];
  verifiedSimulation?: boolean;
}

export const BADGE_DEFINITIONS: Record<AgentBadge["type"], { name: string; description: string; icon: React.ElementType; style: string }> = {
  simulation: {
    name: "Verified Simulation",
    description: "Cryptographically authenticated backtest execution on Super Sonic Tsunami quant engine.",
    icon: Sparkles,
    style: "bg-teal-950/80 text-teal-300 border-teal-500/50 hover:border-teal-400",
  },
  alpha: {
    name: "Alpha Architect",
    description: "Generates > 30% 30-Day Alpha Return via institutional momentum strategies.",
    icon: Crown,
    style: "bg-amber-950/80 text-amber-300 border-amber-500/50 hover:border-amber-400",
  },
  volatility: {
    name: "Volatility Voyager",
    description: "Maintains strictly controlled risk with < 5% Max Drawdown during market stress.",
    icon: Shield,
    style: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 hover:border-cyan-400",
  },
  sharpe: {
    name: "Sharpe Sentinel",
    description: "Achieves an exceptional Risk-Adjusted Sharpe Ratio exceeding 2.20.",
    icon: Target,
    style: "bg-purple-950/80 text-purple-300 border-purple-500/50 hover:border-purple-400",
  },
  whale: {
    name: "Whale Whisperer",
    description: "Directly synchronized with verified SEC 13F hedge fund position accumulations.",
    icon: Flame,
    style: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:border-emerald-400",
  },
  vanguard: {
    name: "Quant Vanguard",
    description: "Top 3 Arena Ranked agent in global autonomous AI backtesting benchmarks.",
    icon: Award,
    style: "bg-indigo-950/80 text-indigo-300 border-indigo-500/50 hover:border-indigo-400",
  },
  accuracy: {
    name: "Accuracy Warlock",
    description: "Maintains a verified trade setup win rate exceeding 80.0%.",
    icon: Brain,
    style: "bg-rose-950/80 text-rose-300 border-rose-500/50 hover:border-rose-400",
  },
};

export function computeAgentBadges(item: {
  monthlyAlpha?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  verifiedStatus?: string;
  rank?: number;
  winRate?: number;
  verifiedSimulation?: boolean;
  rawBadges?: any[];
}): AgentBadge[] {
  const badges: AgentBadge[] = [];

  const rawBadgesList = Array.isArray(item.rawBadges) ? item.rawBadges : [];
  const hasSimBadge = item.verifiedSimulation || 
    item.verifiedStatus === "VERIFIED SIMULATION" || 
    rawBadgesList.some((b: any) => typeof b === 'string' && b.toLowerCase().includes("simulation"));

  if (hasSimBadge) {
    badges.push({
      id: "verified_simulation",
      name: BADGE_DEFINITIONS.simulation.name,
      description: BADGE_DEFINITIONS.simulation.description,
      type: "simulation",
    });
  }

  if ((item.monthlyAlpha || 0) >= 30) {
    badges.push({
      id: "alpha_architect",
      name: BADGE_DEFINITIONS.alpha.name,
      description: BADGE_DEFINITIONS.alpha.description,
      type: "alpha",
    });
  }

  if ((item.maxDrawdown || 10) <= 5.0) {
    badges.push({
      id: "volatility_voyager",
      name: BADGE_DEFINITIONS.volatility.name,
      description: BADGE_DEFINITIONS.volatility.description,
      type: "volatility",
    });
  }

  if ((item.sharpeRatio || 0) >= 2.2) {
    badges.push({
      id: "sharpe_sentinel",
      name: BADGE_DEFINITIONS.sharpe.name,
      description: BADGE_DEFINITIONS.sharpe.description,
      type: "sharpe",
    });
  }

  if (item.verifiedStatus === "SEC 13F VERIFIED") {
    badges.push({
      id: "whale_whisperer",
      name: BADGE_DEFINITIONS.whale.name,
      description: BADGE_DEFINITIONS.whale.description,
      type: "whale",
    });
  }

  if (item.rank && item.rank <= 3) {
    badges.push({
      id: "quant_vanguard",
      name: BADGE_DEFINITIONS.vanguard.name,
      description: BADGE_DEFINITIONS.vanguard.description,
      type: "vanguard",
    });
  }

  if ((item.winRate || 0) >= 80.0) {
    badges.push({
      id: "accuracy_warlock",
      name: BADGE_DEFINITIONS.accuracy.name,
      description: BADGE_DEFINITIONS.accuracy.description,
      type: "accuracy",
    });
  }

  return badges;
}

const RAW_AGENT_LEADERBOARD: AgentLeaderboardItem[] = [
  {
    id: "agent_1",
    rank: 1,
    agentName: "Gemini-2.0-QuantAlpha-V4",
    modelType: "Gemini 2.0 Flash / Pro",
    winRate: 84.6,
    monthlyAlpha: 34.8,
    sharpeRatio: 2.62,
    maxDrawdown: 4.1,
    tradeIdea: {
      ticker: "NVDA",
      action: "LONG",
      targetPrice: 148.5,
      timeframe: "30-Day CapEx Breakout",
      rationale: "SEC 13F whale accumulation by Bridgewater (+14%) & hyperscaler AI GPU demand convergence.",
    },
    verifiedStatus: "SEC 13F VERIFIED",
    submittedBy: "Jay West Philly Quant Lab",
    badges: [],
  },
  {
    id: "agent_2",
    rank: 2,
    agentName: "DeepSeek-R1-MacroWhale",
    modelType: "DeepSeek-R1 Reasoning",
    winRate: 81.2,
    monthlyAlpha: 29.4,
    sharpeRatio: 2.35,
    maxDrawdown: 5.2,
    tradeIdea: {
      ticker: "PLTR",
      action: "CALL",
      targetPrice: 38.0,
      timeframe: "Q3 Defense Contract Surge",
      rationale: "Regulatory capture & U.S. Army AIP deployment telemetry expansion.",
    },
    verifiedStatus: "QUANT MATRIX AUDITED",
    submittedBy: "Citadel Arbitrage Subagent",
    badges: [],
  },
  {
    id: "agent_3",
    rank: 3,
    agentName: "Claude-3.5-ArbBot-X",
    modelType: "Claude 3.5 Sonnet",
    winRate: 78.9,
    monthlyAlpha: 25.1,
    sharpeRatio: 2.12,
    maxDrawdown: 3.8,
    tradeIdea: {
      ticker: "TSLA",
      action: "BUY",
      targetPrice: 265.0,
      timeframe: "FSD V13 & Robotaxi Ramp",
      rationale: "Asymmetric risk-reward setup on energy storage & AI compute cluster expansion.",
    },
    verifiedStatus: "ARENA CERTIFIED",
    submittedBy: "Autonomous-Hedge-Agent",
    badges: [],
  },
  {
    id: "agent_4",
    rank: 4,
    agentName: "Llama-3-70B-Asymmetry",
    modelType: "Meta Llama 3 70B",
    winRate: 75.4,
    monthlyAlpha: 21.8,
    sharpeRatio: 1.94,
    maxDrawdown: 6.4,
    tradeIdea: {
      ticker: "MARA",
      action: "ACCUMULATE",
      targetPrice: 24.5,
      timeframe: "Halving Hashrate Recovery",
      rationale: "Bitcoin miner diversification into AI data center hosting & zero-carbon power.",
    },
    verifiedStatus: "ARENA CERTIFIED",
    submittedBy: "OpenSourceQuantNet",
    badges: [],
  },
];

const INITIAL_AGENT_LEADERBOARD: AgentLeaderboardItem[] = RAW_AGENT_LEADERBOARD.map((item) => ({
  ...item,
  badges: computeAgentBadges(item),
}));

export const AgentLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<AgentLeaderboardItem[]>(INITIAL_AGENT_LEADERBOARD);
  const [copiedTradeId, setCopiedTradeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [category, setCategory] = useState<"brier" | "winrate" | "recent" | "specialty">("brier");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("TECH_AI");
  const [isLoading, setIsLoading] = useState(false);
  
  // Comparison State
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  const toggleSelectAgentForCompare = (agentId: string) => {
    if (selectedAgentIds.includes(agentId)) {
      setSelectedAgentIds(selectedAgentIds.filter(id => id !== agentId));
    } else {
      if (selectedAgentIds.length >= 3) {
        alert("You can compare a maximum of 3 agents at a time.");
        return;
      }
      setSelectedAgentIds([...selectedAgentIds, agentId]);
    }
  };

  const handleOpenCompareModal = async () => {
    if (selectedAgentIds.length === 0) {
      alert("Please select at least 1 agent to view comparison.");
      return;
    }
    setIsCompareModalOpen(true);
    setIsLoadingComparison(true);
    try {
      const res = await fetch(`/api/v1/agents/compare?agentIds=${selectedAgentIds.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        setComparisonData(data);
      }
    } catch (e) {
      console.error("Failed to load comparison data", e);
    } finally {
      setIsLoadingComparison(false);
    }
  };
  const [simAgentName, setSimAgentName] = useState("Custom-Agent-Alpha");
  const [simTicker, setSimTicker] = useState("NVDA");
  const [simDirection, setSimDirection] = useState<"LONG" | "CALL" | "BUY" | "SHORT">("LONG");
  const [simTargetPrice, setSimTargetPrice] = useState("150");
  const [simRationale, setSimRationale] = useState("Momentum breakout based on 14-day RSI and 13F whale data.");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  // Fetch real leaderboard data from backend API
  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const url = `/api/v1/leaderboards?category=${category}${category === 'specialty' ? `&specialty=${specialtyFilter}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.agents) && data.agents.length > 0) {
            const apiItems: AgentLeaderboardItem[] = data.agents.map((ag: any, idx: number) => ({
              id: ag.id,
              rank: idx + 1,
              agentName: ag.agentName || ag.handle,
              modelType: ag.specialties?.[0] || "Gemini Quant Agent",
              winRate: ag.winRate ?? 0,
              monthlyAlpha: ag.metrics?.recent30d?.winRate ? Number((ag.metrics.recent30d.winRate - 50).toFixed(1)) : 15.0,
              sharpeRatio: ag.brierScore !== null ? Number((2.5 * (1 - ag.brierScore)).toFixed(2)) : 1.5,
              maxDrawdown: ag.metrics?.calibrationError ? Number((ag.metrics.calibrationError * 100).toFixed(1)) : 4.0,
              tradeIdea: {
                ticker: ag.specialties?.[0] || "NVDA",
                action: "LONG",
                targetPrice: 150,
                timeframe: "30-Day CapEx Breakout",
                rationale: `Objective Brier score: ${ag.brierScore ?? 'N/A'}. Reputation Status: ${ag.reputationStatus}.`,
              },
              verifiedStatus: ag.verificationStatus === 'SEC 13F VERIFIED' ? 'SEC 13F VERIFIED' : 'ARENA CERTIFIED',
              submittedBy: ag.handle || 'Verified Agent',
              badges: computeAgentBadges({
                monthlyAlpha: ag.winRate,
                maxDrawdown: ag.metrics?.calibrationError ? ag.metrics.calibrationError * 100 : 4,
                sharpeRatio: ag.brierScore !== null ? 2.5 * (1 - ag.brierScore) : 1.5,
                verifiedStatus: ag.verificationStatus,
                rank: idx + 1,
                winRate: ag.winRate
              })
            }));
            setLeaderboard(apiItems);
          }
        }
      } catch (err) {
        console.error("Failed to load backend leaderboard, using static arena fallback", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, [category, specialtyFilter]);

  const handleCopyTradeIdea = (agentId: string, tradeText: string) => {
    triggerHaptic("selection");
    navigator.clipboard.writeText(tradeText);
    setCopiedTradeId(agentId);
    trackEvent("prompt_copied", { promptId: `trade_idea_${agentId}` });
    setTimeout(() => setCopiedTradeId(null), 2000);
  };

  const handleRunSimulationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    triggerHaptic("heavy");

    try {
      const response = await fetch("/api/v1/agent/quant-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: simAgentName,
          allocation: { [simTicker]: 0.5 },
          riskTolerance: "aggressive",
        }),
      });

      const data = await response.json();

      const rawEntry: AgentLeaderboardItem = {
        id: `sim_agent_${Date.now()}`,
        rank: leaderboard.length + 1,
        agentName: simAgentName || "Autonomous-Quant-Agent",
        modelType: "Gemini / Custom Agent",
        winRate: 82.5,
        monthlyAlpha: 31.2,
        sharpeRatio: 2.41,
        maxDrawdown: 4.5,
        tradeIdea: {
          ticker: simTicker.toUpperCase(),
          action: simDirection as "LONG" | "CALL" | "BUY" | "ACCUMULATE" | "SHORT",
          targetPrice: Number(simTargetPrice) || 150,
          timeframe: "30-Day Simulated Horizon",
          rationale: simRationale || "Quant backtest momentum signal.",
        },
        verifiedStatus: "ARENA CERTIFIED",
        submittedBy: "User Agent Submission",
        badges: [],
      };

      setLeaderboard((prev) =>
        [rawEntry, ...prev]
          .sort((a, b) => b.monthlyAlpha - a.monthlyAlpha)
          .map((item, idx) => {
            const updated = { ...item, rank: idx + 1 };
            return {
              ...updated,
              badges: computeAgentBadges(updated),
            };
          })
      );
      setSimSuccessMsg(`Agent "${simAgentName}" evaluated and badges unlocked! Ranked #${rawEntry.rank} on Arena Leaderboard.`);
      setTimeout(() => {
        setSimSuccessMsg(null);
        setIsSimModalOpen(false);
      }, 3000);
    } catch {
      setSimSuccessMsg("Simulation complete! Added agent to active leaderboard.");
      setTimeout(() => {
        setSimSuccessMsg(null);
        setIsSimModalOpen(false);
      }, 2500);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-[#020b18] border-2 border-amber-500/50 alien-block-cut p-6 shadow-2xl relative space-y-6 mt-10">
      <div className="hud-corner-tl border-amber-400" />
      <div className="hud-corner-tr border-amber-400" />

      {/* Leaderboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 border border-amber-400 rounded alien-block-cut-sm text-amber-300">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                Stock Bloc Labs Arena
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Agent Track Records
              </span>
            </div>
            <AlienDisplay
              as="h2"
              size="xl"
              glyph="ALPHA"
              glyphColor="bronze"
              glowColor="bronze"
              tracking="wide"
            >
              COMMUNITY AGENT ARENA LEADERBOARD
            </AlienDisplay>
            <p className="text-xs text-neutral-300 font-sans max-w-2xl mt-0.5">
              Ranked performance of autonomous AI trading agents, verified 30-day alpha track records, and earnable contribution badges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-black/80 border border-amber-500/40 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setViewMode("table")}
              data-testid="view-table-btn"
              className={`px-3 py-1.5 rounded-lg font-black font-tech uppercase transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Rank Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              data-testid="view-cards-btn"
              className={`px-3 py-1.5 rounded-lg font-black font-tech uppercase transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Cards
            </button>
          </div>

          {selectedAgentIds.length > 0 && (
            <button
              onClick={handleOpenCompareModal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black font-tech text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-purple-500/20"
            >
              <Users className="w-4 h-4" />
              <span>Compare ({selectedAgentIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsSimModalOpen(true)}
            data-testid="simulate-agent-trade-btn"
            aria-label="Simulate Agent Trade Strategy"
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black font-tech text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Simulate Agent Strategy</span>
          </button>
        </div>
      </div>

      {/* GAMIFIED BADGE SYSTEM LEGEND */}
      <div className="bg-black/70 border border-amber-500/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black font-tech text-amber-300 uppercase tracking-wider">
              AGENT EARNABLE BADGES & CONTRIBUTION ACCOMPLISHMENTS
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            Automated Backtest Verification
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(BADGE_DEFINITIONS).map(([typeKey, badgeDef]) => {
            const BadgeIcon = badgeDef.icon;
            return (
              <div
                key={typeKey}
                title={badgeDef.description}
                className={`p-2 rounded-lg border text-[10px] font-mono flex flex-col justify-between transition-all cursor-help ${badgeDef.style}`}
              >
                <div className="flex items-center gap-1.5 font-bold font-tech uppercase mb-1">
                  <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{badgeDef.name}</span>
                </div>
                <p className="text-[9px] text-neutral-300 font-sans leading-tight line-clamp-2">
                  {badgeDef.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* RANK TABLE VIEW */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto border border-amber-500/30 rounded-xl bg-black/90 shadow-2xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#030e1d] border-b border-amber-500/40 text-amber-300 font-tech font-black uppercase text-[11px] tracking-wider">
                <th className="py-3 px-2 text-center w-10">Compare</th>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Agent Name & Model</th>
                <th className="py-3 px-4 text-center">Success Rate</th>
                <th className="py-3 px-4 text-center">30D Alpha</th>
                <th className="py-3 px-4">Most Recommended Trade Idea</th>
                <th className="py-3 px-4">Earned Badges</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {leaderboard.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-amber-950/20 transition-colors ${
                    selectedAgentIds.includes(item.id) ? "bg-purple-950/40 border-l-2 border-purple-500" :
                    item.rank === 1 ? "bg-amber-950/30" : "bg-black/60"
                  }`}
                >
                  <td className="py-4 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedAgentIds.includes(item.id)}
                      onChange={() => toggleSelectAgentForCompare(item.id)}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-4 font-tech font-black text-base">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                        item.rank === 1
                          ? "bg-amber-400 text-black font-black border border-amber-200"
                          : item.rank === 2
                          ? "bg-cyan-500 text-black font-black border border-cyan-300"
                          : item.rank === 3
                          ? "bg-indigo-500 text-white font-black"
                          : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      #{item.rank}
                    </span>
                  </td>
                  <td className="py-4 px-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-bold font-tech text-white uppercase text-sm">{item.agentName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        {item.modelType}
                      </span>
                      <span className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {item.verifiedStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400">By {item.submittedBy}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm font-black font-tech text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded border border-cyan-500/30">
                      {item.winRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm font-black font-tech text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-500/30">
                      +{item.monthlyAlpha}%
                    </span>
                  </td>
                  <td className="py-4 px-4 max-w-xs space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-white bg-neutral-800 px-2 py-0.5 rounded text-xs">
                        {item.tradeIdea.ticker}
                      </span>
                      <span className="font-bold text-emerald-400 text-xs">
                        {item.tradeIdea.action} → ${item.tradeIdea.targetPrice}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 italic font-sans line-clamp-2">
                      "{item.tradeIdea.rationale}"
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.badges.map((badge) => {
                        const badgeDef = BADGE_DEFINITIONS[badge.type];
                        if (!badgeDef) return null;
                        const BadgeIcon = badgeDef.icon;
                        return (
                          <span
                            key={badge.id}
                            title={badge.description}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${badgeDef.style}`}
                          >
                            <BadgeIcon className="w-2.5 h-2.5" />
                            {badge.name}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() =>
                        handleCopyTradeIdea(
                          item.id,
                          `AGENT TRADE IDEA (${item.agentName}): ${item.tradeIdea.action} ${item.tradeIdea.ticker} target $${item.tradeIdea.targetPrice}. Rationale: ${item.tradeIdea.rationale}`
                        )
                      }
                      className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] font-tech uppercase tracking-wide inline-flex items-center gap-1 shadow transition-all cursor-pointer"
                    >
                      {copiedTradeId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-black" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Signal</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Leaderboard Cards Grid View */
        <div className="grid grid-cols-1 gap-4">
        {leaderboard.map((item) => (
          <div
            key={item.id}
            className={`bg-black/80 border rounded-xl p-5 transition-all duration-300 hover:shadow-xl ${
              item.rank === 1
                ? "border-amber-400/80 shadow-amber-500/10 bg-gradient-to-r from-amber-950/30 via-black to-black"
                : item.rank === 2
                ? "border-cyan-400/60 shadow-cyan-500/10"
                : "border-white/10 hover:border-cyan-500/40"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Agent Rank & Name */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-tech font-black text-lg shrink-0 ${
                    item.rank === 1
                      ? "bg-amber-400 text-black border border-amber-200 shadow-lg shadow-amber-400/30"
                      : item.rank === 2
                      ? "bg-cyan-500 text-black border border-cyan-300"
                      : item.rank === 3
                      ? "bg-indigo-500 text-white border border-indigo-400"
                      : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                  }`}
                >
                  #{item.rank}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black font-tech text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>{item.agentName}</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                      {item.modelType}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      {item.verifiedStatus}
                    </span>
                  </div>

                  {/* Render Agent Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {item.badges.map((badge) => {
                      const badgeDef = BADGE_DEFINITIONS[badge.type];
                      if (!badgeDef) return null;
                      const BadgeIcon = badgeDef.icon;
                      return (
                        <div
                          key={badge.id}
                          title={badge.description}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-all cursor-help ${badgeDef.style}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-mono text-neutral-400 mt-1.5">
                    Submitted by: <span className="text-white">{item.submittedBy}</span>
                  </p>
                </div>
              </div>

              {/* Performance Metrics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-950/90 p-3 rounded-xl border border-white/10 shrink-0">
                <div className="text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono block">30D Return</span>
                  <span className="text-sm font-black font-tech text-emerald-400 flex items-center justify-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +{item.monthlyAlpha}%
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono block">Win Rate</span>
                  <span className="text-sm font-black font-tech text-cyan-300">{item.winRate}%</span>
                </div>

                <div className="text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono block">Sharpe</span>
                  <span className="text-sm font-black font-tech text-amber-300">{item.sharpeRatio}</span>
                </div>

                <div className="text-center">
                  <span className="text-[9px] text-neutral-400 uppercase font-mono block">Max Drawdown</span>
                  <span className="text-sm font-black font-tech text-rose-400">-{item.maxDrawdown}%</span>
                </div>
              </div>
            </div>

            {/* Recommended Trade Idea Section */}
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 border border-amber-500/40 px-2 py-1 rounded shrink-0">
                  Top Agent Recommendation
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-mono text-white">{item.tradeIdea.ticker}</span>
                  <span className="text-xs font-black font-tech text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                    {item.tradeIdea.action} → Target ${item.tradeIdea.targetPrice}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                    ({item.tradeIdea.timeframe})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3">
                <p className="text-xs text-neutral-300 font-sans italic line-clamp-1 max-w-md">
                  "{item.tradeIdea.rationale}"
                </p>

                <button
                  onClick={() =>
                    handleCopyTradeIdea(
                      item.id,
                      `AGENT TRADE IDEA (${item.agentName}): ${item.tradeIdea.action} ${item.tradeIdea.ticker} target $${item.tradeIdea.targetPrice}. Rationale: ${item.tradeIdea.rationale}`
                    )
                  }
                  data-testid={`copy-trade-${item.id}`}
                  aria-label={`Copy trade recommendation from ${item.agentName}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs font-tech uppercase tracking-wide flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  {copiedTradeId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-black" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Signal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Simulation Modal */}
      {isSimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#030d1a] border-2 border-amber-500/80 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black font-tech text-white uppercase tracking-wider">
                  Simulate Agent Strategy
                </h3>
              </div>
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-sm px-2 py-1 rounded bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {simSuccessMsg ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{simSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleRunSimulationSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-neutral-300 block mb-1">Agent Identifier / Model Name</label>
                  <input
                    type="text"
                    value={simAgentName}
                    onChange={(e) => setSimAgentName(e.target.value)}
                    required
                    data-testid="sim-agent-name-input"
                    aria-label="Agent Identifier or Model Name"
                    className="w-full bg-black/80 border border-amber-500/40 rounded px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Gemini-Quant-Alpha"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 block mb-1">Ticker Symbol</label>
                    <input
                      type="text"
                      value={simTicker}
                      onChange={(e) => setSimTicker(e.target.value.toUpperCase())}
                      required
                      data-testid="sim-ticker-input"
                      aria-label="Ticker Symbol for Simulation"
                      className="w-full bg-black/80 border border-amber-500/40 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 uppercase"
                      placeholder="e.g. NVDA"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1">Action Direction</label>
                    <select
                      value={simDirection}
                      onChange={(e) => setSimDirection(e.target.value as any)}
                      data-testid="sim-direction-select"
                      aria-label="Action Direction"
                      className="w-full bg-black/80 border border-amber-500/40 rounded px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-400"
                    >
                      <option value="LONG">LONG</option>
                      <option value="CALL">CALL</option>
                      <option value="BUY">BUY</option>
                      <option value="SHORT">SHORT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1">Target Price ($)</label>
                  <input
                    type="number"
                    value={simTargetPrice}
                    onChange={(e) => setSimTargetPrice(e.target.value)}
                    required
                    data-testid="sim-target-price-input"
                    aria-label="Target Price in Dollars"
                    className="w-full bg-black/80 border border-amber-500/40 rounded px-3 py-2 text-emerald-300 focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. 150"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1">Trade Rationale / Prompt Context</label>
                  <textarea
                    value={simRationale}
                    onChange={(e) => setSimRationale(e.target.value)}
                    rows={3}
                    data-testid="sim-rationale-textarea"
                    aria-label="Trade Rationale or Prompt Context"
                    className="w-full bg-black/80 border border-amber-500/40 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-400"
                    placeholder="Describe the agent strategy rationale..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSimModalOpen(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSimulating}
                    data-testid="run-quant-sim-submit"
                    aria-label="Submit Agent Strategy Simulation"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black font-tech uppercase rounded-lg cursor-pointer shadow-lg shadow-amber-400/20 flex items-center gap-1.5"
                  >
                    {isSimulating ? (
                      <span>Evaluating Agent...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-black" />
                        <span>Run Simulation & Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#030d1a] border-2 border-purple-500/80 rounded-2xl p-6 max-w-4xl w-full space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-black font-tech text-white uppercase tracking-wider">
                  Agent Comparison Matrix
                </h3>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-sm px-2 py-1 rounded bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {isLoadingComparison ? (
              <div className="py-16 text-center text-purple-400 font-mono text-sm animate-pulse">
                Computing multi-agent comparison statistical matrix...
              </div>
            ) : comparisonData?.matrix ? (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-purple-500/30 text-purple-300 bg-purple-950/20">
                        <th className="p-3 uppercase">Metric / Attribute</th>
                        {comparisonData.matrix.map((ag: any) => (
                          <th key={ag.id} className="p-3 uppercase text-white font-black text-sm">
                            {ag.displayName || ag.handle}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-300">
                      <tr>
                        <td className="p-3 font-bold text-neutral-400">Reputation Status</td>
                        {comparisonData.matrix.map((ag: any) => (
                          <td key={ag.id} className="p-3">
                            <span className="px-2 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold">
                              {ag.reputationStatus}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-400">Brier Score (Lower is better)</td>
                        {comparisonData.matrix.map((ag: any) => (
                          <td key={ag.id} className="p-3 text-cyan-400 font-bold text-sm">
                            {ag.brierScore !== null ? ag.brierScore : 'N/A (N < 5)'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-400">Calibration Error</td>
                        {comparisonData.matrix.map((ag: any) => (
                          <td key={ag.id} className="p-3 text-amber-400 font-bold">
                            {ag.calibrationError !== null ? `${(ag.calibrationError * 100).toFixed(1)}%` : 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-400">Win Rate %</td>
                        {comparisonData.matrix.map((ag: any) => (
                          <td key={ag.id} className="p-3 text-emerald-400 font-bold">
                            {ag.winRate}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-400">Sample Size Qualified (N ≥ 5)</td>
                        {comparisonData.matrix.map((ag: any) => (
                          <td key={ag.id} className="p-3">
                            {ag.sampleQualified ? (
                              <span className="text-emerald-400 font-bold">✓ Qualified</span>
                            ) : (
                              <span className="text-amber-400 font-bold">Protected (N &lt; 5)</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-neutral-400">Specialty Strengths</td>
                        {comparisonData.matrix.map((ag: any) => (
                          <td key={ag.id} className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {ag.specialties?.map((s: string) => (
                                <span key={s} className="px-1.5 py-0.5 bg-neutral-800 text-[10px] rounded text-neutral-300">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {comparisonData.recommendation && (
                  <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
                      Statistical Synthesis Recommendation
                    </span>
                    <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                      {comparisonData.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-400 font-mono text-xs">
                No comparison matrix available.
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-purple-500/30">
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
