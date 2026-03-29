import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import WaitlistClient from '@/components/WaitlistClient';

export const dynamic = 'force-dynamic';

export default async function WaitlistPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  // Uses React cache — free if layout already called this
  const data = await getShopLayoutData(userId, params.shopId);
  if (!data) return redirect('/');

  const shop = await prisma.shop.findUnique({
    where: { id: params.shopId },
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
      shopId={params.shopId}
      userRole={data.userRole}
      activeTab="waitlist"
    >
      <WaitlistClient
        shopId={params.shopId}
        services={JSON.parse(JSON.stringify(shop.services))}
        staff={JSON.parse(JSON.stringify(shop.users))}
      />
    </ShopAdminLayout>
  );
}
