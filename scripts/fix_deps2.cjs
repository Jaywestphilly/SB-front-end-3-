const fs = require('fs');

let c2 = fs.readFileSync('src/app/App.tsx', 'utf8');
c2 = c2.replace(/mediaQuery\.removeEventListener\("change", handleSystemThemeChange\);\n    }\n  }, \[\]\);/g, 'mediaQuery.removeEventListener("change", handleSystemThemeChange);\n    }\n  }, [setIsDayMode]);');

c2 = c2.replace(/console\.warn\("localStorage error", e\);\n    }\n  }, \[\]\);/g, 'console.warn("localStorage error", e);\n    }\n  }, [setIsOnboardingOpen]);');

c2 = c2.replace(/return \(\) => clearInterval\(interval\);\n  }, \[\]\);/g, 'return () => clearInterval(interval);\n  }, [handleSyncLiveQuotes]);');

c2 = c2.replace(/}, \[\]\); \/\/ 122/g, '}, [initialRoute.isTerminalOpen, setIsBloombergTerminalOpen]);');

fs.writeFileSync('src/app/App.tsx', c2);
