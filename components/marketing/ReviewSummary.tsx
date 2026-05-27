'use client';

import { useState, useEffect } from 'react';

interface ReviewSummaryData {
 bullets: string[];
 sentiment: 'positive' | 'mixed' | 'negative';
 topStrengths: string[];
 topImprovements: string[];
 avgRating: number;
 reviewCount: number;
 message?: string;
}

const SENTIMENT_CONFIG = {
 positive: { emoji: '😊', label: 'Positive', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
 mixed: { emoji: '😐', label: 'Mixed', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
 negative: { emoji: '😟', label: 'Needs Work', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
};

export default function ReviewSummary({ shopId }: { shopId: string }) {
 const [data, setData] = useState<ReviewSummaryData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const fetchSummary = async () => {
 setLoading(true);
 setError(null);
 try {
 const res = await fetch(`/api/shops/${shopId}/reviews/summary`);
 const json = await res.json();
 if (!res.ok) throw new Error(json.error || 'Failed to load summary');
 setData(json);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { fetchSummary(); }, [shopId]);

 if (loading) {
 return (
 <div className="mb-6 p-5 rounded-xl border border-crm-border bg-crm-surface animate-pulse">
 <div className="flex items-center gap-2 mb-3">
 <div className="h-4 bg-crm-border rounded w-40" />
 <div className="h-4 bg-crm-border rounded w-16 ml-auto" />
 </div>
 <div className="space-y-2">
 <div className="h-3 bg-crm-border rounded w-3/4" />
 <div className="h-3 bg-crm-border rounded w-2/3" />
 <div className="h-3 bg-crm-border rounded w-1/2" />
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex items-center gap-2 text-[13px] text-red-700">
 <span>⚠️</span>
 <span>Review summary unavailable</span>
 <button onClick={fetchSummary} className="ml-auto text-[11px] underline hover:no-underline">Retry</button>
 </div>
 );
 }

 if (!data || data.bullets.length === 0) return null;

 const config = SENTIMENT_CONFIG[data.sentiment] || SENTIMENT_CONFIG.mixed;

 return (
 <div className={`mb-6 p-5 rounded-xl border ${config.border} ${config.bg}`}>
 {/* Header */}
 <div className="flex items-center gap-2 mb-3 flex-wrap">
 <span className="text-base">{config.emoji}</span>
 <span className={`font-bold text-[14px] ${config.text}`}>AI Review Summary</span>
 <span className="text-[10px] font-normal text-crm-muted bg-white/60 px-2 py-0.5 rounded-full border border-crm-border/50">
 Gemini
 </span>
 <div className="ml-auto flex items-center gap-3">
 <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
 {config.label}
 </span>
 <span className="text-[12px] text-crm-muted font-mono">
 {data.avgRating}★ ({data.reviewCount} reviews)
 </span>
 <button
 onClick={fetchSummary}
 className="text-crm-muted hover:text-crm-text transition-colors text-[12px] p-1"
 title="Refresh summary"
 >
 🔄
 </button>
 </div>
 </div>

 {/* Bullet Points */}
 <ul className="space-y-1.5 mb-3">
 {data.bullets.map((bullet, i) => (
 <li key={i} className={`text-[13px] ${config.text} flex items-start gap-2`}>
 <span className="mt-0.5 shrink-0">•</span>
 <span>{bullet}</span>
 </li>
 ))}
 </ul>

 {/* Strengths & Improvements */}
 <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/30">
 {data.topStrengths.map((s, i) => (
 <span key={`s-${i}`} className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
 💪 {s}
 </span>
 ))}
 {data.topImprovements.map((s, i) => (
 <span key={`i-${i}`} className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
 📋 {s}
 </span>
 ))}
 </div>
 </div>
 );
}
