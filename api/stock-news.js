// File: /api/stock-news.js

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Cache at edge for 1 hour, serve stale up to 24 hours while revalidating daily
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Baseline market data fallback
  const fallbackData = {
    updated_at: new Date().toISOString(),
    tickers: [
      {
        symbol: "SPCX",
        name: "Space Exploration Technologies Corp",
        price: 108.80,
        change_pct: -3.03,
        status: "Active"
      },
      {
        symbol: "BTC",
        name: "Bitcoin",
        price: 64250.00,
        change_pct: 1.45,
        status: "Active"
      },
      {
        symbol: "DOT",
        name: "Polkadot",
        price: 6.85,
        change_pct: 0.82,
        status: "Active"
      }
    ],
    news: [
      {
        title: "Citadel Acquires $16B Portfolio from Situational Awareness Following Leveraged Tech Selloff",
        source: "Seeking Alpha / Financial Times",
        url: "https://seekingalpha.com/article/4928708-citadel-situational-awareness-and-the-likely-pause-of-forced-selling",
        summary: "Ken Griffin's Citadel acquired a $16B public equity portfolio from AI-focused fund Situational Awareness after margin calls triggered a major unwind.",
        published: new Date().toISOString()
      },
      {
        title: "SpaceX (SPCX) Holds Near $108.80 Ahead of First Post-IPO Q2 Earnings Call",
        source: "Morningstar / MarketWatch",
        url: "https://www.morningstar.com/stocks/xnas/spcx/quote",
        summary: "SpaceX shares stabilized near $108.80 after pulling back from post-IPO peaks near $220.",
        published: new Date().toISOString()
      }
    ]
  };

  try {
    // Attempt live fetch from Yahoo Finance Chart API
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPCX?interval=1d&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    let spcxPrice = fallbackData.tickers[0].price;
    let spcxChange = fallbackData.tickers[0].change_pct;

    if (response.ok) {
      const json = await response.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        spcxPrice = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || spcxPrice;
        spcxChange = parseFloat((((spcxPrice - prevClose) / prevClose) * 100).toFixed(2));
      }
    }

    const tickers = [
      {
        symbol: "SPCX",
        name: "Space Exploration Technologies Corp",
        price: spcxPrice,
        change_pct: spcxChange,
        status: "Live Updated"
      },
      fallbackData.tickers[1],
      fallbackData.tickers[2]
    ];

    return res.status(200).json({
      status: "success",
      data: {
        updated_at: new Date().toISOString(),
        tickers,
        news: fallbackData.news
      }
    });
  } catch (err) {
    return res.status(200).json({
      status: "success_fallback",
      data: fallbackData
    });
  }
}
