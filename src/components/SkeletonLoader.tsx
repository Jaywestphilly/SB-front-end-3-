import React from "react";

export const SkeletonCard: React.FC = () => (
  <div className="bg-black/60 rounded-2xl p-5 border border-cyan-500/20 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-12 h-6 bg-cyan-950/80 rounded" />
      <div className="w-16 h-5 bg-cyan-950/60 rounded" />
    </div>
    <div className="w-3/4 h-5 bg-cyan-900/40 rounded" />
    <div className="w-full h-12 bg-cyan-950/40 rounded-xl" />
    <div className="flex items-center justify-between pt-2">
      <div className="w-20 h-4 bg-cyan-950/60 rounded" />
      <div className="w-16 h-4 bg-cyan-950/60 rounded" />
    </div>
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="bg-black/60 rounded-2xl p-6 border border-cyan-500/20 space-y-4 animate-pulse">
    <div className="w-48 h-6 bg-cyan-950/80 rounded" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-xl">
          <div className="w-24 h-4 bg-cyan-950/80 rounded" />
          <div className="w-16 h-4 bg-cyan-950/60 rounded" />
          <div className="w-20 h-4 bg-cyan-950/60 rounded" />
          <div className="w-16 h-4 bg-cyan-950/60 rounded" />
        </div>
      ))}
    </div>
  </div>
);
