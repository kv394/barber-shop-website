'use client';

export default function BookingDatePicker({ dates }: { dates: string[] }) {
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = e.target.value;
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (dates.length === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-crm-surface p-2 rounded-xl border border-crm-border shadow-sm">
      <span className="text-crm-muted pl-2">📅</span>
      <select 
        onChange={handleDateChange} 
        className="bg-transparent text-crm-text text-[13px] focus:outline-none cursor-pointer pr-2 appearance-none w-full sm:w-auto font-semibold"
      >
        <option value="" className="bg-crm-surface text-crm-muted">Jump to specific date...</option>
        {dates.map((date) => (
          <option key={date} value={`date-${date.replace(/\s+/g, '-')}`} className="bg-crm-surface text-crm-text">
            {date}
          </option>
        ))}
      </select>
    </div>
  );
}