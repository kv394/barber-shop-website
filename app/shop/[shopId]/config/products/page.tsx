import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import ProductManager from '@/components/shop-admin/ProductManager';

export const dynamic = 'force-dynamic';

export default async function ConfigProductsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return redirect('/');

  const { shop, userRole } = data;
  if (!userRole || userRole === 'ATTENDANCE_KIOSK') return redirect('/');

  const products = await prisma.product.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Products & Inventory"
      shopId={shopId}
      userRole={userRole}
      activeTab="products"
    >
      <div className="max-w-4xl mx-auto py-8">
        <ProductManager shopId={shopId} products={products} />
      </div>
    </ShopAdminLayout>
  );
}
