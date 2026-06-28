import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import AdminOnboardingVideo from '@/components/shop-admin/AdminOnboardingVideo';

export const dynamic = 'force-dynamic';

export default async function TrainingOnboardingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return redirect('/sign-in');

  const { shopId } = await params;
  const data = await getShopLayoutData(user.id, shopId);
  if (!data) return redirect('/');

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Admin Training"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="training"
    >
      <AdminOnboardingVideo shopName={data.shop.name} shopId={shopId} />
    </ShopAdminLayout>
  );
}
