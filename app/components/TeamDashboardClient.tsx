'use client';

import { useState, useCallback, useRef } from 'react';
import StaffAvailability from './StaffAvailability';
import TeamStaffCard from './TeamStaffCard';

interface TeamDashboardClientProps {
  shopId: string;
  initialDate: string;
  initialStaff: any[];
  addLeaveAction: (formData: FormData) => Promise<void>;
  removeLeaveAction: (formData: FormData) => Promise<void>;
  updateDayHoursAction: (formData: FormData) => Promise<void>;
}

export default function TeamDashboardClient({
  shopId,
  initialDate,
  initialStaff,
  addLeaveAction,
  removeLeaveAction,
  updateDayHoursAction,
}: TeamDashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [fromTime, setFromTime] = useState('00:00');
  const [toTime, setToTime] = useState('23:59');
  const [staff, setStaff] = useState<any[]>(initialStaff);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStaff = useCallback(
    async (date: string, from: string, to: string) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/shops/${shopId}/staff-schedule?date=${date}&from=${from}&to=${to}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStaff(data.staff);
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error('Failed to fetch staff schedule:', err);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [shopId]
  );

  const syncUrl = useCallback((date: string, from: string, to: string) => {
    const params = new URLSearchParams();
    params.set('date', date);
    if (from !== '00:00') params.set('from', from);
    if (to !== '23:59') params.set('to', to);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, []);

  const handleDateChange = useCallback(
    (date: string) => {
      setSelectedDate(date);
      fetchStaff(date, fromTime, toTime);
      syncUrl(date, fromTime, toTime);
    },
    [fetchStaff, fromTime, toTime, syncUrl]
  );

  const handleTimeChange = useCallback(
    (name: string, value: string) => {
      const newFrom = name === 'from' ? value : fromTime;
      const newTo = name === 'to' ? value : toTime;
      if (name === 'from') setFromTime(value);
      if (name === 'to') setToTime(value);
      fetchStaff(selectedDate, newFrom, newTo);
      syncUrl(selectedDate, newFrom, newTo);
    },
    [fetchStaff, selectedDate, fromTime, toTime, syncUrl]
  );

  const handleRefresh = useCallback(() => {
    fetchStaff(selectedDate, fromTime, toTime);
  }, [fetchStaff, selectedDate, fromTime, toTime]);

  return (
    <>
      {/* ═══ Date & Time Picker (no page reload) ═══ */}
      <StaffAvailability
        defaultDate={selectedDate}
        defaultFrom={fromTime}
        defaultTo={toTime}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
      />

      {/* ═══ Staff count ═══ */}
      <div className="flex items-center justify-between mb-4">
        {staff.length > 0 && (
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            👥 {staff.length} Team Member{staff.length !== 1 ? 's' : ''}
          </span>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-brand-gold font-semibold">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Updating…
          </div>
        )}
      </div>

      {/* ═══ Staff Cards ═══ */}
      <div
        className={`transition-all duration-300 ${isLoading ? 'opacity-40 scale-[0.99] pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        {staff.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {staff.map((staffMember: any) => (
              <TeamStaffCard
                key={staffMember.id}
                staffMember={staffMember}
                shopId={shopId}
                selectedDate={selectedDate}
                addLeaveAction={addLeaveAction}
                removeLeaveAction={removeLeaveAction}
                updateDayHoursAction={updateDayHoursAction}
                onAfterAction={handleRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-dashed border-white/10">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-lg text-gray-400 font-semibold">No team members yet</p>
            <p className="text-sm text-gray-600 mt-1">Invite your first team member above to get started</p>
          </div>
        )}
      </div>
    </>
  );
}
