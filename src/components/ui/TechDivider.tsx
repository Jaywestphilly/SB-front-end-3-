import React from "react";
import { AgentGlyph, GlyphType, GlyphColor } from "./AgentGlyph";

interface TechDividerProps {
  glyph?: GlyphType;
  glyphColor?: GlyphColor;
  label?: string;
  className?: string;
}

export const TechDivider: React.FC<TechDividerProps> = ({
  glyph = "SYSTEM",
  glyphColor = "cyan",
  label,
  className = "",
}) => {
  return (
    <div className={`relative flex items-center justify-center my-6 ${className}`}>
      <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-cyan-500/50" />
      
      <div className="mx-4 flex items-center gap-2 px-3 py-0.5 rounded-full bg-neutral-950 border border-cyan-500/30 text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase shadow-sm">
        <AgentGlyph type={glyph} size="xs" color={glyphColor} glow={false} />
        {label && <span>{label}</span>}
      </div>

      <div className="flex-grow h-[1px] bg-gradient-to-l from-transparent via-cyan-500/25 to-cyan-500/50" />
    </div>
  );
};
