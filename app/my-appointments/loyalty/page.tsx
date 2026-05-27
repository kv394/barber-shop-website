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
        <p className="text-crm-muted animate-pulse text-[13px]">Loading loyalty…</p>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {accounts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-crm-border rounded-xl">
            <p className="mb-3 text-[13px]">⭐</p>
            <p className="text-crm-muted text-[13px]">No loyalty accounts yet.</p>
            <p className="text-crm-muted mt-2 text-[13px]">Complete a visit at any participating shop to get started!</p>
          </div>
        ) : (
          accounts.map((acct, i) => (
            <div key={i} className="bg-crm-surface border border-crm-border shadow-sm rounded-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-brand-gold/10 to-purple-600/10 border-b border-crm-border">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
                  <div>
                    <h2 className="font-bold text-crm-text text-xl">{acct.shopName}</h2>
                    <span className="text-[11px] bg-crm-primary/20 text-crm-accent px-2 py-0.5 rounded-full font-semibold hover:opacity-90">{acct.currentTier}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-crm-accent text-[13px]">{acct.pointsBalance}</p>
                    <p className="text-crm-muted text-[13px]">points available</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 text-[11px] text-crm-muted">
                  <span>Earned: <span className="text-status-confirmed font-semibold">{acct.totalEarned}</span></span>
                  <span>Redeemed: <span className="text-status-pending font-semibold">{acct.totalRedeemed}</span></span>
                </div>
              </div>
              {acct.transactions.length > 0 && (
                <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                  <h3 className="text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Recent Activity</h3>
                  {acct.transactions.map(tx => (
                    <div key={tx.id} className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center py-2 border-b border-crm-border last:border-0">
                      <div>
                        <span className="text-[13px] text-crm-muted">{tx.description || tx.type}</span>
                        <span className="text-[11px] text-crm-muted ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[13px] font-semibold ${tx.points >= 0 ? 'text-status-confirmed' : 'text-status-cancelled'}`}>
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

