"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

// Steps: 1: Service, 2: Staff, 3: DateTime, 4: Details

interface Service { id: string; name: string; price: number; duration: number; }
interface Staff { id: string; name: string; workingHours: any; }
interface BookedSlot { startTime: string; endTime: string; staffId: string; }

export default function BookingWizard({ shopId }: { shopId: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shopHours, setShopHours] = useState<any>(null);
  
  // Selection state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [tempDate, setTempDate] = useState<string>('');
  const [tempPickerDate, setTempPickerDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Availability state
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<any>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const isSignedIn = !!authUser;

  useEffect(() => {
    const { createClient } = require('@/utils/supabase/client');
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => {
      setAuthUser(data?.user || null);
      if (data?.user) {
         setName(data.user.user_metadata?.full_name || '');
         setEmail(data.user.email || '');
      }
      setIsAuthLoaded(true);
    });
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialServiceId = searchParams.get('serviceId');

    Promise.all([
      fetch(`/api/shops/${shopId}/services`).then(r => r.ok ? r.json() : []),
      fetch(`/api/shops/${shopId}/staff`).then(r => r.ok ? r.json() : []),
      fetch(`/api/shops/${shopId}/business-hours`).then(r => r.ok ? r.json() : {}),
    ]).then(([svcs, stfResponse, hours]) => {
      const parsedServices = Array.isArray(svcs) ? svcs : [];
      setServices(parsedServices);
      setStaff(Array.isArray(stfResponse) ? stfResponse : (stfResponse.staff || []));
      setShopHours(hours);

      if (initialServiceId) {
        const found = parsedServices.find((s: any) => s.id === initialServiceId);
        if (found) {
          setSelectedService(found);
          setStep(2);
        }
      }

      setLoading(false);
    }).catch(err => {
      console.error("Error loading wizard data", err);
      setLoading(false);
    });
  }, [shopId]);

  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    fetch(`/api/shops/${shopId}/appointments?date=${selectedDate}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setBookedSlots(Array.isArray(data) ? data : []);
        setLoadingSlots(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setLoadingSlots(false);
      });
    return () => controller.abort();
  }, [selectedDate, shopId]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const getStaffHours = useCallback((staffMember: Staff) => {
    if (!selectedDate) return null;
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(selectedDate).getUTCDay()];
    const individualHours = (staffMember.workingHours as any)?.[dayOfWeek];
    if (individualHours === null) return null;
    if (individualHours) return individualHours;
    const shopDayHours = shopHours?.[dayOfWeek];
    if (shopDayHours === null) return null;
    if (shopDayHours) return shopDayHours;
    return { open: '09:00', close: '17:00' };
  }, [selectedDate, shopHours]);

  const totalDuration = selectedService?.duration || 30;

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

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || staff.length === 0) return [];
    const slotSet = new Set<string>();
    const staffToCheck = selectedStaff ? [selectedStaff] : staff;

    for (const staffMember of staffToCheck) {
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
  }, [selectedDate, staff, selectedStaff, getStaffHours, isStaffFreeAt]);

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    let resolvedStaffId = selectedStaff?.id;
    if (!resolvedStaffId) {
      const available = staff.filter(s => {
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
      if (available.length > 0) resolvedStaffId = available[0].id;
    }
    
    if (!resolvedStaffId) {
      setError("No professional available at this time. Please select another time.");
      return;
    }

    setIsBooking(true);
    setError(null);
    try {
      const [hour, minute] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(`${selectedDate}T00:00:00Z`);
      startDateTime.setUTCHours(hour, minute, 0, 0);

      const res = await fetch(`/api/shops/${shopId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          startTime: startDateTime.toISOString(),
          staffId: resolvedStaffId,
          notes: notes.trim() || undefined,
          isWalkIn: false,
          clientName: name,
          clientEmail: email,
          clientPhone: phone,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }
      setSuccess(true);
      setTimeout(() => {
          if (typeof window !== 'undefined' && window.parent) {
            window.parent.postMessage({ type: 'CLOSE_MODAL' }, '*');
          }
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading || !isAuthLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full p-12 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-12 bg-white text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-6">Your appointment for {selectedService?.name} has been scheduled.</p>
        <p className="text-sm text-gray-400">This window will close automatically...</p>
      </div>
    );
  }

  // Auth Check View
  if (!isSignedIn) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-white text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to book</h2>
            <p className="text-gray-600 mb-6">Please sign in or create an account to continue with your booking.</p>
            <a href={`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`} className="w-full max-w-xs bg-gray-900 text-white p-3 rounded-xl font-medium hover:bg-black transition-colors">
              Sign In
            </a>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-white relative font-sans w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center space-x-2">
          {step > 1 && (
            <button onClick={handleBack} className="text-gray-500 hover:text-black">
              &larr; Back
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-800">
            {step === 1 && 'Select Service'}
            {step === 2 && 'Select Professional'}
            {step === 3 && 'Choose Date & Time'}
            {step === 4 && 'Your Details'}
          </h2>
        </div>
        <div className="text-sm text-gray-400 font-medium">Step {step} of 4</div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {step === 1 && (
          <div className="space-y-3">
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search services..."
                className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all"
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
              />
            </div>
            {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map(s => (
              <div 
                key={s.id} 
                onClick={() => { setSelectedService(s); handleNext(); }}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedService?.id === s.id ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="font-semibold text-gray-900">${s.price.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{s.duration} mins</div>
              </div>
            ))}
            {services.length === 0 && <p className="text-gray-500 text-center py-4">No services available.</p>}
            {services.length > 0 && services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
              <p className="text-gray-500 text-center py-4">No services match your search.</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div 
              onClick={() => { setSelectedStaff(null); handleNext(); }}
              className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedStaff === null ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'}`}
            >
              <div className="font-medium text-gray-800">No Preference</div>
              <div className="text-sm text-gray-500">First available professional</div>
            </div>
            {staff.map(st => (
              <div 
                key={st.id} 
                onClick={() => { setSelectedStaff(st); handleNext(); }}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedStaff?.id === st.id ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'}`}
              >
                <div className="font-medium text-gray-800">{st.name}</div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              {!selectedDate ? (
                <div className="flex justify-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <DayPicker
                    mode="single"
                    selected={tempPickerDate}
                    onSelect={(date) => {
                      setTempPickerDate(date);
                      if (date) {
                        setTempDate(format(date, 'yyyy-MM-dd'));
                        setSelectedTime('');
                      }
                    }}
                    disabled={{ before: new Date(new Date().setHours(0,0,0,0)) }}
                    footer={
                      tempPickerDate ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (tempPickerDate) {
                                setSelectedDate(format(tempPickerDate, 'yyyy-MM-dd'));
                              }
                            }}
                            className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-medium text-lg hover:bg-black transition-colors"
                          >
                            OK
                          </button>
                        </div>
                      ) : null
                    }
                  />
                </div>
              ) : (
                <div 
                  className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 border-gray-200 cursor-pointer hover:border-gray-800 transition-colors"
                  onClick={() => setSelectedDate('')}
                >
                  <span className="font-medium text-gray-800">
                    {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
                  </span>
                  <span className="text-sm text-gray-500">Change</span>
                </div>
              )}
              </div>
              {selectedDate && (
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                {loadingSlots ? (
                    <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div></div>
                ) : availableTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map(time => (
                        <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 border rounded-xl text-sm transition-colors font-medium ${selectedTime === time ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-900 text-gray-700'}`}
                        >
                        {formatTime(time)}
                        </button>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-xl">No available times on this date.</p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-medium text-gray-800 mb-3">Booking Summary</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span>{selectedService?.name}</span>
                  <span className="font-medium text-gray-900">${selectedService?.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span>Professional</span>
                  <span className="font-medium text-gray-900">{selectedStaff ? selectedStaff.name : 'No Preference'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Time</span>
                  <span className="font-medium text-gray-900">
                    {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime ? formatTime(selectedTime) : ''}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                placeholder="john@example.com"
                className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input 
                type="tel" 
                placeholder="(555) 000-0000"
                className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea 
                placeholder="Any special requests?"
                className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all min-h-[80px]"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {step >= 3 && (
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          {step === 3 ? (
              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={handleNext}
                className="w-full bg-gray-900 text-white p-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"
              >
                Continue to Details
              </button>
          ) : (
              <button 
                disabled={!name || !email || isBooking}
                onClick={handleBook}
                className="w-full bg-gray-900 text-white p-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                {isBooking ? (
                    <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Confirming...
                    </>
                ) : 'Confirm Booking'}
              </button>
          )}
        </div>
      )}
    </div>
  );
}
