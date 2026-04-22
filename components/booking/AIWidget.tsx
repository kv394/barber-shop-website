'use client';

import { useEffect } from 'react';

export default function AIWidget({ shopId }: { shopId: string }) {
  // This component simply injects the lightweight vanilla JS widget onto the page.
  // The widget is completely self-contained in public/booking-widget.js
  
  useEffect(() => {
    // We add a unique query param to bypass any browser cache or React deduplication
    // Check if it already exists to prevent duplicate injections
    if (document.getElementById('booking-widget-script')) return;

    const script = document.createElement('script');
    script.id = 'booking-widget-script';
    // Use Date.now() to forcefully break the browser cache and ensure the newest script loads
    script.src = `/booking-widget.js?v=${Date.now()}`;
    script.setAttribute('data-shop-id', shopId);
    script.setAttribute('data-api-url', '/api/chat/booking');
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Optional: Remove script on unmount if needed, 
      // but usually we want the widget to persist across the shop page.
    };
  }, [shopId]);

  return null;
}
