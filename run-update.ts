import { prisma } from './lib/prisma';

const htmlCode = `
<div class="bg-surface text-on-surface selection:bg-primary/30">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md shadow-2xl shadow-black/40 flex justify-between items-center px-8 py-4 max-w-full">
<div class="font-['Noto_Serif'] text-2xl font-bold text-[#c5a059]">{{shop.name}}</div>
<div class="hidden md:flex items-center gap-8 font-['Noto_Serif'] tracking-wide uppercase text-sm">
<a class="text-[#e9c176] border-b-2 border-[#e9c176] pb-1" href="#home">Home</a>
<a class="text-[#d1c5b4] hover:text-[#e9c176] transition-all duration-300" href="#services">Services</a>
<a class="text-[#d1c5b4] hover:text-[#e9c176] transition-all duration-300" href="#barbers">Barbers</a>
<a class="text-[#d1c5b4] hover:text-[#e9c176] transition-all duration-300" href="#booking">Booking</a>
</div>
<button class="gold-gradient text-on-primary font-label font-bold px-6 py-2 rounded-md transition-transform active:scale-95 shadow-lg">
        Book Now
    </button>
</nav>

<!-- Hero Section -->
<section class="relative h-screen flex items-center justify-center overflow-hidden" id="home">
<div class="absolute inset-0 z-0">
<img class="w-full h-full object-cover" data-alt="Moody atmospheric barber shop interior with leather chairs, dark wood walls, and warm spotlighting on professional grooming equipment" src="/templates/heritage/hero.jpg"/>
<div class="absolute inset-0 hero-gradient"></div>
</div>
<div class="relative z-10 text-center px-4 max-w-4xl">
<h1 class="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-on-surface mb-6 tracking-tight leading-tight">
            The Art of <span class="text-primary italic">Precision</span> Grooming
        </h1>
<p class="font-body text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            {{shop.description}}
        </p>
<div class="flex flex-col sm:flex-row gap-4 justify-center">
<a class="gold-gradient text-on-primary font-bold px-8 py-4 rounded-md text-lg transition-transform hover:-translate-y-1" href="#services">View Our Services</a>
<a class="bg-surface-container-highest text-on-surface font-bold px-8 py-4 rounded-md text-lg border border-outline-variant/15 transition-transform hover:-translate-y-1" href="#barbers">Meet The Team</a>
</div>
</div>
</section>

<!-- Services Section -->
<section class="py-24 px-8 bg-surface" id="services">
<div class="max-w-7xl mx-auto">
<div class="mb-16">
<span class="text-primary font-label uppercase tracking-widest text-sm mb-4 block">The Apothecary Menu</span>
<h2 class="font-serif text-4xl md:text-5xl font-bold text-on-surface">Curated Services</h2>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/10 rounded-xl overflow-hidden">
{{#each shop.services}}
<div class="bg-surface-container-low p-10 group hover:bg-surface-container-high transition-colors">
<div class="flex justify-between items-start mb-4">
<h3 class="font-serif text-2xl text-on-surface group-hover:text-primary transition-colors">{{name}}</h3>
<span class="font-serif text-xl text-primary">$\{{price}}+</span>
</div>
<p class="text-on-surface-variant leading-relaxed">{{description}}</p>
</div>
{{/each}}
</div>

<!-- Asymmetric Editorial Feature -->
<div class="mt-24 grid md:grid-cols-12 gap-8 items-center">
<div class="md:col-span-7 rounded-xl overflow-hidden h-[400px]">
<img class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" data-alt="Macro detail of a vintage straight razor" src="/templates/heritage/detail.jpg" />
</div>
<div class="md:col-span-5 p-4 md:pl-12">
<h3 class="font-serif text-3xl font-bold mb-6 italic">The Ritual</h3>
<p class="text-on-surface-variant text-lg leading-relaxed mb-8">
                    Every visit is more than just a cut; it is a dedicated time for the self. We use only the finest apothecary products, selected for their efficacy and timeless scents.
                </p>
<div class="flex items-center gap-4 text-primary">
<span class="material-symbols-outlined">brush</span>
<span class="font-label uppercase tracking-widest text-xs">Traditional Methods / Modern Precision</span>
</div>
</div>
</div>
</div>
</section>

<!-- Barbers Section -->
<section class="py-24 px-8 bg-surface-container-lowest" id="barbers">
<div class="max-w-7xl mx-auto">
<div class="text-center mb-20">
<span class="text-primary font-label uppercase tracking-widest text-sm mb-4 block">Masters of the Craft</span>
<h2 class="font-serif text-4xl md:text-5xl font-bold text-on-surface">Meet Our Barbers</h2>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
<!-- Barber Card: Elena -->
<div class="group">
<div class="aspect-[3/4] rounded-xl overflow-hidden mb-6 bg-surface-container-high shadow-lg">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Portrait of Elena" src="/templates/heritage/elena.jpg" />
</div>
<h4 class="font-serif text-xl font-bold text-on-surface">Elena</h4>
<p class="text-primary font-label text-sm uppercase tracking-wider mb-2">Master Stylist</p>
<p class="text-on-surface-variant text-sm italic">Specialist in modern fades and textured finishes.</p>
</div>
<!-- Barber Card: Jasmine -->
<div class="group">
<div class="aspect-[3/4] rounded-xl overflow-hidden mb-6 bg-surface-container-high shadow-lg">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Portrait of Jasmine" src="/templates/heritage/jasmine.jpg" />
</div>
<h4 class="font-serif text-xl font-bold text-on-surface">Jasmine</h4>
<p class="text-primary font-label text-sm uppercase tracking-wider mb-2">Artisan Barber</p>
<p class="text-on-surface-variant text-sm italic">Expert in classic straight-razor shaves and beard sculpting.</p>
</div>
<!-- Barber Card: Marcus -->
<div class="group">
<div class="aspect-[3/4] rounded-xl overflow-hidden mb-6 bg-surface-container-high shadow-lg">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Portrait of Marcus" src="/templates/heritage/marcus.jpg" />
</div>
<h4 class="font-serif text-xl font-bold text-on-surface">Marcus</h4>
<p class="text-primary font-label text-sm uppercase tracking-wider mb-2">Senior Barber</p>
<p class="text-on-surface-variant text-sm italic">The authority on traditional heritage cuts and styling.</p>
</div>
<!-- Barber Card: Nape -->
<div class="group">
<div class="aspect-[3/4] rounded-xl overflow-hidden mb-6 bg-surface-container-high shadow-lg">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="Portrait of Nape" src="/templates/heritage/nape.jpg" />
</div>
<h4 class="font-serif text-xl font-bold text-on-surface">Nape</h4>
<p class="text-primary font-label text-sm uppercase tracking-wider mb-2">Technical Lead</p>
<p class="text-on-surface-variant text-sm italic">Master of precision line-ups and avant-garde designs.</p>
</div>
</div>
</div>
</section>

<!-- Transformation CTA Section -->
<section class="py-32 px-8 bg-surface-container-low relative overflow-hidden">
<div class="absolute -right-20 -top-20 opacity-5">
<span class="material-symbols-outlined text-[400px]" style="font-variation-settings: 'wght' 100;">content_cut</span>
</div>
<div class="max-w-4xl mx-auto text-center relative z-10">
<h2 class="font-serif text-5xl md:text-6xl font-bold text-on-surface mb-8 leading-tight">
            Ready for a <span class="italic text-primary">Transformation</span>?
        </h2>
<p class="text-on-surface-variant text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the pinnacle of grooming. Secure your chair today and step into the legacy of {{shop.name}}.
        </p>
<div class="inline-flex flex-col sm:flex-row gap-6">
<button class="gold-gradient text-on-primary font-bold px-12 py-5 rounded-md text-xl shadow-2xl transition-all hover:scale-105 active:scale-95">
                Book Your Appointment
            </button>
</div>
<div class="mt-16 flex flex-wrap justify-center gap-12 grayscale opacity-40">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined">stars</span>
<span class="font-label text-xs uppercase tracking-widest">5.0 Star Rated</span>
</div>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined">verified</span>
<span class="font-label text-xs uppercase tracking-widest">Master Certified</span>
</div>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined">history</span>
<span class="font-label text-xs uppercase tracking-widest">Since 1924</span>
</div>
</div>
</div>
</section>

<!-- Footer -->
<footer class="bg-[#0e0e0e] w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-[#4e4639]/15">
<div class="font-['Noto_Serif'] italic text-[#c5a059] text-xl">{{shop.name}}.</div>
<div class="flex flex-wrap justify-center gap-8 font-['Manrope'] text-xs uppercase tracking-widest text-[#d1c5b4]">
<a class="hover:text-[#c5a059] transition-colors" href="#">Instagram</a>
<a class="hover:text-[#c5a059] transition-colors" href="#">Facebook</a>
<a class="hover:text-[#c5a059] transition-colors" href="#">Twitter</a>
<a class="hover:text-[#c5a059] transition-colors" href="#">Contact Us</a>
</div>
<div class="font-['Manrope'] text-xs uppercase tracking-widest text-[#353534]">
        © 2024 {{shop.name}}. The Modern Apothecary.
    </div>
</footer>
<script src="/booking-widget.js" data-shop-id="{{shop.id}}" data-position="bottom-right" data-color="#c5a059"></script>
</div>
`;

