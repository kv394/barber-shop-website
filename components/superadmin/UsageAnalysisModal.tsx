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
    fetch(`/api/superadmin/shops/${shopId}/usage`)
      .then(r => r.json())
      .then(res => {
        if (res.error) throw new Error(res.error);
        setData(res);
      })
      .catch(e => setError(e.message || 'Failed to fetch usage data'))
      .finally(() => setLoading(false));
  }, [shopId]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl border border-slate-700 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-brand-gold mb-2 flex items-center gap-2">
          <span>🧠</span> AI Usage & Cost Analysis
        </h2>
        <p className="text-gray-400 text-sm mb-6">Analyzing resource consumption for <strong>{shopName}</strong></p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mb-4"></div>
            <p className="text-gray-400 animate-pulse text-sm">Gemini AI is analyzing metrics and calculating SaaS costs...</p>
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
                <div key={m.label} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 text-center">
                  <p className="text-xl font-bold text-white">{m.val}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-5 rounded-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-brand-gold uppercase font-bold tracking-widest mb-1">Recommended Tier</p>
                  <h3 className="text-2xl font-bold text-white">{data.analysis.pricingTierName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-gold uppercase font-bold tracking-widest mb-1">Suggested Fee</p>
                  <p className="text-3xl font-black text-white">${data.analysis.suggestedMonthlyFeeUSD}<span className="text-sm text-gray-400 font-medium">/mo</span></p>
                </div>
              </div>
              
              <div className="bg-black/20 p-4 rounded-lg mt-4 border border-white/5">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {data.analysis.strategyReasoning}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-brand-gold/10 flex justify-between items-center text-xs">
                <span className="text-gray-400">Estimated Database Storage:</span>
                <span className="font-mono text-white bg-black/40 px-2 py-1 rounded">~{data.analysis.estimatedStorageMB} MB</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
