import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import CampaignBuilder from '@/components/marketing/CampaignBuilder';

export const dynamic = "force-dynamic";

export default async function CampaignsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) return redirect('/');

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Marketing Campaigns"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="campaigns"
    >
      <CampaignBuilder shopId={shopId} />
    </ShopAdminLayout>
  );
}

