import React, { useState } from "react";
import { PodcastNewsArticle, SubjectCategoryId } from "../types";
import { SUBJECT_CATEGORIES, PODCAST_NEWS_ARTICLES } from "../data/podcasts";
import {
  Newspaper,
  Share2,
  Sparkles,
  Check,
  Play,
  Search,
  X,
  ChevronRight,
  Bookmark,
  Layers,
  ExternalLink, Youtube,
} from "lucide-react";

interface PodcastNewsFeedProps {
  onSelectStockSymbol?: (symbol: string) => void;
  onAskAiAboutTopic?: (topic: string) => void;
}

export const PodcastNewsFeed = ({
  onSelectStockSymbol,
  onAskAiAboutTopic,
}: PodcastNewsFeedProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    SubjectCategoryId | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicTag, setSelectedTopicTag] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<PodcastNewsArticle | null>(
    null,
  );
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all unique topic tags across articles
  const allTopicTags = Array.from(
    new Set(PODCAST_NEWS_ARTICLES.flatMap((a) => a.keyTopics)),
  );

  // Filter Articles
  const filteredArticles = PODCAST_NEWS_ARTICLES.filter((article) => {
    // Subject category filter
    if (
      selectedCategoryId !== "all" &&
      article.subjectCategory !== selectedCategoryId
    ) {
      return false;
    }
    // Topic tag filter
    if (selectedTopicTag && !article.keyTopics.includes(selectedTopicTag)) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = article.episodeTitle.toLowerCase().includes(q);
      const matchesSummary = article.summary.toLowerCase().includes(q);
      const matchesSubject = article.subjectName.toLowerCase().includes(q);
      const matchesTopics = article.keyTopics.some((t) =>
        t.toLowerCase().includes(q),
      );
      const matchesTickers = article.relatedTickers.some((tk) =>
        tk.toLowerCase().includes(q),
      );
      return (
        matchesTitle ||
        matchesSummary ||
        matchesSubject ||
        matchesTopics ||
        matchesTickers
      );
    }
    return true;
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleCopyArticleBrief = (
    article: PodcastNewsArticle,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const briefText = `📰 ${article.subjectName} (${article.episodeNumber || ""}): ${article.episodeTitle}\n\nSummary: ${article.summary}\n\nKey Takeaways:\n${article.keyTakeaways.map((t) => `- ${t}`).join("\n")}\n\nResource Link: ${article.sourceUrl}`;
    navigator.clipboard.writeText(briefText);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-4 space-y-6 max-w-[1400px] mx-auto text-white">
      {/* Header Banner */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-amber-950 via-neutral-900 to-cyan-950 border border-amber-500/30 shadow-2xl space-y-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Market & Technology News Feed
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Macro • Grid • Longevity • Mindset
          </span>
        </div>

        <h2 className="text-2xl font-black text-white leading-tight">
          Tech & Market Subject Intelligence
        </h2>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Curated video intelligence briefs sorted strictly by subject matter: energy grid
          bottleneck analysis, HBM3e semiconductor supply chains, longevity
          tech, and cognitive productivity.
        </p>

        {/* Subject Category Tabs */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategoryId("all");
              setSelectedTopicTag(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer ${
              selectedCategoryId === "all"
                ? "bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-400/30"
                : "bg-white/10 text-neutral-300 hover:bg-white/20"
            }`}
          >
            All Subjects ({PODCAST_NEWS_ARTICLES.length})
          </button>

          {SUBJECT_CATEGORIES.map((cat) => {
            const count = PODCAST_NEWS_ARTICLES.filter(
              (a) => a.subjectCategory === cat.id,
            ).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedTopicTag(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-400/30"
                    : "bg-white/10 text-neutral-300 hover:bg-white/20"
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUBJECT_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`p-3.5 rounded-2xl bg-neutral-900/90 border transition-all cursor-pointer space-y-2 ${
              selectedCategoryId === cat.id
                ? "border-amber-400 bg-amber-950/20"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <h4 className="text-xs font-bold text-white truncate">
                {cat.name}
              </h4>
            </div>
            <p className="text-[11px] text-neutral-300 line-clamp-2 leading-tight">
              {cat.tagline}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Topic Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search power grid, HBM3e, longevity, FICO, SaaS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Topic Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[10px] uppercase font-mono text-neutral-400 shrink-0 mr-1">
            Topics:
          </span>
          {allTopicTags.map((tag) => {
            const isSelected = selectedTopicTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTopicTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all shrink-0 active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-amber-400 text-black font-extrabold"
                    : "bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Feed List */}
      {filteredArticles.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white/5 border border-white/10 space-y-2">
          <Newspaper className="w-8 h-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">
            No subject articles found
          </h4>
          <p className="text-xs text-neutral-400">
            Try adjusting your search query or selected topic filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => {
            const catInfo = SUBJECT_CATEGORIES.find(
              (c) => c.id === article.subjectCategory,
            );
            const isBookmarked = bookmarkedIds.includes(article.id);

            return (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className="group p-5 rounded-3xl bg-neutral-900/90 border border-white/10 space-y-3 hover:border-amber-400/40 transition-all cursor-pointer"
              >
                {/* Article Header info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${catInfo?.badgeColor || "bg-amber-500/20 text-amber-300"}`}
                    >
                      {article.subjectName}
                    </span>
                    {article.episodeNumber && (
                      <span className="text-[11px] font-mono text-amber-400 font-bold">
                        {article.episodeNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {article.publishedDate}
                    </span>
                    <button
                      onClick={(e) => toggleBookmark(article.id, e)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Article Title */}
                <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-amber-300 transition-colors">
                  {article.episodeTitle}
                </h3>

                {/* Read time */}
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                  <span>
                    Category:{" "}
                    <strong className="text-neutral-200">
                      {article.subjectName}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>

                {/* Article Summary */}
                <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>

                {/* Key Topic Tags & Related Tickers */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10">
                  {article.relatedTickers.map((ticker) => (
                    <button
                      key={ticker}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectStockSymbol) onSelectStockSymbol(ticker);
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 active:scale-95"
                    >
                      ${ticker}
                    </button>
                  ))}

                  {article.keyTopics.map((topic) => (
                    <span
                      key={topic}
                      className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>

                {/* Quick Action bar */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Read Executive Brief</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopyArticleBrief(article, e)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs flex items-center gap-1"
                    >
                      {copiedId === article.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Watch Video</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ARTICLE BRIEF MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="w-full max-w-2xl bg-neutral-950 border border-white/15 rounded-3xl p-6 shadow-2xl relative text-white space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {activeArticle.subjectName} • Executive Intelligence Brief
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white leading-tight">
                {activeArticle.episodeTitle}
              </h3>
              <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                <span>
                  Category:{" "}
                  <strong className="text-white">
                    {activeArticle.subjectName}
                  </strong>
                </span>
                <span>•</span>
                <span>{activeArticle.publishedDate}</span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 relative">
              <img
                src={activeArticle.imageUrl}
                alt="Subject"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            {/* Deep Brief Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                Executive Overview
              </h4>
              <p className="text-xs text-neutral-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                {activeArticle.summary}
              </p>
            </div>

            {/* Key Takeaways List */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                Key Takeaways & Market Insights
              </h4>
              <ul className="space-y-2 text-xs text-neutral-200">
                {activeArticle.keyTakeaways.map((takeaway, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Related Tickers */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Related Stock Tickers
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeArticle.relatedTickers.map((ticker) => (
                  <button
                    key={ticker}
                    onClick={() => {
                      if (onSelectStockSymbol) onSelectStockSymbol(ticker);
                      setActiveArticle(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1 active:scale-95"
                  >
                    <span>${ticker}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href={activeArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Read Full Article & News</span>
              </a>

              {onAskAiAboutTopic && (
                <button
                  onClick={() => {
                    onAskAiAboutTopic(activeArticle.episodeTitle);
                    setActiveArticle(null);
                  }}
                  className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask Quant </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
