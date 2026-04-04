import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import WaitlistClient from '@/components/WaitlistClient';

export const dynamic = 'force-dynamic';

export default async function WaitlistPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return redirect('/');

  // Uses React cache — free if layout already called this
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return redirect('/');

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      services: { where: { type: 'CUSTOMER' }, select: { id: true, name: true, duration: true } },
      users: { where: { role: 'STAFF' }, select: { id: true, name: true, email: true } },
    },
  });
  if (!shop) return redirect('/');

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Walk-in Waitlist"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="waitlist"
    >
      <WaitlistClient
        shopId={shopId}
        services={JSON.parse(JSON.stringify(shop.services))}
        staff={JSON.parse(JSON.stringify(shop.users))}
      />
    </ShopAdminLayout>
  );
}
