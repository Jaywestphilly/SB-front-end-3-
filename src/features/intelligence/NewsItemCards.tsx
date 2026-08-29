import React from "react";
import {
  Youtube,
  Play,
  Volume2,
  Bookmark,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { UnifiedFeedItem } from "./newsUtils";
import { CatalystBadgeConfig, renderTextWithTickers } from "./NewsHub";
import { triggerHaptic } from "../../utils/haptics";

interface NewsItemCardProps {
  item: UnifiedFeedItem;
  isBookmarked: boolean;
  isSpeaking: boolean;
  catalystBadges: CatalystBadgeConfig[];
  contextJumpers: Array<{ label: string; tab: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }>;
  itemTags: string[];
  onToggleBookmark: (id: string) => void;
  onToggleAudioBriefing: (item: UnifiedFeedItem) => void;
  onOpenModal: (item: UnifiedFeedItem) => void;
  onTickerClick: (symbol: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const NewsItemWireRow: React.FC<NewsItemCardProps> = ({
  item,
  isBookmarked,
  isSpeaking,
  catalystBadges,
  contextJumpers,
  onToggleBookmark,
  onToggleAudioBriefing,
  onOpenModal,
  onTickerClick,
  onNavigateTab,
}) => {
  const itemId = item.youtubeId || item.id;
  const isStockBloc = item.isStockBloc;
  const isAlexWg = item.isAlexWg;

  return (
    <div className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-neutral-900/60 transition-colors group text-xs font-mono">
      {/* Source & Catalyst */}
      <div className="col-span-3 sm:col-span-2 flex flex-col gap-1">
        <span
          className={`text-[11px] font-black line-clamp-1 ${
            isStockBloc ? "text-rose-400" : isAlexWg ? "text-amber-400" : "text-cyan-400"
          }`}
        >
          {item.channelName}
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {catalystBadges.length > 0 ? (
            <span
              className={`px-1.5 py-0.2 text-[8px] font-black rounded border w-fit ${catalystBadges[0].bgClass} ${catalystBadges[0].colorClass} ${catalystBadges[0].borderClass}`}
            >
              {catalystBadges[0].shortLabel}
            </span>
          ) : (
            <span className="text-[9px] text-neutral-500">{item.publishedDate}</span>
          )}
        </div>
      </div>

      {/* Headline with Tickers */}
      <div className="col-span-7 sm:col-span-8 space-y-1">
        <h4
          onClick={() => {
            triggerHaptic("medium");
            onOpenModal(item);
          }}
          className="text-white font-bold text-xs sm:text-sm hover:text-cyan-300 cursor-pointer leading-snug line-clamp-2"
        >
          {renderTextWithTickers(item.title, onTickerClick)}
        </h4>

        {/* Context Jumpers Mini */}
        {contextJumpers.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            {contextJumpers.slice(0, 1).map((jumper) => {
              const Icon = jumper.icon;
              return (
                <button
                  key={jumper.tab}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("selection");
                    if (onNavigateTab) onNavigateTab(jumper.tab);
                  }}
                  className={`px-1.5 py-0.5 text-[9px] font-black rounded border flex items-center gap-1 transition-all cursor-pointer ${jumper.colorClass}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  <span>{jumper.label}</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-2 flex items-center justify-end gap-1.5">
        {/* Audio Briefing Button */}
        <button
          onClick={() => onToggleAudioBriefing(item)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isSpeaking
              ? "bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]"
              : "bg-black/60 border-neutral-800 text-neutral-400 hover:text-cyan-300 hover:border-cyan-500/40"
          }`}
          title={isSpeaking ? "Pause Spoken Briefing" : "Listen to Audio Briefing"}
        >
          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "animate-pulse" : ""}`} />
        </button>

        {/* Watch Modal Button */}
        <button
          onClick={() => {
            triggerHaptic("medium");
            onOpenModal(item);
          }}
          className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
          title="Watch Video"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Bookmark Toggle */}
        <button
          onClick={() => onToggleBookmark(itemId)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isBookmarked
              ? "bg-amber-400 text-black border-amber-400"
              : "bg-black/60 border-neutral-800 text-neutral-500 hover:text-amber-400 hover:border-amber-500/40"
          }`}
          title={isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const NewsItemDossierCard: React.FC<NewsItemCardProps> = ({
  item,
  isBookmarked,
  isSpeaking,
  catalystBadges,
  contextJumpers,
  itemTags,
  onToggleBookmark,
  onToggleAudioBriefing,
  onOpenModal,
  onTickerClick,
  onNavigateTab,
}) => {
  const itemId = item.youtubeId || item.id;
  const isStockBloc = item.isStockBloc;
  const isAlexWg = item.isAlexWg;

  const borderColor = isStockBloc
    ? "border-rose-500/30 hover:border-rose-500/60"
    : isAlexWg
    ? "border-amber-500/30 hover:border-amber-500/60"
    : "border-cyan-500/30 hover:border-cyan-500/60";
  const bgColor = isStockBloc ? "bg-[#0b0306]/90" : isAlexWg ? "bg-[#0c0902]/90" : "bg-[#050b14]/90";
  const iconColor = isStockBloc ? "text-rose-500" : isAlexWg ? "text-amber-400" : "text-cyan-400";
  const shadowColor = isStockBloc
    ? "shadow-[0_0_20px_rgba(244,63,94,0.08)]"
    : isAlexWg
    ? "shadow-[0_0_20px_rgba(245,158,11,0.08)]"
    : "shadow-[0_0_20px_rgba(6,182,212,0.08)]";
  const accentColor = isStockBloc ? "bg-rose-600 hover:bg-rose-500" : isAlexWg ? "bg-amber-600 hover:bg-amber-500" : "bg-cyan-600 hover:bg-cyan-500";
  const badgeColors = isStockBloc
    ? "bg-rose-950/40 border-rose-500/30 text-rose-300"
    : isAlexWg
    ? "bg-amber-950/40 border-amber-500/30 text-amber-300"
    : "bg-cyan-950/40 border-cyan-500/30 text-cyan-300";

  return (
    <article
      className={`${bgColor} border ${borderColor} rounded-2xl p-4 sm:p-5 transition-all space-y-3 relative overflow-hidden group ${shadowColor}`}
    >
      {/* Card Header Bar */}
      <div
        className={`flex items-center justify-between gap-2 border-b ${
          isStockBloc ? "border-rose-500/20" : isAlexWg ? "border-amber-500/20" : "border-cyan-500/20"
        } pb-2`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Youtube className={`w-5 h-5 ${iconColor}`} />
          <span className="text-white font-black text-xs uppercase tracking-wider">
            {item.channelName}
          </span>

          {/* Catalyst Badges */}
          {catalystBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <span
                key={badge.id}
                className={`px-2 py-0.5 text-[9px] font-black rounded-md border flex items-center gap-1 uppercase tracking-wider ${badge.bgClass} ${badge.colorClass} ${badge.borderClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                <Icon className="w-2.5 h-2.5" />
                <span>{badge.label}</span>
              </span>
            );
          })}

          {item.isShort && (
            <span className={`px-2 py-0.5 ${badgeColors} text-[9px] font-black rounded uppercase`}>
              Short
            </span>
          )}

          {isStockBloc && (
            <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[9px] font-black rounded uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping" />
              OFFICIAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-neutral-400 text-[10px] font-bold">
            {item.publishedDate}
          </span>
          {/* Bookmark button */}
          <button
            onClick={() => onToggleBookmark(itemId)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isBookmarked
                ? "bg-amber-400 text-black border-amber-400"
                : "bg-black/60 border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/40"
            }`}
            title={isBookmarked ? "Remove from bookmarks" : "Save dispatch offline"}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {/* Thumbnail Card with Play Overlay */}
        <div
          onClick={() => {
            triggerHaptic("medium");
            onOpenModal(item);
          }}
          className={`relative rounded-xl overflow-hidden border ${borderColor} aspect-video cursor-pointer group/thumb bg-black`}
        >
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
            <div
              className={`w-12 h-12 rounded-full ${accentColor} text-white flex items-center justify-center shadow-2xl group-hover/thumb:scale-110 transition-transform`}
            >
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            </div>
          </div>
          {item.duration && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white font-mono text-[10px] font-black rounded border border-white/20">
              {item.duration}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="sm:col-span-2 space-y-2">
          {/* Sector Badges */}
          {itemTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {itemTags.map((tag) => {
                const colors =
                  tag === "AI"
                    ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
                    : tag === "Biotech"
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                    : tag === "Robotics"
                    ? "bg-purple-950/40 border-purple-500/30 text-purple-400"
                    : tag === "Space"
                    ? "bg-fuchsia-950/40 border-fuchsia-500/30 text-fuchsia-400"
                    : tag === "Quantum"
                    ? "bg-blue-950/40 border-blue-500/30 text-blue-400"
                    : "bg-amber-950/40 border-amber-500/30 text-amber-400";
                return (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${colors}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          <h3
            onClick={() => {
              triggerHaptic("medium");
              onOpenModal(item);
            }}
            className={`text-sm sm:text-base font-bold text-white ${
              isStockBloc ? "group-hover:text-rose-300" : isAlexWg ? "group-hover:text-amber-300" : "group-hover:text-cyan-300"
            } transition-colors cursor-pointer leading-snug`}
          >
            {renderTextWithTickers(item.title, onTickerClick)}
          </h3>

          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {renderTextWithTickers(item.description, onTickerClick)}
          </p>

          {item.keyTakeaways && item.keyTakeaways.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.keyTakeaways.map((takeaway, tIdx) => (
                <span
                  key={tIdx}
                  className={`px-2 py-0.5 ${badgeColors} text-[9px] font-bold rounded`}
                >
                  • {renderTextWithTickers(takeaway, onTickerClick)}
                </span>
              ))}
            </div>
          )}

          {/* Cross-Module Context Jumpers */}
          {contextJumpers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {contextJumpers.map((jumper) => {
                const Icon = jumper.icon;
                return (
                  <button
                    key={jumper.tab}
                    onClick={() => {
                      triggerHaptic("selection");
                      if (onNavigateTab) onNavigateTab(jumper.tab);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${jumper.colorClass}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{jumper.label}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <button
              onClick={() => {
                triggerHaptic("medium");
                onOpenModal(item);
              }}
              className={`px-3 py-1.5 ${accentColor} text-white font-black text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md`}
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Video</span>
            </button>

            {/* Audio Briefing Button */}
            <button
              onClick={() => onToggleAudioBriefing(item)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? "bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  : "bg-neutral-900 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60"
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "animate-pulse" : ""}`} />
              <span>{isSpeaking ? "Playing Brief..." : "Audio Brief"}</span>
            </button>

            {item.watchUrl && (
              <a
                href={item.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-3 py-1.5 bg-neutral-900 border ${borderColor} ${iconColor} text-xs font-bold rounded-lg flex items-center gap-1 transition-all hover:bg-neutral-800`}
              >
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
