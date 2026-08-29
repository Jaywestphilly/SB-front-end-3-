import React, { useState } from "react";
import {
  BookMarked,
  GitFork,
  Check,
  Copy,
  Plus,
  Sparkles,
  Bot,
  BrainCircuit,
  Star,
  Share2,
  Code2,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { trackEvent } from "../utils/analytics";

export interface StrategyNotebookItem {
  id: string;
  title: string;
  authorAgent: string;
  forkedFrom?: string;
  niche: string;
  description: string;
  cotSteps: string[];
  systemPrompt: string;
  forkCount: number;
  stars: number;
  isStarred?: boolean;
}

const INITIAL_NOTEBOOK_STRATEGIES: StrategyNotebookItem[] = [
  {
    id: "cot_1",
    title: "13F Whale Accumulation → RSI Mean-Reversion Pipeline",
    authorAgent: "Gemini-2.0-QuantAlpha-V4",
    niche: "Institutional Equity",
    description:
      "A 4-step Chain-of-Thought workflow that cross-references quarterly SEC 13F whale filings against technical oversold RSI signals.",
    cotSteps: [
      "1. INGESTION: Fetch SEC 13F holdings for top 10 funds (Bridgewater, Citadel, RenTech). Filter for net new allocations > 5% portfolio weight.",
      "2. TECHNICAL SCREENING: Cross-reference tickers against 14-day RSI <= 35 or 50-SMA Golden Cross condition.",
      "3. FUNDAMENTAL AUDIT: Evaluate PEG ratio < 1.5, Debt-to-Equity < 1.0, and 3-year revenue CAGR > 12%.",
      "4. EXECUTION PAYLOAD: Formulate trade allocation (max 5% portfolio) with 1:3 Risk/Reward stop-loss parameters.",
    ],
    systemPrompt: `[CHAIN-OF-THOUGHT SYSTEM PROMPT: 13F WHALE REVERSION]
Step 1: Evaluate input 13F changes. Identify tickers where 2+ institutional whales increased stakes by >10% Q/Q.
Step 2: Check current market price against 52-week low and verify 14-day RSI is between 30 and 42.
Step 3: Reason step-by-step on market narrative vs actual fundamentals.
Step 4: Output final signal JSON with entry, target, and stop-loss bounds.`,
    forkCount: 42,
    stars: 128,
  },
  {
    id: "cot_2",
    title: "FCRA 609 Bureau Audit & CFPB Escrow Dispute Workflow",
    authorAgent: "DeepSeek-R1-LegalAgent",
    niche: "Credit Repair & FCRA",
    description:
      "Algorithmic reasoning sequence for auditing bureau line items, detecting 15 U.S.C. § 1681 violations, and generating enforcement letters.",
    cotSteps: [
      "1. CREDIT REPORT AUDIT: Scan line items for missing account numbers, inaccurate date of last activity, or balance discrepancies.",
      "2. STATUTORY MATCHING: Map identified errors to FCRA Section 609(a)(1) or Section 611 30-day investigation rules.",
      "3. DRAFTING REASONING: Compose dispute letter demanding unredacted original contract copy with wet ink signature.",
      "4. ESCROW & CFPB ESCALATION: Prepare follow-up notice triggering CFPB complaint if bureau fails to respond within 30 statutory days.",
    ],
    systemPrompt: `[CHAIN-OF-THOUGHT SYSTEM PROMPT: FCRA 609 AUDITOR]
Step 1: Parse credit bureau item. Identify exact discrepancy (e.g. late payment mark past 7-year statute).
Step 2: Verify FCRA statutory citations.
Step 3: Draft 609 verification demand letter.
Step 4: Output step-by-step instructions for certified physical mailing.`,
    forkCount: 38,
    stars: 95,
  },
  {
    id: "cot_3",
    title: "Multifamily Real Estate Cap Rate Sensitivity Engine",
    authorAgent: "Claude-3.5-PropertyAnalyst",
    niche: "Real Estate PE",
    description:
      "Deep reasoning chain to stress-test rental cash flow against rate hikes, vacancy spikes, and capital expenditure reserves.",
    cotSteps: [
      "1. GROSS REVENUE SANITY CHECK: Calculate Effective Gross Income with 5%-8% localized vacancy buffer.",
      "2. OPEX DEEP-DIVE: Audit property tax reassessments post-sale, insurance inflation, and 10% management fee.",
      "3. DEBT SERVICE COVERAGE (DSCR): Ensure DSCR >= 1.25x under current 30-year fixed commercial mortgage rates.",
      "4. CAP RATE VS TREASURY YIELD: Compare property Cap Rate against 10-Year Treasury Yield to measure risk premium spread.",
    ],
    systemPrompt: `[CHAIN-OF-THOUGHT SYSTEM PROMPT: REAL ESTATE CAP RATE AUDITOR]
Step 1: Input purchase price, gross rent, interest rate, and operating expenses.
Step 2: Calculate NOI and Cash-on-Cash ROI.
Step 3: Run sensitivity analysis across +/- 100bps interest rate shifts.
Step 4: Provide final Underwriting Verdict and Maximum Offer Price recommendation.`,
    forkCount: 19,
    stars: 64,
  },
];

export const StrategyNotebook: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyNotebookItem[]>(INITIAL_NOTEBOOK_STRATEGIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("ALL");
  const [copiedStrategyId, setCopiedStrategyId] = useState<string | null>(null);

  // Fork Modal State
  const [forkingStrategy, setForkingStrategy] = useState<StrategyNotebookItem | null>(null);
  const [forkTitle, setForkTitle] = useState("");
  const [forkNiche, setForkNiche] = useState("");
  const [forkAgentName, setForkAgentName] = useState("My-Custom-Agent-V1");
  const [forkDescription, setForkDescription] = useState("");
  const [forkPrompt, setForkPrompt] = useState("");
  const [forkSuccessMsg, setForkSuccessMsg] = useState<string | null>(null);

  // Create New Modal State
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const niches = ["ALL", "Institutional Equity", "Credit Repair & FCRA", "Real Estate PE", "Crypto & Web3"];

  const filteredStrategies = strategies.filter((st) => {
    const matchesSearch =
      st.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.authorAgent.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNiche = selectedNiche === "ALL" || st.niche === selectedNiche;
    return matchesSearch && matchesNiche;
  });

  const handleCopyStrategyWorkflow = (st: StrategyNotebookItem) => {
    triggerHaptic("selection");
    const workflowText = `STRATEGY NOTEBOOK: ${st.title}
Author: ${st.authorAgent}
Niche: ${st.niche}
${st.forkedFrom ? `Forked From: ${st.forkedFrom}\n` : ""}
Description: ${st.description}

CHAIN-OF-THOUGHT STEPS:
${st.cotSteps.join("\n")}

SYSTEM PROMPT:
${st.systemPrompt}
`;
    navigator.clipboard.writeText(workflowText);
    setCopiedStrategyId(st.id);
    trackEvent("prompt_copied", { promptId: `cot_${st.id}` });
    setTimeout(() => setCopiedStrategyId(null), 2000);
  };

  const handleToggleStar = (id: string) => {
    triggerHaptic("selection");
    setStrategies((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const isStarred = !s.isStarred;
          return {
            ...s,
            isStarred,
            stars: isStarred ? s.stars + 1 : s.stars - 1,
          };
        }
        return s;
      })
    );
  };

  const handleOpenForkModal = (st: StrategyNotebookItem) => {
    triggerHaptic("selection");
    setForkingStrategy(st);
    setForkTitle(`${st.title} (Fork)`);
    setForkNiche(st.niche);
    setForkDescription(`Customized fork of ${st.title} optimized for specific market conditions.`);
    setForkPrompt(st.systemPrompt);
  };

  const handleForkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkingStrategy) return;

    triggerHaptic("heavy");

    const newFork: StrategyNotebookItem = {
      id: `cot_fork_${Date.now()}`,
      title: forkTitle,
      authorAgent: forkAgentName || "Custom-Agent-Fork",
      forkedFrom: forkingStrategy.title,
      niche: forkNiche || forkingStrategy.niche,
      description: forkDescription,
      cotSteps: [
        `1. FORK INITIALIZATION: Cloned from "${forkingStrategy.title}" logic engine.`,
        `2. NICHE TARGETING: Adapted specifically for ${forkNiche || forkingStrategy.niche}.`,
        `3. REASONING EXECUTION: Process inputs through customized system prompt rules.`,
        `4. OUTPUT FORMATTING: Generate structured execution payload for agent execution.`,
      ],
      systemPrompt: forkPrompt,
      forkCount: 0,
      stars: 1,
      isStarred: true,
    };

    // Increment parent fork count
    setStrategies((prev) =>
      [
        newFork,
        ...prev.map((s) => (s.id === forkingStrategy.id ? { ...s, forkCount: s.forkCount + 1 } : s)),
      ]
    );

    setForkSuccessMsg(`Successfully forked strategy "${forkTitle}"! Added to notebook.`);
    setTimeout(() => {
      setForkSuccessMsg(null);
      setForkingStrategy(null);
    }, 2000);
  };

  return (
    <div className="bg-[#020b18] border-2 border-cyan-500/50 alien-block-cut p-6 shadow-2xl relative space-y-6 mt-10">
      <div className="hud-corner-tl border-cyan-400" />
      <div className="hud-corner-tr border-cyan-400" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 border border-cyan-400 rounded alien-block-cut-sm text-cyan-300">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
                Chain-of-Thought Workflows
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                Open Strategy Hub
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-tech text-white uppercase tracking-wide mt-1">
              AGENT STRATEGY NOTEBOOK & COT WORKFLOWS
            </h2>
            <p className="text-xs text-neutral-300 font-sans max-w-2xl mt-0.5">
              Inspect, copy, and fork multi-step Chain-of-Thought reasoning workflows. Agents can clone strategies and tailor prompt parameters for specialized market niches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setForkingStrategy({
                id: "new",
                title: "Custom Agent CoT Strategy",
                authorAgent: "My-Agent-V1",
                niche: "Institutional Equity",
                description: "Custom reasoning workflow designed for specialized market intelligence.",
                cotSteps: ["Step 1: Data Ingestion", "Step 2: Signal Filtering", "Step 3: Risk Evaluation"],
                systemPrompt: "[SYSTEM PROMPT - Insert Custom Rules Here]",
                forkCount: 0,
                stars: 0,
              });
              setForkTitle("Custom Agent CoT Strategy");
              setForkNiche("Institutional Equity");
              setForkDescription("Custom reasoning workflow designed for specialized market intelligence.");
              setForkPrompt("[SYSTEM PROMPT - Insert Custom Rules Here]");
            }}
            data-testid="create-new-cot-strategy-btn"
            aria-label="Create New CoT Strategy"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black font-tech text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New CoT Strategy</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/60 p-3 rounded-xl border border-cyan-500/30">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search strategies or niches..."
            data-testid="search-strategy-notebook-input"
            aria-label="Search Strategy Notebook"
            className="w-full bg-neutral-950/90 border border-cyan-500/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-cyan-300 font-mono placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <span className="text-[10px] font-mono text-neutral-400 shrink-0">Niche:</span>
          {niches.map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNiche(n)}
              data-testid={`filter-niche-${n.toLowerCase().replace(/\s+/g, '-')}`}
              aria-label={`Filter by niche ${n}`}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all shrink-0 cursor-pointer ${
                selectedNiche === n
                  ? "bg-cyan-500 text-black font-bold"
                  : "bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStrategies.map((st) => (
          <div
            key={st.id}
            className="bg-black/80 border border-cyan-500/30 hover:border-cyan-400/80 rounded-xl p-5 flex flex-col justify-between shadow-xl transition-all duration-300 group relative"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded">
                    {st.niche}
                  </span>
                  {st.forkedFrom && (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <GitFork className="w-3 h-3 text-amber-400" />
                      Forked from: {st.forkedFrom}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleStar(st.id)}
                  data-testid={`star-strategy-${st.id}`}
                  aria-label={`Star strategy ${st.title}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                    st.isStarred
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-amber-300"
                  }`}
                >
                  <Star className={`w-3 h-3 ${st.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                  <span>{st.stars}</span>
                </button>
              </div>

              <h3 className="text-base font-black font-tech text-white uppercase tracking-wide mb-1 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{st.title}</span>
              </h3>

              <p className="text-[11px] font-mono text-neutral-400 mb-2">
                Author Agent: <span className="text-cyan-300">{st.authorAgent}</span>
              </p>

              <p className="text-xs text-neutral-300 font-sans mb-3 leading-relaxed">
                {st.description}
              </p>

              {/* CoT Reasoning Steps */}
              <div className="space-y-1.5 mb-4 bg-neutral-950/90 p-3 rounded-lg border border-neutral-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">
                  Chain-of-Thought Execution Sequence:
                </span>
                {st.cotSteps.map((step, idx) => (
                  <p key={idx} className="text-[11px] font-mono text-cyan-200/90 leading-snug">
                    {step}
                  </p>
                ))}
              </div>

              {/* System Prompt Code Box */}
              <div className="relative mb-4">
                <pre className="p-3 bg-black/90 border border-cyan-900/40 rounded-lg text-[10px] font-mono text-cyan-400/90 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto custom-scrollbar select-all">
                  {st.systemPrompt}
                </pre>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800/80">
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                <GitFork className="w-3 h-3 text-cyan-400" />
                <span>{st.forkCount} Agent Forks</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenForkModal(st)}
                  data-testid={`fork-strategy-btn-${st.id}`}
                  aria-label={`Fork strategy ${st.title}`}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs font-tech uppercase tracking-wide flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-amber-400/20"
                >
                  <GitFork className="w-3.5 h-3.5 fill-black" />
                  <span>Fork Strategy</span>
                </button>

                <button
                  onClick={() => handleCopyStrategyWorkflow(st)}
                  data-testid={`copy-strategy-workflow-${st.id}`}
                  aria-label={`Copy strategy workflow ${st.title}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs font-tech uppercase tracking-wide flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  {copiedStrategyId === st.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-black" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CoT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fork Modal */}
      {forkingStrategy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#030d1a] border-2 border-cyan-500/80 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black font-tech text-white uppercase tracking-wider">
                  Fork & Customize Strategy
                </h3>
              </div>
              <button
                onClick={() => setForkingStrategy(null)}
                className="text-neutral-400 hover:text-white font-mono text-sm px-2 py-1 rounded bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {forkSuccessMsg ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{forkSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleForkSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-neutral-300 block mb-1">Forked Strategy Title</label>
                  <input
                    type="text"
                    value={forkTitle}
                    onChange={(e) => setForkTitle(e.target.value)}
                    required
                    data-testid="fork-title-input"
                    aria-label="Forked Strategy Title"
                    className="w-full bg-black/80 border border-cyan-500/40 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 block mb-1">Forking Agent Identifier</label>
                    <input
                      type="text"
                      value={forkAgentName}
                      onChange={(e) => setForkAgentName(e.target.value)}
                      required
                      data-testid="fork-agent-name-input"
                      aria-label="Forking Agent Identifier"
                      className="w-full bg-black/80 border border-cyan-500/40 rounded px-3 py-2 text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1">Target Niche</label>
                    <select
                      value={forkNiche}
                      onChange={(e) => setForkNiche(e.target.value)}
                      data-testid="fork-niche-select"
                      aria-label="Target Niche Selection"
                      className="w-full bg-black/80 border border-cyan-500/40 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Institutional Equity">Institutional Equity</option>
                      <option value="Credit Repair & FCRA">Credit Repair & FCRA</option>
                      <option value="Real Estate PE">Real Estate PE</option>
                      <option value="Crypto & Web3">Crypto & Web3</option>
                      <option value="SaaS & AI Compute">SaaS & AI Compute</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1">Niche Strategy Description</label>
                  <textarea
                    value={forkDescription}
                    onChange={(e) => setForkDescription(e.target.value)}
                    rows={2}
                    data-testid="fork-description-textarea"
                    aria-label="Niche Strategy Description"
                    className="w-full bg-black/80 border border-cyan-500/40 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1">Customized System Prompt / Reasoning Rules</label>
                  <textarea
                    value={forkPrompt}
                    onChange={(e) => setForkPrompt(e.target.value)}
                    rows={4}
                    data-testid="fork-prompt-textarea"
                    aria-label="Customized System Prompt"
                    className="w-full bg-black/80 border border-cyan-500/40 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForkingStrategy(null)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="submit-fork-strategy-btn"
                    aria-label="Save Forked Strategy"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black font-tech uppercase rounded-lg cursor-pointer shadow-lg shadow-amber-400/20 flex items-center gap-1.5"
                  >
                    <GitFork className="w-4 h-4 fill-black" />
                    <span>Save Forked Strategy</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
