import React, { useState, useEffect } from "react";
import { useSubTabUrl } from "../../hooks/useSubTabUrl";
import {
  Sparkles,
  Bot,
  Cpu,
  Code2,
  BookOpen,
  Terminal,
  Zap,
  Rocket,
  Lightbulb,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
  CheckCircle2,
  Search,
  Layers,
  Sliders,
  Workflow,
  Globe,
  Wand2,
  Video,
  Music,
  FileText,
  HelpCircle,
  Laptop,
  BarChart3,
  Car,
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import { AiValueChainHeatmap } from "./AiValueChainHeatmap";
import { RobotaxiVsHousingBreakdown } from "./RobotaxiVsHousingBreakdown";
import { PhysicalSupplyChainSimulator } from "./PhysicalSupplyChainSimulator";
import { RoboticsAndSelfDrivingSuite } from "./RoboticsAndSelfDrivingSuite";
import { ResponsiveSubTabNav, SubTabItem } from "../../components/ResponsiveSubTabNav";

interface ToolItem {
  name: string;
  category:
    | "Coding & Dev"
    | "Research & LLMs"
    | "Image & Design"
    | "Video & Audio"
    | "Automation & Agents";
  description: string;
  bestFor: string;
  url: string;
  badge?: string;
  isFree?: boolean;
}

interface AiRevolutionHubProps {
  initialTab?: "robotics_autonomous" | "supply_chain_simulator" | "value_chain" | "intent_engine" | "prompting" | "tools" | "build_apps" | "prompt_generator" | "impact" | "robotaxi_vs_housing";
}

export const AiRevolutionHub: React.FC<AiRevolutionHubProps> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useSubTabUrl(
    "/research/ai-revolution",
    ["robotics_autonomous", "supply_chain_simulator", "value_chain", "intent_engine", "prompting", "tools", "build_apps", "prompt_generator", "impact", "robotaxi_vs_housing"] as const,
    initialTab || "robotics_autonomous"
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Agentic Intent Settlement Engine State
  const [intentInput, setIntentInput] = useState("Analyze BTC whale on-chain flows and calculate portfolio exposure risk");
  const [maxBudget, setMaxBudget] = useState("0.010");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<"idle" | "matching" | "executing" | "settled">("idle");
  const [matchedTool, setMatchedTool] = useState<any>(null);
  const [latencyVal, setLatencyVal] = useState(0);
  const [proofHash, setProofHash] = useState("");
  const [feeVal, setFeeVal] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);

  const TOOLS = [
    {
      id: "tool_crypto_onchain",
      name: "StockBloc On-Chain Intelligence",
      keywords: ["crypto", "btc", "eth", "onchain", "whale", "liquidity"],
      base_fee: 0.0015,
      execute: () => ({ signal: "BULLISH_DIVERGENCE", metric: "Whale Inflow Ratio", value: 0.84 })
    },
    {
      id: "tool_equity_valuation",
      name: "StockBloc Institutional Stock Screener",
      keywords: ["stock", "equity", "valuation", "pe_ratio", "earnings", "sec", "portfolio"],
      base_fee: 0.0020,
      execute: () => ({ target: "AI Infra Sector", alpha_score: 91.4, top_pick: "NVDA / TSM" })
    },
    {
      id: "tool_trade_execution",
      name: "StockBloc Automated Settlement Router",
      keywords: ["trade", "buy", "sell", "swap", "rebalance"],
      base_fee: 0.0035,
      execute: () => ({ order_id: "ORD_9918X", status: "SETTLED", latency_ms: 38 })
    }
  ];

  const runIntentSettlement = async () => {
    const trimmedIntent = intentInput.trim();
    if (!trimmedIntent) {
      setErrorMessage("Please enter an intent payload.");
      return;
    }
    setErrorMessage("");
    setIsExecuting(true);
    setExecutionStep("matching");
    
    const startTime = performance.now();

    // Simulate Vector Routing Delay
    await new Promise((resolve) => setTimeout(resolve, 350));

    setExecutionStep("executing");

    const lowerIntent = trimmedIntent.toLowerCase();
    const matched = TOOLS.find((t) => t.keywords.some((kw) => lowerIntent.includes(kw))) || TOOLS[0];

    const parsedBudget = parseFloat(maxBudget) || 0;
    if (matched.base_fee > parsedBudget) {
      setErrorMessage(`Insufficient budget! Tool requires $${matched.base_fee.toFixed(4)}, but max is set to $${parsedBudget.toFixed(4)} USD.`);
      setIsExecuting(false);
      setExecutionStep("idle");
      return;
    }

    // Simulate Sandbox Execution
    await new Promise((resolve) => setTimeout(resolve, 250));

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    const executionResult = matched.execute();
    
    // Generate random proof hash
    const randomHex = Array.from({ length: 12 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
    ).join("");
    const proof = `0x${randomHex}`;

    setMatchedTool(matched);
    setLatencyVal(latency);
    setProofHash(proof);
    setFeeVal(`$${(matched.base_fee + 0.0005).toFixed(4)}`);
    setJsonOutput(JSON.stringify(executionResult, null, 2));
    
    setExecutionStep("settled");
    setIsExecuting(false);
  };

  // Interactive Generator State
  const [genTask, setGenTask] = useState<
    "coding" | "research" | "writing" | "agent" | "marketing"
  >("coding");
  const [genModel, setGenModel] = useState<
    "gemini" | "claude" | "gpt4" | "cursor"
  >("gemini");
  const [genComplexity, setGenComplexity] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [customGoal, setCustomGoal] = useState<string>("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const aiToolsDirectory: ToolItem[] = [
    {
      name: "Google Studio",
      category: "Coding & Dev",
      description:
        "Prototype and build directly with Gemini 1.5 Pro, 2.0 Flash, and Gemini 3.6 Flash models with 1M-2M token context windows for free.",
      bestFor:
        "Building web apps, analyzing entire codebases, video processing, system instruction design.",
      url: "https://aistudio.google.com/",
      badge: "Recommended",
      isFree: true,
    },
    {
      name: "Google Skills",
      category: "Research & LLMs",
      description:
        "Official Google training platform covering essentials, prompt engineering, and professional cloud certifications.",
      bestFor:
        "Learning foundational concepts, earning certificates, and mastering prompt engineering.",
      url: "https://www.skills.google/",
      badge: "Official Training",
      isFree: true,
    },
    {
      name: "Cursor Editor",
      category: "Coding & Dev",
      description:
        "Automated fork of VS Code. Features inline code generation, multi-file edits (Composer), and repository-wide context.",
      bestFor: "10x software development velocity and full-stack coding.",
      url: "https://www.cursor.com/",
      badge: "Developer Favorite",
    },
    {
      name: "Claude.ai (Claude 3.5 Sonnet)",
      category: "Research & LLMs",
      description:
        "Industry benchmark LLM for nuanced writing, complex reasoning, logic puzzles, and concise code output.",
      bestFor:
        "Advanced coding, long-form writing, document analysis, and Artifacts preview.",
      url: "https://claude.ai/",
      badge: "Top LLM",
    },
    {
      name: "NotebookLM by Google",
      category: "Research & LLMs",
      description:
        "Grounded research assistant. Upload PDFs, YouTube links, and docs to generate instant summaries, grounded QA, and Deep Dive Audio Podcasts.",
      bestFor:
        "Synthesizing dense books, financial reports, legal contracts, and audio overview creation.",
      url: "https://notebooklm.google.com/",
      badge: "Game Changer",
      isFree: true,
    },
    {
      name: "Perplexity ",
      category: "Research & LLMs",
      description:
        " conversational search engine that cites real time web sources, academic papers, and live financial data.",
      bestFor:
        "Deep web research, news fact-checking, and market intelligence.",
      url: "https://www.perplexity.ai/",
      badge: "Search ",
    },
    {
      name: "v0.dev by Vercel",
      category: "Coding & Dev",
      description:
        "Generative UI system powered by . Type text prompts to create production-ready React + Tailwind CSS + Shadcn components.",
      bestFor: "Instant web UI wireframing and frontend component generation.",
      url: "https://v0.dev/",
    },
    {
      name: "ChatGPT (OpenAI o1 & GPT-4o)",
      category: "Research & LLMs",
      description:
        "Flagship multimodal conversational with deep reasoning (o1/o3-mini), web browsing, image generation, and custom GPTs.",
      bestFor:
        "General problem solving, math logic, data analysis, and voice mode.",
      url: "https://chatgpt.com/",
    },
    {
      name: "Midjourney v6",
      category: "Image & Design",
      description:
        "State of the art image generator producing photorealistic artwork, brand logos, UI mockups, and architectural concepts.",
      bestFor: "Photorealistic imagery, concept art, visual design assets.",
      url: "https://www.midjourney.com/",
    },
    {
      name: "Flux.1 by Black Forest Labs",
      category: "Image & Design",
      description:
        "Open-source state of the art image generation model with exceptional typography rendering and hands/anatomy precision.",
      bestFor:
        "Open-source high quality graphics, poster designs, custom fine-tuning.",
      url: "https://blackforestlabs.ai/",
      isFree: true,
    },
    {
      name: "ElevenLabs",
      category: "Video & Audio",
      description:
        "Ultra-realistic voice synthesis, voice cloning, emotion control, and real time audio translation in 30+ languages.",
      bestFor:
        "Podcasts, video voiceovers, audiobooks, and conversational agents.",
      url: "https://elevenlabs.io/",
    },
    {
      name: "Runway Gen-3 Alpha",
      category: "Video & Audio",
      description:
        "Text-to-video and image-to-video generator producing cinematic motion clips with camera angle controls.",
      bestFor:
        "Cinematic video clips, B-roll generation, social media animations.",
      url: "https://runwayml.com/",
    },
    {
      name: "Suno & Udio",
      category: "Video & Audio",
      description:
        "Generative music tools that create full-length studio quality songs with custom lyrics, vocals, and genre styles in seconds.",
      bestFor: "Background soundtracks, viral songs, custom jingles.",
      url: "https://suno.com/",
    },
    {
      name: "Zapier & Make.com",
      category: "Automation & Agents",
      description:
        "No-code automation platforms connecting models to 5,000+ apps (Gmail, Slack, Google Sheets, CRM, Stripe).",
      bestFor:
        "Automating business operations, customer support, lead capture.",
      url: "https://zapier.com/ai",
    },
    {
      name: "Ollama",
      category: "Coding & Dev",
      description:
        "Run open-source LLMs locally on your Mac, Windows, or Linux machine (Llama 3, DeepSeek-R1, Qwen 2.5, Mistral) with 100% privacy.",
      bestFor:
        "Offline local , private document analysis, cost-free local dev.",
      url: "https://ollama.com/",
      badge: "100% Private",
      isFree: true,
    },
  ];

  // Helper for generated prompts
  const getGeneratedPrompt = () => {
    const goalText =
      customGoal.trim() ||
      (genTask === "coding"
        ? "Build a full-stack React application with real time state and responsive Tailwind CSS"
        : genTask === "research"
          ? "Perform a deep competitive analysis and market synthesis on emerging memory chips"
          : genTask === "writing"
            ? "Draft a high-impact executive brief and LinkedIn industry post on AI productivity tools"
            : genTask === "agent"
              ? "Build an autonomous web research agent that gathers market data and exports JSON"
              : "Design a launch campaign for a new B2B SaaS product");

    if (genModel === "gemini") {
      return `[SYSTEM INSTRUCTION GEMINI 3.6 FLASH / 1.5 PRO]
You are an expert Architect and Principal Consultant. Your task is to execute: "${goalText}".

[CONTEXT & CONSTRAINTS]:
- Depth Level: ${genComplexity.toUpperCase()}
- Format: Clean markdown with structured headers, bullet points, and runnable code blocks where applicable.
- Approach: Step by step chain of thought. First analyze the requirements, then outline the strategy, then provide the complete solution without placeholders.

[EXECUTION STEPS]:
1. Executive Summary & Core Objective
2. Step by Step Architecture / Outline
3. Complete Implementation / Final Output
4. Key Recommendations & Next Steps`;
    } else if (genModel === "cursor") {
      return `// CURSOR COMPOSER PROMPT (.cursorrules)
@Workspace
Task: ${goalText}

Rules & Best Practices:
1. TypeScript strict type safety declare all interfaces in /src/types.ts.
2. Tailwind CSS only for styling follow sleek dark obsidian or clean high-contrast layout.
3. Modular React components in /src/components/.
4. Handle loading states, empty states, and errors gracefully.
5. Provide complete production-ready code with no 'TODO' or truncated comments.`;
    } else if (genModel === "claude") {
      return `You are Claude 3.5 Sonnet, an elite Strategist and Senior Developer.

Objective: ${goalText}

Requirements:
- Target Expertise Level: ${genComplexity}
- Provide comprehensive, highly logical, and actionable code/text.
- If writing code, ensure clean architecture, error handling, and modern ES6+ practices.
- Avoid flowery buzzwords; focus on precise, high density facts and structured output.`;
    } else {
      return `System Role: Principal Specialist & Product Strategist.

Primary Task: ${goalText}

Instructions:
1. Provide a step by step breakdown tailored for ${genComplexity} level execution.
2. Output in structured Markdown tables, bulleted lists, and formatted code snippets.
3. Include potential edge cases, risks, and optimization tips.`;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4 text-white font-sans">
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950 via-neutral-900 to-purple-950 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
            Revolution Masterclass & Directory
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            Gemini 3.6 • Claude 3.5 • Cursor
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
          Master Tools & Join the Revolution
        </h2>
        <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl mt-1">
          Learn how to leverage generative models, write high converting power
          prompts, use top tools for coding & research, and build autonomous
          agents with zero limits.
        </p>

        {/* Sub-Tabs Selector */}
        <div className="pt-3">
          <ResponsiveSubTabNav
            title="AI Revolution Hub Modules"
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            tabs={[
              {
                id: "robotics_autonomous",
                label: "Robotics & Autonomous Mobility",
                icon: <Bot className="w-3.5 h-3.5" />,
                badge: "Physical AI",
                colorScheme: "emerald",
                description: "Robotaxi fleet economics, humanoid robotics labor arbitrage & BOM sensitivity",
              },
              {
                id: "supply_chain_simulator",
                label: "Supply Chain Cascade Simulator",
                icon: <Zap className="w-3.5 h-3.5 text-cyan-300" />,
                badge: "Bottlenecks",
                colorScheme: "cyan",
                description: "Physical constraints, HV transformer lead times & data center CapEx shocks",
              },
              {
                id: "robotaxi_vs_housing",
                label: "Robotaxi vs. Housing ($1M/yr)",
                icon: <Car className="w-3.5 h-3.5 text-amber-300" />,
                badge: "Arbitrage",
                colorScheme: "amber",
                description: "Mathematical asset comparison: Autonomous fleet vs single-family rentals",
              },
              {
                id: "value_chain",
                label: "MS AI Value Chain Heatmap",
                icon: <BarChart3 className="w-3 h-3 text-amber-300" />,
                badge: "Morgan Stanley",
                colorScheme: "amber",
                description: "Full-stack capital deployment breakdown across compute, power & software",
              },
              {
                id: "intent_engine",
                label: "Agentic Intent Engine",
                icon: <Zap className="w-3.5 h-3.5 text-amber-300" />,
                badge: "Multi-Agent",
                colorScheme: "cyan",
                description: "Autonomous trade settlement, liquidity routing & agent dispatch network",
              },
              {
                id: "prompting",
                label: "Prompting Secrets",
                icon: <BookOpen className="w-3.5 h-3.5" />,
                colorScheme: "cyan",
                description: "Battle-tested prompt engineering patterns for high-reasoning LLMs",
              },
              {
                id: "tools",
                label: "Top Tools Directory",
                icon: <Wand2 className="w-3.5 h-3.5 text-purple-300" />,
                colorScheme: "cyan",
                description: "Curated directory of frontier developer, LLM, and media tools",
              },
              {
                id: "build_apps",
                label: "Build Apps & Agents",
                icon: <Code2 className="w-3.5 h-3.5 text-emerald-300" />,
                colorScheme: "cyan",
                description: "Full-stack code templates and agentic workflow blueprints",
              },
              {
                id: "prompt_generator",
                label: "Interactive Prompt Builder",
                icon: <Sliders className="w-3.5 h-3.5 text-amber-300" />,
                colorScheme: "cyan",
                description: "Dynamic variable generator for system prompts and evaluation chains",
              },
              {
                id: "impact",
                label: "Humanity & Impact",
                icon: <Globe className="w-3.5 h-3.5 text-cyan-300" />,
                colorScheme: "amber",
                description: "Macro labor shifts, energy transition & societal safety implications",
              },
            ]}
          />
        </div>
      </div>

      {/* TAB: ROBOTICS & AUTONOMOUS MOBILITY TERMINAL */}
      {activeTab === "robotics_autonomous" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <RoboticsAndSelfDrivingSuite />
        </div>
      )}

      {/* TAB: PHYSICAL SUPPLY CHAIN CASCADE SIMULATOR */}
      {activeTab === "supply_chain_simulator" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PhysicalSupplyChainSimulator />
        </div>
      )}

      {/* TAB: ROBOTAXI VS HOUSING BREAKDOWN */}
      {activeTab === "robotaxi_vs_housing" && (
        <RobotaxiVsHousingBreakdown />
      )}

      {/* TAB 0: MORGAN STANLEY AI VALUE CHAIN HEATMAP */}
      {activeTab === "value_chain" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <AiValueChainHeatmap />
        </div>
      )}

      {/* TAB 1: AGENTIC INTENT SETTLEMENT ENGINE */}
      {activeTab === "intent_engine" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-cyan-500/30 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Engine Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black uppercase text-white tracking-tight">
                    Agentic Intent Settlement Engine
                  </h3>
                  <span className="text-[10px] font-mono font-black text-amber-400 border border-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse whitespace-nowrap">
                    AGENTIC ENGINE
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  Resolve and cryptographically settle complex multi-step prompt payloads on-chain.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono font-bold text-neutral-300">
                  SYSTEM: <span className="text-emerald-400 font-black">ONLINE</span>
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-black uppercase text-cyan-300 tracking-wider">
                  Agent Intent Payload
                </label>
                <textarea
                  value={intentInput}
                  onChange={(e) => setIntentInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[#05080e] border border-cyan-500/20 text-white rounded-xl p-3.5 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-neutral-600 leading-relaxed"
                  placeholder="Enter your prompt or on-chain settlement task..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-mono font-black uppercase text-cyan-300 tracking-wider">
                    Max Budget ($USD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full bg-[#05080e] border border-cyan-500/20 text-white rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
                
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    runIntentSettlement();
                  }}
                  disabled={isExecuting}
                  className="w-full h-[44px] bg-amber-400 hover:bg-amber-300 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  {isExecuting ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin" />
                      <span>{executionStep === "matching" ? "Matching Intent..." : "Settling Intent..."}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-black shrink-0" />
                      <span>Execute & Settle Intent</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 animate-in fade-in duration-150">
                <span className="font-bold text-rose-400 uppercase shrink-0 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">ERROR</span>
                <span className="flex-1 mt-0.5">{errorMessage}</span>
                <button 
                  onClick={() => setErrorMessage("")}
                  className="text-rose-400 hover:text-white font-bold ml-1 cursor-pointer font-mono"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Output Terminal Console */}
            {executionStep !== "idle" && (
              <div className="rounded-xl bg-[#03060a] border border-cyan-500/30 p-5 space-y-4 font-mono text-xs animate-in slide-in-from-bottom-2 duration-300 shadow-inner">
                {/* Console Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-black text-cyan-300 tracking-wider">SETTLEMENT VERIFIED</span>
                  </div>
                  {proofHash && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-neutral-400 select-all">PROOF: {proofHash}</span>
                      <button
                        onClick={() => {
                          triggerHaptic("success");
                          navigator.clipboard.writeText(proofHash);
                          setCopiedProof(true);
                          setTimeout(() => setCopiedProof(false), 2000);
                        }}
                        className="p-1 hover:bg-cyan-950/40 rounded border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 cursor-pointer text-[10px]"
                        title="Copy cryptographic proof hash"
                      >
                        {copiedProof ? "Copied!" : "copy proof"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-900/40 p-3 rounded-lg border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Matched Tool</span>
                    <strong className="text-white font-bold text-xs truncate block">{matchedTool ? matchedTool.name : "..."}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Latency</span>
                    <strong className="text-emerald-400 font-bold text-xs block">{latencyVal ? `${latencyVal} ms` : "..."}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Protocol Fee</span>
                    <strong className="text-amber-400 font-bold text-xs block">{feeVal || "..."}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 uppercase block">Status</span>
                    <strong className="text-emerald-400 font-black text-xs uppercase tracking-wider block">SETTLED</strong>
                  </div>
                </div>

                {/* Preformatted JSON Data */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase px-1">
                    <span>Sandboxed Output Logs</span>
                    {jsonOutput && (
                      <button
                        onClick={() => {
                          triggerHaptic("success");
                          navigator.clipboard.writeText(jsonOutput);
                          setCopiedPayload(true);
                          setTimeout(() => setCopiedPayload(false), 2000);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1 lowercase"
                      >
                        {copiedPayload ? "copied!" : "copy payload"}
                      </button>
                    )}
                  </div>
                  <pre className="p-3.5 bg-[#070b13] border border-cyan-500/10 rounded-lg text-indigo-200 overflow-x-auto text-[11px] leading-relaxed max-h-60 scrollbar-thin">
                    {jsonOutput || "// Waiting for execution output..."}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Quick Helper Tips or Specifications */}
            <div className="pt-4 border-t border-cyan-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>3 Core Settlement Nodes Active</span>
              </span>
              <span className="text-neutral-500">
                Supports: Crypto On-Chain, Equity Screener, Trade Settlement
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PROMPTING SECRETS & FRAMEWORKS */}
      {activeTab === "prompting" && (
        <div className="space-y-6">
          {/* THE MASTER PROMPTING FRAMEWORK */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2 animate-periodic-text-glitch">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                The C.A.R.E.S. Master Prompting Framework
              </h3>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                Used by OpenAI & Google Engineers
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Stop typing 5-word generic questions like "Write a code function".
              models perform 10x better when given structural boundaries,
              precise role personas, explicit output constraints, and
              step by step reasoning steps.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-1">
                <span className="text-cyan-300 font-mono font-black text-sm block">
                  C Context
                </span>
                <p className="text-neutral-400 text-[11px]">
                  Give background story, domain constraints, who the user is,
                  and why this task matters.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 space-y-1">
                <span className="text-purple-300 font-mono font-black text-sm block">
                  A Action / Role
                </span>
                <p className="text-neutral-400 text-[11px]">
                  Define exact persona: "Act as a Principal Software Architect
                  with 15+ years experience in React".
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-1">
                <span className="text-emerald-300 font-mono font-black text-sm block">
                  R Requirements
                </span>
                <p className="text-neutral-400 text-[11px]">
                  Explicit rules: "Use TypeScript, no external libraries,
                  include error boundaries and handling."
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-1">
                <span className="text-amber-300 font-mono font-black text-sm block">
                  E Examples
                </span>
                <p className="text-neutral-400 text-[11px]">
                  Few Shot Prompting: Give 1 or 2 ideal input/output pairs to
                  guide format & style.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-1">
                <span className="text-indigo-300 font-mono font-black text-sm block">
                  S Structure
                </span>
                <p className="text-neutral-400 text-[11px]">
                  Define output shape: JSON schema, Markdown table, or complete
                  un truncated code block.
                </p>
              </div>
            </div>
          </div>

          {/* COPYABLE POWER PROMPTS LIBRARY */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              Production-Ready Power Prompts (1-Click Copy)
            </h3>

            <div className="space-y-4">
              {/* PROMPT 1: CODE REVIEW & REFACTOR */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      Software Engineering
                    </span>
                    <h4 className="text-sm font-black text-white mt-1 animate-periodic-text-glitch">
                      Full Codebase Refactor & Security Audit Prompt
                    </h4>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `Act as a Lead Systems Architect & Security Auditor.
Review the following code snippet for:
1. Memory leaks, infinite re-renders, or async state bugs.
2. Security vulnerabilities (XSS, API key leakage, unsanitized inputs).
3. Performance bottlenecks and redundant loops.

Provide:
A) Executive Summary of critical defects.
B) Refactored, complete, production-ready TypeScript code using best practices.
C) Explanation of optimizations made.`,
                        "p1",
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-cyan-500/30 active:scale-95 transition-all"
                  >
                    {copiedPromptId === "p1" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>
                      {copiedPromptId === "p1" ? "Copied!" : "Copy Prompt"}
                    </span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-neutral-300 leading-relaxed whitespace-pre-line">
                  {`Act as a Lead Systems Architect & Security Auditor.
Review the following code snippet for:
1. Memory leaks, infinite re-renders, or async state bugs.
2. Security vulnerabilities (XSS, API key leakage, unsanitized inputs).
3. Performance bottlenecks and redundant loops.

Provide:
A) Executive Summary of critical defects.
B) Refactored, complete, production-ready TypeScript code using best practices.
C) Explanation of optimizations made.`}
                </div>
              </div>

              {/* PROMPT 2: FINANCIAL & DEEP MARKET RESEARCH */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                      Market Research & Equity Analysis
                    </span>
                    <h4 className="text-sm font-black text-white mt-1 animate-periodic-text-glitch">
                      Hedge Fund Thesis & Earnings Analysis Prompt
                    </h4>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `Act as a Senior Investment Analyst at an Equity Hedge Fund.
Perform a thorough fundamental analysis on [Company / Ticker].

Break down:
1. Revenue & EPS Growth trajectory over the past 4 quarters.
2. Competitive Moat & Regulatory Capture (high barriers to entry).
3. Bull Case vs. Bear Case scenarios with 12-month target multiples.
4. Key Risks (interest rates, supply chain, customer concentration).

Output in a concise Markdown memo with bullet points and key financial ratios.`,
                        "p2",
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30 active:scale-95 transition-all"
                  >
                    {copiedPromptId === "p2" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>
                      {copiedPromptId === "p2" ? "Copied!" : "Copy Prompt"}
                    </span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-neutral-300 leading-relaxed whitespace-pre-line">
                  {`Act as a Senior Investment Analyst at an Equity Hedge Fund.
Perform a thorough fundamental analysis on [Company / Ticker].

Break down:
1. Revenue & EPS Growth trajectory over the past 4 quarters.
2. Competitive Moat & Regulatory Capture (high barriers to entry).
3. Bull Case vs. Bear Case scenarios with 12-month target multiples.
4. Key Risks (interest rates, supply chain, customer concentration).

Output in a concise Markdown memo with bullet points and key financial ratios.`}
                </div>
              </div>

              {/* PROMPT 3: VIRAL CONTENT & MARKETING */}
              <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
                      Marketing & Content Strategy
                    </span>
                    <h4 className="text-sm font-black text-white mt-1 animate-periodic-text-glitch">
                      Viral Thought Leadership Post & Thread Framework
                    </h4>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        `Act as a Top 1% Growth Marketer and Copywriter.
I want to write a high converting LinkedIn post and X thread about [Topic/Product].

Structure:
1. Hook (First 2 lines): High curiosity or counter-intuitive claim.
2. The Problem: Common misconception or pain point.
3. The Solution: Step by step breakdown (3-5 actionable steps).
4. Takeaway / Summary: Bulleted recap.
5. Call to Action (CTA): Question to trigger comments and engagement.

Tone: Authoritative, punchy, conversational, no fluff or generic SaaS buzzwords.`,
                        "p3",
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-500/30 active:scale-95 transition-all"
                  >
                    {copiedPromptId === "p3" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>
                      {copiedPromptId === "p3" ? "Copied!" : "Copy Prompt"}
                    </span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-neutral-300 leading-relaxed whitespace-pre-line">
                  {`Act as a Top 1% Growth Marketer and Copywriter.
I want to write a high converting LinkedIn post and X thread about [Topic/Product].

Structure:
1. Hook (First 2 lines): High curiosity or counter-intuitive claim.
2. The Problem: Common misconception or pain point.
3. The Solution: Step by step breakdown (3-5 actionable steps).
4. Takeaway / Summary: Bulleted recap.
5. Call to Action (CTA): Question to trigger comments and engagement.

Tone: Authoritative, punchy, conversational, no fluff or generic SaaS buzzwords.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP TOOLS DIRECTORY */}
      {activeTab === "tools" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-cyan-400" />
                Curated Directory of World Class Tools
              </h3>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30">
                14 Essential Tools
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Direct official links to the best models, code editors, research
              assistants, audio generators, and automation engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiToolsDirectory.map((tool, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-neutral-900/90 border border-white/15 space-y-3 flex flex-col justify-between hover:border-cyan-500/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white animate-periodic-text-glitch">
                        {tool.name}
                      </h4>
                      {tool.badge && (
                        <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                          {tool.badge}
                        </span>
                      )}
                      {tool.isFree && (
                        <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          FREE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                      {tool.category}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] text-neutral-300">
                    <strong className="text-cyan-300 font-bold">
                      Best For:{" "}
                    </strong>
                    <span>{tool.bestFor}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Official Platform
                  </span>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Launch {tool.name.split(" ")[0]}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BUILD APPS & AGENTS */}
      {activeTab === "build_apps" && (
        <div className="space-y-6">
          {/* BUILD ROADMAP CARD */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                Step by Step Blueprint: Building Your First App / Agent
              </h3>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30">
                Developer Roadmap
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* STEP 1 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-cyan-300 font-bold text-sm">
                    Step 1: Obtain API Keys & Environment Setup
                  </strong>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Google Studio API Key ($0 Free)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Sign up for Google Studio, create a new project, and copy your{" "}
                  <code className="text-cyan-300 bg-white/10 px-1 py-0.5 rounded">
                    GEMINI_API_KEY
                  </code>
                  . Declare it in your server-side environment variables (
                  <code className="text-cyan-300">.env.example</code>).
                </p>
              </div>

              {/* STEP 2 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-emerald-300 font-bold text-sm">
                    Step 2: Install Official SDK (@google/genai)
                  </strong>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    npm i @google/genai
                  </span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  Install the official Google Gen SDK in Node.js / Express
                  backend. Use lazy initialization to guard against
                  uninitialized keys on server boot.
                </p>
                <div className="p-3 rounded-xl bg-black/80 font-mono text-[11px] text-cyan-200">
                  {`import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
 model: 'gemini-3.6-flash',
 contents: 'Analyze this market data',
});`}
                </div>
              </div>

              {/* STEP 3 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <strong className="text-purple-300 font-bold text-sm block">
                  Step 3: Enable Agent Function Calling & Tools
                </strong>
                <p className="text-neutral-300 leading-relaxed">
                  Equip your model with tools (Web Search Grounding, Code
                  Execution, Custom API calls). The agent can automatically
                  invoke tools, inspect responses, and loop back to solve
                  complex multi-step tasks.
                </p>
              </div>

              {/* STEP 4 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <strong className="text-amber-300 font-bold text-sm block">
                  Step 4: Deploy & Scale
                </strong>
                <p className="text-neutral-300 leading-relaxed">
                  Deploy full-stack code to Cloud Run or Vercel, connect live
                  endpoints, and share your web application with unlimited users
                  worldwide!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE PROMPT BUILDER */}
      {activeTab === "prompt_generator" && (
        <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                Interactive Power Prompt Generator
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configure your target goal, model archetype, and complexity to
                generate custom engineered system prompts instantly.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              Prompt Engineer Studio
            </span>
          </div>

          {/* Config Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Task Type */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/40 border border-white/10">
              <label className="text-neutral-300 font-bold block">
                1. Select Domain Task:
              </label>
              <select
                value={genTask}
                onChange={(e) => setGenTask(e.target.value as any)}
                className="w-full bg-neutral-900 text-cyan-300 font-bold p-2 rounded-xl border border-white/20 focus:outline-none"
              >
                <option value="coding">Full-Stack Coding & Architecture</option>
                <option value="research">
                  Market Research & Equity Synthesis
                </option>
                <option value="writing">High Converting Copywriting</option>
                <option value="agent">Autonomous Agent Logic</option>
                <option value="marketing">
                  Growth Marketing & Product Launch
                </option>
              </select>
            </div>

            {/* Model Target */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/40 border border-white/10">
              <label className="text-neutral-300 font-bold block">
                2. Target Model / Tool:
              </label>
              <select
                value={genModel}
                onChange={(e) => setGenModel(e.target.value as any)}
                className="w-full bg-neutral-900 text-purple-300 font-bold p-2 rounded-xl border border-white/20 focus:outline-none"
              >
                <option value="gemini">Google Gemini 3.6 Flash / Pro</option>
                <option value="cursor">
                  Cursor Code Editor (.cursorrules)
                </option>
                <option value="claude">Claude 3.5 Sonnet</option>
                <option value="gpt4">ChatGPT (GPT-4o / o1)</option>
              </select>
            </div>

            {/* Complexity */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-black/40 border border-white/10">
              <label className="text-neutral-300 font-bold block">
                3. Depth Level:
              </label>
              <select
                value={genComplexity}
                onChange={(e) => setGenComplexity(e.target.value as any)}
                className="w-full bg-neutral-900 text-emerald-300 font-bold p-2 rounded-xl border border-white/20 focus:outline-none"
              >
                <option value="beginner">Beginner (Step by step clear)</option>
                <option value="intermediate">
                  Intermediate (Standard professional)
                </option>
                <option value="advanced">
                  Advanced (Principal level & edge cases)
                </option>
              </select>
            </div>
          </div>

          {/* Custom Specific Objective Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-300 font-bold block">
              Optional Specific Custom Goal or Requirement:
            </label>
            <input
              type="text"
              placeholder="e.g. Build an agent that monitors SEC 13F filings and posts X (@thestockbloc) alerts"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Generated Prompt Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                Generated Engineered Prompt Output:
              </span>
              <button
                onClick={() => handleCopy(getGeneratedPrompt(), "gen_prompt")}
                className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {copiedPromptId === "gen_prompt" ? (
                  <Check className="w-3.5 h-3.5 text-black" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-black" />
                )}
                <span>
                  {copiedPromptId === "gen_prompt"
                    ? "Copied Prompt!"
                    : "Copy Prompt"}
                </span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 font-mono text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap select-all">
              {getGeneratedPrompt()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HUMANITY & IMPACT */}
      {activeTab === "impact" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/15 space-y-6">
            {/* Impact Section 1: Data Centers & Water */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-extrabold text-white">
                  Data Centers: Empowering Local Economies & Water Neutrality
                </h3>
              </div>
              <div className="p-5 rounded-2xl bg-black/60 border border-cyan-500/20 space-y-4">
                <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                  A common misconception is that data centers "drain" local
                  water supplies. In reality, modern hyperscale data centers
                  operate in closed-loop cooling systems. The water is
                  recirculated continuously without being consumed or evaporated
                  into the atmosphere. Furthermore, data centers are actively
                  partnering with local municipalities to recycle treated
                  wastewater (greywater) for cooling, keeping freshwater
                  available for human consumption.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-emerald-400 font-bold block text-sm">
                      Closed-Loop Cooling
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      Recirculates 99% of internal water, requiring near zero
                      daily municipal withdrawal.
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-emerald-400 font-bold block text-sm">
                      Greywater Recycling
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      Taking non-potable treated water from local facilities to
                      cool server racks safely.
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-emerald-400 font-bold block text-sm">
                      Economic Windfalls
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      Tax revenues from data centers fund local schools, roads,
                      and grid infrastructure.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Section 2: Robotics & Self-Driving */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-extrabold text-white">
                  Robotics & Autonomous Safety
                </h3>
              </div>
              <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/20 space-y-4">
                <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                  Autonomous vehicles (like Tesla FSD and Waymo) don't text,
                  don't get tired, and don't drive intoxicated. By eliminating
                  human error, which causes 94% of traffic accidents, self
                  driving cars can save over a million lives globally each year.
                  Similarly, humanoid robots (like Optimus) are designed to take
                  over dangerous, repetitive, or hazardous jobs, removing humans
                  from high risk environments such as deep sea welding, chemical
                  plants, and heavy manufacturing.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>
                      <strong>Accident Reduction:</strong> reacts in
                      milliseconds with 360-degree sensor vision.
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>
                      <strong>Hazard Elimination:</strong> Robots handle toxic
                      environments, preventing human injury.
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>
                      <strong>Elder Care Support:</strong> Advanced robotics
                      will provide 24/7 care for aging populations.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Impact Section 3: Post-Labor Economics */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-extrabold text-white">
                  Post-Labor Economics: Driving Down Costs
                </h3>
              </div>
              <div className="p-5 rounded-2xl bg-black/60 border border-purple-500/20 space-y-4">
                <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                  When human labor is removed from the supply chain, the cost of
                  goods and services collapses. If and robotics can farm,
                  transport, build, and manufacture without salaries, healthcare
                  costs, or fatigue, the baseline cost of living drops toward
                  the cost of raw materials and energy. This transition creates
                  an era of radical abundance, where affordable housing, fresh
                  food, and advanced medical care become accessible to the
                  entire global population.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-purple-400 font-bold block text-sm">
                      Deflationary Goods
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      Automation drives the cost of physical goods and basic
                      necessities near zero.
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-purple-400 font-bold block text-sm">
                      Democratized Healthcare
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      {" "}
                      doctors and robotic surgeons offer world class, error-free
                      medicine globally for pennies.
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-purple-400 font-bold block text-sm">
                      Automated Construction
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      Swarm robotics printing 3D houses reduces housing
                      shortages and makes shelter practically free.
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-purple-400 font-bold block text-sm">
                      Creative Freedom
                    </span>
                    <span className="text-xs text-neutral-400 mt-1 block">
                      As mundane work is automated, human capital is freed to
                      focus purely on science, art, and exploration.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
