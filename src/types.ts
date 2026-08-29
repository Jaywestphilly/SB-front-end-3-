export type TimeFrame = "1D" | "1W" | "1M" | "1Y" | "ALL";

export type SectorCategory =
  | "my_bloc" // My Bloc
  | "tsunami" // Super sonic Tsunami
  | "robotics" // Robotics & Self-Driving
  | "asymmetry" // Maximum Asymmetry
  | "reits" // Real Estate Investment Trusts
  | "credit_fin" // Credit Cards & FinTech
  | "ai_infra" // Infrastructure & Cloud
  | "memory" // Memory Chips & Hardware
  | "energy" // Energy, Grid & Power
  | "indexes"; // Major Indexes & Crypto

export interface PricePoint {
  time: string;
  price: number;
  volume?: number;
}

export interface StockTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: SectorCategory;
  sparkline: number[];
  history: Record<TimeFrame, PricePoint[]>;
  marketCap: string;
  peRatio?: string;
  dividendYield?: string;
  high52: number;
  low52: number;
  volume: string;
  sentimentScore?: number;
  description: string;
  rsi?: number;
  isPinned?: boolean;
  tags: string[];
  signalScore?: number;
  signalLabel?: string;
  volumeNum?: number;
  avgVolumeNum?: number;
  volumeVsAvgRatio?: number;
  lastUpdatedIso?: string;
  theme?: string;
  cardColor?: string;
  color?: string;
  quantMetrics?: any;
  asymmetryPotentialStars?: number; // 1.0 to 5.0 rating scale
  targetPrice?: number;
  rating?: string;
  instHolders?: Array<{ name: string; value: string }>;
  headlines?: Array<{
    title: string;
    source: string;
    time?: string;
    sentiment?: string;
    url?: string;
  }>;
  probabilityOfSuccess?:
    | "Low"
    | "Medium-Low"
    | "Medium"
    | "Medium-High"
    | "High"
    | "Very High"
    | "Extremely High";
  news?: Array<{
    title: string;
    source: string;
    time?: string;
    sentiment?: string;
    url?: string;
  }>;
  institutionalOwnershipPercent?: number;
  institutionalData?: {
    ownershipPercent: number;
    holdersCount: number;
    sharesHeld: string;
    totalValue: string;
    quarterlyNetFlow: string;
    flowSentiment: "Accumulation" | "Distribution" | "Neutral";
    insiderOwnershipPercent: number;
    retailOwnershipPercent: number;
    buyersCount: number;
    sellersCount: number;
    topHolders: Array<{
      name: string;
      shares: string;
      value: string;
      portfolioWeight: string;
      changeType: "INCREASED" | "DECREASED" | "NEW" | "UNCHANGED";
      changePercent: string;
    }>;
  };
}

export interface StockNews {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  url: string;
  relatedSymbol: string;
  sentiment: "positive" | "negative" | "neutral";
}

export type SortField =
  | "price"
  | "changePercent"
  | "signal"
  | "name"
  | "companyName"
  | "stack"
  | "marketCap"
  | "volatility"
  | "volume"
  | "rsi"
  | "asymmetry";

export interface PaperTrade {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  entryPrice: number;
  entryDate: string;
  type: "BUY" | "SHORT";
}

export type ViewTab =
  | "watchlist"
  | "community"
  | "macro"
  | "war_gov_ufo"
  | "intelligence"
  | "dyson_swarm"
  | "satellite_map"
  | "podcasts"
  | "real_estate"
  | "vacancy_empire"
  | "small_business"
  | "credit"
  | "youtube"
  | "ipos"
  | "ma"
  | "regulatory"
  | "earnings"
  | "rankings"
  | "heatmap"
  | "ai_insights"
  | "ai_revolution"
  | "hedge_funds"
  | "investopedia"
  | "terminal_guide"
  | "brand"
  | "my_bloc"
  | "playbooks"
  | "pricing"
  | "checkout_success"
  | "news"
  | "docs"
  | "mit_courses"
  | "apple_watch"
  | "developers"
  | "agents"
  | "agent_profile"
  | "agent_join"
  | "agent_feed"
  | "developer_docs"
  | "agent_exchange"
  | "developer_earnings"
  | "web3_dot_btc";

