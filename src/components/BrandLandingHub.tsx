import React from "react";
import { SpatialEmblem3D } from "./ui/SpatialEmblem3D";
import { LiquidGlassSurface } from "./ui/LiquidGlassSurface";
import {
  Flame,
  Layers,
  Building2,
  ShieldCheck,
  Orbit,
  ShieldAlert,
  Zap,
  Sparkles,
  ArrowRight,
  Radio,
  Twitter,
  Youtube,
  Briefcase,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { trackEvent } from "../utils/analytics";
import { ViewTab } from "../types";
import { appendUTM } from "../utils/utm";
import { MerchSection } from "./MerchSection";

interface BrandLandingHubProps {
  onSelectTab: (tab: ViewTab) => void;
  onOpenLinktree: () => void;
}

export const BrandLandingHub: React.FC<BrandLandingHubProps> = ({
  onSelectTab,
  onOpenLinktree,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-9 font-mono select-none">
      {/* HERO COMMAND DECK — VOLUMETRIC ALIEN HOLO-PROJECTOR CENTERPIECE */}
      <div className="xeno-glow-shell">
        <LiquidGlassSurface
          accent="cyan"
          shape="chamfered-lg"
          reticles={true}
          scanBeam={true}
          className="p-5 sm:p-8 md:p-10"
        >
          {/* Top Animated Plasma Conduit */}
          <div
            aria-hidden="true"
            className="absolute inset-x-10 top-0 h-[2px] xeno-conduit-rail pointer-events-none"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-center">
            {/* Left / Primary Editorial Command Lockup */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
              {/* Crisp Alien Display Brand Lockup (No redundant giant duplicate bell clipart) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  onOpenLinktree();
                }}
                className="group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f5d4]"
              >
                <div className="font-display text-2xl sm:text-3xl font-black tracking-[0.18em] text-[#f2faff] uppercase group-hover:text-[#00f5d4] transition-colors xeno-neon-text">
                  STOCK BLOC<span className="text-[#00f5d4]">.</span>
                </div>
                <div className="text-[11px] font-mono tracking-[0.22em] text-[#00e5ff]/85 uppercase mt-1">
                  WALL STREET SMARTS · BLOCKCHAIN HEARTS
                </div>
              </button>

              {/* High-Energy Kicker (Clean unboxed typography, zero static pill clutter) */}
              <p className="inline-flex items-center gap-2 text-amber-300 text-[11px] sm:text-xs font-alien-hud font-bold uppercase tracking-[0.12em]">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span>
                  STOP PLAYIN&apos; WITH YOUR LIFE! WE GIVIN&apos; YOU THE WHOLE
                  BOARD.
                </span>
              </p>

              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-[#f2faff] tracking-tight leading-tight text-balance">
                  Know what changed before everyone else
                </h1>

                <p className="text-sm sm:text-[15.5px] text-slate-200 font-sans leading-relaxed max-w-2xl">
                  Weekly plain-language breakdowns of SEC filings, 13F investor
                  moves, credit and real estate. Built for everyday investors.
                </p>
              </div>

              {/* Clean Unboxed Proof Metrics Strip */}
              <div className="w-full pt-3.5 border-t border-[#00f5d4]/25 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 text-[10.5px] sm:text-xs text-[#00f5d4] font-bold uppercase tracking-[0.16em] font-mono">
                <span>800+ CREDIT ENGINE</span>
                <span className="text-[#a855f7]">·</span>
                <span>DSCR REAL ESTATE UNDERWRITING</span>
                <span className="text-[#a855f7]">·</span>
                <span>LIVE SEC 13F &amp; 8-K RADAR</span>
              </div>

              {/* Angular Chamfered Primary & Community Command Triggers */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1 w-full">
                <a
                  href="/bloc"
                  onClick={(e) => {
                    e.preventDefault();
                    triggerHaptic("selection");
                    trackEvent("module_opened", { section: "hero_bloc" });
                    onSelectTab("bloc");
                  }}
                  className="w-full sm:w-auto py-2.5 px-6 xeno-clip-sm bg-gradient-to-r from-[#00f5d4] to-[#00d8ff] hover:from-[#42fff0] hover:to-[#38e8ff] text-slate-950 font-black font-alien-hud text-xs uppercase tracking-[0.14em] shadow-[0_0_26px_rgba(0,245,212,0.45)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Join The Bloc</span>
                </a>

                <a
                  href={appendUTM(
                    "https://x.com/thestockbloc?s=21",
                    "hero_btn",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    triggerHaptic("selection");
                    trackEvent("community_joined", { platform: "x_twitter" });
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 xeno-cmd-btn text-cyan-100 hover:text-white font-bold font-alien-hud text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Twitter className="w-3.5 h-3.5 text-[#00e5ff] fill-[#00e5ff]" />
                  <span>FOLLOW ON X (@THESTOCKBLOC)</span>
                </a>

                <a
                  href={appendUTM("https://youtube.com/@stockbloc", "hero_btn")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    triggerHaptic("selection");
                    trackEvent("community_joined", { platform: "youtube" });
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 xeno-clip-sm bg-rose-950/75 hover:bg-rose-900/80 border border-rose-500/60 hover:border-rose-400 text-rose-100 font-bold font-alien-hud text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Youtube className="w-4 h-4 text-rose-400" />
                  <span>FOLLOW ON YOUTUBE</span>
                </a>
              </div>
            </div>

            {/* Right: Volumetric Alien Hologram Projector Chamber (/Logo1.png) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[400px] xeno-glow-shell">
                <div className="xeno-clip-lg border border-[#00f5d4]/45 bg-[#020711] p-1">
                  <SpatialEmblem3D height={330} interactive={true} />
                </div>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#00e5ff]/80 mt-3 text-center">
                HOLOGRAPHIC EMITTER · MOVE POINTER TO ROTATE FIELD
              </p>
            </div>
          </div>
        </LiquidGlassSurface>
      </div>

      {/* THE STOCK BLOC MANIFESTO SECTION */}
      <section aria-label="The Stock Bloc Manifesto">
        <div className="xeno-glow-shell">
          <LiquidGlassSurface
            accent="cyan"
            shape="chamfered-lg"
            reticles={true}
            className="p-6 sm:p-10 text-white"
          >
            <div className="max-w-3xl mx-auto space-y-6 font-sans">
              <div className="border-b border-[#00f5d4]/25 pb-4 text-center sm:text-left">
                <h2 className="text-xl sm:text-3xl font-black font-display text-cyan-50 uppercase tracking-[0.12em] xeno-neon-text">
                  THE STOCK BLOC MANIFESTO
                </h2>
                <p className="text-base sm:text-lg font-bold text-[#00f5d4] mt-2">
                  We were taught how to earn. It’s time to understand how to
                  own.
                </p>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-slate-200 leading-relaxed">
                <p className="font-semibold text-white">
                  The world is changing.
                </p>

                <p>
                  Money moves differently. Technology is changing how businesses
                  operate. Artificial intelligence is transforming entire
                  industries. Traditional markets and digital assets are
                  becoming increasingly interconnected.
                </p>

                <p className="font-semibold text-white">
                  But one thing hasn’t changed.
                </p>

                <p>
                  People who understand how capital works have an advantage over
                  people who don’t.
                </p>

                <p>
                  Too many people are left trying to figure it out through
                  headlines, hype, speculation, and somebody else’s opinion.
                </p>

                <p className="font-semibold text-[#00f5d4]">
                  We believe there is a better way.
                </p>

                <p>Stock Bloc was built around a simple idea:</p>

                <p className="text-base sm:text-lg font-bold text-white px-5 py-3.5 xeno-clip-sm border border-[#00f5d4]/40 bg-[#05182d]/75">
                  Financial intelligence should not be reserved for people who
                  already have access to it.
                </p>

                <div className="space-y-2.5 pt-1">
                  <p>
                    We believe ordinary people deserve to understand markets,
                    businesses, assets, technology, risk, and ownership.
                  </p>
                  <p>
                    We believe the ability to evaluate an opportunity is more
                    valuable than blindly following a prediction.
                  </p>
                  <p>
                    We believe technology should make people more capable, not
                    more dependent.
                  </p>
                  <p>
                    We believe knowledge becomes more powerful when it is
                    shared.
                  </p>
                  <p>
                    And we believe the future belongs to people willing to
                    learn, adapt, question, build, and think independently.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 font-mono text-xs sm:text-sm text-cyan-100">
                  {[
                    "We don’t worship tickers.",
                    "We don’t follow gurus.",
                    "We don’t promise overnight wealth.",
                    "We don’t confuse a rising price with actual value.",
                  ].map((line, i) => (
                    <div
                      key={i}
                      className="p-3.5 xeno-clip-sm bg-[#041224]/90 border border-[#00f5d4]/30 flex items-center gap-2.5"
                    >
                      <span className="text-[10px] text-[#00f5d4] font-bold tabular-nums-strict">
                        0{i + 1}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>

                <p>
                  We study the system. We question assumptions. We document what
                  we learn. We acknowledge what we get wrong. We help others
                  understand what we’re learning.
                </p>

                <p>
                  We are investors, builders, students, entrepreneurs,
                  researchers, and curious minds.
                </p>

                <p>
                  Different backgrounds. Different ambitions. Different
                  perspectives.
                </p>

                <p className="font-semibold text-white">One shared standard.</p>

                <p className="text-base sm:text-lg font-bold text-amber-300 font-mono">
                  Understand before you invest. Evidence before conviction.
                  Ownership over optics.
                </p>

                <p>Stock Bloc is not about telling you what to think.</p>

                <p>
                  It’s about giving you the knowledge, tools, and community to
                  think for yourself.
                </p>

                <p>
                  Because the goal isn’t simply to participate in the economy.
                </p>

                <p>
                  The goal is to understand how it works, recognize
                  opportunities, manage risk, and build ownership over time.
                </p>

                <p>We are not here to watch the future happen.</p>

                <p className="font-semibold text-white">
                  We are here to understand it, participate in it, and help
                  build it.
                </p>
              </div>

              <div className="pt-4 border-t border-[#00f5d4]/25 space-y-2 text-center sm:text-left font-mono">
                <p className="text-lg sm:text-xl font-black font-display text-white uppercase tracking-[0.14em] xeno-neon-text">
                  WELCOME TO THE BLOC.
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#00f5d4] uppercase tracking-[0.18em]">
                  KNOW THE SYSTEM. BUILD OWNERSHIP. MOVE TOGETHER.
                </p>
                <p className="text-xs sm:text-sm text-amber-300 font-bold pt-1">
                  Stock Bloc. Wall Street smarts. Blockchain hearts.
                </p>
              </div>
            </div>
          </LiquidGlassSurface>
        </div>
      </section>

      {/* WALLO WEALTH CODE & DECLASSIFIED GAME SECTION */}
      <div className="xeno-glow-shell-amber">
        <LiquidGlassSurface
          accent="amber"
          shape="chamfered-lg"
          reticles={true}
          className="p-6 sm:p-10 text-white"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 48 48"
                    className="absolute inset-0 w-full h-full xeno-spin-slow"
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.2"
                      strokeDasharray="10 6"
                    />
                  </svg>
                  <div className="w-9 h-9 xeno-hex-pod bg-amber-500/20 flex items-center justify-center text-amber-300">
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-mono font-bold text-amber-300 uppercase tracking-[0.14em]">
                    WALLO&apos;S WEALTH MANIFESTO · GIVE &apos;EM THE WHOLE GAME
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-wider mt-0.5">
                    STOP WAITING ON A RESCUE. BUILD YOUR EMPIRE.
                  </h2>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-[0.14em] shrink-0">
                THE 4 PILLARS OF OWNERSHIP
              </span>
            </div>

            {/* Wallo's Core 4 Game Breakdown Cards — Chamfered Alien Hulls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiquidGlassSurface
                accent="cyan"
                shape="chamfered-md"
                interactive
                className="p-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-[#00f5d4] font-alien-hud font-black text-xs uppercase tracking-wider">
                    <span className="font-mono text-[11px] text-white/80">
                      01.
                    </span>
                    <span>WATCH THE WHALES, DON&apos;T GUESS</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Billionaires don&apos;t trade on gut feelings. They
                    accumulate assets through SEC 13F filings. We give you their
                    exact holdings, including Warren Buffett, Ray Dalio,
                    Citadel, and Renaissance Tech, so you see where trillions
                    are moving before the herd.
                  </p>
                </div>
              </LiquidGlassSurface>

              <LiquidGlassSurface
                accent="emerald"
                shape="chamfered-md"
                interactive
                className="p-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-[#00ff9d] font-alien-hud font-black text-xs uppercase tracking-wider">
                    <span className="font-mono text-[11px] text-white/80">
                      02.
                    </span>
                    <span>CREDIT IS CAPITAL, CAPITAL IS LEVERAGE</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Credit isn&apos;t for consumer debt or luxury clothes. It is
                    the cheat code to buy businesses and cash-flowing real
                    estate without using your own cash. Learn Tier 1-3 business
                    tradelines, LLC structuring, and 800+ scoring.
                  </p>
                </div>
              </LiquidGlassSurface>

              <LiquidGlassSurface
                accent="amber"
                shape="chamfered-md"
                interactive
                className="p-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-amber-300 font-alien-hud font-black text-xs uppercase tracking-wider">
                    <span className="font-mono text-[11px] text-white/80">
                      03.
                    </span>
                    <span>BRICKS OVER CLICKS (OWN REAL ASSETS)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Real estate is how generational wealth survives inflation.
                    Use our built-in DSCR underwriters, BRRRR equity
                    calculators, and liquid REIT dividend screeners to lock in
                    cash flow that pays you 24/7/365.
                  </p>
                </div>
              </LiquidGlassSurface>

              <LiquidGlassSurface
                accent="purple"
                shape="chamfered-md"
                interactive
                className="p-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-[#d8b4fe] font-alien-hud font-black text-xs uppercase tracking-wider">
                    <span className="font-mono text-[11px] text-white/80">
                      04.
                    </span>
                    <span>EARLY TO THE FUTURE = GENERATIONAL ALPHA</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Defense aerospace (WAR.GOV), nuclear power grids, Dyson
                    Swarm orbital solar arrays, and sovereign AI compute. Study
                    the critical infrastructure of tomorrow before Wall Street
                    inflates the price.
                  </p>
                </div>
              </LiquidGlassSurface>
            </div>

            {/* Motivational Call to Action Banner */}
            <div className="p-4 sm:p-5 xeno-clip-md bg-[#051223]/92 border border-amber-400/45 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10.5px] font-mono font-bold text-amber-300 uppercase tracking-[0.16em] block">
                  NO MORE EXCUSES · REAL DATA · REAL OWNERSHIP
                </span>
                <p className="text-sm font-bold text-white font-alien-hud tracking-wide">
                  EVERY TOOL ON THIS TERMINAL IS LIVE. CHOOSE YOUR ENTRY POINT
                  BELOW:
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  trackEvent("module_opened", { section: "watchlist" });
                  onSelectTab("watchlist");
                }}
                className="w-full sm:w-auto px-6 py-3 xeno-clip-sm bg-amber-400 hover:bg-amber-300 text-slate-950 font-black font-alien-hud text-xs uppercase tracking-[0.14em] shadow-[0_0_24px_rgba(245,158,11,0.38)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>ENTER LIVE MARKET TERMINAL</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        </LiquidGlassSurface>
      </div>

      {/* TWO TIERS CAPABILITY DECK */}
      <div className="space-y-7">
        {/* CORE PLATFORM GRID */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-[#00f5d4]/25 pb-2.5">
            <h3 className="text-lg font-black font-display text-cyan-50 uppercase tracking-[0.14em] xeno-neon-text">
              CORE PLATFORM
            </h3>
            <span className="text-[11px] text-[#00f5d4] font-mono uppercase tracking-[0.16em]">
              PRIMARY BRAND IDENTITY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                tab: "watchlist" as ViewTab,
                accent: "cyan" as const,
                aria: "Open watchlist Module",
                icon: Flame,
                hexBg: "bg-[#00f5d4]/18 text-[#00f5d4]",
                ringStroke: "#00f5d4",
                title: "QUANT WATCHLIST",
                desc: "Real-time stock momentum, RSI overbought/oversold scores, and market benchmarks.",
                cta: "OPEN WATCHLIST",
                ctaColor: "text-[#00f5d4]",
              },
              {
                tab: "intelligence" as ViewTab,
                accent: "purple" as const,
                aria: "Open intelligence Module",
                icon: Layers,
                hexBg: "bg-[#a855f7]/22 text-[#d8b4fe]",
                ringStroke: "#a855f7",
                title: "13F HEDGE FUND INTEL",
                desc: "SEC quarterly filing analysis, Berkshire, Citadel, and whale portfolio tracking.",
                cta: "VIEW 13F FILINGS",
                ctaColor: "text-[#d8b4fe]",
              },
              {
                tab: "credit" as ViewTab,
                accent: "emerald" as const,
                aria: "Open credit Module",
                icon: ShieldCheck,
                hexBg: "bg-[#00ff9d]/18 text-[#00ff9d]",
                ringStroke: "#00ff9d",
                title: "CREDIT 800+",
                desc: "Credit score calculators, dispute playbooks, and utilization optimization.",
                cta: "BUILD CREDIT",
                ctaColor: "text-[#00ff9d]",
              },
              {
                tab: "real_estate" as ViewTab,
                accent: "amber" as const,
                aria: "Open real_estate Module",
                icon: Building2,
                hexBg: "bg-amber-400/18 text-amber-300",
                ringStroke: "#fbbf24",
                title: "REAL ESTATE & REITS",
                desc: "Property deal calculators, cap rate models, and high-yield dividend REITs.",
                cta: "ANALYZE DEALS",
                ctaColor: "text-amber-300",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <LiquidGlassSurface
                  key={card.tab}
                  accent={card.accent}
                  shape="chamfered-md"
                  interactive
                >
                  <button
                    type="button"
                    aria-label={card.aria}
                    onClick={() => {
                      triggerHaptic("selection");
                      trackEvent("module_opened", { section: card.tab });
                      onSelectTab(card.tab);
                    }}
                    className="p-4 sm:p-5 h-full flex flex-col justify-between space-y-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00f5d4] text-left w-full group"
                  >
                    <div className="space-y-3">
                      <div className="relative w-11 h-11 flex items-center justify-center">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 44 44"
                          className="absolute inset-0 w-full h-full opacity-55 group-hover:opacity-100 group-hover:rotate-90 transition-all duration-300"
                        >
                          <circle
                            cx="22"
                            cy="22"
                            r="20"
                            fill="none"
                            stroke={card.ringStroke}
                            strokeWidth="1.2"
                            strokeDasharray="7 5"
                          />
                        </svg>
                        <div
                          className={`w-8 h-8 xeno-hex-pod flex items-center justify-center ${card.hexBg}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-extrabold font-alien-hud text-white text-sm uppercase tracking-wide group-hover:text-[#00f5d4] transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-sans">
                          {card.desc}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-[10.5px] font-bold flex items-center gap-1 uppercase font-mono pt-1 ${card.ctaColor}`}
                    >
                      <span>{card.cta}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </LiquidGlassSurface>
              );
            })}
          </div>
        </div>

        {/* PLASMA CONDUIT SECTION DIVIDER */}
        <div className="relative py-3 flex items-center justify-center">
          <div
            aria-hidden="true"
            className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
          />
          <span className="absolute bg-[#02050a] px-4 font-display text-[11px] font-black text-amber-300 uppercase tracking-[0.22em]">
            EXPERIMENTAL INTELLIGENCE
          </span>
        </div>

        {/* STOCK BLOC LABS GRID */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between flex-wrap gap-2 border-b border-amber-500/25 pb-2.5">
            <div>
              <h3 className="text-lg font-black font-display text-amber-300 uppercase tracking-[0.14em] flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                STOCK BLOC LABS
              </h3>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Stock Bloc Labs explores emerging frontiers. Not investment
                advice.
              </p>
            </div>
            <span className="text-[11px] text-amber-300 font-mono font-bold uppercase tracking-[0.16em]">
              EXPERIMENTAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                tab: "dyson_swarm" as ViewTab,
                aria: "Open dyson_swarm Module",
                icon: Orbit,
                title: "LABS: ENERGY",
                desc: "Dyson Swarm orbital solar arrays, fusion, and power infrastructure.",
                cta: "INSPECT GRID",
              },
              {
                tab: "war_gov_ufo" as ViewTab,
                aria: "Open war_gov_ufo Module",
                icon: ShieldAlert,
                title: "LABS: DEFENSE",
                desc: "WAR.GOV declassified records, aerial intelligence, and aerospace contracts.",
                cta: "SCAN DEFENSE",
              },
              {
                tab: "ai_insights" as ViewTab,
                aria: "Open ai_insights Module",
                icon: Sparkles,
                title: "LABS: REVOLUTION",
                desc: "Next-gen AI models, quantum computing, and autonomous agents.",
                cta: "EXPLORE REVOLUTION",
              },
              {
                tab: "small_business" as ViewTab,
                aria: "Open small_business Module",
                icon: Briefcase,
                title: "LABS: STARTUPS",
                desc: "SBA funding models, venture pitch tools, and startup cash flow.",
                cta: "VIEW STARTUPS",
              },
              {
                tab: "youtube" as ViewTab,
                aria: "Open youtube Module",
                icon: Radio,
                title: "LABS: MEDIA",
                desc: "YouTube video library, 13F breakdown streams, and market podcasts.",
                cta: "OPEN MEDIA HUB",
              },
            ].map((lab) => {
              const Icon = lab.icon;
              return (
                <LiquidGlassSurface
                  key={lab.tab}
                  accent="amber"
                  shape="chamfered-md"
                  interactive
                >
                  <button
                    type="button"
                    aria-label={lab.aria}
                    onClick={() => {
                      triggerHaptic("selection");
                      trackEvent("module_opened", { section: lab.tab });
                      onSelectTab(lab.tab);
                    }}
                    title="Stock Bloc Labs explores emerging frontiers. Not investment advice."
                    className="p-4 h-full flex flex-col justify-between space-y-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-left w-full group"
                  >
                    <div className="space-y-2.5">
                      <div className="w-8 h-8 xeno-hex-pod bg-amber-500/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-extrabold font-alien-hud text-white text-xs uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                          {lab.title}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                          {lab.desc}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-300 font-bold flex items-center gap-1 uppercase font-mono">
                      <span>{lab.cta}</span>
                      <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </LiquidGlassSurface>
              );
            })}
          </div>
        </div>
      </div>

      {/* Official Merch Section */}
      <MerchSection />
    </div>
  );
};

export default BrandLandingHub;
