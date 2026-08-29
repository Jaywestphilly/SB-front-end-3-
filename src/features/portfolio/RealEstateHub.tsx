import React, { useState, useEffect } from "react";
import { useSubTabUrl } from "../../hooks/useSubTabUrl";
import { NotFinancialAdviceTag } from "../../components/NotFinancialAdviceTag";
import { AffiliateLink } from "../../components/AffiliateLink";
import {
  RealEstateCalcInput,
  RealEstateCalcResult,
  StockTicker,
} from "../../types";
import {
  DEFAULT_REAL_ESTATE_INPUT,
  REAL_ESTATE_STRATEGIES,
} from "../../data/realestate";
import {
  Calculator,
  LineChart,
  DollarSign,
  Building2,
  TrendingUp,
  Percent,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Home,
  Gift,
  Car,
  ExternalLink,
  CheckCircle2,
  Award,
  BookOpen,
  HeartHandshake,
  FileText,
  Landmark,
  Download,
  Server,
  AlertTriangle,
  Lock,
  Zap,
} from "lucide-react";
import { CreMaturityWallRefinance } from "../realestate/CreMaturityWallRefinance";
import { DataCenterCapRateArbitrage } from "../realestate/DataCenterCapRateArbitrage";
import { HousingAffordabilityMortgageEngine } from "../realestate/HousingAffordabilityMortgageEngine";
import { CrossDomainArbitrageEngine } from "./CrossDomainArbitrageEngine";
import { GlobalInfrastructureMap } from "../../components/GlobalInfrastructureMap";
import { ResponsiveSubTabNav } from "../../components/ResponsiveSubTabNav";

interface RealEstateHubProps {
  reitStocks: StockTicker[];
  onSelectTab?: (tab: string) => void;
  onSelectStock: (stock: StockTicker) => void;
}

