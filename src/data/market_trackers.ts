import { IpoTrackerItem, MaTrackerItem, RegulatoryCaptureItem } from "../types";

export const IPO_TRACKER_DATA: IpoTrackerItem[] = [
  {
    id: "ipo_coreweave",
    companyName: "CoreWeave Inc.",
    symbolPlaceholder: "CWVE",
    expectedValuation: "$35.0 Billion",
    status: "Filed S-1",
    filingDate: "Expected Late 2026",
    sector: " Cloud Infrastructure",
    leadUnderwriters: ["Morgan Stanley", "JPMorgan", "Goldman Sachs"],
    description:
      "Specialized cloud provider deploying tens of thousands of NVIDIA Blackwell GPUs for hyperscalers and labs.",
    keyMetrics: [
      { label: "Revenue Growth", value: "+300% YoY" },
      { label: "GPU Capacity", value: "100,000+ H100/B200s" },
      { label: "Major Backer", value: "NVIDIA & Magnetar Capital" },
    ],
    strategicRationale:
      "Pure play infrastructure proxy for the compute boom with massive contracted revenue backlog.",
    signal: "Bullish",
  },
  {
    id: "ipo_cerebras",
    companyName: "Cerebras Systems",
    symbolPlaceholder: "CBRS",
    expectedValuation: "$8.2 Billion",
    status: "Filed S-1",
    filingDate: "S-1 Filed / Pending SEC Review",
    sector: "Wafer Scale Chips",
    leadUnderwriters: ["Citigroup", "Barclays"],
    description:
      "Creator of the Wafer Scale Engine (WSE-3), the largest single silicon chip designed specifically for massive model training and ultra-fast inference.",
    keyMetrics: [
      { label: "Chip Size", value: "56x Larger than standard GPU" },
      { label: "Transistor Count", value: "4 Trillion" },
      { label: "Key Customer", value: "G42 & Enterprise Labs" },
    ],
    strategicRationale:
      "Provides radical alternative architecture to NVIDIA GPUs, offering 10x inference latency advantages for large language models.",
    signal: "Bullish",
  },
  {
    id: "ipo_stripe",
    companyName: "Stripe Inc.",
    symbolPlaceholder: "STRP",
    expectedValuation: "$70.0 Billion",
    status: "Expected Q3/Q4",
    filingDate: "Direct Listing / IPO Tender Offer",
    sector: "Global Payments & FinTech",
    leadUnderwriters: ["Goldman Sachs", "JPMorgan"],
    description:
      "Global financial infrastructure platform processing over $1 Trillion in payment volume for internet businesses, SaaS platforms, and enterprise marketplaces.",
    keyMetrics: [
      { label: "Total Volume", value: "$1.0+ Trillion" },
      { label: "Free Cash Flow", value: "Positive ($1B+)" },
      { label: "Net Revenue Growth", value: "+28% YoY" },
    ],
    strategicRationale:
      "The ultimate payment rail for online commerce and subscriptions with deep regulatory licenses across 40+ countries.",
    signal: "Bullish",
  },
  {
    id: "ipo_databricks",
    companyName: "Databricks",
    symbolPlaceholder: "DBX",
    expectedValuation: "$43.0 Billion",
    status: "Rumored",
    filingDate: "Confidential Filing Expected",
    sector: "Data Lakehouse & Enterprise ",
    leadUnderwriters: ["Morgan Stanley", "Goldman Sachs"],
    description:
      "Unified data analytics and enterprise platform enabling companies to build custom generative models on proprietary data.",
    keyMetrics: [
      { label: "Annual Run-Rate", value: "$2.4 Billion" },
      { label: "Growth Rate", value: "50%+ YoY" },
      { label: "Customers >$1M", value: "400+ Enterprises" },
    ],
    strategicRationale:
      "Essential enterprise data backbone required before companies can deploy generative agents safely.",
    signal: "Bullish",
  },
  {
    id: "ipo_dxyz_openai",
    companyName: "Destiny Tech100 ($SPCX) / OpenAI Proxy",
    symbolPlaceholder: "SPCX / OPENAI",
    expectedValuation: "$100.0+ Billion",
    status: "Priced",
    filingDate: "Active Traded Proxy Fund",
    sector: "Generative Research",
    leadUnderwriters: ["NYSE Traded Fund"],
    description:
      "Pre IPO venture fund providing public stock market exposure to private unicorn leaders like OpenAI, SpaceX, Stripe, and Axiom Space.",
    keyMetrics: [
      { label: "OpenAI Exposure", value: "~10% Portfolio Weight" },
      { label: "SpaceX Exposure", value: "~35% Portfolio Weight" },
      { label: "Public Ticker", value: "$SPCX" },
    ],
    strategicRationale:
      "Public market gateway to trade OpenAI and SpaceX private equity valuations before formal S-1 filings.",
    signal: "High Volatility",
  },
  {
    id: "ipo_starlink",
    companyName: "Starlink (SpaceX Spin-Off)",
    symbolPlaceholder: "STRL",
    expectedValuation: "$120.0 Billion",
    status: "Rumored",
    filingDate: "Spin-off Under Consideration",
    sector: "Low-Earth Orbit Satellite Telecom",
    leadUnderwriters: ["Morgan Stanley", "Bank of America"],
    description:
      "World leading satellite internet constellation delivering high speed broadband globally to military, aviation, maritime, and rural consumer markets.",
    keyMetrics: [
      { label: "Active Satellites", value: "6,000+ LEO" },
      { label: "Subscribers", value: "4.0+ Million" },
      { label: "Cash Flow", value: "Operating Breakeven Exceeded" },
    ],
    strategicRationale:
      "Monopoly position in global orbital satellite internet with recurring subscription revenue stream.",
    signal: "Bullish",
  },
];

