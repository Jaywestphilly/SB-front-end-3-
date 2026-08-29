import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  Users,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  DollarSign,
  Clock,
  Sparkles,
  PieChart,
  BarChart3,
  Flame,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { triggerHaptic } from "../../utils/haptics";

export interface WhaleConsensusItem {
  symbol: string;
  companyName: string;
  sector: string;
  fundCount: number;
  totalInstitutionalValueM: number;
  avgPortfolioWeight: number;
  sentiment: "STRONG CONVICTION BUY" | "HIGH ACCUMULATION" | "CONTRARIAN VALUE" | "MOMENTUM CONCENTRATION";
  whaleHolders: {
    fundName: string;
    managerName: string;
    weightPercent: number;
    action: "NEW BUY" | "INCREASED" | "HOLD" | "REDUCED";
    sharesHeld: string;
  }[];
  filingDatePrice: number; // 45 days ago filing benchmark price
  currentEstimatedPrice: number; // Live estimate
  estimatedPostFilingReturn: number; // % drift
  insiderBuySignal?: {
    csuiteBuyer: string;
    sharesBought: string;
    buyValueM: number;
    filingForm: "Form 4";
  };
}

const WHALE_CONSENSUS_DATA: WhaleConsensusItem[] = [
  {
    symbol: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "AI Compute & Semiconductors",
    fundCount: 6,
    totalInstitutionalValueM: 14200,
    avgPortfolioWeight: 14.8,
    sentiment: "STRONG CONVICTION BUY",
    whaleHolders: [
      { fundName: "Duquesne Family Office", managerName: "Stan Druckenmiller", weightPercent: 16.5, action: "INCREASED", sharesHeld: "4.2M" },
      { fundName: "Coatue Management", managerName: "Philippe Laffont", weightPercent: 18.2, action: "INCREASED", sharesHeld: "6.8M" },
      { fundName: "Appaloosa Management", managerName: "David Tepper", weightPercent: 12.4, action: "INCREASED", sharesHeld: "5.1M" },
      { fundName: "Bridgewater Associates", managerName: "Greg Jensen", weightPercent: 8.5, action: "NEW BUY", sharesHeld: "3.4M" },
      { fundName: "Pershing Square", managerName: "Bill Ackman", weightPercent: 6.2, action: "HOLD", sharesHeld: "2.1M" },
      { fundName: "Scion Asset Management", managerName: "Michael Burry", weightPercent: 4.8, action: "NEW BUY", sharesHeld: "1.1M" },
    ],
    filingDatePrice: 118.0,
    currentEstimatedPrice: 132.5,
    estimatedPostFilingReturn: 12.29,
    insiderBuySignal: {
      csuiteBuyer: "Director / Tech Committee",
      sharesBought: "50,000",
      buyValueM: 6.5,
      filingForm: "Form 4",
    },
  },
  {
    symbol: "VST",
    companyName: "Vistra Corp",
    sector: "Nuclear & Merchant Power",
    fundCount: 5,
    totalInstitutionalValueM: 6850,
    avgPortfolioWeight: 11.2,
    sentiment: "HIGH ACCUMULATION",
    whaleHolders: [
      { fundName: "Duquesne Family Office", managerName: "Stan Druckenmiller", weightPercent: 14.2, action: "NEW BUY", sharesHeld: "3.8M" },
      { fundName: "Coatue Management", managerName: "Philippe Laffont", weightPercent: 12.0, action: "NEW BUY", sharesHeld: "4.1M" },
      { fundName: "Appaloosa Management", managerName: "David Tepper", weightPercent: 9.8, action: "INCREASED", sharesHeld: "3.0M" },
      { fundName: "Bridgewater Associates", managerName: "Greg Jensen", weightPercent: 7.4, action: "INCREASED", sharesHeld: "2.2M" },
      { fundName: "Berkshire Hathaway", managerName: "Warren Buffett", weightPercent: 4.5, action: "NEW BUY", sharesHeld: "1.8M" },
    ],
    filingDatePrice: 88.5,
    currentEstimatedPrice: 124.0,
    estimatedPostFilingReturn: 40.11,
    insiderBuySignal: {
      csuiteBuyer: "EVP of Generation",
      sharesBought: "25,000",
      buyValueM: 2.8,
      filingForm: "Form 4",
    },
  },
  {
    symbol: "AMZN",
    companyName: "Amazon.com Inc.",
    sector: "Cloud Infrastructure & Commerce",
    fundCount: 5,
    totalInstitutionalValueM: 11400,
    avgPortfolioWeight: 12.6,
    sentiment: "STRONG CONVICTION BUY",
    whaleHolders: [
      { fundName: "Berkshire Hathaway", managerName: "Warren Buffett", weightPercent: 10.2, action: "INCREASED", sharesHeld: "10.0M" },
      { fundName: "Coatue Management", managerName: "Philippe Laffont", weightPercent: 15.6, action: "INCREASED", sharesHeld: "8.2M" },
      { fundName: "Duquesne Family Office", managerName: "Stan Druckenmiller", weightPercent: 11.4, action: "HOLD", sharesHeld: "4.5M" },
      { fundName: "Pershing Square", managerName: "Bill Ackman", weightPercent: 14.8, action: "INCREASED", sharesHeld: "7.1M" },
      { fundName: "Appaloosa Management", managerName: "David Tepper", weightPercent: 8.9, action: "HOLD", sharesHeld: "3.9M" },
    ],
    filingDatePrice: 182.0,
    currentEstimatedPrice: 198.5,
    estimatedPostFilingReturn: 9.07,
  },
  {
    symbol: "BABA",
    companyName: "Alibaba Group Holding",
    sector: "Emerging Markets / China E-Commerce",
    fundCount: 3,
    totalInstitutionalValueM: 4200,
    avgPortfolioWeight: 13.5,
    sentiment: "CONTRARIAN VALUE",
    whaleHolders: [
      { fundName: "Appaloosa Management", managerName: "David Tepper", weightPercent: 21.5, action: "INCREASED", sharesHeld: "10.2M" },
      { fundName: "Scion Asset Management", managerName: "Michael Burry", weightPercent: 12.8, action: "INCREASED", sharesHeld: "3.1M" },
      { fundName: "Coatue Management", managerName: "Philippe Laffont", weightPercent: 6.2, action: "NEW BUY", sharesHeld: "2.4M" },
    ],
    filingDatePrice: 74.0,
    currentEstimatedPrice: 84.5,
    estimatedPostFilingReturn: 14.19,
    insiderBuySignal: {
      csuiteBuyer: "Executive Chairman",
      sharesBought: "1,500,000",
      buyValueM: 110.0,
      filingForm: "Form 4",
    },
  },
  {
    symbol: "GOOGL",
    companyName: "Alphabet Inc.",
    sector: "AI Platforms & Sovereign Cloud",
    fundCount: 4,
    totalInstitutionalValueM: 9800,
    avgPortfolioWeight: 10.4,
    sentiment: "MOMENTUM CONCENTRATION",
    whaleHolders: [
      { fundName: "Pershing Square", managerName: "Bill Ackman", weightPercent: 16.4, action: "INCREASED", sharesHeld: "9.5M" },
      { fundName: "Duquesne Family Office", managerName: "Stan Druckenmiller", weightPercent: 9.2, action: "HOLD", sharesHeld: "3.2M" },
      { fundName: "Bridgewater Associates", managerName: "Greg Jensen", weightPercent: 8.1, action: "INCREASED", sharesHeld: "4.8M" },
      { fundName: "Coatue Management", managerName: "Philippe Laffont", weightPercent: 7.9, action: "INCREASED", sharesHeld: "3.6M" },
    ],
    filingDatePrice: 172.0,
    currentEstimatedPrice: 168.0,
    estimatedPostFilingReturn: -2.33,
  },
  {
    symbol: "CEG",
    companyName: "Constellation Energy Corp",
    sector: "Nuclear & Clean Baseload",
    fundCount: 4,
    totalInstitutionalValueM: 5100,
    avgPortfolioWeight: 8.9,
    sentiment: "HIGH ACCUMULATION",
    whaleHolders: [
      { fundName: "Duquesne Family Office", managerName: "Stan Druckenmiller", weightPercent: 11.8, action: "NEW BUY", sharesHeld: "2.8M" },
      { fundName: "Coatue Management", managerName: "Philippe Laffont", weightPercent: 9.4, action: "INCREASED", sharesHeld: "2.1M" },
      { fundName: "Appaloosa Management", managerName: "David Tepper", weightPercent: 7.6, action: "NEW BUY", sharesHeld: "1.6M" },
      { fundName: "Bridgewater Associates", managerName: "Greg Jensen", weightPercent: 6.8, action: "NEW BUY", sharesHeld: "1.4M" },
    ],
    filingDatePrice: 205.0,
    currentEstimatedPrice: 265.0,
    estimatedPostFilingReturn: 29.27,
  },
];

