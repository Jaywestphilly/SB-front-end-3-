import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Briefcase,
  Search,
  RefreshCw,
  Building2,
  TrendingUp,
  Download,
  Copy,
  Zap,
  ShieldCheck,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  AlertTriangle,
  Check,
  Activity,
  Award,
  Filter,
  Users,
  Globe,
  Landmark,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { LiveSecIntelSection } from "../../components/LiveSecIntelSection";
import { WhaleConsensusMatrix } from "./WhaleConsensusMatrix";
import { MacroEconomicsBriefing } from "./MacroEconomicsBriefing";

export interface Holding13F {
  symbol: string;
  name: string;
  shares: string;
  valueMillions: number;
  portfolioPercent: number;
  changeType: "NEW" | "INCREASED" | "DECREASED" | "HOLD" | "SOLD_OUT";
  changePercent: number;
  sector: string;
  thesis: string;
}

export interface SectorAlloc {
  sector: string;
  percent: number;
  valueMillions: number;
  color: string;
}

export interface Fund13FItem {
  id: string;
  fundName: string;
  cik: string;
  manager: string;
  filingDate: string;
  quarter: string;
  aum: string;
  aumRaw: number;
  mandate: string;
  topHoldings: Holding13F[];
  sectorAllocation: SectorAlloc[];
  quarterFlows: {
    newPositionsCount: number;
    increasedCount: number;
    decreasedCount: number;
    soldOutCount: number;
    totalPositions: number;
  };
}

export interface ConsensusHolding {
  symbol: string;
  name: string;
  fundCount: number;
  totalValueMillions: number;
  avgPortfolioWeight: number;
  overallSentiment: string;
  sector: string;
  topHolders: string[];
}

import { formatUtcTimestamp, isDataStale } from "../../utils/timeUtils";

