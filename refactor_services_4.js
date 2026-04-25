const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace CustomPageContent

const oldFunctionStart = 'function CustomPageContent({ content, shop, themeColor, className }: { content: string, shop: any, themeColor?: string, className?: string }) {';
const oldFunctionRegex = new RegExp(oldFunctionStart.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\\\$&') + '[\\\\s\\\\S]*?(?=export default function ClientPage)', 'g');

const newFunction = fs.readFileSync('new_function.txt', 'utf8');
content = content.replace(oldFunctionRegex, newFunction + '\\n\\n');

// 2. Add onBookClick={handleBookClick} to all <CustomPageContent ... />
content = content.replace(/<CustomPageContent([^>]+)\/>/g, (match, p1) => {
    if (p1.includes('onBookClick')) return match;
    return `<CustomPageContent${p1} onBookClick={handleBookClick} />`;
});


// 3. Remove the old Services Sections using Regex replacement
const blocksToRemove = [
  // sporty
  /\{\/\* Services Section \*\/\}[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="light" \/>)/,
  
  // corporate
  /<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="light" \/>)/,
  
  // noir
  /<section className="max-w-3xl mx-auto">[\\s\\S]*?(?=<\/div>[\\s]*<ReviewsSection reviews=\{reviews\} variant="dark" \/>)/,
  
  // sunset
  /<section className="max-w-4xl mx-auto">[\\s\\S]*?(?=<\/div>[\\s]*<ReviewsSection reviews=\{reviews\} variant="dark" \/>)/,
  
  // editorial
  /\{\/\* Services Section \*\/\}[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="dark" \/>)/,
  
  // minimal
  /<section className="max-w-4xl mx-auto px-6 py-16">[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="light" \/>)/,
  
  // classic
  /<section className="max-w-5xl mx-auto px-8 py-20">[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="warm" \/>)/,
  
  // modern
  /\{\/\* Services Section \*\/\}[\\s\\S]*?(?=\{pages\.filter\(\(p: any\) => p\.isVisible\)\.map\(\(p: any\) => \()/
];

for (const regex of blocksToRemove) {
  content = content.replace(regex, '\\n\\n');
}

fs.writeFileSync(file, content);
console.log('Removed services blocks');
