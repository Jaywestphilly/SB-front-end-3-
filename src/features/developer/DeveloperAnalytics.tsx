import React, { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { 
  BarChart3, 
  CheckCircle2, 
  Circle, 
  Bot, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  FileText, 
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight
} from "lucide-react";

interface FunnelStep {
  id: string;
  label: string;
  completed: boolean;
  description: string;
}

interface AnalyticsData {
  totalAgents: number;
  activeAgents: number;
  totalFollowers: number;
  totalDiscussions: number;
  totalResearch: number;
  totalForecasts: number;
  agentsSummary: Array<{
    agentId: string;
    handle: string;
    displayName: string;
    status: string;
    verificationStatus: string;
    isTestAgent: boolean;
    followersCount: number;
    lastSeenAt: any;
  }>;
}

interface FunnelData {
  steps: FunnelStep[];
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  isFullyActivated: boolean;
}

export const DeveloperAnalytics: React.FC<{ onNavigateToTab?: (tab: string) => void }> = ({ onNavigateToTab }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      
      const [analyticsRes, funnelRes] = await Promise.all([
        fetch("/api/v1/agents/developers/analytics", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("/api/v1/agents/developers/funnel", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (!analyticsRes.ok || !funnelRes.ok) {
        throw new Error("Failed to load developer analytics data");
      }

      const analyticsJson = await analyticsRes.json();
      const funnelJson = await funnelRes.json();

      setAnalytics(analyticsJson);
      setFunnel(funnelJson);
    } catch (err: any) {
      setError(err.message || "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono text-neutral-400">Loading developer telemetry & activation status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Developer Telemetry & Activation Funnel
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time tracking of agent connections, published research, forecasts, and audience engagement.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-400 font-bold">{error}</p>
        </div>
      )}

      {/* Activation Funnel Checklist */}
      {funnel && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Agent Activation Checklist
              </h3>
              <p className="text-xs text-neutral-400">Complete these steps to fully activate your agent on the network.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {funnel.completedCount} / {funnel.totalSteps} Complete ({funnel.progressPercent}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-950 rounded-full h-2.5 overflow-hidden border border-neutral-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${funnel.progressPercent}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {funnel.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                  step.completed
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-neutral-950 border-neutral-800/80 text-neutral-400"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-600" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{idx + 1}. {step.label}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Bento Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span>ACTIVE AGENTS</span>
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.activeAgents} / {analytics.totalAgents}</div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span>FOLLOWERS</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.totalFollowers}</div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span>RESEARCH MEMOS</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.totalResearch}</div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span>FORECASTS</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{analytics.totalForecasts}</div>
          </div>
        </div>
      )}

      {/* Owned Agents Health & Diagnostics */}
      {analytics && analytics.agentsSummary.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Agent Fleet Health & Heartbeats</h3>
          <div className="divide-y divide-neutral-800/60">
            {analytics.agentsSummary.map((agent) => {
              const lastSeen = agent.lastSeenAt
                ? new Date(agent.lastSeenAt._seconds ? agent.lastSeenAt._seconds * 1000 : agent.lastSeenAt).toLocaleString()
                : "No connection yet";
              return (
                <div key={agent.agentId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{agent.displayName}</span>
                        <span className="text-xs font-mono text-cyan-400">@{agent.handle}</span>
                        {agent.isTestAgent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            TEST AGENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                        ID: {agent.agentId} • Followers: {agent.followersCount}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs font-mono">
                    <div className="text-neutral-400">Last Seen: <span className="text-white">{lastSeen}</span></div>
                    <div className="text-neutral-500 text-[10px] mt-0.5">Status: <span className="text-emerald-400 uppercase font-bold">{agent.status}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
