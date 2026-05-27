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
 <p className="text-crm-muted animate-pulse text-[13px]">Loading…</p>
 </div>
 );
 }

 const togglePref = (key: string) => setPrefs({ ...prefs, [key]: !prefs[key] });

 return (
 <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
 

 <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
 {msg && <div className="mb-4 p-3 rounded-lg bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed text-[13px]">{msg}</div>}

 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-4">
 {[
 { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Get reminded 24 hours before your appointment' },
 { key: 'reviewRequests', label: 'Review Requests', desc: 'Be asked to review after your visit' },
 { key: 'promotions', label: 'Promotions & Offers', desc: 'Special deals and seasonal promotions' },
 { key: 'birthdayMessages', label: 'Birthday Messages', desc: 'Receive a special message on your birthday' },
 { key: 'loyaltyUpdates', label: 'Loyalty Updates', desc: 'Points earned, tier changes, and reward alerts' },
 ].map(item => (
 <label key={item.key} className="flex items-center justify-between p-4 bg-crm-surface rounded-lg cursor-pointer hover:bg-crm-surface transition-colors text-[13px]">
 <div>
 <p className="text-crm-text font-medium text-[13px]">{item.label}</p>
 <p className="text-crm-muted text-[13px]">{item.desc}</p>
 </div>
 <input
 type="checkbox"
 checked={prefs?.[item.key] ?? true}
 onChange={() => togglePref(item.key)}
 className="w-5 h-5 accent-brand-gold"
 />
 </label>
 ))}

 <div className="pt-4 border-t border-crm-border">
 <label className="block text-crm-muted mb-2 text-[13px]">Preferred Channel</label>
 <select
 value={prefs?.preferredChannel || 'EMAIL'}
 onChange={(e) => setPrefs({ ...prefs, preferredChannel: e.target.value })}
 
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-text focus:outline-none focus:border-brand-gold"
 >
 <option value="EMAIL">Email Only</option>
 <option value="SMS">SMS Only</option>
 <option value="BOTH">Email + SMS</option>
 </select>
 </div>

 <button onClick={handleSave} disabled={saving} className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50 mt-4">
 {saving ? 'Saving…' : 'Save Preferences'}
 </button>
 </div>
 </div>
 </main>
 );
}

