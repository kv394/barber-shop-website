'use client';

import { useEffect } from 'react';

export default function BookingModalScript({ shopId, themeColor, templateType }: { shopId: string, themeColor?: string, templateType?: string }) {
  useEffect(() => {
    // We recreate it if parameters change, but let's just update the script tag or use it
    if (document.getElementById('booking-modal-script-injector')) {
        document.getElementById('booking-modal-script-injector')?.remove();
    }

    const script = document.createElement('script');
    script.id = 'booking-modal-script-injector';
    script.src = `/booking-modal.js?v=${Date.now()}`;
    script.setAttribute('data-shop-id', shopId);
    if (themeColor) script.setAttribute('data-theme-color', themeColor);
    if (templateType) script.setAttribute('data-template-type', templateType);
    script.async = true;
    
    document.body.appendChild(script);
  }, [shopId, themeColor, templateType]);

  return null;
}
