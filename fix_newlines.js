const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// The literal strings "\n\n" were accidentally added to the source code.
content = content.replace(/\\n\\n/g, '\n\n');

const blocksToRemove = [
  // sporty
  /\{\/\* Services Section \*\/\}[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="light" \/>)/g,
  
  // corporate
  /<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="light" \/>)/g,
  
  // noir
  /<section className="max-w-3xl mx-auto">[\\s\\S]*?(?=<\/div>[\\s]*<ReviewsSection reviews=\{reviews\} variant="dark" \/>)/g,
  
  // sunset
  /<section className="max-w-4xl mx-auto">[\\s\\S]*?(?=<\/div>[\\s]*<ReviewsSection reviews=\{reviews\} variant="dark" \/>)/g,
  
  // editorial
  /\{\/\* Services Section \*\/\}[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="dark" \/>)/g,
  
  // minimal
  /<section className="max-w-4xl mx-auto px-6 py-16">[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="light" \/>)/g,
  
  // classic
  /<section className="max-w-5xl mx-auto px-8 py-20">[\\s\\S]*?(?=<ReviewsSection reviews=\{reviews\} variant="warm" \/>)/g,
  
  // modern (already removed probably, or we need to remove the duplicate pages block)
];

for (const regex of blocksToRemove) {
  content = content.replace(regex, '\n\n');
}

// Remove the literal string "\n\n" that might be inside JSX
content = content.replace(/>\\n\\n/g, '>\n\n');
content = content.replace(/\\n\\n</g, '\n\n<');

fs.writeFileSync(file, content);
console.log("Fixed literals and services blocks");
