'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';


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
      <div className="flex items-center justify-center py-12">
        <p className="text-crm-muted animate-pulse text-[13px]">Loading profile…</p>
      </div>
    );
  }

  return (
    <main className="pb-12">
      

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {msg && (
          <div className={`px-4 py-3 rounded-lg text-[13px] ${msg.type === 'success' ? 'bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed' : 'bg-status-cancelled/20 border border-status-cancelled/30 text-status-cancelled'}`}>
            {msg.text}
          </div>
        )}

        <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center space-y-4 print:bg-white print:border-none print:shadow-none print:text-black">
          <h2 className="font-semibold text-crm-text print:text-black text-xl font-bold">My Check-in Code</h2>
          <div className="bg-crm-surface p-4 rounded-xl">
            <QRCodeSVG value={profile?.barcode || profile?.id || 'NO_ID'} size={150} level="H" />
          </div>
          <p className="text-crm-muted print:text-crm-muted text-center max-w-xs text-[13px]">
            Present this code at the kiosk or to your barber for quick check-in.
          </p>
          <button onClick={handlePrint} className="bg-crm-surface hover:bg-crm-border text-crm-text px-4 py-2 rounded-lg text-[13px] font-medium transition-colors print:hidden">
            Print QR Code
          </button>
        </div>

        <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-5 print:hidden">
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Name</label>
            <input type="text" value={profile?.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-text focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Email</label>
            <input type="email" value={profile?.email || ''} disabled className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-muted cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Phone</label>
            <input type="tel" value={profile?.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 555-123-4567" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Birthday</label>
            <input type="date" value={profile?.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : ''} onChange={(e) => setProfile({ ...profile, birthday: e.target.value || null })} className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-text focus:outline-none focus:border-brand-gold" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Preferences (e.g., skin fade, longer on top)</label>
            <textarea value={profile?.preferences || ''} onChange={(e) => setProfile({ ...profile, preferences: e.target.value })} rows={2} className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Allergies / Sensitivities</label>
            <textarea value={profile?.allergies || ''} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} rows={2} className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-3 text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-none" />
          </div>

          <div className="pt-4 border-t border-crm-border space-y-3">
            <label className="flex items-center gap-3 cursor-pointer text-[13px]">
              <input type="checkbox" checked={profile?.marketingConsent || false} onChange={(e) => setProfile({ ...profile, marketingConsent: e.target.checked })} className="w-4 h-4 accent-brand-gold" />
              <span className="text-[13px] text-crm-muted">I agree to receive marketing emails and promotions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-[13px]">
              <input type="checkbox" checked={profile?.smsConsent || false} onChange={(e) => setProfile({ ...profile, smsConsent: e.target.checked })} className="w-4 h-4 accent-brand-gold" />
              <span className="text-[13px] text-crm-muted">I agree to receive SMS appointment reminders</span>
            </label>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50 mt-4">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          <div className="pt-6 mt-6 border-t border-crm-border">
            <h3 className="font-semibold text-crm-text mb-2 text-lg font-bold">Security</h3>
            <Link href="/update-password" className="inline-block px-4 py-2 bg-crm-surface hover:bg-crm-border text-crm-text text-[13px] font-medium rounded-lg transition-colors border border-slate-600">
              Change Password
            </Link>
            <Link href="/my-appointments/profile/security" className="inline-block ml-3 px-4 py-2 bg-crm-surface hover:bg-crm-border text-crm-text text-[13px] font-medium rounded-lg transition-colors border border-slate-600">
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
    <Suspense fallback={<div className="flex items-center justify-center py-12"><p className="text-crm-muted text-[13px]">Loading...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}

