import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import DynamicPricingSetup from '@/components/shop-admin/DynamicPricingSetup';

export const dynamic = 'force-dynamic';

export default async function DynamicPricingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();

  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Dynamic Pricing" shopId={shopId} userRole={data.userRole}>
      <DynamicPricingSetup shopId={shopId} />
    </ShopAdminLayout>
  );
}
