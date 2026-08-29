import re

with open("src/components/BrandLandingHub.tsx", "r") as f:
    text = f.read()

text = text.replace('import { ViewTab }', 'import { trackEvent } from "../utils/analytics";\nimport { ViewTab }')

# Replace onSelectTab calls with tracking
# triggerHaptic("selection");\n                onSelectTab("watchlist");
text = re.sub(
    r'triggerHaptic\("selection"\);\s+onSelectTab\("([^"]+)"\);', 
    r'triggerHaptic("selection"); trackEvent("module_opened", { section: "\1" }); onSelectTab("\1");', 
    text
)

# Newsletter signup
# setNewsletterSubscribed(true);
text = text.replace('setNewsletterSubscribed(true);', 'setNewsletterSubscribed(true); trackEvent("newsletter_signup", { email: newsletterEmail });')

with open("src/components/BrandLandingHub.tsx", "w") as f:
    f.write(text)

