import React, { useState, useEffect } from "react";

export type StockBlocLogoVariant = "3d" | "flat";

interface StockBlocLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  showTagline?: boolean;
  framed?: boolean;
  glow?: boolean;
  variant?: StockBlocLogoVariant;
  className?: string;
  onClick?: () => void;
}

export const StockBlocLogo: React.FC<StockBlocLogoProps> = ({
  size = "md",
  showText = true,
  showTagline = false,
  framed = false,
  glow = true,
  variant,
  className = "",
  onClick,
}) => {
  // Listen to global preference if variant prop is not explicitly provided
  const [selectedVariant, setSelectedVariant] = useState<StockBlocLogoVariant>(() => {
    if (variant) return variant;
    try {
      const stored = localStorage.getItem("stockbloc_logo_variant");
      if (stored === "3d" || stored === "flat") return stored;
    } catch {
      // ignore
    }
    return "3d";
  });

  useEffect(() => {
    if (variant) {
      setSelectedVariant(variant);
      return;
    }
    const handleVariantChange = (e: CustomEvent<{ variant: StockBlocLogoVariant }>) => {
      if (e.detail?.variant) {
        setSelectedVariant(e.detail.variant);
      }
    };
    window.addEventListener("stockbloc:logo_variant" as any, handleVariantChange);
    return () => {
      window.removeEventListener("stockbloc:logo_variant" as any, handleVariantChange);
    };
  }, [variant]);

  // Dimensions based on size
  const iconDimensions = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
    hero: "w-44 h-44 sm:w-56 sm:h-56",
  }[size];

  const glowBlur = {
    sm: "blur-md opacity-40",
    md: "blur-lg opacity-50",
    lg: "blur-xl opacity-60",
    xl: "blur-2xl opacity-70",
    hero: "blur-3xl opacity-80",
  }[size];

  const textSizeClass = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-base sm:text-lg",
    xl: "text-xl sm:text-2xl",
    hero: "text-2xl sm:text-4xl",
  }[size];

  // Resolve asset based on chosen variant
  const logoSrc = selectedVariant === "flat" ? "/Logo2.png" : "/Logo1.png";

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Official Stock Bloc Liberty Bell & SB Momentum Arrow Logo Emblem */}
      <div
        className={`relative ${iconDimensions} flex items-center justify-center group ${
          framed
            ? "p-2 bg-[#020617]/95 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.35)] rounded-2xl"
            : ""
        }`}
      >
        {/* Ambient Cyan Lighting / Glow Layer */}
        {glow && (
          <div
            className={`absolute inset-0 bg-cyan-400/25 rounded-full ${glowBlur} group-hover:bg-cyan-300/40 group-hover:scale-110 transition-all duration-500 pointer-events-none`}
            aria-hidden="true"
          />
        )}

        {framed && (
          <>
            <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </>
        )}

        <img
          src={logoSrc}
          alt={`Stock Bloc Liberty Bell Logo (${selectedVariant.toUpperCase()})`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_4px_18px_rgba(6,182,212,0.5)] group-hover:scale-105 group-hover:drop-shadow-[0_6px_28px_rgba(34,211,238,0.75)] transition-all duration-300"
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

export default StockBlocLogo;
