import React from "react";

export type CornerPosition = "tl" | "tr" | "bl" | "br";

interface AlienCornerHieroglyphProps {
  position: CornerPosition;
  color: string;
  symbolSeed?: string;
  className?: string;
}

/**
 * AlienCornerHieroglyph
 * Bespoke mathematical alien hieroglyphics designed for StockCard corners.
 * Serves as both precision HUD corner brackets and ancient extraterrestrial cartouches.
 * Dynamically synchronizes with the asset's telemetry color.
 */
export const AlienCornerHieroglyph: React.FC<AlienCornerHieroglyphProps> = ({
  position,
  color,
  symbolSeed = "",
  className = "",
}) => {
  // Deterministic variant (0: Celestial, 1: Cuneiform, 2: Quantum) based on ticker symbol
  const variantIndex = React.useMemo(() => {
    if (!symbolSeed) return 0;
    let hash = 0;
    for (let i = 0; i < symbolSeed.length; i++) {
      hash = (hash << 5) - hash + symbolSeed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 3;
  }, [symbolSeed]);

  // Positioning classes corresponding to corner
  const positionClass = {
    tl: "top-1 left-1.5",
    tr: "top-1 right-1.5",
    bl: "bottom-1 left-1.5",
    br: "bottom-1 right-1.5",
  }[position];

  const renderGlyph = () => {
    if (variantIndex === 1) {
      // Variant 1: Cuneiform Matrix (Stepped chevrons, tri-stellar nodes, cryptographic slits)
      switch (position) {
        case "tl":
          return (
            <>
              {/* Outer chassis bracket with alien curve */}
              <path
                d="M 1 9 L 1 2.5 C 1 1.7 1.7 1 2.5 1 L 9 1"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Stepped cuneiform chevrons */}
              <path
                d="M 2.5 7 L 7 2.5 M 4.5 8.5 L 8.5 4.5"
                stroke={color}
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              />
              {/* Tri-stellar constellation nodes */}
              <circle cx="4.5" cy="4.5" r="0.9" fill={color} />
              <circle cx="8" cy="8" r="0.9" fill={color} />
              <circle cx="11.5" cy="3" r="0.75" fill={color} />
              {/* Cryptographic telemetry slit */}
              <path
                d="M 10 6.5 L 10 11.5"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />
            </>
          );
        case "tr":
          return (
            <>
              <path
                d="M 7 1 L 13.5 1 C 14.3 1 15 1.7 15 2.5 L 15 9"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 13.5 7 L 9 2.5 M 11.5 8.5 L 7.5 4.5"
                stroke={color}
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="11.5" cy="4.5" r="0.9" fill={color} />
              <circle cx="8" cy="8" r="0.9" fill={color} />
              <circle cx="4.5" cy="3" r="0.75" fill={color} />
              <path
                d="M 6 6.5 L 6 11.5"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />
            </>
          );
        case "bl":
          return (
            <>
              <path
                d="M 1 7 L 1 13.5 C 1 14.3 1.7 15 2.5 15 L 9 15"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 2.5 9 L 7 13.5 M 4.5 7.5 L 8.5 11.5"
                stroke={color}
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="4.5" cy="11.5" r="0.9" fill={color} />
              <circle cx="8" cy="8" r="0.9" fill={color} />
              <circle cx="11.5" cy="13" r="0.75" fill={color} />
              <path
                d="M 10 4.5 L 10 9.5"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />
            </>
          );
        case "br":
          return (
            <>
              <path
                d="M 7 15 L 13.5 15 C 14.3 15 15 14.3 15 13.5 L 15 7"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 13.5 9 L 9 13.5 M 11.5 7.5 L 7.5 11.5"
                stroke={color}
                strokeWidth="1.1"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="11.5" cy="11.5" r="0.9" fill={color} />
              <circle cx="8" cy="8" r="0.9" fill={color} />
              <circle cx="4.5" cy="13" r="0.75" fill={color} />
              <path
                d="M 6 4.5 L 6 9.5"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
                fill="none"
              />
            </>
          );
      }
    }

    if (variantIndex === 2) {
      // Variant 2: Quantum Hexagonal Cells (Crystalline chambers, orbital rings, focal apertures)
      switch (position) {
        case "tl":
          return (
            <>
              <path
                d="M 1 9 L 1 2.5 C 1 1.7 1.7 1 2.5 1 L 9 1"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              {/* Hexagonal glyph cartouche */}
              <polygon
                points="6,2.8 9.5,4.8 9.5,8.2 6,10.2 2.8,8.2 2.8,4.8"
                stroke={color}
                strokeWidth="1"
                fill={color}
                fillOpacity="0.15"
                strokeLinejoin="round"
              />
              <circle cx="6" cy="6.5" r="1.1" fill={color} />
              <path
                d="M 2.5 12 L 7 12 M 12 2.5 L 12 7"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </>
          );
        case "tr":
          return (
            <>
              <path
                d="M 7 1 L 13.5 1 C 14.3 1 15 1.7 15 2.5 L 15 9"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              <polygon
                points="10,2.8 13.2,4.8 13.2,8.2 10,10.2 6.5,8.2 6.5,4.8"
                stroke={color}
                strokeWidth="1"
                fill={color}
                fillOpacity="0.15"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="6.5" r="1.1" fill={color} />
              <path
                d="M 13.5 12 L 9 12 M 4 2.5 L 4 7"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </>
          );
        case "bl":
          return (
            <>
              <path
                d="M 1 7 L 1 13.5 C 1 14.3 1.7 15 2.5 15 L 9 15"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              <polygon
                points="6,13.2 9.5,11.2 9.5,7.8 6,5.8 2.8,7.8 2.8,11.2"
                stroke={color}
                strokeWidth="1"
                fill={color}
                fillOpacity="0.15"
                strokeLinejoin="round"
              />
              <circle cx="6" cy="9.5" r="1.1" fill={color} />
              <path
                d="M 2.5 4 L 7 4 M 12 13.5 L 12 9"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </>
          );
        case "br":
          return (
            <>
              <path
                d="M 7 15 L 13.5 15 C 14.3 15 15 14.3 15 13.5 L 15 7"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
              <polygon
                points="10,13.2 13.2,11.2 13.2,7.8 10,5.8 6.5,7.8 6.5,11.2"
                stroke={color}
                strokeWidth="1"
                fill={color}
                fillOpacity="0.15"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="9.5" r="1.1" fill={color} />
              <path
                d="M 13.5 4 L 9 4 M 4 13.5 L 4 9"
                stroke={color}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </>
          );
      }
    }

    // Default: Variant 0: Celestial Hieroglyphs (Stepped pyramids, solar crests, eye of cosmos, diamond seals)
    switch (position) {
      case "tl":
        return (
          <>
            {/* Outer chassis bracket with alien curve */}
            <path
              d="M 1 9 L 1 2.5 C 1 1.7 1.7 1 2.5 1 L 9 1"
              stroke={color}
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Stepped Apex Pyramid */}
            <path
              d="M 3 6 L 6.5 2.5 L 10 6"
              stroke={color}
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Solar Disc & Conduit Spine */}
            <circle cx="6.5" cy="7.5" r="1.4" fill={color} />
            <path
              d="M 6.5 9 L 6.5 13.5"
              stroke={color}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            {/* Hieroglyphic Cross Notch */}
            <path
              d="M 4 11.5 L 9 11.5"
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="11.5" cy="4" r="0.75" fill={color} />
          </>
        );
      case "tr":
        return (
          <>
            <path
              d="M 7 1 L 13.5 1 C 14.3 1 15 1.7 15 2.5 L 15 9"
              stroke={color}
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Celestial Winged Crest */}
            <path
              d="M 6 6 L 9.5 2.5 L 13 6"
              stroke={color}
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Eye of the Cosmos Cartouche */}
            <polygon
              points="9.5,5.5 12.5,8.5 9.5,11.5 6.5,8.5"
              stroke={color}
              strokeWidth="1"
              fill={color}
              fillOpacity="0.18"
            />
            <circle cx="9.5" cy="8.5" r="1" fill={color} />
            <path
              d="M 11.5 12 L 13.5 12"
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="4.5" cy="4" r="0.75" fill={color} />
          </>
        );
      case "bl":
        return (
          <>
            <path
              d="M 1 7 L 1 13.5 C 1 14.3 1.7 15 2.5 15 L 9 15"
              stroke={color}
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Inverted Delta Pyramid */}
            <path
              d="M 3 10 L 6.5 13.5 L 10 10"
              stroke={color}
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Foundation Nexus & Uplink */}
            <circle cx="6.5" cy="8.5" r="1.4" fill={color} />
            <path
              d="M 6.5 7 L 6.5 2.5"
              stroke={color}
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M 4 4.5 L 9 4.5"
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="11.5" cy="12" r="0.75" fill={color} />
          </>
        );
      case "br":
        return (
          <>
            <path
              d="M 7 15 L 13.5 15 C 14.3 15 15 14.3 15 13.5 L 15 7"
              stroke={color}
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
            {/* Inverted Chevron Crest */}
            <path
              d="M 6 10 L 9.5 13.5 L 13 10"
              stroke={color}
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Matrix Seal of Eternity */}
            <polygon
              points="9.5,11.5 12.5,8.5 9.5,5.5 6.5,8.5"
              stroke={color}
              strokeWidth="1"
              fill={color}
              fillOpacity="0.18"
            />
            <circle cx="9.5" cy="8.5" r="1" fill={color} />
            <path
              d="M 11.5 4 L 13.5 4"
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="4.5" cy="12" r="0.75" fill={color} />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 16 16"
      className={`absolute ${positionClass} w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none transition-all duration-200 z-20 opacity-80 group-hover:opacity-100 ${className}`}
      style={{
        filter: `drop-shadow(0 0 2.5px ${color})`,
      }}
      aria-hidden="true"
    >
      {renderGlyph()}
    </svg>
  );
};
