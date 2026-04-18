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

  if (!settings) return <div className="animate-pulse text-crm-muted py-4">Loading…</div>;

  return (
    <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-5">
      <h3 className="font-bold text-crm-text text-lg font-bold">📅 Online Booking Settings</h3>
      {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

      <label className="flex items-center justify-between p-4 bg-crm-surface rounded-lg cursor-pointer text-[13px]">
        <div>
          <p className="font-medium text-crm-text text-[13px]">Enable Online Booking</p>
          <p className="text-crm-muted text-[13px]">Allow clients to book through your public portal</p>
        </div>
        <input type="checkbox" checked={settings.onlineBookingEnabled} onChange={e => upd('onlineBookingEnabled', e.target.checked)} className="w-5 h-5 accent-brand-gold" />
      </label>

      <label className="flex items-center justify-between p-4 bg-crm-surface rounded-lg cursor-pointer text-[13px]">
        <div>
          <p className="font-medium text-crm-text text-[13px]">Auto-Confirm Bookings</p>
          <p className="text-crm-muted text-[13px]">Automatically confirm new bookings without manual approval</p>
        </div>
        <input type="checkbox" checked={settings.autoConfirm} onChange={e => upd('autoConfirm', e.target.checked)} className="w-5 h-5 accent-brand-gold" />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-crm-muted block mb-1 text-[13px]">Min Advance (hours)</label>
          <input type="number" min={0} max={72} value={settings.minAdvanceHours} onChange={e => upd('minAdvanceHours', +e.target.value)}
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
          <p className="text-crm-muted mt-1 text-[13px]">Minimum hours before a booking</p>
        </div>
        <div>
          <label className="text-crm-muted block mb-1 text-[13px]">Max Advance (days)</label>
          <input type="number" min={1} max={365} value={settings.maxAdvanceDays} onChange={e => upd('maxAdvanceDays', +e.target.value)}
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
          <p className="text-crm-muted mt-1 text-[13px]">How far ahead clients can book</p>
        </div>
        <div>
          <label className="text-crm-muted block mb-1 text-[13px]">Buffer Between Appts (mins)</label>
          <input type="number" min={0} max={60} step={5} value={settings.bufferBetweenAppointments} onChange={e => upd('bufferBetweenAppointments', +e.target.value)}
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
          <p className="text-crm-muted mt-1 text-[13px]">Cleaning / prep time between bookings</p>
        </div>
      </div>

      <div>
        <label className="text-crm-muted block mb-1 text-[13px]">Cancellation Window (hours)</label>
        <input type="number" min={0} max={168} value={settings.cancellationWindowHours} onChange={e => upd('cancellationWindowHours', +e.target.value)}
          className="w-full md:w-48 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
        <p className="text-crm-muted mt-1 text-[13px]">Clients cannot cancel within this window before their appointment</p>
      </div>

      <div>
        <label className="text-crm-muted block mb-1 text-[13px]">Cancellation Policy Text</label>
        <textarea rows={3} value={settings.cancellationPolicy} onChange={e => upd('cancellationPolicy', e.target.value)}
          placeholder="e.g. Cancellations must be made at least 24 hours in advance. Late cancellations may incur a fee."
          className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
        <p className="text-crm-muted mt-1 text-[13px]">Displayed on the booking portal and confirmation emails</p>
      </div>

      <div className="border-t border-crm-border pt-6 mt-6">
        <h4 className="font-bold text-crm-text text-md mb-4 flex items-center gap-2">
          ⚡ Dynamic / Surge Pricing
          <span className="bg-brand-gold/10 text-brand-gold text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Pro</span>
        </h4>
        <label className="flex items-center justify-between p-4 bg-crm-surface rounded-lg cursor-pointer text-[13px] border border-crm-border mb-4">
          <div>
            <p className="font-medium text-crm-text text-[13px]">Enable Peak Hours Pricing</p>
            <p className="text-crm-muted text-[13px]">Automatically increase service prices during busy hours</p>
          </div>
          <input type="checkbox" checked={settings.surgePricingEnabled} onChange={e => upd('surgePricingEnabled', e.target.checked)} className="w-5 h-5 accent-brand-gold" />
        </label>
        
        {settings.surgePricingEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-crm-surface border border-crm-border rounded-lg">
            <div>
              <label className="text-crm-muted block mb-1 text-[13px]">Price Multiplier</label>
              <select value={settings.surgeMultiplier} onChange={e => upd('surgeMultiplier', parseFloat(e.target.value))} className="w-full bg-crm-background border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold">
                <option value={1.1}>+10%</option>
                <option value={1.2}>+20%</option>
                <option value={1.25}>+25%</option>
                <option value={1.5}>+50%</option>
              </select>
            </div>
            <div>
              <label className="text-crm-muted block mb-1 text-[13px]">Peak Start Time</label>
              <input type="time" value={settings.surgeStartHour} onChange={e => upd('surgeStartHour', e.target.value)} className="w-full bg-crm-background border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
            </div>
            <div>
              <label className="text-crm-muted block mb-1 text-[13px]">Peak End Time</label>
              <input type="time" value={settings.surgeEndHour} onChange={e => upd('surgeEndHour', e.target.value)} className="w-full bg-crm-background border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-crm-border pt-6 mt-6">
        <h4 className="font-bold text-crm-text text-md mb-4 flex items-center gap-2">
          🤖 AI Virtual Receptionist
          <span className="bg-brand-gold/10 text-brand-gold text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Pro</span>
        </h4>
        <label className="flex items-center justify-between p-4 bg-crm-surface rounded-lg cursor-pointer text-[13px] border border-crm-border mb-4">
          <div>
            <p className="font-medium text-crm-text text-[13px]">Enable SMS Auto-Replies</p>
            <p className="text-crm-muted text-[13px]">Use AI to answer client questions about hours, location, and services</p>
          </div>
          <input type="checkbox" checked={settings.aiReceptionistEnabled} onChange={e => upd('aiReceptionistEnabled', e.target.checked)} className="w-5 h-5 accent-brand-gold" />
        </label>

        {settings.aiReceptionistEnabled && (
          <div className="p-4 bg-crm-surface border border-crm-border rounded-lg space-y-4">
            <div>
              <label className="text-crm-muted block mb-1 text-[13px]">AI Persona / Prompt</label>
              <textarea rows={3} value={settings.aiReceptionistPrompt} onChange={e => upd('aiReceptionistPrompt', e.target.value)}
                placeholder="You are a helpful AI receptionist..."
                className="w-full bg-crm-background border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
              <p className="text-crm-muted mt-1 text-[11px]">Tell your AI how it should behave and talk to clients.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer text-[13px]">
              <input type="checkbox" checked={settings.autoFillWaitlist} onChange={e => upd('autoFillWaitlist', e.target.checked)} className="w-4 h-4 accent-brand-gold" />
              <span className="text-crm-text">Auto-offer Waitlist spots when fully booked</span>
            </label>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Booking Settings'}
      </button>
    </div>
  );
}

