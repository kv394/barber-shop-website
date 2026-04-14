'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import MyAppointmentsNav from '@/components/MyAppointmentsNav';

interface LoyaltyData {
  shopName: string;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  currentTier: string;
  transactions: Array<{
    id: string;
    points: number;
    type: string;
    description: string | null;
    createdAt: string;
  }>;
}

export default function LoyaltyPage() {
  const [accounts, setAccounts] = useState<LoyaltyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/my-appointments/loyalty')
      .then(r => r.ok ? r.json() : [])
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <p className="text-botanical-muted animate-pulse text-base md:text-lg">Loading loyalty…</p>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <header className="bg-botanical-surface backdrop-blur-md border-b border-botanical-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="font-bold text-botanical-text text-4xl md:text-5xl lg:text-6xl">My Loyalty</h1>
          <p className="text-botanical-muted text-base md:text-lg">Track your points and rewards</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-2 flex gap-4 overflow-x-auto scrollbar-none">
          <Link href="/my-appointments" className="text-sm text-botanical-muted hover:text-botanical-text px-1 pb-1 whitespace-nowrap transition-colors">📅 Appointments</Link>
          <Link href="/my-appointments/profile" className="text-sm text-botanical-muted hover:text-botanical-text px-1 pb-1 whitespace-nowrap transition-colors">👤 Profile</Link>
          <Link href="/my-appointments/loyalty" className="text-sm text-botanical-accent border-b-2 border-brand-gold px-1 pb-1 font-semibold whitespace-nowrap">⭐ Loyalty</Link>
          <Link href="/my-appointments/notifications" className="text-sm text-botanical-muted hover:text-botanical-text px-1 pb-1 whitespace-nowrap transition-colors">🔔 Notifications</Link>
          <Link href="/my-appointments/referrals" className="text-sm text-botanical-muted hover:text-botanical-text px-1 pb-1 whitespace-nowrap transition-colors">🔗 Referrals</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {accounts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-botanical-border rounded-xl">
            <p className="mb-3 text-base md:text-lg">⭐</p>
            <p className="text-botanical-muted text-base md:text-lg">No loyalty accounts yet.</p>
            <p className="text-botanical-muted mt-2 text-base md:text-lg">Complete a visit at any participating shop to get started!</p>
          </div>
        ) : (
          accounts.map((acct, i) => (
            <div key={i} className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-brand-gold/10 to-purple-600/10 border-b border-botanical-border">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
                  <div>
                    <h2 className="font-bold text-botanical-text text-3xl md:text-4xl">{acct.shopName}</h2>
                    <span className="text-xs bg-botanical-primary/20 text-botanical-accent px-2 py-0.5 rounded-full font-semibold hover:opacity-90">{acct.currentTier}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-botanical-accent text-base md:text-lg">{acct.pointsBalance}</p>
                    <p className="text-botanical-muted text-base md:text-lg">points available</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 text-xs text-botanical-muted">
                  <span>Earned: <span className="text-status-confirmed font-semibold">{acct.totalEarned}</span></span>
                  <span>Redeemed: <span className="text-status-pending font-semibold">{acct.totalRedeemed}</span></span>
                </div>
              </div>
              {acct.transactions.length > 0 && (
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                  <h3 className="text-botanical-muted uppercase tracking-wider mb-2 text-2xl md:text-3xl">Recent Activity</h3>
                  {acct.transactions.map(tx => (
                    <div key={tx.id} className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center py-2 border-b border-botanical-border last:border-0">
                      <div>
                        <span className="text-sm text-botanical-muted">{tx.description || tx.type}</span>
                        <span className="text-xs text-botanical-muted ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-sm font-semibold ${tx.points >= 0 ? 'text-status-confirmed' : 'text-status-cancelled'}`}>
                        {tx.points >= 0 ? '+' : ''}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

