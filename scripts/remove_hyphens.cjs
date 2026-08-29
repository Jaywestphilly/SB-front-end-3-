const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will use a regex to find all JSX text and string literals.
      // Actually, regex is hard. Let's just find common hyphenated words that AI uses.
      // This is safer.
      const wordsToDehyphenate = [
        'real-time', 'cutting-edge', 'game-changing', 'co-pilot', 'pre-IPO',
        'step-by-step', 'multi-trillion', 'zero-carbon', 'high-frequency',
        'deep-dive', 'AI-driven', 'AI-powered', 'AI-native', 'high-converting',
        'state-of-the-art', 'world-class', 'fast-paced', 'long-term', 'short-term',
        'high-speed', 'low-latency', 'ultra-low', 'high-density', 'pure-play',
        'wafer-scale', 'end-to-end', 'next-gen', 'rack-scale', 'non-voting',
        'multi-agent', 'solid-state', 'off-grid', 'behind-the-meter',
        'large-scale', 'high-margin', 'near-zero', 'open-weights', 'supply-constrained',
        'pre-market', 'after-hours', 'built-in', 'user-friendly', 'data-driven'
      ];
      
      // We can also just replace any lowercase-lowercase hyphen in JSX text? No, too risky.
      // Let's replace the common ones.
      for (const word of wordsToDehyphenate) {
        const regex = new RegExp(word, 'gi');
        content = content.replace(regex, (match) => match.replace(/-/g, ' '));
      }
      
      // Also, let's catch any word-word hyphen where both sides are letters, but NOT in a className="..." or similar.
      // Let's do a more robust approach:
      // Replace all hyphens that are surrounded by spaces, e.g. " - ".
      content = content.replace(/ - /g, ' ');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('./src');
console.log('Done!');
