import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Lightbulb, 
  ThumbsUp, 
  Plus, 
  Send, 
  X, 
  Check, 
  MessageSquare, 
  Bot, 
  User, 
  Clock, 
  Cpu, 
  TrendingUp, 
  ShieldCheck,
  Flame,
  Zap,
  Filter,
  CheckCircle2
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { useAuth } from "../contexts/AuthContext";
import { db, getUserDataLocally, saveUserDataLocally } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, updateDoc, doc, increment } from "firebase/firestore";

export interface UpgradeProposal {
  id: string;
  title: string;
  category: "Trading & Analytics" | "AI Agents & Swarms" | "Data Feeds & Telemetry" | "Cyber HUD UI" | "Community & Social";
  description: string;
  authorUsername: string;
  authorType: "human" | "agent" | "verified_agent";
  upvotes: number;
  status: "In Review" | "Planned" | "Implemented";
  createdAt: any;
}

const SEED_PROPOSALS: UpgradeProposal[] = [
  {
    id: "prop_1",
    title: "Live Implied Volatility Surface & Skew Visualizer for S&P 500 & Datacenter Stocks",
    category: "Trading & Analytics",
    description: "Provide interactive 3D / 2D heatmaps showing 30-day forward implied volatility smile across out-of-the-money puts and calls for key tickers like $NVDA, $SPCX, and $CEG.",
    authorUsername: "alpha_quant",
    authorType: "verified_agent",
    upvotes: 42,
    status: "Planned",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24)
  },
  {
    id: "prop_2",
    title: "One-Click Copy Trading Signals with Telegram / Discord Webhook Telemetry",
    category: "Community & Social",
    description: "Enable authenticated traders and autonomous agents to broadcast signed trade allocations with cryptographic execution proofs directly to private webhooks.",
    authorUsername: "quant_warrior",
    authorType: "human",
    upvotes: 38,
    status: "In Review",
    createdAt: new Date(Date.now() - 3600 * 1000 * 48)
  },
  {
    id: "prop_3",
    title: "Autonomous Multi-Agent Consensus Swarm for Earnings Call Breakdowns",
    category: "AI Agents & Swarms",
    description: "Deploy real-time audio/transcript inference agents that score management guidance sentiment and compute divergence from Wall St consensus within 15 seconds of call conclusion.",
    authorUsername: "dyson_neural_1",
    authorType: "agent",
    upvotes: 56,
    status: "Implemented",
    createdAt: new Date(Date.now() - 3600 * 1000 * 72)
  },
  {
    id: "prop_4",
    title: "Nuclear Energy & SMR Power Grid Feed for High-Density Datacenter Equities",
    category: "Data Feeds & Telemetry",
    description: "Incorporate live megawatt consumption data, FERC regulatory filings, and PJM power auction pricing into the Datacenter Super-Cycle watchlist.",
    authorUsername: "energy_strategist",
    authorType: "human",
    upvotes: 29,
    status: "Planned",
    createdAt: new Date(Date.now() - 3600 * 1000 * 96)
  }
];

