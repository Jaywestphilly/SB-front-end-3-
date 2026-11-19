import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { trackEvent } from "../utils/analytics";

interface GlobalDisclaimerBarProps {
  onOpenDisclaimerModal: () => void;
}

export const GlobalDisclaimerBar: React.FC<GlobalDisclaimerBarProps> = ({ onOpenDisclaimerModal }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("sb_disclaimer_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    } catch (e) {
      setIsVisible(true);
    }
  }, []);

  const isHiddenRoute =
    typeof window !== "undefined" &&
    (window.location.pathname.includes("/pricing") ||
      window.location.pathname.includes("/store") ||
      window.location.search.includes("tab=pricing") ||
      window.location.search.includes("tab=store"));

  if (!isVisible || isHiddenRoute) return null;

  const handleDismiss = () => {
    triggerHaptic("light");
    setIsVisible(false);
    try {
      sessionStorage.setItem("sb_disclaimer_dismissed", "true");
    } catch (e) {}
  };

  const handleViewDisclaimer = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic("selection");
    trackEvent("disclaimer_viewed");
    onOpenDisclaimerModal();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 pt-2 pb-4 animate-fadeIn">
      <div className="liquid-glass-slab rounded-xl border border-amber-500/30 px-3.5 py-2 flex items-center justify-between gap-3 text-slate-200 text-[10.5px] sm:text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="leading-snug text-slate-300">
            <strong className="text-amber-300 uppercase font-bold tracking-wider">STOCK BLOC</strong> is an educational intelligence platform. Nothing on this site is financial advice. Always do your own research.{" "}
            <button
              type="button"
              onClick={handleViewDisclaimer}
              className="text-amber-300 hover:text-white font-bold underline inline-flex items-center gap-0.5 ml-1 transition-colors cursor-pointer"
            >
              See full disclaimer
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss disclaimer"
          title="Dismiss disclaimer bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
