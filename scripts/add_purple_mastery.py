import re

with open('src/components/InvestopediaTab.tsx', 'r') as f:
    content = f.read()

# Add to state type
content = content.replace(
    '| "dictionary"',
    '| "dictionary"\n    | "purple_mastery"'
)

# Modify grid cols
content = content.replace(
    'grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2',
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2'
)

# Find dictionary button to insert purple mastery button next to it
dictionary_btn_str = '''          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("dictionary");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              activeSection === "dictionary"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-400 font-black shadow-lg shadow-indigo-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Dictionary</span>
          </button>'''

purple_mastery_btn_str = '''          <button
            onClick={() => {
              triggerHaptic("selection");
              setActiveSection("purple_mastery");
            }}
            className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === "purple_mastery"
                ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400 font-black shadow-lg shadow-fuchsia-500/10"
                : "bg-black/40 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Zap className="w-4 h-4 text-fuchsia-400" />
            <span>Mastery</span>
          </button>'''

# I'll fix the col-span-2 on dictionary to fit better if needed, or just let Tailwind wrap.
new_dict_btn = dictionary_btn_str.replace('col-span-2 sm:col-span-1', '')

content = content.replace(dictionary_btn_str, new_dict_btn + '\n\n' + purple_mastery_btn_str)

purple_mastery_section_str = '''
      {/* SECTION 6: PURPLE MASTERY MODULES */}
      {activeSection === "purple_mastery" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Module 1 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              AWG INNERMOST LOOP
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              Alexander Wissner-Gross: The Physics of Intelligence & Computronium Escapes
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Explores causal entropic forces and the physics of intelligence, mapping how sovereign compute scales past traditional boundaries.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$NVDA</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$TSM</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$SKHY</span>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              MACRO & INFRASTRUCTURE
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              The $1 Trillion Power Grid Bottleneck, Foundries & Rates
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Analyzes electric power grid limitations as the primary constraint on data center expansion over raw GPU supply.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$BE</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$PLPC</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$EQIX</span>
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              EXPONENTIAL TECH & LONGEVITY
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              SaaS Multiples, Native Software vs Legacy Code & Sovereign Wealth
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Examines how lean AI-native software architectures disrupt traditional enterprise software valuations.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$TSLA</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$ASTS</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$SPCE</span>
            </div>
          </div>

          {/* Module 4 */}
          <div className="bg-[#181028]/85 border border-purple-500/40 rounded-2xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] backdrop-blur-md transition-all duration-250 hover:-translate-y-1 hover:border-purple-500/80 hover:shadow-[0_12px_35px_rgba(168,85,247,0.25)]">
            <span className="inline-block bg-purple-500/20 text-purple-400 border border-purple-500/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-widest mb-3">
              HIGH PERFORMANCE & MINDSET
            </span>
            <div className="text-purple-100 text-lg font-extrabold leading-snug mb-3">
              Hyper-Focus Mastery: Rewiring Your Brain for High Yields & Wealth Speed
            </div>
            <div className="text-purple-300 text-sm leading-relaxed mb-5">
              Cognitive protocols designed to reduce mental fatigue, accelerate numerical processing, and execute disciplined wealth habits.
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$SPY</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$QQQ</span>
              <span className="bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2 py-1 rounded-md text-xs font-bold">$BTC</span>
            </div>
          </div>
        </div>
      )}
'''

content = content.replace(
    '{/* SECTION 5: FINANCIAL DICTIONARY & SEARCH */}',
    purple_mastery_section_str + '\n\n      {/* SECTION 5: FINANCIAL DICTIONARY & SEARCH */}'
)

with open('src/components/InvestopediaTab.tsx', 'w') as f:
    f.write(content)

print("Updated InvestopediaTab.tsx")

