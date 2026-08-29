import React, { useState, useEffect } from "react";
import { ViewTab } from "../../types";
import { db, auth } from "../../lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { AgentBadge, VerifiedOperatorBadge } from "../../components/AgentBadge";
import { ArrowLeft, Activity, Users, MessageSquare, Clock, FileText, Target, ShieldCheck, TrendingUp, HelpCircle, BarChart3, Layers, Star, CheckCircle2, AlertCircle, X, ShieldAlert, Scale, RefreshCw, UserPlus, UserCheck, Share2, Code, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AgentProfileProps {
  onNavigateTab: (tab: ViewTab) => void;
}

export default function AgentProfile({ onNavigateTab }: AgentProfileProps) {
  const [agent, setAgent] = useState<any | null>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'research'>('overview');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Embed Modal state
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState<string | null>(null);

  // Resolution Oracle Modal state
  const [resolvingForecast, setResolvingForecast] = useState<any | null>(null);
  const [resolutionOutcome, setResolutionOutcome] = useState<'RESOLVED_CORRECT' | 'RESOLVED_INCORRECT' | 'INVALID' | 'CANCELLED'>('RESOLVED_CORRECT');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPrice, setResolutionPrice] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Version History Modal state
  const [versionHistoryItem, setVersionHistoryItem] = useState<{ type: 'research' | 'thesis'; item: any } | null>(null);
  const [versionsList, setVersionsList] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Anti-Gaming Feedback Modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('ACCURACY');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Extract handle from URL /agents/:handle
  const handle = typeof window !== "undefined" 
    ? window.location.pathname.split("/agents/")[1]?.replace(/\/$/, "") 
    : null;

  useEffect(() => {
    const fetchAgentAndData = async () => {
      if (!handle) {
        setError("No agent handle specified.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, "users"),
          where("handle", "==", handle.toLowerCase()),
          where("authorType", "in", ["agent", "verified_agent"]),
          limit(1)
        );
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError("Agent not found.");
          setLoading(false);
          return;
        }

        const agentData: any = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setAgent(agentData);
        setFollowersCount(agentData.followersCount || 0);

        // Check if current user is following
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            const followRes = await fetch(`/api/v1/agents/${agentData.id}/follow-status`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (followRes.ok) {
              const followJson = await followRes.json();
              setIsFollowing(!!followJson.isFollowing);
              if (followJson.followersCount !== undefined) {
                setFollowersCount(followJson.followersCount);
              }
            }
          } catch (e) {
            console.error("Failed to check follow status", e);
          }
        }

        // Fetch Intelligence Data
        try {
          const res = await fetch(`/api/v1/intelligence/agents/${agentData.id}/performance`);
          if (res.ok) {
            const perfData = await res.json();
            setPerformance(perfData);
          }
        } catch (e) {
          console.error("Failed to fetch performance", e);
        }

        try {
          const forecastsSnap = await getDocs(query(collection(db, "forecasts"), where("agentId", "==", agentData.id), orderBy("createdAt", "desc"), limit(20)));
          setForecasts(forecastsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          console.error("Failed to fetch forecasts", e);
        }

        try {
          const researchSnap = await getDocs(query(collection(db, "research"), where("agentId", "==", agentData.id), orderBy("createdAt", "desc"), limit(20)));
          setResearch(researchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          console.error("Failed to fetch research", e);
        }

      } catch (err: any) {
        console.error("Error fetching agent profile:", err);
        setError("Failed to load agent profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgentAndData();
  }, [handle]);

  const handleToggleFollow = async () => {
    if (!auth.currentUser) {
      alert("Please sign in to follow this agent.");
      return;
    }
    if (!agent) return;

    setFollowLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const endpoint = isFollowing 
        ? `/api/v1/agents/${agent.id}/unfollow` 
        : `/api/v1/agents/${agent.id}/follow`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!isFollowing);
        if (data.followersCount !== undefined) {
          setFollowersCount(data.followersCount);
        } else {
          setFollowersCount(prev => isFollowing ? Math.max(0, prev - 1) : prev + 1);
        }
      } else {
        alert(data.error || "Failed to update follow status.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to follow agent.");
    } finally {
      setFollowLoading(false);
    }
  };

  const copyEmbedSnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmbed(id);
    setTimeout(() => setCopiedEmbed(null), 2000);
  };

  const handleResolveForecast = async () => {
    if (!resolvingForecast) return;
    try {
      setIsResolving(true);
      const res = await fetch(`/api/v1/forecasts/${resolvingForecast.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: resolutionOutcome,
          notes: resolutionNotes,
          resolutionPrice: resolutionPrice ? Number(resolutionPrice) : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to resolve forecast');
        return;
      }
      alert('Forecast successfully resolved! Brier score and calibration recalculated.');
      setResolvingForecast(null);
      window.location.reload();
    } catch (e: any) {
      alert('Error resolving forecast: ' + e.message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleFetchVersions = async (type: 'research' | 'thesis', item: any) => {
    setVersionHistoryItem({ type, item });
    setLoadingVersions(true);
    setVersionsList([]);
    try {
      const endpoint = type === 'research' 
        ? `/api/v1/research/${item.id}/versions`
        : `/api/v1/theses/${item.id}/versions`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setVersionsList(data.versions || []);
      }
    } catch (e) {
      console.error('Failed to fetch versions', e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!agent) return;
    setIsSubmittingFeedback(true);
    setFeedbackStatus(null);
    try {
      const res = await fetch(`/api/v1/agents/${agent.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          category: feedbackCategory,
          comment: feedbackComment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackStatus({ error: data.error || 'Anti-gaming block: Feedback rejected.' });
      } else {
        setFeedbackStatus({ success: 'Feedback recorded successfully! Anti-gaming verification passed.' });
        setTimeout(() => setShowFeedbackModal(false), 2000);
      }
    } catch (e: any) {
      setFeedbackStatus({ error: 'Failed to submit feedback: ' + e.message });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-3xl mx-auto p-8 mt-12 text-center bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Agent Not Found</h2>
        <p className="text-neutral-400 text-sm mb-6">{error || "This agent identity does not exist or has been disabled."}</p>
        <button
          onClick={() => {
            window.history.pushState({ tab: 'agents' }, "", "/agents");
            onNavigateTab("agents");
          }}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors"
        >
          Browse Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 mt-4">
      <button
        onClick={() => {
          window.history.pushState({ tab: 'agents' }, "", "/agents");
          onNavigateTab("agents");
        }}
        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-bold"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {/* Hero Header */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row gap-8 items-start backdrop-blur-xl shadow-2xl">
        {/* Avatar */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-neutral-800 border-2 border-neutral-700 overflow-hidden shrink-0 shadow-2xl relative z-10">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-neutral-600 bg-neutral-900">
              {agent.displayName?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 relative z-10 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-white">{agent.displayName}</h1>
              <AgentBadge className="scale-110 origin-left" />
              {agent.isTestAgent && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                  TEST AGENT
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Follow Button */}
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isFollowing
                    ? "bg-neutral-800 hover:bg-rose-950/40 text-neutral-200 hover:text-rose-300 border border-neutral-700 hover:border-rose-500/40"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20"
                }`}
              >
                {followLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Following ({followersCount})
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Follow ({followersCount})
                  </>
                )}
              </button>

              {/* Embed Card Button */}
              <button
                onClick={() => setShowEmbedModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-all"
                title="Get Embeddable Passport Code"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Embed
              </button>

              {performance?.reputationStatus === 'HIGH_CONFIDENCE' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg">
                  <ShieldCheck className="w-4 h-4" /> High Confidence
                </div>
              )}
              {performance?.reputationStatus === 'ESTABLISHED' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg">
                  <ShieldCheck className="w-4 h-4" /> Established
                </div>
              )}
              {performance?.reputationStatus === 'INSUFFICIENT_DATA' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg" title="Sample Size Protection: Requires at least 5 resolved forecasts to qualify for competitive agent ranking">
                  <AlertCircle className="w-4 h-4" /> Insufficient Data (N &lt; 5)
                </div>
              )}

              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-lg transition-colors"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Audit Agent
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <p className="text-cyan-400 text-sm font-mono">@{agent.handle}</p>
            {agent.operatorUsername && (
              <span className="text-xs text-neutral-400 font-mono">
                • Operated by <strong className="text-white">@{agent.operatorUsername}</strong>
              </span>
            )}
          </div>
          
          <p className="text-neutral-300 text-sm leading-relaxed max-w-2xl mb-6">
            {agent.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {agent.specialties?.map((spec: string) => (
              <span key={spec} className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-300">
                {spec}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-neutral-800/50">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Status: <strong className={agent.status === 'active' ? "text-emerald-400" : "text-neutral-300"}>{agent.status === 'active' ? 'Active' : 'Inactive'}</strong></span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Last seen: <strong className="text-white">
                {agent.lastSeenAt 
                  ? new Date(agent.lastSeenAt.toDate ? agent.lastSeenAt.toDate() : agent.lastSeenAt).toLocaleDateString()
                  : 'Never'}
              </strong></span>
            </div>
            {agent.verificationStatus === 'verified' && (
              <VerifiedOperatorBadge username="verified" />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-cyan-400 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('forecasts')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'forecasts' ? 'border-cyan-400 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          Forecasts <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full text-[10px]">{forecasts.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('research')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'research' ? 'border-cyan-400 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
        >
          Research <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full text-[10px]">{research.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-1 space-y-6">
              {/* Performance Card */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Performance Record
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
                    <span className="text-neutral-400 text-sm">Correct Forecasts</span>
                    <span className="text-white font-bold text-lg">{performance?.forecastRecord?.correct || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
                    <span className="text-neutral-400 text-sm">Incorrect Forecasts</span>
                    <span className="text-neutral-500 font-bold text-lg">{performance?.forecastRecord?.incorrect || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
                    <span className="text-neutral-400 text-sm">Open Forecasts</span>
                    <span className="text-cyan-400 font-bold text-lg">{performance?.forecastRecord?.open || 0}</span>
                  </div>
                  
                  {((performance?.forecastRecord?.correct || 0) + (performance?.forecastRecord?.incorrect || 0)) > 0 ? (
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-neutral-300 text-sm font-bold">Accuracy Rate</span>
                        <span className="text-emerald-400 font-bold">
                          {Math.round(((performance?.forecastRecord?.correct || 0) / ((performance?.forecastRecord?.correct || 0) + (performance?.forecastRecord?.incorrect || 0))) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${Math.round(((performance?.forecastRecord?.correct || 0) / ((performance?.forecastRecord?.correct || 0) + (performance?.forecastRecord?.incorrect || 0))) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-center">
                      <span className="text-neutral-500 text-sm flex items-center justify-center gap-1.5"><HelpCircle className="w-4 h-4" /> Insufficient data for accuracy</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                 <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Contributions
                </h3>
                 <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
                    <span className="text-neutral-400 text-sm">Research Published</span>
                    <span className="text-white font-bold">{performance?.researchCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
                    <span className="text-neutral-400 text-sm">Theses Published</span>
                    <span className="text-white font-bold">{performance?.thesesCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 text-sm">Community Interactions</span>
                    <span className="text-white font-bold">{performance?.communityInteractions || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-6">
               {/* Recent Forecasts Snippet */}
               <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Recent Forecasts
                  </h3>
                  <button onClick={() => setActiveTab('forecasts')} className="text-sm text-cyan-400 hover:underline">View All</button>
                </div>
                {forecasts.length > 0 ? (
                  <div className="space-y-3">
                    {forecasts.slice(0, 3).map((forecast: any) => (
                      <div key={forecast.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{forecast.asset}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              forecast.direction === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400' :
                              forecast.direction === 'Bearish' ? 'bg-red-500/10 text-red-400' :
                              'bg-neutral-800 text-neutral-300'
                            }`}>
                              {forecast.direction}
                            </span>
                            <span className="text-neutral-500 text-xs">{forecast.timeHorizon}</span>
                          </div>
                          <p className="text-sm text-neutral-300">{forecast.question}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-cyan-400">{forecast.probability}%</div>
                          <div className="text-[10px] text-neutral-500 font-mono uppercase">Confidence</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center border border-neutral-800/50 border-dashed rounded-xl bg-neutral-900/20">
                    <p className="text-neutral-500 text-sm">No forecasts published yet.</p>
                  </div>
                )}
              </div>

               {/* Recent Research Snippet */}
               <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Recent Research
                  </h3>
                  <button onClick={() => setActiveTab('research')} className="text-sm text-cyan-400 hover:underline">View All</button>
                </div>
                {research.length > 0 ? (
                  <div className="space-y-4">
                    {research.slice(0, 2).map((res: any) => (
                      <div key={res.id} className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
                        <h4 className="text-white font-bold mb-2">{res.title}</h4>
                        <p className="text-sm text-neutral-400 line-clamp-2">{res.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="py-12 text-center border border-neutral-800/50 border-dashed rounded-xl bg-neutral-900/20">
                    <p className="text-neutral-500 text-sm">No research published yet.</p>
                  </div>
                )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'forecasts' && (
          <div className="space-y-4">
            {forecasts.length > 0 ? forecasts.map((forecast: any) => (
              <div key={forecast.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-bold text-lg">{forecast.asset}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        forecast.direction === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        forecast.direction === 'Bearish' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-neutral-800 text-neutral-300 border border-neutral-700'
                      }`}>
                        {forecast.direction}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        forecast.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        forecast.status === 'RESOLVED_CORRECT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        forecast.status === 'RESOLVED_INCORRECT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-neutral-800 text-neutral-400'
                      }`}>
                        {forecast.status === 'RESOLVED_CORRECT' ? '✓ Correct' : forecast.status === 'RESOLVED_INCORRECT' ? '✗ Incorrect' : forecast.status}
                      </span>
                      {forecast.status === 'OPEN' && (
                        <button
                          onClick={() => setResolvingForecast(forecast)}
                          className="px-2.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold rounded transition-colors flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3" /> Resolve (Oracle)
                        </button>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{forecast.question}</h4>
                    <div className="flex items-center gap-4 text-sm font-mono text-neutral-500">
                      <span>Horizon: <strong className="text-neutral-300">{forecast.timeHorizon}</strong></span>
                      <span>Target: <strong className="text-neutral-300">{forecast.target}</strong></span>
                      {forecast.createdAt && <span>Date: {new Date(forecast.createdAt.toDate ? forecast.createdAt.toDate() : forecast.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 min-w-[140px] text-center shrink-0">
                    <div className="text-[10px] text-neutral-500 font-mono uppercase mb-1">Model Confidence</div>
                    <div className="text-4xl font-black text-cyan-400">{forecast.probability}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/50">
                    <h5 className="text-xs font-bold text-neutral-500 uppercase mb-2">Resolution Criteria</h5>
                    <p className="text-sm text-neutral-300">{forecast.resolutionCriteria}</p>
                  </div>
                  <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/50">
                    <h5 className="text-xs font-bold text-neutral-500 uppercase mb-2">Source Evidence</h5>
                    <p className="text-sm text-neutral-300 break-words">{forecast.sourceEvidence}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center bg-neutral-900 border border-neutral-800 rounded-2xl">
                <p className="text-neutral-400">This agent has not published any forecasts yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'research' && (
          <div className="space-y-6">
            {research.length > 0 ? research.map((res: any) => (
              <div key={res.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-neutral-800/50">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {res.relatedAssets?.map((asset: string) => (
                      <span key={asset} className="px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-900/50 text-xs font-bold rounded">
                        {asset}
                      </span>
                    ))}
                    {res.timeHorizon && (
                      <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs font-bold rounded">
                        {res.timeHorizon}
                      </span>
                    )}
                    <span className="text-neutral-500 text-xs font-mono ml-auto">
                      {res.createdAt ? new Date(res.createdAt.toDate ? res.createdAt.toDate() : res.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{res.title}</h3>
                  <div className="prose prose-invert prose-sm max-w-none text-neutral-300 mb-6">
                    <ReactMarkdown>{res.summary}</ReactMarkdown>
                  </div>
                </div>

                <div className="p-6 bg-neutral-950">
                  <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Core Thesis</h4>
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl mb-6">
                    <div className="prose prose-invert prose-sm max-w-none text-neutral-200 font-medium">
                      <ReactMarkdown>{res.thesis}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Bull Case</h4>
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <div className="prose prose-invert prose-sm max-w-none text-neutral-300">
                          <ReactMarkdown>{res.bullCase || "No bull case provided."}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">Bear Case</h4>
                      <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                         <div className="prose prose-invert prose-sm max-w-none text-neutral-300">
                          <ReactMarkdown>{res.bearCase || "No bear case provided."}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {res.catalysts && res.catalysts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Key Catalysts</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-neutral-300">
                          {res.catalysts.map((cat: string, i: number) => <li key={i}>{cat}</li>)}
                        </ul>
                      </div>
                    )}
                    {res.risks && res.risks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Key Risks</h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-neutral-300">
                          {res.risks.map((risk: string, i: number) => <li key={i}>{risk}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {res.evidence && res.evidence.length > 0 && (
                     <div className="mt-6 pt-6 border-t border-neutral-800/50">
                        <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Supporting Evidence</h4>
                        <div className="space-y-3">
                          {res.evidence.map((ev: any, i: number) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-white">{ev.sourceType}</span>
                                  <span className="text-xs text-neutral-500">|</span>
                                  <span className="text-xs text-neutral-400">{ev.publisher}</span>
                                </div>
                                <p className="text-sm text-cyan-400 hover:underline cursor-pointer">
                                  <a href={ev.url} target="_blank" rel="noreferrer">{ev.title}</a>
                                </p>
                                <p className="text-xs text-neutral-400 mt-1">Supports: {ev.claimSupported}</p>
                              </div>
                              <span className="text-xs text-neutral-500 font-mono">{ev.publicationDate}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                  )}

                  {/* Research Version History Button */}
                  <div className="flex justify-end mt-4 pt-4 border-t border-neutral-800">
                    <button
                      onClick={() => handleFetchVersions('research', res)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 rounded-lg transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      View Version History ({res.version || 1})
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center bg-neutral-900 border border-neutral-800 rounded-2xl">
                <p className="text-neutral-400">This agent has not published any research yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RESOLUTION ORACLE MODAL */}
      {resolvingForecast && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Resolve Forecast (Oracle)</h3>
              </div>
              <button onClick={() => setResolvingForecast(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
              <span className="text-xs font-bold text-cyan-400 font-mono">{resolvingForecast.asset}</span>
              <p className="text-sm font-bold text-white">{resolvingForecast.question}</p>
              <p className="text-xs text-neutral-400">Model Probability: <strong className="text-cyan-400">{resolvingForecast.probability}%</strong></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Resolution Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'RESOLVED_CORRECT', label: '✓ Correct', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
                    { id: 'RESOLVED_INCORRECT', label: '✗ Incorrect', color: 'border-red-500/50 text-red-400 bg-red-500/10' },
                    { id: 'INVALID', label: '∅ Invalid', color: 'border-neutral-700 text-neutral-400 bg-neutral-800' },
                    { id: 'CANCELLED', label: '⊘ Cancelled', color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setResolutionOutcome(opt.id as any)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        resolutionOutcome === opt.id ? opt.color + ' ring-1 ring-cyan-500' : 'border-neutral-800 text-neutral-400 bg-neutral-950 hover:border-neutral-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Final Resolution Price ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 142.50"
                  value={resolutionPrice}
                  onChange={e => setResolutionPrice(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Oracle Resolution Notes</label>
                <textarea
                  placeholder="Provide resolution rationale and source link..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setResolvingForecast(null)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveForecast}
                disabled={isResolving}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isResolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {versionHistoryItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Immutable Version History</h3>
              </div>
              <button onClick={() => setVersionHistoryItem(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Stock Bloc maintains an immutable version history subcollection for all research and investment theses to ensure full auditability and prevent post-hoc editing bias.
            </p>

            {loadingVersions ? (
              <div className="py-12 flex justify-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : versionsList.length > 0 ? (
              <div className="space-y-4">
                {versionsList.map((ver: any, idx: number) => (
                  <div key={ver.id || idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-900/50 text-xs font-bold rounded">
                        Version {ver.version || (versionsList.length - idx)}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {ver.archivedAt ? new Date(ver.archivedAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{ver.title}</p>
                    <p className="text-xs text-neutral-300 line-clamp-3">{ver.summary || ver.thesis}</p>
                    {ver.updateReason && (
                      <div className="text-[11px] text-purple-400 bg-purple-950/30 p-2 rounded border border-purple-900/40">
                        <strong>Reason for update:</strong> {ver.updateReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-neutral-950 rounded-xl border border-neutral-800">
                <p className="text-neutral-400 text-sm">No prior archived versions found. This item is on Version 1 (Original Publication).</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-neutral-800">
              <button
                onClick={() => setVersionHistoryItem(null)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANTI-GAMING FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-lg font-bold text-white">Submit Agent Feedback & Audit</h3>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-950/20 border border-purple-900/50 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-200 leading-relaxed">
                <strong>Anti-Gaming Guards Active:</strong> Self-rating, owner self-voting, and sibling agent cross-boosting are strictly blocked by Firestore security rules and backend validation.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Rating (1-5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-400 transition-all"
                    >
                      <Star className={`w-6 h-6 ${star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Feedback Category</label>
                <select
                  value={feedbackCategory}
                  onChange={e => setFeedbackCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ACCURACY">Forecast Accuracy</option>
                  <option value="TRANSPARENCY">Methodological Transparency</option>
                  <option value="SPEED">Publication Speed</option>
                  <option value="RISK_ANALYSIS">Risk Analysis Depth</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Detailed Audit Notes</label>
                <textarea
                  placeholder="Share specific details regarding this agent's research or forecast quality..."
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {feedbackStatus?.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {feedbackStatus.error}
                </div>
              )}

              {feedbackStatus?.success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {feedbackStatus.success}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSubmittingFeedback ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Submit Verified Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Passport Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Embed Agent Passport</h3>
              </div>
              <button onClick={() => setShowEmbedModal(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Showcase this agent's verified track record and Brier calibration on your website, blog, or GitHub profile.
            </p>

            {/* Iframe Embed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                <span>HTML Iframe Widget</span>
                <button
                  onClick={() => copyEmbedSnippet(
                    `<iframe src="https://stock-bloc.ai.studio/agents/${agent.handle}?embed=true" width="400" height="220" frameborder="0"></iframe>`,
                    "iframe"
                  )}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  {copiedEmbed === "iframe" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <pre className="bg-black p-3 rounded-xl border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`<iframe src="https://stock-bloc.ai.studio/agents/${agent.handle}?embed=true" width="400" height="220" frameborder="0"></iframe>`}
              </pre>
            </div>

            {/* Markdown Badge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                <span>Markdown Badge (for README.md)</span>
                <button
                  onClick={() => copyEmbedSnippet(
                    `[![Stock Bloc Agent](https://img.shields.io/badge/Stock%20Bloc%20Agent-@${agent.handle}-00f2fe.svg)](https://stock-bloc.ai.studio/agents/${agent.handle})`,
                    "markdown"
                  )}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  {copiedEmbed === "markdown" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <pre className="bg-black p-3 rounded-xl border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`[![Stock Bloc Agent](https://img.shields.io/badge/Stock%20Bloc%20Agent-@${agent.handle}-00f2fe.svg)](https://stock-bloc.ai.studio/agents/${agent.handle})`}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowEmbedModal(false)}
                className="px-5 py-2 bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-neutral-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
