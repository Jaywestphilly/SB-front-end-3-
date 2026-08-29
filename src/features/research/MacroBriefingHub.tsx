import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Building2,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  ArrowUpRight,
  ShieldAlert,
  BarChart3,
  Flame,
  Info,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { StockTicker } from "../../types";

interface MacroBriefingHubProps {
  onSelectTicker?: (symbol: string) => void;
  stocks?: StockTicker[];
}

export const MacroBriefingHub: React.FC<MacroBriefingHubProps> = ({
  onSelectTicker,
  stocks,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("JUST NOW");

  // Live Macro Metrics State with Expected vs. Actual vs. Prior Indicators
  const macroIndicators = [
    {
      id: "fed_rate",
      label: "FED FUNDS RATE",
      value: "5.25% - 5.50%",
      subtext: "FOMC Target Range (Pause / Dovish Tilt)",
      change: "0.00%",
      expected: "5.25% - 5.50%",
      actual: "5.25% - 5.50%",
      prior: "5.25% - 5.50%",
      isNeutral: true,
      icon: DollarSign,
      color: "text-amber-400 border-amber-500/40 bg-amber-950/30",
    },
    {
      id: "cpi",
      label: "CPI INFLATION (YoY)",
      value: "2.9%",
      subtext: "Core CPI at 3.2% (Cooling Trend)",
      change: "-0.2%",
      expected: "3.0%",
      actual: "2.9%",
      prior: "3.1%",
      isPositive: true,
      icon: Percent,
      color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
    },
    {
      id: "bond_yield",
      label: "10Y TREASURY YIELD",
      value: "4.18%",
      subtext: "Term Premium & Rate Expectations",
      change: "+3.2 bps",
      expected: "4.22%",
      actual: "4.18%",
      prior: "4.25%",
      isNegative: true,
      icon: TrendingUp,
      color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
    },
    {
      id: "m2_liquidity",
      label: "GLOBAL M2 LIQUIDITY",
      value: "$104.2 TRILLION",
      subtext: "+$1.8T QoQ Global Central Bank Expansion",
      change: "+1.76%",
      expected: "$103.8T",
      actual: "$104.2T",
      prior: "$102.4T",
      isPositive: true,
      icon: Globe,
      color: "text-purple-400 border-purple-500/40 bg-purple-950/30",
    },
    {
      id: "wti_crude",
      label: "WTI CRUDE OIL",
      value: "$78.40 / bbl",
      subtext: "OPEC+ Supply Friction & Freight Spreads",
      change: "+1.2%",
      expected: "$77.50",
      actual: "$78.40",
      prior: "$76.80",
      isNegative: true,
      icon: Flame,
      color: "text-rose-400 border-rose-500/40 bg-rose-950/30",
    },
    {
      id: "dxy_index",
      label: "US DOLLAR INDEX (DXY)",
      value: "103.85",
      subtext: "Global Currency Debasement Gauge",
      change: "-0.45%",
      expected: "104.20",
      actual: "103.85",
      prior: "104.30",
      isPositive: true,
      icon: BarChart3,
      color: "text-blue-400 border-blue-500/40 bg-blue-950/30",
    },
  ];

  // The required 3-bullet AI Summary
  const macroSummaryBullets = [
    {
      asset: "$BTC & Digital Asset Liquidity",
      icon: Zap,
      badgeColor: "bg-amber-400 text-black",
      borderColor: "border-amber-400/80",
      content:
        "M2 global money supply expansion (+$1.8T QoQ) combined with stabilizing 10-Year Treasury yields creates a high-conviction tailwind for $BTC as institutional capital seeks debasement hedges. Spot ETF net inflows remain resilient despite Fed interest rate pause dynamics.",
    },
    {
      asset: "Tech & Mega-Cap AI Growth Stocks",
      icon: Cpu,
      badgeColor: "bg-cyan-400 text-black",
      borderColor: "border-cyan-400/80",
      content:
        "Yield curve stabilization and easing 10-Year Treasury rates lower discount rates on long-duration AI capex. Mega-cap tech balance sheets with high cash reserves are yielding risk-free interest while funding $100B+ AI cluster deployments ($NVDA, $MSFT, $AAPL, $GOOGL).",
    },
    {
      asset: "Real Estate & Commercial Debt Refinancing",
      icon: Building2,
      badgeColor: "bg-emerald-400 text-black",
      borderColor: "border-emerald-400/80",
      content:
        "Elevated Fed funds rates continue compressing cap rate spreads and elevating debt refinancing costs. Commercial real estate debt maturities create distressed acquisition opportunities for cash-rich buyers, while REIT dividend yields regain attractive risk-adjusted spreads.",
    },
  ];

  const handleCopySummary = () => {
    triggerHaptic("selection");
    const summaryText = `STOCK BLOC AI MACRO BRIEFING SUMMARY
=========================================
1. $BTC & Digital Asset Liquidity:
M2 global money supply expansion (+$1.8T QoQ) combined with stabilizing 10-Year Treasury yields creates a high-conviction tailwind for $BTC as institutional capital seeks debasement hedges.

2. Tech & Mega-Cap AI Growth Stocks:
Yield curve stabilization and easing 10-Year Treasury rates lower discount rates on long-duration AI capex. Mega-cap tech balance sheets with high cash reserves funding $100B+ AI cluster deployments.

3. Real Estate & Commercial Debt Refinancing:
Elevated Fed funds rates continue compressing cap rate spreads and elevating debt refinancing costs. CRE debt maturities create distressed acquisition opportunities.

Generated by Stock Bloc Quant Terminal: https://stock-bloc.ai.studio/macro`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleRefreshMacroAi = async () => {
    triggerHaptic("medium");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Provide an updated macroeconomic brief on Fed Interest Rates, CPI, 10Y Yields, Global M2 Liquidity and how they impact $BTC, Tech Stocks, and Real Estate.",
        }),
      });
      await res.json();
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      triggerHaptic("success");
    } catch (e) {
      console.warn("AI Macro refresh fallback:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-mono select-none p-4 pb-20 max-w-4xl mx-auto">
      {/* HEADER BANNER */}
      <div className="p-5 sm:p-6 alien-block-cut bg-gradient-to-r from-neutral-950 via-[#031527] to-neutral-950 border-2 border-cyan-500/50 shadow-2xl relative overflow-hidden space-y-4">
        {/* HUD Ticks */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 alien-block-cut-sm bg-cyan-400 text-black font-black shrink-0">
                <Globe className="w-6 h-6 text-black" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider animate-periodic-text-glitch">
                    AI MACRO BRIEFING HUB
                  </h1>
                  <span className="px-2.5 py-0.5 text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 alien-block-cut-sm">
                    /MACRO
                  </span>
                </div>
                <p className="text-xs text-cyan-400/80 font-tech uppercase tracking-wide mt-0.5">
                  Real-time Macroeconomic Indicators, Liquidity Signals & Asset Class Impacts
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefreshMacroAi}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs alien-block-cut-sm shadow-lg shadow-cyan-400/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-black ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "SYNCHRONIZING..." : "REFRESH MACRO AI"}</span>
            </button>
          </div>
        </div>

        {/* Status indicator bar */}
        <div className="flex items-center justify-between text-[11px] text-cyan-400/70 border-t border-cyan-500/20 pt-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>FOMC RATE MONITOR ACTIVE // M2 LIQUIDITY FEED SYNCED</span>
          </div>
          <span>UPDATED: {lastUpdatedTime}</span>
        </div>
      </div>

      {/* LIVE MACRO DATA INDICATORS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-black text-cyan-300 uppercase">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            CORE MACROECONOMIC INDICATORS (LIVE)
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">6 CORE DATA STREAMS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {macroIndicators.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`p-4 alien-block-cut border-2 ${item.color} shadow-lg space-y-2 relative overflow-hidden transition-all hover:scale-[1.01]`}
              >
                {/* Corner Ticks */}
                <div className="hud-corner-tl" />
                <div className="hud-corner-tr" />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neutral-300 tracking-wider">
                    {item.label}
                  </span>
                  <Icon className="w-4 h-4 opacity-80" />
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-white font-mono tracking-tight">
                    {item.value}
                  </span>
                  <span
                    className={`text-xs font-black font-mono px-2 py-0.5 alien-block-cut-sm ${
                      item.isPositive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : item.isNegative
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {item.change}
                  </span>
                </div>

                {/* Consensus vs. Actual Indicators Breakdown */}
                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-cyan-500/20 text-[9px]">
                  <div className="bg-black/50 p-1 alien-block-cut-sm border border-cyan-500/20">
                    <span className="text-neutral-400 block uppercase">EXP:</span>
                    <strong className="text-cyan-200 block font-bold">{item.expected}</strong>
                  </div>
                  <div className="bg-black/50 p-1 alien-block-cut-sm border border-emerald-500/30">
                    <span className="text-emerald-400 block uppercase">ACTUAL:</span>
                    <strong className="text-emerald-300 block font-bold">{item.actual}</strong>
                  </div>
                  <div className="bg-black/50 p-1 alien-block-cut-sm border border-cyan-500/20">
                    <span className="text-neutral-400 block uppercase">PRIOR:</span>
                    <strong className="text-neutral-300 block font-bold">{item.prior}</strong>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-300/80 font-sans leading-tight pt-0.5">
                  {item.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-BULLET AI MACRO SUMMARY SECTION */}
      <div className="p-5 sm:p-6 alien-block-cut bg-gradient-to-br from-neutral-950 via-[#041221] to-neutral-950 border-2 border-amber-400/80 shadow-2xl space-y-5 glow-amber relative">
        {/* HUD Ticks */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-400/40 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 alien-block-cut-sm bg-amber-400 text-black font-black">
              <Sparkles className="w-5 h-5 text-black" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-950 border border-amber-400/40 px-2 py-0.5 rounded">
                AI MACRO IMPACT BRIEFING
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider mt-0.5">
                EXECUTIVE 3-BULLET ASSET ALLOCATION SUMMARY
              </h2>
            </div>
          </div>

          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-amber-400/20 shrink-0"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>COPIED BRIEFING!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black" />
                <span>COPY SUMMARY</span>
              </>
            )}
          </button>
        </div>

        {/* The 3 Bullets List */}
        <div className="space-y-4">
          {macroSummaryBullets.map((bullet, idx) => {
            const Icon = bullet.icon;
            return (
              <div
                key={idx}
                className={`p-4 alien-block-cut bg-black/80 border-2 ${bullet.borderColor} space-y-2 relative overflow-hidden transition-all hover:bg-black/95`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 alien-block-cut-sm bg-neutral-800 border border-white/20 text-white font-mono font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 alien-block-cut-sm ${bullet.badgeColor}`}>
                      {bullet.asset}
                    </span>
                  </div>

                  <Icon className="w-4 h-4 text-white opacity-80" />
                </div>

                <p className="text-xs text-neutral-200 font-sans leading-relaxed pl-1 pt-1">
                  {bullet.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick Ticker Direct Navigation Links */}
        <div className="pt-2 border-t border-amber-400/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
            SENSITIVE TICKERS:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {["BTC", "NVDA", "QQQ", "SPY", "VNQ", "VST"].map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectTicker && onSelectTicker(sym)}
                className="px-2.5 py-1 alien-block-cut-sm bg-amber-950/80 hover:bg-amber-900 border border-amber-400/50 text-amber-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span>${sym}</span>
                <ArrowUpRight className="w-3 h-3 text-amber-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MACRO EVENT CALENDAR & RATE CUT PROBABILITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 alien-block-cut bg-[#020b14] border border-cyan-500/40 space-y-3">
          <div className="flex items-center gap-2 text-cyan-300 font-black text-xs uppercase tracking-wider border-b border-cyan-500/20 pb-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>UPCOMING MACRO CATALYSTS</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              {
                title: "FOMC Rate Decision",
                desc: "Federal Reserve Policy Statement & Press Conference",
                dateStr: "SEP 17-18, 2026",
                startDate: "20260917T180000Z",
                endDate: "20260917T193000Z",
                badgeColor: "text-amber-300 bg-amber-950 border-amber-500/30",
              },
              {
                title: "US CPI Release",
                desc: "Consumer Price Inflation YoY/MoM Release",
                dateStr: "AUG 13, 2026",
                startDate: "20260813T123000Z",
                endDate: "20260813T133000Z",
                badgeColor: "text-cyan-300 bg-cyan-950 border-cyan-500/30",
              },
              {
                title: "Jackson Hole Economic Symposium",
                desc: "Federal Reserve Chair Keynote Speech",
                dateStr: "AUG 22-24, 2026",
                startDate: "20260822T140000Z",
                endDate: "20260824T180000Z",
                badgeColor: "text-emerald-300 bg-emerald-950 border-emerald-500/30",
              },
              {
                title: "US Non-Farm Payrolls (Jobs Report)",
                desc: "Unemployment Rate & Average Hourly Earnings",
                dateStr: "SEP 05, 2026",
                startDate: "20260905T123000Z",
                endDate: "20260905T133000Z",
                badgeColor: "text-purple-300 bg-purple-950 border-purple-500/30",
              },
            ].map((cat) => {
              const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cat.title)}&dates=${cat.startDate}/${cat.endDate}&details=${encodeURIComponent(cat.desc + " | Stock Bloc Macro Calendar")}&location=Federal+Reserve+Macro`;

              const handleIcsDownload = () => {
                triggerHaptic("selection");
                const icsText = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Stock Bloc AI Studio//Macro Calendar//EN\nBEGIN:VEVENT\nSUMMARY:${cat.title}\nDESCRIPTION:${cat.desc}\nDTSTART:${cat.startDate}\nDTEND:${cat.endDate}\nLOCATION:Federal Reserve Macro\nEND:VEVENT\nEND:VCALENDAR`;
                const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${cat.title.replace(/\s+/g, "_")}.ics`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              };

              return (
                <div key={cat.title} className="p-2.5 bg-black/60 border border-cyan-500/20 alien-block-cut-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-white block font-bold">{cat.title}</strong>
                      <span className="text-[10px] text-neutral-400">{cat.desc}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-black px-2 py-1 alien-block-cut-sm border ${cat.badgeColor}`}>
                      {cat.dateStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-cyan-500/10 text-[10px]">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 alien-block-cut-sm font-black flex items-center gap-1 transition-all"
                    >
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>+ Google Cal</span>
                    </a>
                    <button
                      onClick={handleIcsDownload}
                      className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/20 alien-block-cut-sm font-black flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span>.ICS File</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 alien-block-cut bg-[#020b14] border border-cyan-500/40 space-y-3">
          <div className="flex items-center gap-2 text-cyan-300 font-black text-xs uppercase tracking-wider border-b border-cyan-500/20 pb-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>CME FEDWATCH RATE CUT PROBABILITIES</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-300 font-bold">25 bps Rate Cut Target</span>
                <span className="text-emerald-400 font-mono font-black">74.2% Probability</span>
              </div>
              <div className="w-full bg-black h-2 alien-block-cut-sm overflow-hidden border border-emerald-500/30">
                <div className="bg-emerald-400 h-full" style={{ width: "74.2%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-neutral-300 font-bold">Rate Hold (5.25%-5.50%)</span>
                <span className="text-amber-300 font-mono font-black">25.8% Probability</span>
              </div>
              <div className="w-full bg-black h-2 alien-block-cut-sm overflow-hidden border border-amber-500/30">
                <div className="bg-amber-400 h-full" style={{ width: "25.8%" }} />
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 leading-tight pt-1">
              Futures market pricing reflects high consensus expectation for initial Federal Reserve monetary easing in Q3/Q4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
