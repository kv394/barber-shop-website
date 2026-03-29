'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from "@clerk/nextjs";
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

interface BookingModalProps {
  shopId: string;
  service: Service;
  onClose: () => void;
  shopHours: Record<string, { open: string; close: string } | null>;
}

export default function BookingModal({ shopId, service, onClose, shopHours }: BookingModalProps) {
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [isWalkIn, setIsWalkIn] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userShopId, setUserShopId] = useState<string | null>(null);
  
  // Fetch user role
  useEffect(() => {
    if (isSignedIn && clerkUser) {
        fetch(`/api/users/clerk/${clerkUser.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.shopId === shopId && ['SHOP_ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(data.role)) {
                    setUserRole(data.role);
                    setUserShopId(data.shopId);
                }
            }).catch(() => {});
    }
  }, [isSignedIn, clerkUser, shopId]);

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

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
  const getStaffHours = (staffMember: Staff) => {
    if (!selectedDate) return null;
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(selectedDate).getUTCDay()];
    let hours = (staffMember.workingHours as any)?.[dayOfWeek];
    if (!hours) hours = shopHours?.[dayOfWeek];
    if (!hours) hours = { open: '09:00', close: '17:00' };
    return hours;
  };

  // Helper: check if a staff member is free at a given time
  const isStaffFreeAt = (staffId: string, timeStr: string) => {
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
  };

  // Compute all unique available time slots (union across all staff)
  const availableTimeSlots = (() => {
    if (!selectedDate || allStaff.length === 0) return [];
    const slotSet = new Set<string>();
    for (const staffMember of allStaff) {
      const hours = getStaffHours(staffMember);
      if (!hours) continue;
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
  })();

  // Compute staff available at the selected time
  const staffAtSelectedTime = (() => {
    if (!selectedTime || allStaff.length === 0) return [];
    return allStaff.filter(s => {
      const hours = getStaffHours(s);
      if (!hours) return false;
      const [h, m] = selectedTime.split(':').map(Number);
      const [openH, openM] = hours.open.split(':').map(Number);
      const [closeH, closeM] = hours.close.split(':').map(Number);
      const slotMins = h * 60 + m;
      const openMins = openH * 60 + openM;
      const closeMins = closeH * 60 + closeM;
      if (slotMins < openMins || slotMins >= closeMins) return false;
      return isStaffFreeAt(s.id, selectedTime);
    });
  })();

  const handleBook = useCallback(async () => {
      if (!selectedDate || !selectedTime || !selectedStaff) return;
      
      if (isWalkIn && !clientName.trim()) {
          setError("Client Name is required for walk-in bookings.");
          return;
      }

      setIsBooking(true);
      setError(null);

      try {
        const [hour, minute] = selectedTime.split(':').map(Number);
        const startDateTime = new Date(selectedDate);
        startDateTime.setUTCHours(hour, minute, 0, 0);

        const response = await fetch(`/api/shops/${shopId}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serviceId: service.id,
                startTime: startDateTime.toISOString(),
                staffId: selectedStaff,
                isWalkIn,
                clientName: isWalkIn ? clientName.trim() : undefined,
                clientEmail: isWalkIn ? clientEmail.trim() : undefined
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to book appointment");
        }

        setSuccess(true);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsBooking(false);
      }
  }, [selectedDate, selectedTime, selectedStaff, isWalkIn, clientName, clientEmail, shopId, service.id]);

  const handleDone = () => {
    if (userRole && userShopId) {
      router.push(`/shop/${userShopId}/bookings`);
    } else {
      onClose();
    }
  };

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  if (success) {
      return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-xl p-8 max-w-md w-full border border-green-500 shadow-2xl text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
                <p className="text-gray-300 mb-6">The appointment for {service.name} has been scheduled.</p>
                <button onClick={handleDone} className="bg-brand-gold text-brand-dark font-bold px-6 py-2 rounded-lg hover:bg-white transition-colors">
                  {userRole ? 'Go to Bookings' : 'Done'}
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center z-10">✕</button>
        <h3 className="text-xl font-bold text-white mb-1">Book Appointment</h3>
        <p className="text-brand-gold font-semibold mb-6">{service.name} <span className="text-gray-400 font-normal ml-2">({service.duration} mins • ${service.price})</span></p>

        {!isLoaded ? (
             <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : !isSignedIn ? (
            <div className="text-center py-6 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center">
                <p className="text-gray-300 mb-4">Please sign in or create an account to book an appointment.</p>
                <button onClick={() => openSignIn({ redirectUrl: currentPath })} className="bg-brand-gold text-brand-dark px-6 py-2 rounded font-bold hover:bg-white transition-colors">Sign In to Book</button>
            </div>
        ) : (
            <div className="space-y-6">
                {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</p>}
                
                {userRole && (
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg space-y-3">
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="walkInToggle" checked={isWalkIn} onChange={(e) => setIsWalkIn(e.target.checked)} className="w-4 h-4 accent-brand-gold bg-black/50 border-white/20 rounded" />
                            <label htmlFor="walkInToggle" className="text-sm font-semibold text-blue-300 cursor-pointer">I am booking on behalf of a client</label>
                        </div>
                        {isWalkIn && (
                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Client Name *</label>
                                    <input type="text" placeholder="John Doe" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-brand-gold" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Client Email (Optional)</label>
                                    <input type="email" placeholder="john@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded p-2 text-sm text-white focus:outline-none focus:border-brand-gold" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm text-gray-400 mb-2">1. Select Date</label>
                    <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setSelectedStaff(''); }} min={new Date().toISOString().split('T')[0]} style={{ colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' }} className="w-full border border-white/20 rounded p-3 text-white focus:outline-none focus:border-brand-gold" />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">2. Select Time</label>
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                        <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                        Loading availability...
                      </div>
                    ) : availableTimeSlots.length > 0 ? (
                        <select
                          value={selectedTime}
                          onChange={(e) => { setSelectedTime(e.target.value); setSelectedStaff(''); }}
                          style={{ colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' }}
                          className="w-full border border-white/20 rounded p-3 text-white text-sm focus:outline-none focus:border-brand-gold cursor-pointer"
                        >
                          <option value="">— Choose a time —</option>
                          {availableTimeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                    ) : selectedDate ? (
                        <p className="text-amber-400 text-sm bg-amber-900/20 p-3 rounded">No available slots on this date.</p>
                    ) : null}
                </div>

                {selectedTime && (
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">3. Select Staff</label>
                        {staffAtSelectedTime.length > 0 ? (
                            <select
                              value={selectedStaff}
                              onChange={(e) => setSelectedStaff(e.target.value)}
                              style={{ colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' }}
                              className="w-full border border-white/20 rounded p-3 text-white text-sm focus:outline-none focus:border-brand-gold cursor-pointer"
                            >
                              <option value="">— Choose a barber —</option>
                              {staffAtSelectedTime.map(s => (
                                <option key={s.id} value={s.id}>{s.name || 'Staff'}</option>
                              ))}
                            </select>
                        ) : <p className="text-amber-400 text-sm bg-amber-900/20 p-3 rounded">No staff available at this time.</p>}
                    </div>
                )}

                <div className="pt-4 border-t border-white/10">
                    <button onClick={handleBook} disabled={!selectedDate || !selectedTime || !selectedStaff || isBooking || (isWalkIn && !clientName.trim())} className="w-full bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {isBooking ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                          Confirming...
                        </span>
                      ) : 'Confirm Booking'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
