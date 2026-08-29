import re

with open('src/data/stocks.ts', 'r') as f:
    content = f.read()

index = content.find("export const STOCK_NEWS_FEED: StockNews[] = [")
if index != -1:
    new_feed = """export const STOCK_NEWS_FEED: StockNews[] = [
  {
    id: "yt_spacex_stock",
    title: "SpaceX Secondary Valuation Tops $210 Billion Amid Starship Success",
    source: "Bloomberg Television (YouTube)",
    timeAgo: "10m ago",
    url: "https://www.youtube.com/watch?v=J8fR878V1b4",
    relatedSymbol: "SPCX",
    sentiment: "positive",
  },
  {
    id: "yt_nvidia_stock",
    title: "Nvidia Earnings Blow Past Wall Street Estimates on Unprecedented AI Demand",
    source: "Yahoo Finance (YouTube)",
    timeAgo: "25m ago",
    url: "https://www.youtube.com/watch?v=v8q81K5f1J8",
    relatedSymbol: "NVDA",
    sentiment: "positive",
  },
  {
    id: "yt_tesla_stock",
    title: "Tesla Cybercab & Optimus: Elon Musk Outlines The Future Of Autonomy",
    source: "CNBC Television (YouTube)",
    timeAgo: "1h ago",
    url: "https://www.youtube.com/watch?v=cim3kmqD5-8",
    relatedSymbol: "TSLA",
    sentiment: "positive",
  },
  {
    id: "yt_pltr_stock",
    title: "Palantir Wins Major Defense Contract For AI Targeting Systems",
    source: "Fox Business (YouTube)",
    timeAgo: "2h ago",
    url: "https://www.youtube.com/watch?v=8VwQvC7aB3w",
    relatedSymbol: "PLTR",
    sentiment: "positive",
  },
  {
    id: "yt_meta_stock",
    title: "Meta Platforms Open-Sources Llama 3, Rattles AI Competitors",
    source: "Bloomberg Technology (YouTube)",
    timeAgo: "3h ago",
    url: "https://www.youtube.com/watch?v=F5sR_H2nFvI",
    relatedSymbol: "META",
    sentiment: "positive",
  },
  {
    id: "yt_crwd_stock",
    title: "Crowdstrike Explains Root Cause Of Historic Global IT Outage",
    source: "CNBC (YouTube)",
    timeAgo: "5h ago",
    url: "https://www.youtube.com/watch?v=kYJjQyY08F4",
    relatedSymbol: "CRWD",
    sentiment: "negative",
  }
];"""
    
    content = content[:index] + new_feed
    with open('src/data/stocks.ts', 'w') as f:
        f.write(content)
    print("Replaced STOCK_NEWS_FEED.")
else:
    print("Could not find STOCK_NEWS_FEED")
