'use client';
import { useState } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClassScheduleManager({ shopId, schedules, services, staff, terms }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Weekly Schedules</h2>
          <p className="text-sm text-gray-500 font-medium">Define recurring class times and assign instructors.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95"
        >
          Add Schedule
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4">Day & Time</th>
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Term</th>
              <th className="px-6 py-4">Enrolled / Cap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No class schedules found.
                </td>
              </tr>
            ) : (
              schedules.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{s.service.name}</td>
                  <td className="px-6 py-4 font-medium text-gray-600">
                    {DAYS[s.dayOfWeek]}s, {s.startTime} - {s.endTime}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.staff.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-semibold">{s.term ? s.term.name : 'Ongoing'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{s._count.enrollments}</span>
                      <span className="text-gray-400">/ {s.service.maxCapacity || '∞'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
