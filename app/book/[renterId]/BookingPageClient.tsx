'use client';;
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface RenterService {
 id: string;
 name: string;
 description: string | null;
 price: number;
 duration: number;
}

interface Renter {
 id: string;
 name: string | null;
 imageUrl: string | null;
 stripeConnectOnboarded: boolean;
 shop: { id: string; name: string; currency: string } | null;
 portfolioImages: { imageUrl: string }[];
}

type Step = 'service' | 'datetime' | 'info' | 'paying';

function formatTime(t: string) {
 const [h, m] = t.split(':').map(Number);
 const suffix = h >= 12 ? 'PM' : 'AM';
 const hour = h % 12 || 12;
 return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatDate(d: string) {
 return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
 weekday: 'long', month: 'long', day: 'numeric',
 });
}

function getNext14Days() {
 const days = [];
 for (let i = 0; i < 14; i++) {
 const d = new Date();
 d.setDate(d.getDate() + i);
 days.push(d.toISOString().split('T')[0]);
 }
 return days;
}

export default function BookingPageClient({
 renter,
 services,
}: {
 renter: Renter;
 services: RenterService[];
}) {
 const [step, setStep] = useState<Step>('service');
 const [selectedService, setSelectedService] = useState<RenterService | null>(null);
 const [selectedDate, setSelectedDate] = useState<string>(getNext14Days()[0]);
 const [selectedTime, setSelectedTime] = useState<string | null>(null);
 const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
 const [slotsLoading, setSlotsLoading] = useState(false);
 const [clientName, setClientName] = useState('');
 const [clientEmail, setClientEmail] = useState('');
 const [clientPhone, setClientPhone] = useState('');
 const [paying, setPaying] = useState(false);
 const [error, setError] = useState('');
 const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

 const days = getNext14Days();

 useEffect(() => {
 if (!selectedService || !selectedDate) return;
 setSlotsLoading(true);
 fetch(`/api/renter/${renter.id}/availability?date=${selectedDate}&duration=${selectedService.duration}`)
 .then(r => r.json())
 .then(data => setSlots(data.slots || []))
 .finally(() => setSlotsLoading(false));
 }, [selectedDate, selectedService, renter.id]);

 const handlePay = async () => {
 if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientEmail || !turnstileToken) return;
 setError('');
 setPaying(true);
 try {
 const res = await fetch(`/api/book/${renter.id}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 serviceId: selectedService.id,
 date: selectedDate,
 time: selectedTime,
 clientName,
 clientEmail,
 clientPhone,
 turnstileToken,
 }),
 });
 const data = await res.json();
 if (!res.ok) { setError(data.error || 'Something went wrong'); setPaying(false); return; }
 if (data.url) window.location.href = data.url;
 } catch {
 setError('Network error. Please try again.');
 setPaying(false);
 }
 };

 const currency = renter.shop?.currency || 'USD';
 const currencySymbol = currency === 'INR' ? '₹' : '$';

 return (
  <div className="min-h-screen bg-gradient-to-br from-[#0f0c09] via-[#1a1410] to-[#0a0806] text-white">
   {/* Hero Header */}
   <div className="relative overflow-hidden">
   {renter.portfolioImages[0] && (
   <div
   className="absolute inset-0 bg-cover bg-center opacity-15"
   style={{ backgroundImage: `url(${renter.portfolioImages[0].imageUrl})` }}
   />
   )}
   <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-[#0f0c09]" />
   <div className="relative z-10 px-4 pt-10 pb-8 max-w-lg mx-auto text-center">
   {/* Avatar */}
   <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-3xl overflow-hidden shadow-lg shadow-amber-500/20">
   {renter.imageUrl
   ? <Image src={renter.imageUrl} alt={renter.name || ''} />
   : <span>{(renter.name || '?')[0].toUpperCase()}</span>
   }
   </div>
   <h1 className="text-2xl font-black mb-1">{renter.name || 'Book an Appointment'}</h1>
   {renter.shop && <p className="text-amber-400/70 text-sm">{renter.shop.name}</p>}
   {!renter.stripeConnectOnboarded && (
   <p className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
   Online booking is not yet available. Contact this stylist directly.
   </p>
   )}
   </div>
   </div>
   {renter.stripeConnectOnboarded && (
   <div className="max-w-lg mx-auto px-4 pb-16 space-y-6">

   {/* Step indicator */}
   <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-amber-400/60 justify-center">
   {(['service', 'datetime', 'info'] as Step[]).map((s, i) => (
   <span key={s} className="flex items-center gap-2">
   <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
   step === s ? 'bg-amber-500 border-amber-500 text-crm-text' :
   (['service', 'datetime', 'info'].indexOf(step) > i ? 'bg-amber-500/30 border-amber-500/50 text-amber-400' : 'border-white/20 text-white/30')
   }`}>{i + 1}</span>
   {i < 2 && <span className="w-8 h-px bg-white/10" />}
   </span>
   ))}
   </div>

   {/* ── STEP 1: Service Picker ── */}
   {step === 'service' && (
   <div className="space-y-3">
   <h2 className="text-lg font-bold text-white/90">Choose a Service</h2>
   {services.length === 0 ? (
   <p className="text-white/40 italic text-sm">No services available yet.</p>
   ) : (
   services.map(s => (
   <button
   key={s.id}
   onClick={() => { setSelectedService(s); setStep('datetime'); }}
   className="w-full text-left bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 transition-all group"
   >
   <div className="flex justify-between items-start">
   <div>
   <p className="font-bold text-white group-hover:text-amber-300 transition-colors">{s.name}</p>
   {s.description && <p className="text-white/50 text-[13px] mt-0.5">{s.description}</p>}
   <p className="text-white/40 text-[12px] mt-1">{s.duration} min</p>
   </div>
   <span className="text-amber-400 font-black text-lg">{currencySymbol}{s.price.toFixed(0)}</span>
   </div>
   </button>
   ))
   )}
   </div>
   )}

   {/* ── STEP 2: Date + Time ── */}
   {step === 'datetime' && selectedService && (
   <div className="space-y-4">
   <div className="flex items-center gap-3">
   <button onClick={() => setStep('service')} className="text-white/40 hover:text-white text-sm">← Back</button>
   <h2 className="text-lg font-bold text-white/90">Pick a Date & Time</h2>
   </div>

   {/* Selected service summary */}
   <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex justify-between items-center">
   <span className="font-semibold text-amber-300">{selectedService.name}</span>
   <span className="text-amber-400 font-black">{currencySymbol}{selectedService.price.toFixed(0)}</span>
   </div>

   {/* Date Picker */}
   <div className="overflow-x-auto -mx-4 px-4">
   <div className="flex gap-2 pb-2 min-w-max">
   {days.map(d => {
   const dt = new Date(`${d}T12:00:00`);
   const isSelected = d === selectedDate;
   return (
   <button
   key={d}
   onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
   className={`flex flex-col items-center px-3 py-2.5 rounded-xl border text-[12px] transition-all min-w-[52px] ${
   isSelected
   ? 'bg-amber-500 border-amber-500 text-crm-text font-bold'
   : 'bg-white/5 border-white/10 text-white/60 hover:border-amber-500/40'
   }`}
   >
   <span className="font-bold uppercase text-[10px]">
   {dt.toLocaleDateString('en-US', { weekday: 'short' })}
   </span>
   <span className="text-lg font-black">{dt.getDate()}</span>
   </button>
   );
   })}
   </div>
   </div>

   {/* Time Slots */}
   <div>
   <p className="text-white/50 text-[11px] uppercase tracking-wider mb-2">{formatDate(selectedDate)}</p>
   {slotsLoading ? (
   <p className="text-white/30 text-sm">Loading slots…</p>
   ) : slots.length === 0 ? (
   <p className="text-white/30 text-sm italic">No availability on this day.</p>
   ) : (
   <div className="grid grid-cols-3 gap-2">
   {slots.map(slot => (
   <button
   key={slot.time}
   disabled={!slot.available}
   onClick={() => { if (slot.available) setSelectedTime(slot.time); }}
   className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
   !slot.available
   ? 'bg-white/3 border-white/5 text-white/20 cursor-not-allowed line-through'
   : selectedTime === slot.time
   ? 'bg-amber-500 border-amber-500 text-crm-text font-bold'
   : 'bg-white/5 border-white/10 text-white/70 hover:border-amber-500/40 hover:text-amber-300'
   }`}
   >
   {formatTime(slot.time)}
   </button>
   ))}
   </div>
   )}
   </div>

   <button
   onClick={() => setStep('info')}
   disabled={!selectedTime}
   className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-crm-text font-black rounded-2xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[15px]"
   >
   Continue →
   </button>
   </div>
   )}

   {/* ── STEP 3: Client Info ── */}
   {step === 'info' && selectedService && selectedTime && (
   <div className="space-y-4">
   <div className="flex items-center gap-3">
   <button onClick={() => setStep('datetime')} className="text-white/40 hover:text-white text-sm">← Back</button>
   <h2 className="text-lg font-bold text-white/90">Your Details</h2>
   </div>

   {/* Booking summary */}
   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-[13px]">
   <div className="flex justify-between">
   <span className="text-white/50">Service</span>
   <span className="font-semibold text-amber-300">{selectedService.name}</span>
   </div>
   <div className="flex justify-between">
   <span className="text-white/50">Date</span>
   <span className="font-semibold">{formatDate(selectedDate)}</span>
   </div>
   <div className="flex justify-between">
   <span className="text-white/50">Time</span>
   <span className="font-semibold">{formatTime(selectedTime)}</span>
   </div>
   <div className="flex justify-between border-t border-white/10 pt-2">
   <span className="text-white/50">Total</span>
   <span className="font-black text-amber-400 text-base">{currencySymbol}{selectedService.price.toFixed(2)}</span>
   </div>
   </div>

   <div className="space-y-3">
   <div>
   <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Full Name *</label>
   <input
   type="text" value={clientName} onChange={e => setClientName(e.target.value)}
   placeholder="Jane Smith"
   className="w-full bg-white/5 border border-white/15 focus:border-amber-500/60 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
   />
   </div>
   <div>
   <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Email *</label>
   <input
   type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
   placeholder="jane@example.com"
   className="w-full bg-white/5 border border-white/15 focus:border-amber-500/60 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
   />
   </div>
   <div>
   <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Phone (optional)</label>
   <input
   type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
   placeholder="+1 555 000 0000"
   className="w-full bg-white/5 border border-white/15 focus:border-amber-500/60 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
   />
   </div>
   </div>

   {error && (
   <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
   {error}
   </div>
   )}

   <div className="flex justify-center mt-4">
      <Turnstile 
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''} 
        onSuccess={(token: string) => setTurnstileToken(token)}
        options={{ theme: 'dark' }}
      />
    </div>

   <button
   onClick={handlePay}
   disabled={paying || !clientName || !clientEmail || !turnstileToken}
   className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-crm-text font-black rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
   >
   {paying ? (
   <><span className="animate-spin">⟳</span> Redirecting to payment…</>
   ) : (
   <>Pay {currencySymbol}{selectedService.price.toFixed(2)} & Confirm</>
   )}
   </button>

   <p className="text-center text-white/20 text-[11px]">
   🔒 Secured by Stripe. Your card info never touches our servers.
   </p>
   </div>
   )}
   </div>
   )}
  </div>
 );
}
