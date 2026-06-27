'use client';

import { useState, useEffect } from 'react';

interface SmsConfig {
  enabled: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  postVisitReview: boolean;
  rebookingPrompts: boolean;
  customReminderTemplate: string;
  customReviewTemplate: string;
}

const DEFAULT_CONFIG: SmsConfig = {
  enabled: true,
  reminder24h: true,
  reminder1h: true,
  postVisitReview: true,
  rebookingPrompts: true,
  customReminderTemplate: 'Hi {clientName}! Reminder: Your {serviceName} at {shopName} is {time}. See you there! 💈',
  customReviewTemplate: 'Thanks for visiting {shopName}! We\'d love to hear about your experience. Leave a quick review! ⭐',
};

const TEMPLATE_VARS = [
  { var: '{clientName}', desc: 'Client\'s first name' },
  { var: '{serviceName}', desc: 'Booked service name' },
  { var: '{shopName}', desc: 'Your shop name' },
  { var: '{time}', desc: 'Appointment time' },
  { var: '{staffName}', desc: 'Barber\'s name' },
];

export default function SmsReminderSettings({ shopId }: { shopId: string }) {
  const [config, setConfig] = useState<SmsConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<{
    sent: number;
    pending: number;
    failed: number;
    totalCost: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [shopId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/sms-settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig({ ...DEFAULT_CONFIG, ...data.config });
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch SMS settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/shops/${shopId}/sms-settings`, {
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
        Loading SMS settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-crm-text flex items-center gap-2">
            📱 SMS Reminders & Alerts
          </h2>
          <p className="text-[13px] text-crm-muted mt-1">
            Reduce no-shows by 30-50% with automated appointment reminders via SMS.
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-emerald-600">{stats.sent}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Sent</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-amber-600">{stats.pending}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Pending</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-red-500">{stats.failed}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Failed</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl p-5 text-center shadow-lg">
            <div className="text-3xl font-black text-blue-600">{stats.totalCost}</div>
            <div className="text-[10px] font-bold text-crm-muted uppercase tracking-wider mt-1">Est. Cost</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reminder Toggles */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-crm-primary/10 to-transparent">
            <h3 className="font-black text-crm-primary uppercase tracking-widest text-[13px]">Notification Types</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <div>
                <div className="font-black text-emerald-700 text-sm">SMS Enabled</div>
                <div className="text-[12px] text-emerald-600/80">Master toggle for all SMS notifications</div>
              </div>
              <button
                onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
                className={`relative w-14 h-7 rounded-full transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-7' : ''}`} />
              </button>
            </div>

            {/* Individual Toggles */}
            <div className={`space-y-4 ${!config.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              {/* 24h Reminder */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⏰</span>
                  <div>
                    <div className="font-bold text-crm-text text-sm">24-Hour Reminder</div>
                    <div className="text-[12px] text-crm-muted">Send the day before the appointment</div>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, reminder24h: !c.reminder24h }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.reminder24h ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.reminder24h ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* 1h Reminder */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <div>
                    <div className="font-bold text-crm-text text-sm">1-Hour Reminder</div>
                    <div className="text-[12px] text-crm-muted">Send 1 hour before the appointment</div>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, reminder1h: !c.reminder1h }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.reminder1h ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.reminder1h ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Post-visit Review */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⭐</span>
                  <div>
                    <div className="font-bold text-crm-text text-sm">Post-Visit Review Request</div>
                    <div className="text-[12px] text-crm-muted">Ask for a review after checkout</div>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, postVisitReview: !c.postVisitReview }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.postVisitReview ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.postVisitReview ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Rebooking Prompts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💈</span>
                  <div>
                    <div className="font-bold text-crm-text text-sm">Rebooking Prompts</div>
                    <div className="text-[12px] text-crm-muted">&quot;Time for a trim?&quot; when clients are overdue</div>
                  </div>
                </div>
                <button
                  onClick={() => setConfig(c => ({ ...c, rebookingPrompts: !c.rebookingPrompts }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.rebookingPrompts ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.rebookingPrompts ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-transparent">
            <h3 className="font-black text-blue-600 uppercase tracking-widest text-[13px]">Message Templates</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Reminder template */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Appointment Reminder</label>
              <textarea
                value={config.customReminderTemplate}
                onChange={e => setConfig(c => ({ ...c, customReminderTemplate: e.target.value }))}
                rows={3}
                className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner resize-none text-sm"
              />
            </div>

            {/* Review template */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Review Request</label>
              <textarea
                value={config.customReviewTemplate}
                onChange={e => setConfig(c => ({ ...c, customReviewTemplate: e.target.value }))}
                rows={3}
                className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner resize-none text-sm"
              />
            </div>

            {/* Template variables */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Available Variables</label>
              <div className="grid grid-cols-1 gap-1.5">
                {TEMPLATE_VARS.map(v => (
                  <div key={v.var} className="flex items-center gap-2 text-[12px]">
                    <code className="bg-crm-bg px-2 py-0.5 rounded font-mono text-crm-primary font-bold text-[11px]">{v.var}</code>
                    <span className="text-crm-muted">{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 mb-2">Message Preview</div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-sm text-gray-700 font-medium">
                  {config.customReminderTemplate
                    .replace('{clientName}', 'Marcus')
                    .replace('{serviceName}', 'Fade')
                    .replace('{shopName}', 'Heritage Haircuts')
                    .replace('{time}', 'tomorrow at 2:00 PM')
                    .replace('{staffName}', 'Mike')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-6">
        <h3 className="font-black text-crm-text text-sm mb-4">How SMS Reminders Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: '📅', title: 'Client Books', desc: 'Appointment is scheduled through your booking page' },
            { icon: '⏰', title: 'Auto-Scheduled', desc: 'Reminders are automatically queued for 24h and 1h before' },
            { icon: '📱', title: 'SMS Sent', desc: 'Client receives a personalized text reminder via Twilio' },
            { icon: '✅', title: 'Show Up Rate ↑', desc: 'No-shows drop by 30-50%, saving you $600+/month' },
          ].map((step, i) => (
            <div key={i} className="text-center p-4 bg-crm-bg/30 rounded-xl border border-white/20">
              <div className="text-3xl mb-2">{step.icon}</div>
              <div className="font-bold text-crm-text text-sm mb-1">{step.title}</div>
              <div className="text-[11px] text-crm-muted">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
