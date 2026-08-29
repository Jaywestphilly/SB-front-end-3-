import re

with open("src/components/CreditBuildingHub.tsx", "r") as f:
    text = f.read()

text = text.replace('import { AffiliateLink }', 'import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";\nimport { AffiliateLink }')
text = text.replace('                    CREDIT STRATEGY RECOMMENDATION', '                    CREDIT STRATEGY RECOMMENDATION <NotFinancialAdviceTag className="scale-[0.6] ml-2 origin-left" />')
text = text.replace('                  Recommended Strategy Playbook', '                  Recommended Strategy Playbook <NotFinancialAdviceTag className="scale-[0.6] ml-2 origin-left" />')

with open("src/components/CreditBuildingHub.tsx", "w") as f:
    f.write(text)

with open("src/components/RealEstateHub.tsx", "r") as f:
    text2 = f.read()

text2 = text2.replace('import { AffiliateLink }', 'import { NotFinancialAdviceTag } from "./NotFinancialAdviceTag";\nimport { AffiliateLink }')
text2 = text2.replace('                  <span className="font-bold text-white tracking-widest uppercase">DSCR CALCULATION RESULT</span>', '                  <span className="font-bold text-white tracking-widest uppercase">DSCR CALCULATION RESULT</span> <NotFinancialAdviceTag className="scale-[0.6] ml-2 origin-left" />')
text2 = text2.replace('                  <span className="font-bold text-white tracking-widest uppercase">Mortgage Analysis Result</span>', '                  <span className="font-bold text-white tracking-widest uppercase">Mortgage Analysis Result</span> <NotFinancialAdviceTag className="scale-[0.6] ml-2 origin-left" />')

with open("src/components/RealEstateHub.tsx", "w") as f:
    f.write(text2)

