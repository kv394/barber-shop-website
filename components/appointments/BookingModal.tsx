'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Using Supabase Auth
import { useRouter } from 'next/navigation';

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

export default function BookingModal({ shopId, service, onClose, shopHours }: BookingModalProps) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isSignedIn = !!authUser;

  useEffect(() => {
    const { createClient } = require('@/utils/supabase/client');
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      setAuthUser(data?.user || null);
      setIsLoaded(true);
    });
  }, []);
  
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

  const totalDuration = useMemo(() => {
    return service.duration + selectedAddons.reduce((sum, a) => sum + a.durationMin, 0);
  }, [service.duration, selectedAddons]);

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

  const handleDone = () => {
    if (userRole && userShopId) {
      router.push(`/shop/${userShopId}/bookings`);
    } else {
      onClose();
    }
  };

  const handleAddToCalendar = () => {
    if (!confirmedStartTime) return;
    const ics = generateICSContent(service.name, confirmedStartTime, service.duration, confirmedStaffName);
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

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const formattedDate = selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // ────────────── SUCCESS SCREEN ──────────────
  if (success) {
      return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-crm-surface rounded-xl p-8 max-w-md w-full border border-status-confirmed shadow-2xl text-center relative">
                <button onClick={onClose} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="font-bold text-crm-primary mb-2 text-lg">Booking Confirmed!</h3>
                <p className="text-crm-muted mb-2 text-[13px]">The appointment for <span className="text-crm-accent font-semibold">{service.name}</span> has been scheduled.</p>
                {confirmedStartTime && (
                  <div className="bg-crm-surface rounded-lg p-4 mb-6 border border-crm-border shadow-sm text-[13px] text-left space-y-1">
                    <p className="text-crm-muted text-[13px]">📅 <span className="text-crm-text">{formattedDate}</span></p>
                    <p className="text-crm-muted text-[13px]">🕐 <span className="text-crm-text">{selectedTime}</span></p>
                    <p className="text-crm-muted text-[13px]">💈 <span className="text-crm-text">{confirmedStaffName}</span></p>
                    <p className="text-crm-muted text-[13px]">⏱️ <span className="text-crm-text">{totalDuration} mins</span></p>
                    <p className="text-crm-muted text-[13px]">💰 <span className="text-crm-text">${totalPrice.toFixed(2)}</span></p>
                    {selectedAddons.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-crm-border">
                        <p className="text-crm-muted text-[12px] mb-1">Add-ons:</p>
                        <ul className="pl-4 list-disc text-crm-text text-[12px]">
                          {selectedAddons.map(a => <li key={a.id}>{a.name}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={handleAddToCalendar} className="border border-crm-border shadow-sm text-crm-text px-5 py-2 rounded-lg hover:bg-crm-surface transition-colors text-[13px] font-semibold flex items-center justify-center gap-2">
                    📅 Add to Calendar
                  </button>
                </div>
            </div>
        </div>
      )
  }

  // ────────────── SUMMARY / REVIEW SCREEN ──────────────
  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-crm-surface rounded-xl p-6 w-full max-w-md border border-crm-border shadow-sm shadow-2xl relative text-left">
          <button onClick={() => setShowSummary(false)} className="absolute top-4 left-4 text-crm-muted hover:text-crm-text bg-crm-surface rounded-full w-8 h-8 flex items-center justify-center z-10">←</button>
          <button onClick={onClose} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
          <h3 className="font-bold text-crm-primary mb-1 text-lg text-center mt-2">Review Your Booking</h3>
          <p className="text-crm-muted mb-5 text-[13px] text-center">Please confirm the details below.</p>

          {error && <p className="text-status-cancelled bg-status-cancelled/20 p-3 rounded mb-4 text-[13px]">{error}</p>}

          <div className="bg-crm-surface rounded-lg border border-crm-border shadow-sm divide-y divide-white/10 mb-6">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Service</span>
              <span className="text-crm-text font-semibold">{service.name}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Date</span>
              <span className="text-crm-text">{formattedDate}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Time</span>
              <span className="text-crm-text">{selectedTime}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Staff</span>
              <span className="text-crm-text">{getStaffNameById(selectedStaff)}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Duration</span>
              <span className="text-crm-text">{totalDuration} mins</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Price</span>
              <span className="text-crm-accent font-bold text-lg">${totalPrice.toFixed(2)}</span>
            </div>
            {selectedAddons.length > 0 && (
              <div className="p-4 bg-crm-bg border-y border-crm-border">
                <span className="text-crm-muted text-[13px] block mb-2">Selected Add-Ons</span>
                <ul className="space-y-1">
                  {selectedAddons.map(a => (
                    <li key={a.id} className="text-crm-text text-[13px] flex justify-between">
                      <span>+ {a.name}</span>
                      <span>${a.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isWalkIn && (clientName || selectedExistingClient) && (
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
                <span className="text-crm-muted text-[13px]">Client</span>
                <span className="text-crm-text">{selectedExistingClient?.name || clientName}</span>
              </div>
            )}
            {bookingNotes && (
              <div className="p-4">
                <span className="text-crm-muted text-[13px] block mb-1">Notes</span>
                <span className="text-crm-text text-[13px]">{bookingNotes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowSummary(false)} className="flex-1 border border-crm-border shadow-sm text-crm-text font-semibold py-3 rounded-lg hover:bg-crm-surface transition-colors">
              Edit
            </button>
            <button onClick={handleBook} disabled={isBooking} className="flex-1 bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50">
              {isBooking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                  Booking...
                </span>
              ) : 'Confirm & Book'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────── MAIN BOOKING FORM ──────────────
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-crm-surface rounded-xl p-6 w-full max-w-md border border-crm-border shadow-sm shadow-2xl relative text-left max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button onClick={onClose} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
        <h3 className="font-bold text-crm-primary mb-1 text-lg">Book Appointment</h3>
        <p className="text-crm-accent font-semibold mb-2 text-[13px]">{service.name} <span className="text-crm-muted font-normal ml-2">({totalDuration} mins • ${totalPrice.toFixed(2)})</span></p>

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
            <div className="text-center py-8 bg-crm-surface rounded-lg border border-crm-border shadow-sm flex flex-col items-center">
                <div className="text-5xl mb-4">🤖</div>
                <h4 className="font-bold text-crm-text text-lg mb-2">Book with our AI Assistant!</h4>
                <p className="text-crm-muted mb-6 text-[14px] max-w-xs leading-relaxed">
                   We've upgraded our booking experience. Please close this window and use the chatbot widget in the bottom right corner to easily schedule your appointment.
                </p>
                <button onClick={onClose} className="bg-crm-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors inline-block text-center w-full max-w-xs shadow-md hover:shadow-lg">
                  Got it, close this window
                </button>
            </div>
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
