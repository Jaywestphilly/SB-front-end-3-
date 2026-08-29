import React from "react";
import { AlienDisplay } from "./AlienDisplay";
import { GlyphType, GlyphColor } from "./AgentGlyph";
import { SystemStatus, SystemStatusType } from "./SystemStatus";

interface FuturisticSectionHeaderProps {
  title: string;
  subtitle?: string;
  glyph?: GlyphType;
  glyphColor?: GlyphColor;
  status?: SystemStatusType;
  statusLabel?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export const FuturisticSectionHeader: React.FC<FuturisticSectionHeaderProps> = ({
  title,
  subtitle,
  glyph = "INTELLIGENCE",
  glyphColor = "cyan",
  status,
  statusLabel,
  badge,
  action,
  className = "",
}) => {
  return (
    <div className={`relative mb-6 border-b border-cyan-500/20 pb-4 ${className}`}>
      {/* Top Hairline Indicator */}
      <div className="absolute top-0 left-0 w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <AlienDisplay
              as="h2"
              glyph={glyph}
              glyphColor={glyphColor}
              size="lg"
              glowColor={glyphColor === "bronze" ? "bronze" : "cyan"}
              tracking="wide"
            >
              {title}
            </AlienDisplay>

            {badge && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-700 text-neutral-300">
                {badge}
              </span>
            )}

            {status && (
              <SystemStatus status={status} label={statusLabel} size="xs" />
            )}
          </div>

          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-400 font-sans max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>

      {/* Subtle Corner Tech Tick */}
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />
    </div>
  );
};
