'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumInput from '@/components/ui/PremiumInput';
import PremiumButton from '@/components/ui/PremiumButton';

export default function WaitlistClient({ shopId, services, staff }: { shopId: string; services: any[]; staff: any[] }) {
 const [waitlist, setWaitlist] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [clientName, setClientName] = useState('');
 const [clientPhone, setClientPhone] = useState('');
 const [serviceId, setServiceId] = useState('');
 const [staffId, setStaffId] = useState('');
 const [adding, setAdding] = useState(false);
 const [assigningId, setAssigningId] = useState<string | null>(null); // which waitlist entry we're picking a barber for

 const fetchWaitlist = async () => {
 const res = await fetch(`/api/shops/${shopId}/waitlist`);
 if (res.ok) setWaitlist(await res.json());
 setLoading(false);
 };

  useEffect(() => {
    fetchWaitlist();
    const supabase = createClient();
    const channel = supabase.channel('waitlist_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Waitlist', filter: `shopId=eq.${shopId}` },
        () => { fetchWaitlist(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

 const handleAdd = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!clientName.trim()) return;
 setAdding(true);
 const res = await fetch(`/api/shops/${shopId}/waitlist`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ clientName, clientPhone, serviceId: serviceId || undefined, staffId: staffId || undefined }),
 });
 if (res.ok) { setClientName(''); setClientPhone(''); setServiceId(''); setStaffId(''); fetchWaitlist(); }
 setAdding(false);
 };

 const updateStatus = async (id: string, status?: string, incomingStaffId?: string | null) => {
 await fetch(`/api/shops/${shopId}/waitlist`, {
 method: 'PATCH', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id, status, staffId: incomingStaffId }),
 });
 setAssigningId(null);
 fetchWaitlist();
 };

 const handleServe = (entryId: string) => {
 if (staff.length > 0) {
 setAssigningId(entryId);
 } else {
 updateStatus(entryId, 'SERVING');
 }
 };

 const waiting = waitlist.filter(w => w.status === 'WAITING');
 const serving = waitlist.filter(w => w.status === 'SERVING');
 const getWaitTime = (c: string) => { const m = Math.floor((Date.now() - new Date(c).getTime()) / 60000); return m < 1 ? 'Just now' : `${m} min`; };
 const getStaffName = (staffId: string | null) => { 
 if (!staffId) return null; 
 const s = staff.find(x => x.id === staffId);
 return s ? (s.name || (s.email ? s.email.split('@')[0] : 'Staff')) : null;
 };

 return (
 <div>
 <PremiumGlassCard className="!p-0 mb-8 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2" accentColor="crm-primary">
 <div className="flex-1 p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
 <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
 <h3 className="text-crm-muted uppercase tracking-widest font-black text-[11px]">Waiting</h3>
 <span className="text-cyan-400 text-xl drop-shadow-md">⏳</span>
 </div>
 <p className="font-black text-crm-text break-words leading-tight text-4xl">{waiting.length}</p>
 </div>
 <div className="flex-1 p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
 <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
 <h3 className="text-crm-muted uppercase tracking-widest font-black text-[11px]">Being Served</h3>
 <span className="text-emerald-400 text-xl drop-shadow-md">✂️</span>
 </div>
 <p className="font-black text-crm-text break-words leading-tight text-4xl">{serving.length}</p>
 </div>
 <div className="flex-1 p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
 <div className="absolute top-0 left-0 w-full h-1 bg-brand-indigo shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-3">
 <h3 className="text-crm-muted uppercase tracking-widest font-black text-[11px]">Est. Wait</h3>
 <span className="text-brand-indigo text-xl drop-shadow-md">⏱️</span>
 </div>
 <p className="font-black text-crm-text break-words leading-tight text-4xl">{waiting.length > 0 ? `~${waiting.length * 15}m` : '0m'}</p>
 </div>
 </PremiumGlassCard>

 <form onSubmit={handleAdd} className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-6 relative overflow-hidden mb-8">
 <h3 className="font-bold text-crm-text text-xl mb-4 flex items-center gap-2">
 <span className="text-crm-primary">➕</span> Add Walk-in
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
 <PremiumInput 
 label="Client Name *"
 type="text" 
 value={clientName} 
 onChange={e => setClientName(e.target.value)} 
 placeholder="e.g. John Doe" 
 required 
 />
 <PremiumInput 
 label="Phone (optional)"
 type="tel" 
 value={clientPhone} 
 onChange={e => setClientPhone(e.target.value)} 
 onBlur={() => {
 import('@/lib/formatters').then(({ formatPhoneNumberIN }) => {
 setClientPhone(formatPhoneNumberIN(clientPhone));
 });
 }} 
 placeholder="(123) 456-7890" 
 />
 <div className="relative">
 <label className="block text-[13px] font-bold text-crm-muted uppercase tracking-wider mb-2 ml-1">Service</label>
 <select 
 value={serviceId} 
 onChange={e => setServiceId(e.target.value)} 
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none appearance-none font-medium"
 >
 <option value="">Any Service</option>
 {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
 </select>
 </div>
 <div className="relative">
 <label className="block text-[13px] font-bold text-crm-muted uppercase tracking-wider mb-2 ml-1">Staff</label>
 <select 
 value={staffId} 
 onChange={e => setStaffId(e.target.value)} 
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none appearance-none font-medium"
 >
 <option value="">No Preference</option>
 {staff.map(s => <option key={s.id} value={s.id}>{s.name || (s.email ? s.email.split('@')[0] : 'Staff')}</option>)}
 </select>
 </div>
 <div className="flex items-end">
 <PremiumButton type="submit" disabled={adding} className="w-full py-3 h-[48px]">
 {adding ? 'Adding...' : 'Add to List'}
 </PremiumButton>
 </div>
 </div>
 </form>

 {loading ? <p className="text-crm-muted text-center py-12 text-[14px] font-bold uppercase tracking-wider animate-pulse">Loading waitlist...</p> : (
 <div className="space-y-4">
 {serving.map(entry => (
 <PremiumGlassCard key={entry.id} className="!p-5 bg-emerald-500/10 border-emerald-500/20" accentColor="emerald-500">
 <div className="flex flex-wrap justify-between gap-x-4 gap-y-4 items-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">✂️</div>
 <div>
 <p className="font-black text-crm-text text-xl">{entry.clientName}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="bg-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-500/20 shadow-inner">Being served</span>
 <span className="text-crm-muted text-[11px] font-medium">{getWaitTime(entry.createdAt)} ago</span>
 </div>
 {(entry.staffId || entry.clientPhone) && (
 <div className="flex items-center gap-3 mt-2 text-[12px]">
 {entry.staffId && <span className="text-crm-primary font-bold">✂️ {getStaffName(entry.staffId)}</span>}
 {entry.clientPhone && <span className="text-crm-muted">📱 {entry.clientPhone}</span>}
 </div>
 )}
 </div>
 </div>
 <button onClick={() => updateStatus(entry.id, 'DONE')} className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] text-[12px] font-black uppercase tracking-wider px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0">
 Done ✓
 </button>
 </div>
 </PremiumGlassCard>
 ))}
 
 {waiting.map((entry, idx) => (
 <PremiumGlassCard key={entry.id} className="!p-5" accentColor="crm-primary">
 <div className="flex flex-wrap justify-between gap-x-4 gap-y-4 items-center">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-crm-bg border border-white/10 flex items-center justify-center text-crm-muted font-black text-xl shadow-inner shrink-0">{idx + 1}</div>
 <div>
 <p className="font-black text-crm-text text-xl">{entry.clientName}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className="bg-cyan-500/20 text-cyan-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-cyan-500/20 shadow-inner">Waiting</span>
 <span className="text-crm-muted text-[11px] font-medium">{getWaitTime(entry.createdAt)}</span>
 </div>
 {(entry.staffId || entry.clientPhone) && (
 <div className="flex items-center gap-3 mt-2 text-[12px]">
 {entry.staffId && <span className="text-crm-primary font-bold">✂️ {getStaffName(entry.staffId)}</span>}
 {entry.clientPhone && <span className="text-crm-muted">📱 {entry.clientPhone}</span>}
 </div>
 )}
 </div>
 </div>
 <div className="flex flex-wrap gap-2 justify-end">
 <button onClick={() => setAssigningId(entry.id)} className="bg-crm-primary/10 hover:bg-crm-primary/20 text-crm-primary border border-crm-primary/30 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors">
 Reassign
 </button>
 <button onClick={() => updateStatus(entry.id, 'LEFT')} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors">
 Left
 </button>
 <button onClick={() => handleServe(entry.id)} className="bg-crm-primary hover:bg-crm-primary/80 text-white shadow-[0_0_15px_rgba(var(--crm-primary-rgb),0.4)] text-[12px] font-black uppercase tracking-wider px-6 py-2 rounded-full transition-all hover:scale-105 active:scale-95">
 Serve
 </button>
 </div>
 </div>
 
 {/* Staff Picker Dropdown */}
 {assigningId === entry.id && (
 <div className="mt-4 pt-4 border-t border-white/10 bg-crm-bg/30 -mx-5 px-5 -mb-5 pb-5">
 <p className="text-crm-muted uppercase tracking-widest font-black mb-3 text-[11px]">Assign barber:</p>
 <div className="flex flex-wrap gap-3">
 {staff.map(s => (
 <button key={s.id} onClick={() => updateStatus(entry.id, undefined, s.id)}
 className="bg-crm-primary/10 hover:bg-crm-primary/20 text-crm-primary border border-crm-primary/30 text-[12px] font-bold px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-inner">
 ✂️ {s.name || (s.email ? s.email.split('@')[0] : 'Staff')}
 </button>
 ))}
 <button onClick={() => updateStatus(entry.id, undefined, null)}
 className="bg-white/50 hover:bg-white/80 text-crm-text text-[12px] font-bold px-4 py-2 rounded-lg border border-white/40 transition-colors">
 Remove assignment
 </button>
 <button onClick={() => setAssigningId(null)}
 className="text-crm-muted hover:text-crm-text text-[12px] font-bold uppercase tracking-wider px-3 py-2 ml-auto">
 Cancel
 </button>
 </div>
 </div>
 )}
 </PremiumGlassCard>
 ))}
 
 {waiting.length === 0 && serving.length === 0 && (
 <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-sm rounded-2xl border border-dashed border-white/20">
 <span className="text-4xl mb-4 opacity-50 drop-shadow-md">🪑</span>
 <h2 className="text-xl font-bold text-crm-text mb-2">No one in the queue</h2>
 <p className="text-crm-muted text-[14px] max-w-[250px] mx-auto font-medium">
 Add walk-in clients above to start the queue.
 </p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
