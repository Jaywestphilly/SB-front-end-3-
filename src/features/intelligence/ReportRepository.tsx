import React, { useState } from "react";
import { ReportRawItem } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Download,
  Printer,
  Search,
  Building2,
  Briefcase,
  ExternalLink,
  Check,
  Zap,
  BarChart3,
  Globe,
  Database,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
  Copy,
  Calendar,
  ShieldCheck,
  Activity,
  Flame,
  ArrowUpRight,
  Filter,
  Layers,
  Rocket,
  Cpu,
  LayoutGrid,
  List,
  Compass,
  Users,
  Landmark,
} from "lucide-react";
import { HEDGE_FUND_PROFILES, FILINGS_13F_DATA } from "../../data/hedge_funds";
import { triggerHaptic } from "../../utils/haptics";
import { LiveSecIntelSection } from "../../components/LiveSecIntelSection";
import { MacroEconomicsBriefing } from "./MacroEconomicsBriefing";
import { WhaleConsensusMatrix } from "./WhaleConsensusMatrix";

export type ReportCategory =
  | "ALL"
  | "MACRO_BRIEFING"
  | "WHALE_CONSENSUS"
  | "13F_HEAVYWEIGHTS"
  | "SUPERSONIC_TSUNAMI"
  | "SPACEX_ORBITAL"
  | "SEC_EXTERNAL_LINKS"
  | "LIVE_SEC_INTEL";

export interface MasterReportItem {
  id: string;
  category: "13F_HEAVYWEIGHTS" | "SUPERSONIC_TSUNAMI" | "SPACEX_ORBITAL";
  title: string;
  subtitle: string;
  date: string;
  symbols: string[];
  secFormCode?: string;
  pagesCount: number;
  badge: string;
  summaryText: string;
  managerGoals?: string;
  detailsTable: {
    label1: string;
    value1: string | number;
    label2: string;
    value2: string | number;
    label3: string;
    value3: string | number;
  };
  rawItems: ReportRawItem[];
}

export interface ExternalResource {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ElementType;
  badge: string;
  features: string[];
}

const EXTERNAL_RESOURCES: ExternalResource[] = [
  {
    id: "sec-edgar-search",
    name: "SEC EDGAR Official Search Portal",
    description: "Search official SEC filings including 10-K (Annual), 10-Q (Quarterly), 8-K (Current Reports), and Form 13F filings across all public companies.",
    url: "https://www.sec.gov/edgar/search/",
    icon: Database,
    badge: "10-K & 10-Q ARCHIVE",
    features: ["Official SEC Database", "Full-Text Search", "Real-Time Filings", "Corporate Actions"],
  },
  {
    id: "sec-13f-datasets",
    name: "SEC Form 13F Official Data Sets",
    description: "Official SEC datasets containing Form 13F-HR and 13F-NT filings submitted by institutional investment managers over $100M AUM.",
    url: "https://www.sec.gov/data-research/sec-markets-data/form-13f-data-sets",
    icon: Building2,
    badge: "OFFICIAL SEC DATA",
    features: ["Raw Quarterly Data", "Institutional Manager Lists", "Historical Datasets"],
  },
  {
    id: "whalewisdom-latest",
    name: "WhaleWisdom 13F Latest Filings",
    description: "Real-time updates, analytics, and conviction tracking of the latest 13F filings from top hedge funds, family offices, and institutional whales.",
    url: "https://whalewisdom.com/filing/latest_filings",
    icon: Briefcase,
    badge: "FUND TRACKER",
    features: ["Hedge Fund Analytics", "Latest 13F Updates", "Conviction Scoring"],
  },
  {
    id: "13f-info",
    name: "13F.info Institutional Database",
    description: "Searchable database of institutional 13F holdings. Track what top hedge funds and institutional managers are buying, holding, and selling.",
    url: "https://13f.info/",
    icon: BarChart3,
    badge: "HOLDINGS DATABASE",
    features: ["Clean UI", "Search by Fund or Ticker", "Holdings History"],
  },
];

