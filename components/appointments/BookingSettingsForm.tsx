'use client';
import { useEffect, useState } from 'react';

export default function BookingSettingsForm({ shopId }: { shopId: string }) {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/shops/${shopId}/booking-settings`).then(r => r.json()).then(setSettings);
  }, [shopId]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/shops/${shopId}/booking-settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    });
    setMsg('Booking settings saved!');
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const upd = (k: string, v: any) => setSettings((s: any) => ({ ...s, [k]: v }));

  if (!settings) return <div className="animate-pulse text-botanical-muted py-4">Loading…</div>;

  return (
    <div className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl p-6 space-y-5">
      <h3 className="font-bold text-botanical-text text-2xl md:text-3xl">📅 Online Booking Settings</h3>
      {msg && <div className="p-3 bg-green-900/30 border border-green-500/30 text-green-300 rounded-lg text-sm">{msg}</div>}

      <label className="flex items-center justify-between p-4 bg-botanical-surface rounded-lg cursor-pointer text-sm">
        <div>
          <p className="font-medium text-botanical-text text-base md:text-lg">Enable Online Booking</p>
          <p className="text-botanical-muted text-base md:text-lg">Allow clients to book through your public portal</p>
        </div>
        <input type="checkbox" checked={settings.onlineBookingEnabled} onChange={e => upd('onlineBookingEnabled', e.target.checked)} className="w-5 h-5 accent-brand-gold" />
      </label>

      <label className="flex items-center justify-between p-4 bg-botanical-surface rounded-lg cursor-pointer text-sm">
        <div>
          <p className="font-medium text-botanical-text text-base md:text-lg">Auto-Confirm Bookings</p>
          <p className="text-botanical-muted text-base md:text-lg">Automatically confirm new bookings without manual approval</p>
        </div>
        <input type="checkbox" checked={settings.autoConfirm} onChange={e => upd('autoConfirm', e.target.checked)} className="w-5 h-5 accent-brand-gold" />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-botanical-muted block mb-1 text-sm">Min Advance (hours)</label>
          <input type="number" min={0} max={72} value={settings.minAdvanceHours} onChange={e => upd('minAdvanceHours', +e.target.value)}
            className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
          <p className="text-botanical-muted mt-1 text-base md:text-lg">Minimum hours before a booking</p>
        </div>
        <div>
          <label className="text-botanical-muted block mb-1 text-sm">Max Advance (days)</label>
          <input type="number" min={1} max={365} value={settings.maxAdvanceDays} onChange={e => upd('maxAdvanceDays', +e.target.value)}
            className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
          <p className="text-botanical-muted mt-1 text-base md:text-lg">How far ahead clients can book</p>
        </div>
        <div>
          <label className="text-botanical-muted block mb-1 text-sm">Buffer Between Appts (mins)</label>
          <input type="number" min={0} max={60} step={5} value={settings.bufferBetweenAppointments} onChange={e => upd('bufferBetweenAppointments', +e.target.value)}
            className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
          <p className="text-botanical-muted mt-1 text-base md:text-lg">Cleaning / prep time between bookings</p>
        </div>
      </div>

      <div>
        <label className="text-botanical-muted block mb-1 text-sm">Cancellation Window (hours)</label>
        <input type="number" min={0} max={168} value={settings.cancellationWindowHours} onChange={e => upd('cancellationWindowHours', +e.target.value)}
          className="w-full md:w-48 bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
        <p className="text-botanical-muted mt-1 text-base md:text-lg">Clients cannot cancel within this window before their appointment</p>
      </div>

      <div>
        <label className="text-botanical-muted block mb-1 text-sm">Cancellation Policy Text</label>
        <textarea rows={3} value={settings.cancellationPolicy} onChange={e => upd('cancellationPolicy', e.target.value)}
          placeholder="e.g. Cancellations must be made at least 24 hours in advance. Late cancellations may incur a fee."
          className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
        <p className="text-botanical-muted mt-1 text-base md:text-lg">Displayed on the booking portal and confirmation emails</p>
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Booking Settings'}
      </button>
    </div>
  );
}

