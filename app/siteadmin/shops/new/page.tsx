'use client';;
import Image from 'next/image';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateShopPage() {
 const [newShopName, setNewShopName] = useState('');
 const [newShopAdminEmail, setNewShopAdminEmail] = useState('');
 const [kioskEmail, setKioskEmail] = useState('');
 const [country, setCountry] = useState<'US'|'IN'>('US');
 const [address, setAddress] = useState('');
 const [createError, setCreateError] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const router = useRouter();

 const handleCreateShop = async (e: FormEvent) => {
 e.preventDefault();
 if (!newShopName.trim() || !kioskEmail.trim() || !address.trim()) {
 setCreateError("Shop Name, Address, and Kiosk Email are required.");
 return;
 };
 setCreateError(null);
 setIsSubmitting(true);

 try {
 const response = await fetch('/api/shops', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 name: newShopName,
 kioskEmail: kioskEmail,
 adminEmail: newShopAdminEmail.trim() || null,
 country: country,
 address: address
 }),
 });

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.error || 'Failed to create shop');
 }

 router.push('/siteadmin/shops');
 } catch (error: any) {
 console.error('Failed to create shop:', error);
 setCreateError(error.message || 'An unexpected error occurred');
 setIsSubmitting(false);
 }
 };

 return (
 <div className="max-w-2xl mx-auto py-8">
 <div className="flex items-center gap-4 mb-8">
 <Link href="/siteadmin/shops" className="text-crm-muted hover:text-crm-text">
 &larr; Back
 </Link>
 <div>
 <h1 className="font-serif font-bold text-crm-accent text-2xl">Create New Shop</h1>
 <p className="text-crm-muted text-[13px]">Provision a new barbershop instance on the platform.</p>
 </div>
 </div>

 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-2xl p-8">
 <form className="space-y-6" onSubmit={handleCreateShop}>
 <div>
 <label className="block text-[13px] font-medium text-crm-muted mb-1.5">Shop Name</label>
 <input
 type="text"
 placeholder="e.g. Heritage Haircuts"
 value={newShopName}
 onChange={e => setNewShopName(e.target.value)}
 className="w-full px-4 py-2 bg-crm-bg border border-crm-border rounded-lg text-crm-text focus:outline-none focus:ring-2 focus:ring-crm-primary"
 required
 />
 </div>
 
 <div>
 <label className="block text-[13px] font-medium text-crm-muted mb-1.5">Physical Address</label>
 <input
 type="text"
 placeholder="e.g. 123 Main St, City, ST 12345"
 value={address}
 onChange={e => setAddress(e.target.value)}
 className="w-full px-4 py-2 bg-crm-bg border border-crm-border rounded-lg text-crm-text focus:outline-none focus:ring-2 focus:ring-crm-primary"
 required
 />
 </div>

 <div>
 <label className="block text-[13px] font-medium text-crm-muted mb-1.5">Dedicated Kiosk Email</label>
 <input
 type="email"
 placeholder="kiosk@shopdomain.com"
 value={kioskEmail}
 onChange={e => setKioskEmail(e.target.value)}
 className="w-full px-4 py-2 bg-crm-bg border border-crm-border rounded-lg text-crm-text focus:outline-none focus:ring-2 focus:ring-crm-primary"
 required
 />
 <p className="text-[11px] text-crm-muted mt-1">Used exclusively for the in-store iPad check-in app.</p>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-crm-muted mb-1.5">Admin Email (Optional)</label>
 <input
 type="email"
 placeholder="owner@shopdomain.com"
 value={newShopAdminEmail}
 onChange={e => setNewShopAdminEmail(e.target.value)}
 className="w-full px-4 py-2 bg-crm-bg border border-crm-border rounded-lg text-crm-text focus:outline-none focus:ring-2 focus:ring-crm-primary"
 />
 <p className="text-[11px] text-crm-muted mt-1">This user will automatically be granted SHOP_ADMIN privileges.</p>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-crm-muted mb-1.5">Region / Currency</label>
 <select
 value={country}
 onChange={e => setCountry(e.target.value as 'US'|'IN')}
 className="w-full px-4 py-2 bg-crm-bg border border-crm-border rounded-lg text-crm-text focus:outline-none focus:ring-2 focus:ring-crm-primary"
 >
 <option value="US">United States (USD, Stripe)</option>
 <option value="IN">India (INR, Razorpay)</option>
 </select>
 </div>

 {createError && (
 <div className="bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled p-3 rounded-lg text-[13px]">
 {createError}
 </div>
 )}

 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full bg-crm-primary text-white py-3 rounded-lg font-bold hover:bg-crm-primary/90 disabled:opacity-50 transition-colors"
 >
 {isSubmitting ? 'Creating Shop...' : 'Create Shop Instance'}
 </button>
 </form>
 </div>
 </div>
 );
}
