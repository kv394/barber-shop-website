const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<img src=\{logoUrl\}([^>]+) \/>/g, (match, p1) => {
  if (p1.includes('onError')) return match;
  return `<img src={logoUrl}${p1} onError={(e) => { e.currentTarget.style.display = 'none'; }} />`;
});

fs.writeFileSync(file, content);
console.log('Added onError handlers to all logo images');
