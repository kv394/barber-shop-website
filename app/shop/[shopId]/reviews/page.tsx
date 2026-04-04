import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ReviewsManager from '@/components/ReviewsManager';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) notFound();

  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Reviews & Ratings" shopId={shopId} userRole={data.userRole} activeTab="reviews">
      <ReviewsManager shopId={shopId} />
    </ShopAdminLayout>
  );
}