const cssCode = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* Tailwind config mapping for classes */
.bg-surface { background-color: #131313; }
.text-on-surface { color: #e5e2e1; }
.selection\\:bg-primary\\/30 *::selection { background-color: rgba(233, 193, 118, 0.3); }

.font-serif { font-family: 'Noto Serif', serif; }
.font-body { font-family: 'Manrope', sans-serif; }
.font-label { font-family: 'Manrope', sans-serif; }

.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.hero-gradient { background: linear-gradient(to bottom, rgba(19, 19, 19, 0.4), rgba(19, 19, 19, 1)); }
.gold-gradient { background: linear-gradient(135deg, #e9c176 0%, #c5a059 100%); }

.text-primary { color: #e9c176; }
.bg-surface-container-highest { background-color: #353534; }
.bg-surface-container-lowest { background-color: #0e0e0e; }
.bg-surface-container-low { background-color: #1c1b1b; }
.text-on-surface-variant { color: #d1c5b4; }
.text-on-primary { color: #412d00; }
.border-outline-variant\\/15 { border-color: rgba(78, 70, 57, 0.15); }
.bg-outline-variant\\/10 { background-color: rgba(78, 70, 57, 0.1); }

/* Missing arbitrary Tailwind classes */
.aspect-\\[3\\/4\\] { aspect-ratio: 3 / 4; }
.h-\\[400px\\] { height: 400px; }
.h-\\[600px\\] { height: 600px; }
@media (min-width: 768px) {
  .md\\:h-\\[750px\\] { height: 750px; }
}
.text-\\[400px\\] { font-size: 400px; }
.bg-\\[\\#131313\\]\\/80 { background-color: rgb(19 19 19 / 0.8); }
.text-\\[\\#c5a059\\] { color: #c5a059; }
.text-\\[\\#e9c176\\] { color: #e9c176; }
.border-\\[\\#e9c176\\] { border-color: #e9c176; }
.text-\\[\\#d1c5b4\\] { color: #d1c5b4; }
.bg-\\[\\#1a1c1a\\] { background-color: #1a1c1a; }
.bg-\\[\\#0e0e0e\\] { background-color: #0e0e0e; }
.border-\\[\\#4e4639\\]\\/15 { border-color: rgb(78 70 57 / 0.15); }
.text-\\[\\#353534\\] { color: #353534; }
.font-\\[\\'Noto_Serif\\'\\] { font-family: 'Noto Serif', serif; }
.font-\\[\\'Manrope\\'\\] { font-family: 'Manrope', sans-serif; }
`;

async function main() {
  try {
    const shop = await prisma.shop.findFirst({
      where: {
        name: {
          contains: "Heritage Haircuts"
        }
      }
    });

    let template = await prisma.dynamicTemplate.findUnique({ where: { name: 'heritage-haircuts-template' } });
    if (!template) {
      template = await prisma.dynamicTemplate.create({
        data: {
          name: 'heritage-haircuts-template',
          description: "Heritage Haircuts Modern Apothecary Template",
          htmlCode,
          cssCode,
        }
      });
      console.log('Created template.');
    } else {
      template = await prisma.dynamicTemplate.update({
        where: { name: 'heritage-haircuts-template' },
        data: { htmlCode, cssCode }
      });
      console.log('Updated template.');
    }

    if (shop) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { template: 'heritage-haircuts-template' }
      });
      console.log(`Successfully updated shop ${shop.name} to use the template!`);
    } else {
      console.log('Shop not found.');
    }
  } catch (error: any) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
