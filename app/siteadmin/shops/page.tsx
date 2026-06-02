'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteShopButton from '@/components/shop-admin/DeleteShopButton';
import UsageAnalysisModal from '@/components/siteadmin/UsageAnalysisModal';
import AssignShopAdminModal from '@/components/siteadmin/AssignShopAdminModal';
import PremiumFeaturesModal from '@/components/siteadmin/PremiumFeaturesModal';

type ShopData = {
 id: string;
 name: string;
 companyName: string | null;
 template: string;
 createdAt: string;
 isActive: boolean;
 supportAccessEnabled: boolean;
 supportAccessExpiresAt: string | null;
 deletedAt: string | null;
 aiTokens: number;
 users: { id: string; role: string; name: string | null; email: string }[];
 _count: { users: number; services: number; reviews: number };
};

export default function SiteAdminShopsPage() {
 const [shops, setShops] = useState<ShopData[]>([]);
 const [loading, setLoading] = useState(true);
 const [analyzingShop, setAnalyzingShop] = useState<{ id: string, name: string } | null>(null);
 const [assigningAdminShop, setAssigningAdminShop] = useState<{ id: string, name: string } | null>(null);
 const [managingFeaturesShop, setManagingFeaturesShop] = useState<{ id: string, name: string } | null>(null);

 const [error, setError] = useState<string | null>(null);

 const fetchShops = async () => {
 try {
 const res = await fetch('/api/siteadmin/shops');
 if (res.ok) {
 const data = await res.json();
 setShops(data.shops || []);
 setError(null);
 } else {
 const errorData = await res.json().catch(() => ({}));
 setError(`API Error ${res.status}: ${errorData.error || res.statusText}`);
 }
 } catch (err: any) {
 console.error('Failed to fetch shops', err);
 setError(`Network Error: ${err.message}`);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { fetchShops(); }, []);

 if (loading) {
 return <div className="text-center py-12 text-crm-muted">Loading shops...</div>;
 }

 const groupedShops = shops.reduce((acc, shop) => {
 const key = shop.companyName || shop.name;
 if (!acc[key]) {
 acc[key] = [];
 }
 acc[key].push(shop);
 return acc;
 }, {} as Record<string, ShopData[]>);

 return (
 <div>
 {error && (
   <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
     <h3 className="font-bold">Failed to load shops</h3>
     <p className="text-sm mt-1">{error}</p>
   </div>
 )}
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-6">
 <div>
 <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl">Shop Management</h1>
 <p className="text-crm-muted text-[13px]">{shops.length} shop{shops.length !== 1 ? 's' : ''} on the platform</p>
 </div>
 <Link
 href="/siteadmin/shops/new"
 className="bg-crm-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors text-[13px]"
 >
 + Create New Shop
 </Link>
 </div>

 <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex gap-4 items-start">
 <div className="text-2xl mt-1">🧠</div>
 <div>
 <h3 className="text-indigo-900 font-bold mb-1 text-lg">AI-Powered Usage & Billing Analysis</h3>
 <p className="text-indigo-800/80 leading-relaxed text-[13px]">
 Click the <strong className="text-indigo-900">AI Usage Report</strong> button on any shop below to instantly generate a custom SaaS pricing recommendation. 
 The system securely feeds the shop's entire lifetime resource consumption (users, bookings, intake forms, gallery photos) into Gemini AI to calculate estimated storage costs and suggest a personalized monthly subscription tier.
 </p>
 </div>
 </div>

 <div className="space-y-8">
 {Object.entries(groupedShops).map(([companyName, companyShops]) => (
 <div key={companyName} className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden shadow-sm">
 <div className="bg-crm-bg border-b border-crm-border px-6 py-4">
 <h2 className="text-lg font-bold text-crm-text flex items-center gap-2">
 <span className="text-crm-primary">🏢</span> {companyName}
 </h2>
 </div>
 <div className="divide-y divide-crm-border">
 {companyShops.map(shop => {
 const hasAdmin = shop.users.some(u => u.role === 'SHOP_ADMIN');
 const admins = shop.users.filter(u => u.role === 'SHOP_ADMIN');
 const staffCount = shop.users.filter(u => u.role === 'STAFF').length;

 return (
 <div key={shop.id} className="p-6 hover:bg-crm-bg/50 transition">
 <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
 {/* Shop Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2">
 <h3 className="font-bold text-crm-text truncate text-[15px]">{shop.name}</h3>
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
  hasAdmin
    ? 'bg-status-confirmed/20 text-status-confirmed border border-status-confirmed/30'
    : 'bg-status-pending/20 text-status-pending border border-status-pending/30'
}`} title={hasAdmin ? 'This shop has an active admin assigned.' : 'This shop currently has no active SHOP_ADMIN users. Click Assign Team to resolve this.'}>
  {hasAdmin ? 'Active Admin' : 'Needs Admin'}
</span>
 {!shop.isActive && (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-status-cancelled/20 text-status-cancelled border border-status-cancelled/30 animate-pulse">
 Inactive
 </span>
 )}
 </div>
 <p className="text-crm-muted font-mono mb-3 text-[12px]">ID: {shop.id}</p>

 {admins.length > 0 && (
 <div className="mb-2">
 <span className="text-[12px] text-crm-muted font-semibold">Admin{admins.length > 1 ? 's' : ''}: </span>
 {admins.map((a, i) => (
 <span key={a.id} className="text-[12px] text-crm-accent">
 {a.name || a.email}{i < admins.length - 1 ? ', ' : ''}
 </span>
 ))}
 </div>
 )}

 <div className="flex flex-wrap gap-3 text-[12px] text-crm-muted mt-3">
 <span className="flex items-center gap-1"><span className="text-[14px]">👥</span> {shop._count.users} users</span>
 <span className="flex items-center gap-1"><span className="text-[14px]">✂️</span> {staffCount} staff</span>
 <span className="flex items-center gap-1"><span className="text-[14px]">💇</span> {shop._count.services} services</span>
 <span className="flex items-center gap-1"><span className="text-[14px]">⭐</span> {shop._count.reviews} reviews</span>
 <span className="flex items-center gap-1"><span className="text-[14px]">🤖</span> {shop.aiTokens || 0} AI tokens</span>
 </div>

 <p className="text-crm-muted mt-3 text-[11px] uppercase tracking-wide">
 Created: {new Date(shop.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end mt-4 lg:mt-0">
 <Link
 href={`/siteadmin/shops/${shop.id}`}
 className="bg-white/5 text-white border border-white/10 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-white/10 transition-colors flex items-center gap-1"
 >
 <span>👁️</span> Details
 </Link>
 <button
 onClick={() => setAnalyzingShop({ id: shop.id, name: shop.name })}
 className="bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-indigo-600/20 transition-colors"
 >
 📊 Usage
 </button>
 <button
 onClick={() => setManagingFeaturesShop({ id: shop.id, name: shop.name })}
 className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-amber-500/20 transition-colors"
 >
 💎 Features
 </button>
  {(() => {
    const isExpired = shop.supportAccessExpiresAt ? new Date(shop.supportAccessExpiresAt) < new Date() : false;
    const canImpersonate = shop.supportAccessEnabled && !isExpired;

    return (
      <button
        onClick={async () => {
          if (!canImpersonate) {
            alert('This shop has not granted Support Access. Please ask the shop owner to enable it in their settings.');
            return;
          }
          try {
            const res = await fetch('/api/siteadmin/impersonate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shopId: shop.id })
            });
            if (res.ok) {
              window.location.href = `/shop/${shop.id}`;
            } else {
              alert('Failed to impersonate shop. ' + (await res.json()).error);
            }
          } catch (err) {
            console.error(err);
            alert('Error impersonating shop');
          }
        }}
        disabled={!canImpersonate}
        title={canImpersonate ? 'Impersonate Shop' : 'Shop owner must enable Support Access in their settings first.'}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
          canImpersonate 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
            : 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed opacity-60'
        }`}
      >
        {canImpersonate ? '🎭 Impersonate' : '🔒 No Access'}
      </button>
    );
  })()}
 <button
 onClick={async () => {
 try {
 const res = await fetch(`/api/siteadmin/shops/${shop.id}/suspend`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ isActive: !shop.isActive })
 });
 if (res.ok) {
 fetchShops();
 } else {
 alert('Failed to update shop status');
 }
 } catch (err) {
 console.error(err);
 alert('Error updating shop status');
 }
 }}
 className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
 shop.isActive 
 ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
 : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
 }`}
 >
 {shop.isActive ? '⏸️ Suspend' : '▶️ Reactivate'}
 </button>
 <button
 onClick={() => setAssigningAdminShop({ id: shop.id, name: shop.name })}
 className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
   !hasAdmin 
     ? 'bg-status-pending text-black border-status-pending shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse hover:bg-amber-400' 
     : 'bg-crm-primary text-white border-transparent hover:bg-crm-surface hover:text-crm-primary hover:border-crm-primary/30'
 }`}
 >
 Assign Team
 </button>
 <DeleteShopButton shopId={shop.id} shopName={shop.name} onSuccess={fetchShops} isActive={shop.isActive} />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}

 {shops.length === 0 && (
 <div className="bg-crm-surface rounded-xl border border-crm-border shadow-sm p-12 text-center">
 <p className="text-crm-muted text-[13px]">No shops created yet.</p>
 <Link href="/" className="text-crm-accent hover:underline mt-2 inline-block text-[13px]">Create your first shop →</Link>
 </div>
 )}
 </div>

 {analyzingShop && (
 <UsageAnalysisModal
 shopId={analyzingShop.id}
 shopName={analyzingShop.name}
 onClose={() => setAnalyzingShop(null)}
 />
 )}

 {managingFeaturesShop && (
 <PremiumFeaturesModal
 shopId={managingFeaturesShop.id}
 shopName={managingFeaturesShop.name}
 onClose={() => setManagingFeaturesShop(null)}
 onSuccess={() => {
 setManagingFeaturesShop(null);
 fetchShops();
 }}
 />
 )}

 {assigningAdminShop && (
 <AssignShopAdminModal
 shopId={assigningAdminShop.id}
 shopName={assigningAdminShop.name}
 onClose={() => setAssigningAdminShop(null)}
 onSuccess={() => {
 setAssigningAdminShop(null);
 fetchShops();
 }}
 />
 )}
 </div>
 );
}
