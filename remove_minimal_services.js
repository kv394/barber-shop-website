const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<section className="max-w-4xl mx-auto px-6 py-16">\s*<h2 className="font-semibold tracking-widest uppercase text-crm-muted mb-10 text-xl font-bold">Service Menu<\/h2>[\s\S]*?<\/section>/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync(file, content);
  console.log('Removed minimal services block');
} else {
  console.log('Minimal services block not found. Regex failed.');
}