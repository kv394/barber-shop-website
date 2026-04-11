'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteShopButton from '@/components/shop-admin/DeleteShopButton';
import UsageAnalysisModal from '@/components/superadmin/UsageAnalysisModal';

type ShopData = {
  id: string;
  name: string;
  createdAt: string;
  users: { id: string; role: string; name: string | null; email: string }[];
  _count: { users: number; services: number; reviews: number };
};

export default function SuperAdminShopsPage() {
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingShop, setAnalyzingShop] = useState<{ id: string, name: string } | null>(null);

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/superadmin/shops');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
      }
    } catch {
      console.error('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, []);

  if (loading) {
    return <div className="text-center py-12 text-botanical-muted">Loading shops...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-botanical-accent mb-2">Shop Management</h1>
          <p className="text-botanical-muted">{shops.length} shop{shops.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <Link
          href="/"
          className="bg-botanical-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-white transition-colors text-sm"
        >
          + Create New Shop
        </Link>
      </div>

      <div className="mb-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex gap-4 items-start">
        <div className="text-2xl mt-1">🧠</div>
        <div>
          <h3 className="text-indigo-300 font-bold text-sm mb-1">AI-Powered Usage & Billing Analysis</h3>
          <p className="text-xs text-indigo-200/70 leading-relaxed">
            Click the <strong className="text-indigo-300">AI Usage Report</strong> button on any shop below to instantly generate a custom SaaS pricing recommendation. 
            The system securely feeds the shop's entire lifetime resource consumption (users, bookings, intake forms, gallery photos) into Gemini AI to calculate estimated storage costs and suggest a personalized monthly subscription tier.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {shops.map(shop => {
          const hasAdmin = shop.users.some(u => u.role === 'SHOP_ADMIN');
          const admins = shop.users.filter(u => u.role === 'SHOP_ADMIN');
          const staffCount = shop.users.filter(u => u.role === 'STAFF').length;

          return (
            <div key={shop.id} className="bg-botanical-surface rounded-xl border border-botanical-border p-6 hover:border-botanical-border transition">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Shop Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-botanical-text truncate">{shop.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      hasAdmin
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {hasAdmin ? 'Active' : 'Needs Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-botanical-muted font-mono mb-3">ID: {shop.id}</p>

                  {admins.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-botanical-muted">Admin{admins.length > 1 ? 's' : ''}: </span>
                      {admins.map((a, i) => (
                        <span key={a.id} className="text-xs text-botanical-accent">
                          {a.name || a.email}{i < admins.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-botanical-muted mt-2">
                    <span>👥 {shop._count.users} users</span>
                    <span>✂️ {staffCount} staff</span>
                    <span>💇 {shop._count.services} services</span>
                    <span>⭐ {shop._count.reviews} reviews</span>
                  </div>

                  <p className="text-xs text-botanical-muted mt-2">
                    Created: {new Date(shop.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => setAnalyzingShop({ id: shop.id, name: shop.name })}
                    className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600/40 transition-colors"
                  >
                    📊 Usage Report
                  </button>
                  <Link
                    href={`/shop/${shop.id}/settings/team`}
                    className="bg-botanical-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-white transition-colors"
                  >
                    Assign Team
                  </Link>
                  <DeleteShopButton shopId={shop.id} shopName={shop.name} onSuccess={fetchShops} />
                </div>
              </div>
            </div>
          );
        })}

        {shops.length === 0 && (
          <div className="bg-botanical-surface rounded-xl border border-botanical-border p-12 text-center">
            <p className="text-botanical-muted text-lg">No shops created yet.</p>
            <Link href="/" className="text-botanical-accent hover:underline mt-2 inline-block">Create your first shop →</Link>
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
    </div>
  );
}
