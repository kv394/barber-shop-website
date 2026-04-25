const fs = require('fs');
const content = fs.readFileSync('app/shops/[slug]/ClientPage.tsx', 'utf8');

const templates = ['sporty', 'corporate', 'noir', 'sunset', 'editorial', 'minimal', 'classic', 'modern'];

templates.forEach(t => {
  const start = t === 'modern' ? content.lastIndexOf('return (') : content.indexOf(`if (templateType === '${t}')`);
  if (start !== -1) {
    const end = content.indexOf('if (templateType ===', start + 10);
    const block = content.substring(start, end === -1 ? content.length : end);
    const hasPages = block.includes('{pages.filter');
    console.log(`Template ${t}: hasPages=${hasPages}`);
  } else {
    console.log(`Template ${t}: NOT FOUND`);
  }
});
