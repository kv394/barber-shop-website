'use client';
import { useEffect, useState } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const REASONS = ['Public Holiday','Shop Maintenance','Staff Training','Special Event','Personal','Other'];

export default function BlackoutDatesManager({ shopId }: { shopId: string }) {
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => fetch(`/api/shops/${shopId}/blackout-dates`).then(r => r.json())
    .then(d => setDates(d.dates || [])).finally(() => setLoading(false));

  useEffect(() => { load(); }, [shopId]);

  const addDate = async () => {
    if (!newDate) return;
    setAdding(true);
    await fetch(`/api/shops/${shopId}/blackout-dates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, reason: newReason }),
    });
    setNewDate(''); setNewReason('');
    setMsg('Blackout date added!');
    await load();
    setAdding(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const remove = async (id: string) => {
    await fetch(`/api/shops/${shopId}/blackout-dates?id=${id}`, { method: 'DELETE' });
    setDates(prev => prev.filter(d => d.id !== id));
  };

  const fmt = (d: string) => {
    const dt = new Date(d);
    return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
  };

  // Group upcoming vs past
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = dates.filter(d => new Date(d.date) >= today);
  const past = dates.filter(d => new Date(d.date) < today);

  return (
    <div className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl p-6 space-y-5">
      <h3 className="font-bold text-botanical-text text-2xl md:text-3xl">🚫 Blackout Dates & Holidays</h3>
      <p className="text-botanical-muted text-base md:text-lg">Mark days when your shop is closed. Online booking will be disabled for these dates.</p>
      {msg && <div className="p-3 bg-green-900/30 border border-green-500/30 text-green-300 rounded-lg text-sm">{msg}</div>}

      {/* Add form */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold flex-shrink-0" />
        <select value={newReason} onChange={e => setNewReason(e.target.value)}
          className="flex-1 bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold">
          <option value="">Select reason (optional)</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={addDate} disabled={!newDate || adding}
          className="px-4 py-2 bg-botanical-primary text-white rounded-lg text-sm font-bold disabled:opacity-50 flex-shrink-0">
          {adding ? 'Adding…' : '+ Add Date'}
        </button>
      </div>

      {loading && <div className="text-botanical-muted animate-pulse text-sm">Loading…</div>}

      {/* Upcoming dates */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-botanical-muted uppercase tracking-widest mb-2 text-base md:text-lg">Upcoming ({upcoming.length})</p>
          <div className="space-y-2">
            {upcoming.map(d => {
              const dt = new Date(d.date);
              const dayName = dt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
              return (
                <div key={d.id} className="flex items-center justify-between p-3 bg-botanical-surface rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-900/40 border border-red-500/30 flex flex-col items-center justify-center">
                      <span className="text-red-300 text-xs font-bold leading-none">{MONTHS[dt.getUTCMonth()]}</span>
                      <span className="text-red-200 text-base font-black leading-none">{dt.getUTCDate()}</span>
                    </div>
                    <div>
                      <p className="text-botanical-text font-medium text-base md:text-lg">{fmt(d.date)}</p>
                      <p className="text-botanical-muted text-base md:text-lg">{dayName}{d.reason ? ` · ${d.reason}` : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => remove(d.id)} className="text-botanical-muted hover:text-red-400 text-lg transition">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcoming.length === 0 && !loading && (
        <p className="text-botanical-muted italic text-center py-4 text-base md:text-lg">No upcoming blackout dates. Add holidays or closures above.</p>
      )}

      {/* Past dates (collapsed) */}
      {past.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-botanical-muted hover:text-botanical-muted">Past dates ({past.length})</summary>
          <div className="mt-2 space-y-1">
            {past.map(d => (
              <div key={d.id} className="flex items-center justify-between px-3 py-2 text-botanical-muted text-xs">
                <span>{fmt(d.date)}{d.reason ? ` — ${d.reason}` : ''}</span>
                <button onClick={() => remove(d.id)} className="hover:text-red-400 ml-2">×</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

