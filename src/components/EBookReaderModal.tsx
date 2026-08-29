import React, { useState } from "react";
import {
  X,
  BookOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Sparkles,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface EBook {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  category: string;
  edition: string;
  description: string;
  tableOfContents: string[];
  sampleContent: Array<{
    page: number;
    heading: string;
    body: string;
  }>;
  downloadUrl: string;
}

export const STOCK_BLOC_EBOOKS: EBook[] = [
  {
    id: "wealth_operating_system",
    title: "The Stock Bloc Wealth Operating System",
    author: "Jumanne Carter",
    totalPages: 260,
    category: "Master Operating System",
    edition: "Complete 260-Page Edition",
    description:
      "Future wealth intelligence for normal people. Contains 12 core modules across credit, real estate, stock markets, AI, startups, robotics, space, digital assets, plus 150+ interactive workbooks, calculators, and decision logs.",
    tableOfContents: [
      "Pages 1-10: Foundation & Personal Wealth Baseline",
      "Pages 11-18: Credit as Financial Infrastructure & Decision Log",
      "Pages 19-27: Real Estate Ownership & BRRRR Discipline",
      "Pages 28-37: The Stock Market Ownership Engine & Position Sizing",
      "Pages 38-46: Artificial Intelligence as Leverage",
      "Pages 47-54: Startups & Entrepreneurship Frameworks",
      "Pages 55-60: Robotics & The Physical Economy",
      "Pages 61-66: The Space Economy & Launch Infrastructure",
      "Pages 67-72: Digital Assets & Open Networks",
      "Pages 73-79: Income & Business Systems",
      "Pages 80-86: Risk Protection & Legacy Planning",
      "Pages 87-92: Community Ownership & Public Good",
      "Pages 93-102: Interactive Financial Calculators (Net Worth, Rental Property, Startup)",
      "Pages 103-137: Portfolio Templates, Credit Trackers, AI Workflows",
      "Pages 138-149: 90-Day Execution Plan & Monthly Dashboards",
      "Pages 150-173: 12-Month Wealth Planners (January to December)",
      "Pages 174-199: 26 Weekly Execution Scorecards",
      "Pages 200-207: Annual Wealth Review (Net Worth, Cash Flow, Portfolio)",
      "Pages 208-213: Official Learning Resources & Stock Bloc Promise",
      "Pages 214-260: Wealth Notes & Decision Journal Entries",
    ],
    sampleContent: [
      {
        page: 2,
        heading: "A Wealth System Built for Real Life",
        body: "This book is not built around pretending everybody starts at the same line. People carry families, debt, old mistakes, limited time, and systems that were not designed to explain themselves. The answer is not fantasy. The answer is a better operating system. Credit becomes leverage. Income becomes capital. Capital becomes ownership. Ownership becomes freedom.",
      },
      {
        page: 6,
        heading: "The Stock Bloc Four Statement Format",
        body: "Truth. Why. Opportunity. Action. Every important idea in this book can be reduced to four statements. Truth identifies reality. Why explains the system. Opportunity reveals the opening. Action turns knowledge into movement.",
      },
      {
        page: 11,
        heading: "Credit Is Trust Measured by Data",
        body: "Credit is not wealth, but it changes the cost and availability of capital. Strong credit can lower borrowing costs, preserve cash, widen housing choices, and improve business flexibility. The objective is to become a low-risk borrower while using debt only when expected benefit exceeds cost.",
      },
      {
        page: 93,
        heading: "Interactive Net Worth Calculator",
        body: "Formula: Cash & Equivalents + Investment Assets + Real Estate Equity + Business Equity - Total Liabilities = Net Worth. Run the numbers before emotion gets involved. Emotion is expensive.",
      },
    ],
    downloadUrl: "/api/download/ebook/wealth_operating_system",
  },
  {
    id: "future_wealth_blueprint",
    title: "Stock Bloc: The Future Wealth Blueprint",
    author: "Jumanne Carter",
    totalPages: 108,
    category: "Future Intelligence",
    edition: "108-Page Complete Guide",
    description:
      "A comprehensive 12-part master blueprint covering the new wealth stack, AI leverage, space infrastructure, physical robotics, open networks, and the 5-year ownership roadmap.",
    tableOfContents: [
      "Part 1: The Stock Bloc Mission (West Philly to Ownership Economy)",
      "Part 2: Credit as Financial Infrastructure (FCRA, Metro 2, Guarantees)",
      "Part 3: Real Estate as a Cash Flow Machine (DSCR, CoC, BRRRR)",
      "Part 4: The Stock Market Ownership Engine (Valuation, 13F Whales, Sizing)",
      "Part 5: Artificial Intelligence as Personal Leverage (Prompting, Agents, Data)",
      "Part 6: Startups & The New Builder Economy (MUP, Distribution, Bootstrapping)",
      "Part 7: The Space Economy & Long Horizon Capital (Earth Observation, Connectivity)",
      "Part 8: Robotics & Physical AI Revolution (Humanoid, Industrial, Care)",
      "Part 9: Digital Assets & Open Financial Networks (Bitcoin, Tokenomics, Custody)",
      "Part 10: Personal Operating System for Wealth (Household Allocation, Taxes)",
      "Part 11: Wealth That Improves the World (Community Standards, Legacy)",
      "Part 12: The Stock Bloc Execution Plan & Future Wealth Pledge",
    ],
    sampleContent: [
      {
        page: 2,
        heading: "Founder Note",
        body: "We are living through a rare reset in the tools available to ordinary people. A phone can reach global markets. Artificial intelligence can turn one person into a research desk, a creative studio, and a software team. Public data can reveal how institutions allocate capital.",
      },
      {
        page: 104,
        heading: "The Stock Bloc Manifesto",
        body: "We believe financial intelligence should be understandable, practical, and available to people outside traditional power centers. We believe credit should be used as infrastructure, not identity. We believe real estate should be underwritten as a business. We believe stocks should be studied as ownership.",
      },
    ],
    downloadUrl: "/api/download/ebook/future_wealth_blueprint",
  },
  {
    id: "playbook_13f_whale",
    title: "13F Whale Tracking & SEC Filing Playbook",
    author: "Jay West Philly (Founder, Stock Bloc)",
    totalPages: 5,
    category: "Market Intelligence",
    edition: "13F Intel Edition",
    description:
      "Decoding institutional smart money, tracking top hedge fund quarterly 13F filings, isolating cluster rotations, and executing quant follow trades.",
    tableOfContents: [
      "Section 1: Introduction to 13F Filings & 45-Day Lag",
      "Section 2: Core Whale Profiles (Cathie Wood, Druckenmiller, Tiger, Buffett)",
      "Section 3: The 4-Step 13F Analysis Framework",
      "Section 4: Quantitative Execution & Retail Risk Management",
      "Section 5: Stock Bloc Terminal Commands (13F ARK, 13F DUQUESNE, ANR, FA)",
      "Section 6: A 30-Day 13F Research Workflow",
      "Section 7: Whale Tracking Scorecard",
    ],
    sampleContent: [
      {
        page: 3,
        heading: "The 4-Step 13F Analysis Framework",
        body: "Step 1: Load filing from SEC EDGAR. Step 2: Isolate new buys and full exits. Step 3: Score portfolio weight (positions >5% matter most). Step 4: Track sector clusters across independent funds.",
      },
    ],
    downloadUrl: "/api/download/playbook/playbook_13f_whale",
  },
  {
    id: "playbook_credit_800",
    title: "Credit 800+ Dispute & FICO Repair Blueprint",
    author: "Jay West Philly (Founder, Stock Bloc)",
    totalPages: 6,
    category: "Credit Intelligence",
    edition: "Credit Repair Edition",
    description:
      "Metro 2 compliance system, FCRA consumer protection rights, copy-and-paste bureau dispute templates, and rapid FICO score acceleration.",
    tableOfContents: [
      "Section 1: Anatomy of an 800+ FICO Score (35% Payment, 30% Utilization)",
      "Section 2: Metro 2 Compliance & FCRA Consumer Protection Rights",
      "Section 3: The 3-Step Dispute Protocol (Clean, Challenge, Escalate)",
      "Section 4: Copy-and-Paste Dispute Templates (Audit, Verification, CFPB Notice)",
      "Section 5: Rapid Utilization & AZEO Method Optimization",
      "Section 6: Dispute Packet Checklist",
      "Section 7: Credit Maintenance Calendar",
    ],
    sampleContent: [
      {
        page: 4,
        heading: "3-Step Dispute Protocol",
        body: "Step 1: Clean personal information (remove old addresses, typos). Step 2: Challenge accuracy on balances, late marks, and unverified data. Step 3: Escalate to CFPB if response is non-compliant.",
      },
    ],
    downloadUrl: "/api/download/playbook/playbook_credit_800",
  },
  {
    id: "playbook_reit_realestate",
    title: "Real Estate & REIT Cash Flow Matrix",
    author: "Jay West Philly (Founder, Stock Bloc)",
    totalPages: 6,
    category: "Real Estate Underwriting",
    edition: "Real Estate Edition",
    description:
      "Quantitative financial blueprint for physical property underwriting, DSCR loans, FHA house hacking, BRRRR discipline, and liquid REIT analysis.",
    tableOfContents: [
      "Section 1: Core Financial Formulas (GPI, EGI, NOI, Cap Rate, CoC, DSCR)",
      "Section 2: Step-by-Step Deal Analyzer Walkthrough & Sample Math",
      "Section 3: Public REITs vs Physical Real Estate (P/FFO, Data Centers, Industrial)",
      "Section 4: Creative Financing (DSCR Loans, FHA House Hacking, BRRRR)",
      "Section 5: Real Estate Deal Checklist",
      "Section 6: Underwriting Scorecard",
      "Section 7: Due Diligence Verification Checklist",
    ],
    sampleContent: [
      {
        page: 3,
        heading: "Core Financial Formulas",
        body: "NOI = EGI - Operating Expenses. Cap Rate = NOI / Purchase Price. Cash-on-Cash Return = Pre-tax Cash Flow / Cash Invested. DSCR = NOI / Annual Mortgage Debt Service (Target >= 1.25x).",
      },
    ],
    downloadUrl: "/api/download/playbook/playbook_reit_realestate",
  },
];

interface Props {
  ebook: EBook;
  onClose: () => void;
}

export const EBookReaderModal: React.FC<Props> = ({ ebook, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"pdf_preview" | "overview" | "toc" | "preview">("pdf_preview");

  const sample = ebook.sampleContent[0] || {
    page: 1,
    heading: ebook.title,
    body: ebook.description,
  };

  const pdfInlineUrl = `${ebook.downloadUrl}?inline=1#toolbar=1&navpanes=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div className="bg-[#020b18] border-2 border-emerald-500/60 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative font-mono text-white overflow-hidden">
        <div className="hud-corner-tl border-emerald-400" />
        <div className="hud-corner-tr border-emerald-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-500/30 flex items-center justify-between bg-black/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400 rounded-xl text-emerald-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                  {ebook.category}
                </span>
                <span className="text-[10px] text-amber-300 font-bold font-mono">
                  {ebook.totalPages} PAGES
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black font-tech text-white uppercase tracking-wide mt-0.5">
                {ebook.title}
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                By {ebook.author} • {ebook.edition}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-neutral-800 bg-neutral-950/80 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pdf_preview")}
            className={`px-3 py-1.5 rounded-lg font-bold font-tech uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pdf_preview"
                ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Document Preview</span>
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg font-bold font-tech uppercase transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("toc")}
            className={`px-3 py-1.5 rounded-lg font-bold font-tech uppercase transition-all cursor-pointer ${
              activeTab === "toc"
                ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Table of Contents ({ebook.tableOfContents.length})
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-lg font-bold font-tech uppercase transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Text Excerpt
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 font-sans text-neutral-200 min-h-[400px]">
          {activeTab === "pdf_preview" && (
            <div className="space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold uppercase">Live Document Preview</span>
                  <span className="text-neutral-500 font-sans">({ebook.totalPages} Pages)</span>
                </div>
                <a
                  href={pdfInlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-tech uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Full PDF in New Tab</span>
                </a>
              </div>

              <div className="relative w-full h-[480px] sm:h-[550px] bg-neutral-950 border-2 border-emerald-500/40 rounded-xl overflow-hidden shadow-inner">
                <iframe
                  src={pdfInlineUrl}
                  title={`PDF Preview - ${ebook.title}`}
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="p-4 bg-black/80 border border-emerald-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 font-tech uppercase">
                    BOOK SUMMARY & SYNOPSIS
                  </div>
                  <button
                    onClick={() => setActiveTab("pdf_preview")}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-tech text-xs uppercase flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Launch PDF Preview</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  {ebook.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">Total Volume</div>
                  <div className="text-sm font-black text-amber-300 font-tech mt-0.5">{ebook.totalPages} Pages</div>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">Format</div>
                  <div className="text-sm font-black text-emerald-300 font-tech mt-0.5">High-Res PDF & Models</div>
                </div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-center">
                  <div className="text-[10px] text-neutral-500 uppercase font-mono">Delivery</div>
                  <div className="text-sm font-black text-cyan-300 font-tech mt-0.5">Instant Digital Download</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "toc" && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-tech text-emerald-400 uppercase mb-3">
                TABLE OF CONTENTS & CHAPTER BREAKDOWN
              </h3>
              <div className="space-y-2">
                {ebook.tableOfContents.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 hover:border-emerald-500/40 transition-all flex items-start gap-2.5"
                  >
                    <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="p-5 bg-neutral-950 border-2 border-emerald-500/40 rounded-xl space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">
                    EXCERPT • PAGE {sample.page} OF {ebook.totalPages}
                  </span>
                  <span className="text-[10px] text-neutral-500">Official Stock Bloc Publication</span>
                </div>

                <h3 className="text-base font-black font-tech text-white uppercase">
                  {sample.heading}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                  "{sample.body}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-emerald-500/30 bg-black/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 font-sans flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Official Stock Bloc Publication • Includes fillable templates & Excel models</span>
          </div>

          <a
            href={ebook.downloadUrl}
            download
            onClick={() => triggerHaptic("selection")}
            data-testid={`ebook-download-${ebook.id}`}
            className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black font-tech uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <Download className="w-4 h-4 text-black" />
            <span>DOWNLOAD COMPLETE PDF ({ebook.totalPages} PAGES)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
