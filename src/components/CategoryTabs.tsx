import React from "react";
import { SectorCategory } from "../types";
import {
  Flame,
  Building2,
  CreditCard,
  Cpu,
  MemoryStick,
  Zap,
  LineChart,
  Sparkles,
  Star,
  Bookmark,
  Bot,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface CategoryTabsProps {
  selectedCategory: SectorCategory | "all";
  onSelectCategory: (cat: SectorCategory | "all") => void;
  itemCount: number;
  titleOverride?: string;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
  itemCount,
  titleOverride,
}) => {
  const categories: {
    id: SectorCategory | "all";
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "all", label: "All Watchlist", icon: Sparkles },
    { id: "my_bloc", label: "My Bloc", icon: Bookmark },
    { id: "robotics", label: "Robotics & Self-Driving", icon: Bot },
    { id: "tsunami", label: "Super Sonic Tsunami", icon: Flame },
    { id: "asymmetry", label: "Max Asymmetry", icon: Star },
    { id: "reits", label: "Real Estate REITs", icon: Building2 },
    { id: "credit_fin", label: "Credit & FinTech", icon: CreditCard },
    { id: "ai_infra", label: "AI Infrastructure & Cloud", icon: Cpu },
    { id: "memory", label: "Memory & Chips", icon: MemoryStick },
    { id: "energy", label: "Energy & Grid", icon: Zap },
    { id: "indexes", label: "Indexes & Tech", icon: LineChart },
  ];

  const getCategoryTitle = () => {
    if (titleOverride) return titleOverride;
    switch (selectedCategory) {
      case "all":
        return "All Watchlist Stocks";
      case "my_bloc":
        return "My Saved Watchlist";
      case "robotics":
        return "Robotics, Physical AI & Self-Driving Leaders";
      case "asymmetry":
        return "Maximum Asymmetry Upside Matrix";
      case "tsunami":
        return "Super Sonic Tsunami";
      case "reits":
        return "Real Estate REITs";
      case "credit_fin":
        return "Credit & FinTech";
      case "ai_infra":
        return "AI Infrastructure & Cloud Compute";
      case "memory":
        return "Memory Chips & Hardware";
      case "energy":
        return "Energy, Grid & Power";
      case "indexes":
        return "Indexes & Cryptos";
      default:
        return "All Market Blocs";
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 pt-1.5 pb-1 space-y-2 font-mono">
      {/* Category Scroll Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic("selection");
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "obsidian-pill-btn obsidian-pill-btn-active font-black"
                  : "obsidian-pill-btn text-cyan-200/85 hover:text-white"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-slate-950" : "text-cyan-400"
                }`}
              />
              <span className="uppercase text-[11px] font-tech tracking-wider">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact List Title Context Bar */}
      <div className="flex items-center justify-between pt-0.5 pb-1 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-base sm:text-lg font-black font-mono tracking-wider text-cyan-50 uppercase leading-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            {getCategoryTitle()}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-bold tabular-telemetry">
            {itemCount} ASSETS
          </span>
        </div>
      </div>
    </div>
  );
};

