import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Server,
  Zap,
  Cpu,
  Orbit,
  Mountain,
  Layers,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  Radio,
  Sparkles,
  Info,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { StockTicker } from "../types";

export interface MapNode {
  id: string;
  name: string;
  region: "North America" | "Europe" | "Asia-Pacific" | "Global";
  country: string;
  category: "datacenter" | "energy" | "semiconductor" | "minerals" | "space";
  lat: number;
  lng: number;
  xPercent: number; // For responsive 2D projection (0-100%)
  yPercent: number; // For responsive 2D projection (0-100%)
  capacityMetric: string;
  powerRatingMw?: number;
  status: "ACTIVE" | "EXPANDING" | "UNDER_CONSTRUCTION" | "PLANNED";
  summary: string;
  physicalConstraint: string;
  connectedTickers: string[];
  operator: string;
  capRateEstimated?: string;
  keyPartners: string[];
}

export const INFRASTRUCTURE_NODES: MapNode[] = [
  // 1. DATA CENTERS
  {
    id: "dc-ashburn",
    name: "Ashburn Data Center Alley",
    region: "North America",
    country: "United States (Virginia)",
    category: "datacenter",
    lat: 39.0438,
    lng: -77.4874,
    xPercent: 27.5,
    yPercent: 37.0,
    capacityMetric: "3,400+ MW Capacity (70% World Internet Traffic)",
    powerRatingMw: 3400,
    status: "ACTIVE",
    summary: "The global epicenter of internet routing and hyperscale cloud infrastructure, hosting over 30 million square feet of mission-critical data center space.",
    physicalConstraint: "Dominion Energy 500kV transmission bottlenecks; substation transformer queue extends to 2029.",
    connectedTickers: ["DLR", "EQIX", "AMZN", "MSFT", "GOOGL"],
    operator: "Equinix / Digital Realty / Vantage",
    capRateEstimated: "6.2% - 7.1%",
    keyPartners: ["Amazon Web Services", "Microsoft Azure", "OpenAI"],
  },
  {
    id: "dc-silicon-valley",
    name: "Santa Clara & Silicon Valley Cluster",
    region: "North America",
    country: "United States (California)",
    category: "datacenter",
    lat: 37.3541,
    lng: -121.9552,
    xPercent: 15.0,
    yPercent: 38.5,
    capacityMetric: "920 MW Operational Capacity",
    powerRatingMw: 920,
    status: "EXPANDING",
    summary: "Ultra-low latency edge compute core for frontier AI laboratories, Stanford research clusters, and tier-1 venture ecosystems.",
    physicalConstraint: "Silicon Valley Power (SVP) municipal grid limits and strict municipal water-cooling ordinances.",
    connectedTickers: ["EQIX", "NVDA", "GOOGL", "META"],
    operator: "Equinix / CoreSite",
    capRateEstimated: "5.8% - 6.5%",
    keyPartners: ["NVIDIA Compute Clusters", "Meta AI Research"],
  },
  {
    id: "dc-phoenix",
    name: "Phoenix & Mesa Hyperscale Hub",
    region: "North America",
    country: "United States (Arizona)",
    category: "datacenter",
    lat: 33.4484,
    lng: -112.074,
    xPercent: 18.0,
    yPercent: 42.0,
    capacityMetric: "1,650 MW In-Development",
    powerRatingMw: 1650,
    status: "EXPANDING",
    summary: "Rapidly growing desert hyperscale corridor supported by Palo Verde Nuclear Generating Station and abundant solar land.",
    physicalConstraint: "Water usage rights under Colorado River allocations; closed-loop adiabatic cooling required.",
    connectedTickers: ["DLR", "IRM", "TSM", "MSFT"],
    operator: "Digital Realty / Iron Mountain",
    capRateEstimated: "6.8% - 7.5%",
    keyPartners: ["Microsoft Cloud", "Taiwan Semiconductor R&D"],
  },
  {
    id: "dc-dallas",
    name: "Dallas-Fort Worth Metroplex Cluster",
    region: "North America",
    country: "United States (Texas)",
    category: "datacenter",
    lat: 32.7767,
    lng: -96.797,
    xPercent: 22.0,
    yPercent: 43.5,
    capacityMetric: "1,850 MW Planned & Active",
    powerRatingMw: 1850,
    status: "ACTIVE",
    summary: "Deregulated ERCOT power grid access with rapid permitting and substantial fiber connectivity across the central US.",
    physicalConstraint: "ERCOT extreme summer/winter grid reserve margins and volatile spot electricity pricing spikes.",
    connectedTickers: ["DLR", "EQIX", "CEG"],
    operator: "CyrusOne / Digital Realty",
    capRateEstimated: "7.0% - 7.8%",
    keyPartners: ["Oracle Cloud", "Goldman Sachs Core Infrastructure"],
  },
  {
    id: "dc-frankfurt",
    name: "Frankfurt DE-CIX AI Gateway",
    region: "Europe",
    country: "Germany",
    category: "datacenter",
    lat: 50.1109,
    lng: 8.6821,
    xPercent: 51.5,
    yPercent: 29.5,
    capacityMetric: "1,150 MW Interconnected",
    powerRatingMw: 1150,
    status: "ACTIVE",
    summary: "Europe's foremost financial and data interchange, housing the DE-CIX internet exchange carrying over 16 Tbps peak traffic.",
    physicalConstraint: "German Energy Efficiency Act (EnEfG) mandates waste-heat reuse and strict 1.2 PUE thresholds.",
    connectedTickers: ["EQIX", "DLR", "SAP"],
    operator: "Equinix / Interxion",
    capRateEstimated: "5.4% - 6.2%",
    keyPartners: ["European Central Bank", "SAP Cloud"],
  },
  {
    id: "dc-dublin",
    name: "Dublin Hyperscale Campus Corridor",
    region: "Europe",
    country: "Ireland",
    category: "datacenter",
    lat: 53.3498,
    lng: -6.2603,
    xPercent: 46.5,
    yPercent: 27.5,
    capacityMetric: "1,020 MW Operational",
    powerRatingMw: 1020,
    status: "ACTIVE",
    summary: "European corporate headquarters for major US tech giants, providing low corporate tax structuring and direct subsea transatlantic fiber links.",
    physicalConstraint: "EirGrid regulatory moratorium on new grid connections without dedicated on-site generation.",
    connectedTickers: ["AMZN", "MSFT", "GOOGL", "META"],
    operator: "AWS / Microsoft / Google",
    capRateEstimated: "5.9% - 6.6%",
    keyPartners: ["AWS Europe", "Meta International"],
  },
  {
    id: "dc-tokyo",
    name: "Tokyo Inzai Data Center Park",
    region: "Asia-Pacific",
    country: "Japan",
    category: "datacenter",
    lat: 35.6762,
    lng: 139.6503,
    xPercent: 86.0,
    yPercent: 40.0,
    capacityMetric: "1,200 MW Capacity",
    powerRatingMw: 1200,
    status: "EXPANDING",
    summary: "Premier East Asian low-latency AI compute hub connecting Japan, Korea, and cross-Pacific subsea routes.",
    physicalConstraint: "TEPCO regional electricity tariffs and stringent seismic damping engineering requirements.",
    connectedTickers: ["EQIX", "SFTBY", "NVDA"],
    operator: "Equinix / NTT Communications / Colt",
    capRateEstimated: "4.8% - 5.5%",
    keyPartners: ["SoftBank AI Network", "Sony AI"],
  },
  {
    id: "dc-singapore",
    name: "Singapore Jurong Data Hub",
    region: "Asia-Pacific",
    country: "Singapore",
    category: "datacenter",
    lat: 1.3521,
    lng: 103.8198,
    xPercent: 78.0,
    yPercent: 58.0,
    capacityMetric: "880 MW Island-wide",
    powerRatingMw: 880,
    status: "ACTIVE",
    summary: "Southeast Asia's primary financial trading nexus and subsea cable convergence point for 26 international cables.",
    physicalConstraint: "Severe land constraints and Tropical PUE standards; expansion shifting to Johor, Malaysia.",
    connectedTickers: ["EQIX", "DLR", "BABA"],
    operator: "Equinix / Singtel / Keppel",
    capRateEstimated: "6.0% - 6.8%",
    keyPartners: ["ByteDance APAC", "GIC Sovereign Infrastructure"],
  },

  // 2. ENERGY & NUCLEAR SMRs
  {
    id: "energy-three-mile-island",
    name: "Crane Clean Energy Center (Three Mile Island Unit 1)",
    region: "North America",
    country: "United States (Pennsylvania)",
    category: "energy",
    lat: 40.154,
    lng: -76.7247,
    xPercent: 28.0,
    yPercent: 35.5,
    capacityMetric: "835 MW 24/7 Dedicated Baseload Nuclear",
    powerRatingMw: 835,
    status: "EXPANDING",
    summary: "Historic nuclear restart under a 20-year Power Purchase Agreement (PPA) dedicated to powering Microsoft hyperscale AI data centers.",
    physicalConstraint: "NRC regulatory relicensing timeline (targeted for 2028 operational grid sync).",
    connectedTickers: ["CEG", "MSFT"],
    operator: "Constellation Energy",
    keyPartners: ["Microsoft AI Cloud Infrastructure"],
  },
  {
    id: "energy-vogtle",
    name: "Alvin W. Vogtle Electric Generating Plant (Units 3 & 4)",
    region: "North America",
    country: "United States (Georgia)",
    category: "energy",
    lat: 33.1422,
    lng: -81.7622,
    xPercent: 26.5,
    yPercent: 42.0,
    capacityMetric: "2,234 MW AP1000 Baseload Power",
    powerRatingMw: 2234,
    status: "ACTIVE",
    summary: "The only newly constructed commercial AP1000 nuclear reactors in the United States, providing zero-carbon baseload energy for the Southeast.",
    physicalConstraint: "Massive capital expenditure amortization (~$35B total project cost).",
    connectedTickers: ["SO", "DUK"],
    operator: "Southern Company (Georgia Power)",
    keyPartners: ["Georgia Transmission Corp", "Municipal Electric Authority"],
  },
  {
    id: "energy-oklo-smr",
    name: "Oklo Aurora Small Modular Reactor (INL Site)",
    region: "North America",
    country: "United States (Idaho)",
    category: "energy",
    lat: 43.5358,
    lng: -112.9472,
    xPercent: 17.5,
    yPercent: 33.0,
    capacityMetric: "15 - 50 MW Liquid Metal Fast Reactor",
    powerRatingMw: 50,
    status: "UNDER_CONSTRUCTION",
    summary: "Next-generation fast fission reactor utilizing HALEU fuel to provide microgrid power directly adjacent to off-grid AI data centers.",
    physicalConstraint: "Domestic High-Assay Low-Enriched Uranium (HALEU) supply chain availability from Centrus Energy ($LEU).",
    connectedTickers: ["OKLO", "LEU", "SMR"],
    operator: "Oklo Inc.",
    keyPartners: ["Department of Energy (DOE)", "Idaho National Laboratory"],
  },
  {
    id: "energy-helion-fusion",
    name: "Helion Energy Magneto-Inertial Fusion Complex",
    region: "North America",
    country: "United States (Washington)",
    category: "energy",
    lat: 47.9789,
    lng: -122.2021,
    xPercent: 14.5,
    yPercent: 29.0,
    capacityMetric: "50 MW Polaris Fusion Plant (Target 2028)",
    powerRatingMw: 50,
    status: "PLANNED",
    summary: "Direct electricity recovery fusion reactor using Deuterium-Helium-3 under contract to supply Microsoft AI workloads by 2028.",
    physicalConstraint: "Net energy gain Q-factor sustained pulse scaling and commercial Helium-3 isotope sourcing.",
    connectedTickers: ["MSFT"],
    operator: "Helion Energy",
    keyPartners: ["OpenAI / Sam Altman", "Microsoft Corporation"],
  },

  // 3. SEMICONDUCTOR FABS
  {
    id: "semi-tsmc-hsinchu",
    name: "TSMC Gigafab 12 / 20 (Hsinchu Science Park)",
    region: "Asia-Pacific",
    country: "Taiwan",
    category: "semiconductor",
    lat: 24.7811,
    lng: 120.9972,
    xPercent: 82.5,
    yPercent: 46.5,
    capacityMetric: "2nm GAA & 3nm N3E Leading-Edge Cleanrooms",
    status: "ACTIVE",
    summary: "The crown jewel of global semiconductor manufacturing, producing 90%+ of all advanced AI training accelerators (NVIDIA H100/B200, Apple M4, AMD MI300).",
    physicalConstraint: "Geopolitical Taiwan Strait risk; Taipower island electrical grid reserve and water reservoir dependency.",
    connectedTickers: ["TSM", "NVDA", "AAPL", "AMD", "ASML"],
    operator: "Taiwan Semiconductor Manufacturing Co. (TSMC)",
    keyPartners: ["NVIDIA", "Apple", "AMD", "Broadcom"],
  },
  {
    id: "semi-asml-veldhoven",
    name: "ASML Global EUV Lithography Headquarters",
    region: "Europe",
    country: "Netherlands",
    category: "semiconductor",
    lat: 51.4172,
    lng: 5.4056,
    xPercent: 50.0,
    yPercent: 28.5,
    capacityMetric: "Sole Global Producer of High-NA EUV Twinscan EXE Systems",
    status: "ACTIVE",
    summary: "Absolute monopoly bottleneck on extreme ultraviolet lithography machines ($380M each) required to print chips below 3nm.",
    physicalConstraint: "Carl Zeiss optical mirror precision grinding and strict Dutch/US export controls on China shipments.",
    connectedTickers: ["ASML", "TSM", "INTC"],
    operator: "ASML Holding N.V.",
    keyPartners: ["Zeiss Optics", "TSMC", "Intel Foundry"],
  },
  {
    id: "semi-tsmc-arizona",
    name: "TSMC Fab 21 (Phoenix Mega-Site)",
    region: "North America",
    country: "United States (Arizona)",
    category: "semiconductor",
    lat: 33.7483,
    lng: -112.164,
    xPercent: 17.8,
    yPercent: 41.5,
    capacityMetric: "4nm / 3nm US Cleanrooms ($65B Total Investment)",
    status: "EXPANDING",
    summary: "Historic US CHIPS Act flagship project onshoring advanced logic fabrication for American defense and technology giants.",
    physicalConstraint: "Skilled cleanroom technician shortages and higher construction cost differentials vs. Taiwan.",
    connectedTickers: ["TSM", "AAPL", "NVDA", "AMAT"],
    operator: "TSMC Arizona",
    keyPartners: ["Apple", "NVIDIA", "US Dept of Commerce"],
  },
  {
    id: "semi-intel-ohio",
    name: "Intel Silicon Heartland (New Albany Mega-Site)",
    region: "North America",
    country: "United States (Ohio)",
    category: "semiconductor",
    lat: 40.0812,
    lng: -82.8089,
    xPercent: 26.0,
    yPercent: 36.5,
    capacityMetric: "Intel 18A / 14A Foundry Cleanrooms",
    status: "UNDER_CONSTRUCTION",
    summary: "$28B greenfield semiconductor manufacturing hub engineered to establish the Midwest as a global chip powerhouse.",
    physicalConstraint: "Market adoption of Intel Foundry Services (IFS) and 18A defect density yield curves.",
    connectedTickers: ["INTC", "ASML", "LRCX"],
    operator: "Intel Corporation",
    keyPartners: ["Microsoft Cloud", "DoD Rapid Assured Microelectronics"],
  },

  // 4. MINERALS & CRITICAL METALS
  {
    id: "mineral-thacker-pass",
    name: "Thacker Pass Lithium Mega-Deposit",
    region: "North America",
    country: "United States (Nevada)",
    category: "minerals",
    lat: 41.7083,
    lng: -118.0642,
    xPercent: 16.0,
    yPercent: 34.0,
    capacityMetric: "Largest Known Lithium Deposit in North America (66,000 tpa)",
    status: "UNDER_CONSTRUCTION",
    summary: "Sedimentary claystone lithium mine backed by a $2.26B Department of Energy loan and General Motors off-take partnership.",
    physicalConstraint: "Sulfuric acid leaching environmental monitoring and indigenous cultural boundary stewardship.",
    connectedTickers: ["LAC", "GM", "TSLA"],
    operator: "Lithium Americas Corp.",
    keyPartners: ["General Motors", "US Department of Energy"],
  },
  {
    id: "mineral-mountain-pass",
    name: "Mountain Pass Rare Earth Mine & Separation Plant",
    region: "North America",
    country: "United States (California)",
    category: "minerals",
    lat: 35.4811,
    lng: -115.5342,
    xPercent: 16.5,
    yPercent: 40.0,
    capacityMetric: "15% of Global Neodymium-Praseodymium (NdPr) Magnet Supply",
    status: "ACTIVE",
    summary: "The only scaled, operational rare earth mining and magnetics processing facility in the Western Hemisphere.",
    physicalConstraint: "Downstream heavy rare earth separation refining complexity and permanent magnet sintering capacity.",
    connectedTickers: ["MP", "GM", "LMT"],
    operator: "MP Materials Corp.",
    keyPartners: ["General Motors EV Powertrains", "DoD Defense Logistics Agency"],
  },

  // 5. SPACE INFRASTRUCTURE & LAUNCH
  {
    id: "space-starbase",
    name: "SpaceX Starbase Launch & Production Complex",
    region: "North America",
    country: "United States (Texas)",
    category: "space",
    lat: 25.9972,
    lng: -97.1561,
    xPercent: 21.5,
    yPercent: 48.0,
    capacityMetric: "Starship Heavy Orbital Mass-to-Orbit Hub (150t+ payload)",
    status: "EXPANDING",
    summary: "Primary manufacturing gigafactory and launch site for the fully reusable Starship / Super Heavy spacecraft carrying next-gen Starlink satellites and lunar landers.",
    physicalConstraint: "FAA Commercial Space Transportation environmental launch licenses and methalox fuel cryogenic loading cycles.",
    connectedTickers: ["SPCX", "TSLA"],
    operator: "SpaceX",
    keyPartners: ["NASA Artemis Program", "Starlink Megaconstellation"],
  },
  {
    id: "space-cape-canaveral",
    name: "Cape Canaveral Space Force Station & KSC (SLC-40 / LC-39A)",
    region: "North America",
    country: "United States (Florida)",
    category: "space",
    lat: 28.3922,
    lng: -80.6077,
    xPercent: 27.0,
    yPercent: 45.0,
    capacityMetric: "Highest Cadence Orbital Spaceport (100+ launches/year)",
    status: "ACTIVE",
    summary: "The world's highest-tempo orbital launch range, launching SpaceX Starlink missions every 2.8 days alongside military GPS and commercial geostationary payloads.",
    physicalConstraint: "Eastern Range airspace deconfliction and maritime safety zone closures.",
    connectedTickers: ["BA", "LMT", "NOC", "RTX"],
    operator: "US Space Force / NASA / SpaceX",
    keyPartners: ["US Space Force Space Systems Command", "NASA"],
  },
];

