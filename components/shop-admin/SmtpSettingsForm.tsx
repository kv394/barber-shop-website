'use client';

import { useState, useEffect } from 'react';

interface SmtpSettingsFormProps {
  shopId: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

const COMMON_PROVIDERS = [
  { label: 'Custom SMTP', host: '', port: 587, secure: false },
  { label: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
  { label: 'Outlook / Office 365', host: 'smtp.office365.com', port: 587, secure: false },
  { label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 465, secure: true },
  { label: 'Zoho', host: 'smtp.zoho.com', port: 465, secure: true },
  { label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
];

export default function SmtpSettingsForm({ shopId }: SmtpSettingsFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [notEnabled, setNotEnabled] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [config, setConfig] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });

  useEffect(() => {
    fetchConfig();
  }, [shopId]);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/smtp`);
      const data = await res.json();

      if (res.status === 403) {
        setNotEnabled(true);
        return;
      }

      if (data.configured && data.smtp) {
        setConfigured(true);
        setConfig({
          host: data.smtp.host || '',
          port: data.smtp.port || 587,
          secure: data.smtp.secure || false,
          username: data.smtp.username || '',
          password: '', // Password is masked from API, user must re-enter to change
          fromEmail: data.smtp.fromEmail || '',
          fromName: data.smtp.fromName || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!config.password && !configured) {
        setMessage({ type: 'error', text: 'Password is required' });
        return;
      }

      const body: any = { ...config };
      // If editing and password is empty, don't send it (keep existing)
      if (configured && !config.password) {
        setMessage({ type: 'error', text: 'Please re-enter your SMTP password to save changes' });
        return;
      }

      const res = await fetch(`/api/shops/${shopId}/smtp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'SMTP configuration saved successfully!' });
        setConfigured(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/shops/${shopId}/smtp/test`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Test email sent!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Test failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  }

  async function handleRemove() {
    if (!confirm('Remove custom SMTP? All emails will revert to the default provider.')) return;
    
    try {
      const res = await fetch(`/api/shops/${shopId}/smtp`, { method: 'DELETE' });
      if (res.ok) {
        setConfigured(false);
        setConfig({ host: '', port: 587, secure: false, username: '', password: '', fromEmail: '', fromName: '' });
        setMessage({ type: 'success', text: 'SMTP removed. Emails will use the default provider.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  function selectProvider(index: number) {
    const p = COMMON_PROVIDERS[index];
    setConfig(prev => ({ ...prev, host: p.host, port: p.port, secure: p.secure }));
  }

  if (notEnabled) {
    return (
      <div className="rounded-xl border border-crm-border bg-crm-surface p-8 text-center">
        <div className="text-4xl mb-4">📧</div>
        <h3 className="text-lg font-bold text-crm-text mb-2">Custom Email (SMTP)</h3>
        <p className="text-crm-muted text-sm mb-4">
          Send notifications from your own email address instead of the default KutzApp address.
        </p>
        <div className="inline-block px-4 py-2 bg-brand-amber/20 text-brand-amber rounded-lg text-sm font-bold">
          💎 Premium Feature — Contact your administrator to enable
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-crm-border bg-crm-surface p-8 text-center">
        <div className="text-crm-muted">Loading SMTP settings...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-crm-border bg-crm-surface overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-crm-border bg-crm-bg flex items-center justify-between">
        <div>
          <h3 className="font-bold text-crm-text flex items-center gap-2">
            📧 Custom Email (SMTP)
            {configured && (
              <span className="px-2 py-0.5 bg-status-confirmed/20 text-status-confirmed text-[11px] font-bold rounded-full">
                CONFIGURED
              </span>
            )}
          </h3>
          <p className="text-[12px] text-crm-muted mt-0.5">
            Send notifications from your own email address
          </p>
        </div>
        {configured && (
          <button
            onClick={handleRemove}
            className="text-[12px] text-status-cancelled hover:text-status-cancelled/80 font-bold transition-colors"
          >
            Remove SMTP
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-5">
        {/* Message banner */}
        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-status-confirmed/20 text-status-confirmed'
              : 'bg-status-cancelled/20 text-status-cancelled'
          }`}>
            {message.text}
          </div>
        )}

        {/* Quick provider select */}
        <div>
          <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
            Provider Preset
          </label>
          <select
            onChange={(e) => selectProvider(Number(e.target.value))}
            className="w-full px-3 py-2.5 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm focus:outline-none focus:border-brand-indigo transition-colors"
          >
            {COMMON_PROVIDERS.map((p, i) => (
              <option key={p.label} value={i}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Host & Port */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
              placeholder="smtp.gmail.com"
              required
              className="w-full px-3 py-2.5 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm placeholder:text-crm-muted/50 focus:outline-none focus:border-brand-indigo transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
              Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig(prev => ({ ...prev, port: Number(e.target.value) }))}
              required
              className="w-full px-3 py-2.5 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm focus:outline-none focus:border-brand-indigo transition-colors"
            />
          </div>
        </div>

        {/* TLS Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, secure: !prev.secure }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${config.secure ? 'bg-brand-indigo' : 'bg-crm-muted/40'}`}
          >
            <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${config.secure ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm text-crm-text">
            TLS/SSL {config.secure ? '(Port 465)' : '(STARTTLS, Port 587)'}
          </span>
        </div>

        {/* Username & Password */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
              Username / Email
            </label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm placeholder:text-crm-muted/50 focus:outline-none focus:border-brand-indigo transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
              Password {configured && <span className="text-brand-amber">(re-enter to save)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.password}
                onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                placeholder={configured ? '••••••••' : 'App password'}
                required={!configured}
                className="w-full px-3 py-2.5 pr-10 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm placeholder:text-crm-muted/50 focus:outline-none focus:border-brand-indigo transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-crm-muted hover:text-crm-text text-xs"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        {/* Gmail note */}
        {config.host === 'smtp.gmail.com' && (
          <div className="p-3 rounded-lg bg-brand-amber/10 border border-brand-amber/20 text-[12px] text-brand-amber">
            <strong>Gmail users:</strong> Use an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">App Password</a> instead of your regular password. 2FA must be enabled.
          </div>
        )}

        {/* From Email & Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
              From Email
            </label>
            <input
              type="email"
              value={config.fromEmail}
              onChange={(e) => setConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
              placeholder="appointments@yoursalon.com"
              required
              className="w-full px-3 py-2.5 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm placeholder:text-crm-muted/50 focus:outline-none focus:border-brand-indigo transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-crm-muted uppercase tracking-wider mb-2">
              From Name <span className="text-crm-muted/60">(optional)</span>
            </label>
            <input
              type="text"
              value={config.fromName}
              onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
              placeholder="My Salon"
              className="w-full px-3 py-2.5 bg-crm-bg border border-crm-border rounded-lg text-crm-text text-sm placeholder:text-crm-muted/50 focus:outline-none focus:border-brand-indigo transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-indigo text-white text-sm font-bold rounded-lg hover:bg-brand-indigo/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : configured ? 'Update SMTP' : 'Save SMTP'}
          </button>

          {configured && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="px-6 py-2.5 border border-crm-border text-crm-text text-sm font-bold rounded-lg hover:bg-crm-bg transition-colors disabled:opacity-50"
            >
              {testing ? 'Sending...' : '📧 Send Test Email'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
