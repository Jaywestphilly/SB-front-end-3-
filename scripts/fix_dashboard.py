import re

with open("src/components/MyBlocDashboard.tsx", "r") as f:
    text = f.read()

text = text.replace('import { StockTicker, ViewTab }', 'import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";\nimport { StockTicker, ViewTab }')
text = text.replace('                  <div className="text-sm font-bold text-cyan-200">RSI {stk.rsi ?? 50}</div>', '                  <div className="text-sm font-bold text-cyan-200">RSI {stk.rsi ?? 50} <NotFinancialAdviceTag className="scale-[0.6] origin-right" /></div>')

with open("src/components/MyBlocDashboard.tsx", "w") as f:
    f.write(text)

