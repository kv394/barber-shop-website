'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

interface TimeSlot {
  time: string;
  isBooked: boolean;
  isOnLeave: boolean;
}

interface TeamStaffCardProps {
  staffMember: any;
  shopId: string;
  selectedDate: string;
  addLeaveAction: (formData: FormData) => Promise<void>;
  removeLeaveAction: (formData: FormData) => Promise<void>;
  updateDayHoursAction: (formData: FormData) => Promise<void>;
  onAfterAction?: () => void;
}

const timeStyle = { colorScheme: 'dark' as const, color: '#fff', backgroundColor: '#1e293b' };

function getTimeBarPercent(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return ((h * 60 + m) / (24 * 60)) * 100;
}

export default function TeamStaffCard({
  staffMember,
  shopId,
  selectedDate,
  addLeaveAction,
  removeLeaveAction,
  updateDayHoursAction,
  onAfterAction,
}: TeamStaffCardProps) {
  const [isPending, startTransition] = useTransition();

  // Working hours state
  const [isWorking, setIsWorking] = useState<boolean>(staffMember.isWorking ?? false);
  const [openTime, setOpenTime] = useState<string>(staffMember.openTime || '09:00');
  const [closeTime, setCloseTime] = useState<string>(staffMember.closeTime || '17:00');
  const [hoursDirty, setHoursDirty] = useState(false);

  // Manual leave form state
  const [leaveStart, setLeaveStart] = useState('09:00');
  const [leaveEnd, setLeaveEnd] = useState('17:00');
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Slot selection
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());

  const schedule: TimeSlot[] = staffMember.schedule || [];
  const dayOfWeek: string = staffMember.dayOfWeek || '';
  const dayLabel = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  const dayEmojis: Record<string, string> = {
    sunday: '🌅', monday: '🌤️', tuesday: '⚡', wednesday: '🔥',
    thursday: '✨', friday: '🎉', saturday: '💤',
  };

  // Slot stats
  const totalSlots = schedule.length;
  const bookedSlots = schedule.filter(s => s.isBooked).length;
  const leaveSlots = schedule.filter(s => s.isOnLeave).length;
  const availableSlots = totalSlots - bookedSlots - leaveSlots;

  // -- helpers --
  const to24h = (time12: string): string => {
    const m = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return time12;
    let h = parseInt(m[1], 10);
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m[2]}`;
  };

  const add30 = (t: string): string => {
    const [h, m] = t.split(':').map(Number);
    const tot = h * 60 + m + 30;
    return `${(Math.floor(tot / 60) % 24).toString().padStart(2, '0')}:${(tot % 60).toString().padStart(2, '0')}`;
  };

  const toggleSlot = (index: number) => {
    if (schedule[index].isBooked) return;
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const selectAllAvailable = () => {
    setSelectedSlots(new Set(schedule.map((s, i) => (!s.isBooked && !s.isOnLeave ? i : -1)).filter(i => i >= 0)));
  };

  const clearSelection = () => setSelectedSlots(new Set());

  // -- actions --
  const handleSaveHours = () => {
    const fd = new FormData();
    fd.set('staffId', staffMember.id);
    fd.set('shopId', shopId);
    fd.set('dayOfWeek', dayOfWeek);
    fd.set('isWorking', isWorking ? 'true' : 'false');
    fd.set('openTime', openTime);
    fd.set('closeTime', closeTime);
    fd.set('date', selectedDate);
    startTransition(async () => { await updateDayHoursAction(fd); setHoursDirty(false); onAfterAction?.(); });
  };

  const handleSlotLeave = () => {
    if (selectedSlots.size === 0) return;
    const idx = Array.from(selectedSlots).sort((a, b) => a - b);
    const fd = new FormData();
    fd.set('staffId', staffMember.id);
    fd.set('shopId', shopId);
    fd.set('date', selectedDate);
    fd.set('startTime', to24h(schedule[idx[0]].time));
    fd.set('endTime', add30(to24h(schedule[idx[idx.length - 1]].time)));
    startTransition(async () => { await addLeaveAction(fd); setSelectedSlots(new Set()); onAfterAction?.(); });
  };

  const handleSlotRemoveLeave = () => {
    const leaveIdx = Array.from(selectedSlots).filter(i => schedule[i].isOnLeave).sort((a, b) => a - b);
    if (!leaveIdx.length) return;
    const fd = new FormData();
    fd.set('staffId', staffMember.id);
    fd.set('shopId', shopId);
    fd.set('date', selectedDate);
    fd.set('startTime', to24h(schedule[leaveIdx[0]].time));
    fd.set('endTime', add30(to24h(schedule[leaveIdx[leaveIdx.length - 1]].time)));
    startTransition(async () => { await removeLeaveAction(fd); setSelectedSlots(new Set()); onAfterAction?.(); });
  };

  const handleManualLeave = () => {
    if (!leaveStart || !leaveEnd) return;
    const fd = new FormData();
    fd.set('staffId', staffMember.id);
    fd.set('shopId', shopId);
    fd.set('date', selectedDate);
    fd.set('startTime', leaveStart);
    fd.set('endTime', leaveEnd);
    startTransition(async () => { await addLeaveAction(fd); setShowLeaveForm(false); onAfterAction?.(); });
  };

  const hasLeaveSelected = Array.from(selectedSlots).some(i => schedule[i]?.isOnLeave);
  const hasAvailSelected = Array.from(selectedSlots).some(i => schedule[i] && !schedule[i].isOnLeave && !schedule[i].isBooked);

  // Visual time bar
  const openPct = isWorking ? getTimeBarPercent(openTime) : 0;
  const closePct = isWorking ? getTimeBarPercent(closeTime) : 0;
  const barWidth = closePct - openPct;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-2xl">

      {/* ── Gold accent top bar ── */}
      <div className="h-1 bg-gradient-to-r from-brand-gold via-brand-gold/60 to-transparent" />

      {/* ── Header ── */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circle */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center text-lg font-bold text-brand-gold border border-brand-gold/20 shrink-0">
              {(staffMember.name || staffMember.email)?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">{staffMember.name || staffMember.email?.split('@')[0]}</h2>
              <p className="text-[11px] text-gray-500 truncate">{staffMember.email}</p>
            </div>
          </div>
          <Link href={`/shop/${shopId}/settings/team/${staffMember.id}/schedule`}
            className="shrink-0 text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/40 text-gray-300 hover:text-brand-gold px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5">
            📋 <span className="hidden sm:inline">Full</span> Schedule
          </Link>
        </div>

        {/* ── Quick stats ── */}
        {totalSlots > 0 && (
          <div className="flex items-center gap-3 mt-3 py-2 px-3 bg-slate-800/50 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-green-400">{availableSlots} open</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400">{bookedSlots} booked</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-red-400">{leaveSlots} leave</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* ══════════ 1. WORKING HOURS ══════════ */}
        <div className={`relative rounded-xl border transition-all duration-200 overflow-hidden
          ${isWorking
            ? 'bg-slate-800/80 border-white/10 hover:border-brand-gold/40'
            : 'bg-slate-900/50 border-white/5 opacity-70'}`}>

          <div className="p-4">
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{dayEmojis[dayOfWeek] || '📅'}</span>
                <span className="text-sm font-bold text-white capitalize">{dayLabel}</span>
                {!isWorking && (
                  <span className="text-[10px] bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Day Off</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Save button */}
                {hoursDirty && (
                  <button type="button" onClick={handleSaveHours} disabled={isPending}
                    className="text-[11px] bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-lg font-bold transition-all duration-200 disabled:opacity-50 border border-green-500/20">
                    {isPending ? '⏳' : '💾 Save'}
                  </button>
                )}

                {/* Toggle switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isWorking}
                    onChange={e => { setIsWorking(e.target.checked); setHoursDirty(true); }}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-brand-gold transition-colors duration-200
                    after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>

            {/* Time pickers */}
            {isWorking && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Opens</label>
                  <input type="time" value={openTime}
                    onChange={e => { setOpenTime(e.target.value); setHoursDirty(true); }}
                    style={timeStyle}
                    className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">Closes</label>
                  <input type="time" value={closeTime}
                    onChange={e => { setCloseTime(e.target.value); setHoursDirty(true); }}
                    style={timeStyle}
                    className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                </div>
              </div>
            )}
          </div>

          {/* Visual time bar */}
          {isWorking && barWidth > 0 && (
            <div className="h-1.5 bg-slate-700/50 relative">
              <div className="absolute h-full rounded-r-full bg-gradient-to-r from-brand-gold/70 to-brand-gold transition-all duration-300"
                style={{ left: `${openPct}%`, width: `${barWidth}%` }} />
            </div>
          )}
        </div>

        {/* ══════════ 2. TIME SLOTS ══════════ */}
        {schedule.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🕐</span>
                <span className="text-sm font-bold text-white">Time Slots</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={selectAllAvailable}
                  className="text-[10px] text-brand-gold hover:text-white font-semibold px-2 py-0.5 rounded-md bg-brand-gold/10 hover:bg-brand-gold/20 transition-all">
                  Select all
                </button>
                {selectedSlots.size > 0 && (
                  <button type="button" onClick={clearSelection}
                    className="text-[10px] text-gray-400 hover:text-white font-semibold px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-all">
                    Clear ({selectedSlots.size})
                  </button>
                )}
              </div>
            </div>

            {/* Slot grid */}
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1">
              {schedule.map((slot: TimeSlot, i: number) => {
                const sel = selectedSlots.has(i);

                let bgClass: string;
                let borderClass: string;
                if (sel) {
                  bgClass = 'bg-blue-600/30';
                  borderClass = 'border-blue-400/60 ring-1 ring-blue-400/40';
                } else if (slot.isOnLeave) {
                  bgClass = 'bg-red-950/50';
                  borderClass = 'border-red-500/20';
                } else if (slot.isBooked) {
                  bgClass = 'bg-amber-950/50';
                  borderClass = 'border-amber-500/20';
                } else {
                  bgClass = 'bg-slate-800/60 hover:bg-slate-700/60';
                  borderClass = 'border-white/5 hover:border-white/15';
                }

                return (
                  <div key={slot.time}
                    onClick={() => toggleSlot(i)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all duration-150 ${bgClass} ${borderClass} ${slot.isBooked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>

                    <div className="flex items-center gap-2.5">
                      {sel && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />}
                      <span className="text-white text-sm font-mono tracking-wider">{slot.time}</span>
                    </div>

                    {slot.isOnLeave ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Leave</span>
                    ) : slot.isBooked ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Booked</span>
                    ) : (
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Open</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slot action buttons */}
            {selectedSlots.size > 0 && (
              <div className="mt-3 flex gap-2">
                {hasAvailSelected && (
                  <button type="button" onClick={handleSlotLeave} disabled={isPending}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 p-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                    {isPending ? '⏳ Applying…' : '🚫 Mark as Leave'}
                  </button>
                )}
                {hasLeaveSelected && (
                  <button type="button" onClick={handleSlotRemoveLeave} disabled={isPending}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 p-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                    {isPending ? '⏳ Applying…' : '✅ Remove Leave'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {schedule.length === 0 && (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
            <div className="text-3xl mb-2">{staffMember.using === 'not-working' ? '😴' : '📋'}</div>
            <p className="text-sm text-gray-500 font-medium">
              {staffMember.using === 'not-working' ? 'Day off — no slots' : 'No schedule configured'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {staffMember.using === 'not-working' ? "This staff member isn't working today" : 'Enable working hours above to see time slots'}
            </p>
          </div>
        )}

        {/* ══════════ 3. ADD LEAVE (collapsible) ══════════ */}
        <div className="mt-auto">
          <button type="button" onClick={() => setShowLeaveForm(!showLeaveForm)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200
              ${showLeaveForm
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-slate-800/50 border-white/5 hover:border-white/15 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm">🏖️</span>
              <span className="text-xs font-bold uppercase tracking-wider">Quick Leave</span>
            </div>
            <span className={`text-xs transition-transform duration-200 ${showLeaveForm ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {showLeaveForm && (
            <div className="mt-2 p-4 bg-slate-800/70 rounded-xl border border-white/5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">🕐 From</label>
                  <input type="time" value={leaveStart}
                    onChange={e => setLeaveStart(e.target.value)}
                    style={timeStyle}
                    className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">🕐 To</label>
                  <input type="time" value={leaveEnd}
                    onChange={e => setLeaveEnd(e.target.value)}
                    style={timeStyle}
                    className="w-full p-2.5 rounded-lg border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
                </div>
              </div>
              <button type="button" onClick={handleManualLeave} disabled={isPending}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-red-500/20 disabled:opacity-50 text-sm">
                {isPending ? '⏳ Adding…' : '🚫 Add Leave'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
