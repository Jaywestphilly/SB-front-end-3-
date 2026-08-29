
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  }
};

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import {
  UserCheck,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Bell,
  Bookmark,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Key,
  Lock,
  Zap,
  Copy,
  CreditCard,
  ExternalLink,
  Download,
  BookOpen,
  Library,
  Eye,
  FileText,
  Watch,
} from "lucide-react";
import { NotFinancialAdviceTag } from "../../components/NotFinancialAdviceTag";
import { StockTicker, ViewTab } from "../../types";
import { triggerHaptic } from "../../utils/haptics";
import { PdfPreviewModal } from "../../components/PdfPreviewModal";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useUserStore } from "../../stores/userStore";


import { useAuth } from "../../contexts/AuthContext";

interface PortfolioPosition {
  id: string;
  symbol: string;
  shares: number;
  avgCost: number;
  targetPrice?: number;
  notes?: string;
}

interface UserPreferences {
  themeIntensity: "cyber_dark" | "high_contrast" | "stealth";
  defaultTab: ViewTab;
  priceAlertThreshold: number; // e.g. 5%
  rsiExtremeThreshold: number; // e.g. 30
}

interface MyBlocDashboardProps {
  stocks: StockTicker[];
  onSelectStock: (stock: StockTicker) => void;
  onSelectTab: (tab: ViewTab) => void;
  onOpenAuth: () => void;
}

