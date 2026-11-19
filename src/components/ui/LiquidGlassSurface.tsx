import React, { useRef, useEffect, useCallback } from "react";

export type LiquidGlassAccent =
  | "cyan"
  | "emerald"
  | "purple"
  | "amber"
  | "cobalt";

export interface LiquidGlassSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Accent refraction tint aligned to Stock Bloc Alien Bioluminescence DNA */
  accent?: LiquidGlassAccent;
  /** Enables damped cursor-reactive 3D tilt (max ±3.5°) and pointer-tracked plasma flare */
  interactive?: boolean;
  /** Maximum tilt angle in degrees (clamped to <= 4 for optical calm) */
  maxTiltDeg?: number;
  /** Surface elevation preset */
  variant?: "card" | "slab" | "modal";
  /** Geometric hull silhouette: chamfered sci-fi alien polygon or subtle technical corners */
  shape?: "chamfered-lg" | "chamfered-md" | "rounded";
  /** Renders glowing SVG corner targeting reticles */
  reticles?: boolean;
  /** Enables subtle periodic holographic scanline sweep */
  scanBeam?: boolean;
  /** Optional subtle caustic backplate layer (strictly <= 16% opacity for WCAG AA legibility) */
  causticBackplate?: boolean;
  children: React.ReactNode;
}

const ACCENT_VARS: Record<
  LiquidGlassAccent,
  {
    sheen: string;
    rimStart: string;
    rimEnd: string;
    hoverBorder: string;
    hoverGlow: string;
    caustic: string;
    reticleStroke: string;
    reticleAlt: string;
  }
> = {
  cyan: {
    sheen: "rgba(0, 245, 212, 0.18)",
    rimStart: "rgba(0, 245, 212, 0.56)",
    rimEnd: "rgba(168, 85, 247, 0.34)",
    hoverBorder: "rgba(0, 245, 212, 0.62)",
    hoverGlow: "rgba(0, 245, 212, 0.34)",
    caustic:
      "radial-gradient(75% 65% at 15% 10%, rgba(0, 245, 212, 0.15) 0%, transparent 62%), radial-gradient(65% 75% at 88% 92%, rgba(168, 85, 247, 0.12) 0%, transparent 65%)",
    reticleStroke: "#00f5d4",
    reticleAlt: "#00e5ff",
  },
  emerald: {
    sheen: "rgba(0, 255, 157, 0.18)",
    rimStart: "rgba(0, 255, 157, 0.52)",
    rimEnd: "rgba(0, 245, 212, 0.28)",
    hoverBorder: "rgba(0, 255, 157, 0.6)",
    hoverGlow: "rgba(0, 255, 157, 0.3)",
    caustic:
      "radial-gradient(75% 65% at 18% 12%, rgba(0, 255, 157, 0.14) 0%, transparent 60%), radial-gradient(65% 75% at 85% 90%, rgba(0, 229, 255, 0.11) 0%, transparent 65%)",
    reticleStroke: "#00ff9d",
    reticleAlt: "#00f5d4",
  },
  purple: {
    sheen: "rgba(168, 85, 247, 0.2)",
    rimStart: "rgba(168, 85, 247, 0.6)",
    rimEnd: "rgba(0, 245, 212, 0.32)",
    hoverBorder: "rgba(168, 85, 247, 0.65)",
    hoverGlow: "rgba(168, 85, 247, 0.36)",
    caustic:
      "radial-gradient(75% 65% at 18% 10%, rgba(168, 85, 247, 0.16) 0%, transparent 62%), radial-gradient(65% 75% at 85% 90%, rgba(0, 229, 255, 0.12) 0%, transparent 65%)",
    reticleStroke: "#c084fc",
    reticleAlt: "#00f5d4",
  },
  amber: {
    sheen: "rgba(245, 158, 11, 0.18)",
    rimStart: "rgba(245, 158, 11, 0.54)",
    rimEnd: "rgba(0, 245, 212, 0.24)",
    hoverBorder: "rgba(245, 158, 11, 0.62)",
    hoverGlow: "rgba(245, 158, 11, 0.3)",
    caustic:
      "radial-gradient(75% 65% at 15% 12%, rgba(245, 158, 11, 0.14) 0%, transparent 62%), radial-gradient(65% 75% at 88% 92%, rgba(0, 229, 255, 0.1) 0%, transparent 65%)",
    reticleStroke: "#fbbf24",
    reticleAlt: "#00f5d4",
  },
  cobalt: {
    sheen: "rgba(14, 165, 233, 0.18)",
    rimStart: "rgba(56, 189, 248, 0.56)",
    rimEnd: "rgba(168, 85, 247, 0.32)",
    hoverBorder: "rgba(56, 189, 248, 0.62)",
    hoverGlow: "rgba(14, 165, 233, 0.34)",
    caustic:
      "radial-gradient(75% 65% at 15% 12%, rgba(14, 165, 233, 0.15) 0%, transparent 62%), radial-gradient(65% 75% at 85% 90%, rgba(0, 245, 212, 0.11) 0%, transparent 65%)",
    reticleStroke: "#38bdf8",
    reticleAlt: "#00f5d4",
  },
};

