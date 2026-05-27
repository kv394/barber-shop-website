import React from 'react';
import dynamic from 'next/dynamic';
import DOMPurify from 'isomorphic-dompurify';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

function sanitizeCss(css: string): string {
 return css
 .replace(/expression\s*\(/gi, '')
 .replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(')
 .replace(/behavior\s*:/gi, '')
 .replace(/@import\b/gi, '');
}

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
 <main className="min-h-screen overflow-x-hidden flex flex-col bg-crm-surface text-crm-text relative" onClick={handleDynamicTemplateClick}>

 {authButton}
 {dynamicTemplateCss && <style dangerouslySetInnerHTML={{ __html: sanitizeCss(dynamicTemplateCss) }} />}
 <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dynamicTemplateHtml) }} />
 
 {selectedService && (
 <BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />
 )}
 </main>

 );
}
