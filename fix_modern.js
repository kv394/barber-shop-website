const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const pagesBlock = `            {pages.filter((p: any) => p.isVisible).map((p: any) => (

            <section key={p.id} id={p.id} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[80vh]">
               <div className="bg-crm-surface p-8 md:p-12 rounded-2xl border border-crm-border shadow-sm shadow-xl">
                  <h1 className="font-bold mb-8 text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                  <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none text-crm-muted" />
               </div>
            </section>
            ))}`;

// remove pagesBlock
content = content.replace(pagesBlock, '');

// insert pagesBlock before Services Section
const servicesMarker = `          {/* Services Section */}`;
content = content.replace(servicesMarker, pagesBlock + '\\n\\n' + servicesMarker);

fs.writeFileSync(file, content);
console.log('Fixed modern template order');
