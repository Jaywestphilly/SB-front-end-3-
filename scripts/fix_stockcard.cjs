const fs = require('fs');

let c = fs.readFileSync('src/components/StockCard.tsx', 'utf8');
c = c.replace(/const CustomCandleTooltip = \(\({ active, payload }: { active\?: boolean; payload\?: any\[\] }\)\) => {/, 'const CustomCandleTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {');

fs.writeFileSync('src/components/StockCard.tsx', c);
