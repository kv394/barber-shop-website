'use client';

import { useState, useMemo } from 'react';
import RefundButton from '@/components/checkout/RefundButton';

interface Appointment {
  id: string;
  updatedAt: string;
  status: string;
  tipAmount: number;
  discount: number;
  totalAmount: number;
  refundAmount: number;
  refundedAt: string | null;
  paymentMethod: string | null;
  service: { name: string; price: number };
  user: { name: string | null; email: string };
  staff: { name: string | null };
}

export interface ReportsClientProps {
  appointments: Appointment[];
  totalRevenue: number;
  totalTips: number;
  shopId: string;
}

export default function ReportsClient({
  appointments,
  totalRevenue: allTimeRevenue,
  totalTips: allTimeTips,
  shopId,
}: ReportsClientProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeView, setActiveView] = useState<'transactions' | 'byStaff' | 'byService'>('transactions');

  const filtered = useMemo(() => {
    return appointments.filter(apt => {
      const d = new Date(apt.updatedAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setDate(end.getDate() + 1);
        if (d >= end) return false;
      }
      return true;
    });
  }, [appointments, dateFrom, dateTo]);

  const filteredRevenue = filtered.reduce((sum, apt) => sum + apt.service.price - (apt.discount || 0), 0);
  const filteredTips = filtered.reduce((sum, apt) => sum + (apt.tipAmount || 0), 0);

  const byStaff = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; count: number }> = {};
    filtered.forEach(apt => {
      const name = apt.staff?.name || 'Unknown';
      if (!map[name]) map[name] = { name, revenue: 0, count: 0 };
      map[name].revenue += apt.service.price;
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const byService = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; count: number }> = {};
    filtered.forEach(apt => {
      const name = apt.service.name;
      if (!map[name]) map[name] = { name, revenue: 0, count: 0 };
      map[name].revenue += apt.service.price;
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const exportCSV = () => {
    const headers = ['Date', 'Client', 'Service', 'Staff', 'Amount', 'Discount', 'Tip', 'Payment', 'Status'];
    const rows = filtered.map(apt => [
      new Date(apt.updatedAt).toLocaleString(),
      apt.user.name || apt.user.email,
      apt.service.name,
      apt.staff?.name || 'N/A',
      `$${apt.service.price.toFixed(2)}`,
      `$${(apt.discount || 0).toFixed(2)}`,
      `$${(apt.tipAmount || 0).toFixed(2)}`,
      apt.paymentMethod || 'N/A',
      apt.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${dateFrom || 'all'}-to-${dateTo || 'now'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = { colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' };
  const isFiltered = dateFrom || dateTo;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 p-4 sm:p-6 rounded-xl shadow-lg overflow-hidden flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2 truncate">
            {isFiltered ? 'Filtered Revenue' : 'Total Revenue'}
          </h3>
          <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-green-400 truncate" title={`$${filteredRevenue.toFixed(2)}`}>${filteredRevenue.toFixed(2)}</p>
          {isFiltered && <p className="text-xs text-gray-500 mt-1 truncate" title={`All-time: $${allTimeRevenue.toFixed(2)}`}>All-time: ${allTimeRevenue.toFixed(2)}</p>}
        </div>
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-4 sm:p-6 rounded-xl shadow-lg overflow-hidden flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2 truncate">💰 Tips</h3>
          <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-amber-400 truncate" title={`$${filteredTips.toFixed(2)}`}>${filteredTips.toFixed(2)}</p>
          {isFiltered && <p className="text-xs text-gray-500 mt-1 truncate" title={`All-time: $${allTimeTips.toFixed(2)}`}>All-time: ${allTimeTips.toFixed(2)}</p>}
        </div>
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 p-4 sm:p-6 rounded-xl shadow-lg overflow-hidden flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2 truncate">Completed</h3>
          <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-blue-400 truncate" title={`${filtered.length}`}>{filtered.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 p-4 sm:p-6 rounded-xl shadow-lg overflow-hidden flex flex-col justify-center">
          <h3 className="text-gray-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-1 sm:mb-2 truncate">Avg. Per Service</h3>
          <p className="text-2xl lg:text-3xl xl:text-4xl font-black text-purple-400 truncate" title={`$${filtered.length > 0 ? (filteredRevenue / filtered.length).toFixed(0) : '0'}`}>
            ${filtered.length > 0 ? (filteredRevenue / filtered.length).toFixed(0) : '0'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-500/30 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col justify-center items-center text-center overflow-hidden">
          <p className="text-gray-400 text-xs sm:text-sm mb-2 truncate w-full">Export Data</p>
          <button onClick={exportCSV} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors w-full text-sm truncate">
            📥 Export CSV
          </button>
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

      {/* View Tabs */}
      <div className="flex gap-2 mb-4 border-b border-white/10 pb-3">
        {(['transactions', 'byStaff', 'byService'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm rounded-t transition-colors ${activeView === view ? 'text-brand-gold border-b-2 border-brand-gold font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            {view === 'transactions' ? '📋 Transactions' : view === 'byStaff' ? '✂️ By Staff' : '💇 By Service'}
          </button>
        ))}
      </div>

      {/* Transactions View */}
      {activeView === 'transactions' && (
        <div>
          {filtered.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8 sm:py-12 text-sm border border-dashed border-white/20 rounded">No completed transactions found{isFiltered ? ' for this date range' : ''}.</p>
          ) : (
            <>
              <div className="sm:hidden space-y-3">
                {filtered.map(apt => {
                  const paid = apt.totalAmount > 0 ? apt.totalAmount : apt.service.price;
                  const isRefunded = (apt.refundAmount || 0) > 0;
                  return (
                    <div key={apt.id} className={`bg-slate-900/70 p-3 rounded-lg border border-white/10 ${isRefunded ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-white truncate">{apt.user.name || apt.user.email}</p>
                          <p className="text-xs text-brand-gold">{apt.service.name}</p>
                          {apt.staff?.name && <p className="text-[10px] text-purple-400">✂️ {apt.staff.name}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          {isRefunded ? (
                            <span className="font-bold text-amber-400 text-sm line-through">${paid.toFixed(2)}</span>
                          ) : (
                            <span className="font-bold text-green-400 text-sm">${paid.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(apt.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isRefunded ? (
                          <span className="text-[10px] text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/20">
                            💸 Refunded
                          </span>
                        ) : (
                          <RefundButton shopId={shopId} appointmentId={apt.id} totalAmount={paid} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                      <th className="p-3 sm:p-4 font-semibold">Date & Time</th>
                      <th className="p-3 sm:p-4 font-semibold">Client</th>
                      <th className="p-3 sm:p-4 font-semibold">Service</th>
                      <th className="p-3 sm:p-4 font-semibold">Staff</th>
                      <th className="p-3 sm:p-4 font-semibold text-right">Total Paid</th>
                      <th className="p-3 sm:p-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filtered.map(apt => {
                      const paid = apt.totalAmount > 0 ? apt.totalAmount : apt.service.price;
                      const isRefunded = (apt.refundAmount || 0) > 0;
                      return (
                        <tr key={apt.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isRefunded ? 'opacity-60' : ''}`}>
                          <td className="p-3 sm:p-4 font-mono text-gray-300 text-xs sm:text-sm">
                            {new Date(apt.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 sm:p-4 text-white font-medium">{apt.user.name || apt.user.email}</td>
                          <td className="p-3 sm:p-4 text-brand-gold">
                            <div>{apt.service.name}</div>
                            {apt.tipAmount > 0 && <div className="text-[10px] text-amber-400">+${apt.tipAmount.toFixed(2)} tip</div>}
                            {apt.discount > 0 && <div className="text-[10px] text-red-400">-${apt.discount.toFixed(2)} disc.</div>}
                          </td>
                          <td className="p-3 sm:p-4 text-purple-300">{apt.staff?.name || '—'}</td>
                          <td className="p-3 sm:p-4 text-right font-bold">
                            {isRefunded ? (
                              <span className="text-amber-400 line-through">${paid.toFixed(2)}</span>
                            ) : (
                              <span className="text-green-400">${paid.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            {isRefunded ? (
                              <span className="text-[10px] text-amber-400 bg-amber-900/20 border border-amber-500/20 px-2 py-1 rounded">
                                💸 Refunded ${(apt.refundAmount || 0).toFixed(2)}
                              </span>
                            ) : (
                              <RefundButton shopId={shopId} appointmentId={apt.id} totalAmount={paid} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* By Staff View */}
      {activeView === 'byStaff' && (
        <div className="space-y-3">
          {byStaff.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8 text-sm border border-dashed border-white/20 rounded">No data available.</p>
          ) : byStaff.map(staff => {
            const pct = filteredRevenue > 0 ? (staff.revenue / filteredRevenue) * 100 : 0;
            return (
              <div key={staff.name} className="bg-slate-900/70 p-4 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-bold text-white">✂️ {staff.name}</h4>
                    <p className="text-xs text-gray-400">{staff.count} services completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${staff.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">{pct.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* By Service View */}
      {activeView === 'byService' && (
        <div className="space-y-3">
          {byService.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8 text-sm border border-dashed border-white/20 rounded">No data available.</p>
          ) : byService.map(svc => {
            const pct = filteredRevenue > 0 ? (svc.revenue / filteredRevenue) * 100 : 0;
            return (
              <div key={svc.name} className="bg-slate-900/70 p-4 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-bold text-brand-gold">{svc.name}</h4>
                    <p className="text-xs text-gray-400">{svc.count} times booked</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${svc.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">{pct.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-brand-gold h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
