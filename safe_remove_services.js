const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const templates = [
  {
    name: 'sporty',
    startStr: '{/* Services Section */}',
    endStr: '{/* Footer */}'
  },
  {
    name: 'corporate',
    startStr: '<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">\\n              <h2 className="font-bold text-center text-crm-text mb-12 text-xl font-bold">Our Services</h2>',
    endStr: '<footer'
  },
  {
    name: 'noir',
    startStr: '<section className="max-w-3xl mx-auto">\\n                <h2 className="text-center uppercase tracking-[0.3em] text-crm-muted mb-10 text-xl font-bold">Services</h2>',
    endStr: '<footer'
  },
  {
    name: 'sunset',
    startStr: '<section className="max-w-4xl mx-auto">\\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">',
    endStr: '{selectedService && ('
  },
  {
    name: 'editorial',
    startStr: '{/* Services Section */}',
    endStr: '{/* Gallery Section */}'
  },
  {
    name: 'minimal',
    startStr: '<section className="max-w-4xl mx-auto px-6 py-16">\\n              <h2 className="font-semibold tracking-widest uppercase text-crm-muted mb-10 text-xl font-bold">Service Menu</h2>',
    endStr: '<footer'
  },
  {
    name: 'classic',
    startStr: '<section className="max-w-5xl mx-auto px-8 py-20">\\n              <h2 className="font-bold text-center uppercase tracking-widest mb-16 relative text-xl font-bold">',
    endStr: '<footer'
  },
  {
    name: 'modern',
    startStr: '{/* Services Section */}',
    endStr: '{/* Footer */}'
  }
];

let currentIndex = 0;
let newContent = '';

for (let i = 0; i < templates.length; i++) {
  const tmpl = templates[i];
  
  let tmplStart = 0;
  if (tmpl.name !== 'modern') {
    tmplStart = content.indexOf(`if (templateType === '${tmpl.name}')`);
  } else {
    tmplStart = content.lastIndexOf('return ('); // modern is the default at bottom
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
  
  let removeStart = section.indexOf(tmpl.startStr.replace(/\\n/g, '\n'));
  if (removeStart === -1) {
    // try fallback 
    removeStart = section.indexOf('Our Services');
    if (removeStart !== -1) {
        removeStart = section.lastIndexOf('<section', removeStart);
    } else {
        removeStart = section.indexOf('Services</h2>');
        if (removeStart !== -1) {
            removeStart = section.lastIndexOf('<section', removeStart);
        } else {
            removeStart = section.indexOf('Service Menu');
            if (removeStart !== -1) removeStart = section.lastIndexOf('<section', removeStart);
            else removeStart = section.indexOf('{/* Services Section */}');
        }
    }
  }
  
  if (removeStart !== -1) {
    let removeEnd = section.indexOf(tmpl.endStr, removeStart);
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
}

fs.writeFileSync(file, content);
console.log('Finished safe removal');
