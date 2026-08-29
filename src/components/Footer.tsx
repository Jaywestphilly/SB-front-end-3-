import React from "react";
import { StockBlocLogo } from "./StockBlocLogo";
import { ShieldAlert, Globe, ExternalLink, Radio, Heart, Youtube } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { trackEvent } from "../utils/analytics";
import { ViewTab } from "../types";

interface FooterProps {
  onSelectTab: (tab: ViewTab) => void;
  onOpenLinktree: () => void;
  onOpenDataStatus: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenLinktree,
  onOpenDataStatus,
}) => {
  return (
    <footer className="w-full bg-black border-t border-cyan-500/30 text-neutral-300 font-mono text-xs py-8 px-4 mt-12 select-none">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Educational Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-black/90 border border-amber-500/40 text-amber-200/90 font-sans text-xs sm:text-sm leading-relaxed flex items-start gap-3 shadow-lg shadow-amber-950/20">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-400 font-mono font-bold uppercase tracking-wider block mb-1">
              EDUCATIONAL INTELLIGENCE & LEGAL DISCLAIMER
            </strong>
            For educational and informational purposes only. Content is not financial, investment, or legal advice. All investments carry risk of capital loss. Past performance does not guarantee future results. Verify independent SEC filings before executing trades.
          </div>
        </div>

        {/* Third-Party Data Attributions Banner */}
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] font-mono text-cyan-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            <span>
              <strong>DATA ATTRIBUTION:</strong> Market feeds powered by Yahoo Finance API proxies & SEC EDGAR filings. Launch telemetry powered by SpaceX API & Planet Labs public data.
            </span>
          </div>
          <button
            onClick={() => {
              triggerHaptic("selection");
              onOpenDataStatus();
            }}
            className="text-[10px] text-cyan-300 underline hover:text-white shrink-0 cursor-pointer"
          >
            Inspect Feed Reliability Status
          </button>
        </div>

        {/* Links & Brand Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-cyan-500/20">
          {/* Col 1: Brand Logo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StockBlocLogo size="sm" showText={false} />
              <span className="font-extrabold text-white text-base tracking-wider font-mono">
                STOCK BLOC<span className="text-cyan-400">.</span>
              </span>
            </div>
            <p className="text-neutral-400 font-sans text-xs leading-relaxed">
              Institutional quant terminal for individual investors. Democratizing wealth intelligence across stocks, 13F flows, credit, real estate, and clean energy.
            </p>
            <button
              onClick={() => onSelectTab("brand")}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>About Us & Platform Mission &rarr;</span>
            </button>
          </div>

          {/* Col 2: Core Hubs */}
          <div className="space-y-2">
            <span className="text-cyan-400 font-bold uppercase text-[11px] tracking-wider block">
              POWER MODULES
            </span>
            <ul className="space-y-1.5 text-neutral-400 font-sans text-xs">
              <li>
                <button
                  onClick={() => onSelectTab("watchlist")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Quant Watchlist & RSI
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("intelligence")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  13F Hedge Fund Flow
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("credit")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Credit 800+ Mastery
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("real_estate")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Real Estate & REITs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("my_bloc")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-cyan-400 font-bold"
                >
                  My Bloc Terminal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("agent_exchange")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-cyan-400 font-semibold flex items-center gap-1"
                >
                  Agent Exchange & Bounties
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("developers")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Developer Portal & API
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("developer_earnings")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Operator Earnings & Ledger
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Specialized Intel */}
          <div className="space-y-2">
            <span className="text-cyan-400 font-bold uppercase text-[11px] tracking-wider block">
              QUANT INTELLIGENCE
            </span>
            <ul className="space-y-1.5 text-neutral-400 font-sans text-xs">
              <li>
                <button
                  onClick={() => onSelectTab("dyson_swarm")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Dyson Swarm Energy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("war_gov_ufo")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  War.Gov Aerospace & UAP
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("investopedia")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Free Game & Glossary
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab("ai_revolution")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Gemini AI Copilot
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Data Status & Community */}
          <div className="space-y-3">
            <span className="text-cyan-400 font-bold uppercase text-[11px] tracking-wider block">
              SYSTEM MONITOR
            </span>
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenDataStatus();
              }}
              className="w-full py-2 px-3 rounded-xl bg-black border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>DATA FEEDS ONLINE</span>
              </div>
              <Radio className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mt-4">
              <a
                href="https://x.com/thestockbloc?s=21"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { triggerHaptic("selection"); trackEvent("social_clicked"); }}
                className="flex-1 py-2 rounded-xl bg-neutral-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition-all cursor-pointer"
                title="Follow on X (Twitter)"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
              </a>
              <a
                href="https://youtube.com/@stockbloc"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { triggerHaptic("selection"); trackEvent("social_clicked"); }}
                className="flex-1 py-2 rounded-xl bg-neutral-900 border border-red-500/30 hover:border-red-400 text-red-400 flex items-center justify-center transition-all cursor-pointer"
                title="Subscribe on YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://linktr.ee/stockbloc"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { triggerHaptic("selection"); trackEvent("social_clicked"); }}
                className="flex-1 py-2 rounded-xl bg-neutral-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                title="Community Linktree"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright & Founder Attribution */}
        <div className="pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} STOCK BLOC.</span>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <span className="text-amber-400/90 font-mono font-bold">
              Stock Bloc — Founded & Curated by Jumanne Carter (Jay West Philly). Wall Street Smarts, Blockchain Hearts.
            </span>
          </div>
          <span className="text-cyan-500/80 font-mono shrink-0">
            SEC EDGAR • QUANT-SIGNAL v2.8 // GROUNDED
          </span>
        </div>
      </div>
    </footer>
  );
};
