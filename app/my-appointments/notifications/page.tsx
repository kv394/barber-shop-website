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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  const togglePref = (key: string) => setPrefs({ ...prefs, [key]: !prefs[key] });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-black/40 backdrop-blur-md border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Notification Preferences</h1>
            <p className="text-xs text-gray-500">Control what emails and texts you receive</p>
          </div>
          <BackButton />
        </div>
        <MyAppointmentsNav />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {msg && <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/30 text-green-300 text-sm">{msg}</div>}

        <div className="bg-slate-800/60 border border-white/5 rounded-xl p-6 space-y-4">
          {[
            { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Get reminded 24 hours before your appointment' },
            { key: 'reviewRequests', label: 'Review Requests', desc: 'Be asked to review after your visit' },
            { key: 'promotions', label: 'Promotions & Offers', desc: 'Special deals and seasonal promotions' },
            { key: 'birthdayMessages', label: 'Birthday Messages', desc: 'Receive a special message on your birthday' },
            { key: 'loyaltyUpdates', label: 'Loyalty Updates', desc: 'Points earned, tier changes, and reward alerts' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-4 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors">
              <div>
                <p className="text-sm text-white font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={prefs?.[item.key] ?? true}
                onChange={() => togglePref(item.key)}
                className="w-5 h-5 accent-brand-gold"
              />
            </label>
          ))}

          <div className="pt-4 border-t border-white/10">
            <label className="block text-sm text-gray-400 mb-2">Preferred Channel</label>
            <select
              value={prefs?.preferredChannel || 'EMAIL'}
              onChange={(e) => setPrefs({ ...prefs, preferredChannel: e.target.value })}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:outline-none focus:border-brand-gold"
            >
              <option value="EMAIL">Email Only</option>
              <option value="SMS">SMS Only</option>
              <option value="BOTH">Email + SMS</option>
            </select>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 mt-4">
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </main>
  );
}

