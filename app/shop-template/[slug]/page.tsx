import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import Script from 'next/script';
import AIWidget from '@/components/booking/AIWidget';
import DOMPurify from 'isomorphic-dompurify';
import { serialize } from '@/lib/serialize';

function sanitizeCss(css: string): string {
 return css
 .replace(/expression\s*\(/gi, '')
 .replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(')
 .replace(/behavior\s*:/gi, '')
 .replace(/@import\b/gi, '');
}

export const revalidate = 60;

async function getShopBySlug(slug: string) {
 // First, try to find by ID (for backward compatibility)
 let shop: any = await prisma.shop.findUnique({
 where: { id: slug },
 include: {
 services: {
 orderBy: { createdAt: 'desc' },
 },
 },
 });

 if (!shop) {
 // If not found by ID, search by name (converted to slug format)
 const allShops = await prisma.shop.findMany({
 include: {
 services: {
 orderBy: { createdAt: 'desc' },
 },
 },
 });

 shop = allShops.find(
 (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
 ) || null;
 }

 if (!shop) {
 return null;
 }

 // Serialize to plain objects and ensure customization is included
 const serialized = serialize(shop);
 const rawCustom = serialized.customization || {};
 
 const rawAddress = rawCustom.address;
 const formattedAddress = typeof rawAddress === 'object' && rawAddress !== null
 ? [rawAddress.street, rawAddress.suite, rawAddress.city, rawAddress.state, rawAddress.zip, rawAddress.country].filter(Boolean).join(', ')
 : rawAddress;

 return {
 ...serialized,
 customization: {
 ...rawCustom,
 address: formattedAddress,
 },
 template: serialized.template || 'modern',
 };
}

export async function generateMetadata({
 params,
}: {
 params: Promise<{ slug: string }>;
}): Promise<Metadata> {
 const { slug } = await params;
 const shop = await getShopBySlug(slug);

 if (!shop) {
 return {
 title: 'Shop Not Found',
 description: 'The shop you are looking for does not exist.',
 };
 }

 const c = shop.customization || {};
 const seo = (c as any).seo || {};
 const seoTitle = seo.title || `${shop.name} — Services & Booking`;
 const seoDescription = seo.description || shop.description || `Book services at ${shop.name}. View services, meet the team, and book online.`;
 const ogImage = seo.ogImageUrl || (c as any).heroImageUrl || (c as any).logoUrl || null;

 return {
 title: seoTitle,
 description: seoDescription,
 openGraph: {
 title: seoTitle,
 description: seoDescription,
 type: 'website',
 siteName: shop.name,
 ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: shop.name }] } : {}),
 },
 twitter: {
 card: ogImage ? 'summary_large_image' : 'summary',
 title: seoTitle,
 description: seoDescription,
 ...(ogImage ? { images: [ogImage] } : {}),
 },
 robots: { index: true, follow: true },
 };
}

