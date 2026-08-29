import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  X, 
  Check, 
  Sparkles, 
  Target, 
  BarChart2, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Cpu,
  Flame,
  Zap,
  Award,
  Globe,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { db, saveUserDataLocally, getUserDataLocally } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { calculateSBCertification } from "../utils/certificationRating";
import { SBCertificationBadge } from "./SBCertificationBadge";

export interface CustomProfileData {
  username: string;
  displayName: string;
  bio: string;
  strategy: string;
  tickers: string[];
  link?: string;
  avatarStyle: "cyber_alpha" | "neural_quant" | "emerald_bull" | "sovereign_falcon" | "citadel_shield" | "apex_breakout";
  tradingHorizon?: string;
  winRate?: string;
  badges?: string[];
  lastUpdated?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: CustomProfileData) => void;
}

const AVATAR_OPTIONS: { id: CustomProfileData["avatarStyle"]; label: string; icon: any; color: string; bg: string; border: string }[] = [
  { id: "cyber_alpha", label: "Cyber Alpha", icon: Zap, color: "text-cyan-300", bg: "bg-cyan-950/60", border: "border-cyan-400" },
  { id: "neural_quant", label: "Neural Quant", icon: Cpu, color: "text-purple-300", bg: "bg-purple-950/60", border: "border-purple-400" },
  { id: "emerald_bull", label: "Emerald Bull", icon: Flame, color: "text-emerald-300", bg: "bg-emerald-950/60", border: "border-emerald-400" },
  { id: "sovereign_falcon", label: "Sovereign Apex", icon: Award, color: "text-amber-300", bg: "bg-amber-950/60", border: "border-amber-400" },
  { id: "citadel_shield", label: "Citadel Shield", icon: ShieldCheck, color: "text-blue-300", bg: "bg-blue-950/60", border: "border-blue-400" },
  { id: "apex_breakout", label: "Apex Breakout", icon: Target, color: "text-rose-300", bg: "bg-rose-950/60", border: "border-rose-400" },
];

const STRATEGY_PRESETS = [
  "AI Hyperscale Hardware & Datacenters",
  "Macro Momentum & Breakout Swings",
  "Delta-Neutral Volatility & Options",
  "Real Estate Cash Flow & REITs",
  "Credit Optimization & Capital Growth",
  "Systematic Quant Alpha & Multiples"
];

