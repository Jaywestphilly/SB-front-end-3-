import re

with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace('import { AffiliateLink } from "./components/AffiliateLink";', 'import { AffiliateLink } from "./components/AffiliateLink";\nimport { GlobalDisclaimerBar } from "./components/GlobalDisclaimerBar";\nimport { DisclaimerModal } from "./components/DisclaimerModal";')

# state
text = text.replace('const [isBloombergTerminalOpen, setIsBloombergTerminalOpen] = useState(false);', 'const [isBloombergTerminalOpen, setIsBloombergTerminalOpen] = useState(false);\n  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);')

# render
render_disclaimer = """
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
      <GlobalDisclaimerBar onOpenDisclaimerModal={() => setIsDisclaimerOpen(true)} />
"""

text = text.replace('      <BottomNav', render_disclaimer + '\n      <BottomNav')

with open("src/App.tsx", "w") as f:
    f.write(text)