export default async function PublicShopPage({
 params,
}: {
 params: Promise<{ slug: string }>;
}) {
 const { slug } = await params;
 const shop = await getShopBySlug(slug);

 if (!shop) {
 return (
 <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
 <div className="text-crm-mutedrm-textenter">
 <h1 className="font-bold text-crm-mutedrm-textrm-text mb-4 text-crm-mutedrm-textxl font-bold">Shop Not Found</h1>
 <p className="text-crm-mutedrm-textrm-muted text-[13px]">We couldn't find the shop you're looking for.</p>
 </div>
 </div>
 );
 }

 // Use the custom colors if they exist, otherwise fallback to defaults
 const primaryColor = shop.customization?.primaryColor || '#3b82f6'; // Default blue-500
 const secondaryColor = shop.customization?.secondaryColor || '#06b6d4'; // Default cyan-500
 const templateType = shop.template || 'modern';

 
 const c = shop.customization || {};
 const headingFont = c.headingFont || c.fontFamily || 'Inter';
 const bodyFont = c.bodyFont || c.fontFamily || 'Inter';
 const buttonShape = c.buttonShape || 'rounded';
 const buttonVariant = c.buttonVariant || 'solid';
 const colorTheme = c.colorTheme || 'light';
 const headerStyle = c.headerStyle || 'classic';
 const heroLayout = c.heroLayout || 'full';
 const heroOverlayOpacity = c.heroOverlayOpacity !== undefined ? c.heroOverlayOpacity : 0;
 const heroOverlayColor = c.heroOverlayColor || '#000000';
 const enableScrollAnimations = c.enableScrollAnimations || false;
 const faviconUrl = c.faviconUrl || null;
 const customCss = c.customCss || '';
 const sectionOrder = c.sectionOrder || ['hero', 'services', 'team', 'gallery', 'reviews', 'contact'];

 const isDark = colorTheme === 'dark';
 const themeBg = isDark ? '#121212' : '#ffffff';
 const themeText = isDark ? '#ffffff' : '#111827';
 const themeMuted = isDark ? '#a1a1aa' : '#6b7280';
 const themeBorder = isDark ? '#27272a' : '#e5e7eb';
 
 


 // Define different layouts based on the selected template
 
  if (templateType === 'custom') {
  let htmlToRender = c.customHtml || '<div style="padding: 100px; text-align: center;">No custom HTML provided yet.</div>';
  
  // ── Server-side SEO injection ──
  const seo = c.seo || {};
  const seoTitle = seo.title || shop.name || 'Shop';
  const seoDescription = seo.description || shop.description || `Book services at ${shop.name}`;
  const ogImage = seo.ogImageUrl || c.heroImageUrl || c.logoUrl || '';
  const shopUrl = `https://barber-shop-website-ashy.vercel.app/shop-template/${slug}`;
  const contact = c.contact || {};
  const address = c.address || '';
  
  // Build meta tags to inject
  const metaTags = [
  `<meta name="description" content="${seoDescription.replace(/"/g, '&quot;')}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:title" content="${seoTitle.replace(/"/g, '&quot;')}" />`,
  `<meta property="og:description" content="${seoDescription.replace(/"/g, '&quot;')}" />`,
  `<meta property="og:site_name" content="${(shop.name || '').replace(/"/g, '&quot;')}" />`,
  `<meta property="og:url" content="${shopUrl}" />`,
  ogImage ? `<meta property="og:image" content="${ogImage}" />` : '',
  `<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />`,
  `<meta name="twitter:title" content="${seoTitle.replace(/"/g, '&quot;')}" />`,
  `<meta name="twitter:description" content="${seoDescription.replace(/"/g, '&quot;')}" />`,
  ogImage ? `<meta name="twitter:image" content="${ogImage}" />` : '',
  `<link rel="canonical" href="${shopUrl}" />`,
  ].filter(Boolean).join('\n  ');
  
  // JSON-LD structured data for LocalBusiness
  const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: shop.name || seoTitle,
  description: seoDescription,
  ...(ogImage ? { image: ogImage } : {}),
  url: shopUrl,
  ...(c.phone ? { telephone: c.phone } : {}),
  ...(c.email ? { email: c.email } : {}),
  ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address } } : {}),
  };
  
  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

  // Inject __KUTZ_THEME__ with server-side data
  const themeScript = `<script>window.__KUTZ_THEME__ = ${JSON.stringify({
  shopName: shop.name,
  primaryColor: c.primaryColor,
  secondaryColor: c.secondaryColor,
  logoUrl: c.logoUrl,
  heroImageUrl: c.heroImageUrl,
  })};</script>`;
  
  // Replace <title> with SEO title
  htmlToRender = htmlToRender.replace(
  /<title>[^<]*<\/title>/i,
  `<title>${seoTitle}</title>`
  );
  
  // Inject <base> tag so relative URLs work inside srcDoc iframe
  // Without this, URLs like "/sign-in" resolve to "about:///sign-in" (broken)
  const baseUrl = 'https://barber-shop-website-ashy.vercel.app';
  const baseTag = `<base href="${baseUrl}" target="_top" />`;
  if (htmlToRender.includes('<head>')) {
  htmlToRender = htmlToRender.replace('<head>', `<head>\n  ${baseTag}`);
  }
  
  // Inject meta tags + JSON-LD + theme into <head>
  if (htmlToRender.includes('</head>')) {
  htmlToRender = htmlToRender.replace(
  '</head>',
  `  ${metaTags}\n  ${jsonLdScript}\n  ${themeScript}\n</head>`
  );
  }
  
  return (
  <div style={{ width: '100vw', height: '100dvh' }}>
  <iframe 
  srcDoc={htmlToRender} 
  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
  title={seoTitle}
  />
  </div>
  );
  }

 if (!['minimal', 'classic', 'modern', 'editorial'].includes(templateType)) {
 const dynamicTemplate = await prisma.dynamicTemplate.findUnique({
 where: { name: templateType }
 });

 if (dynamicTemplate) {
 // We dynamically import handlebars so it doesn't break anything else
 const Handlebars = (await import('handlebars')).default;
 
 const template = Handlebars.compile(dynamicTemplate.htmlCode);
 const html = template({
 shop,
 primaryColor,
 secondaryColor
 });

 return (
 <main>
 {dynamicTemplate.cssCode && (
 <style dangerouslySetInnerHTML={{ __html: sanitizeCss(dynamicTemplate.cssCode) }} />
 )}
 <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
 <Script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" strategy="afterInteractive" />
 <AIWidget shopId={shop.id} />
 </main>
 );
 }
 }

 if (templateType === 'editorial') {
 const editorial = shop.customization?.editorialCustomization || {};
 
 return (
  <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#121412] text-crm-text selection:bg-[#d4af37] selection:text-[#554300] ">
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-text, .text-gray-900, .text-black, .text-crm-text, .text-crm-text, .text-crm-text, .text-crm-text { color: ${themeText} !important; }
   .text-crm-muted, .text-gray-500, .text-gray-600, .text-crm-muted, .text-crm-muted, .text-crm-muted, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-mutedrm-textrm-text, .text-gray-900, .text-crm-mutedlack { color: ${themeText} !important; }
   .text-crm-mutedrm-textrm-muted, .text-gray-500, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap');
   @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
   .font-headline { font-family: 'Noto Serif', serif; }
   .font-body { font-family: 'Manrope', sans-serif; }
   .font-label { font-family: 'Manrope', sans-serif; }
   `}} />
   {/* TopNavBar */}
   <nav className="fixed top-0 w-full z-50 bg-[#121412]/80 backdrop-blur-xl shadow-none no-border">
   <div className="flex justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
   <div className="text-crm-mutedrm-textxl font-bold font-headline tracking-tighter" style={{ color: primaryColor }}>
   {shop.name}
   </div>
   {/* Desktop Navigation */}
   <div className="hidden md:flex items-center gap-10">
   <a className="text-stone-400 hover:text-white transition-colors font-body text-[13px] tracking-wide uppercase" href="#services">Services</a>
   <a className="text-stone-400 hover:text-white transition-colors font-body text-[13px] tracking-wide uppercase" href="#gallery">Gallery</a>
   <a className="text-stone-400 hover:text-white transition-colors font-body text-[13px] tracking-wide uppercase" href="#about">About</a>
   <a className="text-stone-400 hover:text-white transition-colors font-body text-[13px] tracking-wide uppercase" href="#contact">Contact</a>
   </div>
   <div className="flex items-center gap-6">
   <button 
   className="px-6 py-3 rounded-xl font-medium hover:opacity-80 transition-all duration-300 text-crm-text"
   style={{ backgroundColor: primaryColor }}
   >
   Book Appointment
   </button>
   </div>
   </div>
   </nav>
   <div className="pt-24">
   {/* Hero Section */}
   <section className="relative min-h-[921px] flex items-center px-8 md:px-16 overflow-hidden">
   <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
   <div className="md:col-span-6 z-10">
   <span className="font-label tracking-[0.2em] uppercase text-[11px] mb-6 block" style={{ color: primaryColor }}>
   {editorial.heroTagline || 'Editorial Excellence'}
   </span>
   <h1 
   className="font-headline leading-[1.1] mb-8 tracking-tight text-crm-mutedrm-textxl font-bold"
   dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorial.heroTitle || `Your Sanctuary of <br/> <span class="italic" style="color: ${primaryColor}">Sophisticated Care</span>`) }}
   />
   <p className="text-crm-muted font-body max-w-md mb-10 leading-relaxed text-[13px]">
   {editorial.heroSubtitle || 'Experience beauty as an art form. Our atelier provides a curated space for those who appreciate the finer details of self-ceremony.'}
   </p>
   <div className="flex items-center gap-4">
   <button 
   className="px-8 py-4 rounded-lg hover:shadow-lg transition-all font-semibold text-crm-text"
   style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }}
   >
   Book Now
   </button>
   <a href="#services" className="font-semibold flex items-center gap-2 group px-4 py-4" style={{ color: secondaryColor }}>
   Explore Services
   <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
   </a>
   </div>
   </div>
   <div className="md:col-span-6 relative h-[600px] md:h-[750px]">
   <div className="absolute inset-0 bg-[#1a1c1a] rounded-3xl overflow-hidden -rotate-2 transform translate-x-4 translate-y-4"></div>
   <Image
    src={editorial.heroImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuAPRu8QRu8seSz1ZA0n6LiPGRgqS7aZEcjxutc8fOcO1ZIkoJH2Umtws1TFTbdJwWCpmXEE_T0bVF00Q1EwlHR5KpYdbkMHCu2nUg2NAe5C2pfVotvKBcYkKM63pa2s4XXMCSh4EVxf389QPikRuNYPp_EHSwR5QQSbPcaysTObNr3wOBttSWwh41x9HEbYtenN4fQFtQfUC-criMC9c8Li4jj4D1-zB8_8LZYeg0ReRDBSudtfcTLc4qJDHasnl5yxlX6EAv0YYbw"}
    alt="Hero" />
   <div className="absolute bottom-12 -left-12 bg-[#0d0f0d] p-6 rounded-2xl shadow-lg hidden lg:block">
   {shop.slogan && <p className="font-headline italic text-[13px]" style={{ color: primaryColor }}>{shop.slogan}</p>}
   </div>
   </div>
   </div>
   </section>

   {/* Services Section */}
   <section id="services" className="py-32 px-8 bg-[#1a1c1a]">
   <div className="max-w-7xl mx-auto">
   <div className="text-crm-mutedrm-textenter mb-20">
   <h2 className="font-headline mb-4 text-xl font-bold">{editorial.servicesTitle || 'Our Services'}</h2>
   <div className="w-24 h-px mx-auto mb-6" style={{ backgroundColor: primaryColor }}></div>
   <p className="font-body text-crm-muted max-w-xl mx-auto text-[13px]">{editorial.servicesSubtitle || "A curated selection of rituals designed to restore your glow and refine your natural elegance."}</p>
   </div>
   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
   {shop.services?.map((service: any, index: number) => (
   <div key={service.id} className="group bg-[#0d0f0d] p-10 rounded-2xl transition-all hover:translate-y-[-8px]">
   <div className="w-16 h-16 bg-[#292a29] rounded-full flex items-center justify-center mb-8 text-crm-muted">
   <span className="material-symbols-outlined text-crm-mutedrm-textxl">{['spa', 'face', 'fluid_med'][index % 3] || 'spa'}</span>
   </div>
   <h3 className="font-headline mb-4 text-lg font-bold">{service.name}</h3>
   <p className="text-crm-muted mb-8 leading-relaxed text-[13px]">{service.description}</p>
   <div className="text-[13px] font-bold text-white mb-4">${service.price.toFixed(2)} &bull; {service.duration}m</div>
   <button className="font-semibold flex items-center gap-2 group/link" style={{ color: primaryColor }}>
   Book This
   <span className="material-symbols-outlined text-[13px] group-hover/link:translate-x-1 transition-transform">east</span>
   </button>
   </div>
   ))}
   </div>
   </div>
   </section>

   {/* Gallery Section */}
   <section id="gallery" className="py-32 px-8 bg-[#121412]">
   <div className="max-w-7xl mx-auto">
   <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
   <div>
   <span className="font-label tracking-widest uppercase text-[11px] mb-2 block" style={{ color: primaryColor }}>{editorial.gallerySubtitle || 'Our Work'}</span>
   <h2 className="font-headline text-xl font-bold">{editorial.galleryTitle || 'The Gallery'}</h2>
   </div>
   </div>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px]">
   {editorial.galleryImages?.[0] && (
   <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden relative group">
   <Image src={editorial.galleryImages[0]} alt="Gallery 1" />
   </div>
   )}
   {editorial.galleryImages?.[1] && (
   <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group">
   <Image src={editorial.galleryImages[1]} alt="Gallery 2" />
   </div>
   )}
   {editorial.galleryImages?.[2] && (
   <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden relative group">
   <Image src={editorial.galleryImages[2]} alt="Gallery 3" />
   </div>
   )}
   {editorial.galleryImages?.[3] && (
   <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden relative group">
   <Image src={editorial.galleryImages[3]} alt="Gallery 4" />
   </div>
   )}
   </div>
   </div>
   </section>

   {/* Client Stories */}
   {editorial.testimonials && editorial.testimonials.length > 0 && (
   <section className="py-32 px-8 bg-[#1a1c1a] overflow-hidden relative">
   <div className="absolute top-0 right-0 w-64 h-64 bg-[#292a29] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
   <div className="max-w-7xl mx-auto">
   <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
   <div className="md:col-span-4">
   <h2 
   className="font-headline mb-6 leading-tight text-xl font-bold"
   dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorial.testimonialsTitle || `Reflections <br/>from Our <br/><span class="italic" style="color: ${primaryColor}">Atelier Guests</span>`) }}
   />
   </div>
   <div className="md:col-span-8 flex gap-8">
   {editorial.testimonials.slice(0,2).map((t: any, i: number) => (
   <div key={i} className={`bg-[#0d0f0d] p-10 rounded-3xl shadow-sm max-w-sm ${i === 1 ? 'hidden md:block opacity-60' : ''}`}>
   <span className="material-symbols-outlined text-crm-mutedxl mb-6" style={{ color: secondaryColor }}>format_quote</span>
   <p className="font-body italic text-crm-text mb-8 leading-relaxed text-[13px]">"{t.quote}"</p>
   <div className="flex items-center gap-4">
   <div className="w-12 h-12 rounded-full bg-[#292a29]"></div>
   <div>
   <p className="font-bold text-crm-text text-[13px]">{t.author}</p>
   <p className="text-crm-muted uppercase tracking-widest text-[13px]">{t.role}</p>
   </div>
   </div>
   </div>
   ))}
   </div>
   </div>
   </div>
   </section>
   )}

   {/* Visit Us Section */}
   <section id="contact" className="py-32 px-8 bg-[#121412]">
   <div className="max-w-7xl mx-auto">
   <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
   <div>
   <h2 className="font-headline mb-12 text-xl font-bold">{editorial.visitUsTitle || 'Visit the Atelier'}</h2>
   <div className="space-y-12">
   <div className="flex gap-6">
   <span className="material-symbols-outlined" style={{ color: primaryColor }}>location_on</span>
   <div>
   <h4 className="font-bold mb-2 text-crm-mutedase font-semibold">Our Location</h4>
   <p className="text-crm-muted text-[13px]">{shop.customization?.address || 'Address not provided'}</p>
   </div>
   </div>
   <div className="flex gap-6">
   <span className="material-symbols-outlined" style={{ color: primaryColor }}>call</span>
   <div>
   <h4 className="font-bold mb-2 text-crm-mutedase font-semibold">Contact Details</h4>
   <p className="text-crm-muted text-[13px]">{shop.customization?.phone || 'Phone not provided'}<br/>{shop.customization?.email || 'Email not provided'}</p>
   </div>
   </div>
   </div>
   </div>
   <div className="h-[500px] bg-[#1a1c1a] rounded-3xl overflow-hidden relative">
   <div className="absolute inset-0 grayscale contrast-125 opacity-40">
   <Image
    src={editorial.mapImageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBPBUELt3H48sCkgUERZL-bYjLp_g4nyaMrAaWgWqv1QMVuCaaZub4OKguOms2xp_UClFnqWJd5F1jE8c8_9V8GbtLNhZwardBznAcbPP6O5ofImMcqWosMtI8MOhCDK6ERy1aepwuU8Jjoomg4v3oHOH1T-k1vmTJMASUVHIRN_wlzdQm3IGpjqWBgBHRYOEeLiJKp7GgD_lnnDst0M8NdV_0egB1TFqQmXLS5pgBlZELH0ExIL_x5_OEryY1I7lK2NPfP3cKIUjs"}
    alt="Map View" />
   </div>
   <div className="absolute inset-0 flex items-center justify-center">
   <div className="bg-[#121412] p-8 rounded-2xl shadow-xl border text-crm-mutedrm-textenter max-w-xs" style={{ borderColor: `${primaryColor}20` }}>
   <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
   <span className="material-symbols-outlined text-crm-text">pin_drop</span>
   </div>
   <p className="font-headline text-[13px]">{shop.name}</p>
   </div>
   </div>
   </div>
   </div>
   </div>
   </section>
   </div>
   {/* Footer */}
   <footer className="w-full rounded-t-3xl bg-[#0d0f0d]">
   <div className="grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-16 max-w-7xl mx-auto">
   <div className="space-y-6">
   <div className="text-xl font-headline text-stone-200">{shop.name}</div>
   <p className="text-stone-400 font-body leading-relaxed text-[13px]">{shop.description}</p>
   </div>
   <div className="flex flex-col items-start md:items-end space-y-6 md:col-start-3">
   <div className="flex gap-6">
   <a className="hover:opacity-70 transition-all" style={{ color: primaryColor }} href="#"><span className="material-symbols-outlined">public</span></a>
   <a className="hover:opacity-70 transition-all" style={{ color: primaryColor }} href="#"><span className="material-symbols-outlined">photo_camera</span></a>
   </div>
   <p className="text-stone-400 font-body tracking-wide uppercase text-right text-[13px]">
   &copy; {new Date().getFullYear()} {shop.name}.
   </p>
   </div>
   </div>
   </footer>
   <AIWidget shopId={shop.id} />
  </main>
 );
 }

 if (templateType === 'minimal') {
 return (
  <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-text, .text-gray-900, .text-black, .text-crm-text, .text-crm-text, .text-crm-text, .text-crm-text { color: ${themeText} !important; }
   .text-crm-muted, .text-gray-500, .text-gray-600, .text-crm-muted, .text-crm-muted, .text-crm-muted, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-mutedrm-textrm-text, .text-gray-900, .text-crm-mutedlack { color: ${themeText} !important; }
   .text-crm-mutedrm-textrm-muted, .text-gray-500, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-crm-border flex flex-col md:flex-row justify-between items-end md:items-center">
   <div>
   <h1 className="font-light tracking-tight text-crm-mutedrm-textxl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>
   {shop.description && <p className="text-crm-mutedrm-textrm-muted mt-2 text-[13px]">{shop.description}</p>}
   </div>
   <div className="text-right mt-6 md:mt-0 text-[13px] text-crm-mutedrm-textrm-muted">
   {shop.customization?.phone && <p className="text-[13px]">{shop.customization.phone}</p>}
   {shop.customization?.address && <p className="text-[13px]">{shop.customization.address}</p>}
   </div>
   </header>
   <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
   <h2 className="font-semibold tracking-widest uppercase text-crm-mutedrm-textrm-muted mb-10 text-xl font-bold">Service Menu</h2>
   {shop.services && shop.services.length > 0 ? (
   <div className="space-y-8">
   {shop.services.map((service: any) => (
   <div key={service.id} className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-baseline group cursor-pointer">
   <div className="flex-1 border-b border-dotted border-crm-border pb-1 mr-4">
   <h3 className="font-medium transition-colors text-lg font-bold" style={{ color: primaryColor }}>{service.name}</h3>
   {service.description && <p className="text-crm-mutedrm-textrm-muted mt-1 text-[13px]">{service.description}</p>}
   </div>
   <div className="text-right">
   <span className="font-medium">${service.price.toFixed(2)}</span>
   <span className="text-crm-mutedrm-textrm-muted text-[11px] ml-2">{service.duration}m</span>
   </div>
   </div>
   ))}
   </div>
   ) : (
   <p className="text-crm-mutedrm-textrm-muted italic text-[13px]">No services listed.</p>
   )}
   </section>
   <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 text-crm-mutedrm-textenter">
   <button 
   className="px-8 py-3 text-crm-mutedrm-textrm-text transition-colors text-[13px] font-medium tracking-wide uppercase rounded-lg"
   style={{ backgroundColor: primaryColor }}
   >
   Make an Appointment
   </button>
   </section>
   <AIWidget shopId={shop.id} />
  </main>
 );
 }

 if (templateType === 'classic') {
 return (
  <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-text, .text-gray-900, .text-black, .text-crm-text, .text-crm-text, .text-crm-text, .text-crm-text { color: ${themeText} !important; }
   .text-crm-muted, .text-gray-500, .text-gray-600, .text-crm-muted, .text-crm-muted, .text-crm-muted, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-mutedrm-textrm-text, .text-gray-900, .text-crm-mutedlack { color: ${themeText} !important; }
   .text-crm-mutedrm-textrm-muted, .text-gray-500, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   <header className="border-b-4 border-[#2c1e16] py-16 text-crm-mutedrm-textenter bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
   <h1 className="font-bold uppercase tracking-widest mb-4 text-crm-mutedrm-textxl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>
   {shop.description && <p className="max-w-xl mx-auto text-crm-muted text-[13px]">{shop.description}</p>}
   </header>
   <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
   <h2 className="font-bold text-crm-mutedrm-textenter uppercase tracking-widest mb-16 relative text-xl font-bold">
   <span className="bg-[#fdfbf7] px-6 relative z-10">Our Services</span>
   <div className="absolute left-0 top-1/2 w-full h-px bg-[#e6d9c6] -z-0"></div>
   </h2>

   <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
   {shop.services?.map((service: any) => (
   <div key={service.id} className="text-crm-mutedrm-textenter">
   <h3 className="font-bold mb-2 text-lg font-bold" style={{ color: primaryColor }}>{service.name}</h3>
   <div className=" text-[#8b7355] text-[13px] tracking-widest uppercase mb-3">
   ${service.price.toFixed(2)} &bull; {service.duration} MINS
   </div>
   {service.description && <p className="text-crm-muted italic text-[13px]">{service.description}</p>}
   </div>
   ))}
   </div>

   <div className="text-crm-mutedrm-textenter mt-20">
   <button 
   className="border-2 px-12 py-4 uppercase tracking-widest font-bold transition-colors"
   style={{ borderColor: primaryColor, color: primaryColor }}
   >
   Book a Chair
   </button>
   </div>
   </section>
   <footer className="bg-[#2c1e16] text-[#e6d9c6] py-12 text-crm-mutedrm-textenter text-[13px] tracking-widest uppercase">
   <p className="mb-2 text-[13px]">{shop.customization?.address || 'Visit us today'}</p>
   <p className="text-[13px]">{shop.customization?.phone} | {shop.customization?.email}</p>
   </footer>
   <AIWidget shopId={shop.id} />
  </main>
 );
 }

 // Default 'modern' template (the one that was originally there)
 return (
  <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-text, .text-gray-900, .text-black, .text-crm-text, .text-crm-text, .text-crm-text, .text-crm-text { color: ${themeText} !important; }
   .text-crm-muted, .text-gray-500, .text-gray-600, .text-crm-muted, .text-crm-muted, .text-crm-muted, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   {faviconUrl && (
   <link rel="icon" href={faviconUrl} />
   )}
   <style dangerouslySetInnerHTML={{__html: `
   @import url('https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;600;700;900&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap');
   
   h1, h2, h3, h4, h5, h6, .font-heading { font-family: '${headingFont}', sans-serif !important; }
   body, p, span, a, div, .font-body { font-family: '${bodyFont}', sans-serif; }
   
   ${isDark ? `
   .bg-crm-bg, .bg-white, .bg-crm-surface { background-color: ${themeBg} !important; border-color: ${themeBorder} !important; }
   .text-crm-mutedrm-textrm-text, .text-gray-900, .text-crm-mutedlack { color: ${themeText} !important; }
   .text-crm-mutedrm-textrm-muted, .text-gray-500, .text-crm-muted { color: ${themeMuted} !important; }
   .border-gray-100, .border-gray-200, .border-crm-border { border-color: ${themeBorder} !important; }
   ` : ''}

   ${buttonShape === 'sharp' ? '.btn, button { border-radius: 0 !important; }' : ''}
   ${buttonShape === 'pill' ? '.btn, button { border-radius: 9999px !important; }' : ''}
   
   ${buttonVariant === 'outline' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: 2px solid ${primaryColor} !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}
   
   ${buttonVariant === 'ghost' ? `
   .btn, button.bg-crm-primary { background-color: transparent !important; border: none !important; color: ${primaryColor} !important; }
   .btn:hover, button.bg-crm-primary:hover { background-color: ${primaryColor}20 !important; }
   ` : ''}

   ${enableScrollAnimations ? `
   .animate-on-scroll {
   animation: fadeInUp 0.8s ease forwards;
   }
   @keyframes fadeInUp {
   from { opacity: 0; transform: translateY(20px); }
   to { opacity: 1; transform: translateY(0); }
   }
   ` : ''}

   .hero-overlay {
   background-color: ${heroOverlayColor};
   opacity: ${heroOverlayOpacity / 100};
   }

   ${sanitizeCss(customCss)}
   `}} />
   {/* Hero Section */}
   <section 
   className="bg-crm-surface backdrop-blur-md border-b border-crm-border"
   style={{ borderBottomColor: primaryColor }}
   >
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
   <div className="text-crm-mutedrm-textenter">
   <h1 
   className="font-bold mb-6 text-crm-mutedrm-textxl font-bold"
   style={{ color: primaryColor }}
   >
   {shop.name}
   </h1>
   {shop.description && (
   <p className="text-crm-mutedrm-textrm-muted max-w-2xl mx-auto text-[13px]">
   {shop.description}
   </p>
   )}
   </div>
   </div>
   </section>
   {/* Services Section */}
   <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
   <div className="mb-16">
   <h2 className="font-bold text-crm-mutedrm-textrm-text mb-4 text-xl font-bold">Our Services</h2>
   <div 
   className="w-20 h-1 rounded-full"
   style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
   ></div>
   </div>

   {shop.services && shop.services.length > 0 ? (
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   {shop.services.map((service: any) => (
   <div
   key={service.id}
   className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-crm-border shadow-sm transition-all duration-300 hover:shadow-lg"
   >
   <div className="flex items-start justify-between mb-4">
   <h3 className="font-bold text-crm-mutedrm-textrm-text transition-colors text-lg font-bold">
   {service.name}
   </h3>
   <div 
   className="px-3 py-1 rounded-full text-[13px] font-semibold"
   style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
   >
   ${service.price.toFixed(2)}
   </div>
   </div>

   {service.description && (
   <p className="text-crm-mutedrm-textrm-muted mb-4 leading-relaxed text-[13px]">
   {service.description}
   </p>
   )}

   <div className="flex items-center justify-between pt-4 border-t border-crm-border">
   <div className="text-crm-mutedrm-textrm-muted text-[13px]">
   ⏱️ {service.duration} minutes
   </div>
   <button 
   className="text-crm-mutedrm-textrm-text px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90 text-[13px]"
   style={{ backgroundColor: primaryColor }}
   >
   Book Now
   </button>
   </div>
   </div>
   ))}
   </div>
   ) : (
   <div className="text-crm-mutedrm-textenter py-16">
   <p className="text-crm-mutedrm-textrm-muted text-[13px]">
   No services available at the moment. Please check back later.
   </p>
   </div>
   )}
   </section>
   {/* CTA Section */}
   <section 
   className="py-16"
   style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
   >
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-crm-mutedrm-textenter">
   <h2 className="font-bold text-crm-mutedrm-textrm-text mb-6 text-xl font-bold">
   Ready to Book?
   </h2>
   <p className="text-crm-mutedrm-textrm-text mb-8 text-[13px]">
   Schedule your appointment today and get the best service in town.
   </p>
   <button 
   className="bg-crm-surface font-bold py-3 px-8 rounded-lg transition-colors text-lg"
   style={{ color: primaryColor }}
   >
   Book an Appointment
   </button>
   </div>
   </section>
   {/* Footer */}
   <footer className="bg-crm-surface border-t border-crm-border py-12">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
   <div>
   <h3 className="text-crm-mutedrm-textrm-text font-bold mb-4 text-lg font-bold">{shop.name}</h3>
   <p className="text-crm-mutedrm-textrm-muted mb-4 text-[13px]">
   {shop.description || 'Your trusted service provider'}
   </p>
   {shop.customization?.address && (
   <p className="text-crm-mutedrm-textrm-muted text-[13px]">{shop.customization.address}</p>
   )}
   </div>
   <div>
   <h4 className="text-crm-mutedrm-textrm-text font-bold mb-4 text-crm-mutedase font-semibold">Contact</h4>
   <ul className="space-y-2 text-crm-mutedrm-textrm-muted text-[13px]">
   {shop.customization?.phone && (
   <li>
   <a href={`tel:${shop.customization.phone}`} className="hover:text-crm-mutedrm-textrm-text transition">
   📞 {shop.customization.phone}
   </a>
   </li>
   )}
   {shop.customization?.email && (
   <li>
   <a href={`mailto:${shop.customization.email}`} className="hover:text-crm-mutedrm-textrm-text transition">
   ✉️ {shop.customization.email}
   </a>
   </li>
   )}
   <li>
   <a href="#services" className="hover:text-crm-mutedrm-textrm-text transition">
   Services
   </a>
   </li>
   </ul>
   </div>
   <div>
   <h4 className="text-crm-mutedrm-textrm-text font-bold mb-4 text-crm-mutedase font-semibold">Follow Us</h4>
   <div className="flex gap-4">
   {shop.customization?.social?.facebook && (
   <a
   href={shop.customization.social.facebook}
   target="_blank"
   rel="noopener noreferrer"
   className="text-crm-mutedrm-textrm-muted hover:text-crm-mutedrm-textrm-text transition"
   >
   Facebook
   </a>
   )}
   {shop.customization?.social?.instagram && (
   <a
   href={shop.customization.social.instagram}
   target="_blank"
   rel="noopener noreferrer"
   className="text-crm-mutedrm-textrm-muted hover:text-crm-mutedrm-textrm-text transition"
   >
   Instagram
   </a>
   )}
   {shop.customization?.social?.twitter && (
   <a
   href={shop.customization.social.twitter}
   target="_blank"
   rel="noopener noreferrer"
   className="text-crm-mutedrm-textrm-muted hover:text-crm-mutedrm-textrm-text transition"
   >
   Twitter
   </a>
   )}
   </div>
   </div>
   </div>
   <div className="border-t border-crm-border pt-8 text-crm-mutedrm-textenter text-crm-mutedrm-textrm-muted text-[13px]">
   <p className="text-[13px]">
   &copy; {new Date().getFullYear()} {shop.name}. All rights reserved.
   </p>
   </div>
   </div>
   </footer>
   <AIWidget shopId={shop.id} />
  </main>
 );
}
