const fs = require('fs');

let c = fs.readFileSync('src/components/StockDetailModal/index.tsx', 'utf8');
c = c.replace(/}, \[stock\?\.symbol\]\);/g, '}, [stock]);');
c = c.replace(/}, \[stock\?\.symbol, timeframe\]\);/g, '}, [stock, timeframe]);');
c = c.replace(/}, \[showOverlay, benchmarkSymbol, timeframe, stock\?\.symbol, stock\?\.history\]\);/g, '}, [showOverlay, benchmarkSymbol, timeframe, stock]);');
c = c.replace(/}, \[realHistory, stock\?\.history, timeframe\]\);/g, '}, [realHistory, stock, timeframe]);');
c = c.replace(/}, \[stock\?\.price, stock\?\.symbol\]\);/g, '}, [stock]);');
c = c.replace(/}, \[paperTrades, stock\?\.price, stock\?\.symbol\]\);/g, '}, [paperTrades, stock]);');
c = c.replace(/\[\n      candleOHLCData,\n      minVal,\n      valRange,\n      plotWidth,\n      plotBottom,\n      plotHeight,\n    \]/g, '[candleOHLCData, candleOHLCData.length, minVal, valRange, plotWidth, plotBottom, plotHeight]');
c = c.replace(/\[macdData, macdMaxAbs, plotWidth, macdY0\]/g, '[macdData, macdMaxAbs, plotWidth, macdY0, getMacdY]');
c = c.replace(/}, \[isBloombergTerminalOpen, activeTab\]\);/g, '}, [isBloombergTerminalOpen, activeTab, closeAllModals, pushOverlayHistory, setIsBloombergTerminalOpen]);');

fs.writeFileSync('src/components/StockDetailModal/index.tsx', c);

let c2 = fs.readFileSync('src/app/App.tsx', 'utf8');
c2 = c2.replace(/}, \[initialRoute\.isTerminalOpen\]\);/, '}, [initialRoute.isTerminalOpen, setIsBloombergTerminalOpen]);');
c2 = c2.replace(/}, \[isBloombergTerminalOpen, activeTab\]\);/, '}, [isBloombergTerminalOpen, activeTab, closeAllModals, setIsBloombergTerminalOpen, pushOverlayHistory]);');
c2 = c2.replace(/}, \[\]\); \/\/ 263/g, '}, [setIsDayMode]);');
c2 = c2.replace(/}, \[\]\); \/\/ 296/g, '}, [setIsOnboardingOpen]);');
c2 = c2.replace(/}, \[\]\); \/\/ 586/g, '}, [handleSyncLiveQuotes]);');
fs.writeFileSync('src/app/App.tsx', c2);

