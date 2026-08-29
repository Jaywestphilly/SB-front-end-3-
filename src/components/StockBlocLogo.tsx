import React from "react";

interface StockBlocLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  showTagline?: boolean;
  framed?: boolean;
  className?: string;
}

export const StockBlocLogo: React.FC<StockBlocLogoProps> = ({
  size = "md",
  showText = true,
  showTagline = false,
  framed = false,
  className = "",
}) => {
  // Dimensions based on size
  const iconDimensions = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
    hero: "w-48 h-48 sm:w-56 sm:h-56",
  }[size];

  const textSizeClass = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-base sm:text-lg",
    xl: "text-xl sm:text-2xl",
    hero: "text-2xl sm:text-4xl",
  }[size];

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Official Stock Bloc Bell & SB Arrow Logo Emblem with subtle geometric framing */}
      <div
        className={`relative ${iconDimensions} flex items-center justify-center group overflow-hidden rounded-2xl ${
          framed
            ? "p-1.5 bg-[#060b13] border border-cyan-500/40 shadow-[0_0_25px_rgba(0,242,254,0.25)]"
            : ""
        }`}
      >
        {framed && (
          <>
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </>
        )}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-xl relative z-10 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]"
        >
          <defs>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="neonGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Background circle / polygon */}
          <rect width="100" height="100" rx="16" fill="#030712" />
          
          {/* Geometric grid lines inside */}
          <path d="M 10 0 L 10 100 M 30 0 L 30 100 M 50 0 L 50 100 M 70 0 L 70 100 M 90 0 L 90 100" stroke="#0891b2" strokeWidth="0.5" strokeOpacity="0.2" />
          <path d="M 0 10 L 100 10 M 0 30 L 100 30 M 0 50 L 100 50 M 0 70 L 100 70 M 0 90 L 100 90" stroke="#0891b2" strokeWidth="0.5" strokeOpacity="0.2" />
          
          {/* Bell base outline */}
          <path
            d="M 25 75 Q 25 35 50 22 Q 75 35 75 75 Z"
            fill="url(#neonGlow)"
            stroke="#0891b2"
            strokeWidth="2"
          />
          
          {/* SB Arrow - Futuristic Arrow pointing up/right */}
          <path
            d="M 43 65 L 43 45 L 34 52 L 34 42 L 50 28 L 66 42 L 66 52 L 57 45 L 57 65 Z"
            fill="url(#cyanGrad)"
            stroke="#22d3ee"
            strokeWidth="1.5"
          />
          
          {/* Little tech accent circles */}
          <circle cx="50" cy="15" r="3" fill="#22d3ee" />
          <circle cx="50" cy="75" r="4.5" fill="#ef4444" /> {/* Red clapper alert */}
        </svg>
      </div>

      {/* "STOCK BLOC" Text & Tagline */}
      {showText && (
        <div className="mt-3 text-center">
          <h2
            className={`${textSizeClass} font-black text-cyan-100 tracking-[0.2em] uppercase font-display drop-shadow-[0_0_16px_rgba(34,211,238,0.7)]`}
          >
            STOCK BLOC
          </h2>
          {showTagline && (
            <p className="mt-1 text-[10px] sm:text-xs font-bold tracking-[0.28em] text-cyan-400/90 font-mono uppercase">
              FUTURE FINANCIAL INTELLIGENCE NETWORK
            </p>
          )}
        </div>
      )}
    </div>
  );
};

