import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('{ symbol: "SPACEX"', '{ symbol: "SPCX"')
content = content.replace('symbol: "SPACEX",', 'symbol: "SPCX",')
content = content.replace('name: "Space Exploration Technologies (SpaceX)",', 'name: "Space Exploration Technologies Corp",')
content = content.replace('price: 212.50,', 'price: 108.80,')
content = content.replace('change_pct: 5.59,', 'change_pct: -3.03,')

content = content.replace('title: "SpaceX ($SPACEX) Starship Flight 6 Achieves Precision Orbital Catch as Starlink Annualized Revenue Crosses $10 Billion",', 'title: "SpaceX (SPCX) Holds Near $108.80 Ahead of First Post-IPO Q2 Earnings Call",')
content = content.replace('source: "Orbital Quant Wire / Bloomberg",', 'source: "Morningstar / MarketWatch",')
content = content.replace('url: "https://news.google.com/search?q=SPACEX+stock",', 'url: "https://www.morningstar.com/stocks/xnas/spcx/quote",')
content = content.replace('summary: "SpaceX secondary market transactions stabilized near $212.50 per share, supported by Starlink crossing $10 billion in annualized run-rate sales.",', 'summary: "SpaceX shares stabilized near $108.80 after pulling back from post-IPO peaks near $220.",')

content = content.replace('let spacexPrice = fallbackData.tickers[0].price;', 'let spcxPrice = fallbackData.tickers[0].price;')
content = content.replace('let spacexChange = fallbackData.tickers[0].change_pct;', 'let spcxChange = fallbackData.tickers[0].change_pct;')

# Replace the Yahoo Finance chart call for DXYZ with SPCX
content = content.replace('finance/chart/DXYZ', 'finance/chart/SPCX')

# The block to calculate dxyz prices
content = re.sub(
r'const dxyzPrice = meta\.regularMarketPrice;\n\s*const prevClose = meta\.chartPreviousClose \|\| meta\.previousClose \|\| dxyzPrice;\n\s*const dxyzChangePct = parseFloat\(\(\(\(dxyzPrice - prevClose\) / prevClose\) \* 100\)\.toFixed\(2\)\);\n\s*spacexChange = dxyzChangePct;\n\s*spacexPrice = parseFloat\(\(212\.50 \* \(1 \+ dxyzChangePct / 100\)\)\.toFixed\(2\)\);',
r'''spcxPrice = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || meta.previousClose || spcxPrice;
          spcxChange = parseFloat((((spcxPrice - prevClose) / prevClose) * 100).toFixed(2));''',
content)

content = content.replace('price: spacexPrice', 'price: spcxPrice')
content = content.replace('change_pct: spacexChange', 'change_pct: spcxChange')
content = content.replace('status: isLiveUpdated ? "Live (via DXYZ)" : "Active"', 'status: isLiveUpdated ? "Live Updated" : "Active"')
content = content.replace('status: isLiveUpdated ? "Live (via SPCX)" : "Active"', 'status: isLiveUpdated ? "Live Updated" : "Active"')

with open('server.ts', 'w') as f:
    f.write(content)

