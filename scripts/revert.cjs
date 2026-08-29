const fs = require('fs');
const path = require('path');
const dirPath = path.join(__dirname, 'src', 'components', 'StockDetailModal');

// Read the parts and reconstruct fullBody
function getRawJSX(file) {
    let text = fs.readFileSync(path.join(dirPath, file), 'utf8');
    const start = text.indexOf('<>\n') + 3;
    const end = text.lastIndexOf('\n    </>\n');
    return text.slice(start, end);
}

const headerJSX = getRawJSX('StockHeader.tsx');
const simJSX = getRawJSX('TradeSimulator.tsx');
const chartJSX = getRawJSX('PriceChart.tsx');
const finJSX = getRawJSX('FinancialMetrics.tsx');
const newsJSX = getRawJSX('NewsPanel.tsx'); 

const fullBody = headerJSX + simJSX + chartJSX + finJSX + newsJSX;

let indexFile = fs.readFileSync(path.join(dirPath, 'index.tsx'), 'utf8');
const returnStart = indexFile.lastIndexOf('return (');
const indexBeforeReturn = indexFile.slice(0, returnStart + 8); 

// Strip the propsToPass block from indexBeforeReturn
let newIndexContent = indexBeforeReturn.replace(/const propsToPass: any = \{[\s\S]*?\};\n/, '');
newIndexContent = newIndexContent.replace(/fetchAiAnalysis,\n    plotWidth,[\s\S]*?;\n/, '');

// Fix imports in indexBeforeReturn
newIndexContent = newIndexContent.replace(/from "\.\.\/\.\.\//g, 'from "../');
newIndexContent = newIndexContent.replace(/from "\.\.\//g, 'from "./');
newIndexContent = newIndexContent.replace(/from '\.\.\/\.\.\//g, "from '../");
newIndexContent = newIndexContent.replace(/from '\.\.\//g, "from './");
newIndexContent = newIndexContent.replace(/import \{ StockHeader \}[\s\S]*?import \{ OptionsPanel \} from '\.\/OptionsPanel';/, '');
newIndexContent = newIndexContent.replace(/import \{ StockDetailModalProps \} from "\.\.\/types";/, 'import { StockDetailModalProps } from "../types";');

newIndexContent = newIndexContent + '\n' + fullBody + '\n  );\n};\n';

fs.writeFileSync(path.join(__dirname, 'src', 'components', 'StockDetailModal.tsx'), newIndexContent);

// Remove the StockDetailModal directory entirely!
fs.rmSync(dirPath, { recursive: true, force: true });
console.log("Reverted to original StockDetailModal.tsx");
