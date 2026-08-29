import re

with open("src/components/MarketPulseCard.tsx", "r") as f:
    text = f.read()

text = text.replace('import { ViewTab }', 'import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";\nimport { ViewTab }')
text = text.replace('              AI MARKET BRIEF TL;DR', '              AI MARKET BRIEF TL;DR <NotFinancialAdviceTag className="scale-75 ml-2" />')

with open("src/components/MarketPulseCard.tsx", "w") as f:
    f.write(text)

