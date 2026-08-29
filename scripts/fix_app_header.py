import re

with open("src/App.tsx", "r") as f:
    text = f.read()

# Add onOpenProSubscription to Header
text = text.replace('onOpenMusicPlayer={() => setIsMusicPlayerOpen(true)}', 'onOpenMusicPlayer={() => setIsMusicPlayerOpen(true)}\n        onOpenProSubscription={() => { trackEvent("premium_modal_opened"); setIsProSubscriptionOpen(true); }}')

with open("src/App.tsx", "w") as f:
    f.write(text)

