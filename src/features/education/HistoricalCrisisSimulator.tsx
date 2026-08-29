import React, { useState } from "react";
import {
  ShieldAlert,
  Flame,
  Clock,
  TrendingDown,
  ArrowRight,
  Zap,
  Building,
  AlertOctagon,
  CheckCircle2,
  BookOpen,
  Award,
  ChevronRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { triggerHaptic } from "../../utils/haptics";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const CRISIS_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "1987 Black Monday Brady Commission Report",
    source: "Presidential Task Force on Market Mechanisms (Brady Report, 1988)",
    sourceType: "Regulatory Agency",
    asOfDate: "Historical Archive",
    updateFrequency: "Permanent Physics",
    details: "Analysis of portfolio insurance, dynamic delta-hedging feedback loops, and NYSE/CME circuit breaker implementations."
  },
  {
    metricName: "1998 LTCM Hedge Fund Bailout & Fed Intervention",
    source: "Federal Reserve Bank of New York Special Report on Long-Term Capital Management",
    sourceType: "Central Bank / Fed",
    asOfDate: "Historical Archive",
    updateFrequency: "Permanent Physics",
    details: "Russian GKO debt default, fixed-income convergence arbitrage, and the $3.6B 14-bank consortium bailout."
  },
  {
    metricName: "2008 Global Financial Crisis & Lehman Bankruptcy",
    source: "Financial Crisis Inquiry Commission (FCIC) Final Report",
    sourceType: "Regulatory Agency",
    asOfDate: "Historical Archive",
    updateFrequency: "Permanent Physics",
    details: "Subprime private-label RMBS, CDO-squared correlation breakdowns, AIG CDS collateral calls, and TARP."
  },
  {
    metricName: "2023 Silicon Valley Bank (SVB) Run & HTM Losses",
    source: "Federal Reserve Board (FRB) Review of the Supervision and Regulation of Silicon Valley Bank (Barr Report)",
    sourceType: "Central Bank / Fed",
    asOfDate: "May 2023 / 2026 Archive",
    updateFrequency: "Permanent Physics",
    details: "Rapid $42B single-day mobile deposit outflow, unrealized Hold-to-Maturity (HTM) duration losses, and BTFP emergency facility."
  }
];

interface CrisisScenario {
  id: string;
  name: string;
  year: string;
  subtitle: string;
  maxDrawdown: string;
  triggerEvent: string;
  systemicMechanism: string;
  regulatoryReform: string;
  keyTakeaway: string;
  timeline: Array<{ time: string; event: string; spxIndex: number }>;
}

