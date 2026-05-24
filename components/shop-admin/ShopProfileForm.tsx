'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIMEZONE_OPTIONS } from '@/lib/timezone';

const COUNTRY_OPTIONS = [
  { value: 'US', label: '🇺🇸 United States', currency: 'USD', locale: 'en-US' },
  { value: 'IN', label: '🇮🇳 India', currency: 'INR', locale: 'en-IN' },
];

const PAYMENT_GATEWAYS = [
  { value: 'STRIPE', label: 'Stripe', icon: '💳', description: 'Cards, Apple Pay, Google Pay (US, EU, etc.)', countries: ['US'] },
  { value: 'RAZORPAY', label: 'Razorpay', icon: '🇮🇳', description: 'UPI, cards, wallets (India)', countries: ['IN'] },
  { value: 'NONE', label: 'No online payments', icon: '🚫', description: 'Cash / manual payments only', countries: ['US', 'IN'] },
];

const DEFAULT_GATEWAY: Record<string, string> = {
  US: 'STRIPE',
  IN: 'RAZORPAY',
};

interface ShopProfileFormProps {
  shopId: string;
  initialName: string;
  initialDescription: string | null;
  initialSlogan: string | null;
  initialCountry?: string;
  initialCurrency?: string;
  initialLocale?: string;
  initialTimezone?: string;
  initialDepositRequired?: boolean;
  initialDepositAmount?: number;
  initialPaymentGateway?: string;
  initialStripeAccountId?: string;
  initialRazorpayKeyId?: string;
  initialRazorpayKeySecret?: string;
}