export const Intel13FDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeViewMode, setActiveViewMode] = useState<"FUNDS" | "WHALE_CONSENSUS" | "MACRO_BRIEF">("FUNDS");
  const [funds, setFunds] = useState<Fund13FItem[]>([]);
  const [consensus, setConsensus] = useState<ConsensusHolding[]>([]);
  const [macroSummary, setMacroSummary] = useState<string>("");
  const [selectedFundId, setSelectedFundId] = useState<string>("berkshire");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [secUpdatedAt, setSecUpdatedAt] = useState<string>(formatUtcTimestamp(new Date()));
  const [secIsStale, setSecIsStale] = useState<boolean>(false);
  const [isUsingLocalFallback, setIsUsingLocalFallback] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchFilings = async () => {
    setLoading(true);
    triggerHaptic("light");
    try {
      const res = await fetch("/api/13f/filings");
      if (res.ok) {
        const data = await res.json();
        if (data.funds && data.funds.length > 0) {
          setFunds(data.funds);
          setConsensus(data.consensusHoldings || []);
          setMacroSummary(data.macroSummary || "");
          const rawTime = data.timestamp || data.updated_at || new Date().toISOString();
          setSecUpdatedAt(formatUtcTimestamp(rawTime));
          setSecIsStale(isDataStale(rawTime));
          showToast("Live 13F SEC Filings Synchronized!");
          return;
        }
      }
      
      // Fallback: CDN Proxy automated JSON feed
      const ghRes = await fetch("/api/data/sec");
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        if (ghData.funds && ghData.funds.length > 0) {
          setFunds(ghData.funds);
          setConsensus(ghData.consensusHoldings || []);
          setMacroSummary(ghData.macroSummary || "");
          const rawTime = ghData.updated_at || new Date().toISOString();
          setSecUpdatedAt(formatUtcTimestamp(rawTime));
          setSecIsStale(ghData.stale !== undefined ? ghData.stale : isDataStale(rawTime));
          showToast("Live 13F SEC Intel Synchronized!");
          return;
        }
      }

      // Local Proxy Endpoint Fallback
      const localRes = await fetch("/sec_intel_data.json");
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData.funds && localData.funds.length > 0) {
          setFunds(localData.funds);
          setConsensus(localData.consensusHoldings || []);
          setMacroSummary(localData.macroSummary || "");
          const rawTime = localData.updated_at || new Date().toISOString();
          setSecUpdatedAt(formatUtcTimestamp(rawTime));
          setSecIsStale(isDataStale(rawTime));
          setIsUsingLocalFallback(true);
          showToast("SEC Intel loaded from local backend proxy!");
        }
      }
    } catch (err) {
      console.warn("Failed to fetch 13F filings feed:", err);
      setIsUsingLocalFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilings();
  }, []);

  const selectedFund = funds.find((f) => f.id === selectedFundId) || funds[0];

  const filteredHoldings = selectedFund?.topHoldings.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      h.symbol.toLowerCase().includes(q) ||
      h.name.toLowerCase().includes(q) ||
      h.sector.toLowerCase().includes(q) ||
      h.thesis.toLowerCase().includes(q);

    const matchesAction =
      filterAction === "ALL" ||
      (filterAction === "NEW" && h.changeType === "NEW") ||
      (filterAction === "BUY" && (h.changeType === "NEW" || h.changeType === "INCREASED")) ||
      (filterAction === "TRIM" && h.changeType === "DECREASED");

    return matchesSearch && matchesAction;
  }) || [];

  const handleCopySummary = () => {
    triggerHaptic("success");
    if (!selectedFund) return;
    const text = `STOCK BLOC // 13F INTELLIGENCE BRIEF\nFund: ${selectedFund.fundName} (${selectedFund.manager})\nCIK: ${selectedFund.cik} | Filing: ${selectedFund.quarter} (${selectedFund.filingDate})\nAUM: ${selectedFund.aum}\n\nMANDATE & GOALS:\n${selectedFund.mandate}\n\nTOP HOLDINGS:\n` +
      selectedFund.topHoldings
        .map(
          (h) =>
            `- $${h.symbol} (${h.name}): ${h.portfolioPercent}% weight | Action: ${h.changeType} (${h.changePercent >= 0 ? "+" : ""}${h.changePercent}%)\n  Thesis: ${h.thesis}`
        )
        .join("\n") +
      `\n\nVerified by Stock Bloc 13F Intelligence Feed.`;

    navigator.clipboard.writeText(text);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);
    showToast("13F Fund summary copied to clipboard!");
  };

  const handleExportCsv = () => {
    triggerHaptic("success");
    if (!selectedFund) return;
    const headers = [
      "Fund Name",
      "CIK",
      "Ticker",
      "Company Name",
      "Shares",
      "Value ($M)",
      "Portfolio Weight %",
      "Action",
      "Quarter Change %",
      "Sector",
      "AI Investment Thesis",
    ];

    const rows = selectedFund.topHoldings.map((h) => [
      `"${selectedFund.fundName}"`,
      `"${selectedFund.cik}"`,
      `"${h.symbol}"`,
      `"${h.name}"`,
      `"${h.shares}"`,
      `"${h.valueMillions}"`,
      `"${h.portfolioPercent}%"`,
      `"${h.changeType}"`,
      `"${h.changePercent}%"`,
      `"${h.sector}"`,
      `"${h.thesis.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedFund.id}_13F_Holdings_StockBloc.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${selectedFund.fundName} 13F CSV!`);
  };

  // Prepare Chart Data
  const chartHoldingsData = selectedFund?.topHoldings.map((h) => ({
    name: h.symbol,
    weight: h.portfolioPercent,
    value: h.valueMillions,
    fullName: h.name,
  })) || [];

  const chartSectorData = selectedFund?.sectorAllocation || [];

  const COLORS = ["#06b6d4", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#64748b"];

  return (
    <div className="space-y-6 font-mono text-cyan-100 select-none pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 alien-block-cut-sm bg-cyan-400 text-black font-black text-xs shadow-2xl flex items-center gap-2 border border-cyan-300"
          >
            <Zap className="w-4 h-4 fill-black text-black" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="p-5 sm:p-6 alien-block-cut bg-black/80 border border-cyan-500/40 relative overflow-hidden shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-400 text-black alien-block-cut-sm font-black shrink-0">
              <Briefcase className="w-7 h-7 fill-black text-black" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 alien-block-cut-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  SEC EDGAR FORM 13F-HR AUTOMATED FEED
                </span>
                {secIsStale ? (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 border border-amber-500/40 alien-block-cut-sm uppercase">
                    STALE DATA (&gt;24H)
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 alien-block-cut-sm">
                    LIVE API SYNC ACTIVE
                  </span>
                )}
                {isUsingLocalFallback && (
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 border border-amber-500/40 alien-block-cut-sm uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    LOCAL BACKEND PROXY (FALLBACK)
                  </span>
                )}
                <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 border border-cyan-500/30 alien-block-cut-sm">
                  Last updated: {secUpdatedAt}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                13F Institutional Intelligence Dashboard
              </h1>
              <p className="text-xs text-cyan-400/80 max-w-3xl font-sans">
                Real-time 13F filing disclosures from top institutional hedge funds and family offices. Interactive asset allocation visualizations, position flow tracking, and automated holding summaries.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={fetchFilings}
              disabled={loading}
              className="px-3.5 py-2 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer uppercase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Syncing API..." : "Refresh SEC Data"}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <Download className="w-4 h-4 text-black" />
              <span>EXPORT 13F CSV</span>
            </button>
          </div>
        </div>

        {/* Macro AI Synthesis Header Strip */}
        {macroSummary && (
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm text-xs font-sans text-cyan-200 leading-relaxed flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-mono text-[10px] uppercase text-cyan-400 block tracking-wider font-black">
                INSTITUTIONAL WHALE MACRO CONSENSUS BRIEF:
              </strong>
              {macroSummary}
            </div>
          </div>
        )}

        {/* Dashboard Sub-View Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-cyan-500/20 font-mono text-xs">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveViewMode("FUNDS");
            }}
            className={`p-2.5 alien-block-cut-sm text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border uppercase ${
              activeViewMode === "FUNDS"
                ? "bg-cyan-400 text-black border-cyan-300 font-black shadow-lg shadow-cyan-400/20"
                : "bg-black/60 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Fund 13F Dossiers</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveViewMode("WHALE_CONSENSUS");
            }}
            className={`p-2.5 alien-block-cut-sm text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border uppercase ${
              activeViewMode === "WHALE_CONSENSUS"
                ? "bg-purple-400 text-black border-purple-300 font-black shadow-lg shadow-purple-400/20"
                : "bg-black/60 text-purple-300 border-purple-500/30 hover:border-purple-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Whale Overlap & 45D Drift</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveViewMode("MACRO_BRIEF");
            }}
            className={`p-2.5 alien-block-cut-sm text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border uppercase ${
              activeViewMode === "MACRO_BRIEF"
                ? "bg-emerald-400 text-black border-emerald-300 font-black shadow-lg shadow-emerald-400/20"
                : "bg-black/60 text-emerald-300 border-emerald-500/30 hover:border-emerald-400 hover:text-white"
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Macro Liquidity Radar</span>
          </button>
        </div>

        {/* Fund Selector Navigation Pills - Only Shown in FUNDS mode */}
        {activeViewMode === "FUNDS" && (
          <div className="pt-3 border-t border-cyan-500/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {funds.map((f) => {
              const isActive = selectedFundId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedFundId(f.id);
                  }}
                  className={`px-3.5 py-2 alien-block-cut-sm text-xs font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer border uppercase ${
                    isActive
                      ? "bg-cyan-400 text-black border-cyan-300 shadow-md shadow-cyan-400/20 scale-[1.02]"
                      : "bg-black/60 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{f.fundName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? "bg-black/20 text-black" : "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {f.aum}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeViewMode === "WHALE_CONSENSUS" && (
        <WhaleConsensusMatrix />
      )}

      {activeViewMode === "MACRO_BRIEF" && (
        <MacroEconomicsBriefing />
      )}

      {activeViewMode === "FUNDS" && selectedFund && (
        <div className="space-y-6">
          {/* Fund Profile & Mandate Card */}
          <div className="p-5 alien-block-cut bg-black/60 border border-cyan-500/30 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 alien-block-cut-sm bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                  CIK #{selectedFund.cik}
                </span>
                <span className="text-[10px] text-cyan-400">
                  {selectedFund.quarter} • SEC Filed {selectedFund.filingDate}
                </span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                {selectedFund.fundName}
                <span className="text-xs text-cyan-400 font-normal">({selectedFund.manager})</span>
              </h2>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 alien-block-cut-sm text-xs font-sans text-neutral-200 leading-relaxed space-y-1">
                <span className="font-mono text-[9px] font-black text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  INVESTMENT MANDATE & STRATEGIC GOALS
                </span>
                <p>{selectedFund.mandate}</p>
              </div>
            </div>

            {/* Quick Flow Statistics Box */}
            <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 alien-block-cut-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="text-[10px] text-cyan-400 font-black uppercase">PORTFOLIO AUM</span>
                <span className="text-base font-black text-emerald-400">{selectedFund.aum}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 bg-black/50 border border-emerald-500/30 rounded">
                  <span className="text-neutral-400 block uppercase">New / Added</span>
                  <strong className="text-emerald-400 text-sm">
                    +{selectedFund.quarterFlows.newPositionsCount + selectedFund.quarterFlows.increasedCount}
                  </strong>
                </div>
                <div className="p-2 bg-black/50 border border-amber-500/30 rounded">
                  <span className="text-neutral-400 block uppercase">Trimmed / Out</span>
                  <strong className="text-amber-400 text-sm">
                    -{selectedFund.quarterFlows.decreasedCount + selectedFund.quarterFlows.soldOutCount}
                  </strong>
                </div>
              </div>

              <button
                onClick={handleCopySummary}
                className="w-full py-2 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>{copiedStatus ? "COPIED TO CLIPBOARD" : "COPY BRIEF TEXT"}</span>
              </button>
            </div>
          </div>

          {/* Recharts Visual Asset Allocation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Sector Allocation */}
            <div className="p-5 alien-block-cut bg-black/60 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <h3 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-cyan-400" />
                  Sector Asset Allocation (% Breakdown)
                </h3>
                <span className="text-[10px] text-cyan-400 font-bold">RECHARTS VISUALIZATION</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartSectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="percent"
                      nameKey="sector"
                    >
                      {chartSectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as SectorAlloc;
                          return (
                            <div className="bg-black/90 border border-cyan-400 p-2.5 alien-block-cut-sm text-xs font-mono text-cyan-100 shadow-xl">
                              <div className="font-bold text-white uppercase">{data.sector}</div>
                              <div className="text-emerald-400 font-black">{data.percent}% Portfolio Weight</div>
                              {data.valueMillions && (
                                <div className="text-neutral-400 text-[10px]">
                                  Est Value: ${data.valueMillions.toLocaleString()}M
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-[10px] font-mono text-neutral-300 uppercase">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Top Holdings Allocation Weight */}
            <div className="p-5 alien-block-cut bg-black/60 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <h3 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Top Holdings Allocation Weights (%)
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold">PORTFOLIO CONVICTION</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartHoldingsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#06b6d4"
                      fontSize={10}
                      fontFamily="monospace"
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#06b6d4"
                      fontSize={10}
                      fontFamily="monospace"
                      tickFormatter={(v) => `${v}%`}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-black/90 border border-cyan-400 p-2.5 alien-block-cut-sm text-xs font-mono text-cyan-100 shadow-xl">
                              <div className="font-bold text-white uppercase">${data.name}</div>
                              <div className="text-neutral-400 text-[10px]">{data.fullName}</div>
                              <div className="text-cyan-300 font-black">{data.weight}% Weight</div>
                              <div className="text-emerald-400 font-bold">${data.value.toLocaleString()}M Position</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                      {chartHoldingsData.map((_, index) => (
                        <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Automated Summary Table for Selected Fund Holdings */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/60 p-4 alien-block-cut border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Automated Holdings Summary Table — {selectedFund.fundName}
                </h3>
              </div>

              {/* Action Filter Pills & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/80 border border-cyan-500/30 alien-block-cut-sm p-1">
                  {[
                    { id: "ALL", label: "ALL" },
                    { id: "BUY", label: "BUYS / ADDS" },
                    { id: "NEW", label: "NEW" },
                    { id: "TRIM", label: "TRIMMED" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setFilterAction(btn.id)}
                      className={`px-2 py-0.5 text-[10px] font-black uppercase transition-all ${
                        filterAction === btn.id
                          ? "bg-cyan-400 text-black"
                          : "text-neutral-400 hover:text-cyan-300"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ticker or thesis..."
                    className="w-full bg-black/90 border border-cyan-500/40 alien-block-cut-sm pl-7 pr-2 py-1 text-[11px] text-white placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="w-full max-w-full overflow-x-auto alien-block-cut border border-cyan-500/30 bg-black/60 shadow-xl">
              {/* Desktop Table View */}
              <table className="hidden sm:table w-full text-left text-xs">
                <thead className="bg-cyan-950/60 text-cyan-300 font-black text-[10px] uppercase border-b border-cyan-500/30 whitespace-nowrap">
                  <tr>
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Company Name</th>
                    <th className="p-3">QoQ 13F Action</th>
                    <th className="p-3 text-right">Portfolio Weight</th>
                    <th className="p-3 text-right">Value ($M)</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3 min-w-[200px]">AI Strategic Thesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                  {filteredHoldings.map((h, idx) => (
                    <tr key={`${h.symbol}-${idx}`} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="p-3 font-black text-cyan-300 whitespace-nowrap">
                        ${h.symbol}
                      </td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        {h.name}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 alien-block-cut-sm text-[10px] font-black border ${
                            h.changeType === "NEW"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                              : h.changeType === "INCREASED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : h.changeType === "DECREASED"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          }`}
                        >
                          {h.changeType} ({h.changePercent >= 0 ? "+" : ""}
                          {h.changePercent}%)
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-400 whitespace-nowrap">
                        {h.portfolioPercent}%
                      </td>
                      <td className="p-3 text-right font-bold text-white whitespace-nowrap">
                        ${h.valueMillions.toLocaleString()}M
                      </td>
                      <td className="p-3 text-[11px] text-neutral-400 whitespace-nowrap">
                        {h.sector}
                      </td>
                      <td className="p-3 text-[11px] text-neutral-300 leading-relaxed font-sans min-w-[250px] max-w-[380px]">
                        {h.thesis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                {filteredHoldings.map((h, idx) => (
                  <div key={`${h.symbol}-${idx}-mob`} className="p-4 space-y-3 hover:bg-cyan-950/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg font-black text-cyan-300">${h.symbol}</div>
                        <div className="text-sm font-bold text-white">{h.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">{h.portfolioPercent}%</div>
                        <div className="text-xs font-bold text-neutral-400">${h.valueMillions.toLocaleString()}M</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 alien-block-cut-sm text-[10px] font-black border ${
                          h.changeType === "NEW"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : h.changeType === "INCREASED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : h.changeType === "DECREASED"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        }`}
                      >
                        {h.changeType} ({h.changePercent >= 0 ? "+" : ""}{h.changePercent}%)
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase border border-cyan-500/30 px-2 py-0.5 bg-black/40">
                        {h.sector}
                      </span>
                    </div>

                    <div className="bg-cyan-950/20 p-2.5 border border-cyan-500/20 text-xs font-sans text-neutral-300 leading-relaxed rounded-sm">
                      {h.thesis}
                    </div>
                  </div>
                ))}
              </div>

              {filteredHoldings.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-400">
                  No positions match the current filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* Consolidated Whales Consensus Table Across All Funds */}
          {consensus.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-cyan-500/20">
              <div className="flex items-center justify-between bg-black/60 p-4 alien-block-cut border border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Consensus Whale Conviction Leaderboard
                    </h3>
                    <p className="text-[10px] text-cyan-400/80 font-sans">
                      Top stocks held across multiple elite 13F funds ranked by total institutional capital
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-300 uppercase bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 alien-block-cut-sm">
                  CROSS-FUND AGGREGATION
                </span>
              </div>

              <div className="w-full max-w-full overflow-x-auto alien-block-cut border border-cyan-500/30 bg-black/60 shadow-xl">
                {/* Desktop Table View */}
                <table className="hidden sm:table w-full text-left text-xs">
                  <thead className="bg-cyan-950/60 text-cyan-300 font-black text-[10px] uppercase border-b border-cyan-500/30 whitespace-nowrap">
                    <tr>
                      <th className="p-3">Ticker</th>
                      <th className="p-3">Asset Name</th>
                      <th className="p-3">Whale Fund Count</th>
                      <th className="p-3 text-right">Total Capital ($M)</th>
                      <th className="p-3 text-right">Avg Weight</th>
                      <th className="p-3 min-w-[120px]">Overall Consensus</th>
                      <th className="p-3 min-w-[150px]">Top Holders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                    {consensus.map((c, idx) => (
                      <tr key={`${c.symbol}-c`} className="hover:bg-cyan-950/20 transition-colors">
                        <td className="p-3 font-black text-cyan-300 whitespace-nowrap">${c.symbol}</td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">{c.name}</td>
                        <td className="p-3 font-bold text-cyan-400 whitespace-nowrap">{c.fundCount} Elite Funds</td>
                        <td className="p-3 text-right font-black text-emerald-400 whitespace-nowrap">
                          ${c.totalValueMillions.toLocaleString()}M
                        </td>
                        <td className="p-3 text-right font-bold text-amber-300 whitespace-nowrap">{c.avgPortfolioWeight}%</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 alien-block-cut-sm text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {c.overallSentiment}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-neutral-300 font-sans">
                          {c.topHolders.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="sm:hidden flex flex-col divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                  {consensus.map((c, idx) => (
                    <div key={`${c.symbol}-m-c`} className="p-4 space-y-3 hover:bg-cyan-950/20 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-lg font-black text-cyan-300">${c.symbol}</div>
                          <div className="text-sm font-bold text-white">{c.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400">${c.totalValueMillions.toLocaleString()}M</div>
                          <div className="text-xs font-bold text-amber-300">{c.avgPortfolioWeight}% Avg Wgt</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 alien-block-cut-sm text-[10px] font-black bg-cyan-950/40 text-cyan-400 border border-cyan-500/30">
                          {c.fundCount} FUNDS
                        </span>
                        <span className="px-2 py-0.5 alien-block-cut-sm text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {c.overallSentiment}
                        </span>
                      </div>

                      <div className="bg-cyan-950/20 p-2.5 border border-cyan-500/20 text-xs font-sans text-neutral-300 rounded-sm">
                        <span className="text-cyan-400/80 uppercase font-bold text-[10px] block mb-1">Top Holders</span>
                        {c.topHolders.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live SEC Intel Feed */}
      <div className="pt-6 border-t border-cyan-500/20">
        <LiveSecIntelSection />
      </div>

    </div>
  );
};
