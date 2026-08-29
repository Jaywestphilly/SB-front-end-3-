import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

old_search = """      if (item.itemCategory === "youtube") {
        match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
      } else if (item.itemCategory === "podcast") {"""

new_search = """      if (item.itemCategory === "youtube" || item.itemCategory === "news_video") {
        match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
      } else if (item.itemCategory === "podcast") {"""

content = content.replace(old_search, new_search)

with open('src/components/NewsHub.tsx', 'w') as f:
    f.write(content)
