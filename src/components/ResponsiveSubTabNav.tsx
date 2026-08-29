import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Layers,
  Check,
  Search,
  X,
  Sparkles,
  Grid,
  Zap,
  Radio,
  ArrowRight,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface SubTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
  colorScheme?: "cyan" | "emerald" | "amber" | "indigo" | "purple" | "red" | "blue" | "white";
  isHighlight?: boolean;
}

interface ResponsiveSubTabNavProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  title?: string;
  className?: string;
}

export function ResponsiveSubTabNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  title = "SUB-SYSTEM DIRECTORY",
  className = "",
}: ResponsiveSubTabNavProps<T>) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);
  const currentTab = tabs[activeIndex] || tabs[0];

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [tabs]);

  // Scroll active tab into view in the pill bar
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(
        `[data-tab-id="${activeTab}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
      checkScroll();
    }
  }, [activeTab]);

  const handleSelect = (id: T) => {
    triggerHaptic("selection");
    onChange(id);
    setIsModalOpen(false);
    setSearchQuery("");
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      handleSelect(tabs[activeIndex - 1].id);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < tabs.length - 1) {
      handleSelect(tabs[activeIndex + 1].id);
    }
  };

  const filteredTabs = tabs.filter(
    (tab) =>
      tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tab.description && tab.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tab.badge && tab.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`w-full space-y-2 font-mono select-none ${className}`}>
      {/* 
        WATCHLIST-IDENTICAL FUTURISTIC MASTER HEADER CARD
        Features: alien-block-cut chamfered corners, vivid cyan laser glow, 
        emerald stream edge beam, Orbitron glyphs, and high-tech telemetry badges
      */}
      <div className="relative w-full overflow-hidden my-0.5 group/nav-card">
        {/* Left Data Stream Edge Accent Beam */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400 via-emerald-400 to-cyan-600/0 opacity-90 z-20 pointer-events-none" />

        <div
          onClick={() => {
            triggerHaptic("selection");
            setIsModalOpen(true);
          }}
          className="relative z-10 w-full px-3.5 py-2.5 sm:px-4 sm:py-3 alien-block-cut cursor-pointer transition-all duration-300 group hover:scale-[1.008] active:scale-[0.99]"
          style={{
            background:
              "radial-gradient(ellipse at 35% 50%, rgba(0, 242, 255, 0.16) 0%, rgba(0, 255, 136, 0.06) 45%, rgba(4, 15, 24, 0.96) 85%)",
            border: "1.5px solid rgba(0, 242, 255, 0.65)",
            boxShadow:
              "0 0 22px rgba(0, 242, 255, 0.35), inset 0 0 16px rgba(0, 255, 136, 0.12)",
          }}
        >
          {/* Subtle Cyber Grid & HUD Lines */}
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />
          <div className="scan-beam-line opacity-25" />

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 relative z-10">
            {/* ACTIVE MODULE TELEMETRY & GLYPH TITLE */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/70 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,242,255,0.4)] group-hover:border-cyan-300 group-hover:scale-105 transition-all">
                {currentTab?.icon || <Layers className="w-4 h-4 text-cyan-300" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Watchlist-style telemetry score badge */}
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 shadow-[0_0_8px_rgba(0,242,255,0.3)] flex items-center gap-1 font-orbitron">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SB {String(activeIndex + 1).padStart(2, "0")} / {String(tabs.length).padStart(2, "0")}
                  </span>

                  {currentTab?.badge ? (
                    <span className="text-[9px] px-2 py-0.5 rounded font-black tracking-wide bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                      ★ {currentTab.badge}
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded font-black tracking-wide bg-emerald-400/20 text-emerald-300 border border-emerald-400/50">
                      ⚡ LIVE
                    </span>
                  )}
                </div>

                <div className="text-xs sm:text-sm font-black text-white truncate group-hover:text-cyan-200 transition-colors flex items-center gap-1.5 mt-0.5">
                  <span className="font-alien tracking-wide drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">
                    {currentTab?.label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
                </div>
              </div>
            </div>

            {/* WATCHLIST-STYLE STEPPER & DIRECTORY BUTTONS */}
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handlePrev}
                disabled={activeIndex <= 0}
                aria-label="Previous Module"
                title="Previous Module"
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                  activeIndex <= 0
                    ? "opacity-20 border-white/5 text-neutral-600 cursor-not-allowed"
                    : "bg-neutral-900/90 border-cyan-400/40 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-500/20 active:scale-90 cursor-pointer shadow-[0_0_8px_rgba(0,242,255,0.25)]"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                disabled={activeIndex >= tabs.length - 1}
                aria-label="Next Module"
                title="Next Module"
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                  activeIndex >= tabs.length - 1
                    ? "opacity-20 border-white/5 text-neutral-600 cursor-not-allowed"
                    : "bg-neutral-900/90 border-cyan-400/40 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-500/20 active:scale-90 cursor-pointer shadow-[0_0_8px_rgba(0,242,255,0.25)]"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-400/70 text-cyan-200 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,242,255,0.3)] active:scale-95 transition-all cursor-pointer font-orbitron"
              >
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                <span>GRID</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        WATCHLIST-STYLE HORIZONTAL SUBTAB PILL TRACK
        Features: alien-block-cut-sm cards, vivid neon outlines, glowing active states
      */}
      <div className="relative group">
        {/* Left Scroll Gradient Cue */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#030914] via-[#030914]/90 to-transparent z-20 pointer-events-none flex items-center pl-1">
            <ChevronLeft className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        )}

        {/* Right Scroll Gradient Cue */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#030914] via-[#030914]/90 to-transparent z-20 pointer-events-none flex items-center justify-end pr-1">
            <ChevronRight className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
        >
          {tabs.map((tab) => {
            const isSelected = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => handleSelect(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 alien-block-cut-sm relative ${
                  isSelected
                    ? "bg-cyan-500/20 text-white border-2 border-cyan-400 shadow-[0_0_16px_rgba(0,242,255,0.5)] font-orbitron"
                    : "bg-[#040f18]/85 text-neutral-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-[#061826]"
                }`}
                style={{
                  background: isSelected
                    ? "radial-gradient(ellipse at center, rgba(0, 242, 255, 0.25) 0%, rgba(4, 15, 24, 0.95) 80%)"
                    : "rgba(4, 15, 24, 0.85)",
                  boxShadow: isSelected
                    ? "0 0 16px rgba(0, 242, 255, 0.4), inset 0 0 10px rgba(0, 255, 136, 0.15)"
                    : "0 0 8px rgba(0, 242, 255, 0.05)",
                }}
              >
                {tab.icon}
                <span className="whitespace-nowrap font-medium tracking-wide">
                  {tab.label}
                </span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-tight shrink-0 ${
                      isSelected
                        ? "bg-amber-400/30 text-amber-300 border border-amber-400/60"
                        : "bg-amber-400/15 text-amber-300/80 border border-amber-400/30"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 
        WATCHLIST-MATCHING CYBERDECK DIRECTORY MODAL
        Identical to CommandPalette in styling: Obsidian glass, glowing cyan border,
        item cards with neon icons, badges, and bottom command navigation footer.
      */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl bg-[#040f18] border border-cyan-500/60 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden font-mono text-neutral-100 alien-card"
            style={{
              border: "1.5px solid rgba(0, 242, 255, 0.7)",
              boxShadow:
                "0 0 30px rgba(0, 242, 255, 0.35), inset 0 0 20px rgba(0, 255, 136, 0.08)",
            }}
          >
            {/* Top Search Input matching CommandPalette exactly */}
            <div className="relative flex items-center px-4 py-3.5 border-b border-cyan-500/30 bg-black/60">
              <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search modules (Formation, Credit, Real Estate, Robotics...)"
                className="w-full bg-transparent text-sm sm:text-base text-cyan-100 placeholder-cyan-500/60 focus:outline-none font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-cyan-900/30 rounded text-cyan-400 mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setIsModalOpen(false);
                }}
                className="p-1 hover:bg-red-950/40 rounded text-neutral-400 hover:text-red-400"
              >
                <span className="text-xs font-bold border border-neutral-700 px-1.5 py-0.5 rounded text-neutral-300">
                  ESC
                </span>
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-cyan-950/40 custom-scrollbar">
              {filteredTabs.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Search className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
                  <p className="text-sm text-neutral-400">No matching subsystem found for "{searchQuery}"</p>
                  <p className="text-xs text-cyan-500/60">
                    Try searching for keywords like Tools, Simulator, Analysis, or Hub.
                  </p>
                </div>
              ) : (
                filteredTabs.map((tab, index) => {
                  const isSelected = tab.id === activeTab;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => handleSelect(tab.id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-cyan-950/70 border border-cyan-400/80 shadow-lg shadow-cyan-950/50"
                          : "hover:bg-cyan-950/30 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="p-2 rounded-lg bg-black/60 border border-cyan-500/40 shrink-0 text-cyan-300">
                          {tab.icon || <Layers className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="font-orbitron">{tab.label}</span>
                            {tab.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider bg-amber-500/20 text-amber-300 border-amber-500/40">
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          {tab.description && (
                            <p className="text-xs text-neutral-400 truncate">{tab.description}</p>
                          )}
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? "text-cyan-400 translate-x-1" : "text-neutral-600"
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Hotkey Help Footer matching CommandPalette */}
            <div className="px-4 py-2.5 bg-black/80 border-t border-cyan-500/30 flex items-center justify-between text-[10px] text-cyan-400/80 font-mono">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="bg-cyan-950 border border-cyan-800 px-1 py-0.5 rounded text-cyan-300">
                    ↑↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span>
                  <kbd className="bg-cyan-950 border border-cyan-800 px-1 py-0.5 rounded text-cyan-300">
                    ↵
                  </kbd>{" "}
                  Select
                </span>
                <span>
                  <kbd className="bg-cyan-950 border border-cyan-800 px-1 py-0.5 rounded text-cyan-300">
                    ESC
                  </kbd>{" "}
                  Close
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>STOCK BLOC TERMINAL</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
