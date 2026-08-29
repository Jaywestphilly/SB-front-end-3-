import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Award,
  TrendingUp,
  ShieldCheck,
  FileText,
  BarChart3,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  DollarSign,
  ArrowUpRight,
  Target,
  HelpCircle,
  PlayCircle,
  Activity,
  Layers,
  Compass,
  Zap,
  Percent,
  Clock,
  Flame,
  Shield,
  TrendingDown,
  Info,
} from "lucide-react";
import { StockTicker } from "../../types";
import { triggerHaptic } from "../../utils/haptics";
import { VisualOrderDiagrams } from '../../components/VisualOrderDiagrams';
import { VisualOptionsTree } from '../../components/VisualOptionsTree';
import { InteractiveOptionsStrategyVisualizer } from '../../components/InteractiveOptionsStrategyVisualizer';
import { StrategyGlossary } from '../../components/StrategyGlossary';
import { FinancialForensicsModeler } from './FinancialForensicsModeler';
import { OptionsGreeksSandbox } from './OptionsGreeksSandbox';
import { HistoricalCrisisSimulator } from './HistoricalCrisisSimulator';
import { MarketMicrostructureSimulator } from './MarketMicrostructureSimulator';

interface InvestopediaTabProps {
  stocks?: StockTicker[];
  initialTicker?: StockTicker | null;
  onSelectStock?: (stock: StockTicker) => void;
}

export interface FinancialTerm {
  id: string;
  term: string;
  category:
    | "indicators"
    | "options"
    | "strategies"
    | "valuation"
    | "real_estate"
    | "credit"
    | "wall_street";
  definition: string;
  formulaOrExample?: string;
  analystTip: string;
  investopediaUrl: string;
}

