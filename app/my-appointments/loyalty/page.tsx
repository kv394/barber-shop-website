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
        <p className="text-botanical-muted animate-pulse">Loading loyalty…</p>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <header className="bg-botanical-surface backdrop-blur-md border-b border-botanical-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-botanical-text">My Loyalty</h1>
          <p className="text-xs text-botanical-muted">Track your points and rewards</p>
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
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-botanical-muted text-sm">No loyalty accounts yet.</p>
            <p className="text-botanical-muted text-xs mt-2">Complete a visit at any participating shop to get started!</p>
          </div>
        ) : (
          accounts.map((acct, i) => (
            <div key={i} className="bg-botanical-surface border border-botanical-border rounded-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-brand-gold/10 to-purple-600/10 border-b border-botanical-border">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-botanical-text">{acct.shopName}</h2>
                    <span className="text-xs bg-botanical-primary/20 text-botanical-accent px-2 py-0.5 rounded-full font-semibold">{acct.currentTier}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-botanical-accent">{acct.pointsBalance}</p>
                    <p className="text-xs text-botanical-muted">points available</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 text-xs text-botanical-muted">
                  <span>Earned: <span className="text-green-400 font-semibold">{acct.totalEarned}</span></span>
                  <span>Redeemed: <span className="text-amber-400 font-semibold">{acct.totalRedeemed}</span></span>
                </div>
              </div>
              {acct.transactions.length > 0 && (
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                  <h3 className="text-xs text-botanical-muted uppercase tracking-wider mb-2">Recent Activity</h3>
                  {acct.transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b border-botanical-border last:border-0">
                      <div>
                        <span className="text-sm text-botanical-muted">{tx.description || tx.type}</span>
                        <span className="text-xs text-gray-600 ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-sm font-semibold ${tx.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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

