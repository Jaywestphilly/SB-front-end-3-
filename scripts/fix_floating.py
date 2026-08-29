import re

with open("src/components/FloatingCommunityButton.tsx", "r") as f:
    text = f.read()

replacement = """
      {/* Trigger Button */}
      <div className="relative group">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setIsOpen(!isOpen);
          }}
          className="px-4 h-12 rounded-full bg-amber-400 text-black shadow-xl shadow-amber-500/40 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse border-2 border-amber-200"
          title="Join the Stock Bloc Community"
        >
          <MessageSquare className="w-5 h-5 text-black fill-black/20" />
          <span className="font-black font-tech tracking-wider uppercase text-xs">JOIN THE BLOC</span>
        </button>
"""
text = re.sub(r'\{\/\* Trigger Button \*\/\}.*?<MessageSquare className="w-6 h-6 text-black fill-black\/20" \/>\s*<\/button>', replacement, text, flags=re.DOTALL)

with open("src/components/FloatingCommunityButton.tsx", "w") as f:
    f.write(text)

