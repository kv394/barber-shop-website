import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import FormBuilder from '@/components/shop-admin/FormBuilder';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


export default async function FormsSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();
  
  const settingsTabs = [
    { id: 'settings', label: 'Appearance', href: `/shop/${shopId}/settings` },
    { id: 'settings-booking', label: 'Booking & Hours', href: `/shop/${shopId}/settings/booking` },
    { id: 'services', label: 'Services', href: `/shop/${shopId}/config/services` },
    { id: 'products', label: 'Products', href: `/shop/${shopId}/config/products` },
    { id: 'settings-resources', label: 'Resources', href: `/shop/${shopId}/settings/resources` },
    { id: 'settings-forms', label: 'Intake Forms', href: `/shop/${shopId}/settings/forms` },
    { id: 'settings-memberships', label: 'Memberships', href: `/shop/${shopId}/settings/memberships` },
    { id: 'settings-notifications', label: 'Notifications', href: `/shop/${shopId}/settings/notifications` },
    { id: 'settings-commissions', label: 'Commissions', href: `/shop/${shopId}/settings/commissions` },
    { id: 'settings-kiosk', label: 'Kiosk', href: `/shop/${shopId}/settings/kiosk` },
    { id: 'settings-billing', label: 'Billing', href: `/shop/${shopId}/settings/billing` }
  ];

  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Digital Intake Forms" tabs={data.userRole === 'SITE_ADMIN' ? undefined : settingsTabs} shopId={shopId} userRole={data.userRole} activeTab="settings-forms">
      <FormBuilder shopId={shopId} />
    </ShopAdminLayout>
  );
}
