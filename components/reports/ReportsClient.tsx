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

  const inputStyle: React.CSSProperties = {};
  const isFiltered = dateFrom || dateTo;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <div>
      {/* Floating Summary Bar */}
      <div className="bg-crm-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-crm-border shadow-sm mb-8 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10 relative z-20 transform sm:-translate-y-6 sm:-mx-2">
        
        {/* Revenue */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-confirmed/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-xs">
              {isFiltered ? 'Filtered Revenue' : 'Total Revenue'}
            </h3>
            <span className="text-status-confirmed text-sm">💵</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-3xl md:text-4xl">{formatCurrency(filteredRevenue)}</p>
          {isFiltered && <p className="text-crm-muted mt-2 truncate text-base md:text-lg">All-time: <span className="text-crm-muted">{formatCurrency(allTimeRevenue)}</span></p>}
        </div>

        {/* Tips */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-pending/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-xs">Tips</h3>
            <span className="text-status-pending text-sm">💰</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-3xl md:text-4xl">{formatCurrency(filteredTips)}</p>
          {isFiltered && <p className="text-crm-muted mt-2 truncate text-base md:text-lg">All-time: <span className="text-crm-muted">{formatCurrency(allTimeTips)}</span></p>}
        </div>

        {/* Completed */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-info/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-xs">Completed</h3>
            <span className="text-status-info text-sm">✂️</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-3xl md:text-4xl">{filtered.length.toLocaleString('en-US')}</p>
          <p className="text-crm-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity text-base md:text-lg">Appointments</p>
        </div>

        {/* Avg Service */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-crm-accent/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-xs">Avg Ticket</h3>
            <span className="text-crm-accent text-sm">📈</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-3xl md:text-4xl">
            {formatCurrency(filtered.length > 0 ? (filteredRevenue / filtered.length) : 0)}
          </p>
          <p className="text-crm-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity text-base md:text-lg">Per Service</p>
        </div>

      </div>

      {/* Date Filters & Export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-crm-surface rounded-lg border border-crm-border shadow-sm">
        <div className="flex-1">
          <label className="block text-crm-muted uppercase tracking-wider mb-1 text-sm">From Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle}
            className="w-full border border-crm-border shadow-sm rounded p-2 text-sm focus:outline-none focus:border-brand-gold " />
        </div>
        <div className="flex-1">
          <label className="block text-crm-muted uppercase tracking-wider mb-1 text-sm">To Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle}
            className="w-full border border-crm-border shadow-sm rounded p-2 text-sm focus:outline-none focus:border-brand-gold " />
        </div>
        {isFiltered && (
          <div className="flex items-end">
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-crm-muted hover:text-crm-text px-4 py-2 border border-crm-border shadow-sm rounded">
              Clear Filters
            </button>
          </div>
        )}
        <div className="flex items-end">
          <button onClick={exportCSV} className="text-sm bg-crm-surface border border-crm-border shadow-sm hover:bg-crm-primary hover:text-white text-crm-text font-medium px-4 py-2 rounded transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
            <span>📥</span> Download CSV
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4 border-b border-crm-border pb-3">
        {(['transactions', 'byStaff', 'byService'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm rounded-t transition-colors ${activeView === view ? 'text-crm-accent border-b-2 border-brand-gold font-semibold' : 'text-crm-muted hover:text-crm-text'}`}
          >
            {view === 'transactions' ? '📋 Transactions' : view === 'byStaff' ? '✂️ By Staff' : '💇 By Service'}
          </button>
        ))}
      </div>

      {/* Transactions View */}
      {activeView === 'transactions' && (
        <div>
          {filtered.length === 0 ? (
            <p className="text-crm-muted italic text-center py-8 sm:py-12 border border-dashed border-crm-border rounded text-base md:text-lg">No completed transactions found{isFiltered ? ' for this date range' : ''}.</p>
          ) : (
            <>
              <div className="sm:hidden space-y-3">
                {filtered.map(apt => {
                  const paid = apt.totalAmount > 0 ? apt.totalAmount : apt.service.price;
                  const isRefunded = (apt.refundAmount || 0) > 0;
                  return (
                    <div key={apt.id} className={`bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm ${isRefunded ? 'opacity-60' : ''}`}>
                      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-crm-text truncate text-base md:text-lg">{apt.user.name || apt.user.email}</p>
                          <p className="text-crm-accent text-base md:text-lg">{apt.service.name}</p>
                          {apt.staff?.name && <p className="text-crm-accent text-base md:text-lg">✂️ {apt.staff.name}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          {isRefunded ? (
                            <span className="font-bold text-status-pending text-sm line-through">${paid.toFixed(2)}</span>
                          ) : (
                            <span className="font-bold text-status-confirmed text-sm">${paid.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-crm-muted font-mono">
                          {new Date(apt.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isRefunded ? (
                          <span className="text-sm text-status-pending bg-amber-900/20 px-2 py-0.5 rounded border border-status-pending/20">
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
                    <tr className="border-b border-crm-border text-crm-muted text-xs sm:text-sm uppercase tracking-wider">
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
                        <tr key={apt.id} className={`border-b border-crm-border hover:bg-crm-surface transition-colors ${isRefunded ? 'opacity-60' : ''}`}>
                          <td className="p-3 sm:p-4 font-mono text-crm-muted text-xs sm:text-sm">
                            {new Date(apt.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 sm:p-4 text-crm-text font-medium">{apt.user.name || apt.user.email}</td>
                          <td className="p-3 sm:p-4 text-crm-accent">
                            <div>{apt.service.name}</div>
                            {apt.tipAmount > 0 && <div className="text-sm text-status-pending">+${apt.tipAmount.toFixed(2)} tip</div>}
                            {apt.discount > 0 && <div className="text-sm text-status-cancelled">-${apt.discount.toFixed(2)} disc.</div>}
                          </td>
                          <td className="p-3 sm:p-4 text-crm-accent">{apt.staff?.name || '—'}</td>
                          <td className="p-3 sm:p-4 text-right font-bold">
                            {isRefunded ? (
                              <span className="text-status-pending line-through">${paid.toFixed(2)}</span>
                            ) : (
                              <span className="text-status-confirmed">${paid.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            {isRefunded ? (
                              <span className="text-sm text-status-pending bg-amber-900/20 border border-status-pending/20 px-2 py-1 rounded">
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
            <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-base md:text-lg">No data available.</p>
          ) : byStaff.map(staff => {
            const pct = filteredRevenue > 0 ? (staff.revenue / filteredRevenue) * 100 : 0;
            return (
              <div key={staff.name} className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2">
                  <div>
                    <h4 className="font-bold text-crm-text text-xl md:text-2xl">✂️ {staff.name}</h4>
                    <p className="text-crm-muted text-base md:text-lg">{staff.count} services completed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-status-confirmed text-3xl md:text-4xl">${staff.revenue.toFixed(2)}</p>
                    <p className="text-crm-muted text-base md:text-lg">{pct.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="w-full bg-crm-surface rounded-full h-2">
                  <div className="bg-status-confirmed h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
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
            <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-base md:text-lg">No data available.</p>
          ) : byService.map(svc => {
            const pct = filteredRevenue > 0 ? (svc.revenue / filteredRevenue) * 100 : 0;
            return (
              <div key={svc.name} className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2">
                  <div>
                    <h4 className="font-bold text-crm-accent text-xl md:text-2xl">{svc.name}</h4>
                    <p className="text-crm-muted text-base md:text-lg">{svc.count} times booked</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-status-confirmed text-3xl md:text-4xl">${svc.revenue.toFixed(2)}</p>
                    <p className="text-crm-muted text-base md:text-lg">{pct.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="w-full bg-crm-surface rounded-full h-2">
                  <div className="bg-crm-primary h-2 rounded-full transition-all hover:opacity-90 text-white" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
