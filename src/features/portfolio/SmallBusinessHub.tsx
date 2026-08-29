import React, { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Scale,
  FileText,
  Building2,
  CreditCard,
  TrendingUp,
  Rocket,
  ShieldCheck,
  ExternalLink,
  ArrowUpRight,
  Calculator,
  Award,
  CheckCircle2,
  DollarSign,
  Globe,
  HelpCircle,
  Sparkles,
  BookOpen,
  Users,
  Landmark,
  Copy,
  Check,
  Zap,
  AlertCircle,
  Search,
  Download,
  Flame,
  ArrowRight,
  BarChart3,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { trackEvent } from "../../utils/analytics";
import { ResponsiveSubTabNav } from "../../components/ResponsiveSubTabNav";
import { StripeFintechSuite } from "./StripeFintechSuite";

interface GrantItem {
  id: string;
  title: string;
  provider: string;
  amount: string;
  category: "federal" | "corporate" | "women_minority" | "tech_innovation";
  deadline: string;
  description: string;
  eligibility: string;
  url: string;
}

const VERIFIED_GRANTS: GrantItem[] = [
  {
    id: "sbir-sttr",
    title: "SBIR / STTR Federal R&D Innovation Grants",
    provider: "U.S. Small Business Administration (SBA)",
    amount: "$50,000 to $1,800,000",
    category: "federal",
    deadline: "Rolling / Quarterly Cycles",
    description:
      "Non-dilutive federal funding for small businesses engaged in technological research and development with commercial potential across 11 federal agencies.",
    eligibility: "For-profit U.S. small businesses under 500 employees with majority American ownership.",
    url: "https://www.sbir.gov/funding",
  },
  {
    id: "amber-grant",
    title: "The Amber Grant for Women Entrepreneurs",
    provider: "WomensNet",
    amount: "$10,000 Monthly + $25,000 Annual Bonus",
    category: "women_minority",
    deadline: "End of Every Month",
    description:
      "One of the longest-running private grant programs for female founders. Winners of monthly $10k grants are automatically eligible for year-end $25k prizes.",
    eligibility: "Women entrepreneurs (18+) operating or starting a business in the U.S. or Canada.",
    url: "https://ambergrantsforwomen.com/",
  },
  {
    id: "fedex-grant",
    title: "FedEx Small Business Grant Contest",
    provider: "FedEx Corporation",
    amount: "$30,000 + $1,000 FedEx Office Credits",
    category: "corporate",
    deadline: "Annual Spring Application Window",
    description:
      "Over $300,000 in total cash prizes awarded annually to innovative small businesses with compelling mission stories and scalable logistics needs.",
    eligibility: "U.S. based for-profit businesses in good standing with active shipping needs for 6+ months.",
    url: "https://www.fedex.com/en-us/small-business/grants.html",
  },
  {
    id: "fast-break-grant",
    title: "Fast Break for Small Business",
    provider: "LegalZoom, NBA & WNBA",
    amount: "$10,000 Cash + $500 LegalZoom Services",
    category: "women_minority",
    deadline: "Biannual Cohorts",
    description:
      "A $6 million initiative designed to support historically underserved and minority small business owners with startup capital and legal services.",
    eligibility: "Small businesses in operation for at least 3 months with annual revenue under $1,000,000.",
    url: "https://www.legalzoom.com/fastbreakforsmallbusiness",
  },
  {
    id: "comcast-rise",
    title: "Comcast RISE Investment Fund & Tech Package",
    provider: "Comcast / NBCUniversal",
    amount: "$5,000 Grant + Technology / Media Makeover",
    category: "corporate",
    deadline: "Annual Regional Cycles",
    description:
      "Grants, marketing campaigns, state-of-the-art tech makeovers, and commercial advertising production for brick-and-mortar small businesses.",
    eligibility: "Independent businesses in designated metropolitan coverage zones open 3+ years with 1-100 employees.",
    url: "https://www.comcastrise.com/",
  },
  {
    id: "nase-growth-grant",
    title: "NASE Small Business Growth Grants",
    provider: "National Association for the Self-Employed",
    amount: "$4,000 Direct Grant",
    category: "federal",
    deadline: "Quarterly Review (March, June, Sept, Dec)",
    description:
      "Targeted micro-grants to finance specific marketing initiatives, new equipment, website development, or employee training for self-employed professionals.",
    eligibility: "Active NASE members with an identifiable business expansion requirement and plan.",
    url: "https://www.nase.org/become-a-member/grants-and-scholarships",
  },
];

interface CreditStep {
  id: string;
  tier: "Tier 0: Foundation" | "Tier 1: Net-30 Vendors" | "Tier 2: Retail & Fleet" | "Tier 3: Cash Lines & SBA";
  title: string;
  requirement: string;
  bureauReported: string;
  actionUrl: string;
  actionLabel: string;
}

const CREDIT_STEPS: CreditStep[] = [
  {
    id: "step_entity",
    tier: "Tier 0: Foundation",
    title: "1. Form LLC or C-Corp with Secretary of State",
    requirement: "Register your legal business entity and appoint a registered agent.",
    bureauReported: "State Records",
    actionUrl: "https://corp.delaware.gov/",
    actionLabel: "Delaware Division of Corporations",
  },
  {
    id: "step_ein",
    tier: "Tier 0: Foundation",
    title: "2. Obtain Free Official IRS EIN",
    requirement: "Never pay $200+ on scam sites. Get your CP 575 EIN confirmation PDF instantly.",
    bureauReported: "IRS Federal",
    actionUrl: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
    actionLabel: "IRS.gov Free EIN Portal",
  },
  {
    id: "step_duns",
    tier: "Tier 0: Foundation",
    title: "3. Register for Free D&B D-U-N-S Number",
    requirement: "Establishes your Dun & Bradstreet corporate credit profile for Paydex score tracking.",
    bureauReported: "Dun & Bradstreet",
    actionUrl: "https://www.dnb.com/duns-number/get-a-duns-number.html",
    actionLabel: "DnB.com Free Registration",
  },
  {
    id: "step_bank",
    tier: "Tier 0: Foundation",
    title: "4. Open Dedicated Commercial Bank Account",
    requirement: "Deposit starting capital and avoid commingling personal and company funds.",
    bureauReported: "ChexSystems / Banking",
    actionUrl: "https://relayfi.com/",
    actionLabel: "Relay / Mercury Business Banking",
  },
  {
    id: "step_uline",
    tier: "Tier 1: Net-30 Vendors",
    title: "5. Uline Shipping Supplies (Net-30)",
    requirement: "Purchase $50+ in shipping/packaging boxes. Pay invoice in 10-15 days for an 80+ Paydex score.",
    bureauReported: "Dun & Bradstreet / Experian",
    actionUrl: "https://www.uline.com/",
    actionLabel: "Uline Net-30 Portal",
  },
  {
    id: "step_grainger",
    tier: "Tier 1: Net-30 Vendors",
    title: "6. Grainger Industrial Supplies (Net-30)",
    requirement: "Open account, place initial order for facility/maintenance gear, select Invoice Me / Net 30.",
    bureauReported: "D&B / Experian Business",
    actionUrl: "https://www.grainger.com/",
    actionLabel: "Grainger Corporate Account",
  },
  {
    id: "step_quill",
    tier: "Tier 1: Net-30 Vendors",
    title: "7. Quill Office Supplies (Net-30)",
    requirement: "Order $100+ in office or cleaning supplies to activate monthly reporting trade line.",
    bureauReported: "Dun & Bradstreet",
    actionUrl: "https://www.quill.com/",
    actionLabel: "Quill Net-30 Account",
  },
  {
    id: "step_nav",
    tier: "Tier 1: Net-30 Vendors",
    title: "8. Nav Business Credit Builder Tradeline",
    requirement: "Reports monthly subscription as an active tradeline to D&B, Experian Commercial & Equifax.",
    bureauReported: "D&B, Experian & Equifax",
    actionUrl: "https://www.nav.com/",
    actionLabel: "Nav Business Platform",
  },
  {
    id: "step_homedepot",
    tier: "Tier 2: Retail & Fleet",
    title: "9. The Home Depot Commercial Revolving Card",
    requirement: "Unlocked after 3-5 reported Net-30 trade lines with 80+ Paydex score. No personal guarantee for established entities.",
    bureauReported: "Experian Commercial / D&B",
    actionUrl: "https://www.homedepot.com/c/Credit_Center",
    actionLabel: "Home Depot Commercial",
  },
  {
    id: "step_wex",
    tier: "Tier 2: Retail & Fleet",
    title: "10. WEX Fleet / Shell Commercial Fuel Card",
    requirement: "Nationwide fuel and vehicle maintenance credit line with automatic mileage and expense tracking.",
    bureauReported: "Experian / D&B",
    actionUrl: "https://www.wexinc.com/solutions/fleet-cards/",
    actionLabel: "WEX Fleet Card Portal",
  },
  {
    id: "step_chase",
    tier: "Tier 3: Cash Lines & SBA",
    title: "11. Chase Ink Business Unlimited / Cash",
    requirement: "0% APR for 12 months + $750 bonus. Provides immediate working capital without personal credit reporting.",
    bureauReported: "Experian Commercial",
    actionUrl: "https://creditcards.chase.com/business-credit-cards",
    actionLabel: "Chase Ink Business",
  },
  {
    id: "step_sba7a",
    tier: "Tier 3: Cash Lines & SBA",
    title: "12. SBA 7(a) Working Capital Line of Credit (Up to $5M)",
    requirement: "Government-backed long-term financing (10-25 years) with prime-based interest rates for scaling.",
    bureauReported: "SBSS / Equifax Commercial",
    actionUrl: "https://www.sba.gov/funding-programs/loans/7a",
    actionLabel: "SBA 7(a) Official Guide",
  },
];

export const SmallBusinessHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "formation" | "stripe_stack" | "business_credit" | "grants_directory" | "startup_roadmap" | "valuation_calc"
  >("formation");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeTab]);

  const [copiedEinSteps, setCopiedEinSteps] = useState(false);
  const [copiedBlueprint, setCopiedBlueprint] = useState(false);

  // Completed credit steps tracking (Local state with persistence)
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("sb_credit_tier_progress");
      return saved ? JSON.parse(saved) : ["step_entity", "step_ein"];
    } catch {
      return ["step_entity", "step_ein"];
    }
  });

  const toggleStep = (stepId: string) => {
    triggerHaptic("selection");
    setCompletedSteps((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId];
      try {
        localStorage.setItem("sb_credit_tier_progress", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const creditProgressPercent = Math.round(
    (completedSteps.length / CREDIT_STEPS.length) * 100
  );

  // Grants Directory Filter & Search
  const [grantSearch, setGrantSearch] = useState("");
  const [grantCategory, setGrantCategory] = useState<"all" | GrantItem["category"]>("all");

  const filteredGrants = useMemo(() => {
    return VERIFIED_GRANTS.filter((g) => {
      const matchesCat = grantCategory === "all" || g.category === grantCategory;
      const matchesSearch =
        g.title.toLowerCase().includes(grantSearch.toLowerCase()) ||
        g.provider.toLowerCase().includes(grantSearch.toLowerCase()) ||
        g.description.toLowerCase().includes(grantSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [grantSearch, grantCategory]);

  // Business Valuation & Multiple Estimator States
  const [annualRevenue, setAnnualRevenue] = useState<number>(750000);
  const [netMarginPercent, setNetMarginPercent] = useState<number>(22);
  const [industryMultiple, setIndustryMultiple] = useState<number>(4.5);
  const [industryName, setIndustryName] = useState<string>("SaaS & Software");

  // Cash Runway & Burn Rate Engine States
  const [cashBalance, setCashBalance] = useState<number>(180000);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(45000);
  const [monthlyPayroll, setMonthlyPayroll] = useState<number>(32000);
  const [monthlyOpex, setMonthlyOpex] = useState<number>(18000);

  // Calculations for Valuation & Runway
  const annualProfitSDE = (annualRevenue * netMarginPercent) / 100;
  const estimatedEnterpriseValue = annualProfitSDE * industryMultiple;
  const estimatedLowVal = estimatedEnterpriseValue * 0.8;
  const estimatedHighVal = estimatedEnterpriseValue * 1.25;

  const totalMonthlyBurn = monthlyPayroll + monthlyOpex;
  const netMonthlyBurn = totalMonthlyBurn - monthlyRevenue;
  const runwayMonths =
    netMonthlyBurn <= 0
      ? 999
      : Math.max(0, Math.round((cashBalance / netMonthlyBurn) * 10) / 10);
  const targetRaiseFor24Months = Math.max(0, netMonthlyBurn * 24 - cashBalance);

  // Cap Table / SAFE Dilution Estimator States
  const [preMoneyValuation, setPreMoneyValuation] = useState<number>(5000000);
  const [safeInvestmentAmount, setSafeInvestmentAmount] = useState<number>(1000000);
  const [optionPoolPercent, setOptionPoolPercent] = useState<number>(10);
  const [initialFounderShares, setInitialFounderShares] = useState<number>(10000000);

  const postMoneyValuation = preMoneyValuation + safeInvestmentAmount;
  const safeInvestorOwnership = (safeInvestmentAmount / postMoneyValuation) * 100;
  const founderPostOwnership = 100 - safeInvestorOwnership - optionPoolPercent;
  const pricePerShare = preMoneyValuation / initialFounderShares;

  const handleCopyEinSteps = () => {
    const guideText = `FREE IRS EIN APPLICATION STEPS:
1. Visit official irs.gov/ein (Mon-Fri 7am-10pm ET). Never pay 3rd parties $100-$300!
2. Select your structure (LLC, Corporation, Sole Proprietorship).
3. Input Responsible Party details (SSN or ITIN).
4. Provide Business Name, Physical Address, and Start Date.
5. Download your official CP 575 EIN Confirmation Letter PDF instantly.`;
    navigator.clipboard.writeText(guideText);
    setCopiedEinSteps(true);
    setTimeout(() => setCopiedEinSteps(false), 2500);
  };

  const handleCopyBlueprint = () => {
    const blueprintText = `STOCK BLOC - 1-PAGE SMALL BUSINESS & CREDIT BLUEPRINT
=====================================================
VALUATION & FINANCIAL RUNWAY:
• Annual Revenue: $${annualRevenue.toLocaleString()} (${netMarginPercent}% Net Margin)
• Estimated Enterprise Valuation: $${Math.round(estimatedEnterpriseValue).toLocaleString()} (${industryName} @ ${industryMultiple}x SDE)
• Current Cash Balance: $${cashBalance.toLocaleString()}
• Net Monthly Burn: $${netMonthlyBurn > 0 ? `$${netMonthlyBurn.toLocaleString()}/mo` : "CASH-FLOW POSITIVE"}
• Estimated Runway: ${runwayMonths >= 999 ? "Profitable (Infinite Runway)" : `${runwayMonths} Months`}

BUSINESS CREDIT ROADMAP (Paydex 80+ Target):
[Tier 0] LLC/C-Corp Formation -> IRS CP575 EIN -> D-U-N-S (D&B) -> Commercial Checking
[Tier 1] Starter Net-30s: Uline ($50+), Grainger, Quill ($100+), Nav Business Builder
[Tier 2] Retail & Fleet: Home Depot Commercial, Lowe's Pro, WEX Fuel Fleet
[Tier 3] Cash Lines: Chase Ink 0% APR, Brex/Ramp Corporate, SBA 7(a) Working Capital Line

Verified at Stock Bloc Accelerator (stockbloc.app)`;
    navigator.clipboard.writeText(blueprintText);
    setCopiedBlueprint(true);
    setTimeout(() => setCopiedBlueprint(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-2 sm:p-4 text-white font-mono select-none">
      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-neutral-900 to-cyan-950 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            Small Business Accelerator Hub
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBlueprint}
              className="px-3 py-1 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {copiedBlueprint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedBlueprint ? "Blueprint Copied!" : "Export 1-Page Blueprint"}</span>
            </button>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-2 animate-periodic-text-glitch">
          Small Business & Startup Command
        </h2>
        <p className="text-xs text-neutral-300 uppercase tracking-wide leading-relaxed max-w-3xl mt-1">
          Complete legal formation guides, official free IRS EIN portal, Tier 1–3 business credit roadmaps, verified grants directory, cash runway engine, and startup cap table estimators.
        </p>

        {/* Sub-Tabs Selector */}
        <div className="pt-3">
          <ResponsiveSubTabNav
            title="Small Business Hub Modules"
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            tabs={[
              {
                id: "formation",
                label: "Legal Formation & EIN",
                icon: <Scale className="w-3.5 h-3.5" />,
                badge: "$0 Official IRS",
                colorScheme: "cyan",
                description: "State LLC/C-Corp filings, IRS CP575 EIN download & commercial bank setup",
              },
              {
                id: "stripe_stack",
                label: "Stripe & Agentic Payments",
                icon: <CreditCard className="w-3.5 h-3.5 text-indigo-400" />,
                badge: "$85B Superstructure",
                colorScheme: "indigo",
                description: "Stripe Atlas, Bridge Stablecoins, Agent Toolkit LLM integration & payment fee simulator",
              },
              {
                id: "business_credit",
                label: `Tier 1-3 Credit Navigator (${completedSteps.length}/${CREDIT_STEPS.length})`,
                icon: <CreditCard className="w-3.5 h-3.5 text-indigo-300" />,
                badge: "Paydex 80+",
                colorScheme: "indigo",
                description: "Net-30 vendor reporting (Uline/Grainger), fleet cards & SBA 7(a) lines",
              },
              {
                id: "grants_directory",
                label: "Grants & Funding Directory",
                icon: <Award className="w-3.5 h-3.5 text-emerald-300" />,
                badge: "Non-Dilutive",
                colorScheme: "emerald",
                description: "Verified federal SBIR, corporate & minority business grant applications",
              },
              {
                id: "valuation_calc",
                label: "Valuation, Burn & Runway",
                icon: <Calculator className="w-3.5 h-3.5 text-amber-300" />,
                colorScheme: "amber",
                description: "EBITDA/SDE valuation multiples, net monthly burn & cash runway runway forecast",
              },
              {
                id: "startup_roadmap",
                label: "Startup to IPO Roadmap",
                icon: <Rocket className="w-3.5 h-3.5 text-pink-300" />,
                colorScheme: "cyan",
                description: "YC SAFE notes, Delaware franchise tax, 83(b) elections & investor cap tables",
              },
            ]}
          />
        </div>
      </div>

      {/* TAB 1: LEGAL FORMATION & EIN */}
      {activeTab === "formation" && (
        <div className="space-y-6">
          {/* FREE IRS EIN WARNING BANNER */}
          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                CRITICAL WARNING: FREE IRS GOVERNMENT PORTAL
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                $0 Official Fee
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white">
              Do NOT Pay $100 to $300 to Third-Party Filing Sites for an EIN!
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              The U.S. Internal Revenue Service (IRS) provides Employer Identification Numbers (EINs) <strong className="text-amber-300">100% FREE</strong> online with instant download of your official CP 575 confirmation document.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20">
              <button
                onClick={handleCopyEinSteps}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 cursor-pointer"
              >
                {copiedEinSteps ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {copiedEinSteps ? "EIN Guide Copied!" : "Copy EIN Step Checklist"}
                </span>
              </button>

              <a
                href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Official IRS.gov Free EIN Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Entity Choice Matrix */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              Entity Structure Selection Guide (LLC vs C-Corp vs S-Corp)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      Best for Small Biz & Real Estate
                    </span>
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      Limited Liability Company (LLC)
                    </h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      Flexible asset protection with pass-through taxation. Avoids double taxation and requires minimal annual corporate formalities.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <a
                    href="https://www.sba.gov/business-guide/launch-your-business/choose-business-structure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>SBA LLC Structure Guide</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                      Venture Capital & Tech Startups
                    </span>
                    <Briefcase className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      Delaware C-Corporation
                    </h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      Gold standard for tech startups raising outside VC funding. Issues stock classes and qualifies for Section 1202 QSBS tax exclusion.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <a
                    href="https://corp.delaware.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Delaware Division of Corporations</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                      Tax Savings on $60k+ Profits
                    </span>
                    <Landmark className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">
                      S-Corporation Election (Form 2553)
                    </h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      Tax status election for LLCs making $60k+ net profit. Pay a reasonable W-2 salary and take remaining profits as dividends (saving 15.3% SE tax).
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <a
                    href="https://www.irs.gov/forms-pubs/about-form-2553"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>IRS Form 2553 Instructions</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory FinCEN BOI Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Mandatory FinCEN BOI (Beneficial Ownership Information) Filing
              </h3>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30">
                Corporate Transparency Act
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Under federal law, nearly all LLCs, Corporations, and foreign entities formed in the U.S. must submit a free Beneficial Ownership Information (BOI) report identifying 25%+ owners to the Financial Crimes Enforcement Network (FinCEN).
            </p>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                FinCEN Official e-Filing Portal ($0 Fee)
              </span>
              <a
                href="https://boiefiling.fincen.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                <span>File FinCEN BOI Report</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STRIPE & AGENTIC PAYMENTS */}
      {activeTab === "stripe_stack" && <StripeFintechSuite />}

      {/* TAB 2: TIER 1-3 CREDIT NAVIGATOR */}
      {activeTab === "business_credit" && (
        <div className="space-y-6">
          {/* Interactive Progress Bar */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-cyan-500/40 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  Corporate Credit Readiness Score: {creditProgressPercent}%
                </span>
                <h3 className="text-lg font-black text-white">
                  Step-by-Step Business Credit Tier Roadmap
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {completedSteps.length} of {CREDIT_STEPS.length} Completed
              </span>
            </div>

            {/* Visual Progress Track */}
            <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${creditProgressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Check off completed steps below to track your progress toward an 80+ Paydex score and unsecured corporate credit lines without personal guarantees.
            </p>
          </div>

          {/* Interactive Tier Step Cards */}
          <div className="space-y-3">
            {CREDIT_STEPS.map((step) => {
              const isChecked = completedSteps.includes(step.id);
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isChecked
                      ? "bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-950/30"
                      : "bg-neutral-900/80 border-white/10 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isChecked
                          ? "bg-emerald-400 border-emerald-400 text-black font-bold"
                          : "border-neutral-600 bg-neutral-950"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                          {step.tier}
                        </span>
                        <h4
                          className={`text-sm font-bold ${
                            isChecked ? "text-emerald-200 line-through opacity-85" : "text-white"
                          }`}
                        >
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {step.requirement}
                      </p>
                      <span className="text-[10px] font-mono text-cyan-400/80 block">
                        Reports to: {step.bureauReported}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0 self-end sm:self-center">
                    <a
                      href={step.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <span>{step.actionLabel}</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED GRANTS DIRECTORY */}
      {activeTab === "grants_directory" && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search grants by keyword..."
                  value={grantSearch}
                  onChange={(e) => setGrantSearch(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {[
                  { id: "all", label: "All Grants" },
                  { id: "federal", label: "Federal / SBA" },
                  { id: "corporate", label: "Corporate" },
                  { id: "women_minority", label: "Women & Minority" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      triggerHaptic("selection");
                      setGrantCategory(tab.id as any);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      grantCategory === tab.id
                        ? "bg-emerald-400 text-black font-extrabold"
                        : "bg-white/5 text-neutral-400 hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grants Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGrants.map((grant) => (
              <div
                key={grant.id}
                className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      {grant.amount}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {grant.deadline}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white">
                    {grant.title}
                  </h4>
                  <p className="text-xs text-cyan-300 font-medium">
                    Provider: {grant.provider}
                  </p>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {grant.description}
                  </p>

                  <div className="pt-2 text-[11px] text-neutral-400 border-t border-white/10 space-y-1">
                    <span className="text-neutral-300 font-bold block">Eligibility:</span>
                    <p>{grant.eligibility}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase font-mono">
                    100% Non-Dilutive Grant
                  </span>
                  <a
                    href={grant.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-400/20 active:scale-95 transition-all"
                  >
                    <span>Apply on Portal</span>
                    <ExternalLink className="w-3 h-3 text-black" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VALUATION, CASH RUNWAY & CAP TABLE */}
      {activeTab === "valuation_calc" && (
        <div className="space-y-6">
          {/* SECTION A: BUSINESS VALUATION BY INDUSTRY MULTIPLE */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-cyan-500/40 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30">
                  Valuation Engine
                </span>
                <h3 className="text-lg font-black text-white">
                  Small Business Valuation by Industry Multiple
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block font-mono">Estimated Valuation</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                  ${Math.round(estimatedEnterpriseValue).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label className="text-neutral-400 block">Annual Gross Revenue</label>
                <input
                  type="number"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-neutral-900 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-cyan-200 font-black focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label className="text-neutral-400 block">Net Profit / SDE Margin ({netMarginPercent}%)</label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={netMarginPercent}
                  onChange={(e) => setNetMarginPercent(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-neutral-400">
                  Annual SDE Profit: ${Math.round(annualProfitSDE).toLocaleString()}
                </span>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label className="text-neutral-400 block">Industry Sector Multiple</label>
                <select
                  value={`${industryMultiple}-${industryName}`}
                  onChange={(e) => {
                    const [mult, name] = e.target.value.split("-");
                    setIndustryMultiple(parseFloat(mult));
                    setIndustryName(name);
                  }}
                  className="w-full bg-neutral-900 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-cyan-200 font-bold focus:outline-none text-xs"
                >
                  <option value="6.5-SaaS & AI Software">SaaS & AI Software (6.5x SDE)</option>
                  <option value="4.5-E-commerce & Brand">E-commerce & Brand (4.5x SDE)</option>
                  <option value="3.5-Professional Services">Professional Services (3.5x SDE)</option>
                  <option value="4.0-Healthcare & Med">Healthcare & Med (4.0x SDE)</option>
                  <option value="3.0-Retail & Restaurant">Retail & Restaurant (3.0x SDE)</option>
                </select>
              </div>
            </div>

            {/* Valuation Range Box */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-neutral-400 block text-[11px]">Conservative Multiple Range:</span>
                <span className="text-emerald-300 font-black text-sm">
                  ${Math.round(estimatedLowVal).toLocaleString()} — ${Math.round(estimatedHighVal).toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 block text-[11px]">Annual Cash Flow (SDE):</span>
                <span className="text-cyan-300 font-bold">
                  ${Math.round(annualProfitSDE).toLocaleString()}/yr
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B: CASH RUNWAY & MONTHLY BURN RATE ENGINE */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-emerald-500/40 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30">
                  Burn & Runway Engine
                </span>
                <h3 className="text-lg font-black text-white">
                  Cash Runway & Monthly Net Burn Simulator
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block font-mono">Est. Runway Remaining</span>
                <span
                  className={`text-xl sm:text-2xl font-black font-mono ${
                    runwayMonths >= 18
                      ? "text-emerald-300"
                      : runwayMonths >= 6
                      ? "text-amber-300"
                      : "text-rose-400 animate-pulse"
                  }`}
                >
                  {runwayMonths >= 999 ? "Cashflow Positive" : `${runwayMonths} Months`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label className="text-neutral-400 block">Bank Cash Balance</label>
                <input
                  type="number"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-neutral-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-emerald-300 font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label className="text-neutral-400 block">Monthly Revenue</label>
                <input
                  type="number"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-neutral-900 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-cyan-300 font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label className="text-neutral-400 block">Monthly Payroll</label>
                <input
                  type="number"
                  value={monthlyPayroll}
                  onChange={(e) => setMonthlyPayroll(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-neutral-900 border border-rose-500/40 rounded-lg px-2.5 py-1 text-rose-300 font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label className="text-neutral-400 block">Monthly OpEx / Cloud</label>
                <input
                  type="number"
                  value={monthlyOpex}
                  onChange={(e) => setMonthlyOpex(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-neutral-900 border border-rose-500/40 rounded-lg px-2.5 py-1 text-rose-300 font-bold"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-2 rounded-xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-neutral-400 block">Total Monthly Expenses</span>
                <span className="text-rose-400 font-black text-sm">${totalMonthlyBurn.toLocaleString()}/mo</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-neutral-400 block">Net Monthly Burn</span>
                <span className={`font-black text-sm ${netMonthlyBurn > 0 ? "text-amber-300" : "text-emerald-400"}`}>
                  {netMonthlyBurn > 0 ? `-$${netMonthlyBurn.toLocaleString()}/mo` : `+$${Math.abs(netMonthlyBurn).toLocaleString()}/mo`}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 space-y-0.5">
                <span className="text-[10px] text-neutral-400 block">Recommended 24M Raise Target</span>
                <span className="text-cyan-300 font-black text-sm">
                  {targetRaiseFor24Months > 0 ? `$${targetRaiseFor24Months.toLocaleString()}` : "$0 (Self-Sustaining)"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION C: STARTUP CAP TABLE & SAFE ESTIMATOR */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-amber-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30">
                  Cap Table Model
                </span>
                <h3 className="text-lg font-black text-white">
                  Startup Cap Table & SAFE Dilution Estimator
                </h3>
              </div>
              <a
                href="https://www.ycombinator.com/documents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1"
              >
                <span>YC SAFE Template</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-2 p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-medium">Pre-Money Valuation:</span>
                  <span className="font-mono font-black text-cyan-300">${preMoneyValuation.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={30000000}
                  step={500000}
                  value={preMoneyValuation}
                  onChange={(e) => setPreMoneyValuation(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-medium">SAFE Investment Amount:</span>
                  <span className="font-mono font-black text-emerald-300">${safeInvestmentAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={100000}
                  value={safeInvestmentAmount}
                  onChange={(e) => setSafeInvestmentAmount(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-0.5">
                <span className="text-[9px] text-cyan-300 uppercase font-bold block">Post-Money Val</span>
                <span className="text-base font-black text-cyan-300">${postMoneyValuation.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-0.5">
                <span className="text-[9px] text-emerald-300 uppercase font-bold block">Investor Equity</span>
                <span className="text-base font-black text-emerald-300">{safeInvestorOwnership.toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-0.5">
                <span className="text-[9px] text-indigo-300 uppercase font-bold block">Founder Equity</span>
                <span className="text-base font-black text-indigo-300">{founderPostOwnership.toFixed(1)}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-0.5">
                <span className="text-[9px] text-amber-300 uppercase font-bold block">Implied PPS</span>
                <span className="text-base font-black text-amber-300">${pricePerShare.toFixed(3)}/sh</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STARTUP TO M&A / IPO ROADMAP */}
      {activeTab === "startup_roadmap" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-cyan-400" />
                The 4-Stage Startup Lifecycle: From Idea to Nasdaq IPO / M&A Exit
              </h3>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30">
                Venture Playbook
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase font-mono">Stage 1: Pre-Seed / Seed</span>
                <h4 className="text-sm font-bold text-white">Entity, MVP & YC SAFE Rounds</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Incorporate Delaware C-Corp, issue 10M founder common shares, build minimal viable product, and raise $500k-$2M on Post-Money SAFEs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">Stage 2: Series A & Scaling</span>
                <h4 className="text-sm font-bold text-white">Product-Market Fit & Priced Preferred Round</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Establish $1M+ ARR, convert SAFEs into Preferred Series A Stock, install professional board of directors, and expand sales/engineering.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase font-mono">Stage 3: Growth & Series B/C</span>
                <h4 className="text-sm font-bold text-white">Market Dominance & International Expansion</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Scale to $10M-$50M ARR, raise growth capital from crossover hedge funds and sovereign wealth, optimize EBITDA margins and unit economics.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono">Stage 4: Liquidity Exit</span>
                <h4 className="text-sm font-bold text-white">Strategic M&A Acquisition or Nasdaq / NYSE S-1 IPO</h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  File SEC Form S-1 with investment banks (Goldman Sachs, Morgan Stanley) or negotiate cash/stock acquisition with Fortune 500 tech acquirers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
