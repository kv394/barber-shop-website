const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Extract the modern block from sporty and remove it
const modernBlockStart = `              {pages.filter((p: any) => p.isVisible).map((p: any) => (

            <section key={p.id} id={p.id} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[80vh]">
               <div className="bg-crm-surface p-8 md:p-12 rounded-2xl border border-crm-border shadow-sm shadow-xl">
                  <h1 className="font-bold mb-8 text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                  <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none text-crm-muted"  onBookClick={handleBookClick}  reviews={reviews} />
               </div>
            </section>
            ))}`;

if (content.includes(modernBlockStart)) {
    content = content.replace(modernBlockStart, '');
    console.log('Removed modern block from sporty');
}

// 2. Add the modern block to the modern template before {/* Footer */}
const modernFooterMarker = '          {/* Footer */}\n          <footer';
if (content.includes(modernFooterMarker)) {
    if (!content.includes('className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[80vh]">')) {
        content = content.replace(modernFooterMarker, modernBlockStart + '\n\n' + modernFooterMarker);
        console.log('Added modern block to modern template');
    }
} else {
    // try different spacing
    content = content.replace('          {/* Footer */}', modernBlockStart + '\n\n          {/* Footer */}');
}

// 3. Make sure ALL CustomPageContent calls have templateType={templateType}
content = content.replace(/<CustomPageContent([^>]+)\/>/g, (match, p1) => {
    let result = p1;
    if (!result.includes('templateType=')) {
        result += ' templateType={templateType}';
    }
    return `<CustomPageContent${result} />`;
});

fs.writeFileSync(file, content);
console.log('Done fixing pages blocks and templateType');
