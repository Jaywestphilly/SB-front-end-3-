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
    { id: "tsunami", label: "Super sonic Tsunami", icon: Flame },
    { id: "asymmetry", label: "Max Asymmetry", icon: Star },
    { id: "reits", label: "Real Estate REITs", icon: Building2 },
    { id: "credit_fin", label: "Credit & FinTech", icon: CreditCard },
    { id: "ai_infra", label: " Infrastructure", icon: Cpu },
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
        return "Super sonic Tsunami";
      case "reits":
        return "Real Estate REITs";
      case "credit_fin":
        return "Credit & FinTech";
      case "ai_infra":
        return " Infra & Cloud";
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
    <div className="w-full px-4 pt-3 pb-2 space-y-3 font-mono">
      {/* Category Scroll Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 alien-block-cut-sm font-black transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30 border border-cyan-200"
                  : "bg-neutral-900 hover:bg-neutral-800 text-cyan-400/80 hover:text-white border border-cyan-500/30"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-cyan-400"}`}
              />
              <span className="uppercase text-[11px] font-tech tracking-wider">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Title */}
      <div className="flex items-end justify-between pt-1 pb-1 border-b border-cyan-500/20 pb-2">
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-cyan-100 uppercase leading-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 inline-block animate-ping" />
            {getCategoryTitle()}
          </h2>
          <p className="text-[10px] text-cyan-400/70 font-mono">
            // {itemCount} ASSETS MONITORED IN QUANT MATRIX
          </p>
        </div>
      </div>
    </div>
  );
};
