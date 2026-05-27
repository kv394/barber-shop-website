import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function MinimalTemplate({ ctx }: { ctx: any }) {
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
          <main className="min-h-screen overflow-x-hidden flex flex-col bg-[#fafafa] text-[#333333] font-sans relative">

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
            <header className="absolute w-full top-0 left-0 px-8 py-6 flex flex-wrap justify-between items-center z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-8 font-medium text-[13px] tracking-widest uppercase">
                        <a href="#" className="transition-opacity hover:opacity-60 text-gray-500">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="transition-opacity hover:opacity-60 text-gray-500">{p.title}</a>
                        ))}
                    </nav>
                )}
                <div className="ml-auto">
                    <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
                </div>
            </header>

            {/* Hero / Shop Info */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-20 flex flex-col items-center text-center border-b border-gray-200">
                {logoUrl ? (
                    <img src={logoUrl} alt={shop.name} className="h-28 object-contain mb-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                    <h1 className="font-light tracking-tight text-4xl mb-8" style={{ color: primaryColor }}>{shop.name}</h1>
                )}
                {shop.slogan && <p className="text-gray-900 font-medium text-lg tracking-wide mb-6">{shop.slogan}</p>}
                {shop.description && <p className="text-gray-500 text-[15px] max-w-2xl leading-relaxed">{shop.description}</p>}
                <button onClick={() => ctx.handleBookClick(ctx.shop.services?.[0])} 
                  className="mt-6 px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: ctx.primaryColor || '#111' }}>
                  {ctx.ctaText || 'Book Now'}
                </button>
                
                <div className="flex flex-wrap justify-center gap-8 mt-10 text-[13px] text-gray-400 font-medium uppercase tracking-widest">
                    {shopPhone && <a href={`tel:${shopPhone}`} className="hover:text-gray-800 transition-colors">📞 {shopPhone}</a>}
                    {shopAddress && <a href={`https://maps.google.com/?q=${encodeURIComponent(shopAddress)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">📍 {shopAddress}</a>}
                </div>
            </section>
    
            {/* Custom Pages */}
            {pages.filter((p: any) => p.isVisible).map((p: any) => (
                <section key={p.id} id={p.id} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-[60vh]">
                    <h2 className="font-light tracking-wide mb-16 text-center text-2xl text-gray-900" style={{ color: primaryColor }}>{p.title}</h2>
                    <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-7xl mx-auto text-gray-600 font-light leading-relaxed w-full" onBookClick={handleBookClick} reviews={reviews} templateType={templateType} />
                </section>
            ))}

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-16 text-center text-[12px] font-medium tracking-widest uppercase text-gray-400">
                 <p className="mb-4">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                 <div className="flex justify-center gap-6 text-lg">
                    {shopFB && <a href={shopFB} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">📘</a>}
                    {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">📸</a>}
                    {shopTW && <a href={shopTW} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">🐦</a>}
                 </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>

    );
}
