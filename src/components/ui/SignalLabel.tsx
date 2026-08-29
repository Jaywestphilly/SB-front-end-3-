import React from "react";
import { AgentGlyph, GlyphType } from "./AgentGlyph";

export type SignalSentiment = "BULLISH" | "BEARISH" | "NEUTRAL" | "SURGE" | "WHALE" | "HIGH_CALIBRATION";

interface SignalLabelProps {
  sentiment: SignalSentiment;
  label?: string;
  value?: string | number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const sentimentConfigs: Record<
  SignalSentiment,
  {
    glyph: GlyphType;
    defaultLabel: string;
    border: string;
    bg: string;
    text: string;
    glyphColor: "mint" | "rose" | "cyan" | "amber" | "violet" | "bronze";
  }
> = {
  BULLISH: {
    glyph: "SIGNAL",
    defaultLabel: "BULLISH BIAS",
    border: "border-emerald-500/40",
    bg: "bg-emerald-950/40",
    text: "text-emerald-300",
    glyphColor: "mint",
  },
  BEARISH: {
    glyph: "SIGNAL",
    defaultLabel: "BEARISH BIAS",
    border: "border-rose-500/40",
    bg: "bg-rose-950/40",
    text: "text-rose-300",
    glyphColor: "rose",
  },
  NEUTRAL: {
    glyph: "DATA",
    defaultLabel: "NEUTRAL / ACCUMULATION",
    border: "border-cyan-500/30",
    bg: "bg-cyan-950/30",
    text: "text-cyan-300",
    glyphColor: "cyan",
  },
  SURGE: {
    glyph: "ALPHA",
    defaultLabel: "MOMENTUM SURGE",
    border: "border-amber-500/40",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    glyphColor: "amber",
  },
  WHALE: {
    glyph: "INTELLIGENCE",
    defaultLabel: "WHALE FLOW",
    border: "border-indigo-500/40",
    bg: "bg-indigo-950/40",
    text: "text-indigo-300",
    glyphColor: "violet",
  },
  HIGH_CALIBRATION: {
    glyph: "ORACLE",
    defaultLabel: "HIGH BRIER CALIBRATION",
    border: "border-teal-500/40",
    bg: "bg-teal-950/40",
    text: "text-teal-300",
    glyphColor: "mint",
  },
};

const sizeClasses = {
  xs: "px-2 py-0.5 text-[9px] gap-1",
  sm: "px-2.5 py-1 text-[10px] sm:text-xs gap-1.5",
  md: "px-3 py-1.5 text-xs sm:text-sm gap-2",
};

export const SignalLabel: React.FC<SignalLabelProps> = ({
  sentiment,
  label,
  value,
  size = "sm",
  className = "",
}) => {
  const config = sentimentConfigs[sentiment] || sentimentConfigs.NEUTRAL;
  const displayText = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-lg border backdrop-blur-md transition-all ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]} ${className}`}
    >
      <AgentGlyph type={config.glyph} size="xs" color={config.glyphColor} glow={false} />
      <span>{displayText}</span>
      {value !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-black/40 border border-white/10 text-white font-mono">
          {value}
        </span>
      )}
    </span>
  );
};