const EXTENDED_INDICATORS: FinancialTerm[] = [
  {
    id: "rsi_indicator",
    term: "Relative Strength Index (RSI)",
    category: "indicators",
    definition:
      "A momentum oscillator that calculates the speed and magnitude of recent price changes on a 0 to 100 scale. RSI helps traders spot whether a stock is overbought (pushed up too fast) or oversold (beaten down too low).",
    formulaOrExample:
      "RSI = 100 (100 / (1 + (Average Gain / Average Loss))). Standard settings use 14 periods. Reading > 70 = Overbought; Reading < 30 = Oversold.",
    analystTip:
      "Watch for RSI Divergence: if a stock makes a new lower low but RSI makes a higher low, sellers are losing steam and a bullish price reversal is usually right around the corner.",
    investopediaUrl: "https://www.investopedia.com/terms/r/rsi.asp",
  },
  {
    id: "macd_indicator",
    term: "MACD (Moving Average Convergence Divergence)",
    category: "indicators",
    definition:
      "A trend-following momentum indicator showing the relationship between two exponential moving averages. It consists of the MACD Line, the Signal Line, and a visual Histogram.",
    formulaOrExample:
      "MACD Line = 12-Day EMA 26-Day EMA. Signal Line = 9-Day EMA of MACD Line. Histogram = MACD Line Signal Line.",
    analystTip:
      'A bullish "Bull Cross" happens when the MACD line crosses above the Signal Line. When the histogram bars flip from negative (red) to positive (green), upward momentum is accelerating.',
    investopediaUrl: "https://www.investopedia.com/terms/m/macd.asp",
  },
  {
    id: "moving_averages",
    term: "SMA & EMA (Golden Cross & Death Cross)",
    category: "indicators",
    definition:
      "Moving Averages filter out day-to-day noise to highlight the true direction of a trend. Simple Moving Average (SMA) weights all days equally, while Exponential Moving Average (EMA) gives more weight to recent price action.",
    formulaOrExample:
      "Golden Cross = 50-Day SMA crosses ABOVE 200-Day SMA (Strong Bull Signal). Death Cross = 50-Day SMA crosses BELOW 200-Day SMA (Bear Warning).",
    analystTip:
      "Institutional hedge funds treat the 200-day moving average as the line in the sand between a bull market and a bear market.",
    investopediaUrl: "https://www.investopedia.com/terms/g/goldencross.asp",
  },
  {
    id: "bollinger_bands",
    term: "Bollinger Bands",
    category: "indicators",
    definition:
      "Volatility bands plotted 2 standard deviations above and below a 20-day moving average. The bands dynamically widen during high volatility and contract during low volatility.",
    formulaOrExample:
      "Middle Band = 20-Day SMA. Upper Band = 20-Day SMA + (2 × StdDev). Lower Band = 20-Day SMA (2 × StdDev).",
    analystTip:
      'The "Bollinger Squeeze": when the bands contract tightly together, volatility is at a minimum. This is always followed by an explosive price breakout.',
    investopediaUrl: "https://www.investopedia.com/terms/b/bollingerbands.asp",
  },
  {
    id: "vwap_indicator",
    term: "VWAP (Volume Weighted Average Price)",
    category: "indicators",
    definition:
      "The benchmark price that calculates the true average price a stock has traded at throughout the day, weighted by trading volume at each price level.",
    formulaOrExample:
      "VWAP = Sum(Typical Price × Volume) / Sum(Volume), recalculated tick-by-tick throughout the trading day.",
    analystTip:
      "Day traders and algorithms use VWAP to measure value: buying below VWAP means getting a discount relative to institutional buyers.",
    investopediaUrl: "https://www.investopedia.com/terms/v/vwap.asp",
  },
  {
    id: "stochastic_oscillator",
    term: "Stochastic Oscillator",
    category: "indicators",
    definition:
      "A momentum indicator comparing a stock’s closing price to its price range over a specific time frame (usually 14 days), scaled from 0 to 100.",
    formulaOrExample:
      "%K = [(Current Close Lowest Low) / (Highest High Lowest Low)] × 100. %D = 3-day SMA of %K. Levels above 80 indicate overbought; below 20 indicate oversold.",
    analystTip:
      "Because Stochastics moves faster than RSI, combine them: use RSI to establish macro trend direction and Stochastics to pinpoint exact entry timing.",
    investopediaUrl:
      "https://www.investopedia.com/terms/s/stochasticoscillator.asp",
  },
  {
    id: "atr_indicator",
    term: "ATR (Average True Range)",
    category: "indicators",
    definition:
      "A technical indicator that measures market volatility by calculating the average range between high and low prices over a set number of periods (usually 14 days).",
    formulaOrExample:
      "TR = Max[(High Low), Abs(High Previous Close), Abs(Low Previous Close)]. ATR = 14-day EMA of True Range.",
    analystTip:
      "Use ATR to set intelligent trailing stop-losses: set your stop 2x ATR below your entry price so normal daily noise doesn't shake you out of winning positions.",
    investopediaUrl: "https://www.investopedia.com/terms/a/atr.asp",
  },
  {
    id: "fibonacci_retracement",
    term: "Fibonacci Retracements",
    category: "indicators",
    definition:
      "Horizontal lines drawn on a chart indicating where key support or resistance is likely to occur based on mathematical ratios found in nature (23.6%, 38.2%, 50%, 61.8%).",
    formulaOrExample:
      'Calculated between a significant high and low point on a chart. The 61.8% level is known as the "Golden Ratio".',
    analystTip:
      "When a stock pulls back to the 61.8% Fibonacci level during a strong bull trend, buyers frequently step in for a high-probability bounce.",
    investopediaUrl:
      "https://www.investopedia.com/terms/f/fibonacciretracement.asp",
  },
  {
    id: "volume_profile",
    term: "Volume Profile & Point of Control (POC)",
    category: "indicators",
    definition:
      "An advanced charting display showing trading volume at specific price levels rather than over time periods. Point of Control (POC) is the single price level with the highest traded volume.",
    formulaOrExample:
      "POC = Longest horizontal bar on the Volume Profile histogram.",
    analystTip:
      "The POC acts like a magnet for price. If price moves away from POC on low volume, it almost always snaps back toward the high-volume node.",
    investopediaUrl: "https://www.investopedia.com/terms/v/volumeprofile.asp",
  },
  {
    id: "pe_and_peg_ratio",
    term: "P/E & PEG Valuation Ratios",
    category: "valuation",
    definition:
      "Price-to-Earnings (P/E) measures how much investors pay per $1 of current earnings. The PEG ratio divides P/E by the expected annual earnings growth rate.",
    formulaOrExample:
      "P/E = Stock Price / Earnings Per Share (EPS). PEG = P/E Ratio / Annual EPS Growth Rate (%).",
    analystTip:
      "A PEG ratio under 1.0 indicates a growth stock is trading at a bargain price relative to how fast its earnings are expanding.",
    investopediaUrl: "https://www.investopedia.com/terms/p/pegratio.asp",
  },
];

