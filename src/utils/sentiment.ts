import { StockNews, PodcastNewsArticle, StockTicker } from "../types";
import { STOCK_NEWS_FEED } from "../data/stocks";
import { PODCAST_NEWS_ARTICLES } from "../data/podcasts";

export interface TickerNewsHeadline {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  url?: string;
  type: "stock_news" | "podcast_brief";
}

export interface TickerNewsSentiment {
  symbol: string;
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
  totalHeadlines: number;
  overall: "Bullish" | "Bearish" | "Neutral";
  headlines: TickerNewsHeadline[];
}

export function getTickerSentiment(
  symbol: string,
  stock?: StockTicker,
): TickerNewsSentiment {
  const upperSymbol = symbol.toUpperCase();
  const matchedHeadlines: TickerNewsHeadline[] = [];
  const stockName = stock?.name || symbol;

  const isPrivate =
    upperSymbol === "OPENAI" ||
    upperSymbol === "STRIPE" ||
    upperSymbol === "ANTHROPIC" ||
    upperSymbol === "DATABRICKS" ||
    upperSymbol === "BYTEDANCE";

  const defaultUrl = isPrivate
    ? `https://techcrunch.com/tag/${upperSymbol.toLowerCase()}/`
    : `https://finance.yahoo.com/quote/${upperSymbol}`;

  // 1. Scan STOCK_NEWS_FEED
  STOCK_NEWS_FEED.forEach((item) => {
    if (
      item.relatedSymbol?.toUpperCase() === upperSymbol ||
      item.title.toUpperCase().includes(`$${upperSymbol}`) ||
      item.title.toUpperCase().includes(` ${upperSymbol} `)
    ) {
      let normSentiment: "Bullish" | "Bearish" | "Neutral" = "Neutral";
      if (item.sentiment === "positive") normSentiment = "Bullish";
      else if (item.sentiment === "negative") normSentiment = "Bearish";

      matchedHeadlines.push({
        id: item.id,
        title: item.title,
        source: item.source,
        timeAgo: item.timeAgo,
        sentiment: normSentiment,
        url: item.url || defaultUrl,
        type: "stock_news",
      });
    }
  });

  // 2. Scan PODCAST_NEWS_ARTICLES
  PODCAST_NEWS_ARTICLES.forEach((article) => {
    const isRelated =
      article.relatedTickers.some((t) => t.toUpperCase() === upperSymbol) ||
      article.episodeTitle.toUpperCase().includes(`$${upperSymbol}`) ||
      article.summary.toUpperCase().includes(`$${upperSymbol}`);

    if (isRelated) {
      matchedHeadlines.push({
        id: article.id,
        title: article.episodeTitle,
        source: `${article.subjectName} (${article.episodeNumber || "Brief"})`,
        timeAgo: article.publishedDate,
        sentiment: article.sentiment,
        url: article.sourceUrl || defaultUrl,
        type: "podcast_brief",
      });
    }
  });

  // Calculate sentiment totals
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  matchedHeadlines.forEach((h) => {
    if (h.sentiment === "Bullish") bullishCount++;
    else if (h.sentiment === "Bearish") bearishCount++;
    else neutralCount++;
  });

  const totalHeadlines = matchedHeadlines.length || 1; // avoid NaN
  let bullishPercent = Math.round((bullishCount / totalHeadlines) * 100);
  let bearishPercent = Math.round((bearishCount / totalHeadlines) * 100);
  let neutralPercent = 100 - bullishPercent - bearishPercent;

  if (matchedHeadlines.length === 0) {
     bullishPercent = 0;
     bearishPercent = 0;
     neutralPercent = 0;
  }

  // Guarantee valid percentages summing to 100
  if (neutralPercent < 0) neutralPercent = 0;

  let overall: "Bullish" | "Bearish" | "Neutral" = "Neutral";
  if (bullishPercent >= 55) overall = "Bullish";
  else if (bearishPercent >= 45) overall = "Bearish";

  return {
    symbol,
    bullishPercent,
    bearishPercent,
    neutralPercent,
    totalHeadlines: matchedHeadlines.length,
    overall,
    headlines: matchedHeadlines,
  };
}