interface GlobalInfrastructureMapProps {
  onSelectStock?: (stock: StockTicker) => void;
  className?: string;
  initialCategory?: string;
}

export const GlobalInfrastructureMap: React.FC<GlobalInfrastructureMapProps> = ({
  onSelectStock,
  className = "",
  initialCategory = "all",
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(INFRASTRUCTURE_NODES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLiveRadarActive, setIsLiveRadarActive] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: "all", label: "All Layers", icon: <Layers className="w-3.5 h-3.5" />, color: "text-cyan-400" },
    { id: "datacenter", label: "AI Data Centers", icon: <Server className="w-3.5 h-3.5" />, color: "text-emerald-400" },
    { id: "energy", label: "Nuclear & Grid", icon: <Zap className="w-3.5 h-3.5" />, color: "text-amber-400" },
    { id: "semiconductor", label: "Chip Fabs", icon: <Cpu className="w-3.5 h-3.5" />, color: "text-indigo-400" },
    { id: "minerals", label: "Rare Minerals", icon: <Mountain className="w-3.5 h-3.5" />, color: "text-rose-400" },
    { id: "space", label: "Space & Orbital", icon: <Orbit className="w-3.5 h-3.5" />, color: "text-purple-400" },
  ];

  const regions = ["all", "North America", "Europe", "Asia-Pacific"];

  const filteredNodes = useMemo(() => {
    return INFRASTRUCTURE_NODES.filter((node) => {
      const matchCat = selectedCategory === "all" || node.category === selectedCategory;
      const matchReg = selectedRegion === "all" || node.region === selectedRegion;
      const matchSearch =
        !searchQuery.trim() ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.connectedTickers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        node.operator.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchReg && matchSearch;
    });
  }, [selectedCategory, selectedRegion, searchQuery]);

  const getNodeColor = (cat: MapNode["category"]) => {
    switch (cat) {
      case "datacenter":
        return {
          bg: "bg-emerald-500",
          border: "border-emerald-400",
          glow: "rgba(16, 185, 129, 0.6)",
          text: "text-emerald-300",
        };
      case "energy":
        return {
          bg: "bg-amber-500",
          border: "border-amber-400",
          glow: "rgba(245, 158, 11, 0.6)",
          text: "text-amber-300",
        };
      case "semiconductor":
        return {
          bg: "bg-cyan-500",
          border: "border-cyan-400",
          glow: "rgba(0, 242, 255, 0.6)",
          text: "text-cyan-300",
        };
      case "minerals":
        return {
          bg: "bg-rose-500",
          border: "border-rose-400",
          glow: "rgba(244, 63, 94, 0.6)",
          text: "text-rose-300",
        };
      case "space":
        return {
          bg: "bg-purple-500",
          border: "border-purple-400",
          glow: "rgba(168, 85, 247, 0.6)",
          text: "text-purple-300",
        };
      default:
        return {
          bg: "bg-cyan-500",
          border: "border-cyan-400",
          glow: "rgba(0, 242, 255, 0.6)",
          text: "text-cyan-300",
        };
    }
  };

  const handleSelectNode = (node: MapNode) => {
    triggerHaptic("selection");
    setSelectedNode(node);
  };

  return (
    <div
      className={`w-full space-y-4 font-mono select-none text-neutral-200 ${className}`}
    >
      {/* TOP RADAR HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#040f18]/90 border border-cyan-500/40 shadow-xl shadow-cyan-950/40 alien-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/70 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            <Compass className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: "24s" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white font-orbitron tracking-wide flex items-center gap-2">
                <span>GLOBAL CAPITAL & PHYSICAL INFRASTRUCTURE MAP</span>
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">
                ● LIVE GEO-TELEMETRY
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Interactive physical bottlenecks: AI Data Center MW loads, Nuclear SMR grids, 2nm fabs, and critical mineral deposits.
            </p>
          </div>
        </div>

        {/* SEARCH & RADAR SWEEP TOGGLE */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, city, or operator..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-xs text-cyan-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={() => setIsLiveRadarActive(!isLiveRadarActive)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiveRadarActive
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,255,0.3)]"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveRadarActive ? "text-cyan-400 animate-pulse" : ""}`} />
            <span className="hidden sm:inline">RADAR</span>
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Layer Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedCategory(cat.id);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/20 text-white border border-cyan-400 shadow-[0_0_12px_rgba(0,242,255,0.3)]"
                    : "bg-[#040f18]/80 text-neutral-400 hover:text-white border border-neutral-800 hover:border-cyan-500/40"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {cat.id !== "all" && (
                  <span className="text-[10px] opacity-60">
                    ({INFRASTRUCTURE_NODES.filter((n) => n.category === cat.id).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Region Filter Dropdown / Pills */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-neutral-800">
          {regions.map((reg) => {
            const isSel = selectedRegion === reg;
            return (
              <button
                key={reg}
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedRegion(reg);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  isSel
                    ? "bg-cyan-900/60 text-cyan-200 border border-cyan-500/40"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {reg === "all" ? "All Regions" : reg}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAP STAGE & SIDE DETAIL SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* INTERACTIVE 2D VECTOR RADAR MAP CANVAS */}
        <div
          ref={mapContainerRef}
          className="lg:col-span-2 relative min-h-[460px] sm:min-h-[520px] rounded-2xl bg-[#02070f] border border-cyan-500/50 shadow-2xl overflow-hidden alien-card flex flex-col justify-between"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.08) 0%, transparent 70%),
              linear-gradient(rgba(0, 242, 255, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 242, 255, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 32px 32px, 32px 32px",
          }}
        >
          {/* HUD CORNERS & RADAR SCANLINE */}
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {isLiveRadarActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              <div
                className="w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_15px_#00f2ff] animate-radar-beam"
                style={{
                  animationDuration: "6s",
                  animationIterationCount: "infinite",
                  animationTimingFunction: "linear",
                }}
              />
            </div>
          )}

          {/* WORLD MAP VECTOR OUTLINE SVG */}
          <svg
            className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(0, 242, 255, 0.2)" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#grid-dots)" />

            {/* Latitude / Longitude Tactical Grid Lines */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(0, 242, 255, 0.25)" strokeDasharray="4,4" />
            <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(0, 242, 255, 0.25)" strokeDasharray="4,4" />
            <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(0, 242, 255, 0.1)" strokeDasharray="2,6" />
            <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(0, 242, 255, 0.1)" strokeDasharray="2,6" />
            <line x1="250" y1="0" x2="250" y2="500" stroke="rgba(0, 242, 255, 0.1)" strokeDasharray="2,6" />
            <line x1="750" y1="0" x2="750" y2="500" stroke="rgba(0, 242, 255, 0.1)" strokeDasharray="2,6" />

            {/* Continent simplified polygon approximations for high contrast tactical display */}
            {/* North America */}
            <path
              d="M 120 100 L 220 90 L 300 120 L 320 200 L 280 230 L 260 270 L 220 280 L 180 230 L 120 180 Z"
              fill="rgba(0, 242, 255, 0.04)"
              stroke="rgba(0, 242, 255, 0.25)"
              strokeWidth="1.2"
            />
            {/* Europe */}
            <path
              d="M 460 110 L 560 100 L 580 150 L 540 200 L 480 210 L 460 170 Z"
              fill="rgba(0, 242, 255, 0.04)"
              stroke="rgba(0, 242, 255, 0.25)"
              strokeWidth="1.2"
            />
            {/* Asia */}
            <path
              d="M 580 100 L 820 100 L 880 180 L 850 260 L 760 280 L 660 260 L 600 200 Z"
              fill="rgba(0, 242, 255, 0.04)"
              stroke="rgba(0, 242, 255, 0.25)"
              strokeWidth="1.2"
            />
            {/* Southeast Asia & Japan Islands */}
            <circle cx="860" cy="200" r="14" fill="rgba(0, 242, 255, 0.08)" stroke="rgba(0, 242, 255, 0.3)" />
            <circle cx="820" cy="230" r="10" fill="rgba(0, 242, 255, 0.08)" stroke="rgba(0, 242, 255, 0.3)" />
          </svg>

          {/* INTERACTIVE NODE MARKERS OVERLAY */}
          <div className="absolute inset-0 p-4 z-20">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const style = getNodeColor(node.category);

              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{
                    left: `${node.xPercent}%`,
                    top: `${node.yPercent}%`,
                  }}
                >
                  {/* Ping Animation Ring */}
                  <div
                    className={`absolute -inset-2 rounded-full opacity-75 animate-ping pointer-events-none ${
                      isSelected ? "opacity-100" : "opacity-40"
                    }`}
                    style={{ backgroundColor: style.glow }}
                  />

                  {/* Core Tactical Marker Icon */}
                  <div
                    className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? "scale-125 border-white bg-white text-black shadow-[0_0_20px_#ffffff] z-30"
                        : `${style.bg}/20 ${style.border} ${style.text} hover:scale-115 hover:border-white shadow-[0_0_12px_${style.glow}]`
                    }`}
                  >
                    {node.category === "datacenter" && <Server className="w-3.5 h-3.5" />}
                    {node.category === "energy" && <Zap className="w-3.5 h-3.5" />}
                    {node.category === "semiconductor" && <Cpu className="w-3.5 h-3.5" />}
                    {node.category === "minerals" && <Mountain className="w-3.5 h-3.5" />}
                    {node.category === "space" && <Orbit className="w-3.5 h-3.5" />}
                  </div>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-40 whitespace-nowrap">
                    <div className="px-2.5 py-1 rounded-lg bg-black/90 border border-cyan-400 text-[10px] font-bold text-white shadow-xl shadow-cyan-950 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{node.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MAP BOTTOM TELEMETRY BAR */}
          <div className="relative z-20 p-3 bg-black/80 border-t border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="text-cyan-300 font-bold">
                ACTIVE NODES: {filteredNodes.length} / {INFRASTRUCTURE_NODES.length}
              </span>
              <span>GRID PROJECTION: WGS-84 TACTICAL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">● LIVE FEED</span>
              <span>SYNC: 2026 QUANT RADAR</span>
            </div>
          </div>
        </div>

        {/* RIGHT NODE DOSSIER / PHYSICAL TELEMETRY PANEL */}
        <div className="rounded-2xl bg-[#040f18]/95 border border-cyan-500/50 p-4 sm:p-5 shadow-2xl flex flex-col justify-between space-y-4 alien-card">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header Badge & Title */}
              <div className="space-y-1.5 border-b border-cyan-950 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase border ${
                      getNodeColor(selectedNode.category).text
                    } border-current bg-current/10`}
                  >
                    {selectedNode.category.toUpperCase()} NODE
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold">
                    {selectedNode.country}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white font-orbitron tracking-tight">
                  {selectedNode.name}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {selectedNode.summary}
                </p>
              </div>

              {/* Key Telemetry Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 space-y-1">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">CAPACITY / SCALE</div>
                  <div className="text-xs font-black text-cyan-300">
                    {selectedNode.capacityMetric}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 space-y-1">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">OPERATOR / ASSET</div>
                  <div className="text-xs font-bold text-white truncate">
                    {selectedNode.operator}
                  </div>
                </div>

                {selectedNode.capRateEstimated && (
                  <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-500/20 space-y-1">
                    <div className="text-[10px] text-emerald-400/80 font-bold uppercase">ESTIMATED CAP RATE</div>
                    <div className="text-xs font-black text-emerald-400">
                      {selectedNode.capRateEstimated}
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20 space-y-1">
                  <div className="text-[10px] text-amber-400/80 font-bold uppercase">STATUS</div>
                  <div className="text-xs font-black text-amber-300">
                    {selectedNode.status}
                  </div>
                </div>
              </div>

              {/* Physical Bottleneck / Constraint Highlight Box */}
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1">
                <div className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>CRITICAL PHYSICAL CONSTRAINT</span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  {selectedNode.physicalConstraint}
                </p>
              </div>

              {/* Connected Stocks / REITs with Direct 1-Click Jump */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-cyan-400 uppercase">
                  EXPOSURE TICKERS & REITS
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.connectedTickers.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => {
                        triggerHaptic("selection");
                        if (onSelectStock) {
                          onSelectStock({ symbol: sym } as any);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 font-black text-xs flex items-center gap-1 transition-all cursor-pointer font-orbitron"
                      title={`Open live analysis for $${sym}`}
                    >
                      <span>${sym}</span>
                      <ChevronRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Partners */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">KEY TENANTS & ALLIES:</span>
                <p className="text-neutral-400 text-[11px]">
                  {selectedNode.keyPartners.join(" • ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <Compass className="w-8 h-8 text-neutral-600 mx-auto animate-spin" />
              <p className="text-xs text-neutral-400">
                Select any tactical node marker on the radar to inspect its physical constraints and connected capital.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
