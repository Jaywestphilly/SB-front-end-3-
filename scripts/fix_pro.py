import re

with open("src/components/ProSubscriptionModal.tsx", "r") as f:
    text = f.read()

# Change main modal border
text = text.replace('border-amber-500/50', 'border-cyan-500/50')
# Background Holographic Glow
text = text.replace('radial-gradient(#ffb700_1px', 'radial-gradient(#06b6d4_1px')
text = text.replace('bg-amber-500/20 rounded-full blur-3xl', 'bg-cyan-500/20 rounded-full blur-3xl')

# Modal Header
text = text.replace('border-b border-amber-500/30', 'border-b border-cyan-500/30')
text = text.replace('bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/20', 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-500/20')
text = text.replace('text-amber-400 animate-pulse', 'text-cyan-400 animate-pulse')

# Heading
text = text.replace('text-amber-100 uppercase', 'text-cyan-100 uppercase')
text = text.replace('text-amber-400 font-mono tracking-widest', 'text-cyan-400 font-mono tracking-widest')

# Main Stock Bloc PRO Tier
text = text.replace('bg-[#05111d] border-2 border-amber-400', 'bg-[#05111d] border-2 border-cyan-400')
text = text.replace('hud-corner-tl border-amber-400', 'hud-corner-tl border-cyan-400')
text = text.replace('hud-corner-tr border-amber-400', 'hud-corner-tr border-cyan-400')

# Text amber inside
text = text.replace('text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/40', 'text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/40')
text = text.replace('border-t border-amber-500/20', 'border-t border-cyan-500/20')
text = text.replace('text-amber-400 shrink-0', 'text-cyan-400 shrink-0')
text = text.replace('text-amber-300 uppercase tracking-wider block', 'text-cyan-300 uppercase tracking-wider block')
text = text.replace('bg-black/90 border border-amber-500/50 focus:border-amber-400', 'bg-black/90 border border-cyan-500/50 focus:border-cyan-400')

# Waitlist button
text = text.replace('bg-amber-500 hover:bg-amber-400 text-black', 'bg-cyan-500 hover:bg-cyan-400 text-black')
text = text.replace('shadow-amber-500/20', 'shadow-cyan-500/20')

with open("src/components/ProSubscriptionModal.tsx", "w") as f:
    f.write(text)