// Sector Flow Reallocation Waterfall Data (in Billions USD)
const SECTOR_FLOWS = [
  { sector: "AI Hardware & Compute", netFlowB: 18.4, color: "#06b6d4" },
  { sector: "Nuclear & Power Grid", netFlowB: 12.8, color: "#10b981" },
  { sector: "Hyperscale Cloud", netFlowB: 9.5, color: "#3b82f6" },
  { sector: "Emerging Markets Tech", netFlowB: 5.2, color: "#8b5cf6" },
  { sector: "Consumer Discretionary", netFlowB: -4.6, color: "#f59e0b" },
  { sector: "Traditional Utilities", netFlowB: -8.1, color: "#ef4444" },
];

export const WhaleConsensusMatrix: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"OVERLAP" | "LAG_ESTIMATOR" | "SECTOR_FLOWS">("OVERLAP");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredConsensus = WHALE_CONSENSUS_DATA.filter((item) => {
    const matchesSector = selectedSector === "ALL" || item.sector === selectedSector;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.symbol.toLowerCase().includes(q) ||
      item.companyName.toLowerCase().includes(q) ||
      item.whaleHolders.some((h) => h.fundName.toLowerCase().includes(q) || h.managerName.toLowerCase().includes(q));

    return matchesSector && matchesSearch;
  });

  const handleCopyConsensusRow = (item: WhaleConsensusItem) => {
    triggerHaptic("success");
    const holdersText = item.whaleHolders
      .map((h) => `• ${h.fundName} (${h.managerName}): ${h.weightPercent}% weight | Action: ${h.action}`)
      .join("\n");

    const text = `STOCK BLOC // 13F WHALE CONSENSUS INTELLIGENCE
TICKER: $${item.symbol} (${item.companyName})
SECTOR: ${item.sector}
WHALE ACCUMULATORS: ${item.fundCount} Funds | Total Allocated: $${(item.totalInstitutionalValueM / 1000).toFixed(1)}B
AVG WEIGHT: ${item.avgPortfolioWeight}% | SENTIMENT: ${item.sentiment}

45-DAY POST-FILING PERFORMANCE DRIFT:
- Filing Date Benchmark: $${item.filingDatePrice}
- Current Estimated Price: $${item.currentEstimatedPrice}
- Post-Filing Estimated Drift: ${item.estimatedPostFilingReturn > 0 ? "+" : ""}${item.estimatedPostFilingReturn.toFixed(2)}%

KEY INSTITUTIONAL HOLDERS:
${holdersText}
${item.insiderBuySignal ? `\nINSIDER COINCIDENCE (Form 4): ${item.insiderBuySignal.csuiteBuyer} purchased $${item.insiderBuySignal.buyValueM}M (${item.insiderBuySignal.sharesBought} shares)` : ""}
\nSource: SEC Form 13F & Form 4 Analysis via Stock Bloc`;

    navigator.clipboard.writeText(text);
    setCopiedSymbol(item.symbol);
    setTimeout(() => setCopiedSymbol(null), 3000);
    showToast(`Copied $${item.symbol} Whale Consensus Dossier!`);
  };

  const handleExportCsv = () => {
    triggerHaptic("success");
    const headers = [
      "Ticker",
      "Company Name",
      "Sector",
      "Whale Fund Count",
      "Total Institutional Value ($M)",
      "Avg Weight %",
      "Consensus Sentiment",
      "45D Filing Price",
      "Current Est Price",
      "Est Drift %",
      "Top Whale Managers",
    ];

    const rows = filteredConsensus.map((item) => [
      `"${item.symbol}"`,
      `"${item.companyName}"`,
      `"${item.sector}"`,
      item.fundCount,
      item.totalInstitutionalValueM,
      item.avgPortfolioWeight,
      `"${item.sentiment}"`,
      item.filingDatePrice,
      item.currentEstimatedPrice,
      `${item.estimatedPostFilingReturn}%`,
      `"${item.whaleHolders.map((h) => `${h.managerName} (${h.action})`).join("; ")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stock_Bloc_13F_Whale_Consensus_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported 13F Whale Consensus CSV!");
  };

  return (
    <div className="space-y-6 font-mono text-cyan-100 select-none pb-8">
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

      {/* Header Banner */}
      <div className="p-5 alien-block-cut bg-black/85 border border-cyan-500/40 relative overflow-hidden shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-400 text-black alien-block-cut-sm font-black shrink-0">
              <Users className="w-7 h-7 fill-black text-black" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 alien-block-cut-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  13F MULTI-WHALE CROSS-FILING OVERLAP
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30 alien-block-cut-sm">
                  {WHALE_CONSENSUS_DATA.length} Consensus Super-Holdings
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                Whale Consensus & 45-Day Lag Intelligence
              </h2>
              <p className="text-xs text-cyan-400/80 max-w-3xl font-sans">
                Cross-fund conviction analyzer comparing filings from Buffett, Tepper, Druckenmiller, Laffont, Ackman, Jensen, and Burry. Identifies crowded longs, contrarian bets, and calculates post-filing mark-to-market drift.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <Download className="w-4 h-4 text-black" />
              <span>EXPORT CONSENSUS CSV</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-cyan-500/20 font-mono text-xs">
          {[
            { id: "OVERLAP", label: "Whale Overlap Matrix", icon: Users },
            { id: "LAG_ESTIMATOR", label: "45-Day Mark-to-Market Drift", icon: Clock },
            { id: "SECTOR_FLOWS", label: "Quarterly Sector Reallocation", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`p-2.5 alien-block-cut-sm text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border uppercase ${
                  isActive
                    ? "bg-cyan-400 text-black border-cyan-300 font-black shadow-lg shadow-cyan-400/20"
                    : "bg-black/60 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: WHALE OVERLAP MATRIX */}
      {activeTab === "OVERLAP" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/70 p-3 alien-block-cut-sm border border-cyan-500/30">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, manager (Buffett, Tepper, Druckenmiller)..."
                className="w-full bg-black/80 border border-cyan-500/40 alien-block-cut-sm pl-8 pr-3 py-1.5 text-xs text-white placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {["ALL", "AI Compute & Semiconductors", "Nuclear & Merchant Power", "Cloud Infrastructure & Commerce", "Emerging Markets / China E-Commerce"].map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedSector(sec);
                  }}
                  className={`px-2.5 py-1 alien-block-cut-sm text-[10px] font-bold shrink-0 border uppercase transition-all ${
                    selectedSector === sec
                      ? "bg-cyan-400 text-black border-cyan-300"
                      : "bg-black/60 text-cyan-400 border-cyan-500/30 hover:text-white"
                  }`}
                >
                  {sec === "ALL" ? "All Sectors" : sec}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredConsensus.map((item) => (
              <div
                key={item.symbol}
                className="p-4 sm:p-5 bg-black/80 border border-cyan-500/30 alien-block-cut-sm space-y-4 hover:border-cyan-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white">${item.symbol}</span>
                        <span className="text-xs text-neutral-400">{item.companyName}</span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase">{item.sector}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 alien-block-cut-sm bg-cyan-400 text-black uppercase">
                        {item.fundCount} Top Funds
                      </span>
                      <button
                        onClick={() => handleCopyConsensusRow(item)}
                        className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 alien-block-cut-sm transition-all"
                        title="Copy Dossier"
                      >
                        {copiedSymbol === item.symbol ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 bg-cyan-950/30 alien-block-cut-sm">
                      <span className="text-[10px] text-neutral-400 block">TOTAL VALUE</span>
                      <strong className="text-white text-sm">${(item.totalInstitutionalValueM / 1000).toFixed(1)}B</strong>
                    </div>
                    <div className="p-2 bg-cyan-950/30 alien-block-cut-sm">
                      <span className="text-[10px] text-neutral-400 block">AVG WEIGHT</span>
                      <strong className="text-cyan-300 text-sm">{item.avgPortfolioWeight}%</strong>
                    </div>
                    <div className="p-2 bg-cyan-950/30 alien-block-cut-sm">
                      <span className="text-[10px] text-neutral-400 block">EST 45D DRIFT</span>
                      <strong
                        className={`text-sm flex items-center justify-center gap-0.5 ${
                          item.estimatedPostFilingReturn >= 0 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {item.estimatedPostFilingReturn >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {item.estimatedPostFilingReturn.toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  {/* Top Fund Holders Pill Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                      Whale Managers Holding ${item.symbol}:
                    </span>
                    <div className="space-y-1">
                      {item.whaleHolders.map((holder, hIdx) => (
                        <div
                          key={hIdx}
                          className="flex items-center justify-between text-xs p-1.5 bg-black/60 border border-cyan-500/20 alien-block-cut-sm"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold">{holder.managerName}</span>
                            <span className="text-[10px] text-neutral-500">({holder.fundName})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-300 font-mono font-bold">{holder.weightPercent}% AUM</span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 alien-block-cut-sm ${
                                holder.action === "NEW BUY"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : holder.action === "INCREASED"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                  : "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              {holder.action}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form 4 Insider Buy Overlay If Available */}
                  {item.insiderBuySignal && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 alien-block-cut-sm text-xs flex items-center justify-between text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          <strong>Insider Buy Overlay ({item.insiderBuySignal.filingForm}):</strong> {item.insiderBuySignal.csuiteBuyer} purchased ${item.insiderBuySignal.buyValueM}M
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.5 alien-block-cut-sm shrink-0">
                        DUAL ALPHA SIGNAL
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: 45-DAY MARK-TO-MARKET DRIFT ESTIMATOR */}
      {activeTab === "LAG_ESTIMATOR" && (
        <div className="space-y-4">
          <div className="p-5 alien-block-cut bg-black/80 border border-cyan-500/30 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                45-Day SEC 13F Lag & Real-Time Mark-to-Market Estimator
              </h3>
              <p className="text-xs text-cyan-400/80 font-sans">
                Form 13F filings are reported 45 days after quarter-end. This tracker models how much the whale positions have gained or lost in real-time since the official quarter-end pricing benchmark date.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-cyan-500/20">
                <thead className="bg-cyan-950/60 text-cyan-300 uppercase text-[10px] border-b border-cyan-500/30">
                  <tr>
                    <th className="p-3">Symbol & Company</th>
                    <th className="p-3">Whale Funds</th>
                    <th className="p-3">Quarter-End Price</th>
                    <th className="p-3">Current Est. Price</th>
                    <th className="p-3">Post-Filing Return</th>
                    <th className="p-3">Est. Whale Dollar Gain ($M)</th>
                    <th className="p-3">Conviction Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {filteredConsensus.map((item) => {
                    const estDollarGain = (item.totalInstitutionalValueM * (item.estimatedPostFilingReturn / 100)).toFixed(1);
                    return (
                      <tr key={item.symbol} className="hover:bg-cyan-950/20 transition-all">
                        <td className="p-3">
                          <div className="font-black text-white text-sm">${item.symbol}</div>
                          <div className="text-[10px] text-neutral-400">{item.companyName}</div>
                        </td>
                        <td className="p-3 text-cyan-300 font-bold">{item.fundCount} Whale Funds</td>
                        <td className="p-3 text-neutral-400">${item.filingDatePrice.toFixed(2)}</td>
                        <td className="p-3 text-white font-bold">${item.currentEstimatedPrice.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`font-black flex items-center gap-1 ${
                              item.estimatedPostFilingReturn >= 0 ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {item.estimatedPostFilingReturn >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {item.estimatedPostFilingReturn > 0 ? "+" : ""}
                            {item.estimatedPostFilingReturn.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-3 text-white font-mono font-bold">
                          {Number(estDollarGain) >= 0 ? `+$${estDollarGain}M` : `-$${Math.abs(Number(estDollarGain))}M`}
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-black px-2 py-0.5 alien-block-cut-sm bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            {item.sentiment}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: QUARTERLY SECTOR REALLOCATION WATERFALL */}
      {activeTab === "SECTOR_FLOWS" && (
        <div className="space-y-4">
          <div className="p-5 alien-block-cut bg-black/80 border border-cyan-500/30 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Aggregated 13F Sector Capital Flow Waterfall ($ Billions Net)
              </h3>
              <p className="text-xs text-cyan-400/80 font-sans">
                Net institutional capital rotation across key sectors during the last 13F reporting period.
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SECTOR_FLOWS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="sector" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}B`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#06b6d4", borderRadius: "4px", fontSize: "12px" }}
                    formatter={(value: any) => [`$${value} Billion`, "Net 13F Flow"]}
                  />
                  <Bar dataKey="netFlowB" radius={[4, 4, 0, 0]}>
                    {SECTOR_FLOWS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.netFlowB >= 0 ? "#06b6d4" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-cyan-400 font-bold uppercase">TOP INFLOW SECTOR</span>
                <div className="text-base font-black text-white">AI Hardware & Compute (+$18.4B)</div>
                <p className="text-[11px] text-neutral-400 font-sans">Heavyweight additions in NVDA, TSM, and ASML.</p>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">FASTEST GROWING THEME</span>
                <div className="text-base font-black text-emerald-300">Nuclear & Power Grid (+$12.8B)</div>
                <p className="text-[11px] text-neutral-400 font-sans">Aggressive institutional buys in VST and CEG.</p>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm">
                <span className="text-[10px] text-red-400 font-bold uppercase">PRIMARY OUTFLOW SECTOR</span>
                <div className="text-base font-black text-red-400">Traditional Utilities (-$8.1B)</div>
                <p className="text-[11px] text-neutral-400 font-sans">Rotation out of regulated non-merchant legacy power.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
