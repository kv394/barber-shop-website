'use client';

import { useState } from 'react';

const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const inputStyle = { colorScheme: 'dark' as const, color: '#fff', backgroundColor: '#1e293b' };

export default function ScheduleForm({ staffMember, shopId, updateSchedule }: { staffMember: any, shopId: string, updateSchedule: (formData: FormData) => void }) {
    const [workingHours, setWorkingHours] = useState(() => {
        const initialHours = staffMember.workingHours || {};
        // Ensure every day has an entry to avoid uncontrolled component warnings
        daysOfWeek.forEach(day => {
            if (initialHours[day] === undefined) {
                initialHours[day] = null;
            }
        });
        return initialHours;
    });

    const handleCheckboxChange = (day: string, checked: boolean) => {
        setWorkingHours((prev: any) => ({
            ...prev,
            [day]: checked ? { open: '09:00', close: '17:00' } : null,
        }));
    };

    const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
        setWorkingHours((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [type]: value },
        }));
    };

    return (
        <form action={updateSchedule}>
            <input type="hidden" name="staffId" value={staffMember.id} />
            <input type="hidden" name="shopId" value={shopId} />
            <div className="space-y-4">
                {daysOfWeek.map(day => {
                    const dayHours = workingHours[day];
                    return (
                        <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="flex items-center">
                                <input type="checkbox" id={`${day}-enabled`} name={`${day}-enabled`} checked={!!dayHours} onChange={(e) => handleCheckboxChange(day, e.target.checked)} className="w-5 h-5 accent-brand-gold" />
                                <label htmlFor={`${day}-enabled`} className="ml-3 text-lg font-semibold capitalize">{day}</label>
                            </div>
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                <input type="time" name={`${day}-open`} value={dayHours?.open || ''} onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                    style={inputStyle}
                                    className="p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" disabled={!dayHours} />
                                <input type="time" name={`${day}-close`} value={dayHours?.close || ''} onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                    style={inputStyle}
                                    className="p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" disabled={!dayHours} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-8">
                <button type="submit" className="bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg hover:bg-white transition-colors">Save Weekly Schedule</button>
            </div>
        </form>
    )
}
