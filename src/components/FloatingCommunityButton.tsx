import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Youtube, 
  Share2, 
  ExternalLink, 
  Twitter, 
  Lightbulb, 
  Users, 
  Sparkles,
  Zap,
  ChevronUp,
  LogIn,
  Bot
} from "lucide-react";
import { appendUTM } from "../utils/utm";
import { trackEvent } from "../utils/analytics";
import { triggerHaptic } from "../utils/haptics";
import { ViewTab } from "../types";
import { UpgradeRecommendationModal } from "./UpgradeRecommendationModal";
import { useAuth } from "../contexts/AuthContext";

interface FloatingCommunityButtonProps {
  onSelectTab?: (tab: ViewTab) => void;
  onOpenUpgradesModal?: () => void;
  onOpenAuth?: () => void;
}

export const FloatingCommunityButton: React.FC<FloatingCommunityButtonProps> = ({
  onSelectTab,
  onOpenUpgradesModal,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUpgradesModalOpen, setIsUpgradesModalOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("stockbloc_community_btn_dismissed");
      if (dismissed) {
        setIsDismissed(true);
        return;
      }
    } catch (e) {
      // ignore storage error
    }

    // Timer to reveal button after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Scroll trigger fallback
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("selection");
    try {
      sessionStorage.setItem("stockbloc_community_btn_dismissed", "true");
    } catch (e) {}
    setIsDismissed(true);
    setIsOpen(false);
  };

  const handleLinkClick = (platform: string, url: string) => {
    triggerHaptic("selection");
    trackEvent("community_joined", { platform, href: url });
    window.open(appendUTM(url, "floating_widget"), "_blank", "noopener,noreferrer");
  };

  const handleCommunityTabClick = () => {
    triggerHaptic("selection");
    setIsOpen(false);
    if (onSelectTab) {
      onSelectTab("community");
    } else {
      window.history.pushState({ tab: 'community' }, '', '?tab=community');
      window.dispatchEvent(new PopStateEvent("popstate", { state: { tab: 'community' } }));
    }
  };

  const handleOpenUpgrades = () => {
    triggerHaptic("selection");
    setIsOpen(false);
    if (onOpenUpgradesModal) {
      onOpenUpgradesModal();
    } else {
      setIsUpgradesModalOpen(true);
    }
  };

  const handleMainButtonClick = () => {
    triggerHaptic("selection");
    if (!user) {
      // If pre-auth / logged out, open auth modal or navigate
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        window.dispatchEvent(new CustomEvent("open-auth-modal"));
      }
      if (onSelectTab) {
        onSelectTab("community");
      }
    } else {
      // If authenticated, navigate to community
      if (onSelectTab) {
        onSelectTab("community");
      } else {
        window.history.pushState({}, "", "/community");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
  };

  if (isDismissed || !isVisible) return null;

  return (
    <>
      <div 
        id="floating-community-container"
        className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 font-mono animate-fadeIn pointer-events-none flex flex-col items-end gap-2"
      >
        {/* Popover options menu */}
        {isOpen && (
          <div 
            id="floating-community-popover"
            className="mb-1 w-72 bg-[#020b17]/95 backdrop-blur-2xl border-2 border-amber-400 alien-block-cut p-3.5 shadow-2xl shadow-amber-950/80 animate-fadeIn space-y-2.5 pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
              <span className="text-xs font-black font-zen text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                JOIN THE BLOC
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white p-0.5 cursor-pointer alien-block-cut-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Option 0: Auth Action if logged out */}
              {!user && onOpenAuth && (
                <button
                  id="floating-open-auth-btn"
                  onClick={() => {
                    triggerHaptic("success");
                    setIsOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-black alien-block-cut-sm flex items-center justify-between text-xs font-zen font-black transition-all cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-black" />
                    <span>Sign In / Join The Bloc</span>
                  </span>
                  <span className="text-[9px] bg-black text-amber-300 px-1.5 py-0.5 font-bold uppercase rounded-sm">
                    AUTH
                  </span>
                </button>
              )}

              {/* Option 1: Live Community Hub */}
              <button
                id="floating-open-community-btn"
                onClick={handleCommunityTabClick}
                className="w-full py-2.5 px-3 bg-cyan-950/50 hover:bg-cyan-500/20 border border-cyan-400 alien-block-cut-sm flex items-center justify-between text-xs font-alien-hud font-bold text-cyan-300 transition-all cursor-pointer group glow-cyan"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Enter Live Community Hub</span>
                </span>
                <span className="text-[9px] bg-cyan-400 text-black px-1.5 py-0.5 font-bold uppercase rounded-sm">
                  LIVE
                </span>
              </button>

              {/* Option 2: Recommend Changes & Upgrades */}
              <button
                id="floating-recommend-upgrades-btn"
                onClick={handleOpenUpgrades}
                className="w-full py-2.5 px-3 bg-amber-950/50 hover:bg-amber-500/20 border border-amber-400 alien-block-cut-sm flex items-center justify-between text-xs font-alien-hud font-bold text-amber-300 transition-all cursor-pointer group glow-amber"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Recommend Changes & Upgrades</span>
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              </button>

              {/* Option 3: Connect Autonomous Agent / Agent Swarm */}
              <button
                id="floating-open-agent-join-btn"
                onClick={() => {
                  triggerHaptic("selection");
                  setIsOpen(false);
                  if (onSelectTab) {
                    onSelectTab("agent_join");
                  } else {
                    window.history.pushState({ tab: 'agent_join' }, '', '?tab=agent_join');
                    window.dispatchEvent(new PopStateEvent("popstate", { state: { tab: 'agent_join' } }));
                  }
                }}
                className="w-full py-2.5 px-3 bg-emerald-950/40 hover:bg-emerald-500/20 border border-emerald-500/60 alien-block-cut-sm flex items-center justify-between text-xs font-martian text-emerald-300 transition-all cursor-pointer group glow-emerald"
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Connect Autonomous Agent</span>
                </span>
                <span className="text-[9px] bg-emerald-500 text-black px-1.5 py-0.5 font-bold uppercase rounded-sm">
                  AGENT API
                </span>
              </button>

              <div className="pt-1 border-t border-amber-500/20 space-y-1.5">
                <button
                  onClick={() => handleLinkClick("x_twitter", "https://x.com/thestockbloc?s=21")}
                  className="w-full py-2 px-3 bg-black/50 hover:bg-neutral-800/80 border border-neutral-700 rounded alien-block-cut-sm flex items-center justify-between text-[11px] font-martian text-neutral-200 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <Twitter className="w-3.5 h-3.5 text-cyan-400" />
                    Follow on X (@thestockbloc)
                  </span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-neutral-400" />
                </button>

                <button
                  onClick={() => handleLinkClick("youtube", "https://youtube.com/@stockbloc")}
                  className="w-full py-2 px-3 bg-black/50 hover:bg-neutral-800/80 border border-neutral-700 rounded alien-block-cut-sm flex items-center justify-between text-[11px] font-martian text-neutral-200 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <Youtube className="w-3.5 h-3.5 text-rose-400" />
                    Subscribe on YouTube
                  </span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-neutral-400" />
                </button>

                <button
                  onClick={() => handleLinkClick("linktree", "https://linktr.ee/stockbloc")}
                  className="w-full py-2 px-3 bg-black/50 hover:bg-neutral-800/80 border border-neutral-700 rounded alien-block-cut-sm flex items-center justify-between text-[11px] font-martian text-neutral-200 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    Follow on Linktree
                  </span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hover Quick Preview Card */}
        {isHovered && !isOpen && (
          <div className="mb-1 pointer-events-auto bg-[#020b17]/95 border border-amber-400 alien-block-cut p-2.5 shadow-xl text-right animate-in fade-in slide-in-from-bottom-2 max-w-xs">
            <div className="text-[11px] font-zen font-bold text-amber-300 flex items-center justify-end gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              JOIN THE BLOC
            </div>
            <p className="text-[10px] font-martian text-neutral-300 mt-0.5">
              {!user ? "Click to Sign In & Join Sovereign Alpha Community" : "Click to Navigate to Live Community Hub"}
            </p>
          </div>
        )}
        
        {/* Trigger Button with Alien HUD Styling */}
        <div 
          className="relative group pointer-events-auto flex items-center shadow-xl shadow-amber-500/50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            id="floating-join-the-bloc-btn"
            onClick={handleMainButtonClick}
            className="pl-4 pr-3 h-12 alien-block-cut bg-amber-400 text-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-amber-200 glow-amber font-zen font-black tracking-wider uppercase text-xs"
            title={!user ? "Click to Sign In or Join the Bloc" : "Click to Open Live Community Hub"}
          >
            <MessageSquare className="w-5 h-5 text-black fill-black/20" />
            <span>JOIN THE BLOC</span>
            <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping ml-0.5" />
          </button>

          <button
            id="floating-options-caret-btn"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic("selection");
              setIsOpen(!isOpen);
            }}
            className="h-12 px-2 bg-amber-500 hover:bg-amber-300 text-black border-y-2 border-r-2 border-amber-200 flex items-center justify-center cursor-pointer transition-colors"
            title="Options & Social Links"
          >
            <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          <button
            id="floating-dismiss-btn"
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 w-6 h-6 bg-black/90 text-amber-300 border border-amber-500/60 rounded-full flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors cursor-pointer shadow-lg z-10"
            title="Dismiss widget"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Upgrade Recommendation Modal */}
      <UpgradeRecommendationModal
        isOpen={isUpgradesModalOpen}
        onClose={() => setIsUpgradesModalOpen(false)}
      />
    </>
  );
};

