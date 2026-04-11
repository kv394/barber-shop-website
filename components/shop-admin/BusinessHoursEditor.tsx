'use client';
import { useEffect, useState } from 'react';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS: Record<string, string> = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };
const TIMES = Array.from({ length: 27 }, (_, i) => {
  const h = Math.floor((i * 30 + 8 * 60) / 60);
  const m = (i * 30 + 8 * 60) % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}).filter(t => t <= '22:00');

type DayHours = { open: string; close: string } | null;
type WeekHours = Record<typeof DAYS[number], DayHours>;

const DEFAULT: WeekHours = {
  monday: { open: '09:00', close: '18:00' }, tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' }, thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' }, saturday: { open: '09:00', close: '15:00' }, sunday: null,
};

export default function BusinessHoursEditor({ shopId }: { shopId: string }) {
  const [hours, setHours] = useState<WeekHours>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${shopId}/business-hours`).then(r => r.json()).then(d => { setHours(d); setLoading(false); });
  }, [shopId]);

  const toggle = (day: typeof DAYS[number]) =>
    setHours(h => ({ ...h, [day]: h[day] ? null : { open: '09:00', close: '18:00' } }));

  const setField = (day: typeof DAYS[number], field: 'open' | 'close', val: string) =>
    setHours(h => ({ ...h, [day]: { ...(h[day] || { open:'09:00', close:'18:00' }), [field]: val } }));

  const save = async () => {
    setSaving(true);
    await fetch(`/api/shops/${shopId}/business-hours`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hours),
    });
    setMsg('Business hours saved!');
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  if (loading) return <div className="animate-pulse text-botanical-muted py-4">Loading hours…</div>;

  return (
    <div className="bg-botanical-surface border border-botanical-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-botanical-text mb-1">🕐 Business Hours</h3>
      <p className="text-botanical-muted text-sm mb-5">Set your shop's open and close times per day. Toggle a day off to mark it as closed.</p>
      {msg && <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 text-green-300 rounded-lg text-sm">{msg}</div>}
      <div className="space-y-3">
        {DAYS.map(day => {
          const open = !!hours[day];
          const dh = hours[day];
          return (
            <div key={day} className={`flex items-center gap-3 p-3 rounded-lg transition ${open ? 'bg-botanical-surface' : 'bg-botanical-surface opacity-60'}`}>
              <button onClick={() => toggle(day)} className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${open ? 'bg-botanical-primary' : 'bg-botanical-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${open ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="w-10 text-sm font-semibold text-botanical-text">{DAY_LABELS[day]}</span>
              {open && dh ? (
                <>
                  <select value={dh.open} onChange={e => setField(day, 'open', e.target.value)}
                    className="bg-botanical-surface border border-botanical-border rounded text-botanical-text text-sm px-2 py-1.5 focus:outline-none focus:border-brand-gold">
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-botanical-muted text-sm">to</span>
                  <select value={dh.close} onChange={e => setField(day, 'close', e.target.value)}
                    className="bg-botanical-surface border border-botanical-border rounded text-botanical-text text-sm px-2 py-1.5 focus:outline-none focus:border-brand-gold">
                    {TIMES.filter(t => t > dh.open).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </>
              ) : (
                <span className="text-botanical-muted text-sm italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={save} disabled={saving} className="mt-5 w-full bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-white transition disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Business Hours'}
      </button>
    </div>
  );
}

