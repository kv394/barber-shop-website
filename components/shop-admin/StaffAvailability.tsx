'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import DateNavigator from '@/components/shop-admin/DateNavigator';
import TimeFilterRow from '@/components/shop-admin/TimeFilterRow';
import ScheduleGrid from '@/components/shop-admin/ScheduleGrid';

interface StaffAvailabilityProps {
  defaultDate: string;
  defaultFrom?: string;
  defaultTo?: string;
  onDateChange?: (date: string) => void;
  onTimeChange?: (name: string, value: string) => void;
  staff?: any[]; // optional prop for external usage
}

export default function StaffAvailability({ defaultDate, defaultFrom, defaultTo, onDateChange, onTimeChange, staff }: StaffAvailabilityProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUrl = (newValues: Record<string, string>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(newValues).forEach(([key, value]) => {
      currentParams.set(key, value);
    });
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  const changeDate = (newDate: string) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      updateUrl({ date: newDate });
    }
  };

  const handleTimeChangeByName = (name: string, value: string) => {
    if (onTimeChange) {
      onTimeChange(name, value);
    } else {
      updateUrl({ [name]: value });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTimeChangeByName(e.target.name, e.target.value);
  };

  const navigateDays = (amount: number) => {
    const currentDate = new Date(defaultDate);
    currentDate.setDate(currentDate.getDate() + amount);
    changeDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    changeDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = defaultDate === new Date().toISOString().split('T')[0];
  const showTimeFilters = defaultFrom !== undefined && defaultTo !== undefined;

  return (
    <div className="bg-crm-surface rounded-2xl border border-crm-border shadow-sm overflow-hidden w-full max-w-full glass p-4">
      <DateNavigator defaultDate={defaultDate} onDateChange={changeDate} />
      {showTimeFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
          <input type="date" value={defaultDate} onChange={(e) => changeDate(e.target.value)} className="hidden" />
          <TimeFilterRow defaultFrom={defaultFrom} defaultTo={defaultTo} onTimeChange={handleTimeChangeByName} />
        </div>
      )}
      {staff ? (
        <ScheduleGrid staff={staff} selectedDate={defaultDate} />
      ) : (
        <div className="p-3 sm:p-5">
          {/* Backward compatibility: original UI */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-crm-primary/20 flex items-center justify-center text-lg sm:text-xl hover:opacity-90 flex-shrink-0">📅</div>
              <div className="min-w-0 truncate">
                <h3 className="font-bold text-crm-text text-base sm:text-lg truncate">{new Date(defaultDate).toLocaleDateString(undefined, { weekday: 'long' })}</h3>
                <p className="text-crm-muted text-[11px] sm:text-[13px] truncate">{new Date(defaultDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {!isToday && (
                <button onClick={goToToday} className="text-[11px] sm:text-[13px] text-crm-primary hover:text-crm-text bg-crm-primary/10 hover:bg-crm-primary/20 border border-crm-primary/20 transition-all duration-200 px-2 py-1 rounded-md">Today</button>
              )}
              <button onClick={() => navigateDays(-1)} className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-crm-surface border border-crm-border shadow-sm hover:border-crm-primary/40 text-crm-muted hover:text-crm-text transition-all duration-200 text-[11px] sm:text-[13px] font-bold">←</button>
              <button onClick={() => navigateDays(1)} className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-crm-surface border border-crm-border shadow-sm hover:border-crm-primary/40 text-crm-muted hover:text-crm-text transition-all duration-200 text-[11px] sm:text-[13px] font-bold">→</button>
            </div>
          </div>
          <div className={`grid grid-cols-1 ${showTimeFilters ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-2 sm:gap-3`}>
            <div className="w-full">
              <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[11px] sm:text-[13px]">📅 Date</label>
              <input type="date" value={defaultDate} onChange={(e) => changeDate(e.target.value)} className="w-full p-2 sm:p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[11px] sm:text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all" />
            </div>
            {showTimeFilters && (
              <>
                <div className="w-full flex-1">
                  <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[11px] sm:text-[13px]">🕐 From</label>
                  <input type="time" name="from" value={defaultFrom} onChange={handleTimeChange} className="w-full p-2 sm:p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[11px] sm:text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all" />
                </div>
                <div className="w-full flex-1">
                  <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[11px] sm:text-[13px]">🕐 To</label>
                  <input type="time" name="to" value={defaultTo} onChange={handleTimeChange} className="w-full p-2 sm:p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[11px] sm:text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
