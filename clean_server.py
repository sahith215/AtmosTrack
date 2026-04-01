import os

FILE_PATH = 'Backend/server.js'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix literal '\n' injected by previous script
content = content.replace('\\n', '\n')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully cleaned server.js.")
