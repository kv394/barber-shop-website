'use client';
import { useEffect, useState } from 'react';

export default function CommissionSetup({ shopId }: { shopId: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [rules, setRules] = useState<Record<string, { svc: number; product: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cb = Date.now();
    Promise.all([
      fetch(`/api/shops/${shopId}/staff?_cb=${cb}`).then(r => r.json()),
      fetch(`/api/shops/${shopId}/commissions?_cb=${cb}`).then(r => r.json()),
    ]).then(([staffData, commData]) => {
      const members = Array.isArray(staffData.staff) ? staffData.staff : Array.isArray(staffData) ? staffData : [];
      const rulesArray = Array.isArray(commData?.rules) ? commData.rules : Array.isArray(commData) ? commData : [];
      
      console.log('CommissionSetup debug:', { shopId, staffData, commData, members, rulesArray });

      const map: Record<string, { svc: number; product: number }> = {};
      members.forEach((s: any) => {
        const rule = rulesArray.find((r: any) => r.staffId === s.id && !r.serviceId);
        map[s.id] = {
          svc:     s.commissionRateService ?? rule?.rateValue ?? 50,
          product: s.commissionRateProduct ?? 10,
        };
      });
      setRules(map);
      setStaff(members);
    }).finally(() => {
      setLoading(false);
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

  if (loading) return <div className="animate-pulse text-botanical-muted py-4">Loading staff…</div>;
  if (!staff.length && !loading) return <div className="text-botanical-muted py-4">No staff members found. Add staff to set commissions.</div>;

  return (
    <div className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-botanical-text">💼 Commission Rates</h3>
      <p className="text-botanical-muted text-sm">Set service and retail product commission rates per staff member.</p>
      {msg && <div className="p-2 bg-green-900/30 border border-green-500/30 text-green-300 rounded text-sm">{msg}</div>}
      <div className="space-y-3">
        {staff.map((s: any) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4 bg-botanical-surface rounded-lg">
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="w-8 h-8 rounded-full bg-botanical-primary/20 text-botanical-accent flex items-center justify-center font-bold text-sm">
                {(s.name || 'S')[0]}
              </div>
              <span className="text-botanical-text text-sm font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-botanical-muted">Services</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={100} value={rules[s.id]?.svc ?? 50}
                  onChange={e => setRules(r => ({ ...r, [s.id]: { ...r[s.id], svc: +e.target.value } }))}
                  className="w-16 bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded px-2 py-1.5 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
                <span className="text-botanical-muted text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-botanical-muted">Products</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={100} value={rules[s.id]?.product ?? 10}
                  onChange={e => setRules(r => ({ ...r, [s.id]: { ...r[s.id], product: +e.target.value } }))}
                  className="w-16 bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded px-2 py-1.5 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
                <span className="text-botanical-muted text-sm">%</span>
              </div>
            </div>
            <button onClick={() => save(s.id)} disabled={saving === s.id}
              className="ml-auto px-3 py-1.5 bg-botanical-primary text-white transition disabled:opacity-50">
              {saving === s.id ? '…' : 'Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

