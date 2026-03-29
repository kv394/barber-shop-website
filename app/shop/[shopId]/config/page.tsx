import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { TemplateSelector } from '@/app/components/TemplateSelector';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';

async function getShopData(shopId: string, userId: string) {
  const userFromDb = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userFromDb || (userFromDb.role !== 'SUPER_ADMIN' && (userFromDb.role !== 'SHOP_ADMIN' || userFromDb.shopId !== shopId))) {
    return { shop: null, userRole: null };
  }

  const shopFromDb = await prisma.shop.findUnique({
    where: { id: shopId },
  });

  if (!shopFromDb) {
    return { shop: null, userRole: userFromDb.role };
  }

  return { 
    shop: JSON.parse(JSON.stringify(shopFromDb)), 
    userRole: userFromDb.role 
  };
}

export default async function ShopConfigPage({
  params,
}: {
  params: { shopId: string };
}) {
  const { userId } = auth();
  if (!userId) redirect('/');

  const { shop, userRole } = await getShopData(params.shopId, userId);

  if (!shop) {
    notFound();
  }

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Shop Configuration & Setup"
      shopId={params.shopId}
      userRole={userRole as string}
      activeTab="setup"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Select Template</h2>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            Choose a layout for the public booking page. You can further customize colors in the Appearance tab.
          </p>
          <TemplateSelector
            currentTemplate={shop.template || 'modern'}
            shopId={params.shopId}
          />
        </div>
      </div>
    </ShopAdminLayout>
  );
}
