import React from "react";
import {
  X,
  Zap,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../utils/haptics";

interface SBScoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SBScoreGuideModal: React.FC<SBScoreGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="sb-score-guide-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          id="sb-score-guide-modal"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#030d17] border border-cyan-500/50 alien-block-cut shadow-2xl shadow-cyan-950/60 p-5 md:p-6 text-cyan-100 max-h-[90vh] overflow-y-auto font-martian space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-cyan-500/30 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 alien-block-cut-sm bg-cyan-950 border border-cyan-400 text-cyan-300">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-wider uppercase text-cyan-200 font-mono">
                    SB SCORE // QUANT METHODOLOGY
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-bold">
                    0–100 SCALE
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  Stock Bloc's proprietary deterministic algorithmic rating engine
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic("selection");
                onClose();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Summary Banner */}
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 alien-block-cut-sm flex items-start gap-2.5 text-xs text-cyan-200">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              The <strong>Stock Bloc (SB) Score</strong> synthesizes 5 real-time quantitative pillars (technical momentum, moving average stack alignment, volume confirmation, 52-week price range positioning, and volatility) into a single 0–100 rating for instant trade validation.
            </div>
          </div>

          {/* 5 Mathematical Pillars Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              THE 5 QUANTITATIVE PILLARS (100 TOTAL POINTS)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Momentum */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    1. Momentum
                  </span>
                  <span className="text-emerald-400 font-black">25 PTS MAX</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Evaluates 14-period RSI and 1D net change. Optimal points awarded in the healthy bullish acceleration zone (RSI 50–70). Docks points for overbought (&gt;70) or severe downside momentum (&lt;30).
                </p>
              </div>

              {/* 2. Trend & SMAs */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    2. Trend Alignment
                  </span>
                  <span className="text-emerald-400 font-black">25 PTS MAX</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Tests price against <strong>20-Day</strong>, <strong>50-Day</strong>, and <strong>200-Day SMAs</strong>. Full 25 points awarded when price is stacked above all three key moving averages.
                </p>
              </div>

              {/* 3. Relative Strength */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    3. 52-Week Range
                  </span>
                  <span className="text-emerald-400 font-black">20 PTS MAX</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Calculates where current price sits in its 52-week corridor (`Low52` vs `High52`). Scores highest when consolidating or breaking out in the <strong>70th–95th percentile</strong>.
                </p>
              </div>

              {/* 4. Volume Confirmation */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    4. Volume Accumulation
                  </span>
                  <span className="text-emerald-400 font-black">15 PTS MAX</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Compares current volume to 30-day average volume. High-volume green days (&gt;1.2x average) trigger institutional accumulation points.
                </p>
              </div>

              {/* 5. Volatility */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5 hover:border-cyan-500/40 transition-all sm:col-span-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    5. Price Stability & Volatility
                  </span>
                  <span className="text-emerald-400 font-black">15 PTS MAX</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Measures historical price variance across intraday sparklines. Controlled, orderly trending price action earns maximum stability points.
                </p>
              </div>
            </div>
          </div>

          {/* 4-Tier Color Coded Signal Matrix */}
          <div className="space-y-2">
            <h4 className="text-xs font-black tracking-wider uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5" />
              4-COLOR SIGNAL MATRIX & REGIMES
            </h4>

            <div className="overflow-hidden border border-cyan-500/30 alien-block-cut-sm text-xs">
              <table className="w-full text-left font-mono">
                <thead className="bg-cyan-950/60 text-cyan-300 text-[11px] border-b border-cyan-900/60">
                  <tr>
                    <th className="p-2.5">SCORE RANGE</th>
                    <th className="p-2.5">COLOR & SIGNAL</th>
                    <th className="p-2.5">MARKET REGIME & ALIGNMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/40 text-[11px]">
                  <tr className="bg-emerald-950/25 hover:bg-emerald-950/40">
                    <td className="p-2.5 font-black text-emerald-400">75 – 100</td>
                    <td className="p-2.5 font-bold text-emerald-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                        GREEN (BULLISH)
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-300">
                      Price stacked above 20D/50D/200D SMAs with strong accumulation volume and healthy RSI momentum.
                    </td>
                  </tr>

                  <tr className="bg-cyan-950/25 hover:bg-cyan-950/40">
                    <td className="p-2.5 font-black text-cyan-400">60 – 74</td>
                    <td className="p-2.5 font-bold text-cyan-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/20 border border-cyan-400/60 text-cyan-300">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                        BLUE (MOD BULL)
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-300">
                      Constructive trend structure, above short/intermediate moving averages with steady accumulation.
                    </td>
                  </tr>

                  <tr className="bg-amber-950/20 hover:bg-amber-950/35">
                    <td className="p-2.5 font-black text-amber-400">40 – 59</td>
                    <td className="p-2.5 font-bold text-amber-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                        YELLOW (NEUTRAL)
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-300">
                      Consolidation channel, range-bound price action, or mixed technical momentum readings.
                    </td>
                  </tr>

                  <tr className="bg-rose-950/25 hover:bg-rose-950/40">
                    <td className="p-2.5 font-black text-rose-400">0 – 39</td>
                    <td className="p-2.5 font-bold text-rose-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/60 text-rose-300">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                        RED (BEARISH / CAUTION)
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-300">
                      Structural breakdown below key moving averages, negative relative strength, or heavy distribution.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade Horizon Strategy Implications Guide */}
          <div className="space-y-2.5 border-t border-cyan-500/30 pt-3.5">
            <h4 className="text-xs font-black tracking-wider uppercase text-cyan-300 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              STRATEGY IMPLICATIONS: DAY TRADE vs SWING TRADE vs LONG-TERM HOLD
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Day Trading */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-200">
                  <span>DAY TRADING</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                    INTRADAY
                  </span>
                </div>
                <ul className="text-[11px] text-neutral-300 space-y-1 leading-relaxed">
                  <li>
                    <strong className="text-emerald-400">Green (75-100):</strong> Best for intraday momentum breakout continuations and high relative volume surges.
                  </li>
                  <li>
                    <strong className="text-cyan-400">Blue (60-74):</strong> Ideal for dip buys near VWAP or 9/20 EMA support.
                  </li>
                  <li>
                    <strong className="text-amber-400">Yellow (40-59):</strong> Chop zone; trade quick mean-reversion scalps between support & resistance.
                  </li>
                  <li>
                    <strong className="text-rose-400">Red (&lt;40):</strong> Short bias or avoid long intraday positions due to breakdown risk.
                  </li>
                </ul>
              </div>

              {/* Swing Trading */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-200">
                  <span>SWING TRADING</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                    3–15 DAYS
                  </span>
                </div>
                <ul className="text-[11px] text-neutral-300 space-y-1 leading-relaxed">
                  <li>
                    <strong className="text-emerald-400">Green (75-100):</strong> Prime swing setup; moving averages stacked bullishly with momentum tailwind.
                  </li>
                  <li>
                    <strong className="text-cyan-400">Blue (60-74):</strong> High quality accumulation swing; enter on pullbacks to the 20-Day SMA.
                  </li>
                  <li>
                    <strong className="text-amber-400">Yellow (40-59):</strong> Wait for breakout confirmation above resistance before scaling in.
                  </li>
                  <li>
                    <strong className="text-rose-400">Red (&lt;40):</strong> Unfavorable for long swings; high risk of multi-day drift lower.
                  </li>
                </ul>
              </div>

              {/* Long-Term Hold */}
              <div className="p-3 bg-black/60 border border-cyan-900/60 alien-block-cut-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-200">
                  <span>LONG-TERM HOLD</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                    MONTHS–YEARS
                  </span>
                </div>
                <ul className="text-[11px] text-neutral-300 space-y-1 leading-relaxed">
                  <li>
                    <strong className="text-emerald-400">Green (75-100):</strong> Premium macro health; asset is leading the market above 200D SMA.
                  </li>
                  <li>
                    <strong className="text-cyan-400">Blue (60-74):</strong> Steady accumulation zone; favorable dollar-cost averaging (DCA) territory.
                  </li>
                  <li>
                    <strong className="text-amber-400">Yellow (40-59):</strong> Neutral holding phase; retain core allocation, pause new additions.
                  </li>
                  <li>
                    <strong className="text-rose-400">Red (&lt;40):</strong> Fundamental or technical deterioration; consider trimming or hedging.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                triggerHaptic("selection");
                onClose();
              }}
              className="px-5 py-2 alien-block-cut-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95 glow-cyan"
            >
              GOT IT // RETURN TO WATCHLIST
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
