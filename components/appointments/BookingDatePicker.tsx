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
    <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-white/5">
      <span className="text-gray-400 pl-2">📅</span>
      <select 
        onChange={handleDateChange} 
        className="bg-transparent text-white text-sm focus:outline-none cursor-pointer pr-2 appearance-none w-full sm:w-auto font-semibold"
      >
        <option value="" className="bg-slate-900 text-gray-400">Jump to specific date...</option>
        {dates.map((date) => (
          <option key={date} value={`date-${date.replace(/\s+/g, '-')}`} className="bg-slate-900 text-white">
            {date}
          </option>
        ))}
      </select>
    </div>
  );
}