'use client';
import { useEffect, useState } from 'react';

export default function KioskSetupClient({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [kioskUrl, setKioskUrl] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setKioskUrl(`${window.location.origin}/shop/${shopId}/kiosk`);
  }, [shopId]);

  const savePassword = async () => {
    if (!password.trim()) return;
    setSaving(true);
    await fetch(`/api/shops/${shopId}/kiosk-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setMsg('Kiosk PIN saved!'); setPassword(''); setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const copyUrl = () => { navigator.clipboard.writeText(kioskUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-6">
      {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

      <div className="bg-status-info/20 border border-status-info/20 rounded-xl p-5">
        <h4 className="text-status-info font-semibold mb-2 text-base font-semibold">ℹ️ What is the Attendance Kiosk?</h4>
        <p className="text-crm-muted leading-relaxed text-[13px]">Set up a tablet or screen in your shop for staff to scan their QR/barcode to clock in and out. PIN-protected, no login required.</p>
      </div>

      <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-crm-text text-lg font-bold">📱 Kiosk URL</h3>
        <p className="text-crm-muted text-[13px]">Open on a tablet or dedicated screen in your shop.</p>
        <div className="flex gap-2">
          <input readOnly value={kioskUrl} className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded-lg px-3 py-2.5 text-crm-text text-[13px] font-mono focus:outline-none" />
          <button onClick={copyUrl} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${copied ? 'bg-status-confirmed text-white' : 'bg-crm-primary text-white hover:bg-crm-surface'}`}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <a href={kioskUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-crm-accent hover:underline text-[13px]">🚀 Open kiosk in new tab →</a>
      </div>

      <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-crm-text text-lg font-bold">🔐 Kiosk PIN</h3>
        <p className="text-crm-muted text-[13px]">Protect the kiosk with a 4–8 digit PIN.</p>
        <div className="flex gap-3">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new PIN (4–8 digits)" maxLength={8}
            className="w-48 bg-crm-surface border border-crm-border shadow-sm rounded-lg px-3 py-2.5 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
          <button onClick={savePassword} disabled={saving || !password.trim()}
            className="px-4 py-2 bg-crm-primary text-white rounded-lg text-[13px] font-bold disabled:opacity-50 hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors">
            {saving ? 'Saving…' : 'Set PIN'}
          </button>
        </div>
      </div>

      <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-3">
        <h3 className="font-bold text-crm-text text-lg font-bold">🪪 Staff QR / Barcode Cards</h3>
        <p className="text-crm-muted text-[13px]">Each staff member has a unique QR code. Go to Team Management to view and print.</p>
        <a href={`/shop/${shopId}/settings/team`} className="inline-block px-4 py-2 bg-crm-surface border border-crm-border shadow-sm text-crm-muted rounded-lg text-[13px] hover:bg-crm-border transition-colors">👥 Go to Team Management →</a>
      </div>

      <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6">
        <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">📋 Setup Instructions</h3>
        <ol className="space-y-3 text-[13px] text-crm-muted">
          {['Set your kiosk PIN above.','Open the Kiosk URL on a tablet in your shop.','Enter the PIN to activate kiosk mode.','Staff scan their QR or barcode to clock in/out.','View logs under Staff → Attendance.'].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-crm-primary/20 text-crm-accent text-[11px] font-bold flex items-center justify-center hover:opacity-90">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

