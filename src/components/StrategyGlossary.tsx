import React, { useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Search,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Zap,
  Layers,
  Target,
  DollarSign,
  Activity,
  Sparkles,
  HelpCircle,
  Info,
  Percent,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface OptionsStrategyItem {
  id: string;
  name: string;
  category: "neutral" | "bullish" | "bearish" | "volatility" | "income";
  categoryLabel: string;
  riskLevel: "Low Risk" | "Defined Risk" | "Medium Risk" | "Advanced";
  analogyTitle: string;
  highSchoolDefinition: string;
  realWorldExample: string;
  whenToUse: string;
  maxProfit: string;
  maxLoss: string;
  iconName:
    | "iron_condor"
    | "bull_call"
    | "bear_put"
    | "covered_call"
    | "protective_put"
    | "cash_put"
    | "straddle"
    | "calendar";
  analystTip: string;
}

const STRATEGY_DICTIONARY: OptionsStrategyItem[] = [
  {
    id: "iron_condor",
    name: "Iron Condor",
    category: "neutral",
    categoryLabel: "Sideways / Neutral",
    riskLevel: "Defined Risk",
    analogyTitle: "The Football Goalpost Analogy 🏈",
    highSchoolDefinition:
      "An Iron Condor sets up two goalposts (a Call spread high and a Put spread low). As long as the stock price stays in-bounds between your goalposts until expiration, you keep 100% of the upfront cash collected!",
    realWorldExample:
      "Stock $NVDA is trading at $120 before earnings. You sell an Iron Condor with a $105 Put floor and $135 Call ceiling for a $2.50 ($250 total) net credit. If $NVDA finishes between $105 and $135, you walk away with $250 profit.",
    whenToUse:
      "When a stock is consolidating sideways and implied volatility (IV) is high, but no major price breakout is expected.",
    maxProfit: "Net Premium Collected Upfront",
    maxLoss: "(Width of Wing Strikes Net Premium) x 100",
    iconName: "iron_condor",
    analystTip:
      "Look for stocks with high IV Percentile (>50%). Selling options when premiums are bloated gives you a wider safety window to profit.",
  },
  {
    id: "bull_call_spread",
    name: "Bull Call Vertical Spread",
    category: "bullish",
    categoryLabel: "Bullish",
    riskLevel: "Defined Risk",
    analogyTitle: "The Discount Coupon Strategy 🎟️",
    highSchoolDefinition:
      "Instead of buying an expensive single Call option, you buy a Call at a lower strike price and simultaneously sell a Call at a higher strike price. Selling the higher Call acts like a discount coupon to offset the cost of your trade.",
    realWorldExample:
      "Stock $AAPL is at $220. Buying a $220 Call costs $8.00 ($800). To lower your cost, you sell a $230 Call for $3.00 ($300). Your net entry cost drops to $5.00 ($500 max loss), and max profit is capped at $5.00 ($500).",
    whenToUse:
      "When you are moderately bullish on a stock and want high percentage returns without paying full price for an outright Call.",
    maxProfit: "(Difference Between Strikes Net Premium Paid) x 100",
    maxLoss: "Net Premium Paid Upfront",
    iconName: "bull_call",
    analystTip:
      "Set your sold upper Call strike at key technical resistance levels. That way you collect maximum profit right where the stock is likely to pause.",
  },
  {
    id: "bear_put_spread",
    name: "Bear Put Vertical Spread",
    category: "bearish",
    categoryLabel: "Bearish",
    riskLevel: "Defined Risk",
    analogyTitle: "Capped Downside Shorting 📉",
    highSchoolDefinition:
      "You buy a higher Put option expecting the stock to fall, and sell a lower Put option to discount your upfront cost. If the stock drops, your profit expands up to your lower strike floor.",
    realWorldExample:
      "Stock $TSLA is at $250. You buy a $250 Put for $10.00 ($1,000) and sell a $230 Put for $4.00 ($400). Your net cost is $6.00 ($600 max loss) for a maximum payout of $14.00 ($1,400 profit) if $TSLA drops to $230.",
    whenToUse:
      "When you anticipate a stock or index will experience a moderate sell-off or correction.",
    maxProfit: "(Difference Between Strikes Net Premium Paid) x 100",
    maxLoss: "Net Premium Paid Upfront",
    iconName: "bear_put",
    analystTip:
      "Bear Put spreads have a much higher statistical win rate than buying raw Put options because time decay (Theta) hurts you significantly less.",
  },
  {
    id: "covered_call",
    name: "Covered Call",
    category: "income",
    categoryLabel: "Income & Cash Flow",
    riskLevel: "Low Risk",
    analogyTitle: "Renting Out Your Rental Property 🏠",
    highSchoolDefinition:
      'You own 100 shares of a stock (like owning a house) and sell a Call option to someone else. You collect instant cash "rent" upfront. If the stock stays below the target price, you keep the cash AND your stock.',
    realWorldExample:
      "You own 100 shares of $MSFT at $400. You sell a 30-day $420 Call for $5.00 ($500 cash income). You pocket $500 immediately. If $MSFT stays below $420, you repeat the process next month!",
    whenToUse:
      "On stocks you already own in your portfolio to generate steady monthly dividend-like cash flow.",
    maxProfit: "(Strike Price Stock Purchase Price) + Premium Collected",
    maxLoss: "Stock Purchase Price Premium Collected",
    iconName: "covered_call",
    analystTip:
      "The ultimate wealth-building strategy: sell 30-45 DTE Covered Calls at 0.30 Delta. This gives you an 85%+ probability of keeping your stock and the cash.",
  },
  {
    id: "protective_put",
    name: "Protective Put",
    category: "income",
    categoryLabel: "Hedging & Safety",
    riskLevel: "Low Risk",
    analogyTitle: "Car or Home Insurance Policy 🛡️",
    highSchoolDefinition:
      "You own 100 shares of stock and buy a Put option. If the stock crashes to zero, your Put contract guarantees you can still sell your shares at the agreed strike price floor, stopping all losses.",
    realWorldExample:
      "You own 100 shares of $AMZN at $180. You buy a 90-day $170 Put for $4.00 ($400). If $AMZN crashes to $100 during a market panic, your Put allows you to sell at $170!",
    whenToUse:
      "Before major earnings reports, macroeconomic events, or when protecting large unrealized capital gains without selling your stock.",
    maxProfit: "Unlimited (Minus Put Premium Paid)",
    maxLoss: "(Stock Entry Price Put Strike) + Put Premium Paid",
    iconName: "protective_put",
    analystTip:
      "Instead of buying short term Puts which decay quickly, buy 6-month Out-of-the-Money Puts for low-cost portfolio disaster insurance.",
  },
  {
    id: "cash_put",
    name: "Cash-Secured Put",
    category: "income",
    categoryLabel: "Income & Cash Flow",
    riskLevel: "Low Risk",
    analogyTitle: "Getting Paid to Place a Discount Limit Order 💵",
    highSchoolDefinition:
      "You set aside cash in your brokerage account and promise to buy 100 shares if the stock dips to your target price. The market pays you instant cash upfront just for offering to buy at a discount!",
    realWorldExample:
      "Stock $VOO is trading at $510. You want to buy it at $490. You sell a $490 Put for $6.00 ($600 income). If $VOO stays above $490, you keep $600 free cash. If it dips below $490, you buy $VOO at an effective cost of $484!",
    whenToUse:
      "When you have cash waiting to buy quality stocks and want to get paid yield while waiting for a pullback.",
    maxProfit: "Net Premium Collected Upfront",
    maxLoss: "(Put Strike Price Premium Collected) x 100",
    iconName: "cash_put",
    analystTip:
      'Combine Cash-Secured Puts with Covered Calls to execute "The Options Wheel Strategy", generating continuous passive income month after month.',
  },
  {
    id: "straddle",
    name: "Long Straddle / Strangle",
    category: "volatility",
    categoryLabel: "Volatility / Earnings",
    riskLevel: "Medium Risk",
    analogyTitle: "Betting on a Big Fireworks Show 🎆",
    highSchoolDefinition:
      "You buy BOTH a Call and a Put at the exact same time. You do not care if the stock goes UP or DOWN, you only care that it moves explosively in either direction!",
    realWorldExample:
      "Stock $TSLA is at $200 before an Robotaxi reveal. You buy a $200 Call ($6.00) and a $200 Put ($6.00) for $12.00 ($1,200 total). If $TSLA shoots to $240 or crashes to $160, your trade explodes into huge profits.",
    whenToUse:
      "Ahead of massive volatility events like FDA drug approvals, Supreme Court rulings, or binary tech product launches.",
    maxProfit: "Unlimited",
    maxLoss: "Total Combined Premium Paid Upfront",
    iconName: "straddle",
    analystTip:
      'Beware of "IV Crush"! After the big news event passes, option implied volatility drops instantly, which can shrink contract values even if price moves.',
  },
  {
    id: "calendar",
    name: "Calendar / Time Spread",
    category: "neutral",
    categoryLabel: "Time Decay Mastery",
    riskLevel: "Advanced",
    analogyTitle: "Exploiting Two Different Clocks ⏳",
    highSchoolDefinition:
      "You sell a short term option (decays super fast) and buy a long term option (decays very slowly) at the exact same strike price. You profit from the speed difference between the two clocks.",
    realWorldExample:
      "You sell a 10-day Call at $150 for $2.00 and buy a 60-day Call at $150 for $5.00 (Net cost $3.00). In 10 days, the short Call expires worthless while your long Call retains most of its value.",
    whenToUse:
      "In low volatility environments on stable stocks when expecting gradual steady price action.",
    maxProfit: "Value of Long Option at Short Option Expiration Net Premium",
    maxLoss: "Net Premium Paid Upfront",
    iconName: "calendar",
    analystTip:
      "Calendar spreads are one of the favorite secret weapons of quantitative hedge funds because they turn time decay into pure cash flow.",
  },
];

export const StrategyGlossary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>("iron_condor");

  const filteredStrategies = STRATEGY_DICTIONARY.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.highSchoolDefinition
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.analogyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analystTip.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStrategyIcon = (iconName: string) => {
    switch (iconName) {
      case "iron_condor":
        return <Layers className="w-5 h-5 text-purple-400" />;
      case "bull_call":
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "bear_put":
        return <TrendingDown className="w-5 h-5 text-rose-400" />;
      case "covered_call":
        return <DollarSign className="w-5 h-5 text-amber-400" />;
      case "protective_put":
        return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
      case "cash_put":
        return <Zap className="w-5 h-5 text-emerald-300" />;
      case "straddle":
        return <Flame className="w-5 h-5 text-orange-400" />;
      case "calendar":
        return <Clock className="w-5 h-5 text-indigo-400" />;
      default:
        return <Target className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-indigo-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
                  Options Strategy Glossary & Playbooks
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  CONCEPTUAL DEFINITIONS
                </span>
              </div>
              <p className="text-xs font-tech text-neutral-300 tracking-wide mt-0.5">
                Iron Condors, Spreads, Straddles & Covered Calls explained with
                real-world analogies & visual iconography
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Iron Condor, Call Spread..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/60 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 font-mono text-xs">
          {[
            { id: "all", label: "All Playbooks" },
            { id: "income", label: "Income & Cash Flow" },
            { id: "bullish", label: "Bullish Spreads" },
            { id: "bearish", label: "Bearish Spreads" },
            { id: "neutral", label: "Sideways / Neutral" },
            { id: "volatility", label: "Volatility / Earnings" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-400 font-black shadow-lg shadow-indigo-500/10"
                  : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStrategies.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-neutral-900/90 border transition-all space-y-4 relative ${
                isExpanded
                  ? "border-indigo-500 shadow-xl shadow-indigo-500/10 bg-gradient-to-br from-neutral-900 via-slate-900/90 to-black"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-black border border-white/10 shrink-0">
                    {getStrategyIcon(item.iconName)}
                  </div>
                  <div>
                    <h4 className="text-base font-black font-mono text-white flex items-center gap-2">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-sans font-bold text-indigo-300">
                      {item.analogyTitle}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 border ${
                    item.riskLevel === "Low Risk"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : item.riskLevel === "Defined Risk"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                        : "bg-purple-500/20 text-purple-300 border-purple-400/40"
                  }`}
                >
                  {item.riskLevel}
                </span>
              </div>

              {/* Intuitive Level Definition */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">
                  Intuitive Explanation:
                </span>
                <p className="text-sm text-neutral-200 font-sans leading-relaxed">
                  {item.highSchoolDefinition}
                </p>
              </div>

              {/* Real World Example */}
              <div className="p-3 rounded-xl bg-black/70 border border-neutral-800 space-y-1 font-mono text-xs">
                <span className="text-emerald-400 font-bold block text-[10px] uppercase">
                  Real World Trade Example:
                </span>
                <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                  {item.realWorldExample}
                </p>
              </div>

              {/* Max Profit / Max Loss Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-0.5">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase block">
                    Max Profit
                  </span>
                  <span className="text-[11px] font-bold text-emerald-300">
                    {item.maxProfit}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-0.5">
                  <span className="text-[9px] text-rose-400 font-bold uppercase block">
                    Max Loss
                  </span>
                  <span className="text-[11px] font-bold text-rose-300">
                    {item.maxLoss}
                  </span>
                </div>
              </div>

              {/* Analyst Pro Tip */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs font-sans text-indigo-200 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300 font-mono text-[10px] uppercase block">
                    Analyst Playbook Tip:
                  </strong>
                  {item.analystTip}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
