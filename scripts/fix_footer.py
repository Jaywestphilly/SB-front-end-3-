import re

with open("src/components/Footer.tsx", "r") as f:
    text = f.read()

text = text.replace('import { triggerHaptic } from "../utils/haptics";', 'import { triggerHaptic } from "../utils/haptics";\nimport { trackEvent } from "../utils/analytics";')

text = text.replace('onClick={() => triggerHaptic("selection")}', 'onClick={() => { triggerHaptic("selection"); trackEvent("social_clicked"); }}')

with open("src/components/Footer.tsx", "w") as f:
    f.write(text)

