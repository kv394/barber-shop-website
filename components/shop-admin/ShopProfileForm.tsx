'use client';;
import Image from 'next/image';

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
 initialShopType?: string;
 initialTravelFee?: number;
 initialMaxTravelRadius?: number | null;
 initialBaseLocation?: string;
 initialStripeConnectOnboarded?: boolean;
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
 initialShopType,
 initialTravelFee,
 initialMaxTravelRadius,
 initialBaseLocation,
 initialStripeConnectOnboarded = false,
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
 shopType: initialShopType || 'PHYSICAL',
 travelFee: initialTravelFee || 0,
 maxTravelRadius: initialMaxTravelRadius || '',
 baseLocation: initialBaseLocation || '',
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
 <label htmlFor="shop-name" className={labelClass}>Shop Name</label>
<input
id="shop-name"
type="text"
value={formData.name}
onChange={(e) => handleChange('name', e.target.value)}
placeholder="E.g., The Gentleman's Barbershop"
className={inputClass}
/>
 </div>
 <div>
 <label htmlFor="shop-slogan" className={labelClass}>Slogan (Tagline)</label>
<input
id="shop-slogan"
type="text"
value={formData.slogan}
onChange={(e) => handleChange('slogan', e.target.value)}
placeholder="E.g., Precision cuts for the modern man"
className={inputClass}
/>
 </div>
 <div>
 <label htmlFor="shop-description" className={labelClass}>Description (About the Shop)</label>
<textarea
id="shop-description"
rows={3}
value={formData.description}
onChange={(e) => handleChange('description', e.target.value)}
placeholder="Tell your clients about your shop's history, atmosphere, and specialties."
className={inputClass}
/>
 </div>
 </div>
 </div>

 {/* ── Business Model ── */}
 <div className="pt-2 border-t border-crm-border/50">
 <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
 <span>🚀</span> Business Model
 </h3>
 <div className="space-y-4">
 <div>
 <label htmlFor="shop-type" className={labelClass}>Shop Type</label>
<select
id="shop-type"
value={formData.shopType}
onChange={(e) => handleChange('shopType', e.target.value)}
className={inputClass}
>
<option value="PHYSICAL">Physical Salon (Customers come to you)</option>
<option value="MOBILE">Mobile Stylist (You go to customers)</option>
<option value="HYBRID">Hybrid (Both physical and house calls)</option>
</select>
 </div>
 
 <div>
 <label htmlFor="shop-address" className={labelClass}>Shop Address / Base Location</label>
<input
id="shop-address"
type="text"
value={formData.baseLocation || ''}
onChange={(e) => handleChange('baseLocation', e.target.value)}
placeholder="e.g. 123 Main St, Houston, TX 77002"
className={inputClass}
/>
 <p className="text-crm-muted text-[11px] mt-1">For physical shops, this is your storefront. For mobile stylists, this is your starting point.</p>
 </div>

 {(formData.shopType === 'MOBILE' || formData.shopType === 'HYBRID') && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label htmlFor="travel-fee" className={labelClass}>Flat Travel Fee ($)</label>
<input
id="travel-fee"
type="number"
min="0"
step="0.50"
value={formData.travelFee}
onChange={(e) => handleChange('travelFee', parseFloat(e.target.value) || 0)}
className={inputClass}
/>
 <p className="text-crm-muted text-[11px] mt-1">Fee automatically added to house calls.</p>
 </div>
 <div>
 <label htmlFor="max-travel-radius" className={labelClass}>Max Travel Radius</label>
<input
id="max-travel-radius"
type="number"
min="1"
step="1"
value={formData.maxTravelRadius || ''}
onChange={(e) => handleChange('maxTravelRadius', e.target.value ? parseInt(e.target.value) : null)}
placeholder="e.g. 20 miles"
className={inputClass}
/>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* ── Region & Timezone ── */}
 <div className="pt-2 border-t border-crm-border/50">
 <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
 <span>🌐</span> Region &amp; Timezone
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label htmlFor="shop-country" className={labelClass}>Country / Region</label>
<select
id="shop-country"
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
 <label htmlFor="shop-timezone" className={labelClass}>Timezone</label>
<select
id="shop-timezone"
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

  {/* ── Payments Powered by KutzApp ── */}
  <div className="pt-2 border-t border-crm-border/50">
    <h3 className="font-bold text-crm-text mb-4 text-[15px] flex items-center gap-2">
      <span>💳</span> Payment Processing
    </h3>
    <div className="p-4 bg-crm-primary/5 rounded-lg border border-crm-primary/20 space-y-4">
      <div>
        <h4 className="font-bold text-crm-text text-[13px] flex items-center gap-2">
          <span className="text-crm-primary">✓</span> Payments Powered by KutzApp
        </h4>
        <p className="text-crm-muted text-[12px] mt-1">
          KutzApp securely handles all credit card, Apple Pay, and Google Pay transactions. Payouts are routed directly to your linked bank account.
        </p>
      </div>

      {initialStripeConnectOnboarded ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-status-confirmed/20 text-status-confirmed rounded-full text-[12px] font-medium border border-status-confirmed/30">
          <span className="text-[14px]">✓</span> Bank Account Connected - Payouts Enabled
        </div>
      ) : (
        <button
          onClick={() => { window.location.href = `/api/stripe/connect?shopId=${shopId}` }}
          type="button"
          className="bg-[#635BFF] hover:bg-[#4B45D6] text-white px-5 py-2.5 rounded-lg font-medium text-[13px] shadow-sm transition-colors flex items-center gap-2"
        >
          <span>🏦</span> Connect Bank Account to Receive Payouts
        </button>
      )}
    </div>
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
 className="w-4 h-4 accent-brand-indigo"
 />
 <span className="text-crm-muted">Require deposit for online bookings</span>
 </label>

 {formData.depositRequired && (
 <div>
 <label htmlFor="deposit-amount" className={labelClass}>Deposit Amount ($)</label>
 <input
 id="deposit-amount"
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
