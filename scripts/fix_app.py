import re

with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace('import { NotFinancialAdviceTag } from "./components/NotFinancialAdviceTag";', '')
text = text.replace('import { WatchlistNewsTicker', 'import { NotFinancialAdviceTag } from "./components/NotFinancialAdviceTag";\nimport { WatchlistNewsTicker')

# Find the stock card price
text = text.replace('                  {s.changePercent.toFixed(1)}%\n                </span>', '                  {s.changePercent.toFixed(1)}%\n                </span>\n                <NotFinancialAdviceTag className="scale-[0.6] origin-left -ml-1" />')

with open("src/App.tsx", "w") as f:
    f.write(text)

