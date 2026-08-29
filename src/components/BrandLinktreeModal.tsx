import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ExternalLink,
  Globe,
  Twitter,
  Youtube,
  Radio,
  Zap,
  Check,
} from "lucide-react";
import { StockBlocLogo } from "./StockBlocLogo";

interface BrandLinktreeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandLinktreeModal: React.FC<BrandLinktreeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const links = [
    {
      title: "Stock Bloc Official Hub",
      subtitle: "linktr.ee/StockBloc",
      url: "https://linktr.ee/StockBloc",
      icon: Globe,
      color: "from-cyan-500 to-blue-600",
      badge: "Official",
    },
    {
      title: "Stock Bloc X / Twitter",
      subtitle: "Real-time Ticker Signals & Market Intelligence Alerts",
      url: "https://x.com/thestockbloc?s=21",
      icon: Twitter,
      color: "from-blue-400 to-indigo-600",
      badge: "@thestockbloc",
    },
    {
      title: "Stock Bloc Official YouTube",
      subtitle: "Macro Breakdowns, AI Singularity & 13F Filing Analysis",
      url: "https://youtube.com/@stockbloc",
      icon: Youtube,
      color: "from-rose-500 to-red-600",
      badge: "@stockbloc",
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://linktr.ee/StockBloc");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="linktree-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
        >
          <motion.div
            key="linktree-modal-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-neutral-950 border border-white/15 rounded-3xl p-6 shadow-2xl relative text-white space-y-6 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="p-3 relative">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl pointer-events-none" />
                <StockBlocLogo
                  size="xl"
                  showText={false}
                  className="drop-shadow-2xl holo-alien-hover relative z-10"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                  Stock Bloc
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </h2>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">
                  Market Intelligence & Infrastructure Hub
                </p>
              </div>

              {/* Stock Bloc Mission Banner */}
              <div className="w-full p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-left space-y-1">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                  // STOCK BLOC MISSION STATEMENT
                </div>
                <p className="text-[11px] text-cyan-200/90 font-mono leading-snug">
                  "Democratizing quant wealth intelligence, institutional 13F
                  insider flows, 800+ credit mastery, and real estate assets for
                  independent investors worldwide."
                </p>
              </div>

              {/* Linktree URL Pill Button */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-cyan-300 font-mono transition-all active:scale-95"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>linktr.ee/StockBloc</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>
            </div>

            {/* Link Cards List */}
            <div className="space-y-3">
              {links.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] active:scale-95 block"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white shrink-0 shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                          {link.title}
                        </h4>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10 shrink-0">
                          {link.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {link.subtitle}
                      </p>
                    </div>

                    <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0 transition-colors" />
                  </a>
                );
              })}
            </div>

            <div className="text-center pt-2 border-t border-white/10 text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
              Stock Bloc © 2026 • Real Time iOS Market Terminal
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
