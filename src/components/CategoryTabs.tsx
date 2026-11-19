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
    <div className="w-full px-2 sm:px-4 pt-2 pb-1 space-y-2.5 font-mono">
      {/* Angular Chamfered Alien Sector Blades with Edge Fade Mask */}
      <div className="relative scroll-fade-mask-x">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 px-3 text-xs">
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "xeno-cmd-btn xeno-cmd-btn-active font-black"
                    : "xeno-cmd-btn text-slate-200 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-slate-950" : "text-[#00f5d4]"
                  }`}
                />
                <span className="uppercase text-[11px] font-alien-hud tracking-wider">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Sector Context Header (Unboxed Tabular Asset Count) */}
      <div className="flex items-center justify-between pt-0.5 pb-2 border-b border-[#00f5d4]/25">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-black font-display tracking-[0.1em] text-[#f2faff] uppercase leading-tight xeno-neon-text">
            {getCategoryTitle()}
          </h2>
          <span className="text-xs text-[#00f5d4] font-mono font-bold tabular-nums-strict">
            · {itemCount} ASSETS
          </span>
        </div>
      </div>
    </div>
  );
};
