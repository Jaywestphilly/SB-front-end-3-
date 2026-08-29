import re

with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace('import { trackEvent } from "./utils/analytics";', '')
text = text.replace('import { appendUTM }', 'import { trackEvent } from "./utils/analytics";\nimport { appendUTM }')

text = text.replace('onOpenProSubscription={() => setIsProSubscriptionOpen(true)}', 'onOpenProSubscription={() => { trackEvent("premium_modal_opened"); setIsProSubscriptionOpen(true); }}')

with open("src/App.tsx", "w") as f:
    f.write(text)