export const MA_TRACKER_DATA: MaTrackerItem[] = [
  {
    id: "ma_synopsys_ansys",
    acquirerName: "Synopsys Inc.",
    acquirerSymbol: "SNPS",
    targetName: "Ansys Inc.",
    targetSymbol: "ANSS",
    dealValue: "$35.0 Billion",
    dealType: "Cash & Stock",
    status: "Pending Regulatory Approval",
    expectedClose: "H1 2026",
    arbitrageSpreadPercent: 4.2,
    regulatoryBodies: [
      "FTC (USA)",
      "EU Competition Commission",
      "SAMR (China)",
    ],
    strategicRationale:
      "Combines semiconductor Electronic Design Automation (EDA) with engineering simulation software to create an end to end silicon-to-systems design monopoly for chips.",
    antitrustRiskLevel: "Moderate",
  },
  {
    id: "ma_capitalone_discover",
    acquirerName: "Capital One Financial",
    acquirerSymbol: "COF",
    targetName: "Discover Financial Services",
    targetSymbol: "DFS",
    dealValue: "$35.3 Billion",
    dealType: "All-Stock",
    status: "Under FTC/DOJ Review",
    expectedClose: "Late 2026",
    arbitrageSpreadPercent: 6.8,
    regulatoryBodies: [
      "Federal Reserve Board",
      "OCC",
      "DOJ Antitrust Division",
    ],
    strategicRationale:
      "Creates the largest credit card issuer in the US while giving Capital One ownership of Discover's proprietary payments network, breaking the Visa/Mastercard duopoly.",
    antitrustRiskLevel: "High",
  },
  {
    id: "ma_amd_zt",
    acquirerName: "Advanced Micro Devices",
    acquirerSymbol: "AMD",
    targetName: "ZT Systems",
    dealValue: "$4.9 Billion",
    dealType: "Cash & Stock",
    status: "Pending Regulatory Approval",
    expectedClose: "Q3 2026",
    arbitrageSpreadPercent: 2.1,
    regulatoryBodies: ["DOJ Antitrust Division", "HSR Clearance"],
    strategicRationale:
      "Accelerates AMD's rack scale system engineering capability to compete directly with NVIDIA NVL72 server architectures for hyperscale datacenters.",
    antitrustRiskLevel: "Low",
  },
  {
    id: "ma_vistra_energyharbor",
    acquirerName: "Vistra Corp.",
    acquirerSymbol: "VST",
    targetName: "Energy Harbor Nuclear Fleet",
    dealValue: "$6.3 Billion",
    dealType: "Cash & Stock",
    status: "Completed",
    expectedClose: "Closed & Integrated",
    arbitrageSpreadPercent: 0,
    regulatoryBodies: ["Nuclear Regulatory Commission (NRC)", "FERC"],
    strategicRationale:
      "Created the 2nd largest competitive nuclear power generator in the US, locking up 4,000+ MW of zero carbon baseload power for hyperscale datacenters.",
    antitrustRiskLevel: "Low",
  },
  {
    id: "ma_hpe_juniper",
    acquirerName: "Hewlett Packard Enterprise",
    acquirerSymbol: "HPE",
    targetName: "Juniper Networks",
    targetSymbol: "JNPR",
    dealValue: "$14.0 Billion",
    dealType: "All-Cash",
    status: "Pending Regulatory Approval",
    expectedClose: "Q3 2026",
    arbitrageSpreadPercent: 3.5,
    regulatoryBodies: ["DOJ Antitrust", "UK CMA", "EU Commission"],
    strategicRationale:
      "Doubles HPE's networking business and integrates Juniper Mist architecture to power next gen enterprise datacenter fabrics.",
    antitrustRiskLevel: "Moderate",
  },
];

