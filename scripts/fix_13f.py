import re

with open("src/components/HedgeFund13F.tsx", "r") as f:
    text = f.read()

text = text.replace('import { StockTicker }', 'import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";\nimport { StockTicker }')
text = text.replace('                    ${stockQuote.price.toFixed(2)}\n                  </span>', '                    ${stockQuote.price.toFixed(2)}\n                  </span>\n                  <NotFinancialAdviceTag className="scale-75 origin-left" />')
text = text.replace('                <span className="text-white">WHALE SENTIMENT ANALYSIS</span>', '                <span className="text-white">WHALE SENTIMENT ANALYSIS</span> <NotFinancialAdviceTag className="scale-75 ml-2" />')

with open("src/components/HedgeFund13F.tsx", "w") as f:
    f.write(text)

