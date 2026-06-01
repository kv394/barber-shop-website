'use client';

import SaaSTierManager from './SaaSTierManager';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumBadge from '@/components/ui/PremiumBadge';

const MOCK_SUBSCRIPTIONS = [
  { id: 'sub_123', shopName: 'Main St Barbers', tier: 'Pro', amount: 49.00, status: 'active', date: '2026-06-01' },
  { id: 'sub_124', shopName: 'Downtown Cuts', tier: 'Starter', amount: 29.00, status: 'active', date: '2026-05-28' },
  { id: 'sub_125', shopName: 'Fade Masters', tier: 'Elite', amount: 99.00, status: 'past_due', date: '2026-05-25' },
  { id: 'sub_126', shopName: 'Classic Grooming', tier: 'Pro', amount: 49.00, status: 'active', date: '2026-05-20' },
  { id: 'sub_127', shopName: 'The Razor Edge', tier: 'Starter', amount: 29.00, status: 'canceled', date: '2026-05-15' },
];

export default function SiteAdminTiersPage() {
  return (
    <div className="space-y-12">
      <div>
        <SaaSTierManager />
      </div>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-crm-text">Recent Subscriptions</h2>
          <p className="text-[13px] text-crm-muted mt-1">Monitor recent platform payments and subscription statuses.</p>
        </div>

        <PremiumGlassCard accentColor="cyan-500" className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-crm-bg/50 border-b border-white/20">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-crm-muted">Shop</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-crm-muted">Tier</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-crm-muted">Amount</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-crm-muted">Date</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-crm-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-white/5">
                {MOCK_SUBSCRIPTIONS.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-crm-text">{sub.shopName}</div>
                      <div className="text-[11px] text-crm-muted font-mono mt-0.5">{sub.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[13px] text-crm-text">{sub.tier}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-crm-text">
                      ${sub.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-crm-muted">
                      {new Date(sub.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <PremiumBadge
                        variant={
                          sub.status === 'active' ? 'success' : 
                          sub.status === 'past_due' ? 'warning' : 'error'
                        }
                      >
                        {sub.status.replace('_', ' ').toUpperCase()}
                      </PremiumBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumGlassCard>
      </div>
    </div>
  );
}
