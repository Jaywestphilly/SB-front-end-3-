import re

with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('spacexPrice: 212.50,', 'spcxPrice: 108.80,')
content = content.replace('spacexChange: 5.59,', 'spcxChange: -3.03,')

content = content.replace('finance/chart/DXYZ', 'finance/chart/SPCX')
content = content.replace('finance/chart/SPACEX', 'finance/chart/SPCX')

content = re.sub(
r'const dxyzPrice = meta\.regularMarketPrice;\n\s*const prevClose = meta\.chartPreviousClose \|\| meta\.previousClose \|\| dxyzPrice;\n\s*const dxyzChangePct = parseFloat\(\(\(\(dxyzPrice - prevClose\) / prevClose\) \* 100\)\.toFixed\(2\)\);\n\s*MARKET_DATA\.spacexChange = dxyzChangePct;\n\s*MARKET_DATA\.spacexPrice = parseFloat\(\(212\.50 \* \(1 \+ dxyzChangePct / 100\)\)\.toFixed\(2\)\);',
r'''MARKET_DATA.spcxPrice = meta.regularMarketPrice;
              const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
              MARKET_DATA.spcxChange = parseFloat((((meta.regularMarketPrice - prevClose) / prevClose) * 100).toFixed(2));''',
content)

content = content.replace('MARKET_DATA.spacexPrice', 'MARKET_DATA.spcxPrice')
content = content.replace('baseline for SPACEX', 'baseline for SPCX')

with open('index.html', 'w') as f:
    f.write(content)