const CRISES: CrisisScenario[] = [
  {
    id: "black_monday_1987",
    name: "1987 Black Monday",
    year: "October 19, 1987",
    subtitle: "The First Algorithmic Flash Crash: Dynamic Hedging Cascade",
    maxDrawdown: "-22.61% in a Single Day",
    triggerEvent: "Widening trade deficit, interest rate hikes, and severe opening order imbalances.",
    systemicMechanism: "Institutional 'Portfolio Insurance' automated programs sold S&P 500 futures automatically as prices dropped to synthesize a protective put. This triggered futures discounts, prompting index arbitrageurs to dump cash equities on the NYSE, creating an infinite self-fulfilling downward selling spiral.",
    regulatoryReform: "Implementation of market-wide circuit breakers (Rule 80B: 7%, 13%, and 20% halts) and cross-market clearinghouse harmonization.",
    keyTakeaway: "Mechanistic risk management strategies that work for a single firm become lethal systemic risks when adopted en masse.",
    timeline: [
      { time: "Oct 14", event: "House Ways & Means targets takeover tax benefits; Treasury Sec threatens Dollar", spxIndex: 314 },
      { time: "Oct 15", event: "Equities fall 3%; opening delays on heavy sell orders", spxIndex: 305 },
      { time: "Oct 16", event: "Record Triple Witching volume; S&P drops 5.2% on Friday close", spxIndex: 282 },
      { time: "Oct 19 (Open)", event: "Black Monday: Futures open limit-down; massive wave of portfolio insurance selling", spxIndex: 260 },
      { time: "Oct 19 (Close)", event: "DJIA crashes 508 points (-22.6%); S&P 500 collapses to 224", spxIndex: 224 },
      { time: "Oct 20", event: "Fed Chair Greenspan issues 1-sentence liquidity pledge to banking system", spxIndex: 236 }
    ]
  },
  {
    id: "ltcm_1998",
    name: "1998 LTCM Collapse",
    year: "September 1998",
    subtitle: "High-Leverage Convergence Arbitrage & The Russian Default",
    maxDrawdown: "-90% Fund Equity Loss",
    triggerEvent: "Russian Federation defaults on domestic ruble debt (GKOs) and devalues the ruble on Aug 17, 1998.",
    systemicMechanism: "Nobel laureates Robert Merton and Myron Scholes built mathematical models assuming historical mean-reversion in credit spreads with 25:1 to 100:1 leverage. When the Russian crisis triggered a worldwide flight to liquidity, 'cheap' assets became cheaper and 'expensive' on-the-run Treasuries spiked higher, destroying LTCM's capital.",
    regulatoryReform: "Enhanced counterparty credit risk management (CCRM) rules and stricter hedge fund prime brokerage margin requirements.",
    keyTakeaway: "Liquidity is not a constant; in a crisis, all correlations go to 1.0, and markets can stay irrational longer than you can stay solvent.",
    timeline: [
      { time: "Jan 1998", event: "LTCM equity capital at $4.7B with over $125B balance sheet assets (27:1 leverage)", spxIndex: 970 },
      { time: "Aug 17", event: "Russia defaults on GKOs; global flight to on-the-run US Treasuries begins", spxIndex: 1080 },
      { time: "Aug 21", event: "LTCM loses $550M in a single day as swap spreads blow out to record levels", spxIndex: 1020 },
      { time: "Sep 2", event: "John Meriwether letters to investors seeking emergency capital injection", spxIndex: 990 },
      { time: "Sep 23", event: "NY Fed brokers $3.625B private consortium rescue from 14 major Wall Street banks", spxIndex: 1025 },
      { time: "Oct 15", event: "Fed performs surprise inter-meeting 25 bps rate cut to stabilize markets", spxIndex: 1045 }
    ]
  },
  {
    id: "gfc_2008",
    name: "2008 Global Financial Crisis",
    year: "September 2008",
    subtitle: "Subprime Securitization, CDO Tranches & Shadow Banking Run",
    maxDrawdown: "-56.8% Peak-to-Trough (S&P 500)",
    triggerEvent: "Housing price declines triggered default waves across subprime and Alt-A adjustable-rate mortgages (ARMs).",
    systemicMechanism: "Wall Street structured subprime loans into AAA-rated CDOs via statistical copula models that assumed regional home price independence. When national home prices dropped simultaneously, AAA CDO tranches experienced 80%+ principal losses, rendering major investment banks (Bear Stearns, Lehman, Merrill) insolvent and freezing the repo market.",
    regulatoryReform: "Dodd-Frank Wall Street Reform Act, Basel III capital/liquidity ratios (LCR, NSFR), and the Volcker Rule.",
    keyTakeaway: "Securitization and tranching cannot transform fundamentally risky underlying assets into risk-free investments.",
    timeline: [
      { time: "Mar 2008", event: "Bear Stearns emergency fire-sale acquisition by JPMorgan with $29B Fed backstop", spxIndex: 1330 },
      { time: "Sep 7", event: "US Treasury places Fannie Mae and Freddie Mac into federal conservatorship", spxIndex: 1240 },
      { time: "Sep 15", event: "Lehman Brothers files Chapter 11 bankruptcy; Bank of America buys Merrill Lynch", spxIndex: 1190 },
      { time: "Sep 16", event: "Fed issues $85B emergency credit facility to save AIG from bankruptcy", spxIndex: 1210 },
      { time: "Oct 3", event: "President Bush signs $700B Emergency Economic Stabilization Act (TARP)", spxIndex: 1099 },
      { time: "Mar 2009", event: "S&P 500 bottoms at the generational 666 low; Fed launches massive QE1", spxIndex: 666 }
    ]
  },
  {
    id: "svb_2023",
    name: "2023 SVB Duration Crisis",
    year: "March 2023",
    subtitle: "Mobile-Banking Bank Run & Unhedged HTM Bond Losses",
    maxDrawdown: "$42 Billion Outflow in 10 Hours",
    triggerEvent: "Fed hiked interest rates 500 bps, causing severe paper mark-to-market losses on Silicon Valley Bank's Hold-to-Maturity (HTM) Treasury portfolio.",
    systemicMechanism: "SVB had 90%+ uninsured deposits concentrated in venture-backed startups and held long-duration Treasuries with 1.6% average yields. When startup cash burn forced deposit withdrawals, SVB had to liquidate $21B of securities at a $1.8B loss. Venture capitalists coordinated on social media/messaging apps, triggering the fastest bank run in history ($42B withdrawn in a single day).",
    regulatoryReform: "Fed created the Bank Term Funding Program (BTFP) valuing collateral at par; FDIC exercised systemic risk exception for all uninsured depositors.",
    keyTakeaway: "Deposit stickiness can evaporate in hours in the digital smartphone era; asset-liability duration matching is existential.",
    timeline: [
      { time: "Mar 8", event: "SVB announces $1.8B realized loss on bond sales and seeks $2.25B capital raise", spxIndex: 3992 },
      { time: "Mar 9", event: "Peter Thiel's Founders Fund & VCs urge startups to pull funds; $42B exit requests", spxIndex: 3918 },
      { time: "Mar 10", event: "California DFPI shuts down SVB; FDIC takes over as receiver in mid-morning", spxIndex: 3861 },
      { time: "Mar 12", event: "Signature Bank closed; Fed, Treasury, and FDIC announce Systemic Risk Exception", spxIndex: 3855 },
      { time: "Mar 13", event: "Fed launches BTFP providing 1-year loans against par value Treasuries", spxIndex: 3891 },
      { time: "Mar 26", event: "First Citizens Bank agrees to acquire all SVB deposits and commercial loans", spxIndex: 3977 }
    ]
  }
];

