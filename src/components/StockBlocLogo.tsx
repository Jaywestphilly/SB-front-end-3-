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
      {/* Official Stock Bloc Liberty Bell & SB Bull Arrow Logo Emblem */}
      <div
        className={`relative ${iconDimensions} flex items-center justify-center group overflow-hidden rounded-2xl ${
          framed
            ? "p-1 bg-[#030712] border border-cyan-500/40 shadow-[0_0_30px_rgba(0,242,254,0.3)]"
            : ""
        }`}
      >
        {framed && (
          <>
            <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </>
        )}
        <img
          src="/logo.png"
          alt="Stock Bloc Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-xl relative z-10 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]"
          loading="eager"
        />
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


