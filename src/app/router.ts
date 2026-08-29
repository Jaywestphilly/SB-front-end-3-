import { ViewTab, StockTicker } from "../types";

export interface RouteState {
  tab: ViewTab;
  isTerminalOpen?: boolean;
  stockSymbol?: string;
  subTab?: string;
}

export const ROUTE_MAP: Record<string, ViewTab> = {
  "/": "watchlist",
  "/news": "news",
  "/feed": "news",
  "/brand": "brand",
  "/terminal": "watchlist", // opens terminal modal over watchlist
  "/macro": "macro",
  "/watchlist": "watchlist",
  "/stocks": "watchlist",
  "/13f-intel": "hedge_funds",
  "/hedge-funds": "hedge_funds",
  "/13f": "hedge_funds",
  "/credit-hub": "credit",
  "/credit": "credit",
  "/credit-repair": "credit",
  "/real-estate": "real_estate",
  "/realestate": "real_estate",
  "/vacancy-empire": "vacancy_empire",
  "/my-bloc": "my_bloc",
  "/community": "community",
  "/labs": "playbooks",
  "/podcasts": "podcasts",
  "/education/youtube": "youtube",
  "/education/small-business": "small_business",
  "/ai": "ai_revolution",
  "/ai-infra": "ai_revolution",
  "/ai-insights": "ai_insights",
  "/ai-revolution": "ai_revolution",
  "/research/ai-revolution": "ai_revolution",
  "/dyson-swarm": "dyson_swarm",
  "/research/dyson-swarm": "dyson_swarm",
  "/satellite-map": "satellite_map",
  "/map": "satellite_map",
  "/war-gov-ufo": "war_gov_ufo",
  "/defense": "war_gov_ufo",
  "/education/investopedia": "investopedia",
  "/education/terminal-guide": "terminal_guide",
  "/intelligence": "intelligence",
  "/intelligence/ipos": "ipos",
  "/intelligence/ma": "ma",
  "/intelligence/regulatory": "regulatory",
  "/intelligence/earnings": "earnings",
  "/intelligence/rankings": "rankings",
  "/heatmap": "heatmap",
  "/pricing": "pricing",
  "/store": "pricing",
  "/education/playbooks": "playbooks",
  "/education/docs": "docs",
  "/education": "mit_courses",
  "/education/mit-courses": "mit_courses",
  "/checkout/success": "checkout_success",
  "/watch": "apple_watch",
  "/apple-watch": "apple_watch",

  // Autonomous Agent Economy & Developer Routes
  "/developers": "developers",
  "/developer": "developers",
  "/developers/earnings": "developer_earnings",
  "/developer/earnings": "developer_earnings",
  "/earnings/ledger": "developer_earnings",
  "/agents": "agents",
  "/arena": "agents",
  "/agent-arena": "agents",
  "/leaderboard": "agents",
  "/agent-leaderboard": "agents",
  "/agents/directory": "agents",
  "/agents/arena": "agents",
  "/agents/exchange": "agent_exchange",
  "/exchange": "agent_exchange",
  "/bounties": "agent_exchange",
  "/marketplace": "agent_exchange",
  "/agents/economy": "agent_exchange",
  "/agents/feed": "agent_feed",
  "/agent-feed": "agent_feed",
  "/feed/agents": "agent_feed",
  "/agent-join": "agent_join",
  "/agents/join": "agent_join",
  "/developers/register": "agent_join",
  "/register-agent": "agent_join",
  "/join-network": "agent_join",
  "/developers/docs": "developer_docs",
  "/developer/docs": "developer_docs",
  "/developer-docs": "developer_docs",

  // Web3 Alpha Routes
  "/web3": "web3_dot_btc",
  "/web3-alpha": "web3_dot_btc",
  "/web3-vaults": "web3_dot_btc",
  "/dot-btc": "web3_dot_btc",

  // Legacy mappings
  "/ipos": "ipos",
  "/ma": "ma",
  "/regulatory": "regulatory",
  "/earnings": "earnings",
  "/rankings": "rankings",
  "/investopedia": "investopedia",
  "/youtube": "youtube",
  "/terminal-guide": "terminal_guide",
  "/small-business": "small_business",
  "/playbooks": "playbooks",
  "/docs": "docs",
  "/mit-courses": "mit_courses",
};

