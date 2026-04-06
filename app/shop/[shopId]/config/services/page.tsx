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

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={shopSlug}
      pageTitle="Manage Services"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="services"
    >
      <ServiceManagement shopId={shopId} />
    </ShopAdminLayout>
  );
}
