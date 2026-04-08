'use client';

import { useState, useEffect, use } from 'react';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';

export default function ShopBillingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/billing`)
      .then(r => r.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch(e => setError(e.message || 'Failed to fetch billing data'))
      .finally(() => setLoading(false));
  }, [shopId]);

  return (
    <ShopAdminLayout
      shopName="Billing"
      shopSlug=""
      pageTitle="Billing & Usage"
      shopId={shopId}
      userRole="SHOP_ADMIN"
      activeTab="settings-billing"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <span>💳</span> Usage & Billing Report
          </h2>
          <p className="text-gray-400 text-sm">Review your current usage and estimated monthly billing tier.</p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center bg-slate-800/30 rounded-xl border border-white/5">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mb-4"></div>
            <p className="text-gray-400 text-sm">Loading usage metrics...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Appointments', val: data.metrics.appointmentCount },
                { label: 'Users', val: data.metrics.userCount },
                { label: 'Intake Forms', val: data.metrics.formSubmissionCount },
                { label: 'Images', val: data.metrics.portfolioImageCount + data.metrics.clientHistoryImageCount },
              ].map(m => (
                <div key={m.label} className="bg-slate-800/50 p-4 rounded-xl border border-white/10 text-center">
                  <p className="text-2xl font-bold text-white">{m.val}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-6 rounded-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                <div>
                  <p className="text-xs text-brand-gold uppercase font-bold tracking-widest mb-1">Current Tier</p>
                  <h3 className="text-3xl font-bold text-white">{data.analysis.pricingTierName}</h3>
                </div>
                <div className="md:text-right">
                  <p className="text-xs text-brand-gold uppercase font-bold tracking-widest mb-1">Estimated Monthly Fee</p>
                  <p className="text-4xl font-black text-white">${data.analysis.suggestedMonthlyFeeUSD}<span className="text-sm text-gray-400 font-medium">/mo</span></p>
                </div>
              </div>
              
              <div className="bg-black/20 p-4 rounded-lg mt-4 border border-white/5">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {data.analysis.strategyReasoning}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-gold/10 flex justify-between items-center text-xs">
                <span className="text-gray-400">Estimated Database Storage:</span>
                <span className="font-mono text-white bg-black/40 px-2 py-1 rounded">~{data.analysis.estimatedStorageMB} MB</span>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-white/10 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Usage Limits & Overage</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Your tier is automatically determined by your usage volume. 
                Storage over 500MB incurs a $1 fee per additional 100MB.
              </p>
              <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside ml-4">
                <li><strong className="text-white">Starter ($29/mo):</strong> Under 100 appointments, under 10 users.</li>
                <li><strong className="text-white">Growth ($79/mo):</strong> 100+ appointments or 10+ users.</li>
                <li><strong className="text-white">Enterprise Spa ($199/mo):</strong> 500+ appointments, 25+ users, or 100+ intake forms.</li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </ShopAdminLayout>
  );
}
