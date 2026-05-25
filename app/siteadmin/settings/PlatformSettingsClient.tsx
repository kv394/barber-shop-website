'use client';

import { useState, useEffect } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumInput from '@/components/ui/PremiumInput';

export default function PlatformSettingsClient() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'operations' | 'integrations'>('general');

  useEffect(() => {
    fetch('/api/siteadmin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  if (loading) return <div className="text-crm-muted flex justify-center py-20 font-bold">Loading platform settings...</div>;

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-white/40 border border-white/20 rounded-xl max-w-fit shadow-inner mb-8">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-[12px] font-black uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'general' ? 'bg-crm-primary text-white shadow-[0_0_15px_rgba(var(--crm-primary-rgb),0.5)]' : 'text-crm-muted hover:text-crm-text hover:bg-white/50'
          }`}
        >
          General & Billing
        </button>
        <button 
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2 text-[12px] font-black uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'operations' ? 'bg-crm-primary text-white shadow-[0_0_15px_rgba(var(--crm-primary-rgb),0.5)]' : 'text-crm-muted hover:text-crm-text hover:bg-white/50'
          }`}
        >
          Operations
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 text-[12px] font-black uppercase tracking-widest rounded-lg transition-all ${
            activeTab === 'integrations' ? 'bg-crm-primary text-white shadow-[0_0_15px_rgba(var(--crm-primary-rgb),0.5)]' : 'text-crm-muted hover:text-crm-text hover:bg-white/50'
          }`}
        >
          Integrations & Secrets
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border font-bold ${message.startsWith('Error') ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-inner' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-inner'}`}>
          {message}
        </div>
      )}

      {/* --- GENERAL TAB --- */}
      {activeTab === 'general' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Branding & Support</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <PremiumInput
                label="Platform Name"
                value={settings?.platformName || ''}
                onChange={e => setSettings({...settings, platformName: e.target.value})}
              />
              <PremiumInput
                label="Support Email"
                type="email"
                placeholder="support@example.com"
                value={settings?.supportEmail || ''}
                onChange={e => setSettings({...settings, supportEmail: e.target.value})}
              />
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2 px-1">Primary Color (Hex)</label>
                <input 
                  type="color"
                  value={settings?.primaryColor || '#ea580c'} 
                  onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                  className="w-full h-12 bg-crm-bg/50 border border-white/20 rounded-xl cursor-pointer p-1 shadow-inner" 
                />
              </div>
              <PremiumInput
                label="Google Analytics ID"
                placeholder="G-XXXXXXXXXX"
                value={settings?.analyticsId || ''}
                onChange={e => setSettings({...settings, analyticsId: e.target.value})}
              />
            </div>
          </PremiumGlassCard>

          <PremiumGlassCard accentColor="emerald-500" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Payments & Billing</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2 px-1">Stripe Connect Platform Fee (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings?.platformFeePercent || 0} 
                    onChange={e => setSettings({...settings, platformFeePercent: e.target.value})}
                    className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/20 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium pr-10" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-crm-muted font-bold">%</span>
                </div>
                <p className="text-[11px] text-crm-muted mt-2 px-1 font-medium">The percentage Kutz takes from every Booth Renter transaction.</p>
              </div>
            </div>
          </PremiumGlassCard>
        </div>
      )}

      {/* --- OPERATIONS TAB --- */}
      {activeTab === 'operations' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <PremiumGlassCard accentColor="brand-gold" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Platform Controls</h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/40 border border-white/20 rounded-xl cursor-pointer hover:bg-white/60 transition-colors shadow-inner">
                <div>
                  <p className="font-bold text-crm-text text-[15px]">Maintenance Mode</p>
                  <p className="text-crm-muted text-[13px] mt-1">When enabled, the entire platform will show a "Down for Maintenance" page to all users.</p>
                </div>
                <div className="relative inline-block w-14 align-middle select-none transition duration-200 ease-in shrink-0">
                  <input type="checkbox" checked={settings?.maintenanceMode || false} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-white/20 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-8 checked:border-amber-500 shadow-sm" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-crm-bg/50 border border-white/20 shadow-inner cursor-pointer transition-colors duration-200 ease-in-out"></label>
                </div>
              </label>

              <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/40 border border-white/20 rounded-xl cursor-pointer hover:bg-white/60 transition-colors shadow-inner">
                <div>
                  <p className="font-bold text-crm-text text-[15px]">Allow New Registrations</p>
                  <p className="text-crm-muted text-[13px] mt-1">If disabled, new shops cannot sign up (useful for private betas or invite-only mode).</p>
                </div>
                <div className="relative inline-block w-14 align-middle select-none transition duration-200 ease-in shrink-0">
                  <input type="checkbox" checked={settings?.allowNewRegistrations !== false} onChange={e => setSettings({...settings, allowNewRegistrations: e.target.checked})} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-white/20 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-8 checked:border-crm-primary shadow-sm" />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-crm-bg/50 border border-white/20 shadow-inner cursor-pointer transition-colors duration-200 ease-in-out"></label>
                </div>
              </label>
            </div>
          </PremiumGlassCard>

          <PremiumGlassCard accentColor="cyan-500" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Shop Defaults</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <PremiumInput
                label="Default Timezone"
                placeholder="America/New_York"
                value={settings?.defaultTimezone || 'America/New_York'}
                onChange={e => setSettings({...settings, defaultTimezone: e.target.value})}
              />
              <PremiumInput
                label="Default Currency (Code)"
                placeholder="USD"
                value={settings?.defaultCurrency || 'USD'}
                onChange={e => setSettings({...settings, defaultCurrency: e.target.value})}
              />
            </div>
          </PremiumGlassCard>
        </div>
      )}

      {/* --- INTEGRATIONS TAB --- */}
      {activeTab === 'integrations' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden border-amber-500/30">
            <div className="px-6 py-4 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="text-[13px] font-black text-amber-600 uppercase tracking-widest">Secret Management Warning</h3>
                <p className="text-[12px] text-amber-700 mt-1 font-medium">Entering API keys here will override any keys set in the server `.env` files. Ensure you have proper database security before saving production secrets here.</p>
              </div>
            </div>
          </PremiumGlassCard>

          <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40 flex justify-between items-center">
              <h2 className="text-lg font-bold text-crm-text">Global Feature Toggles</h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-4 p-5 bg-white/40 border border-white/20 rounded-xl cursor-pointer hover:bg-white/60 transition-colors shadow-inner">
                <input 
                  type="checkbox" 
                  checked={settings?.enableSms || false}
                  onChange={e => setSettings({...settings, enableSms: e.target.checked})}
                  className="w-5 h-5 accent-crm-primary"
                />
                <div>
                  <p className="font-bold text-crm-text">Enable SMS Notifications (Global)</p>
                  <p className="text-crm-muted text-[13px]">Master switch to turn off all outbound SMS messages globally.</p>
                </div>
              </label>

              <label className="flex items-center gap-4 p-5 bg-white/40 border border-white/20 rounded-xl cursor-pointer hover:bg-white/60 transition-colors shadow-inner">
                <input 
                  type="checkbox" 
                  checked={settings?.enableAi || false}
                  onChange={e => setSettings({...settings, enableAi: e.target.checked})}
                  className="w-5 h-5 accent-crm-primary"
                />
                <div>
                  <p className="font-bold text-crm-text">Enable AI Features (Global)</p>
                  <p className="text-crm-muted text-[13px]">Master switch to turn off Gemini/OpenAI integrations.</p>
                </div>
              </label>
            </div>
          </PremiumGlassCard>

          <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Stripe Integration</h2>
            </div>
            <div className="p-6 space-y-6">
              <PremiumInput
                label="Stripe Secret Key"
                type="password"
                placeholder="sk_live_..."
                value={settings?.stripeSecretKey || ''}
                onChange={e => setSettings({...settings, stripeSecretKey: e.target.value})}
              />
              <PremiumInput
                label="Stripe Webhook Secret"
                type="password"
                placeholder="whsec_..."
                value={settings?.stripeWebhookSecret || ''}
                onChange={e => setSettings({...settings, stripeWebhookSecret: e.target.value})}
              />
            </div>
          </PremiumGlassCard>

          <PremiumGlassCard accentColor="cyan-500" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Twilio Integration</h2>
            </div>
            <div className="p-6 space-y-6">
              <PremiumInput
                label="Twilio Account SID"
                type="password"
                placeholder="AC..."
                value={settings?.twilioAccountSid || ''}
                onChange={e => setSettings({...settings, twilioAccountSid: e.target.value})}
              />
              <PremiumInput
                label="Twilio Auth Token"
                type="password"
                placeholder="**********"
                value={settings?.twilioAuthToken || ''}
                onChange={e => setSettings({...settings, twilioAuthToken: e.target.value})}
              />
              <PremiumInput
                label="Twilio From Number"
                placeholder="+1234567890"
                value={settings?.twilioFromNumber || ''}
                onChange={e => setSettings({...settings, twilioFromNumber: e.target.value})}
              />
            </div>
          </PremiumGlassCard>

          <PremiumGlassCard accentColor="emerald-500" className="!p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/20 bg-white/40">
              <h2 className="text-lg font-bold text-crm-text">Other APIs</h2>
            </div>
            <div className="p-6 space-y-6">
              <PremiumInput
                label="OpenAI / Gemini API Key"
                type="password"
                placeholder="sk-..."
                value={settings?.openAiKey || ''}
                onChange={e => setSettings({...settings, openAiKey: e.target.value})}
              />
              <PremiumInput
                label="Resend API Key (Email)"
                type="password"
                placeholder="re_..."
                value={settings?.resendApiKey || ''}
                onChange={e => setSettings({...settings, resendApiKey: e.target.value})}
              />
            </div>
          </PremiumGlassCard>
        </div>
      )}

      {/* Floating Save Button */}
      <div className="fixed bottom-20 md:bottom-10 right-6 md:right-10 z-50">
        <button 
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3.5 bg-crm-text hover:bg-crm-primary text-white font-black uppercase tracking-widest rounded-full transition-all shadow-xl hover:shadow-[0_0_30px_rgba(var(--crm-primary-rgb),0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Saving...
            </>
          ) : (
            <>
              <span className="text-lg">💾</span>
              Save Settings
            </>
          )}
        </button>
      </div>

    </div>
  );
}
