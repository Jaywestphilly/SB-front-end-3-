import re

with open("src/components/BrandLandingHub.tsx", "r") as f:
    text = f.read()

# Mission statement paragraphs:
text = text.replace('text-xs sm:text-sm leading-relaxed text-neutral-300 font-sans', 'text-sm sm:text-base leading-relaxed text-neutral-300 font-sans')
# Core cards:
text = text.replace('text-[11px] text-neutral-400 mt-1 leading-normal font-sans', 'text-sm text-neutral-400 mt-1 leading-normal font-sans')
# Labs cards:
text = text.replace('text-[10px] text-neutral-400 mt-0.5 leading-tight font-sans', 'text-sm text-neutral-400 mt-1 leading-normal font-sans')

with open("src/components/BrandLandingHub.tsx", "w") as f:
    f.write(text)
