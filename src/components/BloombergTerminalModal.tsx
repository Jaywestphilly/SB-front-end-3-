import React, { useState, useEffect, useMemo } from "react";
import {
  Terminal,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  DollarSign,
  BarChart3,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Check,
  Copy,
  Zap,
  Layers,
  Grid,
  Volume2,
  VolumeX,
  Play,
  Maximize2,
  RefreshCw,
  HelpCircle,
  FileText,
  Sliders,
  Cpu,
  Download,
  CreditCard,
  Building2,
  Award,
} from "lucide-react";
import { StockTicker } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface BloombergTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockTicker[];
  selectedStock?: StockTicker | null;
}

type CommandType =
  | "DES"
  | "ANR"
  | "FA"
  | "YCRV"
  | "ECST"
  | "COMM"
  | "L2"
  | "TOP"
  | "MOST"
  | "BIZCRED";

export const BloombergTerminalModal: React.FC<BloombergTerminalModalProps> = ({
  isOpen,
  onClose,
  stocks,
  selectedStock,
}) => {
  const [activeCommand, setActiveCommand] = useState<CommandType>("DES");
  const [commandInput, setCommandInput] = useState("");
  const [terminalTheme, setTerminalTheme] = useState<"amber" | "matrix" | "cyan">("amber");
  const [activeTicker, setActiveTicker] = useState<StockTicker>(
    () =>
      selectedStock ||
      stocks[0] || {
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        price: 138.25,
        change: 4.85,
        changePercent: 3.63,
        category: "tsunami",
        sparkline: [130, 132, 131, 134, 136, 135, 138.25],
        history: { "1D": [], "1W": [], "1M": [], "1Y": [], ALL: [] },
        marketCap: "$3.40T",
        peRatio: "58.4",
        dividendYield: "0.03%",
        high52: 140.76,
        low52: 45.1,
        volume: "54.2M",
        description: "Leader in hardware and GPUs.",
        tags: ["", "GPUs"],
      },
  );

  const [viewMode, setViewMode] = useState<"single" | "quad">("single");
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showAsciiModal, setShowAsciiModal] = useState(false);
  const [commandSuccessMsg, setCommandSuccessMsg] = useState<string | null>(
    null,
  );
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [copiedAscii, setCopiedAscii] = useState(false);

  const handleCopyCommand = (cmdStr: string) => {
    navigator.clipboard.writeText(cmdStr);
    setCopiedCmd(cmdStr);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getAsciiReport = () => {
    return `+==========================================================================+
|  STOCK BLOC QUANT WORKSTATION v4.2 // SECURITY TEARSHEET SNAPSHOT        |
+==========================================================================+
| TICKER: ${activeTicker.symbol.padEnd(6)} | NAME: ${activeTicker.name.padEnd(26)} | TIME: ${new Date().toISOString().slice(0, 19)}Z |
| PRICE:  $${activeTicker.price.toFixed(2).padEnd(6)} | CHANGE: ${(activeTicker.change >= 0 ? "+" : "") + activeTicker.change.toFixed(2)} (${(activeTicker.changePercent >= 0 ? "+" : "") + activeTicker.changePercent.toFixed(2)}%) | MKTCAP: ${(activeTicker.marketCap || "N/A").padEnd(10)} |
+--------------------------------------------------------------------------+
| VALUATION & FUNDAMENTALS:                                                |
| - P/E Ratio: ${(activeTicker.peRatio || "N/A").padEnd(8)} | 52W Range: $${(activeTicker.low52 || 0).toFixed(2)} - $${(activeTicker.high52 || 0).toFixed(2)}             |
| - Div Yield: ${(activeTicker.dividendYield || "0.0%").padEnd(8)} | Volume: ${(activeTicker.volume || "N/A").padEnd(12)}               |
+--------------------------------------------------------------------------+
| MACRO & FOMC BENCHMARKS:                                                 |
| - Fed Funds Target: 4.75% - 5.00%  | 25bps Rate Cut Probability: 72.4%   |
| - US 10-Year Yield: 4.22%          | 10Y-2Y Spread: +0.03% (Normalizing) |
+--------------------------------------------------------------------------+
| WALL STREET CONSENSUS: BUY (91% Buy / 9% Hold / 0% Sell)                 |
| - 12-Month Target: $${(activeTicker.price * 1.22).toFixed(2)} (+22.0% Implied Upside Potential)        |
+==========================================================================+
| Generated via Stock Bloc Terminal (stockbloc.app)                        |
+==========================================================================+`;
  };

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(getAsciiReport());
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2500);
  };

  const handleDownloadAscii = () => {
    const report = getAsciiReport();
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STOCKBLOC_${activeTicker.symbol}_TERMINAL_REPORT.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Synchronize when selectedStock prop changes
  useEffect(() => {
    if (selectedStock) {
      setActiveTicker(selectedStock);
    }
  }, [selectedStock]);

  if (!isOpen) return null;

  // Sound beep simulator
  const playTerminalBeep = () => {
    if (!audioFeedback) return;
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context fallthrough
    }
  };

  // Command Execution Handler
  const handleExecuteCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic("medium");
    playTerminalBeep();

    const inputClean = commandInput.trim().toUpperCase();
    if (!inputClean) return;

    if (
      inputClean === "WHOAMI" ||
      inputClean === "ABOUT" ||
      inputClean.includes("WHOAMI") ||
      inputClean.includes("ABOUT")
    ) {
      setCommandSuccessMsg(
        "FOUNDER: Jumanne Carter (Jay West Philly) // MISSION: Economic literacy, quant intelligence, and financial awareness."
      );
      setCommandInput("");
      setTimeout(() => setCommandSuccessMsg(null), 10000);
      return;
    }

    const parts = inputClean.split(/\s+/);
    let targetSymbol = "";
    let targetCmd: CommandType | null = null;

    parts.forEach((part) => {
      const matchedCmd = [
        "DES",
        "ANR",
        "FA",
        "YCRV",
        "ECST",
        "COMM",
        "L2",
        "TOP",
        "MOST",
        "BIZCRED",
      ].find((c) => c === part) as CommandType | undefined;
      if (matchedCmd) {
        targetCmd = matchedCmd;
      } else {
        const foundStock = stocks.find((s) => s.symbol.toUpperCase() === part);
        if (foundStock) {
          targetSymbol = foundStock.symbol;
        }
      }
    });

    if (targetSymbol) {
      const stockObj = stocks.find((s) => s.symbol === targetSymbol);
      if (stockObj) setActiveTicker(stockObj);
    }

    if (targetCmd) {
      setActiveCommand(targetCmd);
    }

    setCommandSuccessMsg(
      `EXECUTED: ${targetSymbol || activeTicker.symbol} ${targetCmd || activeCommand} <GO>`,
    );
    setCommandInput("");
    setTimeout(() => setCommandSuccessMsg(null), 3000);
  };

  const handleSelectQuickCmd = (cmd: CommandType) => {
    triggerHaptic("selection");
    playTerminalBeep();
    setActiveCommand(cmd);
  };

  const handleSelectStockTicker = (stock: StockTicker) => {
    triggerHaptic("selection");
    playTerminalBeep();
    setActiveTicker(stock);
  };

  // Simulated Level 2 Order Book Depth Data
  const l2Bids = [
    { price: (activeTicker.price - 0.05).toFixed(2), size: 1450, mm: "ARCA" },
    { price: (activeTicker.price - 0.12).toFixed(2), size: 3200, mm: "NSDQ" },
    { price: (activeTicker.price - 0.2).toFixed(2), size: 890, mm: "BATS" },
    { price: (activeTicker.price - 0.35).toFixed(2), size: 5400, mm: "EDGX" },
    { price: (activeTicker.price - 0.5).toFixed(2), size: 12100, mm: "NYSE" },
  ];

  const l2Asks = [
    { price: (activeTicker.price - + 0.04).toFixed(2), size: 1800, mm: "NSDQ" },
    { price: (activeTicker.price - + 0.1).toFixed(2), size: 2900, mm: "ARCA" },
    { price: (activeTicker.price - + 0.18).toFixed(2), size: 4100, mm: "BATS" },
    { price: (activeTicker.price - + 0.3).toFixed(2), size: 6700, mm: "EDGX" },
    { price: (activeTicker.price - + 0.45).toFixed(2), size: 15400, mm: "NYSE" },
  ];

  const themeClasses = {
    amber: {
      container: "bg-[#040810] border-amber-500/50 text-amber-200 shadow-amber-500/10",
      header: "bg-black/90 border-amber-500/30 text-amber-300",
      accent: "text-amber-400 border-amber-500/40 bg-amber-500/20",
      badge: "bg-amber-500 text-black",
      activeBtn: "bg-amber-500 text-black font-black border-amber-400 shadow-md shadow-amber-500/20",
      inactiveBtn: "bg-black/50 text-amber-300 border-amber-500/30 hover:bg-amber-500/20",
      input: "bg-black/80 border-amber-500/50 text-amber-300 placeholder-amber-700/80 focus:border-amber-400",
    },
    matrix: {
      container: "bg-[#020e06] border-emerald-500/50 text-emerald-200 shadow-emerald-500/10",
      header: "bg-black/90 border-emerald-500/30 text-emerald-300",
      accent: "text-emerald-400 border-emerald-500/40 bg-emerald-500/20",
      badge: "bg-emerald-500 text-black",
      activeBtn: "bg-emerald-500 text-black font-black border-emerald-400 shadow-md shadow-emerald-500/20",
      inactiveBtn: "bg-black/50 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20",
      input: "bg-black/80 border-emerald-500/50 text-emerald-300 placeholder-emerald-700/80 focus:border-emerald-400",
    },
    cyan: {
      container: "bg-[#020d18] border-cyan-500/50 text-cyan-200 shadow-cyan-500/10",
      header: "bg-black/90 border-cyan-500/30 text-cyan-300",
      accent: "text-cyan-400 border-cyan-500/40 bg-cyan-500/20",
      badge: "bg-cyan-500 text-black",
      activeBtn: "bg-cyan-500 text-black font-black border-cyan-400 shadow-md shadow-cyan-500/20",
      inactiveBtn: "bg-black/50 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20",
      input: "bg-black/80 border-cyan-500/50 text-cyan-300 placeholder-cyan-700/80 focus:border-cyan-400",
    },
  }[terminalTheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* TERMINAL CONTAINER */}
      <div className={`w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden font-mono text-xs transition-colors ${themeClasses.container}`}>
        {/* TERMINAL HEADER & TICKER TAPE */}
        <div className={`p-3 border-b flex flex-col gap-2 ${themeClasses.header}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded font-bold border flex items-center gap-1 ${themeClasses.accent}`}>
                <Terminal className="w-4 h-4 animate-pulse" />
                <span className="font-black text-xs tracking-wider">
                  SB TERMINAL
                </span>
              </span>
              <span className="hidden sm:inline text-[10px] font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                [SB-QUANT WORKSTATION v4.2]
              </span>
              <span className="hidden md:inline text-[10px] font-extrabold font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/40">
                100% FREE & UNLOCKED
              </span>
            </div>

            {/* CRT Phosphor Theme Switcher + Right Header Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Switcher Pills */}
              <div className="flex items-center bg-black/60 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold">
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setTerminalTheme("amber");
                  }}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    terminalTheme === "amber"
                      ? "bg-amber-400 text-black font-extrabold"
                      : "text-amber-400/70 hover:text-amber-300"
                  }`}
                  title="Amber CRT Phosphor Theme"
                >
                  AMBER
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setTerminalTheme("matrix");
                  }}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    terminalTheme === "matrix"
                      ? "bg-emerald-400 text-black font-extrabold"
                      : "text-emerald-400/70 hover:text-emerald-300"
                  }`}
                  title="Matrix VT100 Green Phosphor Theme"
                >
                  MATRIX
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setTerminalTheme("cyan");
                  }}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    terminalTheme === "cyan"
                      ? "bg-cyan-400 text-black font-extrabold"
                      : "text-cyan-400/70 hover:text-cyan-300"
                  }`}
                  title="Cyber Cyan Workstation Theme"
                >
                  CYAN
                </button>
              </div>

              {/* ASCII Snapshot Report Button */}
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setShowAsciiModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                title="View Institutional ASCII Monospace Report"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">ASCII REPORT</span>
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  showHelp
                    ? "bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                }`}
                title="Open Terminal Command Cheat Sheet"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>[?] CMD</span>
              </button>

              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  audioFeedback
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-neutral-800 text-neutral-500 border-neutral-700"
                }`}
                title="Toggle Terminal Audio Beep"
              >
                {audioFeedback ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() =>
                  setViewMode((prev) => (prev === "single" ? "quad" : "single"))
                }
                className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === "quad"
                    ? "bg-cyan-500 text-black font-black border-cyan-400"
                    : "bg-black/40 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {viewMode === "quad" ? "QUAD VIEW" : "SINGLE"}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all cursor-pointer"
                title="Close Terminal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* REAL TIME MARKET TICKER TAPE */}
          <div className="flex items-center gap-4 text-[10px] overflow-x-auto no-scrollbar pt-1 font-mono border-t border-white/10 opacity-90">
            <span className="text-amber-400 font-bold shrink-0">INDICES:</span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-neutral-400">S&P 500</span>
              <span className="font-bold text-emerald-400">
                5,912.40 (+0.42%)
              </span>
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-neutral-400">NASDAQ 100</span>
              <span className="font-bold text-emerald-400">
                20,410.15 (+0.78%)
              </span>
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-neutral-400">US 10Y</span>
              <span className="font-bold text-rose-400">4.22% (-3.1bps)</span>
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-neutral-400">CRUDE WTI</span>
              <span className="font-bold text-emerald-400">
                $78.45 (+1.15%)
              </span>
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-neutral-400">GOLD</span>
              <span className="font-bold text-emerald-400">
                $2,740.10 (+0.35%)
              </span>
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <span className="text-neutral-400">BITCOIN</span>
              <span className="font-bold text-emerald-400">
                $96,400 (+2.80%)
              </span>
            </span>
          </div>
        </div>

        {/* TERMINAL COMMAND RUNNER BAR */}
        <div className="p-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/70 border-white/10">
          {/* Command Input Form */}
          <form
            onSubmit={handleExecuteCommand}
            className="flex items-center gap-2 flex-1 relative group"
          >
            <span
              className="text-amber-400 font-bold shrink-0 flex items-center gap-1 cursor-help"
              title="Enter a Stock Symbol followed by a Command (e.g. NVDA DES)"
            >
              <span>RUN:</span>
            </span>
            <div className="relative flex-1">
              <input
                id="terminal-command-input"
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type symbol + command (e.g. NVDA DES, BIZCRED, WHOAMI, ABOUT)"
                className={`w-full font-mono text-xs px-3 py-2 rounded-lg border focus:outline-none uppercase ${themeClasses.input}`}
              />
            </div>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg ${themeClasses.badge} font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1`}
            >
              <span>GO</span>
              <Play className="w-3 h-3 fill-black" />
            </button>
          </form>

          {/* Quick Command Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-1 sm:pb-0">
            {[
              { cmd: "DES", desc: "Description & Overview" },
              { cmd: "ANR", desc: "Analyst Recommendations" },
              { cmd: "FA", desc: "Financial Analysis" },
              { cmd: "YCRV", desc: "Yield Curve & FOMC Rate" },
              { cmd: "ECST", desc: "Economic Statistics & Inflation" },
              { cmd: "COMM", desc: "Commodities & Futures" },
              { cmd: "L2", desc: "Level 2 Order Book Depth" },
              { cmd: "BIZCRED", desc: "Corporate Credit & Tradelines" },
              { cmd: "TOP", desc: "Top News & Headlines" },
            ].map(({ cmd, desc }) => (
              <button
                key={cmd}
                onClick={() => handleSelectQuickCmd(cmd as CommandType)}
                className={`group relative px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex-shrink-0 ${
                  activeCommand === cmd
                    ? themeClasses.activeBtn
                    : themeClasses.inactiveBtn
                }`}
              >
                {cmd} <span className="text-[9px] opacity-75">&lt;GO&gt;</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black/90 text-white text-[10px] rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {commandSuccessMsg && (
          <div className="px-4 py-1.5 bg-amber-500/20 text-amber-300 border-b border-amber-500/30 text-[11px] font-mono flex items-center justify-between">
            <span>{commandSuccessMsg}</span>
            <span className="text-[9px] opacity-75">STATUS: 200 OK</span>
          </div>
        )}

        {/* ACTIVE TICKER BANNER */}
        <div className="px-4 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto no-scrollbar bg-neutral-900/90 border-white/10">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-base font-black text-amber-400">
              {activeTicker.symbol}
            </span>
            <span className="text-xs text-neutral-300 font-bold hidden sm:inline">
              {activeTicker.name}
            </span>
            <span className="text-sm font-bold text-white">
              ${activeTicker.price.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold flex items-center gap-0.5 ${activeTicker.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {activeTicker.change >= 0 ? "+" : ""}
              {activeTicker.change.toFixed(2)} (
              {activeTicker.changePercent >= 0 ? "+" : ""}
              {activeTicker.changePercent.toFixed(2)}%)
            </span>
          </div>

          {/* Ticker Quick Switcher & Copy Command Chips */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-neutral-400 hidden lg:inline font-mono">
              Quick Ticker / Copy:
            </span>
            {stocks.slice(0, 6).map((st) => (
              <div key={st.symbol} className="flex items-center gap-1">
                <button
                  onClick={() => handleSelectStockTicker(st)}
                  aria-label={`Select ticker ${st.symbol}`}
                  data-testid={`select-ticker-${st.symbol.toLowerCase()}`}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    activeTicker.symbol === st.symbol
                      ? "bg-cyan-500 text-black border-cyan-400 font-extrabold"
                      : "bg-black/30 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                  }`}
                >
                  {st.symbol}
                </button>
                <button
                  onClick={() => handleCopyCommand(`${st.symbol} DES`)}
                  data-testid={`copy-command-${st.symbol.toLowerCase()}`}
                  aria-label={`Copy terminal command ${st.symbol} DES`}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer transition-all active:scale-95"
                  title={`Copy '${st.symbol} DES' command to clipboard`}
                >
                  {copiedCmd === `${st.symbol} DES` ? "✓" : `Copy "${st.symbol} DES"`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* TERMINAL MAIN DISPLAY AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {showHelp ? (
            <div className="p-6 border border-amber-500/40 rounded-xl bg-black/80 space-y-6 max-w-4xl mx-auto my-4 animate-fadeIn">
              <div className="flex items-center gap-3 border-b border-amber-500/30 pb-4">
                <HelpCircle className="w-8 h-8 text-amber-400" />
                <div>
                  <h2 className="text-xl font-black text-amber-400">
                    HOW TO USE THE TERMINAL
                  </h2>
                  <p className="text-neutral-400 font-sans text-sm">
                    Welcome to the Stock Bloc Quant Workstation. This interface
                    simulates a professional institutional trading desk.
                  </p>
                </div>
              </div>

              <div className="space-y-4 font-sans">
                <div className="bg-amber-950/20 p-4 rounded-lg border border-amber-500/20">
                  <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-2 font-mono">
                    <Terminal className="w-4 h-4" /> THE COMMAND BAR
                  </h3>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                    Just like a real Bloomberg terminal, you navigate by typing
                    a stock symbol followed by a command code, then pressing{" "}
                    <span className="font-mono text-xs bg-amber-500/20 px-1 py-0.5 rounded text-amber-400 font-bold">
                      &lt;GO&gt;
                    </span>{" "}
                    (or hitting Enter).
                  </p>
                  <div className="font-mono text-xs text-emerald-400 bg-black/50 p-2 rounded border border-emerald-500/30 inline-block">
                    Example: Type{" "}
                    <span className="font-bold text-white">NVDA DES</span> then
                    press Enter.
                  </div>
                </div>

                <div className="bg-amber-950/20 p-4 rounded-lg border border-amber-500/20">
                  <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-2 font-mono">
                    <Grid className="w-4 h-4" /> QUICK COMMANDS
                  </h3>
                  <p className="text-neutral-300 text-sm leading-relaxed mb-3">
                    Don't want to type? Use the quick command buttons below the
                    search bar. Here is what they mean:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-400">
                    <li>
                      <strong className="text-amber-400 font-mono">DES:</strong>{" "}
                      Description (Company overview & key stats)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">ANR:</strong>{" "}
                      Analyst Recommendations (Wall Street ratings)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">FA:</strong>{" "}
                      Financial Analysis (Revenue & growth)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">
                        YCRV:
                      </strong>{" "}
                      Yield Curve (Macro bond yields)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">
                        ECST:
                      </strong>{" "}
                      Economic Statistics (Inflation, jobs)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">
                        COMM:
                      </strong>{" "}
                      Commodities (Gold, Oil, etc.)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">L2:</strong>{" "}
                      Level 2 (Real time bid/ask order book)
                    </li>
                    <li>
                      <strong className="text-amber-400 font-mono">TOP:</strong>{" "}
                      Top News (Latest market headlines)
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-950/20 p-4 rounded-lg border border-amber-500/20">
                  <h3 className="text-amber-300 font-bold mb-2 flex items-center gap-2 font-mono">
                    <Maximize2 className="w-4 h-4" /> VIEW MODES
                  </h3>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    Toggle between{" "}
                    <strong className="text-amber-400">SINGLE FOCUS</strong>{" "}
                    (deep dive into one metric) and{" "}
                    <strong className="text-amber-400">QUAD VIEW</strong>{" "}
                    (dashboard of 4 metrics at once) using the button at the top
                    right of the terminal.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 bg-amber-500 text-black font-black text-sm rounded hover:bg-amber-400 transition-colors"
                >
                  GOT IT
                </button>
              </div>
            </div>
          ) : viewMode === "quad" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PANEL 1: DES */}
              <div className="p-4 rounded-xl border space-y-3 bg-black/60 border-amber-500/30">
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-1">
                  <span className="text-amber-400 font-bold">
                    PANEL 1: SECURITY PROFILE (DES)
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {activeTicker.symbol}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-400">Market Cap:</span>{" "}
                    <span className="font-bold text-white">
                      {activeTicker.marketCap}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400">P/E Ratio:</span>{" "}
                    <span className="font-bold text-white">
                      {activeTicker.peRatio || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400">52W Range:</span>{" "}
                    <span className="font-bold text-white">
                      ${activeTicker.low52} ${activeTicker.high52}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Volume:</span>{" "}
                    <span className="font-bold text-white">
                      {activeTicker.volume}
                    </span>
                  </div>
                </div>
              </div>

              {/* PANEL 2: ANR */}
              <div className="p-4 rounded-xl border space-y-3 bg-black/60 border-amber-500/30">
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-1">
                  <span className="text-amber-400 font-bold">
                    PANEL 2: ANALYST RATINGS (ANR)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    CONSENSUS: BUY
                  </span>
                </div>
                <div className="text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Goldman Sachs:</span>{" "}
                    <span className="text-emerald-400 font-bold">
                      BUY ($165.00)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morgan Stanley:</span>{" "}
                    <span className="text-emerald-400 font-bold">
                      OVERWEIGHT ($160.00)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>JPMorgan:</span>{" "}
                    <span className="text-emerald-400 font-bold">
                      BUY ($155.00)
                    </span>
                  </div>
                </div>
              </div>

              {/* PANEL 3: YCRV */}
              <div className="p-4 rounded-xl border space-y-3 bg-black/60 border-amber-500/30">
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-1">
                  <span className="text-amber-400 font-bold">
                    PANEL 3: YIELD CURVE (YCRV)
                  </span>
                  <span className="text-[10px] text-cyan-400">10Y: 4.22%</span>
                </div>
                <div className="text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>10Y 2Y Spread:</span>{" "}
                    <span className="text-emerald-400 font-bold">
                      +0.03% (Normal)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>10Y 3M Spread:</span>{" "}
                    <span className="text-rose-400 font-bold">
                      -1.03% (Inverted)
                    </span>
                  </div>
                </div>
              </div>

              {/* PANEL 4: L2 */}
              <div className="p-4 rounded-xl border space-y-3 bg-black/60 border-amber-500/30">
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-1">
                  <span className="text-amber-400 font-bold">
                    PANEL 4: LEVEL 2 ORDER DEPTH (L2)
                  </span>
                  <span className="text-[10px] text-amber-300 font-mono">
                    SPREAD: $0.09
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="text-emerald-400">
                    BID: ${(activeTicker.price - 0.05).toFixed(2)} (1.4K)
                  </div>
                  <div className="text-rose-400">
                    ASK: ${(activeTicker.price - + 0.04).toFixed(2)} (1.8K)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE FOCUS VIEW MODE */
            <div className="space-y-4">
              {/* COMMAND VIEW: DES (Security Description) */}
              {activeCommand === "DES" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                      <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        DES &lt;GO&gt; Security Description & Fundamental Ratios
                      </h3>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30">
                        EQUITY TICKER
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {activeTicker.description}
                    </p>

                    {/* Ratio Table */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-neutral-400 text-[10px] block">
                          Market Capitalization
                        </span>
                        <strong className="text-white text-sm block font-mono">
                          {activeTicker.marketCap}
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-neutral-400 text-[10px] block">
                          P/E Ratio (TTM)
                        </span>
                        <strong className="text-white text-sm block font-mono">
                          {activeTicker.peRatio || "52.1"}
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-neutral-400 text-[10px] block">
                          52-Week Range
                        </span>
                        <strong className="text-white text-sm block font-mono">
                          ${activeTicker.low52} ${activeTicker.high52}
                        </strong>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-neutral-400 text-[10px] block">
                          Trading Volume
                        </span>
                        <strong className="text-white text-sm block font-mono">
                          {activeTicker.volume}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMAND VIEW: ANR (Analyst Recommendations) */}
              {activeCommand === "ANR" && (
                <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      ANR &lt;GO&gt; Wall Street Analyst Recommendations & Price
                      Targets
                    </h3>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      CONSENSUS: STRONG BUY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Average Price Target
                      </span>
                      <strong className="text-emerald-400 text-lg font-mono font-black block">
                        ${(activeTicker.price * 1.22).toFixed(2)}
                      </strong>
                      <span className="text-[10px] text-emerald-300">
                        +22.0% Implied Upside
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Highest Bull Target
                      </span>
                      <strong className="text-cyan-300 text-lg font-mono font-black block">
                        ${(activeTicker.price * 1.45).toFixed(2)}
                      </strong>
                      <span className="text-[10px] text-cyan-300">
                        +45.0% Max Potential
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Lowest Bear Target
                      </span>
                      <strong className="text-rose-400 text-lg font-mono font-black block">
                        ${(activeTicker.price * 0.9).toFixed(2)}
                      </strong>
                      <span className="text-[10px] text-rose-300">
                        -10.0% Downside Risk
                      </span>
                    </div>
                  </div>

                  {/* Firm Ratings Table */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase">
                      Recent Investment Bank Ratings:
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white block font-bold">
                            Goldman Sachs
                          </strong>
                          <span className="text-[10px] text-neutral-400">
                            Reiterated Conviction Buy
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ${(activeTicker.price * 1.25).toFixed(2)} Target
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white block font-bold">
                            Morgan Stanley
                          </strong>
                          <span className="text-[10px] text-neutral-400">
                            Overweight / Outperform
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ${(activeTicker.price * 1.2).toFixed(2)} Target
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white block font-bold">
                            Evercore ISI
                          </strong>
                          <span className="text-[10px] text-neutral-400">
                            Raised Price Target
                          </span>
                        </div>
                        <span className="font-mono font-bold text-cyan-300">
                          ${(activeTicker.price * 1.3).toFixed(2)} Target
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMAND VIEW: YCRV (Yield Curve Monitor) */}
              {activeCommand === "YCRV" && (
                <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      YCRV &lt;GO&gt; US Treasury Yield Curve Monitor & Spreads
                    </h3>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      MACRO BOND MATRIX
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300">
                    Track Treasury yields across maturities to monitor monetary
                    policy, recession risks, and cost of capital.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-neutral-400 block text-[10px]">
                        1-Month Bill
                      </span>
                      <strong className="text-white text-sm font-mono block">
                        5.32%
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-neutral-400 block text-[10px]">
                        3-Month Bill
                      </span>
                      <strong className="text-white text-sm font-mono block">
                        5.25%
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-neutral-400 block text-[10px]">
                        2-Year Note
                      </span>
                      <strong className="text-white text-sm font-mono block">
                        4.25%
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-neutral-400 block text-[10px]">
                        10-Year Benchmark
                      </span>
                      <strong className="text-emerald-400 text-sm font-mono block font-black">
                        4.22%
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30 space-y-2 text-xs">
                    <strong className="text-amber-300 font-bold block">
                      Inversion Spread Metrics:
                    </strong>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">
                        10Y 2Y Yield Spread:
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        +0.03% (Spread Normalizing)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">
                        10Y 3M Yield Spread:
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        -1.03% (Inverted Yield Curve)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMAND VIEW: LEVEL 2 ORDER BOOK (L2) */}
              {activeCommand === "L2" && (
                <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      L2 &lt;GO&gt; Level 2 Real Time Order Depth (
                      {activeTicker.symbol})
                    </h3>
                    <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
                      SPREAD: $0.09 (9.2 BPS)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    {/* BIDS */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-emerald-400 border-b border-emerald-500/30 pb-1">
                        BUY BIDS (DEMAND)
                      </h4>
                      <div className="space-y-1">
                        {l2Bids.map((bid, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20 flex justify-between items-center"
                          >
                            <span className="text-neutral-400">{bid.mm}</span>
                            <span className="text-emerald-400 font-bold">
                              ${bid.price}
                            </span>
                            <span className="text-neutral-300">
                              {bid.size} shs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ASKS */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-rose-400 border-b border-rose-500/30 pb-1">
                        SELL ASKS (SUPPLY)
                      </h4>
                      <div className="space-y-1">
                        {l2Asks.map((ask, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-rose-950/30 border border-rose-500/20 flex justify-between items-center"
                          >
                            <span className="text-neutral-400">{ask.mm}</span>
                            <span className="text-rose-400 font-bold">
                              ${ask.price}
                            </span>
                            <span className="text-neutral-300">
                              {ask.size} shs
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMAND VIEW: BIZCRED (Corporate Credit & Tradelines) */}
              {activeCommand === "BIZCRED" && (
                <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      BIZCRED &lt;GO&gt; Commercial Credit Matrix & Tradeline Monitor
                    </h3>
                    <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      PAYDEX 80+ TARGET (LOW RISK)
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300">
                    Real-time corporate credit tiering, D&B Paydex score targets, and active vendor reporting guidelines for 0% APY and institutional capital.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Dun & Bradstreet Paydex
                      </span>
                      <strong className="text-emerald-400 text-lg font-mono font-black block">
                        80 / 100
                      </strong>
                      <span className="text-[10px] text-emerald-300">
                        Prompt / Ahead of Terms
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Experian Intelliscore Plus
                      </span>
                      <strong className="text-cyan-300 text-lg font-mono font-black block">
                        78 / 100
                      </strong>
                      <span className="text-[10px] text-cyan-300">
                        Commercial Tier 1 Range
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Equifax Business Delinquency
                      </span>
                      <strong className="text-amber-300 text-lg font-mono font-black block">
                        Class 1 (Low)
                      </strong>
                      <span className="text-[10px] text-amber-400">
                        Zero Derogatories
                      </span>
                    </div>
                  </div>

                  {/* Tradeline Ladder Status */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-amber-300 uppercase">
                      Recommended Tier 1 Net-30 Bureau Starters:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white font-bold block">Uline Net-30</strong>
                          <span className="text-[10px] text-neutral-400">Min $50 invoice / Reports to D&B</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">TIER 1 (STARTER)</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white font-bold block">Grainger Industrial</strong>
                          <span className="text-[10px] text-neutral-400">Min $75 invoice / Reports to Experian</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">TIER 1 (STARTER)</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white font-bold block">Quill Office Supplies</strong>
                          <span className="text-[10px] text-neutral-400">Min $100 invoice / Reports to D&B</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 font-mono">TIER 1 (STARTER)</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                        <div>
                          <strong className="text-white font-bold block">Nav Prime Tradeline</strong>
                          <span className="text-[10px] text-neutral-400">Reports monthly tradeline to all 3</span>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-400 font-mono">TRI-BUREAU</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMAND VIEW: ECST (Economic Statistics & FOMC) */}
              {activeCommand === "ECST" && (
                <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      ECST &lt;GO&gt; Macro Economic Statistics & FOMC Rate Probability
                    </h3>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      LIVE FED MONITOR
                    </span>
                  </div>

                  {/* FOMC Rate Probability Bar */}
                  <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="text-amber-300 font-bold">
                        CME FedWatch Target Rate Probability (Next Meeting):
                      </strong>
                      <span className="text-emerald-400 font-mono font-bold">
                        72.4% PROBABILITY OF 25BPS CUT
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: "72.4%" }} title="25 bps cut (72.4%)" />
                      <div className="h-full bg-amber-500" style={{ width: "27.6%" }} title="Hold / Pause (27.6%)" />
                    </div>

                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono pt-1">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        25 bps Rate Cut (4.50% - 4.75%): <strong>72.4%</strong>
                      </span>
                      <span className="flex items-center gap-1 text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        Rate Hold (4.75% - 5.00%): <strong>27.6%</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        US CPI (Headline YoY)
                      </span>
                      <strong className="text-emerald-400 text-base font-mono block">
                        2.6%
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Core PCE Deflator
                      </span>
                      <strong className="text-cyan-300 text-base font-mono block">
                        2.7%
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        US Unemployment Rate
                      </span>
                      <strong className="text-amber-300 text-base font-mono block">
                        4.1%
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        US GDP Growth (QoQ Ann.)
                      </span>
                      <strong className="text-emerald-400 text-base font-mono block">
                        +2.8%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* FALLBACK FOR OTHER COMMANDS (COMM / FA / TOP) */}
              {(activeCommand === "COMM" ||
                activeCommand === "FA" ||
                activeCommand === "TOP") && (
                <div className="p-5 rounded-2xl border space-y-4 bg-black/60 border-amber-500/30">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      {activeCommand} &lt;GO&gt; Market Intelligence & Quotes
                    </h3>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      LIVE STREAM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        WTI Crude Oil Spot
                      </span>
                      <strong className="text-emerald-400 text-base font-mono block">
                        $78.45 / bbl (+1.15%)
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Gold Spot (oz)
                      </span>
                      <strong className="text-amber-400 text-base font-mono block">
                        $2,740.10 / oz (+0.35%)
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        US 10-Year Benchmark
                      </span>
                      <strong className="text-cyan-300 text-base font-mono block">
                        4.22% (-3.1 bps)
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-neutral-400 text-[10px] block">
                        Bitcoin USD Spot
                      </span>
                      <strong className="text-emerald-400 text-base font-mono block">
                        $96,400 (+2.80%)
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TERMINAL FOOTER STATUS BAR */}
        <div className="p-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono bg-black/90 border-amber-500/30 text-amber-400 relative">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CONNECTIVITY: SB TERMINAL DIRECT FEED</span>
          </div>

          <div className="flex items-center gap-3">
            <span>LATENCY: 12ms</span>
            <span className="text-cyan-400 font-bold">
              MOD: {activeCommand}
            </span>
            <span className="text-amber-300 font-bold">
              PRESS ESC OR CLOSE TO EXIT
            </span>
          </div>
        </div>
      </div>

      {/* ASCII REPORT MODAL OVERLAY */}
      {showAsciiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#050912] border-2 border-indigo-500/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-indigo-100 font-mono space-y-4 relative">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  ASCII TERMINAL REPORT SNAPSHOT ({activeTicker.symbol})
                </h3>
              </div>
              <button
                onClick={() => setShowAsciiModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/90 border border-indigo-500/30 font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-indigo-500 selection:text-white">
              {getAsciiReport()}
            </pre>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-neutral-400">
                Institutional plain-text snapshot formatted for email, trade journals, and notes.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAscii}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  {copiedAscii ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAscii ? "COPIED TO CLIPBOARD" : "COPY ASCII"}</span>
                </button>
                <button
                  onClick={handleDownloadAscii}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD .TXT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating [?] COMMANDS Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 z-50 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-amber-500/30"
        title="Open Command Cheat Sheet"
      >
        <Terminal className="w-4 h-4 text-black fill-black/20" />
        <span className="font-extrabold font-mono tracking-wider">[?] COMMANDS</span>
      </button>

      {/* COMMAND CHEAT SHEET OVERLAY MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#080d16] border-2 border-amber-500/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-amber-200 font-mono space-y-5 relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  QUANT WORKSTATION CHEAT SHEET
                </span>
                <h3 className="text-base sm:text-lg font-black text-amber-300 uppercase leading-tight">
                  [?] TERMINAL COMMAND CHEAT SHEET
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Type a security symbol followed by a command code into the terminal input bar (e.g. <code className="text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">{activeTicker.symbol} DES</code> or <code className="text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">{activeTicker.symbol} ANR</code>). Click any quick-action chip below to auto-execute into the input bar:
            </p>

            {/* COMMAND CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                {
                  cmd: "DES",
                  title: "Security Description & Snapshot",
                  desc: "Company profile, market cap, P/E ratio, 52-week high/low range & trading volume.",
                  example: `${activeTicker.symbol} DES`,
                },
                {
                  cmd: "ANR",
                  title: "Analyst Recommendations",
                  desc: "Wall St consensus ratings, price targets, bull/bear implied upside forecasts.",
                  example: `${activeTicker.symbol} ANR`,
                },
                {
                  cmd: "FA",
                  title: "Fundamental Analysis",
                  desc: "Financial ratio analysis, balance sheet ratios, dividend yield & valuation.",
                  example: `${activeTicker.symbol} FA`,
                },
                {
                  cmd: "TOP",
                  title: "Market Headlines & News Feed",
                  desc: "Real-time market headlines, news impact breakdowns, and sentiment scores.",
                  example: `${activeTicker.symbol} TOP`,
                },
                {
                  cmd: "YCRV",
                  title: "US Treasury Yield Curve",
                  desc: "Macro yield curve, recession inversion spreads & Treasury benchmark rates.",
                  example: "YCRV",
                },
                {
                  cmd: "ECST",
                  title: "Economic Statistics & Inflation",
                  desc: "US CPI inflation rate, Fed Funds target rate & macro economic indicators.",
                  example: "ECST",
                },
                {
                  cmd: "COMM",
                  title: "Commodities & Futures",
                  desc: "WTI Crude oil spot, gold spot per oz, natural gas & key commodity prices.",
                  example: "COMM",
                },
                {
                  cmd: "L2",
                  title: "Level 2 Order Book Depth",
                  desc: "Real-time market maker bids, asks, depth size & order spread metrics.",
                  example: `${activeTicker.symbol} L2`,
                },
                {
                  cmd: "BIZCRED",
                  title: "Corporate Credit & Tradeline Matrix",
                  desc: "Tier 1-3 vendor credit ladder, Paydex 80+ benchmarks & business score builder.",
                  example: "BIZCRED",
                },
              ].map(({ cmd, title, desc, example }) => (
                <div
                  key={cmd}
                  className="p-4 rounded-2xl bg-black/70 border border-amber-500/30 space-y-2.5 hover:border-amber-400/80 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-black font-black text-xs font-mono">
                        {cmd} &lt;GO&gt;
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                        {example}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-amber-300 text-xs mt-2">
                      {title}
                    </h4>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const targetCmd = cmd as CommandType;
                      setCommandInput(`${activeTicker.symbol} ${targetCmd}`);
                      setActiveCommand(targetCmd);
                      setCommandSuccessMsg(
                        `EXECUTED: ${activeTicker.symbol} ${targetCmd} <GO>`,
                      );
                      triggerHaptic("medium");
                      playTerminalBeep();
                      setShowHelp(false);
                      setTimeout(() => setCommandSuccessMsg(null), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-[11px] border border-amber-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2 active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>RUN: {example} &lt;GO&gt;</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

