import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import GiftCardManager from '@/components/marketing/GiftCardManager';

export const dynamic = 'force-dynamic';

export default async function GiftCardsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);

  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
        </div>
      </div>
    );
  }

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Gift Cards"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="gift-cards"
    >
      <GiftCardManager shopId={shopId} />
    </ShopAdminLayout>
  );
}
