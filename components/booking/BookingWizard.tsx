"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { scoreAndSortSlots, type ScoredSlot } from '@/lib/schedule-optimizer';
import StyleDiscovery from '@/components/booking/StyleDiscovery';
import { fmtPrice } from '@/lib/formatters';

// Steps: 1: Service, 2: Staff, 3: DateTime, 4: Details

interface Service { id: string; name: string; price: number; duration: number; }
interface Staff { id: string; name: string; workingHours: any; }
interface BookedSlot { startTime: string; endTime: string; staffId: string; }

export default function BookingWizard({ shopId, themeColor, secondaryColor, templateType, currency, shopType = 'PHYSICAL' }: { shopId: string, themeColor?: string, secondaryColor?: string, templateType?: string, currency: string, shopType?: string }) {
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
  const [serviceLocation, setServiceLocation] = useState('');
  const [isHouseCall, setIsHouseCall] = useState(shopType === 'MOBILE');
  
  // Availability state
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [sortByFit, setSortByFit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);

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
      fetch(`/api/shops/${shopId}/staff?date=${new Date().toISOString().split('T')[0]}`).then(r => r.ok ? r.json() : []),
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

  
  const getThemeStyles = () => {
    switch (templateType) {
      case 'sporty':
        return {
          cardActive: 'border-2 shadow-sm rounded-none font-bold',
          cardInactive: 'border-2 border-gray-200 hover:border-gray-800 rounded-none',
          btnPrimary: 'w-full text-white font-black py-4 uppercase tracking-widest rounded-none hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-200 text-black font-black py-4 uppercase tracking-widest rounded-none hover:bg-gray-300 transition-colors',
          input: 'w-full border-2 border-gray-200 p-4 rounded-none focus:outline-none focus:border-black font-bold',
          title: 'text-xl font-black uppercase italic'
        };
      case 'corporate':
        return {
          cardActive: 'border shadow-md rounded-lg',
          cardInactive: 'border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-lg',
          btnPrimary: 'w-full text-white font-medium py-3 rounded-lg shadow-sm hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors',
          input: 'w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent',
          title: 'text-lg font-bold text-gray-900'
        };
      case 'noir':
        return {
          cardActive: 'border border-black bg-black text-white rounded-none',
          cardInactive: 'border border-gray-300 hover:border-black rounded-none',
          btnPrimary: 'w-full bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-900 transition-colors',
          btnSecondary: 'w-full border border-black text-black font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-100 transition-colors',
          input: 'w-full border-b-2 border-gray-300 p-3 rounded-none focus:outline-none focus:border-black bg-transparent',
          title: 'text-lg font-bold uppercase tracking-widest'
        };
      case 'sunset':
      case 'vibrant':
        return {
          cardActive: 'border-2 shadow-lg rounded-2xl',
          cardInactive: 'border-2 border-transparent bg-gray-50 hover:bg-gray-100 rounded-2xl',
          btnPrimary: 'w-full text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-100 text-gray-800 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors',
          input: 'w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:outline-none',
          title: 'text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500'
        };
      case 'editorial':
        return {
          cardActive: 'border border-[#d4af37] bg-[#fdfbf7] rounded-none',
          cardInactive: 'border border-gray-200 hover:border-[#d4af37] rounded-none',
          btnPrimary: 'w-full text-[#121412] font-semibold uppercase tracking-widest py-4 rounded-none hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full border border-gray-300 text-gray-600 font-semibold uppercase tracking-widest py-4 rounded-none hover:bg-gray-50 transition-colors',
          input: 'w-full border-b border-gray-300 p-3 rounded-none focus:outline-none focus:border-[#d4af37] bg-transparent font-serif',
          title: 'text-xl font-serif italic text-gray-900'
        };
      case 'classic':
        return {
          cardActive: 'border border-[#2c1e16] bg-[#fdfbf7] rounded-sm',
          cardInactive: 'border border-[#e6d9c6] hover:border-[#2c1e16] bg-white rounded-sm',
          btnPrimary: 'w-full text-[#fdfbf7] font-medium uppercase tracking-wider py-3 rounded-sm hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full border border-[#e6d9c6] text-[#5a4634] font-medium uppercase tracking-wider py-3 rounded-sm hover:bg-[#fdfbf7] transition-colors',
          input: 'w-full border border-[#e6d9c6] p-3 rounded-sm focus:outline-none focus:border-[#2c1e16] bg-white',
          title: 'text-lg font-serif font-bold text-[#2c1e16]'
        };
      case 'minimal':
        return {
          cardActive: 'border-b-2 border-black rounded-none pb-4',
          cardInactive: 'border-b border-gray-200 hover:border-black rounded-none pb-4',
          btnPrimary: 'w-full bg-black text-white font-medium py-3 rounded-none hover:bg-gray-800 transition-colors',
          btnSecondary: 'w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-none hover:bg-gray-50 transition-colors',
          input: 'w-full border-b border-gray-200 p-3 rounded-none focus:outline-none focus:border-black bg-transparent',
          title: 'text-lg font-light tracking-tight text-gray-900'
        };
      case 'modern':
      default:
        return {
          cardActive: 'border-2 shadow-sm rounded-xl',
          cardInactive: 'border-2 border-transparent bg-gray-50 hover:border-gray-200 rounded-xl',
          btnPrimary: 'w-full text-white font-bold py-4 rounded-xl shadow-md hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors',
          input: 'w-full border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 bg-gray-50',
          title: 'text-lg font-bold text-gray-900'
        };
    }
  };

  const tStyles = getThemeStyles();
  const hexToRgba = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3 || cleanHex.length === 6) {
      const isShort = cleanHex.length === 3;
      const r = parseInt(isShort ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16);
      const g = parseInt(isShort ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16);
      const b = parseInt(isShort ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.1)`;
    }
    return '';
  }
  const activeBg = themeColor ? hexToRgba(themeColor) : '#f9fafb';

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

  const availableTimeSlots = useMemo((): ScoredSlot[] => {
    if (!selectedDate || staff.length === 0) return [];
    const rawSlots: { time: string; staffId: string }[] = [];
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
          rawSlots.push({ time: timeStr, staffId: staffMember.id });
        }
        cursor = new Date(cursor.getTime() + 30 * 60000);
      }
    }

    // Deduplicate by time (keep first staff match per time)
    const seenTimes = new Set<string>();
    const uniqueSlots = rawSlots.filter(s => {
      if (seenTimes.has(s.time)) return false;
      seenTimes.add(s.time);
      return true;
    });

    // Score and sort by gap-fill efficiency
    const scored = scoreAndSortSlots(uniqueSlots, bookedSlots, selectedDate, totalDuration);

    // If user prefers chronological, re-sort by time but keep isRecommended flags
    if (!sortByFit) {
      scored.sort((a, b) => a.time.localeCompare(b.time));
    }

    return scored;
  }, [selectedDate, staff, selectedStaff, getStaffHours, isStaffFreeAt, bookedSlots, totalDuration, sortByFit]);

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
          serviceLocation: isHouseCall ? serviceLocation : undefined,
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }
      const appointmentData = await res.json();
      setBookedAppointmentId(appointmentData.id);
      setSuccess(true);
      setTimeout(() => {
          if (typeof window !== 'undefined' && window.parent) {
            window.parent.postMessage({ type: 'CLOSE_MODAL' }, window.location.origin);
          }
      }, 8000); // Extended to 8s so user can tap "Add to Calendar"
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-12 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (success) {
    const calendarUrl = bookedAppointmentId ? `/api/shops/${shopId}/appointments/${bookedAppointmentId}/calendar` : null;
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-12 bg-white text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-6">Your appointment for {selectedService?.name} has been scheduled.</p>
        {calendarUrl && (
          <a
            href={calendarUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 mb-4"
            style={{ backgroundColor: themeColor || '#111827' }}
          >
            📅 Add to Calendar
          </a>
        )}
        <p className="text-sm text-gray-400">This window will close automatically...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative font-sans w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pr-10 border-b border-gray-100 shrink-0">
        <div className="flex items-center space-x-2">
          {step > 1 && (
            <button onClick={handleBack} className="text-gray-500 hover:text-black">
              &larr; Back
            </button>
          )}
          <h2 className={tStyles.title}>
            {step === 1 && 'Select Service'}
            {step === 2 && 'Select Professional'}
            {step === 3 && 'Choose Date & Time'}
            {step === 4 && 'Your Details'}
          </h2>
        </div>
        <div className="flex items-center gap-1 mr-4">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-6' : 'bg-gray-300 w-4'}`} style={s <= step ? {backgroundColor: themeColor || '#111827'} : {}} />
          ))}
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {step === 1 && (
          <div className="space-y-3">
            <div className="mb-2">
              <input
                type="search"
                placeholder="Search services..."
                className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
              />
            </div>
            {services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map(s => (
              <div 
                key={s.id} 
                onClick={() => { setSelectedService(s); handleNext(); }}
                className={`p-4 cursor-pointer transition-all ${selectedService?.id === s.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedService?.id === s.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  <span className="font-semibold text-gray-900">{fmtPrice(s.price, currency)}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{s.duration} mins</div>
              </div>
            ))}
            {services.length === 0 && <p className="text-gray-500 text-center py-4">No services available.</p>}
            {services.length > 0 && services.filter(s => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
              <p className="text-gray-500 text-center py-4">No services match your search.</p>
            )}
            {/* Style Discovery AI */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <StyleDiscovery shopId={shopId} themeColor={themeColor} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div 
              onClick={() => { setSelectedStaff(null); handleNext(); }}
              className={`p-4 cursor-pointer transition-all ${selectedStaff === null ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === null ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}
            >
              <div className="font-medium text-gray-800">No Preference</div>
              <div className="text-sm text-gray-500">First available professional</div>
            </div>
            {staff.map(st => (
              <div 
                key={st.id} 
                onClick={() => { setSelectedStaff(st); handleNext(); }}
                className={`p-4 cursor-pointer transition-all ${selectedStaff?.id === st.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff?.id === st.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}
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
                            className={tStyles.btnPrimary} style={{ backgroundColor: themeColor || '#111827', color: secondaryColor || undefined }}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Select Time</label>
                  {availableTimeSlots.some(s => s.isRecommended) && (
                    <button
                      type="button"
                      onClick={() => setSortByFit(v => !v)}
                      className="text-xs text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
                    >
                      {sortByFit ? '🕐 Sort by time' : '⭐ Sort by best fit'}
                    </button>
                  )}
                </div>
                {loadingSlots ? (
                    <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div></div>
                ) : availableTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableTimeSlots.map(slot => (
                        <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-4 text-base sm:p-3 sm:text-sm transition-all font-medium relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${selectedTime === slot.time ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedTime === slot.time ? { borderColor: themeColor || '#111827', backgroundColor: themeColor || '#111827', color: templateType === 'editorial' ? '#121412' : '#ffffff' } : {}}
                        >
                        {formatTime(slot.time)}
                        {slot.isRecommended && selectedTime !== slot.time && (
                          <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[9px] font-bold text-amber-900 px-1.5 py-0.5 rounded-full leading-none shadow-sm">⭐</span>
                        )}
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
                  <span className="font-medium text-gray-900">{fmtPrice(selectedService?.price || 0, currency)}</span>
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
                autoComplete="name"
                className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                placeholder="john@example.com"
                autoComplete="email"
                className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input 
                type="tel" 
                placeholder="(555) 000-0000"
                autoComplete="tel"
                className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {shopType === 'HYBRID' && (
              <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 text-sm">Service Location</div>
                  <div className="text-xs text-gray-500">{isHouseCall ? 'House Call' : 'In-Shop'}</div>
                </div>
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button type="button" onClick={() => setIsHouseCall(false)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!isHouseCall ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>In-Shop</button>
                  <button type="button" onClick={() => setIsHouseCall(true)} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${isHouseCall ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>House Call</button>
                </div>
              </div>
            )}
            
            {isHouseCall && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Address</label>
                <input 
                  type="text" 
                  placeholder="123 Main St, City, Zip"
                  className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
                  value={serviceLocation}
                  onChange={e => setServiceLocation(e.target.value)}
                />
              </div>
            )}
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
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white shrink-0">
          {step === 3 ? (
              <button 
                disabled={!selectedDate || !selectedTime}
                onClick={handleNext}
                className={`${tStyles.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: themeColor || '#111827', color: secondaryColor || undefined }}
              >
                Continue to Details
              </button>
          ) : (
              <button
                disabled={!name || !email || isBooking || (isHouseCall && !serviceLocation)}
                onClick={handleBook}
                className={`${tStyles.btnPrimary} flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: themeColor || '#111827', color: secondaryColor || undefined }}
              >
                {isBooking ? (                    <>
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
