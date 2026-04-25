const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// We have 8 templates: sporty, corporate, noir, sunset, editorial, minimal, classic, modern
// We want to move the pages.filter block to just before the services section for each.

const templates = [
  {
    servicesMarker: '{/* Services Section */}',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'sport')", // sporty
  },
  {
    servicesMarker: '<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">\\n              <h2 className="font-bold text-center',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'corporate')",
  },
  {
    servicesMarker: '<section className="max-w-3xl mx-auto">\\n                <h2 className="text-center uppercase',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'noir')",
  },
  {
    servicesMarker: '<section className="max-w-4xl mx-auto">\\n                <div className="grid grid-cols-1 md:grid-cols-2',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'sunset')",
  },
  {
    servicesMarker: '{/* Services Section */}',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'editorial')",
  },
  {
    servicesMarker: '<section className="max-w-4xl mx-auto px-6 py-16">\\n              <h2 className="font-semibold',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'minimal')",
  },
  {
    servicesMarker: '<section className="max-w-5xl mx-auto px-8 py-20">\\n              <h2 className="font-bold text-center',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "if (templateType === 'classic')",
  },
  {
    servicesMarker: '{/* Services Section */}',
    customPagesStart: '{pages.filter((p: any) => p.isVisible).map((p: any) => (',
    customPagesEnd: '))}',
    findServicesAfter: "// Default 'modern' template",
  }
];

// Let's just use string replacement specifically using regex matching block and moving it.
let parts = content.split('if (templateType ===');
// Wait, the last one is modern template... let's just do it manually with regex or simpler method
function moveTemplateBlock(name) {
   let startIdx = content.indexOf(name);
   if (startIdx === -1) return;
   let endIdx = content.indexOf('if (templateType ===', startIdx + 20);
   if (endIdx === -1) endIdx = content.length;
   
   let section = content.substring(startIdx, endIdx);
   
   let pageBlockStart = section.indexOf('{pages.filter((p: any) => p.isVisible).map((p: any) => (');
   if (pageBlockStart === -1) return;
   
   // The block ends at the corresponding }))}, but let's just find the next <ReviewsSection
   let reviewSectionIdx = section.indexOf('<ReviewsSection', pageBlockStart);
   if (reviewSectionIdx === -1) return;
   
   // Actually, the pages block is exactly what we replaced earlier.
   let pagesBlockEnd = section.indexOf('))}  ', pageBlockStart); // wait, what does the end look like?
   let actualEnd = section.lastIndexOf('))}');
   // Let's extract the block by finding the start of the <section that follows or similar.
}
