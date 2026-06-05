import Image from 'next/image';
import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface TimeFilterRowProps {
 defaultFrom?: string;
 defaultTo?: string;
 onTimeChange?: (name: string, value: string) => void;
}

const TimeFilterRow: React.FC<TimeFilterRowProps> = ({ defaultFrom, defaultTo, onTimeChange }) => {
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

 const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (onTimeChange) {
 onTimeChange(e.target.name, e.target.value);
 } else {
 updateUrl({ [e.target.name]: e.target.value });
 }
 };

 return (
 <>
 <div className="w-full flex-1">
 <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[11px] sm:text-[13px]">
 🕐 From
 </label>
 <input
 type="time"
 name="from"
 value={defaultFrom}
 onChange={handleTimeChange}
 className="w-full p-2 sm:p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[11px] sm:text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all"
 />
 </div>
 <div className="w-full flex-1">
 <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[11px] sm:text-[13px]">
 🕐 To
 </label>
 <input
 type="time"
 name="to"
 value={defaultTo}
 onChange={handleTimeChange}
 className="w-full p-2 sm:p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text text-[11px] sm:text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all"
 />
 </div>
 </>
 );
};

export default TimeFilterRow;
