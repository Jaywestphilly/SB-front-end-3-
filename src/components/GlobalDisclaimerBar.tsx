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

  if (!isVisible) return null;

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
    <div className="fixed bottom-16 sm:bottom-14 left-1/2 -translate-x-1/2 z-30 w-[96%] max-w-4xl pointer-events-none animate-fadeIn">
      <div className="pointer-events-auto bg-[#080d14]/95 backdrop-blur-md border border-amber-500/50 alien-block-cut-sm p-2 sm:px-4 shadow-2xl shadow-amber-950/50 flex items-center justify-between gap-3 text-amber-200 text-[10px] sm:text-xs font-mono">
        <div className="flex items-center gap-2 overflow-hidden">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <p className="truncate sm:whitespace-normal font-medium leading-tight">
            <strong className="text-amber-300 uppercase font-black tracking-wider">STOCK BLOC</strong> is an educational intelligence platform. Nothing on this site is financial advice. Always do your own research.{" "}
            <button 
              type="button"
              onClick={handleViewDisclaimer}
              className="text-amber-400 hover:text-white font-bold underline inline-flex items-center gap-0.5 ml-1 transition-colors cursor-pointer"
            >
              See full disclaimer
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 hover:bg-amber-500/20 text-amber-300 hover:text-white rounded transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss disclaimer"
          title="Dismiss disclaimer bar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
