'use client';
import { useEffect, useState } from 'react';

const STARS = [1, 2, 3, 4, 5];

function StarBar({ rating, count, total }: { rating: number; count: number; total: number }) {
 const pct = total > 0 ? Math.round((count / total) * 100) : 0;
 return (
 <div className="flex items-center gap-2 text-[13px]">
 <span className="w-4 text-crm-muted">{rating}</span>
 <span className="text-status-pending">★</span>
 <div className="flex-1 bg-crm-surface rounded-full h-2">
 <div className="bg-status-pending h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
 </div>
 <span className="w-8 text-crm-muted text-right">{count}</span>
 </div>
 );
}

export default function ReviewsClient({ shopId }: { shopId: string }) {
 const [reviews, setReviews] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState<number | null>(null);
 const [responding, setResponding] = useState<string | null>(null);
 const [responseText, setResponseText] = useState('');
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState('');

 useEffect(() => {
 fetch(`/api/shops/${shopId}/reviews`)
 .then(r => r.json())
 .then(d => setReviews(d.reviews || []))
 .finally(() => setLoading(false));
 }, [shopId]);

 const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
 const dist = STARS.map(s => ({ rating: s, count: reviews.filter(r => r.rating === s).length })).reverse();
 const filtered = filter ? reviews.filter(r => r.rating === filter) : reviews;

 const submitResponse = async (reviewId: string) => {
 setSaving(true);
 const res = await fetch(`/api/shops/${shopId}/reviews/${reviewId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ownerResponse: responseText }),
 });
 if (res.ok) {
 setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerResponse: responseText } : r));
 setMsg('Response saved!');
 setResponding(null);
 setResponseText('');
 }
 setSaving(false);
 setTimeout(() => setMsg(''), 3000);
 };

 const deleteResponse = async (reviewId: string) => {
 await fetch(`/api/shops/${shopId}/reviews/${reviewId}`, { method: 'DELETE' });
 setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerResponse: null } : r));
 };

 if (loading) return <div className="text-crm-muted animate-pulse py-8 text-center">Loading reviews…</div>;

 return (
 <div className="space-y-6">
 {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

 {/* ── Summary card ── */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center gap-2">
 <div className="text-6xl font-black text-crm-text">{avg.toFixed(1)}</div>
 <div className="flex gap-0.5 text-2xl">
 {STARS.map(s => <span key={s} className={s <= Math.round(avg) ? 'text-status-pending' : 'text-crm-muted'}>★</span>)}
 </div>
 <div className="text-crm-muted text-[13px]">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
 </div>
 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-2">
 {dist.map(d => <StarBar key={d.rating} rating={d.rating} count={d.count} total={reviews.length} />)}
 </div>
 </div>

 {/* ── Filter tabs ── */}
 <div className="flex gap-2 flex-wrap">
 <button onClick={() => setFilter(null)} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition ${!filter ? 'bg-crm-primary text-crm-text' : 'bg-crm-surface text-crm-muted hover:text-crm-text'} hover:opacity-90`}>All ({reviews.length})</button>
 {[5,4,3,2,1].map(s => {
 const cnt = reviews.filter(r => r.rating === s).length;
 return (
 <button key={s} onClick={() => setFilter(filter === s ? null : s)} className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition ${filter === s ? 'bg-crm-primary text-crm-text' : 'bg-crm-surface text-crm-muted hover:text-crm-text'} hover:opacity-90`}>
 {s}★ ({cnt})
 </button>
 );
 })}
 <div className="ml-auto flex items-center gap-2">
 {reviews.filter(r => !r.ownerResponse).length > 0 && (
 <span className="px-2 py-1 bg-status-pending/20 border border-status-pending/30 text-status-pending rounded text-[11px]">
 ⚠️ {reviews.filter(r => !r.ownerResponse).length} unanswered
 </span>
 )}
 </div>
 </div>

 {/* ── Review list ── */}
 <div className="space-y-4">
 {filtered.length === 0 && <p className="text-crm-muted text-center py-8 text-[13px]">No reviews yet.</p>}
 {filtered.map(r => (
 <div key={r.id} className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-5">
 {/* Header */}
 <div className="flex items-start justify-between mb-3">
 <div>
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-crm-primary/20 text-crm-accent flex items-center justify-center font-bold text-[13px] hover:opacity-90">
 {(r.user?.name || 'A')[0].toUpperCase()}
 </div>
 <div>
 <div className="text-crm-text font-semibold text-[13px]">{r.user?.name || 'Anonymous'}</div>
 <div className="text-crm-muted text-[11px]">{r.appointment?.service?.name} · {r.appointment?.staff?.name}</div>
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="flex gap-0.5 justify-end">
 {STARS.map(s => <span key={s} className={s <= r.rating ? 'text-status-pending' : 'text-crm-muted'}>★</span>)}
 </div>
 <div className="text-crm-muted text-[11px] mt-1">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
 </div>
 </div>

 {/* Comment */}
 {r.comment && <p className="text-crm-muted mb-3 italic text-[13px]">"{r.comment}"</p>}

 {/* Owner response */}
 {r.ownerResponse && responding !== r.id && (
 <div className="mt-3 pl-4 border-l-2 border-brand-indigo/40">
 <p className="text-crm-accent font-semibold mb-1 text-[13px]">Owner Response</p>
 <p className="text-crm-muted text-[13px]">{r.ownerResponse}</p>
 <div className="flex gap-2 mt-2">
 <button onClick={() => { setResponding(r.id); setResponseText(r.ownerResponse); }} className="text-[11px] text-crm-muted hover:text-crm-text transition">Edit</button>
 <button onClick={() => deleteResponse(r.id)} className="text-[11px] text-status-cancelled hover:text-status-cancelled transition">Delete</button>
 </div>
 </div>
 )}

 {/* Response form */}
 {responding === r.id ? (
 <div className="mt-3 space-y-2">
 <textarea
 value={responseText}
 onChange={e => setResponseText(e.target.value)}
 placeholder="Write your response…"
 rows={3}
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-[13px] text-crm-text placeholder-gray-500 focus:outline-none focus:border-brand-indigo resize-none"
 />
 <div className="flex gap-2">
 <button onClick={() => submitResponse(r.id)} disabled={saving || !responseText.trim()} className="px-4 py-2 bg-crm-primary text-crm-text rounded-lg text-[13px] font-semibold disabled:opacity-50 hover:opacity-90">
 {saving ? 'Saving…' : 'Post Response'}
 </button>
 <button onClick={() => { setResponding(null); setResponseText(''); }} className="px-4 py-2 bg-crm-surface text-crm-muted rounded-lg text-[13px]">Cancel</button>
 </div>
 </div>
 ) : !r.ownerResponse && (
 <button onClick={() => { setResponding(r.id); setResponseText(''); }} className="mt-2 text-[11px] text-crm-accent hover:underline transition">
 + Reply to this review
 </button>
 )}
 </div>
 ))}
 </div>
 </div>
 );
}

