const fs = require('fs');
const file = 'app/shops/[slug]/ClientPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Sporty
content = content.replace(
  /<h3 className="font-black italic mb-6 text-lg font-bold" style={{ color: sportRed }}>\{shop\.name\}<\/h3>\s*<p className="text-crm-muted normal-case tracking-normal mb-6 max-w-sm text-\[13px\]">/,
  '<h3 className="font-black italic mb-2 text-lg font-bold" style={{ color: sportRed }}>{shop.name}</h3>\n                                {shop.slogan && <div className="text-crm-text font-black italic mb-4 uppercase tracking-widest">{shop.slogan}</div>}\n                                <p className="text-crm-muted normal-case tracking-normal mb-6 max-w-sm text-[13px]">'
);

// Corporate
// In Corporate, the previous layout was using shop.description as a heading which was weird. Let's fix that.
content = content.replace(
  /<h2 className="font-extrabold text-crm-text mb-4 text-xl font-bold">\{shop\.description \|\| "Quality Service, Every Time\."\}<\/h2>/,
  '<h2 className="font-extrabold text-crm-text mb-4 text-xl font-bold">{shop.slogan || shop.description || "Quality Service, Every Time."}</h2>'
);

// Noir
content = content.replace(
  /\{logoUrl \? <img src=\{logoUrl\}[^>]+ \/> : <h1 className="font-black uppercase tracking-tighter text-2xl font-bold">\{shop\.name\}<\/h1>\}\s*<p className="text-crm-muted mt-2 text-\[13px\]">\{shop\.description\}<\/p>/,
  `{logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-4" /> : <h1 className="font-black uppercase tracking-tighter text-2xl font-bold">{shop.name}</h1>}
                {shop.slogan && <p className="text-white font-bold uppercase tracking-[0.2em] mt-4 mb-2 text-sm">{shop.slogan}</p>}
                <p className="text-crm-muted mt-2 text-[13px]">{shop.description}</p>`
);

// Sunset
content = content.replace(
  /\{logoUrl \? <img src=\{logoUrl\}[^>]+ \/> : <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-4 text-2xl font-bold">\{shop\.name\}<\/h1>\}\s*<p className="text-purple-200\/70 text-\[13px\]">\{shop\.description\}<\/p>/,
  `{logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-4" /> : <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-4 text-2xl font-bold">{shop.name}</h1>}
                {shop.slogan && <p className="text-orange-300 font-medium tracking-wide mt-2 mb-4 text-sm">{shop.slogan}</p>}
                <p className="text-purple-200/70 text-[13px]">{shop.description}</p>`
);

// Editorial
content = content.replace(
  /<div className="text-xl font-headline text-stone-200">\{shop\.name\}<\/div>\s*<p className="text-stone-400 font-body leading-relaxed text-\[13px\]">\{shop\.description/,
  `<div className="text-xl font-headline text-stone-200 mb-2">{shop.name}</div>
                  {shop.slogan && <div className="text-[#d4af37] font-serif italic mb-4">{shop.slogan}</div>}
                  <p className="text-stone-400 font-body leading-relaxed text-[13px]">{shop.description`
);

// Minimal
content = content.replace(
  /\{logoUrl \? <img src=\{logoUrl\}[^>]+ \/> : <h1 className="font-light tracking-tight text-2xl font-bold"[^>]+>\{shop\.name\}<\/h1>\}\s*\{shop\.description && <p className="text-crm-muted mt-2 text-\[13px\]">\{shop\.description\}<\/p>\}/,
  `{logoUrl ? <img src={logoUrl} alt={shop.name} className="h-12 object-contain" /> : <h1 className="font-light tracking-tight text-2xl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>}
                {shop.slogan && <p className="text-gray-900 font-medium mt-2 text-[14px] tracking-wide">{shop.slogan}</p>}
                {shop.description && <p className="text-crm-muted mt-2 text-[13px]">{shop.description}</p>}`
);

// Classic
content = content.replace(
  /\{shop\.description && <p className="max-w-xl mx-auto text-\[\#5a4634\] text-\[13px\]">\{shop\.description\}<\/p>\}/,
  `{shop.slogan && <h2 className="text-[#8b7355] font-serif text-xl italic mb-6">{shop.slogan}</h2>}
              {shop.description && <p className="max-w-xl mx-auto text-[#5a4634] text-[13px]">{shop.description}</p>}`
);

// Modern
content = content.replace(
  /\{shop\.description && \(\s*<p className="text-crm-muted max-w-2xl mx-auto text-\[13px\] mb-8">\s*\{shop\.description\}\s*<\/p>\s*\)/,
  `{shop.slogan && (
                  <p className="text-white font-medium text-lg mb-4 opacity-90">{shop.slogan}</p>
                )}
                {shop.description && (
                  <p className="text-crm-muted max-w-2xl mx-auto text-[13px] mb-8">
                    {shop.description}
                  </p>
                )`
);

fs.writeFileSync(file, content);
console.log('Added slogan to all 8 templates');
