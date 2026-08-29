const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'StockDetailModal', 'index.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace('const = stock.price || 100;', 'const currentPrice = stock.price || 100;');
fs.writeFileSync(file, content);
