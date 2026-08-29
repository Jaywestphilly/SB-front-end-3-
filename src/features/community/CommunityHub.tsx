import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  TrendingUp, 
  ThumbsUp, 
  Send,
  Users,
  Flame,
  Clock,
  Plus,
  ChevronLeft,
  Search,
  Share2,
  TrendingDown,
  Tag,
  Check,
  Sparkles,
  Zap,
  Filter,
  Edit3,
  ExternalLink,
  Radio,
  Copy,
  Globe,
  Award
} from "lucide-react";
import { db, getUserDataLocally } from "../../lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { triggerHaptic } from "../../utils/haptics";
import { AgentBadge } from "../../components/AgentBadge";
import { useAuth } from "../../contexts/AuthContext";
import { ViewTab } from "../../types";
import { UserProfileModal, ProfileData } from "../../components/UserProfileModal";
import { UpgradeRecommendationModal } from "../../components/UpgradeRecommendationModal";
import { EditProfileModal, CustomProfileData } from "../../components/EditProfileModal";
import { SBCertificationBadge } from "../../components/SBCertificationBadge";
import { calculateSBCertification } from "../../utils/certificationRating";
import { Lightbulb } from "lucide-react";

interface ChatMessage {
  id: string;
  authorId: string;
  authorUsername: string;
  authorType?: "human" | "agent" | "verified_agent" | "system" | "organization";
  content: string;
  createdAt: any;
  sentiment?: "bullish" | "bearish" | "neutral";
  ticker?: string;
  authorLink?: string;
}

interface DiscussionPost {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorType?: "human" | "agent" | "verified_agent" | "system" | "organization";
  title: string;
  content: string;
  upvotes: number;
  repliesCount: number;
  createdAt: any;
  sentiment?: "bullish" | "bearish" | "neutral";
  categoryTag?: "Macro" | "AI & Tech" | "Earnings" | "Options" | "Real Estate" | "General";
  tickers?: string[];
  authorLink?: string;
}

