const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\n\\n/g, '\n\n');

fs.writeFileSync(file, content);
console.log('Fixed literal slash-n strings');
