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

  const inputStyle: React.CSSProperties = {};

  const selectedStaffData = selectedStaff ? staffData.find(s => s.id === selectedStaff) : null;

  return (
    <div>
      {/* Floating Summary Bar */}
      <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-botanical-border shadow-sm mb-8 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10 relative z-20 transform sm:-translate-y-6 sm:-mx-2">
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">Total Staff</h3>
            <span className="text-blue-500 text-sm">👥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{staffMembers.length}</p>
          <p className="text-sm text-botanical-muted mt-2 truncate">
            <span className="text-botanical-muted">{staffData.filter(s => s.isActive).length}</span> currently active
          </p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">Total Hours</h3>
            <span className="text-purple-500 text-sm">⏱️</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{formatDuration(totalHoursMs)}</p>
          {isFiltered && <p className="text-sm text-botanical-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">In selected date range</p>}
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">Clients Served</h3>
            <span className="text-green-500 text-sm">✂️</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{totalClients}</p>
          {isFiltered && <p className="text-sm text-botanical-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">In selected date range</p>}
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">Revenue Generated</h3>
            <span className="text-amber-500 text-sm">💰</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">${totalRevenue.toFixed(2)}</p>
          {isFiltered && <p className="text-sm text-botanical-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">In selected date range</p>}
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-botanical-surface rounded-lg border border-botanical-border shadow-sm">
        <div className="flex-1">
          <label className="block text-sm text-botanical-muted uppercase tracking-wider mb-1">From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle}
            className="w-full border border-botanical-border shadow-sm rounded p-2 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-botanical-muted uppercase tracking-wider mb-1">To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle}
            className="w-full border border-botanical-border shadow-sm rounded p-2 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        {isFiltered && (
          <div className="flex items-end">
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-botanical-muted hover:text-botanical-text px-4 py-2 border border-botanical-border shadow-sm rounded">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Staff Cards */}
      {staffData.length === 0 ? (
        <p className="text-botanical-muted italic text-center py-8 sm:py-12 text-sm border border-dashed border-botanical-border rounded">
          No staff members found.
        </p>
      ) : (
        <div className="space-y-4">
          {staffData.map(staff => {
            const hoursPct = totalHoursMs > 0 ? (staff.hoursMs / totalHoursMs) * 100 : 0;
            const clientsPct = totalClients > 0 ? (staff.clients / totalClients) * 100 : 0;
            const isExpanded = selectedStaff === staff.id;

            return (
              <div key={staff.id} className="bg-botanical-surface rounded-xl border border-botanical-border shadow-sm overflow-hidden">
                {/* Staff Summary Row */}
                <button
                  onClick={() => setSelectedStaff(isExpanded ? null : staff.id)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-botanical-surface transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-botanical-primary/20 flex items-center justify-center text-botanical-accent font-bold text-lg shrink-0">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-botanical-text text-sm sm:text-base flex items-center gap-2">
                          {staff.name}
                          {staff.isActive && (
                            <span className="text-sm text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full font-bold animate-pulse">
                              ACTIVE
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center sm:text-right">
                      <div>
                        <p className="text-sm text-botanical-muted uppercase tracking-wider">Hours</p>
                        <p className="text-sm sm:text-lg font-bold text-purple-400">{staff.hours}</p>
                      </div>
                      <div>
                        <p className="text-sm text-botanical-muted uppercase tracking-wider">Clients</p>
                        <p className="text-sm sm:text-lg font-bold text-green-400">{staff.clients}</p>
                      </div>
                      <div>
                        <p className="text-sm text-botanical-muted uppercase tracking-wider">Revenue</p>
                        <p className="text-sm sm:text-lg font-bold text-amber-400">${staff.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm text-botanical-muted mb-1">
                        <span>Hours share</span>
                        <span>{hoursPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-botanical-surface rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${hoursPct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm text-botanical-muted mb-1">
                        <span>Client share</span>
                        <span>{clientsPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-botanical-surface rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${clientsPct}%` }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail View */}
                {isExpanded && selectedStaffData && (
                  <div className="border-t border-botanical-border p-4 sm:p-5 bg-botanical-bg/50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Time Logs */}
                      <div>
                        <h5 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          ⏱️ Attendance Logs
                          <span className="text-sm text-botanical-muted font-normal">
                            ({selectedStaffData.filteredLogs.length} entries)
                          </span>
                        </h5>
                        {selectedStaffData.filteredLogs.length === 0 ? (
                          <p className="text-xs text-botanical-muted italic">No attendance logs found{isFiltered ? ' for this date range' : ''}.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {selectedStaffData.filteredLogs.slice(0, 50).map(log => {
                              const clockIn = new Date(log.clockIn);
                              const clockOut = log.clockOut ? new Date(log.clockOut) : null;
                              const duration = clockOut
                                ? formatDuration(clockOut.getTime() - clockIn.getTime())
                                : 'In Progress';

                              return (
                                <div key={log.id} className="flex items-center justify-between bg-botanical-surface px-3 py-2 rounded-lg text-xs border border-botanical-border shadow-sm">
                                  <div>
                                    <span className="text-botanical-muted">
                                      {clockIn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-botanical-text font-mono ml-2">
                                      {clockIn.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-botanical-muted mx-1">→</span>
                                    <span className="text-botanical-text font-mono">
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
                          <span className="text-sm text-botanical-muted font-normal">
                            ({selectedStaffData.filteredAppointments.length} completed)
                          </span>
                        </h5>
                        {selectedStaffData.filteredAppointments.length === 0 ? (
                          <p className="text-xs text-botanical-muted italic">No completed appointments{isFiltered ? ' for this date range' : ''}.</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {selectedStaffData.filteredAppointments.slice(0, 50).map(apt => (
                              <div key={apt.id} className="flex items-center justify-between bg-botanical-surface px-3 py-2 rounded-lg text-xs border border-botanical-border shadow-sm">
                                <div>
                                  <span className="text-botanical-muted">
                                    {new Date(apt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-botanical-text ml-2">{apt.user?.name || apt.user?.email || 'Guest'}</span>
                                  <span className="text-botanical-accent ml-2">— {apt.service.name}</span>
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

