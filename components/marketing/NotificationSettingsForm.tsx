'use client';
import { useEffect, useState } from 'react';

export default function NotificationSettingsForm({ shopId }: { shopId: string }) {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/shops/${shopId}/notification-settings`)
      .then(r => r.json())
      .then(setSettings)
      .catch(err => console.error("Failed to load settings:", err));
  }, [shopId]);

  const updateSetting = (k: string, v: any) => setSettings((x: any) => ({ ...x, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/shops/${shopId}/notification-settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      });
      setMsg('Notification settings saved!');
    } catch (error) {
      setMsg('Failed to save settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  if (!settings) return <div className="animate-pulse text-crm-muted py-4">Loading…</div>;

  const Toggle = ({ label, desc, k }: { label: string; desc: string; k: string }) => (
    <label className="flex items-center justify-between p-4 bg-crm-surface rounded-lg cursor-pointer hover:bg-crm-surface transition text-[13px]">
      <div><p className="font-medium text-crm-text text-[13px]">{label}</p><p className="text-crm-muted text-[13px]">{desc}</p></div>
      <input type="checkbox" checked={!!settings[k]} onChange={e => updateSetting(k, e.target.checked)} className="w-5 h-5 accent-brand-gold" />
    </label>
  );

  return (
    <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-4">
      <p className="text-crm-muted text-[13px]">Configure automated messages sent to clients and staff.</p>
      {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

      <div className="space-y-2">
        <p className="text-crm-muted uppercase tracking-widest font-semibold pt-2 text-[11px]">Client Notifications</p>
        <Toggle k="appointmentReminders" label="Appointment Reminders" desc="Send reminders before upcoming appointments" />
      {settings.appointmentReminders && (
          <div className="ml-4 flex gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-crm-muted cursor-pointer text-[13px]">
            <input type="checkbox" checked={!!settings.reminder24h} onChange={e => updateSetting('reminder24h', e.target.checked)} className="accent-brand-gold" /> 24 hours before
            </label>
            <label className="flex items-center gap-2 text-crm-muted cursor-pointer text-[13px]">
            <input type="checkbox" checked={!!settings.reminder1h} onChange={e => updateSetting('reminder1h', e.target.checked)} className="accent-brand-gold" /> 1 hour before
            </label>
          </div>
        )}
        <Toggle k="reviewRequests" label="Review Requests" desc="Automatically ask clients to leave a review after their visit" />
      {settings.reviewRequests && (
          <div className="ml-4 flex items-center gap-2">
            <span className="text-[13px] text-crm-muted">Send</span>
          <input type="number" min={1} max={48} value={settings.reviewRequestDelayH} onChange={e => updateSetting('reviewRequestDelayH', +e.target.value)}
              className="w-16 bg-crm-surface border border-crm-border shadow-sm rounded px-2 py-1 text-crm-text text-[13px] focus:outline-none" />
            <span className="text-[13px] text-crm-muted">hours after appointment</span>
          </div>
        )}
        <Toggle k="birthdayMessages" label="Birthday Messages" desc="Send a special message on the client's birthday" />
        <Toggle k="loyaltyUpdates" label="Loyalty Updates" desc="Notify clients when they earn points, change tiers, or have rewards to redeem" />
      </div>

      <div className="space-y-2">
        <p className="text-crm-muted uppercase tracking-widest font-semibold pt-2 text-[11px]">Admin Alerts</p>
        <Toggle k="newBookingAlert" label="New Booking Alert" desc="Notify admin when a client books online" />
        <Toggle k="cancellationAlert" label="Cancellation Alert" desc="Notify admin when a client cancels" />
        <Toggle k="noShowAlerts" label="No-Show Alerts" desc="Notify admin when a client doesn't show up" />
      </div>

      <div className="space-y-3">
        <p className="text-crm-muted uppercase tracking-widest font-semibold pt-2 text-[11px]">Delivery Channel</p>
        <div>
          <label className="text-crm-muted block mb-1 text-[13px]">Default Channel</label>
        <select value={settings.channel} onChange={e => updateSetting('channel', e.target.value)}
            className="w-full md:w-48 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none">
            <option value="EMAIL">Email Only</option>
            <option value="SMS">SMS Only</option>
            <option value="BOTH">Email + SMS</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-crm-muted block mb-1 text-[13px]">Admin Alert Email</label>
          <input type="email" value={settings.adminEmail} onChange={e => updateSetting('adminEmail', e.target.value)} placeholder="admin@yourshop.com"
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="text-crm-muted block mb-1 text-[13px]">Admin Alert Phone (SMS)</label>
          <input type="tel" value={settings.adminPhone} onChange={e => updateSetting('adminPhone', e.target.value)} placeholder="+1 (404) 555-0100"
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50">
        {saving ? 'Saving…' : 'Save Notification Settings'}
      </button>
    </div>
  );
}
