import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import PortfolioManager from '@/components/shop-admin/PortfolioManager';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function StaffPortfolioPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin && !data.isStaff)) notFound();
  
  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Staff Portfolio" shopId={shopId} userRole={data.userRole} activeTab="portfolio">
      <PortfolioManager shopId={shopId} currentUserId={userId} userRole={data.userRole as string} />
    </ShopAdminLayout>
  );
}
