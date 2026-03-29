import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ProductManager from '@/app/components/ProductManager';

export const dynamic = 'force-dynamic';

export default async function ConfigProductsPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const data = await getShopLayoutData(userId, params.shopId);
  if (!data) return redirect('/');

  const { shop, userRole } = data;
  if (!userRole || userRole === 'ATTENDANCE_KIOSK') return redirect('/');

  const products = await prisma.product.findMany({
    where: { shopId: params.shopId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shop.template}
      pageTitle="Products & Inventory"
      shopId={params.shopId}
      userRole={userRole}
      activeTab="settings"
    >
      <div className="max-w-4xl mx-auto py-8">
        <ProductManager shopId={params.shopId} products={products} />
      </div>
    </ShopAdminLayout>
  );
}
