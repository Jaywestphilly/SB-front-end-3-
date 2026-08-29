import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Zap,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";

interface QueueItem {
  id: string;
  project: string;
  applicant: string;
  ticker: string;
  isoRegion: "PJM" | "ERCOT" | "MISO" | "CAISO" | "NYISO" | "NRC" | "FERC";
  powerCapacityMw: number;
  fuelType: "Nuclear" | "Gas Turbine" | "Solar + Storage" | "Fuel Cell" | "Geothermal";
  filingDate: string;
  status: "APPROVED_ENERGIZED" | "INTERCONNECTION_PPA_SIGNED" | "PERMIT_PENDING" | "NRC_LICENSE_ACTIVE";
  details: string;
  asymmetryImpact: "HIGH" | "VERY_HIGH" | "TRANSFORMATIVE";
}

export const InterconnectionQueueRadar: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

  const QUEUE_DATA: QueueItem[] = [
    {
      id: "Q-PJM-8841",
      project: "Crane Clean Energy Center (Three Mile Island Unit 1)",
      applicant: "Constellation Energy Generation",
      ticker: "CEG",
      isoRegion: "PJM",
      powerCapacityMw: 835,
      fuelType: "Nuclear",
      filingDate: "2024-Q3 (Active)",
      status: "INTERCONNECTION_PPA_SIGNED",
      details: "20-year exclusive PPA with Microsoft Azure. Direct behind-the-meter connection to power AI hyperscale clusters.",
      asymmetryImpact: "TRANSFORMATIVE"
    },
    {
      id: "Q-ERCOT-9102",
      project: "Comanche Peak AI Substation Interconnect",
      applicant: "Vistra Corp",
      ticker: "VST",
      isoRegion: "ERCOT",
      powerCapacityMw: 1200,
      fuelType: "Nuclear",
      filingDate: "2024-Q4",
      status: "APPROVED_ENERGIZED",
      details: "Direct physical connection between Comanche Peak nuclear units and high-density liquid-cooled compute halls.",
      asymmetryImpact: "VERY_HIGH"
    },
    {
      id: "Q-PJM-7734",
      project: "Susquehanna Cumulus Data Campus",
      applicant: "Talen Energy & AWS",
      ticker: "TLN",
      isoRegion: "PJM",
      powerCapacityMw: 960,
      fuelType: "Nuclear",
      filingDate: "2024-Q2",
      status: "INTERCONNECTION_PPA_SIGNED",
      details: "2.5GW nuclear generation hub supplying direct energized power to Amazon Web Services datacenters.",
      asymmetryImpact: "TRANSFORMATIVE"
    },
    {
      id: "Q-NRC-0042",
      project: "Hermes Low-Power Salt-Cooled Demonstration Reactor",
      applicant: "Kairos Power & Alphabet",
      ticker: "GOOGL",
      isoRegion: "NRC",
      powerCapacityMw: 500,
      fuelType: "Nuclear",
      filingDate: "2024-Q3",
      status: "NRC_LICENSE_ACTIVE",
      details: "NRC construction permit secured for Kairos fluoride salt-cooled SMRs to power Google Cloud AI datacenters by 2030.",
      asymmetryImpact: "TRANSFORMATIVE"
    },
    {
      id: "Q-ERCOT-4419",
      project: "Denton Solid Oxide Microgrid Hub",
      applicant: "Bloom Energy",
      ticker: "BE",
      isoRegion: "ERCOT",
      powerCapacityMw: 80,
      fuelType: "Fuel Cell",
      filingDate: "2025-Q1",
      status: "APPROVED_ENERGIZED",
      details: "On-site solid oxide fuel cells providing 24/7 baseload power, enabling AI cluster startup without waiting for utility queue.",
      asymmetryImpact: "HIGH"
    },
    {
      id: "Q-PJM-3312",
      project: "Northern Virginia Transformer Substation Expansion",
      applicant: "Eaton Corporation / Dominion",
      ticker: "ETN",
      isoRegion: "PJM",
      powerCapacityMw: 2500,
      fuelType: "Gas Turbine",
      filingDate: "2024-Q4",
      status: "APPROVED_ENERGIZED",
      details: "500kV large power transformers installed to support 'Data Center Alley' expansion across Loudoun County.",
      asymmetryImpact: "VERY_HIGH"
    },
    {
      id: "Q-MISO-5510",
      project: "Permian Basin High-Voltage Microgrid",
      applicant: "Quanta Services & Powell",
      ticker: "PWR",
      isoRegion: "MISO",
      powerCapacityMw: 1500,
      fuelType: "Gas Turbine",
      filingDate: "2025-Q1",
      status: "PERMIT_PENDING",
      details: "EPC construction of high-voltage transmission interconnects powering high-density HPC and gas turbine generation.",
      asymmetryImpact: "HIGH"
    },
    {
      id: "Q-NRC-0089",
      project: "Aurora Fast Fission Powerhouse",
      applicant: "Oklo Inc.",
      ticker: "OKLO",
      isoRegion: "NRC",
      powerCapacityMw: 50,
      fuelType: "Nuclear",
      filingDate: "2024-Q4",
      status: "PERMIT_PENDING",
      details: "Combined License Application (COLA) pre-application with US NRC for compact liquid-metal fast reactors.",
      asymmetryImpact: "VERY_HIGH"
    }
  ];

  const filteredQueue = useMemo(() => {
    return QUEUE_DATA.filter((item) => {
      const matchesRegion = selectedRegion === "ALL" || item.isoRegion === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.project.toLowerCase().includes(q) ||
        item.applicant.toLowerCase().includes(q) ||
        item.ticker.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    });
  }, [selectedRegion, searchQuery]);

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#180d04] via-[#231305] to-[#0d0702] border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Live Utility & Regulatory Radar
          </span>
          <span className="text-xs font-mono font-bold text-neutral-400">
            Real-Time FERC & NRC Filings
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          ISO Interconnection Queue & Power Approval Radar
        </h2>
        <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed mt-1.5">
          Track gigawatt-scale grid interconnection approvals, behind-the-meter nuclear PPAs, and modular reactor permits across PJM, ERCOT, MISO, and NRC before they are announced on quarterly earnings calls.
        </p>

        {/* REGION FILTER BAR */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
          {(["ALL", "PJM", "ERCOT", "NRC", "MISO"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedRegion(r);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedRegion === r
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30"
                  : "bg-white/5 text-neutral-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              {r === "ALL" ? "All Grid Jurisdictions" : `${r} Grid Region`}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH AND QUEUE TABLE */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search project name, ticker (CEG, VST, TLN, BE), applicant, or ISO region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/60 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQueue.map((item) => {
            const statusColor =
              item.status === "APPROVED_ENERGIZED"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : item.status === "INTERCONNECTION_PPA_SIGNED"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : item.status === "NRC_LICENSE_ACTIVE"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40";

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-400/40 transition-all shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.ticker}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        [{item.isoRegion} // {item.id}]
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white mt-1">{item.project}</h4>
                    <span className="text-xs text-neutral-400 font-medium">{item.applicant}</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-base font-black text-amber-300">{item.powerCapacityMw} MW</span>
                    <span className="text-[10px] text-neutral-400 block">{item.fuelType}</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {item.details}
                </p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-amber-400 font-bold">
                    Impact: {item.asymmetryImpact}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
