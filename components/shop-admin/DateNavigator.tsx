import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface DateNavigatorProps {
  defaultDate: string;
  onDateChange?: (date: string) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ defaultDate, onDateChange }) => {
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

  const navigateDays = (amount: number) => {
    const currentDate = new Date(defaultDate);
    currentDate.setDate(currentDate.getDate() + amount);
    changeDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    changeDate(new Date().toISOString().split('T')[0]);
  };

  const displayDate = new Date(defaultDate + 'T00:00:00');
  const dayName = displayDate.toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = displayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const isToday = defaultDate === new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-crm-primary/20 flex items-center justify-center text-lg sm:text-xl hover:opacity-90 flex-shrink-0">
          📅
        </div>
        <div className="min-w-0 truncate">
          <h3 className="font-bold text-crm-text text-base sm:text-lg truncate">{dayName}</h3>
          <p className="text-crm-muted text-[11px] sm:text-[13px] truncate">{dateStr}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {!isToday && (
          <button
            onClick={goToToday}
            aria-label="Go to today"
            className="text-[11px] sm:text-[13px] text-crm-primary hover:text-crm-text bg-crm-primary/10 hover:bg-crm-primary/20 border border-crm-primary/20 transition-all duration-200 px-2 py-1 rounded-md"
          >
            Today
          </button>
        )}
        <button
          onClick={() => navigateDays(-1)}
          aria-label="Previous day"
          className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-crm-surface border border-crm-border shadow-sm hover:border-crm-primary/40 text-crm-muted hover:text-crm-text transition-all duration-200 text-[11px] sm:text-[13px] font-bold"
        >
          ←
        </button>
        <button
          onClick={() => navigateDays(1)}
          aria-label="Next day"
          className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl bg-crm-surface border border-crm-border shadow-sm hover:border-crm-primary/40 text-crm-muted hover:text-crm-text transition-all duration-200 text-[11px] sm:text-[13px] font-bold"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default DateNavigator;
