'use client';;
import Image from 'next/image';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';

export default function MyBookingLinkClient({
 bookingUrl,
 renterId,
 isConnected,
}: {
 bookingUrl: string;
 renterId: string;
 isConnected: boolean;
}) {
 const [copied, setCopied] = useState(false);
 const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
 const [qrLoading, setQrLoading] = useState(false);
 const canvasRef = useRef<HTMLCanvasElement>(null);

 const copyLink = async () => {
 await navigator.clipboard.writeText(bookingUrl);
 setCopied(true);
 setTimeout(() => setCopied(false), 2500);
 };

 const generateQR = async () => {
 setQrLoading(true);
 try {
 const dataUrl = await QRCode.toDataURL(bookingUrl, {
 width: 300,
 margin: 2,
 color: { dark: '#1a1a1a', light: '#ffffff' },
 });
 setQrDataUrl(dataUrl);
 } finally {
 setQrLoading(false);
 }
 };

 const downloadQR = () => {
 if (!qrDataUrl) return;
 const a = document.createElement('a');
 a.href = qrDataUrl;
 a.download = `kutz-booking-qr-${renterId}.png`;
 a.click();
 };

 return (
  <div className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden">
   <div className="h-1 bg-gradient-to-r from-crm-primary via-amber-500/60 to-transparent" />
   <div className="p-6 space-y-5">
   <div>
   <h2 className="font-bold text-crm-text text-lg mb-1">Your Booking Link</h2>
   <p className="text-crm-muted text-[13px]">
   Share this link or print the QR code. Place it at your station — clients scan and book instantly.
   </p>
   </div>

   {/* URL display */}
   <div className="flex gap-2">
   <div className="flex-1 bg-crm-bg border border-crm-border rounded-xl px-4 py-3 text-[13px] text-crm-muted font-mono truncate select-all">
   {bookingUrl}
   </div>
   <button
   onClick={copyLink}
   className={`px-4 py-3 rounded-xl text-[13px] font-bold border transition-all ${
   copied
   ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
   : 'bg-crm-bg border-crm-border text-crm-text hover:border-crm-primary'
   }`}
   >
   {copied ? '✓ Copied' : 'Copy'}
   </button>
   </div>

   {!isConnected && (
   <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700 flex items-start gap-2">
   <span>⚠️</span>
   <span>Connect your Stripe account first — clients won&apos;t be able to pay until it&apos;s set up.</span>
   </div>
   )}

   {/* QR Code Section */}
   <div className="border-t border-crm-border pt-5">
   {!qrDataUrl ? (
   <button
   onClick={generateQR}
   disabled={qrLoading}
   className="flex items-center gap-2 px-4 py-2.5 border border-crm-border rounded-xl text-[13px] font-semibold text-crm-text hover:border-crm-primary transition-colors disabled:opacity-50"
   >
   {qrLoading ? '⟳ Generating…' : '📱 Generate QR Code'}
   </button>
   ) : (
   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
   <div className="bg-crm-surface p-4 rounded-2xl shadow-sm border border-crm-border inline-block">
   <Image src={qrDataUrl} alt="Booking QR Code" />
   </div>
   <div className="space-y-3">
   <div>
   <p className="font-bold text-crm-text mb-1">Print & Post</p>
   <p className="text-crm-muted text-[13px]">
   Download the QR code and print it. Place it at your booth — clients scan to book directly.
   </p>
   </div>
   <div className="flex gap-2">
   <button
   onClick={downloadQR}
   className="px-4 py-2 bg-crm-primary text-white rounded-xl text-[13px] font-bold hover:bg-crm-primary/90 transition-colors"
   >
   ⬇ Download QR
   </button>
   <button
   onClick={() => setQrDataUrl(null)}
   className="px-4 py-2 border border-crm-border rounded-xl text-[13px] text-crm-muted hover:text-crm-text transition-colors"
   >
   Regenerate
   </button>
   </div>
   </div>
   </div>
   )}
   </div>
   </div>
  </div>
 );
}
