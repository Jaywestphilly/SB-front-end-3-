import re

with open("src/components/WatchlistNewsTicker.tsx", "r") as f:
    text = f.read()

text = text.replace('import {', 'import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";\nimport {', 1)

# Find Symbol badge in ticker
text = text.replace('<span>${item.relatedSymbol}</span>', '<span>${item.relatedSymbol}</span> <NotFinancialAdviceTag className="scale-75 origin-left" />')
# Find Expanded News Summary Modal
text = text.replace('<span>Market & Valuation Impact</span>', '<span>Market & Valuation Impact</span> <NotFinancialAdviceTag className="scale-75" />')

with open("src/components/WatchlistNewsTicker.tsx", "w") as f:
    f.write(text)

