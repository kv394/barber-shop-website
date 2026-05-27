import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function NoirTemplate({ ctx }: { ctx: any }) {
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
          <main className="min-h-screen overflow-x-hidden flex flex-col bg-crm-surface text-crm-text font-serif relative">

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
  


            <div className="absolute top-6 left-8 z-50">
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex flex-wrap gap-4 md:gap-6 font-sans text-[11px] uppercase tracking-[0.2em]">
                        <a href="#" className="transition-colors text-crm-muted hover:text-crm-text">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="transition-colors text-crm-muted hover:text-crm-text">{p.title}</a>
                        ))}
                    </nav>
                )}
            </div>
            <div className="absolute top-6 right-8 z-50">
                <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            </div>
            
            <div className="p-8 md:p-16 pt-24 md:pt-32">
                              <header className="text-center mb-16">
                {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-black uppercase tracking-tighter text-2xl font-bold">{shop.name}</h1>}
                {shop.slogan && <p className="text-white font-bold uppercase tracking-[0.2em] mt-4 mb-2 text-sm">{shop.slogan}</p>}
                <p className="text-crm-muted mt-2 text-[13px]">{shop.description}</p>
              </header>
    
              {pages.filter((p: any) => p.isVisible).map((p: any) => (

                    <section key={p.id} id={p.id} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
                        <h1 className="font-black uppercase tracking-tighter mb-8 text-center text-2xl font-bold">{p.title}</h1>
                        <CustomPageContent content={p.content || ""} shop={shop} className="prose prose-invert prose-lg max-w-none text-crm-muted font-sans"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                    </section>
            ))}
            </div>

            

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>

    );
}
