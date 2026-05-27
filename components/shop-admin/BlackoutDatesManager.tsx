'use client';
import { useEffect, useState } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumInput from '@/components/ui/PremiumInput';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const REASONS = ['Public Holiday','Shop Maintenance','Staff Training','Special Event','Personal','Other'];

export default function BlackoutDatesManager({ shopId }: { shopId: string }) {
 const [dates, setDates] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [newDate, setNewDate] = useState('');
 const [newReason, setNewReason] = useState('');
 const [adding, setAdding] = useState(false);
 const [msg, setMsg] = useState('');

 const load = () => fetch(`/api/shops/${shopId}/blackout-dates`).then(r => r.json())
 .then(d => setDates(d.dates || [])).finally(() => setLoading(false));

 useEffect(() => { load(); }, [shopId]);

 const addDate = async () => {
 if (!newDate) return;
 setAdding(true);
 await fetch(`/api/shops/${shopId}/blackout-dates`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ date: newDate, reason: newReason }),
 });
 setNewDate(''); setNewReason('');
 setMsg('Blackout date added!');
 await load();
 setAdding(false);
 setTimeout(() => setMsg(''), 3000);
 };

 const remove = async (id: string) => {
 await fetch(`/api/shops/${shopId}/blackout-dates?id=${id}`, { method: 'DELETE' });
 setDates(prev => prev.filter(d => d.id !== id));
 };

 const fmt = (d: string) => {
 const dt = new Date(d);
 return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
 };

 // Group upcoming vs past
 const today = new Date(); today.setHours(0,0,0,0);
 const upcoming = dates.filter(d => new Date(d.date) >= today);
 const past = dates.filter(d => new Date(d.date) < today);

 return (
 <PremiumGlassCard className="space-y-6" accentColor="crm-primary">
 <h3 className="font-bold text-crm-text text-xl flex items-center gap-3">🚫 Blackout Dates & Holidays</h3>
 <p className="text-crm-muted text-[13px]">Mark days when your shop is closed. Online booking will be disabled for these dates.</p>
 {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

 {/* Add form */}
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-shrink-0 w-full sm:w-auto">
 <PremiumInput
 label="Date *"
 type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
 min={new Date().toISOString().split('T')[0]}
 />
 </div>
 <div className="flex-1 w-full sm:w-auto space-y-1.5">
 <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Reason</label>
 <div className="relative">
 <select value={newReason} onChange={e => setNewReason(e.target.value)}
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary outline-none appearance-none">
 <option value="">Select reason (optional)</option>
 {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
 </select>
 </div>
 </div>
 <div className="flex-shrink-0 w-full sm:w-auto">
 <PremiumButton onClick={addDate} disabled={!newDate || adding} className="w-full sm:w-auto h-[48px] flex items-center justify-center">
 {adding ? 'Adding…' : '+ Add Date'}
 </PremiumButton>
 </div>
 </div>

 {loading && <div className="text-crm-muted animate-pulse text-[13px]">Loading…</div>}

 {/* Upcoming dates */}
 {upcoming.length > 0 && (
 <div className="mt-8">
 <p className="font-bold text-crm-text mb-4 text-lg">Upcoming ({upcoming.length})</p>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {upcoming.map(d => {
 const dt = new Date(d.date);
 const dayName = dt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
 return (
 <PremiumGlassCard key={d.id} className="!p-4" accentColor="crm-primary">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-status-cancelled/20 border border-status-cancelled/30 flex flex-col items-center justify-center shadow-inner">
 <span className="text-status-cancelled text-[12px] font-bold leading-none">{MONTHS[dt.getUTCMonth()]}</span>
 <span className="text-red-200 text-xl font-black leading-none mt-0.5">{dt.getUTCDate()}</span>
 </div>
 <div>
 <p className="font-bold text-crm-text text-[15px]">{fmt(d.date)}</p>
 <p className="text-crm-muted text-[13px]">{dayName}{d.reason ? ` · ${d.reason}` : ''}</p>
 </div>
 </div>
 <button onClick={() => remove(d.id)} className="text-crm-muted hover:text-status-cancelled text-2xl transition px-2 py-1 leading-none hover:bg-white/5 rounded-lg ml-2">×</button>
 </div>
 </PremiumGlassCard>
 );
 })}
 </div>
 </div>
 )}

 {upcoming.length === 0 && !loading && (
 <PremiumGlassCard className="text-center !mt-8">
 <p className="text-crm-muted italic py-2 text-[13px]">No upcoming blackout dates. Add holidays or closures above.</p>
 </PremiumGlassCard>
 )}

 {/* Past dates (collapsed) */}
 {past.length > 0 && (
 <details className="text-[13px] mt-8 bg-black/20 border border-white/5 rounded-xl p-4 cursor-pointer">
 <summary className="font-bold text-crm-muted hover:text-crm-text transition-colors">Past dates ({past.length})</summary>
 <div className="mt-4 space-y-2">
 {past.map(d => (
 <div key={d.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-crm-muted text-[12px]">
 <span>{fmt(d.date)}{d.reason ? ` — ${d.reason}` : ''}</span>
 <button onClick={() => remove(d.id)} className="hover:text-status-cancelled ml-4 text-base transition px-2 py-1 leading-none hover:bg-white/5 rounded-lg">×</button>
 </div>
 ))}
 </div>
 </details>
 )}
 </PremiumGlassCard>
 );
}

