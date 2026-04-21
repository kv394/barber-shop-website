'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteShopButton from '@/components/shop-admin/DeleteShopButton';
import UsageAnalysisModal from '@/components/siteadmin/UsageAnalysisModal';
import AssignTemplateModal from '@/components/siteadmin/AssignTemplateModal';

type ShopData = {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  aiTokens: number;
  users: { id: string; role: string; name: string | null; email: string }[];
  _count: { users: number; services: number; reviews: number };
};

export default function SiteAdminShopsPage() {
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingShop, setAnalyzingShop] = useState<{ id: string, name: string } | null>(null);
  const [assigningTemplateShop, setAssigningTemplateShop] = useState<{ id: string, name: string, template: string } | null>(null);

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/siteadmin/shops');
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
    return <div className="text-center py-12 text-crm-muted">Loading shops...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-6">
        <div>
          <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl font-bold">Shop Management</h1>
          <p className="text-crm-muted text-[13px]">{shops.length} shop{shops.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <Link
          href="/"
          className="bg-crm-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors text-[13px]"
        >
          + Create New Shop
        </Link>
      </div>

      <div className="mb-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex gap-4 items-start">
        <div className="text-2xl mt-1">🧠</div>
        <div>
          <h3 className="text-indigo-300 font-bold mb-1 text-lg font-bold">AI-Powered Usage & Billing Analysis</h3>
          <p className="text-indigo-200/70 leading-relaxed text-[13px]">
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
            <div key={shop.id} className="bg-crm-surface rounded-xl border border-crm-border shadow-sm p-6 hover:border-crm-border transition">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Shop Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-crm-text truncate text-lg font-bold">{shop.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      hasAdmin
                        ? 'bg-status-confirmed/20 text-status-confirmed border border-status-confirmed/30'
                        : 'bg-status-pending/20 text-status-pending border border-status-pending/30'
                    }`}>
                      {hasAdmin ? 'Active' : 'Needs Admin'}
                    </span>
                  </div>
                  <p className="text-crm-muted font-mono mb-3 text-[13px]">ID: {shop.id}</p>

                  {admins.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[11px] text-crm-muted">Admin{admins.length > 1 ? 's' : ''}: </span>
                      {admins.map((a, i) => (
                        <span key={a.id} className="text-[11px] text-crm-accent">
                          {a.name || a.email}{i < admins.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-[11px] text-crm-muted mt-2">
                    <span>👥 {shop._count.users} users</span>
                    <span>✂️ {staffCount} staff</span>
                    <span>💇 {shop._count.services} services</span>
                    <span>⭐ {shop._count.reviews} reviews</span>
                    <span>🤖 {shop.aiTokens || 0} AI tokens</span>
                  </div>

                  <p className="text-crm-muted mt-2 text-[13px]">
                    Created: {new Date(shop.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => setAnalyzingShop({ id: shop.id, name: shop.name })}
                    className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-indigo-600/40 transition-colors"
                  >
                    📊 Usage Report
                  </button>
                  <Link
                    href={`/shop/${shop.id}/settings/team`}
                    className="bg-crm-primary text-white px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors"
                  >
                    Assign Team
                  </Link>
                  <button
                    onClick={() => setAssigningTemplateShop({ id: shop.id, name: shop.name, template: shop.template || 'modern' })}
                    className="bg-crm-surface text-crm-text border border-crm-border px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-crm-bg transition-colors"
                  >
                    🎨 Assign Template
                  </button>
                  <DeleteShopButton shopId={shop.id} shopName={shop.name} onSuccess={fetchShops} />
                </div>
              </div>
            </div>
          );
        })}

        {shops.length === 0 && (
          <div className="bg-crm-surface rounded-xl border border-crm-border shadow-sm p-12 text-center">
            <p className="text-crm-muted text-[13px]">No shops created yet.</p>
            <Link href="/" className="text-crm-accent hover:underline mt-2 inline-block">Create your first shop →</Link>
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

      {assigningTemplateShop && (
        <AssignTemplateModal
          shopId={assigningTemplateShop.id}
          shopName={assigningTemplateShop.name}
          currentTemplate={assigningTemplateShop.template}
          onClose={() => setAssigningTemplateShop(null)}
          onSuccess={() => {
            setAssigningTemplateShop(null);
            fetchShops();
          }}
        />
      )}
    </div>
  );
}
