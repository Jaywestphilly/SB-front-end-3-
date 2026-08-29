import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EarningsReport } from "../../types";
import { EARNINGS_CALENDAR_DATA } from "../../data/earnings_and_financials";
import {
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Search,
  Clock,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  CalendarPlus,
  Check,
  ExternalLink,
  Printer,
  X,
  Copy,
  BarChart3,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import {
  generateIcsForReports,
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from "../../utils/calendarSync";

export const EarningsCalendar: React.FC = () => {
  const [reports, setReports] = useState<EarningsReport[]>(
    EARNINGS_CALENDAR_DATA,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Beat" | "Miss" | "Upcoming"
  >("ALL");
  const [expandedId, setExpandedId] = useState<string | null>("earn_nvda_q2");
  const [activeSyncReport, setActiveSyncReport] =
    useState<EarningsReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEarningsSummaryModalOpen, setIsEarningsSummaryModalOpen] = useState(false);
  const [copiedEarningsSummary, setCopiedEarningsSummary] = useState(false);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      statusFilter === "ALL" || report.beatOrMiss === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const toggleExpand = (id: string) => {
    triggerHaptic("light");
    setExpandedId(expandedId === id ? null : id);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportAllIcs = () => {
    triggerHaptic("success");
    const icsData = generateIcsForReports(
      filteredReports,
      "Stock Bloc Wall Street Earnings",
    );
    downloadIcsFile("Stock_Bloc_Earnings_Calendar.ics", icsData);
    showToast(
      `Exported ${filteredReports.length} earnings reports to your device calendar (.ics)!`,
    );
  };

  const handleExportCsv = () => {
    triggerHaptic("success");
    const headers = [
      "Ticker Symbol",
      "Company Name",
      "Fiscal Quarter",
      "Report Date",
      "Timing",
      "Beat or Miss",
      "EPS Consensus",
      "EPS Actual",
      "Revenue Consensus",
      "Revenue Actual",
      "Forward Guidance Highlight",
      "Executive Summary",
    ];

    const rows = filteredReports.map((r) => [
      `"${r.symbol}"`,
      `"${r.companyName.replace(/"/g, '""')}"`,
      `"${r.fiscalQuarter}"`,
      `"${r.reportDate}"`,
      `"${r.timing}"`,
      `"${r.beatOrMiss || ""}"`,
      `"${r.epsEstimate}"`,
      `"${r.epsActual || ""}"`,
      `"${r.revenueEstimate}"`,
      `"${r.revenueActual || ""}"`,
      `"${r.guidanceHighlight.replace(/"/g, '""')}"`,
      `"${r.summaryText.replace(/"/g, '""')}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `StockBloc_Earnings_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded CSV report for ${filteredReports.length} earnings releases!`);
  };

  const handleCopyEarningsSummaryText = () => {
    triggerHaptic("success");
    const summaryHeader = `========================================================\nSTOCK BLOC // WALL STREET EARNINGS SEASON BRIEF\n========================================================\nGenerated: ${new Date().toLocaleDateString()} | Q2/Q3 FY2026 Earnings Intelligence\nFiltered Reports: ${filteredReports.length}\n\n`;

    const reportsText = filteredReports
      .map(
        (r) =>
          `• [${r.symbol}] ${r.companyName} (${r.fiscalQuarter})\n  Date: ${r.reportDate} (${r.timing}) | Result: ${r.beatOrMiss || "Pending"}\n  EPS: ${r.epsActual || "Pending"} vs ${r.epsEstimate} Est\n  Revenue: ${r.revenueActual || "Pending"} vs ${r.revenueEstimate} Est\n  Guidance: ${r.guidanceHighlight}\n  Summary: ${r.summaryText}\n`
      )
      .join("\n");

    const fullText = summaryHeader + reportsText + `\n========================================================\nFor Educational & Informational Purposes Only. Not Financial Advice.`;
    navigator.clipboard.writeText(fullText);
    setCopiedEarningsSummary(true);
    setTimeout(() => setCopiedEarningsSummary(false), 3000);
  };

  const handleDownloadSingleIcs = (report: EarningsReport) => {
    triggerHaptic("success");
    const icsData = generateIcsForReports(
      [report],
      `${report.symbol} Earnings`,
    );
    downloadIcsFile(
      `${report.symbol}_Earnings_${report.fiscalQuarter}.ics`,
      icsData,
    );
    showToast(
      `Downloaded ${report.symbol} earnings event for Apple/iCal Calendar!`,
    );
    setActiveSyncReport(null);
  };

  const handleOpenGoogleCalendar = (report: EarningsReport) => {
    triggerHaptic("selection");
    const url = getGoogleCalendarUrl(report);
    window.open(url, "_blank", "noopener,noreferrer");
    showToast(
      `Opening Google Calendar to save ${report.symbol} earnings date...`,
    );
    setActiveSyncReport(null);
  };

  const handleOpenOutlookCalendar = (report: EarningsReport) => {
    triggerHaptic("selection");
    const url = getOutlookCalendarUrl(report);
    window.open(url, "_blank", "noopener,noreferrer");
    showToast(`Opening Outlook Web Calendar for ${report.symbol}...`);
    setActiveSyncReport(null);
  };

  return (
    <div className="w-full space-y-5 select-none pb-12 relative">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-cyan-950/95 border border-cyan-500/50 backdrop-blur-xl shadow-2xl flex items-center gap-2 text-xs font-extrabold text-cyan-200 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-neutral-900 to-indigo-950/50 border border-cyan-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Corporate Earnings Calendar & Intelligence
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic("medium");
                setIsEarningsSummaryModalOpen(true);
              }}
              data-testid="export-earnings-summary-modal"
              aria-label="Export Earnings Executive Summary and Charts"
              className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs shrink-0 flex items-center gap-1.5 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <FileText className="w-3.5 h-3.5 text-black" />
              <span>EXPORT EXECUTIVE SUMMARY & CHARTS</span>
            </button>

            <button
              onClick={handleExportCsv}
              data-testid="export-earnings-csv"
              aria-label="Export Earnings Report to CSV"
              className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-400/20 active:scale-95 transition-all cursor-pointer uppercase"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={handleExportAllIcs}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              title="Sync All Listed Earnings Dates to Apple, Google or Outlook Calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync (.ics)</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed font-medium">
          Quarterly earnings releases, Wall Street consensus estimates vs actual
          revenue/EPS beats, forward management guidance, and report summaries.
        </p>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar text-xs">
          {(["ALL", "Beat", "Miss", "Upcoming"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                triggerHaptic("selection");
                setStatusFilter(filter);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all whitespace-nowrap ${
                statusFilter === filter
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {filter === "ALL"
                ? "All Reports"
                : filter === "Beat"
                  ? "🎯 Consensus Beat"
                  : filter === "Miss"
                    ? "⚠️ Missed"
                    : "⏳ Upcoming"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter earnings by ticker (e.g. NVDA, MSFT, AAPL)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => {
          const isExpanded = expandedId === report.id;
          const isBeat = report.beatOrMiss === "Beat";

          return (
            <div
              key={report.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? "bg-neutral-900/90 border-cyan-500/50 shadow-2xl"
                  : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {/* Card Header Bar */}
              <div
                onClick={() => toggleExpand(report.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center font-extrabold text-cyan-400 text-base font-mono shrink-0 shadow-inner">
                    {report.symbol}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white text-base">
                        {report.companyName}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-neutral-800 text-neutral-300">
                        {report.fiscalQuarter}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {report.reportDate}
                      </span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {report.timing}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Estimates vs Beats & Toggle Icon */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1 ${
                          isBeat
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isBeat ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {report.beatOrMiss || "Reported"}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-1">
                      EPS:{" "}
                      <span className="text-white font-extrabold">
                        {report.epsActual || report.epsEstimate}
                      </span>{" "}
                      vs {report.epsEstimate} Est
                    </div>
                  </div>

                  <button className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Detailed Breakdown */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/10 space-y-4">
                  {/* Financial Grid: EPS & Revenue Comparison */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-3">
                    <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase font-sans">
                        EPS Actual
                      </span>
                      <span className="block font-black text-sm text-emerald-400">
                        {report.epsActual || "Pending"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase font-sans">
                        EPS Consensus
                      </span>
                      <span className="block font-bold text-sm text-neutral-300">
                        {report.epsEstimate}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase font-sans">
                        Revenue Actual
                      </span>
                      <span className="block font-black text-sm text-cyan-400">
                        {report.revenueActual || "Pending"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 space-y-1">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase font-sans">
                        Revenue Consensus
                      </span>
                      <span className="block font-bold text-sm text-neutral-300">
                        {report.revenueEstimate}
                      </span>
                    </div>
                  </div>

                  {/* Guidance Highlight Box */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/30 flex items-start gap-2.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">
                        Forward Management Guidance Highlight
                      </span>
                      <p className="text-xs text-white font-medium mt-0.5">
                        {report.guidanceHighlight}
                      </p>
                    </div>
                  </div>

                  {/* Report Executive Summary */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" /> Report
                      Executive Summary
                    </span>
                    <p className="text-xs text-neutral-200 leading-relaxed font-medium bg-neutral-950 p-3 rounded-xl border border-white/5">
                      {report.summaryText}
                    </p>
                  </div>

                  {/* Takeaways Bullet Points */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />{" "}
                      Quant Key Takeaways
                    </span>
                    <ul className="space-y-1.5">
                      {report.aiKeyTakeaways.map((point, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-neutral-300 flex items-start gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-emerald-500/10"
                        >
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Single Report Calendar Action Bar */}
                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Earnings Date:{" "}
                      <strong className="text-cyan-300 font-mono">
                        {report.reportDate}
                      </strong>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic("medium");
                        setActiveSyncReport(report);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sync {report.symbol} Date to Calendar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync Options Modal */}
      {activeSyncReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-white text-base">
                  Sync {activeSyncReport.symbol} Earnings Date
                </h3>
              </div>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setActiveSyncReport(null);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <p className="font-medium">
                Add{" "}
                <strong className="text-white">
                  {activeSyncReport.companyName} ({activeSyncReport.symbol})
                </strong>{" "}
                {activeSyncReport.fiscalQuarter} earnings release directly to
                your device calendar.
              </p>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 font-mono text-[11px]">
                <div className="text-cyan-400 font-bold">
                  📅 {activeSyncReport.reportDate}
                </div>
                <div className="text-amber-300">
                  ⏰ {activeSyncReport.timing}
                </div>
                <div className="text-neutral-400">
                  📊 EPS Consensus: {activeSyncReport.epsEstimate} | Rev:{" "}
                  {activeSyncReport.revenueEstimate}
                </div>
              </div>
            </div>

            {/* Calendar Provider Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleDownloadSingleIcs(activeSyncReport)}
                className="w-full p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-between border border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Apple / iOS / Mac Calendar (.ics)</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Download File
                </span>
              </button>

              <button
                onClick={() => handleOpenGoogleCalendar(activeSyncReport)}
                className="w-full p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/30 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>Google Calendar</span>
                </div>
                <span className="text-[10px] text-blue-300 font-mono">
                  Direct Web Sync
                </span>
              </button>

              <button
                onClick={() => handleOpenOutlookCalendar(activeSyncReport)}
                className="w-full p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 font-bold text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                  <span>Outlook / Office 365</span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">
                  Direct Web Sync
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EARNINGS EXECUTIVE SUMMARY & CHARTS DOWNLOAD MODAL */}
      <AnimatePresence>
        {isEarningsSummaryModalOpen && (
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
                    <FileText className="w-6 h-6 fill-black" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                      WALL STREET QUARTERLY EARNINGS DOSSIER // Q2/Q3 FY2026
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wider">
                      Stock Bloc Corporate Earnings & Guidance Brief
                    </h2>
                    <p className="text-xs text-cyan-400/70">
                      Generated: {new Date().toLocaleDateString()} • {filteredReports.length} Reports Analyzed • Consensus Audit
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
                      setIsEarningsSummaryModalOpen(false);
                    }}
                    className="p-2 bg-black/60 border border-cyan-500/30 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-black/60 alien-block-cut border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold">TOTAL REPORTS</span>
                  <strong className="block text-lg font-black text-white">{filteredReports.length}</strong>
                </div>
                <div className="p-3 bg-black/60 alien-block-cut border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold">CONSENSUS BEATS</span>
                  <strong className="block text-lg font-black text-emerald-400">
                    {filteredReports.filter((r) => r.beatOrMiss === "Beat").length}
                  </strong>
                </div>
                <div className="p-3 bg-black/60 alien-block-cut border border-amber-500/30 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-bold">MISSED / UPCOMING</span>
                  <strong className="block text-lg font-black text-amber-300">
                    {filteredReports.filter((r) => r.beatOrMiss !== "Beat").length}
                  </strong>
                </div>
                <div className="p-3 bg-black/60 alien-block-cut border border-purple-500/30 space-y-1">
                  <span className="text-[10px] text-purple-300 uppercase font-bold">BEAT RATE %</span>
                  <strong className="block text-lg font-black text-purple-300">
                    {filteredReports.length > 0
                      ? Math.round((filteredReports.filter((r) => r.beatOrMiss === "Beat").length / filteredReports.length) * 100)
                      : 0}%
                  </strong>
                </div>
              </div>

              {/* Earnings Performance Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Wall Street Consensus vs Actual Financial Results Table
                </h3>

                <div className="overflow-x-auto alien-block-cut border border-cyan-500/30 bg-black/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cyan-950/60 text-cyan-300 font-black text-[10px] uppercase border-b border-cyan-500/30">
                      <tr>
                        <th className="p-2.5">Ticker</th>
                        <th className="p-2.5">Company & Date</th>
                        <th className="p-2.5">Result</th>
                        <th className="p-2.5 text-right">EPS Actual vs Est</th>
                        <th className="p-2.5 text-right">Rev Actual vs Est</th>
                        <th className="p-2.5">Guidance Highlight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/10 text-cyan-100 font-mono">
                      {filteredReports.map((r) => (
                        <tr key={r.id} className="hover:bg-cyan-950/20 transition-colors">
                          <td className="p-2.5 font-black text-cyan-300">${r.symbol}</td>
                          <td className="p-2.5">
                            <strong className="block text-white text-xs">{r.companyName}</strong>
                            <span className="text-[10px] text-neutral-400">{r.reportDate} ({r.timing})</span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 alien-block-cut-sm text-[10px] font-black uppercase ${
                              r.beatOrMiss === "Beat"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}>
                              {r.beatOrMiss || "Reported"}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-black text-emerald-400">
                            {r.epsActual || "Pending"} <span className="text-[10px] text-neutral-400 font-normal">/ {r.epsEstimate}</span>
                          </td>
                          <td className="p-2.5 text-right font-black text-cyan-300">
                            {r.revenueActual || "Pending"} <span className="text-[10px] text-neutral-400 font-normal">/ {r.revenueEstimate}</span>
                          </td>
                          <td className="p-2.5 text-[11px] text-neutral-300 max-w-xs line-clamp-2">
                            {r.guidanceHighlight}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Controls Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-cyan-500/30 pt-4 no-print">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyEarningsSummaryText}
                    className="px-3.5 py-2 alien-block-cut-sm bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto"
                  >
                    {copiedEarningsSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedEarningsSummary ? "COPIED TO CLIPBOARD!" : "COPY REPORT TEXT"}</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="px-3.5 py-2 alien-block-cut-sm bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsEarningsSummaryModalOpen(false)}
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
