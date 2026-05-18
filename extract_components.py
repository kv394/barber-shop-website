import re
import os

with open('app/shops/[slug]/ClientPage.tsx', 'r') as f:
    content = f.read()

# We need to extract the exact strings. We know lines from earlier:
# formatAddress: lines 22 - 33
# StarRating: lines 34 - 43
# ReviewsSection: lines 44 - 101
# CustomPageContent: lines 102 - 456

lines = content.split('\n')

format_address_str = '\n'.join(lines[21:33])
star_rating_str = '\n'.join(lines[33:43])
reviews_section_str = '\n'.join(lines[43:101])
custom_page_content_str = '\n'.join(lines[101:456])

os.makedirs('app/shops/[slug]/components', exist_ok=True)

with open('app/shops/[slug]/components/ReviewsSection.tsx', 'w') as f:
    f.write('import React from "react";\n\n')
    f.write(star_rating_str + '\n\n')
    f.write('export ' + reviews_section_str.replace('function ReviewsSection', 'default function ReviewsSection') + '\n')

with open('app/shops/[slug]/components/CustomPageContent.tsx', 'w') as f:
    f.write('import React, { useState } from "react";\n')
    f.write('import ReviewsSection from "./ReviewsSection";\n\n')
    f.write('export ' + custom_page_content_str.replace('function CustomPageContent', 'default function CustomPageContent') + '\n')

with open('app/shops/[slug]/components/utils.ts', 'w') as f:
    f.write('export ' + format_address_str + '\n')

# Now remove them from ClientPage.tsx and add imports
new_lines = lines[:21] + [
    "import { formatAddress } from './components/utils';",
    "import ReviewsSection from './components/ReviewsSection';",
    "import CustomPageContent from './components/CustomPageContent';"
] + lines[456:]

with open('app/shops/[slug]/ClientPage.tsx', 'w') as f:
    f.write('\n'.join(new_lines))

print("Extraction script complete.")
