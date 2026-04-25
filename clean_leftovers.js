const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Clean Noir Services
const noirStart = '<section className="max-w-3xl mx-auto">';
const noirTitle = '<h2 className="text-center uppercase tracking-[0.3em] text-crm-muted mb-10 text-xl font-bold">Services</h2>';

let noirIdx = content.indexOf(noirTitle);
if (noirIdx !== -1) {
  let sectionStart = content.lastIndexOf(noirStart, noirIdx);
  let reviewIdx = content.indexOf('<ReviewsSection reviews={reviews} variant="dark" />', noirIdx);
  if (sectionStart !== -1 && reviewIdx !== -1) {
    content = content.substring(0, sectionStart) + content.substring(reviewIdx);
  }
}

// 2. Clean Editorial navigation
const edStart = '<div className="hidden md:flex items-center gap-10">';
let edIdx = content.indexOf(edStart);
if (edIdx !== -1) {
  let edEnd = content.indexOf('</div>', edIdx);
  if (edEnd !== -1) {
    content = content.substring(0, edIdx) + content.substring(edEnd + 6);
  }
}

// 3. Clean Corporate quick links
const svcsLink = '<li><a href="#" className="hover:text-status-cancelled transition-colors">Services</a></li>';
content = content.replace(svcsLink, '');

// 4. Remove literal \n\n text strings that got injected into JSX
content = content.replace(/\\n\\n            \{pages\.filter/g, '{pages.filter');

fs.writeFileSync(file, content);
console.log('Cleaned leftovers successfully');