export const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  accent = "cyan",
  interactive = false,
  maxTiltDeg = 3.2,
  variant = "card",
  shape = "chamfered-md",
  reticles = true,
  scanBeam = false,
  causticBackplate = true,
  className = "",
  style,
  children,
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  const tiltState = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      reducedMotionRef.current = mq.matches;
      const listener = (e: MediaQueryListEvent) => {
        reducedMotionRef.current = e.matches;
      };
      mq.addEventListener?.("change", listener);
      return () => mq.removeEventListener?.("change", listener);
    }
  }, []);

  const stepTilt = useCallback(() => {
    const el = surfaceRef.current;
    if (!el) {
      rafRef.current = null;
      return;
    }

    const st = tiltState.current;
    const lerp = 0.14;
    st.currentX += (st.targetX - st.currentX) * lerp;
    st.currentY += (st.targetY - st.currentY) * lerp;

    const settled =
      !st.active &&
      Math.abs(st.currentX) < 0.02 &&
      Math.abs(st.currentY) < 0.02;

    if (settled) {
      st.currentX = 0;
      st.currentY = 0;
      el.style.transform = "";
      rafRef.current = null;
      return;
    }

    el.style.transform = `perspective(1000px) rotateX(${st.currentX.toFixed(2)}deg) rotateY(${st.currentY.toFixed(2)}deg) translateZ(0)`;
    rafRef.current = requestAnimationFrame(stepTilt);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e);
    const el = surfaceRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    el.style.setProperty("--mouse-x", `${px.toFixed(1)}px`);
    el.style.setProperty("--mouse-y", `${py.toFixed(1)}px`);
    el.style.setProperty("--lg-sheen-opacity", "0.95");

    if (interactive && !reducedMotionRef.current) {
      const clampedMax = Math.min(Math.max(maxTiltDeg, 0), 4);
      const normX = (px / rect.width) * 2 - 1;
      const normY = (py / rect.height) * 2 - 1;
      tiltState.current.targetX = -normY * clampedMax;
      tiltState.current.targetY = normX * clampedMax;
      tiltState.current.active = true;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(stepTilt);
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e);
    const el = surfaceRef.current;
    if (!el) return;

    el.style.setProperty("--lg-sheen-opacity", "0.55");
    if (interactive) {
      tiltState.current.targetX = 0;
      tiltState.current.targetY = 0;
      tiltState.current.active = false;
      if (rafRef.current === null && !reducedMotionRef.current) {
        rafRef.current = requestAnimationFrame(stepTilt);
      }
    }
  };

  const palette = ACCENT_VARS[accent];
  const baseClass =
    variant === "slab"
      ? "liquid-glass-slab"
      : variant === "modal"
        ? "liquid-glass-surface bg-[#030a16]/95"
        : "liquid-glass-surface";

  const shapeClass =
    shape === "chamfered-lg"
      ? "xeno-clip-lg"
      : shape === "chamfered-md"
        ? "xeno-clip-md"
        : "";

  const customVars = {
    "--lg-sheen-color": palette.sheen,
    "--lg-rim-start": palette.rimStart,
    "--lg-rim-end": palette.rimEnd,
    "--lg-hover-border": palette.hoverBorder,
    "--lg-hover-glow": palette.hoverGlow,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      ref={surfaceRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={customVars}
      className={`${baseClass} ${shapeClass} overflow-hidden ${className}`}
      {...rest}
    >
      {/* Layer 1: Optical Caustic Plasma Backplate */}
      {causticBackplate && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: palette.caustic,
            opacity: 0.92,
          }}
        />
      )}

      {/* Layer 2: Holographic Hex-Circuit Micro-Grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 xeno-hex-grid opacity-55"
      />

      {/* Layer 3: Optional Periodic Holographic Laser Scanline Sweep */}
      {scanBeam && <div aria-hidden="true" className="xeno-scan-beam z-[1]" />}

      {/* Layer 4: Laser-Etched Corner Targeting Reticles */}
      {reticles && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3]">
          <svg
            className="absolute top-0 left-0 w-7 h-7"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M 1 20 L 1 9 L 9 1 L 24 1"
              stroke={palette.reticleStroke}
              strokeWidth="1.6"
              strokeOpacity="0.88"
            />
          </svg>
          <svg
            className="absolute top-0 right-0 w-7 h-7"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M 4 1 L 27 1 L 27 16"
              stroke={palette.reticleAlt}
              strokeWidth="1.4"
              strokeOpacity="0.65"
            />
          </svg>
          <svg
            className="absolute bottom-0 right-0 w-7 h-7"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M 27 8 L 27 19 L 19 27 L 4 27"
              stroke={palette.reticleStroke}
              strokeWidth="1.6"
              strokeOpacity="0.88"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-0 w-7 h-7"
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M 1 12 L 1 27 L 24 27"
              stroke={palette.reticleAlt}
              strokeWidth="1.4"
              strokeOpacity="0.65"
            />
          </svg>
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};
