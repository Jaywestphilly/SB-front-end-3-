import fs from 'fs';

let fileStr = fs.readFileSync('src/data/stocks.ts', 'utf8');
const newsItemRegex = /id: '([^']+)',\s+title: '(.*?)',\s+source: '([^']+)',\s+timeAgo: '([^']+)',\s+url: '([^']+)',\s+relatedSymbol: '([^']+)',\s+sentiment: '([^']+)'/gs;

fileStr = fileStr.replace(newsItemRegex, (match, id, title, source, timeAgo, url, relatedSymbol, sentiment) => {
    return `id: '${id}',\n    title: '${title}',\n    source: '${source}',\n    timeAgo: '${timeAgo}',\n    url: 'https://news.google.com/search?q=${relatedSymbol}+stock',\n    relatedSymbol: '${relatedSymbol}',\n    sentiment: '${sentiment}'`;
});

fs.writeFileSync('src/data/stocks.ts', fileStr);
