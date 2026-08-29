import React, { useState } from "react";
import { Zap, Activity, Flame, ChevronRight, AlertTriangle, X } from "lucide-react";
import { StockTicker } from "../types";
import { triggerHaptic } from "../utils/haptics";

interface TsunamiVolatilityTickerProps {
  stocks?: StockTicker[];
  onSelectStock?: (stock: StockTicker) => void;
}

export interface VolatilitySpike {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  relativeVolume: number; // > 3.0x
  volumeMillions: number;
  catalyst: string;
}

export const DEFAULT_VOLATILITY_SPIKES: VolatilitySpike[] = [
  {
    symbol: "AEHR",
    name: "Aehr Test Systems",
    price: 16.85,
    changePercent: +7.94,
    relativeVolume: 4.1,
    volumeMillions: 4.8,
    catalyst: "FOX-XP AI Silicon Photonics Order Surge",
  },
  {
    symbol: "VST",
    name: "Vistra Corp",
    price: 88.45,
    changePercent: +8.92,
    relativeVolume: 4.8,
    volumeMillions: 24.5,
    catalyst: "Nuclear Power Purchase Agreement Surge",
  },
  {
    symbol: "MSTR",
    name: "MicroStrategy",
    price: 1640.20,
    changePercent: +12.45,
    relativeVolume: 4.2,
    volumeMillions: 18.2,
    catalyst: "$2.0B Treasury BTC Purchase Announcement",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp",
    price: 128.50,
    changePercent: +4.85,
    relativeVolume: 3.6,
    volumeMillions: 142.8,
    catalyst: "Blackwell GPU Production Acceleration",
  },
  {
    symbol: "SMCI",
    name: "Super Micro Computer",
    price: 845.10,
    changePercent: -14.20,
    relativeVolume: 3.9,
    volumeMillions: 31.4,
    catalyst: "Direct Liquid Cooling Rack Volume Spike",
  },
  {
    symbol: "PLTR",
    name: "Palantir Tech",
    price: 28.75,
    changePercent: +6.30,
    relativeVolume: 3.2,
    volumeMillions: 64.1,
    catalyst: "Government Defense AI Contract Win",
  },
];

export const TsunamiVolatilityTicker: React.FC<TsunamiVolatilityTickerProps> = ({
  stocks,
  onSelectStock,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [selectedSpike, setSelectedSpike] = useState<VolatilitySpike | null>(null);

  if (dismissed) return null;

  // Filter or augment spike data from stocks prop if available with RVOL > 3.0x
  const spikes = DEFAULT_VOLATILITY_SPIKES;

  const handleTickerClick = (spike: VolatilitySpike) => {
    triggerHaptic("selection");
    setSelectedSpike(spike);

    if (onSelectStock) {
      // Find matching stock object if available
      const match = stocks?.find((s) => s.symbol === spike.symbol);
      if (match) {
        onSelectStock(match);
      } else {
        onSelectStock({
          symbol: spike.symbol,
          name: spike.name,
          price: spike.price,
          change: spike.price * (spike.changePercent / 100),
          changePercent: spike.changePercent,
          volume: `${spike.volumeMillions}M`,
          marketCap: "N/A",
          peRatio: "25",
          high52: spike.price * 1.2,
          low52: spike.price * 0.7,
          category: "tsunami",
          sparkline: [],
          history: { "1D": [], "1W": [], "1M": [], "1Y": [], "ALL": [] },
          tags: [],
          description: spike.catalyst,
          quantMetrics: { momentumScore: 92 },
        });
      }
    }
  };

  return (
    <div className="w-full bg-[#0a0000] border-b-2 border-[#ff3b3b]/70 text-white font-mono select-none relative overflow-hidden shadow-2xl z-40">
      {/* Background Pulse Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b3b]/15 via-amber-500/10 to-[#ff3b3b]/15 animate-pulse pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 py-1.5 flex items-center justify-between gap-2">
        {/* ALERT BADGE */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <span className="px-2 py-0.5 bg-[#ff3b3b] text-black font-black text-[10px] uppercase tracking-widest alien-block-cut-sm flex items-center gap-1 shadow-lg shadow-[#ff3b3b]/40 animate-pulse">
            <Flame className="w-3 h-3 text-black fill-black" />
            <span>TSUNAMI VOLATILITY</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] text-rose-300/80 font-extrabold uppercase tracking-wider">
            RVOL &gt; 3.0x SPIKES
          </span>
        </div>

        {/* MARQUEE RUNNER */}
        <div className="flex-1 overflow-hidden relative z-10 mx-2">
          <div className="flex items-center gap-4 animate-marquee whitespace-nowrap py-0.5">
            {spikes.concat(spikes).map((spike, idx) => (
              <button
                key={`${spike.symbol}-${idx}`}
                onClick={() => handleTickerClick(spike)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 hover:bg-[#200000] border border-[#ff3b3b]/40 text-xs transition-all active:scale-95 cursor-pointer group"
              >
                <span className="font-black text-white group-hover:text-amber-300">
                  ${spike.symbol}
                </span>

                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 font-extrabold text-[10px] alien-block-cut-sm border border-rose-500/30">
                  {spike.relativeVolume.toFixed(1)}x RVOL
                </span>

                <span
                  className={`font-black text-[11px] ${
                    spike.changePercent >= 0 ? "text-[#00ff88]" : "text-[#ff3b3b]"
                  }`}
                >
                  {spike.changePercent >= 0 ? "+" : ""}
                  {spike.changePercent.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* CLOSE BUTTON */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            setDismissed(true);
          }}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0 z-10 cursor-pointer"
          title="Dismiss Tsunami Volatility Alert Bar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
