'use client';

import { useState } from 'react';

export default function WidgetEmbedCode({ shopId }: { shopId: string }) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedButton, setCopiedButton] = useState(false);

  const scriptCode = `<script src="https://barbersaas.com/booking-modal.js" data-shop-id="${shopId}"></script>`;
  const buttonCode = `<button id="barber-booking-btn" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 5px; cursor: pointer;">
  Book Appointment
</button>`;

  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm mt-6 mb-6">
      <h2 className="font-bold text-crm-text mb-2 text-xl">Booking Modal Embed Code</h2>
      <p className="text-crm-muted mb-6 text-[13px]">
        Embed the multi-step booking modal directly into your external website (WordPress, Webflow, Squarespace, etc.). Follow these two simple steps:
      </p>

      <div className="mb-6">
        <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 1: Add the Script Tag</h3>
        <p className="text-crm-muted mb-3 text-[13px]">Add this script tag to your <code>&lt;head&gt;</code> or right before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
        <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
          <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
            <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
              {scriptCode}
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(scriptCode, setCopiedScript)}
            className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
          >
            {copiedScript ? 'Copied!' : 'Copy Script'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-crm-text mb-2 text-[14px]">Step 2: Add the Booking Button</h3>
        <p className="text-crm-muted mb-3 text-[13px]">Place this button anywhere on your page. The modal will open when the button is clicked. <br/><em>Note: The button MUST have the <code>id="barber-booking-btn"</code> for it to work.</em></p>
        <div className="flex items-start gap-4 bg-crm-surface p-4 rounded-lg border border-crm-border relative">
          <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
            <pre className="text-crm-accent text-[13px] whitespace-pre-wrap font-mono">
              {buttonCode}
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(buttonCode, setCopiedButton)}
            className="shrink-0 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-2 rounded-md text-[13px] font-semibold transition-colors flex items-center justify-center min-w-[110px] absolute top-4 right-4"
          >
            {copiedButton ? 'Copied!' : 'Copy Button'}
          </button>
        </div>
      </div>
    </div>
  );
}
