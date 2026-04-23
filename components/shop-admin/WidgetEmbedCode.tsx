'use client';

import { useState } from 'react';

export default function WidgetEmbedCode({ shopId }: { shopId: string }) {
  const [copied, setCopied] = useState(false);

  const scriptCode = `<!-- 1. Add this script tag to your <head> or before closing </body> -->
<script src="https://barbersaas.com/booking-modal.js" data-shop-id="${shopId}"></script>

<!-- 2. Add this button anywhere on your page -->
<button id="barber-booking-btn" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer;">
  Book Appointment
</button>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm mt-6 mb-6">
      <h2 className="font-bold text-crm-text mb-2 text-xl">Booking Modal Embed Code</h2>
      <p className="text-crm-muted mb-6 text-[13px]">
        Copy the code below to embed the multi-step booking modal directly into your external website. The modal will open when the button is clicked.
      </p>

      <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
        <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
          <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
            {scriptCode}
          </pre>
        </div>
        <button
          onClick={copyToClipboard}
          className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
}