export const MyBlocDashboard: React.FC<MyBlocDashboardProps> = ({
  stocks,
  onSelectStock,
  onSelectTab,
  onOpenAuth,
}) => {
  const { user: currentUser } = useAuth();
  // Inner dashboard tab state
  const [activeDashboardTab, setActiveDashboardTab] = useState<"overview" | "settings">("overview");
  const { starredTickers, setStarredTickers, clearUserStorage } = useUserStore();
  
  // Helper to load positions and merge any newly saved watchlist paper trades
  const loadPositionsFromStorage = useCallback((): PortfolioPosition[] => {
    try {
      const savedPortfolio = safeStorage.getItem("stockbloc_portfolio_positions");
      let currentPositions: PortfolioPosition[] = savedPortfolio ? JSON.parse(savedPortfolio) : [];

      const savedPaperTrades = safeStorage.getItem("stockbloc_paper_trades");
      if (savedPaperTrades) {
        const trades: any[] = JSON.parse(savedPaperTrades);
        let updated = false;
        trades.forEach((tr) => {
          if (!tr.symbol) return;
          const sym = tr.symbol.toUpperCase();
          const exists = currentPositions.some((p) => p.symbol.toUpperCase() === sym);
          if (!exists) {
            currentPositions.push({
              id: tr.id || `pos_imported_${Date.now()}_${sym}`,
              symbol: sym,
              shares: Number(tr.shares) || 1,
              avgCost: Number(tr.entryPrice) || 100,
              targetPrice: Math.round((Number(tr.entryPrice) || 100) * 1.25 * 100) / 100,
              notes: `Saved from Watchlist (${tr.entryDate || "Recent"})`,
            });
            updated = true;
          }
        });
        if (updated) {
          safeStorage.setItem("stockbloc_portfolio_positions", JSON.stringify(currentPositions));
        }
      }

      if (currentPositions.length === 0) {
        return [
          { id: "1", symbol: "NVDA", shares: 25, avgCost: 109.58, targetPrice: 158.59, notes: "AI GPU dominance" },
          { id: "2", symbol: "PLTR", shares: 150, avgCost: 21.75, targetPrice: 44.26, notes: "AIP defense contract surge" },
          { id: "3", symbol: "O", shares: 80, avgCost: 51.41, targetPrice: 63.18, notes: "Monthly REIT dividend" },
        ];
      }

      return currentPositions;
    } catch {
      return [];
    }
  }, []);

  // Firebase Auth & Settings State
  const [portfolioVisibility, setPortfolioVisibility] = useState<"Public Portfolio" | "Private Portfolio">("Private Portfolio");
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  // Local state persisted in localStorage and Firestore
  const [positions, setPositions] = useState<PortfolioPosition[]>(loadPositionsFromStorage);

  // Listen for portfolio position updates across modals / tabs
  useEffect(() => {
    const handlePortfolioSync = () => {
      setPositions(loadPositionsFromStorage());
    };

    window.addEventListener("stockbloc_portfolio_updated", handlePortfolioSync);
    window.addEventListener("storage", handlePortfolioSync);
    return () => {
      window.removeEventListener("stockbloc_portfolio_updated", handlePortfolioSync);
      window.removeEventListener("storage", handlePortfolioSync);
    };
  }, [loadPositionsFromStorage]);

  useEffect(() => {
    const syncUserData = async (u: User | null) => {
      if (u) {
        try {
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.portfolioVisibility) {
              setPortfolioVisibility(data.portfolioVisibility);
            }
            if (data.portfolioPositions && Array.isArray(data.portfolioPositions) && data.portfolioPositions.length > 0) {
              setPositions(data.portfolioPositions);
              safeStorage.setItem("stockbloc_portfolio_positions", JSON.stringify(data.portfolioPositions));
            }
            if (data.starredTickers && Array.isArray(data.starredTickers)) {
              setStarredTickers(data.starredTickers);
            }
            if (data.paperTrades) {
              safeStorage.setItem("stockbloc_paper_trades", JSON.stringify(data.paperTrades));
            }
            if (data.preferences) {
              setPreferences(data.preferences);
              safeStorage.setItem("stockbloc_user_prefs", JSON.stringify(data.preferences));
            }
          }
        } catch (e) {
          console.error("Failed to load user settings/portfolio", e);
        }
      } else {
        // Clear sensitive portfolio data from local storage on sign out
        safeStorage.removeItem("stockbloc_portfolio_positions");
        safeStorage.removeItem("stockbloc_paper_trades");
        safeStorage.removeItem("stockbloc_user_prefs");
        clearUserStorage();
        setPositions([
          { id: "1", symbol: "NVDA", shares: 25, avgCost: 109.58, targetPrice: 158.59, notes: "AI GPU dominance" },
          { id: "2", symbol: "PLTR", shares: 150, avgCost: 21.75, targetPrice: 44.26, notes: "AIP defense contract surge" },
          { id: "3", symbol: "O", shares: 80, avgCost: 51.41, targetPrice: 63.18, notes: "Monthly REIT dividend" },
        ]);
      }
    };
    
    syncUserData(currentUser);
  }, [currentUser]);

  const handleToggleVisibility = async (visibility: "Public Portfolio" | "Private Portfolio") => {
    triggerHaptic("selection");
    setPortfolioVisibility(visibility);
    if (currentUser) {
      setIsSavingVisibility(true);
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, { portfolioVisibility: visibility }, { merge: true });
      } catch (e) {
        console.error("Failed to save visibility", e);
      } finally {
        setIsSavingVisibility(false);
      }
    } else {
      onOpenAuth(); // Prompt user to sign in if they try to save setting
    }
  };

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = safeStorage.getItem("stockbloc_user_prefs");
      return saved
        ? JSON.parse(saved)
        : {
            themeIntensity: "cyber_dark",
            defaultTab: "brand",
            priceAlertThreshold: 5,
            rsiExtremeThreshold: 30,
          };
    } catch {
      return {
        themeIntensity: "cyber_dark",
        defaultTab: "brand",
        priceAlertThreshold: 5,
        rsiExtremeThreshold: 30,
      };
    }
  });

  // New Position Modal state
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [newSymbol, setNewSymbol] = useState("NVDA");
  const [newShares, setNewShares] = useState("10");
  const [newAvgCost, setNewAvgCost] = useState("120");
  const [newTarget, setNewTarget] = useState("180");
  const [newNotes, setNewNotes] = useState("");

  // API Key & Subscription State
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return safeStorage.getItem("stockbloc_api_key") || "sb_live_8f3a91c74e2d_99182a";
  });
  const [apiCredits, setApiCredits] = useState<number>(() => {
    const val = safeStorage.getItem("stockbloc_api_credits");
    return val ? parseInt(val, 10) : 2850;
  });
  const [apiTotalCredits, setApiTotalCredits] = useState<number>(3000);
  const [subscriptionTier, setSubscriptionTier] = useState<"Quant Suite Pro" | "Free Tier" | "Institutional">("Quant Suite Pro");
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Profile-Linked E-Books & Purchases State
  const [previewPdfItem, setPreviewPdfItem] = useState<{ title: string; downloadUrl: string; category?: string } | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<Array<{
    id: string;
    title: string;
    category: string;
    downloadUrl: string;
  }>>(() => {
    try {
      const saved = safeStorage.getItem("stockbloc_purchased_ebooks");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "wealth_operating_system",
        title: "The Stock Bloc Wealth Operating System (260 Pages)",
        category: "playbook",
        downloadUrl: "/api/download/ebook/wealth_operating_system",
      },
      {
        id: "future_wealth_blueprint",
        title: "Stock Bloc: The Future Wealth Blueprint (108 Pages)",
        category: "playbook",
        downloadUrl: "/api/download/ebook/future_wealth_blueprint",
      },
      {
        id: "playbook_13f_whale",
        title: "13F Whale Tracking & SEC Filing Playbook",
        category: "playbook",
        downloadUrl: "/api/download/playbook/playbook_13f_whale",
      },
      {
        id: "playbook_credit_800",
        title: "Credit 800+ Dispute & FICO Repair Blueprint",
        category: "playbook",
        downloadUrl: "/api/download/playbook/playbook_credit_800",
      },
      {
        id: "playbook_reit_realestate",
        title: "Real Estate & REIT Cash Flow Matrix",
        category: "playbook",
        downloadUrl: "/api/download/playbook/playbook_reit_realestate",
      },
    ];
  });

  useEffect(() => {
    const syncProfilePurchases = async () => {
      try {
        const res = await fetch("/api/user/profile-purchases?email=realestatejcarter@gmail.com");
        const data = await res.json();
        if (data.status === "ok" && data.profile?.purchasedItems?.length) {
          setPurchasedItems(data.profile.purchasedItems);
          safeStorage.setItem("stockbloc_purchased_ebooks", JSON.stringify(data.profile.purchasedItems));
          if (data.profile.apiKey) {
            setApiKey(data.profile.apiKey);
            safeStorage.setItem("stockbloc_api_key", data.profile.apiKey);
          }
        }
      } catch (err) {
        console.error("Profile purchases sync error:", err);
      }
    };
    syncProfilePurchases();
  }, []);

  const handleCopyKey = () => {
    if (!apiKey) return;
    triggerHaptic("selection");
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    triggerHaptic("light");


    try {
      const res = await fetch("/api/v1/agent/keys/generate", { method: "POST" });
      const data = await res.json();
      if (data.status === "ok" && data.key) {
        setApiKey(data.key);
        setApiCredits(data.creditsRemaining || 3000);
        safeStorage.setItem("stockbloc_api_key", data.key);
        safeStorage.setItem("stockbloc_api_credits", String(data.creditsRemaining || 3000));
      } else {
        const newKey = `sb_live_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
        setApiKey(newKey);
        setApiCredits(3000);
        safeStorage.setItem("stockbloc_api_key", newKey);
        safeStorage.setItem("stockbloc_api_credits", "3000");
      }
    } catch {
      const newKey = `sb_live_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      setApiKey(newKey);
      setApiCredits(3000);
      safeStorage.setItem("stockbloc_api_key", newKey);
      safeStorage.setItem("stockbloc_api_credits", "3000");
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeKey = async () => {
    triggerHaptic("warning");
    if (!window.confirm("Are you sure you want to revoke this API key? Autonomous agents using this key will be blocked.")) {
      return;
    }

    try {
      await fetch("/api/v1/agent/keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey }),
      });
    } catch (e) {
      console.error(e);
    }

    setApiKey(null);
    safeStorage.removeItem("stockbloc_api_key");
  };


  useEffect(() => {
    try {
      safeStorage.setItem("stockbloc_portfolio_positions", JSON.stringify(positions));
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        setDoc(userRef, { portfolioPositions: positions }, { merge: true }).catch((err) =>
          console.warn("Failed to sync positions to Firestore:", err)
        );
      }
    } catch (e) {
      console.error("Failed to save portfolio positions", e);
    }
  }, [positions, currentUser]);

  useEffect(() => {
    try {
      safeStorage.setItem("stockbloc_user_prefs", JSON.stringify(preferences));
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        setDoc(userRef, { preferences }, { merge: true }).catch((err) =>
          console.warn("Failed to sync preferences to Firestore:", err)
        );
      }
    } catch (e) {
      console.error("Failed to save preferences", e);
    }
  }, [preferences, currentUser]);

  useEffect(() => {
    try {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        setDoc(userRef, { starredTickers }, { merge: true }).catch((err) =>
          console.warn("Failed to sync starredTickers to Firestore:", err)
        );
      }
    } catch (e) {
      console.error("Failed to save starredTickers", e);
    }
  }, [starredTickers, currentUser]);

  // Compute portfolio valuation
  const portfolioSummary = useMemo(() => {
    let totalCost = 0;
    let currentValue = 0;

    const enriched = positions.map((pos) => {
      const currentStock = stocks.find(
        (s) => s.symbol.toUpperCase() === pos.symbol.toUpperCase()
      ) || {
        symbol: pos.symbol,
        price: pos.avgCost,
        changePercent: 0,
      };

      const stockPrice = currentStock.price || pos.avgCost;
      const posCost = pos.shares * pos.avgCost;
      const posVal = pos.shares * stockPrice;
      const pnl = posVal - posCost;
      const pnlPercent = posCost > 0 ? (pnl / posCost) * 100 : 0;

      totalCost += posCost;
      currentValue += posVal;

      return {
        ...pos,
        currentPrice: stockPrice,
        posCost,
        posVal,
        pnl,
        pnlPercent,
        stockData: currentStock,
      };
    });

    const totalPnl = currentValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return {
      enriched,
      totalCost,
      currentValue,
      totalPnl,
      totalPnlPercent,
    };
  }, [positions, stocks]);

  // RSI extremes alert list
  const rsiExtremes = useMemo(() => {
    return stocks.filter((s) => (s.rsi ?? 50) <= 32 || (s.rsi ?? 50) >= 68);
  }, [stocks]);

  const handleAddPositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    const shares = parseFloat(newShares) || 0;
    const avgCost = parseFloat(newAvgCost) || 0;
    const target = parseFloat(newTarget) || undefined;

    const newPos: PortfolioPosition = {
      id: Date.now().toString(),
      symbol: newSymbol.toUpperCase().trim(),
      shares,
      avgCost,
      targetPrice: target,
      notes: newNotes,
    };

    triggerHaptic("selection");
    setPositions((prev) => [...prev, newPos]);
    setIsAddingPosition(false);
    setNewSymbol("NVDA");
    setNewShares("10");
    setNewAvgCost("120");
    setNewTarget("");
    setNewNotes("");
  };

  const handleRemovePosition = (id: string) => {
    triggerHaptic("warning");
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 py-6 space-y-8 font-mono select-none">
      {/* Dashboard Top Identity Header */}
      <div className="relative bg-black/90 rounded-3xl p-6 sm:p-8 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <UserCheck className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-mono text-cyan-100 uppercase tracking-wider">
                  MY BLOC QUANT TERMINAL
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Grounded Auth
                </span>
              </div>
              <p className="text-sm sm:text-sm text-neutral-400 font-sans mt-0.5">
                Personal portfolio tracking, custom watchlists, and alert thresholds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenAuth();
              }}
              className="py-2.5 px-4 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>SYNC PROFILE</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("selection");
                setIsAddingPosition(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ADD POSITION</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-4 mt-8 relative z-10 border-b border-cyan-500/30">
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveDashboardTab("overview");
            }}
            className={`pb-3 px-2 text-sm font-bold uppercase transition-all border-b-2 ${
              activeDashboardTab === "overview"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-neutral-500 hover:text-cyan-400/70"
            }`}
          >
            Portfolio & Assets
          </button>
          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveDashboardTab("settings");
            }}
            className={`pb-3 px-2 text-sm font-bold uppercase transition-all border-b-2 flex items-center gap-2 ${
              activeDashboardTab === "settings"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-neutral-500 hover:text-cyan-400/70"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            User Settings
          </button>
        </div>
      </div>

      {activeDashboardTab === "overview" ? (
        <>
          {/* Portfolio High-Level Valuation Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-cyan-500/30">
          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20">
            <span className="text-[11px] text-cyan-400/80 uppercase font-mono block">
              PORTFOLIO VALUE
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white mt-1 block">
              ${portfolioSummary.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20">
            <span className="text-[11px] text-cyan-400/80 uppercase font-mono block">
              TOTAL COST BASIS
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-neutral-300 mt-1 block">
              ${portfolioSummary.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20">
            <span className="text-[11px] text-cyan-400/80 uppercase font-mono block">
              UNREALIZED GAIN/LOSS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  portfolioSummary.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {portfolioSummary.totalPnl >= 0 ? "+" : ""}$
                {portfolioSummary.totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20">
            <span className="text-[11px] text-cyan-400/80 uppercase font-mono block">
              TOTAL RETURN
            </span>
            <div className="flex items-center gap-1 mt-1">
              {portfolioSummary.totalPnlPercent >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
              )}
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  portfolioSummary.totalPnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {portfolioSummary.totalPnlPercent >= 0 ? "+" : ""}
                {portfolioSummary.totalPnlPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

      {/* Manual Portfolio Holdings Table */}
      <div className="bg-black/80 rounded-2xl p-6 border border-cyan-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold font-mono text-cyan-200 uppercase tracking-wider">
              MY PORTFOLIO HOLDINGS & TARGETS
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {positions.length} Active Positions
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center bg-black/40 rounded-xl border border-dashed border-cyan-500/30 space-y-3">
            <DollarSign className="w-10 h-10 text-cyan-500/40 mx-auto" />
            <p className="text-sm text-neutral-300 font-sans">
              No portfolio holdings added yet. Click "Add Position" above to start tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-cyan-500/30 text-cyan-400/80 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Ticker</th>
                  <th className="py-3 px-3">Shares</th>
                  <th className="py-3 px-3">Avg Cost</th>
                  <th className="py-3 px-3">Live Price</th>
                  <th className="py-3 px-3">Current Value</th>
                  <th className="py-3 px-3">P&L ($ / %)</th>
                  <th className="py-3 px-3">Target Price</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/40">
                {portfolioSummary.enriched.map((pos) => {
                  const isUp = pos.pnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3.5 px-3 font-extrabold text-cyan-200">
                        <button
                          onClick={() => {
                            if (typeof pos.stockData === "object" && "symbol" in pos.stockData) {
                              onSelectStock(pos.stockData as StockTicker);
                            }
                          }}
                          className="hover:underline hover:text-cyan-400 text-left cursor-pointer"
                        >
                          {pos.symbol}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-200">{pos.shares}</td>
                      <td className="py-3.5 px-3 text-neutral-300">${pos.avgCost.toFixed(2)}</td>
                      <td className="py-3.5 px-3 font-bold text-white">${pos.currentPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-3 font-bold text-neutral-100">
                        ${pos.posVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-3.5 px-3 font-bold ${
                          isUp ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isUp ? "+" : ""}${pos.pnl.toFixed(2)} ({isUp ? "+" : ""}{pos.pnlPercent.toFixed(2)}%)
                      </td>
                      <td className="py-3.5 px-3 text-amber-300 font-bold">
                        {pos.targetPrice ? `$${pos.targetPrice.toFixed(2)}` : "--"}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleRemovePosition(pos.id)}
                          className="p-1.5 hover:bg-rose-950/50 rounded-lg text-rose-400 transition-colors"
                          title="Delete position"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: RSI Extremes Alert & Saved Hub Quick Jumps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RSI Extremes Alert Panel */}
        <div className="bg-black/80 rounded-2xl p-5 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base font-bold font-mono text-cyan-200 uppercase tracking-wider">
                RSI EXTREMES ALERT RADAR
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold">
              {rsiExtremes.length} Signals
            </span>
          </div>

          <p className="text-sm text-neutral-400 font-sans">
            Tickers currently breaking RSI thresholds (&le;32 Oversold or &ge;68 Overbought).
          </p>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {rsiExtremes.map((stk) => (
              <div
                key={stk.symbol}
                onClick={() => onSelectStock(stk)}
                className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-cyan-500/20 hover:border-cyan-400 cursor-pointer transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{stk.symbol}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        (stk.rsi ?? 50) <= 32
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {(stk.rsi ?? 50) <= 32 ? "OVERSOLD" : "OVERBOUGHT"}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">{stk.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-200">RSI {stk.rsi ?? 50} <NotFinancialAdviceTag className="scale-[0.6] origin-right" /></div>
                  <div className="text-xs text-neutral-400">${stk.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Hub Quick Jumps & Preferences */}
        <div className="bg-black/80 rounded-2xl p-5 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold font-mono text-cyan-200 uppercase tracking-wider">
                PREFERENCES & DEEP LINKS
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono">[ SAVED ]</span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 flex items-center justify-between">
              <span className="text-neutral-300">Default Terminal Tab</span>
              <select
                value={preferences.defaultTab}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    defaultTab: e.target.value as ViewTab,
                  }))
                }
                className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded px-2 py-1 font-mono text-xs focus:outline-none"
              >
                <option value="brand">Mission Hub</option>
                <option value="watchlist">Watchlist</option>
                <option value="intelligence">13F Intel</option>
                <option value="credit">Credit 800+</option>
                <option value="real_estate">Real Estate</option>
                <option value="dyson_swarm">Dyson Swarm</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/20 flex items-center justify-between">
              <span className="text-neutral-300">Price Movement Alert (%)</span>
              <span className="font-mono text-cyan-300 font-bold">
                &plusmn;{preferences.priceAlertThreshold}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => onSelectTab("credit")}
                className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400 text-left cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-bold text-white text-xs block">CREDIT GOALS</span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Dispute tracker</span>
              </button>

              <button
                onClick={() => onSelectTab("real_estate")}
                className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 hover:border-amber-400 text-left cursor-pointer transition-all"
              >
                <Building2 className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-bold text-white text-xs block">REAL ESTATE DEALS</span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">DSCR & REITs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API KEYS & SUBSCRIPTION SECTION */}
      <div className="bg-[#020d1c] border-2 border-emerald-500/50 alien-block-cut p-6 sm:p-8 shadow-2xl relative space-y-6">
        <div className="hud-corner-tl border-emerald-400" />
        <div className="hud-corner-tr border-emerald-400" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400 rounded alien-block-cut-sm text-emerald-300">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                  Developer & Agent Access
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded">
                  Tier: {subscriptionTier}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-tech text-white uppercase tracking-wide mt-1">
                API KEYS & SUBSCRIPTION MANAGER
              </h2>
              <p className="text-xs text-neutral-300 font-sans max-w-2xl mt-0.5">
                Generate production API keys (<span className="text-emerald-300 font-mono">sb_live_...</span>), monitor remaining credit balances, and manage your Quant Suite Pro subscription.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                triggerHaptic("selection");
                onSelectTab("pricing");
              }}
              data-testid="mybloc-buy-credits-btn"
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black font-tech text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-400/20"
            >
              <Zap className="w-4 h-4 text-black" />
              <span>REFILL CREDITS / PRICING</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active API Key Card */}
          <div className="bg-black/80 border border-emerald-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-tech uppercase">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Production API Key</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                apiKey
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                  : "bg-rose-950 text-rose-400 border-rose-500/40"
              }`}>
                {apiKey ? "ACTIVE" : "NO KEY GENERATED"}
              </span>
            </div>

            {apiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="w-full bg-neutral-950 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-300 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyKey}
                    data-testid="mybloc-copy-api-key"
                    className="p-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs shrink-0 transition-all cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-neutral-400 font-sans">Pass in header: <code className="text-cyan-300 font-mono">X-StockBloc-API-Key</code></span>
                  <button
                    onClick={handleRevokeKey}
                    className="text-[11px] font-tech text-rose-400 hover:text-rose-300 uppercase underline cursor-pointer"
                  >
                    Revoke Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-neutral-400 font-sans">
                  No active API key found. Generate a key to grant your local LLM agents access to quant endpoints.
                </p>
                <button
                  onClick={handleGenerateKey}
                  disabled={isGeneratingKey}
                  className="px-4 py-2.5 rounded-xl bg-emerald-400 text-black font-black font-tech text-xs uppercase flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isGeneratingKey ? "GENERATING..." : "GENERATE NEW API KEY"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Metered Request Credits & Active Tier Card */}
          <div className="bg-black/80 border border-cyan-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-tech uppercase">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>API Credits & Quota Usage</span>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {apiCredits.toLocaleString()} / {apiTotalCredits.toLocaleString()} REMAINING
              </span>
            </div>

            {/* Credit Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (apiCredits / apiTotalCredits) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-sans">
                <span>Metered Endpoints: /api/v1/agent/quant-sim</span>
                <span>Reset: Monthly / Refill</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-400 font-sans block">ACTIVE SUBSCRIPTION</span>
                <strong className="text-white font-tech text-sm uppercase">{subscriptionTier}</strong>
              </div>

              <button
                onClick={() => {
                  triggerHaptic("selection");
                  onSelectTab("pricing");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs font-tech uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Plan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* PROFILE-LINKED E-BOOKS & DOWNLOADS */}
      <div className="bg-[#020d1c] border-2 border-emerald-500/50 alien-block-cut p-6 sm:p-8 shadow-2xl relative space-y-6">
        <div className="hud-corner-tl border-emerald-400" />
        <div className="hud-corner-tr border-emerald-400" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400 rounded alien-block-cut-sm text-emerald-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                  AUTHENTICATED PROFILE LIBRARY
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                  {purchasedItems.length} DIGITAL ASSETS UNLOCKED
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-tech text-white uppercase tracking-wide mt-1">
                PURCHASED E-BOOKS & DOWNLOADS
              </h2>
              <p className="text-xs text-neutral-300 font-sans max-w-2xl mt-0.5">
                All e-books and playbooks linked to your account. Download high-resolution PDF editions anytime.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic("selection");
              onSelectTab("playbooks");
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black font-tech text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-400/20 shrink-0"
          >
            <Library className="w-4 h-4 text-black" />
            <span>EXPLORE STORE / E-BOOKS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchasedItems.map((item) => (
            <div
              key={item.id}
              className="bg-black/80 border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                    {item.category || "PLAYBOOK"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    LINKED
                  </span>
                </div>

                <h3 className="text-sm font-black font-tech text-white uppercase tracking-wide line-clamp-2">
                  {item.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerHaptic("selection");
                    setPreviewPdfItem({
                      title: item.title,
                      downloadUrl: item.downloadUrl || `/api/download/ebook/${item.id}`,
                      category: item.category || "PLAYBOOK",
                    });
                  }}
                  data-testid={`preview-profile-ebook-${item.id}`}
                  className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold font-tech text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PREVIEW PDF</span>
                </button>

                <a
                  href={item.downloadUrl || `/api/download/ebook/${item.id}`}
                  download
                  onClick={() => triggerHaptic("selection")}
                  data-testid={`download-profile-ebook-${item.id}`}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black font-tech text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-400/20"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>DOWNLOAD</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewPdfItem && (
        <PdfPreviewModal
          title={previewPdfItem.title}
          downloadUrl={previewPdfItem.downloadUrl}
          category={previewPdfItem.category}
          onClose={() => setPreviewPdfItem(null)}
        />
      )}
        </>
      ) : (
        <div className="bg-black/80 rounded-3xl p-6 sm:p-8 border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-6">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-black font-mono text-white uppercase tracking-wider">
              USER SETTINGS
            </h2>
          </div>

          <div className="space-y-6">
            {/* Portfolio Privacy Toggle */}
            <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase">Portfolio Visibility</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${portfolioVisibility === "Public Portfolio" ? "bg-emerald-950 text-emerald-400 border-emerald-500/40" : "bg-rose-950 text-rose-400 border-rose-500/40"}`}>
                    {portfolioVisibility}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  When public, your portfolio allocation is visible on your profile. When private, only you can see it.
                </p>
              </div>
              <div className="flex bg-black p-1 rounded-lg border border-neutral-800 shrink-0">
                <button
                  disabled={isSavingVisibility}
                  onClick={() => handleToggleVisibility("Public Portfolio")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${portfolioVisibility === "Public Portfolio" ? "bg-emerald-500 text-black" : "text-neutral-400 hover:text-white"}`}
                >
                  Public
                </button>
                <button
                  disabled={isSavingVisibility}
                  onClick={() => handleToggleVisibility("Private Portfolio")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${portfolioVisibility === "Private Portfolio" ? "bg-rose-500 text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Apple Watch Mode Settings */}
            <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Watch className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase">Apple Watch Companion Mode</h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
                    GLANCE READY
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Launch the ultra-compact OLED watch interface designed for Apple Watch Series, SE, & Ultra screens, or view Swift Playgrounds code.
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic("selection");
                  onSelectTab("apple_watch");
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Watch className="w-4 h-4 text-black" />
                <span>LAUNCH WATCH GLANCE</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {isAddingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#040f18] border border-cyan-500/40 rounded-2xl p-6 space-y-4 text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <h3 className="font-bold font-mono text-cyan-200 uppercase tracking-wider text-base">
                ADD PORTFOLIO POSITION
              </h3>
              <button
                onClick={() => setIsAddingPosition(false)}
                className="text-neutral-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPositionSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-cyan-400 mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="e.g. NVDA, TSLA, PLTR"
                  className="w-full bg-black border border-cyan-500/40 rounded-lg p-2.5 text-white uppercase focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cyan-400 mb-1">Shares Owned</label>
                  <input
                    type="number"
                    step="any"
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    className="w-full bg-black border border-cyan-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cyan-400 mb-1">Avg Cost Basis ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={newAvgCost}
                    onChange={(e) => setNewAvgCost(e.target.value)}
                    className="w-full bg-black border border-cyan-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-cyan-400 mb-1">Target Price ($) [Optional]</label>
                <input
                  type="number"
                  step="any"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full bg-black border border-cyan-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1">Notes / Thesis</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Core AI holding"
                  className="w-full bg-black border border-cyan-500/40 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cyan-500/30">
                <button
                  type="button"
                  onClick={() => setIsAddingPosition(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-neutral-300 font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-extrabold uppercase hover:bg-cyan-400"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
