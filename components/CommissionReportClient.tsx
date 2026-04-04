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
          <label className="block text-xs text-gray-400 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-black/40 border border-white/20 rounded p-2 text-white text-sm focus:outline-none focus:border-brand-gold" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ colorScheme: 'dark' }} className="bg-black/40 border border-white/20 rounded p-2 text-white text-sm focus:outline-none focus:border-brand-gold" />
        </div>
        <button onClick={exportCSV} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm transition-colors">📥 Export CSV</button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-green-400">${totalRevenue.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{isPersonalView ? 'My Revenue' : 'Gross Revenue'}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-blue-400">${totalCommission.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{isPersonalView ? 'My Commission' : 'Commission'}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-amber-400">${totalTips.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{isPersonalView ? 'My Tips' : 'Tips'}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 p-4 rounded-xl text-center">
          <p className="text-2xl font-black text-purple-400">${totalPayout.toFixed(0)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{isPersonalView ? 'My Total Pay' : 'Total Payout'}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8 animate-pulse">Calculating commissions…</p>
      ) : summary.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8 border border-dashed border-white/20 rounded">No completed appointments in this date range.</p>
      ) : (
        <>
          {/* Staff Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                  <th className="text-left p-3">Staff</th>
                  <th className="text-right p-3">Services</th>
                  <th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Commission</th>
                  <th className="text-right p-3">Tips</th>
                  <th className="text-right p-3 text-brand-gold">Payout</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(s => (
                  <tr key={s.staffId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-medium text-white">{s.staffName}</td>
                    <td className="p-3 text-right text-gray-300">{s.servicesCount}</td>
                    <td className="p-3 text-right text-gray-300">${s.grossRevenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-blue-400">${s.totalCommission.toFixed(2)}</td>
                    <td className="p-3 text-right text-amber-400">${s.totalTips.toFixed(2)}</td>
                    <td className="p-3 text-right text-brand-gold font-bold">${s.totalPayout.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Toggle */}
          <button onClick={() => setShowDetails(!showDetails)} className="text-sm text-gray-400 hover:text-white transition-colors">
            {showDetails ? '▼ Hide Details' : '▶ Show Line-by-Line Details'}
          </button>

          {showDetails && (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 uppercase sticky top-0 bg-slate-800">
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
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-2 text-gray-300">{d.staffName}</td>
                      <td className="p-2 text-gray-300">{d.serviceName}</td>
                      <td className="p-2 text-right text-gray-300">${d.serviceAmount.toFixed(2)}</td>
                      <td className="p-2 text-right text-amber-400">${d.tipAmount.toFixed(2)}</td>
                      <td className="p-2 text-right text-blue-400">${d.commission.toFixed(2)}</td>
                      <td className="p-2 text-gray-500">{d.rateValue}{d.rateType === 'PERCENTAGE' ? '%' : ' flat'} ({d.commissionSource})</td>
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

