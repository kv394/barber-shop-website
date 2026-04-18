const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(fullPath));
    } else { 
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
         results.push(fullPath);
      }
    }
  });
  return results;
}

const replacements = [
  { regex: /\btext-sm\b/g, replacement: 'text-[13px]' },
  { regex: /\btext-xs\b/g, replacement: 'text-[11px]' },
  { regex: /\btext-base\s+md:text-lg\b/g, replacement: 'text-[13px]' },
  { regex: /\btext-lg\s+md:text-xl\b/g, replacement: 'text-sm font-semibold' },
  { regex: /\btext-xl\s+md:text-2xl\b/g, replacement: 'text-base font-semibold' },
  { regex: /\btext-2xl\s+md:text-3xl\b/g, replacement: 'text-lg font-bold' },
  { regex: /\btext-3xl\s+md:text-4xl\b/g, replacement: 'text-xl font-bold' },
  { regex: /\btext-4xl\s+md:text-5xl(?:\s+lg:text-6xl)?\b/g, replacement: 'text-2xl font-bold' },
  // Map specific Tailwind grays used in older components to CRM theme classes
  { regex: /\btext-gray-900\b/g, replacement: 'text-crm-text' },
  { regex: /\btext-gray-800\b/g, replacement: 'text-crm-text' },
  { regex: /\btext-gray-700\b/g, replacement: 'text-crm-text' },
  { regex: /\btext-gray-600\b/g, replacement: 'text-crm-muted' },
  { regex: /\btext-gray-500\b/g, replacement: 'text-crm-muted' },
  { regex: /\btext-gray-400\b/g, replacement: 'text-crm-muted' },
  { regex: /\bbg-gray-50\b/g, replacement: 'bg-crm-bg' },
  { regex: /\bbg-gray-100\b/g, replacement: 'bg-crm-surface' },
  { regex: /\bborder-gray-200\b/g, replacement: 'border-crm-border' },
  { regex: /\bborder-gray-100\b/g, replacement: 'border-crm-border' },
];

targetDirs.forEach(dir => {
  const fullPath = path.resolve(__dirname, dir);
  if (fs.existsSync(fullPath)) {
     const files = walk(fullPath);
     files.forEach(file => {
       let content = fs.readFileSync(file, 'utf8');
       let originalContent = content;
       
       replacements.forEach(({ regex, replacement }) => {
         content = content.replace(regex, replacement);
       });
       
       if (content !== originalContent) {
         fs.writeFileSync(file, content, 'utf8');
         console.log(`Updated: ${file}`);
       }
     });
  }
});
