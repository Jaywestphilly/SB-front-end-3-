import React from "react";

export const RouteSkeleton: React.FC = () => {
  return (
    <div
      className="w-full max-w-6xl mx-auto px-3 sm:px-5 py-6 space-y-5"
      role="status"
      aria-label="Loading workspace module"
    >
      {/* Top Holographic Deck Skeleton */}
      <div className="liquid-glass-slab xeno-clip-lg p-5 sm:p-6 space-y-4 relative overflow-hidden">
        <div aria-hidden="true" className="xeno-scan-beam" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="space-y-2.5 flex-1">
            <div className="h-3 w-36 xeno-clip-sm glass-skeleton-shimmer" />
            <div className="h-7 w-2/3 max-w-md xeno-clip-sm glass-skeleton-shimmer" />
            <div className="h-3.5 w-1/2 max-w-sm xeno-clip-sm glass-skeleton-shimmer" />
          </div>
          <div className="hidden sm:block h-11 w-32 xeno-clip-sm glass-skeleton-shimmer shrink-0" />
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative z-10">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="xeno-clip-sm border border-[#00f5d4]/20 bg-[#040d1b]/80 p-3 space-y-2"
            >
              <div className="h-2.5 w-20 glass-skeleton-shimmer" />
              <div className="h-5 w-24 glass-skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Data Rows Holographic Wireframe Shimmer */}
      <div className="liquid-glass-slab xeno-clip-md p-3 sm:p-4 space-y-2.5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between gap-4 p-3 xeno-clip-sm border border-[#00f5d4]/15 bg-[#040b18]/75"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 xeno-hex-pod glass-skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-3.5 w-24 glass-skeleton-shimmer" />
                <div className="h-2.5 w-40 glass-skeleton-shimmer" />
              </div>
            </div>
            <div className="hidden md:block h-7 w-28 xeno-clip-sm glass-skeleton-shimmer" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 glass-skeleton-shimmer" />
              <div className="h-6 w-14 xeno-clip-sm glass-skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
