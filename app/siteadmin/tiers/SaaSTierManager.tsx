'use client';

import { useState, useEffect } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumInput from '@/components/ui/PremiumInput';

type SaaSTier = {
 id: string;
 name: string;
 baseFeeUSD: number;
 maxAppointments: number;
 maxUsers: number;
 maxFormSubmissions: number;
 storageLimitMB: number;
 overageFeePer100MB: number;
 description: string;
};

export default function SaaSTierManager() {
 const [tiers, setTiers] = useState<SaaSTier[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState<string | null>(null);
 
 // New tier state
 const [isCreating, setIsCreating] = useState(false);
 const [newTier, setNewTier] = useState<Partial<SaaSTier>>({
 name: '',
 baseFeeUSD: 0,
 maxAppointments: 100,
 maxUsers: 1,
 maxFormSubmissions: 50,
 storageLimitMB: 500,
 overageFeePer100MB: 1,
 description: ''
 });

 useEffect(() => {
 fetchTiers();
 }, []);

 const fetchTiers = () => {
 fetch('/api/siteadmin/tiers')
 .then(res => res.json())
 .then(data => {
 setTiers(data || []);
 setLoading(false);
 });
 };

 const handleUpdate = (index: number, field: keyof SaaSTier, value: any) => {
 const newTiers = [...tiers];
 newTiers[index] = { ...newTiers[index], [field]: value };
 setTiers(newTiers);
 };

 const handleSaveTier = async (tier: SaaSTier) => {
 setSaving(tier.id);
 try {
 const res = await fetch('/api/siteadmin/tiers', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(tier)
 });
 if (!res.ok) throw new Error('Failed to update tier');
 } catch (error) {
 alert('Error updating tier');
 } finally {
 setSaving(null);
 }
 };

 const handleDeleteTier = async (id: string) => {
 if (!confirm('Are you sure you want to delete this pricing tier? This may break shops currently assigned to it.')) return;
 
 setSaving(id);
 try {
 const res = await fetch(`/api/siteadmin/tiers?id=${id}`, {
 method: 'DELETE',
 });
 if (!res.ok) throw new Error('Failed to delete tier');
 setTiers(tiers.filter(t => t.id !== id));
 } catch (error) {
 alert('Error deleting tier');
 } finally {
 setSaving(null);
 }
 };

 const handleCreateTier = async () => {
 if (!newTier.name) return alert('Name is required');
 
 setSaving('new');
 try {
 const res = await fetch('/api/siteadmin/tiers', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newTier)
 });
 if (!res.ok) throw new Error('Failed to create tier');
 
 setIsCreating(false);
 setNewTier({
 name: '', baseFeeUSD: 0, maxAppointments: 100, maxUsers: 1, 
 maxFormSubmissions: 50, storageLimitMB: 500, overageFeePer100MB: 1, description: ''
 });
 fetchTiers();
 } catch (error) {
 alert('Error creating tier');
 } finally {
 setSaving(null);
 }
 };

 if (loading) {
 return <div className="p-8 text-center text-crm-muted font-bold">Loading pricing tiers...</div>;
 }

 return (
 <div className="space-y-8">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-xl font-bold text-crm-text">Subscription Plans</h2>
 <p className="text-[13px] text-crm-muted mt-1">Define the feature limits and pricing for Kutzapp shops.</p>
 </div>
 <button
 onClick={() => setIsCreating(true)}
 className="bg-crm-primary text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[12px] hover:bg-crm-primary/90 transition-colors shadow-lg"
 >
 + New Tier
 </button>
 </div>

 {isCreating && (
 <PremiumGlassCard accentColor="emerald-500" className="!p-0 overflow-hidden animate-in fade-in slide-in-from-top-4">
 <div className="px-6 py-4 bg-green-500/10 border-b border-green-500/20 flex justify-between items-center">
 <h3 className="font-black text-green-600 uppercase tracking-widest text-[13px]">Create New Tier</h3>
 <button onClick={() => setIsCreating(false)} className="text-crm-muted hover:text-crm-text">✕</button>
 </div>
 <div className="p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
 <PremiumInput label="Tier Name" placeholder="e.g. Pro" value={newTier.name} onChange={e => setNewTier({...newTier, name: e.target.value})} />
 <PremiumInput label="Monthly Fee (USD)" type="number" value={newTier.baseFeeUSD} onChange={e => setNewTier({...newTier, baseFeeUSD: parseFloat(e.target.value)})} />
 <PremiumInput label="Max Appointments/mo" type="number" value={newTier.maxAppointments} onChange={e => setNewTier({...newTier, maxAppointments: parseInt(e.target.value)})} />
 <PremiumInput label="Max Staff Users" type="number" value={newTier.maxUsers} onChange={e => setNewTier({...newTier, maxUsers: parseInt(e.target.value)})} />
 <PremiumInput label="Storage Limit (MB)" type="number" value={newTier.storageLimitMB} onChange={e => setNewTier({...newTier, storageLimitMB: parseFloat(e.target.value)})} />
 <PremiumInput label="Overage Fee ($/100MB)" type="number" value={newTier.overageFeePer100MB} onChange={e => setNewTier({...newTier, overageFeePer100MB: parseFloat(e.target.value)})} />
 <div className="md:col-span-2">
 <PremiumInput label="Marketing Description" placeholder="Everything in Free, plus..." value={newTier.description} onChange={e => setNewTier({...newTier, description: e.target.value})} />
 </div>
 </div>
 <div className="flex justify-end pt-4">
 <button 
 onClick={handleCreateTier} 
 disabled={saving === 'new'}
 className="bg-green-500 text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest text-[12px] hover:bg-green-600 transition-colors shadow-lg"
 >
 {saving === 'new' ? 'Creating...' : 'Create Tier'}
 </button>
 </div>
 </div>
 </PremiumGlassCard>
 )}

 <div className="grid grid-cols-1 gap-6">
 {tiers.map((tier, index) => (
 <PremiumGlassCard key={tier.id} accentColor="crm-primary" className="!p-0 overflow-hidden relative group">
 <div className="px-6 py-5 bg-white/40 border-b border-white/20 flex flex-wrap gap-4 items-center justify-between">
 <div className="flex items-center gap-4 flex-1 min-w-[250px]">
 <input
 type="text"
 value={tier.name}
 onChange={e => handleUpdate(index, 'name', e.target.value)}
 className="bg-transparent text-2xl font-black text-crm-text border-b border-transparent hover:border-crm-primary/50 focus:border-crm-primary outline-none transition-colors"
 />
 <span className="text-[10px] uppercase font-mono text-crm-muted font-bold tracking-widest bg-white/50 px-2 py-1 rounded shadow-inner border border-white/20">{tier.id}</span>
 </div>
 
 <div className="flex items-center gap-2 bg-crm-bg/50 px-4 py-2 rounded-xl border border-white/20 shadow-inner">
 <span className="text-crm-primary font-black">$</span>
 <input
 type="number"
 value={tier.baseFeeUSD}
 onChange={e => handleUpdate(index, 'baseFeeUSD', parseFloat(e.target.value))}
 className="bg-transparent w-20 text-crm-text font-black text-xl text-center outline-none"
 />
 <span className="text-crm-muted text-[12px] font-bold uppercase tracking-widest">/mo</span>
 </div>
 </div>

 <div className="p-6">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2 px-1">Max Appts/mo</label>
 <input
 type="number"
 value={tier.maxAppointments}
 onChange={e => handleUpdate(index, 'maxAppointments', parseInt(e.target.value))}
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/20 shadow-inner rounded-xl px-4 py-2.5 text-crm-text font-bold outline-none focus:ring-2 focus:ring-crm-primary"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2 px-1">Max Staff Users</label>
 <input
 type="number"
 value={tier.maxUsers}
 onChange={e => handleUpdate(index, 'maxUsers', parseInt(e.target.value))}
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/20 shadow-inner rounded-xl px-4 py-2.5 text-crm-text font-bold outline-none focus:ring-2 focus:ring-crm-primary"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2 px-1">Storage (MB)</label>
 <input
 type="number"
 value={tier.storageLimitMB}
 onChange={e => handleUpdate(index, 'storageLimitMB', parseFloat(e.target.value))}
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/20 shadow-inner rounded-xl px-4 py-2.5 text-crm-text font-bold outline-none focus:ring-2 focus:ring-crm-primary"
 />
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2 px-1">Overage ($/100MB)</label>
 <input
 type="number"
 value={tier.overageFeePer100MB}
 onChange={e => handleUpdate(index, 'overageFeePer100MB', parseFloat(e.target.value))}
 className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/20 shadow-inner rounded-xl px-4 py-2.5 text-crm-text font-bold outline-none focus:ring-2 focus:ring-crm-primary"
 />
 </div>
 </div>

 <div className="mb-6">
 <PremiumInput
 label="Marketing Description"
 value={tier.description || ''}
 onChange={e => handleUpdate(index, 'description', e.target.value)}
 />
 </div>

 <div className="flex justify-between items-center pt-6 border-t border-white/20">
 <button
 onClick={() => handleDeleteTier(tier.id)}
 disabled={saving === tier.id}
 className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors"
 >
 Delete Tier
 </button>
 <button
 onClick={() => handleSaveTier(tier)}
 disabled={saving === tier.id}
 className="bg-crm-text hover:bg-crm-primary text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-colors shadow-md"
 >
 {saving === tier.id ? 'Saving...' : 'Save Changes'}
 </button>
 </div>
 </div>
 </PremiumGlassCard>
 ))}
 
 {tiers.length === 0 && !loading && (
 <div className="text-center py-20 text-crm-muted bg-white/20 border border-white/20 rounded-2xl shadow-inner">
 <p className="font-bold">No subscription tiers found.</p>
 <p className="text-[13px] mt-1">Create one to get started.</p>
 </div>
 )}
 </div>
 </div>
 );
}
