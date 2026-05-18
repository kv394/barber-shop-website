'use client';

import CustomTemplate from './templates/CustomTemplate';import DynamicTemplate from './templates/DynamicTemplate';import SportyTemplate from './templates/SportyTemplate';import CorporateTemplate from './templates/CorporateTemplate';import NoirTemplate from './templates/NoirTemplate';import SunsetTemplate from './templates/SunsetTemplate';import EditorialTemplate from './templates/EditorialTemplate';import MinimalTemplate from './templates/MinimalTemplate';import ClassicTemplate from './templates/ClassicTemplate';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import { usePathname } from 'next/navigation';
import InteractiveReviewsSection from '@/components/reviews/InteractiveReviewsSection';


// Lazy-load the BookingModal component
const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), {
    ssr: false, // This component will only be rendered on the client side
    loading: () => <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center"><p className="text-crm-mutedrm-textrm-text text-[13px]">Loading...</p></div>
});

const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50"><p className="text-gray-500">Loading booking portal...</p></div>
});

/** Format the address object (or legacy string) into a single readable line */
import { formatAddress } from './components/utils';
import ReviewsSection from './components/ReviewsSection';
import CustomPageContent from './components/CustomPageContent';
export default function ClientPage({ shop, templateType, primaryColor, secondaryColor, sportRed, reviews = [], dynamicTemplateHtml, dynamicTemplateCss }: any) {
    const [selectedService, setSelectedService] = useState<any | null>(null);
    const pathname = usePathname() || '/';

    const handleBookClick = (service: any) => {
        if (typeof window !== 'undefined' && (window as any).BarberBooking) {
            (window as any).BarberBooking.open(service?.id);
        } else if (typeof window !== 'undefined' && (window as any).openBarberSaasChat) {
            (window as any).openBarberSaasChat(service?.name);
        } else {
            setSelectedService(service);
        }
    };

    // Click handler for dynamically generated templates where we can't easily attach React handlers to string HTML.
    const handleDynamicTemplateClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button') || target.closest('a');

        // Very basic heuristic: if it looks like a booking action, open the modal.
        if (button && (button.innerText.toLowerCase().includes('book') || button.innerText.toLowerCase().includes('appointment'))) {
            e.preventDefault();
            // Try to find a specific service based on data attribute, fallback to the first service
            const serviceId = button.getAttribute('data-service-id');
            const service = shop.services?.find((s: any) => s.id === serviceId) || shop.services?.[0];

            if (typeof window !== 'undefined' && (window as any).BarberBooking) {
                (window as any).BarberBooking.open(service?.id);
            } else if (typeof window !== 'undefined' && (window as any).openBarberSaasChat) {
                (window as any).openBarberSaasChat(service?.name);
            } else if (service) {
                setSelectedService(service);
            }
        }
    };
    // ── Normalised contact helpers (supports both old flat shape and new nested shape) ──
    
    
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
  
    const pages = c.pages || [];
    const fontFamily = c.fontFamily || 'Inter';
    const ctaText = c.ctaText || 'Book';
    const announcement = c.announcement;
    const heroVideoUrl = c.heroVideoUrl;
    const shopPhone   = c.contact?.phone   || c.phone   || '';
    const shopEmail   = c.contact?.email   || c.email   || '';
    const shopWebsite = c.contact?.website || c.website || '';
    const shopAddress = formatAddress(c.address);
    const shopFB      = c.contact?.facebook  || c.social?.facebook  || '';
    const shopIG      = c.contact?.instagram || c.social?.instagram || '';
    const shopTW      = c.contact?.twitter   || c.social?.twitter   || '';

    const normalizeImageUrl = (url: string | null): string | null => {
        if (!url) return null;
        const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
        if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
        const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
        if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
        const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
        if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
        return url;
    };

    const logoUrl     = normalizeImageUrl(c.logoUrl) || null;
    const heroImageUrl = normalizeImageUrl(c.heroImageUrl || c.bannerUrl) || null;

    

    // Auth button for client sign-in/out
    const authButton = (
        <div className="absolute top-6 right-6 z-50">
            <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </div>
    );

    

    const ctx = {
        shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
        selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
        c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
        heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
        faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
        pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
        shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton, pathname
    };
    if (templateType === 'custom') return <CustomTemplate ctx={ctx} />;
    if (dynamicTemplateHtml) return <DynamicTemplate ctx={ctx} />;
    if (templateType === 'sporty') return <SportyTemplate ctx={ctx} />;
    if (templateType === 'corporate') return <CorporateTemplate ctx={ctx} />;
    if (templateType === 'noir') return <NoirTemplate ctx={ctx} />;
    if (templateType === 'sunset') return <SunsetTemplate ctx={ctx} />;
    if (templateType === 'editorial') return <EditorialTemplate ctx={ctx} />;
    if (templateType === 'minimal') return <MinimalTemplate ctx={ctx} />;
    if (templateType === 'classic') return <ClassicTemplate ctx={ctx} />;
    
      // Default 'modern' template (Redesigned)
    return (
      <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gray-50 text-gray-800 font-sans relative">

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
          .text-crm-mutedrm-textrm-muted, .text-gray-500, .text-gray-600 { color: ${themeMuted} !important; }
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
        <header className="absolute w-full top-0 left-0 p-6 flex flex-wrap justify-between items-center z-50">
            {pages.filter((p: any) => p.isVisible).length > 0 && (
                <nav className="hidden md:flex gap-6 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-sm">
                    <a href="#" className="text-[13px] font-medium text-white/90 hover:text-white transition-colors uppercase tracking-wider">Home</a>
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <a key={p.id} href={`#${p.id}`} className="text-[13px] font-medium text-white/90 hover:text-white transition-colors uppercase tracking-wider">{p.title}</a>
                    ))}
                </nav>
            )}
            <div className="ml-auto">
                <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            </div>
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
          
          <div className="relative z-10 w-full max-w-7xl mx-auto text-crm-mutedrm-textenter flex flex-col items-center">
            {logoUrl ? (
              <div className="w-28 h-28 md:w-36 md:h-36 mb-8 rounded-full overflow-hidden border-4 shadow-2xl bg-white flex items-center justify-center p-2" style={{ borderColor: primaryColor || '#ffffff' }}>
                <img src={logoUrl} alt={shop.name} className="max-w-full max-h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ) : (
              <h1 className="font-extrabold tracking-tight text-crm-mutedrm-textxl md:text-crm-mutedrm-textxl mb-6 text-white drop-shadow-md">
                {shop.name}
              </h1>
            )}
            
            {shop.slogan && (
              <p className="text-white/90 font-medium text-xl md:text-crm-mutedrm-textxl tracking-wide mb-6 max-w-2xl drop-shadow-sm">
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
               <h2 className="font-extrabold mb-10 text-crm-mutedrm-textxl md:text-crm-mutedrm-textxl text-gray-900 text-crm-mutedrm-textenter tracking-tight" style={{ color: primaryColor }}>{p.title}</h2>
               <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-gray-600 mx-auto" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-crm-mutedrm-textenter md:text-left">
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
                <div className="flex justify-center md:justify-start gap-6 text-crm-mutedrm-textxl">
                  {shopFB && <a href={shopFB} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-transform hover:scale-110">📘</a>}
                  {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-transform hover:scale-110">📸</a>}
                  {shopTW && <a href={shopTW} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-transform hover:scale-110">🐦</a>}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-8 text-crm-mutedrm-textenter text-gray-400 text-[13px] font-medium tracking-wide">
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
