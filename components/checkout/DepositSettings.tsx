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
    <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 mb-6">
      <h3 className="text-lg font-bold text-white mb-1">🛡️ No-Show Deposit</h3>
      <p className="text-xs text-gray-500 mb-4">Require a card hold for new bookings. Captured if the client doesn&apos;t show up.</p>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={depositRequired} onChange={e => setDepositRequired(e.target.checked)} className="w-4 h-4 accent-brand-gold" />
          <span className="text-sm text-gray-300">Require deposit for online bookings</span>
        </label>

        {depositRequired && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deposit Amount ($)</label>
            <input
              type="number" min="0" step="0.50"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="w-48 bg-black/40 border border-white/20 rounded p-2 text-white text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-brand-gold text-brand-dark font-semibold px-6 py-2 rounded hover:bg-white transition-colors disabled:opacity-50 text-sm">
            {saving ? 'Saving…' : 'Save Deposit Settings'}
          </button>
          {msg && <span className="text-xs text-green-400">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

