import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[85vh] bg-[#05111d] border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-tech tracking-wider text-amber-100 uppercase">
                  FULL DISCLAIMER
                </h2>
                <p className="text-[10px] text-amber-400/80 font-mono tracking-wider uppercase mt-0.5">
                  LEGAL NOTICES & TERMS OF USE
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="p-2 bg-black/60 border border-amber-500/30 text-amber-300 hover:bg-amber-950/50 hover:border-amber-400 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-6 text-sm text-neutral-300 font-sans leading-relaxed">
            <p className="text-amber-300 font-bold uppercase text-xs tracking-wider">
              Stock Bloc is an educational intelligence platform. Nothing on this site is financial, investment, legal, or credit repair advice.
            </p>

            <div className="space-y-4">
              <h3 className="text-amber-400 font-bold uppercase font-mono border-b border-amber-500/20 pb-2">1. Educational Purposes Only</h3>
              <p>
                All data, algorithms, heatmaps, generated briefs, and playbook recommendations provided by Stock Bloc (including the Core Platform and Stock Bloc Labs) are solely for informational and educational purposes. We do not provide personalized financial advice.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-amber-400 font-bold uppercase font-mono border-b border-amber-500/20 pb-2">2. Independent Verification Required</h3>
              <p>
                You must independently verify any information you find on our platform before making investment decisions. Financial markets, real estate, and credit systems are inherently risky. Past performance of any algorithm, strategy, or asset does not guarantee future results.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-amber-400 font-bold uppercase font-mono border-b border-amber-500/20 pb-2">3. Third-Party Integrations & Affiliate Links</h3>
              <p>
                Stock Bloc partners with third-party brokerages, credit agencies, and financial platforms. We may earn a commission from affiliate links (such as Webull, Robinhood, Credit Karma, Bankrate, etc.) at no additional cost to you. We are not responsible for the services, data, or terms of these third parties.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-amber-400 font-bold uppercase font-mono border-b border-amber-500/20 pb-2">4. AI Models & Data Accuracy</h3>
              <p>
                Our intelligence feeds are powered by external data sources and artificial intelligence models (such as Gemini). While we strive for accuracy, AI models can hallucinate or misinterpret real-time events. Institutional filings (13Fs) are inherently delayed by up to 45 days. Never execute trades based solely on AI summaries or Stock Bloc notifications.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-amber-400 font-bold uppercase font-mono border-b border-amber-500/20 pb-2">5. Use at Your Own Risk</h3>
              <p>
                By using Stock Bloc, you agree that you are solely responsible for your own decisions and any resulting financial outcomes. Stock Bloc, its creators, and affiliates are not liable for any losses or damages incurred.
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-amber-500/20 bg-black/40">
            <button
              onClick={() => {
                triggerHaptic("selection");
                onClose();
              }}
              className="w-full py-3 bg-amber-500/20 border border-amber-500/60 hover:bg-amber-500/30 text-amber-300 font-black font-tech uppercase text-sm tracking-widest rounded-xl transition-all"
            >
              I UNDERSTAND & AGREE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
