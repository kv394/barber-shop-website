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
  Bronze: 'bg-amber-800/30 text-status-pending border-status-pending/40',
  Silver: 'bg-botanical-border/20 text-botanical-muted border-botanical-border/40',
  Gold: 'bg-botanical-primary/20 text-status-pending border-status-pending/40',
  Platinum: 'bg-botanical-accent/20 text-botanical-accent border-botanical-accent/30',
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

  if (loading) return <p className="text-botanical-muted text-center py-12 text-base md:text-lg">Loading loyalty program...</p>;

  const inputClass = "w-full bg-botanical-surface border border-botanical-border shadow-sm rounded-md p-2.5 text-sm text-botanical-text focus:outline-none focus:border-brand-gold";

  return (
    <div className="space-y-8">
      {/* Program Settings */}
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm">
        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-6">
          <h3 className="font-bold text-botanical-text flex items-center gap-2 text-2xl md:text-3xl">
            <span>⚙️</span> Loyalty Program Settings
          </h3>
          <button
            onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              form.isActive ? 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30' : 'bg-botanical-surface text-botanical-muted border-botanical-border'
            }`}
          >
            {form.isActive ? '● Active' : '○ Inactive'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">Pts / $1 Spent</label>
            <input type="number" step="0.1" min="0" value={form.pointsPerDollar}
              onChange={e => setForm(f => ({ ...f, pointsPerDollar: parseFloat(e.target.value) || 0 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">Pts / Visit</label>
            <input type="number" min="0" value={form.pointsPerVisit}
              onChange={e => setForm(f => ({ ...f, pointsPerVisit: parseInt(e.target.value) || 0 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">Redeem Threshold</label>
            <input type="number" min="1" value={form.redeemThreshold}
              onChange={e => setForm(f => ({ ...f, redeemThreshold: parseInt(e.target.value) || 1 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">Redeem Value ($)</label>
            <input type="number" step="0.5" min="0" value={form.redeemValue}
              onChange={e => setForm(f => ({ ...f, redeemValue: parseFloat(e.target.value) || 0 }))}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">Point Expiry (days)</label>
            <input type="number" min="0" value={form.pointExpiryDays}
              onChange={e => setForm(f => ({ ...f, pointExpiryDays: parseInt(e.target.value) || 0 }))}
              className={inputClass} />
            <p className="text-botanical-muted mt-0.5 text-base md:text-lg">0 = never expire</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-botanical-primary/5 border border-brand-gold/20 rounded-lg text-sm text-botanical-muted hover:opacity-90">
          <strong className="text-botanical-accent">How it works:</strong> Clients earn <strong>{form.pointsPerVisit} pts</strong> per visit + <strong>{form.pointsPerDollar} pts</strong> per $1 spent (base rate, multiplied by tier).
          Redeem at <strong>{form.redeemThreshold} pts</strong> for <strong>${form.redeemValue.toFixed(2)}</strong> off.
          {form.pointExpiryDays > 0 && <> Points expire after <strong>{form.pointExpiryDays} days</strong>.</>}
        </div>

        <button onClick={saveProgram} disabled={saving}
          className="mt-4 bg-botanical-primary text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-status-pending disabled:opacity-50">
          {saving ? 'Saving...' : program ? 'Update Program' : 'Activate Program'}
        </button>
      </div>

      {/* Tier System */}
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm">
        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
          <h3 className="font-bold text-botanical-text flex items-center gap-2 text-2xl md:text-3xl">
            <span>🏅</span> Tier System
          </h3>
          <button onClick={() => setEditingTiers(!editingTiers)}
            className="text-xs text-botanical-accent hover:underline">
            {editingTiers ? '✕ Cancel' : '✏️ Edit Tiers'}
          </button>
        </div>

        {editingTiers ? (
          <div className="space-y-3">
            {tierForm.map((tier, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-3 bg-botanical-surface p-3 rounded-lg border border-botanical-border shadow-sm">
                <div>
                  <label className="block text-botanical-muted mb-0.5 uppercase text-sm">Name</label>
                  <input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)}
                    className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-1.5 text-xs text-botanical-text" />
                </div>
                <div>
                  <label className="block text-botanical-muted mb-0.5 uppercase text-sm">Min Lifetime Pts</label>
                  <input type="number" min="0" value={tier.minPoints}
                    onChange={e => updateTier(idx, 'minPoints', parseInt(e.target.value) || 0)}
                    className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-1.5 text-xs text-botanical-text" />
                </div>
                <div>
                  <label className="block text-botanical-muted mb-0.5 uppercase text-sm">Earn Multiplier</label>
                  <input type="number" step="0.05" min="1" value={tier.earnMultiplier}
                    onChange={e => updateTier(idx, 'earnMultiplier', parseFloat(e.target.value) || 1)}
                    className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-1.5 text-xs text-botanical-text" />
                </div>
                <div>
                  <label className="block text-botanical-muted mb-0.5 uppercase text-sm">Perks</label>
                  <input value={tier.perks} onChange={e => updateTier(idx, 'perks', e.target.value)}
                    className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-1.5 text-xs text-botanical-text" />
                </div>
              </div>
            ))}
            <button onClick={saveProgram} disabled={saving}
              className="bg-botanical-primary text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-status-pending disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Tiers'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map(tier => (
              <div key={tier.name}
                className={`p-4 rounded-lg border text-center ${TIER_COLORS[tier.name] || 'bg-botanical-surface text-botanical-text border-botanical-border'}`}>
                <div className="text-2xl mb-1">{TIER_ICONS[tier.name] || '⭐'}</div>
                <p className="font-bold text-3xl md:text-4xl">{tier.name}</p>
                <p className="opacity-70 mt-0.5 text-base md:text-lg">{tier.minPoints}+ lifetime pts</p>
                <p className="font-semibold mt-1 text-base md:text-lg">{tier.earnMultiplier}x earn rate</p>
                <p className="opacity-60 mt-1 text-base md:text-lg">{tier.perks}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm">
        <h3 className="font-bold text-botanical-text flex items-center gap-2 mb-4 text-2xl md:text-3xl">
          <span>🏆</span> Loyalty Leaderboard
        </h3>

        {accounts.length === 0 ? (
          <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded text-base md:text-lg">
            No loyalty members yet. Points will be earned automatically after each checkout.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {accounts.map((acc: any, idx: number) => (
              <div key={acc.id} className="flex items-center gap-3 bg-botanical-surface p-3 rounded-lg border border-botanical-border shadow-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                  idx === 0 ? 'bg-botanical-primary/20 text-status-pending' :
                  idx === 1 ? 'bg-botanical-border/20 text-botanical-muted' :
                  idx === 2 ? 'bg-amber-700/20 text-status-pending' :
                  'bg-botanical-surface text-botanical-muted'
                } hover:opacity-90`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-botanical-text truncate text-base md:text-lg">{acc.user?.name || 'Guest'}</p>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${
                      TIER_COLORS[acc.currentTier] || 'bg-botanical-surface text-botanical-muted border-botanical-border'
                    }`}>
                      {TIER_ICONS[acc.currentTier] || ''} {acc.currentTier || 'Bronze'}
                    </span>
                  </div>
                  <p className="text-botanical-muted truncate text-base md:text-lg">{acc.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-botanical-accent text-3xl md:text-4xl">{acc.pointsBalance}</p>
                  <p className="text-botanical-muted uppercase text-base md:text-lg">balance</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-status-info text-base md:text-lg">{acc.lifetimePoints || acc.totalEarned}</p>
                  <p className="text-botanical-muted uppercase text-base md:text-lg">lifetime</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-status-confirmed text-base md:text-lg">{acc.totalEarned}</p>
                  <p className="text-botanical-muted uppercase text-base md:text-lg">earned</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-status-cancelled text-base md:text-lg">{acc.totalRedeemed}</p>
                  <p className="text-botanical-muted uppercase text-base md:text-lg">redeemed</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
