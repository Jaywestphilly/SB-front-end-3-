import React, { useState, useEffect } from "react";
import { useSubTabUrl } from "../../hooks/useSubTabUrl";
import { NotFinancialAdviceTag } from "../../components/NotFinancialAdviceTag";
import { AffiliateLink } from "../../components/AffiliateLink";
import {
  CREDIT_FACTORS,
  CREDIT_CARDS_RECOMMENDED,
  CREDIT_REPAIR_STEPS,
} from "../../data/credit";
import {
  LineChart,
  ShieldCheck,
  Zap,
  CreditCard,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  HelpCircle,
  Sparkles,
  ExternalLink,
  FileText,
  Lock,
  Scale,
  Copy,
  Check,
  Building2,
  PhoneCall,
  Mail,
  GraduationCap,
  BookOpen,
  Award,
  Calculator,
  HeartHandshake,
  FileCheck,
  Download,
  ShieldAlert,
} from "lucide-react";
import { CmbsPrivateCreditRadar } from "../credit/CmbsPrivateCreditRadar";
import { ResponsiveSubTabNav } from "../../components/ResponsiveSubTabNav";

export const CreditBuildingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useSubTabUrl(
    "/credit",
    [
      "cmbs_private_credit",
      "live_macro",
      "simulator",
      "factors",
      "bureaus",
      "student_loans",
      "cards",
      "repair"
    ] as const,
    "cmbs_private_credit"
  );
  
  const [macroData, setMacroData] = useState<any>(null);
  const [isMacroLoading, setIsMacroLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "live_macro" && !macroData) {
      setIsMacroLoading(true);
      fetch("/api/macro/credit")
        .then(r => r.json())
        .then(d => {
          setMacroData(d);
          setIsMacroLoading(false);
        })
        .catch(e => {
          console.error(e);
          setIsMacroLoading(false);
        });
    }
  }, [activeTab]);

  const [copiedLetter, setCopiedLetter] = useState<boolean>(false);

  // Student Loan Estimator States
  const [studentLoanAGI, setStudentLoanAGI] = useState<number>(48000);
  const [familySize, setFamilySize] = useState<number>(1);
  const [loanBalance, setLoanBalance] = useState<number>(32000);
  const [interestRate, setInterestRate] = useState<number>(5.5);

  // IDR Monthly Payment Math
  // 2026 Federal Poverty Baseline: ~$15,060 for single + ~$5,380 per addl member
  const povertyGuideline = 15060 + (Math.max(1, familySize) - 1) * 5380;
  const poverty225Threshold = povertyGuideline * 2.25;
  const discretionaryIncome = Math.max(0, studentLoanAGI - poverty225Threshold);
  const idrMonthlyPayment = Math.round((discretionaryIncome * 0.1) / 12);

  // Standard 10-Year Payment Approx (P&I)
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = 120;
  const standardMonthlyPayment =
    monthlyRate > 0 && loanBalance > 0
      ? Math.round(
          (loanBalance * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
            (Math.pow(1 + monthlyRate, numPayments) - 1),
        )
      : Math.round(loanBalance / 120);

  // Credit Score Simulator States
  const [onTimePercent, setOnTimePercent] = useState<number>(100);
  const [utilizationPercent, setUtilizationPercent] = useState<number>(8);
  const [creditAgeYears, setCreditAgeYears] = useState<number>(5);
  const [hardInquiries, setHardInquiries] = useState<number>(1);
  const [hasInstallmentLoan, setHasInstallmentLoan] = useState<boolean>(true);

  // Utilization Calculator States
  const [totalBalance, setTotalBalance] = useState<number>(1200);
  const [totalLimit, setTotalLimit] = useState<number>(15000);

  // Sample 609 Dispute Letter Template
  const sample609Letter = `[YOUR FULL NAME]
[YOUR MAILING ADDRESS]
[YOUR PHONE NUMBER]
[DATE]

To: Credit Reporting Agency Dispute Dept.

RE: NOTICE OF DISPUTE UNDER FCRA § 609 (15 U.S.C. § 1681g)
Account / Item in Dispute: [ACCOUNT NAME / NUMBER]

To Whom It May Concern,

I am writing to formally exercise my rights under the Fair Credit Reporting Act (FCRA) Section 609. I request full verification and physical documentation of the item listed above appearing on my credit report.

Under 15 U.S.C. § 1681i, you are legally required to verify this debt with original contracts, signatures, or court records provided directly by the original creditor.

If you cannot verify this item with physical proof within 30 days of receiving this letter, you must immediately delete the item from my credit file as mandated by federal law.

Sincerely,
[YOUR SIGNATURE]
[YOUR PRINTED NAME]`;

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(sample609Letter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2500);
  };

  const handleDownloadCreditSummaryPdf = () => {
    const summaryText = `STOCK BLOC CREDIT MASTER HUB & ACTION PLAN REPORT
==================================================
Estimated Credit Score: ${estimatedScore} (${rating.label})
On-time Payment Record: ${onTimePercent}%
Credit Utilization Rate: ${utilizationPercent}%
Credit Age History: ${creditAgeYears} Years
Hard Inquiries (12 mo): ${hardInquiries}
Installment Credit Mix: ${hasInstallmentLoan ? "Active" : "None"}

TOP RECOMMENDATIONS FOR FICO 800+ TRAJECTORY
--------------------------------------------------
1. Keep revolving credit utilization below 7% across all cards.
2. Request credit line increases every 6-12 months (soft pulls).
3. Submit FCRA § 609 dispute letters for inaccurate derogatory items.
4. Maintain active revolving lines for at least 5+ average age of accounts.

BIG 3 BUREAU DISPUTE CONTACTS
--------------------------------------------------
- Equifax Dispute: 1-866-349-5191 | P.O. Box 740256, Atlanta, GA 30374
- Experian Dispute: 1-888-397-3742 | P.O. Box 4500, Allen, TX 75013
- TransUnion Dispute: 1-800-916-8800 | P.O. Box 2000, Chester, PA 19016

Generated by Stock Bloc Quant Wealth Terminal
https://stock-bloc.ai.studio/credit-hub
`;

    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StockBloc_Credit_Deal_Summary_${estimatedScore}_FICO.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLetter = () => {
    const element = document.createElement("a");
    const file = new Blob([sample609Letter], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "FCRA_609_Dispute_Letter_StockBloc.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Estimate Credit Score mathematically (300 to 850 scale)
  const computeEstimatedScore = () => {
    let score = 300;

    // Payment History (35% weight -> max 192.5 pts)
    const paymentScore = ((onTimePercent - 80) / 20) * 192.5;
    score += Math.max(0, paymentScore);

    // Credit Utilization (30% weight -> max 165 pts)
    let utilScore = 165;
    if (utilizationPercent === 0)
      utilScore = 150; // slight penalty for 0% non-use
    else if (utilizationPercent <= 3) utilScore = 165;
    else if (utilizationPercent <= 9) utilScore = 155;
    else if (utilizationPercent <= 29) utilScore = 120;
    else if (utilizationPercent <= 50) utilScore = 70;
    else utilScore = 20;
    score += utilScore;

    // Length of History (15% weight -> max 82.5 pts)
    const ageScore = Math.min(82.5, creditAgeYears * 12);
    score += ageScore;

    // New Credit Inquiries (10% weight -> max 55 pts)
    const inquiryDeduction = hardInquiries * 12;
    score += Math.max(0, 55 - inquiryDeduction);

    // Credit Mix (10% weight -> max 55 pts)
    score += hasInstallmentLoan ? 55 : 30;

    return Math.min(850, Math.max(300, Math.round(score)));
  };

  const estimatedScore = computeEstimatedScore();

  const getScoreRating = (score: number) => {
    if (score >= 800)
      return {
        label: "Exceptional (Tier 1)",
        color: "text-[#00ff88]",
        bg: "bg-[#00ff88]/20",
        border: "border-[#00ff88]/30",
      };
    if (score >= 740)
      return {
        label: "Very Good (Prime)",
        color: "text-cyan-400",
        bg: "bg-cyan-500/20",
        border: "border-cyan-500/30",
      };
    if (score >= 670)
      return {
        label: "Good",
        color: "text-emerald-400",
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
      };
    if (score >= 580)
      return {
        label: "Fair",
        color: "text-amber-400",
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
      };
    return {
      label: "Rebuilding Needed",
      color: "text-[#ff3b3b]",
      bg: "bg-[#ff3b3b]/20",
      border: "border-[#ff3b3b]/30",
    };
  };

  const rating = getScoreRating(estimatedScore);

  // Live Utilization Calc
  const liveCalcUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  return (
    <div className="p-4 space-y-6 max-w-[1400px] mx-auto text-white">
      {/* Header Banner */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-neutral-900 to-purple-950 border border-indigo-500/30 shadow-2xl space-y-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Credit Mastery Hub
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Target FICO 800+
          </span>
        </div>

        <h2 className="text-2xl font-black text-white leading-tight animate-periodic-text-glitch">
          Credit Score 800+ Builder & Bureau Dispute Hub
        </h2>
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-indigo-500/20">
          <p className="text-xs text-neutral-300 leading-relaxed max-w-md">
            Direct dispute portals for Equifax, Experian & TransUnion, official
            free annual credit reports, FCRA consumer protection guidelines, and
            FICO score simulator.
          </p>

          <button
            onClick={handleDownloadCreditSummaryPdf}
            data-testid="download-credit-deal-summary-pdf"
            aria-label="Download Deal Summary PDF"
            className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/20 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Deal Summary PDF</span>
          </button>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="pt-2">
          <ResponsiveSubTabNav
            title="Credit Master Hub Tools"
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            tabs={[
              {
                id: "cmbs_private_credit",
                label: "CMBS Delinquency & Private Credit (10.5%)",
                icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />,
                badge: "Institutional",
                colorScheme: "purple",
                description: "Real-time distressed CRE tranches, maturity wall & shadow banking yields",
              },
              {
                id: "live_macro",
                label: "Live Market Data",
                icon: <LineChart className="w-3.5 h-3.5" />,
                colorScheme: "indigo",
                description: "Live Treasury yields, mortgage benchmark rates & credit spread telemetry",
              },
              {
                id: "simulator",
                label: "Score Simulator",
                icon: <Zap className="w-3.5 h-3.5" />,
                colorScheme: "indigo",
                description: "Interactive FICO 800+ trajectory simulator and debt payoff optimizer",
              },
              {
                id: "bureaus",
                label: "Credit Bureau Links",
                icon: <Building2 className="w-3.5 h-3.5 text-emerald-300" />,
                badge: "FCRA § 612",
                colorScheme: "indigo",
                description: "Direct dispute portals for Equifax, Experian & TransUnion with free report links",
              },
              {
                id: "student_loans",
                label: "Student Loans & Relief",
                icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-300" />,
                colorScheme: "indigo",
                description: "SAVE plan calculator, PSLF forgiveness roadmap & federal debt discharge",
              },
              {
                id: "factors",
                label: "5 FICO Factors",
                icon: <ShieldCheck className="w-3.5 h-3.5" />,
                colorScheme: "indigo",
                description: "Mathematical weighting of payment history, utilization & credit mix",
              },
              {
                id: "cards",
                label: "Top Credit Cards",
                icon: <CreditCard className="w-3.5 h-3.5" />,
                colorScheme: "indigo",
                description: "Curated tier-1 premium rewards, 0% APR balance transfers & business cards",
              },
              {
                id: "repair",
                label: "Dispute & Repair",
                icon: <Sparkles className="w-3.5 h-3.5" />,
                colorScheme: "indigo",
                description: "FCRA Section 609 legal dispute letter templates with 1-click clipboard copy",
              },
            ]}
          />
        </div>
      </div>

      {/* CMBS DELINQUENCY & PRIVATE CREDIT TAB */}
      {activeTab === "cmbs_private_credit" && <CmbsPrivateCreditRadar />}

      {/* BUREAU DIRECT LINKS & ANNUAL REPORT TAB */}
      {activeTab === "bureaus" && (
        <div className="space-y-6">
          {/* Official Free Credit Report Highlight Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-neutral-900 to-cyan-950 border border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Federal Law Guaranteed (FCRA § 612)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                100% Free • Soft Inquiry
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                AnnualCreditReport.com
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed mt-1">
                The ONLY official website authorized by U.S. Federal Law under
                the Fair Credit Reporting Act to provide your free credit
                reports from Equifax, Experian, and TransUnion. Checking your
                official report here does <strong>NOT</strong> impact your
                credit score.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-neutral-300">
                <strong className="text-emerald-300 block">
                  No Credit Card Needed
                </strong>
                No hidden trials or fees.
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-neutral-300">
                <strong className="text-emerald-300 block">
                  Weekly Free Reports
                </strong>
                Equifax, Experian & TransUnion.
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-neutral-300">
                <strong className="text-emerald-300 block">
                  Soft Pull Guarantee
                </strong>
                Zero score reduction.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                Official Site: annualcreditreport.com
              </span>
              <a
                href="https://www.annualcreditreport.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Get Free Official Reports</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Three Bureau Dispute Portals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                The Big 3 Credit Bureaus Direct Dispute & Freeze Portals
              </h3>
              <span className="text-xs text-neutral-400">
                Online & Mail Options
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* EQUIFAX */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Credit Bureau 1 of 3
                    </span>
                    <h4 className="text-lg font-black text-white mt-1 animate-periodic-text-glitch">
                      Equifax
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">
                    Atlanta, GA
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Submit online disputes for inaccurate late payments, unknown
                  collections, or wrong address data. Place a free security
                  freeze to block unauthorized credit inquiries.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Dispute Phone: 1-866-349-5191</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>P.O. Box 740256, Atlanta, GA 30374</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href="https://www.equifax.com/personal/credit-report-services/credit-freeze/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-white/10"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equifax Security Freeze</span>
                  </a>

                  <a
                    href="https://www.equifax.com/personal/credit-report-services/credit-dispute/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                  >
                    <span>File Equifax Dispute Online</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* EXPERIAN */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Credit Bureau 2 of 3
                    </span>
                    <h4 className="text-lg font-black text-white mt-1 animate-periodic-text-glitch">
                      Experian
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">
                    Allen, TX
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Experian offers instant online dispute tracking with automated
                  status updates. Track disputed accounts and verify when items
                  are deleted.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Dispute Phone: 1-888-397-3742</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>P.O. Box 4500, Allen, TX 75013</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href="https://www.experian.com/freeze/center.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-white/10"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Experian Security Freeze</span>
                  </a>

                  <a
                    href="https://www.experian.com/disputes/main.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                  >
                    <span>File Experian Dispute Online</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* TRANSUNION */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Credit Bureau 3 of 3
                    </span>
                    <h4 className="text-lg font-black text-white mt-1 animate-periodic-text-glitch">
                      TransUnion
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">
                    Chester, PA
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Manage online credit disputes for unauthorized inquiries,
                  duplicate public records, or wrong balances. TransUnion allows
                  100% free security freezes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Dispute Phone: 1-800-916-8800</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>P.O. Box 2000, Chester, PA 19016</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href="https://www.transunion.com/credit-freeze"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-white/10"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>TransUnion Security Freeze</span>
                  </a>

                  <a
                    href="https://www.transunion.com/credit-disputes/dispute-your-credit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-400/20"
                  >
                    <span>File TransUnion Dispute Online</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT LOANS & RELIEF HUB TAB */}
      {activeTab === "student_loans" && (
        <div className="space-y-6">
          {/* Official Federal Student Aid Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950 via-neutral-900 to-indigo-950 border border-cyan-500/40 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-300" />
                U.S. Department of Education
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                StudentAid.gov
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                Federal Student Loan Repayment & Forgiveness
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed mt-1">
                Access official federal loan management tools, Income-Driven
                Repayment (IDR) plans, Public Service Loan Forgiveness (PSLF)
                tracking, and loan consolidation to keep your federal student
                loans in good standing and protect your credit score.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-neutral-300">
                <strong className="text-cyan-300 block font-bold">
                  Income-Driven Repayment
                </strong>
                Payments adjusted to your income & family size.
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-neutral-300">
                <strong className="text-cyan-300 block font-bold">
                  PSLF Tax-Free Relief
                </strong>
                120 qualifying payments for public service.
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-neutral-300">
                <strong className="text-cyan-300 block font-bold">
                  Fresh Start Relief
                </strong>
                Cure defaulted loans & clear negative credit marks.
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-cyan-500/20">
              <a
                href="https://studentaid.gov/loan-simulator/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-white/10"
              >
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>Official FSA Loan Simulator</span>
              </a>

              <a
                href="https://studentaid.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Visit StudentAid.gov Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Interactive IDR Payment Estimator */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-400" />
                  Income-Driven Repayment (IDR) Monthly Payment Estimator
                </h3>
                <p className="text-xs text-neutral-400">
                  Estimate discretionary income monthly caps based on 225%
                  Federal Poverty Line standards.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                2026 Baseline
              </span>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Annual AGI */}
              <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-medium">
                    Adjusted Gross Income (AGI):
                  </span>
                  <span className="font-mono font-black text-cyan-300">
                    ${studentLoanAGI.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={15000}
                  max={200000}
                  step={1000}
                  value={studentLoanAGI}
                  onChange={(e) => setStudentLoanAGI(Number(e.target.value))}
                  style={{ touchAction: "pan-y" }}
                  className="w-full accent-cyan-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
                />
              </div>

              {/* Family Size */}
              <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-medium">
                    Family Size (Tax Dependents):
                  </span>
                  <span className="font-mono font-black text-indigo-300">
                    {familySize} {familySize === 1 ? "person" : "people"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={familySize}
                  onChange={(e) => setFamilySize(Number(e.target.value))}
                  style={{ touchAction: "pan-y" }}
                  className="w-full accent-indigo-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
                />
              </div>

              {/* Loan Balance */}
              <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-medium">
                    Total Federal Loan Balance:
                  </span>
                  <span className="font-mono font-black text-emerald-300">
                    ${loanBalance.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={150000}
                  step={1000}
                  value={loanBalance}
                  onChange={(e) => setLoanBalance(Number(e.target.value))}
                  style={{ touchAction: "pan-y" }}
                  className="w-full accent-emerald-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2 p-4 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400 font-medium">
                    Avg Interest Rate:
                  </span>
                  <span className="font-mono font-black text-amber-300">
                    {interestRate.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={3.0}
                  max={10.0}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  style={{ touchAction: "pan-y" }}
                  className="w-full accent-amber-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Results Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                  Est. IDR Monthly Payment
                </span>
                <span className="text-2xl font-black text-cyan-300 font-mono">
                  ${idrMonthlyPayment}/mo
                </span>
                <p className="text-[10px] text-neutral-400">
                  {idrMonthlyPayment === 0
                    ? "$0/mo qualify (100% in good standing)"
                    : "Capped at 10% discretionary income"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-800/80 border border-white/10 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                  Standard 10-Yr Plan
                </span>
                <span className="text-2xl font-black text-neutral-200 font-mono">
                  ${standardMonthlyPayment}/mo
                </span>
                <p className="text-[10px] text-neutral-400">
                  Fixed 120 payments
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                  Potential Monthly Cash Savings
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ${Math.max(0, standardMonthlyPayment - idrMonthlyPayment)}/mo
                </span>
                <p className="text-[10px] text-emerald-300/80">
                  Freed up monthly cashflow
                </p>
              </div>
            </div>
          </div>

          {/* Federal Forgiveness & Relief Programs Directory */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Comprehensive Federal Relief & Loan Forgiveness Programs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PSLF */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Tax-Free Forgiveness
                  </span>
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    Public Service Loan Forgiveness (PSLF)
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Forgives the remaining balance on Direct Loans after 120
                    qualifying monthly payments under an accepted repayment plan
                    while working full-time for a U.S. federal, state, local, or
                    tribal government or 501(c)(3) non-profit organization.
                  </p>
                </div>
                <a
                  href="https://studentaid.gov/pslf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30 w-fit"
                >
                  <span>PSLF Help Tool Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Teacher Loan Forgiveness */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    Up to $17,500
                  </span>
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    Teacher Loan Forgiveness
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    If you teach full-time for 5 consecutive years in a
                    low-income elementary or secondary school, you may qualify
                    for up to $17,500 in loan forgiveness on Direct or FFEL
                    Subsidized and Unsubsidized loans.
                  </p>
                </div>
                <a
                  href="https://studentaid.gov/manage-loans/forgiveness-cancellation/teacher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 w-fit"
                >
                  <span>Teacher Relief Rules</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Disability Discharge */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                    100% Balance Discharge
                  </span>
                  <HeartHandshake className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    Total & Permanent Disability (TPD) Discharge
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Relieves borrowers from having to repay federal Direct
                    Loans, FFEL loans, Perkins loans, or TEACH Grant service
                    obligations if you are totally and permanently disabled (VA
                    disability, SSA determination, or physician certification).
                  </p>
                </div>
                <a
                  href="https://www.disabilitydischarge.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 w-fit"
                >
                  <span>DisabilityDischarge.com</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Borrower Defense & Misrepresentation */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                    School Misconduct Discharge
                  </span>
                  <FileCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    Borrower Defense to Repayment
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    If your university or career college misled you or engaged
                    in deceptive marketing, fake job placement rates, or
                    misconduct violating state law, you can apply for full
                    federal debt cancellation through Borrower Defense.
                  </p>
                </div>
                <a
                  href="https://studentaid.gov/borrower-defense/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-500/30 w-fit"
                >
                  <span>File Borrower Defense Claim</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Fresh Start & Default Resolution Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Defaulted Loans & Credit Score Protection ("Fresh Start")
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                Remove Credit Derogatories
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              If your federal student loans went into default (270+ days past
              due), federal law grants you options to cure the default, remove
              negative marks from Equifax, Experian, and TransUnion, and regain
              eligibility for financial aid:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-cyan-300 block font-black">
                  Option A: Direct Consolidation Loan
                </strong>
                <span>
                  Consolidate defaulted federal loans into a new Direct
                  Consolidation Loan with an Income-Driven Repayment plan.
                  Restores good standing instantly.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-emerald-300 block font-black">
                  Option B: Loan Rehabilitation
                </strong>
                <span>
                  Make 9 consecutive on-time reasonable monthly payments. Once
                  completed, the default notation is completely removed from
                  your credit reports.
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                ED Default Resolution Group: 1-800-621-3115
              </span>
              <a
                href="https://myeddebt.ed.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                <span>Default Resolution Portal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Official Servicer Contact Directory */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Official Federal Loan Servicers Contact Directory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* MOHELA */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-white font-black text-sm">
                    MOHELA
                  </strong>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    PSLF & IDR Lead
                  </span>
                </div>
                <div className="text-neutral-400 space-y-0.5 font-mono text-[11px]">
                  <div>Phone: 1-888-866-4352</div>
                  <div>Web: mohela.com</div>
                </div>
                <a
                  href="https://www.mohela.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Visit MOHELA Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Nelnet */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-white font-black text-sm">
                    Nelnet
                  </strong>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Direct Loan Servicer
                  </span>
                </div>
                <div className="text-neutral-400 space-y-0.5 font-mono text-[11px]">
                  <div>Phone: 1-888-486-4722</div>
                  <div>Web: nelnet.com</div>
                </div>
                <a
                  href="https://nelnet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Visit Nelnet Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Aidvantage */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-white font-black text-sm">
                    Aidvantage
                  </strong>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Direct Loan Servicer
                  </span>
                </div>
                <div className="text-neutral-400 space-y-0.5 font-mono text-[11px]">
                  <div>Phone: 1-800-722-1300</div>
                  <div>Web: aidvantage.com</div>
                </div>
                <a
                  href="https://aidvantage.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Visit Aidvantage Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Edfinancial */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-white font-black text-sm">
                    Edfinancial Services
                  </strong>
                  <span className="text-[10px] text-amber-300 font-mono">
                    Direct Loan Servicer
                  </span>
                </div>
                <div className="text-neutral-400 space-y-0.5 font-mono text-[11px]">
                  <div>Phone: 1-850-438-9101</div>
                  <div>Web: edfinancial.com</div>
                </div>
                <a
                  href="https://edfinancial.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Visit Edfinancial Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATOR TAB */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          {/* Live Score Display Card */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 text-center space-y-4 relative overflow-hidden">
            <span className="text-xs text-neutral-400 uppercase font-bold tracking-widest block">
              Simulated FICO Score 8.0
            </span>

            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-6xl font-black font-mono tracking-tighter text-white">
                {estimatedScore}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${rating.bg} ${rating.color} border ${rating.border}`}
              >
                {rating.label}
              </span>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-[#00ff88] h-full rounded-full transition-all duration-500"
                style={{ width: `${((estimatedScore - 300) / 550) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>300 (Poor)</span>
              <span>580</span>
              <span>670</span>
              <span>740</span>
              <span>850 (Max)</span>
            </div>
          </div>

          {/* Interactive Simulator Sliders */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Adjust Credit Factors to See Live Score Impact
            </h3>

            {/* On-Time Payment Record */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-medium">
                  On-Time Payment Record (35%)
                </span>
                <span className="font-mono font-bold text-indigo-400">
                  {onTimePercent}% On-Time
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="100"
                value={onTimePercent}
                onChange={(e) => setOnTimePercent(Number(e.target.value))}
                style={{ touchAction: "pan-y" }}
                className="w-full accent-indigo-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
              />
            </div>

            {/* Credit Utilization % */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-medium">
                  Credit Utilization Ratio (30%)
                </span>
                <span
                  className={`font-mono font-bold ${utilizationPercent <= 9 ? "text-[#00ff88]" : utilizationPercent <= 29 ? "text-amber-400" : "text-[#ff3b3b]"}`}
                >
                  {utilizationPercent}% (
                  {utilizationPercent <= 3
                    ? "Optimal <3%"
                    : utilizationPercent <= 9
                      ? "Great <10%"
                      : "High Warning"}
                  )
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={utilizationPercent}
                onChange={(e) => setUtilizationPercent(Number(e.target.value))}
                style={{ touchAction: "pan-y" }}
                className="w-full accent-indigo-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
              />
            </div>

            {/* Average Age of Accounts */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-medium">
                  Average Credit History Age (15%)
                </span>
                <span className="font-mono font-bold text-indigo-400">
                  {creditAgeYears} Years
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={creditAgeYears}
                onChange={(e) => setCreditAgeYears(Number(e.target.value))}
                style={{ touchAction: "pan-y" }}
                className="w-full accent-indigo-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
              />
            </div>

            {/* Hard Inquiries */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-medium">
                  Hard Inquiries in Past 12 Months (10%)
                </span>
                <span className="font-mono font-bold text-indigo-400">
                  {hardInquiries} Inquir{hardInquiries === 1 ? "y" : "ies"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={hardInquiries}
                onChange={(e) => setHardInquiries(Number(e.target.value))}
                style={{ touchAction: "pan-y" }}
                className="w-full accent-indigo-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
              />
            </div>

            {/* Installment Credit Mix Toggle */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-white/10">
              <span className="text-neutral-300 font-medium">
                Active Mortgage or Auto Installment Loan?
              </span>
              <button
                onClick={() => setHasInstallmentLoan(!hasInstallmentLoan)}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-all active:scale-95 ${
                  hasInstallmentLoan
                    ? "bg-indigo-500 text-black"
                    : "bg-white/10 text-neutral-400"
                }`}
              >
                {hasInstallmentLoan ? "Yes (Good Mix)" : "No (Revolving Only)"}
              </button>
            </div>
          </div>

          {/* Quick Utilization Calculator Widget */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              Live Balance vs Limit Utilization Calculator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">
                  Total Credit Balance ($)
                </label>
                <input
                  type="number"
                  value={totalBalance}
                  onChange={(e) => setTotalBalance(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">
                  Total Credit Limit ($)
                </label>
                <input
                  type="number"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-bold block">
                  Current Utilization
                </span>
                <span className="text-xs text-neutral-300">
                  Keep under 10% for maximum score boost
                </span>
              </div>
              <span
                className={`text-xl font-black font-mono ${liveCalcUtil <= 9.9 ? "text-[#00ff88]" : liveCalcUtil <= 29.9 ? "text-amber-400" : "text-[#ff3b3b]"}`}
              >
                {liveCalcUtil.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FACTORS TAB */}
      {activeTab === "factors" && (
        <div className="space-y-3">
          {CREDIT_FACTORS.map((factor) => (
            <div
              key={factor.id}
              className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-white">
                    {factor.name}
                  </h4>
                  <span className="text-[10px] font-extrabold uppercase text-indigo-400 font-mono">
                    {factor.scoreImpact}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Target: {factor.targetValue}
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {factor.description}
              </p>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Action Tip:</strong> {factor.tip}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CARDS TAB */}
      {activeTab === "cards" && (
        <div className="space-y-3">
          {CREDIT_CARDS_RECOMMENDED.map((card) => (
            <div
              key={card.id}
              className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                    {card.issuer} • {card.type}
                  </span>
                  <h4 className="font-extrabold text-lg text-white mt-1">
                    {card.name}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Fee: {card.annualFee}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                  Key Perks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {card.perks.map((perk, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-neutral-200"
                    >
                      ✓ {perk}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-neutral-400">
                  Min Score:{" "}
                  <strong className="text-white font-mono">
                    {card.minScoreNeeded}+
                  </strong>
                </span>
                <AffiliateLink
                  href={card.applyUrl}
                  ctaText="BUILD CREDIT FASTER"
                  partnerName={card.name}
                  category="credit"
                  className="px-4 py-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPAIR TAB */}
      
        {activeTab === "live_macro" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Live Credit Macro Data</h2>
              <p className="text-sm text-neutral-400 mb-6">Real-time data sourced from the Federal Reserve Economic Data (FRED) API.</p>
              
              {isMacroLoading ? (
                <div className="flex items-center gap-2 text-neutral-400 p-4">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Fetching live data from FRED...
                </div>
              ) : macroData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Credit Card Delinquency Rate</h3>
                    <div className="text-3xl font-black text-white">{macroData.delinquencies?.[0]?.value}%</div>
                    <p className="text-xs text-neutral-500 mt-2">Delinquency Rate on Credit Card Loans, All Commercial Banks<br/>Last updated: {macroData.delinquencies?.[0]?.date}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Average CC Interest Rate</h3>
                    <div className="text-3xl font-black text-white">{macroData.interestRates?.[0]?.value}%</div>
                    <p className="text-xs text-neutral-500 mt-2">Commercial Bank Interest Rate on Credit Card Plans<br/>Last updated: {macroData.interestRates?.[0]?.date}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-900/20 text-red-400 text-sm">Failed to load macro data.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "repair" && (
        <div className="space-y-6">
          {/* FCRA Consumer Rights Cheat Sheet */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-slate-900 border border-indigo-500/30 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              Your Federal Legal Rights Under FCRA & FDCPA
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-indigo-300 block font-black">
                  30-Day Bureau Mandate
                </strong>
                <span>
                  Under FCRA § 611, credit bureaus have 30 days to investigate
                  your dispute with original creditors. If unverified, the item
                  must be legally deleted.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-emerald-300 block font-black">
                  Medical Debt Protections
                </strong>
                <span>
                  Paid medical debts and unpaid medical collections under $500
                  are banned from appearing on credit reports across Equifax,
                  Experian & TransUnion.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-amber-300 block font-black">
                  7-Year Solvency Expiration
                </strong>
                <span>
                  Negative items (late payments, collections, charge-offs) must
                  fall off automatically after 7 years (10 years for Chapter 7
                  bankruptcy).
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <strong className="text-cyan-300 block font-black">
                  Free Credit Freeze Right
                </strong>
                <span>
                  Federal law guarantees every consumer the right to freeze &
                  unfreeze credit at zero cost to block identity theft &
                  fraudulent inquiry pulls.
                </span>
              </div>
            </div>
          </div>

          {/* Copyable 609 Dispute Letter Template */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Section 609 Written Dispute Letter Template
                </h4>
                <p className="text-xs text-neutral-400">
                  Send via USPS Certified Mail with Return Receipt Requested
                  directly to bureau mail addresses.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyLetter}
                  data-testid="copy-dispute-letter"
                  aria-label="Copy Dispute Letter to Clipboard"
                  className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  {copiedLetter ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Letter</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadLetter}
                  data-testid="download-dispute-letter"
                  aria-label="Download Dispute Letter TXT file"
                  className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download TXT</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-[11px] font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed overflow-x-auto select-all">
              {sample609Letter}
            </pre>
          </div>

          {/* Playbook Steps */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Advanced Credit Repair Playbook Steps
            </h4>

            {CREDIT_REPAIR_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-2"
              >
                <h4 className="font-bold text-sm text-indigo-300">
                  {step.title}
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBuildingHub;
