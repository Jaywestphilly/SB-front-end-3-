import React, { useState } from "react";
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Zap,
  Smartphone,
  Wallet,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface CheckoutItem {
  id: string;
  title: string;
  category: "playbook" | "subscription" | "api_bundle";
  price: number;
  displayPrice: string;
  billingPeriod?: "monthly" | "yearly" | "one_time";
  features?: string[];
  creditsGranted?: number;
}

interface Props {
  item: CheckoutItem;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
  initialPaymentMethod?: "card" | "apple_pay" | "crypto";
}

type PaymentMethod = "card" | "apple_pay" | "crypto";

export const StripeCheckoutModal: React.FC<Props> = ({
  item,
  onClose,
  onSuccess,
  initialPaymentMethod = "card",
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(initialPaymentMethod);
  const [email, setEmail] = useState("");
  const [agentId, setAgentId] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic("heavy");
    setIsProcessing(true);
    setErrorMsg(null);

    const userEmail = email.trim() || "customer@stockbloc.ai";

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          productType: item.category,
          price: item.price,
          title: item.title,
          billingPeriod: item.billingPeriod || "one_time",
          email: userEmail,
          agentId: agentId.trim() || undefined,
          paymentMethod: selectedMethod,
          credits: item.creditsGranted ? String(item.creditsGranted) : undefined,
        }),
      });

      const data = await res.json();

      if (data.status === "error") {
        setErrorMsg(data.message || "Payment provider error. Access denied without verified payment.");
        setIsProcessing(false);
        return;
      }

      if (data.checkoutUrl && data.checkoutUrl.startsWith("http")) {
        // Direct redirect to live Stripe Hosted Checkout Page
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.status === "ok" && data.sessionId) {
        setTimeout(() => {
          setIsProcessing(false);
          onSuccess(data.sessionId);
        }, 1200);
      } else {
        throw new Error(data.message || "Failed to create verified checkout session");
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Checkout payment verification failed. Access denied without verified payment."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#030c18] border-2 border-emerald-500/60 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-5 font-mono text-white animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Decorative corner accents */}
        <div className="hud-corner-tl border-emerald-400" />
        <div className="hud-corner-tr border-emerald-400" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400 rounded-lg text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase font-bold tracking-widest">
                <Lock className="w-3 h-3 text-emerald-400 inline" />
                <span>256-BIT ENCRYPTED STRIPE CHECKOUT</span>
              </div>
              <h2 className="text-lg font-black font-tech uppercase text-white">
                STOCK BLOC CHECKOUT
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box - Fail Closed Enforcement */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-xl text-rose-200 text-xs font-mono flex items-start gap-2.5 animate-in fade-in">
            <span className="font-bold text-rose-400 shrink-0">PAYMENT ERROR:</span>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Order Summary Box */}
        <div className="bg-black/80 border border-emerald-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.category === "playbook" && <BookOpen className="w-4 h-4 text-amber-400" />}
              {item.category === "subscription" && <Sparkles className="w-4 h-4 text-cyan-400" />}
              {item.category === "api_bundle" && <Zap className="w-4 h-4 text-emerald-400" />}
              <span className="font-tech font-bold text-sm uppercase text-white">{item.title}</span>
            </div>
            <span className="font-tech font-black text-lg text-emerald-400">
              {item.displayPrice}
            </span>
          </div>

          <div className="text-xs text-neutral-300 font-sans border-t border-neutral-800 pt-2 flex items-center justify-between">
            <span>Instant Digital Delivery & Receipt</span>
            <span className="text-emerald-300 font-mono font-bold">PDF / API Token</span>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTOR TABS */}
        <div className="space-y-2">
          <label className="block text-[11px] font-tech text-emerald-300 uppercase font-bold">
            SELECT PAYMENT METHOD
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedMethod("card");
              }}
              className={`p-2.5 rounded-xl border-2 text-xs font-bold font-tech flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedMethod === "card"
                  ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-black/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>CARD / STRIPE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedMethod("apple_pay");
              }}
              className={`p-2.5 rounded-xl border-2 text-xs font-bold font-tech flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedMethod === "apple_pay"
                  ? "bg-white/10 border-white text-white shadow-lg shadow-white/10"
                  : "bg-black/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
              }`}
            >
              <Smartphone className="w-4 h-4 text-white" />
              <span>APPLE / G PAY</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedMethod("crypto");
              }}
              className={`p-2.5 rounded-xl border-2 text-xs font-bold font-tech flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedMethod === "crypto"
                  ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20"
                  : "bg-black/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
              }`}
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>BTC / STABLECOINS</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CREDIT / DEBIT CARD — REDIRECTS TO STRIPE HOSTED CHECKOUT */}
        {selectedMethod === "card" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-tech text-emerald-300 uppercase font-bold mb-1">
                Email Receipt Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 transition-all font-sans"
              />
              <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                License keys, receipts, and order fulfillment will be delivered to this address.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-tech text-emerald-300 uppercase font-bold mb-1">
                Purchaser / Agent ID <span className="text-neutral-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. agent_quant_v1 (or leave blank to auto-provision)"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-neutral-950 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 transition-all font-mono"
              />
              <p className="text-[10px] text-neutral-400 mt-1 font-sans">
                Target account identity to receive purchased credits upon Stripe payment confirmation.
              </p>
            </div>

            {/* Hosted Checkout Notice */}
            <div className="p-3.5 bg-neutral-950 border border-emerald-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-tech uppercase">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Stripe Hosted Checkout</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                Card numbers, expiration dates, and security codes are entered directly on Stripe&apos;s encrypted checkout page. Stock Bloc never collects or handles sensitive cardholder data.
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black font-tech uppercase text-xs tracking-wider transition-all shadow-xl shadow-emerald-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>REDIRECTING TO STRIPE CHECKOUT...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>CONTINUE TO STRIPE CHECKOUT ({item.displayPrice})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: APPLE PAY / GOOGLE PAY */}
        {selectedMethod === "apple_pay" && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-tech text-cyan-300 uppercase font-bold mb-1">
                Email Receipt Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-tech text-cyan-300 uppercase font-bold mb-1">
                Purchaser / Agent ID <span className="text-neutral-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. agent_quant_v1 (or leave blank to auto-provision)"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-neutral-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="p-4 bg-black/90 border border-neutral-700 rounded-xl space-y-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-black font-black font-sans rounded-lg text-sm">
                <span> Pay</span>
                <span className="text-neutral-500 font-mono text-xs">/ GPay</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                Authorize instant 1-Touch Express Payment using Apple Pay or Google Pay stored wallet credentials via Stripe Hosted Checkout.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-black font-sans uppercase text-sm tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>AUTHORIZING STRIPE CHECKOUT...</span>
                </>
              ) : (
                <>
                  <span> PAY {item.displayPrice} WITH APPLE / G PAY</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: CRYPTO PAYMENTS COMING SOON */}
        {selectedMethod === "crypto" && (
          <div className="p-6 bg-black/90 border border-amber-500/40 rounded-xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black font-tech uppercase text-amber-300">
                Crypto Payments Coming Soon
              </h3>
              <p className="text-xs text-neutral-300 font-sans max-w-sm mx-auto leading-relaxed">
                Automated on-chain USDC / BTC settlement with instant webhook verification is currently undergoing final security auditing. Manual deposit addresses and honor-system verifications are disabled.
              </p>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 font-mono">
              Please use Card / Stripe or Apple / Google Pay for instant verified access.
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedMethod("card");
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black font-tech uppercase text-xs tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-400/20"
            >
              SWITCH TO CARD / STRIPE CHECKOUT
            </button>
          </div>
        )}

        {/* Guarantee Banner */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-sans border-t border-neutral-800 pt-3">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Satisfaction Guarantee
          </span>
          <span>Powered by Stripe Verified Payment</span>
        </div>
      </div>
    </div>
  );
};
