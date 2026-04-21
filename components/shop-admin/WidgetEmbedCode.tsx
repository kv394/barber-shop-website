'use client';

import { useState } from 'react';

export default function WidgetEmbedCode({ shopId }: { shopId: string }) {
  const [position, setPosition] = useState('bottom-right');
  const [color, setColor] = useState('#000000');
  const [copied, setCopied] = useState(false);

  const scriptCode = `<script src="https://barbersaas.com/booking-widget.js" data-shop-id="${shopId}" data-position="${position}" data-color="${color}"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm mt-6 mb-6">
      <h2 className="font-bold text-crm-text mb-2 text-xl">AI Booking Widget Embed Code</h2>
      <p className="text-crm-muted mb-6 text-[13px]">
        Customize your booking widget and copy the code below. Paste it into the <code>&lt;body&gt;</code> of your external website.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-[13px] font-semibold text-crm-text mb-2">Widget Position</label>
          <select 
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full bg-crm-surface text-crm-text border border-crm-border rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-crm-accent"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-crm-text mb-2">Theme Color</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
            />
            <span className="text-crm-text text-[14px]">{color.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="bg-crm-surface p-4 rounded-lg border border-crm-border overflow-x-auto pr-24">
          <code className="text-crm-accent text-[13px] whitespace-nowrap">
            {scriptCode}
          </code>
        </div>
        <button
          onClick={copyToClipboard}
          className="absolute right-2 top-2 bottom-2 bg-crm-accent/10 hover:bg-crm-accent/20 text-crm-accent px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
}
