const fs = require('fs');

let c = fs.readFileSync('src/app/App.tsx', 'utf8');

c = c.replace(/const closeAllModals = \(\) => {([\s\S]*?)};/, 'const closeAllModals = useCallback(() => {$1}, []);');

c = c.replace(/const pushOverlayHistory = \(isTerminal: boolean\) => {([\s\S]*?)};/, 'const pushOverlayHistory = useCallback((isTerminal: boolean) => {$1}, []);');

// initialRoute is not a state, it's defined inside component body using `useMemo(() => getRouteFromLocation(), []);`, so it's stable.
c = c.replace(/}, \[\]\); \/\/ 122/g, '}, [initialRoute.isTerminalOpen]);');
c = c.replace(/if \(initialRoute.isTerminalOpen\) setIsBloombergTerminalOpen\(true\);\n  }, \[\]\);/g, 'if (initialRoute.isTerminalOpen) setIsBloombergTerminalOpen(true);\n  }, [initialRoute.isTerminalOpen]);');

c = c.replace(/}, \[isDayMode\]\);/g, '}, [isDayMode]);');

// handleSyncLiveQuotes is massive, let's wrap it in useCallback.
// It has no reactive deps. 
c = c.replace(/const handleSyncLiveQuotes = async \(\) => {/, 'const handleSyncLiveQuotes = useCallback(async () => {');
c = c.replace(/setIsSyncingLiveQuotes\(false\);\n    }\n  };/, 'setIsSyncingLiveQuotes(false);\n    }\n  }, []);');

// Wait, eslint wants us to add the deps to the `useEffect` arrays.
// It's safer to just run eslint with --fix!
fs.writeFileSync('src/app/App.tsx', c);
