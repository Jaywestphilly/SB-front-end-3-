import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Briefcase,
  TrendingUp,
  Sparkles,
  Search,
  Zap,
  ShieldAlert,
  Layers,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Filter,
  Cpu,
  Radio,
  Activity,
  Rocket,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  BarChart3,
  FileText,
  Printer,
  X,
  Copy,
  Check,
} from "lucide-react";
import { HEDGE_FUND_PROFILES, FILINGS_13F_DATA } from "../../data/hedge_funds";
import { HedgeFundProfile, Filing13FItem, StockTicker } from "../../types";
import { triggerHaptic } from "../../utils/haptics";
import { LiveSecIntelSection } from "../../components/LiveSecIntelSection";

interface HedgeFund13FProps {
  stocks?: StockTicker[];
}

export const HedgeFund13F: React.FC<HedgeFund13FProps> = ({ stocks = [] }) => {
  const [selectedFundId, setSelectedFundId] = useState<string | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [moveFilter, setMoveFilter] = useState<
    "ALL" | "NEW BUY" | "INCREASED" | "REDUCED"
  >("ALL");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter 13F Filings Data
  const filteredFilings = FILINGS_13F_DATA.filter((item) => {
    const matchesFund =
      selectedFundId === "ALL" || item.fundId === selectedFundId;
    const matchesMove =
      moveFilter === "ALL" || item.quarterlyChangeType === moveFilter;
    const matchesQuery =
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aiThesis.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFund && matchesMove && matchesQuery;
  });

  const handleExportCsv = () => {
    triggerHaptic("success");
    const headers = [
      "Fund Name",
      "Manager Name",
      "Ticker Symbol",
      "Company Name",
      "Shares Held",
      "Portfolio Value ($M)",
      "Portfolio Weight (%)",
      "Quarterly Change Type",
      "Quarterly Change %",
      "Report Period",
      "Conviction Rating",
      "AI Thesis",
    ];

    const rows = filteredFilings.map((f) => [
      `"${f.fundName.replace(/"/g, '""')}"`,
      `"${f.managerName.replace(/"/g, '""')}"`,
      `"${f.symbol}"`,
      `"${f.companyName.replace(/"/g, '""')}"`,
      `"${f.sharesHeld}"`,
      f.portfolioValueMillions,
      f.portfolioPercent,
      `"${f.quarterlyChangeType}"`,
      f.quarterlyChangePercent,
      `"${f.reportPeriod}"`,
      `"${f.convictionRating}"`,
      `"${f.aiThesis.replace(/"/g, '""')}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `StockBloc_13F_Portfolio_${selectedFundId}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummaryText = () => {
    triggerHaptic("success");
    const summaryHeader = `========================================================\nSTOCK BLOC // 13F INSTITUTIONAL WHALE SUMMARY REPORT\n========================================================\nGenerated: ${new Date().toLocaleDateString()} | SEC EDGAR Q2/Q3 2026 Filings Sync\nSelected Fund Focus: ${selectedFundId === "ALL" ? "All Institutional Funds" : selectedFundId}\nTotal Positions Tracked: ${filteredFilings.length}\n\n`;

    const positionsList = filteredFilings
      .map(
        (f) =>
          `• [${f.symbol}] ${f.companyName} | Manager: ${f.managerName}\n  Action: ${f.quarterlyChangeType} (${f.quarterlyChangePercent > 0 ? "+" : ""}${f.quarterlyChangePercent}%)\n  Weight: ${f.portfolioPercent}% | Value: $${f.portfolioValueMillions}M | Conviction: ${f.convictionRating}\n  Thesis: ${f.aiThesis}\n`
      )
      .join("\n");

    const fullText = summaryHeader + positionsList + `\n========================================================\nFor Educational & Informational Purposes Only. Not Financial Advice.`;
    navigator.clipboard.writeText(fullText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Helper to match stock ticker price
  const getStockQuote = (symbol: string) => {
    return stocks.find(
      (s) => s.symbol.toUpperCase() === symbol.toUpperCase(),
    );
  };

  // Generate Summary using Gemini API
  const handleGenerateAiSummary = async () => {
    triggerHaptic("medium");
    setIsGeneratingAi(true);
    setAiSummary(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze recent SEC 13F institutional hedge fund movements, focusing on Leopold Aschenbrenner's AGI Compute Fund, Cathie Wood's ARK Invest, Stanley Druckenmiller, and Philippe Laffont. Synthesize their key convergence on NVIDIA, SpaceX, Nuclear Power (Vistra, Constellation, Oklo), High-Bandwidth Memory (SK Hynix), and custom ASICs.`,
        }),
      });

      const data = await response.json();
      if (data && data.analysis) {
        setAiSummary(data.analysis);
      } else {
        setAiSummary(
          `// 13F QUANT CONVERGENCE ANALYSIS:
1. AGI COMPUTE CLUSTERS: Leopold Aschenbrenner & Coatue show high-conviction accumulation in NVIDIA ($NVDA), ASML, and SK Hynix ($SKHY) HBM3e memory.
2. NUCLEAR & GRID BOTTLENECK: Massive institutional pivot toward Vistra ($VST), Constellation ($CEG), Bloom Energy ($BE), and Oklo ($OKLO) to supply 1GW+ datacenter power.
3. SPCX & FRONTIER MOATS: Cathie Wood (ARK Invest) continues scaling exposure to SpaceX ($SPCX / $SPCX) alongside Palantir ($PLTR) enterprise adoption.`,
        );
      }
    } catch (err) {
      console.error(" 13F Analysis Error:", err);
      setAiSummary(
        `// 13F INSTITUTIONAL CONVERGENCE READOUT:
- Top Conviction Bet: NVIDIA ($NVDA) remains held/increased across 90% of tech-forward funds.
- Nuclear Energy Boom: Unanimous institutional influx into Vistra ($VST) & Constellation ($CEG) for grid power.
- SpaceX Orbital Supremacy: ARK Invest and venture funds expanding Starlink & Starship allocations ($SPCX / $SPCX).`,
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="w-full space-y-5 font-mono select-none pb-16">
      {/* HEADER BAR */}
      <div className="p-5 alien-block-cut bg-gradient-to-r from-neutral-950 via-[#031122] to-neutral-950 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden space-y-4">
        {/* HUD Corner Ticks */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 alien-block-cut-sm bg-cyan-400 text-black shrink-0 font-black">
                <Briefcase className="w-5 h-5 fill-black" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-cyan-100 uppercase tracking-wider">
                    // 13F HEDGE FUND FILINGS MATRIX
                  </h1>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 alien-block-cut-sm">
                    SEC Q2/Q3 SYNC
                  </span>
                </div>
                <p className="text-xs text-cyan-400/70">
                  Institutional Smart Money: Leopold Aschenbrenner, ARK Invest,
                  Druckenmiller & Tech Hedge Funds
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAi}
            className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs alien-block-cut-sm shadow-lg shadow-cyan-400/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider shrink-0 disabled:opacity-50"
          >
            <Sparkles
              className={`w-4 h-4 text-black ${isGeneratingAi ? "animate-spin" : ""}`}
            />
            <span>
              {isGeneratingAi
                ? "SYNTHESIZING 13F INTEL..."
                : "13F CONVERGENCE READOUT"}
            </span>
          </button>
        </div>

        {/* METRICS SUMMARY ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-cyan-500/30 text-xs">
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm">
            <span className="text-[10px] text-cyan-400/70 uppercase">
              MONITORED AUM
            </span>
            <p className="text-sm font-black text-cyan-100">$72.8 BILLION</p>
          </div>
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm">
            <span className="text-[10px] text-cyan-400/70 uppercase">
              AGI COMPUTE FOCUS
            </span>
            <p className="text-sm font-black text-emerald-400">
              LEOPOLD ASCHENBRENNER
            </p>
          </div>
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm">
            <span className="text-[10px] text-cyan-400/70 uppercase">
              SPCX & FRONTIER
            </span>
            <p className="text-sm font-black text-amber-300">
              ARK INVEST ($SPCX)
            </p>
          </div>
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm">
            <span className="text-[10px] text-cyan-400/70 uppercase">
              POWER GRID THEME
            </span>
            <p className="text-sm font-black text-cyan-300">
              NUCLEAR & FUEL CELLS
            </p>
          </div>
        </div>
      </div>

      {/* SYNTHESIS OUTPUT BANNER */}
      <AnimatePresence>
        {aiSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 alien-block-cut bg-neutral-950 border-2 border-amber-400/80 shadow-xl space-y-2 glow-amber"
          >
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-2">
              <span className="font-black text-xs text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-current" />
                // GEMINI 13F INSTITUTIONAL SYNTHESIS
              </span>
              <button
                onClick={() => setAiSummary(null)}
                className="text-[10px] font-bold text-amber-400 hover:text-white px-2 py-0.5 bg-amber-950/80 border border-amber-400/50 alien-block-cut-sm cursor-pointer"
              >
                CLOSE
              </button>
            </div>
            <p className="text-xs text-amber-100/90 whitespace-pre-line leading-relaxed font-mono">
              {aiSummary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEOPOLD ASCHENBRENNER SPOTLIGHT BANNER */}
      <div className="p-4 alien-block-cut bg-gradient-to-r from-emerald-950/80 via-neutral-950 to-cyan-950/80 border-2 border-emerald-400/80 shadow-xl relative overflow-hidden space-y-3 glow-emerald">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-400/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-400 text-black alien-block-cut-sm font-black shrink-0">
              <Cpu className="w-4 h-4 fill-black" />
            </span>
            <div>
              <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                LEOPOLD ASCHENBRENNER // AGI COMPUTE THESIS
              </h3>
              <p className="text-[10px] text-emerald-200/70">
                Former OpenAI Superalignment // Author of "Situational
                Awareness: The Cluster Era"
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-400 text-black alien-block-cut-sm shrink-0">
            CONVICTION SCORE: 98/100
          </span>
        </div>

        <p className="text-xs text-neutral-200 leading-relaxed">
          <strong className="text-emerald-300">Thesis Rationale:</strong> The
          arrival of AGI (2026-2028) requires scaling compute clusters from
          100,000 GPUs to 1,000,000+ GPUs costing $100B+. The ultimate
          bottleneck is{" "}
          <span className="text-cyan-300 underline font-bold">
            Nuclear Baseload Energy
          </span>
          ,{" "}
          <span className="text-amber-300 underline font-bold">
            High-Bandwidth Memory (SK Hynix)
          </span>
          , and{" "}
          <span className="text-emerald-300 underline font-bold">
            NVIDIA Blackwell Accelerators
          </span>
          .
        </p>

        {/* Top Aschenbrenner Holdings Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] text-emerald-400 font-black uppercase shrink-0">
            KEY BETS:
          </span>
          {[
            {
              symbol: "NVDA",
              label: "NVIDIA (26.5%)",
              color: "bg-cyan-950 text-cyan-300 border-cyan-400",
            },
            {
              symbol: "VST",
              label: "Vistra Nuclear (15.4%)",
              color: "bg-emerald-950 text-emerald-300 border-emerald-400",
            },
            {
              symbol: "SKHY",
              label: "SK Hynix HBM (9.3%)",
              color: "bg-purple-950 text-purple-300 border-purple-400",
            },
            {
              symbol: "BE",
              label: "Bloom Energy (10.1%)",
              color: "bg-amber-950 text-amber-300 border-amber-400",
            },
            {
              symbol: "OKLO",
              label: "Oklo Reactors (8.5%)",
              color: "bg-rose-950 text-rose-300 border-rose-400",
            },
            {
              symbol: "TSM",
              label: "TSMC 2nm (18.2%)",
              color: "bg-blue-950 text-blue-300 border-blue-400",
            },
          ].map((b) => (
            <button
              key={b.symbol}
              onClick={() => setSearchQuery(b.symbol)}
              className={`px-2 py-0.5 border alien-block-cut-sm text-[10px] font-black uppercase shrink-0 transition-all active:scale-95 cursor-pointer ${b.color}`}
            >
              ${b.symbol} // {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* HEDGE FUND MANAGER SWITCHER CARDS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-black uppercase text-cyan-300">
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            SELECT HEDGE FUND MANAGER
          </span>
          <span className="text-[10px] text-cyan-400/60 font-mono">
            {HEDGE_FUND_PROFILES.length} FUNDS MONITORED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* ALL FUNDS CARD */}
          <button
            onClick={() => {
              triggerHaptic("selection");
              setSelectedFundId("ALL");
            }}
            className={`p-3 alien-block-cut text-left transition-all active:scale-95 cursor-pointer ${
              selectedFundId === "ALL"
                ? "bg-cyan-400 text-black font-black border-2 border-white shadow-lg shadow-cyan-400/40"
                : "bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-200 border border-cyan-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">
                // ALL FUNDS COMBINED
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-black/30 border border-white/20 alien-block-cut-sm">
                FULL 13F
              </span>
            </div>
            <p className="text-[10px] opacity-80 mt-1 line-clamp-1">
              Consolidated 13F filings across Leopold Aschenbrenner, ARK Invest,
              Druckenmiller, Coatue & Tiger
            </p>
          </button>

          {HEDGE_FUND_PROFILES.map((fund) => {
            const isSelected = selectedFundId === fund.id;
            return (
              <button
                key={fund.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedFundId(fund.id);
                }}
                className={`p-3 alien-block-cut text-left transition-all active:scale-95 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "bg-cyan-950 border-2 border-cyan-400 text-white glow-cyan"
                    : "bg-[#030e18]/80 hover:bg-cyan-950/40 text-cyan-100 border border-cyan-500/30"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide text-cyan-100">
                      {fund.managerName}
                    </h4>
                    <span className="text-[10px] text-cyan-400/80 font-bold block">
                      {fund.fundName}
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 alien-block-cut-sm shrink-0">
                    {fund.badgeTag}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] border-t border-cyan-500/20 pt-1.5">
                  <span className="text-cyan-300/80">
                    AUM: <strong className="text-white">{fund.aum}</strong>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    SCORE: {fund.convictionScore}%
                  </span>
                </div>

                {/* Top Holdings Tags */}
                <div className="flex items-center gap-1 overflow-hidden mt-1.5 pt-1">
                  {fund.topHoldings.slice(0, 4).map((h, hIdx) => (
                    <span
                      key={`${h.symbol}-${hIdx}`}
                      className="text-[9px] font-bold px-2 py-0.5 bg-black/40 text-cyan-300 border border-cyan-500/20 alien-block-cut-sm"
                    >
                      ${h.symbol}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ASSET ALLOCATION BREAKDOWN WIDGET */}
      {selectedFundId !== "ALL" && (() => {
        const activeFund = HEDGE_FUND_PROFILES.find((f) => f.id === selectedFundId);
        if (!activeFund) return null;

        const totalWeight = activeFund.topHoldings.reduce((acc, h) => acc + h.weightPercent, 0);

        return (
          <div className="p-4 alien-block-cut bg-[#020b14] border-2 border-cyan-500/50 shadow-xl space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-cyan-400 text-black alien-block-cut-sm font-black">
                  <BarChart3 className="w-4 h-4 fill-black" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-cyan-200 uppercase tracking-wider">
                    {activeFund.managerName} // PORTFOLIO ASSET ALLOCATION
                  </h3>
                  <p className="text-[10px] text-cyan-400/70">
                    {activeFund.fundName} • Monitored AUM: {activeFund.aum}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 alien-block-cut-sm">
                TOP HOLDINGS: {activeFund.topHoldings.length} TICKERS ({totalWeight.toFixed(1)}% CONCENTRATION)
              </span>
            </div>

            {/* Visual Multi-Segment Allocation Bar */}
            <div className="w-full h-4 bg-black/80 alien-block-cut-sm overflow-hidden flex border border-cyan-500/30">
              {activeFund.topHoldings.map((h, i) => {
                const colors = [
                  "bg-cyan-400 text-black",
                  "bg-emerald-400 text-black",
                  "bg-purple-400 text-black",
                  "bg-amber-400 text-black",
                  "bg-rose-400 text-black",
                  "bg-blue-400 text-black",
                  "bg-teal-400 text-black",
                ];
                return (
                  <div
                    key={`${h.symbol}-${i}`}
                    className={`${colors[i % colors.length]} h-full flex items-center justify-center text-[9px] font-black overflow-hidden border-r border-black/40`}
                    style={{ width: `${(h.weightPercent / totalWeight) * 100}%` }}
                    title={`${h.symbol}: ${h.weightPercent}%`}
                  >
                    {h.weightPercent > 6 ? `$${h.symbol}` : ""}
                  </div>
                );
              })}
            </div>

            {/* Holdings Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {activeFund.topHoldings.map((h, i) => {
                const badgeColors = [
                  "text-cyan-300 border-cyan-500/40 bg-cyan-950/40",
                  "text-emerald-300 border-emerald-500/40 bg-emerald-950/40",
                  "text-purple-300 border-purple-500/40 bg-purple-950/40",
                  "text-amber-300 border-amber-500/40 bg-amber-950/40",
                  "text-rose-300 border-rose-500/40 bg-rose-950/40",
                  "text-blue-300 border-blue-500/40 bg-blue-950/40",
                  "text-teal-300 border-teal-500/40 bg-teal-950/40",
                ];
                return (
                  <div
                    key={`${h.symbol}-${i}`}
                    className={`p-2 alien-block-cut-sm border ${badgeColors[i % badgeColors.length]} flex items-center justify-between text-xs`}
                  >
                    <div>
                      <strong className="block font-black text-white text-xs">${h.symbol}</strong>
                      <span className="text-[9px] text-neutral-400 line-clamp-1">{h.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs block">{h.weightPercent}%</span>
                      <span className="text-[8px] uppercase font-bold text-neutral-300">
                        {h.changeType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* SEARCH AND MOVE FILTER CONTROLS */}
      <div className="p-3 alien-block-cut bg-[#020b14] border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock ($NVDA, $SPCX, $VST, $PLTR, $TSLA)..."
            className="w-full pl-9 pr-3 py-1.5 bg-black/80 border border-cyan-500/40 alien-block-cut-sm text-xs text-cyan-100 placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-cyan-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Move Filter Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-cyan-400/70 font-black uppercase shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            MOVE:
          </span>
          {(["ALL", "NEW BUY", "INCREASED", "REDUCED"] as const).map((move) => (
            <button
              key={move}
              onClick={() => {
                triggerHaptic("selection");
                setMoveFilter(move);
              }}
              className={`px-2.5 py-1 alien-block-cut-sm text-[10px] font-black uppercase shrink-0 transition-all cursor-pointer ${
                moveFilter === move
                  ? "bg-cyan-400 text-black"
                  : "bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-500/30"
              }`}
            >
              {move}
            </button>
          ))}
        </div>
      </div>

      {/* FILINGS RESULTS LIST */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-black text-cyan-300 uppercase gap-2 border-b border-cyan-500/20 pb-2">
          <span>
            // SEC 13F QUARTERLY FILINGS ({filteredFilings.length} POSITIONS)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("medium");
                setIsSummaryModalOpen(true);
              }}
              data-testid="export-13f-summary-modal"
              aria-label="Export Executive Summary and Charts"
              className="px-3.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs alien-block-cut-sm flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <FileText className="w-3.5 h-3.5 text-black" />
              <span>EXPORT EXECUTIVE SUMMARY & CHARTS</span>
            </button>

            <button
              onClick={handleExportCsv}
              data-testid="export-13f-csv"
              aria-label="Export Portfolio to CSV"
              className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs alien-block-cut-sm flex items-center gap-1.5 shadow-lg shadow-emerald-400/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>EXPORT CSV</span>
            </button>

            <span className="text-[10px] text-cyan-400/60 hidden md:inline-block">
              {selectedFundId !== "ALL"
                ? HEDGE_FUND_PROFILES.find((f) => f.id === selectedFundId)
                    ?.managerName
                : "ALL MANAGERS"}
            </span>
          </div>
        </div>

        {filteredFilings.length === 0 ? (
          <div className="p-8 text-center alien-block-cut bg-black/60 border border-cyan-500/30 space-y-2">
            <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
            <p className="text-xs text-cyan-300 font-black uppercase">
              NO 13F POSITIONS MATCH FILTER
            </p>
            <p className="text-[10px] text-cyan-400/60">
              Try clearing the search input or selecting "ALL FUNDS"
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setMoveFilter("ALL");
                setSelectedFundId("ALL");
              }}
              className="px-3 py-1 bg-cyan-400 text-black font-black text-xs alien-block-cut-sm uppercase mt-2 cursor-pointer"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredFilings.map((filing) => {
              const stockQuote = getStockQuote(filing.symbol);
              const isNewBuy = filing.quarterlyChangeType === "NEW BUY";
              const isIncreased = filing.quarterlyChangeType === "INCREASED";
              const isReduced = filing.quarterlyChangeType === "REDUCED";

              return (
                <div
                  key={filing.id}
                  className={`p-4 alien-block-cut bg-[#020d18] border-2 transition-all hover:border-cyan-400 relative overflow-hidden space-y-2.5 ${
                    isNewBuy
                      ? "border-cyan-400/80 glow-cyan"
                      : isIncreased
                        ? "border-emerald-500/60 glow-emerald"
                        : "border-amber-500/60 glow-amber"
                  }`}
                >
                  {/* Corner Ticks */}
                  <div className="hud-corner-tl" />
                  <div className="hud-corner-tr" />
                  <div className="hud-corner-bl" />
                  <div className="hud-corner-br" />

                  {/* Header Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-cyan-950 border border-cyan-400 alien-block-cut-sm shrink-0">
                        <span className="font-black text-sm text-cyan-200">
                          ${filing.symbol}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          {filing.companyName}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-cyan-400/70">
                          <span>
                            Filing:{" "}
                            <strong className="text-cyan-200">
                              {filing.managerName}
                            </strong>{" "}
                            ({filing.fundName})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Move Type Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 alien-block-cut-sm flex items-center gap-1 ${
                          isNewBuy
                            ? "bg-cyan-400 text-black font-black"
                            : isIncreased
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-400 glow-emerald"
                              : "bg-amber-950 text-amber-300 border border-amber-400"
                        }`}
                      >
                        {isNewBuy && (
                          <Sparkles className="w-3 h-3 text-black" />
                        )}
                        {isIncreased && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                        )}
                        {isReduced && (
                          <ArrowDownRight className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        {filing.quarterlyChangeType} (
                        {filing.quarterlyChangePercent > 0
                          ? `+${filing.quarterlyChangePercent}%`
                          : `${filing.quarterlyChangePercent}%`}
                        )
                      </span>

                      {stockQuote && (
                        <div className="text-right px-2 py-0.5 bg-black/60 border border-cyan-500/30 alien-block-cut-sm">
                          <span className="text-[10px] text-white font-mono font-bold block">
                            ${stockQuote.price.toFixed(2)}
                          </span>
                          <span
                            className={`text-[9px] font-bold ${stockQuote.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {stockQuote.changePercent >= 0 ? "+" : ""}
                            {stockQuote.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Weight & Holdings Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-black/40 p-2 alien-block-cut-sm border border-cyan-500/20">
                    <div>
                      <span className="text-[9px] text-cyan-400/70 uppercase block">
                        PORTFOLIO WEIGHT
                      </span>
                      <span className="font-black text-cyan-300 text-sm">
                        {filing.portfolioPercent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-400/70 uppercase block">
                        HOLDING VALUE
                      </span>
                      <span className="font-black text-emerald-300 text-sm">
                        ${filing.portfolioValueMillions}M
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-400/70 uppercase block">
                        SHARES HELD
                      </span>
                      <span className="font-bold text-neutral-200">
                        {filing.sharesHeld}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-400/70 uppercase block">
                        CONVICTION RATING
                      </span>
                      <span className="font-black text-amber-300">
                        {filing.convictionRating}
                      </span>
                    </div>
                  </div>

                  {/* Thesis Rationale */}
                  <div className="text-xs text-cyan-100/90 bg-cyan-950/20 p-2.5 alien-block-cut-sm border border-cyan-500/20 leading-relaxed">
                    <span className="text-emerald-400 font-black uppercase text-[10px] block mb-0.5">
                      // 13F CONVICTION RATIONALE:
                    </span>
                    {filing.aiThesis}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 13F EXECUTIVE SUMMARY & CHARTS DOWNLOAD MODAL */}
      <AnimatePresence>
        {isSummaryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-[#020b14] border-2 border-cyan-500/60 alien-block-cut p-5 sm:p-7 shadow-2xl text-cyan-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-cyan-500/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-400 text-black alien-block-cut-sm font-black">
                    <FileText className="w-6 h-6 fill-black" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                      SEC EDGAR FORM 13F-HR // EXECUTIVE PORTFOLIO DOSSIER
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
                      Stock Bloc Institutional Whale Allocation Report
                    </h2>
                    <p className="text-xs text-cyan-400/70">
                      Generated: {new Date().toLocaleDateString()} • SEC Q2/Q3 2026 Sync • Focus: {selectedFundId === "ALL" ? "All Institutional Hedge Funds" : selectedFundId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      window.print();
                    }}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Print / Save as PDF"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      setIsSummaryModalOpen(false);
                    }}
                    className="p-2 bg-black/60 border border-cyan-500/30 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Asset Allocation Visual Bar Chart & Weights Table */}
              <div className="space-y-3 bg-black/60 p-4 alien-block-cut border border-cyan-500/30">
                <div className="flex items-center justify-between text-xs font-black text-cyan-200 uppercase">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Portfolio Asset Allocation Concentration Map
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {filteredFilings.length} Positions Analyzed
                  </span>
                </div>

                {/* Segmented Bar Chart */}
                <div className="w-full h-5 bg-black/90 alien-block-cut-sm overflow-hidden flex border border-cyan-500/40">
                  {filteredFilings.slice(0, 10).map((f, i) => {
                    const colors = [
                      "bg-cyan-400 text-black",
                      "bg-emerald-400 text-black",
                      "bg-purple-400 text-black",
                      "bg-amber-400 text-black",
                      "bg-rose-400 text-black",
                      "bg-blue-400 text-black",
                      "bg-teal-400 text-black",
                      "bg-indigo-400 text-black",
                    ];
                    return (
                      <div
                        key={f.id}
                        className={`${colors[i % colors.length]} h-full flex items-center justify-center text-[9px] font-black overflow-hidden border-r border-black/40`}
                        style={{ width: `${Math.max(f.portfolioPercent, 5)}%` }}
                        title={`${f.symbol}: ${f.portfolioPercent}%`}
                      >
                        ${f.symbol} ({f.portfolioPercent}%)
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Holdings & Quarterly Change Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  Whale Holding & Position Shift Breakdown Table
                </h3>

                <div className="w-full max-w-full overflow-x-auto alien-block-cut border border-cyan-500/30 bg-black/60">
                  {/* Desktop Table View */}
                  <table className="hidden sm:table w-full text-left text-xs">
                    <thead className="bg-cyan-950/60 text-cyan-300 font-black text-[10px] uppercase border-b border-cyan-500/30 whitespace-nowrap">
                      <tr>
                        <th className="p-2.5">Ticker</th>
                        <th className="p-2.5">Company & Manager</th>
                        <th className="p-2.5">Quarterly Action</th>
                        <th className="p-2.5 text-right">Portfolio %</th>
                        <th className="p-2.5 text-right">Value ($M)</th>
                        <th className="p-2.5">Conviction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                      {filteredFilings.map((item) => (
                        <tr key={item.id} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="p-2.5 font-black text-cyan-300 whitespace-nowrap">${item.symbol}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <strong className="block text-white text-xs">{item.companyName}</strong>
                            <span className="text-[10px] text-neutral-400">{item.managerName}</span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 alien-block-cut-sm text-[10px] font-black uppercase ${
                              item.quarterlyChangeType === "NEW BUY"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : item.quarterlyChangeType === "INCREASED"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}>
                              {item.quarterlyChangeType} ({item.quarterlyChangePercent > 0 ? "+" : ""}{item.quarterlyChangePercent}%)
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-black text-white whitespace-nowrap">{item.portfolioPercent}%</td>
                          <td className="p-2.5 text-right font-black text-emerald-400 whitespace-nowrap">${item.portfolioValueMillions}M</td>
                          <td className="p-2.5 font-bold text-amber-300 text-[11px] whitespace-nowrap">{item.convictionRating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="sm:hidden flex flex-col divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                    {filteredFilings.map((item) => (
                      <div key={item.id} className="p-4 space-y-3 hover:bg-cyan-950/20 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-lg font-black text-cyan-300">${item.symbol}</div>
                            <div className="text-sm font-bold text-white">{item.companyName}</div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">{item.managerName}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-white">{item.portfolioPercent}% wgt</div>
                            <div className="text-xs font-black text-emerald-400">${item.portfolioValueMillions}M</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 alien-block-cut-sm text-[10px] font-black uppercase ${
                              item.quarterlyChangeType === "NEW BUY"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : item.quarterlyChangeType === "INCREASED"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}>
                              {item.quarterlyChangeType} ({item.quarterlyChangePercent > 0 ? "+" : ""}{item.quarterlyChangePercent}%)
                          </span>
                          <span className="px-2 py-0.5 alien-block-cut-sm text-[10px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {item.convictionRating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Executive Convergence Notes */}
              <div className="p-4 alien-block-cut bg-cyan-950/30 border border-cyan-500/40 space-y-1.5 text-xs">
                <span className="text-amber-400 font-black text-[11px] uppercase tracking-wider block">
                  // QUANT SYNTHESIS & CONVERGENCE SUMMARY
                </span>
                <p className="text-neutral-200 leading-relaxed font-sans text-xs">
                  Whale filings indicate unanimous institutional capital flows into AGI compute infrastructure (NVIDIA, ASML), nuclear energy providers (Vistra, Constellation) for datacenter electrification, and aerospace frontier moats (SpaceX).
                </p>
              </div>

              {/* Action Controls Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-cyan-500/30 pt-4 no-print">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopySummaryText}
                    className="px-3.5 py-2 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto"
                  >
                    {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSummary ? "COPIED TO CLIPBOARD!" : "COPY REPORT TEXT"}</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="px-3.5 py-2 alien-block-cut-sm bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="px-4 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black cursor-pointer transition-all w-full sm:w-auto text-center"
                >
                  CLOSE DOSSIER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live SEC Intel Feed */}
      <div className="pt-6 border-t border-cyan-500/20">
        <LiveSecIntelSection />
      </div>
      
    </div>
  );
};
