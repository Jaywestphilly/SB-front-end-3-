import re

with open("src/components/BrandLandingHub.tsx", "r") as f:
    content = f.read()

# I will replace the closing </div> for these specific blocks. 
# It's tricky because there are other divs inside. 
# But wait, looking at the code for each card:
#             <button type="button" ...>
#               <div ...>
#                 <Icon ... />
#               </div>
#               <div>
#                 <h4>...</h4>
#                 <p>...</p>
#               </div>
#               <div>
#                 <span>...</span>
#                 <ArrowRight />
#               </div>
#             </div> <- This should be </button>

# I can just use python to balance tags, or since I know what they look like:
# Each card ends with `\n              </div>\n            </div>`
# And we changed `<div` to `<button`. 

lines = content.split('\n')
for i, line in enumerate(lines):
    if '<button type="button"' in line:
        # found a button start. Let's find its matching </div>.
        # We assume the card's root was indented at 12 spaces.
        pass

# simpler approach: Just run prettier / eslint, maybe not.
# We can do a simple replacement for the exact ending sequences if they are unique, but they are just `            </div>`
