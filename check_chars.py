import os
import sys

FILE_PATH = 'Backend/server.js'

with open(FILE_PATH, 'rb') as f:
    data = f.read()

print(f"File size: {len(data)} bytes")

line_num = 1
col_num = 1
for i, byte in enumerate(data):
    if byte == ord('\n'):
        line_num += 1
        col_num = 1
    else:
        # Check if the byte is a standard ASCII printable character (32-126) or standard whitespace (\n, \r, \t)
        if not (32 <= byte <= 126 or byte == 10 or byte == 13 or byte == 9):
            # Print problematic character info
            context = data[max(0, i-20):min(len(data), i+20)].decode('ascii', errors='replace')
            print(f"Line {line_num}, Col {col_num}: Byte 0x{byte:02x} ({byte}) found. Context: ...{context}...")
        col_num += 1
