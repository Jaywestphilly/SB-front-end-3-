import React from "react";
import { ExternalLink, Handshake } from "lucide-react";
import { appendUTM } from "../utils/utm";
import { trackEvent } from "../utils/analytics";
import { triggerHaptic } from "../utils/haptics";

interface Props {
  href: string;
  ctaText: string;
  partnerName: string;
  category: string;
  className?: string;
  icon?: React.ElementType;
  onClick?: () => void;
  variant?: "amber" | "cyan" | "gold";
}

export const AffiliateLink: React.FC<Props> = ({
  href,
  ctaText,
  partnerName,
  category,
  className = "",
  icon: Icon = ExternalLink,
  onClick,
  variant = "amber",
}) => {
  const finalUrl = appendUTM(href, category);

  const handleClick = (e: React.MouseEvent) => {
    triggerHaptic("selection");
    trackEvent("affiliate_clicked", { provider: partnerName, href: finalUrl, section: category });
    if (onClick) onClick();
  };

  const variantStyles = {
    amber: "border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 shadow-amber-950/30",
    cyan: "border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 shadow-cyan-950/30",
    gold: "border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-400 shadow-yellow-950/30",
  };

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      data-affiliate="true"
      data-provider={partnerName}
      data-section={category}
      title="We may earn an affiliate commission at no extra cost to you."
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 bg-[#040d16]/90 border alien-block-cut-sm font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-md ${variantStyles[variant]} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
      <span>{ctaText}</span>
      <span className="ml-1 px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-normal">
        PARTNER
      </span>
      {/* Tooltip on hover */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black/95 text-neutral-300 text-[10px] normal-case px-2 py-1 rounded border border-neutral-700 whitespace-nowrap z-30 shadow-xl pointer-events-none">
        We may earn a commission at no cost to you.
      </span>
    </a>
  );
};
