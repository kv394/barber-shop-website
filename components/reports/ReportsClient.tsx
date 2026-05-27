'use client';

import { useState, useMemo } from 'react';
import { fmtPrice } from '@/lib/formatters';
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
  currency: string;
}

export default function ReportsClient({
  appointments,
  totalRevenue: allTimeRevenue,
  totalTips: allTimeTips,
  shopId,
  currency,
}: ReportsClientProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeView, setActiveView] = useState<'transactions' | 'byStaff' | 'byService'>('transactions');
  const formatCurrency = (val: number) => fmtPrice(val, currency);

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
      fmtPrice(apt.service.price, currency),
      fmtPrice(apt.discount || 0, currency),
      fmtPrice(apt.tipAmount || 0, currency),
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

  const formatCurrencyLocal = (value: number) => {
    return fmtPrice(value, currency);
  };

  return (
    <div>
      {/* Floating Summary Bar */}
      <div className="bg-crm-surface backdrop-blur-xl overflow-hidden shadow-2xl rounded-2xl border border-crm-border shadow-sm mb-8 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10 relative z-20 transform sm:-translate-y-6 sm:-mx-2">
        
        {/* Revenue */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-confirmed/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">
              {isFiltered ? 'Filtered Revenue' : 'Total Revenue'}
            </h3>
            <span className="text-status-confirmed text-[13px]">💵</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{formatCurrency(filteredRevenue)}</p>
          {isFiltered && <p className="text-crm-muted mt-2 truncate text-[13px]">All-time: <span className="text-crm-muted">{formatCurrency(allTimeRevenue)}</span></p>}
        </div>

        {/* Tips */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-pending/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">Tips</h3>
            <span className="text-status-pending text-[13px]">💰</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{formatCurrency(filteredTips)}</p>
          {isFiltered && <p className="text-crm-muted mt-2 truncate text-[13px]">All-time: <span className="text-crm-muted">{formatCurrency(allTimeTips)}</span></p>}
        </div>

        {/* Completed */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-info/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">Completed</h3>
            <span className="text-status-info text-[13px]">✂️</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{filtered.length.toLocaleString('en-US')}</p>
          <p className="text-crm-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity text-[13px]">Appointments</p>
        </div>

        {/* Avg Service */}
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-crm-accent/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">Avg Ticket</h3>
            <span className="text-crm-accent text-[13px]">📈</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">
            {formatCurrency(filtered.length > 0 ? (filteredRevenue / filtered.length) : 0)}
          </p>
          <p className="text-crm-muted mt-2 truncate opacity-0 group-hover:opacity-100 transition-opacity text-[13px]">Per Service</p>
        </div>

      </div>

      {/* Date Filters & Export */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end mb-6 p-4 bg-crm-surface rounded-lg border border-crm-border shadow-sm">
        <div className="flex-1 sm:flex-none">
          <label className="block text-crm-muted uppercase tracking-wider mb-1 text-[13px]">Start Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-[40px] bg-crm-surface border border-crm-border shadow-sm rounded px-3 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold w-full sm:w-auto" />
        </div>
        <div className="flex-1 sm:flex-none">
          <label className="block text-crm-muted uppercase tracking-wider mb-1 text-[13px]">End Date</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-[40px] bg-crm-surface border border-crm-border shadow-sm rounded px-3 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold w-full sm:w-auto" />
        </div>
        {isFiltered && (
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="h-[40px] text-[11px] text-crm-muted hover:text-crm-text px-4 border border-crm-border shadow-sm rounded flex items-center justify-center w-full sm:w-auto">
              Clear Filters
            </button>
          </div>
        )}
        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <button onClick={exportCSV} className="h-[40px] text-[13px] bg-crm-surface border border-crm-border shadow-sm hover:bg-crm-primary hover:text-white text-crm-text font-medium px-4 rounded transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
            <span className="text-[14px]">📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4 border-b border-crm-border pb-3">
        {(['transactions', 'byStaff', 'byService'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-[13px] rounded-t transition-colors ${activeView === view ? 'text-crm-accent border-b-2 border-brand-gold font-semibold' : 'text-crm-muted hover:text-crm-text'}`}
          >
            {view === 'transactions' ? '📋 Transactions' : view === 'byStaff' ? '✂️ By Staff' : '💇 By Service'}
          </button>
        ))}
      </div>

      {/* Transactions View */}
      {activeView === 'transactions' && (
        <div>
          {filtered.length === 0 ? (
            <p className="text-crm-muted italic text-center py-8 sm:py-12 border border-dashed border-crm-border rounded text-[13px]">No completed transactions found{isFiltered ? ' for this date range' : ''}.</p>
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
                          <p className="font-medium text-crm-text truncate text-[13px]">{apt.user.name || apt.user.email}</p>
                          <p className="text-crm-accent text-[13px]">{apt.service.name}</p>
                          {apt.staff?.name && <p className="text-crm-accent text-[13px]">✂️ {apt.staff.name}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          {isRefunded ? (
                            <span className="font-bold text-status-pending text-[13px] line-through">{fmtPrice(paid, currency)}</span>
                          ) : (
                            <span className="font-bold text-status-confirmed text-[13px]">{fmtPrice(paid, currency)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[13px] text-crm-muted font-mono">
                          {new Date(apt.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isRefunded ? (
                          <span className="text-[13px] text-status-pending bg-amber-900/20 px-2 py-0.5 rounded border border-status-pending/20">
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
                    <tr className="border-b border-crm-border text-crm-muted text-[11px] sm:text-[13px] uppercase tracking-wider">
                      <th className="p-3 sm:p-4 font-semibold">Date & Time</th>
                      <th className="p-3 sm:p-4 font-semibold">Client</th>
                      <th className="p-3 sm:p-4 font-semibold">Service</th>
                      <th className="p-3 sm:p-4 font-semibold">Staff</th>
                      <th className="p-3 sm:p-4 font-semibold text-right">Total Paid</th>
                      <th className="p-3 sm:p-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {filtered.map(apt => {
                      const paid = apt.totalAmount > 0 ? apt.totalAmount : apt.service.price;
                      const isRefunded = (apt.refundAmount || 0) > 0;
                      return (
                        <tr key={apt.id} className={`border-b border-crm-border hover:bg-crm-surface transition-colors ${isRefunded ? 'opacity-60' : ''}`}>
                          <td className="p-3 sm:p-4 font-mono text-crm-muted text-[11px] sm:text-[13px]">
                            {new Date(apt.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 sm:p-4 text-crm-text font-medium">{apt.user.name || apt.user.email}</td>
                          <td className="p-3 sm:p-4 text-crm-accent">
                            <div>{apt.service.name}</div>
                            {apt.tipAmount > 0 && <div className="text-[13px] text-status-pending">+{fmtPrice(apt.tipAmount, currency)} tip</div>}
                            {apt.discount > 0 && <div className="text-[13px] text-status-cancelled">-{fmtPrice(apt.discount, currency)} disc.</div>}
                          </td>
                          <td className="p-3 sm:p-4 text-crm-accent">{apt.staff?.name || '—'}</td>
                          <td className="p-3 sm:p-4 text-right font-bold">
                            {isRefunded ? (
                              <span className="text-status-pending line-through">{fmtPrice(paid, currency)}</span>
                            ) : (
                              <span className="text-status-confirmed">{fmtPrice(paid, currency)}</span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            {isRefunded ? (
                              <span className="text-[13px] text-status-pending bg-amber-900/20 border border-status-pending/20 px-2 py-1 rounded">
                                💸 Refunded {fmtPrice(apt.refundAmount || 0, currency)}
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
            <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-[13px]">No data available.</p>
          ) : byStaff.map(staff => {
            const pct = filteredRevenue > 0 ? (staff.revenue / filteredRevenue) * 100 : 0;
            return (
              <div key={staff.name} className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2">
                  <div>
                    <h4 className="font-bold text-crm-text text-base font-semibold">✂️ {staff.name}</h4>
                    <p className="text-crm-muted text-[13px]">{staff.count} services completed</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-status-confirmed text-xl font-bold">{formatCurrencyLocal(staff.revenue)}</p>
                    <p className="text-crm-muted text-[13px]">{pct.toFixed(1)}% of total</p>
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
            <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-[13px]">No data available.</p>
          ) : byService.map(svc => {
            const pct = filteredRevenue > 0 ? (svc.revenue / filteredRevenue) * 100 : 0;
            return (
              <div key={svc.name} className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2">
                  <div>
                    <h4 className="font-bold text-crm-accent text-base font-semibold">{svc.name}</h4>
                    <p className="text-crm-muted text-[13px]">{svc.count} times booked</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-status-confirmed text-xl font-bold">{fmtPrice(svc.revenue, currency)}</p>
                    <p className="text-crm-muted text-[13px]">{pct.toFixed(1)}% of total</p>
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
