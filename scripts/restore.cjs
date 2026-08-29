const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'components', 'StockDetailModal');
let indexContent = fs.readFileSync(path.join(dirPath, 'index.tsx'), 'utf8');

function extractJSX(file) {
    let text = fs.readFileSync(file, 'utf8');
    const start = text.indexOf('<>\n') + 3;
    const end = text.lastIndexOf('\n    </>\n');
    return text.slice(start, end);
}

const headerJSX = extractJSX(path.join(dirPath, 'StockHeader.tsx'));
const simulatorJSX = extractJSX(path.join(dirPath, 'TradeSimulator.tsx'));
const chartJSX = extractJSX(path.join(dirPath, 'PriceChart.tsx'));
const metricsJSX = extractJSX(path.join(dirPath, 'FinancialMetrics.tsx')); // wait, metrics + consensus
const newsJSX = extractJSX(path.join(dirPath, 'NewsPanel.tsx'));
const instJSX = extractJSX(path.join(dirPath, 'InstitutionalData.tsx'));

// Wait, the FinancialMetrics file has both FinancialMetrics and AnalystConsensus.
// We can just use the whole block.
// Let's replace the <Component {...propsToPass} /> in indexContent back to original

indexContent = indexContent.replace('<StockHeader {...propsToPass} />', headerJSX);
indexContent = indexContent.replace('<TradeSimulator {...propsToPass} />', simulatorJSX);
indexContent = indexContent.replace('<PriceChart {...propsToPass} />', chartJSX);
indexContent = indexContent.replace('<FinancialMetrics {...propsToPass} />', metricsJSX);
indexContent = indexContent.replace('<NewsPanel {...propsToPass} />', newsJSX);
indexContent = indexContent.replace('<InstitutionalData {...propsToPass} />\n                  <OptionsPanel {...propsToPass} />', instJSX);

// Now remove the propsToPass block
const propsStart = indexContent.indexOf('const propsToPass = {');
const propsEnd = indexContent.indexOf('};', propsStart) + 2;
if (propsStart !== -1) {
    indexContent = indexContent.slice(0, propsStart) + indexContent.slice(propsEnd);
}

// Remove the imports we added
const importsToRemove = `
import { StockHeader } from './StockHeader';
import { TradeSimulator } from './TradeSimulator';
import { PriceChart } from './PriceChart';
import { FinancialMetrics } from './FinancialMetrics';
import { NewsPanel } from './NewsPanel';
import { InstitutionalData } from './InstitutionalData';
import { OptionsPanel } from './OptionsPanel';
`;
indexContent = indexContent.replace(importsToRemove, '');

fs.writeFileSync(path.join(__dirname, 'src', 'components', 'StockDetailModal.tsx'), indexContent);
console.log("Restored");
