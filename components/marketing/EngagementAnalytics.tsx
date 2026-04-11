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

  if (loading) return <p className="text-botanical-muted text-center py-12">Loading analytics...</p>;
  if (!data || data.error) return <p className="text-red-400 text-center py-12">Failed to load analytics.</p>;

  const { overview, loyalty, referrals, campaigns, topClients } = data;

  return (
    <div className="space-y-8">
      {/* Overview Floating Bar */}
      <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-botanical-border flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Total Clients</h3>
            <span className="text-blue-500 text-sm">👥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{overview.totalClients}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Active (30d)</h3>
            <span className="text-green-500 text-sm">🔥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{overview.activeLastMonth}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">New (30d)</h3>
            <span className="text-cyan-500 text-sm">🌟</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{overview.newLastMonth}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Retention</h3>
            <span className="text-purple-500 text-sm">🔄</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{overview.retentionRate}%</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Appts (30d)</h3>
            <span className="text-amber-500 text-sm">📅</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{overview.completedAppointments}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0 border-t md:border-t-0 md:border-l border-botanical-border">
          <div className="absolute top-0 left-0 w-full h-1 bg-botanical-primary/80"></div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Avg Rating</h3>
            <span className="text-yellow-500 text-sm">⭐</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{overview.averageRating}</p>
        </div>
      </div>

      {/* Program Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-botanical-surface p-5 rounded-xl border border-botanical-border">
          <h4 className="text-sm font-bold text-botanical-text flex items-center gap-2 mb-3">
            <span>⭐</span> Loyalty Program
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-botanical-muted">Status</span>
              <span className={loyalty.isActive ? 'text-green-400 font-semibold' : 'text-red-400'}>
                {loyalty.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-botanical-muted">Members</span>
              <span className="text-botanical-text font-semibold">{loyalty.totalAccounts}</span>
            </div>
          </div>
        </div>

        <div className="bg-botanical-surface p-5 rounded-xl border border-botanical-border">
          <h4 className="text-sm font-bold text-botanical-text flex items-center gap-2 mb-3">
            <span>🔗</span> Referrals
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-botanical-muted">Total</span>
              <span className="text-botanical-text font-semibold">{referrals.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-botanical-muted">Completed</span>
              <span className="text-green-400 font-semibold">{referrals.completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-botanical-surface p-5 rounded-xl border border-botanical-border">
          <h4 className="text-sm font-bold text-botanical-text flex items-center gap-2 mb-3">
            <span>📣</span> Campaigns
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-botanical-muted">Sent</span>
              <span className="text-botanical-text font-semibold">{campaigns.totalSent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border">
        <h3 className="text-lg font-bold text-botanical-text flex items-center gap-2 mb-4">
          <span>🏅</span> Top Clients (Last 90 Days)
        </h3>

        {!topClients || topClients.length === 0 ? (
          <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded">
            No client data available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-botanical-muted text-[10px] uppercase tracking-wider border-b border-botanical-border">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Client</th>
                  <th className="text-right py-2 px-2">Visits</th>
                  <th className="text-right py-2 px-2">Spent</th>
                  <th className="text-right py-2 px-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c: any, idx: number) => (
                  <tr key={c.id} className="border-b border-botanical-border hover:bg-botanical-surface">
                    <td className="py-2 px-2 text-botanical-muted">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <p className="text-botanical-text font-medium truncate max-w-[200px]">{c.name || 'Guest'}</p>
                      <p className="text-[10px] text-botanical-muted truncate">{c.email}</p>
                    </td>
                    <td className="py-2 px-2 text-right text-blue-400 font-semibold">{c.visitCount}</td>
                    <td className="py-2 px-2 text-right text-green-400 font-semibold">${c.totalSpend.toFixed(0)}</td>
                    <td className="py-2 px-2 text-right text-botanical-accent font-semibold">{c.loyaltyPoints}</td>
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

