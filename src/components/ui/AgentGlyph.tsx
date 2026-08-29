import React from "react";

export type GlyphType =
  | "AGENT"
  | "AI"
  | "NETWORK"
  | "RESEARCH"
  | "SIGNAL"
  | "ORACLE"
  | "FORECAST"
  | "THESIS"
  | "DATA"
  | "MARKET"
  | "SYSTEM"
  | "LIVE"
  | "VERIFIED"
  | "INTELLIGENCE"
  | "ALPHA"
  | "DEFENSE"
  | "DYSON";

export type GlyphColor =
  | "cyan"
  | "bronze"
  | "violet"
  | "electric"
  | "mint"
  | "rose"
  | "amber"
  | "white";

interface AgentGlyphProps {
  type: GlyphType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: GlyphColor;
  glow?: boolean;
  pulse?: boolean;
  className?: string;
  title?: string;
}

const colorMap: Record<GlyphColor, { stroke: string; fill: string; glowClass: string }> = {
  cyan: {
    stroke: "#00f2fe",
    fill: "rgba(0, 242, 254, 0.15)",
    glowClass: "drop-shadow-[0_0_8px_rgba(0,242,254,0.7)]",
  },
  bronze: {
    stroke: "#d49a6a",
    fill: "rgba(212, 154, 106, 0.18)",
    glowClass: "drop-shadow-[0_0_8px_rgba(212,154,106,0.6)]",
  },
  violet: {
    stroke: "#818cf8",
    fill: "rgba(129, 140, 248, 0.18)",
    glowClass: "drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]",
  },
  electric: {
    stroke: "#38bdf8",
    fill: "rgba(56, 189, 248, 0.18)",
    glowClass: "drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]",
  },
  mint: {
    stroke: "#2dd4bf",
    fill: "rgba(45, 212, 191, 0.18)",
    glowClass: "drop-shadow-[0_0_8px_rgba(45,212,191,0.7)]",
  },
  rose: {
    stroke: "#f43f5e",
    fill: "rgba(244, 63, 94, 0.18)",
    glowClass: "drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]",
  },
  amber: {
    stroke: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.18)",
    glowClass: "drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  white: {
    stroke: "#f8fafc",
    fill: "rgba(248, 250, 252, 0.15)",
    glowClass: "drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]",
  },
};

const sizeMap = {
  xs: { size: 14, strokeWidth: 1.6 },
  sm: { size: 18, strokeWidth: 1.8 },
  md: { size: 24, strokeWidth: 2 },
  lg: { size: 32, strokeWidth: 2.2 },
  xl: { size: 44, strokeWidth: 2.4 },
};

/**
 * Stock Bloc Bespoke Geometric Alien Glyph Component
 * 100% original mathematical geometry designed specifically for Stock Bloc's
 * future financial intelligence network.
 */
