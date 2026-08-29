import re

with open("src/components/BrandLandingHub.tsx", "r") as f:
    text = f.read()

# Replace the closing tag for the 9 buttons
# We can find all `<button type="button" aria-label=`
# and then find the corresponding `</div>` that is at the same indentation (12 spaces)
# and replace it with `</button>`

lines = text.split('\n')
stack = []
for i, line in enumerate(lines):
    stripped = line.lstrip()
    indent = len(line) - len(stripped)
    
    if '<button type="button" aria-label="Open ' in line:
        stack.append(indent)
        continue
    
    if stripped.startswith('</div') and stack and indent == stack[-1]:
        # match found
        lines[i] = ' ' * indent + '</button>'
        stack.pop()

with open("src/components/BrandLandingHub.tsx", "w") as f:
    f.write('\n'.join(lines))
