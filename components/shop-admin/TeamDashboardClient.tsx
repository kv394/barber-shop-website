'use client';

import { useState } from 'react';
import Link from 'next/link';
import StaffAvailability from '@/components/shop-admin/StaffAvailability';
import StaffProfileModalWrapper from '@/components/shop-admin/StaffProfileModalWrapper';

import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';

export default function TeamDashboardClient({ 
 shopId, 
 initialDate, 
 initialStaff,
 addLeaveAction,
 removeLeaveAction,
 updateDayHoursAction,
 removeUserAction
}: any) {
 // Use state to track the input values for each staff member
 const [formStates, setFormStates] = useState<Record<string, { open: string, close: string }>>({});

 const handleTimeChange = (staffId: string, type: 'open' | 'close', value: string) => {
 setFormStates(prev => ({
 ...prev,
 [staffId]: {
 ...prev[staffId],
 [type]: value
 }
 }));
 };

 // Helper to get the current value, falling back to props if not edited
 const getTimeValue = (staffId: string, type: 'open' | 'close', defaultValue: string) => {
 return formStates[staffId]?.[type] ?? defaultValue;
 };

 return (
 <>
 <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-6 sm:gap-4 mb-8">
 <div className="w-full relative">
 <StaffAvailability defaultDate={initialDate} staff={initialStaff}>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {initialStaff.map((staffMember: any) => {
 const isOnLeave = staffMember.isOnLeave;
 const isNotWorking = staffMember.using === 'not-working' || staffMember.using === 'not-set';
 
 const defaultOpen = staffMember.openTime || "09:00";
 const defaultClose = staffMember.closeTime || "17:00";

 return (
 <PremiumGlassCard key={staffMember.id} className={`flex flex-col shadow-lg transition-all duration-200 hover:shadow-xl ${isOnLeave ? 'ring-2 ring-status-cancelled/50' : ''}`} accentColor={staffMember.role === 'SHOP_ADMIN' ? 'crm-primary' : 'brand-indigo'}>
 
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-4">
 <StaffProfileModalWrapper staff={staffMember} shopId={shopId}>
 <div className="flex items-center gap-3 text-left">
 <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 border border-white/10 shadow-sm flex items-center justify-center shrink-0">
 {staffMember.imageUrl ? (
 <img src={staffMember.imageUrl} alt={staffMember.name} className="w-full h-full object-cover" />
 ) : (
 <span className="text-[13px]">👤</span>
 )}
 </div>
 <div>
 <h2 className="font-bold text-crm-text mb-0.5 flex items-center gap-2 text-xl">
 {staffMember.name || staffMember.email.split('@')[0]}
 {staffMember.role === 'SHOP_ADMIN' && <span className="text-[10px] bg-crm-primary/20 text-crm-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black hover:opacity-90">Admin</span>}
 {staffMember.role === 'BOOTH_RENTER' && <span className="text-[10px] bg-brand-indigo/20 text-brand-indigo px-1.5 py-0.5 rounded-full uppercase tracking-wider font-black hover:opacity-90">Booth Renter</span>}
 </h2>
 <p className="text-crm-muted text-[13px]">{staffMember.email}</p>
 </div>
 </div>
 </StaffProfileModalWrapper>
 
 {/* Actions & Status Badge */}
 <div className="flex flex-col items-end gap-2">
 {isOnLeave ? (
 <span className="text-[13px] bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">On Leave</span>
 ) : isNotWorking ? (
 <span className="text-[13px] bg-crm-surface text-crm-text border border-crm-border shadow-sm px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Day Off</span>
 ) : staffMember.isClockedIn ? (
 <span className="text-[13px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Clocked In
 </span>
 ) : (
 <span className="text-[13px] bg-crm-primary/10 text-blue-700 border border-crm-primary/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Scheduled</span>
 )}
 </div>
 </div>

 {/* Schedule / Leave Display */}
 {staffMember.role === 'SHOP_ADMIN' ? (
 <div className="flex-grow bg-white/5 rounded-xl p-3 mb-4 min-h-[120px] flex flex-col justify-center items-center text-center border border-dashed border-white/20">
 <span className="text-3xl mb-2">🛡️</span>
 <p className="font-bold text-crm-text text-[13px]">Administrator Account</p>
 <p className="text-crm-muted text-[11px] mt-1 font-medium">Virtual role, no client booking schedule.</p>
 </div>
 ) : (
 <div className="flex-grow bg-black/20 rounded-xl p-3 mb-4 min-h-[120px] flex flex-col border border-white/5 shadow-inner">
 {isOnLeave ? (
 <div className="flex-grow flex flex-col justify-center items-center text-center">
 <span className="text-3xl mb-2">🏖️</span>
 <p className="font-bold text-red-400 text-[13px]">Currently on Leave</p>
 {staffMember.leaves[0]?.reason && <p className="text-red-300/70 mt-1 italic text-[13px]">"{staffMember.leaves[0].reason}"</p>}
 
 <form action={removeLeaveAction} className="mt-4">
 <input type="hidden" name="staffId" value={staffMember.id} />
 <input type="hidden" name="shopId" value={shopId} />
 <input type="hidden" name="date" value={initialDate} />
 <input type="hidden" name="startTime" value="00:00" />
 <input type="hidden" name="endTime" value="23:59" />
 <button type="submit" className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider">Cancel Leave</button>
 </form>
 </div>
 ) : isNotWorking ? (
 <div className="flex-grow flex flex-col justify-center items-center text-center">
 <span className="text-3xl mb-2">💤</span>
 <p className="font-bold text-crm-muted mb-4 text-[13px]">Scheduled Day Off</p>
 
 {/* Quick Add Shift form with editable times */}
 <form action={updateDayHoursAction} className="w-full space-y-2 border-t border-white/10 pt-3">
 <input type="hidden" name="staffId" value={staffMember.id} />
 <input type="hidden" name="shopId" value={shopId} />
 <input type="hidden" name="dayOfWeek" value={staffMember.dayOfWeek} />
 <input type="hidden" name="isWorking" value="true" />
 <input type="hidden" name="date" value={initialDate} />
 
 <div className="flex justify-center gap-2 items-center">
 <input 
 type="time" 
 name="openTime" 
 value={getTimeValue(staffMember.id, 'open', defaultOpen)}
 onChange={(e) => handleTimeChange(staffMember.id, 'open', e.target.value)}
 className="bg-black/30 text-crm-text text-[11px] p-1.5 rounded border border-white/10 shadow-sm outline-none focus:ring-1 focus:ring-crm-primary"
 />
 <span className="text-crm-muted text-[11px] font-bold">to</span>
 <input 
 type="time" 
 name="closeTime" 
 value={getTimeValue(staffMember.id, 'close', defaultClose)}
 onChange={(e) => handleTimeChange(staffMember.id, 'close', e.target.value)}
 className="bg-black/30 text-crm-text text-[11px] p-1.5 rounded border border-white/10 shadow-sm outline-none focus:ring-1 focus:ring-crm-primary"
 />
 </div>
 <PremiumButton type="submit" className="w-full !py-1.5 !text-[11px] mt-2">Add Shift</PremiumButton>
 </form>
 </div>
 ) : (
 <>
 <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
 <span className="text-[11px] font-bold text-crm-muted uppercase tracking-wider">Today's Hours</span>
 <span className="text-[13px] font-mono font-bold text-crm-primary bg-crm-primary/10 px-2 py-0.5 rounded">
 {new Date(`1970-01-01T${staffMember.openTime}Z`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} - {new Date(`1970-01-01T${staffMember.closeTime}Z`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
 </span>
 </div>
 
 <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
 {staffMember.schedule.length === 0 ? (
 <p className="text-crm-muted text-center py-4 text-[13px] font-medium">No working slots configured.</p>
 ) : (
 staffMember.schedule.map((slot: any) => (
 <div key={slot.time} className={`px-2.5 py-1.5 rounded-lg text-[11px] flex justify-between items-center transition-colors ${slot.isBooked ? 'bg-amber-500/10 border border-amber-500/20' : staffMember.isClockedIn ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
 <span className="font-mono text-crm-muted font-medium">{slot.time}</span>
 {slot.isBooked ? (
 <span className="font-bold text-amber-500">Booked</span>
 ) : (
 <span className={staffMember.isClockedIn ? "text-emerald-400 font-bold" : "text-emerald-400/70 font-medium"}>
 {staffMember.isClockedIn ? 'Clocked In' : 'Open'}
 </span>
 )}
 </div>
 ))
 )}
 </div>
 </>
 )}
 </div>
 )}

 {/* Action Buttons */}
 {staffMember.role !== 'SHOP_ADMIN' && (
 <div className="flex flex-col gap-3 mt-auto pt-4">
 <Link
 href={`/shop/${shopId}/settings/team/${staffMember.id}/schedule`}
 className="w-full text-center bg-white/5 hover:bg-white/10 text-crm-text text-[11px] font-bold py-2.5 rounded-lg transition-colors border border-white/10 shadow-sm flex items-center justify-center uppercase tracking-wider"
 >
 Edit Schedule
 </Link>
 {!isOnLeave && (
 <form action={addLeaveAction} className="flex flex-col gap-2">
 <input type="hidden" name="staffId" value={staffMember.id} />
 <input type="hidden" name="shopId" value={shopId} />
 <input type="hidden" name="date" value={initialDate} />
 
 <div className="flex justify-center gap-1">
 <input 
 type="time" 
 name="startTime" 
 value={getTimeValue(staffMember.id, 'open', defaultOpen)}
 onChange={(e) => handleTimeChange(staffMember.id, 'open', e.target.value)}
 className="w-full bg-black/30 text-crm-muted text-[13px] p-1.5 rounded border border-white/10 shadow-sm outline-none focus:ring-1 focus:ring-crm-primary"
 />
 <input 
 type="time" 
 name="endTime" 
 value={getTimeValue(staffMember.id, 'close', defaultClose)}
 onChange={(e) => handleTimeChange(staffMember.id, 'close', e.target.value)}
 className="w-full bg-black/30 text-crm-muted text-[13px] p-1.5 rounded border border-white/10 shadow-sm outline-none focus:ring-1 focus:ring-crm-primary"
 />
 </div>

 <button type="submit" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold py-2 rounded-lg transition-colors border border-red-500/20 uppercase tracking-wider">
 Mark On Leave
 </button>
 </form>
 )}
 {removeUserAction && (
 <form action={removeUserAction} className="mt-2 pt-3 border-t border-white/10 flex justify-center">
 <input type="hidden" name="userId" value={staffMember.id} />
 <input type="hidden" name="shopId" value={shopId} />
 <button type="submit" className="text-[10px] text-red-400/70 hover:text-red-400 uppercase tracking-widest font-bold transition-colors">
 Remove User from Shop
 </button>
 </form>
 )}
 </div>
 )}
 </PremiumGlassCard>
 );
 })}
 </div>
 </StaffAvailability>
 </div>
 </div>
 </>
 );
}
