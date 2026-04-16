'use client';

import { useState } from 'react';

export default function DepositSettings({
  shopId,
  initialRequired,
  initialAmount,
}: {
  shopId: string;
  initialRequired: boolean;
  initialAmount: number;
}) {
  const [depositRequired, setDepositRequired] = useState(initialRequired);
  const [depositAmount, setDepositAmount] = useState(initialAmount.toString());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositRequired, depositAmount: parseFloat(depositAmount) || 0 }),
      });
      if (res.ok) setMsg('Saved!');
      else throw new Error('Failed');
    } catch { setMsg('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-crm-surface p-6 rounded-lg border border-crm-border shadow-sm mb-6">
      <h3 className="font-bold text-crm-text mb-1 text-2xl md:text-3xl">🛡️ No-Show Deposit</h3>
      <p className="text-crm-muted mb-4 text-base md:text-lg">Require a card hold for new bookings. Captured if the client doesn&apos;t show up.</p>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer text-sm">
          <input type="checkbox" checked={depositRequired} onChange={e => setDepositRequired(e.target.checked)} className="w-4 h-4 accent-brand-gold" />
          <span className="text-sm text-crm-muted">Require deposit for online bookings</span>
        </label>

        {depositRequired && (
          <div>
            <label className="block text-crm-muted mb-1 text-sm">Deposit Amount ($)</label>
            <input
              type="number" min="0" step="0.50"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="w-48 bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-crm-primary text-white font-semibold px-6 py-2 rounded hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50 text-sm">
            {saving ? 'Saving…' : 'Save Deposit Settings'}
          </button>
          {msg && <span className="text-xs text-status-confirmed">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