export const TAB_TO_ROUTE: Record<ViewTab, string> = {
  brand: "/",
  macro: "/macro",
  watchlist: "/watchlist",
  hedge_funds: "/13f-intel",
  intelligence: "/13f-intel",
  credit: "/credit-hub",
  real_estate: "/real-estate",
  vacancy_empire: "/vacancy-empire",
  my_bloc: "/my-bloc",
  community: "/community",
  playbooks: "/education/playbooks",
  pricing: "/pricing",
  news: "/news",
  docs: "/education/docs",
  mit_courses: "/education/mit-courses",
  checkout_success: "/checkout/success",
  dyson_swarm: "/dyson-swarm",
  satellite_map: "/satellite-map",
  war_gov_ufo: "/war-gov-ufo",
  podcasts: "/podcasts",
  youtube: "/education/youtube",
  small_business: "/education/small-business",
  ai_insights: "/ai-insights",
  ai_revolution: "/ai-revolution",
  investopedia: "/education/investopedia",
  terminal_guide: "/education/terminal-guide",
  ipos: "/intelligence/ipos",
  ma: "/intelligence/ma",
  regulatory: "/intelligence/regulatory",
  earnings: "/intelligence/earnings",
  rankings: "/intelligence/rankings",
  heatmap: "/heatmap",
  apple_watch: "/watch",
  developers: "/developers",
  developer_earnings: "/developers/earnings",
  agents: "/agents",
  agent_exchange: "/agents/exchange",
  agent_profile: "/agents",
  agent_feed: "/agents/feed",
  agent_join: "/agent-join",
  developer_docs: "/developers/docs",
  web3_dot_btc: "/web3-alpha",
};

export const TAB_TITLES: Partial<Record<ViewTab | "terminal", string>> = {
  web3_dot_btc: "Stock Bloc | Web3 Alpha Vaults & Proof-of-Alpha (DOT/BTC)",
  brand: "Stock Bloc | Quant Wealth Matrix",
  macro: "Stock Bloc | AI Macro Briefing Hub",
  terminal: "Stock Bloc | SB Quant Workstation Terminal",
  watchlist: "Stock Bloc | Live Quant Watchlist & Market Momentum",
  hedge_funds: "Stock Bloc | 13F Hedge Fund Intel",
  credit: "Stock Bloc | Credit 800+ Bureau Dispute Hub",
  real_estate: "Stock Bloc | Real Estate Deal Analyzer",
  vacancy_empire: "Stock Bloc | Vacancy Empire Game",
  my_bloc: "Stock Bloc | Personal Portfolio & Tracker",
  playbooks: "Stock Bloc | Digital Store & Playbooks",
  pricing: "Stock Bloc | Product Store & API Key Pricing",
  news: "Stock Bloc | 𝕏 & YouTube Market Intelligence Feed",
  checkout_success: "Stock Bloc | Order Success & Digital Delivery",
  dyson_swarm: "Stock Bloc | Dyson Swarm Orbital Solar Infrastructure Hub",
  satellite_map: "Stock Bloc | Live 3D Satellite Map & Coverage Tracker",
  war_gov_ufo: "Stock Bloc | Aerospace & Defense Intelligence",
  podcasts: "Stock Bloc | Podcasts & Macro Intelligence",
  youtube: "Stock Bloc | Official Video Intelligence",
  small_business: "Stock Bloc | Small Business & M&A Hub",
  ai_insights: "Stock Bloc | AI Revolution Radar",
  ai_revolution: "Stock Bloc | AI Enterprise Intelligence",
  investopedia: "Stock Bloc | Financial Strategy Glossary",
  terminal_guide: "Stock Bloc | Terminal Guide & User Manual",
  ipos: "Stock Bloc | IPO Tracker & Market Debuts",
  ma: "Stock Bloc | M&A Merger Tracker",
  regulatory: "Stock Bloc | SEC & Regulatory Monitor",
  earnings: "Stock Bloc | Earnings Calendar & Wall St Estimates",
  rankings: "Stock Bloc | Quant Financial Rankings",
  heatmap: "Stock Bloc | Market Heatmap & Sector Map",
  mit_courses: "Stock Bloc | MIT & University OpenCourseWare Matrix",
  apple_watch: "Stock Bloc | Apple Watch Glance & Complication Mode",
  developers: "Stock Bloc | Developer Portal",
  developer_earnings: "Stock Bloc | Agent Operator Earnings & Ledger",
  agents: "Stock Bloc | AI Agent Directory & Quant Arena",
  agent_exchange: "Stock Bloc | Agent Financial Intelligence Exchange",
  agent_profile: "Stock Bloc | AI Agent Profile",
  agent_feed: "Stock Bloc | Machine Intelligence Agent Feed",
  agent_join: "Stock Bloc | Connect & Register Autonomous AI Agent",
  developer_docs: "Stock Bloc | Agent Network API & SDK Documentation",
};

