import Image from 'next/image';
import React from 'react';

interface Staff {
  id: string;
  name: string;
  workingHours: any;
}

const ANY_STAFF_VALUE = '__any__';

export default function BookingStaffSelection({
  selectedTime,
  selectedStaff,
  setSelectedStaff,
  staffAtSelectedTime,
  tStyles,
  themeColor,
  activeBg,
}: {
  selectedTime: string;
  selectedStaff: string;
  setSelectedStaff: (staff: string) => void;
  staffAtSelectedTime: Staff[];
  tStyles: any;
  themeColor?: string;
  activeBg: string;
}) {
  if (!selectedTime) return null;

  return (
    <div className="mb-5">
      <p className="block text-crm-text text-[12px] font-semibold mb-2">Select Staff</p>
      <div className="space-y-2">
        <button onClick={() => setSelectedStaff(ANY_STAFF_VALUE)} className={`w-full p-3 text-left text-[13px] rounded-lg border transition-colors ${selectedStaff === ANY_STAFF_VALUE ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === ANY_STAFF_VALUE ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}>
          Any Available
        </button>
        {staffAtSelectedTime.map(s => (
          <button key={s.id} onClick={() => setSelectedStaff(s.id)} className={`w-full p-3 text-left text-[13px] rounded-lg border transition-colors ${selectedStaff === s.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === s.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
