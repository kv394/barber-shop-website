'use client';
import { useEffect, useState } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumInput from '@/components/ui/PremiumInput';

export default function MembershipManager({ shopId }: { shopId: string }) {
 const [tiers, setTiers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [name, setName] = useState('');
 const [description, setDescription] = useState('');
 const [price, setPrice] = useState('');
 const [interval, setInterval] = useState('MONTHLY');
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState('');

 const load = () => fetch(`/api/shops/${shopId}/memberships`).then(r => r.json())
 .then(d => setTiers(Array.isArray(d) ? d : [])).finally(() => setLoading(false));

 useEffect(() => { load(); }, [shopId]);

 const addTier = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim() || !price) return;
 setSaving(true);
 await fetch(`/api/shops/${shopId}/memberships`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, description, price, interval }),
 });
 setName('');
 setDescription('');
 setPrice('');
 setMsg('Membership tier added!');
 await load();
 setSaving(false);
 setTimeout(() => setMsg(''), 3000);
 };

 const remove = async (id: string) => {
 if (!confirm('Delete this membership tier? Active subscriptions may be affected.')) return;
 await fetch(`/api/shops/${shopId}/memberships/${id}`, { method: 'DELETE' });
 setTiers(prev => prev.filter(t => t.id !== id));
 };

 if (loading) return <div className="animate-pulse text-crm-muted py-4">Loading memberships…</div>;

 return (
 <PremiumGlassCard className="space-y-6" accentColor="crm-primary">
 <div>
 <h3 className="font-bold text-crm-text text-xl mb-2">💎 Membership Plans</h3>
 <p className="text-crm-muted text-[13px]">
 Create recurring subscription plans (e.g. VIP Barber Club: $100/mo for unlimited cuts).
 </p>
 </div>

 {msg && <div className="mb-4 p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

 <form onSubmit={addTier} className="mb-8 space-y-6 bg-black/20 border border-white/5 p-6 rounded-xl">
 <h4 className="font-bold text-crm-text text-lg">Create New Tier</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <PremiumInput 
 label="Tier Name *"
 type="text" 
 value={name} 
 onChange={e => setName(e.target.value)} 
 placeholder="e.g. VIP Monthly" 
 required 
 />
 <PremiumInput 
 label="Price ($) *"
 type="number" 
 value={price} 
 onChange={e => setPrice(e.target.value)} 
 placeholder="e.g. 100" 
 min="0"
 step="0.01"
 required 
 />
 <div className="md:col-span-2">
 <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider mb-1.5">Billing Interval</label>
 <select 
 value={interval} 
 onChange={e => setInterval(e.target.value)} 
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none appearance-none"
 >
 <option value="MONTHLY">Monthly</option>
 <option value="YEARLY">Yearly</option>
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider mb-1.5">Description / Perks</label>
 <textarea 
 value={description} 
 onChange={e => setDescription(e.target.value)} 
 placeholder="e.g. Unlimited haircuts, 10% off products..." 
 rows={2}
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50 resize-none" 
 />
 </div>
 </div>
 <div className="flex justify-end">
 <PremiumButton 
 type="submit" 
 disabled={saving || !name.trim() || !price} 
 className="w-full sm:w-auto"
 >
 {saving ? 'Creating...' : 'Create Tier'}
 </PremiumButton>
 </div>
 </form>

 <div className="pt-4 border-t border-white/10">
 <h4 className="text-crm-text mb-4 text-lg font-bold">Active Membership Tiers</h4>
 {tiers.length === 0 ? (
 <div className="bg-black/20 border border-white/5 rounded-xl p-6 text-center">
 <p className="text-crm-muted text-[13px] italic">No memberships created yet.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4">
 {tiers.map(t => (
 <PremiumGlassCard key={t.id} className="!p-5" accentColor="brand-gold">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h5 className="text-crm-text font-bold text-lg">{t.name}</h5>
 <span className="text-[11px] bg-brand-gold/20 border border-brand-gold/30 text-brand-gold px-2.5 py-1 rounded-full font-black tracking-wider uppercase shadow-inner">
 ${t.price} / {t.interval.toLowerCase().replace('ly', '')}
 </span>
 </div>
 <p className="text-crm-muted text-[14px]">{t.description || 'No description provided.'}</p>
 </div>
 <button 
 onClick={() => remove(t.id)} 
 className="text-status-cancelled hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider shrink-0 transition-colors"
 >
 Delete
 </button>
 </div>
 </PremiumGlassCard>
 ))}
 </div>
 )}
 </div>
 </PremiumGlassCard>
 );
}