export interface ApiKeyDetails {
  key: string;
  createdAt: string;
  status: "active" | "revoked";
  creditsRemaining: number;
  totalCreditsPurchased: number;
  tier: "free" | "pro" | "enterprise";
}

export type AgentApiScope =
  | "community:read"
  | "community:write"
  | "community:reply"
  | "research:publish"
  | "forecast:publish"
  | "webhooks:manage"
  | "services:read"
  | "services:write"
  | "jobs:read"
  | "jobs:execute"
  | "requests:read"
  | "requests:write"
  | "payments:transact";

export interface AgentApiKeyRecord {
  keyId: string;
  agentId: string;
  ownerUid?: string;
  handle?: string;
  keyPrefix?: string;
  keyHash?: string;
  secretHash?: string;
  scopes: AgentApiScope[];
  createdAt: any;
  lastUsedAt?: any | null;
  expiresAt?: any | null;
  revokedAt?: any | null;
  status: "active" | "revoked" | "suspended" | "expired";
}

export interface AgentIdentity {
  agentId: string;
  handle: string;
  displayName: string;
  description: string;
  avatar: string;
  ownerUid: string;
  verificationStatus: "unverified" | "verified";
  specialties?: string[];
  isTestAgent?: boolean;
  operatorUsername?: string;
  followersCount?: number;
  metrics?: any;
  authorType?: "agent" | "verified_agent";
  createdAt: any;
  updatedAt: any;
  lastSeenAt: any;
  status: "active" | "suspended" | "deleted";
}

export interface StoreProduct {
  id: string;
  title: string;
  category: "playbook" | "subscription" | "api_bundle";
  price: number;
  displayPrice: string;
  billingPeriod?: "monthly" | "yearly" | "one_time";
  description: string;
  features: string[];
  isPopular?: boolean;
  downloadUrl?: string;
  creditsGranted?: number;
}

// 13F Hedge Fund Filings Interfaces
export interface HedgeFundProfile {
  id: string;
  fundName: string;
  managerName: string;
  aum: string;
  focusArea: string;
  thesisSummary: string;
  topHoldings: {
    symbol: string;
    name: string;
    weightPercent: number;
    changeType: "NEW BUY" | "INCREASED" | "REDUCED" | "HOLD";
  }[];
  convictionScore: number;
  badgeTag: string;
}

export interface Filing13FItem {
  id: string;
  fundId: string;
  fundName: string;
  managerName: string;
  symbol: string;
  companyName: string;
  sharesHeld: string;
  portfolioValueMillions: number;
  portfolioPercent: number;
  quarterlyChangeType:
    "NEW BUY" | "INCREASED" | "REDUCED" | "SOLD OUT" | "HOLD";
  quarterlyChangePercent: number;
  reportPeriod: string;
  convictionRating: "Extreme" | "High" | "Core Hold";
  aiThesis: string;
}

// Earnings Calendar & Report Summaries Interfaces
export interface EarningsReport {
  id: string;
  symbol: string;
  companyName: string;
  reportDate: string;
  timing: "Before Market Open" | "After Market Close" | "Confirmed";
  fiscalQuarter: string;
  epsEstimate: string;
  epsActual?: string;
  revenueEstimate: string;
  revenueActual?: string;
  guidanceHighlight: string;
  summaryText: string;
  aiKeyTakeaways: string[];
  beatOrMiss?: "Beat" | "Miss" | "Inline" | "Upcoming";
}

// Annual Revenue & Net Profit Rankings Interfaces
export interface CompanyFinancialRank {
  id: string;
  symbol: string;
  name: string;
  revenueBillions: number;
  netProfitBillions: number;
  netMarginPercent: number;
  revenueGrowthYoY: string;
  sector: string;
  summaryNote: string;
}

// IPO Tracking Interfaces
export interface IpoTrackerItem {
  id: string;
  companyName: string;
  symbolPlaceholder: string;
  expectedValuation: string;
  status: "Filed S-1" | "Rumored" | "Priced" | "Expected Q3/Q4";
  filingDate: string;
  sector: string;
  leadUnderwriters: string[];
  description: string;
  keyMetrics: { label: string; value: string }[];
  strategicRationale: string;
  signal: "Bullish" | "Watchlist" | "High Volatility";
}

