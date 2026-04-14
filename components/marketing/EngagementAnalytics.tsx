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

  if (loading) return <p className="text-botanical-muted text-center py-12 text-base md:text-lg">Loading analytics...</p>;
  if (!data || data.error) return <p className="text-status-cancelled text-center py-12 text-base md:text-lg">Failed to load analytics.</p>;

  const { overview, loyalty, referrals, campaigns, topClients } = data;

  return (
    <div className="space-y-8">
      {/* Overview Floating Bar */}
      <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-botanical-border shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
        <div className="p-4 sm:p-5 relative overflow-hidden group hover:bg-gray-50 transition-all duration-300 min-w-0 border-b lg:border-b-0 lg:border-r border-botanical-border border-r md:border-r-0 flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-info/80"></div>
          <span className="text-status-info text-xl sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">👥</span>
          <h3 className="text-botanical-muted text-[10px] uppercase tracking-widest font-semibold leading-tight mb-1 w-full truncate text-2xl md:text-3xl">Total Clients</h3>
          <p className="font-black text-botanical-text break-words leading-tight w-full text-base md:text-lg">{overview.totalClients}</p>
        </div>
        <div className="p-4 sm:p-5 relative overflow-hidden group hover:bg-gray-50 transition-all duration-300 min-w-0 border-b lg:border-b-0 lg:border-r border-botanical-border md:border-r flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-confirmed/80"></div>
          <span className="text-status-confirmed text-xl sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">🔥</span>
          <h3 className="text-botanical-muted text-[10px] uppercase tracking-widest font-semibold leading-tight mb-1 w-full truncate text-2xl md:text-3xl">Active (30d)</h3>
          <p className="font-black text-botanical-text break-words leading-tight w-full text-base md:text-lg">{overview.activeLastMonth}</p>
        </div>
        <div className="p-4 sm:p-5 relative overflow-hidden group hover:bg-gray-50 transition-all duration-300 min-w-0 border-b lg:border-b-0 lg:border-r border-botanical-border border-r md:border-r-0 flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/80"></div>
          <span className="text-cyan-500 text-xl sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">🌟</span>
          <h3 className="text-botanical-muted text-[10px] uppercase tracking-widest font-semibold leading-tight mb-1 w-full truncate text-2xl md:text-3xl">New (30d)</h3>
          <p className="font-black text-botanical-text break-words leading-tight w-full text-base md:text-lg">{overview.newLastMonth}</p>
        </div>
        <div className="p-4 sm:p-5 relative overflow-hidden group hover:bg-gray-50 transition-all duration-300 min-w-0 border-b md:border-b-0 lg:border-r border-botanical-border md:border-r flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/80"></div>
          <span className="text-purple-500 text-xl sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">🔄</span>
          <h3 className="text-botanical-muted text-[10px] uppercase tracking-widest font-semibold leading-tight mb-1 w-full truncate text-2xl md:text-3xl">Retention</h3>
          <p className="font-black text-botanical-text break-words leading-tight w-full text-base md:text-lg">{overview.retentionRate}%</p>
        </div>
        <div className="p-4 sm:p-5 relative overflow-hidden group hover:bg-gray-50 transition-all duration-300 min-w-0 border-r border-botanical-border flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-pending/80"></div>
          <span className="text-status-pending text-xl sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">📅</span>
          <h3 className="text-botanical-muted text-[10px] uppercase tracking-widest font-semibold leading-tight mb-1 w-full truncate text-2xl md:text-3xl">Appts (30d)</h3>
          <p className="font-black text-botanical-text break-words leading-tight w-full text-base md:text-lg">{overview.completedAppointments}</p>
        </div>
        <div className="p-4 sm:p-5 relative overflow-hidden group hover:bg-gray-50 transition-all duration-300 min-w-0 flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-botanical-primary/80 hover:opacity-90 text-white"></div>
          <span className="text-status-pending text-xl sm:text-2xl mb-1 sm:mb-2 flex-shrink-0">⭐</span>
          <h3 className="text-botanical-muted text-[10px] uppercase tracking-widest font-semibold leading-tight mb-1 w-full truncate text-2xl md:text-3xl">Avg Rating</h3>
          <p className="font-black text-botanical-text break-words leading-tight w-full text-base md:text-lg">{overview.averageRating}</p>
        </div>
      </div>

      {/* Program Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-botanical-surface p-5 rounded-xl border border-botanical-border shadow-sm">
          <h4 className="font-bold text-botanical-text flex items-center gap-2 mb-3 text-xl md:text-2xl">
            <span>⭐</span> Loyalty Program
          </h4>
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm">
              <span className="text-botanical-muted">Status</span>
              <span className={loyalty.isActive ? 'text-status-confirmed font-semibold' : 'text-status-cancelled'}>
                {loyalty.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm">
              <span className="text-botanical-muted">Members</span>
              <span className="text-botanical-text font-semibold">{loyalty.totalAccounts}</span>
            </div>
          </div>
        </div>

        <div className="bg-botanical-surface p-5 rounded-xl border border-botanical-border shadow-sm">
          <h4 className="font-bold text-botanical-text flex items-center gap-2 mb-3 text-xl md:text-2xl">
            <span>🔗</span> Referrals
          </h4>
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm">
              <span className="text-botanical-muted">Total</span>
              <span className="text-botanical-text font-semibold">{referrals.total}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm">
              <span className="text-botanical-muted">Completed</span>
              <span className="text-status-confirmed font-semibold">{referrals.completed}</span>
            </div>
          </div>
        </div>

        <div className="bg-botanical-surface p-5 rounded-xl border border-botanical-border shadow-sm">
          <h4 className="font-bold text-botanical-text flex items-center gap-2 mb-3 text-xl md:text-2xl">
            <span>📣</span> Campaigns
          </h4>
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm">
              <span className="text-botanical-muted">Sent</span>
              <span className="text-botanical-text font-semibold">{campaigns.totalSent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm">
        <h3 className="font-bold text-botanical-text flex items-center gap-2 mb-4 text-2xl md:text-3xl">
          <span>🏅</span> Top Clients (Last 90 Days)
        </h3>

        {!topClients || topClients.length === 0 ? (
          <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded text-base md:text-lg">
            No client data available yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-botanical-muted text-sm uppercase tracking-wider border-b border-botanical-border">
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
                      <p className="text-botanical-text font-medium truncate max-w-[200px] text-base md:text-lg">{c.name || 'Guest'}</p>
                      <p className="text-botanical-muted truncate text-base md:text-lg">{c.email}</p>
                    </td>
                    <td className="py-2 px-2 text-right text-status-info font-semibold">{c.visitCount}</td>
                    <td className="py-2 px-2 text-right text-status-confirmed font-semibold">${c.totalSpend.toFixed(0)}</td>
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

