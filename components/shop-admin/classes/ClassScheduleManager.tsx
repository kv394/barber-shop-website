'use client';
import { useState } from 'react';
import { createSchedule } from '@/app/actions/classes';

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

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
              <h3 className="text-xl font-black text-gray-900">Add Class Schedule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form action={async (formData) => {
              const res = await createSchedule(formData);
              if (res.success) setIsModalOpen(false);
              else alert('Failed to create schedule: ' + res.error);
            }} className="p-6 space-y-4">
              <input type="hidden" name="shopId" value={shopId} />
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Class (Service)</label>
                <select name="serviceId" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors bg-white">
                  <option value="">Select a class...</option>
                  {services.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.maxCapacity ? `Max ${s.maxCapacity}` : 'No Limit'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Instructor</label>
                <select name="staffId" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors bg-white">
                  <option value="">Select instructor...</option>
                  {staff.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Academic Term</label>
                <select name="termId" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors bg-white">
                  <option value="">Ongoing (No Term)</option>
                  {terms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Day of Week</label>
                  <select name="dayOfWeek" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors bg-white">
                    {DAYS.map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Start Time</label>
                  <input type="time" name="startTime" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">End Time</label>
                  <input type="time" name="endTime" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-all active:scale-95 shadow-sm">
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