export function ShopProfileForm({
  shopId,
  initialName,
  initialDescription,
  initialSlogan,
  initialCountry,
  initialCurrency,
  initialLocale,
  initialTimezone,
  initialDepositRequired,
  initialDepositAmount,
  initialPaymentGateway,
  initialStripeAccountId,
  initialRazorpayKeyId,
  initialRazorpayKeySecret,
}: ShopProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialName || '',
    description: initialDescription || '',
    slogan: initialSlogan || '',
    country: initialCountry || 'US',
    currency: initialCurrency || 'USD',
    locale: initialLocale || 'en-US',
    timezone: initialTimezone || 'America/New_York',
    depositRequired: initialDepositRequired || false,
    depositAmount: initialDepositAmount || 0,
    paymentGateway: initialPaymentGateway || 'STRIPE',
    stripeAccountId: initialStripeAccountId || '',
    razorpayKeyId: initialRazorpayKeyId || '',
    razorpayKeySecret: initialRazorpayKeySecret || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save settings (${response.status})`);
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary/50';
  const labelClass = 'block font-medium text-crm-muted mb-2 text-[13px]';

  return (
    <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm mb-6">
      <div className="mb-6">
        <h2 className="font-bold text-crm-text mb-2 text-xl">General Settings</h2>
        <p className="text-crm-muted text-[13px]">
          Manage your shop's profile, region, timezone, and booking deposit.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-status-cancelled/20 text-status-cancelled rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-status-confirmed/20 text-status-confirmed rounded-lg text-[13px]">
          Settings saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* ── Shop Identity ── */}
        <div>
          <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
            <span>🏪</span> Shop Identity
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Shop Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="E.g., The Gentleman's Barbershop"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Slogan (Tagline)</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => handleChange('slogan', e.target.value)}
                placeholder="E.g., Precision cuts for the modern man"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Description (About the Shop)</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Tell your clients about your shop's history, atmosphere, and specialties."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ── Region & Timezone ── */}
        <div className="pt-2 border-t border-crm-border/50">
          <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
            <span>🌐</span> Region &amp; Timezone
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Country / Region</label>
              <select
                value={formData.country}
                onChange={(e) => {
                  const selected = COUNTRY_OPTIONS.find(c => c.value === e.target.value);
                  if (selected) {
                    setFormData({
                      ...formData,
                      country: selected.value,
                      currency: selected.currency,
                      locale: selected.locale,
                      paymentGateway: DEFAULT_GATEWAY[selected.value] || 'STRIPE',
                    });
                    setSuccess(false);
                  }
                }}
                className={inputClass}
              >
                {COUNTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.currency}</option>
                ))}
              </select>
              <p className="text-crm-muted text-[11px] mt-1">
                Currency: {formData.currency} · Locale: {formData.locale}
              </p>
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className={inputClass}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} — {tz.value}
                  </option>
                ))}
              </select>
              <p className="text-crm-muted text-[11px] mt-1">All appointment times use this timezone.</p>
            </div>
          </div>
        </div>

        {/* ── Payment Gateway ── */}
        <div className="pt-2 border-t border-crm-border/50">
          <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
            <span>💳</span> Payment Gateway
          </h3>
          <p className="text-crm-muted mb-4 text-[13px]">
            Choose how your shop processes online payments for bookings, deposits, and gift cards.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAYMENT_GATEWAYS.filter(gw => gw.countries.includes(formData.country)).map((gw) => (
              <button
                key={gw.value}
                type="button"
                onClick={() => handleChange('paymentGateway', gw.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.paymentGateway === gw.value
                    ? 'border-crm-primary bg-crm-primary/10 shadow-sm'
                    : 'border-crm-border bg-crm-bg hover:border-crm-primary/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{gw.icon}</span>
                  <span className="font-bold text-crm-text text-[14px]">{gw.label}</span>
                </div>
                <p className="text-crm-muted text-[11px]">{gw.description}</p>
              </button>
            ))}
          </div>

          {/* Credential fields based on selected gateway */}
          {formData.paymentGateway === 'STRIPE' && (
            <div className="mt-4 p-4 bg-crm-bg rounded-lg border border-crm-border space-y-3">
              <h4 className="font-bold text-crm-text text-[13px] flex items-center gap-2">
                <span>⚡</span> Stripe Configuration
              </h4>
              <div>
                <label className={labelClass}>Stripe Connect Account ID</label>
                <input
                  type="text"
                  value={formData.stripeAccountId}
                  onChange={(e) => handleChange('stripeAccountId', e.target.value)}
                  placeholder="acct_1234567890"
                  className={inputClass}
                />
                <p className="text-crm-muted text-[11px] mt-1">
                  Your Stripe Connect account ID. Payments will be routed to this account.
                </p>
              </div>
            </div>
          )}

          {formData.paymentGateway === 'RAZORPAY' && (
            <div className="mt-4 p-4 bg-crm-bg rounded-lg border border-crm-border space-y-3">
              <h4 className="font-bold text-crm-text text-[13px] flex items-center gap-2">
                <span>⚡</span> Razorpay Configuration
              </h4>
              <div>
                <label className={labelClass}>Razorpay Key ID</label>
                <input
                  type="text"
                  value={formData.razorpayKeyId}
                  onChange={(e) => handleChange('razorpayKeyId', e.target.value)}
                  placeholder="rzp_live_..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Razorpay Key Secret</label>
                <input
                  type="password"
                  value={formData.razorpayKeySecret}
                  onChange={(e) => handleChange('razorpayKeySecret', e.target.value)}
                  placeholder="••••••••••••"
                  className={inputClass}
                />
                <p className="text-crm-muted text-[11px] mt-1">
                  Find these in your <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-crm-primary underline">Razorpay Dashboard → Settings → API Keys</a>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Booking Deposit ── */}
        <div className="pt-2 border-t border-crm-border/50">
          <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
            <span>🛡️</span> No-Show Deposit
          </h3>
          <p className="text-crm-muted mb-4 text-[13px]">
            Require a card hold for new bookings. Captured if the client doesn&apos;t show up.
          </p>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer text-[13px]">
              <input
                type="checkbox"
                checked={formData.depositRequired}
                onChange={(e) => handleChange('depositRequired', e.target.checked)}
                className="w-4 h-4 accent-brand-gold"
              />
              <span className="text-crm-muted">Require deposit for online bookings</span>
            </label>

            {formData.depositRequired && (
              <div>
                <label className={labelClass}>Deposit Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={formData.depositAmount}
                  onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
                  className="w-48 bg-crm-bg border border-crm-border shadow-sm rounded-lg p-2 text-crm-text text-[13px] focus:outline-none focus:ring-1 focus:ring-crm-primary/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="pt-4 border-t border-crm-border/50">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-bold text-[13px] transition-all ${
              isLoading
                ? 'bg-crm-surface text-crm-muted cursor-not-allowed'
                : 'bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 shadow-sm'
            }`}
          >
            {isLoading ? 'Saving...' : 'Save General Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
