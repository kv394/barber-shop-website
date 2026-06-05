'use client';;
import Image from 'next/image';
import { useEffect, useState } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS: Record<string, string> = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };
const TIMES = Array.from({ length: 27 }, (_, i) => {
 const h = Math.floor((i * 30 + 8 * 60) / 60);
 const m = (i * 30 + 8 * 60) % 60;
 return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}).filter(t => t <= '22:00');

type DayHours = { open: string; close: string } | null;
type WeekHours = Record<typeof DAYS[number], DayHours>;

const DEFAULT: WeekHours = {
 monday: { open: '09:00', close: '18:00' }, tuesday: { open: '09:00', close: '18:00' },
 wednesday: { open: '09:00', close: '18:00' }, thursday: { open: '09:00', close: '18:00' },
 friday: { open: '09:00', close: '18:00' }, saturday: { open: '09:00', close: '15:00' }, sunday: null,
};

export default function BusinessHoursEditor({ shopId }: { shopId: string }) {
 const [hours, setHours] = useState<WeekHours>(DEFAULT);
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState('');
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch(`/api/shops/${shopId}/business-hours`).then(r => r.json()).then(d => { setHours(d); setLoading(false); });
 }, [shopId]);

 const toggle = (day: typeof DAYS[number]) =>
 setHours(h => ({ ...h, [day]: h[day] ? null : { open: '09:00', close: '18:00' } }));

 const setField = (day: typeof DAYS[number], field: 'open' | 'close', val: string) =>
 setHours(h => ({ ...h, [day]: { ...(h[day] || { open:'09:00', close:'18:00' }), [field]: val } }));

 const save = async () => {
 setSaving(true);
 await fetch(`/api/shops/${shopId}/business-hours`, {
 method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hours),
 });
 setMsg('Business hours saved!');
 setSaving(false);
 setTimeout(() => setMsg(''), 3000);
 };

 if (loading) return <div className="animate-pulse text-crm-muted py-4">Loading hours…</div>;

 return (
 <PremiumGlassCard className="relative z-10" accentColor="crm-primary">
 <h3 className="font-bold text-crm-text mb-1 text-xl flex items-center gap-2">🕐 Business Hours</h3>
 <p className="text-crm-muted mb-5 text-[13px]">Set your shop's open and close times per day. Toggle a day off to mark it as closed.</p>
 {msg && <div className="mb-4 p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}
 <div className="space-y-3">
 {DAYS.map(day => {
 const open = !!hours[day];
 const dh = hours[day];
 return (
 <div key={day} className={`flex items-center gap-3 p-3 rounded-lg transition border border-white/5 ${open ? 'bg-white/5' : 'bg-black/20 opacity-60'}`}>
 <button 
 type="button" 
 onClick={() => toggle(day)} 
 className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${open ? 'bg-crm-primary' : 'bg-crm-border'} hover:opacity-90 text-white cursor-pointer`}
 >
 <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-crm-surface rounded-full shadow transition-transform pointer-events-none ${open ? 'translate-x-5' : 'translate-x-0'}`} />
 </button>
 <span className="w-10 text-[13px] font-semibold text-crm-text cursor-pointer select-none uppercase tracking-wider" onClick={() => toggle(day)}>{DAY_LABELS[day]}</span>
 {open && dh ? (
 <>
 <select value={dh.open} onChange={e => setField(day, 'open', e.target.value)}
 className="bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded text-crm-text text-[13px] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-crm-primary outline-none">
 {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 <span className="text-crm-muted text-[13px]">to</span>
 <select value={dh.close} onChange={e => setField(day, 'close', e.target.value)}
 className="bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded text-crm-text text-[13px] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-crm-primary outline-none">
 {TIMES.filter(t => t > dh.open).map(t => <option key={t} value={t}>{t}</option>)}
 </select>
 </>
 ) : (
 <span className="text-crm-muted text-[13px] italic">Closed</span>
 )}
 </div>
 );
 })}
 </div>
 <PremiumButton type="button" onClick={save} disabled={saving} className="mt-6 w-full">
 {saving ? 'Saving…' : 'Save Business Hours'}
 </PremiumButton>
 </PremiumGlassCard>
 );
}

