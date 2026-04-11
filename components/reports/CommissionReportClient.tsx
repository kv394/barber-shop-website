'use client';

import { useState, useEffect } from 'react';

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
}

export default function CommissionReportClient({
  shopId,
  staffId,
  isPersonalView = false,
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
          <label className="block text-xs text-botanical-muted mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
        </div>
        <div>
          <label className="block text-xs text-botanical-muted mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
        </div>
        <button onClick={exportCSV} className="bg-botanical-surface hover:bg-botanical-surface text-botanical-text px-4 py-2 rounded text-sm transition-colors">📥 Export CSV</button>
      </div>

      {/* Totals Floating Bar */}
      <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border-2 border-b-[6px] border-botanical-border flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">{isPersonalView ? 'My Revenue' : 'Gross Revenue'}</h3>
            <span className="text-green-500 text-sm">💵</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">{isPersonalView ? 'My Commission' : 'Commission'}</h3>
            <span className="text-blue-500 text-sm">💎</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">${totalCommission.toFixed(0)}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">{isPersonalView ? 'My Tips' : 'Tips'}</h3>
            <span className="text-amber-500 text-sm">🪙</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">${totalTips.toFixed(0)}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">{isPersonalView ? 'My Total Pay' : 'Total Payout'}</h3>
            <span className="text-purple-500 text-sm">💳</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">${totalPayout.toFixed(0)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-botanical-muted text-center py-8 animate-pulse">Calculating commissions…</p>
      ) : summary.length === 0 ? (
        <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded">No completed appointments in this date range.</p>
      ) : (
        <>
          {/* Staff Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-botanical-border text-botanical-muted text-xs uppercase">
                  <th className="text-left p-3">Staff</th>
                  <th className="text-right p-3">Services</th>
                  <th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Commission</th>
                  <th className="text-right p-3">Tips</th>
                  <th className="text-right p-3 text-botanical-accent">Payout</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(s => (
                  <tr key={s.staffId} className="border-b border-botanical-border hover:bg-botanical-surface">
                    <td className="p-3 font-medium text-botanical-text">{s.staffName}</td>
                    <td className="p-3 text-right text-botanical-muted">{s.servicesCount}</td>
                    <td className="p-3 text-right text-botanical-muted">${s.grossRevenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-blue-400">${s.totalCommission.toFixed(2)}</td>
                    <td className="p-3 text-right text-amber-400">${s.totalTips.toFixed(2)}</td>
                    <td className="p-3 text-right text-botanical-accent font-bold">${s.totalPayout.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Toggle */}
          <button onClick={() => setShowDetails(!showDetails)} className="text-sm text-botanical-muted hover:text-botanical-text transition-colors">
            {showDetails ? '▼ Hide Details' : '▶ Show Line-by-Line Details'}
          </button>

          {showDetails && (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-botanical-border text-botanical-muted uppercase sticky top-0 bg-botanical-surface">
                    <th className="text-left p-2">Staff</th>
                    <th className="text-left p-2">Service</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Tip</th>
                    <th className="text-right p-2">Commission</th>
                    <th className="text-left p-2">Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={i} className="border-b border-botanical-border">
                      <td className="p-2 text-botanical-muted">{d.staffName}</td>
                      <td className="p-2 text-botanical-muted">{d.serviceName}</td>
                      <td className="p-2 text-right text-botanical-muted">${d.serviceAmount.toFixed(2)}</td>
                      <td className="p-2 text-right text-amber-400">${d.tipAmount.toFixed(2)}</td>
                      <td className="p-2 text-right text-blue-400">${d.commission.toFixed(2)}</td>
                      <td className="p-2 text-botanical-muted">{d.rateValue}{d.rateType === 'PERCENTAGE' ? '%' : ' flat'} ({d.commissionSource})</td>
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

