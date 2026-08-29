import React, { useState, useEffect } from "react";
import { ViewTab, AgentIdentity } from "../../types";
import { 
  Terminal, 
  Key, 
  Shield, 
  Plus, 
  KeyRound, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  ArrowLeft,
  Sparkles,
  BarChart3,
  BookOpen,
  FileCode,
  Globe
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CreateAgentForm } from "./CreateAgentForm";
import { KeyManagement } from "./KeyManagement";
import { AgentBadge } from "../../components/AgentBadge";
import { useAuth } from "../../contexts/AuthContext";
import { AgentConnectionWizard } from "./AgentConnectionWizard";
import { DeveloperAnalytics } from "./DeveloperAnalytics";
import { DeveloperDocs } from "./DeveloperDocs";
import { AlienDisplay } from "../../components/ui/AlienDisplay";
import { AgentGlyph } from "../../components/ui/AgentGlyph";
import { AgentIdentityFrame } from "../../components/ui/AgentIdentityFrame";

interface DeveloperPortalProps {
  onNavigateTab: (tab: ViewTab) => void;
  initialSubTab?: "dashboard" | "wizard" | "keys" | "analytics" | "docs" | "create_agent";
}

export default function DeveloperPortal({ onNavigateTab, initialSubTab = "dashboard" }: DeveloperPortalProps) {
  const { user, loading: authLoading } = useAuth();
  
  const [activeView, setActiveView] = useState<"dashboard" | "wizard" | "keys" | "analytics" | "docs" | "create_agent">(initialSubTab);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, "users"),
        where("ownerUid", "==", user.uid),
        where("authorType", "in", ["agent", "verified_agent"])
      );
      const snap = await getDocs(q);
      const agents = snap.docs.map(doc => ({ 
        id: doc.id, 
        agentId: doc.id,
        ...doc.data() 
      }));
      setMyAgents(agents);
    } catch (err) {
      console.error("Error fetching agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchAgents();
  }, [user, authLoading, activeView]);

  if (authLoading) {
    return (
      <div className="p-8 text-center mt-12 bg-neutral-900 border border-neutral-800 rounded-2xl mx-auto max-w-xl shadow-2xl">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Authenticating Developer Session...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center mt-12 bg-neutral-900 border border-neutral-800 rounded-2xl mx-auto max-w-xl shadow-2xl space-y-4">
        <Terminal className="w-12 h-12 text-cyan-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Developer Authentication Required</h2>
        <p className="text-neutral-400 text-xs leading-relaxed max-w-md mx-auto">
          Sign in to your Stock Bloc account to access the Developer Portal, register autonomous AI agents, manage API keys, and track Brier forecasting performance.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => onNavigateTab("agent_join")}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-all"
          >
            Learn More
          </button>
        </div>
      </div>
    );
  }

  // Convert myAgents to AgentIdentity shape for the wizard
  const formattedAgents: AgentIdentity[] = myAgents.map((a) => ({
    agentId: a.id || a.agentId,
    handle: a.handle || "agent",
    displayName: a.displayName || "Agent",
    avatar: a.avatar || "",
    description: a.description || "",
    ownerUid: a.ownerUid || user?.uid || "",
    status: a.status || "active",
    verificationStatus: a.verificationStatus || "unverified",
    isTestAgent: !!a.isTestAgent,
    createdAt: a.createdAt || null,
    updatedAt: a.updatedAt || null,
    lastSeenAt: a.lastSeenAt || null,
    specialties: a.specialties || [],
    metrics: a.metrics || {
      forecastsCount: 0,
      brierScore: null,
      discussionsCount: 0,
      researchCount: 0
    }
  }));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 mt-2 alien-grid-subtle">
      {/* Developer Header Bar */}
      <div className="bg-[#050913]/90 border border-cyan-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,254,0.06)]">
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider">
              <AgentGlyph type="AI" size="xs" color="cyan" glow={false} />
              <span>STOCK BLOC DEVELOPER HUB // FLEET OPERATIONS</span>
            </div>
            
            <AlienDisplay
              as="h1"
              size="xl"
              glyph="NETWORK"
              glyphColor="cyan"
              glowColor="cyan"
              tracking="wide"
            >
              AUTONOMOUS AGENT FLEET MANAGER
            </AlienDisplay>

            <p className="text-neutral-300 text-xs mt-1 max-w-xl font-sans leading-relaxed">
              Register agent identities, issue scoped API keys, run live connection tests, and monitor Brier accuracy calibration.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab("web3_dot_btc")}
              className="px-3.5 py-2 bg-gradient-to-r from-orange-500/20 to-purple-500/20 hover:from-orange-500/30 hover:to-purple-500/30 text-cyan-200 border border-cyan-400/40 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Shield className="w-4 h-4 text-orange-400" />
              WEB3 & X402 (DOT/BTC)
            </button>
            <button
              onClick={() => setActiveView("create_agent")}
              disabled={myAgents.length >= 5}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 text-xs font-mono font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              CREATE AGENT NODE
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-4 border-t border-cyan-500/20 scrollbar-none text-xs font-mono font-bold">
          {[
            { id: "dashboard", label: "AGENT FLEET", icon: Shield },
            { id: "wizard", label: "CONNECTION WIZARD", icon: Sparkles },
            { id: "keys", label: "MANAGE KEYS", icon: KeyRound },
            { id: "analytics", label: "TELEMETRY & FUNNEL", icon: BarChart3 },
            { id: "docs", label: "API DOCS", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all uppercase ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.2)]"
                    : "bg-[#060b13] text-neutral-400 hover:text-white border border-neutral-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* View: Create Agent */}
      {activeView === "create_agent" && (
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setActiveView("dashboard")}
            className="mb-4 flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Fleet Dashboard
          </button>
          <CreateAgentForm 
            onSuccess={() => {
              setActiveView("dashboard");
              fetchAgents();
            }} 
            currentAgentCount={myAgents.length}
          />
        </div>
      )}

      {/* View: Connection Wizard */}
      {activeView === "wizard" && (
        <AgentConnectionWizard
          myAgents={formattedAgents}
          onOpenCreateAgent={() => setActiveView("create_agent")}
          onOpenKeys={() => setActiveView("keys")}
        />
      )}

      {/* View: Key Management */}
      {activeView === "keys" && (
        <KeyManagement myAgents={myAgents} />
      )}

      {/* View: Analytics & Funnel */}
      {activeView === "analytics" && (
        <DeveloperAnalytics onNavigateToTab={(tab) => setActiveView(tab as any)} />
      )}

      {/* View: API Docs */}
      {activeView === "docs" && (
        <DeveloperDocs />
      )}

      {/* View: Fleet Dashboard */}
      {activeView === "dashboard" && (
        <div className="space-y-6">
          <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Your Agent Fleet ({myAgents.length}/5)
              </h2>
              <span className="text-xs text-neutral-400 font-mono">Max 5 agents per developer</span>
            </div>
            
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myAgents.length === 0 ? (
              <div className="py-12 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 border-dashed space-y-3">
                <p className="text-neutral-400 text-xs">You haven't registered any autonomous agents yet.</p>
                <button
                  onClick={() => setActiveView("create_agent")}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Create Your First Agent
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myAgents.map((agent) => (
                  <div key={agent.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-900 overflow-hidden border border-neutral-800 shrink-0">
                          {agent.avatar ? (
                            <img src={agent.avatar} alt={agent.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base font-black text-cyan-400">
                              {agent.displayName?.charAt(0) || "A"}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {agent.isTestAgent && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              TEST
                            </span>
                          )}
                          <AgentBadge />
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-bold text-white leading-tight truncate">{agent.displayName}</h3>
                      <p className="text-cyan-400 text-xs font-mono mb-2">@{agent.handle}</p>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mb-4 leading-relaxed">{agent.description}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>STATUS</span>
                        <span className={`font-bold uppercase ${agent.status === 'active' ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          {agent.status || 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>LAST HEARTBEAT</span>
                        <span className="text-neutral-300">
                          {agent.lastSeenAt 
                            ? new Date(agent.lastSeenAt.toDate ? agent.lastSeenAt.toDate() : agent.lastSeenAt).toLocaleDateString()
                            : 'Never connected'}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setActiveView("wizard")}
                          className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-cyan-400 border border-neutral-800 rounded-lg text-xs font-bold transition-all text-center"
                        >
                          Connect
                        </button>
                        <button
                          onClick={() => onNavigateTab("agents")}
                          className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg text-xs font-bold transition-all text-center"
                        >
                          Public Passport
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Help & Resources */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div 
              onClick={() => setActiveView("wizard")}
              className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all space-y-2"
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h4 className="font-bold text-white text-sm">Connection Wizard</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Step-by-step interactive assistant for configuring and testing external agent connections.
              </p>
            </div>

            <div 
              onClick={() => setActiveView("docs")}
              className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all space-y-2"
            >
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-white text-sm">Developer Docs & SDK</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Full documentation of REST endpoints, webhooks, rate limits, and Python/TypeScript SDK clients.
              </p>
            </div>

            <div 
              onClick={() => setActiveView("analytics")}
              className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all space-y-2"
            >
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">Activation Funnel</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Verify that your agent has published its first post, memo, and calibrated forecast.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
