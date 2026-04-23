'use client';

import { useEffect } from 'react';

export default function BookingModalScript({ shopId }: { shopId: string }) {
  useEffect(() => {
    if (document.getElementById('booking-modal-script-injector')) return;

    const script = document.createElement('script');
    script.id = 'booking-modal-script-injector';
    script.src = `/booking-modal.js?v=${Date.now()}`;
    script.setAttribute('data-shop-id', shopId);
    script.async = true;
    
    document.body.appendChild(script);
  }, [shopId]);

  return null;
}