export const HistoricalCrisisSimulator: React.FC = () => {
  const [selectedCrisisId, setSelectedCrisisId] = useState<string>("black_monday_1987");

  const currentCrisis = CRISES.find((c) => c.id === selectedCrisisId) || CRISES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900 to-black border border-red-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Financial Crisis "War Room" & Post-Mortem Simulator
              </h2>
            </div>
            <p className="text-xs text-red-200/80 font-mono">
              Systemic Risk Architecture, Leverage Traps & Regulatory Case Studies
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs font-bold">
            Federal Reserve & Brady Case Files
          </div>
        </div>
      </div>

      {/* CRISIS SELECTOR TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CRISES.map((c) => {
          const isSelected = selectedCrisisId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCrisisId(c.id);
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                isSelected
                  ? "bg-red-950/80 border-red-500 text-white shadow-lg shadow-red-500/20"
                  : "bg-neutral-900/80 border-white/5 text-neutral-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-red-400 font-bold">{c.year}</span>
                <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-neutral-300">
                  Case Study
                </span>
              </div>
              <h4 className="font-black text-sm text-white tracking-tight">{c.name}</h4>
              <p className="text-[11px] text-neutral-400 line-clamp-1">{c.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* SELECTED CRISIS DETAILED BREAKDOWN */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono text-red-400 font-bold uppercase block">
              {currentCrisis.year} // Master Class Briefing
            </span>
            <h3 className="text-xl font-black text-white">{currentCrisis.name}: {currentCrisis.subtitle}</h3>
          </div>
          <div className="px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/30 text-right">
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Peak Shock Velocity</span>
            <span className="text-sm font-black font-mono text-red-400">{currentCrisis.maxDrawdown}</span>
          </div>
        </div>

        {/* TIMELINE CHART */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 space-y-2">
          <h4 className="text-xs font-mono text-neutral-400 uppercase">Chronological Market Index Path</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentCrisis.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="crisisGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#737373" tick={{ fontSize: 10 }} />
                <YAxis stroke="#737373" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#404040", borderRadius: "8px", fontSize: "11px" }}
                  formatter={(value: any) => [`${value} pts`, "Index Level"]}
                />
                <Area type="monotone" dataKey="spxIndex" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#crisisGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4 CORE SYSTEMIC PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>1. The Trigger Catalyst</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {currentCrisis.triggerEvent}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>2. Systemic Failure Mechanism</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {currentCrisis.systemicMechanism}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>3. Regulatory Reform & Circuit Breakers</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {currentCrisis.regulatoryReform}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>4. Buy-Side Quant Rule of Thumb</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-semibold">
              {currentCrisis.keyTakeaway}
            </p>
          </div>
        </div>

        {/* Step-by-Step Playbook Log */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
          <h4 className="text-xs font-mono text-neutral-300 font-bold uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            Play-by-Play Tactical Event Timeline
          </h4>
          <div className="space-y-2">
            {currentCrisis.timeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px] shrink-0 font-bold">
                  {item.time}
                </span>
                <p className="text-neutral-300 font-sans">
                  {item.event}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE */}
      <DataProvenanceCard
        category="Financial History & Systemic Risk Architecture"
        lastUpdated="August 2026 (Federal Reserve & FCIC Archives)"
        sources={CRISIS_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
