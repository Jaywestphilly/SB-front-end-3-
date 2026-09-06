import React, { useState } from "react";
import { StockBlocLogo, StockBlocLogoVariant } from "./StockBlocLogo";
import {
  Flame,
  Layers,
  Building2,
  ShieldCheck,
  Orbit,
  ShieldAlert,
  Zap,
  Globe,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Radio,
  MessageSquare,
  Twitter,
  Youtube,
  Briefcase,
  HelpCircle,
  Check,
  Download,
  Eye,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { trackEvent } from "../utils/analytics";
import { ViewTab } from "../types";
import { appendUTM } from "../utils/utm";

interface BrandLandingHubProps {
  onSelectTab: (tab: ViewTab) => void;
  onOpenLinktree: () => void;
}

export const BrandLandingHub: React.FC<BrandLandingHubProps> = ({
  onSelectTab,
  onOpenLinktree,
}) => {
  const [activeVariant, setActiveVariant] = useState<StockBlocLogoVariant>(() => {
    try {
      const stored = localStorage.getItem("stockbloc_logo_variant");
      if (stored === "3d" || stored === "flat") return stored;
    } catch {}
    return "3d";
  });

  const handleSelectVariant = (variant: StockBlocLogoVariant) => {
    setActiveVariant(variant);
    try {
      localStorage.setItem("stockbloc_logo_variant", variant);
    } catch {}
    window.dispatchEvent(
      new CustomEvent("stockbloc:logo_variant", { detail: { variant } })
    );
    triggerHaptic("selection");
    trackEvent("brand_logo_switched", { variant });
  };
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-8 font-mono select-none">
      {/* Hero Header Card */}
      <div className="relative bg-black rounded-3xl p-6 sm:p-10 overflow-hidden shadow-2xl shadow-cyan-500/10 border border-cyan-500/30">
        {/* Top Telemetry Hash Overlay */}
        <div className="absolute top-2 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-cyan-500/60 font-semibold tracking-widest pointer-events-none uppercase">
          <span>blockchain data ie 8998141</span>
          <span className="hidden sm:inline">blockchainsn date 802686</span>
          <span>matrix rate 4002666</span>
        </div>

        {/* Background Cyber Rays & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-black to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* HUD Frame Ticks */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-5 pt-3">
          {/* Logo Emblem */}
          <div
            className="relative group cursor-pointer flex flex-col items-center justify-center my-1"
            onClick={() => {
              triggerHaptic("selection");
              onOpenLinktree();
            }}
          >
            <div className="absolute -inset-6 bg-cyan-500/25 rounded-full blur-3xl group-hover:bg-cyan-400/40 transition-all duration-300 pointer-events-none" />

            <div className="relative z-10 p-2">
              <StockBlocLogo size="hero" showText={true} showTagline={true} />
            </div>
          </div>

          {/* Subtitle & High-Energy Game Banner */}
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/50 rounded-full text-amber-300 text-xs sm:text-sm font-mono font-black uppercase tracking-wider animate-pulse">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>STOP PLAYIN' WITH YOUR LIFE! WE GIVIN' YOU THE WHOLE BOARD.</span>
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-black font-tech text-white uppercase tracking-tight leading-tight">
              FROM THE BLOCK TO THE BLOC: <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-amber-300">
                INSTITUTIONAL QUANT WEALTH & 13F RADAR
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-cyan-200/90 font-sans leading-relaxed max-w-2xl mx-auto">
              Hedge funds, family offices, and Wall Street institutions been runnin' multi-billion dollar wealth plays behind closed doors. <strong>Stock Bloc cracked the terminal wide open.</strong> We combined real-time market data, 13F whale tracking, 800+ business credit stacking, cash-flowing real estate underwriting, and sci-fi aerospace tech into one unstoppable engine.
            </p>
          </div>

          {/* Social Proof Stats Bar */}
          <div className="w-full pt-3 border-t border-cyan-500/30 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-cyan-300 font-bold uppercase tracking-widest font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              REAL-TIME MARKET TELEMETRY
            </span>
            <span className="text-cyan-500/50">|</span>
            <span>1,842+ DECLASSIFIED 13F RECORDS</span>
            <span className="text-cyan-500/50">|</span>
            <span>800+ CREDIT ENGINE</span>
            <span className="text-cyan-500/50">|</span>
            <span>DSCR REAL ESTATE UNDERWRITING</span>
          </div>

          {/* Community Buttons (X / Twitter & YouTube) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md">
            <a
              href={appendUTM("https://x.com/thestockbloc?s=21", "hero_btn")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                triggerHaptic("selection");
                trackEvent("community_joined", { platform: "x_twitter" });
              }}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-cyan-400 text-black font-black font-tech text-xs uppercase tracking-wider alien-block-cut-sm hover:bg-cyan-300 shadow-lg shadow-cyan-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Twitter className="w-4 h-4 text-black fill-black" />
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
              className="w-full sm:w-1/2 py-2.5 px-4 bg-rose-950/60 border border-rose-500/60 text-rose-300 hover:bg-rose-900/60 font-black font-tech text-xs uppercase tracking-wider alien-block-cut-sm shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Youtube className="w-4 h-4 text-rose-400" />
              <span>FOLLOW ON YOUTUBE</span>
            </a>
          </div>
        </div>
      </div>

      {/* Official Brand Identity & Dual Emblem Selector */}
      <div className="relative bg-gradient-to-b from-black via-slate-950 to-black border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-black shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-mono text-cyan-200 uppercase tracking-wider alien-text-glow">
                OFFICIAL STOCK BLOC BRAND EMBLEM SUITE
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono tracking-wider uppercase mt-0.5">
                Liberty Bell + SB Interlocking Architecture + Bull Momentum Arrow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>ACTIVE EMBLEM: <strong className="text-white">{activeVariant === "3d" ? "3D METALLIC" : "2D FLAT"}</strong></span>
          </div>
        </div>

        {/* Dual Emblem Comparison & Switcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo 1 Card: 3D Chrome Metallic */}
          <div
            className={`relative rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
              activeVariant === "3d"
                ? "bg-cyan-950/30 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)]"
                : "bg-black/70 border-cyan-500/20 hover:border-cyan-500/50"
            }`}
          >
            <div className="space-y-4">
              {/* Badge & Title */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-1 rounded-md">
                  LOGO 1 // 3D METALLIC
                </span>
                {activeVariant === "3d" && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> ACTIVE TERMINAL
                  </span>
                )}
              </div>

              {/* Live Preview Display on Dark Surface */}
              <div className="relative h-48 w-full bg-[#020617] rounded-xl border border-cyan-500/30 flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(#083344_1px,transparent_1px)] [background-size:14px_14px] opacity-40 pointer-events-none" />
                <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-2xl group-hover:bg-cyan-400/25 transition-all pointer-events-none" />
                <img
                  src="/Logo1.png"
                  alt="Stock Bloc 3D Metallic Emblem"
                  referrerPolicy="no-referrer"
                  className="h-36 w-36 object-contain relative z-10 drop-shadow-[0_4px_20px_rgba(6,182,212,0.6)] group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div>
                <h3 className="font-mono font-extrabold text-white text-sm uppercase">
                  3D Metallic Chrome Emblem
                </h3>
                <p className="text-xs text-neutral-300 font-sans mt-1 leading-relaxed">
                  Sculpted chrome luster with specular lighting, beveled yoke arch, and gradient metallic depth for dark UI terminals.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2 pt-4 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => handleSelectVariant("3d")}
                className={`w-full py-2.5 px-4 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeVariant === "3d"
                    ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30"
                    : "bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-900/50"
                }`}
              >
                {activeVariant === "3d" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ACTIVE TERMINAL EMBLEM</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>SET AS TERMINAL EMBLEM</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <a
                  href="/Logo1.png"
                  download="StockBloc_Logo1_Transparent.png"
                  className="flex-1 py-1.5 px-2.5 bg-black/60 hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>TRANSPARENT PNG</span>
                </a>
                <a
                  href="/Logo1.jpeg"
                  download="StockBloc_Logo1_Original.jpeg"
                  className="flex-1 py-1.5 px-2.5 bg-black/60 hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>ORIGINAL JPG</span>
                </a>
              </div>
            </div>
          </div>

          {/* Logo 2 Card: 2D Flat Vector */}
          <div
            className={`relative rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
              activeVariant === "flat"
                ? "bg-cyan-950/30 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)]"
                : "bg-black/70 border-cyan-500/20 hover:border-cyan-500/50"
            }`}
          >
            <div className="space-y-4">
              {/* Badge & Title */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-1 rounded-md">
                  LOGO 2 // 2D FLAT VECTOR
                </span>
                {activeVariant === "flat" && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> ACTIVE TERMINAL
                  </span>
                )}
              </div>

              {/* Live Preview Display on Dark Surface */}
              <div className="relative h-48 w-full bg-[#020617] rounded-xl border border-cyan-500/30 flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(#083344_1px,transparent_1px)] [background-size:14px_14px] opacity-40 pointer-events-none" />
                <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-2xl group-hover:bg-cyan-400/25 transition-all pointer-events-none" />
                <img
                  src="/Logo2.png"
                  alt="Stock Bloc 2D Flat Emblem"
                  referrerPolicy="no-referrer"
                  className="h-36 w-36 object-contain relative z-10 drop-shadow-[0_4px_20px_rgba(6,182,212,0.6)] group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div>
                <h3 className="font-mono font-extrabold text-white text-sm uppercase">
                  2D Precision Flat Emblem
                </h3>
                <p className="text-xs text-neutral-300 font-sans mt-1 leading-relaxed">
                  Ultra-clean flat vector geometry with razor-sharp geometric contours, high contrast solid cyan fills, and minimalist silhouette.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2 pt-4 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => handleSelectVariant("flat")}
                className={`w-full py-2.5 px-4 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeVariant === "flat"
                    ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30"
                    : "bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-900/50"
                }`}
              >
                {activeVariant === "flat" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ACTIVE TERMINAL EMBLEM</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>SET AS TERMINAL EMBLEM</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <a
                  href="/Logo2.png"
                  download="StockBloc_Logo2_Transparent.png"
                  className="flex-1 py-1.5 px-2.5 bg-black/60 hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>TRANSPARENT PNG</span>
                </a>
                <a
                  href="/Logo2.jpeg"
                  download="StockBloc_Logo2_Original.jpeg"
                  className="flex-1 py-1.5 px-2.5 bg-black/60 hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>ORIGINAL JPG</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Global Export & Package Toolbar */}
        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>High-res assets generated: 1024×1024 transparent PNGs, 1200×1200 social card, & PWA icons</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="/logo.jpg"
              download="StockBloc_Social_Banner.jpg"
              className="py-1.5 px-3 bg-black/60 hover:bg-cyan-900/50 border border-cyan-400/40 text-cyan-200 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOCIAL BANNER (1200×1200)</span>
            </a>
          </div>
        </div>
      </div>

      {/* WALLO WEALTH CODE & DECLASSIFIED GAME SECTION */}
      <div className="relative bg-gradient-to-b from-[#020d18] via-black to-[#050b14] border-2 border-amber-400/60 rounded-3xl p-6 sm:p-10 text-white space-y-6 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Glowing cyber accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 font-black text-2xl shadow-inner shrink-0">
              <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/40 text-[10px] font-mono font-black text-amber-300 uppercase mb-1">
                <span>WALLO'S WEALTH MANIFESTO // GIVE 'EM THE WHOLE GAME</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-mono text-white uppercase tracking-wider alien-text-glow">
                STOP WAITING ON A RESCUE. BUILD YOUR EMPIRE.
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl w-fit">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>THE 4 PILLARS OF OWNERSHIP</span>
          </div>
        </div>

        {/* Wallo's Core 4 Game Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: 13F Whale Tracking */}
          <div className="p-4 bg-black/80 border border-cyan-500/30 rounded-2xl space-y-2 relative overflow-hidden group hover:border-cyan-400 transition-all">
            <div className="flex items-center gap-2 text-cyan-300 font-mono font-black text-xs uppercase">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[10px]">RULE 01</span>
              <span>WATCH THE WHALES, DON'T GUESS</span>
            </div>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Billionaires don't trade on gut feelings. They accumulate assets through SEC 13F filings. We give you their exact holdings—Warren Buffett, Ray Dalio, Citadel, and Renaissance Tech—so you see where trillions are moving before the herd.
            </p>
          </div>

          {/* Card 2: 800+ Credit Matrix */}
          <div className="p-4 bg-black/80 border border-emerald-500/30 rounded-2xl space-y-2 relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="flex items-center gap-2 text-emerald-300 font-mono font-black text-xs uppercase">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[10px]">RULE 02</span>
              <span>CREDIT IS CAPITAL, CAPITAL IS LEVERAGE</span>
            </div>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Credit isn't for consumer debt or luxury clothes—it's the cheat code to buy businesses and cash-flowing real estate without using your own cash. Learn Tier 1–3 business tradelines, LLC structuring, and 800+ scoring.
            </p>
          </div>

          {/* Card 3: Real Estate & DSCR Cash Flow */}
          <div className="p-4 bg-black/80 border border-amber-500/30 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="flex items-center gap-2 text-amber-300 font-mono font-black text-xs uppercase">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px]">RULE 03</span>
              <span>BRICKS OVER CLICKS (OWN REAL ASSETS)</span>
            </div>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Real estate is how generational wealth survives inflation. Use our built-in DSCR underwriters, BRRRR equity calculators, and liquid REIT dividend screeners to lock in cash flow that pays you 24/7/365.
            </p>
          </div>

          {/* Card 4: Frontier Tech & Space */}
          <div className="p-4 bg-black/80 border border-purple-500/30 rounded-2xl space-y-2 relative overflow-hidden group hover:border-purple-400 transition-all">
            <div className="flex items-center gap-2 text-purple-300 font-mono font-black text-xs uppercase">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-[10px]">RULE 04</span>
              <span>EARLY TO THE FUTURE = GENERATIONAL ALPHA</span>
            </div>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Defense aerospace (WAR.GOV), nuclear power grids, Dyson Swarm orbital solar arrays, and sovereign AI compute. Study the critical infrastructure of tomorrow before Wall Street inflates the price.
            </p>
          </div>
        </div>

        {/* Motivational Call to Action Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/60 via-black to-cyan-950/60 border border-amber-400/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block">
              // NO MORE EXCUSES // REAL DATA // REAL OWNERSHIP
            </span>
            <p className="text-sm font-bold text-white font-tech">
              EVERY TOOL ON THIS TERMINAL IS LIVE. CHOOSE YOUR ENTRY POINT BELOW:
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              trackEvent("module_opened", { section: "watchlist" });
              onSelectTab("watchlist");
            }}
            className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-black font-mono text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <Zap className="w-4 h-4 text-black fill-black" />
            <span>ENTER LIVE MARKET TERMINAL</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Two Tiers Capability Section */}
      <div className="space-y-6">
        {/* CORE PLATFORM GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black font-mono text-cyan-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-cyan-400 inline-block animate-ping" />
              CORE PLATFORM
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
              PRIMARY BRAND IDENTITY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Core 1: Watchlist */}
            <button type="button" aria-label="Open watchlist Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "watchlist" }); onSelectTab("watchlist"); }} className="bg-black/90 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-4 space-y-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Flame className="w-4 h-4 text-cyan-400 group-hover:animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-sm uppercase group-hover:text-cyan-300 transition-colors">
                  QUANT WATCHLIST
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  Real-time stock momentum, RSI overbought/oversold scores, and market benchmarks.
                </p>
              </div>
              <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>OPEN WATCHLIST</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Core 2: 13F Hedge Fund Intel */}
            <button type="button" aria-label="Open intelligence Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "intelligence" }); onSelectTab("intelligence"); }} className="bg-black/90 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-4 space-y-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Layers className="w-4 h-4 text-purple-400 group-hover:animate-spin-slow" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-sm uppercase group-hover:text-purple-300 transition-colors">
                  13F HEDGE FUND INTEL
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  SEC quarterly filing analysis, Berkshire, Citadel, and whale portfolio tracking.
                </p>
              </div>
              <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>VIEW 13F FILINGS</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Core 3: Credit 800+ */}
            <button type="button" aria-label="Open credit Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "credit" }); onSelectTab("credit"); }} className="bg-black/90 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-4 space-y-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-sm uppercase group-hover:text-emerald-300 transition-colors">
                  CREDIT 800+
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  Credit score calculators, dispute playbooks, and utilization optimization.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>BUILD CREDIT</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Core 4: Real Estate & REITs */}
            <button type="button" aria-label="Open real_estate Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "real_estate" }); onSelectTab("real_estate"); }} className="bg-black/90 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-2xl p-4 space-y-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Building2 className="w-4 h-4 text-amber-400 group-hover:scale-110" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-sm uppercase group-hover:text-amber-300 transition-colors">
                  REAL ESTATE & REITS
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  Property deal calculators, cap rate models, and high-yield dividend REITs.
                </p>
              </div>
              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>ANALYZE DEALS</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>

        {/* DIVIDER LINE */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t-2 border-amber-500/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#030812] px-4 font-mono text-xs font-black text-amber-400 uppercase tracking-widest border border-amber-500/40 rounded-full py-1 shadow-md">
              EXPERIMENTAL INTELLIGENCE
            </span>
          </div>
        </div>

        {/* STOCK BLOC LABS GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black font-mono text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                STOCK BLOC LABS
              </h3>
              <p className="text-[11px] text-amber-400/80 font-mono">
                Stock Bloc Labs explores emerging frontiers. Not investment advice.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase rounded alien-block-cut-sm">
              EXPERIMENTAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Labs 1: Energy */}
            <button type="button" aria-label="Open dyson_swarm Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "dyson_swarm" }); onSelectTab("dyson_swarm"); }} className="bg-black/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group relative"
              title="Stock Bloc Labs explores emerging frontiers. Not investment advice."
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Orbit className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-xs uppercase group-hover:text-amber-300 transition-colors">
                  LABS: ENERGY
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  Dyson Swarm orbital solar arrays, fusion, and power infrastructure.
                </p>
              </div>
              <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>INSPECT GRID</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </button>

            {/* Labs 2: Defense */}
            <button type="button" aria-label="Open war_gov_ufo Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "war_gov_ufo" }); onSelectTab("war_gov_ufo"); }} className="bg-black/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group relative"
              title="Stock Bloc Labs explores emerging frontiers. Not investment advice."
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 group-hover:animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-xs uppercase group-hover:text-amber-300 transition-colors">
                  LABS: DEFENSE
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  WAR.GOV declassified records, aerial intelligence, and aerospace contracts.
                </p>
              </div>
              <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>SCAN DEFENSE</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </button>

            {/* Labs 3: Revolution */}
            <button type="button" aria-label="Open ai_insights Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "ai_insights" }); onSelectTab("ai_insights"); }} className="bg-black/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group relative"
              title="Stock Bloc Labs explores emerging frontiers. Not investment advice."
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-xs uppercase group-hover:text-amber-300 transition-colors">
                  LABS: REVOLUTION
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  Next-gen AI models, quantum computing, and autonomous agents.
                </p>
              </div>
              <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>EXPLORE REVOLUTION</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </button>

            {/* Labs 4: Startups */}
            <button type="button" aria-label="Open small_business Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "small_business" }); onSelectTab("small_business"); }} className="bg-black/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group relative"
              title="Stock Bloc Labs explores emerging frontiers. Not investment advice."
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Briefcase className="w-4 h-4 text-amber-400 group-hover:scale-110" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-xs uppercase group-hover:text-amber-300 transition-colors">
                  LABS: STARTUPS
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  SBA funding models, venture pitch tools, and startup cash flow.
                </p>
              </div>
              <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>VIEW STARTUPS</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </button>

            {/* Labs 5: Media */}
            <button type="button" aria-label="Open youtube Module" onClick={() => { triggerHaptic("selection"); trackEvent("module_opened", { section: "youtube" }); onSelectTab("youtube"); }} className="bg-black/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 space-y-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full transition-all hover:scale-[1.02] shadow-lg group relative"
              title="Stock Bloc Labs explores emerging frontiers. Not investment advice."
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Radio className="w-4 h-4 text-amber-400 group-hover:scale-110" />
              </div>
              <div>
                <h4 className="font-extrabold font-mono text-white text-xs uppercase group-hover:text-amber-300 transition-colors">
                  LABS: MEDIA
                </h4>
                <p className="text-sm text-neutral-400 mt-1 leading-normal font-sans">
                  YouTube video library, 13F breakdown streams, and market podcasts.
                </p>
              </div>
              <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1 uppercase font-mono">
                <span>OPEN MEDIA HUB</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandLandingHub;
