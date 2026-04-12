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
    <div className="bg-botanical-surface p-6 rounded-lg border-2 border-b-[6px] border-botanical-border mb-6">
      <h3 className="text-lg font-bold text-botanical-text mb-1">🛡️ No-Show Deposit</h3>
      <p className="text-xs text-botanical-muted mb-4">Require a card hold for new bookings. Captured if the client doesn&apos;t show up.</p>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={depositRequired} onChange={e => setDepositRequired(e.target.checked)} className="w-4 h-4 accent-brand-gold" />
          <span className="text-sm text-botanical-muted">Require deposit for online bookings</span>
        </label>

        {depositRequired && (
          <div>
            <label className="block text-xs text-botanical-muted mb-1">Deposit Amount ($)</label>
            <input
              type="number" min="0" step="0.50"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="w-48 bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-botanical-primary text-white font-semibold px-6 py-2 rounded hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50 text-sm">
            {saving ? 'Saving…' : 'Save Deposit Settings'}
          </button>
          {msg && <span className="text-xs text-green-400">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

