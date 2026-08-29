const fs = require('fs');

let c = fs.readFileSync('src/app/App.tsx', 'utf8');

c = c.replace(/const \{ isCommandPaletteOpen, setIsCommandPaletteOpen \} = useModalStore\(\);\n/, '');
c = c.replace(/const \{ isBloombergTerminalOpen, setIsBloombergTerminalOpen \} = useModalStore\(\);/, 'const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useModalStore();\n  const { isBloombergTerminalOpen, setIsBloombergTerminalOpen } = useModalStore();');

fs.writeFileSync('src/app/App.tsx', c);