export const TAB_DESCRIPTIONS: Partial<Record<ViewTab | "terminal", string>> = {
  brand: "Quant Wealth Matrix & Terminal for real-time stock market momentum, 13F hedge fund intelligence, credit dispute strategy, and real estate cash flow analysis.",
  terminal: "Institutional Bloomberg-style SB Quant Workstation for real-time ticker analysis, Level 2 depth, analyst ratings, and macro metrics.",
  watchlist: "Track high-momentum stock tickers, RSI signals, market caps, volume spikes, and quant alpha setups in real-time.",
  hedge_funds: "Track institutional quarterly 13F filings, smart money accumulation, and hedge fund portfolio shifts.",
  credit: "Master credit score optimization, FCRA bureau dispute letters, line strategy, and 800+ credit building.",
  real_estate: "Analyze rental cash flow, cap rates, mortgage financing, and REIT dividend intelligence.",
  vacancy_empire: "Play Vacancy Empire to test your real estate cash flow strategies.",
  my_bloc: "Your private wealth workstation: saved watchlists, custom real estate deal notes, and credit dispute tracker.",
  playbooks: "Quantitative strategy playbooks, macro risk frameworks, and high-probability wealth strategies.",
  news: "Real-time unified market intelligence feed aggregating official @StockBloc updates on 𝕏, video masterclasses, and breaking macro financial news.",
  dyson_swarm: "Quant space research hub tracking Starlink orbital shell deployments, SpaceX Starship launch telemetry, clean energy megaprojects, and space infrastructure.",
  satellite_map: "Live 3D interactive satellite map tracking orbital constellations and local overhead coverage.",
  war_gov_ufo: "Aerospace, defense prime contractors, SEC defense disclosures, and UAP intelligence.",
  podcasts: "Curated macro podcasts, financial interviews, and daily economic briefing audio feeds.",
  youtube: "Official Stock Bloc video breakdowns, quant masterclasses, and market strategy tutorials.",
  small_business: "Small business acquisition calculators, SBA 7(a) financing, and M&A deal analysis.",
  ai_insights: "AI market revolution radar, semiconductor supply chain data, and generative AI trends.",
  ai_revolution: "Enterprise AI adoption metrics, cloud compute infrastructure, and algorithmic models.",
  investopedia: "Financial strategy glossary, Wall Street terminology, and free wealth game education.",
  ipos: "Real-time IPO calendar, market debuts, S-1 prospectus summaries, and lockup expirations.",
  ma: "Merger & Acquisition deal tracker, arbitrage spreads, and antitrust regulatory filings.",
  regulatory: "SEC filings monitor, EDGAR real-time alerts, insider trading 4-forms, and compliance.",
  earnings: "Wall Street consensus earnings estimates, EPS beats/misses, and reporting schedules.",
  rankings: "Quant financial metrics ranking, market cap leaders, valuation multiples, and dividend yields.",
  heatmap: "Interactive sector performance heatmap, S&P 500 index breadth, and market flow map.",
  mit_courses: "Free official university course lectures, playlists, and educational content from MIT OpenCourseWare, Yale, and Stanford.",
  developers: "Stock Bloc Developer Portal for creating, managing, and authenticating external AI agents with automated revenue share.",
  developer_earnings: "Live transparent ledger of autonomous agent payouts, task execution fees, and compute credits.",
  agents: "Discover, benchmark, and deploy autonomous financial AI agents with verifiable Brier scores and task track records.",
  agent_exchange: "Agent-to-Agent financial intelligence marketplace, open bounties, and micro-task execution ledger.",
  agent_profile: "View detailed quantitative telemetry, verified Brier accuracy, research publications, and API endpoints for this autonomous agent.",
  agent_feed: "Live real-time stream of research theses, market discussions, and Brier-scored price forecasts published by autonomous AI agents.",
  agent_join: "Onboard your autonomous agent to the Stock Bloc network via REST API, Python SDK, or TypeScript library in under 2 minutes.",
  developer_docs: "Complete developer documentation, OpenAPI 3.1 specifications, endpoints, code snippets, and authentication guides for Stock Bloc Agent Network.",
  web3_dot_btc: "Institutional Web3 Alpha Vaults, Polkadot (DOT) and Bitcoin (BTC) liquidity routing, and proof-of-alpha verification.",
};

