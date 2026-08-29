import React, { useState } from "react";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  Sparkles,
  Search,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { STOCK_BLOC_EBOOKS } from "./EBookReaderModal";

interface PdfPreviewModalProps {
  title: string;
  downloadUrl: string;
  category?: string;
  totalPages?: number;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  title,
  downloadUrl,
  category = "PDF DOCUMENT",
  totalPages,
  onClose,
}) => {
  // Try finding matching eBook from master catalog
  const matchingEbook = STOCK_BLOC_EBOOKS.find(
    (b) =>
      b.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(b.title.toLowerCase()) ||
      b.downloadUrl === downloadUrl ||
      downloadUrl.includes(b.id)
  );

  const [activeTab, setActiveTab] = useState<"reader" | "embed">("reader");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pagesCount = totalPages || matchingEbook?.totalPages || 260;
  const inlineUrl = downloadUrl.includes("?")
    ? `${downloadUrl}&inline=1#toolbar=1&navpanes=1`
    : `${downloadUrl}?inline=1#toolbar=1&navpanes=1`;

  const toc = matchingEbook?.tableOfContents || [
    "Section 1: Executive Overview & Baseline Metrics",
    "Section 2: Fundamental Quantitative Rules & Analysis",
    "Section 3: Practical Application & Step-by-Step Execution",
    "Section 4: Fillable Worksheets & Financial Calculator Models",
    "Section 5: Final Decision Matrix & 90-Day Execution Roadmap",
  ];

  const samples = matchingEbook?.sampleContent || [
    {
      page: 1,
      heading: "Executive Overview & Master Guidance",
      body: `Official Stock Bloc Publication: ${title}. Underwritten for high-conviction retail investors and operators. This publication provides quantitative rules, actionable checklists, and financial frameworks designed to build enduring equity.`,
    },
    {
      page: 2,
      heading: "Core Quantitative Framework",
      body: "Truth. Why. Opportunity. Action. Every financial decision must pass quantitative stress tests before allocating real capital. Preserve risk-adjusted returns through proper position sizing, credit leverage, and automated cash flow tracking.",
    },
  ];

  const currentSample = samples[currentPageIndex % samples.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md">
      <div className="bg-[#020b18] border-2 border-emerald-500/60 rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl relative font-mono text-white overflow-hidden">
        <div className="hud-corner-tl border-emerald-400" />
        <div className="hud-corner-tr border-emerald-400" />

        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-emerald-500/30 flex items-center justify-between bg-black/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400 rounded-xl text-emerald-300 shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
                  {matchingEbook?.category || category}
                </span>
                <span className="text-[10px] text-amber-300 font-bold font-mono shrink-0">
                  {pagesCount} PAGES
                </span>
                <span className="text-[10px] text-cyan-300 font-bold font-mono hidden sm:inline-block">
                  OFFICIAL STOCK BLOC DOCUMENT
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black font-tech text-white uppercase tracking-wide truncate mt-0.5">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={inlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-tech uppercase flex items-center gap-1.5 transition-all cursor-pointer border border-neutral-700"
              title="Open full PDF in browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Open PDF in New Tab</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Selector Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-b border-neutral-800 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveTab("reader");
              }}
              className={`px-3 py-1.5 rounded-lg font-bold font-tech uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "reader"
                  ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Interactive Document Reader</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setActiveTab("embed");
              }}
              className={`px-3 py-1.5 rounded-lg font-bold font-tech uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "embed"
                  ? "bg-emerald-400 text-black shadow-md shadow-emerald-400/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw PDF Embed</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-neutral-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-Resolution Digital Edition</span>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 bg-[#020914] overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "reader" ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Document Cover Header Card */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-black to-cyan-950/80 border-2 border-emerald-500/50 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded text-[10px] font-bold font-tech uppercase">
                      Author: {matchingEbook?.author || "Jumanne Carter"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded text-[10px] font-bold font-tech uppercase">
                      Edition: {matchingEbook?.edition || "Master Edition"}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-tech text-white uppercase">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
                    {matchingEbook?.description ||
                      "Complete Stock Bloc master publication featuring quantitative frameworks, decision logs, and execution playbooks."}
                  </p>
                </div>

                <a
                  href={downloadUrl}
                  download
                  onClick={() => triggerHaptic("selection")}
                  className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black font-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Download Full PDF ({pagesCount} Pages)</span>
                </a>
              </div>

              {/* Document Pages Slider / Canvas */}
              <div className="bg-black/90 border border-emerald-500/40 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6 relative">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold font-tech text-emerald-400 uppercase tracking-wider">
                      PAGE MANUSCRIPT PREVIEW • EXCERPT {currentPageIndex + 1} OF {samples.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setCurrentPageIndex((prev) => (prev > 0 ? prev - 1 : samples.length - 1));
                      }}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-tech transition-all cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="text-xs text-neutral-400 font-mono px-2">
                      Page {currentSample.page}
                    </span>
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setCurrentPageIndex((prev) => (prev + 1) % samples.length);
                      }}
                      className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-tech transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 font-sans text-neutral-200 bg-neutral-950 p-6 rounded-xl border border-neutral-800">
                  <h4 className="text-base sm:text-lg font-bold font-tech text-white border-b border-emerald-500/30 pb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{currentSample.heading}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans whitespace-pre-line">
                    {currentSample.body}
                  </p>
                </div>

                {/* Table of Contents Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold font-tech text-cyan-400 uppercase tracking-wider">
                    <List className="w-4 h-4 text-cyan-400" />
                    <span>Table of Contents & Module Structure</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    {toc.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex items-center gap-2.5 transition-all"
                      >
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-neutral-300 truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col space-y-3">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono flex items-center justify-between">
                <span className="text-emerald-400 font-bold uppercase">Raw PDF Embed Rendering</span>
                <a
                  href={inlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded border border-cyan-500/40 font-tech text-[11px] uppercase flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Direct Link</span>
                </a>
              </div>

              <div className="flex-1 min-h-[450px] bg-neutral-900 border-2 border-emerald-500/40 rounded-xl overflow-hidden relative">
                <iframe
                  src={inlineUrl}
                  title={`PDF Preview - ${title}`}
                  className="w-full h-[500px] border-0 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-emerald-500/30 bg-black/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400 font-sans flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Stock Bloc Verified Publication • Official Vector PDF Format</span>
          </div>

          <a
            href={downloadUrl}
            download
            onClick={() => triggerHaptic("selection")}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black font-tech uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <Download className="w-4 h-4 text-black" />
            <span>DOWNLOAD COMPLETE PDF FILE</span>
          </a>
        </div>
      </div>
    </div>
  );
};
