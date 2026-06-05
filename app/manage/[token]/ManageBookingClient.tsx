'use client';;
import Image from 'next/image';

import { useState } from 'react';

export default function ManageBookingClient({ appointment, isPast }: { appointment: any, isPast: boolean }) {
 const [mode, setMode] = useState<'VIEW' | 'CANCEL' | 'RESCHEDULE'>('VIEW');
 const [loading, setLoading] = useState(false);
 const [cancelled, setCancelled] = useState(appointment.status === 'CANCELLED');
 const [error, setError] = useState('');
 
 // Reschedule state
 const [selectedDate, setSelectedDate] = useState<string>('');
 const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean}[]>([]);
 const [selectedTime, setSelectedTime] = useState<string>('');
 const [fetchingSlots, setFetchingSlots] = useState(false);

 const handleCancel = async () => {
 setLoading(true);
 try {
 const res = await fetch(`/api/manage/${appointment.managementToken}`, {
 method: 'DELETE',
 });
 if (res.ok) {
 setCancelled(true);
 setMode('VIEW');
 } else {
 const data = await res.json();
 setError(data.error || 'Failed to cancel');
 }
 } catch (e) {
 setError('Network error. Try again.');
 } finally {
 setLoading(false);
 }
 };

 const handleDateChange = async (date: string) => {
 setSelectedDate(date);
 setSelectedTime('');
 setFetchingSlots(true);
 setError('');
 try {
 const duration = appointment.serviceDuration || 30;
 const res = await fetch(`/api/renter/${appointment.staffId}/availability?date=${date}&duration=${duration}`);
 const data = await res.json();
 if (res.ok) {
 setAvailableSlots(data.slots || []);
 } else {
 setError(data.error || 'Could not load times');
 }
 } catch (e) {
 setError('Failed to fetch availability');
 } finally {
 setFetchingSlots(false);
 }
 };

 const handleReschedule = async () => {
 if (!selectedDate || !selectedTime) return;
 setLoading(true);
 try {
 const [h, m] = selectedTime.split(':').map(Number);
 const start = new Date(selectedDate);
 start.setHours(h, m, 0, 0);
 const end = new Date(start.getTime() + (appointment.serviceDuration || 30) * 60000);

 const res = await fetch(`/api/manage/${appointment.managementToken}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ newStartTime: start.toISOString(), newEndTime: end.toISOString() })
 });
 
 if (res.ok) {
 // Optimistic update
 appointment.startTime = start.toISOString();
 appointment.endTime = end.toISOString();
 setMode('VIEW');
 alert('Appointment successfully rescheduled!');
 } else {
 const data = await res.json();
 setError(data.error || 'Failed to reschedule');
 }
 } catch (e) {
 setError('Network error');
 } finally {
 setLoading(false);
 }
 };

 const apptDate = new Date(appointment.startTime);
 const dateStr = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
 const timeStr = apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

 return (
  <div className="w-full max-w-md">
   <div className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden shadow-2xl">
   <div className={`h-1.5 ${cancelled ? 'bg-red-500' : isPast ? 'bg-crm-muted' : 'bg-emerald-500'}`} />
   
   {mode === 'VIEW' && (
   <div className="p-6 md:p-8 space-y-6">
   <div className="text-center">
   {appointment.staff?.imageUrl ? (
   <Image src={appointment.staff.imageUrl} alt={appointment.staff.name} />
   ) : (
   <div className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-crm-border bg-crm-bg flex items-center justify-center text-2xl font-bold">
   {(appointment.staff?.name || '?')[0].toUpperCase()}
   </div>
   )}
   <h1 className="text-2xl font-black text-crm-text mb-1">{appointment.shop?.name}</h1>
   <p className="text-crm-muted text-sm">with {appointment.staff?.name}</p>
   </div>

   <div className="bg-crm-bg border border-crm-border rounded-xl p-4 space-y-3 text-sm">
   <div className="flex justify-between">
   <span className="text-crm-muted">Service</span>
   <span className="font-bold text-crm-text">{appointment.serviceName}</span>
   </div>
   <div className="flex justify-between">
   <span className="text-crm-muted">Date</span>
   <span className="font-bold text-crm-text">{dateStr}</span>
   </div>
   <div className="flex justify-between">
   <span className="text-crm-muted">Time</span>
   <span className="font-bold text-crm-text">{timeStr}</span>
   </div>
   {appointment.servicePrice && (
   <div className="flex justify-between border-t border-crm-border pt-3 mt-3">
   <span className="text-crm-muted">Price</span>
   <span className="font-bold text-crm-text">${appointment.servicePrice}</span>
   </div>
   )}
   </div>

   <div className="space-y-3 pt-2">
   {cancelled ? (
   <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-center py-4 rounded-xl font-bold">
   This appointment is cancelled.
   </div>
   ) : isPast ? (
   <div className="bg-crm-bg border border-crm-border text-crm-muted text-center py-4 rounded-xl font-bold">
   This appointment has passed.
   </div>
   ) : (
   <div className="flex gap-2">
   <button
   onClick={() => setMode('CANCEL')}
   className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors border border-red-500/20"
   >
   Cancel
   </button>
   <button
   onClick={() => setMode('RESCHEDULE')}
   className="flex-1 py-4 bg-crm-primary hover:bg-crm-primary/90 text-white font-bold rounded-xl transition-colors"
   >
   Reschedule
   </button>
   </div>
   )}

   {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
   </div>
   </div>
   )}

   {mode === 'CANCEL' && (
   <div className="p-6 md:p-8 space-y-6 text-center">
   <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-3xl mx-auto">⚠️</div>
   <h2 className="text-2xl font-black text-crm-text">Cancel Appointment?</h2>
   <p className="text-crm-muted">This action cannot be undone. You will lose your slot with {appointment.staff?.name}.</p>
   <div className="space-y-3 pt-4">
   <button
   onClick={handleCancel}
   disabled={loading}
   className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
   >
   {loading ? 'Cancelling...' : 'Yes, Cancel it'}
   </button>
   <button
   onClick={() => setMode('VIEW')}
   disabled={loading}
   className="w-full py-4 bg-crm-bg border border-crm-border hover:border-crm-primary text-crm-text font-bold rounded-xl transition-colors disabled:opacity-50"
   >
   Nevermind, keep it
   </button>
   </div>
   {error && <p className="text-red-500 text-sm">{error}</p>}
   </div>
   )}

   {mode === 'RESCHEDULE' && (
   <div className="p-6 md:p-8 space-y-6">
   <button onClick={() => setMode('VIEW')} className="text-crm-muted hover:text-crm-text font-bold text-sm mb-2">← Back</button>
   <h2 className="text-2xl font-black text-crm-text">Pick a New Time</h2>
   
   <div className="space-y-4">
   <div>
   <label className="block text-sm font-bold text-crm-muted mb-2">Select Date</label>
   <input 
   type="date" 
   min={new Date().toISOString().split('T')[0]}
   value={selectedDate}
   onChange={e => handleDateChange(e.target.value)}
   className="w-full bg-crm-bg border border-crm-border focus:border-crm-primary rounded-xl px-4 py-3 text-crm-text outline-none color-scheme-dark"
   />
   </div>

   {selectedDate && (
   <div>
   <label className="block text-sm font-bold text-crm-muted mb-2">Select Time</label>
   {fetchingSlots ? (
   <div className="animate-pulse flex gap-2 overflow-hidden py-2">
   {[1,2,3,4].map(i => <div key={i} className="h-12 w-20 bg-crm-bg rounded-lg"></div>)}
   </div>
   ) : availableSlots.length === 0 ? (
   <p className="text-crm-muted text-sm py-2">No availability on this date.</p>
   ) : (
   <div className="flex flex-wrap gap-2">
   {availableSlots.map(slot => (
   <button
   key={slot.time}
   disabled={!slot.available}
   onClick={() => setSelectedTime(slot.time)}
   className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
   !slot.available ? 'bg-crm-bg border border-crm-border text-crm-muted opacity-50 cursor-not-allowed' :
   selectedTime === slot.time ? 'bg-crm-primary text-white shadow-lg shadow-crm-primary/30 scale-105' :
   'bg-crm-bg border border-crm-border text-crm-text hover:border-crm-primary'
   }`}
   >
   {(() => {
   const [h, m] = slot.time.split(':').map(Number);
   const ampm = h >= 12 ? 'PM' : 'AM';
   const formattedH = h % 12 || 12;
   return `${formattedH}:${slot.time.split(':')[1]} ${ampm}`;
   })()}
   </button>
   ))}
   </div>
   )}
   </div>
   )}
   </div>

   <button
   onClick={handleReschedule}
   disabled={loading || !selectedDate || !selectedTime}
   className="w-full py-4 bg-crm-primary hover:bg-crm-primary/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-6"
   >
   {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
   </button>
   {error && <p className="text-red-500 text-center text-sm">{error}</p>}
   </div>
   )}
   </div>
  </div>
 );
}
