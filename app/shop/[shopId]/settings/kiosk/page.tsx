import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import KioskSetupClient from '@/components/shop-admin/KioskSetupClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function SettingsSubNav({ shopId, active }: { shopId: string; active: string }) {
  const navLinks = [
    { href: `/shop/${shopId}/settings`, label: '🎨 Appearance', key: 'appearance' },
    { href: `/shop/${shopId}/settings/booking`, label: '📅 Booking & Hours', key: 'booking' },
    { href: `/shop/${shopId}/settings/notifications`, label: '🔔 Notifications', key: 'notifications' },
    { href: `/shop/${shopId}/settings/commissions`, label: '💼 Commissions', key: 'commissions' },
    { href: `/shop/${shopId}/settings/kiosk`, label: '📱 Kiosk', key: 'kiosk' },
  ];
  return (
    <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10 overflow-x-auto">
      {navLinks.map(l => (
        <Link key={l.key} href={l.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${l.key === active ? 'bg-brand-gold text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default async function KioskSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) notFound();
  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Kiosk Setup" shopId={shopId} userRole={data.userRole} activeTab="settings">
      <SettingsSubNav shopId={shopId} active="kiosk" />
      <KioskSetupClient shopId={shopId} shopName={data.shop.name} />
    </ShopAdminLayout>
  );
}

