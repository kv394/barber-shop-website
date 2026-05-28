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
 
  let baseHtml = c.customHtml || '<div style="padding: 100px; text-align: center;">No custom HTML provided yet.</div>';
  // Replace the hardcoded demo shop IDs often found in templates with the actual shop ID
  baseHtml = baseHtml.replace(/cmn9kj24n0000lqzc7kcsmpst/g, shop.id);
  baseHtml = baseHtml.replace(/cmpnbqh1r0000iu54k0qnj2sl/g, shop.id);
  const injectorScript = `
<script>
  (function() {
    try {
      var origin = window.parent && window.parent.location.origin !== "null" ? window.parent.location.origin : window.location.origin;
      if (!origin || origin === 'null' || origin === 'about://' || origin.includes('about:')) origin = 'https://barber-shop-website-ashy.vercel.app';
      
      if (typeof window.KutzApp === 'undefined') {
        var s1 = document.createElement('script');
        s1.src = origin + '/kutzapp-sdk.js';
        document.head.appendChild(s1);
      }
      if (typeof window.BarberBooking === 'undefined') {
        var s2 = document.createElement('script');
        s2.src = origin + '/booking-modal.js';
        s2.setAttribute('data-shop-id', '${shop.id}');
        if ('${primaryColor}') s2.setAttribute('data-theme-color', '${primaryColor}');
        document.head.appendChild(s2);
      }
    } catch(e) { console.error('SDK injection failed', e); }
  })();
</script>
`;
  const htmlToRender = baseHtml.includes('</head>') 
    ? baseHtml.replace(/<\/head>/i, `${injectorScript}</head>`) 
    : injectorScript + baseHtml;

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
