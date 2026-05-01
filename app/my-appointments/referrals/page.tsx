'use client';

import { useEffect, useState } from 'react';

interface ReferralData {
  referralCode: string;
  referrals: Array<{
    id: string;
    refereeName: string;
    shopName: string;
    status: string;
    rewardPoints: number;
    createdAt: string;
  }>;
  shops: Array<{ id: string; name: string }>;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: 'bg-status-info/20',   text: 'text-status-info',   label: 'Pending' },
  COMPLETED: { bg: 'bg-amber-900/40',  text: 'text-amber-300',  label: 'Completed' },
  REWARDED:  { bg: 'bg-status-confirmed/20',  text: 'text-status-confirmed',  label: 'Rewarded' },
};

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/my-appointments/referrals')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const getReferralLink = (shopName: string) => {
    if (!data?.referralCode) return '';
    const slug = shopName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/shops/${slug}?ref=${data.referralCode}`;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <p className="text-crm-muted animate-pulse text-[13px]">Loading referrals…</p>
      </div>
    );
  }

  return (
    <main className="pb-12">
      

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Referral Code Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-brand-gold/20 border border-brand-gold/30 rounded-xl p-6 sm:p-8">
          <div className="text-center">
            <p className="text-crm-muted mb-2 text-[13px]">Your Referral Code</p>
            <div className="text-4xl sm:text-5xl font-black text-crm-accent tracking-widest mb-4">
              {data?.referralCode || '—'}
            </div>
            <p className="text-crm-muted mb-6 text-[13px]">
              Share your code with friends. When they complete their first visit, you both earn bonus loyalty points!
            </p>
          </div>

          {/* Per-shop referral links */}
          {data?.shops && data.shops.length > 0 ? (
            <div className="space-y-3">
              <p className="text-crm-muted uppercase tracking-wider font-semibold text-[13px]">Shareable Links</p>
              {data.shops.map(shop => {
                const link = getReferralLink(shop.name);
                return (
                  <div key={shop.id} className="flex items-center gap-3 bg-crm-surface rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-crm-text truncate text-[13px]">{shop.name}</p>
                      <p className="text-crm-muted truncate text-[13px]">{link}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className="shrink-0 bg-crm-primary/20 text-crm-accent border border-brand-gold/30 px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-crm-primary/40 transition-all"
                    >
                      {copied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => data?.referralCode && handleCopy(data.referralCode)}
                className="bg-crm-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors"
              >
                {copied ? '✅ Copied Code!' : '📋 Copy Code'}
              </button>
              <p className="text-crm-muted mt-3 text-[13px]">Complete a visit to get shareable shop links</p>
            </div>
          )}
        </div>

        {/* Referral History */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-8 bg-purple-500 rounded-full" />
            <h2 className="font-bold text-crm-text text-xl font-bold">
              Referral History ({data?.referrals?.length || 0})
            </h2>
          </div>

          {!data?.referrals || data.referrals.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-crm-border rounded-xl">
              <p className="mb-3 text-[13px]">🔗</p>
              <p className="text-crm-muted text-[13px]">No referrals yet.</p>
              <p className="text-crm-muted mt-2 text-[13px]">Share your code to start earning rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.referrals.map(ref => {
                const style = STATUS_STYLES[ref.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={ref.id} className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-4 hover:border-crm-border transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-crm-text text-[13px]">{ref.refereeName}</p>
                        <p className="text-crm-muted text-[13px]">{ref.shopName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        {ref.status === 'REWARDED' && (
                          <p className="text-status-confirmed mt-1 text-[13px]">+{ref.rewardPoints} pts</p>
                        )}
                      </div>
                    </div>
                    <p className="text-crm-muted mt-2 text-[13px]">
                      {new Date(ref.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
