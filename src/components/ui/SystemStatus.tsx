import React from "react";
import { AgentGlyph, GlyphType } from "./AgentGlyph";

export type SystemStatusType =
  | "LIVE"
  | "ONLINE"
  | "OFFLINE"
  | "VERIFIED"
  | "TEST"
  | "DEGRADED"
  | "CALIBRATED"
  | "INSUFFICIENT_DATA"
  | "SYNCHRONIZED"
  | "ALPHA";

interface SystemStatusProps {
  status: SystemStatusType;
  label?: string;
  size?: "xs" | "sm" | "md";
  showGlyph?: boolean;
  className?: string;
}

interface StatusConfig {
  glyph: GlyphType;
  bracketSymbol: string;
  defaultLabel: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  glyphColor: "cyan" | "mint" | "bronze" | "violet" | "rose" | "amber" | "white";
  pulse: boolean;
}

const statusConfigs: Record<SystemStatusType, StatusConfig> = {
  LIVE: {
    glyph: "LIVE",
    bracketSymbol: "●",
    defaultLabel: "LIVE",
    colorClass: "text-emerald-300",
    borderClass: "border-emerald-500/40",
    bgClass: "bg-emerald-950/50",
    glyphColor: "mint",
    pulse: true,
  },
  ONLINE: {
    glyph: "SYSTEM",
    bracketSymbol: "◆",
    defaultLabel: "ONLINE",
    colorClass: "text-cyan-300",
    borderClass: "border-cyan-500/40",
    bgClass: "bg-cyan-950/50",
    glyphColor: "cyan",
    pulse: false,
  },
  VERIFIED: {
    glyph: "VERIFIED",
    bracketSymbol: "◇",
    defaultLabel: "VERIFIED",
    colorClass: "text-teal-300",
    borderClass: "border-teal-500/40",
    bgClass: "bg-teal-950/50",
    glyphColor: "mint",
    pulse: false,
  },
  CALIBRATED: {
    glyph: "ORACLE",
    bracketSymbol: "◈",
    defaultLabel: "CALIBRATED",
    colorClass: "text-cyan-200",
    borderClass: "border-cyan-400/40",
    bgClass: "bg-cyan-950/50",
    glyphColor: "cyan",
    pulse: false,
  },
  TEST: {
    glyph: "SYSTEM",
    bracketSymbol: "△",
    defaultLabel: "TEST AGENT",
    colorClass: "text-amber-300",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-950/50",
    glyphColor: "amber",
    pulse: false,
  },
  DEGRADED: {
    glyph: "SIGNAL",
    bracketSymbol: "▲",
    defaultLabel: "DEGRADED",
    colorClass: "text-rose-300",
    borderClass: "border-rose-500/40",
    bgClass: "bg-rose-950/50",
    glyphColor: "rose",
    pulse: true,
  },
  OFFLINE: {
    glyph: "SYSTEM",
    bracketSymbol: "○",
    defaultLabel: "OFFLINE",
    colorClass: "text-slate-400",
    borderClass: "border-slate-700/60",
    bgClass: "bg-slate-900/50",
    glyphColor: "white",
    pulse: false,
  },
  INSUFFICIENT_DATA: {
    glyph: "DATA",
    bracketSymbol: "⬡",
    defaultLabel: "INSUFFICIENT DATA",
    colorClass: "text-slate-300",
    borderClass: "border-slate-600/50",
    bgClass: "bg-slate-900/50",
    glyphColor: "bronze",
    pulse: false,
  },
  SYNCHRONIZED: {
    glyph: "NETWORK",
    bracketSymbol: "⬢",
    defaultLabel: "SYNCHRONIZED",
    colorClass: "text-indigo-300",
    borderClass: "border-indigo-500/40",
    bgClass: "bg-indigo-950/50",
    glyphColor: "violet",
    pulse: false,
  },
  ALPHA: {
    glyph: "ALPHA",
    bracketSymbol: "▲",
    defaultLabel: "QUANT ALPHA",
    colorClass: "text-amber-200",
    borderClass: "border-amber-400/40",
    bgClass: "bg-amber-950/50",
    glyphColor: "bronze",
    pulse: true,
  },
};

const sizeClasses = {
  xs: "px-2 py-0.5 text-[9px] gap-1",
  sm: "px-2.5 py-0.5 text-[10px] sm:text-[11px] gap-1.5",
  md: "px-3 py-1 text-xs gap-2",
};

export const SystemStatus: React.FC<SystemStatusProps> = ({
  status,
  label,
  size = "sm",
  showGlyph = true,
  className = "",
}) => {
  const config = statusConfigs[status] || statusConfigs.ONLINE;
  const displayText = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-lg border backdrop-blur-md transition-all ${config.bgClass} ${config.borderClass} ${config.colorClass} ${sizeClasses[size]} ${className}`}
      title={`System status: ${displayText}`}
      role="status"
    >
      <span className="opacity-70 font-mono text-[0.9em]" aria-hidden="true">
        [{config.bracketSymbol}
      </span>

      {showGlyph && (
        <AgentGlyph
          type={config.glyph}
          size="xs"
          color={config.glyphColor}
          glow={false}
          pulse={config.pulse}
        />
      )}

      <span>{displayText}</span>

      <span className="opacity-70 font-mono text-[0.9em]" aria-hidden="true">
        ]
      </span>
    </span>
  );
};