export const REGULATORY_CAPTURE_DATA: RegulatoryCaptureItem[] = [
  {
    id: "reg_msft_openai",
    companyName: "Microsoft Corporation",
    symbol: "MSFT",
    regulatoryAgencies: ["FTC (USA)", "CMA (UK)", "EU Antitrust Commission"],
    regulatoryMoatRating: 9.5,
    moatType: "Antitrust Defense",
    description:
      "Navigated global antitrust inquiries into its $13B OpenAI investment by structuring non voting board observer status while maintaining exclusivity on Azure cloud infrastructure.",
    keyPolicyDevelopments: [
      "FTC Inquiry structured around non-exclusive IP cloud hosting agreements",
      "UK CMA cleared initial partnership phase, solidifying Azure's enterprise lock-in",
      "EU Act compliance framework established early via Microsoft Azure safety guardrails",
    ],
    lobbyingImpactScore: "Dominant Moat",
    govContractValue: "$10.0B+ (JEDI/JWCC Federal Defense Cloud)",
  },
  {
    id: "reg_nvda_bis",
    companyName: "NVIDIA Corporation",
    symbol: "NVDA",
    regulatoryAgencies: [
      "BIS (Bureau of Industry and Security)",
      "U.S. Dept of Commerce",
    ],
    regulatoryMoatRating: 9.2,
    moatType: "Export Controls",
    description:
      "National security export controls on chips create massive barriers to entry for foreign competitors, forcing global hyperscalers to buy US-sanctioned GPU models.",
    keyPolicyDevelopments: [
      "US Commerce Department export bans restrict rival chips from foreign markets",
      "Custom compliant architectures (H20/B20) maintain legal sales channels",
      "Deep alignment with US Safety Institute and DARPA supercomputing programs",
    ],
    lobbyingImpactScore: "Dominant Moat",
    govContractValue: "$2.5B+ (DOE & National Labs Supercomputers)",
  },
  {
    id: "reg_oklo_nrc",
    companyName: "Oklo Inc. & Nuclear SMR Leaders",
    symbol: "OKLO",
    regulatoryAgencies: [
      "NRC (Nuclear Regulatory Commission)",
      "FERC",
      "U.S. Dept of Energy",
    ],
    regulatoryMoatRating: 9.8,
    moatType: "Licensing Barrier",
    description:
      "NRC nuclear licensing process requires 3-5 years and hundreds of millions in regulatory filings, creating an unbreakable moat for first-movers with approved SMR reactor designs.",
    keyPolicyDevelopments: [
      "NRC Modernization Act signed by Congress to accelerate advanced reactor reviews",
      "INL (Idaho National Lab) site use permit granted for Oklo Aurora powerhouse",
      "DOE fuel allocation program secures High-Assay Low-Enriched Uranium (HALEU)",
    ],
    lobbyingImpactScore: "Dominant Moat",
    govContractValue: "$1.2B (DOE Advanced Reactor Demonstration Program)",
  },
  {
    id: "reg_visa_ccca",
    companyName: "Visa Inc. & Mastercard",
    symbol: "V",
    regulatoryAgencies: ["U.S. Senate Judiciary", "FTC", "CFPB"],
    regulatoryMoatRating: 8.8,
    moatType: "Government Mandate",
    description:
      "Fended off Credit Card Competition Act routing mandates while maintaining multi trillion dollar transaction processing volume and bank issuer exclusivity.",
    keyPolicyDevelopments: [
      "Durbin Amendment swipe fee caps stalled in Congressional committee",
      "CFPB open banking regulations favor established security tokenization standards",
      "Mastercard & Visa tokenized network standard required by major US banking apps",
    ],
    lobbyingImpactScore: "High Protection",
  },
  {
    id: "reg_asml_euv",
    companyName: "ASML Holding NV",
    symbol: "ASML",
    regulatoryAgencies: [
      "Dutch Ministry of Foreign Affairs",
      "US BIS",
      "EU Trade Council",
    ],
    regulatoryMoatRating: 10.0,
    moatType: "Export Controls",
    description:
      "Global geopolitical treaties prohibit export of High-NA EUV scanners to non-allied nations, enforcing ASML's status as an indispensable Western tech pillar.",
    keyPolicyDevelopments: [
      "Dutch government export license mandates restrict advanced EUV equipment export",
      "US CHIPS Act subsidies guarantee $50B+ foundry capital spending with ASML orders",
      "Zero substitute technology exists globally for sub-2nm lithography",
    ],
    lobbyingImpactScore: "Dominant Moat",
  },
];
