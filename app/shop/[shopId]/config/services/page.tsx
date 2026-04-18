import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { ServiceManagement } from '@/components/shop-admin/ServiceManagement';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';

export default async function ServicesConfigPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/sign-in');

  const data = await getShopLayoutData(userId, shopId);
  if (!data) notFound();

  const shopSlug = data.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

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
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={shopSlug}
      pageTitle="Manage Services"
      tabs={data.userRole === 'SITE_ADMIN' ? undefined : settingsTabs}
      shopId={shopId}
      userRole={data.userRole}
      activeTab="services"
    >
      <ServiceManagement shopId={shopId} />
    </ShopAdminLayout>
  );
}
