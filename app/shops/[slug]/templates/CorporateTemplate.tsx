import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function CorporateTemplate({ ctx }: { ctx: any }) {
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
          <main className="min-h-screen overflow-x-hidden flex flex-col bg-crm-bg text-crm-text font-sans relative">

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
  


            <header className="bg-crm-surface shadow-md relative z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4 overflow-x-auto hide-scrollbar">
                {logoUrl ? <img src={logoUrl} alt={shop.name} className="h-10 shrink-0 mr-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <h1 className="font-bold shrink-0 mr-6 text-2xl font-bold" style={{ color: primaryColor }}>{shop.name}</h1>}
                {pages.filter((p: any) => p.isVisible).length > 0 && (
                    <nav className="flex gap-4 sm:gap-6 shrink-0 mr-6">
                        <a href="#" className="text-[13px] font-bold transition-colors text-crm-muted hover:text-crm-text">Home</a>
                        {pages.filter((p: any) => p.isVisible).map((p: any) => (
                            <a key={p.id} href={`#${p.id}`} className="text-[13px] font-bold transition-colors text-crm-muted hover:text-crm-text">{p.title}</a>
                        ))}
                    </nav>
                )}
                <div className="relative shrink-0">
                    <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
                </div>
              </div>
            </header>

                        <section className="bg-crm-surface relative bg-cover bg-center overflow-hidden" style={{ backgroundImage: heroImageUrl && !heroVideoUrl ? `url(${heroImageUrl})` : undefined }}>
        {heroVideoUrl && (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        )}
        <div className={(heroImageUrl || heroVideoUrl) ? "absolute inset-0 z-0 hero-overlay" : "z-0"} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
                    <h2 className="font-extrabold text-crm-text mb-4 text-xl font-bold">{shop.slogan || shop.description}</h2>
                    
                </div>
            </section>
    
            {pages.filter((p: any) => p.isVisible).map((p: any) => (

                <section key={p.id} id={p.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">
                    <h1 className="font-bold text-crm-text mb-8 text-2xl font-bold" style={{ color: primaryColor }}>{p.title}</h1>
                    <CustomPageContent content={p.content || ""} shop={shop} themeColor={primaryColor} className="prose prose-lg max-w-none text-crm-text"  onBookClick={handleBookClick}  reviews={reviews}  templateType={templateType} />
                </section>
            ))}

            <footer className="bg-crm-surface text-crm-text">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="font-bold mb-4 text-lg font-bold">{shop.name}</h3>
                    {shopAddress && <p className="text-crm-muted text-[13px]">{shopAddress}</p>}
                  </div>
                  <div>
                    <h4 className="font-bold mb-4 text-base font-semibold">Contact</h4>
                    {shopPhone && <p className="text-crm-muted text-[13px]">{shopPhone}</p>}
                    {shopEmail && <p className="text-crm-muted text-[13px]">{shopEmail}</p>}
                  </div>
                  <div>
                    <h4 className="font-bold mb-4 text-base font-semibold">Follow Us</h4>
                    <div className="flex gap-4">
                      {shopFB && <a href={shopFB} className="text-crm-muted hover:text-crm-text">Facebook</a>}
                      {shopIG && <a href={shopIG.startsWith('http') ? shopIG : `https://instagram.com/${shopIG.replace('@','')}`} className="text-crm-muted hover:text-crm-text">Instagram</a>}
                      {shopTW && <a href={shopTW} className="text-crm-muted hover:text-crm-text">Twitter</a>}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-crm-muted text-[13px]">
                  <p className="text-[13px]">&copy; {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
                </div>
              </div>
            </footer>

            {selectedService && (
                <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
            )}
          </main>

    );
}
