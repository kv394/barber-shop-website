'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const timeStyle = {};

interface StaffAvailabilityProps {
  defaultDate: string;
  defaultFrom?: string;
  defaultTo?: string;
  onDateChange?: (date: string) => void;
  onTimeChange?: (name: string, value: string) => void;
}

export default function StaffAvailability({ defaultDate, defaultFrom, defaultTo, onDateChange, onTimeChange }: StaffAvailabilityProps) {
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeDate(e.target.value);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTimeChange) {
      onTimeChange(e.target.name, e.target.value);
    } else {
      updateUrl({ [e.target.name]: e.target.value });
    }
  };

  const navigateDays = (amount: number) => {
    const currentDate = new Date(defaultDate);
    currentDate.setDate(currentDate.getDate() + amount);
    changeDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    changeDate(new Date().toISOString().split('T')[0]);
  };

  // Format the date for display
  const displayDate = new Date(defaultDate + 'T00:00:00');
  const dayName = displayDate.toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = displayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const isToday = defaultDate === new Date().toISOString().split('T')[0];

  const showTimeFilters = defaultFrom !== undefined && defaultTo !== undefined;

  return (
    <div className="mb-8 bg-crm-surface rounded-2xl border border-crm-border shadow-sm shadow-xl overflow-hidden">
      {/* Gold accent */}
      <div className="h-1 bg-gradient-to-r from-crm-primary via-crm-primary/60 to-transparent" />

      <div className="p-5">
        {/* Header row with day navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crm-primary/20 flex items-center justify-center text-xl hover:opacity-90">📅</div>
            <div>
              <h3 className="font-bold text-crm-text text-lg font-bold">{dayName}</h3>
              <p className="text-crm-muted text-[13px]">{dateStr}</p>
            </div>
            {isToday && (
              <span className="text-[13px] bg-crm-primary/20 text-crm-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hover:opacity-90">Today</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button onClick={goToToday}
                className="text-[13px] text-crm-primary hover:text-crm-text bg-crm-primary/10 hover:bg-crm-primary/20 border border-crm-primary/20 transition-all duration-200">
                Today
              </button>
            )}
            <button onClick={() => navigateDays(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-crm-surface border border-crm-border shadow-sm hover:border-crm-primary/40 text-crm-muted hover:text-crm-text transition-all duration-200 text-[13px] font-bold">
              ←
            </button>
            <button onClick={() => navigateDays(1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-crm-surface border border-crm-border shadow-sm hover:border-crm-primary/40 text-crm-muted hover:text-crm-text transition-all duration-200 text-[13px] font-bold">
              →
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className={`grid grid-cols-1 ${showTimeFilters ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-3`}>
          <div>
            <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[13px]">📅 Date</label>
            <input
              type="date"
              value={defaultDate}
              onChange={handleDateChange}
              style={timeStyle}
              className="w-full p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all"
            />
          </div>
          {showTimeFilters && (
            <>
              <div>
                <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[13px]">🕐 From</label>
                <input
                  type="time"
                  name="from"
                  value={defaultFrom}
                  onChange={handleTimeChange}
                  style={timeStyle}
                  className="w-full p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[13px]">🕐 To</label>
                <input
                  type="time"
                  name="to"
                  value={defaultTo}
                  onChange={handleTimeChange}
                  style={timeStyle}
                  className="w-full p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
