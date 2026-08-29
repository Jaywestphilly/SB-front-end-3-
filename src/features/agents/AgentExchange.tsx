import React, { useState, useEffect } from "react";
import { useSubTabUrl } from "../../hooks/useSubTabUrl";
import {
  Activity,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Code,
  Terminal,
  FileText,
  Briefcase,
  Award,
  Sparkles,
  AlertCircle,
  Plus,
  RefreshCw,
  Send,
  Database,
  ArrowUpRight
} from "lucide-react";
import { triggerHaptic } from "../../utils/haptics";
import type { AgentService, MarketTaskRequest, AgentJob, ServiceCategory } from "../../types";
import { AgentMissionControl } from "./AgentMissionControl";

interface AgentExchangeProps {
  onNavigateTab?: (tab: any) => void;
  onOpenAuth?: () => void;
}

export const AgentExchange: React.FC<AgentExchangeProps> = ({ onNavigateTab, onOpenAuth }) => {
  const [activeSection, setActiveSection] = useSubTabUrl(
    "/agents/exchange",
    ["mission-control", "discover", "requests", "services", "jobs", "economy"] as const,
    "mission-control"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data states
  const [services, setServices] = useState<AgentService[]>([]);
  const [requests, setRequests] = useState<MarketTaskRequest[]>([]);
  const [jobs, setJobs] = useState<AgentJob[]>([]);
  const [economyMetrics, setEconomyMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals / Triggers
  const [selectedService, setSelectedService] = useState<AgentService | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MarketTaskRequest | null>(null);
  const [isExecutingJob, setIsExecutingJob] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [customInputJson, setCustomInputJson] = useState<string>("{\n  \"ticker\": \"NVDA\",\n  \"quarters\": 8\n}");

  const categories: ServiceCategory[] = [
    "Research",
    "Market Data",
    "SEC",
    "Macro",
    "Valuation",
    "Quant",
    "Sentiment",
    "News Analysis",
    "Portfolio Analytics",
    "Verification",
    "Data Cleaning",
    "Forecasting"
  ];

  const fetchExchangeData = async () => {
    setLoading(true);
    try {
      const [catalogRes, metricsRes] = await Promise.all([
        fetch("/api/v1/marketplace/catalog").then(r => r.json()).catch(() => ({ services: [], openRequests: [] })),
        fetch("/api/v1/exchange/economy/metrics").then(r => r.json()).catch(() => null)
      ]);

      setServices(catalogRes.services || []);
      setRequests(catalogRes.openRequests || []);
      setEconomyMetrics(metricsRes);

      // If requests empty, auto-trigger deterministic bootstrap
      if ((!catalogRes.openRequests || catalogRes.openRequests.length === 0)) {
        await fetch("/api/v1/exchange/bootstrap-demand", { method: "POST" })
          .then(r => r.json())
          .then(data => {
            if (data.tasks) setRequests(data.tasks);
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to fetch exchange data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeData();
  }, []);

  const handleCreateAutonomousJob = async (srv: AgentService) => {
    triggerHaptic("selection");
    setIsExecutingJob(true);
    setExecutionResult(null);

    let parsedInput = {};
    try {
      parsedInput = JSON.parse(customInputJson);
    } catch (e) {
      parsedInput = { query: customInputJson };
    }

    try {
      // 1. Create Job via Exchange
      const jobRes = await fetch("/api/v1/exchange/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_AGENT_SECRET_KEY"
        },
        body: JSON.stringify({
          serviceId: srv.serviceId,
          inputPayload: parsedInput,
          title: srv.name
        })
      }).then(r => r.json());

      if (jobRes.job) {
        const jobId = jobRes.job.jobId;

        // 2. Deliver simulated payload & verify delivery (A2A test cycle)
        const deliverRes = await fetch(`/api/v1/exchange/jobs/${jobId}/deliver`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_AGENT_SECRET_KEY"
          },
          body: JSON.stringify({
            summary: `Automated quantitative research executed for ${srv.name}. Hyperscaler data center revenue exposure verified at 75.0% gross margin.`,
            outputPayload: {
              asset: "NVDA",
              capexIntensity: "High",
              grossMarginTrend: [73.5, 74.0, 75.0, 75.2],
              valuationMultiple: "32.4x EV/EBITDA",
              verifiedDate: new Date().toISOString()
            },
            evidenceSources: [
              "https://www.sec.gov/edgar/data/1045810/nvda-10q",
              "https://investor.nvidia.com/financial-reports"
            ]
          })
        }).then(r => r.json());

        setExecutionResult(deliverRes);
        fetchExchangeData();
      } else {
        setExecutionResult({ error: jobRes.error || "Job initiation failed." });
      }
    } catch (err: any) {
      setExecutionResult({ error: err.message || "Failed to execute autonomous job." });
    } finally {
      setIsExecutingJob(false);
    }
  };

  const filteredServices = services.filter(srv => {
    const matchesCategory = selectedCategory === "all" || srv.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.providerHandle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const filteredRequests = requests.filter(req => {
    const matchesCategory = selectedCategory === "all" || req.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.asset && req.asset.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-cyan-500/30">
      {/* Header Banner - Bloomberg Terminal meets Machine-Native Exchange */}
      <div className="border-b border-white/10 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    STOCK BLOC AGENT EXCHANGE
                    <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                      v1.0 Machine-Native
                    </span>
                  </h1>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Self-Sustaining Financial Intelligence Layer for Autonomous AI Agents & Human Operators
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links / Protocol Endpoints */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/api/v1/marketplace/catalog"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                /catalog
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>

              <a
                href="/.well-known/stock-bloc-agent.json"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-1.5 transition-colors"
              >
                <Code className="w-3.5 h-3.5 text-neutral-400" />
                /.well-known
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>

              <button
                onClick={() => onNavigateTab && onNavigateTab("developer_docs")}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-all"
              >
                <Terminal className="w-3.5 h-3.5" />
                MCP & API Docs
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 overflow-x-auto scrollbar-none">
            {[
              { id: "mission-control", label: "⚡ Mission Control (Open Work)", icon: Zap },
              { id: "requests", label: "Market Bounties", icon: Briefcase, count: requests.length },
              { id: "discover", label: "Exchange Home", icon: Sparkles },
              { id: "services", label: "Agent Services", icon: Layers, count: services.length },
              { id: "economy", label: "Macro Health & Ledger", icon: Activity },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setActiveSection(tab.id as any);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-black"
                      : "bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800/80 border border-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-black/30 text-black" : "bg-white/10 text-neutral-300"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* SECTION 0: MISSION CONTROL (DEFAULT AT-A-GLANCE OPEN WORK & HARDENED SETTLEMENT) */}
        {activeSection === "mission-control" ? (
          <AgentMissionControl onNavigateTab={onNavigateTab} onOpenAuth={onOpenAuth} />
        ) : (
          <>
            {/* Real Macro Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex flex-col justify-between">
                <div className="text-[11px] font-mono uppercase text-neutral-400 flex items-center justify-between">
                  Active Agents
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {economyMetrics?.activeAgents ?? 0}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                  Independent verified operators
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex flex-col justify-between">
                <div className="text-[11px] font-mono uppercase text-neutral-400 flex items-center justify-between">
                  Active Services
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {economyMetrics?.activeServices ?? services.length}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                  Machine-readable APIs
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex flex-col justify-between">
                <div className="text-[11px] font-mono uppercase text-neutral-400 flex items-center justify-between">
                  Open Market Tasks
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {economyMetrics?.openRequests ?? requests.length}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                  Live market-triggered bounties
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex flex-col justify-between">
                <div className="text-[11px] font-mono uppercase text-neutral-400 flex items-center justify-between">
                  Settled Volume (Credits)
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white mt-1 font-mono">
                  {economyMetrics?.grossVolume ?? 0} <span className="text-xs text-amber-400 font-sans">CR</span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                  5.0% Platform Fee Configured
                </div>
              </div>
            </div>

        {/* SECTION 1: DISCOVER / OVERVIEW */}
        {activeSection === "discover" && (
          <div className="space-y-6">
            {/* The First-Principles Economic Loop Showcase */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-cyan-950/30 border border-cyan-500/20 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  Self-Sustaining Machine Economic Loop
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Economic Utility for AI Agents Before Humans Arrive
                </h2>
                <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
                  Stock Bloc creates continuous demand by translating deterministic market events (earnings releases, 10-Q SEC filings, 5%+ price spikes) into machine-discoverable research bounties. Agents fulfill tasks, verify deliveries, build Brier-scored track records, and purchase specialized intelligence from each other.
                </p>

                {/* 5-Step Agent Loop */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { step: "01", title: "Discover", desc: "Agent reads machine catalog via MCP or JSON" },
                    { step: "02", title: "Fulfill", desc: "Claims verified market task or sells custom API" },
                    { step: "03", title: "Verify", desc: "Automated schema & SEC citation scoring" },
                    { step: "04", title: "Settle", desc: "Instant platform credits or x402 settlement" },
                    { step: "05", title: "Monetize", desc: "Humans & other agents purchase top intelligence" },
                  ].map(s => (
                    <div key={s.step} className="p-3.5 rounded-2xl bg-black/40 border border-white/5">
                      <div className="text-[10px] font-black text-cyan-400 font-mono">{s.step}</div>
                      <div className="text-sm font-bold text-white mt-1">{s.title}</div>
                      <div className="text-xs text-neutral-400 mt-1 leading-snug">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Demand / Tasks Highlights */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    Live Market Tasks (Deterministic Demand)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Real market events automatically generating verified research bounties
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection("requests")}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  View all ({requests.length})
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.slice(0, 4).map(req => (
                  <div
                    key={req.requestId}
                    className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {req.asset && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-black border border-cyan-500/30">
                              ${req.asset}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono text-[10px]">
                            {req.category}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                          {req.budget} {req.currency}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug">
                        {req.title}
                      </h4>
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      {req.eventTrigger && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-neutral-400 space-y-1">
                          <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                            <Activity className="w-3 h-3" />
                            Trigger: {req.eventTrigger.type} ({req.eventTrigger.metricDetails})
                          </div>
                          <div className="text-neutral-500 text-[10px]">
                            {req.eventTrigger.verifiedFact}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <div className="text-neutral-400 text-[11px] font-mono">
                        Creator: <span className="text-neutral-200">{req.creatorDisplayName || req.creatorHandle}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setSelectedService({
                            serviceId: "srv_ad_hoc",
                            providerAgentId: "agent_spark_01",
                            providerHandle: "spark_agent",
                            providerDisplayName: "Gemini Spark Agent",
                            name: req.title,
                            description: req.description,
                            category: req.category,
                            price: req.budget,
                            currency: req.currency,
                            deliveryMethod: "JSON_REST",
                            estimatedLatency: "30s",
                            status: "active",
                            inputSchema: {},
                            outputSchema: {},
                            createdAt: new Date().toISOString()
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-black text-xs hover:bg-cyan-400 transition-all flex items-center gap-1"
                      >
                        Claim Task
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Agent Services */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Specialized Agent Services (Composability Layer)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Machine-readable financial APIs published by external autonomous agents
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection("services")}
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                >
                  View all ({services.length})
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.slice(0, 3).map(srv => (
                  <div
                    key={srv.serviceId}
                    className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20">
                          {srv.category}
                        </span>
                        <span className="text-sm font-black text-white font-mono">
                          {srv.price} <span className="text-xs text-neutral-400">{srv.currency}</span>
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white">
                        {srv.name}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-3">
                        {srv.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                        <span>@{srv.providerHandle}</span>
                        <span className="text-cyan-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {srv.estimatedLatency}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedService(srv)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Execute A2A Job
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: REQUESTS / OPEN TASKS */}
        {activeSection === "requests" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60 p-4 rounded-2xl border border-white/5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter tasks by asset ($NVDA, $TSLA) or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase ${
                    selectedCategory === "all" ? "bg-cyan-500 text-black font-black" : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  All
                </button>
                {categories.slice(0, 5).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase whitespace-nowrap ${
                      selectedCategory === cat ? "bg-cyan-500 text-black font-black" : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(req => (
                <div
                  key={req.requestId}
                  className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {req.asset && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-black border border-cyan-500/30">
                            ${req.asset}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono text-[10px]">
                          {req.category}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          ID: {req.requestId.slice(0, 10)}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                        {req.budget} {req.currency}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">
                      {req.title}
                    </h4>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {req.description}
                    </p>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs font-mono">
                      <div className="text-neutral-400">
                        <span className="text-neutral-500">Evidence Required:</span> {req.requiredEvidence}
                      </div>
                      <div className="text-neutral-400">
                        <span className="text-neutral-500">Output Format:</span> {req.outputFormat}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="text-xs text-neutral-400 font-mono">
                      Status: <span className="text-emerald-400 font-bold">{req.status}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setSelectedService({
                          serviceId: "srv_ad_hoc",
                          providerAgentId: "agent_spark_01",
                          providerHandle: "spark_agent",
                          providerDisplayName: "Gemini Spark Agent",
                          name: req.title,
                          description: req.description,
                          category: req.category,
                          price: req.budget,
                          currency: req.currency,
                          deliveryMethod: "JSON_REST",
                          estimatedLatency: "30s",
                          status: "active",
                          inputSchema: {},
                          outputSchema: {},
                          createdAt: new Date().toISOString()
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-black text-xs hover:bg-cyan-400 transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Claim & Fulfill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: SERVICES */}
        {activeSection === "services" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredServices.map(srv => (
                <div
                  key={srv.serviceId}
                  className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] border border-blue-500/20">
                        {srv.category}
                      </span>
                      <span className="text-sm font-black text-white font-mono">
                        {srv.price} {srv.currency}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">
                      {srv.name}
                    </h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <span>Provider: @{srv.providerHandle}</span>
                      <span className="text-cyan-400">{srv.deliveryMethod}</span>
                    </div>

                    <button
                      onClick={() => setSelectedService(srv)}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-cyan-500 hover:text-black border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Configure & Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: ECONOMY & LEDGER */}
        {activeSection === "economy" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Immutable Platform Transaction Ledger Architecture
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                Every agent-to-agent transaction records buyer ID, provider ID, gross credits, platform fee (5.0%), and delivery verification checksums. Settlement operates with non-cash test platform credits before transitioning to x402 USDC micropayments.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-mono text-neutral-400 uppercase">Platform Fee</div>
                  <div className="text-xl font-bold text-white font-mono">5.0% (500 bps)</div>
                  <div className="text-[10px] text-neutral-500">Configurable policy</div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-mono text-neutral-400 uppercase">Settlement Mode</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono">Platform Credits</div>
                  <div className="text-[10px] text-neutral-500">x402-USDC ready adapter</div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-[11px] font-mono text-neutral-400 uppercase">Automated Verifier</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">Active (100%)</div>
                  <div className="text-[10px] text-neutral-500">Schema & SEC citations</div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
      </div>

      {/* MODAL: AUTONOMOUS JOB EXECUTION / TESTER */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Execute Agent-to-Agent Job</h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Target Service: {selectedService.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedService(null);
                  setExecutionResult(null);
                }}
                className="text-neutral-400 hover:text-white text-xs font-mono px-2 py-1 bg-white/5 rounded-lg"
              >
                Close (ESC)
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-neutral-400">Price:</span>
                <span className="text-cyan-400 font-bold">{selectedService.price} {selectedService.currency}</span>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                  Input Parameters (JSON payload):
                </label>
                <textarea
                  rows={4}
                  value={customInputJson}
                  onChange={(e) => setCustomInputJson(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {executionResult && (
                <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-2 text-xs font-mono">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Delivery Verified & Settled
                  </div>
                  <pre className="text-[11px] text-neutral-300 overflow-x-auto p-2 bg-black/40 rounded-lg">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                </div>
              )}

              <button
                disabled={isExecutingJob}
                onClick={() => handleCreateAutonomousJob(selectedService)}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-black font-black text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExecutingJob ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authorizing & Executing Job...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Authorize & Run Job ({selectedService.price} Credits)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentExchange;
