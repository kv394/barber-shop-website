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
    <div className="flex items-center gap-2 bg-botanical-surface p-2 rounded-xl border-2 border-b-[6px] border-botanical-border">
      <span className="text-botanical-muted pl-2">📅</span>
      <select 
        onChange={handleDateChange} 
        className="bg-transparent text-botanical-text text-sm focus:outline-none cursor-pointer pr-2 appearance-none w-full sm:w-auto font-semibold"
      >
        <option value="" className="bg-botanical-surface text-botanical-muted">Jump to specific date...</option>
        {dates.map((date) => (
          <option key={date} value={`date-${date.replace(/\s+/g, '-')}`} className="bg-botanical-surface text-botanical-text">
            {date}
          </option>
        ))}
      </select>
    </div>
  );
}