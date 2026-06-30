'use client';;
import Image from 'next/image';

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
 <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Escape' || e.key === 'Enter') && onClose()}>
 <div className="bg-crm-surface rounded-xl p-6 w-full max-w-2xl border border-crm-border shadow-2xl relative" onClick={e => e.stopPropagation()}>
 <button
 onClick={onClose}
 className="absolute top-3 right-4 text-crm-primary bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]"
 >
 ✕
 </button>

 <h2 className="font-bold text-crm-primary mb-2 flex items-center gap-2 text-xl"> <span>📊</span> Usage & Cost Analysis
 </h2>
 <p className="text-crm-muted mb-6 text-[13px]">Analyzing resource consumption for <strong>{shopName}</strong></p>

 {loading ? (
 <div className="py-12 flex flex-col items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-indigo mb-4"></div>
 <p className="text-crm-muted animate-pulse text-[13px]">Aggregating metrics and calculating SaaS costs...</p>
 </div>
 ) : error ? (
 <div className="p-4 bg-status-cancelled/20 border border-status-cancelled/30 rounded-lg text-status-cancelled text-[13px]">
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
 { label: 'AI Tokens', val: data.metrics.aiTokenCount || 0 },
 ].map(m => (
 <div key={m.label} className="bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm text-center">
 <p className="font-bold text-crm-text text-[13px]">{m.val}</p>
 <p className="text-crm-muted uppercase tracking-wider text-[13px]">{m.label}</p>
 </div>
 ))}
 </div>

 <div className="bg-gradient-to-br from-brand-indigo/10 to-amber-900/10 border border-brand-indigo/20 p-5 rounded-xl">
 <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
 <div>
 <p className="text-crm-accent uppercase font-bold tracking-widest mb-1 text-[13px]">Recommended Tier</p>
 <h3 className="font-bold text-crm-text text-lg font-bold">{data.analysis.pricingTierName}</h3>
 </div>
 <div className="text-right">
 <p className="text-crm-accent uppercase font-bold tracking-widest mb-1 text-[13px]">Suggested Fee</p>
 <p className="font-black text-crm-text text-[13px]">${data.analysis.suggestedMonthlyFeeUSD}<span className="text-[13px] text-crm-muted font-medium">/mo</span></p>
 </div>
 </div>
 
 <div className="bg-crm-surface p-4 rounded-lg mt-4 border border-crm-border shadow-sm">
 <p className="text-crm-muted leading-relaxed text-[13px]">
 {data.analysis.strategyReasoning}
 </p>
 </div>

 <div className="mt-4 pt-4 border-t border-brand-indigo/10 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center text-[11px]">
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
