import React from 'react';
import BlockTimeButton from '@/components/shop-admin/BlockTimeButton';
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
        return (
          <div key={staffMember.id} className="bg-crm-bg/70 border border-crm-border shadow-sm rounded-lg p-3 sm:p-4 flex flex-col">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2 gap-2">
              <StaffProfileModalWrapper staff={staffMember}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-crm-surface border border-brand-gold/50 flex items-center justify-center shrink-0">
                    {staffMember.imageUrl ? (
                      <img src={staffMember.imageUrl} alt={staffMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px]">👤</span>
                    )}
                  </div>
                  <h2 className="font-semibold text-crm-accent truncate text-xl font-bold">
                    {staffMember.name || staffMember.email || 'Unnamed Staff'}
                  </h2>
                </div>
              </StaffProfileModalWrapper>
              <div className="flex flex-col gap-1 items-end shrink-0">
                {staffMember.using === 'default' && (
                  <span className="text-[13px] sm:text-[11px] bg-amber-900/50 text-amber-300 px-2 py-0.5 sm:py-1 rounded-full">
                    Default Hours
                  </span>
                )}
                {staffMember.using === 'shop' && (
                  <span className="text-[13px] sm:text-[11px] bg-status-info/20 text-status-info px-2 py-0.5 sm:py-1 rounded-full">
                    Shop Hours
                  </span>
                )}
              </div>
            </div>
            <div className="flex-grow max-h-[85vh] sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 space-y-1.5 mt-2 scrollbar-thin">
              {isOnLeave ? (
                <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-status-cancelled/10 border border-status-cancelled/20">
                  <p className="font-bold text-status-cancelled tracking-widest text-[13px]">ON LEAVE</p>
                </div>
              ) : isNotWorking ? (
                <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-crm-surface/50 border border-crm-border border-dashed">
                  <p className="font-bold text-crm-muted tracking-widest text-[13px]">NOT WORKING</p>
                </div>
              ) : staffMember.schedule.length > 0 ? (
                staffMember.schedule.map((slot: any) => (
                  <div
                    key={slot.time}
                    className={`p-3 sm:p-2.5 rounded-xl border sm:rounded-md text-[13px] flex justify-between items-center ${slot.isBooked ? 'bg-amber-800/60 border-amber-700/50' : 'bg-status-confirmed/10 border-status-confirmed/20'}`}
                  >
                    <span className={`font-mono font-medium ${slot.isBooked ? 'text-amber-200/70' : 'text-crm-text'}`}> {slot.time} </span>
                    <div className="flex items-center gap-2">
                      {slot.isBooked ? (
                        <span className="font-bold text-amber-300 tracking-tight">Booked</span>
                      ) : (
                        <span className="font-semibold text-status-confirmed">Available</span>
                      )}
                      {!slot.isBooked && (
                        <BlockTimeButton shopId={"${"}"}"} staffId={staffMember.id} date={selectedDate} time={slot.isoTime} />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-crm-surface/50 border border-crm-border border-dashed">
                  <p className="text-crm-muted italic text-[13px]">No slots in selected range.</p>
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
