'use client';
import { useEffect, useState } from 'react';

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

  if (loading) return <div className="animate-pulse text-botanical-muted py-4">Loading memberships…</div>;

  return (
    <div className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl p-6">
      <h3 className="text-lg font-bold text-botanical-text mb-2">⭐ Membership Tiers</h3>
      <p className="text-sm text-botanical-muted mb-6">
        Create recurring subscription plans (e.g. VIP Barber Club: $100/mo for unlimited cuts).
      </p>

      {msg && <div className="mb-4 p-2 bg-green-900/30 border border-green-500/30 text-green-300 rounded text-sm">{msg}</div>}

      <form onSubmit={addTier} className="mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-botanical-muted mb-1">Tier Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. VIP Monthly" 
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs text-botanical-muted mb-1">Price ($)</label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="e.g. 100" 
              min="0"
              step="0.01"
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
              required 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-botanical-muted mb-1">Billing Interval</label>
            <select 
              value={interval} 
              onChange={e => setInterval(e.target.value)} 
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-botanical-muted mb-1">Description / Perks</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="e.g. Unlimited haircuts, 10% off products..." 
              rows={2}
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={saving || !name.trim() || !price} 
          className="px-4 py-2 bg-botanical-primary text-white rounded text-sm font-bold hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Tier'}
        </button>
      </form>

      <h4 className="text-botanical-text font-medium mb-3">Active Membership Tiers</h4>
      {tiers.length === 0 ? (
        <p className="text-botanical-muted text-sm py-2">No memberships created yet.</p>
      ) : (
        <div className="space-y-3">
          {tiers.map(t => (
            <div key={t.id} className="p-4 bg-botanical-surface rounded-lg border border-botanical-border shadow-sm flex flex-wrap justify-between gap-x-2 gap-y-2 items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-botanical-text font-bold text-base">{t.name}</h5>
                  <span className="text-xs bg-botanical-primary/20 text-botanical-accent px-2 py-0.5 rounded-full font-medium">
                    ${t.price} / {t.interval.toLowerCase().replace('ly', '')}
                  </span>
                </div>
                <p className="text-xs text-botanical-muted">{t.description || 'No description provided.'}</p>
              </div>
              <button 
                onClick={() => remove(t.id)} 
                className="text-red-400 hover:text-red-300 text-xs font-medium shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
