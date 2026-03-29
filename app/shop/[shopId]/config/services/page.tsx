import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { ServiceManagement } from '@/app/components/ServiceManagement';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';

export default async function ServicesConfigPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const data = await getShopLayoutData(userId, params.shopId);
  if (!data) notFound();

  const shopSlug = data.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={shopSlug}
      pageTitle="Manage Services"
      shopId={params.shopId}
      userRole={data.userRole}
      activeTab="setup"
    >
      <ServiceManagement shopId={params.shopId} />
    </ShopAdminLayout>
  );
}
