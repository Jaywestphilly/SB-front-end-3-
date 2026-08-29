import React, { useState } from "react";
import { 
  ShieldCheck, 
  Award, 
  Flame, 
  Zap, 
  Target, 
  HelpCircle, 
  X, 
  Check, 
  TrendingUp, 
  Heart, 
  MessageSquare, 
  Sparkles,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { 
  calculateSBCertification, 
  SBCertificationInput, 
  SBCertificationData 
} from "../utils/certificationRating";
import { triggerHaptic } from "../utils/haptics";
import { motion, AnimatePresence } from "motion/react";

interface SBCertificationBadgeProps {
  input: SBCertificationInput;
  size?: "xs" | "sm" | "md" | "lg";
  showScore?: boolean;
  showBreakdownModalOnHoverOrClick?: boolean;
  className?: string;
}

export const SBCertificationBadge: React.FC<SBCertificationBadgeProps> = ({
  input,
  size = "sm",
  showScore = true,
  showBreakdownModalOnHoverOrClick = true,
  className = ""
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cert = calculateSBCertification(input);
  const IconComp = cert.icon;

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[9px] gap-1",
    sm: "px-2 py-0.5 text-[10px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-2",
    lg: "px-3.5 py-1.5 text-sm gap-2.5",
  }[size];

  const handleOpenBreakdown = (e: React.MouseEvent) => {
    if (!showBreakdownModalOnHoverOrClick) return;
    e.stopPropagation();
    triggerHaptic("selection");
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenBreakdown}
        className={`inline-flex items-center alien-block-cut-sm border font-martian font-bold uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer select-none hover:scale-105 active:scale-95 ${cert.badgeBg} ${cert.badgeBorder} ${cert.badgeText} ${cert.glowClass} ${sizeClasses} ${className}`}
        title={`Stock Bloc Certified: ${cert.tier} (${cert.tierTitle}) • Click to view activity & likes audit`}
      >
        <IconComp className={size === "xs" ? "w-2.5 h-2.5" : size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span className="font-black">{cert.tier}</span>
        {showScore && (
          <span className="opacity-80 font-normal text-[9px]">
            [{cert.score}]
          </span>
        )}
      </button>

      {/* Detail Breakdown Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#020b17] border-2 border-cyan-500/50 alien-block-cut shadow-2xl shadow-cyan-950/80 overflow-hidden font-sans text-sm"
            >
              {/* Header */}
              <div className={`p-4.5 border-b border-cyan-500/30 flex items-center justify-between ${cert.badgeBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 alien-block-cut-sm flex items-center justify-center border ${cert.badgeBorder} ${cert.badgeBg} ${cert.badgeText}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-zen text-white tracking-wide">
                        {cert.tier} CERTIFIED
                      </span>
                      <span className="text-[10px] font-martian px-2 py-0.5 bg-black/60 border border-cyan-500/40 text-cyan-300 alien-block-cut-sm">
                        {cert.percentile}
                      </span>
                    </div>
                    <p className={`text-xs font-martian ${cert.badgeText}`}>
                      {cert.tierTitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 alien-block-cut-sm bg-black/60 border border-cyan-500/40 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Score & Progress */}
                <div className="p-3.5 alien-block-cut-sm bg-black/70 border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs font-martian mb-1.5">
                    <span className="text-neutral-300">Total Certification Score:</span>
                    <span className="text-amber-300 font-bold text-sm">{cert.score} Alpha Points</span>
                  </div>

                  {cert.nextTierScore && (
                    <>
                      <div className="w-full bg-neutral-950 h-2 alien-block-cut-sm border border-cyan-900/40 overflow-hidden my-2">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400"
                          style={{ width: `${cert.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-martian text-neutral-400">
                        <span>{cert.tier}</span>
                        <span>{cert.pointsToNextTier} pts to next tier</span>
                        <span>{cert.nextTierScore} PTS</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Mathematical Activity Breakdown Ledger */}
                <div>
                  <h4 className="text-[11px] font-alien-hud uppercase text-cyan-400 flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    CERTIFICATION SCORE FORMULA & PROOF
                  </h4>

                  <div className="space-y-2 text-xs font-martian">
                    {/* Likes Received */}
                    <div className="p-2.5 alien-block-cut-sm bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-neutral-200">Community Likes & Upvotes</span>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-400 font-bold">+{cert.breakdown.likesPoints} pts</span>
                        <span className="text-[9px] text-neutral-500 block">({cert.metrics.likesReceived} × 15)</span>
                      </div>
                    </div>

                    {/* Theses Authored */}
                    <div className="p-2.5 alien-block-cut-sm bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-neutral-200">Published Theses & Posts</span>
                      </div>
                      <div className="text-right">
                        <span className="text-cyan-300 font-bold">+{cert.breakdown.thesesPoints} pts</span>
                        <span className="text-[9px] text-neutral-500 block">({cert.metrics.thesesCount} × 25)</span>
                      </div>
                    </div>

                    {/* Replies & Comments */}
                    <div className="p-2.5 alien-block-cut-sm bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-neutral-200">Replies & Thread Intel</span>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-300 font-bold">+{cert.breakdown.repliesPoints} pts</span>
                        <span className="text-[9px] text-neutral-500 block">({cert.metrics.repliesCount} × 10)</span>
                      </div>
                    </div>

                    {/* Live Market Chat Signals */}
                    <div className="p-2.5 alien-block-cut-sm bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-neutral-200">Live Node Chat Signals</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-300 font-bold">+{cert.breakdown.chatPoints} pts</span>
                        <span className="text-[9px] text-neutral-500 block">({cert.metrics.chatCount} × 4)</span>
                      </div>
                    </div>

                    {/* Accuracy & Genesis Calibration */}
                    <div className="p-2.5 alien-block-cut-sm bg-black/60 border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-neutral-200">Accuracy Bonus ({cert.metrics.winRate})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-300 font-bold">+{cert.breakdown.accuracyBonus + cert.breakdown.basePoints} pts</span>
                        <span className="text-[9px] text-neutral-500 block">Base + Calibration</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Tier Scale Reference */}
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 alien-block-cut-sm text-[11px] text-neutral-300 space-y-1 font-martian">
                  <span className="text-[10px] font-alien-hud text-cyan-400 uppercase block font-bold">
                    Certification Tier Hierarchy:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className="text-amber-300">👑 SB-AAA: 900+ pts (Apex)</span>
                    <span className="text-cyan-300">⚡ SB-AA: 700-899 pts (Prime)</span>
                    <span className="text-emerald-300">🔥 SB-A: 450-699 pts (Quant)</span>
                    <span className="text-blue-300">🎯 SB-B: 250-449 pts (Active)</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-black/90 border-t border-cyan-500/30 flex items-center justify-between">
                <span className="text-[10px] font-martian text-neutral-400">
                  Updated live on every community action
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 alien-block-cut-sm bg-cyan-400 text-black font-alien-hud font-bold text-xs hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
