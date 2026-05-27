'use client';

import { useState, useEffect } from 'react';

interface ForecastInsight {
 productName: string;
 urgency: 'critical' | 'warning' | 'info';
 prediction: string;
 recommendation: string;
 estimatedDaysRemaining: number;
 icon: string;
}

const URGENCY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
 critical: {
 bg: 'bg-red-50',
 border: 'border-red-200',
 text: 'text-red-700',
 badge: 'bg-red-100 text-red-800',
 },
 warning: {
 bg: 'bg-amber-50',
 border: 'border-amber-200',
 text: 'text-amber-700',
 badge: 'bg-amber-100 text-amber-800',
 },
 info: {
 bg: 'bg-crm-primary/10',
 border: 'border-crm-primary/30',
 text: 'text-blue-700',
 badge: 'bg-blue-100 text-crm-primary',
 },
};

import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

export default function InventoryForecast({ shopId }: { shopId: string }) {
 const [insights, setInsights] = useState<ForecastInsight[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [generatedAt, setGeneratedAt] = useState<string | null>(null);

 const fetchForecast = async (force: boolean = false) => {
 setLoading(true);
 setError(null);
 try {
 const url = force 
 ? `/api/shops/${shopId}/products/forecast?force=true`
 : `/api/shops/${shopId}/products/forecast`;
 const res = await fetch(url);
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed to load forecast');
 setInsights(data.insights || []);
 setGeneratedAt(data.generatedAt || null);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { fetchForecast(); }, [shopId]);

 if (loading) {
 return (
 <PremiumGlassCard className="mb-6" accentColor="cyan-500">
 <div className="flex items-center gap-2 mb-4">
 <span className="text-base">🔮</span>
 <span className="font-bold text-crm-text text-[13px]">AI Inventory Forecast</span>
 <span className="ml-auto inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 </div>
 <div className="space-y-3">
 {[1, 2, 3].map(i => (
 <div key={i} className="rounded-lg border border-white/5 bg-black/20 p-4 animate-pulse">
 <div className="h-3 bg-white/10 rounded w-1/3 mb-2" />
 <div className="h-3 bg-white/10 rounded w-2/3 mb-1" />
 <div className="h-3 bg-white/10 rounded w-1/2" />
 </div>
 ))}
 </div>
 </PremiumGlassCard>
 );
 }

 if (error) {
 return (
 <PremiumGlassCard className="mb-6" accentColor="red-500">
 <div className="flex items-center gap-2 text-red-400 text-[13px]">
 <span>⚠️</span>
 <span className="font-bold">Forecast unavailable</span>
 <button
 onClick={() => fetchForecast(true)}
 className="ml-auto text-[11px] underline hover:no-underline font-bold uppercase tracking-wider"
 >
 Retry
 </button>
 </div>
 <p className="text-red-400/70 text-[11px] mt-2 font-medium">{error}</p>
 </PremiumGlassCard>
 );
 }

 if (insights.length === 0) {
 return null; // No insights = no card
 }

 return (
 <PremiumGlassCard className="mb-6 !p-5" accentColor="brand-gold">
 {/* Header */}
 <div className="flex items-center gap-2 mb-5">
 <span className="text-base">🔮</span>
 <span className="font-bold text-crm-text text-[14px]">AI Inventory Forecast</span>
 <span className="text-[9px] font-black uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/20 shadow-inner">
 Gemini
 </span>
 <div className="ml-auto flex items-center gap-2">
 {generatedAt && (
 <span className="text-crm-muted text-[10px] font-bold">
 {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 )}
 <button
 onClick={() => fetchForecast(true)}
 disabled={loading}
 className="text-crm-muted hover:text-crm-text transition-colors text-[14px] p-1.5 rounded-lg hover:bg-white/10"
 title="Refresh forecast"
 >
 🔄
 </button>
 </div>
 </div>

 {/* Insight Cards */}
 <div className="space-y-3">
 {insights.map((insight, i) => {
 const styles = URGENCY_STYLES[insight.urgency] || URGENCY_STYLES.info;
 // Apply glassmorphic transparency to the urgency styles
 const bgGlass = styles.bg.replace('bg-', 'bg-').replace('-50', '-500/10');
 const borderGlass = styles.border.replace('border-', 'border-').replace('-200', '-500/20');
 const textGlass = styles.text.replace('-700', '-400');
 const badgeGlass = styles.badge.replace('bg-', 'bg-').replace('-100', '-500/20').replace('text-', 'text-').replace('-800', '-400');

 return (
 <div
 key={i}
 className={`rounded-xl border p-4 ${bgGlass} ${borderGlass} transition-all shadow-inner`}
 >
 <div className="flex items-start gap-3">
 <span className="text-lg shrink-0 drop-shadow-md">{insight.icon || '📦'}</span>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <span className={`font-bold text-[14px] ${textGlass}`}>
 {insight.productName}
 </span>
 <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeGlass}`}>
 {insight.urgency}
 </span>
 {insight.estimatedDaysRemaining > 0 && insight.estimatedDaysRemaining < 999 && (
 <span className="text-[10px] text-white/50 font-mono ml-auto font-bold bg-black/20 px-1.5 py-0.5 rounded">
 ~{insight.estimatedDaysRemaining}d left
 </span>
 )}
 </div>
 <p className={`text-[12px] ${textGlass} leading-relaxed font-medium`}>
 {insight.prediction}
 </p>
 <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/5">
 💡 {insight.recommendation}
 </p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </PremiumGlassCard>
 );
}
