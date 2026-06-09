'use client';;
import Image from 'next/image';

import { useEffect } from 'react';

interface BookingModalScriptProps {
 shopId: string;
 themeColor?: string;
 secondaryColor?: string;
 templateType?: string;
 headingFont?: string;
 bodyFont?: string;
 colorTheme?: string;
}

export default function BookingModalScript({ shopId, themeColor, secondaryColor, templateType, headingFont, bodyFont, colorTheme }: BookingModalScriptProps) {
 useEffect(() => {
 // We recreate it if parameters change, but let's just update the script tag or use it
 if (document.getElementById('booking-modal-script-injector')) {
 document.getElementById('booking-modal-script-injector')?.remove();
 }

 const script = document.createElement('script');
 script.id = 'booking-modal-script-injector';
 script.src = `/booking-modal.js?v=1.0.1`;
 script.setAttribute('data-shop-id', shopId);
 if (themeColor) script.setAttribute('data-theme-color', themeColor);
 if (secondaryColor) script.setAttribute('data-secondary-color', secondaryColor);
 if (templateType) script.setAttribute('data-template-type', templateType);
 if (headingFont) script.setAttribute('data-heading-font', headingFont);
 if (bodyFont) script.setAttribute('data-body-font', bodyFont);
 if (colorTheme) script.setAttribute('data-color-theme', colorTheme);
 script.async = true;
 
 document.body.appendChild(script);
 }, [shopId, themeColor, secondaryColor, templateType, headingFont, bodyFont, colorTheme]);

 return null;
}
