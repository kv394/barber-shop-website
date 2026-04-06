'use client';

import { useState, useEffect } from 'react';

export default function EngagementAnalytics({ shopId }: { shopId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${shopId}/engagement/analytics`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) return <p className="text-gray-400 text-center py-12">Loading analytics...</p>;
  if (!data || data.error) return <p className="text-red-400 text-center py-12">Failed to load analytics.</p>;

  const { overview, loyalty, referrals, campaigns, topClients } = data;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 p-3 rounded-xl text-center">
          <p className="text-2xl font-black text-blue-400">{overview.totalClients}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Total Clients</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 p-3 rounded-xl text-center">
          <p className="text-2xl font-black text-green-400">{overview.activeLastMonth}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Active (30d)</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-500/30 p-3 rounded-xl text-center">
          <p className="text-2xl font-black text-cyan-400">{overview.newLastMonth}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">New (30d)</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 p-3 rounded-xl text-center">
          <p className="text-2xl font-black text-purple-400">{overview.retentionRate}%</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Retention</p>
        </div>
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-3 rounded-xl text-center">
          <p className="text-2xl font-black text-amber-400">{overview.completedAppointments}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Appts (30d)</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-500/30 p-3 rounded-xl text-center">
          <p className="text-2xl font-black text-yellow-400">⭐ {overview.averageRating}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Avg Rating</p>
        </div>
      </div>

      {/* Program Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 p-5 rounded-xl border border-white/10">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <span>⭐</span> Loyalty Program
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span className={loyalty.isActive ? 'text-green-400 font-semibold' : 'text-red-400'}>
                {loyalty.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Members</span>
              <span className="text-white font-semibold">{loyalty.totalAccounts}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-xl border border-white/10">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <span>🔗</span> Referrals
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total</span>
              <span className="text-white font-semibold">{referrals.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="text-green-400 font-semibold">{referrals.completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/70 p-5 rounded-xl border border-white/10">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <span>📣</span> Campaigns
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Sent</span>
              <span className="text-white font-semibold">{campaigns.totalSent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-slate-900/70 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>🏅</span> Top Clients (Last 90 Days)
        </h3>

        {!topClients || topClients.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8 border border-dashed border-white/10 rounded">
            No client data available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase tracking-wider border-b border-white/10">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Client</th>
                  <th className="text-right py-2 px-2">Visits</th>
                  <th className="text-right py-2 px-2">Spent</th>
                  <th className="text-right py-2 px-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c: any, idx: number) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-2 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <p className="text-white font-medium truncate max-w-[200px]">{c.name || 'Guest'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{c.email}</p>
                    </td>
                    <td className="py-2 px-2 text-right text-blue-400 font-semibold">{c.visitCount}</td>
                    <td className="py-2 px-2 text-right text-green-400 font-semibold">${c.totalSpend.toFixed(0)}</td>
                    <td className="py-2 px-2 text-right text-brand-gold font-semibold">{c.loyaltyPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

