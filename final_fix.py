import os

FILE_PATH = 'Backend/server.js'

with open(FILE_PATH, 'rb') as f:
    data = f.read()

# Filter: allow only printable ASCII, standard whitespace, and let through UTF-8 (>= 128)
# We specifically want to remove control characters like 0x08 (backspace)
# which are < 32 and not among 9, 10, 13.

clean_data = bytearray()
for b in data:
    if b >= 32 or b in (9, 10, 13):
        clean_data.append(b)

with open(FILE_PATH, 'wb') as f:
    f.write(clean_data)

print(f"Successfully cleaned server.js. New size: {len(clean_data)} bytes.")
