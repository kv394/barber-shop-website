'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import MyAppointmentsNav from '@/components/MyAppointmentsNav';

function ProfileContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(
    searchParams.get('message') ? { type: 'success', text: searchParams.get('message') as string } : null
  );

  useEffect(() => {
    fetch('/api/my-appointments/profile')
      .then(r => r.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

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
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <p className="text-gray-400 animate-pulse">Loading profile…</p>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <header className="bg-black/40 backdrop-blur-md border-b border-slate-700 sticky top-0 z-20 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">My Profile</h1>
            <p className="text-xs text-gray-500">Update your personal information</p>
          </div>
          
          {profile?.role === 'SUPER_ADMIN' ? (
            <Link href="/superadmin" className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
              Back to Superadmin
            </Link>
          ) : profile?.shopId && (profile?.role === 'SHOP_ADMIN' || profile?.role === 'STAFF') ? (
            <Link href={`/shop/${profile.shopId}`} className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
              Back to Dashboard
            </Link>
          ) : null}
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-2 flex gap-4 overflow-x-auto scrollbar-none">
          <Link href="/my-appointments" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">📅 Appointments</Link>
          <Link href="/my-appointments/profile" className="text-sm text-brand-gold border-b-2 border-brand-gold px-1 pb-1 font-semibold whitespace-nowrap">👤 Profile</Link>
          <Link href="/my-appointments/loyalty" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">⭐ Loyalty</Link>
          <Link href="/my-appointments/notifications" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">🔔 Notifications</Link>
          <Link href="/my-appointments/referrals" className="text-sm text-gray-400 hover:text-white px-1 pb-1 whitespace-nowrap transition-colors">🔗 Referrals</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-900/30 border border-green-500/30 text-green-300' : 'bg-red-900/30 border border-red-500/30 text-red-300'}`}>
            {msg.text}
          </div>
        )}

        <div className="bg-slate-800/60 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center space-y-4 print:bg-white print:border-none print:shadow-none print:text-black">
          <h2 className="text-lg font-semibold text-white print:text-black">My Check-in Code</h2>
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={profile?.barcode || profile?.id || 'NO_ID'} size={150} level="H" />
          </div>
          <p className="text-sm text-gray-400 print:text-gray-600 text-center max-w-xs">
            Present this code at the kiosk or to your barber for quick check-in.
          </p>
          <button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors print:hidden">
            Print QR Code
          </button>
        </div>

        <div className="bg-slate-800/60 border border-white/5 rounded-xl p-6 space-y-5 print:hidden">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input type="text" value={profile?.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={profile?.email || ''} disabled className="w-full bg-black/30 border border-white/10 rounded p-3 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone</label>
            <input type="tel" value={profile?.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 555-123-4567" className="w-full bg-black/50 border border-white/20 rounded p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Birthday</label>
            <input type="date" value={profile?.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : ''} onChange={(e) => setProfile({ ...profile, birthday: e.target.value || null })} style={{ colorScheme: 'dark' }} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Preferences (e.g., skin fade, longer on top)</label>
            <textarea value={profile?.preferences || ''} onChange={(e) => setProfile({ ...profile, preferences: e.target.value })} rows={2} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Allergies / Sensitivities</label>
            <textarea value={profile?.allergies || ''} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} rows={2} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={profile?.marketingConsent || false} onChange={(e) => setProfile({ ...profile, marketingConsent: e.target.checked })} className="w-4 h-4 accent-brand-gold" />
              <span className="text-sm text-gray-300">I agree to receive marketing emails and promotions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={profile?.smsConsent || false} onChange={(e) => setProfile({ ...profile, smsConsent: e.target.checked })} className="w-4 h-4 accent-brand-gold" />
              <span className="text-sm text-gray-300">I agree to receive SMS appointment reminders</span>
            </label>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 mt-4">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          <div className="pt-6 mt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white mb-2">Security</h3>
            <Link href="/update-password" className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors border border-slate-600">
              Change Password
            </Link>
            <Link href="/my-appointments/profile/security" className="inline-block ml-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors border border-slate-600">
              Security & Recovery
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] overflow-y-auto overflow-x-hidden"><p className="text-gray-400">Loading...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}

