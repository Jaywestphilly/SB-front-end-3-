import re

with open("src/App.tsx", "r") as f:
    lines = f.read().split('\n')

new_lines = []
for i, line in enumerate(lines):
    if i == 116: # 117 is line 116 in 0-index
        continue
    new_lines.append(line)

text = '\n'.join(new_lines)

text = text.replace("""      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
      <GlobalDisclaimerBar onOpenDisclaimerModal={() => setIsDisclaimerOpen(true)} />

      <BottomNav""", """      <GlobalDisclaimerBar onOpenDisclaimerModal={() => setIsDisclaimerOpen(true)} />
      <BottomNav""")

with open("src/App.tsx", "w") as f:
    f.write(text)

