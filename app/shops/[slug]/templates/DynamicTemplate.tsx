import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function DynamicTemplate({ ctx }: { ctx: any }) {
    const { 
        shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
        selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
        c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
        heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
        faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
        pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
        shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton 
    } = ctx;
    
    return (
            <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-surface text-crm-mutedrm-textrm-text font-sans relative" onClick={handleDynamicTemplateClick}>
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
  
                {authButton}
                {dynamicTemplateCss && <style dangerouslySetInnerHTML={{ __html: dynamicTemplateCss }} />}
                <div dangerouslySetInnerHTML={{ __html: dynamicTemplateHtml }} />
                
                {selectedService && (
                    <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
                )}
            </main>

    );
}