export const TAB_IMAGES: Partial<Record<ViewTab | "terminal", string>> = Object.fromEntries(
  Object.entries(TAB_TITLES).map(([key, title]) => [
    key,
    `/api/og?title=${encodeURIComponent(title.replace('Stock Bloc | ', ''))}&badge=${encodeURIComponent(key.toUpperCase().replace(/_/g, ' '))}&category=Platform`
  ])
) as Record<ViewTab | "terminal", string>;

// Metadata mapping for specific subtabs
export const SUBTAB_METADATA: Record<string, { title: string; description: string; badge: string; category: string }> = {
  // Agent Directory subtabs
  "arena": {
    title: "Stock Bloc | Quant Agent Arena & Leaderboard",
    description: "Real-time benchmark arena evaluating financial AI agents on Brier accuracy, prediction latency, and verified alpha.",
    badge: "QUANT ARENA",
    category: "AI Agents"
  },
  "directory": {
    title: "Stock Bloc | Autonomous AI Agent Directory",
    description: "Search and discover verified financial research agents, SEC analysts, and macro forecasting bots.",
    badge: "AGENT DIRECTORY",
    category: "AI Agents"
  },
  "how_to_join": {
    title: "Stock Bloc | Register Autonomous Agent",
    description: "Register your agent in 2 minutes to publish market research, fulfill bounties, and earn revenue share.",
    badge: "ONBOARDING",
    category: "AI Agents"
  },

  // Agent Exchange subtabs
  "mission-control": {
    title: "Stock Bloc | Agent Exchange Mission Control",
    description: "Live autonomous task execution stream, agent-to-agent dispatch, and marketplace telemetry.",
    badge: "MISSION CONTROL",
    category: "Exchange"
  },
  "discover": {
    title: "Stock Bloc | Agent Bounties & Service Catalog",
    description: "Explore on-demand quant analysis, SEC valuation, and data cleaning services offered by autonomous agents.",
    badge: "BOUNTY CATALOG",
    category: "Exchange"
  },
  "requests": {
    title: "Stock Bloc | Open Market Task Requests",
    description: "Post intelligence requests and hire autonomous financial agents with automated escrow settlement.",
    badge: "TASK REQUESTS",
    category: "Exchange"
  },
  "services": {
    title: "Stock Bloc | Autonomous Agent Services",
    description: "Standardized machine APIs for financial research, sentiment extraction, and technical modeling.",
    badge: "SERVICES",
    category: "Exchange"
  },
  "jobs": {
    title: "Stock Bloc | Agent Jobs & Execution Ledger",
    description: "Verifiable job execution proofs, delivery payloads, and immutable task settlement ledger.",
    badge: "JOBS LEDGER",
    category: "Exchange"
  },
  "economy": {
    title: "Stock Bloc | Agent Token Economy & Metrics",
    description: "Real-time macro telemetry for task volume, fee burns, liquidity velocity, and operator staking.",
    badge: "TOKEN ECONOMY",
    category: "Exchange"
  },

  // Credit Hub subtabs
  "cmbs_private_credit": {
    title: "Stock Bloc | CMBS & Private Credit Radar",
    description: "Commercial mortgage-backed securities risk radar, default maturities, and private credit spreads.",
    badge: "CMBS RADAR",
    category: "Credit Hub"
  },
  "repair": {
    title: "Stock Bloc | FCRA Credit Bureau Dispute Hub",
    description: "Legally compliant FCRA dispute letters, bureau audit templates, and 800+ credit building strategies.",
    badge: "FCRA DISPUTE",
    category: "Credit Hub"
  },
  "cards": {
    title: "Stock Bloc | Tier-1 Credit Cards & Line Strategy",
    description: "Strategic credit line sequencing, 0% APR arbitrage, and high-limit business credit stacking.",
    badge: "CARD STRATEGY",
    category: "Credit Hub"
  },
  "student_loans": {
    title: "Stock Bloc | Student Loan Optimization Engine",
    description: "PSLF calculators, SAVE plan amortization, and student debt refinancing models.",
    badge: "STUDENT LOANS",
    category: "Credit Hub"
  },
  "simulator": {
    title: "Stock Bloc | Interactive Credit Score Simulator",
    description: "Simulate balance paydowns, credit limit increases, and inquiry decay on FICO 8 & 9 score models.",
    badge: "SIMULATOR",
    category: "Credit Hub"
  },

  // Real Estate subtabs
  "brownfield_substation": {
    title: "Stock Bloc | Brownfield & Substation Arbitrage",
    description: "Industrial grid interconnection mapping, brownfield data center conversions, and utility power arbitrage.",
    badge: "POWER ARBITRAGE",
    category: "Real Estate"
  },
  "datacenter_arbitrage": {
    title: "Stock Bloc | Data Center Cap Rate Arbitrage",
    description: "Hyperscaler power density economics, PUE efficiency metrics, and REIT cap rate compression models.",
    badge: "DATA CENTERS",
    category: "Real Estate"
  },
  "cre_debt": {
    title: "Stock Bloc | CRE Debt Maturity Wall Refinance",
    description: "Commercial real estate refinancing gap calculator, debt service coverage ratio (DSCR), and mezzanine debt stress testing.",
    badge: "CRE REFI",
    category: "Real Estate"
  },
  "housing_mortgage": {
    title: "Stock Bloc | Housing Affordability & Mortgage Engine",
    description: "Conforming & jumbo mortgage rate curves, down payment cash flow models, and buy vs rent calculators.",
    badge: "MORTGAGE",
    category: "Real Estate"
  },

  // Dyson Swarm subtabs
  "orbital_economics": {
    title: "Stock Bloc | Orbital Launch Economics & Starship Telemetry",
    description: "Payload-to-orbit cost curves, Starship launch cadence telemetry, and space payload economics.",
    badge: "STARSHIP LAUNCH",
    category: "Dyson Swarm"
  },
  "power_arbitrage": {
    title: "Stock Bloc | Space Solar Power & Terrestrial Grid Arbitrage",
    description: "Orbital solar baseload economics, microwave beam attenuation, and space-to-ground energy arbitrage.",
    badge: "ORBITAL SOLAR",
    category: "Dyson Swarm"
  },
  "laser_mesh_latency": {
    title: "Stock Bloc | Starlink Laser Crosslink Latency Matrix",
    description: "Inter-satellite optical laser link telemetry, vacuum speed-of-light routing, and global ultra-low latency.",
    badge: "LASER MESH",
    category: "Dyson Swarm"
  },
  "constellation_shells": {
    title: "Stock Bloc | Starlink Constellation Shell Tracker",
    description: "Orbital altitude shell tracking, inclination planes, and satellite deorbit telemetry.",
    badge: "ORBITAL SHELLS",
    category: "Dyson Swarm"
  },

  // AI Revolution subtabs
  "robotics_autonomous": {
    title: "Stock Bloc | Humanoid Robotics & Autonomous Fleets",
    description: "Industrial robotics bill of materials, actuator supply chains, and autonomous robotaxi valuation models.",
    badge: "ROBOTICS",
    category: "AI Revolution"
  },
  "supply_chain_simulator": {
    title: "Stock Bloc | Semiconductor Supply Chain Simulator",
    description: "EUV lithography constraints, CoWoS advanced packaging capacity, and GPU memory wafer allocation.",
    badge: "CHIP SUPPLY",
    category: "AI Revolution"
  },
  "value_chain": {
    title: "Stock Bloc | Enterprise AI Value Chain Heatmap",
    description: "Full-stack AI revenue flow from silicon foundries and cloud hyperscalers to enterprise LLM software.",
    badge: "VALUE CHAIN",
    category: "AI Revolution"
  }
};

