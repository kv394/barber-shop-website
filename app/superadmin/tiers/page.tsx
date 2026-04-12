'use client';

import { useState, useEffect } from 'react';

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

export default function SuperAdminTiersPage() {
  const [tiers, setTiers] = useState<SaaSTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/superadmin/tiers')
      .then(res => res.json())
      .then(data => {
        setTiers(data || []);
        setLoading(false);
      });
  }, []);

  const handleUpdate = (index: number, field: keyof SaaSTier, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/superadmin/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tiers)
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('Tiers updated successfully!');
    } catch (error) {
      alert('Error saving tiers');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-botanical-muted">Loading pricing tiers...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-botanical-accent mb-2">SaaS Pricing Tiers</h1>
          <p className="text-botanical-muted">Manage limits and base fees for subscription packages.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-botanical-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {tiers.map((tier, index) => (
          <div key={tier.id} className="bg-botanical-surface p-6 rounded-xl border-2 border-b-[6px] border-botanical-border">
            <div className="flex gap-4 items-center mb-4 pb-4 border-b border-botanical-border">
              <input
                type="text"
                value={tier.name}
                onChange={e => handleUpdate(index, 'name', e.target.value)}
                className="bg-transparent text-xl font-bold text-botanical-text border-b border-transparent hover:border-brand-gold focus:border-brand-gold outline-none w-48"
              />
              <span className="text-botanical-muted text-sm flex-1">{tier.id}</span>
              <div className="flex items-center gap-2">
                <span className="text-botanical-muted font-bold">$</span>
                <input
                  type="number"
                  value={tier.baseFeeUSD}
                  onChange={e => handleUpdate(index, 'baseFeeUSD', e.target.value)}
                  className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-1 w-20 text-botanical-text font-mono text-center outline-none focus:border-brand-gold"
                />
                <span className="text-botanical-muted text-sm">/mo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-botanical-accent uppercase tracking-wider mb-1 font-bold">Max Appointments</label>
                <input
                  type="number"
                  value={tier.maxAppointments}
                  onChange={e => handleUpdate(index, 'maxAppointments', e.target.value)}
                  className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm outline-none focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-botanical-accent uppercase tracking-wider mb-1 font-bold">Max Users</label>
                <input
                  type="number"
                  value={tier.maxUsers}
                  onChange={e => handleUpdate(index, 'maxUsers', e.target.value)}
                  className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm outline-none focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-botanical-accent uppercase tracking-wider mb-1 font-bold">Max Intake Forms</label>
                <input
                  type="number"
                  value={tier.maxFormSubmissions}
                  onChange={e => handleUpdate(index, 'maxFormSubmissions', e.target.value)}
                  className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm outline-none focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-botanical-accent uppercase tracking-wider mb-1 font-bold">Storage Limit (MB)</label>
                <input
                  type="number"
                  value={tier.storageLimitMB}
                  onChange={e => handleUpdate(index, 'storageLimitMB', e.target.value)}
                  className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm outline-none focus:border-brand-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-botanical-accent uppercase tracking-wider mb-1 font-bold">Overage Fee (per 100MB)</label>
                <div className="relative">
                  <span className="absolute left-2 top-2 text-botanical-muted">$</span>
                  <input
                    type="number"
                    value={tier.overageFeePer100MB}
                    onChange={e => handleUpdate(index, 'overageFeePer100MB', e.target.value)}
                    className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 pl-6 text-botanical-text text-sm outline-none focus:border-brand-gold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-botanical-muted mb-1">Marketing Description</label>
              <input
                type="text"
                value={tier.description || ''}
                onChange={e => handleUpdate(index, 'description', e.target.value)}
                className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-muted text-sm outline-none focus:border-brand-gold"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
