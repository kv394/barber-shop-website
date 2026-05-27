import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function SportyTemplate({ ctx }: { ctx: any }) {
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
 <main className="min-h-screen overflow-x-hidden flex flex-col bg-crm-surface text-crm-text relative">

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
 


 {/* Top Bar - Contact Info & Auth */}
 <div className="bg-crm-surface text-crm-text text-[11px] py-2 px-4 flex flex-wrap justify-center sm:justify-end items-center gap-4">
 {shopPhone && <span>{shopPhone}</span>}
 {shopEmail && <span>{shopEmail}</span>}
 <div className="relative">
 <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
 </div>
 </div>
 
 {/* Header / Nav */}
 <header className="border-b-4 border-crm-border sticky top-0 bg-crm-surface z-40 shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center overflow-x-auto hide-scrollbar">
 {logoUrl ? (
 <img src={logoUrl} alt={shop.name} className="h-10 shrink-0 mr-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
 ) : (
 <h1 className="font-black italic uppercase tracking-tighter shrink-0 mr-6 text-2xl font-bold" style={{ color: sportRed }}>
 {shop.name}
 </h1>
 )}
 {pages.filter((p: any) => p.isVisible).length > 0 && (
 <nav className="flex gap-4 sm:gap-6 shrink-0">
 <a href="#" className="text-[13px] font-bold uppercase transition-colors text-crm-muted hover:text-crm-text">Home</a>
 {pages.filter((p: any) => p.isVisible).map((p: any) => (
 <a key={p.id} href={`#${p.id}`} className="text-[13px] font-bold uppercase transition-colors text-crm-muted hover:text-crm-text">{p.title}</a>
 ))}
 </nav>
 )}
 </div>
 </header>
 
 {/* Hero Section */}
 <section className="bg-crm-bg border-b border-crm-border relative bg-cover bg-center" style={{ backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined }}><div className={heroImageUrl ? "absolute inset-0 bg-crm-surface/80" : ""} />
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center md:text-left flex flex-col md:flex-row items-center relative z-10">
 <div className="md:w-1/2 mb-8 md:mb-0">
 {shop.slogan && <h2 className="font-black uppercase italic leading-none mb-6 text-xl font-bold">{shop.slogan}</h2>}
 {shop.description && <p className="text-crm-text font-semibold mb-8 max-w-lg text-[13px]">{shop.description}</p>}
 </div>
 <div className="md:w-1/2 flex justify-center">
 <div className="w-full max-w-md aspect-square bg-gray-300 transform -rotate-3 overflow-hidden shadow-2xl border-8 border-white">
 <div className="w-full h-full bg-crm-surface flex items-center justify-center">
 <span className="text-2xl" style={{ color: sportRed }}>💈</span>
 </div>
 </div>
 </div>
 </div>
 </section>
 
 {pages.filter((p: any) => p.isVisible).map((p: any) => (

 <section key={p.id} id={p.id} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
 <h1 className="font-black uppercase italic mb-8 text-2xl font-bold" style={{ color: sportRed }}>{p.title}</h1>
 <CustomPageContent content={p.content || ""} shop={shop} themeColor={sportRed} className="prose prose-lg max-w-none text-crm-text" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
 </section>
 ))}



 {/* Footer */}
 <footer className="bg-crm-surface text-crm-text py-16 uppercase text-[13px] tracking-widest">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
 <div className="md:col-span-2">
 <h3 className="font-black italic mb-2 text-lg font-bold" style={{ color: sportRed }}>{shop.name}</h3>
 {shop.slogan && <div className="text-crm-text font-black italic mb-4 uppercase tracking-widest">{shop.slogan}</div>}
 <p className="text-crm-muted normal-case tracking-normal mb-6 max-w-sm text-[13px]">
 {shop.description}
 </p>
 </div>
 <div>
 <h4 className="font-bold mb-6 text-crm-muted text-base font-semibold">Quick Links</h4>
 <ul className="space-y-4 font-bold">
 
 </ul>
 </div>
 <div>
 <h4 className="font-bold mb-6 text-crm-muted text-base font-semibold">Connect</h4>
 <div className="flex flex-col space-y-4 font-bold">
 {shopFB && <a href={shopFB} className="hover:text-status-cancelled transition-colors">Facebook</a>}
 {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} className="hover:text-status-cancelled transition-colors">Instagram</a>}
 {shopTW && <a href={shopTW} className="hover:text-status-cancelled transition-colors">Twitter</a>}
 </div>
 </div>
 </div>
 <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-crm-muted font-bold text-[11px]">
 <p className="text-[13px]">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
 {shopAddress && <p className="mt-4 md:mt-0 text-[13px]">{shopAddress}</p>}
 </div>
 </div>
 </footer>

 {selectedService && (
 <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
 )}
 </main>

 );
}
