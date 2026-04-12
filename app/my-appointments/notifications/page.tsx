'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import MyAppointmentsNav from '@/components/MyAppointmentsNav';

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/my-appointments/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(setPrefs)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/my-appointments/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Failed');
      setMsg('Preferences saved!');
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <p className="text-botanical-muted animate-pulse">Loading…</p>
      </div>
    );
  }

  const togglePref = (key: string) => setPrefs({ ...prefs, [key]: !prefs[key] });

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <header className="bg-botanical-surface backdrop-blur-md border-b border-botanical-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-botanical-text">Notification Preferences</h1>
            <p className="text-xs text-botanical-muted">Control what emails and texts you receive</p>
          </div>
          <BackButton />
        </div>
        <MyAppointmentsNav />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {msg && <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/30 text-green-300 text-sm">{msg}</div>}

        <div className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl p-6 space-y-4">
          {[
            { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Get reminded 24 hours before your appointment' },
            { key: 'reviewRequests', label: 'Review Requests', desc: 'Be asked to review after your visit' },
            { key: 'promotions', label: 'Promotions & Offers', desc: 'Special deals and seasonal promotions' },
            { key: 'birthdayMessages', label: 'Birthday Messages', desc: 'Receive a special message on your birthday' },
            { key: 'loyaltyUpdates', label: 'Loyalty Updates', desc: 'Points earned, tier changes, and reward alerts' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-4 bg-botanical-surface rounded-lg cursor-pointer hover:bg-botanical-surface transition-colors">
              <div>
                <p className="text-sm text-botanical-text font-medium">{item.label}</p>
                <p className="text-xs text-botanical-muted">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={prefs?.[item.key] ?? true}
                onChange={() => togglePref(item.key)}
                className="w-5 h-5 accent-brand-gold"
              />
            </label>
          ))}

          <div className="pt-4 border-t border-botanical-border">
            <label className="block text-sm text-botanical-muted mb-2">Preferred Channel</label>
            <select
              value={prefs?.preferredChannel || 'EMAIL'}
              onChange={(e) => setPrefs({ ...prefs, preferredChannel: e.target.value })}
             
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-3 text-botanical-text focus:outline-none focus:border-brand-gold"
            >
              <option value="EMAIL">Email Only</option>
              <option value="SMS">SMS Only</option>
              <option value="BOTH">Email + SMS</option>
            </select>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50 mt-4">
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </main>
  );
}

