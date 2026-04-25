const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update CustomPageContent definition
const oldFunctionStart = 'function CustomPageContent({ content, shop, themeColor, className }: { content: string, shop: any, themeColor?: string, className?: string }) {';
const oldFunctionRegex = new RegExp(oldFunctionStart.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&') + '[\\\\s\\\\S]*?(?=export default function ClientPage)', 'g');

const newFunction = fs.readFileSync('new_function.txt', 'utf8');

content = content.replace(oldFunctionRegex, newFunction + '\\n\\n');

// 2. Add onBookClick={handleBookClick} to all <CustomPageContent ... />
content = content.replace(/<CustomPageContent([^>]+)\/>/g, '<CustomPageContent$1 onBookClick={handleBookClick} />');

// 3. Remove the old Services Sections
const templatesToRemove = [
  { start: '{/* Services Section */}', findAfter: "if (templateType === 'sporty')" },
  { start: '<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">', findAfter: "if (templateType === 'corporate')" },
  { start: '<section className="max-w-3xl mx-auto">', findAfter: "if (templateType === 'noir')" },
  { start: '<section className="max-w-4xl mx-auto">', findAfter: "if (templateType === 'sunset')" },
  { start: '{/* Services Section */}', findAfter: "if (templateType === 'editorial')" },
  { start: '<section className="max-w-4xl mx-auto px-6 py-16">', findAfter: "if (templateType === 'minimal')" },
  { start: '<section className="max-w-5xl mx-auto px-8 py-20">', findAfter: "if (templateType === 'classic')" },
  { start: '{/* Services Section */}', findAfter: "// Default 'modern' template" }
];

for (const tmpl of templatesToRemove) {
  let searchStart = content.indexOf(tmpl.findAfter);
  if (searchStart === -1) continue;

  let blockStart = content.indexOf(tmpl.start, searchStart);
  if (blockStart === -1) continue;
  
  // Find the end of the section by looking for <ReviewsSection
  let reviewsIdx = content.indexOf('<ReviewsSection', blockStart);
  if (reviewsIdx === -1) continue;
  
  // Cut out the block between blockStart and reviewsIdx
  content = content.substring(0, blockStart) + content.substring(reviewsIdx);
}

fs.writeFileSync(file, content);
console.log('Done refactor');
