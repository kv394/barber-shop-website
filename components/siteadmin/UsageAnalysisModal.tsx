'use client';

import { useState, useEffect } from 'react';

interface UsageAnalysisModalProps {
  shopId: string;
  shopName: string;
  onClose: () => void;
}

export default function UsageAnalysisModal({ shopId, shopName, onClose }: UsageAnalysisModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/siteadmin/shops/${shopId}/usage`)
      .then(r => r.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch(e => setError(e.message || 'Failed to fetch usage data'))
      .finally(() => setLoading(false));
  }, [shopId]);

  return (
    <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-crm-surface rounded-xl p-6 w-full max-w-2xl border border-crm-border shadow-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-crm-muted hover:text-crm-text bg-crm-surface rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <h2 className="font-bold text-crm-accent mb-2 flex items-center gap-2 text-3xl md:text-4xl">
          <span>📊</span> Usage & Cost Analysis
        </h2>
        <p className="text-crm-muted mb-6 text-base md:text-lg">Analyzing resource consumption for <strong>{shopName}</strong></p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mb-4"></div>
            <p className="text-crm-muted animate-pulse text-base md:text-lg">Aggregating metrics and calculating SaaS costs...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-status-cancelled/20 border border-status-cancelled/30 rounded-lg text-status-cancelled text-sm">
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
                <div key={m.label} className="bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm text-center">
                  <p className="font-bold text-crm-text text-base md:text-lg">{m.val}</p>
                  <p className="text-crm-muted uppercase tracking-wider text-base md:text-lg">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-5 rounded-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-crm-accent uppercase font-bold tracking-widest mb-1 text-base md:text-lg">Recommended Tier</p>
                  <h3 className="font-bold text-crm-text text-2xl md:text-3xl">{data.analysis.pricingTierName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-crm-accent uppercase font-bold tracking-widest mb-1 text-base md:text-lg">Suggested Fee</p>
                  <p className="font-black text-crm-text text-base md:text-lg">${data.analysis.suggestedMonthlyFeeUSD}<span className="text-sm text-crm-muted font-medium">/mo</span></p>
                </div>
              </div>
              
              <div className="bg-crm-surface p-4 rounded-lg mt-4 border border-crm-border shadow-sm">
                <p className="text-crm-muted leading-relaxed text-base md:text-lg">
                  {data.analysis.strategyReasoning}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-brand-gold/10 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center text-xs">
                <span className="text-crm-muted">Estimated Database Storage:</span>
                <span className="font-mono text-crm-text bg-crm-surface px-2 py-1 rounded">~{data.analysis.estimatedStorageMB} MB</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
