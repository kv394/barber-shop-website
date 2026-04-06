'use client';

import { useState, useMemo } from 'react';

interface TimeLogEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
}

interface AppointmentEntry {
  id: string;
  startTime: string;
  status: string;
  service: { name: string; price: number };
  user: { name: string | null; email: string };
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  timeLogs: TimeLogEntry[];
  staffAppointments: AppointmentEntry[];
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0h 0m';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function filterByDate<T>(items: T[], getDate: (item: T) => Date, from: string, to: string): T[] {
  return items.filter(item => {
    const d = getDate(item);
    if (from && d < new Date(from)) return false;
    if (to) {
      const end = new Date(to);
      end.setDate(end.getDate() + 1);
      if (d >= end) return false;
    }
    return true;
  });
}

export default function StaffWorkingReport({ staffMembers }: { staffMembers: StaffMember[] }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const staffData = useMemo(() => {
    return staffMembers.map(staff => {
      const filteredLogs = filterByDate(
        staff.timeLogs,
        log => new Date(log.clockIn),
        dateFrom,
        dateTo
      );

      const filteredAppointments = filterByDate(
        staff.staffAppointments.filter(a => a.status === 'COMPLETED'),
        apt => new Date(apt.startTime),
        dateFrom,
        dateTo
      );

      const hoursMs = filteredLogs.reduce((total, log) => {
        const clockIn = new Date(log.clockIn);
        const clockOut = log.clockOut ? new Date(log.clockOut) : new Date();
        return total + (clockOut.getTime() - clockIn.getTime());
      }, 0);

      const revenue = filteredAppointments.reduce(
        (sum, apt) => sum + (apt.service?.price || 0),
        0
      );

      return {
        id: staff.id,
        name: staff.name || staff.email,
        hoursMs,
        hours: formatDuration(hoursMs),
        clients: filteredAppointments.length,
        revenue,
        filteredLogs,
        filteredAppointments,
        isActive: staff.timeLogs.some(log => !log.clockOut),
      };
    }).sort((a, b) => b.hoursMs - a.hoursMs);
  }, [staffMembers, dateFrom, dateTo]);

  const totalHoursMs = staffData.reduce((sum, s) => sum + s.hoursMs, 0);
  const totalClients = staffData.reduce((sum, s) => sum + s.clients, 0);
  const totalRevenue = staffData.reduce((sum, s) => sum + s.revenue, 0);
  const isFiltered = dateFrom || dateTo;

  const inputStyle: React.CSSProperties = { colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' };

  const selectedStaffData = selectedStaff ? staffData.find(s => s.id === selectedStaff) : null;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2">
            👥 Total Staff
          </h3>
          <p className="text-3xl sm:text-4xl font-black text-blue-400">{staffMembers.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {staffData.filter(s => s.isActive).length} currently active
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2">
            ⏱️ Total Hours
          </h3>
          <p className="text-3xl sm:text-4xl font-black text-purple-400">{formatDuration(totalHoursMs)}</p>
          {isFiltered && <p className="text-xs text-gray-500 mt-1">In selected date range</p>}
        </div>
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2">
            ✂️ Clients Served
          </h3>
          <p className="text-3xl sm:text-4xl font-black text-green-400">{totalClients}</p>
          {isFiltered && <p className="text-xs text-gray-500 mt-1">In selected date range</p>}
        </div>
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2">
            💰 Revenue Generated
          </h3>
          <p className="text-3xl sm:text-4xl font-black text-amber-400">${totalRevenue.toFixed(2)}</p>
          {isFiltered && <p className="text-xs text-gray-500 mt-1">In selected date range</p>}
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-slate-900/50 rounded-lg border border-white/5">
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle}
            className="w-full border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle}
            className="w-full border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        {isFiltered && (
          <div className="flex items-end">
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-gray-400 hover:text-white px-4 py-2 border border-white/10 rounded">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Staff Cards */}
      {staffData.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8 sm:py-12 text-sm border border-dashed border-white/20 rounded">
          No staff members found.
        </p>
      ) : (
        <div className="space-y-4">
          {staffData.map(staff => {
            const hoursPct = totalHoursMs > 0 ? (staff.hoursMs / totalHoursMs) * 100 : 0;
            const clientsPct = totalClients > 0 ? (staff.clients / totalClients) * 100 : 0;
            const isExpanded = selectedStaff === staff.id;

            return (
              <div key={staff.id} className="bg-slate-900/70 rounded-xl border border-white/10 overflow-hidden">
                {/* Staff Summary Row */}
                <button
                  onClick={() => setSelectedStaff(isExpanded ? null : staff.id)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-lg shrink-0">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                          {staff.name}
                          {staff.isActive && (
                            <span className="text-[10px] text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full font-bold animate-pulse">
                              ACTIVE
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center sm:text-right">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Hours</p>
                        <p className="text-sm sm:text-lg font-bold text-purple-400">{staff.hours}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Clients</p>
                        <p className="text-sm sm:text-lg font-bold text-green-400">{staff.clients}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Revenue</p>
                        <p className="text-sm sm:text-lg font-bold text-amber-400">${staff.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>Hours share</span>
                        <span>{hoursPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${hoursPct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>Client share</span>
                        <span>{clientsPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${clientsPct}%` }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail View */}
                {isExpanded && selectedStaffData && (
                  <div className="border-t border-white/10 p-4 sm:p-5 bg-slate-950/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Time Logs */}
                      <div>
                        <h5 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          ⏱️ Attendance Logs
                          <span className="text-[10px] text-gray-500 font-normal">
                            ({selectedStaffData.filteredLogs.length} entries)
                          </span>
                        </h5>
                        {selectedStaffData.filteredLogs.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No attendance logs found{isFiltered ? ' for this date range' : ''}.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {selectedStaffData.filteredLogs.slice(0, 50).map(log => {
                              const clockIn = new Date(log.clockIn);
                              const clockOut = log.clockOut ? new Date(log.clockOut) : null;
                              const duration = clockOut
                                ? formatDuration(clockOut.getTime() - clockIn.getTime())
                                : 'In Progress';

                              return (
                                <div key={log.id} className="flex items-center justify-between bg-slate-900/70 px-3 py-2 rounded-lg text-xs border border-white/5">
                                  <div>
                                    <span className="text-gray-400">
                                      {clockIn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-white font-mono ml-2">
                                      {clockIn.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-gray-600 mx-1">→</span>
                                    <span className="text-white font-mono">
                                      {clockOut
                                        ? clockOut.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                                        : <span className="text-green-400 animate-pulse">Active</span>
                                      }
                                    </span>
                                  </div>
                                  <span className={`font-semibold ${clockOut ? 'text-purple-400' : 'text-green-400'}`}>
                                    {duration}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Clients Served */}
                      <div>
                        <h5 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                          ✂️ Clients Served
                          <span className="text-[10px] text-gray-500 font-normal">
                            ({selectedStaffData.filteredAppointments.length} completed)
                          </span>
                        </h5>
                        {selectedStaffData.filteredAppointments.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">No completed appointments{isFiltered ? ' for this date range' : ''}.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {selectedStaffData.filteredAppointments.slice(0, 50).map(apt => (
                              <div key={apt.id} className="flex items-center justify-between bg-slate-900/70 px-3 py-2 rounded-lg text-xs border border-white/5">
                                <div>
                                  <span className="text-gray-400">
                                    {new Date(apt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-white ml-2">{apt.user?.name || apt.user?.email || 'Guest'}</span>
                                  <span className="text-brand-gold ml-2">— {apt.service.name}</span>
                                </div>
                                <span className="font-semibold text-green-400">${apt.service.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

