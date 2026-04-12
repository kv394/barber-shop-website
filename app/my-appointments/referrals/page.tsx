'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import MyAppointmentsNav from '@/components/MyAppointmentsNav';

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
  PENDING:   { bg: 'bg-blue-900/40',   text: 'text-blue-300',   label: 'Pending' },
  COMPLETED: { bg: 'bg-amber-900/40',  text: 'text-amber-300',  label: 'Completed' },
  REWARDED:  { bg: 'bg-green-900/40',  text: 'text-green-300',  label: 'Rewarded' },
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
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <p className="text-botanical-muted animate-pulse">Loading referrals…</p>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <header className="bg-botanical-surface backdrop-blur-md border-b border-botanical-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-botanical-text">Referrals</h1>
            <p className="text-xs text-botanical-muted">Invite friends and earn rewards</p>
          </div>
          <BackButton />
        </div>
        <MyAppointmentsNav />
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Referral Code Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-brand-gold/20 border border-brand-gold/30 rounded-xl p-6 sm:p-8">
          <div className="text-center">
            <p className="text-sm text-botanical-muted mb-2">Your Referral Code</p>
            <div className="text-4xl sm:text-5xl font-black text-botanical-accent tracking-widest mb-4">
              {data?.referralCode || '—'}
            </div>
            <p className="text-sm text-botanical-muted mb-6">
              Share your code with friends. When they complete their first visit, you both earn bonus loyalty points!
            </p>
          </div>

          {/* Per-shop referral links */}
          {data?.shops && data.shops.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-botanical-muted uppercase tracking-wider font-semibold">Shareable Links</p>
              {data.shops.map(shop => {
                const link = getReferralLink(shop.name);
                return (
                  <div key={shop.id} className="flex items-center gap-3 bg-botanical-surface rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-botanical-text truncate">{shop.name}</p>
                      <p className="text-xs text-botanical-muted truncate">{link}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className="shrink-0 bg-botanical-primary/20 text-botanical-accent border border-brand-gold/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-botanical-primary/40 transition-all"
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
                className="bg-botanical-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors"
              >
                {copied ? '✅ Copied Code!' : '📋 Copy Code'}
              </button>
              <p className="text-xs text-botanical-muted mt-3">Complete a visit to get shareable shop links</p>
            </div>
          )}
        </div>

        {/* Referral History */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-8 bg-purple-500 rounded-full" />
            <h2 className="text-lg font-bold text-botanical-text">
              Referral History ({data?.referrals?.length || 0})
            </h2>
          </div>

          {!data?.referrals || data.referrals.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-botanical-border rounded-xl">
              <p className="text-4xl mb-3">🔗</p>
              <p className="text-botanical-muted text-sm">No referrals yet.</p>
              <p className="text-botanical-muted text-xs mt-2">Share your code to start earning rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.referrals.map(ref => {
                const style = STATUS_STYLES[ref.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={ref.id} className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded-xl p-4 hover:border-botanical-border transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-botanical-text text-sm">{ref.refereeName}</p>
                        <p className="text-xs text-botanical-muted">{ref.shopName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        {ref.status === 'REWARDED' && (
                          <p className="text-xs text-green-400 mt-1">+{ref.rewardPoints} pts</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-botanical-muted mt-2">
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
