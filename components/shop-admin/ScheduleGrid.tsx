import React from 'react';
import BlockTimeButton from '@/components/shop-admin/BlockTimeButton';
import BlockTimeRangeInline from '@/components/shop-admin/BlockTimeRangeInline';
import StaffProfileModalWrapper from '@/components/shop-admin/StaffProfileModalWrapper';

interface ScheduleGridProps {
 staff: any[];
 selectedDate: string;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ staff, selectedDate }) => {
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
 {staff.map((staffMember) => {
 const isOnLeave = staffMember.isOnLeave;
 const isNotWorking = staffMember.using === 'not-working';
 const firstSlot = staffMember.schedule?.[0];
 const lastSlot = staffMember.schedule?.[staffMember.schedule.length - 1];
 const workingHours = firstSlot && lastSlot ? `${firstSlot.time} - ${lastSlot.time}` : null;

 return (
 <div key={staffMember.id} className="bg-crm-bg/70 border border-crm-border shadow-sm rounded-lg p-3 sm:p-4 flex flex-col relative overflow-hidden">
 {/* Subtle decorative top border */}
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-crm-primary/40 to-brand-gold/40"></div>
 
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-3 mt-1">
 <StaffProfileModalWrapper staff={staffMember}>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full overflow-hidden bg-crm-surface border-2 border-crm-primary/20 shadow-sm flex items-center justify-center shrink-0">
 {staffMember.imageUrl ? (
 <img src={staffMember.imageUrl} alt={staffMember.name} className="w-full h-full object-cover" />
 ) : (
 <span className="text-[14px]">👤</span>
 )}
 </div>
 <div>
 <h2 className="font-bold text-crm-accent truncate text-[16px] leading-tight mb-0.5">
 {staffMember.name || staffMember.email || 'Unnamed Staff'}
 </h2>
 {workingHours && !isOnLeave && !isNotWorking && (
 <p className="text-crm-muted text-[11px] font-medium tracking-wide">
 🕒 {workingHours}
 </p>
 )}
 </div>
 </div>
 </StaffProfileModalWrapper>
 <div className="flex flex-col gap-1 items-end shrink-0">
 {staffMember.using === 'default' && (
 <span className="text-[10px] bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-800/50 uppercase tracking-wider font-bold">
 Default
 </span>
 )}
 {staffMember.using === 'shop' && (
 <span className="text-[10px] bg-status-info/20 text-status-info px-2 py-0.5 rounded-lg border border-status-info/20 uppercase tracking-wider font-bold">
 Shop
 </span>
 )}
 </div>
 </div>

 {!isOnLeave && !isNotWorking && staffMember.schedule?.length > 0 && (
 <BlockTimeRangeInline shopId={staffMember.shopId} staffId={staffMember.id} date={selectedDate} />
 )}

 <div className="flex-grow max-h-[85vh] sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 space-y-1.5 mt-1 scrollbar-thin relative">
 {/* Vertical timeline line */}
 <div className="absolute left-1.5 top-2 bottom-2 w-px bg-crm-border/60 z-0 hidden sm:block"></div>
 
 {isOnLeave ? (
 <div className="text-center py-8 h-full flex flex-col justify-center items-center rounded-xl bg-status-cancelled/5 border border-status-cancelled/20">
 <div className="w-10 h-10 rounded-full bg-status-cancelled/10 flex items-center justify-center mb-2">🌴</div>
 <p className="font-bold text-status-cancelled tracking-widest text-[12px] uppercase">On Leave</p>
 </div>
 ) : isNotWorking ? (
 <div className="text-center py-8 h-full flex flex-col justify-center items-center rounded-xl bg-crm-surface/30 border border-crm-border border-dashed">
 <div className="w-10 h-10 rounded-full bg-crm-border/30 flex items-center justify-center mb-2">😴</div>
 <p className="font-bold text-crm-muted tracking-widest text-[12px] uppercase">Not Working</p>
 </div>
 ) : staffMember.schedule.length > 0 ? (
 <div className="space-y-1.5 relative z-10 pl-0 sm:pl-4">
 {staffMember.schedule.map((slot: any) => (
 <div
 key={slot.time}
 className={`p-2.5 sm:p-2 rounded-xl border sm:rounded-lg text-[13px] flex justify-between items-center transition-all ${slot.isBooked ? 'bg-amber-900/20 border-amber-800/40 opacity-80' : 'bg-crm-surface hover:border-crm-primary/40 border-crm-border shadow-sm'}`}
 >
 <div className="flex items-center gap-2">
 {/* Timeline dot */}
 <div className={`w-2 h-2 rounded-full hidden sm:block absolute -left-[18px] border-2 ${slot.isBooked ? 'bg-amber-500 border-crm-bg' : 'bg-status-confirmed border-crm-bg'}`}></div>
 <span className={`font-mono font-semibold tracking-tight ${slot.isBooked ? 'text-amber-200/70' : 'text-crm-text'}`}>
 {slot.time}
 </span>
 </div>
 <div className="flex items-center gap-2">
 {slot.isBooked ? (
 <span className="font-bold text-amber-500/80 tracking-tight text-[11px] uppercase bg-amber-900/30 px-2 py-0.5 rounded">Booked</span>
 ) : (
 <span className="font-bold text-status-confirmed tracking-tight text-[11px] uppercase bg-status-confirmed/10 px-2 py-0.5 rounded">Available</span>
 )}
 {!slot.isBooked && (
 <BlockTimeButton shopId={staffMember.shopId} staffId={staffMember.id} date={selectedDate} time={slot.isoTime} />
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-crm-surface/30 border border-crm-border border-dashed">
 <p className="text-crm-muted italic text-[12px]">No slots in selected range.</p>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
};

export default ScheduleGrid;