export const RealEstateHub: React.FC<RealEstateHubProps> = ({
  reitStocks,
  onSelectTab,
  onSelectStock,
}) => {
  const [calcInput, setCalcInput] = useState<RealEstateCalcInput>(
    DEFAULT_REAL_ESTATE_INPUT,
  );
  const [activeTab, setActiveTab] = useSubTabUrl(
    "/real-estate",
    [
      "brownfield_substation",
      "infrastructure_map",
      "cre_debt",
      "datacenter_arbitrage",
      "housing_mortgage",
      "live_macro",
      "calculator",
      "first_home",
      "strategies",
      "reits"
    ] as const,
    "brownfield_substation"
  );
  
  const [macroData, setMacroData] = useState<any>(null);
  const [isMacroLoading, setIsMacroLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "live_macro" && !macroData) {
      setIsMacroLoading(true);
      fetch("/api/macro/real-estate")
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

  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(
    "house_hacking",
  );

  // Compute Cash Flow & Cap Rate
  const computeResults = (): RealEstateCalcResult => {
    const downPaymentAmount =
      (calcInput.propertyPrice * calcInput.downPaymentPercent) / 100;
    const loanAmount = calcInput.propertyPrice - downPaymentAmount;

    // Monthly Mortgage Payment Formula: P * [i*(1+i)^n] / [(1+i)^n 1]
    const monthlyRate = calcInput.interestRate / 100 / 12;
    const totalPayments = calcInput.loanTermYears * 12;

    let monthlyMortgage = 0;
    if (monthlyRate > 0) {
      monthlyMortgage =
        (loanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    } else {
      monthlyMortgage = loanAmount / totalPayments;
    }

    const grossMonthlyIncome = calcInput.monthlyRent;
    const propertyTaxMonthly = calcInput.propertyTaxAnnual / 12;
    const insuranceMonthly = calcInput.insuranceAnnual / 12;
    const maintenanceMonthly =
      (grossMonthlyIncome * calcInput.maintenancePercent) / 100;
    const vacancyMonthly =
      (grossMonthlyIncome * calcInput.vacancyPercent) / 100;
    const propertyManagementMonthly =
      (grossMonthlyIncome * calcInput.propertyManagementPercent) / 100;

    const monthlyExpenses =
      monthlyMortgage +
      propertyTaxMonthly +
      insuranceMonthly +
      maintenanceMonthly +
      vacancyMonthly +
      propertyManagementMonthly;
    const netMonthlyCashFlow = grossMonthlyIncome - monthlyExpenses;
    const netAnnualCashFlow = netMonthlyCashFlow * 12;

    // NOI = Annual Gross Rent Annual Operating Expenses (Excluding Mortgage)
    const annualOperatingExpenses =
      (propertyTaxMonthly +
        insuranceMonthly +
        maintenanceMonthly +
        vacancyMonthly +
        propertyManagementMonthly) *
      12;
    const annualGrossRent = grossMonthlyIncome * 12;
    const netOperatingIncome = annualGrossRent - annualOperatingExpenses;

    const capRate = (netOperatingIncome / calcInput.propertyPrice) * 100;
    const totalInvestment = downPaymentAmount + calcInput.propertyPrice * 0.03; // assuming ~3% closing costs
    const cashOnCashReturn = (netAnnualCashFlow / totalInvestment) * 100;

    return {
      downPaymentAmount,
      loanAmount,
      monthlyMortgage,
      grossMonthlyIncome,
      monthlyExpenses,
      netMonthlyCashFlow,
      netAnnualCashFlow,
      capRate,
      cashOnCashReturn,
      totalInvestment,
    };
  };

  const results = computeResults();

  const handleDownloadPDFSummary = () => {
    const summaryText = `STOCK BLOC REAL ESTATE DEAL CASH FLOW ANALYSIS
=================================================
Property Purchase Price: $${calcInput.propertyPrice.toLocaleString()}
Gross Monthly Rent: $${calcInput.monthlyRent.toLocaleString()}
Down Payment: ${calcInput.downPaymentPercent}% ($${results.downPaymentAmount.toLocaleString()})
Interest Rate: ${calcInput.interestRate}%
Annual Property Taxes: $${calcInput.propertyTaxAnnual.toLocaleString()}
Annual Insurance: $${calcInput.insuranceAnnual.toLocaleString()}

FINANCIAL PERFORMANCE METRICS
-------------------------------------------------
Monthly Cash Flow: $${Math.round(results.netMonthlyCashFlow).toLocaleString()}/mo
Cap Rate: ${results.capRate.toFixed(2)}%
Cash-on-Cash ROI: ${results.cashOnCashReturn.toFixed(2)}%
Monthly Mortgage Payment: $${Math.round(results.monthlyMortgage).toLocaleString()}/mo
Total Initial Cash Outlay: $${Math.round(results.totalInvestment).toLocaleString()}

Generated by Stock Bloc Quant Wealth Terminal
https://stock-bloc.ai.studio/real-estate
`;

    const blob = new Blob([summaryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Real_Estate_Deal_Analysis_StockBloc_${calcInput.propertyPrice}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const isPositiveCashFlow = results.netMonthlyCashFlow >= 0;

  return (
    <div className="p-4 space-y-6 max-w-[1400px] mx-auto text-white">
      {/* Header Banner */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-neutral-900 to-cyan-950 border border-emerald-500/30 shadow-2xl space-y-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Real Estate Wealth
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Cash Flow & Cap Rates
          </span>
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-wider leading-tight animate-periodic-text-glitch">
          Real Estate Deal Analyzer & REIT Market Hub
        </h2>
        <p className="text-xs font-tech text-neutral-300 uppercase tracking-wide leading-relaxed">
          Evaluate rental property cash flows, access first-time home buyer
          grants & government programs, test mortgage scenarios, or invest in
          liquid data center REITs.
        </p>

        {/* Sub-Tabs Selector */}
        <div className="pt-2">
          <ResponsiveSubTabNav
            title="Real Estate Hub Modules"
            activeTab={activeTab}
            onChange={(tabId) => {
              const id = tabId as string;
              if (id === "vacancy_empire") {
                if (onSelectTab) onSelectTab("vacancy_empire");
                else window.open("/vacancy-empire.html", "_blank");
              } else if (id === "robotaxi_vs_housing") {
                if (onSelectTab) onSelectTab("ai_revolution");
              } else {
                setActiveTab(id as any);
              }
            }}
            tabs={[
              {
                id: "brownfield_substation",
                label: "Brownfield Substation & 0% Arbitrage",
                icon: <Zap className="w-3.5 h-3.5 text-emerald-300" />,
                badge: "Physical Physics",
                colorScheme: "emerald",
                description: "Interconnection queue bypass: Converting fossil plants into AI compute substations",
              },
              {
                id: "infrastructure_map",
                label: "Data Center & Infrastructure Map",
                icon: <Server className="w-3.5 h-3.5 text-cyan-300" />,
                badge: "Live Geo-Radar",
                colorScheme: "cyan",
                description: "Interactive global map of hyperscale data centers, MW capacities & physical constraints",
              },
              {
                id: "cre_debt",
                label: "CRE Maturity Wall ($1.8T)",
                icon: <AlertTriangle className="w-3.5 h-3.5 text-red-300" />,
                badge: "Refinancing Shock",
                colorScheme: "red",
                description: "Refinancing shock analyzer for regional bank debt and loan maturities",
              },
              {
                id: "datacenter_arbitrage",
                label: "AI Data Center vs Office Cap Rates",
                icon: <Server className="w-3.5 h-3.5 text-cyan-300" />,
                badge: "Yield Spread",
                colorScheme: "cyan",
                description: "Triple-net power lease arbitrage vs decaying downtown office assets",
              },
              {
                id: "housing_mortgage",
                label: "Mortgage Lock-In & Homebuilder Buydowns",
                icon: <Lock className="w-3.5 h-3.5 text-emerald-300" />,
                badge: "4.99% Buydown",
                colorScheme: "emerald",
                description: "Golden handcuff dynamics vs D.R. Horton / Lennar forward rate buydowns",
              },
              {
                id: "live_macro",
                label: "Live Market Data",
                icon: <LineChart className="w-3.5 h-3.5" />,
                colorScheme: "emerald",
                description: "Real-time mortgage yields, REIT index pricing & benchmark housing data",
              },
              {
                id: "vacancy_empire",
                label: "Vacancy Empire Game",
                icon: <Sparkles className="w-3.5 h-3.5" />,
                badge: "Interactive",
                colorScheme: "emerald",
                description: "Commercial real estate distress simulator and property empire builder",
              },
              {
                id: "calculator",
                label: "Cashflow Calculator",
                icon: <Calculator className="w-3.5 h-3.5" />,
                colorScheme: "emerald",
                description: "Rental property cap rate, NOI, cash-on-cash return & DSCR modeler",
              },
              {
                id: "first_home",
                label: "First-Time Home Buyers",
                icon: <Home className="w-3.5 h-3.5 text-cyan-300" />,
                colorScheme: "emerald",
                description: "Federal Down Payment Assistance, FHA & state grant programs",
              },
              {
                id: "strategies",
                label: "Investing Strategies",
                icon: <TrendingUp className="w-3.5 h-3.5" />,
                colorScheme: "emerald",
                description: "BRRRR method, House Hacking, syndications & 1031 like-kind exchanges",
              },
              {
                id: "reits",
                label: "REIT Watchlist",
                icon: <Building2 className="w-3.5 h-3.5" />,
                colorScheme: "emerald",
                description: "Top data center, industrial logistics & residential dividend REITs",
              },
            ]}
          />
        </div>
      </div>

      {/* NEW QUANTITATIVE REAL ESTATE MODULES */}
      {activeTab === "brownfield_substation" && <CrossDomainArbitrageEngine />}

      {activeTab === "infrastructure_map" && (
        <GlobalInfrastructureMap onSelectStock={onSelectStock} initialCategory="datacenter" />
      )}

      {activeTab === "cre_debt" && <CreMaturityWallRefinance />}

      {activeTab === "datacenter_arbitrage" && <DataCenterCapRateArbitrage />}

      {activeTab === "housing_mortgage" && <HousingAffordabilityMortgageEngine />}

      {/* CALCULATOR TAB */}
      {activeTab === "calculator" && (
        <div className="space-y-6">
          {/* Output Summary Card */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Projected Monthly Net Cash Flow
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold ${
                  isPositiveCashFlow
                    ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30"
                    : "bg-[#ff3b3b]/20 text-[#ff3b3b] border border-[#ff3b3b]/30"
                }`}
              >
                {isPositiveCashFlow
                  ? "Positive Cash Flow"
                  : "Negative Cash Flow"}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-black font-mono tracking-tight ${isPositiveCashFlow ? "text-[#00ff88]" : "text-[#ff3b3b]"}`}
              >
                {isPositiveCashFlow ? "+" : ""}$
                {Math.round(results.netMonthlyCashFlow).toLocaleString()}/mo
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                (${Math.round(results.netAnnualCashFlow).toLocaleString()}/yr)
              </span>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-neutral-400 font-semibold block">
                  Cap Rate
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {results.capRate.toFixed(2)}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-neutral-400 font-semibold block">
                  Cash-on-Cash ROI
                </span>
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {results.cashOnCashReturn.toFixed(2)}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-neutral-400 font-semibold block">
                  Monthly Mortgage
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  ${Math.round(results.monthlyMortgage).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={handleDownloadPDFSummary}
                data-testid="download-real-estate-pdf"
                aria-label="Download Real Estate Deal Report Summary"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Summary</span>
              </button>

              <AffiliateLink
                href="https://www.bankrate.com/mortgages/"
                ctaText="COMPARE MORTGAGE RATES"
                partnerName="Bankrate"
                category="mortgage"
                className="px-4 py-2"
              />
            </div>
          </div>

          {/* Interactive Inputs Form */}
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Property & Financing Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Purchase Price */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300 font-medium flex justify-between">
                  <span>Property Purchase Price</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${calcInput.propertyPrice.toLocaleString()}
                  </span>
                </label>
                <input
                  type="number"
                  value={calcInput.propertyPrice}
                  onChange={(e) =>
                    setCalcInput({
                      ...calcInput,
                      propertyPrice: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Estimated Monthly Rent */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300 font-medium flex justify-between">
                  <span>Gross Monthly Rent</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${calcInput.monthlyRent.toLocaleString()}
                  </span>
                </label>
                <input
                  type="number"
                  value={calcInput.monthlyRent}
                  onChange={(e) =>
                    setCalcInput({
                      ...calcInput,
                      monthlyRent: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Down Payment % */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300 font-medium flex justify-between">
                  <span>Down Payment (%)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {calcInput.downPaymentPercent}% ($
                    {results.downPaymentAmount.toLocaleString()})
                  </span>
                </label>
                <input
                  type="range"
                  min="3.5"
                  max="50"
                  step="0.5"
                  value={calcInput.downPaymentPercent}
                  onChange={(e) =>
                    setCalcInput({
                      ...calcInput,
                      downPaymentPercent: Number(e.target.value),
                    })
                  }
                  style={{ touchAction: "pan-y" }}
                  className="w-full accent-emerald-400 cursor-pointer h-11 py-2 touch-pan-y focus:outline-none"
                />
              </div>

              {/* Interest Rate % */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300 font-medium flex justify-between">
                  <span>Interest Rate (%)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {calcInput.interestRate}%
                  </span>
                </label>
                <input
                  type="number"
                  step="0.125"
                  value={calcInput.interestRate}
                  onChange={(e) =>
                    setCalcInput({
                      ...calcInput,
                      interestRate: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Annual Taxes */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300 font-medium">
                  Annual Property Taxes ($)
                </label>
                <input
                  type="number"
                  value={calcInput.propertyTaxAnnual}
                  onChange={(e) =>
                    setCalcInput({
                      ...calcInput,
                      propertyTaxAnnual: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Annual Insurance */}
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-300 font-medium">
                  Annual Home Insurance ($)
                </label>
                <input
                  type="number"
                  value={calcInput.insuranceAnnual}
                  onChange={(e) =>
                    setCalcInput({
                      ...calcInput,
                      insuranceAnnual: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIRST-TIME HOME BUYERS TAB */}
      {activeTab === "first_home" && (
        <div className="space-y-6">
          {/* Main Hero Card for HUD & Down Payment Assistance */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950 via-neutral-900 to-emerald-950 border border-cyan-500/40 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-cyan-300" />
                Federal & State Assistance Programs
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                Up to $25,000 DPA Grants
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                First-Time Home Buyer Resource Portal
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed mt-1">
                Unlock official federal loan programs, state down payment
                assistance (DPA) grants, HUD counseling, and zero-down mortgage
                options designed to help first-time buyers purchase property
                with minimal cash out of pocket.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-neutral-300">
                <strong className="text-cyan-300 block font-bold">
                  Down Payment Grants
                </strong>
                Forgivable 2nd mortgages & city grants.
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-neutral-300">
                <strong className="text-cyan-300 block font-bold">
                  Low Down Payment
                </strong>
                3% to 3.5% down conventional & FHA.
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-neutral-300">
                <strong className="text-cyan-300 block font-bold">
                  0% Down Options
                </strong>
                VA & USDA 100% financing loans.
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-cyan-500/20">
              <a
                href="https://www.ncsha.org/housing-finance-agencies/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 border border-white/10"
              >
                <Gift className="w-3.5 h-3.5 text-cyan-400" />
                <span>State Grant (HFA) Directory</span>
              </a>

              <a
                href="https://www.hud.gov/topics/buying_a_home"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-400/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>HUD.gov Official Homebuyer Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Low & Zero Down Payment Loan Programs Matrix */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Primary Government & Low Down Payment Loan Programs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HomeReady / Home Possible */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    3% Down Payment
                  </span>
                  <Home className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    Fannie Mae HomeReady® & Freddie Mac Home Possible®
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Designed for low-to-moderate income buyers with credit
                    scores as low as 620. Allows up to 97% Loan-to-Value (LTV),
                    reduced private mortgage insurance (PMI), and allows boarder
                    or rental income to qualify.
                  </p>
                </div>
                <a
                  href="https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/homeready-mortgage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30 w-fit"
                >
                  <span>HomeReady Guidelines</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* FHA Loans */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                    3.5% Down Payment
                  </span>
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    FHA Loans (Federal Housing Administration)
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Great for buyers with lower credit scores (580+) or higher
                    debt-to-income ratios. Supports 1-to-4 unit primary
                    properties (ideal for 3.5% down house hacking).
                  </p>
                </div>
                <a
                  href="https://www.hud.gov/program_offices/housing/fhaholes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 border border-blue-500/30 w-fit"
                >
                  <span>FHA Loan Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* VA Loans */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    0% Down • No PMI
                  </span>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    VA Home Loans (Dept of Veterans Affairs)
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Backed by the U.S. government for active duty service
                    members, veterans, and surviving spouses. Features 0% down
                    payment, competitive interest rates, and zero monthly PMI
                    fees.
                  </p>
                </div>
                <a
                  href="https://www.va.gov/housing-assistance/home-loans/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 w-fit"
                >
                  <span>VA Loan Benefits</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* USDA Rural Development */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                    0% Down Suburban/Rural
                  </span>
                  <Landmark className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                    USDA Guaranteed Rural Housing Loans
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    Provides 100% financing with zero down payment for eligible
                    suburban and rural properties. Ideal for homebuyers meeting
                    income eligibility guidelines.
                  </p>
                </div>
                <a
                  href="https://www.rd.usda.gov/programs-services/single-family-housing-programs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-cyan-500/30 w-fit"
                >
                  <span>USDA Eligibility Map</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Free Homebuyer Education Course */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Free HUD-Approved Homebuyer Education Certificate
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                Required for DPA Grants
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Most state down payment assistance grants and 3% down mortgage
              programs require completing an official HUD-approved framework
              course. Fannie Mae offers this course 100% free online.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                Fannie Mae HomeView® Free Course
              </span>
              <a
                href="https://www.fanniemae.com/education"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                <span>Take Free Online Course</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step by Step Homebuying Roadmap */}
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              5-Step First-Time Homebuyer Master Roadmap
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-black shrink-0 text-xs">
                  1
                </span>
                <div>
                  <strong className="text-white block font-bold">
                    Credit & Debt-to-Income (DTI) Preparation
                  </strong>
                  <span className="text-neutral-400">
                    Aim for a 620+ credit score and keep total monthly recurring
                    debt payments below 43% of gross income.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-black shrink-0 text-xs">
                  2
                </span>
                <div>
                  <strong className="text-white block font-bold">
                    Secure Lender Pre-Approval (DU)
                  </strong>
                  <span className="text-neutral-400">
                    Get formal automated underwriting system (DU or LP)
                    pre-approval rather than a simple pre-qualification letter.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-black shrink-0 text-xs">
                  3
                </span>
                <div>
                  <strong className="text-white block font-bold">
                    Apply for Down Payment Assistance (DPA)
                  </strong>
                  <span className="text-neutral-400">
                    Combine state HFA grants or forgivable 2nd mortgages with
                    your primary loan to cover down payment & closing costs.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-black shrink-0 text-xs">
                  4
                </span>
                <div>
                  <strong className="text-white block font-bold">
                    House Hunting & Offer Contingencies
                  </strong>
                  <span className="text-neutral-400">
                    Include property inspection, appraisal, and financing
                    contingencies in purchase contracts to protect your earnest
                    money deposit.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-black shrink-0 text-xs">
                  5
                </span>
                <div>
                  <strong className="text-white block font-bold">
                    Escrow Closing & Title Lock
                  </strong>
                  <span className="text-neutral-400">
                    Conduct final walkthrough, review Initial Closing Disclosure
                    (CD), wire final cash-to-close funds, and record title
                    deeds.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRATEGIES TAB */}
      {activeTab === "strategies" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Proven Real Estate Wealth Playbooks
          </h3>

          <div className="space-y-3">
            {REAL_ESTATE_STRATEGIES.map((strat) => {
              const isExpanded = expandedStrategyId === strat.id;
              return (
                <div
                  key={strat.id}
                  className="p-5 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-3 transition-all"
                >
                  <div
                    onClick={() =>
                      setExpandedStrategyId(isExpanded ? null : strat.id)
                    }
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-white">
                          {strat.title}
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {strat.badge}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        {strat.summary}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? "rotate-90 text-emerald-400" : ""}`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-white/10 space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono">
                        <span className="font-bold uppercase text-[10px] text-emerald-400 block mb-0.5">
                          Core Formula
                        </span>
                        {strat.keyFormula}
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold text-white uppercase text-[10px] tracking-wider block">
                          Execution Roadmap
                        </span>
                        <ul className="space-y-1.5 text-neutral-300 list-disc list-inside">
                          {strat.steps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REITS TAB */}
      
        {activeTab === "live_macro" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Live Real Estate Macro Data</h2>
              <p className="text-sm text-neutral-400 mb-6">Real-time data sourced from the Federal Reserve Economic Data (FRED) API.</p>
              
              {isMacroLoading ? (
                <div className="flex items-center gap-2 text-neutral-400 p-4">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Fetching live data from FRED...
                </div>
              ) : macroData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">30-Year Fixed Mortgage</h3>
                    <div className="text-3xl font-black text-white">{macroData.mortgage?.[0]?.value}%</div>
                    <p className="text-xs text-neutral-500 mt-2">Last updated: {macroData.mortgage?.[0]?.date}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Housing Starts</h3>
                    <div className="text-3xl font-black text-white">{macroData.housingStarts?.[0]?.value}K</div>
                    <p className="text-xs text-neutral-500 mt-2">New privately-owned housing units (Annual Rate)<br/>Last updated: {macroData.housingStarts?.[0]?.date}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2">Case-Shiller Index</h3>
                    <div className="text-3xl font-black text-white">{macroData.caseShiller?.[0]?.value}</div>
                    <p className="text-xs text-neutral-500 mt-2">National Home Price Index<br/>Last updated: {macroData.caseShiller?.[0]?.date}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-900/20 text-red-400 text-sm">Failed to load macro data.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reits" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Liquid Real Estate Investment Trusts
              </h3>
              <span className="text-xs text-neutral-400">
                Monthly Dividends & Data Centers
              </span>
            </div>

            <AffiliateLink
              href="https://fundrise.com"
              ctaText="START INVESTING IN REITS"
              partnerName="Fundrise"
              category="reit"
              className="px-4 py-2"
            />
          </div>

          <div className="space-y-2.5">
            {reitStocks.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-300 text-sm">
                    {stock.symbol}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      {stock.name}
                      {stock.dividendYield && (
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          {stock.dividendYield} Div
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {stock.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="font-mono font-bold text-sm text-white block">
                    ${stock.price.toFixed(2)}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${stock.changePercent >= 0 ? "text-[#00ff88]" : "text-[#ff3b3b]"}`}
                  >
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
