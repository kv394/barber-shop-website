'use client';
import { useState } from 'react';

export default function AttendanceTracker({ shopId, sessions }: any) {
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null);

  const selectedSession = sessions.find((s: any) => s.id === selectedSessionId);

  const toggleAttendance = (attendanceId: string, currentStatus: string) => {
    // In a real app, this would hit an API to update AttendanceStatus
    console.log('Toggling attendance', attendanceId, currentStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Today's Classes & Attendance</h2>
          <p className="text-sm text-gray-500 font-medium">Mark students as present, absent, or excused for today's sessions.</p>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2 font-bold text-gray-900">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar: Today's Sessions */}
        <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Your Schedule</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 text-center">No classes scheduled for today.</p>
            ) : (
              sessions.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedSessionId === s.id 
                      ? 'bg-crm-primary/10 border border-crm-primary/20 text-crm-primary shadow-sm' 
                      : 'bg-transparent border border-transparent hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-bold text-sm">{s.classSchedule.service.name}</div>
                  <div className={`text-[11px] font-medium mt-0.5 ${selectedSessionId === s.id ? 'text-crm-primary/80' : 'text-gray-500'}`}>
                    {s.classSchedule.startTime} - {s.classSchedule.endTime}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Attendance List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              <div className="p-6 border-b border-gray-100 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedSession.classSchedule.service.name}</h2>
                  <p className="text-gray-500 font-medium text-sm mt-1">
                    {selectedSession.classSchedule.startTime} - {selectedSession.classSchedule.endTime}
                  </p>
                </div>
                <div className="text-sm font-bold text-gray-500">
                  <span className="text-gray-900">
                    {selectedSession.attendances.filter((a: any) => a.status === 'PRESENT').length}
                  </span>
                  {' '} / {selectedSession.attendances.length} Present
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[11px] sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedSession.attendances.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No students in this session.</td>
                      </tr>
                    ) : (
                      selectedSession.attendances.map((a: any) => (
                        <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="font-bold text-gray-900">{a.student.name}</div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-gray-500 text-xs">{a.student.email}</div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50/50">
                              <button 
                                onClick={() => toggleAttendance(a.id, 'PRESENT')}
                                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${a.status === 'PRESENT' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                              >
                                Present
                              </button>
                              <button 
                                onClick={() => toggleAttendance(a.id, 'ABSENT')}
                                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${a.status === 'ABSENT' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <span className="text-4xl opacity-20 mb-4 block">✔️</span>
              <h3 className="text-lg font-bold text-gray-900">Select a Class</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">Choose a scheduled class from the sidebar to record student attendance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