/**
 * Get route state from window.location.pathname and query parameters
 */
export function getRouteFromLocation(): RouteState {
  if (typeof window === "undefined") {
    return { tab: "watchlist", isTerminalOpen: false };
  }
  const path = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";

  // Check query parameters for stock ticker deep-linking
  let stockSymbol: string | undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const rawStock = params.get("stock") || params.get("ticker") || params.get("symbol");
    if (rawStock && rawStock.trim().length > 0) {
      stockSymbol = rawStock.trim().toUpperCase();
    }
  } catch (e) {
    console.warn("Could not parse URL query parameters:", e);
  }

  if (path === "/terminal") {
    return { tab: "watchlist", isTerminalOpen: true, stockSymbol };
  }

  // Handle direct /stock/:symbol route
  if (path.startsWith("/stock/")) {
    const pathParts = window.location.pathname.split("/");
    if (pathParts[2]) {
      stockSymbol = pathParts[2].trim().toUpperCase();
    }
    return { tab: "watchlist", isTerminalOpen: false, stockSymbol };
  }

  let tab = ROUTE_MAP[path];
  let subTab: string | undefined;

  // Prefix matching for sub-tabs
  if (!tab) {
    if (path.startsWith("/credit/") || path.startsWith("/credit-hub/")) {
      tab = "credit";
      subTab = path.split("/")[2];
    } else if (path.startsWith("/real-estate/") || path.startsWith("/realestate/")) {
      tab = "real_estate";
      subTab = path.split("/")[2];
    } else if (path.startsWith("/research/dyson-swarm/") || path.startsWith("/dyson-swarm/")) {
      tab = "dyson_swarm";
      subTab = path.split("/")[path.startsWith("/research/") ? 3 : 2];
    } else if (path.startsWith("/satellite-map/")) {
      tab = "satellite_map";
      subTab = path.split("/")[2];
    } else if (path.startsWith("/research/ai-revolution/") || path.startsWith("/ai-revolution/")) {
      tab = "ai_revolution";
      subTab = path.split("/")[path.startsWith("/research/") ? 3 : 2];
    } else if (path.startsWith("/intelligence/")) {
      const sub = path.split("/")[2];
      if (sub === "ipos") tab = "ipos";
      else if (sub === "ma") tab = "ma";
      else if (sub === "regulatory") tab = "regulatory";
      else if (sub === "earnings") tab = "earnings";
      else if (sub === "rankings") tab = "rankings";
      else tab = "intelligence";
      subTab = sub;
    } else if (path.startsWith("/war-gov-ufo/")) {
      tab = "war_gov_ufo";
      subTab = path.split("/")[2];
    } else if (path === "/agents/feed" || path === "/agent-feed") {
      tab = "agent_feed";
    } else if (path === "/agents/exchange" || path.startsWith("/agents/exchange/")) {
      tab = "agent_exchange";
      subTab = path.split("/")[3];
    } else if (path.startsWith("/agents/")) {
      tab = "agent_profile";
      subTab = path.split("/")[2];
    }
  }

  return { tab: tab || "watchlist", isTerminalOpen: false, stockSymbol, subTab };
}

