'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import TimeFilterRow from '@/components/shop-admin/TimeFilterRow';
import ScheduleGrid from '@/components/shop-admin/ScheduleGrid';
import TimelineGrid from '@/components/shop-admin/TimelineGrid';

interface StaffAvailabilityProps {
  defaultDate: string;
  defaultFrom?: string;
  defaultTo?: string;
  onDateChange?: (date: string) => void;
  onTimeChange?: (name: string, value: string) => void;
  staff?: any[]; // optional prop for external usage
  children?: React.ReactNode;
}

export default function StaffAvailability({ defaultDate, defaultFrom, defaultTo, onDateChange, onTimeChange, staff, children }: StaffAvailabilityProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

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
      <div className={`grid grid-cols-1 ${showTimeFilters ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-2 sm:gap-3 mb-4`}>
        <div className="w-full">
          <label className="block text-crm-muted mb-2 font-bold uppercase tracking-wider text-[13px] sm:text-[14px]">📅 Date</label>
          <input type="date" value={defaultDate} onChange={(e) => changeDate(e.target.value)} className="w-full p-3 sm:p-4 rounded-xl border-2 border-crm-border shadow-sm text-crm-text text-[15px] sm:text-[16px] font-medium focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all" />
        </div>
        {showTimeFilters && (
          <TimeFilterRow defaultFrom={defaultFrom} defaultTo={defaultTo} onTimeChange={handleTimeChangeByName} />
        )}
      </div>
      {staff && (
        <>
          <div className="flex justify-end mb-4">
            <div className="flex items-center bg-crm-bg/80 p-1 rounded-lg border border-crm-border shadow-inner">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${viewMode === 'timeline' ? 'bg-crm-surface text-crm-text shadow border border-crm-border' : 'text-crm-muted hover:text-crm-text hover:bg-crm-surface/50 border border-transparent'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-crm-surface text-crm-text shadow border border-crm-border' : 'text-crm-muted hover:text-crm-text hover:bg-crm-surface/50 border border-transparent'}`}
              >
                Cards
              </button>
            </div>
          </div>
          {viewMode === 'timeline' ? (
            <TimelineGrid staff={staff} selectedDate={defaultDate} />
          ) : (
            children ? children : <ScheduleGrid staff={staff} selectedDate={defaultDate} />
          )}
        </>
      )}
      {!staff && children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
