const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const templates = [
  {
    name: 'sporty',
    servicesMarker: '{/* Services Section */}',
  },
  {
    name: 'corporate',
    servicesMarker: '<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">',
  },
  {
    name: 'noir',
    servicesMarker: '<section className="max-w-3xl mx-auto">',
  },
  {
    name: 'sunset',
    servicesMarker: '<section className="max-w-4xl mx-auto">',
  },
  {
    name: 'editorial',
    servicesMarker: '{/* Services Section */}',
  },
  {
    name: 'minimal',
    servicesMarker: '<section className="max-w-4xl mx-auto px-6 py-16">',
  },
  {
    name: 'classic',
    servicesMarker: '<section className="max-w-5xl mx-auto px-8 py-20">',
  },
  {
    name: 'modern',
    servicesMarker: '{/* Services Section */}',
  }
];

let currentIndex = 0;

for (let i = 0; i < templates.length; i++) {
  const tmpl = templates[i];
  
  // Find start of template block
  let tmplStart = 0;
  if (tmpl.name !== 'modern') {
    tmplStart = content.indexOf(`if (templateType === '${tmpl.name}')`, currentIndex);
  } else {
    tmplStart = content.indexOf(`// Default 'modern' template (the one that was originally there)`, currentIndex);
  }
  
  if (tmplStart === -1) {
    console.error(`Template ${tmpl.name} not found`);
    continue;
  }
  
  let tmplEnd = i < templates.length - 1 
    ? content.indexOf(`if (templateType ===`, tmplStart + 20) 
    : content.length;
    
  if (tmplEnd === -1) tmplEnd = content.length;
  
  let section = content.substring(tmplStart, tmplEnd);
  
  // Find the custom pages rendering block. It starts with {pages.filter and contains <section key=
  let pagesBlockStart = -1;
  let searchIdx = 0;
  while (true) {
    let pIdx = section.indexOf('{pages.filter((p: any) => p.isVisible).map((p: any) => (', searchIdx);
    if (pIdx === -1) break;
    
    // check if it has <section key={p.id} within the next 200 chars
    let checkStr = section.substring(pIdx, pIdx + 200);
    if (checkStr.includes('<section key={p.id}')) {
      pagesBlockStart = pIdx;
      break;
    }
    searchIdx = pIdx + 10;
  }
  
  if (pagesBlockStart === -1) {
    console.error(`Pages block not found for ${tmpl.name}`);
    continue;
  }
  
  // The block ends at the first }))} after pagesBlockStart
  let pagesBlockEnd = section.indexOf('))}', pagesBlockStart) + 3;
  
  let block = section.substring(pagesBlockStart, pagesBlockEnd);
  
  // Remove block from section
  let newSection = section.substring(0, pagesBlockStart) + section.substring(pagesBlockEnd);
  
  // Find where to insert it (before servicesMarker)
  let insertIdx = newSection.indexOf(tmpl.servicesMarker);
  
  if (insertIdx === -1) {
    // try to fallback to something else if services marker is wrong
    console.error(`Services marker not found for ${tmpl.name}`);
    continue;
  }
  
  newSection = newSection.substring(0, insertIdx) + block + '\\n\\n            ' + newSection.substring(insertIdx);
  
  content = content.substring(0, tmplStart) + newSection + content.substring(tmplEnd);
  currentIndex = tmplStart + newSection.length;
}

fs.writeFileSync(file, content);
console.log('Pages moved successfully!');
