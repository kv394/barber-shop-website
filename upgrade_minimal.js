const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const minimalStart = "if (templateType === 'minimal') {";
const classicStart = "if (templateType === 'classic') {";

const startIdx = content.indexOf(minimalStart);
const endIdx = content.indexOf(classicStart);

const newMinimal = `if (templateType === 'minimal') {
        return (
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#fafafa] text-[#333333] font-sans relative">
            {/* Header / Nav */}
            <header className="absolute w-full top-0 left-0 px-8 py-6 flex flex-wrap justify-between items-center z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-8 font-medium text-[13px] tracking-widest uppercase">
                        <a href="#" className="transition-opacity hover:opacity-60 text-gray-500">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={\`#\${p.id}\`} className="transition-opacity hover:opacity-60 text-gray-500">{p.title}</a>
                        ))}
                    </nav>
                )}
                <div className="ml-auto">
                    <SupabaseAuthButton redirectUrl={pathname} />
                </div>
            </header>

            {/* Hero / Shop Info */}
            <section className="max-w-4xl mx-auto px-6 pt-40 pb-20 flex flex-col items-center text-center border-b border-gray-200">
                {logoUrl ? (
                    <img src={logoUrl} alt={shop.name} className="h-28 object-contain mb-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                    <h1 className="font-light tracking-tight text-5xl mb-8" style={{ color: primaryColor }}>{shop.name}</h1>
                )}
                {shop.slogan && <p className="text-gray-900 font-medium text-lg tracking-wide mb-6">{shop.slogan}</p>}
                {shop.description && <p className="text-gray-500 text-[15px] max-w-2xl leading-relaxed">{shop.description}</p>}
                
                <div className="flex flex-wrap justify-center gap-8 mt-10 text-[13px] text-gray-400 font-medium uppercase tracking-widest">
                    {shopPhone && <a href={\`tel:\${shopPhone}\`} className="hover:text-gray-800 transition-colors">📞 {shopPhone}</a>}
                    {shopAddress && <span>📍 {shopAddress}</span>}
                </div>
            </section>
    
            {/* Custom Pages */}
            {pages.filter((p: any) => p.isVisible).map((p: any) => (
                <section key={p.id} id={p.id} className="max-w-4xl mx-auto px-6 py-24 min-h-[50vh]">
                    <h2 className="font-light tracking-wide mb-16 text-center text-3xl text-gray-900" style={{ color: primaryColor }}>{p.title}</h2>
                    <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed mx-auto" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
                </section>
            ))}

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-16 text-center text-[12px] font-medium tracking-widest uppercase text-gray-400">
                 <p className="mb-4">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                 <div className="flex justify-center gap-6 text-lg">
                    {shopFB && <a href={shopFB} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">📘</a>}
                    {shopIG && <a href={shopIG.startsWith('http') ? shopIG : \`https://instagram.com/\${shopIG.replace('@','')}\`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">📸</a>}
                    {shopTW && <a href={shopTW} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">🐦</a>}
                 </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>
        );
      }
    `;

content = content.substring(0, startIdx) + newMinimal + '\n      ' + content.substring(endIdx);

fs.writeFileSync(file, content);
console.log('Upgraded minimal template to be elegant and professional');
