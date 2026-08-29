import React, { useState } from "react";
import {
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  BarChart3,
  Percent,
  CheckCircle2,
  Info,
  DollarSign,
  Scale
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";
import { triggerHaptic } from "../../utils/haptics";
import { DataProvenanceCard, DataProvenanceItem } from "../../components/common/DataProvenanceBadge";

const ACCOUNTING_DATA_SOURCES: DataProvenanceItem[] = [
  {
    metricName: "DuPont Return on Equity (ROE) Decomposition",
    source: "DuPont Corporation Financial Control System & CFA Institute Level 1 Curriculum",
    sourceType: "Industry Benchmark",
    asOfDate: "Permanent Accounting Standard",
    updateFrequency: "Permanent Physics",
    details: "ROE = Net Profit Margin (Profitability) × Asset Turnover (Efficiency) × Equity Multiplier (Financial Leverage)."
  },
  {
    metricName: "Beneish M-Score Earnings Manipulation Model",
    source: "Prof. Messod Beneish, Indiana University (1999) 'The Detection of Earnings Manipulation'",
    sourceType: "Industry Benchmark",
    asOfDate: "Empirical Academic Model",
    updateFrequency: "Permanent Physics",
    details: "8-variable probabilistic model predicting earnings overstatement (M-Score > -1.78 indicates high probability of accounting manipulation; famously flagged Enron prior to collapse)."
  },
  {
    metricName: "EBITDA-to-Unlevered Free Cash Flow (FCFF) Waterfall",
    source: "GAAP / IFRS Accounting Standards & SEC Regulation S-K Item 10(e)",
    sourceType: "Regulatory Agency",
    asOfDate: "Permanent Accounting Standard",
    updateFrequency: "Permanent Physics",
    details: "Unlevered FCF = Operating Cash Flow (CFO) - Capital Expenditures (CapEx) ± Net Working Capital adjustments."
  }
];

export const FinancialForensicsModeler: React.FC = () => {
  // DuPont Analysis Sliders
  const [netMargin, setNetMargin] = useState<number>(14.5); // %
  const [assetTurnover, setAssetTurnover] = useState<number>(1.2); // x
  const [equityMultiplier, setEquityMultiplier] = useState<number>(2.4); // x Leverage (Assets/Equity)

  // EBITDA to FCF Waterfall inputs ($ Millions)
  const [revenue, setRevenue] = useState<number>(1000);
  const [ebitdaMargin, setEbitdaMargin] = useState<number>(28); // 28% = $280M
  const [capexPercent, setCapexPercent] = useState<number>(8); // 8% of revenue = $80M
  const [nwcChange, setNwcChange] = useState<number>(15); // +$15M working capital drag
  const [taxRate, setTaxRate] = useState<number>(21); // %

  // Beneish M-Score Forensics Inputs
  const [dsri, setDsri] = useState<number>(1.05); // Days Sales in Receivables Index
  const [gmi, setGmi] = useState<number>(1.02); // Gross Margin Index
  const [aqi, setAqi] = useState<number>(0.98); // Asset Quality Index
  const [sgi, setSgi] = useState<number>(1.12); // Sales Growth Index
  const [depi, setDepi] = useState<number>(1.01); // Depreciation Index
  const [sgai, setSgai] = useState<number>(0.95); // SG&A Expense Index
  const [lvgi, setLvgi] = useState<number>(1.08); // Leverage Index
  const [tata, setTata] = useState<number>(0.03); // Total Accruals to Total Assets

  // Calculated DuPont
  const calculatedRoe = (netMargin * assetTurnover * equityMultiplier);

  // Calculated Waterfall
  const ebitda = (revenue * ebitdaMargin) / 100;
  const depreciation = revenue * 0.05; // 5% assumed
  const ebit = ebitda - depreciation;
  const taxes = Math.max(0, ebit * (taxRate / 100));
  const nopat = ebit - taxes;
  const capex = (revenue * capexPercent) / 100;
  const unleveredFcf = nopat + depreciation - capex - nwcChange;

  // Calculated Beneish M-Score
  // Formula: -4.84 + 0.920*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.037*TATA + 0.0327*LVGI
  const mScore =
    -4.84 +
    0.92 * dsri +
    0.528 * gmi +
    0.404 * aqi +
    0.892 * sgi +
    0.115 * depi -
    0.172 * sgai +
    4.037 * tata +
    0.0327 * lvgi;

  const isManipulationRisk = mScore > -1.78;

  const waterfallData = [
    { name: "Gross Revenue", value: revenue, fill: "#06b6d4" },
    { name: "EBITDA", value: ebitda, fill: "#3b82f6" },
    { name: "Less: Taxes", value: -taxes, fill: "#ef4444" },
    { name: "Less: CapEx", value: -capex, fill: "#f97316" },
    { name: "NWC Drag", value: -nwcChange, fill: "#eab308" },
    { name: "Unlevered FCF", value: unleveredFcf, fill: unleveredFcf > 0 ? "#10b981" : "#dc2626" }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-black border border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                10-K Forensic Accounting & Cash Flow Deconstructor
              </h2>
            </div>
            <p className="text-xs text-cyan-200/80 font-mono">
              Interactive 3-Statement Financial Modeling, DuPont ROE Decomposition & Beneish Manipulation Forensics
            </p>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
            Wall Street Buy-Side Grade
          </div>
        </div>
      </div>

      {/* MODULE 1: 3-TIER DUPONT ANALYSIS ENGINE */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-white text-base uppercase tracking-wider">
              1. DuPont 3-Way ROE Decomposition
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-mono">Resulting Return on Equity (ROE)</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {calculatedRoe.toFixed(1)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          High ROE can be driven by high profit margins (<em>pricing power</em>), rapid asset turnover (<em>operational efficiency</em>), or heavy debt leverage (<em>financial risk</em>). Use the sliders below to isolate where the company's returns originate.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Factor 1: Net Margin */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase">Profitability (Net Margin)</span>
              <span className="text-sm font-mono font-black text-cyan-400">{netMargin}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={netMargin}
              onChange={(e) => {
                triggerHaptic("selection");
                setNetMargin(parseFloat(e.target.value));
              }}
              className="w-full accent-cyan-400"
            />
            <div className="text-[11px] text-neutral-400">
              Formula: <span className="font-mono text-neutral-300">Net Income ÷ Revenue</span>
              <p className="text-[10px] text-neutral-500 mt-1">Measures competitive moat & pricing power.</p>
            </div>
          </div>

          {/* Factor 2: Asset Turnover */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase">Efficiency (Asset Turnover)</span>
              <span className="text-sm font-mono font-black text-amber-400">{assetTurnover.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.5"
              step="0.05"
              value={assetTurnover}
              onChange={(e) => {
                triggerHaptic("selection");
                setAssetTurnover(parseFloat(e.target.value));
              }}
              className="w-full accent-amber-400"
            />
            <div className="text-[11px] text-neutral-400">
              Formula: <span className="font-mono text-neutral-300">Revenue ÷ Total Assets</span>
              <p className="text-[10px] text-neutral-500 mt-1">Measures capital velocity & asset utilization.</p>
            </div>
          </div>

          {/* Factor 3: Equity Multiplier */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase">Leverage (Equity Multiplier)</span>
              <span className="text-sm font-mono font-black text-purple-400">{equityMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.1"
              value={equityMultiplier}
              onChange={(e) => {
                triggerHaptic("selection");
                setEquityMultiplier(parseFloat(e.target.value));
              }}
              className="w-full accent-purple-400"
            />
            <div className="text-[11px] text-neutral-400">
              Formula: <span className="font-mono text-neutral-300">Total Assets ÷ Shareholders' Equity</span>
              <p className="text-[10px] text-neutral-500 mt-1">Measures balance sheet risk & debt magnification.</p>
            </div>
          </div>
        </div>

        {/* DuPont Formula Banner */}
        <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-neutral-400">DuPont Equation:</span>
          <div className="flex items-center gap-2 text-white">
            <span className="text-cyan-400">{netMargin}%</span>
            <span className="text-neutral-600">×</span>
            <span className="text-amber-400">{assetTurnover.toFixed(2)}x</span>
            <span className="text-neutral-600">×</span>
            <span className="text-purple-400">{equityMultiplier.toFixed(2)}x</span>
            <span className="text-neutral-600">=</span>
            <span className="text-emerald-400 font-bold">{calculatedRoe.toFixed(2)}% ROE</span>
          </div>
        </div>
      </div>

      {/* MODULE 2: EBITDA-TO-FREE CASH FLOW WATERFALL */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-white text-base uppercase tracking-wider">
              2. EBITDA to Unlevered Free Cash Flow (FCFF) Bridge
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-mono">Unlevered Free Cash Flow</span>
            <span className={`text-xl sm:text-2xl font-black font-mono ${unleveredFcf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${unleveredFcf.toFixed(1)}M
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
                <span>Gross Revenue</span>
                <span className="font-mono text-cyan-400">${revenue}M</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={revenue}
                onChange={(e) => setRevenue(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
                <span>EBITDA Margin</span>
                <span className="font-mono text-blue-400">{ebitdaMargin}% (${ebitda.toFixed(0)}M)</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={ebitdaMargin}
                onChange={(e) => setEbitdaMargin(parseFloat(e.target.value))}
                className="w-full accent-blue-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
                <span>CapEx (% of Revenue)</span>
                <span className="font-mono text-orange-400">{capexPercent}% (${capex.toFixed(0)}M)</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={capexPercent}
                onChange={(e) => setCapexPercent(parseFloat(e.target.value))}
                className="w-full accent-orange-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
                <span>Net Working Capital (NWC) Investment</span>
                <span className="font-mono text-amber-400">${nwcChange}M</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={nwcChange}
                onChange={(e) => setNwcChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Chart Column */}
          <div className="lg:col-span-7 bg-neutral-950 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <h4 className="text-xs font-mono text-neutral-400 uppercase mb-2">Cash Flow Conversion Waterfall ($ Millions)</h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="name" stroke="#737373" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#737373" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#404040", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(value: any) => [`$${value}M`, "Amount"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-neutral-400 pt-2 border-t border-white/5 flex justify-between font-mono">
              <span>EBITDA-to-FCF Conversion Rate:</span>
              <strong className="text-white">
                {ebitda > 0 ? ((unleveredFcf / ebitda) * 100).toFixed(1) : "0"}%
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 3: BENEISH M-SCORE FORENSIC FRAUD DETECTOR */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isManipulationRisk ? "text-red-400" : "text-emerald-400"}`} />
            <h3 className="font-black text-white text-base uppercase tracking-wider">
              3. Beneish M-Score Earnings Manipulation Analyzer
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold ${
                isManipulationRisk
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}
            >
              {isManipulationRisk ? "HIGH MANIPULATION RISK" : "CLEAN ACCOUNTING BENCHMARK"}
            </span>
            <span className="text-lg font-mono font-black text-white">
              Score: {mScore.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-neutral-300 space-y-2">
          <p>
            <strong>Rule of Thumb:</strong> A Beneish M-Score <strong>greater than -1.78</strong> indicates a high probability that the firm is artificially inflating earnings through aggressive revenue recognition, deferred expenses, or unusual inventory capitalizations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">DSRI (Receivables Index)</span>
              <span className="font-mono text-cyan-400">{dsri}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={dsri}
              onChange={(e) => setDsri(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-neutral-500">DSO vs Prior Year (&gt;1.0 means receivables outpaced sales).</p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">GMI (Gross Margin Index)</span>
              <span className="font-mono text-amber-400">{gmi}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="2.0"
              step="0.05"
              value={gmi}
              onChange={(e) => setGmi(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
            <p className="text-[10px] text-neutral-500">Prior Margin ÷ Current Margin (&gt;1.0 means margins deteriorated).</p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">AQI (Asset Quality Index)</span>
              <span className="font-mono text-purple-400">{aqi}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={aqi}
              onChange={(e) => setAqi(parseFloat(e.target.value))}
              className="w-full accent-purple-400"
            />
            <p className="text-[10px] text-neutral-500">Non-current assets other than PP&E (&gt;1.0 means capitalising expenses).</p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-300">TATA (Total Accruals)</span>
              <span className="font-mono text-emerald-400">{tata}</span>
            </div>
            <input
              type="range"
              min="-0.2"
              max="0.3"
              step="0.01"
              value={tata}
              onChange={(e) => setTata(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <p className="text-[10px] text-neutral-500">Accruals vs Total Assets (Higher means net income is non-cash).</p>
          </div>
        </div>
      </div>

      {/* DATA PROVENANCE & METHODOLOGY */}
      <DataProvenanceCard
        category="Forensic Accounting & Valuation Science"
        lastUpdated="August 2026 (GAAP / CFA Institute Standards)"
        sources={ACCOUNTING_DATA_SOURCES}
        defaultExpanded={false}
      />
    </div>
  );
};