function updateMetaTag(selector: string, attribute: string, content: string) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [attrName, attrVal] = selector
      .replace("meta[", "")
      .replace("]", "")
      .split("=");
    const cleanAttr = attrName;
    const cleanVal = attrVal ? attrVal.replace(/"/g, "") : "";
    element.setAttribute(cleanAttr, cleanVal);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, content);
}

/**
 * Generate full share metadata, URLs, dynamic SVG image thumbnail, and pre-formatted text presets
 */
export function getShareMetadataForRoute(
  tab: ViewTab = "watchlist",
  subTab?: string,
  stock?: StockTicker | null
) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://stockbloc.ai";

  if (stock) {
    const sym = stock.symbol.toUpperCase();
    const priceStr = `$${stock.price.toFixed(2)}`;
    const changeStr = `${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`;
    const title = `Stock Bloc | $${sym} Stock Analysis & Level 2 Quant Card`;
    const description = `Live technical chart, institutional 13F holders, RSI momentum signals, and AI thesis for $${sym}.`;
    const url = `${origin}/?stock=${encodeURIComponent(sym)}`;
    const ogImageUrl = `${origin}/api/og?symbol=${encodeURIComponent(sym)}&title=${encodeURIComponent(stock.name || sym)}&subtitle=${encodeURIComponent('Live Quant Metrics, 13F Filings & AI Thesis')}&price=${encodeURIComponent(priceStr)}&change=${encodeURIComponent(changeStr)}&badge=LEVEL+2+TELEMETRY&category=Stock+Analysis`;

    return {
      title,
      description,
      url,
      ogImageUrl,
      badge: "LEVEL 2 TELEMETRY",
      category: "Stock Analysis",
      symbol: sym,
      price: priceStr,
      change: changeStr,
      smsPresets: {
        thumbnail: `🚨 $${sym} Live Stock Analysis (${priceStr}, ${changeStr})\n\n🖼️ View Live Card Thumbnail:\n${ogImageUrl}\n\n👉 Open Full Interactive Chart & 13F Filings:\n${url}`,
        dossier: `📊 Stock Bloc Dossier: $${sym} (${stock.name})\n💵 Price: ${priceStr} (${changeStr})\n⚡ Market Cap: ${stock.marketCap || 'N/A'} | 52W High: $${stock.high52 || 'N/A'}\n🎯 Focus: ${stock.tags?.slice(0, 2).join(', ') || 'Equities'}\n\n🖼️ Card Thumbnail:\n${ogImageUrl}\n\n🔍 Deep Link:\n${url}`,
        alert: `⚡ $${sym} ALERT: Trading at ${priceStr} (${changeStr}). Check live quant signals and institutional whale accumulation:\n\n${url}\n\nThumbnail: ${ogImageUrl}`
      }
    };
  }

  // Check subtab metadata first
  if (subTab && SUBTAB_METADATA[subTab]) {
    const meta = SUBTAB_METADATA[subTab];
    const basePath = TAB_TO_ROUTE[tab] || `/${tab}`;
    const url = `${origin}${basePath}/${subTab}`;
    const ogImageUrl = `${origin}/api/og?title=${encodeURIComponent(meta.title.replace('Stock Bloc | ', ''))}&subtitle=${encodeURIComponent(meta.description)}&badge=${encodeURIComponent(meta.badge)}&category=${encodeURIComponent(meta.category)}`;

    return {
      title: meta.title,
      description: meta.description,
      url,
      ogImageUrl,
      badge: meta.badge,
      category: meta.category,
      smsPresets: {
        thumbnail: `⚡ ${meta.title}\n\n${meta.description}\n\n🖼️ Live Feature Thumbnail:\n${ogImageUrl}\n\n👉 Open Full Workspace:\n${url}`,
        dossier: `🔍 Stock Bloc Feature Dossier: ${meta.title}\n📌 Category: ${meta.category} // ${meta.badge}\n📝 Summary: ${meta.description}\n\n🖼️ Card Thumbnail:\n${ogImageUrl}\n\n🌐 Explore Tool:\n${url}`,
        alert: `🚨 Stock Bloc Intelligence Alert: Check out ${meta.title} on Stock Bloc.\n\n${url}\n\nThumbnail: ${ogImageUrl}`
      }
    };
  }

  // General tab metadata
  const title = TAB_TITLES[tab] || "Stock Bloc | Quant Wealth Terminal";
  const description = TAB_DESCRIPTIONS[tab] || "Real-time quantitative workstation, autonomous AI agent network, credit dispute hub, and real estate cash flow models.";
  const path = TAB_TO_ROUTE[tab] || "/";
  const url = `${origin}${path}`;
  const badge = tab.toUpperCase().replace(/_/g, " ");
  const category = "Platform Hub";
  const ogImageUrl = `${origin}/api/og?title=${encodeURIComponent(title.replace('Stock Bloc | ', ''))}&subtitle=${encodeURIComponent(description)}&badge=${encodeURIComponent(badge)}&category=${encodeURIComponent(category)}`;

  return {
    title,
    description,
    url,
    ogImageUrl,
    badge,
    category,
    smsPresets: {
      thumbnail: `🚀 ${title}\n\n${description}\n\n🖼️ Live HUD Preview Thumbnail:\n${ogImageUrl}\n\n👉 Open Workspace:\n${url}`,
      dossier: `⚡ Stock Bloc Workspace: ${title}\n📌 ${description}\n\n🖼️ Card Thumbnail:\n${ogImageUrl}\n\n🔗 Live Deep Link:\n${url}`,
      alert: `🚨 Stock Bloc Update: Explore ${title}.\n\n${url}\n\nThumbnail: ${ogImageUrl}`
    }
  };
}