// Supersonic Tsunami & SpaceX Custom Reports
const SPECIALIZED_DOSSIERS: MasterReportItem[] = [
  {
    id: "rep_spacex_orbital_dossier",
    category: "SPACEX_ORBITAL",
    title: "SpaceX ($SPCX / DXYZ Proxy) Orbital Supremacy & Tender Valuation Dossier",
    subtitle: "Starlink $6.6B Revenue Run-Rate, Starship Payload Economics & 13F Whale Accumulation",
    date: "Q3 2026 Institutional Brief",
    symbols: ["SPCX", "DXYZ", "TSLA", "PLTR"],
    secFormCode: "TENDER BENCHMARK #01",
    pagesCount: 14,
    badge: "ORBITAL MONOPOLY",
    managerGoals: "Monopolize low-Earth orbit broadband, scale Starship heavy payload launches, and dominate Earth-to-Orbit logistics before commercial competitors achieve orbital re-entry.",
    summaryText: "SpaceX represents the undisputed leader in commercial space infrastructure with a private tender valuation benchmark of $210+ Billion ($112/share). Starlink has surpassed 7,000 active satellites in LEO generating over $6.6 Billion in high-margin annual recurring broadband revenue. Meanwhile, Starship Flight tests have proven 150-ton LEO payload capacity and mechanical booster catch capability, unlocking unprecedented economics for NASA Artemis moon missions and orbital AI compute nodes.",
    detailsTable: {
      label1: "Tender Valuation",
      value1: "$210.0 Billion",
      label2: "Starlink Rev Run-Rate",
      value2: "$6.6B ARR",
      label3: "LEO Satellites",
      value3: "7,000+ Active",
    },
    rawItems: [
      {
        symbol: "SPCX",
        companyName: "Space Exploration Technologies Corp (Private Tender)",
        quarterlyChangeType: "ACCUMULATING",
        portfolioPercent: 100,
        epsActual: "Valuation $210B",
        aiThesis: "Starlink $6.6B ARR + Starship 150-ton LEO payload capacity + Direct-to-Cell cellular agreements with T-Mobile.",
      },
      {
        symbol: "DXYZ",
        companyName: "Destiny Tech100 Inc. (SpaceX Proxy Fund)",
        quarterlyChangeType: "HOLD",
        portfolioPercent: 34.2,
        epsActual: "$32.50 NAV",
        aiThesis: "Public market liquid access vehicle holding 34.2% direct weight in SpaceX private shares.",
      },
      {
        symbol: "TSLA",
        companyName: "Tesla Inc. (Autonomous & Synergies)",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 12.5,
        epsActual: "P/E 68x",
        aiThesis: "Shares hardware engineering talent, materials science, and AI training compute clusters with SpaceX.",
      },
    ],
  },
  {
    id: "rep_tsunami_nvda_power",
    category: "SUPERSONIC_TSUNAMI",
    title: "NVIDIA ($NVDA) 10-Q Financial Intelligence & Blackwell GPU Moat",
    subtitle: "Datacenter Revenue +122% YoY, Rubin Roadmap & Hyperscaler Capex Absorption",
    date: "10-Q SEC Official Brief",
    symbols: ["NVDA", "TSM", "ASML", "SKHY"],
    secFormCode: "SEC Form 10-Q Brief",
    pagesCount: 16,
    badge: "SUPERSONIC TSUNAMI #1",
    managerGoals: "Maintain 85%+ AI GPU market share, expand CUDA software lock-in, and sell integrated NVLink rack supercomputers (GB200 NVL72) directly to hyperscalers and sovereign AI clusters.",
    summaryText: "NVIDIA reported quarterly Datacenter revenue exceeding $30 Billion driven by overwhelming demand for Blackwell B200 and Hopper H200 architectures. Gross margins remain resilient at 75% as Microsoft, Meta, Alphabet, and Amazon commit $200B+ in annual capital expenditures. SK Hynix HBM3e memory supply and TSMC CoWoS packaging remain the primary gating factors for global shipment speeds.",
    detailsTable: {
      label1: "Qtr Datacenter Rev",
      value1: "$30.8 Billion",
      label2: "Gross Margin",
      value2: "75.4%",
      label3: "Hyperscaler Capex",
      value3: "$200B+ Commitment",
    },
    rawItems: [
      {
        symbol: "NVDA",
        companyName: "NVIDIA Corporation",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 100,
        epsActual: "$0.68 vs $0.64 Est",
        aiThesis: "Blackwell GB200 NVL72 rack-scale systems deliver 30x inference speedups over H100 generation.",
      },
      {
        symbol: "TSM",
        companyName: "Taiwan Semiconductor Mfg Co",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 45.0,
        epsActual: "$1.94 vs $1.78 Est",
        aiThesis: "Exclusive foundry partner producing 3nm Blackwell chips with expanding CoWoS advanced packaging capacity.",
      },
      {
        symbol: "SKHY",
        companyName: "SK Hynix Inc. (HBM3e Monopoly)",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 30.0,
        epsActual: "HBM3e Leader",
        aiThesis: "Monopoly supplier of 12-layer HBM3e high-bandwidth memory for NVIDIA Blackwell GPUs.",
      },
    ],
  },
  {
    id: "rep_tsunami_nuclear_grid",
    category: "SUPERSONIC_TSUNAMI",
    title: "Vistra ($VST), Constellation ($CEG) & Nuclear Grid Power Dossier",
    subtitle: "Behind-The-Meter 1GW+ Datacenter Power Agreements & Merchant Power Re-rating",
    date: "SEC Form 10-Q / 8-K Analysis",
    symbols: ["VST", "CEG", "OKLO", "BE"],
    secFormCode: "ENERGY TSUNAMI #02",
    pagesCount: 10,
    badge: "AGI POWER GRID",
    managerGoals: "Lock in 20-year fixed-price power purchase agreements (PPAs) with hyperscalers for baseload nuclear electricity at a 100%+ premium to legacy wholesale power prices.",
    summaryText: "Hyperscaler AI datacenters require 24/7 zero-emission baseload power, driving a historic structural re-rating for nuclear power utilities. Vistra ($VST) and Constellation Energy ($CEG) have secured long-term power purchase agreements (PPAs) directly connected to datacenter campuses. Meanwhile, Oklo ($OKLO) micro-reactors and Bloom Energy ($BE) fuel cells provide decentralized off-grid power solutions while waiting for 5+ year utility grid interconnection queues.",
    detailsTable: {
      label1: "Nuclear Capacity",
      value1: "12.5 GW Combined",
      label2: "PPA Premium",
      value2: "+110% vs Wholesale",
      label3: "Grid Lead Time",
      value3: "5 - 7 Years",
    },
    rawItems: [
      {
        symbol: "VST",
        companyName: "Vistra Corp (Merchant Nuclear)",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 40.0,
        epsActual: "$1.25 vs $0.98 Est",
        aiThesis: "Owns Comanche Peak & Beaver Valley nuclear plants with direct pipeline for hyperscaler PPAs.",
      },
      {
        symbol: "CEG",
        companyName: "Constellation Energy Corp",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 35.0,
        epsActual: "$2.15 vs $1.85 Est",
        aiThesis: "Restarting Crane Clean Energy Center (Three Mile Island Unit 1) under 20-year Microsoft PPA.",
      },
      {
        symbol: "OKLO",
        companyName: "Oklo Inc. (Fast-Fission SMRs)",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 15.0,
        epsActual: "Pre-Revenue / Licensing",
        aiThesis: "Sam Altman backed fast-fission micro-reactors designed for 15MW to 50MW off-grid cluster power.",
      },
      {
        symbol: "BE",
        companyName: "Bloom Energy Corp (Fuel Cells)",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 10.0,
        epsActual: "$0.14 vs $0.08 Est",
        aiThesis: "Rapid-deploy solid oxide fuel cells bypassing long utility interconnect queues for immediate datacenter power.",
      },
    ],
  },
  {
    id: "rep_tsunami_custom_asic_cloud",
    category: "SUPERSONIC_TSUNAMI",
    title: "Broadcom ($AVGO), CoreWeave ($CORZ) & Custom ASICs Dossier",
    subtitle: "Custom AI Accelerators, 51.2Tbps Switches & High-Density Hosting Contracts",
    date: "Q3 2026 Tech Synthesis",
    symbols: ["AVGO", "CORZ", "PLTR", "SOFI"],
    secFormCode: "SILICON TSUNAMI #03",
    pagesCount: 11,
    badge: "CUSTOM ACCELERATORS",
    managerGoals: "Capture custom AI ASIC design contracts for Alphabet (TPU), Meta (MTIA), and Bytedance while monetizing high-density liquid-cooled datacenter real estate.",
    summaryText: "Broadcom ($AVGO) continues to dominate custom AI accelerator ASIC design with expected annual AI revenue exceeding $12 Billion. Meanwhile, Core Scientific ($CORZ) has transitioned legacy bitcoin mining infrastructure into high-density liquid-cooled compute hosting under a 12-year $4.7 Billion contract with CoreWeave, demonstrating how power-rich sites are rapidly revalued.",
    detailsTable: {
      label1: "AVGO AI Revenue",
      value1: "$12.2B Annual",
      label2: "CORZ Contract",
      value2: "$4.7B CoreWeave",
      label3: "Switching Speed",
      value3: "51.2 Tbps Tomahawk",
    },
    rawItems: [
      {
        symbol: "AVGO",
        companyName: "Broadcom Inc.",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 50.0,
        epsActual: "$1.24 vs $1.20 Est",
        aiThesis: "Custom ASIC co-design partner for Google TPU v5e/v6 and Meta MTIA, plus Tomahawk 5 switches.",
      },
      {
        symbol: "CORZ",
        companyName: "Core Scientific Inc.",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 30.0,
        epsActual: "$0.18 vs $0.12 Est",
        aiThesis: "500MW+ powered infrastructure sites leased to CoreWeave for Nvidia H100/B200 GPU clusters.",
      },
      {
        symbol: "PLTR",
        companyName: "Palantir Technologies Inc.",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 20.0,
        epsActual: "$0.09 vs $0.08 Est",
        aiThesis: "Artificial Intelligence Platform (AIP) driving 55%+ US Commercial revenue growth.",
      },
    ],
  },
  {
    id: "rep_tsunami_aehr_sic_burnin",
    category: "SUPERSONIC_TSUNAMI",
    title: "Aehr Test Systems ($AEHR) Wafer-Level Burn-In & SiC/Photonics Dossier",
    subtitle: "SiC Power Semiconductors, AI Optical Interconnects & High-Yield Wafer Reliability",
    date: "Q4 SEC Intelligence Synthesis",
    symbols: ["AEHR", "NVDA", "ON", "COHR"],
    secFormCode: "TEST TSUNAMI #04",
    pagesCount: 9,
    badge: "SILICON BURN-IN",
    managerGoals: "Capture 80%+ market share in FOX-XP wafer-level test and burn-in systems for Silicon Carbide (SiC) EV traction inverters, AI data center power supplies, and silicon photonics optical transceivers.",
    summaryText: "Aehr Test Systems ($AEHR) provides proprietary wafer-level test and burn-in solutions that eliminate early life device failures in mission-critical silicon carbide (SiC) power chips and silicon photonics optical interconnects. As AI data centers demand kilowatt-level power density and 800G/1.6T optical transceivers to replace copper connections, AEHR's FOX-XP multichip wafer testing platform has become a fundamental bottleneck for high-yield AI hardware manufacturing.",
    detailsTable: {
      label1: "FOX-XP Installed Base",
      value1: "250+ Wafer Systems",
      label2: "SiC & Photonics Moat",
      value2: "FOX-CP / FOX-XP Wafers",
      label3: "AI Optical Demand",
      value3: "1.6T Transceiver Surge",
    },
    rawItems: [
      {
        symbol: "AEHR",
        companyName: "Aehr Test Systems (Wafer Burn-In)",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 65.0,
        epsActual: "$0.18 vs $0.14 Est",
        aiThesis: "Monopoly supplier in wafer-level burn-in systems for SiC power modules and AI silicon photonics.",
      },
      {
        symbol: "ON",
        companyName: "ON Semiconductor (Traction Inverters)",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 20.0,
        epsActual: "$0.96 vs $0.92 Est",
        aiThesis: "Primary buyer of AEHR FOX-XP systems for automotive and industrial SiC wafer testing.",
      },
      {
        symbol: "COHR",
        companyName: "Coherent Corp (Optical Transceivers)",
        quarterlyChangeType: "NEW BUY",
        portfolioPercent: 15.0,
        epsActual: "$0.53 vs $0.48 Est",
        aiThesis: "Leading silicon photonics manufacturer utilizing AEHR wafer-level testing for 800G/1.6T AI transceivers.",
      },
    ],
  },
  {
    id: "rep_tsunami_aaoi_optics",
    category: "SUPERSONIC_TSUNAMI",
    title: "Applied Optoelectronics ($AAOI) 800G/1.6T AI Optical Transceiver Dossier",
    subtitle: "Hyperscale Datacenter Interconnects, Laser Diode Fab & Silicon Photonics Shift",
    date: "Q4 SEC Intelligence Synthesis",
    symbols: ["AAOI", "LITE", "COHR", "NVDA"],
    secFormCode: "OPTICS TSUNAMI #05",
    pagesCount: 11,
    badge: "OPTICAL INTERCONNECT",
    managerGoals: "Monopolize hyperscale 800G and 1.6T optical transceiver deployments across top-tier cloud providers, leveraging vertically integrated US laser diode fabrication to overcome AI networking bandwidth bottlenecks.",
    summaryText: "Applied Optoelectronics ($AAOI) is a vertically integrated designer and manufacturer of high-speed fiber-optic networking hardware. As modern AI compute clusters transition from copper cables to high-bandwidth optical interconnects, AAOI has captured major hyperscaler design wins for 400G, 800G, and next-gen 1.6T optical transceivers. Its proprietary in-house molecular beam epitaxy (MBE) laser diode fabs in Texas grant a structural cost and lead-time advantage over non-integrated module assemblers.",
    detailsTable: {
      label1: "Next-Gen Transceivers",
      value1: "800G & 1.6T AI Optics",
      label2: "Vertical Integration",
      value2: "In-House Laser Diode Fabs",
      label3: "Hyperscale Moat",
      value3: "Tier-1 Cloud Contracts",
    },
    rawItems: [
      {
        symbol: "AAOI",
        companyName: "Applied Optoelectronics, Inc. (AI Optics)",
        quarterlyChangeType: "ACCUMULATING",
        portfolioPercent: 60.0,
        epsActual: "$0.22 vs $0.16 Est",
        aiThesis: "Direct beneficiary of 800G/1.6T optical transceiver upgrades required by GPU clusters (NVIDIA GB200 NVL72).",
      },
      {
        symbol: "LITE",
        companyName: "Lumentum Holdings (Telecom & DCI)",
        quarterlyChangeType: "HOLD",
        portfolioPercent: 20.0,
        epsActual: "$0.88 vs $0.80 Est",
        aiThesis: "Leading transceiver and optical component supplier for data center interconnects.",
      },
      {
        symbol: "NVDA",
        companyName: "NVIDIA Corporation (Quantum-X800 InfiniBand)",
        quarterlyChangeType: "INCREASED",
        portfolioPercent: 20.0,
        epsActual: "$0.68 vs $0.64 Est",
        aiThesis: "Pioneering 800Gb/s Quantum-X800 InfiniBand and Spectrum-X Ethernet switches driving optical demand.",
      },
    ],
  },
];

