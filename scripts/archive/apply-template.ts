import { prisma } from '../lib/prisma';

const htmlCode = `
<div class="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-[#faf9f6]/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-sm dark:shadow-none no-border tonal-shift-boundary">
<div class="flex justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
<div class="text-2xl font-bold font-notoSerif text-[#735c00] dark:text-[#f1ca50] tracking-tighter">L'Atelier de Beauté</div>
<!-- Desktop Navigation -->
<div class="hidden md:flex items-center gap-10">
<a class="text-stone-600 dark:text-stone-400 hover:text-[#735c00] transition-colors font-manrope text-sm tracking-wide uppercase" href="#services">Services</a>
<a class="text-stone-600 dark:text-stone-400 hover:text-[#735c00] transition-colors font-manrope text-sm tracking-wide uppercase" href="#gallery">Gallery</a>
<a class="text-stone-600 dark:text-stone-400 hover:text-[#735c00] transition-colors font-manrope text-sm tracking-wide uppercase" href="#reviews">Reviews</a>
<a class="text-stone-600 dark:text-stone-400 hover:text-[#735c00] transition-colors font-manrope text-sm tracking-wide uppercase" href="#about">About</a>
<a class="text-stone-600 dark:text-stone-400 hover:text-[#735c00] transition-colors font-manrope text-sm tracking-wide uppercase" href="#contact">Contact</a>
</div>
<div class="flex items-center gap-6">
<button class="bg-[#f2ca50] text-[#3c2f00] px-6 py-3 rounded-xl font-medium hover:opacity-80 transition-all duration-300 scale-95 duration-200 ease-in-out">
                    Book Appointment
                </button>
<button class="md:hidden text-[#f2ca50]">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</div>
</nav>
<main class="pt-24">
<!-- Hero Section -->
<section class="relative min-h-[921px] flex items-center px-8 md:px-16 overflow-hidden">
<div class="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
<div class="md:col-span-6 z-10">
<span class="font-label text-[#f2ca50] tracking-[0.2em] uppercase text-xs mb-6 block">Editorial Excellence</span>
<h1 class="text-5xl md:text-7xl font-headline text-[#e3e2e0] leading-[1.1] mb-8 tracking-tight" style="font-family: 'Noto Serif', serif;">
                        Your Sanctuary of <br/> <span class="italic text-[#f2ca50]">Sophisticated Care</span>
</h1>
<p class="text-lg text-[#d0c5af] font-body max-w-md mb-10 leading-relaxed">
                        Experience beauty as an art form. Our atelier provides a curated space for those who appreciate the finer details of self-ceremony.
                    </p>
<div class="flex items-center gap-4">
<button class="bg-gradient-to-br from-[#f2ca50] to-[#d4af37] text-[#3c2f00] px-8 py-4 rounded-lg shadow-[0_12px_32px_rgba(115,92,0,0.1)] hover:shadow-lg transition-all font-semibold">
                            Book Now
                        </button>
<button class="text-[#debfc2] font-semibold flex items-center gap-2 group px-4 py-4">
                            Explore Services
                            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</div>
<div class="md:col-span-6 relative h-[600px] md:h-[750px]">
<div class="absolute inset-0 bg-[#1a1c1a] rounded-3xl overflow-hidden -rotate-2 transform translate-x-4 translate-y-4"></div>
<img alt="Elegant Nail Art" class="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-xl transition-transform hover:scale-105 duration-700" data-alt="Close-up of minimalist elegant nail art on a model with neutral background and soft warm editorial lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPRu8QRu8seSz1ZA0n6LiPGRgqS7aZEcjxutc8fOcO1ZIkoJH2Umtws1TFTbdJwWCpmXEE_T0bVF00Q1EwlHR5KpYdbkMHCu2nUg2NAe5C2pfVotvKBcYkKM63pa2s4XXMCSh4EVxf389QPikRuNYPp_EHSwR5QQSbPcaysTObNr3wOBttSWwh41x9HEbYtenN4fQFtQfUC-criMC9c8Li4jj4D1-zB8_8LZYeg0ReRDBSudtfcTLc4qJDHasnl5yxlX6EAv0YYbw"/>
<div class="absolute bottom-12 -left-12 bg-[#0d0f0d] p-6 rounded-2xl shadow-lg hidden lg:block">
<p class="font-headline italic text-[#f2ca50] text-xl" style="font-family: 'Noto Serif', serif;">"The standard of beauty refined."</p>
</div>
</div>
</div>
</section>
<!-- Services Section -->
<section id="services" class="py-32 px-8 bg-[#1a1c1a]">
<div class="max-w-7xl mx-auto">
<div class="text-center mb-20">
<h2 class="text-4xl md:text-5xl font-headline mb-4" style="font-family: 'Noto Serif', serif;">Our Services</h2>
<div class="w-24 h-px bg-[#f2ca50] mx-auto mb-6"></div>
<p class="font-body text-[#d0c5af] max-w-xl mx-auto">A curated selection of rituals designed to restore your glow and refine your natural elegance.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
{{#each shop.services}}
<div class="group bg-[#0d0f0d] p-10 rounded-2xl transition-all hover:translate-y-[-8px]">
<div class="w-16 h-16 bg-[#574144] rounded-full flex items-center justify-center mb-8 text-[#cbaeb1]">
<span class="material-symbols-outlined text-3xl" data-weight="fill">spa</span>
</div>
<h3 class="text-2xl font-headline mb-4 text-[#e3e2e0]" style="font-family: 'Noto Serif', serif;">{{name}}</h3>
<p class="text-[#d0c5af] mb-8 leading-relaxed">{{description}}</p>
<a class="text-[#f2ca50] font-semibold flex items-center gap-2 group/link" href="#">
                            Book for $\{{price}}
                            <span class="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">east</span>
</a>
</div>
{{/each}}
</div>
</div>
</section>
<!-- Gallery Section -->
<section id="gallery" class="py-32 px-8 bg-[#121412]">
<div class="max-w-7xl mx-auto">
<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
<div>
<span class="font-label text-[#f2ca50] tracking-widest uppercase text-xs mb-2 block">Our Work</span>
<h2 class="text-4xl font-headline text-[#e3e2e0]" style="font-family: 'Noto Serif', serif;">The Gallery</h2>
</div>
<button class="text-[#d0c5af] hover:text-[#f2ca50] transition-colors flex items-center gap-2 border-b border-[#4d4635] pb-1">
                        View All Creations
                    </button>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px]">
<div class="col-span-2 row-span-2 rounded-2xl overflow-hidden relative group">
<img alt="Spa Rituals" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Top view of luxury spa products arranged on stone tray with soft linen and eucalyptus leaf" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwSozMBHwl8bHQlElWMvoOMnVDP5yDaZ_PK77b245sloiZdJcW0U1blou5TuyYzO55Bgu-Jwe-6KJMPDUh9-Ykm91lx2AsAf01I0silTMpi1984WTttXlxHpWtz6MerUn5OT9z7Kb_LQwdpoJSy6N7x1ar6g1eWa_RmtdNfSoNy4EL51JFViAbUYH1wM9iU4Tcm5mx-0hIGMzx5GFZtnghvse_gGrtIwlW2iKzRfu0raaXjx9X8Hslr8TkxQqVY1MSQNeLPV1GUzg"/>
<div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
<p class="text-white font-headline text-xl" style="font-family: 'Noto Serif', serif;">The Ritual Collection</p>
</div>
</div>
<div class="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group">
<img alt="Gold Leaf Detail" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Close-up of intricate gold leaf nail art design on soft pink base with designer rings" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxaHOhHjLo5EYoIJfRc9lAXM44-heAnQQatjRONvKBiogsIgBQymijLd4sMR9Dz-NTADWWdq9zT5zF6VY_ejuArqq_n4jFFVTm5bo_t2a3DlwjkC0kG9GG9wSC_P42HnSxY3ueK7saQBNuKc3dERyEyOcG28R7CF8meIrOCvb22zONhyMLFJa5PO_i6SQYbJlYnrXQao5K_MW0feYnu811fmsr85XUcqVlq_RHFfM3SXQMGJfuBrlyte33fE98F-wevp75VVjWumM"/>
</div>
<div class="col-span-1 row-span-2 rounded-2xl overflow-hidden relative group">
<img alt="Atmosphere" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Calm spa interior with warm lighting, wooden textures, and a stone massage setup" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWENY22K-hYyn9EPMP55xJ8cgezkMNfQEtN624h_GkJNj_2mLzfBM7Op4ELoy_IrGngxzGiswieu34LsITYRCfD1WAuu26IOH2D8cYoyM0ErzeSDvz-KDvyMpjWiyG8qrMSvzm35fA2utOw2r7UAmLAT0SDRQ7TGdDKKohl_ZQTXAShqVufYJqe0Q9CSYE2_fVrX6plM2pipcN4NtDckDi4aqb00D4cR0kJwdHKGGqZSz3L9XRRmzdoobqtjHGiTQAhBPBhc0HDNs"/>
</div>
<div class="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group">
<img alt="Emerald Art" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Artistic manicure with deep emerald and gold accents on elegant hand" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTBMFK1nMTJjrslNddeybgkJGgiQKrAdgtiOF8WaCH33-kXHsBW3y30dWHACdd9DT2IrZNoqXXIbJG7aUpKr_fujefCsk1Ouks7AM9BHsjFoyFN_s6WRuSfyrZqKvFSKWwK-YVOU-JHOhyBpdGw9QBLQvv7y8PwZ7XAZ8fU1XgkuS5SgRSJDETJuRhU3yVvtVVKa6aL-PGoozjGNdy-klKPeriQQdTtdv_8W7wZpc7YGFPzO9LRZ8FF5ln9wl8EuzF7gllUriShac"/>
</div>
</div>
</div>
</section>
<!-- Visit Us Section -->
<section id="contact" class="py-32 px-8 bg-[#121412]">
<div class="max-w-7xl mx-auto">
<div class="grid grid-cols-1 md:grid-cols-2 gap-16">
<div>
<h2 class="text-4xl font-headline mb-12 text-[#e3e2e0]" style="font-family: 'Noto Serif', serif;">Visit the Atelier</h2>
<div class="space-y-12">
<div class="flex gap-6">
<span class="material-symbols-outlined text-[#f2ca50]">location_on</span>
<div>
<h4 class="font-bold text-lg mb-2 text-[#e3e2e0]">Our Location</h4>
<p class="text-[#d0c5af]">{{shop.customization.address}}</p>
</div>
</div>
<div class="flex gap-6">
<span class="material-symbols-outlined text-[#f2ca50]">schedule</span>
<div>
<h4 class="font-bold text-lg mb-2 text-[#e3e2e0]">Operating Hours</h4>
<div class="grid grid-cols-2 gap-x-8 text-[#d0c5af]">
<span>Monday – Friday</span>
<span>09:00 – 20:00</span>
<span>Saturday</span>
<span>10:00 – 18:00</span>
<span>Sunday</span>
<span>Closed</span>
</div>
</div>
</div>
<div class="flex gap-6">
<span class="material-symbols-outlined text-[#f2ca50]">call</span>
<div>
<h4 class="font-bold text-lg mb-2 text-[#e3e2e0]">Contact Details</h4>
<p class="text-[#d0c5af]">{{shop.customization.phone}}</p>
</div>
</div>
</div>
</div>
<div class="h-[500px] bg-[#1a1c1a] rounded-3xl overflow-hidden relative">
<div class="absolute inset-0 grayscale contrast-125 opacity-40">
<img alt="Map View" class="w-full h-full object-cover" data-alt="Minimalist architectural city map showing street grid with subtle gold marker" data-location="Paris" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPBUELt3H48sCkgUERZL-bYjLp_g4nyaMrAaWgWqv1QMVuCaaZub4OKguOms2xp_UClFnqWJd5F1jE8c8_9V8GbtLNhZwardBznAcbPP6O5ofImMcqWosMtI8MOhCDK6ERy1aepwuU8Jjoomg4v3oHOH1T-k1vmTJMASUVHIRN_wlzdQm3IGpjqWBgBHRYOEeLiJKp7GgD_lnnDst0M8NdV_0egB1TFqQmXLS5pgBlZELH0ExIL_x5_OEryY1I7lK2NPfP3cKIUjs"/>
</div>
<div class="absolute inset-0 flex items-center justify-center">
<div class="bg-[#121412] p-8 rounded-2xl shadow-xl border border-[#f2ca50]/10 text-center max-w-xs">
<div class="w-12 h-12 bg-[#f2ca50] rounded-full mx-auto mb-4 flex items-center justify-center">
<span class="material-symbols-outlined text-[#3c2f00]">pin_drop</span>
</div>
<p class="font-headline text-lg text-[#e3e2e0]" style="font-family: 'Noto Serif', serif;">Paris Atelier</p>
<p class="text-sm text-[#d0c5af] mb-4">Located in the heart of the Golden Triangle.</p>
<button class="text-[#f2ca50] font-bold text-sm tracking-widest uppercase">Get Directions</button>
</div>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full rounded-t-3xl mt-20 bg-[#1a1c1a] tonal-shift from surface to surface-container-low flat no shadows">
<div class="grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-16 max-w-7xl mx-auto">
<div class="space-y-6">
<div class="text-xl font-notoSerif text-[#e3e2e0]" style="font-family: 'Noto Serif', serif;">L'Atelier de Beauté</div>
<p class="text-[#d0c5af] font-manrope text-sm leading-relaxed">
                    A destination for curated beauty and refined wellness, dedicated to the art of the self-care ritual.
                </p>
</div>
<div class="grid grid-cols-2 gap-4">
<div class="space-y-4">
<a class="block text-[#d0c5af] hover:text-[#f2ca50] transition-colors font-manrope text-sm tracking-wide uppercase" href="#">Privacy Policy</a>
<a class="block text-[#d0c5af] hover:text-[#f2ca50] transition-colors font-manrope text-sm tracking-wide uppercase" href="#">Terms of Service</a>
<a class="block text-[#d0c5af] hover:text-[#f2ca50] transition-colors font-manrope text-sm tracking-wide uppercase" href="#">Careers</a>
</div>
<div class="space-y-4">
<a class="block text-[#d0c5af] hover:text-[#f2ca50] transition-colors font-manrope text-sm tracking-wide uppercase" href="#">Sustainability</a>
<a class="block text-[#d0c5af] hover:text-[#f2ca50] transition-colors font-manrope text-sm tracking-wide uppercase" href="#">Contact Us</a>
</div>
</div>
<div class="flex flex-col items-start md:items-end space-y-6">
<div class="flex gap-6">
<a class="text-[#f2ca50] hover:opacity-70 transition-all" href="#"><span class="material-symbols-outlined">public</span></a>
<a class="text-[#f2ca50] hover:opacity-70 transition-all" href="#"><span class="material-symbols-outlined">photo_camera</span></a>
<a class="text-[#f2ca50] hover:opacity-70 transition-all" href="#"><span class="material-symbols-outlined">brand_awareness</span></a>
</div>
<p class="text-[#d0c5af] font-manrope text-sm tracking-wide uppercase text-right">
                    © 2026 L'Atelier de Beauté. Editorial Excellence in Care.
                </p>
</div>
</div>
</footer>
</div>
`;

const cssCode = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
.material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
}
.tonal-shift-boundary {
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
}
`;

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.error('No shop found to apply template to.');
    return;
  }

  let template = await prisma.dynamicTemplate.findUnique({ where: { name: 'editorial-atelier' } });
  if (!template) {
    template = await prisma.dynamicTemplate.create({
      data: {
        name: 'editorial-atelier',
        description: "L'Atelier de Beauté Editorial Excellence Template",
        htmlCode,
        cssCode,
      }
    });
    console.log('Created dynamic template:', template.name);
  } else {
    template = await prisma.dynamicTemplate.update({
      where: { name: 'editorial-atelier' },
      data: { htmlCode, cssCode }
    });
    console.log('Updated dynamic template:', template.name);
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: { template: 'editorial-atelier' }
  });
  console.log(`Successfully updated shop ${shop.name} to use the editorial-atelier template!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
