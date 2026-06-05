import Image from 'next/image';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';
import MobileNav from './MobileNav';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function ClassicTemplate({ ctx }: { ctx: any }) {
 const { 
 shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
 selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
 c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
 heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
 faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
 pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
 shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton, pathname 
 } = ctx;
 
 return (
  <main className="min-h-screen overflow-x-hidden flex flex-col bg-[#fdfbf7] text-crm-text font-serif relative">
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
    <div className="absolute top-6 left-8 z-50 flex items-center gap-4">
    {pages.filter((p: any) => p.isVisible).length > 0 && (
    <nav className="hidden md:flex flex-wrap gap-4 md:gap-6 text-sm font-bold uppercase tracking-widest">
    <a href="#" className="py-2 px-3 transition-colors text-[#8b7355] hover:text-crm-text">Home</a>
    {pages.filter((p: any) => p.isVisible).map((p: any) => (
    <a key={p.id} href={`#${p.id}`} className="py-2 px-3 transition-colors text-[#8b7355] hover:text-crm-text">{p.title}</a>
    ))}
    </nav>
    )}
    <MobileNav
    navItems={[
    { label: 'Home', href: '#' },
    ...pages.filter((p: any) => p.isVisible).map((p: any) => ({ label: p.title, href: `#${p.id}` }))
    ]}
    bgColor="#fdfbf7"
    textColor="#2c1e16"
    accentColor="#8b7355"
    />
    </div>
   <div className="absolute top-6 right-8 z-50">
   <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
   </div>
   <header className="border-b-4 border-[#2c1e16] pt-32 pb-16 text-center relative bg-cover bg-center" style={{ backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : "url('https://www.transparenttextures.com/patterns/aged-paper.png')" }}>
   <div className={heroImageUrl ? "absolute inset-0 bg-[#fdfbf7]/80" : ""} />
   <div className="relative z-10">
   {logoUrl ? <Image src={logoUrl} alt={shop.name} /> : <h1 className="font-bold uppercase tracking-widest mb-4 text-2xl" style={{ color: primaryColor }}>{shop.name}</h1>}
   {shop.slogan && <h2 className="text-[#8b7355] font-serif text-xl italic mb-6">{shop.slogan}</h2>}
   {shop.description && <p className="max-w-xl mx-auto text-crm-muted text-[13px]">{shop.description}</p>}
   <button onClick={() => handleBookClick(shop.services?.[0])} 
   className="mt-8 px-10 py-3 font-bold uppercase tracking-widest text-sm transition-all hover:opacity-90"
   style={{ backgroundColor: primaryColor || '#2c1e16', color: '#fdfbf7' }}>
   {ctaText || 'Book Now'}
   </button>
   </div>
   </header>
   {pages.filter((p: any) => p.isVisible).map((p: any) => (

   <section key={p.id} id={p.id} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 min-h-[60vh]">
   <h1 className="font-bold uppercase tracking-widest mb-12 text-center text-2xl" style={{ color: primaryColor }}>{p.title}</h1>
   <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-crm-muted" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
   </section>
   ))}
   <footer className="bg-[#2c1e16] text-[#e6d9c6] py-12 text-center text-[13px] tracking-widest uppercase">
   {shopAddress && <p className="mb-2 text-[13px]">{shopAddress}</p>}
   {!shopAddress && <p className="mb-2 text-[13px]">Visit us today</p>}
   <p className="text-[13px]">{shopPhone}{shopPhone && shopEmail ? ' | ' : ''}{shopEmail}</p>
   </footer>
   {selectedService && (
   <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
   )}
  </main>
 );
}
