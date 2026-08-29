import React, { useState } from "react";
import { Starlink3DGlobe } from "../../components/Starlink3DGlobe";
import { GlobalInfrastructureMap } from "../../components/GlobalInfrastructureMap";
import { TopNavbar } from "../../components/TopNavbar";
import { Orbit, Server, Compass, Share2 } from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { StockTicker } from "../../types";

interface SatelliteMapHubProps {
  onNavigateTab?: (tab: string) => void;
  onSelectStock?: (stock: StockTicker) => void;
}

export const SatelliteMapHub: React.FC<SatelliteMapHubProps> = ({ onNavigateTab, onSelectStock }) => {
  const [activeMapMode, setActiveMapMode] = useState<"infrastructure" | "orbital">("infrastructure");

  return (
    <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden font-mono">
      {onNavigateTab && (
        <TopNavbar activeTab="satellite_map" onSelectTab={onNavigateTab as any} />
      )}
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-950 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider animate-pulse">
                  ● QUANT GEOLOCATION MATRIX
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-orbitron">
                Physical Constraints & Satellite Radar
              </h1>
              <p className="mt-2 text-sm text-neutral-400 max-w-3xl">
                Explore real-time data center megawatts, nuclear SMR baseload contracts, semiconductor fabs, and orbital Starlink satellite coverage.
              </p>
            </div>

            {/* MAP MODE SWITCHER */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-cyan-500/40 shrink-0">
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveMapMode("infrastructure");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeMapMode === "infrastructure"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,242,255,0.4)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Capital & Grid Radar</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveMapMode("orbital");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeMapMode === "orbital"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,242,255,0.4)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>3D Starlink Globe</span>
              </button>
            </div>
          </header>
          
          <section className="w-full">
            {activeMapMode === "infrastructure" ? (
              <GlobalInfrastructureMap onSelectStock={onSelectStock} />
            ) : (
              <div className="w-full min-h-[620px] rounded-2xl overflow-hidden border border-cyan-500/40">
                <Starlink3DGlobe />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
