import React from 'react';

export const NotFinancialAdviceTag: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex px-1 py-0.5 ml-2 rounded text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-tight ${className}`} title="Not Financial Advice">
    NOT FINANCIAL ADVICE
  </span>
);
