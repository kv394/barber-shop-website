import Image from 'next/image';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function EditorialTemplate({ ctx }: { ctx: any }) {
 const { 
 shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
 selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
 c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
 heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
 faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
 pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
 shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton 
 } = ctx;
 
 const editorial = shop.customization?.editorialCustomization || {};
 
 return (
  <main className="min-h-screen overflow-x-hidden flex flex-col bg-[#121412] text-crm-text selection:bg-[#d4af37] selection:text-[#554300] ">
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

   ${customCss}
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
   <div className="text-2xl font-bold font-headline tracking-tighter" style={{ color: primaryColor }}>
   {shop.name}
   </div>
   {/* Desktop Navigation */}
   
   <div className="flex items-center gap-6">
   <button 
   onClick={() => {
   const servicesSection = document.getElementById('services');
   if (servicesSection) {
   servicesSection.scrollIntoView({ behavior: 'smooth' });
   }
   }}
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
   <section className="relative min-h-[70vh] md:min-h-[921px] flex items-center px-8 md:px-16 overflow-hidden">
   <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
   <div className="md:col-span-6 z-10">
   <span className="font-label tracking-[0.2em] uppercase text-[11px] mb-6 block" style={{ color: primaryColor }}>
   {editorial.heroTagline || 'Editorial Excellence'}
   </span>
   <h1 
   className="font-headline leading-[1.1] mb-8 tracking-tight text-5xl font-bold"
   dangerouslySetInnerHTML={{ __html: editorial.heroTitle || `Your Sanctuary of <br/> <span class="italic" style="color: ${primaryColor}">Sophisticated Care</span>` }}
   />
   <p className="text-crm-muted font-body max-w-md mb-10 leading-relaxed text-[13px]">
   {editorial.heroSubtitle || 'Experience beauty as an art form. Our atelier provides a curated space for those who appreciate the finer details of self-ceremony.'}
   </p>
   <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
   <button 
   onClick={() => {
   const servicesSection = document.getElementById('services');
   if (servicesSection) {
   servicesSection.scrollIntoView({ behavior: 'smooth' });
   }
   }}
   className="w-full sm:w-auto px-8 py-4 rounded-lg hover:shadow-lg transition-all font-semibold text-crm-text text-center"
   style={{ background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})` }}
   >
   Book Now
   </button>
   <a href="#services" className="w-full sm:w-auto justify-center sm:justify-start font-semibold flex items-center gap-2 group px-4 py-4" style={{ color: secondaryColor }}>
   Explore Services
   <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
   </a>
   </div>
   </div>
   <div className="md:col-span-6 relative h-[300px] md:h-[600px] lg:h-[750px]">
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
   
   {pages.filter((p: any) => p.isVisible).map((p: any) => (

   <section key={p.id} id={p.id} className="py-32 px-8 min-h-[60vh] w-full max-w-7xl mx-auto">
   <div className="w-full">
   <h1 className="font-headline mb-12 text-3xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
   <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-invert prose-lg max-w-none font-body text-crm-muted" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
   </div>
   </section>
   ))}

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
   dangerouslySetInnerHTML={{ __html: editorial.testimonialsTitle || `Reflections <br/>from Our <br/><span class="italic" style="color: ${primaryColor}">Atelier Guests</span>` }}
   />
   </div>
   <div className="md:col-span-8 flex flex-col sm:flex-row gap-8">
   {editorial.testimonials.slice(0,2).map((t: any, i: number) => (
   <div key={i} className={`bg-[#0d0f0d] p-10 rounded-3xl shadow-sm max-w-sm ${i === 1 ? 'hidden md:block opacity-60' : ''}`}>
   <span className="material-symbols-outlined text-4xl mb-6" style={{ color: secondaryColor }}>format_quote</span>
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
   <div className="flex items-start gap-6">
   <span className="material-symbols-outlined" style={{ color: primaryColor }}>location_on</span>
   <div>
   <h4 className="font-bold mb-2 text-base font-semibold">Our Location</h4>
   <p className="text-crm-muted text-[13px]">{shopAddress || 'Address not provided'}</p>
   </div>
   </div>
   <div className="flex items-start gap-6">
   <span className="material-symbols-outlined" style={{ color: primaryColor }}>call</span>
   <div>
   <h4 className="font-bold mb-2 text-base font-semibold">Contact Details</h4>
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
   <div className="bg-[#121412] p-8 rounded-2xl shadow-xl border text-center max-w-xs" style={{ borderColor: `${primaryColor}20` }}>
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
   <div className="text-xl font-headline text-stone-200 mb-2">{shop.name}</div>
   {shop.slogan && <div className="text-[#d4af37] font-serif italic mb-4">{shop.slogan}</div>}
   <p className="text-stone-400 font-body leading-relaxed text-[13px]">{shop.description}</p>
   </div>
   <div className="flex flex-col items-start md:items-end space-y-6 md:col-start-3">
   <div className="flex items-center gap-6">
   <a className="hover:opacity-70 transition-all" style={{ color: primaryColor }} href="#"><span className="material-symbols-outlined">public</span></a>
   <a className="hover:opacity-70 transition-all" style={{ color: primaryColor }} href="#"><span className="material-symbols-outlined">photo_camera</span></a>
   </div>
   <p className="text-stone-400 font-body tracking-wide uppercase text-right text-[13px]">
   &copy; {new Date().getFullYear()} {shop.name}.
   </p>
   </div>
   </div>
   </footer>
   {selectedService && (
   <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
   )}
  </main>
 );
}