// Merger & Acquisition Interfaces
export interface MaTrackerItem {
  id: string;
  acquirerName: string;
  acquirerSymbol: string;
  targetName: string;
  targetSymbol?: string;
  dealValue: string;
  dealType: "All-Stock" | "Cash & Stock" | "All-Cash";
  status:
    | "Pending Regulatory Approval"
    | "Under FTC/DOJ Review"
    | "Completed"
    | "Proposed Offer";
  expectedClose: string;
  arbitrageSpreadPercent?: number;
  regulatoryBodies: string[];
  strategicRationale: string;
  antitrustRiskLevel: "Low" | "Moderate" | "High";
}

// Regulatory Capture & Policy Moat Interfaces
export interface RegulatoryCaptureItem {
  id: string;
  companyName: string;
  symbol: string;
  regulatoryAgencies: string[]; // e.g. FTC, DOJ, SEC, NRC, FERC, BIS
  regulatoryMoatRating: number; // 1-10
  moatType:
    | "Licensing Barrier"
    | "Export Controls"
    | "Federal Defense Contracts"
    | "Government Mandate"
    | "Antitrust Defense";
  description: string;
  keyPolicyDevelopments: string[];
  lobbyingImpactScore:
    "High Protection" | "Dominant Moat" | "Regulatory Pressure";
  govContractValue?: string;
}

// Podcast News Feed Interfaces
export type SubjectCategoryId =
  "macro_ai" | "exponential_tech" | "wealth_mindset";

export interface PodcastNewsArticle {
  id: string;
  subjectCategory: SubjectCategoryId;
  subjectName: string;
  episodeTitle: string;
  episodeNumber?: string;
  publishedDate: string;
  readTime: string;
  summary: string;
  keyTopics: string[];
  relatedTickers: string[];
  sentiment: "Bullish" | "Bearish" | "Neutral";
  imageUrl: string;
  sourceUrl: string;
  keyTakeaways: string[];
}

// Real Estate Calculator Interfaces
export interface RealEstateCalcInput {
  propertyPrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  maintenancePercent: number;
  vacancyPercent: number;
  propertyManagementPercent: number;
}

export interface RealEstateCalcResult {
  downPaymentAmount: number;
  loanAmount: number;
  monthlyMortgage: number;
  grossMonthlyIncome: number;
  monthlyExpenses: number;
  netMonthlyCashFlow: number;
  netAnnualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  totalInvestment: number;
}

// Credit Building Interfaces
export interface CreditFactor {
  id: string;
  name: string;
  weightPercent: number;
  status: "Excellent" | "Good" | "Fair" | "Needs Work";
  scoreImpact: string;
  userValue: string;
  targetValue: string;
  description: string;
  tip: string;
}

export interface CreditCardItem {
  id: string;
  name: string;
  issuer: string;
  type: "Secured" | "Rewards" | "Business" | "0% APR";
  minScoreNeeded: number;
  annualFee: string;
  introApr: string;
  perks: string[];
  recommendedFor: string;
  applyUrl: string;
}

// YouTube Media Hub Interfaces
export interface YouTubeVideo {
  id: string;
  youtubeId: string; // for video embeds or links
  title: string;
  channelName: string;
  category:
    | "Real Estate"
    | "Credit Building"
    | "Stock Market"
    | "Wealth Blueprint"
    | "Real Life Shorts";
  duration: string;
  views: string;
  publishedDate: string;
  thumbnailUrl: string;
  description: string;
  keyTakeaways: string[];
  isShort?: boolean;
  videoUrl?: string;
  timestamp?: number;
}

export interface YouTubeChannel {
  id: string;
  channelName: string;
  handle: string;
  subscribers: string;
  videoCount: string;
  avatarUrl: string;
  bannerUrl: string;
  channelUrl: string;
  description: string;
}

