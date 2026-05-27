import React from 'react';
import BlockTimeButton from '@/components/shop-admin/BlockTimeButton';
import StaffProfileModalWrapper from '@/components/shop-admin/StaffProfileModalWrapper';

interface TimelineGridProps {
 staff: any[];
 selectedDate: string;
}

export default function TimelineGrid({ staff, selectedDate }: TimelineGridProps) {
 // 1. Extract all unique time slots across all staff to form the time axis
 const allSlots = new Set<string>();
 const timeDisplayMap = new Map<string, string>(); // maps isoTime -> "09:00 AM"

 staff.forEach(s => {
 if (!s.isOnLeave && s.using !== 'not-working' && s.schedule) {
 s.schedule.forEach((slot: any) => {
 allSlots.add(slot.isoTime);
 timeDisplayMap.set(slot.isoTime, slot.time);
 });
 }
 });

 const sortedIsoTimes = Array.from(allSlots).sort();

 if (sortedIsoTimes.length === 0) {
 return (
 <div className="text-center py-12 bg-crm-surface/50 border border-crm-border border-dashed rounded-2xl">
 <p className="text-crm-muted italic">No staff working slots found for this day.</p>
 </div>
 );
 }

 return (
 <div className="bg-crm-surface rounded-xl border border-crm-border shadow-sm overflow-hidden w-full max-w-full">
 <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-crm-border scrollbar-track-transparent">
 <table className="w-full border-collapse text-left min-w-max">
 <thead>
 <tr>
 <th className="sticky left-0 z-20 bg-crm-surface backdrop-blur-sm border-b border-r border-crm-border p-3 min-w-[200px] sm:min-w-[250px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
 <span className="text-[11px] font-bold text-crm-muted uppercase tracking-wider">Staff Member</span>
 </th>
 {sortedIsoTimes.map(isoTime => (
 <th key={isoTime} className="border-b border-r border-crm-border/50 p-2 text-center min-w-[80px] bg-crm-bg/30 text-[10px] font-mono text-crm-text tracking-tight">
 {timeDisplayMap.get(isoTime)}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {staff.map(staffMember => {
 const isOnLeave = staffMember.isOnLeave;
 const isNotWorking = staffMember.using === 'not-working';
 
 return (
 <tr key={staffMember.id} className="group border-b border-crm-border hover:bg-crm-bg/20 transition-colors">
 <td className="sticky left-0 z-10 bg-crm-surface group-hover:bg-crm-bg/90 border-r border-crm-border p-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
 <StaffProfileModalWrapper staff={staffMember} shopId={staffMember.shopId}>
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full overflow-hidden bg-crm-bg border border-crm-border shadow-sm flex items-center justify-center shrink-0">
 {staffMember.imageUrl ? (
 <img src={staffMember.imageUrl} alt={staffMember.name} className="w-full h-full object-cover" />
 ) : (
 <span className="text-[12px]">👤</span>
 )}
 </div>
 <div className="truncate min-w-0">
 <h2 className="font-bold text-crm-text truncate text-[14px] leading-tight">
 {staffMember.name || staffMember.email || 'Unnamed Staff'}
 </h2>
 <div className="flex gap-1 mt-0.5">
 {staffMember.using === 'default' && (
 <span className="text-[9px] bg-amber-900/30 text-amber-500 px-1.5 py-0.5 rounded border border-amber-800/30 uppercase tracking-wider font-bold">Default</span>
 )}
 {staffMember.using === 'shop' && (
 <span className="text-[9px] bg-status-info/10 text-status-info px-1.5 py-0.5 rounded border border-status-info/20 uppercase tracking-wider font-bold">Shop</span>
 )}
 </div>
 </div>
 </div>
 </StaffProfileModalWrapper>
 </td>
 
 {isOnLeave ? (
 <td colSpan={sortedIsoTimes.length} className="bg-status-cancelled/5 border-r border-crm-border/50 text-center relative overflow-hidden p-0">
 <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)]"></div>
 <span className="relative z-10 font-bold text-status-cancelled tracking-widest text-[11px] uppercase">🌴 On Leave</span>
 </td>
 ) : isNotWorking ? (
 <td colSpan={sortedIsoTimes.length} className="bg-crm-bg/30 border-r border-crm-border/50 text-center p-0">
 <span className="font-bold text-crm-muted tracking-widest text-[11px] uppercase">😴 Not Working</span>
 </td>
 ) : (
 sortedIsoTimes.map(isoTime => {
 const slot = staffMember.schedule?.find((s: any) => s.isoTime === isoTime);
 
 if (!slot) {
 return <td key={isoTime} className="p-0.5 border-r border-crm-border/30 bg-crm-bg/10 min-w-[80px]"></td>;
 }
 
 if (slot.isBooked) {
 return (
 <td key={isoTime} className="p-0.5 border-r border-crm-border/30 min-w-[80px]">
 <div className="w-full h-full min-h-[44px] bg-amber-900/20 border border-amber-800/40 rounded flex items-center justify-center cursor-not-allowed">
 <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-wider">Booked</span>
 </div>
 </td>
 );
 }
 
 return (
 <td key={isoTime} className="p-0.5 border-r border-crm-border/30 min-w-[80px]">
 <div className="w-full h-full min-h-[44px] bg-status-confirmed/10 hover:bg-status-confirmed/20 border border-status-confirmed/20 hover:border-status-confirmed/40 rounded flex flex-col items-center justify-center transition-colors group/slot relative overflow-hidden">
 <span className="text-[9px] font-bold text-status-confirmed uppercase tracking-wider transition-opacity duration-200 group-hover/slot:opacity-0">Avail</span>
 <div className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center bg-crm-surface/80 backdrop-blur-[1px] transition-opacity duration-200">
 <BlockTimeButton 
 shopId={staffMember.shopId} 
 staffId={staffMember.id} 
 date={selectedDate} 
 time={slot.isoTime} 
 className="w-full h-full flex items-center justify-center text-[10px] font-bold text-crm-muted hover:text-crm-text uppercase tracking-wider hover:bg-crm-bg transition-colors"
 />
 </div>
 </div>
 </td>
 );
 })
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 );
}
