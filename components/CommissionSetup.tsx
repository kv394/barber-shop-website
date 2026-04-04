'use client';
import { useEffect, useState } from 'react';

export default function CommissionSetup({ shopId }: { shopId: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [rules, setRules] = useState<Record<string, { svc: number; product: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/shops/${shopId}/staff`).then(r => r.json()),
      fetch(`/api/shops/${shopId}/commissions`).then(r => r.json()),
    ]).then(([staffData, commData]) => {
      const members = staffData.staff || staffData || [];
      setStaff(members);
      const map: Record<string, { svc: number; product: number }> = {};
      members.forEach((s: any) => {
        const rule = (commData.rules || commData || []).find((r: any) => r.staffId === s.id && !r.serviceId);
        map[s.id] = {
          svc:     s.commissionRateService ?? rule?.rateValue ?? 50,
          product: s.commissionRateProduct ?? 10,
        };
      });
      setRules(map);
    });
  }, [shopId]);

  const save = async (staffId: string) => {
    setSaving(staffId);
    await fetch(`/api/shops/${shopId}/staff/${staffId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionRateService: rules[staffId].svc, commissionRateProduct: rules[staffId].product }),
    });
    setMsg('Saved!');
    setSaving(null);
    setTimeout(() => setMsg(''), 2000);
  };

  if (!staff.length) return <div className="animate-pulse text-gray-500 py-4">Loading staff…</div>;

  return (
    <div className="bg-slate-800/60 border border-white/5 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">💼 Commission Rates</h3>
      <p className="text-gray-400 text-sm">Set service and retail product commission rates per staff member.</p>
      {msg && <div className="p-2 bg-green-900/30 border border-green-500/30 text-green-300 rounded text-sm">{msg}</div>}
      <div className="space-y-3">
        {staff.map((s: any) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4 bg-black/20 rounded-lg">
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm">
                {(s.name || 'S')[0]}
              </div>
              <span className="text-white text-sm font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Services</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={100} value={rules[s.id]?.svc ?? 50}
                  onChange={e => setRules(r => ({ ...r, [s.id]: { ...r[s.id], svc: +e.target.value } }))}
                  className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Products</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={100} value={rules[s.id]?.product ?? 10}
                  onChange={e => setRules(r => ({ ...r, [s.id]: { ...r[s.id], product: +e.target.value } }))}
                  className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            <button onClick={() => save(s.id)} disabled={saving === s.id}
              className="ml-auto px-3 py-1.5 bg-brand-gold/20 text-brand-gold border border-brand-gold/30 rounded text-xs font-semibold hover:bg-brand-gold hover:text-black transition disabled:opacity-50">
              {saving === s.id ? '…' : 'Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

