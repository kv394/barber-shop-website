'use client';
import { useEffect, useState } from 'react';

export default function KioskSetupClient({ shopId, shopName, kioskEmail: initialKioskEmail }: { shopId: string; shopName: string; kioskEmail: string }) {
 const [kioskUrl, setKioskUrl] = useState('');
 const [kioskEmail, setKioskEmail] = useState(initialKioskEmail);
 const [editingEmail, setEditingEmail] = useState(false);
 const [newEmail, setNewEmail] = useState(initialKioskEmail);
 
 const [password, setPassword] = useState('');
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState('');
 const [errorMsg, setErrorMsg] = useState('');
 const [copied, setCopied] = useState(false);

 useEffect(() => {
 // Kiosk users login at the main sign-in page and are redirected to the root where the kiosk is rendered
 setKioskUrl(`${window.location.origin}/sign-in`);
 }, [shopId]);

 const saveEmail = async () => {
 if (!newEmail.trim() || !/^\S+@\S+\.\S+$/.test(newEmail)) {
 setErrorMsg('Please enter a valid email address.');
 return;
 }
 setSaving(true);
 setErrorMsg('');
 const res = await fetch(`/api/shops/${shopId}/kiosk-email`, {
 method: 'PUT', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: newEmail }),
 });
 const data = await res.json();
 if (!res.ok) {
 setErrorMsg(data.error || 'Failed to update email');
 } else {
 setKioskEmail(data.email);
 setEditingEmail(false);
 setMsg('Kiosk Email updated!');
 setTimeout(() => setMsg(''), 3000);
 }
 setSaving(false);
 };

 const savePassword = async () => {
 if (!password.trim() || !kioskEmail) {
 setErrorMsg('No kiosk email found for this shop. Please contact support.');
 return;
 }
 setSaving(true);
 setErrorMsg('');
 const res = await fetch(`/api/shops/${shopId}/kiosk-password`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: kioskEmail, password }),
 });
 const data = await res.json();
 if (!res.ok) {
 setErrorMsg(data.error || 'Failed to save password');
 } else {
 setMsg('Kiosk PIN saved!'); setPassword('');
 setTimeout(() => setMsg(''), 3000);
 }
 setSaving(false);
 };

 const copyUrl = () => { navigator.clipboard.writeText(kioskUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

 return (
 <div className="space-y-6">
 {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}
 {errorMsg && <div className="p-3 bg-status-cancelled/20 border border-status-cancelled/30 text-status-cancelled rounded-lg text-[13px]">{errorMsg}</div>}

 <div className="bg-status-info/20 border border-status-info/20 rounded-xl p-5">
 <h4 className="text-status-info font-semibold mb-2 text-base font-semibold">ℹ️ What is the Attendance Kiosk?</h4>
 <p className="text-crm-muted leading-relaxed text-[13px]">Set up a tablet or screen in your shop for staff to scan their QR/barcode to clock in and out. PIN-protected, no login required.</p>
 </div>

 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-4">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-bold text-crm-text text-lg font-bold">📱 Kiosk Login</h3>
 <p className="text-crm-muted text-[13px]">Open the login page on a tablet or dedicated screen in your shop and log in using these credentials:</p>
 </div>
 </div>
 
 <div className="flex gap-2 mb-2 items-center">
 <span className="text-[13px] text-crm-muted w-16">Email:</span>
 {editingEmail ? (
 <div className="flex gap-2 items-center flex-1">
 <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-64 bg-crm-surface border border-crm-border shadow-sm rounded-lg px-3 py-1.5 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
 <button onClick={saveEmail} disabled={saving} className="px-3 py-1.5 bg-crm-primary text-white rounded-lg text-[11px] font-bold disabled:opacity-50">Save</button>
 <button onClick={() => setEditingEmail(false)} disabled={saving} className="px-3 py-1.5 bg-crm-bg text-crm-text rounded-lg text-[11px] font-bold">Cancel</button>
 </div>
 ) : (
 <div className="flex gap-4 items-center">
 <code className="text-crm-primary font-mono text-[13px] font-bold">{kioskEmail || 'No kiosk email found'}</code>
 <button onClick={() => setEditingEmail(true)} className="text-[11px] font-bold text-crm-muted hover:text-crm-primary transition-colors underline">Change Email</button>
 </div>
 )}
 </div>
 <div className="flex gap-2">
 <input readOnly value={kioskUrl} className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded-lg px-3 py-2.5 text-crm-text text-[13px] font-mono focus:outline-none" />
 <button onClick={copyUrl} className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${copied ? 'bg-status-confirmed text-white' : 'bg-crm-primary text-white hover:bg-crm-surface'}`}>
 {copied ? '✓ Copied!' : 'Copy URL'}
 </button>
 </div>
 <div className="flex flex-col gap-2">
 <p className="text-status-pending text-[13px] font-semibold">⚠️ Note: Do not log into the Kiosk on your current browser window, or it will log you out of your Admin account. Use a separate tablet or an Incognito window.</p>
 <a href={kioskUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-crm-accent hover:underline text-[13px]">🚀 Open sign in page in new tab →</a>
 </div>
 </div>

 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6 space-y-4">
 <h3 className="font-bold text-crm-text text-lg font-bold">🔐 Kiosk Password</h3>
 <p className="text-crm-muted text-[13px]">Protect the kiosk with an 8+ character password or PIN.</p>
 <div className="flex gap-3">
 <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password (min 8 chars)" minLength={8}
 className="w-64 bg-crm-surface border border-crm-border shadow-sm rounded-lg px-3 py-2.5 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" />
 <button onClick={savePassword} disabled={saving || password.trim().length < 8}
 className="px-4 py-2 bg-crm-primary text-white rounded-lg text-[13px] font-bold disabled:opacity-50 hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors">
 {saving ? 'Saving…' : 'Set Password'}
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

