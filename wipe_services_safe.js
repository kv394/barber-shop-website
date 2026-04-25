const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const templates = [
  {
    name: 'sporty',
    startTag: '{/* Services Section */}',
    endTag: '{/* Footer */}'
  },
  {
    name: 'corporate',
    startTag: '<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">',
    endTag: '<footer',
    mustInclude: 'Our Services'
  },
  {
    name: 'noir',
    startTag: '<section className="max-w-3xl mx-auto">',
    endTag: '<footer',
    mustInclude: 'Services'
  },
  {
    name: 'sunset',
    startTag: '<section className="max-w-4xl mx-auto">',
    endTag: '{selectedService && (',
    mustInclude: 'grid grid-cols-1 md:grid-cols-2 gap-6'
  },
  {
    name: 'editorial',
    startTag: '{/* Services Section */}',
    endTag: '{/* Gallery Section */}'
  },
  {
    name: 'minimal',
    startTag: '<section className="max-w-4xl mx-auto px-6 py-16">',
    endTag: '<footer',
    mustInclude: 'Service Menu'
  },
  {
    name: 'classic',
    startTag: '<section className="max-w-5xl mx-auto px-8 py-20">',
    endTag: '<footer',
    mustInclude: 'Our Services'
  },
  {
    name: 'modern',
    startTag: '{/* Services Section */}',
    endTag: '{/* Footer */}'
  }
];

let currentIndex = 0;

for (let i = 0; i < templates.length; i++) {
  const tmpl = templates[i];
  
  let tmplStart = 0;
  if (tmpl.name !== 'modern') {
    tmplStart = content.indexOf(`if (templateType === '${tmpl.name}')`, currentIndex);
  } else {
    tmplStart = content.lastIndexOf('return ('); 
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
  
  let removeStart = -1;
  let searchIdx = 0;
  while (true) {
    let tagIdx = section.indexOf(tmpl.startTag, searchIdx);
    if (tagIdx === -1) break;
    
    if (tmpl.mustInclude) {
        let chunk = section.substring(tagIdx, tagIdx + 300);
        if (chunk.includes(tmpl.mustInclude)) {
            removeStart = tagIdx;
            break;
        }
        searchIdx = tagIdx + 10;
    } else {
        removeStart = tagIdx;
        break;
    }
  }

  if (removeStart !== -1) {
    let removeEnd = section.indexOf(tmpl.endTag, removeStart);
    if (removeEnd !== -1) {
      section = section.substring(0, removeStart) + section.substring(removeEnd);
      console.log(`Successfully removed services for ${tmpl.name}`);
    } else {
      console.log(`Could not find end string for ${tmpl.name}`);
    }
  } else {
    console.log(`Could not find start string for ${tmpl.name}`);
  }
  
  content = content.substring(0, tmplStart) + section + content.substring(tmplEnd);
  currentIndex = tmplStart + section.length;
}

fs.writeFileSync(file, content);
console.log('Finished safe removal');