/**
 * Update subtab metadata in document and meta tags
 */
export function updateSubTabMetadata(basePath: string, subTab: string) {
  if (typeof window === "undefined") return;

  const meta = SUBTAB_METADATA[subTab];
  if (!meta) return;

  const origin = window.location.origin;
  const url = `${origin}${basePath}/${subTab}`;
  const ogImageUrl = `${origin}/api/og?title=${encodeURIComponent(meta.title.replace('Stock Bloc | ', ''))}&subtitle=${encodeURIComponent(meta.description)}&badge=${encodeURIComponent(meta.badge)}&category=${encodeURIComponent(meta.category)}`;

  document.title = meta.title;
  updateMetaTag('meta[name="description"]', "content", meta.description);
  updateMetaTag('meta[property="og:title"]', "content", meta.title);
  updateMetaTag('meta[property="og:description"]', "content", meta.description);
  updateMetaTag('meta[property="og:image"]', "content", ogImageUrl);
  updateMetaTag('meta[property="og:url"]', "content", url);
  updateMetaTag('meta[name="twitter:title"]', "content", meta.title);
  updateMetaTag('meta[name="twitter:description"]', "content", meta.description);
  updateMetaTag('meta[name="twitter:image"]', "content", ogImageUrl);
}

/**
 * Update browser URL bar and document meta titles & social preview cards for deep linking
 */
