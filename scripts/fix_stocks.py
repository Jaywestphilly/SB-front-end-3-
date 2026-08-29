import re

with open('src/data/stocks.ts', 'r') as f:
    content = f.read()

# Replace the first SPCX (SpaceX) with the user's requested data
first_spcx_pattern = r'symbol: "SPCX",\s*name: "Space Exploration Technologies \(SpaceX\)",\s*price: 212\.50,\s*change: 11\.25,\s*changePercent: 5\.59,'
first_spcx_replacement = '''symbol: "SPCX",
    name: "Space Exploration Technologies Corp",
    price: 108.80,
    change: -3.40,
    changePercent: -3.03,'''

content = re.sub(first_spcx_pattern, first_spcx_replacement, content)

# The second SPCX was originally DXYZ. Let's change it back to DXYZ
second_spcx_pattern = r'symbol: "SPCX",\s*name: "Destiny Tech100 \(SpaceX\)",'
second_spcx_replacement = r'symbol: "DXYZ",\n    name: "Destiny Tech100 (SpaceX)",'

content = re.sub(second_spcx_pattern, second_spcx_replacement, content)

with open('src/data/stocks.ts', 'w') as f:
    f.write(content)