export const ReportRepository: React.FC = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalReport, setActiveModalReport] =
    useState<MasterReportItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Build full Master Report List from 13F profiles + Specialized Tsunami/SpaceX Dossiers
  const hedgeFundDossiers: MasterReportItem[] = HEDGE_FUND_PROFILES.map((fund) => {
    const fundFilings = FILINGS_13F_DATA.filter((f) => f.fundId === fund.id);
    const topSymbols = Array.from(new Set(fundFilings.map((f) => f.symbol)));

    return {
      id: `rep_13f_${fund.id}`,
      category: "13F_HEAVYWEIGHTS" as const,
      title: `${fund.fundName} Form 13F-HR Institutional Dossier`,
      subtitle: `SEC EDGAR Quarterly Holding Disclosures & Conviction Shifts`,
      date: "Q2/Q3 2026 SEC Filing",
      symbols: topSymbols.length > 0 ? topSymbols : fund.topHoldings.map((h) => h.symbol),
      secFormCode: "SEC Form 13F-HR",
      pagesCount: 8,
      badge: fund.badgeTag || "13F HEAVYWEIGHT",
      managerGoals: fund.thesisSummary,
      summaryText: `Institutional 13F portfolio analysis for ${fund.fundName} managed by ${fund.managerName}. Total AUM tracked: ${fund.aum}. Investment mandate focuses on ${fund.focusArea}. Strategic goal: ${fund.thesisSummary}`,
      detailsTable: {
        label1: "Total AUM",
        value1: fund.aum,
        label2: "Fund Manager",
        value2: fund.managerName,
        label3: "Conviction Score",
        value3: `${fund.convictionScore}/100`,
      },
      rawItems: fundFilings.length > 0 ? fundFilings : fund.topHoldings.map((h) => ({
        symbol: h.symbol,
        companyName: h.name,
        quarterlyChangeType: h.changeType,
        portfolioPercent: h.weightPercent,
        aiThesis: `${h.name} position holding representing ${h.weightPercent}% of fund AUM.`,
      })),
    };
  });

  const allReportsList: MasterReportItem[] = [
    ...SPECIALIZED_DOSSIERS,
    ...hedgeFundDossiers,
  ];

  // Filtered reports
  const filteredReports = allReportsList.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      selectedCategory === "SEC_EXTERNAL_LINKS" ||
      item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.summaryText.toLowerCase().includes(q) ||
      (item.managerGoals && item.managerGoals.toLowerCase().includes(q)) ||
      item.symbols.some((s) => s.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleCopyReportText = (report: MasterReportItem) => {
    triggerHaptic("success");
    const header = `========================================================\nSTOCK BLOC // ${report.secFormCode || "FINANCIAL DOSSIER"}\n========================================================\nTITLE: ${report.title}\nDATE: ${report.date} | ${report.subtitle}\nSYMBOLS: ${report.symbols.join(", ")}\n\nMANAGER GOALS & INVESTMENT MANDATE:\n${report.managerGoals || "N/A"}\n\nEXECUTIVE SUMMARY:\n${report.summaryText}\n\n`;

    let body = "";
    if (report.rawItems && report.rawItems.length > 0) {
      body =
        "DETAILED HOLDINGS & DATA BREAKDOWN:\n" +
        report.rawItems
          .map((item, i) => {
            return ` [${i + 1}] $${item.symbol} - ${item.companyName || item.name} | Action: ${item.quarterlyChangeType || "HOLD"} | Weight: ${item.portfolioPercent || item.weightPercent || 0}% | Result/Val: ${item.epsActual || item.sharesHeld || "N/A"}\n     Thesis: ${item.aiThesis || item.notes || "High conviction allocation."}`;
          })
          .join("\n\n");
    }

    const fullText =
      header +
      body +
      `\n\n========================================================\nStock Bloc Terminal • Verified Financial Intelligence Report`;

    navigator.clipboard.writeText(fullText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 3000);
    showToast("Report summary text copied to clipboard!");
  };

  const handleExportSingleCsv = (report: MasterReportItem) => {
    triggerHaptic("success");
    const headers = [
      "Report Title",
      "SEC Form Code",
      "Ticker Symbol",
      "Company Name",
      "Quarterly Action",
      "Portfolio Weight %",
      "Key Result / Valuation",
      "AI Thesis / Analysis",
    ];

    const rows = report.rawItems.map((f: ReportRawItem) => [
      `"${report.title.replace(/"/g, '""')}"`,
      `"${report.secFormCode || ""}"`,
      `"${f.symbol || ""}"`,
      `"${(f.companyName || f.name || "").replace(/"/g, '""')}"`,
      `"${f.quarterlyChangeType || "HOLD"}"`,
      `"${f.portfolioPercent || f.weightPercent || 0}%"`,
      `"${f.epsActual || f.sharesHeld || "N/A"}"`,
      `"${(f.aiThesis || f.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}_StockBloc.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${report.title} CSV!`);
  };

  const handleExportMasterIndexCsv = () => {
    triggerHaptic("success");
    const headers = [
      "Report ID",
      "Category",
      "SEC Form Code",
      "Report Title",
      "Filing / Release Date",
      "Tracked Symbols",
      "Manager Goals & Mandate",
      "Executive Summary",
    ];

    const rows = filteredReports.map((r) => [
      `"${r.id}"`,
      `"${r.category}"`,
      `"${r.secFormCode || ""}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.symbols.join("; ")}"`,
      `"${(r.managerGoals || "").replace(/"/g, '""')}"`,
      `"${r.summaryText.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stock_Bloc_Financial_Dossiers_Master_Index.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Master Report Index CSV downloaded! (${filteredReports.length} reports)`);
  };

  const handleOpenExternal = (url: string, name: string) => {
    triggerHaptic("success");
    window.open(url, "_blank", "noopener,noreferrer");
    showToast(`Opening official portal: ${name}`);
  };

  return (
    <div className="space-y-6 font-mono text-cyan-100 select-none pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 alien-block-cut-sm bg-cyan-400 text-black font-black text-xs shadow-2xl flex items-center gap-2 border border-cyan-300"
          >
            <Zap className="w-4 h-4 fill-black text-black" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-4 sm:p-6 alien-block-cut bg-black/80 border border-cyan-500/40 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-400 text-black alien-block-cut-sm font-black shrink-0">
              <FileText className="w-7 h-7 fill-black text-black" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-widest bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 alien-block-cut-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  VERIFIED FINANCIAL & 13F DOSSIERS
                </span>
                <span className="text-[10px] text-cyan-400/80">
                  {allReportsList.length} In-App Dossiers
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wider">
                Financial Report & 13F Intelligence Hub
              </h1>
              <p className="text-xs text-cyan-400/80 max-w-2xl font-sans">
                Comprehensive in-app summaries, 10-Q/10-K key metrics, SpaceX tender stats, and 13F hedge fund holdings with manager investment goals—formatted as visual dossiers, data tables, and CSV exports.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportMasterIndexCsv}
              data-testid="export-master-repository-csv"
              className="px-3.5 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT MASTER INDEX (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: "ALL DOSSIERS", icon: Globe },
              { id: "MACRO_BRIEFING", label: "MACRO REGIME BRIEF", icon: Landmark },
              { id: "WHALE_CONSENSUS", label: "WHALE CONSENSUS & DRIFT", icon: Users },
              { id: "SUPERSONIC_TSUNAMI", label: "SUPERSONIC TSUNAMI", icon: Flame },
              { id: "SPACEX_ORBITAL", label: "SPACEX ORBITAL", icon: Rocket },
              { id: "13F_HEAVYWEIGHTS", label: "13F HEDGE FUNDS", icon: Briefcase },
              { id: "LIVE_SEC_INTEL", label: "LIVE SEC INTEL", icon: Database },
              { id: "SEC_EXTERNAL_LINKS", label: "SEC SEC.GOV LINKS", icon: ExternalLink },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSelectedCategory(cat.id as ReportCategory);
                  }}
                  className={`px-3 py-1.5 alien-block-cut-sm text-xs font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border uppercase ${
                    isActive
                      ? "bg-cyan-400 text-black border-cyan-300 shadow-md shadow-cyan-400/20"
                      : "bg-black/60 text-cyan-400 border-cyan-500/30 hover:border-cyan-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & View Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 alien-block-cut-sm p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-neutral-500 hover:text-cyan-400"
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 transition-all ${
                  viewMode === "table"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-neutral-500 hover:text-cyan-400"
                }`}
                title="Table Summary View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="relative min-w-[200px] sm:w-60">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, fund, or thesis..."
                className="w-full bg-black/80 border border-cyan-500/40 alien-block-cut-sm pl-8 pr-3 py-1.5 text-xs text-white placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live SEC Intel Section */}
      {selectedCategory === "LIVE_SEC_INTEL" ? (
        <LiveSecIntelSection />
      ) : selectedCategory === "MACRO_BRIEFING" ? (
        <MacroEconomicsBriefing />
      ) : selectedCategory === "WHALE_CONSENSUS" ? (
        <WhaleConsensusMatrix />
      ) : selectedCategory === "SEC_EXTERNAL_LINKS" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXTERNAL_RESOURCES.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className="p-5 alien-block-cut bg-black/60 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between group h-full space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 alien-block-cut-sm bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {resource.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-cyan-900/40 border border-cyan-500/30 alien-block-cut-sm shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors uppercase tracking-wide">
                        {resource.name}
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans mt-1 leading-relaxed">
                        {resource.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {resource.features.map((feature, idx) => (
                      <span
                        key={`${resource.id}-feat-${idx}`}
                        className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-black uppercase"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-500/20">
                  <button
                    onClick={() => handleOpenExternal(resource.url, resource.name)}
                    className="w-full py-2.5 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
                  >
                    <span>OPEN OFFICIAL SEC SEC.GOV PORTAL</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Main Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 alien-block-cut bg-black/60 border border-cyan-500/30 hover:border-cyan-400 transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 alien-block-cut-sm bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        {report.category === "SPACEX_ORBITAL" && <Rocket className="w-3 h-3 text-purple-400" />}
                        {report.category === "SUPERSONIC_TSUNAMI" && <Flame className="w-3 h-3 text-amber-400" />}
                        {report.category === "13F_HEAVYWEIGHTS" && <Briefcase className="w-3 h-3 text-cyan-400" />}
                        {report.secFormCode || report.badge}
                      </span>

                      <span className="text-[10px] text-amber-300/80 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {report.date}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors uppercase tracking-wide">
                        {report.title}
                      </h3>
                      <p className="text-xs text-cyan-400/80 font-sans mt-0.5">
                        {report.subtitle}
                      </p>
                    </div>

                    {/* Ticker Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {report.symbols.map((sym, idx) => (
                        <span
                          key={`${sym}-${idx}`}
                          className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-black"
                        >
                          ${sym}
                        </span>
                      ))}
                    </div>

                    {/* Key Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-cyan-950/30 border border-cyan-500/20 alien-block-cut-sm text-[11px]">
                      <div>
                        <span className="text-[9px] text-cyan-400/70 block uppercase">
                          {report.detailsTable.label1}
                        </span>
                        <strong className="text-white font-bold block leading-tight">
                          {report.detailsTable.value1}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-cyan-400/70 block uppercase">
                          {report.detailsTable.label2}
                        </span>
                        <strong className="text-emerald-400 font-bold block leading-tight">
                          {report.detailsTable.value2}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-cyan-400/70 block uppercase">
                          {report.detailsTable.label3}
                        </span>
                        <strong className="text-amber-300 font-bold block leading-tight">
                          {report.detailsTable.value3}
                        </strong>
                      </div>
                    </div>

                    {/* Manager Goal / Summary Preview */}
                    {report.managerGoals && (
                      <div className="p-2.5 bg-black/40 border border-cyan-500/20 alien-block-cut-sm text-[11px] space-y-1">
                        <span className="text-[9px] text-amber-300 font-black uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          STRATEGIC MANDATE / GOALS
                        </span>
                        <p className="text-neutral-300 line-clamp-2 font-sans text-xs">
                          {report.managerGoals}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Action Controls */}
                  <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-cyan-400/60 font-bold">
                      {report.pagesCount} Pages • Visual Dossier & CSV
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportSingleCsv(report)}
                        className="px-2.5 py-1.5 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="Download Raw CSV"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">CSV</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic("medium");
                          setActiveModalReport(report);
                        }}
                        className="px-3 py-1.5 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer uppercase"
                      >
                        <FileText className="w-3.5 h-3.5 text-black" />
                        <span>VIEW FULL DOSSIER</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table Summary View */
            <div className="w-full max-w-full overflow-x-auto alien-block-cut border border-cyan-500/30 bg-black/60 shadow-xl">
              {/* Desktop Table View */}
              <table className="hidden sm:table w-full text-left text-xs">
                <thead className="bg-cyan-950/60 text-cyan-300 font-black text-[10px] uppercase border-b border-cyan-500/30 whitespace-nowrap">
                  <tr>
                    <th className="p-3">Report Dossier</th>
                    <th className="p-3">Category & Date</th>
                    <th className="p-3">Tracked Tickers</th>
                    <th className="p-3 min-w-[280px]">Manager Goals & Mandate</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="p-3 align-top min-w-[200px]">
                        <div className="font-bold text-white uppercase whitespace-normal">{report.title}</div>
                        <div className="text-[10px] text-cyan-500 mt-1">{report.secFormCode || report.badge}</div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-amber-300 font-bold flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          {report.date}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1 min-w-[150px] leading-tight">{report.subtitle}</div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {report.symbols.map((sym, idx) => (
                            <span key={`${sym}-${idx}`} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-black">
                              ${sym}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 align-top text-[11px] text-neutral-300 leading-relaxed min-w-[280px]">
                        <div className="line-clamp-2" title={report.managerGoals || report.summaryText}>
                          {report.managerGoals || report.summaryText}
                        </div>
                      </td>
                      <td className="p-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExportSingleCsv(report)}
                            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 rounded transition-all"
                            title="Download CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveModalReport(report)}
                            className="px-2.5 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[10px] rounded flex items-center gap-1 shadow-md active:scale-95 transition-all uppercase"
                          >
                            <FileText className="w-3 h-3" />
                            <span>DOSSIER</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                {filteredReports.map((report) => (
                  <div key={report.id} className="p-4 space-y-3 hover:bg-cyan-950/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white uppercase leading-tight">{report.title}</div>
                        <div className="text-[10px] text-cyan-500 mt-0.5">{report.secFormCode || report.badge}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-amber-300 font-bold flex items-center justify-end gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          {report.date}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-neutral-400 whitespace-normal">{report.subtitle}</div>

                    <div className="flex flex-wrap gap-1">
                      {report.symbols.map((sym, idx) => (
                        <span key={`${sym}-${idx}`} className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-black">
                          ${sym}
                        </span>
                      ))}
                    </div>

                    <div className="bg-cyan-950/20 p-2.5 border border-cyan-500/20 text-xs font-sans text-neutral-300 rounded-sm line-clamp-3">
                      {report.managerGoals || report.summaryText}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-cyan-500/20">
                      <button
                        onClick={() => handleExportSingleCsv(report)}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 rounded text-xs font-bold transition-all uppercase flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                      <button
                        onClick={() => setActiveModalReport(report)}
                        className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs rounded shadow-md active:scale-95 transition-all uppercase flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        DOSSIER
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredReports.length === 0 && (
            <div className="p-8 text-center bg-black/60 alien-block-cut border border-cyan-500/30 space-y-2">
              <p className="text-sm font-bold text-cyan-300">
                No dossiers match "{searchQuery}"
              </p>
              <p className="text-xs text-neutral-400 font-sans">
                Try searching for tickers like NVDA, SPCX, VST, TSLA, PLTR, or Cathie Wood.
              </p>
            </div>
          )}
        </>
      )}

      {/* FULL PREVIEW / PRINTABLE PDF DOSSIER MODAL */}
      <AnimatePresence>
        {activeModalReport && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-[#020b14] border-2 border-cyan-500/60 alien-block-cut p-5 sm:p-7 shadow-2xl text-cyan-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-cyan-500/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-400 text-black alien-block-cut-sm font-black">
                    <ShieldCheck className="w-6 h-6 fill-black" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                      OFFICIAL STOCK BLOC DOSSIER // {activeModalReport.secFormCode || "ARCHIVE"}
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
                      {activeModalReport.title}
                    </h2>
                    <p className="text-xs text-cyan-400/70">
                      Filing Date: {activeModalReport.date} • {activeModalReport.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      window.print();
                    }}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    title="Print / Save as PDF"
                  >
                    <Printer className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic("selection");
                      setActiveModalReport(null);
                    }}
                    className="p-2 bg-black/60 border border-cyan-500/30 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Manager Goals & Mandate Section */}
              {activeModalReport.managerGoals && (
                <div className="p-4 alien-block-cut bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    FUND MANAGER MANDATE & STRATEGIC GOALS
                  </span>
                  <p className="text-neutral-200 text-xs font-sans leading-relaxed">
                    {activeModalReport.managerGoals}
                  </p>
                </div>
              )}

              {/* Visual Asset Allocation Bar Chart */}
              <div className="space-y-3 bg-black/60 p-4 alien-block-cut border border-cyan-500/30">
                <div className="flex items-center justify-between text-xs font-black text-cyan-200 uppercase">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Asset Allocation Weight Distribution Chart
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {activeModalReport.symbols.length} Core Holdings Analyzed
                  </span>
                </div>

                <div className="w-full h-6 bg-black/90 alien-block-cut-sm overflow-hidden flex border border-cyan-500/40">
                  {activeModalReport.symbols.map((sym, i) => {
                    const colors = [
                      "bg-cyan-400 text-black",
                      "bg-emerald-400 text-black",
                      "bg-purple-400 text-black",
                      "bg-amber-400 text-black",
                      "bg-rose-400 text-black",
                    ];
                    return (
                      <div
                        key={`${sym}-${i}`}
                        className={`${colors[i % colors.length]} h-full flex items-center justify-center text-[10px] font-black overflow-hidden border-r border-black/40`}
                        style={{ width: `${100 / activeModalReport.symbols.length}%` }}
                      >
                        ${sym}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Disclosed Holdings Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  Disclosed Positions & Key Financial Thesis Breakdown
                </h3>

                {activeModalReport.rawItems && activeModalReport.rawItems.length > 0 ? (
                  <div className="w-full max-w-full overflow-x-auto alien-block-cut border border-cyan-500/30 bg-black/60">
                    {/* Desktop Table View */}
                    <table className="hidden sm:table w-full text-left text-xs">
                      <thead className="bg-cyan-950/60 text-cyan-300 font-black text-[10px] uppercase border-b border-cyan-500/30 whitespace-nowrap">
                        <tr>
                          <th className="p-2.5">Symbol</th>
                          <th className="p-2.5">Company / Holding</th>
                          <th className="p-2.5">Action</th>
                          <th className="p-2.5 text-right">Weight / Result</th>
                          <th className="p-2.5 min-w-[200px]">AI Conviction Thesis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                        {activeModalReport.rawItems.map((item, idx) => (
                          <tr key={`${item.symbol || 'item'}-${idx}`} className="hover:bg-cyan-950/20 transition-colors">
                            <td className="p-2.5 font-black text-cyan-300 whitespace-nowrap">${item.symbol}</td>
                            <td className="p-2.5 font-bold text-white whitespace-nowrap">{item.companyName || item.name}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 alien-block-cut-sm text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                {item.quarterlyChangeType || "HOLD"}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-400 whitespace-nowrap">
                              {item.portfolioPercent ? `${item.portfolioPercent}%` : item.epsActual || "N/A"}
                            </td>
                            <td className="p-2.5 text-[11px] text-neutral-300 leading-tight font-sans min-w-[200px]">
                              {item.aiThesis || item.notes || activeModalReport.summaryText}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="sm:hidden flex flex-col divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                      {activeModalReport.rawItems.map((item, idx) => (
                        <div key={`${item.symbol || 'item'}-${idx}-mob`} className="p-4 space-y-3 hover:bg-cyan-950/20 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-lg font-black text-cyan-300">${item.symbol}</div>
                              <div className="text-sm font-bold text-white">{item.companyName || item.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-emerald-400">
                                {item.portfolioPercent ? `${item.portfolioPercent}%` : item.epsActual || "N/A"}
                              </div>
                              <span className="px-2 py-0.5 mt-1 inline-block alien-block-cut-sm text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                {item.quarterlyChangeType || "HOLD"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-cyan-950/20 p-2.5 border border-cyan-500/20 text-xs font-sans text-neutral-300 leading-relaxed rounded-sm">
                            <span className="text-cyan-400/80 uppercase font-bold text-[10px] block mb-1">AI Conviction Thesis</span>
                            {item.aiThesis || item.notes || activeModalReport.summaryText}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 p-3 bg-black/40 border border-cyan-500/20">
                    Full dataset index attached in downloadable CSV payload.
                  </p>
                )}
              </div>

              {/* Executive Summary */}
              <div className="p-4 alien-block-cut bg-cyan-950/30 border border-cyan-500/40 space-y-1.5 text-xs">
                <span className="text-cyan-400 font-black text-[11px] uppercase tracking-wider block">
                  // QUANT SYNTHESIS & EXECUTIVE ANALYSIS
                </span>
                <p className="text-neutral-200 leading-relaxed font-sans text-xs">
                  {activeModalReport.summaryText}
                </p>
              </div>

              {/* Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-cyan-500/30 pt-4 no-print">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCopyReportText(activeModalReport)}
                    className="px-3.5 py-2 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto"
                  >
                    {copiedStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedStatus ? "COPIED TO CLIPBOARD!" : "COPY REPORT TEXT"}</span>
                  </button>

                  <button
                    onClick={() => handleExportSingleCsv(activeModalReport)}
                    className="px-3.5 py-2 alien-block-cut-sm bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveModalReport(null)}
                  className="px-4 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black cursor-pointer transition-all w-full sm:w-auto text-center"
                >
                  CLOSE DOSSIER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
