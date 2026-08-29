import re

with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace('        onOpenProSubscription={() => { trackEvent("premium_modal_opened"); setIsProSubscriptionOpen(true); }}\n        onOpenAuth', '        onOpenAuth')

with open("src/App.tsx", "w") as f:
    f.write(text)

