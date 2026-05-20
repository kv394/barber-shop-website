import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function SunsetTemplate({ ctx }: { ctx: any }) {
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
          <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-purple-900 via-black to-orange-900 text-crm-text font-sans relative">

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
  

  
            <div className="absolute w-full top-0 left-0 p-4 sm:p-6 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center z-50">
             {pages.filter((p: any) => p.isVisible).length > 0 ? (
                 <nav className="flex gap-4 sm:gap-6 bg-crm-surface px-4 sm:px-6 py-2 rounded-full backdrop-blur-md border border-status-pending/30 overflow-x-auto max-w-[calc(100vw-100px)] hide-scrollbar">
                    <a href="#" className="text-[13px] font-medium transition-colors whitespace-nowrap text-crm-muted hover:text-status-pending">Home</a>
                    {pages.filter((p: any) => p.isVisible).map((p: any) => (
                        <a key={p.id} href={`#${p.id}`} className="text-[13px] font-medium transition-colors whitespace-nowrap text-crm-muted hover:text-status-pending">{p.title}</a>
                    ))}
                 </nav>
             ) : (
                 <div />
             )}
             <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            </div>

            <div className="p-8 md:p-12 pt-24 md:pt-32">
                            <header className="text-center mb-16">
                {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-24 md:h-32 mx-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-4 text-4xl font-bold">{shop.name}</h1>}
                {shop.slogan && <p className="text-orange-300 font-medium tracking-wide mt-2 mb-4 text-sm">{shop.slogan}</p>}
                <p className="text-purple-200/70 text-[13px]">{shop.description}</p>
              </header>
    
              {pages.filter((p: any) => p.isVisible).map((p: any) => (

                <section key={p.id} id={p.id} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60vh]">
                    <div className="bg-crm-surface backdrop-blur-sm border border-status-pending/30 rounded-lg p-8 md:p-12">
                        <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400 mb-8 text-3xl font-bold">{p.title}</h1>
                        <CustomPageContent content={p.content || ""} shop={shop} className="prose prose-invert prose-lg max-w-none text-purple-200/80"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                    </div>
                </section>
            ))}
            </div>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>

    );
}
