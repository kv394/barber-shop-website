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

  if (loading) return <p className="text-crm-muted text-center py-12 text-[13px]">Loading referrals...</p>;
  if (!data) return <p className="text-status-cancelled text-center py-12 text-[13px]">Failed to load referral data.</p>;

  const { referrals, stats } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REWARDED': return 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30';
      case 'COMPLETED': return 'bg-status-info/20 text-status-info border-status-info/30';
      default: return 'bg-amber-900/50 text-amber-300 border-status-pending/30';
    }
  };

  return (
    <div className="space-y-8">
      {stats && (
        <div className="bg-crm-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-crm-border shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
          <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-info/80"></div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
              <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">Total Referrals</h3>
              <span className="text-status-info text-[13px]">👥</span>
            </div>
            <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{stats.total}</p>
          </div>
          <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-confirmed/80"></div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
              <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">Completed</h3>
              <span className="text-status-confirmed text-[13px]">✅</span>
            </div>
            <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{stats.completed}</p>
          </div>
          <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-crm-surface transition-all duration-300 min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-pending/80"></div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
              <h3 className="text-crm-muted uppercase tracking-widest font-semibold truncate text-[11px]">Pending</h3>
              <span className="text-status-pending text-[13px]">⏳</span>
            </div>
            <p className="font-black text-crm-text break-words leading-tight text-xl font-bold">{stats.pending}</p>
          </div>
        </div>
      )}

      <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm">
        <h3 className="font-bold text-crm-text flex items-center gap-2 mb-4 text-lg font-bold">
          <span>🔗</span> How Referrals Work
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm text-center">
            <div className="text-2xl mb-2">📤</div>
            <p className="font-semibold text-crm-text mb-1 text-[13px]">Client Shares Code</p>
            <p className="text-crm-muted text-[13px]">Each client gets a unique referral code to share with friends.</p>
          </div>
          <div className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm text-center">
            <div className="text-2xl mb-2">👤</div>
            <p className="font-semibold text-crm-text mb-1 text-[13px]">New Client Signs Up</p>
            <p className="text-crm-muted text-[13px]">The new client enters the referral code when booking.</p>
          </div>
          <div className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm text-center">
            <div className="text-2xl mb-2">🎁</div>
            <p className="font-semibold text-crm-text mb-1 text-[13px]">Both Get Rewarded</p>
            <p className="text-crm-muted text-[13px]">After first visit, both earn bonus loyalty points.</p>
          </div>
        </div>
      </div>

      <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm">
        <h3 className="font-bold text-crm-text flex items-center gap-2 mb-4 text-lg font-bold">
          <span>📋</span> Referral History
        </h3>

        {!referrals || referrals.length === 0 ? (
          <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-[13px]">
            No referrals yet. Clients will see their unique referral code on the booking page.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="flex items-center gap-3 bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-crm-text text-[13px]">
                    <span className="font-semibold text-crm-accent">{ref.referrer?.name || 'Unknown'}</span>
                    <span className="text-crm-muted mx-2">→</span>
                    <span className="font-semibold">{ref.referee?.name || 'New Client'}</span>
                  </p>
                  <p className="text-crm-muted text-[13px]">
                    {new Date(ref.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[13px] font-bold border ${getStatusColor(ref.status)}`}>
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