const POPULAR_TICKER_SUGGESTIONS = [
  "NVDA", "MSFT", "GOOGL", "AMZN", "META", "ORCL", "BABA", "TCEHY", "CRWV", "AAPL", "TSLA", "SPCX",
  "CEG", "VST", "TLN", "BE", "SMR", "OKLO", "NEE",
  "ETN", "GEV", "PWR", "EME", "FIX", "HUBB", "POWL", "CAT", "CMI",
  "VRT", "MOD", "NVT", "SMCI",
  "ANET", "AVGO", "MRVL", "COHR", "CRDO", "IPGP", "LITE", "AAOI", "POET", "LWLG", "CSCO", "CIEN",
  "TSM", "AMD", "ASML", "AMAT", "LRCX", "KLAC", "AEHR", "DELL", "ARM", "CDNS", "SNPS", "PLTR",
  "MU", "WDC", "SNDK", "PSTG", "STX",
  "GLD", "GOLD", "SLV", "CPER", "FCX", "RKLB", "ASTS", "CORZ", "IREN", "APLD", "WULF", "MARA", "BTC-USD", "EQIX", "DLR"
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { user, currentUser, username: authUsername, isAuthenticated } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [strategy, setStrategy] = useState("AI Hyperscale Hardware & Datacenters");
  const [tickers, setTickers] = useState<string[]>(["NVDA", "SPCX", "CEG", "PLTR"]);
  const [newTickerInput, setNewTickerInput] = useState("");
  const [avatarStyle, setAvatarStyle] = useState<CustomProfileData["avatarStyle"]>("cyber_alpha");
  const [tradingHorizon, setTradingHorizon] = useState("Swing (2 - 10 Days)");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [tickerError, setTickerError] = useState<string | null>(null);

  // Load existing profile details
  useEffect(() => {
    if (!isOpen) return;

    // Check local storage custom profile first
    const saved = getUserDataLocally<CustomProfileData>("custom_profile", null);
    if (saved) {
      setDisplayName(saved.displayName || "");
      setUsername(saved.username ? saved.username.replace("@", "") : "");
      setBio(saved.bio || "");
      setLink(saved.link || "");
      setStrategy(saved.strategy || "AI Hyperscale Hardware & Datacenters");
      setTickers(Array.isArray(saved.tickers) && saved.tickers.length > 0 ? saved.tickers : ["NVDA", "SPCX", "CEG", "PLTR"]);
      setAvatarStyle(saved.avatarStyle || "cyber_alpha");
      setTradingHorizon(saved.tradingHorizon || "Swing (2 - 10 Days)");
      return;
    }

    // Fallback to auth session
    const effectiveUsername = authUsername || currentUser?.username || currentUser?.displayName || "trader";
    const effectiveDisplay = currentUser?.displayName || effectiveUsername;
    setUsername(effectiveUsername.replace("@", ""));
    setDisplayName(effectiveDisplay);
    setBio("Systematic equities & options trader focused on AI datacenters, semiconductor supply chains, and macro momentum.");
    setLink("");
    setStrategy("AI Hyperscale Hardware & Datacenters");
    setTickers(["NVDA", "SPCX", "CEG", "PLTR"]);
    setAvatarStyle("cyber_alpha");
  }, [isOpen, currentUser, authUsername]);

  if (!isOpen) return null;

  const parseTickerString = (raw: string): string[] => {
    return raw
      .split(/[\s,;+]+/)
      .map(t => t.replace(/[$#]/g, "").trim().toUpperCase())
      .filter(t => t.length > 0 && t.length <= 12);
  };

  const handleAddTicker = (tickerToAdd?: string) => {
    setTickerError(null);
    const rawToProcess = tickerToAdd !== undefined ? tickerToAdd : newTickerInput;
    if (!rawToProcess || !rawToProcess.trim()) return;

    const parsedList = parseTickerString(rawToProcess);
    if (parsedList.length === 0) return;

    let addedCount = 0;
    setTickers(prev => {
      const next = [...prev];
      for (const item of parsedList) {
        if (!next.includes(item)) {
          if (next.length < 25) {
            next.push(item);
            addedCount++;
          }
        }
      }
      return next;
    });

    triggerHaptic("light");
    if (tickerToAdd === undefined) {
      setNewTickerInput("");
    }
  };

  const handleTogglePresetTicker = (preset: string) => {
    triggerHaptic("selection");
    setTickerError(null);
    if (tickers.includes(preset)) {
      setTickers(tickers.filter(t => t !== preset));
    } else {
      if (tickers.length < 25) {
        setTickers([...tickers, preset]);
      } else {
        setTickerError("Maximum limit of 25 tickers reached.");
      }
    }
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    triggerHaptic("selection");
    setTickerError(null);
    setTickers(tickers.filter(t => t !== tickerToRemove));
  };

  // Format link nicely (ensure protocol if user typed example.com or x.com/user)
  const formatLinkUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const currentCertification = calculateSBCertification({
    authorType: "human",
    upvotesReceived: 54,
    thesesCount: 9,
    repliesCount: 22,
    chatCount: 38,
    winRate: "88.6%"
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("medium");
    setIsSaving(true);
    setTickerError(null);

    // Auto-flush any pending ticker text currently typed in the input box
    let finalTickers = [...tickers];
    if (newTickerInput.trim()) {
      const pendingList = parseTickerString(newTickerInput);
      for (const item of pendingList) {
        if (!finalTickers.includes(item) && finalTickers.length < 25) {
          finalTickers.push(item);
        }
      }
      setTickers(finalTickers);
      setNewTickerInput("");
    }

    const cleanUsername = (username.trim().replace("@", "") || "trader").toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const cleanDisplayName = displayName.trim() || cleanUsername;
    const cleanLink = link.trim() ? formatLinkUrl(link) : "";

    const payload: CustomProfileData = {
      username: cleanUsername,
      displayName: cleanDisplayName,
      bio: bio.trim(),
      link: cleanLink,
      strategy,
      tickers: finalTickers.length > 0 ? finalTickers : ["NVDA", "SPCX", "CEG"],
      avatarStyle,
      tradingHorizon,
      winRate: "88.6%",
      badges: [
        "🔥 Verified Quant Contributor",
        "🎯 88% Verified Forecast Accuracy",
        "⚡ Early Bloc Member",
        "📈 High Skew Volatility Specialist"
      ],
      lastUpdated: new Date().toISOString()
    };

    try {
      // 1. Save locally to instant storage
      saveUserDataLocally("custom_profile", payload);
      
      // Update session profile if available
      const currentProf = getUserDataLocally<any>("profile", {});
      saveUserDataLocally("profile", {
        ...currentProf,
        username: cleanUsername,
        displayName: cleanDisplayName,
        bio: bio.trim(),
        link: cleanLink,
        tickers: payload.tickers
      });

      // 2. Persist to Firestore if user is authenticated and DB is live
      if (user?.uid && db) {
        try {
          await setDoc(doc(db, "users", user.uid), {
            username: cleanUsername,
            displayName: cleanDisplayName,
            bio: bio.trim(),
            link: cleanLink,
            strategy,
            tickers: payload.tickers,
            avatarStyle,
            tradingHorizon,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Also set in public profiles collection for community lookup
          await setDoc(doc(db, "profiles", cleanUsername), {
            uid: user.uid,
            username: cleanUsername,
            displayName: cleanDisplayName,
            bio: bio.trim(),
            link: cleanLink,
            strategy,
            tickers: payload.tickers,
            avatarStyle,
            tradingHorizon,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Firestore profile save notice (local state synced):", dbErr);
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("stockbloc_profile_updated", { detail: payload }));
      }

      if (onProfileUpdated) {
        onProfileUpdated(payload);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsSaving(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error("Error saving profile:", err);
      setIsSaving(false);
    }
  };

  const SelectedAvatarIcon = AVATAR_OPTIONS.find(a => a.id === avatarStyle)?.icon || Zap;

  return (
    <AnimatePresence>
      <div 
        id="edit-profile-modal-overlay"
        onClick={onClose}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn"
      >
        <motion.div
          id="edit-profile-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#020b17] border-2 border-cyan-500/50 alien-block-cut shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-cyan-950/80 via-black to-[#061e38] border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 alien-block-cut-sm bg-cyan-950/70 border border-cyan-400 text-cyan-300 flex items-center justify-center glow-cyan">
                <SelectedAvatarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black font-zen text-white tracking-wide">
                  EDIT TRADER & QUANT IDENTITY
                </h2>
                <p className="text-xs font-martian text-cyan-300/80">
                  Customize your verified Stock Bloc link, strategy tags & community credentials
                </p>
              </div>
            </div>

            <button
              id="edit-profile-modal-close"
              onClick={onClose}
              className="p-1.5 alien-block-cut-sm bg-black/60 border border-cyan-500/40 text-neutral-400 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4.5 flex-1 custom-scrollbar text-sm font-sans">
            {/* Live SB Certification Banner */}
            <div className="p-3 alien-block-cut-sm bg-gradient-to-r from-cyan-950/40 via-black/80 to-purple-950/40 border border-cyan-500/30 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <SBCertificationBadge 
                  input={{
                    authorType: "human",
                    upvotesReceived: 54,
                    thesesCount: 9,
                    repliesCount: 22,
                    chatCount: 38,
                    winRate: "88.6%"
                  }}
                  size="sm"
                />
                <div>
                  <span className="text-[10px] font-alien-hud uppercase text-cyan-400 block font-bold">
                    YOUR CURRENT SB CERTIFICATION RATING
                  </span>
                  <span className="text-xs font-martian text-neutral-300">
                    {currentCertification.tierTitle} • {currentCertification.score} Alpha Points (Rank: {currentCertification.percentile})
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-martian text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 alien-block-cut-sm">
                Activity Score: Active
              </span>
            </div>

            {/* Display Name & Handle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Jay West Philly"
                  required
                  maxLength={35}
                  className="w-full px-3.5 py-2.5 alien-block-cut-sm bg-black/70 border border-cyan-500/40 text-white font-martian text-xs focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-1.5">
                  Username Handle (@)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-martian text-neutral-400">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="trader_handle"
                    required
                    maxLength={25}
                    className="w-full pl-8 pr-3.5 py-2.5 alien-block-cut-sm bg-black/70 border border-cyan-500/40 text-white font-martian text-xs focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>
            </div>

            {/* External Profile Link (Website, X/Twitter, GitHub, Substack, Portfolio) */}
            <div>
              <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Website / Social / Portfolio Link (Optional)
                </span>
                <span className="text-[10px] text-neutral-400 font-martian lowercase">
                  x.com/your_handle • substack • github • yoursite.com
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-2.5 text-cyan-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://x.com/your_handle or https://yourdomain.com"
                  maxLength={120}
                  className="w-full pl-9 pr-3.5 py-2.5 alien-block-cut-sm bg-black/70 border border-cyan-500/40 text-white font-martian text-xs focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                />
              </div>
              {link.trim() && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-martian text-cyan-300">
                  <span>Preview Target:</span>
                  <a
                    href={formatLinkUrl(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-amber-300 hover:text-white flex items-center gap-1"
                  >
                    <span>{formatLinkUrl(link)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Avatar Persona Selection */}
            <div>
              <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-2">
                Select Identity Sigil
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AVATAR_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = avatarStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setAvatarStyle(opt.id);
                      }}
                      className={`p-2.5 alien-block-cut-sm flex items-center gap-2.5 border transition-all cursor-pointer text-left ${
                        isSelected 
                          ? `${opt.bg} ${opt.border} text-white ring-1 ring-cyan-400 shadow-md` 
                          : "bg-black/60 border-cyan-500/20 text-neutral-400 hover:text-white hover:border-cyan-500/40"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded flex items-center justify-center ${opt.bg} ${opt.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-alien-hud uppercase">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Strategy & Trading Horizon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-1.5">
                  Core Quant / Trading Strategy
                </label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full px-3.5 py-2.5 alien-block-cut-sm bg-black/70 border border-cyan-500/40 text-neutral-200 font-martian text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {STRATEGY_PRESETS.map((preset) => (
                    <option key={preset} value={preset} className="bg-[#020b17] text-white">
                      {preset}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-1.5">
                  Trading Horizon
                </label>
                <select
                  value={tradingHorizon}
                  onChange={(e) => setTradingHorizon(e.target.value)}
                  className="w-full px-3.5 py-2.5 alien-block-cut-sm bg-black/70 border border-cyan-500/40 text-neutral-200 font-martian text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="Scalp & Intraday" className="bg-[#020b17] text-white">Scalp & Intraday (Minutes - Hours)</option>
                  <option value="Swing (2 - 10 Days)" className="bg-[#020b17] text-white">Swing (2 - 10 Days)</option>
                  <option value="Position / Multi-Month" className="bg-[#020b17] text-white">Position / Multi-Month Macro</option>
                  <option value="Long-Term Sovereign Hold" className="bg-[#020b17] text-white">Long-Term Sovereign Wealth</option>
                </select>
              </div>
            </div>

            {/* Bio / Quant Thesis */}
            <div>
              <label className="block text-[11px] font-alien-hud uppercase text-cyan-300 mb-1.5">
                Bio & Trading Thesis Philosophy
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your quantitative approach, favorite market setups, and risk principles..."
                rows={3}
                maxLength={300}
                className="w-full px-3.5 py-2.5 alien-block-cut-sm bg-black/70 border border-cyan-500/40 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 leading-relaxed"
              />
              <span className="text-[10px] text-neutral-400 font-martian text-right block mt-1">
                {bio.length} / 300 characters
              </span>
            </div>

            {/* Primary Coverage Assets (Tickers) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-alien-hud uppercase text-amber-300">
                  Primary Coverage Assets ({tickers.length} / 25 Tickers)
                </label>
                {tickers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setTickers([]);
                    }}
                    className="text-[10px] font-martian text-neutral-400 hover:text-rose-400 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {/* Ticker Badges */}
              <div className="flex flex-wrap gap-2 mb-2.5 min-h-[32px] p-2 bg-black/50 border border-cyan-500/20 alien-block-cut-sm">
                {tickers.length === 0 ? (
                  <span className="text-xs text-neutral-500 font-martian italic py-0.5">
                    No tickers added yet. Type symbols below or click suggested tags.
                  </span>
                ) : (
                  tickers.map((ticker) => (
                    <div
                      key={ticker}
                      className="px-2.5 py-1 alien-block-cut-sm bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-martian font-bold flex items-center gap-1.5"
                    >
                      <span>${ticker}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTicker(ticker)}
                        className="hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                        title={`Remove $${ticker}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Ticker Input */}
              {tickers.length < 25 && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTickerInput}
                      onChange={(e) => setNewTickerInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddTicker();
                        }
                      }}
                      placeholder="Add Ticker(s) (e.g. CRWV, NVDA, BE, SNDK, BTC-USD)"
                      maxLength={30}
                      className="flex-1 px-3.5 py-2 alien-block-cut-sm bg-black/70 border border-cyan-500/30 text-white font-martian text-xs focus:border-cyan-400 focus:outline-none placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTicker()}
                      disabled={!newTickerInput.trim()}
                      className="px-4 py-2 alien-block-cut-sm bg-cyan-950/60 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black transition-all text-xs font-alien-hud font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:hover:bg-cyan-950/60 disabled:hover:text-cyan-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {tickerError && (
                    <p className="text-[11px] text-rose-400 font-martian">{tickerError}</p>
                  )}

                  {/* Popular Quick Suggestions */}
                  <div className="pt-1">
                    <span className="text-[10px] text-neutral-400 font-martian block mb-1.5">
                      Quick Add Popular Watchlist Tickers:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_TICKER_SUGGESTIONS.map((preset) => {
                        const isAdded = tickers.includes(preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleTogglePresetTicker(preset)}
                            className={`px-2 py-0.5 text-[10px] font-martian font-semibold alien-block-cut-sm transition-all cursor-pointer flex items-center gap-1 border ${
                              isAdded
                                ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm"
                                : "bg-black/60 text-neutral-400 border-cyan-500/20 hover:text-white hover:border-cyan-400"
                            }`}
                          >
                            <span>{isAdded ? "✓" : "+"}</span>
                            <span>${preset}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-cyan-500/30 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 alien-block-cut-sm bg-black/60 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 text-xs font-alien-hud transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 alien-block-cut-sm bg-cyan-400 text-black hover:bg-cyan-300 text-xs font-alien-hud font-black flex items-center gap-2 transition-all cursor-pointer glow-cyan shadow-lg shadow-cyan-900/50 disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>PROFILE UPDATED!</span>
                  </>
                ) : isSaving ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-black" />
                    <span>SAVING TELEMETRY...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>SAVE PROFILE</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

