const fs = require('fs');
const file = 'app/shops/[slug]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the if (!['modern'...] block and replace it
const oldStart = " if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType)) {";
const newStart = `  // Helper to normalize Google Drive image URLs
  const { normalizeGoogleDriveUrl: normalizeImageUrl } = await import('@/lib/image-utils');

  const shopForTemplate = {
  ...shop,
  logoUrl: normalizeImageUrl(shop.customization?.logoUrl) || shop.logoUrl,
  heroImageUrl: normalizeImageUrl(shop.customization?.heroImageUrl) || shop.heroImageUrl
  };

  if (shop.customization?.customHtml && shop.customization.customHtml.trim() !== '') {`;

const oldEnd = "} else if (templateType !== 'custom') {";
const newEnd = "} else if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType) && templateType !== 'custom') {";

if (content.includes(oldStart)) {
  content = content.replace(oldStart, newStart);
  
  // also need to remove the image-utils initialization inside the block
  content = content.replace(/  \/\/ Helper to normalize Google Drive image URLs\n  const \{ normalizeGoogleDriveUrl: normalizeImageUrl \} = await import\('@\/lib\/image-utils'\);\n\n  const shopForTemplate = \{\n  \.\.\.shop,\n  logoUrl: normalizeImageUrl\(shop\.customization\?\.logoUrl\) \|\| shop\.logoUrl,\n  heroImageUrl: normalizeImageUrl\(shop\.customization\?\.heroImageUrl\) \|\| shop\.heroImageUrl\n  \};\n\n  \/\/ For 'custom' template type, use the shop's own customHtml \(per-shop\)\.\n  \/\/ Route it through dynamicTemplateHtml so it renders via DynamicTemplate\n  \/\/ component \(which supports script execution for SDK\) instead of the\n  \/\/ iframe-based CustomTemplate\.\n  if \(shop\.customization\?\.customHtml && shop\.customization\.customHtml\.trim\(\) !== ''\) \{/g, '');

  content = content.replace(oldEnd, newEnd);
  
  fs.writeFileSync(file, content);
  console.log('Successfully applied patch!');
} else {
  console.log('Not found');
}
