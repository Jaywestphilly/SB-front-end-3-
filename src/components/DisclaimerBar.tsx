import React, { useState, useEffect } from "react";
import { AlertCircle, X, ExternalLink } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface Props {
  onOpenDisclaimerModal: () => void;
}

export const DisclaimerBar: React.FC<Props> = ({ onOpenDisclaimerModal }) => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("stockbloc_disclaimer_dismissed");
      if (!dismissed) {
        setIsDismissed(false);
      }
    } catch (e) {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    triggerHaptic("selection");
    try {
      sessionStorage.setItem("stockbloc_disclaimer_dismissed", "true");
    } catch (e) {}
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-14 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-4xl animate-fadeIn">
      <div className="bg-[#080d14]/95 backdrop-blur-md border border-amber-500/40 alien-block-cut-sm p-2 sm:px-4 shadow-xl shadow-amber-950/40 flex items-center justify-between gap-3 text-amber-300 text-[10px] sm:text-xs font-mono">
        <div className="flex items-center gap-2 overflow-hidden">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <p className="truncate sm:whitespace-normal font-medium leading-tight">
            <strong className="text-amber-200 uppercase font-black tracking-wider">STOCK BLOC</strong> is an educational intelligence platform. Nothing on this site is financial advice. Always do your own research.{" "}
            <button
              onClick={() => {
                triggerHaptic("selection");
                onOpenDisclaimerModal();
              }}
              className="underline text-amber-400 hover:text-white font-bold inline-flex items-center gap-0.5 ml-1 transition-colors cursor-pointer"
            >
              See full disclaimer
              <ExternalLink className="w-2.5 h-2.5 inline" />
            </button>
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-amber-500/20 text-amber-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
          title="Dismiss for session"
          aria-label="Dismiss disclaimer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
