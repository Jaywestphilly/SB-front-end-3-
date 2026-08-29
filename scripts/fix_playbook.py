import re

with open("src/components/PlaybooksHub.tsx", "r") as f:
    text = f.read()

text = text.replace('import { triggerHaptic } from "../utils/haptics";', 'import { triggerHaptic } from "../utils/haptics";\nimport { trackEvent } from "../utils/analytics";')

text = text.replace('onClick={() => setSelectedPlaybook(pb)}', 'onClick={() => { trackEvent("playbook_viewed", { playbookId: pb.id }); setSelectedPlaybook(pb); }}')

with open("src/components/PlaybooksHub.tsx", "w") as f:
    f.write(text)

