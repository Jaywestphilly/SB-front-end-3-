import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ShieldCheck,
  Layers,
  Building2,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
  Zap,
  Bot,
  Copy,
  Terminal,
  Code2,
  Cpu,
  Download,
  Eye,
  FileCheck,
  Library,
} from "lucide-react";
import { NotFinancialAdviceTag } from "../../components/NotFinancialAdviceTag";
import { trackEvent } from "../../utils/analytics";
import { triggerHaptic } from "../../utils/haptics";

import { AgentLeaderboard } from "../../components/AgentLeaderboard";
import { StrategyNotebook } from "../../components/StrategyNotebook";
import { AgentDiscoveryGuide } from "../../components/AgentDiscoveryGuide";
import { ProductStorePricing } from "../../components/ProductStorePricing";
import { EBookReaderModal, STOCK_BLOC_EBOOKS, EBook } from "../../components/EBookReaderModal";


interface Props {
  onSelectTab?: (tab: string) => void;
}

export const PlaybooksHub: React.FC<Props> = ({ onSelectTab }) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [activeEBook, setActiveEBook] = useState<EBook | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "leaderboard" | "notebook" | "prompts" | "discovery" | "books">("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [activeSubTab]);

  const handleCopyPrompt = (promptId: string, promptText: string) => {
    triggerHaptic("selection");
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(promptId);
    trackEvent("prompt_copied", { promptId });
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const agentPrompts = [
    {
      id: "13f_analyzer_prompt",
      title: "SEC 13F INSTITUTIONAL WHALE ANALYZER",
      targetModel: "Claude 3.5 / DeepSeek-R1 / Gemini 2.0 / Llama 3",
      category: "13F Filings",
      description:
        "Extract institutional conviction scores, top Q/Q position shifts, sector rotation, and whale sentiment from SEC 13F filing disclosures.",
      promptText: `[SYSTEM PROMPT - SEC 13F INSTITUTIONAL WHALE ANALYZER]
You are an expert SEC 13F Institutional Equity Analyst and Quantitative Strategist.
Your task is to analyze raw 13F-HR filing disclosures or portfolio holding tables and output a structured financial assessment.

INSTRUCTIONS:
1. Calculate the Institutional Conviction Score (Scale 1-10) based on position size relative to portfolio weight and Q/Q changes.
2. Identify Top 3 Accumulations (net new positions & major position increases).
3. Identify Top 3 Liquidations or Reductions.
4. Highlight Sector Allocation Shifts (e.g. Tech CapEx, Healthcare, Defense, Real Estate).
5. Output a concise 3-bullet Risk & Signal Assessment for algorithmic ingestion.

INPUT DATA:
[Paste 13F Holdings Table or Stock Symbols Here]`,
    },
    {
      id: "fcra_dispute_prompt",
      title: "FCRA 609 CREDIT DISPUTE DRAFTING AGENT",
      targetModel: "GPT-4o / Claude 3.5 / Local DeepSeek",
      category: "Credit Repair",
      description:
        "Draft legally enforceable, FCRA-compliant bureau dispute letters demanding Section 609 verification for late payments or inquiries.",
      promptText: `[SYSTEM PROMPT - FCRA SECTION 609 CREDIT DISPUTE GENERATOR]
You are a Board-Certified Consumer Rights Specialist and FCRA Legal Auditor.
Draft a formal, legally binding credit dispute letter to [Equifax / Experian / TransUnion] under 15 U.S.C. § 1681i and FCRA Section 609(a)(1).

INPUT PARAMETERS:
- Consumer Name: [Full Legal Name]
- Bureau Address: [Equifax/Experian/TransUnion Legal Dept Address]
- Disputed Item: [Creditor Name & Partial Account #]
- Reason: [Unverified derogatory mark / Incorrect payment history / Fraudulent inquiry]

REQUIREMENTS:
1. Include statutory reference demanding original signed contract and unredacted verification.
2. State the mandatory 30-day statutory investigation deadline.
3. Include notice of intent to report non-compliance to the CFPB (Consumer Financial Protection Bureau).
4. Format clean plaintext suitable for certified physical mailing.`,
    },
    {
      id: "real_estate_audit_prompt",
      title: "REAL ESTATE DEAL CASH FLOW & CAP RATE AUDITOR",
      targetModel: "Gemini 1.5 Pro / GPT-4o / Local Llama-3-70B",
      category: "Real Estate PE",
      description:
        "Underwrite residential & commercial rental deals, calculate Net Operating Income (NOI), Cap Rates, and Cash-on-Cash ROI.",
      promptText: `[SYSTEM PROMPT - REAL ESTATE DEAL UNDERWRITING AGENT]
You are a Real Estate Private Equity Analyst auditing property acquisition proposals.

PROPERTY DATA INPUT:
- Purchase Price: $[Price]
- Monthly Gross Rent: $[Rent]
- Down Payment: [X]% | Interest Rate: [X]%
- Annual Property Taxes: $[Taxes] | Insurance: $[Insurance]/yr

CALCULATION PROTOCOL:
1. Effective Gross Income (assuming 5% vacancy allowance).
2. Operating Expenses (10% property management, 5% maintenance reserve, taxes, insurance).
3. Net Operating Income (NOI).
4. Monthly Debt Service (P&I) & Net Monthly Cash Flow.
5. Cap Rate (%) and Cash-on-Cash ROI (%).
6. VERDICT: Categorize deal as "HIGH YIELD CASH FLOW", "STABLE HOLD", or "CASH FLOW NEGATIVE / DANGER".`,
    },
    {
      id: "quant_rsi_screener_prompt",
      title: "QUANT MOMENTUM & RSI ALPHA SCREENER",
      targetModel: "DeepSeek-R1 / Gemini 2.0 / Local Qwen",
      category: "Stock Technicals",
      description:
        "Analyze stock prices, 14-day RSI indicators, and moving average cross signals to generate quantitative trade signals.",
      promptText: `[SYSTEM PROMPT - QUANTITATIVE MOMENTUM ALGORITHM]
You are a Quantitative Trading System specializing in RSI mean-reversion and momentum breakout strategies.

TICKER INPUT:
- Symbol: [Symbol, e.g. NVDA]
- Current Price: $[Price]
- RSI (14-Period): [Value]
- 50-SMA vs 200-SMA: [Above / Below / Golden Cross]

OUTPUT SCHEMA:
1. Quantitative Signal: [STRONG_BUY / ACCUMULATE / NEUTRAL / REDUCE / SHORT]
2. Calculated Support & Resistance Levels.
3. Optimal Risk/Reward Stop-Loss and Target Price for a 14-day horizon.
4. Concise JSON payload for automated trading agent execution.`,
    },
  ];

  const playbooks = [
    {
      id: "credit_800",
      title: "800+ CREDIT SCORE BLUEPRINT",
      category: "Credit Masterclass",
      icon: ShieldCheck,
      description:
        "From 500 to 800 in 12 months. Step-by-step dispute letter templates, credit card utilization hacks, and primary tradeline strategies.",
      price: "$5",
      features: [
        "15/3 Credit Card Payment Cycle System",
        "Dispute Letter Templates & FCRA Guide",
        "Primary vs Authorized User Tradeline Strategy",
        "Authorized Dealer Credit Union Blueprint",
      ],
      gumroadUrl: "https://gumroad.com/l/stockbloc-credit-blueprint",
    },
    {
      id: "hedge_13f",
      title: "13F HEDGE FUND TRACKING GUIDE",
      category: "Institutional Intel",
      icon: Layers,
      description:
        "Learn how to read SEC filings, track institutional whale moves, detect insider buying clusters, and build high-conviction portfolio scores.",
      price: "$5",
      features: [
        "SEC Form 13F-HR & 13D Decoding Manual",
        "Whale Portfolio Weight & Turnover Formula",
        "Tracking Citadel, Berkshire, & Renaissance",
        "Quarterly Rebalancing Signal Worksheets",
      ],
      gumroadUrl: "https://gumroad.com/l/stockbloc-13f-guide",
    },
    {
      id: "reit_income",
      title: "REIT INCOME STRATEGY",
      category: "Real Estate & Cash Flow",
      icon: Building2,
      description:
        "Build a passive dividend income portfolio with REITs. Cap rate analysis, FFO/AFFO payout ratios, and sector rotation strategies.",
      price: "$5",
      features: [
        "Data Center & Industrial REIT Analysis",
        "AFFO Payout Safety Calculator Sheet",
        "1031 Exchange & Opportunity Zone Basics",
        "Monthly Dividend Compound Growth Model",
      ],
      gumroadUrl: "https://gumroad.com/l/stockbloc-reit-strategy",
    },
  ];

  const handleBuy = (id: string, title: string, url: string) => {
    triggerHaptic("selection");
    trackEvent("playbook_viewed", { playbookId: id, title });
    setCheckoutNotice(`Redirecting to secure checkout for "${title}"...`);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setCheckoutNotice(null);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn font-mono">
      {/* Header Banner */}
      <div className="bg-[#030d17] border-2 border-amber-500/50 alien-block-cut p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="hud-corner-tl border-amber-400" />
        <div className="hud-corner-tr border-amber-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded alien-block-cut-sm">
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Stock Bloc Labs & Agent Intelligence
              </span>
              <NotFinancialAdviceTag />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-tech text-white uppercase tracking-wider">
              QUANT LABS, AGENT ARENA & PLAYBOOKS HUB
            </h1>
            <p className="text-sm sm:text-sm text-neutral-300 font-sans max-w-2xl mt-1">
              Community agent leaderboards, chain-of-thought strategy notebooks, zero-shot system prompt library, and instructional wealth playbooks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded alien-block-cut-sm">
              <Zap className="w-3.5 h-3.5 text-amber-400 inline mr-1" />
              AGENTIC DISCOVERY READY
            </span>
          </div>
        </div>

        {/* LABS SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 mt-4 border-t border-amber-500/30 text-xs">
          {[
            { id: "all", label: "ALL LABS HUB", icon: Sparkles },
            { id: "leaderboard", label: "🏆 COMMUNITY LEADERBOARD", icon: Bot },
            { id: "notebook", label: "📓 STRATEGY NOTEBOOK", icon: Code2 },
            { id: "prompts", label: "🤖 PROMPT LIBRARY", icon: Cpu },
            { id: "discovery", label: "🌐 AGENT API & DISCOVERY", icon: Zap },
            { id: "books", label: "📚 EDUCATIONAL PLAYBOOKS", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveSubTab(tab.id as any);
                }}
                data-testid={`labs-subtab-${tab.id}`}
                className={`flex items-center gap-1.5 px-3.5 py-2 alien-block-cut-sm font-black font-tech transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 border border-amber-200"
                    : "bg-neutral-900 hover:bg-neutral-800 text-amber-300/80 hover:text-white border border-amber-500/30"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-amber-400"}`} />
                <span className="uppercase text-xs tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {checkoutNotice && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded text-amber-200 text-xs font-bold text-center animate-pulse">
          {checkoutNotice}
        </div>
      )}

      {/* RENDER CONTENT BASED ON SUB-TAB SELECTION */}

      {/* 1. COMMUNITY AGENT LEADERBOARD */}
      {(activeSubTab === "all" || activeSubTab === "leaderboard") && (
        <AgentLeaderboard />
      )}

      {/* 2. AGENT DISCOVERY & MACHINE STANDARDS GUIDE */}
      {(activeSubTab === "all" || activeSubTab === "discovery") && (
        <AgentDiscoveryGuide />
      )}

      {/* 3. STRATEGY NOTEBOOK */}
      {(activeSubTab === "all" || activeSubTab === "notebook") && (
        <StrategyNotebook />
      )}

      {/* 4. AGENT PROMPT LIBRARY */}
      {(activeSubTab === "all" || activeSubTab === "prompts") && (
        <div className="bg-[#020b18] border-2 border-cyan-500/50 alien-block-cut p-6 shadow-2xl relative space-y-6 mt-6">
          <div className="hud-corner-tl border-cyan-400" />
          <div className="hud-corner-tr border-cyan-400" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 border border-cyan-400 rounded alien-block-cut-sm text-cyan-300">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
                    AIO Agentic Frameworks
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                    100% Free & Open Source
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-tech text-white uppercase tracking-wide mt-1">
                  AGENT PROMPT LIBRARY (LOCAL LLM TEMPLATES)
                </h2>
                <p className="text-xs text-neutral-300 font-sans max-w-2xl mt-0.5">
                  Pre-engineered system prompts for Claude, Gemini, DeepSeek-R1, and local Llama models to analyze Stock Bloc 13F filings, credit dispute letters, and real estate deals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>View /llms.txt</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agentPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-black/70 border border-cyan-500/30 hover:border-cyan-400/80 rounded-xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                      {prompt.category}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[180px]">
                      Target: {prompt.targetModel}
                    </span>
                  </div>

                  <h3 className="text-sm font-black font-tech text-white uppercase tracking-wide mb-1 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{prompt.title}</span>
                  </h3>

                  <p className="text-xs text-neutral-300 font-sans mb-3 leading-relaxed">
                    {prompt.description}
                  </p>

                  <div className="relative mb-4">
                    <pre className="p-3 bg-neutral-950/90 border border-neutral-800 rounded-lg text-[11px] font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar select-all">
                      {prompt.promptText}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Engineered for Zero-Shot LLM Reasoning
                  </span>

                  <button
                    onClick={() => handleCopyPrompt(prompt.id, prompt.promptText)}
                    data-testid={`copy-prompt-${prompt.id}`}
                    aria-label={`Copy ${prompt.title} System Prompt`}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs font-tech uppercase tracking-wide flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    {copiedPromptId === prompt.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-black" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EDUCATIONAL PLAYBOOKS & DRIVE E-BOOKS LIBRARY */}
      {(activeSubTab === "all" || activeSubTab === "books") && (
        <div className="mt-8 space-y-8">
          {/* Official Drive E-Book Library Section */}
          <div className="bg-[#030f1d] border-2 border-emerald-500/50 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="hud-corner-tl border-emerald-400" />
            <div className="hud-corner-tr border-emerald-400" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-500/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Library className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    OFFICIAL DRIVE E-BOOK LIBRARY
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    GOOGLE DRIVE SYNCED
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-tech text-white uppercase tracking-wide">
                  STOCK BLOC WEALTH INTELLIGENCE E-BOOKS & PLAYBOOKS
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 font-sans mt-1">
                  Read complete manuscripts, explore chapter tables of contents, and download high-resolution PDF editions directly from Google Drive.
                </p>
              </div>
            </div>

            {/* Grid of 5 Uploaded E-Books */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {STOCK_BLOC_EBOOKS.map((book) => (
                <div
                  key={book.id}
                  className="bg-[#020a15] border border-emerald-500/30 hover:border-emerald-400 rounded-xl p-5 flex flex-col justify-between group transition-all relative shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        {book.category}
                      </span>
                      <span className="text-xs font-black text-amber-300 font-mono">
                        {book.totalPages} PAGES
                      </span>
                    </div>

                    <h3 className="text-base font-black font-tech text-white uppercase tracking-wide group-hover:text-emerald-300 transition-colors mb-1">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-sans mb-3">
                      By {book.author} • {book.edition}
                    </p>

                    <p className="text-xs text-neutral-300 font-sans leading-relaxed line-clamp-3 mb-4">
                      {book.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setActiveEBook(book);
                      }}
                      data-testid={`preview-ebook-${book.id}`}
                      className="w-full py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold font-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>PREVIEW PDF & MANUSCRIPT</span>
                    </button>

                    <a
                      href={book.downloadUrl}
                      download
                      onClick={() => triggerHaptic("selection")}
                      data-testid={`download-ebook-direct-${book.id}`}
                      className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black font-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-400/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>DOWNLOAD PDF ({book.totalPages} P)</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ProductStorePricing
            onSelectTab={onSelectTab}
            onSuccessCheckout={(sessionId) => {
              if (onSelectTab) {
                onSelectTab("checkout_success" as any);
              } else {
                window.location.href = `/checkout/success?session_id=${sessionId}`;
              }
            }}
          />
        </div>
      )}

      {/* Reader Modal */}
      {activeEBook && (
        <EBookReaderModal
          ebook={activeEBook}
          onClose={() => setActiveEBook(null)}
        />
      )}
    </div>
  );
};

