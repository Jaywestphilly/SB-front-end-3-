import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StockBlocLogo } from "./StockBlocLogo";
import { ShieldAlert, Zap, Activity, ChevronRight } from "lucide-react";
import { isAgentOrHeadless } from "../utils/agentDetection";

interface LaunchSplashModalProps {
  onDismiss?: () => void;
}

export const LaunchSplashModal: React.FC<LaunchSplashModalProps> = ({
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(!isAgentOrHeadless());
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (isAgentOrHeadless()) {
      if (onDismiss) onDismiss();
      return;
    }

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            if (onDismiss) onDismiss();
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="launch-splash-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black text-white font-mono select-none overflow-hidden"
        >
          {/* Background Grid & Matrix Rays */}
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* HUD Frame Corners */}
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm w-full">
            {/* Logo Emblem */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
              <StockBlocLogo size="hero" showText={false} />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-1.5"
            >
              <h1 className="text-3xl font-black tracking-widest text-cyan-100 uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                STOCK BLOC<span className="text-cyan-400">.</span>
              </h1>
              <p className="text-[10px] text-cyan-400/90 uppercase tracking-widest font-tech font-bold">
                QUANT WEALTH & 13F HEDGE FUND MATRIX
              </p>
              <p className="text-[11px] text-cyan-300 font-mono bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-500/30 text-center uppercase tracking-wider">
                BUILD GENERATIONAL WEALTH // EXECUTE WITH CONVICTION
              </p>
            </motion.div>

            {/* Progress Bar Data Stream */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-[10px] text-cyan-400/90 tracking-widest">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                  INIT QUANT DATA ENGINE
                </span>
                <span className="font-bold text-amber-300">
                  {loadingProgress}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-cyan-950/80 border border-cyan-500/40 p-0.5 overflow-hidden alien-block-cut-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Quick Launch Tag */}
            <button
              onClick={() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
              }}
              className="px-5 py-2 alien-block-cut-sm bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer mt-2"
            >
              <span>ENTER STOCK BLOC MATRIX</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
