'use client';;
import Image from 'next/image';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfileEditor() {
 const [profile, setProfile] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

 useEffect(() => {
 fetch('/api/my-appointments/profile')
 .then(r => r.json())
 .then(setProfile)
 .finally(() => setLoading(false));
 }, []);

 const handleSave = async () => {
 setSaving(true);
 setMsg(null);
 try {
 const res = await fetch('/api/my-appointments/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profile),
 });
 if (!res.ok) throw new Error('Failed to save');
 const updated = await res.json();
 setProfile(updated);
 setMsg({ type: 'success', text: 'Profile updated!' });
 } catch (e: any) {
 setMsg({ type: 'error', text: e.message });
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return (
 <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border rounded-2xl p-6">
 <div className="animate-pulse space-y-4">
  <div className="h-4 bg-crm-border rounded w-1/3" />
  <div className="h-10 bg-crm-border rounded" />
  <div className="h-4 bg-crm-border rounded w-1/4" />
  <div className="h-10 bg-crm-border rounded" />
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {msg && (
 <div className={`px-4 py-3 rounded-xl text-[13px] font-medium ${msg.type === 'success' ? 'bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed' : 'bg-status-cancelled/20 border border-status-cancelled/30 text-status-cancelled'}`}>
  {msg.text}
 </div>
 )}

 {/* Account Details Form */}
 <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border rounded-2xl p-6 space-y-5">
 <h3 className="text-lg font-bold text-crm-text flex items-center gap-2">
  <span>⚙️</span> Account Details
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
  <label className="block text-crm-muted mb-1.5 text-[12px] font-semibold uppercase tracking-wider">Name</label>
  <input
   type="text"
   value={profile?.name || ''}
   onChange={(e) => setProfile({ ...profile, name: e.target.value })}
   className="w-full bg-crm-surface border border-crm-border rounded-xl px-4 py-3 text-crm-text text-[14px] focus:outline-none focus:border-crm-primary/50 focus:ring-1 focus:ring-crm-primary/20 transition-colors"
  />
  </div>
  <div>
  <label className="block text-crm-muted mb-1.5 text-[12px] font-semibold uppercase tracking-wider">Email</label>
  <input
   type="email"
   value={profile?.email || ''}
   disabled
   className="w-full bg-crm-surface border border-crm-border rounded-xl px-4 py-3 text-crm-muted text-[14px] cursor-not-allowed opacity-60"
  />
  </div>
  <div>
  <label className="block text-crm-muted mb-1.5 text-[12px] font-semibold uppercase tracking-wider">Phone</label>
  <input
   type="tel"
   value={profile?.phone || ''}
   onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
   placeholder="+1 555-123-4567"
   className="w-full bg-crm-surface border border-crm-border rounded-xl px-4 py-3 text-crm-text text-[14px] placeholder-crm-muted/40 focus:outline-none focus:border-crm-primary/50 focus:ring-1 focus:ring-crm-primary/20 transition-colors"
  />
  </div>
  <div>
  <label className="block text-crm-muted mb-1.5 text-[12px] font-semibold uppercase tracking-wider">Birthday</label>
  <input
   type="date"
   value={profile?.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : ''}
   onChange={(e) => setProfile({ ...profile, birthday: e.target.value || null })}
   className="w-full bg-crm-surface border border-crm-border rounded-xl px-4 py-3 text-crm-text text-[14px] focus:outline-none focus:border-crm-primary/50 focus:ring-1 focus:ring-crm-primary/20 transition-colors"
  />
  </div>
 </div>

 <button
  onClick={handleSave}
  disabled={saving}
  className="w-full sm:w-auto bg-crm-primary text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-[14px]"
 >
  {saving ? 'Saving…' : 'Save Changes'}
 </button>
 </div>

 {/* Security */}
 <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border rounded-2xl p-6">
 <h3 className="text-lg font-bold text-crm-text flex items-center gap-2 mb-4">
  <span>🔒</span> Security
 </h3>
 <div className="flex flex-col sm:flex-row gap-3">
  <Link
  href="/update-password"
  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-crm-surface hover:bg-crm-border text-crm-text text-[13px] font-semibold rounded-xl transition-colors border border-crm-border"
  >
  Change Password
  </Link>
  <Link
  href="/my-appointments/profile/security"
  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-crm-surface hover:bg-crm-border text-crm-text text-[13px] font-semibold rounded-xl transition-colors border border-crm-border"
  >
  Security & Recovery
  </Link>
 </div>
 </div>
 </div>
 );
}
