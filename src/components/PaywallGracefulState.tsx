import React, { useState } from "react";
import { Zap, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Loader, Lock, CreditCard } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { useModalStore } from "../stores/modalStore";
import { StripeCheckoutModal, CheckoutItem } from "./StripeCheckoutModal";

interface PaywallUpsellCardProps {
  title?: string;
  description?: string;
  compact?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export const PaywallUpsellCard: React.FC<PaywallUpsellCardProps> = ({
  title = "Unlock live data with Quant Suite Pro — $5/mo",
  description = "Get uninterrupted real-time streaming data, institutional 13F whale disclosures, and autonomous quantitative intelligence.",
  compact = false,
  onSuccess,
  className = "",
}) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const setIsProSubscriptionOpen = useModalStore((s) => s.setIsProSubscriptionOpen);

  const proItem: CheckoutItem = {
    id: "subscription_pro_monthly",
    title: "Quant Suite Pro Subscription (Monthly)",
    category: "subscription",
    price: 5,
    displayPrice: "$5/mo",
    billingPeriod: "monthly",
    features: [
      "Real-Time Streaming Quotes & Watchlist Feeds",
      "Instant 13F Institutional Whale Disclosures & SEC Data",
      "Quantitative Strategy Simulation & Agent Performance Telemetry",
      "5,000 API Credits / Month Included for AI Agents",
    ],
  };

  const handleOpenCheckout = () => {
    triggerHaptic("selection");
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (sessionId: string) => {
    setShowCheckout(false);
    if (onSuccess) onSuccess();
    else window.location.reload();
  };

  if (compact) {
    return (
      <>
        <div
          className={`alien-block-cut bg-[#020a16] border border-cyan-500/40 p-3.5 sm:p-4 text-cyan-300 font-mono shadow-lg relative overflow-hidden ${className}`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyan-500/20 border border-cyan-400/50 rounded text-cyan-400 shrink-0">
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-black font-tech text-white uppercase tracking-wider">
                  {title}
                </div>
                <div className="text-[11px] text-cyan-400/80 font-sans mt-0.5 line-clamp-1">
                  {description}
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenCheckout}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-tech font-black text-xs uppercase tracking-wider alien-block-cut-sm flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Unlock ($5/mo)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {showCheckout && (
          <StripeCheckoutModal
            item={proItem}
            onClose={() => setShowCheckout(false)}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={`alien-block-cut bg-[#020a16] border-2 border-cyan-500/50 p-5 sm:p-6 text-white font-mono shadow-2xl relative overflow-hidden ${className}`}
      >
        <div className="hud-corner-tl border-cyan-400" />
        <div className="hud-corner-tr border-cyan-400" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 rounded alien-block-cut-sm flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400" />
                Live Data Paywall
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded alien-block-cut-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Quant Suite Pro
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black font-tech text-white uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl leading-relaxed">
              {description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-cyan-300/90 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Rate Limits & Real-Time Quotes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>13F Whale Tracking & SEC Disclosures</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>5,000 API Credits / Month for AI Agents</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant Card / Apple Pay / Crypto via Stripe</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
            <button
              onClick={handleOpenCheckout}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-tech font-black text-sm uppercase tracking-wider alien-block-cut flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Unlock Pro — $5/mo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="/pricing"
              onClick={(e) => {
                e.preventDefault();
                setIsProSubscriptionOpen(true);
              }}
              className="text-[11px] text-cyan-400/80 hover:text-cyan-300 underline text-center font-sans tracking-wide cursor-pointer"
            >
              View all plans & features
            </a>
          </div>
        </div>
      </div>

      {showCheckout && (
        <StripeCheckoutModal
          item={proItem}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </>
  );
};

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
