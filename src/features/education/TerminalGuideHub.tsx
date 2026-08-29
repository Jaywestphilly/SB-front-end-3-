import React, { useState } from "react";
import {
  Terminal,
  HelpCircle,
  Zap,
  Play,
  Check,
  Copy,
  Sparkles,
  BookOpen,
  TrendingUp,
  BarChart3,
  Layers,
  Globe,
  Activity,
  Grid,
  Volume2,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Command,
  Cpu,
  GraduationCap,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { useModalStore } from "../../stores/modalStore";

interface TerminalGuideHubProps {
  onOpenTerminal: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const TerminalGuideHub: React.FC<TerminalGuideHubProps> = ({
  onOpenTerminal,
  onNavigateTab,
}) => {
  const { setIsMissionHubOpen } = useModalStore();
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<
    "overview" | "commands" | "syntax" | "quad"
  >("overview");

  const handleCopyCommand = (cmdStr: string) => {
    triggerHaptic("selection");
    navigator.clipboard.writeText(cmdStr);
    setCopiedCmd(cmdStr);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const commandList = [
    {
      code: "DES",
      name: "Security Description & Profile",
      icon: FileTextIcon,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      description:
        "Displays ticker overview, 52-week price channels, P/E ratio, market cap, dividend yield, and core business summary.",
      example: "NVDA DES <GO>",
    },
    {
      code: "ANR",
      name: "Analyst Recommendations",
      icon: TrendingUp,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      description:
        "Wall Street consensus breakdown (Strong Buy, Hold, Sell), consensus 12-month price targets, and analyst ratings spread.",
      example: "TSLA ANR <GO>",
    },
    {
      code: "FA",
      name: "Financial Analysis & Fundamentals",
      icon: BarChart3,
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
      description:
        "Quarterly revenue run-rates, EBITDA profit margins, debt-to-equity ratios, and Free Cash Flow (FCF) yield calculations.",
      example: "SPACEX FA <GO>",
    },
    {
      code: "YCRV",
      name: "Treasury Yield Curve & Spreads",
      icon: Activity,
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      description:
        "US Treasury benchmark rates (3-Month, 2-Year, 10-Year, 30-Year) and 2Y-10Y yield curve inversion status.",
      example: "BTC YCRV <GO>",
    },
    {
      code: "ECST",
      name: "Macro Economic Statistics",
      icon: Globe,
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      description:
        "Federal Reserve interest rates (Fed Funds 5.25%), CPI inflation metrics, unemployment rates, and M2 global money supply.",
      example: "SPY ECST <GO>",
    },
    {
      code: "COMM",
      name: "Commodities & Energy Matrix",
      icon: Zap,
      color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
      description:
        "Live spot prices for Crude Oil, Gold, Silver, Natural Gas, Lithium, and Megawatt energy grid benchmarks.",
      example: "BE COMM <GO>",
    },
    {
      code: "L2",
      name: "Level 2 Order Book Depth",
      icon: Layers,
      color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      description:
        "Real-time Bid/Ask order book depth with market maker IDs (ARCA, NSDQ, BATS, NYSE, EDGX) and volume liquidity pools.",
      example: "AAPL L2 <GO>",
    },
    {
      code: "TOP",
      name: "Top Volatility Movers",
      icon: Sparkles,
      color: "text-amber-300 border-amber-400/30 bg-amber-400/10",
      description:
        "Highest volatility gainers, daily percentile breakouts, and maximum asymmetry trade setups across all watchlists.",
      example: "TOP <GO>",
    },
    {
      code: "MOST",
      name: "Most Active Volume Flow",
      icon: Volume2,
      color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
      description:
        "Highest trading volume securities, institutional block trade detection, and whale accumulation flags.",
      example: "MOST <GO>",
    },
    {
      code: "WHOAMI",
      name: "System Architecture & Mission",
      icon: Command,
      color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
      description:
        "Platform origin, founder mission statement, and economic literacy guidelines.",
      example: "WHOAMI <GO>",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-6 font-mono space-y-6 text-cyan-100">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-[#030a14] border-2 border-amber-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 alien-block-cut">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-300 text-xs font-black tracking-wider uppercase">
              <GraduationCap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>EDUCATION & MASTERY MANUAL</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
              HOW TO USE THE <span className="text-amber-400">STOCK BLOC TERMINAL</span>
            </h1>

            <p className="text-sm text-cyan-200/80 max-w-2xl leading-relaxed font-sans">
              Master the Stock Bloc Quantitative Terminal — a zero-cost, unlocked institutional workstation. 
              Learn custom command syntax, Level 2 order book inspection, multi-asset 4-grid monitoring, and macro yield curve analysis.
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-3">
            <button
              onClick={() => {
                triggerHaptic("heavy");
                onOpenTerminal();
              }}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-amber-400/30 border-2 border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Terminal className="w-5 h-5 text-black animate-pulse" />
              <span>LAUNCH LIVE TERMINAL</span>
            </button>

            <span className="text-[11px] text-center text-amber-400/80 font-bold">
              100% Free & Unlocked Workstation
            </span>
          </div>
        </div>
      </div>

      {/* QUICK NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-cyan-500/30">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTabSection("overview");
          }}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTabSection === "overview"
              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 border border-amber-200"
              : "bg-neutral-900 text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>1. TERMINAL OVERVIEW</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTabSection("commands");
          }}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTabSection === "commands"
              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 border border-amber-200"
              : "bg-neutral-900 text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
          }`}
        >
          <Command className="w-4 h-4" />
          <span>2. COMMAND DIRECTORY</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTabSection("syntax");
          }}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTabSection === "syntax"
              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 border border-amber-200"
              : "bg-neutral-900 text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>3. SYNTAX & EXAMPLES</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTabSection("quad");
          }}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTabSection === "quad"
              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 border border-amber-200"
              : "bg-neutral-900 text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>4. 4-GRID MULTI-ASSET MODE</span>
        </button>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeTabSection === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-neutral-900/90 border border-cyan-500/40 rounded-xl space-y-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400 w-fit">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">1. Command Input Bar</h3>
              <p className="text-xs text-cyan-200/80 leading-relaxed font-sans">
                Located at the top of the terminal. Type any stock ticker symbol (e.g. <span className="text-amber-300 font-mono font-bold">NVDA</span>, <span className="text-amber-300 font-mono font-bold">SPCX</span>, <span className="text-amber-300 font-mono font-bold">BTC</span>) followed by a 2-4 letter command code.
              </p>
            </div>

            <div className="p-5 bg-neutral-900/90 border border-cyan-500/40 rounded-xl space-y-3">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 w-fit">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">2. Executing Commands</h3>
              <p className="text-xs text-cyan-200/80 leading-relaxed font-sans">
                Press <span className="text-amber-300 font-mono font-bold">Enter</span> or click the glowing <span className="text-amber-300 font-mono font-bold">&lt;GO&gt;</span> button. You can also click any 1-touch hotkey button on the navigation toolbar.
              </p>
            </div>

            <div className="p-5 bg-neutral-900/90 border border-cyan-500/40 rounded-xl space-y-3">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 w-fit">
                <Grid className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">3. Dual View Workstations</h3>
              <p className="text-xs text-cyan-200/80 leading-relaxed font-sans">
                Toggle between <span className="text-purple-300 font-mono font-bold">Single Security Focus</span> mode for deep analysis and <span className="text-purple-300 font-mono font-bold">Quad 4-Grid</span> mode to monitor four live assets simultaneously.
              </p>
            </div>
          </div>

          <div className="p-6 bg-[#020b14] border-2 border-cyan-500/40 rounded-2xl space-y-4">
            <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              ANATOMY OF A TERMINAL WORKSTATION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-cyan-100">
              <div className="p-4 bg-neutral-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  TOP TICKER TAPE & STATUS BAR
                </div>
                <p className="text-cyan-200/70">
                  Displays live price quote, 24-hour change dollar amount, percentage spread, 52-week high/low limits, and real-time trading volume.
                </p>
              </div>

              <div className="p-4 bg-neutral-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
                  <Layers className="w-4 h-4 text-rose-400" />
                  LEVEL 2 MARKET MAKER DEPTH
                </div>
                <p className="text-cyan-200/70">
                  Monitors order book liquidity across NASDAQ, ARCA, BATS, and NYSE market makers to spot institutional order flow.
                </p>
              </div>

              <div className="p-4 bg-neutral-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
                  <Activity className="w-4 h-4 text-purple-400" />
                  TREASURY & MACRO SPREADS
                </div>
                <p className="text-cyan-200/70">
                  Inspects Federal Reserve overnight interest rates, 10-Year Treasury yield benchmarks, and macroeconomic rate cut probabilities.
                </p>
              </div>

              <div className="p-4 bg-neutral-900/80 border border-cyan-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  HAPTIC & AUDIO FEEDBACK
                </div>
                <p className="text-cyan-200/70">
                  Simulates authentic terminal keystroke audio tones and tactile haptics on mobile devices upon command execution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: COMMAND DIRECTORY */}
      {activeTabSection === "commands" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Command className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase">
                COMPLETE TERMINAL COMMAND CHEAT SHEET
              </span>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">10 FUNCTIONAL CODES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commandList.map((cmd) => (
              <div
                key={cmd.code}
                className="p-4 bg-neutral-900/90 border border-cyan-500/30 rounded-xl space-y-2 hover:border-cyan-400 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md font-mono font-black text-xs border ${cmd.color}`}>
                      {cmd.code}
                    </span>
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300">
                      {cmd.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {cmd.code === "WHOAMI" && (
                      <button
                        onClick={() => {
                          triggerHaptic("selection");
                          setIsMissionHubOpen(true);
                        }}
                        className="px-2 py-1 bg-cyan-400 text-black font-bold text-[10px] rounded hover:bg-cyan-300 transition-colors cursor-pointer"
                        title="Open Mission Manifesto & Business Hub"
                      >
                        OPEN HUB
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyCommand(cmd.example)}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      title={`Copy ${cmd.example}`}
                    >
                      {copiedCmd === cmd.example ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{cmd.example}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-cyan-200/70 font-sans leading-relaxed">
                  {cmd.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SYNTAX & EXAMPLES */}
      {activeTabSection === "syntax" && (
        <div className="space-y-6 animate-in fade-in duration-200 font-sans">
          <div className="p-6 bg-[#020b14] border-2 border-cyan-500/50 rounded-2xl space-y-4 font-mono">
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              COMMAND SYNTAX RULES
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-900 border border-cyan-500/30 rounded-lg flex items-center gap-3">
                <span className="px-2 py-1 bg-amber-400 text-black font-black rounded">RULE 1</span>
                <span>Type the Ticker Symbol first, followed by a space, then the Command Code: <strong className="text-amber-300 font-mono">&lt;SYMBOL&gt; &lt;COMMAND&gt; &lt;GO&gt;</strong></span>
              </div>

              <div className="p-3 bg-neutral-900 border border-cyan-500/30 rounded-lg flex items-center gap-3">
                <span className="px-2 py-1 bg-amber-400 text-black font-black rounded">RULE 2</span>
                <span>Commands are case-insensitive. Typing <strong className="text-cyan-300 font-mono">nvda des</strong> works identically to <strong className="text-cyan-300 font-mono">NVDA DES</strong>.</span>
              </div>

              <div className="p-3 bg-neutral-900 border border-cyan-500/30 rounded-lg flex items-center gap-3">
                <span className="px-2 py-1 bg-amber-400 text-black font-black rounded">RULE 3</span>
                <span>Global macro commands like <strong className="text-purple-300 font-mono">YCRV</strong> or <strong className="text-purple-300 font-mono">ECST</strong> or <strong className="text-purple-300 font-mono">TOP</strong> can be run standalone without entering a ticker symbol!</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-black text-white uppercase font-mono tracking-wider">
              PRACTICE EXAMPLES TO TRY:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-neutral-900 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-amber-400 font-bold">1. SpaceX Valuations & Financials</span>
                  <span className="text-[10px] text-neutral-400">SPACEX FA</span>
                </div>
                <p className="text-xs text-cyan-200/70">
                  Inspects SpaceX $212.50 tender offer valuations, Starlink satellite subscriber cash flow, and orbital launch EBITDA margins.
                </p>
                <button
                  onClick={() => handleCopyCommand("SPACEX FA")}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer w-full justify-center"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy: "SPACEX FA"</span>
                </button>
              </div>

              <div className="p-4 bg-neutral-900 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-emerald-400 font-bold">2. NVIDIA Analyst Ratings</span>
                  <span className="text-[10px] text-neutral-400">NVDA ANR</span>
                </div>
                <p className="text-xs text-cyan-200/70">
                  Loads Wall Street consensus buy/sell breakdowns, 12-month target prices, and AI cluster GPU demand forecasts.
                </p>
                <button
                  onClick={() => handleCopyCommand("NVDA ANR")}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer w-full justify-center"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy: "NVDA ANR"</span>
                </button>
              </div>

              <div className="p-4 bg-neutral-900 border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-purple-400 font-bold">3. Bitcoin Level 2 Liquidity Depth</span>
                  <span className="text-[10px] text-neutral-400">BTC L2</span>
                </div>
                <p className="text-xs text-cyan-200/70">
                  Inspects bid/ask order book depth, institutional market maker spreads, and spot ETF liquidity pools.
                </p>
                <button
                  onClick={() => handleCopyCommand("BTC L2")}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer w-full justify-center"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy: "BTC L2"</span>
                </button>
              </div>

              <div className="p-4 bg-neutral-900 border border-blue-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-blue-400 font-bold">4. Treasury Yield Curve Spreads</span>
                  <span className="text-[10px] text-neutral-400">YCRV</span>
                </div>
                <p className="text-xs text-cyan-200/70">
                  Analyzes 2-Year vs 10-Year Treasury yields to detect recession signals, rate cut expectations, and interest rate curves.
                </p>
                <button
                  onClick={() => handleCopyCommand("YCRV")}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer w-full justify-center"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy: "YCRV"</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: 4-GRID MULTI-ASSET MODE */}
      {activeTabSection === "quad" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-[#020b14] border-2 border-purple-500/50 rounded-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  QUAD 4-GRID MULTI-ASSET MONITORING
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/40 rounded text-xs font-bold">
                PRO FEATURE
              </span>
            </div>

            <p className="text-xs text-cyan-200/80 font-sans leading-relaxed">
              When analyzing volatile market setups, single-asset views can miss cross-market correlations. 
              The Quad 4-Grid mode allows you to split the terminal viewport into four simultaneous real-time workstations.
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 bg-black/60 rounded-xl border border-purple-500/30">
              <div className="p-3 bg-neutral-900 border border-amber-500/40 rounded-lg text-center space-y-1">
                <span className="text-[10px] text-amber-400 font-bold block">GRID 1</span>
                <span className="text-xs font-black text-white">$SPCX ($212.50)</span>
              </div>
              <div className="p-3 bg-neutral-900 border border-cyan-500/40 rounded-lg text-center space-y-1">
                <span className="text-[10px] text-cyan-400 font-bold block">GRID 2</span>
                <span className="text-xs font-black text-white">$NVDA ($128.50)</span>
              </div>
              <div className="p-3 bg-neutral-900 border border-emerald-500/40 rounded-lg text-center space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block">GRID 3</span>
                <span className="text-xs font-black text-white">$BTC ($95,420)</span>
              </div>
              <div className="p-3 bg-neutral-900 border border-purple-500/40 rounded-lg text-center space-y-1">
                <span className="text-[10px] text-purple-400 font-bold block">GRID 4</span>
                <span className="text-xs font-black text-white">$TSLA ($242.50)</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-900/90 border border-purple-500/30 rounded-xl space-y-2 text-xs font-sans">
              <h4 className="font-bold text-purple-300 font-mono">HOW TO ACTIVATE 4-GRID MODE:</h4>
              <ol className="list-decimal list-inside space-y-1 text-cyan-200/80">
                <li>Launch the Stock Bloc Terminal by clicking <strong className="text-amber-300 font-mono">LAUNCH TERMINAL</strong> at top right.</li>
                <li>In the top terminal navigation header, locate the view mode selector buttons.</li>
                <li>Click <strong className="text-purple-300 font-mono">[GRID 4]</strong> to split into four real-time monitors.</li>
                <li>Click any quadrant to set it as your active workstation, then execute commands normally.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER CALL TO ACTION */}
      <div className="p-6 bg-gradient-to-r from-amber-950/40 via-cyan-950/40 to-purple-950/40 border-2 border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-black text-white uppercase">READY TO TEST THE TERMINAL?</h4>
          <p className="text-xs text-cyan-200/70 font-sans">
            Apply your knowledge immediately on live market assets. 100% unlocked with zero registration required.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic("heavy");
            onOpenTerminal();
          }}
          className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/30 border border-amber-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Terminal className="w-4 h-4 text-black" />
          <span>OPEN LIVE TERMINAL NOW</span>
        </button>
      </div>
    </div>
  );
};

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
