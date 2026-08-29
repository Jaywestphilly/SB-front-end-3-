const fs = require('fs');

let c = fs.readFileSync('src/app/App.tsx', 'utf8');
c = c.replace(/if \(isSyncingLiveQuotes\) return;/, 'if (useMarketStore.getState().isSyncingLiveQuotes) return;');

fs.writeFileSync('src/app/App.tsx', c);
