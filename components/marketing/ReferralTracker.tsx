'use client';

import { useState, useEffect } from 'react';

export default function ReferralTracker({ shopId }: { shopId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${shopId}/referrals`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) return <p className="text-botanical-muted text-center py-12">Loading referrals...</p>;
  if (!data) return <p className="text-red-400 text-center py-12">Failed to load referral data.</p>;

  const { referrals, stats } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REWARDED': return 'bg-green-900/50 text-green-300 border-green-500/30';
      case 'COMPLETED': return 'bg-blue-900/50 text-blue-300 border-blue-500/30';
      default: return 'bg-amber-900/50 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {stats && (
        <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-botanical-border flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
          <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80"></div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Total Referrals</h3>
              <span className="text-blue-500 text-sm">👥</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{stats.total}</p>
          </div>
          <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80"></div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Completed</h3>
              <span className="text-green-500 text-sm">✅</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{stats.completed}</p>
          </div>
          <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/80"></div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-botanical-muted text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Pending</h3>
              <span className="text-amber-500 text-sm">⏳</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">{stats.pending}</p>
          </div>
        </div>
      )}

      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border">
        <h3 className="text-lg font-bold text-botanical-text flex items-center gap-2 mb-4">
          <span>🔗</span> How Referrals Work
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-botanical-surface p-4 rounded-lg border border-botanical-border text-center">
            <div className="text-2xl mb-2">📤</div>
            <p className="text-sm font-semibold text-botanical-text mb-1">Client Shares Code</p>
            <p className="text-xs text-botanical-muted">Each client gets a unique referral code to share with friends.</p>
          </div>
          <div className="bg-botanical-surface p-4 rounded-lg border border-botanical-border text-center">
            <div className="text-2xl mb-2">👤</div>
            <p className="text-sm font-semibold text-botanical-text mb-1">New Client Signs Up</p>
            <p className="text-xs text-botanical-muted">The new client enters the referral code when booking.</p>
          </div>
          <div className="bg-botanical-surface p-4 rounded-lg border border-botanical-border text-center">
            <div className="text-2xl mb-2">🎁</div>
            <p className="text-sm font-semibold text-botanical-text mb-1">Both Get Rewarded</p>
            <p className="text-xs text-botanical-muted">After first visit, both earn bonus loyalty points.</p>
          </div>
        </div>
      </div>

      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border">
        <h3 className="text-lg font-bold text-botanical-text flex items-center gap-2 mb-4">
          <span>📋</span> Referral History
        </h3>

        {!referrals || referrals.length === 0 ? (
          <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded">
            No referrals yet. Clients will see their unique referral code on the booking page.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="flex items-center gap-3 bg-botanical-surface p-3 rounded-lg border border-botanical-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-botanical-text">
                    <span className="font-semibold text-botanical-accent">{ref.referrer?.name || 'Unknown'}</span>
                    <span className="text-botanical-muted mx-2">→</span>
                    <span className="font-semibold">{ref.referee?.name || 'New Client'}</span>
                  </p>
                  <p className="text-[10px] text-botanical-muted">
                    {new Date(ref.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(ref.status)}`}>
                  {ref.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
