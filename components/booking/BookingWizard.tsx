"use client";;
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { scoreAndSortSlots, type ScoredSlot } from '@/lib/schedule-optimizer';
import { getWizardThemeStyles } from './WizardThemeStyles';
import { ServiceStep, StaffStep, DateTimeStep, DetailsStep } from './BookingWizardSteps';
import { fmtPrice } from '@/lib/formatters';

// Steps: 1: Service, 2: Staff, 3: DateTime, 4: Details

interface Service { id: string; name: string; price: number; duration: number; requiresVirtualConsultation?: boolean; }
interface Staff { id: string; name: string; workingHours: any; }
interface BookedSlot { startTime: string; endTime: string; staffId: string; }

export default function BookingWizard({ shopId, themeColor, secondaryColor, templateType, currency, shopType = 'PHYSICAL' }: { shopId: string, themeColor?: string, secondaryColor?: string, templateType?: string, currency: string, shopType?: string }) {
 const t = useTranslations('Booking');
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
 const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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
 const initialStaffId = searchParams.get('staffId');

 Promise.all([
 fetch(`/api/shops/${shopId}/services`).then(r => r.ok ? r.json() : []),
 fetch(`/api/shops/${shopId}/staff?date=${new Date().toISOString().split('T')[0]}`).then(r => r.ok ? r.json() : []),
 fetch(`/api/shops/${shopId}/business-hours`).then(r => r.ok ? r.json() : {}),
 ]).then(([svcs, stfResponse, hours]) => {
 const parsedServices = Array.isArray(svcs) ? svcs : [];
 const parsedStaff = Array.isArray(stfResponse) ? stfResponse : (stfResponse.staff || []);
 setServices(parsedServices);
 setStaff(parsedStaff);
 setShopHours(hours);

 // Auto-select service if provided
 let autoSelectedService = false;
 if (initialServiceId) {
 const found = parsedServices.find((s: any) => s.id === initialServiceId);
 if (found) {
 setSelectedService(found);
 autoSelectedService = true;
 }
 }

 // Auto-select staff if provided
 if (initialStaffId) {
 const foundStaff = parsedStaff.find((s: any) => s.id === initialStaffId);
 if (foundStaff) {
 setSelectedStaff(foundStaff);
 // If both service and staff are pre-selected, skip to date/time
 if (autoSelectedService) {
 setStep(3);
 } else {
 // Staff pre-selected but no service — go to service step,
 // staff will be locked in when they proceed
 setStep(1);
 }
 } else if (autoSelectedService) {
 setStep(2);
 }
 } else if (autoSelectedService) {
 setStep(2);
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

 
 const tStyles = getWizardThemeStyles(templateType);
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

 const totalDuration = selectedService?.requiresVirtualConsultation ? 15 : (selectedService?.duration || 30);

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
 turnstileToken: turnstileToken,
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
 <div className="flex items-center justify-center h-full w-full p-12 bg-crm-surface">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
 </div>
 );
 }

 if (success) {
 const calendarUrl = bookedAppointmentId ? `/api/shops/${shopId}/appointments/${bookedAppointmentId}/calendar` : null;
 return (
 <div className="flex flex-col items-center justify-center h-full w-full p-12 bg-crm-surface text-center">
 <div className="text-6xl mb-4">🎉</div>
 <h2 className="text-2xl font-bold text-crm-text mb-2">Booking Confirmed!</h2>
 <p className="text-crm-muted mb-6">Your appointment for {(selectedService?.requiresVirtualConsultation ? "Virtual Consultation: " + selectedService?.name : selectedService?.name)} has been scheduled.</p>
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
 <div className="flex flex-col h-full bg-crm-surface relative w-full max-w-md mx-auto">
    {/* Dynamic theme color styles */}
    <style dangerouslySetInnerHTML={{__html: `
     .wizard-card-hover { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
     .wizard-card-hover:hover { border-color: ${themeColor || '#111827'} !important; }
     .wizard-input-focus:focus { border-color: ${themeColor || '#111827'} !important; box-shadow: 0 1px 0 0 ${themeColor || '#111827'}; }
    `}} />
    {/* Header */}
 <div className="flex items-center justify-between p-4 pr-10 border-b border-crm-border shrink-0">
 <div className="flex items-center space-x-2">
 {step > 1 && (
 <button onClick={handleBack} className="text-crm-muted hover:text-crm-text min-h-[44px] min-w-[44px] p-2 flex items-center">
 &larr; {t('back')}
 </button>
 )}
 <h2 className={tStyles.title}>
 {step === 1 && t('selectService')}
 {step === 2 && t('selectProfessional')}
 {step === 3 && t('selectDate')}
 {step === 4 && t('yourDetails')}
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
          <ServiceStep
            services={services}
            serviceSearchQuery={serviceSearchQuery}
            setServiceSearchQuery={setServiceSearchQuery}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            handleNext={handleNext}
            tStyles={tStyles}
            themeColor={themeColor}
            activeBg={activeBg}
            currency={currency}
            shopId={shopId}
          />
        )}

        {step === 2 && (
          <StaffStep
            staff={staff}
            selectedStaff={selectedStaff}
            setSelectedStaff={setSelectedStaff}
            handleNext={handleNext}
            tStyles={tStyles}
            themeColor={themeColor}
            activeBg={activeBg}
          />
        )}

        {step === 3 && (
          <DateTimeStep
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            tempPickerDate={tempPickerDate}
            setTempPickerDate={setTempPickerDate}
            setTempDate={setTempDate}
            setSelectedTime={setSelectedTime}
            availableTimeSlots={availableTimeSlots}
            sortByFit={sortByFit}
            setSortByFit={setSortByFit}
            loadingSlots={loadingSlots}
            selectedTime={selectedTime}
            tStyles={tStyles}
            themeColor={themeColor}
            secondaryColor={secondaryColor}
            templateType={templateType}
            formatTime={formatTime}
          />
        )}

        {step === 4 && (
          <DetailsStep
            error={error}
            selectedService={selectedService}
            currency={currency}
            selectedStaff={selectedStaff}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            shopType={shopType}
            isHouseCall={isHouseCall}
            setIsHouseCall={setIsHouseCall}
            serviceLocation={serviceLocation}
            setServiceLocation={setServiceLocation}
            notes={notes}
            setNotes={setNotes}
            tStyles={tStyles}
            themeColor={themeColor}
            formatTime={formatTime}
            turnstileToken={turnstileToken}
            setTurnstileToken={setTurnstileToken}
            templateType={templateType}
          />
        )}
 </div>

 {/* Footer */}
 {step >= 3 && (
 <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-crm-border bg-crm-surface shrink-0">
 {step === 3 ? (
 <button 
 disabled={!selectedDate || !selectedTime}
 onClick={handleNext}
 className={`${tStyles.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: themeColor || '#111827', color: secondaryColor || undefined }}
 >
 {t('next')}
 </button>
 ) : (
 <button
 disabled={!name || !email || isBooking || (isHouseCall && !serviceLocation) || !turnstileToken}
 onClick={handleBook}
 className={`${tStyles.btnPrimary} flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: themeColor || '#111827', color: secondaryColor || undefined }}
 >
 {isBooking ? ( <>
 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
 {t('confirm')}...
 </>
 ) : t('confirm')}
 </button>
 )}
 </div>
 )}
 </div>
 );
}
