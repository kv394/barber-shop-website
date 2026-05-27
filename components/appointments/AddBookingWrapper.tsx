'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';

const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), { ssr: false });

export default function AddBookingWrapper({ shopId, buttonClass }: { shopId: string, buttonClass?: string }) {
 const [isOpen, setIsOpen] = useState(false);
 const [services, setServices] = useState<any[]>([]);
 const [shopHours, setShopHours] = useState<any>(null);
 const [loading, setLoading] = useState(false);
 const [selectedService, setSelectedService] = useState<any>(null);
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 const handleClick = async () => {
 setIsOpen(true);
 if (services.length === 0 || !shopHours) {
 setLoading(true);
 try {
 const [servicesRes, hoursRes] = await Promise.all([
 fetch(`/api/shops/${shopId}/services`),
 fetch(`/api/shops/${shopId}/business-hours`)
 ]);
 const s = await servicesRes.json();
 const h = await hoursRes.json();
 setServices(s);
 setShopHours(h);
 } catch (err) {
 console.error('Failed to load booking data', err);
 } finally {
 setLoading(false);
 }
 }
 };

 const handleClose = () => {
 setIsOpen(false);
 setSelectedService(null);
 };

 const modalContent = isOpen ? (
 <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
 <div className="bg-crm-surface rounded-xl w-full max-w-lg border border-crm-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300" onClick={e => e.stopPropagation()}>
 <div className="flex justify-between items-center p-6 border-b border-crm-border relative">
 <h3 className="font-bold text-crm-primary text-xl">Select a Service</h3>
 <button onClick={handleClose} className="absolute top-6 right-6 text-crm-primary bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
 </div>
 <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
 {loading ? (
 <p className="text-crm-muted text-center py-8">Loading services...</p>
 ) : services.length > 0 ? (
 <div className="space-y-3">
 {services.map(s => (
 <button 
 key={s.id} 
 onClick={() => setSelectedService(s)}
 className="w-full text-left bg-crm-bg border border-crm-border hover:border-brand-gold hover:shadow-md transition-all rounded-lg p-4 flex justify-between items-center group"
 >
 <div>
 <h4 className="font-bold text-crm-text text-base group-hover:text-crm-accent transition-colors">{s.name}</h4>
 <p className="text-crm-muted text-[13px]">{s.duration} mins</p>
 </div>
 <div className="font-mono text-crm-accent font-bold">${s.price.toFixed(2)}</div>
 </button>
 ))}
 </div>
 ) : (
 <p className="text-crm-muted text-center py-8">No services available.</p>
 )}
 </div>
 </div>
 </div>
 ) : null;

 return (
 <>
 <button onClick={handleClick} className={buttonClass || "bg-crm-primary text-white font-bold px-4 py-2 rounded-lg text-[11px] sm:text-[13px] transition-colors whitespace-nowrap shadow-lg hover:opacity-90"}>
 + Add Booking
 </button>
 
 {mounted && !selectedService && isOpen && createPortal(modalContent, document.body)}
 {mounted && selectedService && shopHours && createPortal(
 <BookingModal 
 shopId={shopId} 
 service={selectedService} 
 onClose={handleClose} 
 shopHours={shopHours} 
 />,
 document.body
 )}
 </>
 );
}
