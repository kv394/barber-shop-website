'use client';

import { useState, useEffect } from 'react';

interface ChatWidgetConfig {
  enabled: boolean;
  position: 'bottom-right' | 'bottom-left';
  greeting: string;
  tone: 'professional' | 'friendly' | 'casual';
  requireLeadCapture: boolean;
  showOnMobile: boolean;
}

const DEFAULT_CONFIG: ChatWidgetConfig = {
  enabled: true,
  position: 'bottom-right',
  greeting: 'Hi! 👋 Need help booking an appointment?',
  tone: 'friendly',
  requireLeadCapture: false,
  showOnMobile: true,
};

const TONE_OPTIONS = [
  { value: 'professional', label: '👔 Professional', desc: 'Formal, concise responses' },
  { value: 'friendly', label: '😊 Friendly', desc: 'Warm, conversational tone' },
  { value: 'casual', label: '🤙 Casual', desc: 'Relaxed, laid-back vibe' },
];

export default function ChatWidgetSettings({ shopId }: { shopId: string }) {
  const [config, setConfig] = useState<ChatWidgetConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<{
    totalConversations: number;
    bookingsFromChat: number;
    avgResponseTime: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [shopId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/chat-widget`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig({ ...DEFAULT_CONFIG, ...data.config });
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch chat widget settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/shops/${shopId}/chat-widget`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-crm-muted">
        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-crm-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading chat widget settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-crm-text flex items-center gap-2">
            💬 AI Chat Widget
          </h2>
          <p className="text-[13px] text-crm-muted mt-1">
            A smart chat bubble on your booking page that answers questions and books appointments 24/7.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-crm-primary text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-crm-primary/90 transition-all shadow-lg disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-crm-text">{stats.totalConversations}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Conversations</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-emerald-600">{stats.bookingsFromChat}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Bookings via Chat</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-blue-600">{stats.avgResponseTime}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Avg Response</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-crm-primary/10 to-transparent">
            <h3 className="font-black text-crm-primary uppercase tracking-widest text-[13px]">Widget Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-crm-text text-sm">Enable Chat Widget</div>
                <div className="text-[12px] text-crm-muted">Show the chat bubble on your booking page</div>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Position */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Widget Position</label>
              <div className="grid grid-cols-2 gap-3">
                {(['bottom-right', 'bottom-left'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => setConfig(c => ({ ...c, position: pos }))}
                    className={`p-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                      config.position === pos
                        ? 'border-crm-primary bg-crm-primary/10 text-crm-primary'
                        : 'border-white/20 bg-white/40 text-crm-muted hover:border-crm-primary/30'
                    }`}
                  >
                    {pos === 'bottom-right' ? '↘️ Bottom Right' : '↙️ Bottom Left'}
                  </button>
                ))}
              </div>
            </div>

            {/* Greeting */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Greeting Message</label>
              <textarea
                value={config.greeting}
                onChange={e => setConfig(c => ({ ...c, greeting: e.target.value }))}
                rows={2}
                className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner resize-none text-sm"
                placeholder="Hi! Need help booking?"
              />
            </div>

            {/* Tone */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Chat Personality</label>
              <div className="space-y-2">
                {TONE_OPTIONS.map(tone => (
                  <button
                    key={tone.value}
                    onClick={() => setConfig(c => ({ ...c, tone: tone.value as any }))}
                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                      config.tone === tone.value
                        ? 'border-crm-primary bg-crm-primary/10'
                        : 'border-white/20 bg-white/40 hover:border-crm-primary/30'
                    }`}
                  >
                    <span className="text-lg">{tone.label.split(' ')[0]}</span>
                    <div>
                      <div className="font-bold text-crm-text text-sm">{tone.label.split(' ').slice(1).join(' ')}</div>
                      <div className="text-[11px] text-crm-muted">{tone.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lead Capture */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-crm-text text-sm">Require Name/Email</div>
                <div className="text-[12px] text-crm-muted">Ask for contact info before the chat starts</div>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, requireLeadCapture: !c.requireLeadCapture }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.requireLeadCapture ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.requireLeadCapture ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Mobile */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-crm-text text-sm">Show on Mobile</div>
                <div className="text-[12px] text-crm-muted">Display the widget on mobile devices</div>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, showOnMobile: !c.showOnMobile }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${config.showOnMobile ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.showOnMobile ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-transparent">
            <h3 className="font-black text-blue-600 uppercase tracking-widest text-[13px]">Preview</h3>
          </div>
          <div className="p-6 min-h-[400px] bg-gray-50 rounded-b-2xl relative">
            {/* Simulated page */}
            <div className="bg-white rounded-xl border border-gray-200 h-64 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <div className="text-4xl mb-2">🌐</div>
                <div className="font-medium text-sm">Your Booking Page</div>
              </div>
            </div>

            {/* Chat bubble preview */}
            {config.enabled && (
              <div className={`absolute bottom-8 ${config.position === 'bottom-right' ? 'right-8' : 'left-8'}`}>
                {/* Greeting bubble */}
                <div className={`mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-[220px] ${config.position === 'bottom-right' ? 'ml-auto' : 'mr-auto'}`}>
                  <p className="text-sm text-gray-700 font-medium">{config.greeting || 'Hi! Need help booking?'}</p>
                  <div className="text-[10px] text-gray-400 mt-1 font-medium">AI Assistant</div>
                </div>

                {/* Chat button */}
                <div className={`flex ${config.position === 'bottom-right' ? 'justify-end' : 'justify-start'}`}>
                  <div className="w-14 h-14 rounded-full bg-crm-primary text-white flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {!config.enabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-b-2xl">
                <div className="text-center">
                  <div className="text-4xl mb-2">🚫</div>
                  <p className="text-gray-400 font-bold text-sm">Widget Disabled</p>
                </div>
              </div>
            )}
          </div>

          {/* Capabilities info */}
          <div className="p-6 border-t border-white/20">
            <h4 className="font-bold text-crm-text text-sm mb-3">What the AI can do:</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                '✅ Check availability',
                '✅ Book appointments',
                '✅ Answer pricing FAQs',
                '✅ Show barber profiles',
                '✅ Cancel/reschedule',
                '✅ Send calendar invite',
              ].map(item => (
                <div key={item} className="text-[12px] text-crm-muted font-medium">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