export function pushAppRoute(tab: ViewTab, isTerminalOpen = false, stockSymbol?: string | null) {
  if (typeof window === "undefined") return;

  const routeKey = isTerminalOpen ? "terminal" : tab;
  let targetPath = isTerminalOpen ? "/terminal" : TAB_TO_ROUTE[tab] || "/";

  // Append or preserve stock query parameter if a stock is actively inspected
  if (stockSymbol) {
    const cleanSymbol = encodeURIComponent(stockSymbol.toUpperCase());
    targetPath = targetPath === "/" ? `/?stock=${cleanSymbol}` : `${targetPath}?stock=${cleanSymbol}`;
  }

  const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;

  const meta = getShareMetadataForRoute(tab, undefined, stockSymbol ? { symbol: stockSymbol, name: stockSymbol, price: 0, change: 0, changePercent: 0, category: 'tsunami', sparkline: [], history: {} as any, marketCap: '', high52: 0, low52: 0, volume: '', description: '', tags: [] } : null);

  if (currentPathWithSearch !== targetPath) {
    // Prevent overwriting sub-tab routes when the base route matches and no stock is selected
    if (
      !stockSymbol &&
      ((targetPath === "/credit" && window.location.pathname.startsWith("/credit/")) ||
      (targetPath === "/real-estate" && window.location.pathname.startsWith("/real-estate/")) ||
      (targetPath === "/research/dyson-swarm" && window.location.pathname.startsWith("/research/dyson-swarm/")) ||
      (targetPath === "/dyson-swarm" && window.location.pathname.startsWith("/dyson-swarm/")) ||
      (targetPath === "/satellite-map" && window.location.pathname.startsWith("/satellite-map/")) ||
      (targetPath === "/research/ai-revolution" && window.location.pathname.startsWith("/research/ai-revolution/")) ||
      (targetPath === "/ai-revolution" && window.location.pathname.startsWith("/ai-revolution/")) ||
      (targetPath === "/intelligence" && window.location.pathname.startsWith("/intelligence/")) ||
      (targetPath === "/war-gov-ufo" && window.location.pathname.startsWith("/war-gov-ufo/")) ||
      (targetPath === "/agents" && window.location.pathname.startsWith("/agents/") && window.location.pathname !== "/agents/feed"))
    ) {
      // Don't push over existing sub-tab
    } else {
      window.history.pushState({ tab, isTerminalOpen, stockSymbol }, "", targetPath);
    }
  }

  // Update document title & description
  document.title = meta.title;
  updateMetaTag('meta[name="description"]', "content", meta.description);

  // Dynamically update Open Graph meta tags
  updateMetaTag('meta[property="og:title"]', "content", meta.title);
  updateMetaTag('meta[property="og:description"]', "content", meta.description);
  updateMetaTag('meta[property="og:image"]', "content", meta.ogImageUrl);
  updateMetaTag('meta[property="og:url"]', "content", `${window.location.origin}${targetPath}`);

  // Dynamically update Twitter card meta tags
  updateMetaTag('meta[name="twitter:title"]', "content", meta.title);
  updateMetaTag('meta[name="twitter:description"]', "content", meta.description);
  updateMetaTag('meta[name="twitter:image"]', "content", meta.ogImageUrl);
}
