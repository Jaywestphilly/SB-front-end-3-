import os
import re

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx"):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            # replace `<p className="text-xs(.*?)font-sans(.*?)"` with `<p className="text-sm\1font-sans\2"`
            # we want to target paragraphs
            new_content = re.sub(r'<p className="text-xs([^"]*font-sans[^"]*)"', r'<p className="text-sm\1"', content)
            
            # also replace some div text blocks if they contain `font-sans leading-relaxed`
            new_content = re.sub(r'className="text-xs([^"]*font-sans[^"]*leading-relaxed[^"]*)"', r'className="text-sm\1"', new_content)
            
            if new_content != content:
                with open(filepath, "w") as f:
                    f.write(new_content)

