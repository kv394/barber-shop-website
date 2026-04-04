'use client';

import { useState, useEffect } from 'react';

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
  Bronze: 'bg-amber-800/30 text-amber-400 border-amber-600/40',
  Silver: 'bg-gray-500/20 text-gray-300 border-gray-400/40',
  Gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  Platinum: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
};
const TIER_ICONS: Record<string, string> = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' };

export default function LoyaltyDashboard({ shopId }: { shopId: string }) {
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

  if (loading) return <p className="text-gray-400 text-center py-12">Loading loyalty program...</p>;

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-md p-2.5 text-sm text-white focus:outline-none focus:border-brand-gold";

  return (
    <div className="space-y-8">
      {/* Program Settings */}
      <div className="bg-slate-900/70 p-6 rounded-xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Loyalty Program Settings
          </h3>
          <button
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              form.isActive ? 'bg-green-900/50 text-green-300 border-green-500/30' : 'bg-gray-800 text-gray-400 border-gray-600'
            }`}
          >
            {form.isActive ? '● Active' : '○ Inactive'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Pts / $1 Spent</label>
            <input type="number" step="0.1" min="0" value={form.pointsPerDollar}
              onChange={e => setForm(f => ({ ...f, pointsPerDollar: parseFloat(e.target.value) || 0 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Pts / Visit</label>
            <input type="number" min="0" value={form.pointsPerVisit}
              onChange={e => setForm(f => ({ ...f, pointsPerVisit: parseInt(e.target.value) || 0 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Redeem Threshold</label>
            <input type="number" min="1" value={form.redeemThreshold}
              onChange={e => setForm(f => ({ ...f, redeemThreshold: parseInt(e.target.value) || 1 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Redeem Value ($)</label>
            <input type="number" step="0.5" min="0" value={form.redeemValue}
              onChange={e => setForm(f => ({ ...f, redeemValue: parseFloat(e.target.value) || 0 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Point Expiry (days)</label>
            <input type="number" min="0" value={form.pointExpiryDays}
              onChange={e => setForm(f => ({ ...f, pointExpiryDays: parseInt(e.target.value) || 0 }))}
              className={inputClass} />
            <p className="text-[9px] text-gray-600 mt-0.5">0 = never expire</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-brand-gold/5 border border-brand-gold/20 rounded-lg text-sm text-gray-300">
          <strong className="text-brand-gold">How it works:</strong> Clients earn <strong>{form.pointsPerVisit} pts</strong> per visit + <strong>{form.pointsPerDollar} pts</strong> per $1 spent (base rate, multiplied by tier).
          Redeem at <strong>{form.redeemThreshold} pts</strong> for <strong>${form.redeemValue.toFixed(2)}</strong> off.
          {form.pointExpiryDays > 0 && <> Points expire after <strong>{form.pointExpiryDays} days</strong>.</>}
        </div>

        <button onClick={saveProgram} disabled={saving}
          className="mt-4 bg-brand-gold text-slate-900 px-6 py-2 rounded-md text-sm font-bold hover:bg-yellow-400 disabled:opacity-50">
          {saving ? 'Saving...' : program ? 'Update Program' : 'Activate Program'}
        </button>
      </div>

      {/* Tier System */}
      <div className="bg-slate-900/70 p-6 rounded-xl border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🏅</span> Tier System
          </h3>
          <button onClick={() => setEditingTiers(!editingTiers)}
            className="text-xs text-brand-gold hover:underline">
            {editingTiers ? '✕ Cancel' : '✏️ Edit Tiers'}
          </button>
        </div>

        {editingTiers ? (
          <div className="space-y-3">
            {tierForm.map((tier, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-3 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                <div>
                  <label className="block text-[9px] text-gray-500 mb-0.5 uppercase">Name</label>
                  <input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 mb-0.5 uppercase">Min Lifetime Pts</label>
                  <input type="number" min="0" value={tier.minPoints}
                    onChange={e => updateTier(idx, 'minPoints', parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 mb-0.5 uppercase">Earn Multiplier</label>
                  <input type="number" step="0.05" min="1" value={tier.earnMultiplier}
                    onChange={e => updateTier(idx, 'earnMultiplier', parseFloat(e.target.value) || 1)}
                    className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 mb-0.5 uppercase">Perks</label>
                  <input value={tier.perks} onChange={e => updateTier(idx, 'perks', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white" />
                </div>
              </div>
            ))}
            <button onClick={saveProgram} disabled={saving}
              className="bg-brand-gold text-slate-900 px-5 py-2 rounded-md text-sm font-bold hover:bg-yellow-400 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Tiers'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map(tier => (
              <div key={tier.name}
                className={`p-4 rounded-lg border text-center ${TIER_COLORS[tier.name] || 'bg-slate-800/50 text-white border-white/10'}`}>
                <div className="text-2xl mb-1">{TIER_ICONS[tier.name] || '⭐'}</div>
                <p className="font-bold text-sm">{tier.name}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{tier.minPoints}+ lifetime pts</p>
                <p className="text-xs font-semibold mt-1">{tier.earnMultiplier}x earn rate</p>
                <p className="text-[10px] opacity-60 mt-1">{tier.perks}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-slate-900/70 p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <span>🏆</span> Loyalty Leaderboard
        </h3>

        {accounts.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8 border border-dashed border-white/10 rounded">
            No loyalty members yet. Points will be earned automatically after each checkout.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {accounts.map((acc: any, idx: number) => (
              <div key={acc.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                  idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                  idx === 2 ? 'bg-amber-700/20 text-amber-500' :
                  'bg-white/5 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{acc.user?.name || 'Guest'}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      TIER_COLORS[acc.currentTier] || 'bg-slate-800 text-gray-400 border-gray-600'
                    }`}>
                      {TIER_ICONS[acc.currentTier] || ''} {acc.currentTier || 'Bronze'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{acc.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-brand-gold">{acc.pointsBalance}</p>
                  <p className="text-[9px] text-gray-500 uppercase">balance</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-blue-400">{acc.lifetimePoints || acc.totalEarned}</p>
                  <p className="text-[9px] text-gray-500 uppercase">lifetime</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-green-400">{acc.totalEarned}</p>
                  <p className="text-[9px] text-gray-500 uppercase">earned</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-sm text-red-400">{acc.totalRedeemed}</p>
                  <p className="text-[9px] text-gray-500 uppercase">redeemed</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
