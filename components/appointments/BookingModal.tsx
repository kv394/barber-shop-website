'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Using Supabase Auth
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
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
    const slotEnd = slotStart.getTime() + service.duration * 60000;
    return !bookedSlots.some(b => {
      if (b.staffId !== staffId) return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return slotStart.getTime() < bEnd && slotEnd > bStart;
    });
  }, [selectedDate, service.duration, bookedSlots]);

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
  }, [selectedDate, selectedTime, selectedStaff, isWalkIn, clientName, clientEmail, clientPhone, bookingNotes, selectedExistingClient, shopId, service.id, staffAtSelectedTime]);

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
        <div className="fixed inset-0 bg-botanical-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-botanical-surface rounded-xl p-8 max-w-md w-full border border-status-confirmed shadow-2xl text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="font-bold text-botanical-text mb-2 text-2xl md:text-3xl">Booking Confirmed!</h3>
                <p className="text-botanical-muted mb-2 text-base md:text-lg">The appointment for <span className="text-botanical-accent font-semibold">{service.name}</span> has been scheduled.</p>
                {confirmedStartTime && (
                  <div className="bg-botanical-surface rounded-lg p-4 mb-6 border border-botanical-border shadow-sm text-sm text-left space-y-1">
                    <p className="text-botanical-muted text-base md:text-lg">📅 <span className="text-botanical-text">{formattedDate}</span></p>
                    <p className="text-botanical-muted text-base md:text-lg">🕐 <span className="text-botanical-text">{selectedTime}</span></p>
                    <p className="text-botanical-muted text-base md:text-lg">💈 <span className="text-botanical-text">{confirmedStaffName}</span></p>
                    <p className="text-botanical-muted text-base md:text-lg">💰 <span className="text-botanical-text">${service.price.toFixed(2)}</span></p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={handleAddToCalendar} className="border border-botanical-border shadow-sm text-botanical-text px-5 py-2 rounded-lg hover:bg-botanical-surface transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                    📅 Add to Calendar
                  </button>
                  <button onClick={handleDone} className="bg-botanical-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors">
                    {userRole ? 'Go to Bookings' : 'Done'}
                  </button>
                </div>
            </div>
        </div>
      )
  }

  // ────────────── SUMMARY / REVIEW SCREEN ──────────────
  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-botanical-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-botanical-surface rounded-xl p-6 w-full max-w-md border border-botanical-border shadow-sm shadow-2xl relative text-left">
          <button onClick={() => setShowSummary(false)} className="absolute top-4 right-4 text-botanical-muted hover:text-botanical-text bg-botanical-surface rounded-full w-8 h-8 flex items-center justify-center z-10">←</button>
          <h3 className="font-bold text-botanical-text mb-1 text-2xl md:text-3xl">Review Your Booking</h3>
          <p className="text-botanical-muted mb-5 text-base md:text-lg">Please confirm the details below.</p>

          {error && <p className="text-status-cancelled bg-status-cancelled/20 p-3 rounded mb-4 text-base md:text-lg">{error}</p>}

          <div className="bg-botanical-surface rounded-lg border border-botanical-border shadow-sm divide-y divide-white/10 mb-6">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-botanical-muted text-sm">Service</span>
              <span className="text-botanical-text font-semibold">{service.name}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-botanical-muted text-sm">Date</span>
              <span className="text-botanical-text">{formattedDate}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-botanical-muted text-sm">Time</span>
              <span className="text-botanical-text">{selectedTime}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-botanical-muted text-sm">Staff</span>
              <span className="text-botanical-text">{getStaffNameById(selectedStaff)}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-botanical-muted text-sm">Duration</span>
              <span className="text-botanical-text">{service.duration} mins</span>
            </div>
            {/* Price is now calculated on the server */}
            {/* <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-botanical-muted text-sm">Price</span>
              <span className="text-botanical-accent font-bold text-lg">${service.price.toFixed(2)}</span>
            </div> */}
            {isWalkIn && (clientName || selectedExistingClient) && (
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
                <span className="text-botanical-muted text-sm">Client</span>
                <span className="text-botanical-text">{selectedExistingClient?.name || clientName}</span>
              </div>
            )}
            {bookingNotes && (
              <div className="p-4">
                <span className="text-botanical-muted text-sm block mb-1">Notes</span>
                <span className="text-botanical-text text-sm">{bookingNotes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowSummary(false)} className="flex-1 border border-botanical-border shadow-sm text-botanical-text font-semibold py-3 rounded-lg hover:bg-botanical-surface transition-colors">
              Edit
            </button>
            <button onClick={handleBook} disabled={isBooking} className="flex-1 bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50">
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
    <div className="fixed inset-0 bg-botanical-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-botanical-surface rounded-xl p-6 w-full max-w-md border border-botanical-border shadow-sm shadow-2xl relative text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-botanical-muted hover:text-botanical-text bg-botanical-surface rounded-full w-8 h-8 flex items-center justify-center z-10">✕</button>
        <h3 className="font-bold text-botanical-text mb-1 text-2xl md:text-3xl">Book Appointment</h3>
        <p className="text-botanical-accent font-semibold mb-6 text-base md:text-lg">{service.name} <span className="text-botanical-muted font-normal ml-2">({service.duration} mins • ${service.price})</span></p>

        {!isLoaded ? (
             <p className="text-botanical-muted text-center py-8 text-base md:text-lg">Loading...</p>
        ) : !isSignedIn ? (
            <div className="text-center py-6 bg-botanical-surface rounded-lg border border-botanical-border shadow-sm flex flex-col items-center">
                <p className="text-botanical-muted mb-4 text-base md:text-lg">Please sign in or create an account to book an appointment.</p>
                <a href={`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`} className="bg-botanical-primary text-white px-6 py-2 rounded font-bold hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors inline-block text-center">
                  Sign In to Book
                </a>
            </div>
        ) : (
            <div className="space-y-6">
                {error && <p className="text-status-cancelled bg-status-cancelled/20 p-3 rounded text-base md:text-lg">{error}</p>}
                
                {/* ──── Walk-in Section (Staff/Admin only) ──── */}
                {userRole && (
                    <div className="bg-status-info/20 border border-status-info/30 p-4 rounded-lg space-y-3">
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="walkInToggle" checked={isWalkIn} onChange={(e) => { setIsWalkIn(e.target.checked); handleClearSelectedClient(); }} className="w-4 h-4 accent-brand-gold bg-botanical-surface border-botanical-border rounded" />
                            <label htmlFor="walkInToggle" className="font-semibold text-status-info cursor-pointer text-sm">I am booking on behalf of a client</label>
                        </div>
                        {isWalkIn && (
                            <div className="space-y-3 pt-2">
                                {/* Existing client search */}
                                {!selectedExistingClient ? (
                                  <>
                                    <div className="relative">
                                      <label className="block text-botanical-muted mb-1 text-sm">Search Existing Clients</label>
                                      <input
                                        type="text"
                                        placeholder="Type name or email..."
                                        value={clientSearchQuery}
                                        onChange={(e) => setClientSearchQuery(e.target.value)}
                                        className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-sm text-botanical-text focus:outline-none focus:border-brand-gold"
                                      />
                                      {isSearchingClients && <div className="absolute right-3 top-8 w-3 h-3 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>}
                                      {clientSearchResults.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-botanical-surface border border-botanical-border shadow-sm rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                          {clientSearchResults.map(c => (
                                            <button key={c.id} onClick={() => handleSelectExistingClient(c)} className="w-full text-left px-3 py-2 hover:bg-botanical-surface transition-colors border-b border-botanical-border last:border-0">
                                              <span className="text-botanical-text text-sm font-medium">{c.name || 'No name'}</span>
                                              <span className="text-botanical-muted text-xs ml-2">{c.email}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="relative flex items-center gap-2 text-xs text-botanical-muted">
                                      <div className="flex-1 border-t border-botanical-border"></div>
                                      <span>or enter new client</span>
                                      <div className="flex-1 border-t border-botanical-border"></div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between bg-status-confirmed/20 border border-status-confirmed/30 rounded p-2">
                                    <div>
                                      <span className="text-status-confirmed text-sm font-semibold">{selectedExistingClient.name}</span>
                                      <span className="text-botanical-muted text-xs ml-2">{selectedExistingClient.email}</span>
                                    </div>
                                    <button onClick={handleClearSelectedClient} className="text-botanical-muted hover:text-botanical-text text-xs underline">Change</button>
                                  </div>
                                )}

                                {!selectedExistingClient && (
                                  <>
                                    <div>
                                      <label className="block text-botanical-muted mb-1 text-sm">Client Name *</label>
                                      <input type="text" placeholder="John Doe" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-sm text-botanical-text focus:outline-none focus:border-brand-gold" />
                                    </div>
                                    <div>
                                      <label className="block text-botanical-muted mb-1 text-sm">Client Email (Optional)</label>
                                      <input type="email" placeholder="john@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-sm text-botanical-text focus:outline-none focus:border-brand-gold" />
                                    </div>
                                    <div>
                                      <label className="block text-botanical-muted mb-1 text-sm">Client Phone (Optional)</label>
                                      <input type="tel" placeholder="+1 555-123-4567" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-sm text-botanical-text focus:outline-none focus:border-brand-gold" />
                                    </div>
                                  </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ──── Step 1: Date ──── */}
                <div>
                    <label className="block text-botanical-muted mb-2 text-sm">1. Select Date</label>
                    <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setSelectedStaff(''); }} min={new Date().toISOString().split('T')[0]} className="w-full border border-botanical-border shadow-sm rounded p-3 text-botanical-text focus:outline-none focus:border-brand-gold" />
                </div>

                {/* ──── Step 2: Time ──── */}
                <div>
                    <label className="block text-botanical-muted mb-2 text-sm">2. Select Time</label>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-botanical-muted text-sm py-3">
                        <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                        Loading availability...
                      </div>
                    ) : availableTimeSlots.length > 0 ? (
                        <select
                          value={selectedTime}
                          onChange={(e) => { setSelectedTime(e.target.value); setSelectedStaff(''); }}
                         
                          className="w-full border border-botanical-border shadow-sm rounded p-3 text-botanical-text text-sm focus:outline-none focus:border-brand-gold cursor-pointer"
                        >
                          <option value="">— Choose a time —</option>
                          {availableTimeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                    ) : selectedDate ? (
                        <p className="text-status-pending bg-amber-900/20 p-3 rounded text-base md:text-lg">No available slots on this date.</p>
                    ) : null}
                </div>

                {/* ──── Step 3: Staff ──── */}
                {selectedTime && (
                    <div>
                        <label className="block text-botanical-muted mb-2 text-sm">3. Select Staff</label>
                        {staffAtSelectedTime.length > 0 ? (
                            <select
                              value={selectedStaff}
                              onChange={(e) => setSelectedStaff(e.target.value)}
                             
                              className="w-full border border-botanical-border shadow-sm rounded p-3 text-botanical-text text-sm focus:outline-none focus:border-brand-gold cursor-pointer"
                            >
                              <option value="">— Choose a barber —</option>
                              <option value={ANY_STAFF_VALUE}>🔀 Any Available (First Free)</option>
                              {staffAtSelectedTime.map(s => (
                                <option key={s.id} value={s.id}>{s.name || 'Staff'}</option>
                              ))}
                            </select>
                        ) : <p className="text-status-pending bg-amber-900/20 p-3 rounded text-base md:text-lg">No staff available at this time.</p>}
                    </div>
                )}

                {/* ──── Step 4: Notes ──── */}
                {selectedStaff && (
                  <div>
                    <label className="block text-botanical-muted mb-2 text-sm">4. Special Requests <span className="text-botanical-muted">(optional)</span></label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. skin fade, allergies, preferred products..."
                      rows={2}
                      maxLength={500}
                      className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-3 text-sm text-botanical-text focus:outline-none focus:border-brand-gold resize-none placeholder-gray-600"
                    />
                  </div>
                )}

                {/* ──── Review & Book Button ──── */}
                <div className="pt-4 border-t border-botanical-border">
                    <button
                      onClick={handleReviewBooking}
                      disabled={!selectedDate || !selectedTime || !selectedStaff || (isWalkIn && !clientName.trim() && !selectedExistingClient)}
                      className="w-full bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Booking
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
