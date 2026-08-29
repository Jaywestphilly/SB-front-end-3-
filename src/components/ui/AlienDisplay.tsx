import React from "react";
import { AgentGlyph, GlyphType, GlyphColor } from "./AgentGlyph";

interface AlienDisplayProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "div";
  glyph?: GlyphType;
  glyphColor?: GlyphColor;
  glyphPosition?: "left" | "right" | "both" | "none";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  glowColor?: "cyan" | "bronze" | "violet" | "mint" | "electric" | "white" | "none";
  brackets?: boolean;
  tracking?: "normal" | "wide" | "widest";
  className?: string;
}

const sizeClasses = {
  xs: "text-[11px] font-bold",
  sm: "text-xs font-bold sm:text-sm",
  md: "text-sm sm:text-base font-extrabold",
  lg: "text-lg sm:text-xl font-black",
  xl: "text-2xl sm:text-3xl font-black",
  hero: "text-3xl sm:text-5xl lg:text-6xl font-black",
};

const trackingClasses = {
  normal: "tracking-[0.05em]",
  wide: "tracking-[0.12em]",
  widest: "tracking-[0.22em]",
};

const glowClasses = {
  cyan: "text-cyan-100 drop-shadow-[0_0_12px_rgba(0,242,254,0.6)]",
  bronze: "text-amber-100 drop-shadow-[0_0_12px_rgba(212,154,106,0.6)]",
  violet: "text-indigo-100 drop-shadow-[0_0_12px_rgba(129,140,248,0.6)]",
  mint: "text-teal-100 drop-shadow-[0_0_12px_rgba(45,212,191,0.6)]",
  electric: "text-sky-100 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]",
  white: "text-slate-50 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
  none: "text-slate-100",
};

export const AlienDisplay: React.FC<AlienDisplayProps> = ({
  children,
  as: Component = "span",
  glyph,
  glyphColor = "cyan",
  glyphPosition = "left",
  size = "md",
  glowColor = "cyan",
  brackets = false,
  tracking = "wide",
  className = "",
}) => {
  const glyphSize = size === "hero" ? "lg" : size === "xl" ? "md" : size === "lg" ? "sm" : "xs";

  return (
    <Component
      className={`inline-flex items-center gap-2 font-display uppercase select-none transition-all duration-300 ${
        sizeClasses[size]
      } ${trackingClasses[tracking]} ${glowClasses[glowColor]} ${className}`}
    >
      {brackets && (
        <span className="text-cyan-500/60 font-mono text-[0.85em] font-normal" aria-hidden="true">
          [
        </span>
      )}

      {glyph && (glyphPosition === "left" || glyphPosition === "both") && (
        <AgentGlyph type={glyph} size={glyphSize} color={glyphColor} glow={glowColor !== "none"} />
      )}

      <span className="relative z-10">{children}</span>

      {glyph && (glyphPosition === "right" || glyphPosition === "both") && (
        <AgentGlyph type={glyph} size={glyphSize} color={glyphColor} glow={glowColor !== "none"} />
      )}

      {brackets && (
        <span className="text-cyan-500/60 font-mono text-[0.85em] font-normal" aria-hidden="true">
          ]
        </span>
      )}
    </Component>
  );
};