// Backend Watchlist & Financial Types
export interface BackendWatchlistStock {
  symbol: string;
  price: number;
  change?: number;
  percent_change?: number;
  sparkline?: number[];
  market_cap?: string;
  analysis_summary?: string;
  sector?: SectorCategory;
  pinned?: boolean;
  target_price?: number;
  rating?: string;
  inst_holders?: Array<{ name: string; value: string }>;
  headlines?: Array<{
    title: string;
    source: string;
    time?: string;
    sentiment?: string;
    url?: string;
  }>;
}

// Chart Candle Data
export interface CandleDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  isUp?: boolean;
  changePercent?: number;
}

// Intel Feed Item
export interface IntelFeedItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  url: string;
  relatedSymbol?: string;
  sentiment: "positive" | "negative" | "neutral";
  category?: string;
  timestamp?: number;
}

// Report Repository Raw Items
export interface ReportRawItem {
  symbol?: string;
  companyName?: string;
  name?: string;
  quarterlyChangeType?: string;
  portfolioPercent?: string | number;
  weightPercent?: string | number;
  epsActual?: string | number;
  sharesHeld?: string | number;
  aiThesis?: string;
  notes?: string;
  [key: string]: any;
}

// Dyson Swarm Data Interfaces
export interface DysonVideo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  channelName?: string;
}

export interface DysonLaunch {
  id: string;
  name: string;
  provider: string;
  date?: string;
  payload?: string;
  status: string;
  location?: string;
  net_launch_time?: string;
  description?: string;
  stream_url?: string;
  [key: string]: any;
}

export interface DysonStory {
  id: string;
  title: string;
  summary?: string;
  source?: string;
  url?: string;
  date?: string;
  image_url?: string;
  category?: string;
  stat_callout?: string;
  statCallout?: string;
  story_summary?: string;
  description?: string;
  [key: string]: any;
}

export interface DysonLiveData {
  upcoming_launches?: DysonLaunch[];
  dyson_stories?: DysonStory[];
  videos?: DysonVideo[];
  updated_at?: string;
  fleet_metrics?: any;
}

// StockDetailModal SubComponent Shared Props
export interface StockDetailSubProps {
  stock: StockTicker;
  activeStock: StockTicker;
  displayStock: StockTicker | null;
  onClose: () => void;
  onTogglePin?: (symbol: string) => void;
  onShare?: (stock: StockTicker) => void;
  onOpenBloombergTerminal?: (stock: StockTicker) => void;
  onOpenBrokerages?: (stock: StockTicker) => void;
  timeframe: TimeFrame;
  setTimeframe: (tf: TimeFrame) => void;
  hoverIndex: number | null;
  setHoverIndex: (idx: number | null) => void;
  aiAnalysis: string | null;
  setAiAnalysis: (val: string | null) => void;
  isAiLoading: boolean;
  setIsAiLoading: (val: boolean) => void;
  aiError: string | null;
  setAiError: (val: string | null) => void;
  chartMode: "candle" | "line";
  setChartMode: (mode: "candle" | "line") => void;
  zoomLevel: number;
  setZoomLevel: (val: number | ((prev: number) => number)) => void;
  panOffset: number;
  setPanOffset: (val: number | ((prev: number) => number)) => void;
  showSMA: boolean;
  setShowSMA: (val: boolean) => void;
  showVWAP: boolean;
  setShowVWAP: (val: boolean) => void;
  showRSI: boolean;
  setShowRSI: (val: boolean) => void;
  [key: string]: any;
}

// --- Phase 4 Types: Agent Intelligence, Reputation, Research and Performance System ---

export interface Forecast {
  id: string;
  agentId: string;
  question: string;
  asset: string;
  direction: "Bullish" | "Bearish" | "Neutral" | "Range" | "Other";
  target: string;
  probability: number;
  timeHorizon:
    | "Intraday"
    | "1 day"
    | "1 week"
    | "1 month"
    | "3 months"
    | "6 months"
    | "1 year"
    | "Long term";
  createdAt: any;
  resolutionCriteria: string;
  sourceEvidence: string;
  status:
    | "OPEN"
    | "RESOLVED_CORRECT"
    | "RESOLVED_INCORRECT"
    | "INVALID"
    | "CANCELLED";
  resolution?: string;
  resolvedAt?: any;
}

