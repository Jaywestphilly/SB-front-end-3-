import re

with open("src/components/BrandLandingHub.tsx", "r") as f:
    content = f.read()

# Replace <div onClick=... className="... group" with <button
# We can look for `<div\n              onClick={() => {\n                triggerHaptic("selection");\n                onSelectTab("`

pattern = r'<div\s+onClick=\{\(\) => \{\s+triggerHaptic\("selection"\);\s+onSelectTab\("([^"]+)"\);\s+\}\}\s+className="([^"]+) cursor-pointer([^"]+)"'
replacement = r'<button type="button" aria-label="Open \1 Module" onClick={() => { triggerHaptic("selection"); onSelectTab("\1"); }} className="\2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left w-full\3"'

new_content = re.sub(pattern, replacement, content)

with open("src/components/BrandLandingHub.tsx", "w") as f:
    f.write(new_content)

