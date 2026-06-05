'use client';;
import Image from 'next/image';

import { useState } from 'react';

export default function CopyBookingLinkCTA({ url, text = "Copy Booking Link" }: { url: string, text?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="px-6 py-2.5 bg-crm-primary text-white rounded-xl font-bold hover:bg-crm-primary/90 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
    >
      <span>{copied ? '✅' : '🔗'}</span>
      {copied ? 'Copied!' : text}
    </button>
  );
}
