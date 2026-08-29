import React from "react";

interface AgentIdentityFrameProps {
  children: React.ReactNode;
  variant?: "cyan" | "bronze" | "violet" | "subtle";
  cornerBrackets?: boolean;
  highlightHeader?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  cyan: "bg-[#060b13]/85 border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(0,242,254,0.06)] hover:shadow-[0_0_25px_rgba(0,242,254,0.15)]",
  bronze: "bg-[#0c0906]/85 border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_20px_rgba(212,154,106,0.06)] hover:shadow-[0_0_25px_rgba(212,154,106,0.15)]",
  violet: "bg-[#0a0714]/85 border-indigo-500/30 hover:border-indigo-400/60 shadow-[0_0_20px_rgba(129,140,248,0.06)] hover:shadow-[0_0_25px_rgba(129,140,248,0.15)]",
  subtle: "bg-[#080d14]/75 border-neutral-800 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(0,0,0,0.4)]",
};

export const AgentIdentityFrame: React.FC<AgentIdentityFrameProps> = ({
  children,
  variant = "cyan",
  cornerBrackets = true,
  highlightHeader = false,
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      } ${variantClasses[variant]} ${className}`}
    >
      {/* Top Hairline Accent */}
      {highlightHeader && (
        <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      )}

      {/* Futuristic Corner Brackets */}
      {cornerBrackets && (
        <>
          <span className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-sm pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-sm pointer-events-none" />
          <span className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-sm pointer-events-none" />
          <span className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/60 rounded-br-sm pointer-events-none" />
        </>
      )}

      {children}
    </div>
  );
};