export const AgentGlyph: React.FC<AgentGlyphProps> = ({
  type,
  size = "md",
  color = "cyan",
  glow = true,
  pulse = false,
  className = "",
  title,
}) => {
  const { size: pixelSize, strokeWidth } = sizeMap[size];
  const { stroke, fill, glowClass } = colorMap[color];

  const renderPath = () => {
    switch (type) {
      case "AGENT":
        // Hexagonal core with convergent neural vector & central aperture
        return (
          <>
            <polygon
              points="12,2 21,7 21,17 12,22 3,17 3,7"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <path
              d="M12 6L12 18M7 9.5L17 14.5M17 9.5L7 14.5"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2" fill={stroke} />
          </>
        );

      case "AI":
        // Dual angular chevron brackets enclosing an elevated spark
        return (
          <>
            <path
              d="M5 6L2 12L5 18M19 6L22 12L19 18"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 3L14.5 9.5L21 12L14.5 14.5L12 21L9.5 14.5L3 12L9.5 9.5Z"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              fill={fill}
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="1.5" fill={stroke} />
          </>
        );

      case "NETWORK":
        // Tri-nodal faceted constellation mesh with cryptographic links
        return (
          <>
            <polygon
              points="12,3 21,19 3,19"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <polygon
              points="12,19 21,3 3,3"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.7}
              fill="none"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            <circle cx="12" cy="3" r="2" fill={stroke} />
            <circle cx="21" cy="19" r="2" fill={stroke} />
            <circle cx="3" cy="19" r="2" fill={stroke} />
            <circle cx="12" cy="11" r="1.8" fill={stroke} />
          </>
        );

      case "RESEARCH":
        // Prismatic vector diamond with diagonal scanning fissure
        return (
          <>
            <polygon
              points="12,2 22,12 12,22 2,12"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <path
              d="M4 12H20M12 4V20M8 8L16 16M16 8L8 16"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.7}
              strokeLinecap="round"
              opacity="0.75"
            />
            <rect x="10" y="10" width="4" height="4" fill={stroke} />
          </>
        );

      case "SIGNAL":
        // Stepped frequency waveform apex with quant transmission arcs
        return (
          <>
            <path
              d="M3 19L8 13L13 16L21 5"
              stroke={stroke}
              strokeWidth={strokeWidth * 1.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="15,5 21,5 21,11"
              stroke={stroke}
              strokeWidth={strokeWidth * 1.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 8C7 5 11 5 14 7"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <circle cx="21" cy="5" r="2" fill={stroke} />
          </>
        );

      case "ORACLE":
        // Concentric faceted diamond eye with orbital tick markers
        return (
          <>
            <path
              d="M2 12C5 6 19 6 22 12C19 18 5 18 2 12Z"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="4"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.9}
              fill="none"
            />
            <circle cx="12" cy="12" r="2" fill={stroke} />
            <path
              d="M12 2V5M12 19V22M2 12H5M19 12H22"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
            />
          </>
        );

      case "FORECAST":
        // Parabolic angular projection trajectory vector with target gate
        return (
          <>
            <path
              d="M3 20C7 16 11 10 18 4"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M14 4H20V10"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="18"
              cy="6"
              r="3.5"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.7}
              fill={fill}
            />
            <path
              d="M3 14H7M3 9H11M3 4H7"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.7}
              strokeLinecap="round"
              opacity="0.5"
            />
          </>
        );

      case "THESIS":
        // Segmented cyber-rune tablet geometry
        return (
          <>
            <polygon
              points="4,3 18,3 21,7 21,21 4,21"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <path
              d="M8 8H16M8 12H16M8 16H13"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.9}
              strokeLinecap="round"
            />
            <polygon points="17,3 17,8 21,8" stroke={stroke} strokeWidth={strokeWidth * 0.8} fill={fill} />
          </>
        );

      case "DATA":
        // Interlocking cubic digital matrix
        return (
          <>
            <polygon
              points="12,2 21,7 12,12 3,7"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <polygon
              points="3,7 12,12 12,22 3,17"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinejoin="round"
            />
            <polygon
              points="21,7 12,12 12,22 21,17"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <circle cx="12" cy="7" r="1.5" fill={stroke} />
          </>
        );

      case "MARKET":
        // Ascending quant delta wedge with volatility bands
        return (
          <>
            <polygon
              points="2,20 12,4 22,20"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <path
              d="M6 16H18M9 11H15"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
            />
            <polygon points="12,8 14,12 10,12" fill={stroke} />
          </>
        );

      case "SYSTEM":
        // Faceted square telemetry perimeter with coordinate ticks
        return (
          <>
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="2"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
            />
            <path
              d="M9 4V2M15 4V2M9 22V20M15 22V20M4 9H2M4 15H2M22 9H20M22 15H20"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth={strokeWidth * 0.8} fill="none" />
            <circle cx="12" cy="12" r="1.5" fill={stroke} />
          </>
        );

      case "LIVE":
        // Pulsing quantum emitter node
        return (
          <>
            <polygon
              points="12,3 20,12 12,21 4,12"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3.5" fill={stroke} />
            <circle
              cx="12"
              cy="12"
              r="7"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.6}
              fill="none"
              strokeDasharray="2 2"
            />
          </>
        );

      case "VERIFIED":
        // Tri-chamfered shield with encrypted lock node
        return (
          <>
            <path
              d="M12 2L20 6V12C20 17 16 21 12 22C8 21 4 17 4 12V6L12 2Z"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <polyline
              points="8,12 11,15 16,9"
              stroke={stroke}
              strokeWidth={strokeWidth * 1.1}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );

      case "INTELLIGENCE":
        // Multi-layered cybernetic crown matrix
        return (
          <>
            <polygon
              points="3,9 8,4 16,4 21,9 18,19 6,19"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <path
              d="M12 4V19M8 4L6 19M16 4L18 19"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
            />
            <circle cx="12" cy="10" r="2" fill={stroke} />
          </>
        );

      case "ALPHA":
        // Geometric split delta glyph
        return (
          <>
            <path
              d="M12 3L21 20H15L12 13L9 20H3L12 3Z"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <circle cx="12" cy="8" r="1.5" fill={stroke} />
          </>
        );

      case "DEFENSE":
        // Angular chevron shield with targeting vector
        return (
          <>
            <polygon
              points="12,2 22,8 20,18 12,22 4,18 2,8"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill={fill}
              strokeLinejoin="round"
            />
            <path
              d="M12 6V18M6 12H18"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2" fill={stroke} />
          </>
        );

      case "DYSON":
        // Orbital energy ring polygon array
        return (
          <>
            <circle
              cx="12"
              cy="12"
              r="8"
              stroke={stroke}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray="4 2"
            />
            <polygon
              points="12,4 19,16 5,16"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              fill={fill}
              strokeLinejoin="round"
            />
            <polygon
              points="12,20 19,8 5,8"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              fill="none"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2.5" fill={stroke} />
          </>
        );

      default:
        return <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${glow ? glowClass : ""} ${
        pulse ? "animate-alien-pulse" : ""
      } ${className}`}
      role="img"
      aria-label={title || `${type} glyph`}
      title={title || type}
    >
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300"
      >
        {renderPath()}
      </svg>
    </span>
  );
};
