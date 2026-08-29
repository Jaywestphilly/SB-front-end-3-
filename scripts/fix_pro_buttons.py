import re

with open("src/components/ProSubscriptionModal.tsx", "r") as f:
    text = f.read()

# I missed these amber things in the python replace: 
text = text.replace('bg-black/80 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400', 'bg-black/80 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400')
text = text.replace('px-4 py-2 bg-amber-400 text-black font-black font-tech uppercase text-xs tracking-wider rounded-xl hover:bg-amber-300 transition-all cursor-pointer shrink-0 disabled:opacity-50', 'px-4 py-2 bg-cyan-400 text-black font-black font-tech uppercase text-xs tracking-wider rounded-xl hover:bg-cyan-300 transition-all cursor-pointer shrink-0 disabled:opacity-50')

# Now add the disabled Subscribe button above the waitlist form
replacement = """
                {/* Waitlist Form */}
                <div className="pt-4 border-t border-cyan-500/20 space-y-4">
                  <button disabled className="w-full py-3 bg-neutral-900 border border-neutral-700 text-neutral-500 font-black font-tech uppercase text-sm tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <Lock className="w-4 h-4" /> SUBSCRIBE NOW (COMING SOON)
                  </button>
                  
                  {waitlistSubmitted ? (
"""
text = text.replace('                {/* Waitlist Form */}\n                <div className="pt-4 border-t border-cyan-500/20">\n                  {waitlistSubmitted ? (', replacement)

with open("src/components/ProSubscriptionModal.tsx", "w") as f:
    f.write(text)

