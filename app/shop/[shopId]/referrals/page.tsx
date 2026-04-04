import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ReferralTracker from '@/components/ReferralTracker';

export const revalidate = 60;

export default async function ReferralsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) return redirect('/');

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Referral Program"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="referrals"
    >
      <ReferralTracker shopId={shopId} />
    </ShopAdminLayout>
  );
}

