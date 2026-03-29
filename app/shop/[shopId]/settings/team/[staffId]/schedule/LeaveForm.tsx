'use client';

import { useState } from 'react';

export default function LeaveForm({ staffMember, shopId, addLeave }: { staffMember: any, shopId: string, addLeave: (formData: FormData) => void }) {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [reason, setReason] = useState('');

    const inputStyle: React.CSSProperties = { colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' };

    return (
        <form action={addLeave} className="space-y-3 mb-6 p-4 bg-slate-800/50 rounded-lg">
            <input type="hidden" name="staffId" value={staffMember.id} />
            <input type="hidden" name="shopId" value={shopId} />
            <input type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" min={new Date().toISOString().split('T')[0]} />
            <div className="flex gap-2">
                <input type="time" name="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={inputStyle} className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
                <input type="time" name="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={inputStyle} className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <input type="text" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" style={inputStyle} className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded text-sm font-bold">Add Leave Day</button>
        </form>
    );
}
