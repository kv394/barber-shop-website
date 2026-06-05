import Image from 'next/image';
import React from 'react';

export default function BookingTimeSelection({
  selectedDate,
  selectedTime,
  setSelectedTime,
  setSelectedStaff,
  isLoading,
  availableTimeSlots,
  tStyles,
  themeColor,
  activeBg,
}: {
  selectedDate: string;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  setSelectedStaff: (staff: string) => void;
  isLoading: boolean;
  availableTimeSlots: string[];
  tStyles: any;
  themeColor?: string;
  activeBg: string;
}) {
  if (!selectedDate) return null;

  return (
    <div className="mb-5">
      <label className="block text-crm-text text-[12px] font-semibold mb-2">Select Time</label>
      {isLoading ? (
        <p className="text-crm-muted text-center py-4 text-[13px]">Loading availability...</p>
      ) : availableTimeSlots.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {availableTimeSlots.map(time => (
            <button key={time} onClick={() => { setSelectedTime(time); setSelectedStaff(''); }} className={`p-2 text-[13px] rounded-lg border transition-colors ${selectedTime === time ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedTime === time ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}>
              {time}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-crm-muted text-center py-4 text-[13px] bg-crm-bg rounded-lg">No available times on this date.</p>
      )}
    </div>
  );
}
