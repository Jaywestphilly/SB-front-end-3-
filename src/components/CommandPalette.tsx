import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  TrendingUp,
  Building2,
  ShieldCheck,
  Orbit,
  ShieldAlert,
  Layers,
  Sparkles,
  Command,
  ArrowRight,
  FileText,
  Calculator,
  UserCheck,
  Bookmark,
  Radio,
  ExternalLink,
  Bot,
  Globe,
  Terminal,
  Code2,
} from "lucide-react";
import { ViewTab, StockTicker } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ViewTab) => void;
  onSelectStock?: (stock: StockTicker) => void;
  stocks?: StockTicker[];
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Ticker" | "Hub" | "13F Fund" | "REIT" | "Tool" | "Defense" | "UAP Doc";
  icon: React.ReactNode;
  action: () => void;
  badgeColor: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectStock,
  stocks = [],
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Pre-defined Quick Navigation Items
  const navHubItems: CommandItem[] = useMemo(
    () => [
      {
        id: "hub-my-bloc",
        title: "My Bloc Dashboard",
        subtitle: "Personal portfolio, saved watchlists, and alert center",
        category: "Hub",
        icon: <UserCheck className="w-4 h-4 text-cyan-400" />,
        action: () => onSelectTab("my_bloc"),
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      },
      {
        id: "hub-watchlist",
        title: "Quant Watchlist & RSI Tsunami",
        subtitle: "Real-time market momentum and RSI extremes",
        category: "Hub",
        icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        action: () => onSelectTab("watchlist"),
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      },
      {
        id: "hub-13f",
        title: "13F Hedge Fund Intel",
        subtitle: "SEC EDGAR quarterly filings from Berkshire, Citadel & Pershing",
        category: "13F Fund",
        icon: <Layers className="w-4 h-4 text-purple-400" />,
        action: () => onSelectTab("intelligence"),
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      },
      {
        id: "hub-credit",
        title: "Credit 800+ Mastery",
        subtitle: "Utilization simulator, dispute guide & business credit",
        category: "Tool",
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        action: () => onSelectTab("credit"),
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      },
      {
        id: "hub-re estate",
        title: "Real Estate & REITs",
        subtitle: "DSCR calculator, Cap Rates, Cash-on-Cash & REIT comparison",
        category: "REIT",
        icon: <Building2 className="w-4 h-4 text-amber-400" />,
        action: () => onSelectTab("real_estate"),
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      },
      {
        id: "hub-dyson",
        title: "Dyson Swarm Energy Grid",
        subtitle: "Space solar, nuclear energy & investable grid stocks",
        category: "Hub",
        icon: <Orbit className="w-4 h-4 text-teal-400" />,
        action: () => onSelectTab("dyson_swarm"),
        badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      },
      {
        id: "hub-war-gov",
        title: "War.Gov Aerospace & UAP Records",
        subtitle: "Defense equities (LMT, RTX, PLTR) & declassified documents",
        category: "Defense",
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        action: () => onSelectTab("war_gov_ufo"),
        badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      },
      {
        id: "hub-youtube",
        title: "Quant Video Briefings",
        subtitle: "Curated macroeconomic & trading breakdown video feeds",
        category: "Hub",
        icon: <Radio className="w-4 h-4 text-red-400" />,
        action: () => onSelectTab("youtube"),
        badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
      },
      {
        id: "hub-free-game",
        title: "Free Game & Strategy Glossary",
        subtitle: "Investopedia concepts, strategy blueprints & market terms",
        category: "Hub",
        icon: <FileText className="w-4 h-4 text-cyan-400" />,
        action: () => onSelectTab("investopedia"),
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      },
      {
        id: "hub-ai-rev",
        title: "AI Revolution Hub",
        subtitle: "Gemini AI Copilot, image scanner, and live grounding search",
        category: "Tool",
        icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
        action: () => onSelectTab("ai_revolution"),
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      },
      {
        id: "hub-agent-directory",
        title: "AI Agent Directory",
        subtitle: "Discover autonomous agents, forecast passports & accuracy leaderboards",
        category: "Hub",
        icon: <Globe className="w-4 h-4 text-cyan-400" />,
        action: () => onSelectTab("agents"),
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      },
      {
        id: "hub-agent-feed",
        title: "Agent Intelligence Stream",
        subtitle: "Live real-time feed of agent-published research & price forecasts",
        category: "Hub",
        icon: <Bot className="w-4 h-4 text-purple-400" />,
        action: () => onSelectTab("agent_feed"),
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      },
      {
        id: "hub-dev-portal",
        title: "Developer Portal",
        subtitle: "Register autonomous agents, manage API keys & telemetry",
        category: "Tool",
        icon: <Terminal className="w-4 h-4 text-emerald-400" />,
        action: () => onSelectTab("developers"),
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      },
      {
        id: "hub-dev-docs",
        title: "Agent Network API & SDK Docs",
        subtitle: "REST API references, Python SDK examples & manifest.json",
        category: "Tool",
        icon: <Code2 className="w-4 h-4 text-amber-400" />,
        action: () => onSelectTab("developer_docs"),
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      },
    ],
    [onSelectTab]
  );

  // Stock Items
  const stockItems: CommandItem[] = useMemo(() => {
    return stocks.map((stk) => {
      let catLabel: CommandItem["category"] = "Ticker";
      let color = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      if (stk.category === "reits") {
        catLabel = "REIT";
        color = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      } else if (stk.tags.includes("Defense") || stk.tags.includes("GovContract")) {
        catLabel = "Defense";
        color = "bg-rose-500/20 text-rose-300 border-rose-500/40";
      }

      return {
        id: `stock-${stk.symbol}`,
        title: `${stk.symbol} - ${stk.name}`,
        subtitle: `$${stk.price.toFixed(2)} | RSI: ${stk.rsi ?? 50} | 24h: ${stk.changePercent >= 0 ? "+" : ""}${stk.changePercent.toFixed(2)}%`,
        category: catLabel,
        icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onSelectTab("watchlist");
          if (onSelectStock) onSelectStock(stk);
        },
        badgeColor: color,
      };
    });
  }, [onSelectTab, onSelectStock]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const all = [...navHubItems, ...stockItems];
    if (!query.trim()) return all.slice(0, 10);

    const q = query.toLowerCase().trim();
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [navHubItems, stockItems, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        triggerHaptic("selection");
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[#040f18] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden font-mono text-neutral-100"
        >
          {/* Top Search Input */}
          <div className="relative flex items-center px-4 py-3.5 border-b border-cyan-500/30 bg-black/50">
            <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search tickers (NVDA, TSLA), hubs, 13F funds, REITs, defense stocks..."
              className="w-full bg-transparent text-sm sm:text-base text-cyan-100 placeholder-cyan-500/60 focus:outline-none font-mono"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 hover:bg-cyan-900/30 rounded text-cyan-400 mr-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-950/40 rounded text-neutral-400 hover:text-red-400"
            >
              <span className="text-xs font-bold border border-neutral-700 px-1.5 py-0.5 rounded">
                ESC
              </span>
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-cyan-950/40 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Search className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
                <p className="text-sm text-neutral-400">No matching intel found for "{query}"</p>
                <p className="text-xs text-cyan-500/60">
                  Try searching for symbols like NVDA, REITs, 13F, or Credit.
                </p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-950/70 border border-cyan-400/60 shadow-lg shadow-cyan-950/50"
                        : "hover:bg-cyan-950/30 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-2 rounded-lg bg-black/60 border border-cyan-500/30 shrink-0">
                        {item.icon}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{item.title}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.badgeColor}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>
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

          {/* Bottom Hotkey Help Footer */}
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
            <div className="hidden sm:flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DATA MATRIX ONLINE</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
