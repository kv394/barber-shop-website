'use client';

import { useState, useEffect } from 'react';

export default function PlatformSettingsClient() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/siteadmin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/siteadmin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage('Settings saved successfully. Changes may take up to 60 seconds to propagate to all shops.');
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || 'Failed to save'}`);
      }
    } catch (e) {
      setMessage('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/50">Loading settings...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      
      {message && (
        <div className={`p-4 rounded-xl border font-bold ${message.startsWith('Error') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          {message}
        </div>
      )}

      <div className="bg-[#1a1410] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-bold text-white">General Info</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/60 text-[11px] uppercase tracking-wider font-bold mb-2">Platform Name</label>
            <input 
              value={settings?.platformName || ''} 
              onChange={e => setSettings({...settings, platformName: e.target.value})}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-white/60 text-[11px] uppercase tracking-wider font-bold mb-2">Support Email</label>
            <input 
              type="email"
              value={settings?.supportEmail || ''} 
              onChange={e => setSettings({...settings, supportEmail: e.target.value})}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none" 
              placeholder="support@example.com"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1410] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-bold text-white">Payments & Billing</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/60 text-[11px] uppercase tracking-wider font-bold mb-2">Stripe Connect Platform Fee (%)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                step="0.1"
                min="0"
                max="100"
                value={settings?.platformFeePercent || 0} 
                onChange={e => setSettings({...settings, platformFeePercent: e.target.value})}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none" 
              />
              <span className="text-white/50">%</span>
            </div>
            <p className="text-white/40 text-[11px] mt-2">The percentage Kutz takes from every Booth Renter transaction.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1410] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-bold text-white">Global Feature Toggles</h2>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center gap-4 p-4 bg-black/20 border border-white/5 rounded-xl cursor-pointer hover:bg-black/40 transition-colors">
            <input 
              type="checkbox" 
              checked={settings?.enableSms || false}
              onChange={e => setSettings({...settings, enableSms: e.target.checked})}
              className="w-5 h-5 accent-amber-500"
            />
            <div>
              <p className="font-bold text-white">Enable SMS Notifications (Global)</p>
              <p className="text-white/50 text-[13px]">Master switch to turn off all outbound SMS messages (useful for development/testing).</p>
            </div>
          </label>

          <label className="flex items-center gap-4 p-4 bg-black/20 border border-white/5 rounded-xl cursor-pointer hover:bg-black/40 transition-colors">
            <input 
              type="checkbox" 
              checked={settings?.enableAi || false}
              onChange={e => setSettings({...settings, enableAi: e.target.checked})}
              className="w-5 h-5 accent-amber-500"
            />
            <div>
              <p className="font-bold text-white">Enable AI Features</p>
              <p className="text-white/50 text-[13px]">Master switch to turn off Gemini/OpenAI integrations across the platform.</p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-[#1a1410] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-bold text-white">Branding & SEO</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/60 text-[11px] uppercase tracking-wider font-bold mb-2">Primary Color (Hex)</label>
            <input 
              type="color"
              value={settings?.primaryColor || '#f59e0b'} 
              onChange={e => setSettings({...settings, primaryColor: e.target.value})}
              className="w-full h-12 bg-black/30 border border-white/10 rounded-xl cursor-pointer p-1" 
            />
          </div>
          <div>
            <label className="block text-white/60 text-[11px] uppercase tracking-wider font-bold mb-2">Google Analytics ID</label>
            <input 
              value={settings?.analyticsId || ''} 
              onChange={e => setSettings({...settings, analyticsId: e.target.value})}
              placeholder="G-XXXXXXXXXX"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-white/10 pt-6">
        <button 
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Global Settings'}
        </button>
      </div>

    </form>
  );
}
