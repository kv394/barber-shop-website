'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading referrals…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-black/40 backdrop-blur-md border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Referrals</h1>
          <p className="text-xs text-gray-500">Invite friends and earn rewards</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-2 flex gap-4 overflow-x-auto scrollbar-none">
          <Link href="/my-appointments" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">📅 Appointments</Link>
          <Link href="/my-appointments/profile" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">👤 Profile</Link>
          <Link href="/my-appointments/loyalty" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">⭐ Loyalty</Link>
          <Link href="/my-appointments/notifications" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">🔔 Notifications</Link>
          <Link href="/my-appointments/referrals" className="text-sm text-brand-gold border-b-2 border-brand-gold px-1 pb-1 font-semibold whitespace-nowrap">🔗 Referrals</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Referral Code Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-brand-gold/20 border border-brand-gold/30 rounded-xl p-6 sm:p-8">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
            <div className="text-4xl sm:text-5xl font-black text-brand-gold tracking-widest mb-4">
              {data?.referralCode || '—'}
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Share your code with friends. When they complete their first visit, you both earn bonus loyalty points!
            </p>
          </div>

          {/* Per-shop referral links */}
          {data?.shops && data.shops.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Shareable Links</p>
              {data.shops.map(shop => {
                const link = getReferralLink(shop.name);
                return (
                  <div key={shop.id} className="flex items-center gap-3 bg-black/30 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{shop.name}</p>
                      <p className="text-xs text-gray-500 truncate">{link}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className="shrink-0 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-gold/40 transition-all"
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
                className="bg-brand-gold text-brand-dark font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors"
              >
                {copied ? '✅ Copied Code!' : '📋 Copy Code'}
              </button>
              <p className="text-xs text-gray-500 mt-3">Complete a visit to get shareable shop links</p>
            </div>
          )}
        </div>

        {/* Referral History */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-8 bg-purple-500 rounded-full" />
            <h2 className="text-lg font-bold text-white">
              Referral History ({data?.referrals?.length || 0})
            </h2>
          </div>

          {!data?.referrals || data.referrals.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <p className="text-4xl mb-3">🔗</p>
              <p className="text-gray-400 text-sm">No referrals yet.</p>
              <p className="text-gray-500 text-xs mt-2">Share your code to start earning rewards!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.referrals.map(ref => {
                const style = STATUS_STYLES[ref.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={ref.id} className="bg-slate-800/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{ref.refereeName}</p>
                        <p className="text-xs text-gray-500">{ref.shopName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        {ref.status === 'REWARDED' && (
                          <p className="text-xs text-green-400 mt-1">+{ref.rewardPoints} pts</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
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

