import re

with open('server.ts', 'r') as f:
    content = f.read()

# Remove the SPACEX block from fetchYahooQuote
spacex_block = re.search(r'if \(symUpper === \'SPACEX\'\) \{[\s\S]*?\}\s*\}\n\n', content)
if spacex_block:
    content = content.replace(spacex_block.group(0), '')

with open('server.ts', 'w') as f:
    f.write(content)
