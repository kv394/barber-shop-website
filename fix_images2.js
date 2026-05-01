const fs = require('fs');

let code = fs.readFileSync('scripts/generate-sdk-templates.js', 'utf8');

// For modern template (Services)
code = code.replace(
  /<h3 class="text-2xl font-bold mb-3">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-48 object-cover rounded-2xl mb-6 shadow-sm">\\\` : ''}
          <h3 class="text-2xl font-bold mb-3">\\$\{s.name\}</h3>`
);

// For modern template (Products)
code = code.replace(
  /<h3 class="text-lg font-bold mb-2">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-40 object-cover rounded-xl mb-4 shadow-sm">\\\` : ''}
          <h3 class="text-lg font-bold mb-2">\\$\{p.name\}</h3>`
);

// For classic template (Services)
code = code.replace(
  /<h3 class="text-2xl font-bold mb-3 uppercase">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-64 object-cover mb-8 border-4 border-[#2c1e16] p-1">\\\` : ''}
          <h3 class="text-2xl font-bold mb-3 uppercase">\\$\{s.name\}</h3>`
);

// For classic template (Products)
code = code.replace(
  /<h3 class="text-xl font-bold mb-3 uppercase">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-48 object-cover mb-6 border-4 border-[#2c1e16] p-1">\\\` : ''}
          <h3 class="text-xl font-bold mb-3 uppercase">\\$\{p.name\}</h3>`
);

// For minimal template (Services)
code = code.replace(
  /<div class="flex-1 pr-8">\n\s*<h3 class="text-2xl font-medium mb-2">\\$\{s\.name\}<\/h3>/g,
  `<div class="w-24 h-24 shrink-0 mr-8">\n            \${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-full object-cover rounded-lg">\\\` : \\\`<div class="w-full h-full bg-gray-100 rounded-lg"></div>\\\`}\n          </div>\n          <div class="flex-1 pr-8">\n            <h3 class="text-2xl font-medium mb-2">\\$\{s.name\}</h3>`
);

// For minimal template (Products)
code = code.replace(
  /<div class="flex-1 pr-8">\n\s*<h3 class="text-xl font-medium">\\$\{p\.name\}<\/h3>/g,
  `<div class="w-16 h-16 shrink-0 mr-6">\n            \${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-full object-cover rounded-md">\\\` : \\\`<div class="w-full h-full bg-gray-100 rounded-md"></div>\\\`}\n          </div>\n          <div class="flex-1 pr-8">\n            <h3 class="text-xl font-medium">\\$\{p.name\}</h3>`
);

// For vibrant template (Services)
code = code.replace(
  /<h3 class="text-3xl font-black mb-4 tracking-tight">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-32 h-32 object-cover rounded-full mx-auto mb-6 shadow-xl border-4 border-white">\\\` : ''}
          <h3 class="text-3xl font-black mb-4 tracking-tight">\\$\{s.name\}</h3>`
);

// For vibrant template (Products)
code = code.replace(
  /<h3 class="text-lg font-bold mb-2 tracking-tight">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-48 object-cover rounded-2xl mb-4 shadow-md">\\\` : ''}
          <h3 class="text-lg font-bold mb-2 tracking-tight">\\$\{p.name\}</h3>`
);

// For noir template (Services)
code = code.replace(
  /<h3 class="text-2xl font-medium tracking-widest uppercase mb-6">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-64 object-cover mb-8 opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">\\\` : ''}
          <h3 class="text-2xl font-medium tracking-widest uppercase mb-6">\\$\{s.name\}</h3>`
);

// For noir template (Products)
code = code.replace(
  /<h3 class="text-lg tracking-widest uppercase mb-4 text-zinc-300">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-48 object-cover mb-6 opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">\\\` : ''}
          <h3 class="text-lg tracking-widest uppercase mb-4 text-zinc-300">\\$\{p.name\}</h3>`
);

// For sunset template (Services)
code = code.replace(
  /<h3 class="text-3xl font-bold mb-4 tracking-tight">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-56 object-cover rounded-2xl mb-6 shadow-lg">\\\` : ''}
          <h3 class="text-3xl font-bold mb-4 tracking-tight">\\$\{s.name\}</h3>`
);

// For sunset template (Products)
code = code.replace(
  /<h3 class="text-xl font-bold mb-3">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-48 object-cover rounded-xl mb-4 shadow-md">\\\` : ''}
          <h3 class="text-xl font-bold mb-3">\\$\{p.name\}</h3>`
);

// For corporate template (Services)
code = code.replace(
  /<h3 class="text-2xl font-bold mb-3 text-slate-900">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-56 object-cover rounded-lg mb-6 shadow-sm">\\\` : ''}
          <h3 class="text-2xl font-bold mb-3 text-slate-900">\\$\{s.name\}</h3>`
);

// For corporate template (Products)
code = code.replace(
  /<h3 class="text-lg font-bold mb-2 text-slate-900">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-48 object-cover rounded-lg mb-4 shadow-sm">\\\` : ''}
          <h3 class="text-lg font-bold mb-2 text-slate-900">\\$\{p.name\}</h3>`
);

// For sporty template (Services)
code = code.replace(
  /<h3 class="text-3xl font-black italic uppercase mb-4 leading-tight">\\$\{s\.name\}<\/h3>/g,
  `\${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-64 object-cover mb-6 border-4 border-black border-b-8 shadow-[4px_4px_0_0_#000]">\\\` : ''}
          <h3 class="text-3xl font-black italic uppercase mb-4 leading-tight">\\$\{s.name\}</h3>`
);

// For sporty template (Products)
code = code.replace(
  /<h3 class="text-xl font-black uppercase mb-2 leading-tight">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-48 object-cover mb-4 border-4 border-black">\\\` : ''}
          <h3 class="text-xl font-black uppercase mb-2 leading-tight">\\$\{p.name\}</h3>`
);

// For editorial template (Services)
code = code.replace(
  /<div class="flex-1 md:pr-16 mb-8 md:mb-0">\n\s*<h3 class="text-4xl font-bold tracking-tight mb-4 group-hover:italic transition-all uppercase">\\$\{s\.name\}<\/h3>/g,
  `<div class="w-full md:w-48 h-48 shrink-0 mb-6 md:mb-0 md:mr-12 grayscale group-hover:grayscale-0 transition-all duration-500">\n            \${s.imageUrl ? \\\`<img src="\${s.imageUrl}" alt="\${s.name}" class="w-full h-full object-cover">\\\` : \\\`<div class="w-full h-full bg-black/5 flex items-center justify-center italic text-xs tracking-widest uppercase">No Image</div>\\\`}\n          </div>\n          <div class="flex-1 md:pr-16 mb-8 md:mb-0">\n            <h3 class="text-4xl font-bold tracking-tight mb-4 group-hover:italic transition-all uppercase">\\$\{s.name\}</h3>`
);

// For editorial template (Products)
code = code.replace(
  /<h3 class="text-2xl font-bold tracking-tight mb-4 uppercase">\\$\{p\.name\}<\/h3>/g,
  `\${p.imageUrl ? \\\`<div class="aspect-w-3 aspect-h-4 mb-6 w-full"><img src="\${p.imageUrl}" alt="\${p.name}" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"></div>\\\` : ''}
          <h3 class="text-2xl font-bold tracking-tight mb-4 uppercase">\\$\{p.name\}</h3>`
);


fs.writeFileSync('scripts/generate-sdk-templates.js', code);
