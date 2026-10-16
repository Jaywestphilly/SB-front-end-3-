import React, { useEffect } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";

export const BlocMembershipPage: React.FC = () => {
  useEffect(() => {
    document.title = "The Bloc | Stock Bloc Membership";
  }, []);

  // Read config value from environment variable (not a secret)
  const envCheckoutUrl = (import.meta.env?.VITE_BLOC_CHECKOUT_URL || import.meta.env?.BLOC_CHECKOUT_URL || "").trim();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 text-white font-sans space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Stock Bloc Membership</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-zen uppercase">
          The Bloc
        </h1>

        <p className="text-base sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
          A weekly membership for everyday investors who want to know what changed and why it matters.
        </p>
      </div>

      {/* Pricing Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-cyan-500/30 shadow-2xl text-center space-y-3">
        <div className="text-sm uppercase tracking-wider font-mono text-cyan-400 font-bold">
          Founding Member Pricing
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white">
          Founding member $19/month <span className="text-sm font-normal text-neutral-400">(first 50 members keep this rate)</span>
        </div>
        <p className="text-sm text-neutral-400 font-mono">
          After that $29/month or $249/year.
        </p>
      </div>

      {/* What You Get Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          What You Get
        </h2>

        <ul className="space-y-5 text-sm sm:text-base text-neutral-200">
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-white">Weekly "What Changed" breakdown:</strong> plain-language changes in 10-K and 10-Q filings, plus 13F big-investor moves.
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-white">Credit 800 self-help education:</strong> lessons and templates you use yourself. We do not do credit repair for you and we do not promise any score.
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-white">Weekly real estate deal breakdown</strong> using the Stock Bloc calculators.
            </div>
          </li>

          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-white">Monthly live Q&A.</strong>
            </div>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <div className="text-center pt-2">
        {envCheckoutUrl ? (
          <a
            href={envCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <span>Join The Bloc</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-neutral-800 text-neutral-500 font-bold text-lg cursor-not-allowed border border-neutral-700"
          >
            Opening soon
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-neutral-800 text-xs text-neutral-400 leading-relaxed flex items-start gap-3 mt-12">
        <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
        <p>
          Stock Bloc content is general education for all members. It is not personalized investment, tax, legal or credit advice. Stock Bloc is not a registered investment adviser. Do your own research.
        </p>
      </div>
    </div>
  );
};

export default BlocMembershipPage;
