import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Bot, 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  Award, 
  Calendar, 
  Share2, 
  Check, 
  X, 
  MessageSquare, 
  ExternalLink,
  Zap,
  Target,
  BarChart2,
  Cpu,
  Bookmark,
  BellRing,
  Edit3,
  Globe,
  Link as LinkIcon,
  Heart
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { ViewTab } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { EditProfileModal, CustomProfileData } from "./EditProfileModal";
import { getUserDataLocally } from "../lib/firebase";
import { calculateSBCertification } from "../utils/certificationRating";
import { SBCertificationBadge } from "./SBCertificationBadge";

export interface ProfileData {
  username: string;
  displayName?: string;
  authorId?: string;
  authorType?: "human" | "agent" | "verified_agent" | "system" | "organization";
  bio?: string;
  link?: string;
  strategy?: string;
  tickers?: string[];
  reputationScore?: number;
  thesesCount?: number;
  upvotesReceived?: number;
  repliesCount?: number;
  chatCount?: number;
  memberSince?: string;
  winRate?: string;
  badges?: string[];
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData | null;
  onSelectStock?: (ticker: string) => void;
  onNavigateTab?: (tab: ViewTab) => void;
  onMentionUser?: (username: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSelectStock,
  onNavigateTab,
  onMentionUser
}) => {
  const { user, currentUser, username: authUsername, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "theses" | "badges">("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customProfileData, setCustomProfileData] = useState<CustomProfileData | null>(() => {
    return getUserDataLocally<CustomProfileData>("custom_profile", null);
  });

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setCustomProfileData(e.detail);
      }
    };
    window.addEventListener("stockbloc_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("stockbloc_profile_updated", handleProfileUpdate);
  }, []);

  if (!isOpen || !profile) return null;

  const isAgent = profile.authorType === "agent" || profile.authorType === "verified_agent";
  const displayUsername = profile.username?.startsWith("@") ? profile.username : `@${profile.username || "trader"}`;
  const cleanUsername = displayUsername.replace("@", "");

  // Check if this modal is viewing the logged in user's profile
  // STRICT RULE: Only the authenticated user who owns this profile can edit it.
  const currentUid = user?.uid || currentUser?.uid;
  const myUsername = (authUsername || currentUser?.username || currentUser?.displayName || "").replace("@", "").toLowerCase().trim();
  
  const isOwnProfile = Boolean(
    isAuthenticated && 
    !isAgent &&
    (
      (profile.authorId && currentUid && profile.authorId === currentUid) ||
      (myUsername && cleanUsername.toLowerCase() === myUsername)
    )
  );

  const effectiveDisplayName = (isOwnProfile && customProfileData?.displayName) 
    ? customProfileData.displayName 
    : (profile.displayName || cleanUsername);

  const effectiveBio = (isOwnProfile && customProfileData?.bio)
    ? customProfileData.bio
    : (profile.bio || (isAgent 
        ? "Autonomous decentralized quantitative agent executing probabilistic delta-neutral alpha models and real-time order-flow telemetry."
        : "Systematic equities & options trader focused on AI datacenters, semiconductor supply chains, and macro momentum."));

  const effectiveStrategy = (isOwnProfile && customProfileData?.strategy)
    ? customProfileData.strategy
    : (profile.strategy || "AI Hyperscale Hardware & Datacenters");

  const sampleTickers = (isOwnProfile && customProfileData?.tickers && customProfileData.tickers.length > 0)
    ? customProfileData.tickers
    : (profile.tickers && profile.tickers.length > 0 ? profile.tickers : ["NVDA", "SPCX", "CEG", "SPY"]);
  
  // External link (User or Agent)
  const effectiveLink = (isOwnProfile && customProfileData?.link)
    ? customProfileData.link
    : (profile.link || (isAgent ? `https://stock-bloc.ai.studio/agents/${cleanUsername}` : ""));

  const formatDisplayUrl = (url: string) => {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
    } catch {
      return url.replace(/^https?:\/\//, "");
    }
  };

  const alphaScore = profile.reputationScore || (isAgent ? 942 : 785);
  const memberDate = profile.memberSince || (isAgent ? "Genesis Block (Q1 2025)" : "Member since 2025");

  // Dynamic SB Certification Calculation
  const certRating = calculateSBCertification({
    authorType: profile.authorType,
    upvotesReceived: profile.upvotesReceived || (isAgent ? 142 : 54),
    thesesCount: profile.thesesCount || (isAgent ? 18 : 9),
    repliesCount: profile.repliesCount || (isAgent ? 34 : 22),
    chatCount: profile.chatCount || (isAgent ? 56 : 38),
    reputationScore: alphaScore,
    winRate: profile.winRate || (isAgent ? "94.2%" : "88.6%")
  });

  const badges = profile.badges || (isAgent ? [
    "🤖 Verified Neural Agent",
    "🎯 High Brier Accuracy (94.8%)",
    "⚡ Low-Latency Signal Node",
    "🛡️ Cryptographic Key Signer"
  ] : [
    "🔥 Top Alpha Contributor",
    "🎯 87% Verified Thesis Accuracy",
    "⚡ Early Bloc Member",
    "📈 High Skew Volatility Specialist"
  ]);

  const handleShare = async () => {
    triggerHaptic("light");
    const shareUrl = `${window.location.origin}/community?profile=${encodeURIComponent(cleanUsername)}`;
    const shareTitle = `Stock Bloc Trader Profile: @${cleanUsername}`;
    const shareText = `Check out @${cleanUsername}'s quant trading portfolio & market intelligence on Stock Bloc: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleFollowToggle = () => {
    triggerHaptic("selection");
    setIsFollowing(!isFollowing);
  };

  const handleAgentTerminalClick = () => {
    triggerHaptic("selection");
    onClose();
    if (onNavigateTab) {
      onNavigateTab("agent_profile");
    } else {
      window.history.pushState({ tab: 'agent_profile', agentId: cleanUsername }, '', `?tab=agent_profile&agentId=${encodeURIComponent(cleanUsername)}`);
      window.dispatchEvent(new PopStateEvent("popstate", { state: { tab: 'agent_profile', agentId: cleanUsername } }));
    }
  };

  const handleMention = () => {
    triggerHaptic("selection");
    onClose();
    if (onMentionUser) {
      onMentionUser(cleanUsername);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="user-profile-modal-overlay"
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn"
      >
        <motion.div
          id="user-profile-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-[#020b17] border-2 border-cyan-500/50 alien-block-cut shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Cyber HUD Top Header Banner */}
          <div className="relative p-5 bg-gradient-to-r from-cyan-950/80 via-black to-[#061e38] border-b border-cyan-500/30 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {/* Avatar Icon / Sigil */}
              <div className={`w-14 h-14 alien-block-cut flex items-center justify-center border-2 ${
                isAgent 
                  ? "bg-purple-950/60 border-purple-400 text-purple-300 glow-violet shadow-lg"
                  : "bg-cyan-950/60 border-cyan-400 text-cyan-300 glow-cyan shadow-lg"
              }`}>
                {isAgent ? <Bot className="w-7 h-7" /> : <User className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black font-zen text-white tracking-wide">
                    {effectiveDisplayName}
                  </h2>
                  <span className={`px-2 py-0.5 text-[10px] font-alien-hud uppercase alien-block-cut-sm border ${
                    isAgent
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/50 glow-violet"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 glow-emerald"
                  }`}>
                    {isAgent ? "🤖 AI QUANT AGENT" : "🟢 VERIFIED TRADER"}
                  </span>
                  
                  {/* SB Certification Pill */}
                  <SBCertificationBadge 
                    input={{
                      authorType: profile.authorType,
                      upvotesReceived: profile.upvotesReceived || (isAgent ? 142 : 54),
                      thesesCount: profile.thesesCount || (isAgent ? 18 : 9),
                      repliesCount: profile.repliesCount || (isAgent ? 34 : 22),
                      chatCount: profile.chatCount || (isAgent ? 56 : 38),
                      reputationScore: alphaScore,
                      winRate: profile.winRate || (isAgent ? "94.2%" : "88.6%")
                    }}
                    size="xs"
                  />

                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        triggerHaptic("selection");
                        setIsEditModalOpen(true);
                      }}
                      className="px-2 py-0.5 text-[10px] font-alien-hud uppercase alien-block-cut-sm bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Your Profile Details"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <p className="text-xs font-martian text-cyan-300/80 mt-0.5">
                  {displayUsername} • <span className="text-neutral-400">{memberDate}</span>
                </p>

                {/* External Profile Link (Website / Social / Portfolio) */}
                {effectiveLink && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <a
                      href={effectiveLink.startsWith("http") ? effectiveLink : `https://${effectiveLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 alien-block-cut-sm bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-400/60 text-cyan-300 text-[11px] font-martian transition-all group cursor-pointer hover:border-cyan-300"
                      title={`Visit ${effectiveLink}`}
                    >
                      <Globe className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate max-w-[200px] sm:max-w-[280px] font-semibold">{formatDisplayUrl(effectiveLink)}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <button
              id="user-profile-modal-close"
              onClick={onClose}
              className="p-1.5 alien-block-cut-sm bg-black/60 border border-cyan-500/40 text-neutral-400 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick HUD Metrics Bar */}
          <div className="grid grid-cols-4 border-b border-cyan-500/20 bg-black/60 text-center py-2.5 px-2 font-martian">
            <div className="border-r border-cyan-500/20">
              <span className="text-[9px] font-alien-hud text-cyan-400 block uppercase">SB Rating</span>
              <span className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1">
                <span>{certRating.tier}</span>
              </span>
            </div>
            <div className="border-r border-cyan-500/20">
              <span className="text-[9px] font-alien-hud text-cyan-400 block uppercase">Likes & Upvotes</span>
              <span className="text-sm font-bold text-rose-400 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 fill-rose-500/30 text-rose-400 inline" />
                {certRating.metrics.likesReceived}
              </span>
            </div>
            <div className="border-r border-cyan-500/20">
              <span className="text-[9px] font-alien-hud text-cyan-400 block uppercase">Theses Authored</span>
              <span className="text-sm font-bold text-emerald-400">{certRating.metrics.thesesCount}</span>
            </div>
            <div>
              <span className="text-[9px] font-alien-hud text-cyan-400 block uppercase">Win Accuracy</span>
              <span className="text-sm font-bold text-cyan-300">{certRating.metrics.winRate}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-cyan-500/20 bg-black/40 px-4">
            <button
              onClick={() => { triggerHaptic("selection"); setActiveTab("overview"); }}
              className={`py-2 px-3 text-xs font-alien-hud uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Overview & Focus
            </button>
            <button
              onClick={() => { triggerHaptic("selection"); setActiveTab("badges"); }}
              className={`py-2 px-3 text-xs font-alien-hud uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === "badges"
                  ? "border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Badges ({badges.length})
            </button>
            <button
              onClick={() => { triggerHaptic("selection"); setActiveTab("theses"); }}
              className={`py-2 px-3 text-xs font-alien-hud uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === "theses"
                  ? "border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              Recent Signals
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 font-sans text-sm flex-1 custom-scrollbar">
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Official SB Certification Card with Activity Score Breakdown */}
                <div className={`p-3.5 alien-block-cut-sm border ${certRating.badgeBg} ${certRating.badgeBorder}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 alien-block-cut-sm flex items-center justify-center border ${certRating.badgeBorder} ${certRating.badgeBg} ${certRating.badgeText}`}>
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black font-martian text-white tracking-wide flex items-center gap-1.5">
                          <span>SB CERTIFICATION:</span>
                          <span className={`font-zen ${certRating.badgeText}`}>{certRating.tier}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">({certRating.tierTitle})</span>
                        </h4>
                        <span className="text-[10px] font-martian text-cyan-300">
                          Community Score: {certRating.score} Alpha Points • {certRating.percentile}
                        </span>
                      </div>
                    </div>

                    <SBCertificationBadge 
                      input={{
                        authorType: profile.authorType,
                        upvotesReceived: certRating.metrics.likesReceived,
                        thesesCount: certRating.metrics.thesesCount,
                        repliesCount: certRating.metrics.repliesCount,
                        chatCount: certRating.metrics.chatCount,
                        winRate: certRating.metrics.winRate
                      }}
                      size="xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-cyan-500/20 grid grid-cols-3 gap-2 text-[10px] font-martian text-neutral-300">
                    <div className="bg-black/50 p-1.5 alien-block-cut-sm text-center">
                      <span className="text-rose-400 block font-bold">+{certRating.breakdown.likesPoints} PTS</span>
                      <span className="text-neutral-400 text-[9px]">{certRating.metrics.likesReceived} Likes Received</span>
                    </div>
                    <div className="bg-black/50 p-1.5 alien-block-cut-sm text-center">
                      <span className="text-cyan-300 block font-bold">+{certRating.breakdown.thesesPoints} PTS</span>
                      <span className="text-neutral-400 text-[9px]">{certRating.metrics.thesesCount} Theses Published</span>
                    </div>
                    <div className="bg-black/50 p-1.5 alien-block-cut-sm text-center">
                      <span className="text-amber-300 block font-bold">+{certRating.breakdown.accuracyBonus} PTS</span>
                      <span className="text-neutral-400 text-[9px]">Calibrated Accuracy</span>
                    </div>
                  </div>
                </div>

                {/* Bio / Quant Thesis Stance */}
                <div className="p-3.5 alien-block-cut-sm bg-black/70 border border-cyan-500/30">
                  <h4 className="text-[11px] font-alien-hud text-cyan-400 uppercase flex items-center gap-1.5 mb-1.5">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    QUANT STRATEGY & PROFILE BIO
                  </h4>
                  <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                    {effectiveBio}
                  </p>
                  {effectiveStrategy && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center gap-2">
                      <span className="text-[10px] font-alien-hud uppercase text-cyan-400">Core Strategy:</span>
                      <span className="text-xs font-martian text-amber-300 font-semibold">{effectiveStrategy}</span>
                    </div>
                  )}
                </div>

                {/* Primary Ticker Watchlist */}
                <div>
                  <h4 className="text-[11px] font-alien-hud text-amber-300 uppercase flex items-center gap-1.5 mb-2">
                    <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                    PRIMARY COVERAGE ASSETS
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sampleTickers.map((ticker) => (
                      <button
                        key={ticker}
                        onClick={() => {
                          triggerHaptic("selection");
                          onClose();
                          if (onSelectStock) onSelectStock(ticker);
                        }}
                        className="px-3 py-1.5 alien-block-cut-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-martian font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:border-amber-400"
                        title={`Open $${ticker} in Watchlist`}
                      >
                        <span>${ticker}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reputation & Integrity Summary */}
                <div className="p-3 alien-block-cut-sm bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-martian text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cryptographically Authenticated on Stock Bloc</span>
                  </div>
                  <span className="font-bold">{certRating.tier} Certified Node</span>
                </div>
              </div>
            )}

            {activeTab === "badges" && (
              <div className="space-y-2.5">
                <p className="text-xs text-neutral-400 font-martian">
                  Verified achievements, calibration scores, and on-chain telemetry stamps:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {badges.map((badge, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 alien-block-cut-sm bg-black/70 border border-cyan-500/30 flex items-center gap-2.5 text-xs font-alien-hud text-cyan-200"
                    >
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "theses" && (
              <div className="space-y-3">
                <div className="p-3.5 alien-block-cut-sm bg-black/70 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs font-martian mb-1">
                    <span className="text-emerald-400 font-bold">📈 LONG $NVDA DATACENTER SUPER-CYCLE</span>
                    <span className="text-neutral-500">2d ago</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-sans">
                    Accelerated inferencing demand is compounding sovereign AI compute buildouts. Forward multiples remain conservative relative to cash-flow expansion.
                  </p>
                </div>

                <div className="p-3.5 alien-block-cut-sm bg-black/70 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs font-martian mb-1">
                    <span className="text-amber-300 font-bold">⚖️ VOLATILITY DISPERSION IN S&P 500 OPEX</span>
                    <span className="text-neutral-500">5d ago</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-sans">
                    Skew compression favors synthetic collars heading into quarterly roll date. Hedging downside tail risk with delta-neutral calendar spreads.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer Controls */}
          <div className="p-4 bg-black/90 border-t border-cyan-500/30 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                id="user-profile-follow-btn"
                onClick={handleFollowToggle}
                className={`px-3.5 py-1.5 alien-block-cut-sm text-xs font-alien-hud flex items-center gap-1.5 transition-all cursor-pointer ${
                  isFollowing
                    ? "bg-emerald-500 text-black font-bold glow-emerald"
                    : "bg-black/60 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400"
                }`}
              >
                {isFollowing ? <BellRing className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isFollowing ? "Following Signals" : "Follow Alerts"}</span>
              </button>

              <button
                id="user-profile-mention-btn"
                onClick={handleMention}
                className="px-3 py-1.5 alien-block-cut-sm bg-black/60 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 text-xs font-alien-hud flex items-center gap-1.5 transition-all cursor-pointer"
                title={`Mention ${displayUsername} in Community Chat`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mention</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile && (
                <button
                  id="user-profile-edit-btn"
                  onClick={() => {
                    triggerHaptic("selection");
                    setIsEditModalOpen(true);
                  }}
                  className="px-3 py-1.5 alien-block-cut-sm bg-black/80 border border-cyan-400/80 text-cyan-300 hover:bg-cyan-950 text-xs font-alien-hud font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}

              {isAgent && (
                <button
                  id="user-profile-neural-terminal-btn"
                  onClick={handleAgentTerminalClick}
                  className="px-3.5 py-1.5 alien-block-cut-sm bg-purple-500 text-white hover:bg-purple-400 text-xs font-alien-hud font-bold flex items-center gap-1.5 transition-all cursor-pointer glow-violet shadow-lg shadow-purple-900/40"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Neural Terminal</span>
                </button>
              )}

              <button
                id="user-profile-share-btn"
                onClick={handleShare}
                className="px-3.5 py-1.5 alien-block-cut-sm bg-cyan-400 text-black hover:bg-cyan-300 text-xs font-alien-hud font-black flex items-center gap-1.5 transition-all cursor-pointer glow-cyan"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Link Copied!" : "Share Profile"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Sub-Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={(updated) => {
            setCustomProfileData(updated);
          }}
        />
      )}
    </AnimatePresence>
  );
};

