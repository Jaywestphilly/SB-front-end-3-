import React from "react";
import { triggerHaptic } from "../utils/haptics";

export interface PaywallUpsellCardProps {
  title?: string;
  description?: string;
  compact?: boolean;
  onSuccess?: () => void;
  className?: string;
}

// Retained as clean null stub for components to guarantee zero paywall upsell renders
export const PaywallUpsellCard: React.FC<PaywallUpsellCardProps> = () => null;

interface DataUnavailableStateProps {
  title?: string;
  message?: string;
  compact?: boolean;
  className?: string;
  onRetry?: () => void;
}

export const DataUnavailableState: React.FC<DataUnavailableStateProps> = ({
  title = "Data Temporarily Unavailable",
  message = "Live data uplink syncing in progress. Please check back in a moment.",
  compact = false,
  className = "",
  onRetry,
}) => {
  if (compact) {
    return (
      <div
        className={`alien-block-cut-sm bg-neutral-950/70 border border-neutral-700/50 p-2.5 sm:p-3 text-neutral-400 font-mono text-xs flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400/70 animate-pulse shrink-0" />
          <span className="text-[11px] text-neutral-300 font-medium font-sans">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={() => {
              triggerHaptic("light");
              onRetry();
            }}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase underline shrink-0 cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`alien-block-cut bg-[#020a16]/80 border border-neutral-700/60 p-5 sm:p-6 text-neutral-300 font-mono text-center space-y-3 relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-center gap-2 text-amber-400/90 text-xs font-bold uppercase tracking-wider font-tech">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>{title}</span>
      </div>
      <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={() => {
            triggerHaptic("light");
            onRetry();
          }}
          className="px-4 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-neutral-600/50 text-[11px] font-bold uppercase tracking-wider alien-block-cut-sm inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <span>Refresh Uplink</span>
        </button>
      )}
    </div>
  );
};
