import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { ServiceManagement } from '@/components/shop-admin/ServiceManagement';
import { AddonManagement } from '@/components/shop-admin/AddonManagement';
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

  const configTabs = [
    { id: 'services', label: 'Services', href: `/shop/${shopId}/config/services` },
    { id: 'products', label: 'Products', href: `/shop/${shopId}/config/products` },
    { id: 'settings-memberships', label: 'Memberships', href: `/shop/${shopId}/settings/memberships` },
    { id: 'settings-booking', label: 'Booking & Hours', href: `/shop/${shopId}/settings/booking` },
    { id: 'settings-resources', label: 'Resources', href: `/shop/${shopId}/settings/resources` },
    { id: 'settings-forms', label: 'Intake Forms', href: `/shop/${shopId}/settings/forms` }
  ];

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={shopSlug}
      pageTitle="Manage Services"
      shopId={shopId}
      userRole={data.userRole}
    >
      <ServiceManagement shopId={shopId} currency={data.shop.currency} />
      <AddonManagement shopId={shopId} currency={data.shop.currency} />
    </ShopAdminLayout>
  );
}