export interface ResearchEvidence {
  source: string;
  title: string;
  publisher: string;
  publicationDate: string;
  url: string;
  claimSupported: string;
  sourceType:
    | "Company Filing"
    | "Earnings Release"
    | "Transcript"
    | "Government Data"
    | "Economic Data"
    | "Academic Research"
    | "News"
    | "Market Data"
    | "Company Website"
    | "Other";
}

export interface ResearchArticle {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  thesis: string;
  bullCase: string;
  bearCase: string;
  catalysts: string[];
  risks: string[];
  evidence: ResearchEvidence[];
  timeHorizon: string;
  relatedAssets: string[];
  createdAt: any;
  updatedAt: any;
  version: number;
}

export interface InvestmentThesis {
  id: string;
  agentId: string;
  asset: string;
  direction: "Bullish" | "Bearish" | "Neutral";
  timeHorizon: string;
  thesis: string;
  catalysts: string[];
  risks: string[];
  bullCase: string;
  baseCase: string;
  bearCase: string;
  keyMetrics: string[];
  invalidationConditions: string[];
  evidence: ResearchEvidence[];
  createdAt: any;
  updatedAt: any;
}

export interface AgentReputation {
  reputationStatus:
    "INSUFFICIENT_DATA" | "EMERGING" | "ESTABLISHED" | "HIGH_CONFIDENCE";
  score?: number;
  forecastRecord: {
    total: number;
    correct: number;
    incorrect: number;
    open: number;
    accuracy?: number;
    calibrationScore?: number;
  };
  researchCount: number;
  communityInteractions: number;
}

export interface AgentFeedback {
  id: string;
  agentId: string;
  userId: string;
  targetId: string;
  targetType: "forecast" | "research" | "thesis" | "post";
  feedbackType:
    | "Helpful"
    | "Not Helpful"
    | "Good Evidence"
    | "Poor Evidence"
    | "Good Explanation"
    | "Incorrect"
    | "Outdated";
  createdAt: any;
}

// --- Phase 6 Types: Agent Economy, Exchange, Services, Jobs, and Platform Ledger ---

export type ServiceCategory =
  | "Research"
  | "Market Data"
  | "SEC"
  | "Macro"
  | "Valuation"
  | "Quant"
  | "Sentiment"
  | "News Analysis"
  | "Portfolio Analytics"
  | "Verification"
  | "Data Cleaning"
  | "Forecasting"
  | "Other";

export interface AgentService {
  serviceId: string;
  providerAgentId: string;
  providerHandle: string;
  providerDisplayName: string;
  providerAvatar?: string;
  name: string;
  description: string;
  category: ServiceCategory;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  price: number; // in credits or USD
  currency: "CREDITS" | "USD" | "USDC";
  deliveryMethod: "JSON_REST" | "STRUCTURED_DOC" | "WEBHOOK" | "SSE";
  estimatedLatency: string; // e.g. "30s", "2m"
  status: "active" | "paused" | "archived";
  reputationScore?: number;
  successRate?: number; // e.g. 98.5
  completedJobsCount?: number;
  createdAt: any;
  updatedAt?: any;
}

export type JobStatus =
  | "OPEN"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "VERIFIED"
  | "DISPUTED"
  | "CANCELLED";

export interface AgentJob {
  jobId: string;
  requestId?: string;
  requesterAgentId: string;
  requesterHandle?: string;
  requesterDisplayName?: string;
  providerAgentId: string;
  providerHandle?: string;
  providerDisplayName?: string;
  serviceId?: string;
  serviceName?: string;
  title: string;
  asset?: string;
  category: ServiceCategory;
  input: Record<string, any>;
  output?: Record<string, any>;
  evidenceSources?: string[];
  status: JobStatus;
  price: number;
  currency: "CREDITS" | "USD" | "USDC";
  paymentRail: "PLATFORM_CREDITS" | "X402_USDC" | "STRIPE" | "FUTURE_RAIL";
  delivery?: {
    deliveredAt: any;
    summary: string;
    payload: any;
    latencyMs?: number;
  };
  verification?: {
    verifiedAt: any;
    verifier: "system" | "requester" | "human_operator";
    passed: boolean;
    verificationScore?: number;
    notes?: string;
  };
  dispute?: {
    disputeId: string;
    openedAt: any;
    reason: string;
    status: "OPEN" | "UNDER_REVIEW" | "RESOLVED_BUYER" | "RESOLVED_PROVIDER" | "REFUNDED";
    resolution?: string;
  };
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
}

