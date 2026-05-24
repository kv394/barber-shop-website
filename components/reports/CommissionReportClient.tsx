'use client';

import { useState, useEffect } from 'react';
import { fmtPrice } from '@/lib/formatters';

interface StaffSummary {
  staffId: string;
  staffName: string;
  servicesCount: number;
  grossRevenue: number;
  totalCommission: number;
  totalTips: number;
  totalPayout: number;
}

interface DetailRow {
  appointmentId: string;
  staffName: string;
  serviceName: string;
  serviceAmount: number;
  tipAmount: number;
  commission: number;
  commissionSource: string;
  rateType: string;
  rateValue: number;
}

export interface CommissionReportClientProps {
  shopId: string;
  staffId?: string;
  isPersonalView?: boolean;
  currency: string;
}

export default function CommissionReportClient({
  shopId,
  staffId,
  isPersonalView = false,
  currency,
}: CommissionReportClientProps) {
  const [summary, setSummary] = useState<StaffSummary[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `/api/shops/${shopId}/commissions?start=${startDate}&end=${endDate}${staffId ? `&staffId=${staffId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || []);
        setDetails(data.details || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const totalCommission = summary.reduce((s, r) => s + r.totalCommission, 0);
  const totalTips = summary.reduce((s, r) => s + r.totalTips, 0);
  const totalPayout = summary.reduce((s, r) => s + r.totalPayout, 0);
  const totalRevenue = summary.reduce((s, r) => s + r.grossRevenue, 0);

  const exportCSV = () => {
    const rows = [
      ['Staff', 'Service', 'Revenue', 'Tip', 'Commission', 'Rate', 'Source'],
      ...details.map(d => [d.staffName, d.serviceName, d.serviceAmount.toFixed(2), d.tipAmount.toFixed(2), d.commission.toFixed(2), `${d.rateValue}${d.rateType === 'PERCENTAGE' ? '%' : ' flat'}`, d.commissionSource]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commissions-${startDate}-${endDate}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-crm-muted mb-1 text-[13px]">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
        </div>
        <div>
          <label className="block text-crm-muted mb-1 text-[13px]">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
        </div>
        <div>
          <label className="block text-crm-muted mb-1 text-[13px] invisible select-none">Export</label>
          <button onClick={exportCSV} className="bg-crm-surface hover:bg-crm-surface text-crm-text px-4 py-2 rounded text-[13px] transition-colors border border-crm-border shadow-sm">📥 Export CSV</button>
        </div>
      </div>

      {/* Totals Floating Bar */}
      <div className="bg-crm-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-crm-border shadow-sm flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-confirmed/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">{isPersonalView ? 'My Revenue' : 'Gross Revenue'}</h3>
            <span className="text-status-confirmed text-[13px]">💵</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{fmtPrice(totalRevenue, currency)}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-info/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">{isPersonalView ? 'My Commission' : 'Commission'}</h3>
            <span className="text-status-info text-[13px]">💎</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{fmtPrice(totalCommission, currency)}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-pending/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">{isPersonalView ? 'My Tips' : 'Tips'}</h3>
            <span className="text-status-pending text-[13px]">🪙</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{fmtPrice(totalTips, currency)}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-crm-accent/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
            <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">{isPersonalView ? 'My Total Pay' : 'Total Payout'}</h3>
            <span className="text-crm-accent text-[13px]">💳</span>
          </div>
          <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{fmtPrice(totalPayout, currency)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-crm-muted text-center py-8 animate-pulse text-[13px]">Calculating commissions…</p>
      ) : summary.length === 0 ? (
        <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-[13px]">No completed appointments in this date range.</p>
      ) : (
        <>
          {/* Staff Summary Table */}
          <div className="overflow-x-auto bg-crm-bg rounded-lg border border-crm-border shadow-sm mb-4">
            <table className="w-full text-[13px] border-collapse whitespace-nowrap">
              <thead className="bg-crm-surface/50">
                <tr className="border-b border-crm-border text-crm-muted text-[11px] uppercase tracking-wider">
                  <th className="text-left p-3 sm:p-4 font-semibold">Staff</th>
                  <th className="text-right p-3 sm:p-4 font-semibold">Services</th>
                  <th className="text-right p-3 sm:p-4 font-semibold">Revenue</th>
                  <th className="text-right p-3 sm:p-4 font-semibold">Commission</th>
                  <th className="text-right p-3 sm:p-4 font-semibold">Tips</th>
                  <th className="text-right p-3 sm:p-4 font-semibold text-crm-accent">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-border/50">
                {summary.map(s => (
                  <tr key={s.staffId} className="hover:bg-crm-surface/50 transition-colors">
                    <td className="p-3 sm:p-4 font-medium text-crm-text">{s.staffName}</td>
                    <td className="p-3 sm:p-4 text-right text-crm-muted">{s.servicesCount}</td>
                    <td className="p-3 sm:p-4 text-right text-crm-muted">{fmtPrice(s.grossRevenue, currency)}</td>
                    <td className="p-3 sm:p-4 text-right font-medium text-status-info">{fmtPrice(s.totalCommission, currency)}</td>
                    <td className="p-3 sm:p-4 text-right font-medium text-status-pending">{fmtPrice(s.totalTips, currency)}</td>
                    <td className="p-3 sm:p-4 text-right text-crm-accent font-bold">{fmtPrice(s.totalPayout, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Toggle */}
          <button onClick={() => setShowDetails(!showDetails)} className="text-[13px] text-crm-muted hover:text-crm-text transition-colors">
            {showDetails ? '▼ Hide Details' : '▶ Show Line-by-Line Details'}
          </button>

          {showDetails && (
            <div className="overflow-x-auto bg-crm-bg rounded-lg border border-crm-border shadow-sm">
              <table className="w-full text-[11px] border-collapse whitespace-nowrap">
                <thead className="bg-crm-surface/50">
                  <tr className="border-b border-crm-border text-crm-muted uppercase tracking-wider">
                    <th className="text-left p-2 sm:p-3 font-semibold">Staff</th>
                    <th className="text-left p-2 sm:p-3 font-semibold">Service</th>
                    <th className="text-right p-2 sm:p-3 font-semibold">Amount</th>
                    <th className="text-right p-2 sm:p-3 font-semibold">Tip</th>
                    <th className="text-right p-2 sm:p-3 font-semibold">Commission</th>
                    <th className="text-left p-2 sm:p-3 font-semibold">Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crm-border/50">
                  {details.map((d, i) => (
                    <tr key={i} className="hover:bg-crm-surface/50 transition-colors">
                      <td className="p-2 sm:p-3 text-crm-muted">{d.staffName}</td>
                      <td className="p-2 sm:p-3 text-crm-text">{d.serviceName}</td>
                      <td className="p-2 sm:p-3 text-right text-crm-text font-medium">{fmtPrice(d.serviceAmount, currency)}</td>
                      <td className="p-2 sm:p-3 text-right text-status-pending font-medium">{fmtPrice(d.tipAmount, currency)}</td>
                      <td className="p-2 sm:p-3 text-right text-status-info font-medium">{fmtPrice(d.commission, currency)}</td>
                      <td className="p-2 sm:p-3 text-crm-muted text-[10px]">{d.rateValue}{d.rateType === 'PERCENTAGE' ? '%' : ' flat'} ({d.commissionSource})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

