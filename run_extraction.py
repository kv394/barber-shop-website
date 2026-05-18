import re
import os

with open('app/shops/[slug]/ClientPage.tsx', 'r') as f:
    lines = f.readlines()

os.makedirs('app/shops/[slug]/templates', exist_ok=True)

templates = [
    ('CustomTemplate', "templateType === 'custom'", 120, 132),
    ('DynamicTemplate', "dynamicTemplateHtml", 133, 240),
    ('SportyTemplate', "templateType === 'sporty'", 246, 440),
    ('CorporateTemplate', "templateType === 'corporate'", 442, 611),
    ('NoirTemplate', "templateType === 'noir'", 613, 749),
    ('SunsetTemplate', "templateType === 'sunset'", 751, 887),
    ('EditorialTemplate', "templateType === 'editorial'", 889, 1215),
    ('MinimalTemplate', "templateType === 'minimal'", 1217, 1370),
    ('ClassicTemplate', "templateType === 'classic'", 1372, 1513),
]

# Write out the template files
for name, condition, start, end in templates:
    block_lines = lines[start+1:end] # exclude if { and }
    
    # remove the return ( and ); wrapping
    while block_lines and block_lines[0].strip() in ['return (', 'return']:
        block_lines.pop(0)
    if block_lines and block_lines[-1].strip() == ');':
        block_lines.pop()
    
    content = "".join(block_lines)
    
    imports = """import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function """ + name + """({ ctx }: { ctx: any }) {
    const { 
        shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
        selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
        c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
        heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
        faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
        pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
        shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton 
    } = ctx;
    
    return (
""" + content + """
    );
}
"""
    with open(f'app/shops/[slug]/templates/{name}.tsx', 'w') as f:
        f.write(imports)

# Rewrite ClientPage.tsx
new_lines = lines[:120]
for name, condition, _, _ in templates:
    new_lines.append(f"    if ({condition}) return <{name} ctx={{ctx}} />;\n")
new_lines.extend(lines[1514:])

imports_to_add = [f"import {name} from './templates/{name}';" for name, _, _, _ in templates]
new_lines = imports_to_add + ['\n'] + new_lines

# Inject ctx inside ClientPage
ctx_decl = """
    const ctx = {
        shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
        selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
        c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
        heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
        faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
        pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
        shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton
    };
"""

# Insert ctx_decl right before line 120 (which is now shifted by imports_to_add length)
insert_idx = len(imports_to_add) + 1 + 120
new_lines.insert(insert_idx, ctx_decl)

with open('app/shops/[slug]/ClientPage.tsx', 'w') as f:
    f.writelines(new_lines)

print("Template extraction complete.")