export interface MarketTaskRequest {
  requestId: string;
  creatorType: "PLATFORM_SYSTEM" | "AGENT" | "HUMAN";
  creatorId: string;
  creatorHandle?: string;
  creatorDisplayName?: string;
  title: string;
  description: string;
  asset?: string;
  category: ServiceCategory;
  requiredEvidence: string;
  outputFormat: string;
  budget: number;
  currency: "CREDITS" | "USD" | "USDC";
  rewardType: "PLATFORM_CREDITS" | "REPUTATION" | "SPONSORED" | "CASH" | "STABLECOIN";
  status: "OPEN" | "CLAIMED" | "COMPLETED" | "EXPIRED";
  claimedByAgentId?: string;
  claimedByHandle?: string;
  associatedJobId?: string;
  deadlineIso?: string;
  createdAt: any;
  completedAt?: any;
  eventTrigger?: {
    type: "MARKET_MOVE" | "EARNINGS" | "SEC_FILING" | "MACRO_EVENT" | "FORECAST_RESOLUTION" | "UNUSUAL_VOLUME";
    metricDetails: string;
    verifiedFact: string;
  };
}

export type BountyStatus = "open" | "claimed" | "delivered" | "verified" | "paid" | "cancelled";
export type BountyVerificationMethod = "payload_present" | "manual_platform";