export const InvestopediaTab: React.FC<InvestopediaTabProps> = ({
  stocks = [],
  initialTicker,
  onSelectStock,
}) => {
  const [activeSection, setActiveSection] = useState<
    | "indicators"
    | "forensics"
    | "options_greeks"
    | "microstructure"
    | "crisis_war_room"
    | "options_masterclass"
    | "robinhood_starter"
    | "brokerage_basics"
    | "dictionary"
    | "purple_mastery"
  >("indicators");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    | "all"
    | "indicators"
    | "options"
    | "strategies"
    | "valuation"
    | "real_estate"
    | "credit"
  >("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeSection, selectedCategory]);

  const filteredTerms = EXTENDED_INDICATORS.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analystTip.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-6 select-none">
      {/* Academy Navigation Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black border border-cyan-500/30 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                  Free Game Trading Academy
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  MASTERCLASS
                </span>
              </div>
              <p className="text-xs font-tech text-neutral-300 tracking-wide mt-0.5">
                Technical indicators, options visual trees, brokerage order
                diagrams & beginner playbooks
              </p>
            </div>
          </div>

          {/* External Reference Links */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://www.investopedia.com/financial-term-dictionary-4769738"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Investopedia Glossary</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>

            <a
              href="https://robinhood.com/us/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Robinhood App</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </div>
        </div>

        {/* Terminal Guide Sub-banner */}
        <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-amber-400 font-bold text-sm tracking-wide flex items-center gap-2">
              HOW TO USE THE TERMINAL AT THE TOP{" "}
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-black">
                &lt;FREE TERMINAL&gt;
              </span>
            </h3>
            <p className="text-neutral-300 text-xs font-sans leading-relaxed max-w-3xl">
              Click the orange{" "}
              <strong className="text-amber-400">FREE TERMINAL</strong> button
              in the top navigation bar to open the SB-Quant Workstation. Once
              inside, simply type a stock symbol followed by a command (like{" "}
              <strong className="text-white bg-black px-1 py-0.5 rounded font-mono">
                NVDA DES
              </strong>
              ) in the "RUN:" input bar and hit Go, or click any of the Quick
              Command buttons like{" "}
              <strong className="text-amber-400">DES</strong> (Description) or{" "}
              <strong className="text-amber-400">ANR</strong> (Analyst Ratings).
              It operates just like a professional Wall Street terminal!
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-white/10 font-mono text-xs">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("indicators");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "indicators"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-black shadow-lg shadow-cyan-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Indicators</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("forensics");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "forensics"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black shadow-lg shadow-emerald-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>10-K Forensics</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("options_greeks");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "options_greeks"
                ? "bg-purple-500/20 text-purple-300 border-purple-400 font-black shadow-lg shadow-purple-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Greeks Sandbox</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("microstructure");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "microstructure"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-black shadow-lg shadow-cyan-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Order Book L2</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("crisis_war_room");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "crisis_war_room"
                ? "bg-red-500/20 text-red-300 border-red-400 font-black shadow-lg shadow-red-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Shield className="w-4 h-4 text-red-400" />
            <span>Crisis War Room</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("options_masterclass");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "options_masterclass"
                ? "bg-purple-500/20 text-purple-300 border-purple-400 font-black shadow-lg shadow-purple-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Options Tree</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("robinhood_starter");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "robinhood_starter"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 font-black shadow-lg shadow-emerald-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Robinhood Guide</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("brokerage_basics");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "brokerage_basics"
                ? "bg-amber-500/20 text-amber-300 border-amber-400 font-black shadow-lg shadow-amber-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Brokerage Orders</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("dictionary");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer  ${
              activeSection === "dictionary"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-400 font-black shadow-lg shadow-indigo-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Dictionary</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("purple_mastery");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "purple_mastery"
                ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400 font-black shadow-lg shadow-fuchsia-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Zap className="w-4 h-4 text-fuchsia-400" />
            <span>Mastery</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: EXPANDED TECHNICAL INDICATORS */}
      {activeSection === "indicators" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-cyan-400" />
                Technical Analysis & Indicator Encyclopedia
              </h3>
              <p className="text-xs font-tech text-neutral-400">
                In-depth mathematical definitions, practical trading setups &
                institutional playbooks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXTENDED_INDICATORS.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/50 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black font-mono text-cyan-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {item.term}
                  </h4>
                  <a
                    href={item.investopediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono font-bold text-cyan-400 hover:underline flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20"
                  >
                    <span>Investopedia</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  {item.definition}
                </p>

                {item.formulaOrExample && (
                  <div className="p-3 rounded-xl bg-black/70 border border-neutral-800 text-xs font-mono text-emerald-300">
                    <span className="text-neutral-500 font-bold block text-[10px] uppercase mb-0.5">
                      Calculation / Trigger Formula:
                    </span>
                    {item.formulaOrExample}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-100 font-sans flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300 text-[10px] uppercase block">
                      Analyst Playbook:
                    </span>
                    {item.analystTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: 10-K FORENSIC ACCOUNTING & CASH FLOW DECONSTRUCTOR */}
      {activeSection === "forensics" && (
        <FinancialForensicsModeler />
      )}

      {/* SECTION: OPTIONS GREEKS & VOLATILITY SURFACE SANDBOX */}
      {activeSection === "options_greeks" && (
        <OptionsGreeksSandbox />
      )}

      {/* SECTION: MARKET MICROSTRUCTURE & ORDER BOOK SIMULATOR */}
      {activeSection === "microstructure" && (
        <MarketMicrostructureSimulator />
      )}

      {/* SECTION: CRISIS WAR ROOM & SYSTEMIC RISK SIMULATOR */}
      {activeSection === "crisis_war_room" && (
        <HistoricalCrisisSimulator />
      )}

      {/* SECTION 2: OPTIONS MASTERCLASS & VISUAL OPTIONS TREE */}
      {activeSection === "options_masterclass" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-black border border-purple-500/40 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-500/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300">
                  <Layers className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    Options Trading Masterclass
                  </h3>
                  <p className="text-xs font-tech text-purple-200/90 mt-0.5">
                    Intuitive foundational guide: Calls, Puts, Strike
                    Prices, Premiums & The Greeks
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>1 Contract = 100 Shares of Stock</span>
              </div>
            </div>

            {/* Core Analogy Card */}
            <div className="p-5 rounded-2xl bg-black/70 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold uppercase">
                <Info className="w-4 h-4 text-purple-400" />
                <span>
                  What is an Option Contract? (The Basics)
                </span>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed font-sans">
                Think of an option like buying a{" "}
                <strong>ticket reservation for a rare pair of sneakers</strong>{" "}
                or <strong>house insurance</strong>. You pay a small
                non-refundable fee (called the <em>Premium</em>) today to lock
                in a price for the future. If the sneaker price skyrockets, your
                locked-in ticket becomes super valuable and you make a huge
                profit. If the price drops, you just let the ticket expire and
                your only loss is the small fee you paid upfront.
              </p>
            </div>

            {/* Calls vs Puts Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CALL OPTION */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                  <span className="text-sm font-black font-mono text-emerald-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    CALL OPTION (Bullish Bet)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                    EXPECT PRICE TO RISE
                  </span>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  A <strong>Call Option</strong> gives you the right (not
                  obligation) to <em>BUY</em> 100 shares of a stock at a
                  specific price (Strike Price) before a set deadline
                  (Expiration Date).
                </p>

                <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/20 text-xs font-mono space-y-1">
                  <span className="text-emerald-400 font-bold block">
                    Real Example:
                  </span>
                  <p className="text-[11px] text-neutral-300 font-sans">
                    Stock $XYZ is trading at $100. You buy a{" "}
                    <strong>$105 Call</strong> expiring in 30 days for a{" "}
                    <strong>$2.00 Premium</strong> ($200 total). If $XYZ rises
                    to $120, your contract is worth at least $15 ($1,500 total),
                    turning $200 into $1,500!
                  </p>
                </div>
              </div>

              {/* PUT OPTION */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                  <span className="text-sm font-black font-mono text-rose-400 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    PUT OPTION (Bearish Bet or Insurance)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                    EXPECT PRICE TO FALL
                  </span>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  A <strong>Put Option</strong> gives you the right (not
                  obligation) to <em>SELL</em> 100 shares of a stock at a
                  specific price (Strike Price) before a set deadline
                  (Expiration Date).
                </p>

                <div className="p-3 rounded-xl bg-black/60 border border-rose-500/20 text-xs font-mono space-y-1">
                  <span className="text-rose-400 font-bold block">
                    Real Example:
                  </span>
                  <p className="text-[11px] text-neutral-300 font-sans">
                    Stock $ABC is trading at $50. You buy a{" "}
                    <strong>$45 Put</strong> for a{" "}
                    <strong>$1.50 Premium</strong> ($150 total). If bad earnings
                    send $ABC crashing to $30, your option lets you sell at $45,
                    turning your $150 investment into over $1,350!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Options P&L Payoff Visualizer */}
          <InteractiveOptionsStrategyVisualizer />

          {/* Strategy Glossary with High-School Level Explanations */}
          <StrategyGlossary />

          {/* Interactive Options Tree & Live Chain Simulator */}
          <VisualOptionsTree />
        </div>
      )}

      {/* SECTION 3: ROBINHOOD BEGINNER MARKET STARTER KIT */}
      {activeSection === "robinhood_starter" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-black border border-emerald-500/40 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  <GraduationCap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Robinhood Beginner Investor Guide
                  </h3>
                  <p className="text-xs font-tech text-emerald-200/80 mt-0.5">
                    Step by step masterclass: opening accounts, buying
                    fractional shares & dollar-cost averaging
                  </p>
                </div>
              </div>

              <a
                href="https://robinhood.com/us/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black font-mono text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
              >
                <PlayCircle className="w-4 h-4 fill-black text-emerald-500" />
                <span>OPEN ROBINHOOD ACCOUNT</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 4-Step Starter Playbook */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black font-mono text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-black text-white font-mono">
                    Open a $0 Commission Brokerage Account
                  </h4>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans pl-8">
                  Download{" "}
                  <strong className="text-emerald-300">Robinhood</strong> or
                  open an individual brokerage account. Standard accounts allow
                  you to buy and sell stocks, ETFs, and options with zero trade
                  commissions.
                </p>
                <div className="pl-8 pt-1">
                  <a
                    href="https://robinhood.com/us/en/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Sign up on Robinhood.com</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black font-mono text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-sm font-black text-white font-mono">
                    Buy Fractional Shares ($1 Minimum)
                  </h4>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans pl-8">
                  You don't need thousands of dollars to buy full shares of
                  high-priced tech companies. Robinhood lets you buy fractional
                  shares for as little as $1 in exact dollar amounts.
                </p>
                <div className="pl-8 pt-1">
                  <a
                    href="https://www.investopedia.com/terms/f/fractionalshare.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Read Fractional Shares on Investopedia</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black font-mono text-xs flex items-center justify-center">
                    3
                  </span>
                  <h4 className="text-sm font-black text-white font-mono">
                    Build a Core Index ETF Foundation
                  </h4>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans pl-8">
                  Put 70%-80% of your portfolio into low-cost index ETFs like{" "}
                  <strong className="text-emerald-300">$VOO</strong> (Vanguard
                  S&P 500) or <strong className="text-emerald-300">$QQQ</strong>{" "}
                  (Invesco Nasdaq 100) for instant market diversification.
                </p>
                <div className="pl-8 pt-1">
                  <a
                    href="https://www.investopedia.com/terms/i/indexetf.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Read Index ETFs on Investopedia</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black font-mono text-xs flex items-center justify-center">
                    4
                  </span>
                  <h4 className="text-sm font-black text-white font-mono">
                    Automate Recurring Investments (DCA)
                  </h4>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans pl-8">
                  Set up automated weekly or monthly deposits (Dollar-Cost
                  Averaging). Automating $25 or $50 a week removes emotional
                  market timing anxiety and compounds wealth over time.
                </p>
                <div className="pl-8 pt-1">
                  <a
                    href="https://www.investopedia.com/terms/d/dollarcostaveraging.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Read Dollar-Cost Averaging on Investopedia</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: VISUAL BROKERAGE ORDER TYPES */}
      {activeSection === "brokerage_basics" && <VisualOrderDiagrams />}

      
      {/* SECTION 6: PURPLE MASTERY MODULES */}
      {activeSection === "purple_mastery" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Module 1 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              AWG INNERMOST LOOP
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              Alexander Wissner-Gross: The Physics of Intelligence & Computronium Escapes
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Explores causal entropic forces and the physics of intelligence, mapping how sovereign compute scales past traditional boundaries.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$NVDA</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$TSM</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$SKHY</span>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              MACRO & INFRASTRUCTURE
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              The $1 Trillion Power Grid Bottleneck, Foundries & Rates
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Analyzes electric power grid limitations as the primary constraint on data center expansion over raw GPU supply.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$BE</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$PLPC</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$EQIX</span>
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              EXPONENTIAL TECH & LONGEVITY
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              SaaS Multiples, Native Software vs Legacy Code & Sovereign Wealth
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Examines how lean AI-native software architectures disrupt traditional enterprise software valuations.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$TSLA</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$ASTS</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$SPCE</span>
            </div>
          </div>

          {/* Module 4 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              HIGH PERFORMANCE & MINDSET
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              Hyper-Focus Mastery: Rewiring Your Brain for High Yields & Wealth Speed
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Cognitive protocols designed to reduce mental fatigue, accelerate numerical processing, and execute disciplined wealth habits.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$SPY</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$QQQ</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$BTC</span>
            </div>
          </div>
        </div>
      )}


      {/* SECTION 5: FINANCIAL DICTIONARY & SEARCH */}
      {activeSection === "dictionary" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Comprehensive Financial Dictionary
              </h3>
              <p className="text-xs font-tech text-neutral-400">
                Search essential terms across indicators, options, real estate,
                credit repair & Wall Street
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search financial terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "all", label: "All Categories" },
              { id: "indicators", label: "Indicators" },
              { id: "options", label: "Options" },
              { id: "valuation", label: "Valuation" },
              { id: "real_estate", label: "Real Estate" },
              { id: "credit", label: "Credit 800+" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedCategory(cat.id as any);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-400 font-black"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Term Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTerms.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-indigo-500/50 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black font-mono text-indigo-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    {item.term}
                  </h4>
                  <a
                    href={item.investopediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono font-bold text-indigo-300 hover:underline flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                  >
                    <span>Investopedia</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  {item.definition}
                </p>

                {item.formulaOrExample && (
                  <div className="p-2.5 rounded-xl bg-black/60 border border-neutral-800 text-xs font-mono text-emerald-300">
                    <span className="text-neutral-500 font-bold block text-[10px] uppercase">
                      Formula / Example:
                    </span>
                    {item.formulaOrExample}
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200/90 font-sans flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300 text-[10px] uppercase block">
                      Analyst Take:
                    </span>
                    {item.analystTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
