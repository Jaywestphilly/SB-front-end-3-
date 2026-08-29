import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Orbit,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  Zap,
  Rocket,
  Cpu,
  BookOpen,
  Scale,
  Award,
  CheckCircle2,
  TrendingUp,
  LineChart,
  Home,
  Briefcase,
  Terminal,
  Radio,
  ExternalLink,
  Shield,
  Layers,
  Check
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ViewTab } from "../types";
import { useModalStore } from "../stores/modalStore";

interface NewUserOnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateTab: (tab: ViewTab) => void;
}

export const NewUserOnboardingModal: React.FC<NewUserOnboardingModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onNavigateTab
}) => {
  const { isOnboardingOpen, setIsOnboardingOpen } = useModalStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("Member");
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<ViewTab>("watchlist");

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : (isOnboardingOpen || internalIsOpen);

  const handleClose = async () => {
    triggerHaptic("light");
    if (currentUid) {
      localStorage.setItem(`stockbloc_onboarding_completed_${currentUid}`, "true");
      try {
        const userRef = doc(db, "users", currentUid);
        await setDoc(userRef, { hasCompletedOnboarding: true, onboardingCompletedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn("Could not save onboarding status to firestore:", err);
      }
    }
    setIsOnboardingOpen(false);
    setInternalIsOpen(false);
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  useEffect(() => {
    // Listen for custom trigger event when a user registers/signs up
    const handleTrigger = (e: any) => {
      const detail = e?.detail;
      if (detail?.uid) {
        setCurrentUid(detail.uid);
      }
      setCurrentStep(0);
      setInternalIsOpen(true);
    };

    window.addEventListener("stockbloc_trigger_onboarding", handleTrigger);

    // Also check on auth state change if the user is signed in and has never completed onboarding
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        setUserDisplayName(user.displayName || user.email?.split("@")[0] || "Member");

        const localFlag = localStorage.getItem(`stockbloc_onboarding_completed_${user.uid}`);
        const justSignedUp = sessionStorage.getItem(`stockbloc_just_signed_up_${user.uid}`);

        if (justSignedUp === "true") {
          sessionStorage.removeItem(`stockbloc_just_signed_up_${user.uid}`);
          setCurrentStep(0);
          setInternalIsOpen(true);
          return;
        }

        if (!localFlag) {
          try {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              if (!data.hasCompletedOnboarding && data.isNewAccount) {
                setInternalIsOpen(true);
              } else if (data.hasCompletedOnboarding) {
                localStorage.setItem(`stockbloc_onboarding_completed_${user.uid}`, "true");
              }
            }
          } catch (e) {
            console.warn("Error checking onboarding status:", e);
          }
        }
      } else {
        // Guest/Unauthenticated: do not auto-open unless triggered
      }
    });

    return () => {
      window.removeEventListener("stockbloc_trigger_onboarding", handleTrigger);
      unsubscribe();
    };
  }, []);

  const handleStepJump = (targetTab: ViewTab) => {
    triggerHaptic("selection");
    handleClose();
    onNavigateTab(targetTab);
  };

  const steps = [
    // STEP 0: Welcome & Legal Disclaimer
    {
      id: "welcome",
      badge: "ORIENTATION • STEP 1 OF 5",
      title: "System Initialization & Member Orientation",
      subtitle: "Welcome to Stock Bloc • Quantitative Intelligence & Sovereignty",
      icon: Sparkles,
      iconColor: "text-cyan-400",
      accentBg: "from-cyan-950/50 via-neutral-950 to-neutral-950",
      accentBorder: "border-cyan-500/40",
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm">
            <h4 className="text-sm font-black font-alien-hud text-cyan-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              WELCOME OPERATIVE @{userDisplayName.toUpperCase()}
            </h4>
            <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed font-sans">
              Stock Bloc is an institutional-grade financial sandbox, education terminal, and quantitative analysis engine. Our mission is to democratize institutional research, engineering models, and decentralized wealth frameworks.
            </p>
          </div>

          {/* Strict Non-Investment Advice Mandatory Banner */}
          <div className="p-4 bg-amber-950/40 border-2 border-amber-500/60 alien-block-cut-sm space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mandatory Compliance: For Educational Purposes Only</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
              <strong>Zero Investment or Financial Advice:</strong> Nothing contained within the Stock Bloc platform, including credit dispute templates, real estate underwriting calculators, Dyson Swarm compute models, AI market heatmaps, or autonomous agent research, constitutes financial, investment, legal, tax, or credit repair advice. All content is engineered strictly for educational, informational, and simulation purposes.
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAcknowledgedDisclaimer}
                onChange={(e) => {
                  triggerHaptic("selection");
                  setHasAcknowledgedDisclaimer(e.target.checked);
                }}
                className="w-4 h-4 rounded bg-neutral-900 border-amber-400 text-amber-500 focus:ring-0 focus:outline-none cursor-pointer"
              />
              <span className="text-[11px] font-bold text-amber-300">
                I acknowledge and understand that Stock Bloc provides strictly educational intelligence.
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 bg-black/60 border border-cyan-500/20 alien-block-cut-sm text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-emerald-300 uppercase">1. Credit</div>
              <div className="text-[9px] text-neutral-400">FCRA 609 Disputes</div>
            </div>
            <div className="p-2.5 bg-black/60 border border-cyan-500/20 alien-block-cut-sm text-center">
              <Building2 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-amber-300 uppercase">2. Real Estate</div>
              <div className="text-[9px] text-neutral-400">Cap Rate & DSCR</div>
            </div>
            <div className="p-2.5 bg-black/60 border border-cyan-500/20 alien-block-cut-sm text-center">
              <GraduationCap className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-rose-300 uppercase">3. Education</div>
              <div className="text-[9px] text-neutral-400">MIT & Tax Hub</div>
            </div>
            <div className="p-2.5 bg-black/60 border border-cyan-500/20 alien-block-cut-sm text-center">
              <Orbit className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-purple-300 uppercase">4. Dyson/Space</div>
              <div className="text-[9px] text-neutral-400">SpaceX & AI Power</div>
            </div>
          </div>
        </div>
      )
    },

    // STEP 1: How to Work on Your Credit
    {
      id: "credit",
      badge: "CORE MODULE • STEP 2 OF 5",
      title: "Credit Architecture & Leverage Engineering",
      subtitle: "FICO Score Anatomy, 15 U.S.C. § 1681 Dispute Frameworks & Tier-1 Business Credit",
      icon: ShieldCheck,
      iconColor: "text-emerald-400",
      accentBg: "from-emerald-950/50 via-neutral-950 to-neutral-950",
      accentBorder: "border-emerald-500/40",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Credit is the institutional foundation for acquiring income-generating assets without depleting personal liquid reserves. Stock Bloc provides systematic educational tools to understand how credit reporting bureaus operate:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-900/80 border border-emerald-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>1. Utilization Arbitrage</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Learn why paying statement balances 3-5 days prior to your <em>statement closing date</em> maintains under-6% reported utilization, instantly triggering higher automated algorithmic underwriting scores.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-emerald-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <Scale className="w-3.5 h-3.5" />
                <span>2. FCRA 609 Bureau Letters</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Access formal educational dispute letter templates invoking 15 U.S.C. § 1681g to legally mandate bureaus (Experian, Equifax, TransUnion) verify physical documentation or delete erroneous derogatory remarks.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-emerald-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                <Briefcase className="w-3.5 h-3.5" />
                <span>3. 0% APR Business Credit</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Understand how to structure an LLC and build EIN-only trade credit and 0% APR promotional lines (up to $50k-$150k) that do not report to personal consumer credit bureaus.
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 alien-block-cut-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-300 font-mono block">Terminal Destination:</span>
              <span className="text-xs text-neutral-300 font-sans">Credit Building & FCRA Dispute Engine with Live Macro Indicators</span>
            </div>
            <button
              onClick={() => handleStepJump("credit")}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-alien-hud font-bold text-xs alien-block-cut-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>EXPLORE CREDIT HUB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    },

    // STEP 2: Real Estate Investments & Deal Structuring
    {
      id: "real_estate",
      badge: "CORE MODULE • STEP 3 OF 5",
      title: "Real Estate Investments & Deal Structuring",
      subtitle: "Underwriting Cap Rates, DSCR Loans, Commercial Maturity Walls & HUD Grants",
      icon: Building2,
      iconColor: "text-amber-400",
      accentBg: "from-amber-950/50 via-neutral-950 to-neutral-950",
      accentBorder: "border-amber-500/40",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Real estate allows systematic equity compounding through leverage, depreciation tax shields, and rental cash flows. Stock Bloc arms you with institutional financial math to evaluate prospective deals:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-900/80 border border-amber-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                <LineChart className="w-3.5 h-3.5" />
                <span>1. Cap Rate & Cash-on-Cash</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Use our interactive real estate calculator to model Net Operating Income (NOI), Capitalization Rates, Debt-Service Coverage Ratios (DSCR), and 30-year amortization tables before committing capital.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-amber-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                <Home className="w-3.5 h-3.5" />
                <span>2. HUD Homebuyer Programs</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Access official HUD-Approved Homebuyer Education Certificate portals that unlock federal down payment assistance grants (up to $10,000-$25,000) and 3.5% down FHA house-hacking frameworks.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-amber-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                <Building2 className="w-3.5 h-3.5" />
                <span>3. Vacancy Empire Simulation</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Test your property management decision-making in our gamified real estate simulation—balancing tenant repairs, mortgage refinancing, rental yield optimization, and portfolio expansion.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-950/30 border border-amber-500/30 alien-block-cut-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-amber-300 font-mono block">Terminal Destinations:</span>
              <span className="text-xs text-neutral-300 font-sans">Real Estate Underwriting Engine & Vacancy Empire Simulator</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStepJump("real_estate")}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-alien-hud font-bold text-xs alien-block-cut-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>REAL ESTATE HUB</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )
    },

    // STEP 3: The Education Tablet & MIT Courseware
    {
      id: "education",
      badge: "CORE MODULE • STEP 4 OF 5",
      title: "The Education Tablet & Open Courseware",
      subtitle: "MIT & University Engineering, Investopedia Paper Trading, Section 1202 QSBS & Video Playbooks",
      icon: GraduationCap,
      iconColor: "text-rose-400",
      accentBg: "from-rose-950/50 via-neutral-950 to-neutral-950",
      accentBorder: "border-rose-500/40",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            The <strong>Education Tablet</strong> is Stock Bloc's comprehensive university and practical learning repository, delivering world-class curriculum completely free of charge:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-neutral-900/80 border border-rose-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                <GraduationCap className="w-4 h-4" />
                <span>MIT & University Computer Science Tracks</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Direct access to foundational courses in algorithmic trading, microeconomics, quantitative finance, Python computation, and deep neural networks from MIT, Stanford, and Harvard.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-rose-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Investopedia Free Market Simulator</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Zero-risk paper trading playground connected to real-time market order books to test long/short theses, options spreads, and risk-management strategies before deploying real capital.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-rose-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                <Briefcase className="w-4 h-4" />
                <span>Small Business & Section 1202 QSBS Tax Hub</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Master 100% tax-free federal capital gains frameworks under Qualified Small Business Stock (IRC § 1202), SAFE term sheets, and Delaware C-Corp corporate capitalization tables.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-rose-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-mono">
                <Radio className="w-4 h-4" />
                <span>Free Game Educational Video Masterclasses</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Curated video breakdowns and playbooks covering macroeconomic liquidity cycles, options Greeks sandboxes, corporate bankruptcy forensic models, and terminal navigation.
              </p>
            </div>
          </div>

          <div className="p-3 bg-rose-950/30 border border-rose-500/30 alien-block-cut-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-rose-300 font-mono block">Terminal Destinations:</span>
              <span className="text-xs text-neutral-300 font-sans">MIT Courses, Investopedia Game, QSBS Tax Hub, & Terminal Guide</span>
            </div>
            <button
              onClick={() => handleStepJump("mit_courses")}
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-black font-alien-hud font-bold text-xs alien-block-cut-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>OPEN MIT COURSES</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    },

    // STEP 4: Dyson Swarm, SpaceX, & Planetary Energy/Compute
    {
      id: "dyson_spacex",
      badge: "FRONTIER MODULE • STEP 5 OF 5",
      title: "The Dyson Swarm, SpaceX & Planetary Compute",
      subtitle: "Why Orbital Energy Infrastructure & SpaceX Starship Define the Future of Artificial Intelligence",
      icon: Orbit,
      iconColor: "text-purple-400",
      accentBg: "from-purple-950/50 via-neutral-950 to-neutral-950",
      accentBorder: "border-purple-500/40",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Artificial Intelligence has created an unprecedented global energy bottleneck. Understanding orbital mechanics, launch cost curves, and orbital power harvesting is essential for forward-thinking investors:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-900/80 border border-purple-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>1. The AI Power Bottleneck</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Terrestrial data centers face massive grid interconnection delays (5-7 years) and cooling constraints. Compute demand is outpacing terrestrial power generation capacity worldwide.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-purple-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>2. The Dyson Swarm Concept</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                In space, solar irradiance provides an unfiltered <strong>1,361 W/m²</strong> with zero night-cycles and zero atmospheric attenuation—enabling direct orbital GPU compute clusters and power beaming.
              </p>
            </div>

            <div className="p-3 bg-neutral-900/80 border border-purple-500/30 alien-block-cut-sm space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                <Rocket className="w-3.5 h-3.5" />
                <span>3. SpaceX Starship Launch Curve</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                SpaceX's fully reusable Starship is driving orbital payload launch costs down from $10,000/kg to under <strong>$50/kg</strong>, making megawatt-scale space compute economically viable.
              </p>
            </div>
          </div>

          <div className="p-3 bg-purple-950/30 border border-purple-500/30 alien-block-cut-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-purple-300 font-mono block">Terminal Destinations:</span>
              <span className="text-xs text-neutral-300 font-sans">Dyson Swarm Hub, Starlink 3D Globe, SpaceX Tracker & Satellite Radar</span>
            </div>
            <button
              onClick={() => handleStepJump("dyson_swarm")}
              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-black font-alien-hud font-bold text-xs alien-block-cut-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>EXPLORE DYSON HUB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )
    },

    // STEP 5: Final Launch & Select Focus
    {
      id: "finish",
      badge: "INITIALIZATION COMPLETE",
      title: "Select Your Primary Starting Focus",
      subtitle: "Your profile is configured. Where would you like to deploy first?",
      icon: CheckCircle2,
      iconColor: "text-cyan-400",
      accentBg: "from-cyan-950/50 via-neutral-950 to-neutral-950",
      accentBorder: "border-cyan-500/40",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Choose your preferred starting command center. You can switch between any hub at any time via the top and bottom navigation bars:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedFocus("watchlist");
              }}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedFocus === "watchlist"
                  ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-neutral-900/60 border-white/10 text-neutral-300 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold font-alien-hud text-xs text-cyan-300">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  MARKET INTELLIGENCE & WATCHLIST
                </div>
                {selectedFocus === "watchlist" && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Real-time stock telemetry, dynamic performance coloring, institutional 13F whale tracker, and quant models.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedFocus("credit");
              }}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedFocus === "credit"
                  ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-neutral-900/60 border-white/10 text-neutral-300 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold font-alien-hud text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  CREDIT BUILDING & DISPUTES
                </div>
                {selectedFocus === "credit" && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                FICO factor breakdowns, 15 U.S.C. § 1681 bureau dispute generator, and tier-1 business credit guides.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedFocus("real_estate");
              }}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedFocus === "real_estate"
                  ? "bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/20"
                  : "bg-neutral-900/60 border-white/10 text-neutral-300 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold font-alien-hud text-xs text-amber-300">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  REAL ESTATE UNDERWRITING
                </div>
                {selectedFocus === "real_estate" && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Cap rate analyzer, DSCR mortgage calculators, HUD homebuyer grants, and Vacancy Empire game.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedFocus("dyson_swarm");
              }}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedFocus === "dyson_swarm"
                  ? "bg-purple-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                  : "bg-neutral-900/60 border-white/10 text-neutral-300 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold font-alien-hud text-xs text-purple-300">
                  <Orbit className="w-4 h-4 text-purple-400" />
                  DYSON SWARM & SPACEX COMPUTE
                </div>
                {selectedFocus === "dyson_swarm" && <Check className="w-4 h-4 text-purple-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                SpaceX launch telemetry, orbital power arbitrage models, Starlink 3D globe, and AI compute bottlenecks.
              </p>
            </button>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    triggerHaptic("selection");
    if (currentStep === 0 && !hasAcknowledgedDisclaimer) {
      alert("Please acknowledge the Educational Disclaimer before proceeding.");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompleteAndLaunch();
    }
  };

  const handlePrev = () => {
    triggerHaptic("selection");
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCompleteAndLaunch = async () => {
    triggerHaptic("success");
    await handleClose();
    onNavigateTab(selectedFocus);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-3xl bg-gradient-to-b ${currentStepData.accentBg} border-2 ${currentStepData.accentBorder} alien-block-cut shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] font-martian z-10`}
        >
          {/* Top HUD Line / Status Bar */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg bg-black/80 border ${currentStepData.accentBorder}`}>
                <Icon className={`w-4 h-4 ${currentStepData.iconColor}`} />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-bold block leading-none">
                  {currentStepData.badge}
                </span>
                <span className="text-xs font-bold text-white font-alien-hud">
                  STOCK BLOC ONBOARDING DOSSIER
                </span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (currentStep === 0 && !hasAcknowledgedDisclaimer && idx > 0) {
                      alert("Please acknowledge the Educational Disclaimer before proceeding.");
                      return;
                    }
                    triggerHaptic("selection");
                    setCurrentStep(idx);
                  }}
                  className={`w-5 h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? "bg-cyan-400 w-8"
                      : idx < currentStep
                      ? "bg-cyan-600"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                  title={`Jump to Step ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black font-alien-hud text-white tracking-wide">
                {currentStepData.title}
              </h2>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                {currentStepData.subtitle}
              </p>
            </div>

            {currentStepData.content}
          </div>

          {/* Footer Controls */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-white/10 bg-black/80 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-3.5 py-2 alien-block-cut-sm bg-neutral-900 border border-white/20 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-800 text-xs font-alien-hud font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-2 text-[11px] font-martian text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Skip For Now
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2 alien-block-cut-sm bg-cyan-400 hover:bg-cyan-300 text-black font-alien-hud font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-400/20 active:scale-95"
              >
                <span>{currentStep === steps.length - 1 ? "LAUNCH TERMINAL" : "CONTINUE"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
