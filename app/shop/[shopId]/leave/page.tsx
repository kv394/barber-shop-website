import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LeaveManager from '@/components/shop-admin/LeaveManager';
import { getShopLayoutData } from '@/lib/shop-data';

export default async function LeavePage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: user.id }, { email: user.email || '' }] } });
  if (!dbUser || dbUser.shopId !== shopId) {
    redirect('/');
  }

  const data = await getShopLayoutData(user.id, shopId);
  if (!data) return null;

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="My Leave"
      shopId={shopId}
      userRole={dbUser.role}
      activeTab="leave"
    >
      <LeaveManager shopId={shopId} userId={dbUser.id} />
    </ShopAdminLayout>
  );
}
