'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Using Supabase Auth
import { useRouter } from 'next/navigation';
import { getThemeStyles, hexToRgba } from './ThemeStyles';
import { BookingSuccessScreen } from './BookingSuccessScreen';
import { BookingReviewScreen } from './BookingReviewScreen';

interface ServiceAddon {
 id: string;
 name: string;
 price: number;
 durationMin: number;
}

interface Service {
 id: string;
 name: string;
 price: number;
 duration: number;
 requiresVirtualConsultation?: boolean;
 addons?: ServiceAddon[];
}

interface Staff {
 id: string;
 name: string;
 workingHours: any;
}

interface BookedSlot {
 startTime: string;
 endTime: string;
 staffId: string;
}

interface ExistingClient {
 id: string;
 name: string | null;
 email: string;
 phone: string | null;
}

interface BookingModalProps {
 shopId: string;
 service: Service;
 onClose: () => void;
 shopHours: Record<string, { open: string; close: string } | null>;
 themeColor?: string;
 templateType?: string;
}

const ANY_STAFF_VALUE = '__any__';

// Helper to generate an .ics calendar file content
function generateICSContent(serviceName: string, startTime: Date, durationMins: number, staffName: string) {
 const pad = (n: number) => String(n).padStart(2, '0');
 const formatDate = (d: Date) =>
 `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
 const endTime = new Date(startTime.getTime() + durationMins * 60000);
 return [
 'BEGIN:VCALENDAR',
 'VERSION:2.0',
 'PRODID:-//ShopHub//Booking//EN',
 'BEGIN:VEVENT',
 `DTSTART:${formatDate(startTime)}`,
 `DTEND:${formatDate(endTime)}`,
 `SUMMARY:${serviceName}`,
 `DESCRIPTION:Appointment with ${staffName}`,
 'STATUS:CONFIRMED',
 'END:VEVENT',
 'END:VCALENDAR',
 ].join('\r\n');
}

export default function BookingModal({ shopId, service, onClose, shopHours, themeColor, templateType }: BookingModalProps) {
 const router = useRouter();
 const [authUser, setAuthUser] = useState<any>(null);
 const [isLoaded, setIsLoaded] = useState(false);

 const tStyles = getThemeStyles(templateType as any);
 const activeBg = themeColor ? hexToRgba(themeColor) : '#f9fafb';

 const isSignedIn = !!authUser;

 useEffect(() => {
 const { createClient } = require('@/utils/supabase/client');
 const supabase = createClient();
 supabase.auth.getUser().then(({ data }: any) => {
 setAuthUser(data?.user || null);
 setIsLoaded(true);
 });
 }, []);
 
 useEffect(() => {
 const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
 window.addEventListener('keydown', handleEsc);
 return () => window.removeEventListener('keydown', handleEsc);
 }, [onClose]);

 const [selectedDate, setSelectedDate] = useState<string>('');
 const [selectedTime, setSelectedTime] = useState<string>('');
 const [selectedStaff, setSelectedStaff] = useState<string>('');
 const [allStaff, setAllStaff] = useState<Staff[]>([]);
 const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [isBooking, setIsBooking] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const [showSummary, setShowSummary] = useState(false);
 const [bookingNotes, setBookingNotes] = useState('');

 const [isWalkIn, setIsWalkIn] = useState(false);
 const [clientName, setClientName] = useState('');
 const [clientEmail, setClientEmail] = useState('');
 const [clientPhone, setClientPhone] = useState('');

 // Existing client search for walk-ins
 const [clientSearchQuery, setClientSearchQuery] = useState('');
 const [clientSearchResults, setClientSearchResults] = useState<ExistingClient[]>([]);
 const [isSearchingClients, setIsSearchingClients] = useState(false);
 const [selectedExistingClient, setSelectedExistingClient] = useState<ExistingClient | null>(null);

 const [userRole, setUserRole] = useState<string | null>(null);
 const [userShopId, setUserShopId] = useState<string | null>(null);

 // Store the confirmed booking details for the success screen
 const [confirmedStaffName, setConfirmedStaffName] = useState('');
 const [confirmedStartTime, setConfirmedStartTime] = useState<Date | null>(null);

 const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
 
 const selectedAddons = useMemo(() => {
 if (!service.addons) return [];
 return service.addons.filter(a => selectedAddonIds.includes(a.id));
 }, [service.addons, selectedAddonIds]);

 const isVirtualConsultation = service.requiresVirtualConsultation;
 const effectiveServiceName = isVirtualConsultation ? "Virtual Consultation: " + service.name : service.name;
 const effectiveDuration = isVirtualConsultation ? 15 : service.duration;

 const totalDuration = useMemo(() => {
 return effectiveDuration + selectedAddons.reduce((sum, a) => sum + a.durationMin, 0);
 }, [effectiveDuration, selectedAddons]);

 const totalPrice = useMemo(() => {
 return service.price + selectedAddons.reduce((sum, a) => sum + a.price, 0);
 }, [service.price, selectedAddons]);

 // Fetch user role
 useEffect(() => {
 if (isSignedIn && authUser) {
 fetch(`/api/users/me`)
 .then(res => res.ok ? res.json() : null)
 .then(data => {
 if (data?.shopId === shopId && ['SHOP_ADMIN', 'STAFF', 'SITE_ADMIN'].includes(data.role)) {
 setUserRole(data.role);
 setUserShopId(data.shopId);
 }
 }).catch(() => {});
 }
 }, [isSignedIn, authUser, shopId]);

 useEffect(() => {
 setSelectedDate(new Date().toISOString().split('T')[0]);
 }, []);

 // Debounced client search for walk-ins
 useEffect(() => {
 if (!clientSearchQuery || clientSearchQuery.length < 2 || !isWalkIn) {
 setClientSearchResults([]);
 return;
 }
 const timer = setTimeout(async () => {
 setIsSearchingClients(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/clients/search?q=${encodeURIComponent(clientSearchQuery)}`);
 if (res.ok) {
 const data = await res.json();
 setClientSearchResults(data.slice(0, 5));
 }
 } catch { /* ignore */ } finally {
 setIsSearchingClients(false);
 }
 }, 300);
 return () => clearTimeout(timer);
 }, [clientSearchQuery, shopId, isWalkIn]);

 // Fetch staff + existing bookings when date changes
 useEffect(() => {
 if (!selectedDate) return;
 const controller = new AbortController();
 const fetchData = async () => {
 setIsLoading(true);
 setError(null);
 setSelectedStaff('');
 setSelectedTime('');
 try {
 const [staffRes, aptsRes] = await Promise.all([
 fetch(`/api/shops/${shopId}/staff?date=${selectedDate}`, { signal: controller.signal }),
 fetch(`/api/shops/${shopId}/appointments?date=${selectedDate}`, { signal: controller.signal }),
 ]);
 if (!staffRes.ok) throw new Error("Failed to fetch staff");
 const [staffData, aptsData] = await Promise.all([staffRes.json(), aptsRes.ok ? aptsRes.json() : []]);
 setAllStaff(staffData);
 setBookedSlots(aptsData);
 } catch (err: any) {
 if (err.name !== 'AbortError') setError(err.message);
 } finally {
 setIsLoading(false);
 }
 };
 fetchData();
 return () => controller.abort();
 }, [selectedDate, shopId]);

 // Helper: get working hours for a staff member on the selected date
 const getStaffHours = useCallback((staffMember: Staff) => {
 if (!selectedDate) return null;
 const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(selectedDate).getUTCDay()];
 
 // Check individual staff working hours first
 const individualHours = (staffMember.workingHours as any)?.[dayOfWeek];
 if (individualHours === null) { // Explicitly marked as day off
 return null;
 }
 if (individualHours) { // Custom hours set
 return individualHours;
 }

 // Fallback to shop hours
 const shopDayHours = shopHours?.[dayOfWeek];
 if (shopDayHours === null) { // Explicitly marked as day off for the shop
 return null;
 }
 if (shopDayHours) { // Shop hours set
 return shopDayHours;
 }

 // Default to 9 AM - 5 PM if no hours are explicitly set anywhere
 return { open: '09:00', close: '17:00' };
 }, [selectedDate, shopHours]);

 // Helper: check if a staff member is free at a given time
 const isStaffFreeAt = useCallback((staffId: string, timeStr: string) => {
 const [h, m] = timeStr.split(':').map(Number);
 const slotStart = new Date(`${selectedDate}T00:00:00Z`);
 slotStart.setUTCHours(h, m, 0, 0);
 const slotEnd = slotStart.getTime() + totalDuration * 60000;
 return !bookedSlots.some(b => {
 if (b.staffId !== staffId) return false;
 const bStart = new Date(b.startTime).getTime();
 const bEnd = new Date(b.endTime).getTime();
 return slotStart.getTime() < bEnd && slotEnd > bStart;
 });
 }, [selectedDate, totalDuration, bookedSlots]);

 // Compute all unique available time slots (union across all staff)
 const availableTimeSlots = useMemo(() => {
 if (!selectedDate || allStaff.length === 0) return [];
 const slotSet = new Set<string>();
 for (const staffMember of allStaff) {
 const hours = getStaffHours(staffMember);
 if (!hours) continue; // Staff member is not working on this day

 const [openH, openM] = hours.open.split(':').map(Number);
 const [closeH, closeM] = hours.close.split(':').map(Number);
 const start = new Date(`${selectedDate}T00:00:00Z`);
 start.setUTCHours(openH, openM, 0, 0);
 const end = new Date(`${selectedDate}T00:00:00Z`);
 end.setUTCHours(closeH, closeM, 0, 0);
 let cursor = new Date(start);
 while (cursor < end) {
 const timeStr = cursor.toUTCString().split(' ')[4].substring(0, 5);
 if (isStaffFreeAt(staffMember.id, timeStr)) {
 slotSet.add(timeStr);
 }
 cursor = new Date(cursor.getTime() + 30 * 60000);
 }
 }
 return Array.from(slotSet).sort();
 }, [selectedDate, allStaff, getStaffHours, isStaffFreeAt]);

 // Compute staff available at the selected time
 const staffAtSelectedTime = useMemo(() => {
 if (!selectedTime || allStaff.length === 0) return [];
 return allStaff.filter(s => {
 const hours = getStaffHours(s);
 if (!hours) return false; // Staff member is not working on this day
 
 const [h, m] = selectedTime.split(':').map(Number);
 const [openH, openM] = hours.open.split(':').map(Number);
 const [closeH, closeM] = hours.close.split(':').map(Number);
 const slotMins = h * 60 + m;
 const openMins = openH * 60 + openM;
 const closeMins = closeH * 60 + closeM;
 if (slotMins < openMins || slotMins >= closeMins) return false;
 return isStaffFreeAt(s.id, selectedTime);
 });
 }, [selectedTime, allStaff, getStaffHours, isStaffFreeAt]);

 // Resolve "Any available" staff to first free one
 const resolveStaffId = (): string | null => {
 if (selectedStaff === ANY_STAFF_VALUE) {
 return staffAtSelectedTime.length > 0 ? staffAtSelectedTime[0].id : null;
 }
 return selectedStaff || null;
 };

 const getStaffNameById = (id: string) => {
 if (id === ANY_STAFF_VALUE) return 'First Available';
 return allStaff.find(s => s.id === id)?.name || 'Staff';
 };

 const handleReviewBooking = () => {
 if (!selectedDate || !selectedTime || !selectedStaff) return;
 if (isWalkIn && !clientName.trim() && !selectedExistingClient) {
 setError("Client Name is required for walk-in bookings.");
 return;
 }
 setError(null);
 setShowSummary(true);
 };

 const handleBook = useCallback(async () => {
 const resolvedStaff = resolveStaffId();
 if (!selectedDate || !selectedTime || !resolvedStaff) return;

 setIsBooking(true);
 setError(null);

 try {
 const [hour, minute] = selectedTime.split(':').map(Number);
 const startDateTime = new Date(`${selectedDate}T00:00:00Z`);
 startDateTime.setUTCHours(hour, minute, 0, 0);

 setConfirmedStaffName(getStaffNameById(selectedStaff));
 setConfirmedStartTime(startDateTime);

 const response = await fetch(`/api/shops/${shopId}/appointments`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 serviceId: service.id,
 startTime: startDateTime.toISOString(),
 staffId: resolvedStaff,
 notes: bookingNotes.trim() || undefined,
 isWalkIn,
 clientName: isWalkIn ? (selectedExistingClient?.name || clientName.trim()) : undefined,
 clientEmail: isWalkIn ? (selectedExistingClient?.email || clientEmail.trim()) : undefined,
 clientPhone: isWalkIn ? clientPhone.trim() : undefined,
 existingClientId: selectedExistingClient?.id,
 addonIds: selectedAddonIds,
 })
 });

 if (!response.ok) {
 const data = await response.json();
 throw new Error(data.error || "Failed to book appointment");
 }

 setSuccess(true);
 } catch (err: any) {
 setError(err.message);
 setShowSummary(false);
 } finally {
 setIsBooking(false);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [selectedDate, selectedTime, selectedStaff, isWalkIn, clientName, clientEmail, clientPhone, bookingNotes, selectedExistingClient, shopId, service.id, staffAtSelectedTime, selectedAddonIds]);

 const handleAddToCalendar = () => {
 if (!confirmedStartTime) return;
 const ics = generateICSContent(effectiveServiceName, confirmedStartTime, effectiveDuration, confirmedStaffName);
 const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `booking-${service.name.replace(/\s+/g, '-').toLowerCase()}.ics`;
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 };

 const handleSelectExistingClient = (client: ExistingClient) => {
 setSelectedExistingClient(client);
 setClientName(client.name || '');
 setClientEmail(client.email);
 setClientPhone(client.phone || '');
 setClientSearchQuery('');
 setClientSearchResults([]);
 };

 const handleClearSelectedClient = () => {
 setSelectedExistingClient(null);
 setClientName('');
 setClientEmail('');
 setClientPhone('');
 };

 const formattedDate = selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';

 // ────────────── SUCCESS SCREEN ──────────────
 if (success) {
    return (
      <BookingSuccessScreen
        themeColor={themeColor}
        serviceName={effectiveServiceName}
        formattedDate={formattedDate}
        selectedTime={selectedTime}
        confirmedStaffName={confirmedStaffName}
        totalDuration={totalDuration}
        totalPrice={totalPrice}
        selectedAddons={selectedAddons}
        onClose={onClose}
        onAddToCalendar={handleAddToCalendar}
      />
    );
 }

 // ────────────── SUMMARY / REVIEW SCREEN ──────────────
 if (showSummary) {
    return (
      <BookingReviewScreen
        themeColor={themeColor}
        serviceName={effectiveServiceName}
        formattedDate={formattedDate}
        selectedTime={selectedTime}
        confirmedStaffName={confirmedStaffName}
        totalDuration={totalDuration}
        totalPrice={totalPrice}
        selectedAddons={selectedAddons}
        isWalkIn={isWalkIn}
        clientName={clientName}
        selectedExistingClient={selectedExistingClient}
        bookingNotes={bookingNotes}
        error={error}
        isBooking={isBooking}
        onClose={onClose}
        onEdit={() => setShowSummary(false)}
        onBook={handleBook}
      />
    );
 }

 // ────────────── MAIN BOOKING FORM ──────────────
 return (
 <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
 <div className="bg-crm-surface rounded-xl p-6 w-full max-w-md border border-crm-border shadow-2xl relative text-left max-h-[90vh] overflow-y-auto scrollbar-hide">
 <button onClick={onClose} aria-label="Close" className="absolute top-3 right-4 bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]" style={{ color: themeColor || "#111827" }}>✕</button>
 <h3 className="font-bold text-crm-primary mb-1 text-lg">Book Appointment</h3>
 <div className="text-crm-accent font-semibold mb-2 text-[13px]">{effectiveServiceName} <span className="text-crm-muted font-normal ml-2">({totalDuration} mins • ${totalPrice.toFixed(2)})</span></div>
 {isVirtualConsultation && <div className="text-status-info text-[12px] mt-1 mb-2 p-2 bg-status-info/10 rounded border border-status-info/20">This service requires a 15-minute virtual consultation before booking the full service.</div>}

 {service.addons && service.addons.length > 0 && (
 <div className="mb-6 p-3 bg-crm-bg rounded-lg border border-crm-border shadow-sm">
 <p className="text-crm-text text-[12px] font-semibold mb-2">Enhance your service:</p>
 <div className="space-y-2">
 {service.addons.map(addon => {
 const isSelected = selectedAddonIds.includes(addon.id);
 return (
 <label key={addon.id} className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-crm-primary/10 border-crm-primary/50' : 'bg-crm-surface border-crm-border hover:border-crm-primary/30'}`}>
 <div className="flex items-center gap-3">
 <input 
 type="checkbox" 
 checked={isSelected}
 onChange={(e) => {
 if (e.target.checked) setSelectedAddonIds([...selectedAddonIds, addon.id]);
 else setSelectedAddonIds(selectedAddonIds.filter(id => id !== addon.id));
 }}
 className="w-4 h-4 accent-crm-primary rounded border-crm-border"
 />
 <span className="text-crm-text text-[13px]">{addon.name}</span>
 </div>
 <span className="text-crm-muted text-[12px] whitespace-nowrap">
 +${addon.price.toFixed(2)} {addon.durationMin > 0 ? ` (+${addon.durationMin}m)` : ''}
 </span>
 </label>
 );
 })}
 </div>
 </div>
 )}

 {!isLoaded ? (
 <p className="text-crm-muted text-center py-8 text-[13px]">Loading...</p>
 ) : (
 <>
 {error && <p className="text-status-cancelled bg-status-cancelled/20 p-3 rounded mb-4 text-[13px]">{error}</p>}

 {/* Walk-in Toggle (staff only) */}
 {userRole && (
 <div className="mb-5 flex items-center gap-3">
 <label className="flex items-center gap-2 cursor-pointer text-[13px]">
 <input type="checkbox" checked={isWalkIn} onChange={(e) => { setIsWalkIn(e.target.checked); setSelectedExistingClient(null); setClientName(''); setClientEmail(''); setClientPhone(''); }} className="w-4 h-4 accent-crm-primary" />
 <span className="text-crm-text font-semibold">Walk-in Booking</span>
 </label>
 </div>
 )}

 {/* Walk-in Client Details */}
 {isWalkIn && (
 <div className="mb-5 space-y-3 bg-crm-bg rounded-lg border border-crm-border p-4">
 <p className="text-crm-text text-[12px] font-semibold mb-2">Client Details</p>
 {selectedExistingClient ? (
 <div className="flex items-center justify-between bg-crm-surface p-3 rounded border border-crm-border">
 <div>
 <p className="text-crm-text font-semibold text-[13px]">{selectedExistingClient.name}</p>
 <p className="text-crm-muted text-[12px]">{selectedExistingClient.email}</p>
 </div>
 <button onClick={handleClearSelectedClient} className="text-crm-muted hover:text-crm-text text-[12px]">✕ Clear</button>
 </div>
 ) : (
 <>
 <div className="relative">
 <input type="text" placeholder="Search existing client..." value={clientSearchQuery} onChange={(e) => setClientSearchQuery(e.target.value)} className={`${tStyles.input} text-[13px]`} />
 {isSearchingClients && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-crm-muted text-[11px]">Searching...</span>}
 {clientSearchResults.length > 0 && (
 <div className="absolute z-50 w-full mt-1 bg-crm-surface border border-crm-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
 {clientSearchResults.map(c => (
 <button key={c.id} onClick={() => handleSelectExistingClient(c)} className="w-full text-left px-3 py-2 hover:bg-crm-bg text-[13px] text-crm-text border-b border-crm-border last:border-0">
 {c.name || c.email} <span className="text-crm-muted text-[11px]">({c.email})</span>
 </button>
 ))}
 </div>
 )}
 </div>
 <input type="text" placeholder="Client Name *" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`${tStyles.input} text-[13px]`} />
 <input type="email" placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={`${tStyles.input} text-[13px]`} />
 <input type="tel" placeholder="Client Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`${tStyles.input} text-[13px]`} />
 </>
 )}
 </div>
 )}

 {/* Date Picker */}
 <div className="mb-5">
 <label className="block text-crm-text text-[12px] font-semibold mb-2">Select Date</label>
 <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setSelectedStaff(''); }} min={new Date().toISOString().split('T')[0]} className={`${tStyles.input} text-[13px]`} />
 </div>

 {/* Time Slots */}
 {selectedDate && (
 <div className="mb-5">
 <label className="block text-crm-text text-[12px] font-semibold mb-2">Select Time</label>
 {isLoading ? (
 <p className="text-crm-muted text-center py-4 text-[13px]">Loading availability...</p>
 ) : availableTimeSlots.length > 0 ? (
 <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
 {availableTimeSlots.map(time => (
 <button key={time} onClick={() => { setSelectedTime(time); setSelectedStaff(''); }} className={`p-2 text-[13px] rounded-lg border transition-colors ${selectedTime === time ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedTime === time ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}>
 {time}
 </button>
 ))}
 </div>
 ) : (
 <p className="text-crm-muted text-center py-4 text-[13px] bg-crm-bg rounded-lg">No available times on this date.</p>
 )}
 </div>
 )}

 {/* Staff Selection */}
 {selectedTime && (
 <div className="mb-5">
 <label className="block text-crm-text text-[12px] font-semibold mb-2">Select Staff</label>
 <div className="space-y-2">
 <button onClick={() => setSelectedStaff(ANY_STAFF_VALUE)} className={`w-full p-3 text-left text-[13px] rounded-lg border transition-colors ${selectedStaff === ANY_STAFF_VALUE ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === ANY_STAFF_VALUE ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}>
 Any Available
 </button>
 {staffAtSelectedTime.map(s => (
 <button key={s.id} onClick={() => setSelectedStaff(s.id)} className={`w-full p-3 text-left text-[13px] rounded-lg border transition-colors ${selectedStaff === s.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === s.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}>
 {s.name}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Notes */}
 {selectedStaff && (
 <div className="mb-5">
 <label className="block text-crm-text text-[12px] font-semibold mb-2">Notes (optional)</label>
 <textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} placeholder="Any special requests?" className={`${tStyles.input} text-[13px] min-h-[60px] resize-none`} />
 </div>
 )}

 {/* Review & Book Button */}
 {selectedDate && selectedTime && selectedStaff && (
 <button onClick={handleReviewBooking} className="bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors w-full text-[13px]">
 Review & Book
 </button>
 )}
 </>
 )}

 {/* Scroll Indicator */}
 <div className="sticky bottom-[-24px] pointer-events-none w-full flex justify-center py-2 bg-gradient-to-t from-crm-surface via-crm-surface/80 to-transparent mt-4">
 <div className="bg-crm-surface rounded-full shadow-sm border border-crm-border p-1 animate-bounce">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-crm-primary"><polyline points="6 9 12 15 18 9"></polyline></svg>
 </div>
 </div>
 </div>
 </div>
 );
}
