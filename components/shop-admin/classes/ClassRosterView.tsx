'use client';
import { useState } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClassRosterView({ shopId, schedules }: any) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || null);

  const selectedSchedule = schedules.find((s: any) => s.id === selectedScheduleId);

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar: List of Classes */}
      <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Select a Class</h3>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {schedules.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSelectedScheduleId(s.id)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selectedScheduleId === s.id 
                  ? 'bg-crm-primary/10 border border-crm-primary/20 text-crm-primary shadow-sm' 
                  : 'bg-transparent border border-transparent hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="font-bold text-sm">{s.service.name}</div>
              <div className={`text-[11px] font-medium mt-0.5 ${selectedScheduleId === s.id ? 'text-crm-primary/80' : 'text-gray-500'}`}>
                {DAYS[s.dayOfWeek]}s, {s.startTime}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Roster & Waitlist */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedSchedule ? (
          <>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-900">{selectedSchedule.service.name}</h2>
              <p className="text-gray-500 font-medium text-sm mt-1">
                {DAYS[selectedSchedule.dayOfWeek]}s at {selectedSchedule.startTime} • Instructor: {selectedSchedule.staff.name}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Enrolled</span>
                  <span className="text-lg font-black text-gray-900">
                    {selectedSchedule.enrollments.length} <span className="text-sm font-medium text-gray-400">/ {selectedSchedule.service.maxCapacity || '∞'}</span>
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200/50">
                  <span className="text-[11px] font-bold text-orange-600/80 uppercase tracking-wider block mb-0.5">Waitlist</span>
                  <span className="text-lg font-black text-orange-600">{selectedSchedule.waitlist.length}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Active Roster */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Active Roster</h3>
                {selectedSchedule.enrollments.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No students enrolled yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSchedule.enrollments.map((e: any) => (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs shrink-0">
                          {e.student.name?.[0] || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{e.student.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{e.student.email}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold uppercase">Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Waitlist */}
              {selectedSchedule.waitlist.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-3">Waitlist</h3>
                  <div className="space-y-2">
                    {selectedSchedule.waitlist.map((w: any) => (
                      <div key={w.id} className="flex items-center gap-4 p-3 rounded-xl border border-orange-100 bg-orange-50/30">
                        <span className="font-black text-orange-300 w-4 text-center">#{w.position}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{w.student.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{w.student.email}</p>
                        </div>
                        <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-crm-primary hover:border-crm-primary text-[11px] font-bold rounded-lg shadow-sm transition-colors">
                          Promote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <span className="text-4xl opacity-20 mb-4 block">📋</span>
            <h3 className="text-lg font-bold text-gray-900">No Class Selected</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">Select a class schedule from the sidebar to view its active roster and manage the waitlist.</p>
          </div>
        )}
      </div>
    </div>
  );
}
