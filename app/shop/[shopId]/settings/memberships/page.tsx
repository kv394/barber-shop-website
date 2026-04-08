import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import MembershipManager from '@/components/shop-admin/MembershipManager';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function SettingsSubNav({ shopId, active }: { shopId: string; active: string }) {
  const navLinks = [
    { href: `/shop/${shopId}/settings`, label: '🎨 Appearance', key: 'appearance' },
    { href: `/shop/${shopId}/settings/booking`, label: '📅 Booking & Hours', key: 'booking' },
    { href: `/shop/${shopId}/settings/resources`, label: '🪑 Resources', key: 'resources' },
    { href: `/shop/${shopId}/settings/forms`, label: '📝 Intake Forms', key: 'forms' },
    { href: `/shop/${shopId}/settings/memberships`, label: '⭐ Memberships', key: 'memberships' },
    { href: `/shop/${shopId}/settings/notifications`, label: '🔔 Notifications', key: 'notifications' },
    { href: `/shop/${shopId}/settings/commissions`, label: '💼 Commissions', key: 'commissions' },
    { href: `/shop/${shopId}/settings/kiosk`, label: '📱 Kiosk', key: 'kiosk' },
  ];
  return (
    <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10 overflow-x-auto">
      {navLinks.map(l => (
        <Link key={l.key} href={l.href} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${active === l.key ? 'bg-brand-gold text-brand-dark' : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'}`}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default async function MembershipsSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) notFound();
  
  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Membership Tiers" shopId={shopId} userRole={data.userRole} activeTab="settings">
      <SettingsSubNav shopId={shopId} active="memberships" />
      <MembershipManager shopId={shopId} />
    </ShopAdminLayout>
  );
}
