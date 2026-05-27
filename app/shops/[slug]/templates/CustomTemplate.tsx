import React from 'react';
import dynamic from 'next/dynamic';
import ReviewsSection from '../components/ReviewsSection';
import CustomPageContent from '../components/CustomPageContent';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });
const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), { ssr: false });

export default function CustomTemplate({ ctx }: { ctx: any }) {
 const { 
 shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
 selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
 c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
 heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
 faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
 pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
 shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton 
 } = ctx;
 
 const htmlToRender = c.customHtml || '<div style="padding: 100px; text-align: center;">No custom HTML provided yet.</div>';

 return (
 <div style={{ width: '100vw', height: '100dvh', position: 'relative' }}>
 <iframe
 srcDoc={htmlToRender}
 style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
 title={`${shop.name} Custom Landing Page`}
 />
 </div>
 );
}
