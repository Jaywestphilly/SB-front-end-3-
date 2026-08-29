import React, { useState } from "react";
import {
  CreditCard,
  Zap,
  Globe,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Building2,
  Lock,
  Copy,
  Check,
  Scale,
  Sparkles,
  Bot,
  Terminal,
  Calculator,
  RefreshCw,
  Coins,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export const StripeFintechSuite: React.FC = () => {
  const [monthlyVolume, setMonthlyVolume] = useState<number>(150000);
  const [avgTicketSize, setAvgTicketSize] = useState<number>(75);
  const [intlPercent, setIntlPercent] = useState<number>(25);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeToolkitTab, setActiveToolkitTab] = useState<"card" | "checkout" | "stablecoin">("card");

  // Volume calculations
  const numTransactions = Math.max(1, Math.round(monthlyVolume / avgTicketSize));
  const domesticVolume = monthlyVolume * (1 - intlPercent / 100);
  const intlVolume = monthlyVolume * (intlPercent / 100);

  // Standard Card Processing (2.9% + $0.30 + 1.5% intl)
  const standardCardFees =
    domesticVolume * 0.029 +
    intlVolume * (0.029 + 0.015) +
    numTransactions * 0.3;

  // Stripe Bridge Stablecoin Processing (0.4% flat, instant finality)
  const stablecoinFees = monthlyVolume * 0.004;
  const monthlySavingsWithStablecoins = Math.max(0, standardCardFees - stablecoinFees);
  const annualSavings = monthlySavingsWithStablecoins * 12;

  const handleCopyAgentCode = () => {
    triggerHaptic("selection");
    const snippet = `// Stripe Agent Toolkit: Autonomous LLM Tool Invocation
import { StripeAgentToolkit } from "@stripe/agent-toolkit/ai-sdk";
import { GoogleGenAI } from "@google/genai";

const stripeTools = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    actions: {
      paymentLinks: { create: true },
      invoices: { create: true },
      virtualCards: { create: true, spendingLimit: 50000 }, // in cents ($500 max)
    }
  }
});

// Autonomous LLM agent executes purchase on behalf of user
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: 'Book 5 server instances and generate an ephemeral virtual corporate card with a $350 budget limit.',
  tools: [stripeTools.getTools()]
});`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const VALUATION_HISTORY = [
    { year: "2014", valuation: 1.75, tpv: 10 },
    { year: "2016", valuation: 9.2, tpv: 30 },
    { year: "2018", valuation: 20.0, tpv: 100 },
    { year: "2020", valuation: 36.0, tpv: 350 },
    { year: "2021", valuation: 95.0, tpv: 640 },
    { year: "2023", valuation: 50.0, tpv: 1000 },
    { year: "2024", valuation: 70.0, tpv: 1200 },
    { year: "2025", valuation: 85.0, tpv: 1450 },
  ];

  return (
    <div className="w-full space-y-6 text-white font-mono select-none">
      {/* HERO BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
              <CreditCard className="w-3.5 h-3.5 text-indigo-300" />
              Financial Superstructure
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30">
              $85B Secondary Valuation
            </span>
          </div>

          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>Visit Stripe.com</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
          Stripe: The Operating System for Internet & Agentic Commerce
        </h2>
        <p className="text-xs text-neutral-300 uppercase tracking-wide leading-relaxed max-w-3xl mt-1">
          Processing over $1.4 Trillion annually (~1% of global GDP). From developer-first payment APIs and Stripe Atlas incorporation to Bridge stablecoin settlement and autonomous Agentic AI payment toolkits.
        </p>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-indigo-500/30">
            <span className="text-[10px] text-neutral-400 font-bold uppercase block">Annual Total Volume (TPV)</span>
            <span className="text-xl font-black text-indigo-300">$1.4+ Trillion</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">+25% YoY Expansion</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30">
            <span className="text-[10px] text-neutral-400 font-bold uppercase block">Global Internet GDP Share</span>
            <span className="text-xl font-black text-emerald-300">~1.1% of Global GDP</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">500M+ Daily API Calls</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30">
            <span className="text-[10px] text-neutral-400 font-bold uppercase block">Bridge Stablecoin Rail</span>
            <span className="text-xl font-black text-purple-300">$1.1B Acquisition</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">USDC Instant Orchestration</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/30">
            <span className="text-[10px] text-neutral-400 font-bold uppercase block">Stripe Atlas Startups</span>
            <span className="text-xl font-black text-cyan-300">50,000+ Companies</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Delaware C-Corp & LLCs</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: VALUATION TRAJECTORY & STABLECOIN SAVINGS CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VALUATION & TPV TRAJECTORY CHART */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-indigo-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Capital Trajectory
              </span>
              <h3 className="text-base font-black text-white">
                Valuation ($B) & Payment Volume Run-Rate
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300">2014–2025</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VALUATION_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-black/90 border border-indigo-500/40 text-xs shadow-xl space-y-1">
                          <span className="font-bold text-white block">{d.year} Benchmark</span>
                          <span className="text-indigo-300 block">Valuation: ${d.valuation}B</span>
                          <span className="text-emerald-300 block">Annual TPV: ${d.tpv}B</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="valuation" stroke="#6366f1" strokeWidth={2.5} fill="url(#valGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Stripe achieved sustained GAAP profitability with positive free cash flow, setting the industry benchmark for institutional pre-IPO fintechs.
          </p>
        </div>

        {/* INTERACTIVE PAYMENT FEE & STABLECOIN SAVINGS SIMULATOR */}
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Interchange vs Stablecoin Arbitrage
              </span>
              <h3 className="text-base font-black text-white">
                Payment Processing & Bridge Fee Optimizer
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
              0.4% vs 2.9%
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300">Monthly Transaction Volume:</span>
                <span className="font-bold text-white">${monthlyVolume.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="2000000"
                step="10000"
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Avg Ticket Size ($)</label>
                <input
                  type="number"
                  value={avgTicketSize}
                  onChange={(e) => setAvgTicketSize(Math.max(5, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">International Cards (%)</label>
                <input
                  type="number"
                  value={intlPercent}
                  onChange={(e) => setIntlPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* COMPARISON METRICS */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-black/50 border border-rose-500/20 space-y-1">
                <span className="text-[10px] text-neutral-400 block">Traditional Card Fees</span>
                <span className="text-base font-black text-rose-400">${Math.round(standardCardFees).toLocaleString()}/mo</span>
                <span className="text-[9px] text-neutral-500 block">2.9% + $0.30/tx + 1.5% FX</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-neutral-400 block">Bridge Stablecoin Rail</span>
                <span className="text-base font-black text-emerald-300">${Math.round(stablecoinFees).toLocaleString()}/mo</span>
                <span className="text-[9px] text-emerald-400/80 block">0.4% flat • Instant USDC Settlement</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Projected Annual Savings</span>
                <span className="text-lg font-black text-white">${Math.round(annualSavings).toLocaleString()} / year</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/40">
                +{( (monthlySavingsWithStablecoins / standardCardFees) * 100 ).toFixed(0)}% Margin Retained
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STRIPE AGENT TOOLKIT: AUTONOMOUS LLM COMMERCE SECTION */}
      <div className="p-6 rounded-3xl bg-neutral-900/90 border border-cyan-500/30 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              Autonomous Agent Commerce
            </span>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Stripe Agent Toolkit for LLM Micro-Transactions
            </h3>
          </div>

          <button
            onClick={handleCopyAgentCode}
            className="px-3 py-1.5 rounded-xl bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedCode ? "SDK Snippet Copied!" : "Copy Agent SDK Integration"}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          The Stripe Agent Toolkit enables autonomous AI agents (built on Claude, OpenAI, or Gemini) to securely initiate payments, generate single-use virtual cards with programmatic spending limits, and collect invoices without exposing private credentials.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <CreditCard className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">1. Ephemeral Virtual Cards</h4>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Agents generate temporary virtual cards with exact spending caps ($50 max) and vendor-locked rules via Stripe Issuing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-indigo-500/20 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300">
              <Coins className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">2. Bridge Stablecoin Settlement</h4>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Programmatic micro-settlement in USDC over low-latency L2s (Base, Solana, Arbitrum) with sub-cent gas fees.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/50 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-purple-300">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">3. Stripe Radar ML Fraud Defense</h4>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Real-time anomaly detection trained across billions of global transactions to prevent unauthorized automated agent drain.
            </p>
          </div>
        </div>
      </div>

      {/* STRIPE ATLAS VS TRADITIONAL FORMATION MATRIX */}
      <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Startup Entity Architecture
            </span>
            <h3 className="text-base font-black text-white">
              Stripe Atlas vs Traditional Incorporation
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded">
            $500 All-In
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400">
                <th className="py-2.5 font-bold">Feature / Deliverable</th>
                <th className="py-2.5 font-bold text-indigo-300">Stripe Atlas ($500)</th>
                <th className="py-2.5 font-bold text-neutral-300">Law Firm ($2,500+)</th>
                <th className="py-2.5 font-bold text-neutral-300">DIY State Filing ($300)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              <tr>
                <td className="py-2.5 font-bold text-white">Delaware C-Corp / LLC Filing</td>
                <td className="py-2.5 text-emerald-400 font-bold">Included (1–2 Days)</td>
                <td className="py-2.5 text-emerald-400 font-bold">Included</td>
                <td className="py-2.5 text-amber-400 font-bold">Manual Paperwork</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">Official IRS CP575 EIN</td>
                <td className="py-2.5 text-emerald-400 font-bold">Automated Expedited</td>
                <td className="py-2.5 text-emerald-400 font-bold">Included</td>
                <td className="py-2.5 text-amber-400 font-bold">Direct IRS Portal ($0)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">Post-Incorporation 83(b) Election</td>
                <td className="py-2.5 text-emerald-400 font-bold">1-Click Auto-Generated</td>
                <td className="py-2.5 text-emerald-400 font-bold">Custom Drafted</td>
                <td className="py-2.5 text-rose-400 font-bold">High Risk of Missed 30-Day Window</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">Commercial Bank Integration</td>
                <td className="py-2.5 text-emerald-400 font-bold">Mercury / SVB / Brex 1-Click</td>
                <td className="py-2.5 text-neutral-300">Manual Intro</td>
                <td className="py-2.5 text-neutral-300">Manual Application</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-white">Standard Stock Allocations</td>
                <td className="py-2.5 text-emerald-400 font-bold">10M Shares ($0.00001 Par)</td>
                <td className="py-2.5 text-emerald-400 font-bold">Custom Stock Classes</td>
                <td className="py-2.5 text-rose-400 font-bold">Requires Custom Bylaws</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