export interface StockBlocBounty {
  bountyId: string;
  title: string;
  description: string;
  category: ServiceCategory | "Research" | "Forecasting" | "Verification" | "SEC" | "Macro" | "Quant" | "Sentiment" | "Valuation";
  asset?: string;
  rewardCredits: number;
  currency?: "CREDITS" | "USD" | "USDC";
  status: BountyStatus;
  createdBy: string; // 'platform' or agentId
  creatorHandle?: string;
  creatorDisplayName?: string;
  claimedBy: string | null; // agentId or null
  claimedByHandle?: string | null;
  claimedAt?: string | null;
  deliveredAt?: string | null;
  paidAt?: string | null;
  inputSchema?: Record<string, any>;
  requiredOutputSchema?: Record<string, any>;
  verificationMethod: BountyVerificationMethod;
  submission?: {
    summary: string;
    outputPayload: Record<string, any>;
    evidenceSources?: string[];
    submittedAt: string;
  };
  verification?: {
    passed: boolean;
    verifiedAt: string;
    verifier: string;
    score?: number;
    notes?: string;
  };
  payoutTxId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type TransactionStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "SETTLED"
  | "FAILED"
  | "REFUNDED"
  | "DISPUTED";

export interface LedgerEntry {
  entryId: string;
  transactionId: string;
  jobId?: string;
  accountId: string;
  accountType: "BUYER" | "SELLER" | "PLATFORM_TREASURY" | "ESCROW";
  entryType: "DEBIT" | "CREDIT";
  amount: number;
  currency: "CREDITS" | "USD" | "USDC";
  description: string;
  balanceBefore?: number;
  balanceAfter: number;
  createdAt: string;
}

export interface PlatformLedgerTransaction {
  transactionId: string;
  idempotencyKey?: string;
  jobId: string;
  buyerAgentId: string;
  buyerHandle?: string;
  sellerAgentId: string;
  sellerHandle?: string;
  treasuryAccountId?: string;
  grossAmount: number;
  platformFeeBps: number; // e.g. 500 = 5%
  platformFee: number;
  providerAmount: number;
  currency: "CREDITS" | "USD" | "USDC";
  paymentRail: "PLATFORM_CREDITS" | "X402_USDC" | "STRIPE" | "POLKADOT_USDC" | "FUTURE_RAIL";
  status: TransactionStatus;
  externalPaymentProof?: {
    rail: "STRIPE" | "POLKADOT_USDC" | "PLATFORM_CREDITS";
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    polkadotTxHash?: string;
    polkadotBlockHash?: string;
    polkadotBlockNumber?: number;
    polkadotNetwork?: string;
    polkadotAssetId?: string;
    verifiedAt: string;
  };
  entries?: LedgerEntry[];
  balancesAfter?: {
    buyerBalance: number;
    sellerBalance: number;
    treasuryBalance: number;
  };
  createdAt: any;
  completedAt?: any;
}

export interface TransactionAuditReceipt {
  receiptId: string;
  internalTransactionId: string;
  jobId: string;
  paymentRail: "PLATFORM_CREDITS" | "STRIPE" | "POLKADOT_USDC" | "X402_USDC";
  grossAmount: number;
  platformFee: number;
  netSellerAmount: number;
  currency: "CREDITS" | "USD" | "USDC";
  status: TransactionStatus;
  externalPaymentProof?: {
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    polkadotTxHash?: string;
    polkadotBlockHash?: string;
    polkadotBlockNumber?: number;
    polkadotConfirmations?: number;
    polkadotNetwork?: string;
    polkadotAssetId?: string;
    polkadotSender?: string;
    polkadotRecipient?: string;
    verifiedAt: string;
  };
  buyer: {
    agentId: string;
    handle?: string;
    previousBalance?: number;
    finalBalance?: number;
  };
  seller: {
    agentId: string;
    handle?: string;
    previousBalance?: number;
    finalBalance?: number;
  };
  treasury: {
    accountId: string;
    feeCollected: number;
  };
  timeline: {
    initiatedAt: string;
    paymentVerifiedAt?: string;
    resultVerifiedAt?: string;
    settledAt: string;
  };
  receiptHash: string;
}

export interface SettlementAccountBalanceSummary {
  agentId?: string;
  accountId?: string;
  handle?: string;
  previousBalance: number;
  currentBalance: number;
  debited?: number;
  credited?: number;
  creditedFee?: number;
}

export interface SettlementResult {
  success: boolean;
  transactionId: string;
  idempotencyKey?: string;
  jobId?: string;
  status: TransactionStatus;
  grossAmount: number;
  platformFee: number;
  platformFeeBps?: number;
  netSellerAmount: number;
  sellerNet?: number;
  currency: "CREDITS" | "USD" | "USDC";
  paymentRail: "PLATFORM_CREDITS" | "X402_USDC" | "STRIPE" | "POLKADOT_USDC" | "FUTURE_RAIL";
  externalPaymentProof?: {
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    polkadotTxHash?: string;
    polkadotBlockHash?: string;
    polkadotBlockNumber?: number;
    polkadotNetwork?: string;
    polkadotAssetId?: string;
    verifiedAt: string;
  };
  auditReceipt?: TransactionAuditReceipt;
  balances: {
    buyer: SettlementAccountBalanceSummary;
    seller: SettlementAccountBalanceSummary;
    treasury: SettlementAccountBalanceSummary;
  };
  ledgerEntries: LedgerEntry[];
  transaction?: PlatformLedgerTransaction;
  settledAt?: string;
  idempotentReplay?: boolean;
  message?: string;
}

export interface AgentWalletBalance {
  agentId: string;
  accountType?: 'AGENT' | 'PLATFORM_TREASURY';
  creditsBalance: number;
  availableBalance?: number;
  reservedBalance?: number;
  simulationRuns?: number;
  verifiedSimulations?: number;
  usdPendingBalance?: number;
  usdSettledBalance?: number;
  usdcPendingBalance?: number;
  usdcSettledBalance?: number;
  lifetimeGrossEarnings?: number;
  lifetimePlatformFeesPaid?: number;
  lifetimeNetEarnings?: number;
  lifetimeSpent: number;
  lifetimeEarnings?: number;
  lifetimeFeesCollected?: number;
  totalSettledVolume?: number;
  maxSpendPerRequest?: number;
  maxDailySpend?: number;
  spentToday?: number;
  spendingLimitsConfigured?: boolean;
}

