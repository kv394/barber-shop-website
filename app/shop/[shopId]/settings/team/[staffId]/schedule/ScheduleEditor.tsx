'use client';

import { useState, useEffect } from 'react';
import { updateSchedule, addLeave, deleteLeave } from './actions';

const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayEmojis: Record<string, string> = { sunday: '🌅', monday: '🌤️', tuesday: '⚡', wednesday: '🔥', thursday: '✨', friday: '🎉', saturday: '💤' };

const timeStyle = { colorScheme: 'dark' as const, color: '#fff', backgroundColor: '#1e293b' };

function getTimeBarPercent(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
}

export default function ScheduleEditor({ staffMember, shopId }: { staffMember: any, shopId: string }) {
    const [workingHours, setWorkingHours] = useState(staffMember.workingHours || {});
    const [leaves, setLeaves] = useState(staffMember.leaves || []);

    // State for the new leave form
    const [leaveDate, setLeaveDate] = useState('');
    const [leaveStartTime, setLeaveStartTime] = useState('09:00');
    const [leaveEndTime, setLeaveEndTime] = useState('17:00');
    const [leaveReason, setLeaveReason] = useState('');
    const [fullDay, setFullDay] = useState(false);

    // This is the critical fix:
    // This useEffect hook ensures that if the staffMember data changes (e.g., after a form submission),
    // the component's internal state is updated to match, keeping the UI in sync.
    useEffect(() => {
        const initialHours = staffMember.workingHours || {};
        daysOfWeek.forEach(day => {
            if (initialHours[day] === undefined) initialHours[day] = null;
        });
        setWorkingHours(initialHours);
        setLeaves(staffMember.leaves || []);
    }, [staffMember]);

    const handleCheckboxChange = (day: string, checked: boolean) => {
        setWorkingHours((prev: any) => ({ ...prev, [day]: checked ? { open: '09:00', close: '17:00' } : null }));
    };
    const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
        setWorkingHours((prev: any) => ({ ...prev, [day]: { ...prev[day], [type]: value } }));
    };

    const handleFullDayToggle = (checked: boolean) => {
        setFullDay(checked);
        if (checked) { setLeaveStartTime('00:00'); setLeaveEndTime('23:59'); }
        else { setLeaveStartTime('09:00'); setLeaveEndTime('17:00'); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8">

            {/* ═══════ LEFT: Weekly Schedule (3 cols) ═══════ */}
            <div className="lg:col-span-3">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 rounded-2xl border border-white/10 shadow-xl">
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-lg sm:text-xl">🗓️</div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white">Weekly Schedule</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Set working hours for each day</p>
                        </div>
                    </div>

                    <form action={updateSchedule}>
                        <input type="hidden" name="staffId" value={staffMember.id} />
                        <input type="hidden" name="shopId" value={shopId} />

                        <div className="space-y-3">
                            {daysOfWeek.map(day => {
                                const dayHours = workingHours[day];
                                const isEnabled = !!dayHours;
                                const openPct = isEnabled ? getTimeBarPercent(dayHours.open) : 0;
                                const closePct = isEnabled ? getTimeBarPercent(dayHours.close) : 0;
                                const barWidth = closePct - openPct;

                                return (
                                    <div key={day}
                                        className={`relative rounded-xl border transition-all duration-200 overflow-hidden
                                            ${isEnabled
                                                ? 'bg-slate-800/80 border-white/10 hover:border-brand-gold/40'
                                                : 'bg-slate-900/50 border-white/5 opacity-60'}`}>

                                        <div className="p-4">
                                            {/* Day header row */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">{dayEmojis[day]}</span>
                                                    <span className="text-base font-bold capitalize text-white">{day}</span>
                                                    {!isEnabled && (
                                                        <span className="text-[10px] bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Day Off</span>
                                                    )}
                                                </div>

                                                {/* Toggle switch */}
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" id={`${day}-enabled`} name={`${day}-enabled`}
                                                        checked={isEnabled} onChange={(e) => handleCheckboxChange(day, e.target.checked)}
                                                        className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-brand-gold transition-colors duration-200
                                                        after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-full" />
                                                </label>
                                            </div>

                                            {/* Time inputs */}
                                            {isEnabled && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Opens</label>
                                                        <input type="time" name={`${day}-open`} value={dayHours?.open || ''}
                                                            onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                                                            style={timeStyle}
                                                            className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Closes</label>
                                                        <input type="time" name={`${day}-close`} value={dayHours?.close || ''}
                                                            onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                                                            style={timeStyle}
                                                            className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Visual time bar */}
                                        {isEnabled && barWidth > 0 && (
                                            <div className="h-1.5 bg-slate-700/50 relative">
                                                <div className="absolute h-full rounded-r-full bg-gradient-to-r from-brand-gold/70 to-brand-gold transition-all duration-300"
                                                    style={{ left: `${openPct}%`, width: `${barWidth}%` }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 sm:mt-6">
                            <button type="submit"
                                className="w-full sm:w-auto bg-brand-gold text-brand-dark font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-brand-gold/20 text-sm sm:text-base">
                                Save Weekly Schedule
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ═══════ RIGHT: Leave Management (2 cols) ═══════ */}
            <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                    {/* Gold accent line */}
                    <div className="h-1 bg-gradient-to-r from-brand-gold via-brand-gold/60 to-transparent" />

                    <div className="p-4 sm:p-6">
                        {/* Section header */}
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-lg sm:text-xl">🏖️</div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">Leave Management</h3>
                                <p className="text-[10px] sm:text-xs text-gray-500">Schedule time off</p>
                            </div>
                        </div>

                        {/* Add Leave Form */}
                        <form action={addLeave} className="mb-6 p-4 bg-slate-800/70 rounded-xl border border-white/5 space-y-3">
                            <input type="hidden" name="staffId" value={staffMember.id} />
                            <input type="hidden" name="shopId" value={shopId} />

                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">📅 Date</label>
                                <input type="date" name="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} required
                                    style={timeStyle}
                                    className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all"
                                    min={new Date().toISOString().split('T')[0]} />
                            </div>

                            {/* Full day toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={fullDay} onChange={e => handleFullDayToggle(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:bg-brand-gold transition-colors duration-200
                                    after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 peer-checked:after:translate-x-full relative" />
                                <span className="text-xs text-gray-400">Full day leave</span>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">🕐 From</label>
                                    <input type="time" name="startTime" value={leaveStartTime} onChange={e => { setLeaveStartTime(e.target.value); setFullDay(false); }} required
                                        style={timeStyle}
                                        className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">🕐 To</label>
                                    <input type="time" name="endTime" value={leaveEndTime} onChange={e => { setLeaveEndTime(e.target.value); setFullDay(false); }} required
                                        style={timeStyle}
                                        className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">💬 Reason</label>
                                <input type="text" name="reason" value={leaveReason} onChange={e => setLeaveReason(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full bg-slate-800 p-2.5 rounded-lg border border-slate-600 text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                            </div>

                            <button type="submit"
                                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-red-500/20">
                                Add Leave
                            </button>
                        </form>

                        {/* Upcoming Leave list */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Upcoming Leave</h4>

                            {leaves.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                    <div className="text-4xl mb-2">🎉</div>
                                    <p className="text-sm text-gray-500">No upcoming leave scheduled</p>
                                    <p className="text-xs text-gray-600 mt-1">All hands on deck!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leaves.map((leave: any) => {
                                        const d = new Date(leave.date);
                                        const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
                                        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        const startStr = new Date(leave.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const endStr = new Date(leave.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <div key={leave.id}
                                                className="group bg-slate-800/70 rounded-xl p-4 border border-white/5 hover:border-red-500/30 transition-all duration-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">{weekday}</span>
                                                            <span className="font-semibold text-white text-sm">{dateStr}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            🕐 {startStr} <span className="text-gray-600">→</span> {endStr}
                                                        </p>
                                                        {leave.reason && (
                                                            <p className="text-xs text-gray-500 mt-1.5 italic">💬 {leave.reason}</p>
                                                        )}
                                                    </div>
                                                    <form action={deleteLeave}>
                                                        <input type="hidden" name="leaveId" value={leave.id} />
                                                        <input type="hidden" name="staffId" value={staffMember.id} />
                                                        <input type="hidden" name="shopId" value={shopId} />
                                                        <button type="submit"
                                                            className="sm:opacity-0 sm:group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/30 text-red-400 p-1.5 sm:p-2 rounded-lg transition-all duration-200"
                                                            title="Delete leave">
                                                            🗑️
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
