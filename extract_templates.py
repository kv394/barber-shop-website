import re
import os

with open('app/shops/[slug]/ClientPage.tsx', 'r') as f:
    content = f.read()

lines = content.split('\n')

# Find template blocks
templates = [
    ('custom', "templateType === 'custom'"),
    ('dynamic', "dynamicTemplateHtml"),
    ('sporty', "templateType === 'sporty'"),
    ('corporate', "templateType === 'corporate'"),
    ('noir', "templateType === 'noir'"),
    ('sunset', "templateType === 'sunset'"),
    ('editorial', "templateType === 'editorial'"),
    ('minimal', "templateType === 'minimal'"),
    ('classic', "templateType === 'classic'"),
]

blocks = {}
brace_counts = {}

for name, condition in templates:
    in_block = False
    brace_count = 0
    start_idx = -1
    for i, line in enumerate(lines):
        if condition in line and not in_block and "if (" in line:
            in_block = True
            start_idx = i
            brace_count = line.count('{') - line.count('}')
            continue
            
        if in_block:
            brace_count += line.count('{') - line.count('}')
            if brace_count == 0:
                blocks[name] = (start_idx, i)
                in_block = False
                break

print("Found blocks:")
for k, v in blocks.items():
    print(f"{k}: {v[0]} to {v[1]} ({v[1]-v[0]} lines)")

