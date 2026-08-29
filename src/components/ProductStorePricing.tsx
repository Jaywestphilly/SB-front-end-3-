import React, { useState } from "react";
import {
  BookOpen,
  Sparkles,
  Zap,
  Check,
  ArrowRight,
  ShieldCheck,
  Download,
  Bot,
  Key,
  CreditCard,
  Wallet,
  Star,
  FileText,
  Lock,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { StoreProduct, ViewTab } from "../types";
import { StripeCheckoutModal, CheckoutItem } from "./StripeCheckoutModal";
import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";

interface Props {
  onSelectTab?: (tab: ViewTab) => void;
  onSuccessCheckout?: (sessionId: string) => void;
}

export const ProductStorePricing: React.FC<Props> = ({
  onSelectTab,
  onSuccessCheckout,
}) => {
  const [selectedItem, setSelectedItem] = useState<CheckoutItem | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [initialPayment, setInitialPayment] = useState<"card" | "crypto">("card");

  const handleOpenCheckout = (item: CheckoutItem, method: "card" | "crypto" = "card") => {
    triggerHaptic("light");
    setInitialPayment(method);
    setSelectedItem(item);
  };


  // 1. Digital Playbooks & Master E-Books
  const playbooksList: CheckoutItem[] = [
    {
      id: "wealth_operating_system",
      title: "The Stock Bloc Wealth Operating System (260 Pages)",
      category: "playbook",
      price: 5,
      displayPrice: "$5",
      features: [
        "Full 260-Page Master Wealth Operating System",
        "12 Core Modules: Credit, Real Estate, Stocks, AI, Startups, Space",
        "150+ Interactive Workbooks, Calculators & Decision Logs",
        "12-Month Wealth Planners & 26 Weekly Scorecards",
        "Instant High-Resolution PDF Download",
      ],
    },
    {
      id: "future_wealth_blueprint",
      title: "Stock Bloc: The Future Wealth Blueprint (108 Pages)",
      category: "playbook",
      price: 5,
      displayPrice: "$5",
      features: [
        "108-Page Complete Future Wealth Guide by Jumanne Carter",
        "The New Wealth Stack & AI Leverage Frameworks",
        "Robotics, Physical AI & Space Economy Investment Stack",
        "5-Year Ownership Map & Stock Bloc Manifesto",
        "Instant PDF Digital Delivery",
      ],
    },
    {
      id: "playbook_13f_whale",
      title: "13F Whale Tracking & SEC Filing Playbook",
      category: "playbook",
      price: 5,
      displayPrice: "$5",
      features: [
        "SEC EDGAR 13F Quarterly Analysis Templates",
        "Top Hedge Fund Smart Money Holding Indicators",
        "Institutional Accumulation vs Distribution Signal Matrix",
        "Python & Pandas 13F Automated Scraper Scripts",
        "Direct PDF Download + Instant Code Samples",
      ],
    },
    {
      id: "playbook_credit_800",
      title: "Credit 800+ Dispute & FICO Repair Blueprint",
      category: "playbook",
      price: 5,
      displayPrice: "$5",
      features: [
        "60-Day FCRA Bureau Dispute Letter Templates",
        "609 / 611 / 623 Dispute Strategy Flowcharts",
        "Primary Line Optimization & High Limit Hacks",
        "Hard Inquiry Removal & Debt Validation Guides",
        "Downloadable Fillable Word & PDF Templates",
      ],
    },
    {
      id: "playbook_reit_realestate",
      title: "Real Estate & REIT Cash Flow Matrix",
      category: "playbook",
      price: 5,
      displayPrice: "$5",
      features: [
        "Cap Rate, DSCR & Cash-on-Cash Return Underwriting",
        "REIT Dividend Coverage Ratio Calculator",
        "Multi-Family & Single-Family BRRRR Pro Forma",
        "SBA 7(a) Commercial Property Financing Rules",
        "Excel / Google Sheets Financial Models",
      ],
    },
  ];

  const trilogyBundleItem: CheckoutItem = {
    id: "bundle_trilogy_complete",
    title: "Complete Stock Bloc Trilogy Playbook Bundle",
    category: "playbook",
    price: 5,
    displayPrice: "$5",
    features: [
      "All 3 Master Playbooks (13F Whale, Credit 800+, REIT Cash Flow)",
      "Instant Access to All Excel Models & Word Dispute Letters",
      "Bonus: Autonomous AI Agent System Prompt Library",
      "Lifetime Updates & Priority Download Access",
      "Priced to Sell Flash Special - $5 Today!",
    ],
  };

  // 2. Quant Suite Pro Subscription
  const proSubscriptionMonthly: CheckoutItem = {
    id: "subscription_pro_monthly",
    title: "Quant Suite Pro Subscription (Monthly)",
    category: "subscription",
    price: 5,
    displayPrice: "$5/mo",
    billingPeriod: "monthly",
    features: [
      "Real-Time RSI & Volatility Signals & Alerts",
      "13F Whale Accumulation Alerts (Email & Webhook)",
      "Unlimited Saved Portfolios & Watchlists in 'My Bloc'",
      "Priority Copilot Terminal Access & DeepSeek/Gemini AI",
      "5,000 API Credits / Month Included for AI Agents",
    ],
  };

  const proSubscriptionYearly: CheckoutItem = {
    id: "subscription_pro_yearly",
    title: "Quant Suite Pro Subscription (Yearly)",
    category: "subscription",
    price: 5,
    displayPrice: "$5/yr",
    billingPeriod: "yearly",
    features: [
      "Includes All Monthly Pro Features (Special $5 Flash Pricing!)",
      "Real-Time RSI & Volatility Alerts",
      "13F Whale Accumulation Webhook Alerts",
      "Unlimited Saved Portfolios in 'My Bloc'",
      "75,000 Annual API Credits Included for AI Agents",
    ],
  };

  // 3. AI Agent API Key Credit Bundles
  const apiBundles: CheckoutItem[] = [
    {
      id: "api_bundle_10",
      title: "Starter API Credit Refill (1,000 Credits)",
      category: "api_bundle",
      price: 5,
      displayPrice: "$5",
      creditsGranted: 1000,
      features: [
        "1,000 Metered API Requests for /api/v1/agent/quant-sim",
        "Live Market Quote API Access (/api/live-quote/:symbol)",
        "Instant API Key Generation (sb_live_...)",
        "Zero Rate Limit Throttle & High Concurrency",
      ],
    },
    {
      id: "api_bundle_25",
      title: "Quant Agent Refill (3,000 Credits)",
      category: "api_bundle",
      price: 5,
      displayPrice: "$5",
      creditsGranted: 3000,
      features: [
        "3,000 Metered API Requests (Best Value for Agents)",
        "Access to /api/v1/agent/quant-sim & Backtests",
        "Instant API Key Generation (sb_live_...)",
        "Full Open-API 3.0 & LangChain Tool Support",
      ],
    },
    {
      id: "api_bundle_50",
      title: "Sovereign Agent Refill (7,500 Credits)",
      category: "api_bundle",
      price: 5,
      displayPrice: "$5",
      creditsGranted: 7500,
      features: [
        "7,500 Metered API Requests for Production Pipelines",
        "Priority High-Speed Dedicated Agent Route",
        "Instant API Key Generation (sb_live_...)",
        "Lifetime Unused Credit Rollover",
      ],
    },
  ];

  return (
    <div className="space-y-10 pb-12 font-mono">
      {/* Top Banner Header */}
      <div className="bg-[#020a16] border-2 border-emerald-500/50 alien-block-cut p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="hud-corner-tl border-emerald-400" />
        <div className="hud-corner-tr border-emerald-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded alien-block-cut-sm">
                Stock Bloc Official Store
              </span>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 rounded alien-block-cut-sm">
                Stripe Payments Live
              </span>
              <NotFinancialAdviceTag />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-tech text-white uppercase tracking-wide">
              PRODUCT STORE & API CREDIT MARKETPLACE
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-2xl leading-relaxed">
              Unlock tactical digital playbooks, upgrade to the Quant Suite Pro terminal, or refill API credit balances for autonomous AI trading agents.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-center">
              <div className="text-[10px] text-neutral-400 font-sans">STORES STATUS</div>
              <div className="text-xs font-black font-tech text-emerald-400 uppercase flex items-center gap-1.5 justify-center mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                INSTANT DELIVERY ACTIVE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DIGITAL PLAYBOOKS ($47 / $97) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-400 rounded alien-block-cut-sm text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-tech text-white uppercase tracking-wide">
                1. DIGITAL WEALTH & ALPHA PLAYBOOKS
              </h2>
              <p className="text-xs text-neutral-300 font-sans">
                Field-tested manuals with fillable templates, SEC scrapers, and underwriting models.
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-300 font-tech font-bold hidden sm:inline-block">
            INSTANT PDF DOWNLOAD
          </span>
        </div>

        {/* Individual Playbooks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {playbooksList.map((pb) => (
            <div
              key={pb.id}
              className="bg-[#020a14] border-2 border-amber-500/40 hover:border-amber-400 alien-block-cut p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
            >
              <div className="hud-corner-tl border-amber-500/40" />
              <div className="hud-corner-tr border-amber-500/40" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                    MASTER PLAYBOOK
                  </span>
                  <span className="text-2xl font-black text-amber-300 font-tech">
                    {pb.displayPrice}
                  </span>
                </div>

                <h3 className="text-base font-black text-white font-tech uppercase tracking-wide mb-3 group-hover:text-amber-300 transition-colors">
                  {pb.title}
                </h3>

                <div className="space-y-2 mb-6">
                  {pb.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300 font-sans">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => handleOpenCheckout(pb, "card")}
                  data-testid={`buy-card-${pb.id}`}
                  className="w-full py-2.5 bg-amber-400 text-black font-black font-tech uppercase text-[10px] tracking-wider alien-block-cut-sm hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span>CARD/USDC</span>
                </button>
                <button
                  onClick={() => handleOpenCheckout(pb, "crypto")}
                  data-testid={`buy-crypto-${pb.id}`}
                  className="w-full py-2.5 bg-neutral-900 border border-amber-500/50 text-amber-400 font-black font-tech uppercase text-[10px] tracking-wider alien-block-cut-sm hover:bg-neutral-800 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                >
                  <Wallet className="w-4 h-4 mb-1" />
                  <span>BTC/CRYPTO</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trilogy Bundle Special Card */}
        <div className="bg-gradient-to-r from-amber-950/80 via-[#0b1b2d] to-amber-950/80 border-2 border-amber-400 alien-block-cut p-6 sm:p-8 relative shadow-2xl overflow-hidden text-center space-y-4">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-black font-black font-tech text-xs uppercase tracking-widest alien-block-cut-sm shadow-md">
            <Star className="w-3.5 h-3.5 text-black fill-black" />
            <span>BEST VALUE: COMPLETE TRILOGY BUNDLE</span>
            <Star className="w-3.5 h-3.5 text-black fill-black" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-tech text-white uppercase tracking-wider">
            THE COMPLETE STOCK BLOC TRILOGY PLAYBOOK BUNDLE
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl mx-auto">
            Get all 3 master tactical playbooks (13F Whale Tracking, Credit 800+ Dispute, and REIT Cash Flow Matrix). Save $44 instantly compared to buying separately.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-neutral-500 line-through font-mono">$141 VALUE</span>
            <span className="text-4xl font-black text-amber-300 font-tech">$5</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded font-bold font-mono">
              PRICED TO SELL FLASH SPECIAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full max-w-2xl mx-auto">
            <button
              onClick={() => handleOpenCheckout(trilogyBundleItem, "card")}
              data-testid="buy-trilogy-bundle-card"
              className="px-6 py-3.5 bg-amber-400 text-black font-black font-tech uppercase text-xs sm:text-sm tracking-widest alien-block-cut-sm hover:bg-amber-300 shadow-xl shadow-amber-400/30 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-black" />
              <span>CARD/USDC ($5)</span>
            </button>
            <button
              onClick={() => handleOpenCheckout(trilogyBundleItem, "crypto")}
              data-testid="buy-trilogy-bundle-crypto"
              className="px-6 py-3.5 bg-neutral-900 border-2 border-amber-500/50 text-amber-400 font-black font-tech uppercase text-xs sm:text-sm tracking-widest alien-block-cut-sm hover:bg-neutral-800 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>BTC/CRYPTO ($5)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: QUANT SUITE PRO SUBSCRIPTION ($5/mo or $5/yr) */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 border border-cyan-400 rounded alien-block-cut-sm text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-tech text-white uppercase tracking-wide">
                2. QUANT SUITE PRO SUBSCRIPTION
              </h2>
              <p className="text-xs text-neutral-300 font-sans">
                Institutional market workstation, real-time RSI alerts, and 13F whale webhooks.
              </p>
            </div>
          </div>

          {/* Monthly vs Yearly Toggle */}
          <div className="flex items-center bg-black/80 border border-cyan-500/40 rounded-xl p-1 text-xs font-mono shrink-0">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Monthly ($5/mo)
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                billingCycle === "yearly"
                  ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>Yearly ($5/yr)</span>
              <span className="text-[9px] bg-emerald-500 text-black font-black px-1.5 py-0.2 rounded">
                $5 DEAL
              </span>
            </button>
          </div>
        </div>

        {/* Pro Card */}
        <div className="bg-[#020d1c] border-2 border-cyan-500/50 alien-block-cut p-6 sm:p-8 shadow-2xl relative space-y-6">
          <div className="hud-corner-tl border-cyan-400" />
          <div className="hud-corner-tr border-cyan-400" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-cyan-500/30 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 uppercase font-bold mb-2">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                RECURRING STRIPE BILLING
              </div>
              <h3 className="text-2xl font-black font-tech text-white uppercase tracking-wide">
                QUANT SUITE PRO TERMINAL & WHALE RADAR
              </h3>
              <p className="text-xs text-neutral-300 font-sans max-w-xl mt-1">
                Full real-time workstation access with zero delayed quotes, priority copilot agent processing, and instant webhook alerts.
              </p>
            </div>

            <div className="text-left md:text-right shrink-0">
              <div className="text-3xl font-black font-tech text-cyan-300">
                $5
                <span className="text-xs font-normal text-neutral-400">
                  {billingCycle === "monthly" ? "/month" : "/year"}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                {billingCycle === "yearly" ? "Billed annually ($5/yr special)" : "Cancel anytime in 1 click"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Real-Time RSI & Volatility Alerts on All Stocks",
              "13F Whale Accumulation Email & Webhook Alerts",
              "Unlimited Saved Portfolios & Watchlists in 'My Bloc'",
              "Priority Copilot Terminal Access (Gemini & DeepSeek)",
              "5,000 Included Monthly API Credits for AI Agents",
              "Level 2 Order Book Depth & Market Flow Metrics",
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-neutral-200 font-sans">
                <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() =>
                handleOpenCheckout(
                  billingCycle === "monthly" ? proSubscriptionMonthly : proSubscriptionYearly,
                  "card"
                )
              }
              data-testid="upgrade-pro-btn-card"
              className="w-full py-4 bg-cyan-400 text-black font-black font-tech uppercase text-xs sm:text-sm tracking-wider alien-block-cut-sm hover:bg-cyan-300 shadow-xl shadow-cyan-400/20 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-black" />
              <span>CARD/USDC ({billingCycle === "monthly" ? "$5/mo" : "$5/yr"})</span>
            </button>
            <button
              onClick={() =>
                handleOpenCheckout(
                  billingCycle === "monthly" ? proSubscriptionMonthly : proSubscriptionYearly,
                  "crypto"
                )
              }
              data-testid="upgrade-pro-btn-crypto"
              className="w-full py-4 bg-neutral-900 border-2 border-cyan-500/50 text-cyan-400 font-black font-tech uppercase text-xs sm:text-sm tracking-wider alien-block-cut-sm hover:bg-neutral-800 transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>BTC/CRYPTO ({billingCycle === "monthly" ? "$5/mo" : "$5/yr"})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI AGENT API KEY CREDIT REFILL BUNDLES ($5 ALL) */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400 rounded alien-block-cut-sm text-emerald-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-tech text-white uppercase tracking-wide">
                3. AI AGENT API KEY CREDIT REFILL BUNDLES ($5 EACH)
              </h2>
              <p className="text-xs text-neutral-300 font-sans">
                Metered API credits for autonomous trading subagents calling <span className="text-emerald-300 font-mono">/api/v1/agent/quant-sim</span>.
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-tech font-bold hidden sm:inline-block">
            METERED AGENT ACCESS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apiBundles.map((bundle, idx) => (
            <div
              key={bundle.id}
              className={`bg-[#020f18] border-2 alien-block-cut p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${
                idx === 1
                  ? "border-emerald-400 shadow-emerald-500/20"
                  : "border-emerald-500/40 hover:border-emerald-400"
              }`}
            >
              <div className="hud-corner-tl border-emerald-400" />
              <div className="hud-corner-tr border-emerald-400" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                    {idx === 1 ? "POPULAR FOR AGENTS" : "API CREDIT BUNDLE"}
                  </span>
                  <span className="text-2xl font-black text-emerald-300 font-tech">
                    {bundle.displayPrice}
                  </span>
                </div>

                <h3 className="text-base font-black text-white font-tech uppercase tracking-wide mb-2 group-hover:text-emerald-300 transition-colors">
                  {bundle.title}
                </h3>

                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-center mb-4">
                  <span className="text-xs font-bold text-neutral-400">INCLUDED CREDITS: </span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {bundle.creditsGranted?.toLocaleString()} REQUESTS
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  {bundle.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300 font-sans">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => handleOpenCheckout(bundle, "card")}
                  data-testid={`buy-card-${bundle.id}`}
                  className="w-full py-2.5 bg-emerald-400 text-black font-black font-tech uppercase text-[10px] tracking-wider alien-block-cut-sm hover:bg-emerald-300 shadow-lg shadow-emerald-400/20 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span>CARD/USDC</span>
                </button>
                <button
                  onClick={() => handleOpenCheckout(bundle, "crypto")}
                  data-testid={`buy-crypto-${bundle.id}`}
                  className="w-full py-2.5 bg-neutral-900 border border-emerald-500/50 text-emerald-400 font-black font-tech uppercase text-[10px] tracking-wider alien-block-cut-sm hover:bg-neutral-800 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                >
                  <Wallet className="w-4 h-4 mb-1" />
                  <span>BTC/CRYPTO</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe Checkout Modal Overlay */}
      {selectedItem && (
        <StripeCheckoutModal
          item={selectedItem}
          initialPaymentMethod={initialPayment}
          onClose={() => setSelectedItem(null)}
          onSuccess={(sessionId) => {
            setSelectedItem(null);
            if (onSuccessCheckout) {
              onSuccessCheckout(sessionId);
            } else {
              window.location.href = `/checkout/success?session_id=${sessionId}`;
            }
          }}
        />
      )}
    </div>
  );
};
