'use client';

import Script from 'next/script';

export default function AIWidget({ shopId }: { shopId: string }) {
  // This component simply injects the lightweight vanilla JS widget onto the page.
  // The widget is completely self-contained in public/booking-widget.js
  return (
    <Script
      src="/booking-widget.js"
      strategy="afterInteractive"
      data-shop-id={shopId}
      data-api-url="/api/chat/booking"
    />
  );
}
