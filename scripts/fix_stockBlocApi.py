import re

with open('src/utils/stockBlocApi.ts', 'r') as f:
    content = f.read()

content = content.replace('{ symbol: "SPCX", name: "Space Exploration Technologies (SpaceX)", price: 212.50, change_pct: 5.59, status: "Active" }', '{ symbol: "SPCX", name: "Space Exploration Technologies Corp", price: 108.80, change_pct: -3.03, status: "Active" }')
content = content.replace('title: "SpaceX ($SPCX) Starship Flight 6 Achieves Precision Orbital Catch as Starlink Annualized Revenue Crosses $10 Billion",', 'title: "SpaceX (SPCX) Stock Holds Support Near $108.80 Ahead of Earnings",')
content = content.replace('url: "https://www.google.com/finance/quote/SPCX:NASDAQ",', 'url: "https://www.google.com/finance/quote/SPCX:NASDAQ",')
content = content.replace('summary: "SpaceX secondary market transactions stabilized near $212.50, closely tracked by its public market proxy fund Destiny Tech100.",', 'summary: "SpaceX shares stabilized around $108.80 following post-IPO pullbacks from $220+ highs.",')
content = content.replace('const dxyzPrice = meta.regularMarketPrice;\n        const prevClose = meta.chartPreviousClose || meta.previousClose || dxyzPrice;\n        const dxyzChangePct = parseFloat((((dxyzPrice - prevClose) / prevClose) * 100).toFixed(2));\n        \n        BASELINE.tickers[0].change_pct = dxyzChangePct;\n        BASELINE.tickers[0].price = parseFloat((212.50 * (1 + dxyzChangePct / 100)).toFixed(2));\n        BASELINE.tickers[0].status = "Live (via SPCX)";', 'BASELINE.tickers[0].price = meta.regularMarketPrice;\n        const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;\n        BASELINE.tickers[0].change_pct = parseFloat((((meta.regularMarketPrice - prevClose) / prevClose) * 100).toFixed(2));\n        BASELINE.tickers[0].status = "Live Updated";')

with open('src/utils/stockBlocApi.ts', 'w') as f:
    f.write(content)
