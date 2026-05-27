'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import CustomPageContent from '../components/CustomPageContent';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center"><p className="text-crm-muted text-[13px]">Loading...</p></div>
});

export default function ModernTemplate({ ctx }: { ctx: any }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const {
        shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
        selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
        c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
        heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
        faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
        pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
        shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, pathname
    } = ctx;

    return (
        <main className="min-h-screen overflow-x-hidden flex flex-col bg-gray-50 text-gray-800 font-sans relative">

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
        

        
            {/* Header / Nav */}
            <header className="absolute w-full top-0 left-0 p-4 md:p-6 z-50">
                <nav className="flex items-center justify-between bg-white/10 backdrop-blur-md px-4 md:px-6 py-3 rounded-full border border-white/20 shadow-sm w-full">
                    {pages.filter((p: any) => p.isVisible).length > 0 && (
                        <div className="hidden md:flex gap-4 md:gap-6 items-center overflow-x-auto hide-scrollbar">
                            <a href="#" className="text-[12px] md:text-[13px] font-medium text-white/90 hover:text-white transition-colors uppercase tracking-wider shrink-0">Home</a>
                            {pages.filter((p: any) => p.isVisible).map((p: any) => (
                                <a key={p.id} href={`#${p.id}`} className="text-[12px] md:text-[13px] font-medium text-white/90 hover:text-white transition-colors uppercase tracking-wider shrink-0">{p.title}</a>
                            ))}
                        </div>
                    )}
                    {/* Mobile hamburger button */}
                    {pages.filter((p: any) => p.isVisible).length > 0 && (
                        <button
                            className="md:hidden text-white/90 hover:text-white p-1"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    )}
                    <div className="ml-auto pl-4 border-l border-white/20 flex items-center shrink-0">
                        <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
                    </div>
                </nav>
                {/* Mobile menu dropdown */}
                {mobileMenuOpen && pages.filter((p: any) => p.isVisible).length > 0 && (
                    <div className="md:hidden mt-2 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 p-4 flex flex-col gap-3">
                        <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-[13px] font-medium text-white/90 hover:text-white transition-colors uppercase tracking-wider">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} onClick={() => setMobileMenuOpen(false)} className="text-[13px] font-medium text-white/90 hover:text-white transition-colors uppercase tracking-wider">{p.title}</a>
                        ))}
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section 
                className="relative flex flex-col justify-center items-center min-h-[60vh] md:min-h-[60vh] pt-24 pb-16 px-6 overflow-hidden bg-slate-900"
                style={heroImageUrl && !heroVideoUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {heroVideoUrl && (
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
                    <source src={heroVideoUrl} type="video/mp4" />
                    </video>
                )}
                <div className="absolute inset-0 bg-black/60 z-0" />
                
                <div className="relative z-10 w-full max-w-7xl mx-auto text-center flex flex-col items-center">
                    {logoUrl ? (
                    <div className="w-28 h-28 md:w-36 md:h-36 mb-8 rounded-full overflow-hidden border-4 shadow-2xl bg-white flex items-center justify-center p-2" style={{ borderColor: primaryColor || '#ffffff' }}>
                        <img src={logoUrl} alt={shop.name} className="max-w-full max-h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    ) : (
                    <h1 className="font-extrabold tracking-tight text-4xl md:text-6xl mb-6 text-white drop-shadow-md">
                        {shop.name}
                    </h1>
                    )}
                    
                    {shop.slogan && (
                    <p className="text-white/90 font-medium text-xl md:text-2xl tracking-wide mb-6 max-w-2xl drop-shadow-sm">
                        {shop.slogan}
                    </p>
                    )}
                    
                    {shop.description && (
                    <p className="text-white/70 text-[15px] md:text-[16px] max-w-2xl leading-relaxed mb-10 drop-shadow-sm">
                        {shop.description}
                    </p>
                    )}
                    
                    <button
                    onClick={() => handleBookClick(null)}
                    className="font-bold text-white px-10 py-4 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl text-[15px] uppercase tracking-widest"
                    style={{ background: `linear-gradient(135deg, ${primaryColor || '#2563eb'}, ${secondaryColor || '#1e40af'})` }}
                    >
                    {ctaText}
                    </button>
                </div>
            </section>

            {/* Custom Pages */}
            <div className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-24">
                {pages.filter((p: any) => p.isVisible).map((p: any) => (
                    <section key={p.id} id={p.id} className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 overflow-hidden w-full max-w-7xl mx-auto">
                        <h2 className="font-extrabold mb-10 text-2xl md:text-3xl text-gray-900 text-center tracking-tight" style={{ color: primaryColor }}>{p.title}</h2>
                        <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-gray-600 mx-auto" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
                    </section>
                ))}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6 text-xl">{shop.name}</h3>
                        <p className="text-gray-500 mb-6 text-[14px] leading-relaxed max-w-xs mx-auto md:mx-0">
                        {shop.description || 'Your trusted service provider.'}
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-widest">Contact Info</h4>
                        <ul className="space-y-4 text-gray-500 text-[14px]">
                        {shopAddress && (
                            <li className="flex items-start justify-center md:justify-start gap-3">
                            <span className="text-lg">📍</span>
                            <span>{shopAddress}</span>
                            </li>
                        )}
                        {shopPhone && (
                            <li className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-lg">📞</span>
                            <a href={`tel:${shopPhone}`} className="hover:text-gray-900 transition-colors">{shopPhone}</a>
                            </li>
                        )}
                        {shopEmail && (
                            <li className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-lg">✉️</span>
                            <a href={`mailto:${shopEmail}`} className="hover:text-gray-900 transition-colors">{shopEmail}</a>
                            </li>
                        )}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-widest">Follow Us</h4>
                        <div className="flex justify-center md:justify-start items-center flex-wrap gap-6 text-2xl">
                        {shopFB && <a href={shopFB} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>}
                        {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>}
                        {shopTW && <a href={shopTW} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>}
                        </div>
                    </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-[13px] font-medium tracking-wide">
                    &copy; {new Date().getFullYear()} {shop.name}. All rights reserved.
                    </div>
                </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
        </main>
    );
}