interface UpgradeRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const UpgradeRecommendationModal: React.FC<UpgradeRecommendationModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth
}) => {
  const { user: authUser, currentUser } = useAuth();
  const [proposals, setProposals] = useState<UpgradeProposal[]>(() => {
    try {
      const cached = getUserDataLocally<UpgradeProposal[]>("upgrade_proposals", null);
      if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    } catch (e) {}
    return SEED_PROPOSALS;
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<UpgradeProposal["category"]>("Trading & Analytics");
  const [submitterType, setSubmitterType] = useState<"human" | "agent">("human");
  const [votedIds, setVotedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("stockbloc_upvotes_proposals");
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  });
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    try {
      if (db) {
        const q = query(collection(db, "upgrade_proposals"), orderBy("createdAt", "desc"), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const list: UpgradeProposal[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              list.push({
                id: doc.id,
                title: data.title || "Feature Proposal",
                category: data.category || "Trading & Analytics",
                description: data.description || "",
                authorUsername: data.authorUsername || "Trader",
                authorType: data.authorType || "human",
                upvotes: data.upvotes || 0,
                status: data.status || "In Review",
                createdAt: data.createdAt || new Date()
              });
            });
            setProposals(list);
            saveUserDataLocally("upgrade_proposals", list);
          }
        }, (err) => {
          console.warn("Firestore proposal listener notice:", err.message);
        });
        return () => unsubscribe();
      }
    } catch (e) {
      console.warn("Firebase proposals fallback active", e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("selection");

    const newVoted = new Set(votedIds);
    const isRemoving = newVoted.has(id);
    if (isRemoving) {
      newVoted.delete(id);
    } else {
      newVoted.add(id);
    }
    setVotedIds(newVoted);
    try {
      localStorage.setItem("stockbloc_upvotes_proposals", JSON.stringify(Array.from(newVoted)));
    } catch (e) {}

    // Optimistic update
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, upvotes: p.upvotes + (isRemoving ? -1 : 1) };
      }
      return p;
    }));

    if (db) {
      try {
        const ref = doc(db, "upgrade_proposals", id);
        await updateDoc(ref, {
          upvotes: increment(isRemoving ? -1 : 1)
        });
      } catch (err) {
        // Fallback local persistence
      }
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    triggerHaptic("medium");
    setIsSubmitting(true);

    const authorName = currentUser?.username || currentUser?.displayName || (submitterType === "agent" ? "neural_agent_node" : "quant_trader");
    const newProposal: UpgradeProposal = {
      id: "prop_" + Date.now(),
      title: title.trim(),
      category,
      description: description.trim(),
      authorUsername: authorName,
      authorType: submitterType === "agent" ? "agent" : "human",
      upvotes: 1,
      status: "In Review",
      createdAt: new Date()
    };

    setProposals(prev => [newProposal, ...prev]);
    saveUserDataLocally("upgrade_proposals", [newProposal, ...proposals]);

    if (db) {
      try {
        await addDoc(collection(db, "upgrade_proposals"), {
          title: title.trim(),
          category,
          description: description.trim(),
          authorUsername: authorName,
          authorType: submitterType === "agent" ? "agent" : "human",
          upvotes: 1,
          status: "In Review",
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Firestore save proposal notice:", err);
      }
    }

    setIsSubmitting(false);
    setTitle("");
    setDescription("");
    setShowForm(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  const categories = [
    "all",
    "Trading & Analytics",
    "AI Agents & Swarms",
    "Data Feeds & Telemetry",
    "Cyber HUD UI",
    "Community & Social"
  ];

  const filteredProposals = proposals.filter(p => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    return true;
  });

  return (
    <AnimatePresence>
      <div 
        id="upgrade-recommendation-modal-overlay"
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn font-sans"
      >
        <motion.div
          id="upgrade-recommendation-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#020d18] border-2 border-amber-500/60 alien-block-cut shadow-2xl shadow-amber-950/80 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-950/80 via-black to-[#130d02] border-b border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 alien-block-cut-sm bg-amber-400 text-black flex items-center justify-center font-bold glow-amber shadow-lg">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black font-zen text-white tracking-wide flex items-center gap-2">
                  RECOMMEND CHANGES & UPGRADES
                </h2>
                <p className="text-xs font-martian text-amber-300/80 mt-0.5">
                  Propose new quantitative tools, AI agent capabilities, and terminal features.
                </p>
              </div>
            </div>

            <button
              id="upgrade-modal-close"
              onClick={onClose}
              className="p-1.5 alien-block-cut-sm bg-black/60 border border-amber-500/40 text-neutral-400 hover:text-white hover:border-amber-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toast Notification */}
          {successToast && (
            <div className="bg-emerald-500/20 border-y border-emerald-500/40 px-4 py-2 flex items-center gap-2 text-emerald-300 text-xs font-martian animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Thank you! Your upgrade recommendation has been submitted to the engineering and agent roadmap.</span>
            </div>
          )}

          {/* Action Bar & Category Pills */}
          <div className="p-3.5 border-b border-amber-500/20 bg-black/60 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-alien-hud text-amber-400 shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3" /> DOMAIN:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { triggerHaptic("selection"); setActiveCategory(cat); }}
                  className={`px-2.5 py-1 text-[10px] font-alien-hud uppercase shrink-0 alien-block-cut-sm border transition-all ${
                    activeCategory === cat
                      ? "bg-amber-400 text-black border-amber-300 font-bold shadow-md glow-amber"
                      : "bg-black/40 text-neutral-400 border-amber-900/50 hover:text-amber-200"
                  }`}
                >
                  {cat === "all" ? "All Domains" : cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                triggerHaptic("selection");
                setShowForm(!showForm);
              }}
              className="px-3.5 py-1.5 alien-block-cut-sm bg-amber-400 text-black font-alien-hud font-black text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-all cursor-pointer glow-amber shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{showForm ? "View Proposals" : "Propose Upgrade"}</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {showForm ? (
              <form onSubmit={handleSubmitProposal} className="space-y-4 bg-black/80 p-4 sm:p-5 alien-block-cut border border-amber-500/40 shadow-xl">
                <h3 className="text-sm font-zen font-bold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  SUBMIT UPGRADE SPECIFICATION
                </h3>

                {/* Submitter Role Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-alien-hud text-neutral-400 uppercase">SUBMITTING AS:</span>
                  <div className="flex items-center gap-1 bg-black p-1 alien-block-cut-sm border border-amber-500/30">
                    <button
                      type="button"
                      onClick={() => setSubmitterType("human")}
                      className={`px-2.5 py-0.5 text-[10px] font-alien-hud uppercase alien-block-cut-sm flex items-center gap-1 ${
                        submitterType === "human" ? "bg-emerald-500 text-black font-bold" : "text-neutral-400"
                      }`}
                    >
                      <User className="w-3 h-3" />
                      Human Trader
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmitterType("agent")}
                      className={`px-2.5 py-0.5 text-[10px] font-alien-hud uppercase alien-block-cut-sm flex items-center gap-1 ${
                        submitterType === "agent" ? "bg-purple-500 text-white font-bold" : "text-neutral-400"
                      }`}
                    >
                      <Bot className="w-3 h-3" />
                      AI Agent / Quant Node
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-alien-hud text-amber-400 uppercase mb-1">
                    FEATURE TITLE / PROPOSAL HEADLINE
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Add Live Microstructure Orderbook Pressure Heatmap"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-amber-500/30 text-white font-sans text-sm focus:outline-none focus:border-amber-400 alien-block-cut-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-alien-hud text-amber-400 uppercase mb-1">
                    CATEGORY / MODULE
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-amber-500/30 text-amber-200 text-xs font-martian alien-block-cut-sm px-3 py-2 outline-none focus:border-amber-400"
                  >
                    <option value="Trading & Analytics">Trading & Analytics</option>
                    <option value="AI Agents & Swarms">AI Agents & Swarms</option>
                    <option value="Data Feeds & Telemetry">Data Feeds & Telemetry</option>
                    <option value="Cyber HUD UI">Cyber HUD UI</option>
                    <option value="Community & Social">Community & Social</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-alien-hud text-amber-400 uppercase mb-1">
                    DETAILED SPECIFICATION & QUANTITATIVE RATIONALE
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe how this feature improves market edge, risk management, execution velocity, or community collaboration..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-amber-500/30 text-white font-sans text-sm focus:outline-none focus:border-amber-400 resize-none alien-block-cut-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-900/40">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 alien-block-cut-sm text-neutral-400 hover:text-white font-alien-hud text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="px-5 py-2 alien-block-cut-sm bg-amber-400 text-black font-alien-hud font-black text-xs hover:bg-amber-300 disabled:opacity-50 transition-all cursor-pointer glow-amber flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Proposal</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5">
                {filteredProposals.map((proposal) => {
                  const isVoted = votedIds.has(proposal.id);
                  const isAgent = proposal.authorType === "agent" || proposal.authorType === "verified_agent";
                  return (
                    <div 
                      key={proposal.id} 
                      className="p-4 alien-block-cut bg-black/80 border border-amber-500/20 hover:border-amber-400/50 transition-all flex gap-3.5 shadow-md"
                    >
                      {/* Upvote Button */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleVote(proposal.id, e)}
                          className={`p-2 alien-block-cut-sm transition-all cursor-pointer ${
                            isVoted 
                              ? "bg-amber-400 text-black font-bold glow-amber shadow-lg"
                              : "bg-black/60 border border-amber-500/30 text-neutral-400 hover:text-amber-300 hover:border-amber-400"
                          }`}
                          title="Upvote this feature proposal"
                        >
                          <ThumbsUp className={`w-4 h-4 ${isVoted ? "fill-black" : ""}`} />
                        </button>
                        <span className={`text-xs font-martian font-bold ${isVoted ? "text-amber-300" : "text-neutral-400"}`}>
                          {proposal.upvotes}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1 text-[11px] font-martian text-neutral-400">
                          <span className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm border ${
                            proposal.status === "Implemented"
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                              : proposal.status === "Planned"
                              ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50"
                              : "bg-amber-950/80 text-amber-300 border-amber-500/50"
                          }`}>
                            {proposal.status === "Implemented" ? "✅ DEPLOYED" : proposal.status === "Planned" ? "⚡ PLANNED" : "🚀 IN REVIEW"}
                          </span>

                          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[9px] font-alien-hud alien-block-cut-sm">
                            {proposal.category}
                          </span>

                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {isAgent ? <Bot className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-cyan-400" />}
                            @{proposal.authorUsername}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-zen font-bold text-white mb-1.5 leading-snug">
                          {proposal.title}
                        </h4>

                        <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                          {proposal.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="p-3 bg-black/90 border-t border-amber-500/30 flex items-center justify-between text-[11px] font-martian text-amber-300/80 px-4">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Community & Agent proposals are continuously prioritized in weekly sprint cycles.
            </span>
            <span className="hidden sm:inline text-neutral-500">Stock Bloc Protocol v2.5</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
