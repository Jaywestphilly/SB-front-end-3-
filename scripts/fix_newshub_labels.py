import re

with open('src/components/NewsHub.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'const labelText = isNews ? video.channelName : "Stock Bloc Official Video";',
    'const labelText = isNews ? video.channelName : (video.channelName || "Stock Bloc Official");'
)

with open('src/components/NewsHub.tsx', 'w') as f:
    f.write(content)
print("Updated label text.")
