'use client';

import { useState, useEffect } from 'react';
import { fmtPrice } from '@/lib/formatters';

interface Tier {
 name: string;
 minPoints: number;
 earnMultiplier: number;
 perks: string;
}

const DEFAULT_TIERS: Tier[] = [
 { name: 'Bronze', minPoints: 0, earnMultiplier: 1, perks: 'Standard rewards' },
 { name: 'Silver', minPoints: 200, earnMultiplier: 1.25, perks: 'Priority booking, 5% extra discount' },
 { name: 'Gold', minPoints: 500, earnMultiplier: 1.5, perks: 'Free product per visit, birthday bonus' },
 { name: 'Platinum', minPoints: 1000, earnMultiplier: 2, perks: 'VIP treatment, double points, exclusive offers' },
];

const TIER_COLORS: Record<string, string> = {
 Bronze: 'bg-amber-800/30 text-status-pending border-status-pending/40',
 Silver: 'bg-crm-border/20 text-crm-muted border-crm-border/40',
 Gold: 'bg-crm-primary/20 text-status-pending border-status-pending/40',
 Platinum: 'bg-crm-accent/20 text-crm-accent border-crm-accent/30',
};
const TIER_ICONS: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

export default function LoyaltyDashboard({ shopId, currency }: { shopId: string, currency: string }) {
 const [program, setProgram] = useState<any>(null);
 const [accounts, setAccounts] = useState<any[]>([]);
 const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [editingTiers, setEditingTiers] = useState(false);
 const [form, setForm] = useState({
 pointsPerDollar: 1,
 pointsPerVisit: 10,
 redeemThreshold: 100,
 redeemValue: 5,
 pointExpiryDays: 0,
 isActive: true,
 });
 const [tierForm, setTierForm] = useState<Tier[]>(DEFAULT_TIERS);

 useEffect(() => { loadData(); }, [shopId]);

 const loadData = async () => {
 try {
 const [progRes, accRes] = await Promise.all([
 fetch(`/api/shops/${shopId}/loyalty`),
 fetch(`/api/shops/${shopId}/loyalty/accounts`),
 ]);
 const progData = await progRes.json();
 const accData = await accRes.json();

 if (progData.program) {
 setProgram(progData.program);
 setForm({
 pointsPerDollar: progData.program.pointsPerDollar,
 pointsPerVisit: progData.program.pointsPerVisit,
 redeemThreshold: progData.program.redeemThreshold,
 redeemValue: progData.program.redeemValue,
 pointExpiryDays: progData.program.pointExpiryDays || 0,
 isActive: progData.program.isActive,
 });
 }
 if (progData.tiers) {
 setTiers(progData.tiers);
 setTierForm(progData.tiers);
 }
 if (Array.isArray(accData)) setAccounts(accData);
 } catch {} finally { setLoading(false); }
 };

 const saveProgram = async () => {
 setSaving(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/loyalty`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ...form, tiers: tierForm }),
 });
 const data = await res.json();
 setProgram(data);
 setEditingTiers(false);
 loadData();
 } catch { alert('Failed to save'); }
 finally { setSaving(false); }
 };

 const updateTier = (idx: number, field: keyof Tier, value: any) => {
 setTierForm(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
 };

 if (loading) return <p className="text-crm-muted text-center py-12 text-[13px]">Loading loyalty program...</p>;

 const inputClass = "w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold";

 return (
 <div className="space-y-8">
 {/* Program Settings */}
 <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm">
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-6">
 <h3 className="font-bold text-crm-text flex items-center gap-2 text-lg font-bold">
 <span>⚙️</span> Loyalty Program Settings
 </h3>
 <button
 onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
 className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
 form.isActive ? 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30' : 'bg-crm-surface text-crm-muted border-crm-border'
 }`}
 >
 {form.isActive ? '● Active' : '○ Inactive'}
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 <div>
 <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Pts / {fmtPrice(1, currency)} Spent</label>
 <input type="number" step="0.1" min="0" value={form.pointsPerDollar}
 onChange={e => setForm(f => ({ ...f, pointsPerDollar: parseFloat(e.target.value) || 0 }))}
 className={inputClass} />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Pts / Visit</label>
 <input type="number" min="0" value={form.pointsPerVisit}
 onChange={e => setForm(f => ({ ...f, pointsPerVisit: parseInt(e.target.value) || 0 }))}
 className={inputClass} />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Redeem Threshold</label>
 <input type="number" min="1" value={form.redeemThreshold}
 onChange={e => setForm(f => ({ ...f, redeemThreshold: parseInt(e.target.value) || 1 }))}
 className={inputClass} />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Redeem Value ($)</label>
 <input type="number" step="0.5" min="0" value={form.redeemValue}
 onChange={e => setForm(f => ({ ...f, redeemValue: parseFloat(e.target.value) || 0 }))}
 className={inputClass} />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Point Expiry (days)</label>
 <input type="number" min="0" value={form.pointExpiryDays}
 onChange={e => setForm(f => ({ ...f, pointExpiryDays: parseInt(e.target.value) || 0 }))}
 className={inputClass} />
 <p className="text-crm-muted mt-0.5 text-[13px]">0 = never expire</p>
 </div>
 </div>

 <div className="mt-4 p-3 bg-crm-primary/5 border border-brand-gold/20 rounded-lg text-[13px] text-crm-muted hover:opacity-90">
 <strong className="text-crm-accent">How it works:</strong> Clients earn <strong>{form.pointsPerVisit} pts</strong> per visit + <strong>{form.pointsPerDollar} pts</strong> per {fmtPrice(1, currency)} spent (base rate, multiplied by tier).
 Redeem at <strong>{form.redeemThreshold} pts</strong> for <strong>{fmtPrice(form.redeemValue, currency)}</strong> off.
 {form.pointExpiryDays > 0 && <> Points expire after <strong>{form.pointExpiryDays} days</strong>.</>}
 </div>

 <button onClick={saveProgram} disabled={saving}
 className="mt-4 bg-crm-primary text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:bg-status-pending disabled:opacity-50">
 {saving ? 'Saving...' : program ? 'Update Program' : 'Activate Program'}
 </button>
 </div>

 {/* Tier System */}
 <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm">
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
 <h3 className="font-bold text-crm-text flex items-center gap-2 text-lg font-bold">
 <span>🏅</span> Tier System
 </h3>
 <button onClick={() => setEditingTiers(!editingTiers)}
 className="text-[11px] text-crm-accent hover:underline">
 {editingTiers ? '✕ Cancel' : '✏️ Edit Tiers'}
 </button>
 </div>

 {editingTiers ? (
 <div className="space-y-3">
 {tierForm.map((tier, idx) => (
 <div key={idx} className="grid grid-cols-4 gap-3 bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm">
 <div>
 <label className="block text-crm-muted mb-0.5 uppercase text-[13px]">Name</label>
 <input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)}
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-1.5 text-[11px] text-crm-text" />
 </div>
 <div>
 <label className="block text-crm-muted mb-0.5 uppercase text-[13px]">Min Lifetime Pts</label>
 <input type="number" min="0" value={tier.minPoints}
 onChange={e => updateTier(idx, 'minPoints', parseInt(e.target.value) || 0)}
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-1.5 text-[11px] text-crm-text" />
 </div>
 <div>
 <label className="block text-crm-muted mb-0.5 uppercase text-[13px]">Earn Multiplier</label>
 <input type="number" step="0.05" min="1" value={tier.earnMultiplier}
 onChange={e => updateTier(idx, 'earnMultiplier', parseFloat(e.target.value) || 1)}
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-1.5 text-[11px] text-crm-text" />
 </div>
 <div>
 <label className="block text-crm-muted mb-0.5 uppercase text-[13px]">Perks</label>
 <input value={tier.perks} onChange={e => updateTier(idx, 'perks', e.target.value)}
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-1.5 text-[11px] text-crm-text" />
 </div>
 </div>
 ))}
 <button onClick={saveProgram} disabled={saving}
 className="bg-crm-primary text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:bg-status-pending disabled:opacity-50">
 {saving ? 'Saving...' : 'Save Tiers'}
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 {tiers.map(tier => (
 <div key={tier.name}
 className={`p-4 rounded-lg border text-center ${TIER_COLORS[tier.name] || 'bg-crm-surface text-crm-text border-crm-border'}`}>
 <div className="text-2xl mb-1">{TIER_ICONS[tier.name] || '⭐'}</div>
 <p className="font-bold text-xl font-bold">{tier.name}</p>
 <p className="opacity-70 mt-0.5 text-[13px]">{tier.minPoints}+ lifetime pts</p>
 <p className="font-semibold mt-1 text-[13px]">{tier.earnMultiplier}x earn rate</p>
 <p className="opacity-60 mt-1 text-[13px]">{tier.perks}</p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Leaderboard */}
 <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm">
 <h3 className="font-bold text-crm-text flex items-center gap-2 mb-4 text-lg font-bold">
 <span>🏆</span> Loyalty Leaderboard
 </h3>

 {accounts.length === 0 ? (
 <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-[13px]">
 No loyalty members yet. Points will be earned automatically after each checkout.
 </p>
 ) : (
 <div className="space-y-2 max-h-[400px] overflow-y-auto">
 {accounts.map((acc: any, idx: number) => (
 <div key={acc.id} className="flex items-center gap-3 bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black ${
 idx === 0 ? 'bg-crm-primary/20 text-status-pending' :
 idx === 1 ? 'bg-crm-border/20 text-crm-muted' :
 idx === 2 ? 'bg-amber-700/20 text-status-pending' :
 'bg-crm-surface text-crm-muted'
 } hover:opacity-90`}>
 {idx + 1}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="font-semibold text-crm-text truncate text-[13px]">{acc.user?.name || 'Guest'}</p>
 <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
 TIER_COLORS[acc.currentTier] || 'bg-crm-surface text-crm-muted border-crm-border'
 }`}>
 {TIER_ICONS[acc.currentTier] || ''} {acc.currentTier || 'Bronze'}
 </span>
 </div>
 <p className="text-crm-muted truncate text-[13px]">{acc.user?.email}</p>
 </div>
 <div className="text-right">
 <p className="font-black text-crm-accent text-xl font-bold">{acc.pointsBalance}</p>
 <p className="text-crm-muted uppercase text-[13px]">balance</p>
 </div>
 <div className="text-right hidden sm:block">
 <p className="text-status-info text-[13px]">{acc.lifetimePoints || acc.totalEarned}</p>
 <p className="text-crm-muted uppercase text-[13px]">lifetime</p>
 </div>
 <div className="text-right hidden sm:block">
 <p className="text-status-confirmed text-[13px]">{acc.totalEarned}</p>
 <p className="text-crm-muted uppercase text-[13px]">earned</p>
 </div>
 <div className="text-right hidden md:block">
 <p className="text-status-cancelled text-[13px]">{acc.totalRedeemed}</p>
 <p className="text-crm-muted uppercase text-[13px]">redeemed</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
