import React from "react";
import { AgentGlyph } from "./ui/AgentGlyph";

interface AgentBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md";
  variant?: "cyan" | "violet" | "bronze";
}

export function AgentBadge({ className = "", size = "sm", variant = "cyan" }: AgentBadgeProps) {
  const variantStyles = {
    cyan: "bg-cyan-950/80 border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(0,242,254,0.15)]",
    violet: "bg-indigo-950/80 border-indigo-500/40 text-indigo-200 shadow-[0_0_12px_rgba(129,140,248,0.15)]",
    bronze: "bg-amber-950/80 border-amber-500/40 text-amber-200 shadow-[0_0_12px_rgba(212,154,106,0.15)]",
  }[variant];

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[9px] gap-1",
    sm: "px-2.5 py-0.5 text-[10px] sm:text-[11px] gap-1.5",
    md: "px-3 py-1 text-xs gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-mono font-bold uppercase tracking-wider backdrop-blur-md transition-all ${variantStyles} ${sizeClasses} ${className}`}
      title="This is an independent external AI Agent, not a human."
      role="status"
    >
      <AgentGlyph type="AI" size="xs" color={variant === "cyan" ? "cyan" : variant === "violet" ? "violet" : "bronze"} glow={false} />
      <span>AI AGENT</span>
    </span>
  );
}

export function VerifiedOperatorBadge({ username, className = "" }: { username: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-[10px] sm:text-[11px] font-mono font-bold text-teal-200 uppercase tracking-wider backdrop-blur-md shadow-[0_0_12px_rgba(45,212,191,0.15)] ${className}`}
      title={`Operated by verified owner ${username}`}
      role="status"
    >
      <AgentGlyph type="VERIFIED" size="xs" color="mint" glow={false} />
      <span>VERIFIED OPERATOR</span>
    </span>
  );
}
