import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import Link from 'next/link';
import TemplatesClientPage from './TemplatesClientPage';

export const dynamic = "force-dynamic";

export default async function ShopTemplatesPage({ 
  params 
}: { 
  params: Promise<{ shopId: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);

  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) {
    notFound();
  }

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="AI Templates"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="settings"
    >
      {/* Settings sub-nav */}
      <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10 overflow-x-auto">
        {[
          { href: `/shop/${shopId}/settings`, label: '🎨 Appearance' },
          { href: `/shop/${shopId}/settings/templates`, label: '✨ AI Templates', active: true },
          { href: `/shop/${shopId}/settings/booking`, label: '📅 Booking & Hours' },
          { href: `/shop/${shopId}/settings/notifications`, label: '🔔 Notifications' },
          { href: `/shop/${shopId}/settings/commissions`, label: '💼 Commissions' },
          { href: `/shop/${shopId}/settings/kiosk`, label: '📱 Kiosk' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${l.active ? 'bg-brand-gold text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            {l.label}
          </Link>
        ))}
      </div>

      <TemplatesClientPage shopId={shopId} isSuperAdmin={data.isSuperAdmin} />
    </ShopAdminLayout>
  );
}
