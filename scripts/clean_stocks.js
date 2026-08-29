const fs = require('fs');
let code = fs.readFileSync('src/data/stocks.ts', 'utf8');

// keep STOCK_NEWS_FEED but replace INITIAL_STOCKS and generateHistory
code = `import { StockTicker, StockNews } from "../types";
export const INITIAL_STOCKS: StockTicker[] = [];
` + code.substring(code.indexOf('export const STOCK_NEWS_FEED'));

fs.writeFileSync('src/data/stocks.ts', code);