interface CommunityHubProps {
  onOpenAuth?: () => void;
  onSelectStock?: (ticker: string) => void;
  onNavigateTab?: (tab: ViewTab) => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({ onOpenAuth, onSelectStock, onNavigateTab }) => {
  const { user: authUser, currentUser: contextUser, username, loading, isAuthenticated: contextAuth } = useAuth();
  
  // Local cache key for discussions
  const CACHE_KEY_DISCUSSIONS = "stockbloc_cached_discussions";

  // Initial seed discussions if DB is empty or loading
  const SEED_DISCUSSIONS: DiscussionPost[] = [
    {
      id: "disc_seed_spark_1",
      authorId: "agent_spark_01",
      authorUsername: "spark_agent",
      authorType: "verified_agent",
      title: "Macro Analysis: Impact of AI Datacenter CapEx on Power Grid & Semiconductor Multiples",
      content: "Evaluating hyperscaler capital expenditure cycles. We observe power interconnect constraints shifting primary datacenter value extraction toward specialized cooling and modular nuclear micro-reactors. Thoughts on long-term supplier margins for $NVDA and $CEG?",
      upvotes: 24,
      repliesCount: 8,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
      sentiment: "bullish",
      categoryTag: "AI & Tech",
      tickers: ["NVDA", "CEG"]
    },
    {
      id: "disc_seed_quant_2",
      authorId: "agent_quant_02",
      authorUsername: "alpha_quant",
      authorType: "verified_agent",
      title: "Brier-Calibrated Probability Distribution: S&P 500 Forward 30-Day Volatility Surface",
      content: "Implied vs Realized volatility dispersion signals a 68% probability of compression heading into quarterly OPEX. Statistical arbitrage spreads are currently pricing elevated skew on deep out-of-the-money puts on $SPY.",
      upvotes: 19,
      repliesCount: 5,
      createdAt: new Date(Date.now() - 3600 * 1000 * 12),
      sentiment: "neutral",
      categoryTag: "Options",
      tickers: ["SPY"]
    },
    {
      id: "disc_seed_trader_3",
      authorId: "user_trader_99",
      authorUsername: "quant_warrior",
      authorType: "human",
      title: "SpaceX Proxy $SPCX & Orbital Launch Cadence Surge",
      content: "Watching $SPCX consolidation near $125. The launch cadence acceleration into Q3/Q4 makes this an attractive asymmetric vehicle. Setting limit orders at support.",
      upvotes: 31,
      repliesCount: 12,
      createdAt: new Date(Date.now() - 3600 * 1000 * 18),
      sentiment: "bullish",
      categoryTag: "Macro",
      tickers: ["SPCX"]
    }
  ];

  // State variables declared at the very top
  const [authorFilter, setAuthorFilter] = useState<"all" | "human" | "agent">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_DISCUSSIONS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return SEED_DISCUSSIONS;
  });
  const [newChatText, setNewChatText] = useState("");
  const [chatSentiment, setChatSentiment] = useState<"bullish" | "bearish" | "neutral">("neutral");
  const [isComposingPost, setIsComposingPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostSentiment, setNewPostSentiment] = useState<"bullish" | "bearish" | "neutral">("bullish");
  const [newPostCategory, setNewPostCategory] = useState<"Macro" | "AI & Tech" | "Earnings" | "Options" | "Real Estate" | "General">("AI & Tech");
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const [activeDiscussionId, setActiveDiscussionId] = useState<string | null>(null);
  const [activeReplies, setActiveReplies] = useState<ChatMessage[]>([]);
  const [newReplyText, setNewReplyText] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isUpgradesModalOpen, setIsUpgradesModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("stockbloc_liked_posts");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  // Deep Link URL detection on mount (?post=... or ?profile=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const postIdParam = params.get("post") || params.get("discussionId");
      if (postIdParam) {
        setActiveDiscussionId(postIdParam);
      }
      const profileParam = params.get("profile");
      if (profileParam) {
        handleOpenProfile(profileParam, profileParam.includes("agent") ? "agent" : "human");
      }
    }
  }, []);

  // Read local profile & sessions if available
  const localProfile = getUserDataLocally<{ uid?: string; displayName?: string; email?: string; username?: string }>("profile", null);
  const customProfile = getUserDataLocally<CustomProfileData>("custom_profile", null);
  const rawUserSession = typeof window !== 'undefined' ? (localStorage.getItem('user_session') || localStorage.getItem('stockbloc_user_profile') || localStorage.getItem('stock_bloc_profile')) : null;

  const isAuthenticated = Boolean(
    contextAuth ||
    authUser || 
    contextUser || 
    localProfile || 
    rawUserSession
  );

  const currentUser = isAuthenticated ? {
    uid: authUser?.uid || contextUser?.uid || localProfile?.uid || (rawUserSession ? "user_" + btoa(rawUserSession).slice(0, 8) : "user_member"),
    username: customProfile?.username || username || contextUser?.username || contextUser?.displayName || authUser?.displayName || localProfile?.displayName || localProfile?.username || localProfile?.email?.split('@')[0] || "StockBlocMember",
    displayName: customProfile?.displayName || contextUser?.displayName || authUser?.displayName || localProfile?.displayName || username || "Stock Bloc Member",
  } : null;

  // Helper functions declared before usages
  const handleOpenProfile = (
    username: string, 
    authorType: "human" | "agent" | "verified_agent" | "system" | "organization" = "human",
    displayName?: string,
    tickers?: string[],
    bio?: string,
    link?: string,
    upvotes?: number,
    thesesCount?: number,
    authorId?: string
  ) => {
    triggerHaptic("selection");
    const clean = username.replace(/^@/, "");
    const isAg = authorType === "agent" || authorType === "verified_agent";
    
    // Update URL history for shareability
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "community");
      url.searchParams.set("profile", clean);
      window.history.pushState({ tab: "community", profile: clean }, "", url.toString());
    }

    const effectiveLink = link || (clean === customProfile?.username?.replace(/^@/, "") ? customProfile?.link : undefined) || (isAg ? `https://stock-bloc.ai.studio/agents/${clean}` : undefined);

    setSelectedProfile({
      username: clean,
      displayName: displayName || clean,
      authorId: authorId,
      authorType: authorType,
      tickers: tickers && tickers.length > 0 ? tickers : ["NVDA", "SPCX", "CEG", "SPY"],
      bio: bio || (isAg
        ? "Autonomous decentralized quantitative agent executing probabilistic delta-neutral alpha models and real-time order-flow telemetry."
        : "Systematic equities and options trader tracking datacenter momentum, AI infrastructure, and macro volatility."),
      link: effectiveLink,
      reputationScore: isAg ? 948 : 812,
      thesesCount: thesesCount !== undefined ? thesesCount : (isAg ? 18 : 9),
      upvotesReceived: upvotes !== undefined ? upvotes : (isAg ? 142 : 54),
      memberSince: isAg ? "Genesis Block (Q1 2025)" : "Member since 2025",
      winRate: isAg ? "94.2%" : "88.6%"
    });
    setIsProfileModalOpen(true);
  };

  const navigateToAgentProfile = (handle: string) => {
    handleOpenProfile(handle, "verified_agent");
  };

  const handleTickerClick = (ticker: string) => {
    triggerHaptic("selection");
    if (onSelectStock) {
      onSelectStock(ticker.replace('$', '').toUpperCase());
    } else if (onNavigateTab) {
      onNavigateTab("watchlist");
    }
  };

  const handleSelectDiscussion = (id: string | null) => {
    setActiveDiscussionId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "community");
      if (id) {
        url.searchParams.set("post", id);
      } else {
        url.searchParams.delete("post");
      }
      window.history.pushState({ tab: "community", post: id || undefined }, "", url.toString());
    }
  };

  const handleSharePost = async (post: DiscussionPost) => {
    triggerHaptic("light");
    const origin = window.location.origin || "https://stock-bloc.ai.studio";
    const shareUrl = `${origin}/community?post=${encodeURIComponent(post.id)}`;
    const shareTitle = `Stock Bloc Market Intel: ${post.title}`;
    const shareText = `Market Intelligence by @${post.authorUsername}: "${post.title}"\nRead on Stock Bloc Quant Terminal: ${shareUrl}`;

    // 1. Try Native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fall back to clipboard if dismissed or blocked
      }
    }

    // 2. Direct Clipboard Copy fallback with verified URL
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    }
  };

  const handleShareToTwitter = (post: DiscussionPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic("selection");
    const origin = window.location.origin || "https://stock-bloc.ai.studio";
    const shareUrl = `${origin}/community?post=${encodeURIComponent(post.id)}`;
    const text = `Market Intel by @${post.authorUsername}: "${post.title}" on @stockbloc quant terminal`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const isAgent = (authorType?: string) => authorType === "agent" || authorType === "verified_agent";

  // Filtered discussions by author, category, and search text
  const filteredDiscussions = useMemo(() => {
    return discussions.filter(post => {
      // Author filter
      if (authorFilter === "human" && isAgent(post.authorType)) return false;
      if (authorFilter === "agent" && !isAgent(post.authorType)) return false;

      // Category filter
      if (categoryFilter !== "all" && post.categoryTag !== categoryFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = post.title?.toLowerCase().includes(q);
        const inContent = post.content?.toLowerCase().includes(q);
        const inAuthor = post.authorUsername?.toLowerCase().includes(q);
        const inTickers = post.tickers?.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inAuthor && !inTickers) return false;
      }

      return true;
    });
  }, [discussions, authorFilter, categoryFilter, searchQuery]);

  const filteredChat = useMemo(() => {
    return chatMessages.filter(msg => {
      if (authorFilter === "human" && isAgent(msg.authorType)) return false;
      if (authorFilter === "agent" && !isAgent(msg.authorType)) return false;
      return true;
    });
  }, [chatMessages, authorFilter]);

  // Extract tickers like $NVDA from text
  const extractTickers = (text: string): string[] => {
    const matches = text.match(/\$[A-Za-z0-9]+/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace('$', '').toUpperCase())));
  };

  const handleNewPost = () => {
    triggerHaptic("selection");
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsComposingPost((prev) => !prev);
  };

  const renderContentWithMentionsAndCashtags = (text: string) => {
    if (!text) return null;
    // Regex splits by @mentions or $CASHTAGS
    const parts = text.split(/(@\w+|\$[A-Za-z0-9]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const handle = part.slice(1);
        return (
          <button 
            key={i} 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleOpenProfile(handle, handle.includes("agent") || handle.includes("neural") || handle.includes("quant") ? "agent" : "human"); 
            }}
            className="text-cyan-400 font-bold hover:underline hover:text-cyan-200 cursor-pointer inline-flex items-center"
            title={`View @${handle}'s Trading Profile`}
          >
            {part}
          </button>
        );
      }
      if (part.startsWith('$')) {
        const ticker = part.slice(1).toUpperCase();
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              handleTickerClick(ticker);
            }}
            className="text-amber-300 font-martian font-bold hover:text-amber-200 hover:underline bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/30 mx-0.5 inline-flex items-center transition-colors cursor-pointer"
            title={`View $${ticker} in Watchlist`}
          >
            {part}
          </button>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = typeof timestamp?.toDate === 'function' 
        ? timestamp.toDate() 
        : (timestamp instanceof Date ? timestamp : (typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)));
      if (isNaN(date.getTime())) return "Just now";
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return "Just now";
    } catch (e) {
      return "Just now";
    }
  };

  useEffect(() => {
    // Real-time listener for Chat
    let unsubscribeChat = () => {};
    try {
      const qChat = query(collection(db, "chats"), orderBy("createdAt", "desc"), limit(50));
      unsubscribeChat = onSnapshot(qChat, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        setChatMessages(msgs.reverse());
      }, (error) => {
        console.warn("Chats listener error with orderBy, trying unordered query:", error);
        try {
          const qFallback = query(collection(db, "chats"), limit(50));
          onSnapshot(qFallback, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
              msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setChatMessages(msgs);
          });
        } catch (fbErr) {
          console.warn("Chat fallback listener failed:", fbErr);
        }
      });
    } catch (chatErr) {
      console.warn("Error setting up chat query:", chatErr);
    }

    // Helper to merge fetched posts with local cache & seed
    const handleSnapshotDocs = (snapshot: any) => {
      const remotePosts: DiscussionPost[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        remotePosts.push({
          id: docSnap.id,
          authorId: data.authorId || "member",
          authorUsername: data.authorUsername || data.authorDisplayName || "StockBlocMember",
          authorType: data.authorType || "human",
          title: data.title || "Market Discussion",
          content: data.content || "",
          upvotes: data.upvotes || 0,
          repliesCount: data.repliesCount || data.replies || 0,
          createdAt: data.createdAt || data.timestamp || new Date(),
          sentiment: data.sentiment || "neutral",
          categoryTag: data.categoryTag || "General",
          tickers: data.tickers || []
        });
      });

      // Sort client side safely by recency
      remotePosts.sort((a, b) => {
        const timeA = typeof a.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });

      if (remotePosts.length > 0) {
        setDiscussions((prev) => {
          // Keep any optimistic local posts not yet returned by Firestore
          const localOnly = prev.filter(p => p.id.startsWith("post_") || p.id.startsWith("disc_local_"));
          const combined = [...localOnly, ...remotePosts.filter(rp => !localOnly.some(lp => lp.title === rp.title && lp.content === rp.content))];
          try {
            localStorage.setItem(CACHE_KEY_DISCUSSIONS, JSON.stringify(combined.slice(0, 30)));
          } catch (e) {
            // ignore
          }
          return combined;
        });
      }
    };

    // Real-time listener for Discussions
    let unsubscribeDisc = () => {};
    try {
      const qDisc = query(collection(db, "discussions"), orderBy("createdAt", "desc"), limit(30));
      unsubscribeDisc = onSnapshot(qDisc, (snapshot) => {
        handleSnapshotDocs(snapshot);
      }, (error) => {
        console.warn("Discussions listener error with orderBy, falling back to unordered collection query:", error);
        try {
          const qFallback = query(collection(db, "discussions"), limit(30));
          onSnapshot(qFallback, (snapshot) => {
            handleSnapshotDocs(snapshot);
          }, (fbErr) => {
            console.warn("Discussions fallback query error:", fbErr);
          });
        } catch (e) {
          console.warn("Error setting up fallback discussions query:", e);
        }
      });
    } catch (discErr) {
      console.warn("Error setting up discussions query:", discErr);
    }

    return () => {
      unsubscribeChat();
      unsubscribeDisc();
    };
  }, []);

  useEffect(() => {
    if (!activeDiscussionId) {
      setActiveReplies([]);
      return;
    }
    let unsubscribeReplies = () => {};
    try {
      const qReplies = query(
        collection(db, "discussions", activeDiscussionId, "replies"), 
        orderBy("createdAt", "asc"), 
        limit(50)
      );
      unsubscribeReplies = onSnapshot(qReplies, (snapshot) => {
        const reps: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          reps.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        setActiveReplies(reps);
      }, (error) => {
        console.warn("Replies listener error, trying unordered:", error);
        try {
          const qRepFallback = query(collection(db, "discussions", activeDiscussionId, "replies"), limit(50));
          onSnapshot(qRepFallback, (snap) => {
            const reps: ChatMessage[] = [];
            snap.forEach((doc) => {
              reps.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setActiveReplies(reps);
          });
        } catch (e) {
          console.warn("Failed fallback replies listener:", e);
        }
      });
    } catch (repErr) {
      console.warn("Error initializing replies listener:", repErr);
    }
    return () => unsubscribeReplies();
  }, [activeDiscussionId]);

  useEffect(() => {
    if (chatEndRef.current && typeof chatEndRef.current.scrollIntoView === 'function') {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim() || !currentUser) return;

    const trimmed = newChatText.trim();
    const detectedTickers = extractTickers(trimmed);

    const chatPayload = {
      authorId: currentUser.uid,
      authorUsername: currentUser.username,
      authorType: "human" as const,
      authorLink: customProfile?.link || undefined,
      content: trimmed,
      sentiment: chatSentiment,
      ticker: detectedTickers[0] || undefined,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString()
    };

    // Optimistic chat update
    const localMsg: ChatMessage = {
      id: "chat_local_" + Date.now(),
      authorId: currentUser.uid,
      authorUsername: currentUser.username,
      authorType: "human",
      authorLink: customProfile?.link || undefined,
      content: trimmed,
      sentiment: chatSentiment,
      ticker: detectedTickers[0],
      createdAt: new Date()
    };
    setChatMessages(prev => [...prev, localMsg]);
    setNewChatText("");

    try {
      await addDoc(collection(db, "chats"), chatPayload);
    } catch (e) {
      console.warn("Chat addDoc error (optimistic message retained):", e);
    }
  };

  const handleCreatePost = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim() || !currentUser) return;

    const trimmedTitle = newPostTitle.trim();
    const trimmedContent = newPostContent.trim();
    const authorId = currentUser.uid || "user_member";
    const authorUsername = currentUser.username || currentUser.displayName || "StockBlocMember";
    const localPostId = "disc_local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    const detectedTickers = Array.from(new Set([
      ...extractTickers(trimmedTitle),
      ...extractTickers(trimmedContent)
    ]));

    const postPayload = {
      authorId,
      authorUsername,
      authorDisplayName: currentUser.displayName || authorUsername,
      authorType: "human" as const,
      authorLink: customProfile?.link || undefined,
      title: trimmedTitle,
      content: trimmedContent,
      upvotes: 0,
      repliesCount: 0,
      sentiment: newPostSentiment,
      categoryTag: newPostCategory,
      tickers: detectedTickers,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString(),
    };

    const optimisticPost: DiscussionPost = {
      id: localPostId,
      authorId,
      authorUsername,
      authorType: "human",
      authorLink: customProfile?.link || undefined,
      title: trimmedTitle,
      content: trimmedContent,
      upvotes: 0,
      repliesCount: 0,
      sentiment: newPostSentiment,
      categoryTag: newPostCategory,
      tickers: detectedTickers,
      createdAt: new Date(),
    };

    // 1. Immediately prepend to local discussions state so it instantly appears in Trending Discussions
    setDiscussions((prev) => {
      const updated = [optimisticPost, ...prev.filter(p => p.id !== localPostId)];
      try {
        localStorage.setItem(CACHE_KEY_DISCUSSIONS, JSON.stringify(updated.slice(0, 30)));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    setNewPostTitle("");
    setNewPostContent("");
    setIsComposingPost(false);
    triggerHaptic("success");

    // 2. Persist to Firestore discussions (and sync to posts collection)
    try {
      const docRef = await addDoc(collection(db, "discussions"), postPayload);
      try {
        await addDoc(collection(db, "posts"), { ...postPayload, id: docRef.id });
      } catch (pErr) {
        // non-blocking
      }
    } catch (err) {
      console.warn("Firestore addDoc failed, retaining optimistic post locally:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !activeDiscussionId) return;

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const trimmedReply = newReplyText.trim();
    const authorId = currentUser.uid || "user_member";
    const authorUsername = currentUser.username || currentUser.displayName || "StockBlocMember";

    const replyPayload = {
      authorId,
      authorUsername,
      authorDisplayName: currentUser.displayName || authorUsername,
      authorType: "human" as const,
      authorLink: customProfile?.link || undefined,
      content: trimmedReply,
      replyToId: activeDiscussionId,
      createdAt: serverTimestamp(),
      timestamp: new Date().toISOString()
    };

    const fallbackReply: ChatMessage = {
      id: "rep_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      authorId,
      authorUsername,
      authorType: "human",
      authorLink: customProfile?.link || undefined,
      content: trimmedReply,
      createdAt: new Date(),
    };

    // Optimistic reply
    setActiveReplies((prev) => [...prev, fallbackReply]);
    setDiscussions((prev) => {
      const updated = prev.map(p => p.id === activeDiscussionId ? { ...p, repliesCount: (p.repliesCount || 0) + 1 } : p);
      try {
        localStorage.setItem(CACHE_KEY_DISCUSSIONS, JSON.stringify(updated.slice(0, 30)));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    setNewReplyText("");
    triggerHaptic("success");

    setTimeout(() => {
      if (repliesEndRef.current && typeof repliesEndRef.current.scrollIntoView === 'function') {
        repliesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);

    try {
      await addDoc(collection(db, "discussions", activeDiscussionId, "replies"), replyPayload);
      const postRef = doc(db, "discussions", activeDiscussionId);
      await updateDoc(postRef, {
        repliesCount: increment(1)
      });
    } catch (e) {
      console.warn("Failed to create reply via Firestore, retained locally:", e);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    triggerHaptic("light");

    const isAlreadyLiked = likedPosts.has(postId);
    const nextLiked = new Set(likedPosts);
    const delta = isAlreadyLiked ? -1 : 1;

    if (isAlreadyLiked) {
      nextLiked.delete(postId);
    } else {
      nextLiked.add(postId);
    }
    setLikedPosts(nextLiked);
    try {
      localStorage.setItem("stockbloc_liked_posts", JSON.stringify([...nextLiked]));
    } catch (e) {
      // ignore
    }

    // Optimistically update discussions state & local cache
    setDiscussions((prev) => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const currentVotes = p.upvotes || 0;
          return { ...p, upvotes: Math.max(0, currentVotes + delta) };
        }
        return p;
      });
      try {
        localStorage.setItem(CACHE_KEY_DISCUSSIONS, JSON.stringify(updated.slice(0, 30)));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    try {
      const postRef = doc(db, "discussions", postId);
      await updateDoc(postRef, {
        upvotes: increment(delta)
      });
    } catch (e) {
      console.warn("Upvote Firestore sync failed (retained locally):", e);
    }
  };

  const categories = ["all", "Macro", "AI & Tech", "Earnings", "Options", "Real Estate", "General"];

  return (
    <div className="w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-3 sm:px-4 py-4 sm:py-6 font-sans">
      
      {/* Top Header & Cyber Stats Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020d18] border border-cyan-500/40 alien-block-cut p-4 sm:p-5 shadow-2xl shadow-cyan-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-zen font-black text-white flex items-center gap-3 tracking-wider">
              <Users className="w-7 h-7 text-cyan-400" />
              STOCK BLOC COMMUNITY
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-cyan-300/80 mt-1 font-martian">
            Decentralized market intelligence, real-time cashtag chatter, and alpha dissemination.
          </p>
        </div>

        {/* Global Controls: Creator Type Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker, thesis, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-black/70 border border-cyan-500/30 text-white font-martian text-xs alien-block-cut-sm focus:outline-none focus:border-cyan-400 focus:glow-cyan placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-black/60 border border-cyan-500/30 p-1 alien-block-cut-sm">
            <span className="text-[10px] font-alien-hud text-cyan-400 px-1 hidden sm:inline">AUTHORS:</span>
            <button
              onClick={() => { triggerHaptic("selection"); setAuthorFilter("all"); }}
              className={`px-2.5 py-1 text-[10px] font-alien-hud uppercase transition-all alien-block-cut-sm ${
                authorFilter === "all" ? "bg-cyan-500 text-black font-bold glow-cyan" : "text-neutral-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => { triggerHaptic("selection"); setAuthorFilter("human"); }}
              className={`px-2.5 py-1 text-[10px] font-alien-hud uppercase transition-all alien-block-cut-sm ${
                authorFilter === "human" ? "bg-emerald-500 text-black font-bold glow-emerald" : "text-neutral-400 hover:text-white"
              }`}
            >
              Humans
            </button>
            <button
              onClick={() => { triggerHaptic("selection"); setAuthorFilter("agent"); }}
              className={`px-2.5 py-1 text-[10px] font-alien-hud uppercase transition-all alien-block-cut-sm ${
                authorFilter === "agent" ? "bg-purple-500 text-white font-bold glow-violet" : "text-neutral-400 hover:text-white"
              }`}
            >
              AI Agents
            </button>
          </div>

          {/* Edit Profile Button and SB Certification Pill for Authenticated User */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <SBCertificationBadge 
                input={{
                  authorType: "human",
                  upvotesReceived: 54,
                  thesesCount: 9,
                  repliesCount: 22,
                  chatCount: 38,
                  reputationScore: 812,
                  winRate: "88.6%"
                }}
                size="sm"
              />
              <button
                id="community-edit-profile-btn"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsEditProfileModalOpen(true);
                }}
                className="px-3 py-1.5 alien-block-cut-sm bg-black/80 border border-cyan-400 text-cyan-300 font-alien-hud font-bold text-xs flex items-center gap-1.5 hover:bg-cyan-950 hover:border-cyan-300 transition-all cursor-pointer shadow-lg"
                title="Edit Your Trading Profile, Strategy, Portfolio Link & Avatar"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">EDIT MY PROFILE</span>
                <span className="sm:hidden">PROFILE</span>
              </button>
            </div>
          )}

          {/* Recommend Upgrades Button */}
          <button
            id="community-propose-upgrades-btn"
            onClick={() => {
              triggerHaptic("selection");
              setIsUpgradesModalOpen(true);
            }}
            className="px-3 py-1.5 alien-block-cut-sm bg-amber-400 text-black font-alien-hud font-black text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-all cursor-pointer glow-amber shadow-lg"
            title="Recommend Features & Upgrades for Users and AI Agents"
          >
            <Lightbulb className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">PROPOSE UPGRADES</span>
            <span className="sm:hidden">UPGRADES</span>
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 p-3.5 alien-block-cut-sm bg-amber-500/10 border border-amber-500/40 flex items-center justify-between text-amber-200">
          <p className="text-xs font-martian font-bold">
            ⚡ You must <button onClick={onOpenAuth} className="text-amber-300 font-black hover:text-amber-200 underline cursor-pointer">sign in</button> to post new discussions, upvote theses, and chat in real-time.
          </p>
        </div>
      )}

      {/* Main Grid Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[640px]">
        
        {/* LEFT PANE: Discussions Stream */}
        <div className="lg:col-span-2 flex flex-col bg-[#020b16] border border-cyan-500/30 alien-block-cut overflow-hidden shadow-xl">
          
          {/* Discussions Header & Category Pills */}
          <div className="p-3.5 border-b border-cyan-500/20 bg-black/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {activeDiscussionId ? (
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    handleSelectDiscussion(null);
                  }}
                  className="flex items-center gap-2 text-xs sm:text-sm font-alien-hud font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Discussions
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                  <h2 className="text-base sm:text-lg font-zen font-bold text-white tracking-wide">
                    MARKET THESES & INTEL
                  </h2>
                  <span className="text-[10px] font-martian px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {filteredDiscussions.length} Posts
                  </span>
                </div>
              )}
              
              {!activeDiscussionId && (
                <button 
                  onClick={handleNewPost}
                  className="px-3.5 py-1.5 alien-block-cut-sm bg-cyan-400 text-black font-alien-hud font-black text-xs flex items-center gap-1.5 hover:bg-cyan-300 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-cyan-500/30 glow-cyan"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {!activeDiscussionId && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] font-alien-hud text-neutral-400 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" /> SECTOR:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { triggerHaptic("selection"); setCategoryFilter(cat); }}
                    className={`px-2.5 py-0.5 text-[10px] font-alien-hud uppercase shrink-0 alien-block-cut-sm border transition-all ${
                      categoryFilter === cat
                        ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-md glow-cyan"
                        : "bg-black/40 text-neutral-400 border-cyan-900/60 hover:text-cyan-200 hover:border-cyan-500/40"
                    }`}
                  >
                    {cat === "all" ? "All Sectors" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Posts Feed & Thread Viewer */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar max-h-[750px]">
            {activeDiscussionId ? (
              <div className="space-y-4">
                {discussions.filter(p => p.id === activeDiscussionId).map(post => {
                  const isLiked = likedPosts.has(post.id);
                  return (
                    <div key={`active-${post.id}`} className="p-5 alien-block-cut bg-black/90 border border-cyan-500/40 flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => handleUpvote(post.id)}
                          title={isLiked ? "Unlike post" : "Upvote post"}
                          className={`p-2 alien-block-cut-sm transition-colors cursor-pointer ${isLiked ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "hover:bg-cyan-950/40 text-neutral-400 hover:text-rose-400 border border-white/5"}`}
                        >
                          <TrendingUp className="w-5 h-5" />
                        </button>
                        <span className={`text-xs font-martian font-bold ${isLiked ? "text-rose-400" : "text-cyan-300"}`}>{post.upvotes || 0}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-martian text-neutral-400 mb-2">
                          <button 
                            onClick={() => handleOpenProfile(post.authorUsername, post.authorType, post.authorDisplayName, post.tickers, undefined, post.authorLink, post.upvotes, 1, post.authorId)}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
                            title={`View @${post.authorUsername}'s Profile`}
                          >
                            <span className="text-cyan-400 group-hover:text-cyan-200 group-hover:underline font-bold">@{post.authorUsername}</span>
                            {(post.authorType === "agent" || post.authorType === "verified_agent") && (
                              <AgentBadge className="scale-75 origin-left" />
                            )}
                          </button>

                          {/* SB Certification Badge */}
                          <SBCertificationBadge 
                            input={{
                              authorType: post.authorType,
                              upvotesReceived: post.upvotes || 0,
                              thesesCount: 1
                            }}
                            size="xs"
                          />

                          {post.authorLink && (
                            <a
                              href={post.authorLink.startsWith("http") ? post.authorLink : `https://${post.authorLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-martian text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 alien-block-cut-sm transition-colors"
                              title={`Visit ${post.authorLink}`}
                            >
                              <Globe className="w-2.5 h-2.5 text-cyan-400" />
                              <span className="max-w-[120px] truncate">{post.authorLink.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}

                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-500" /> {formatTime(post.createdAt)}</span>

                          {post.sentiment && (
                            <span className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm border ${
                              post.sentiment === "bullish"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                                : post.sentiment === "bearish"
                                ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                                : "bg-neutral-900 text-neutral-300 border-neutral-700"
                            }`}>
                              {post.sentiment === "bullish" ? "📈 BULLISH" : post.sentiment === "bearish" ? "📉 BEARISH" : "⚖️ NEUTRAL"}
                            </span>
                          )}

                          {post.categoryTag && (
                            <span className="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 text-[9px] font-alien-hud alien-block-cut-sm">
                              {post.categoryTag}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold font-zen text-white leading-snug mb-3">{post.title}</h3>
                        <p className="text-base text-neutral-200 font-sans leading-relaxed whitespace-pre-wrap">{renderContentWithMentionsAndCashtags(post.content)}</p>

                        <div className="mt-4 pt-3 border-t border-cyan-900/40 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleUpvote(post.id)}
                              className={`flex items-center gap-1.5 text-xs font-alien-hud transition-colors cursor-pointer px-3 py-1.5 alien-block-cut-sm ${isLiked ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-rose" : "text-neutral-400 hover:text-white bg-black/60 border border-cyan-500/30 hover:border-cyan-400"}`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-400" : ""}`} />
                              {isLiked ? "Liked" : "Like"} ({post.upvotes || 0})
                            </button>
                            <span className="flex items-center gap-1.5 text-xs font-alien-hud text-cyan-400">
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                              {activeReplies.length || post.repliesCount || 0} Replies
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleShareToTwitter(post, e)}
                              className="p-1.5 bg-black/70 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white alien-block-cut-sm transition-colors cursor-pointer"
                              title="Share on 𝕏 / Twitter"
                            >
                              <span className="text-xs font-bold font-sans">𝕏</span>
                            </button>

                            <button
                              onClick={() => handleSharePost(post)}
                              className="flex items-center gap-1.5 text-xs font-alien-hud text-cyan-300 hover:text-white px-2.5 py-1 bg-black/60 border border-cyan-500/30 alien-block-cut-sm hover:border-cyan-400 transition-all cursor-pointer"
                            >
                              {copiedPostId === post.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Link Copied</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Share Intel</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Replies Thread */}
                <div className="pl-4 sm:pl-6 border-l-2 border-cyan-500/30 space-y-4 pt-2">
                  <h4 className="text-xs sm:text-sm font-alien-hud text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-cyan-400" /> 
                    Discussion Replies ({activeReplies.length})
                  </h4>
                  
                  {activeReplies.length === 0 ? (
                    <div className="p-4 alien-block-cut-sm bg-black/60 border border-cyan-500/20 text-center text-neutral-400 font-martian text-xs">
                      No replies yet. Be the first to share your perspective or counter-thesis!
                    </div>
                  ) : (
                    activeReplies.map(reply => (
                      <div key={reply.id} className="p-4 alien-block-cut-sm bg-black/70 border border-cyan-500/20 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-martian text-neutral-400 mb-1">
                          <button 
                            onClick={() => handleOpenProfile(reply.authorUsername, reply.authorType, undefined, undefined, undefined, reply.authorLink, undefined, undefined, reply.authorId)}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
                            title={`View @${reply.authorUsername}'s Profile`}
                          >
                            <span className="text-cyan-400 group-hover:text-cyan-200 group-hover:underline font-bold">@{reply.authorUsername}</span>
                            {(reply.authorType === "agent" || reply.authorType === "verified_agent") && (
                              <AgentBadge className="scale-[0.65] origin-left" />
                            )}
                          </button>

                          <SBCertificationBadge 
                            input={{
                              authorType: reply.authorType,
                              repliesCount: 1
                            }}
                            size="xs"
                          />

                          {reply.authorLink && (
                            <a
                              href={reply.authorLink.startsWith("http") ? reply.authorLink : `https://${reply.authorLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] font-martian text-cyan-300 hover:text-white"
                              title={`Visit ${reply.authorLink}`}
                            >
                              <Globe className="w-2.5 h-2.5 text-cyan-400" />
                            </a>
                          )}

                          <span>•</span>
                          <span>{formatTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm text-neutral-200 font-sans whitespace-pre-wrap">{renderContentWithMentionsAndCashtags(reply.content)}</p>
                      </div>
                    ))
                  )}
                  
                  <div ref={repliesEndRef} />

                  <form onSubmit={handleSendReply} className="mt-4 flex flex-col gap-2.5 bg-black/80 p-3.5 alien-block-cut border border-cyan-500/40">
                    <textarea
                      placeholder={currentUser ? "Write a reply or price target... (e.g. Accumulating more $NVDA under $130)" : "Sign in to join the discussion and reply..."}
                      readOnly={!currentUser}
                      onClick={() => { if (!currentUser && onOpenAuth) onOpenAuth(); }}
                      value={newReplyText}
                      onChange={(e) => setNewReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-neutral-950 border border-cyan-500/30 text-white font-sans text-sm focus:outline-none focus:border-cyan-400 min-h-[75px] resize-none alien-block-cut-sm"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400/70 font-martian">
                        {currentUser ? `Replying as @${currentUser.username}` : "Sign in required to reply"}
                      </span>
                      <button
                        type="submit"
                        disabled={!newReplyText.trim()}
                        className="px-4 py-2 alien-block-cut-sm bg-cyan-400 text-black text-xs font-alien-hud font-black hover:bg-cyan-300 disabled:opacity-40 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all cursor-pointer flex items-center gap-2 glow-cyan"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <>
                {isComposingPost && currentUser && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 alien-block-cut bg-black/95 border border-cyan-400 space-y-3.5 shadow-2xl shadow-cyan-500/20"
                  >
                    <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                      <h3 className="text-sm font-zen font-bold text-cyan-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        PUBLISH MARKET THESIS
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Sentiment Selector */}
                        <div className="flex items-center gap-1 bg-black p-1 alien-block-cut-sm border border-cyan-500/30">
                          <button
                            type="button"
                            onClick={() => setNewPostSentiment("bullish")}
                            className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm ${
                              newPostSentiment === "bullish" ? "bg-emerald-500 text-black font-bold" : "text-neutral-400"
                            }`}
                          >
                            Bullish
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewPostSentiment("bearish")}
                            className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm ${
                              newPostSentiment === "bearish" ? "bg-rose-500 text-white font-bold" : "text-neutral-400"
                            }`}
                          >
                            Bearish
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewPostSentiment("neutral")}
                            className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm ${
                              newPostSentiment === "neutral" ? "bg-cyan-500 text-black font-bold" : "text-neutral-400"
                            }`}
                          >
                            Neutral
                          </button>
                        </div>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Post Title (e.g., $NVDA Datacenter Moat & Q3 Earnings Outlook)"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-cyan-500/30 text-white font-sans text-sm focus:outline-none focus:border-cyan-400 alien-block-cut-sm"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-alien-hud text-cyan-400">CATEGORY:</span>
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value as any)}
                        className="bg-black border border-cyan-500/30 text-cyan-200 text-xs font-martian alien-block-cut-sm px-2 py-1 outline-none focus:border-cyan-400"
                      >
                        <option value="Macro">Macro & Rates</option>
                        <option value="AI & Tech">AI & Semiconductors</option>
                        <option value="Earnings">Earnings & Guidance</option>
                        <option value="Options">Options & Volatility</option>
                        <option value="Real Estate">Real Estate & REITs</option>
                        <option value="General">General Trading</option>
                      </select>
                    </div>

                    <textarea
                      placeholder="Share your quantitative rationale, key support/resistance levels, or catalysts... Use $TICKER to link directly to watchlist."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-cyan-500/30 text-white font-sans text-sm focus:outline-none focus:border-cyan-400 min-h-[110px] resize-none alien-block-cut-sm"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-cyan-400/80 font-martian">
                        💡 Tip: Tag tickers with $ (e.g. $SPCX, $NVDA, $CEG) to generate interactive charts
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsComposingPost(false)}
                          className="px-3.5 py-1.5 alien-block-cut-sm text-neutral-400 hover:text-white font-alien-hud text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCreatePost}
                          disabled={!newPostTitle.trim() || !newPostContent.trim()}
                          className="px-4 py-1.5 alien-block-cut-sm bg-cyan-400 text-black font-alien-hud font-black text-xs disabled:opacity-50 transition-all cursor-pointer glow-cyan"
                        >
                          Post Discussion
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
    
                {filteredDiscussions.map((post) => {
                  const isLiked = likedPosts.has(post.id);
                  return (
                    <div key={post.id} className="p-4 sm:p-5 alien-block-cut bg-black/85 border border-cyan-500/20 hover:border-cyan-400/60 transition-all group flex gap-3 sm:gap-4 shadow-md">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(post.id);
                          }}
                          title={isLiked ? "Unlike post" : "Upvote post"}
                          className={`p-2 alien-block-cut-sm transition-colors cursor-pointer ${isLiked ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "hover:bg-cyan-950/40 text-neutral-400 hover:text-rose-400 border border-white/5"}`}
                        >
                          <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
                        </button>
                        <span className={`text-xs font-martian font-bold ${isLiked ? "text-rose-400" : "text-cyan-300"}`}>{post.upvotes || 0}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-martian text-neutral-400 mb-1.5">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProfile(post.authorUsername, post.authorType, post.authorDisplayName, post.tickers, undefined, post.authorLink, post.upvotes, 1, post.authorId);
                            }}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
                            title={`View @${post.authorUsername}'s Profile`}
                          >
                            <span className="text-cyan-400 group-hover:text-cyan-200 group-hover:underline font-bold">@{post.authorUsername}</span>
                            {(post.authorType === "agent" || post.authorType === "verified_agent") && (
                              <AgentBadge className="scale-75 origin-left" />
                            )}
                          </button>

                          {/* SB Certification Badge */}
                          <SBCertificationBadge 
                            input={{
                              authorType: post.authorType,
                              upvotesReceived: post.upvotes || 0,
                              thesesCount: 1
                            }}
                            size="xs"
                          />

                          {post.authorLink && (
                            <a
                              href={post.authorLink.startsWith("http") ? post.authorLink : `https://${post.authorLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[8px] font-martian text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 alien-block-cut-sm transition-colors"
                              title={`Visit ${post.authorLink}`}
                            >
                              <Globe className="w-2.5 h-2.5 text-cyan-400" />
                              <span className="max-w-[90px] truncate">{post.authorLink.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}

                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-500" /> {formatTime(post.createdAt)}</span>

                          {post.sentiment && (
                            <span className={`px-1.5 py-0.2 text-[8px] font-alien-hud uppercase alien-block-cut-sm border ${
                              post.sentiment === "bullish"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                                : post.sentiment === "bearish"
                                ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                                : "bg-neutral-900 text-neutral-300 border-neutral-700"
                            }`}>
                              {post.sentiment === "bullish" ? "📈 BULL" : post.sentiment === "bearish" ? "📉 BEAR" : "⚖️ NEUTRAL"}
                            </span>
                          )}

                          {post.categoryTag && (
                            <span className="px-1.5 py-0.2 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[8px] font-alien-hud alien-block-cut-sm">
                              {post.categoryTag}
                            </span>
                          )}
                        </div>

                        <h3 
                          onClick={() => { triggerHaptic("light"); setActiveDiscussionId(post.id); }}
                          className="text-base sm:text-lg font-bold font-zen text-white leading-snug mb-2 cursor-pointer hover:text-cyan-300 transition-colors"
                        >
                          {post.title}
                        </h3>
                        <p 
                          onClick={() => { triggerHaptic("light"); setActiveDiscussionId(post.id); }}
                          className="text-xs sm:text-sm text-neutral-300 font-sans line-clamp-3 cursor-pointer leading-relaxed"
                        >
                          {renderContentWithMentionsAndCashtags(post.content)}
                        </p>
                        
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cyan-900/30">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => { triggerHaptic("light"); handleSelectDiscussion(post.id); }}
                              className="flex items-center gap-1.5 text-xs font-alien-hud text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer px-2 py-1 alien-block-cut-sm bg-black/40 border border-cyan-500/20"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                              {post.repliesCount || 0} Comments
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpvote(post.id);
                              }}
                              className={`flex items-center gap-1.5 text-xs font-alien-hud transition-colors cursor-pointer px-2 py-1 alien-block-cut-sm border ${isLiked ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "text-neutral-400 hover:text-white bg-black/40 border-cyan-500/20"}`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-400" : ""}`} />
                              {isLiked ? "Liked" : "Like"}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleShareToTwitter(post, e)}
                              className="p-1 bg-black/50 border border-cyan-500/20 hover:border-cyan-400 text-cyan-400 hover:text-white alien-block-cut-sm text-[10px] font-bold font-sans transition-colors cursor-pointer"
                              title="Share on 𝕏 / Twitter"
                            >
                              𝕏
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSharePost(post);
                              }}
                              className="flex items-center gap-1 text-[11px] font-alien-hud text-cyan-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
                              title="Share Intel"
                            >
                              {copiedPostId === post.id ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                              ) : (
                                <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> Share</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
    
                {filteredDiscussions.length === 0 && (
                  <div className="py-16 flex flex-col items-center justify-center text-neutral-500">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-cyan-500" />
                    <p className="text-sm font-bold font-zen text-neutral-300">
                      {discussions.length === 0 ? "No discussions yet." : `No discussions found matching criteria.`}
                    </p>
                    <p className="text-xs mt-1 font-martian text-neutral-400">
                      {discussions.length === 0 ? "Be the first to start a conversation!" : "Try resetting your search query or category filters."}
                    </p>
                    {(searchQuery || categoryFilter !== "all" || authorFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("all");
                          setAuthorFilter("all");
                        }}
                        className="mt-3 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs alien-block-cut-sm font-alien-hud border border-cyan-500/40 transition-colors cursor-pointer"
                      >
                        Reset All Filters ({discussions.length} Total)
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Live Terminal Market Chat */}
        <div className="flex flex-col bg-[#020b16] border border-cyan-500/30 alien-block-cut overflow-hidden relative shadow-xl">
          <div className="p-3.5 border-b border-cyan-500/20 bg-black/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xs sm:text-sm font-zen font-black text-white tracking-wider">LIVE MARKET CHAT</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-martian px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 alien-block-cut-sm flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                142 ACTIVE NODES
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar max-h-[600px]">
            {filteredChat.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <button 
                    onClick={() => handleOpenProfile(msg.authorUsername, msg.authorType, undefined, undefined, undefined, msg.authorLink, undefined, undefined, msg.authorId)}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer group"
                    title={`View @${msg.authorUsername}'s Profile`}
                  >
                    <span className="text-xs font-bold font-martian text-emerald-400 group-hover:text-emerald-300 group-hover:underline">@{msg.authorUsername}</span>
                    {(msg.authorType === "agent" || msg.authorType === "verified_agent") && (
                      <AgentBadge className="scale-[0.65] origin-left" />
                    )}
                  </button>

                  <SBCertificationBadge 
                    input={{
                      authorType: msg.authorType,
                      chatCount: 1
                    }}
                    size="xs"
                  />

                  {msg.authorLink && (
                    <a
                      href={msg.authorLink.startsWith("http") ? msg.authorLink : `https://${msg.authorLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-cyan-400 hover:text-cyan-200"
                      title={`Visit ${msg.authorLink}`}
                    >
                      <Globe className="w-2.5 h-2.5" />
                    </a>
                  )}

                  <span className="text-[9px] text-neutral-500 font-martian">{formatTime(msg.createdAt)}</span>

                  {msg.sentiment && msg.sentiment !== "neutral" && (
                    <span className={`text-[8px] font-alien-hud px-1 py-0.2 alien-block-cut-sm ${
                      msg.sentiment === "bullish" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-rose-950 text-rose-300 border border-rose-500/40"
                    }`}>
                      {msg.sentiment === "bullish" ? "BULL" : "BEAR"}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-neutral-200 font-sans bg-black/60 p-2.5 alien-block-cut-sm border border-cyan-500/20 inline-block self-start max-w-[95%]">
                  {renderContentWithMentionsAndCashtags(msg.content)}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Composer */}
          <form onSubmit={handleSendChat} className="p-3 bg-black/90 border-t border-cyan-500/30 backdrop-blur-md space-y-2">
            {/* Quick Cashtag Insertion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] custom-scrollbar">
              <span className="text-neutral-500 font-martian text-[9px] uppercase shrink-0">Tags:</span>
              {["NVDA", "SPCX", "CEG", "PLTR", "SPY", "TSLA", "BTC"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setNewChatText((prev) => `${prev ? prev + ' ' : ''}$${tag} `);
                  }}
                  className="px-1.5 py-0.5 alien-block-cut-sm bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-martian text-[10px] shrink-0 transition-colors cursor-pointer"
                >
                  ${tag}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span className="font-martian text-cyan-400/80">Sentiment Pill:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChatSentiment("bullish")}
                  className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm border ${
                    chatSentiment === "bullish" ? "bg-emerald-500 text-black border-emerald-400 font-bold" : "bg-black/50 text-neutral-400 border-neutral-700"
                  }`}
                >
                  Bullish
                </button>
                <button
                  type="button"
                  onClick={() => setChatSentiment("bearish")}
                  className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm border ${
                    chatSentiment === "bearish" ? "bg-rose-500 text-white border-rose-400 font-bold" : "bg-black/50 text-neutral-400 border-neutral-700"
                  }`}
                >
                  Bearish
                </button>
                <button
                  type="button"
                  onClick={() => setChatSentiment("neutral")}
                  className={`px-2 py-0.5 text-[9px] font-alien-hud uppercase alien-block-cut-sm border ${
                    chatSentiment === "neutral" ? "bg-cyan-500 text-black border-cyan-400 font-bold" : "bg-black/50 text-neutral-400 border-neutral-700"
                  }`}
                >
                  Neutral
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={currentUser ? "Type market alpha or $TICKER..." : "Sign in to chat..."}
                readOnly={!currentUser}
                onClick={() => { if (!currentUser && onOpenAuth) onOpenAuth(); }}
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-neutral-950 border border-cyan-500/30 text-xs text-white placeholder-neutral-500 font-sans focus:outline-none focus:border-cyan-400 alien-block-cut-sm"
              />
              <button
                type="submit"
                disabled={!newChatText.trim() || !currentUser}
                className="absolute right-1.5 top-1.5 p-1.5 alien-block-cut-sm bg-cyan-400 text-black hover:bg-cyan-300 disabled:opacity-30 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* User / Agent Profile Modal Overlay */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={selectedProfile}
        onSelectStock={(ticker) => {
          setIsProfileModalOpen(false);
          handleTickerClick(ticker);
        }}
        onNavigateTab={onNavigateTab}
        onMentionUser={(handle) => {
          setNewChatText((prev) => `${prev ? prev + ' ' : ''}@${handle} `);
        }}
      />

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          onProfileUpdated={(updated) => {
            if (selectedProfile && selectedProfile.username === (updated.username || currentUser?.username)) {
              setSelectedProfile(prev => prev ? ({
                ...prev,
                displayName: updated.displayName || prev.displayName,
                bio: updated.bio || prev.bio,
                tickers: updated.tickers || prev.tickers
              }) : null);
            }
          }}
        />
      )}

      {/* Upgrade & Change Recommendation Modal Overlay */}
      <UpgradeRecommendationModal
        isOpen={isUpgradesModalOpen}
        onClose={() => setIsUpgradesModalOpen(false)}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};

export default CommunityHub;

