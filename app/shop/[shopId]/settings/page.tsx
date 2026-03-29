import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { CustomizationForm } from '@/app/components/CustomizationForm';
import { DEFAULT_CUSTOMIZATION } from '@/lib/templates';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import Link from 'next/link';

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

export default async function ShopSettingsPage({ 
  params 
}: { 
  params: { shopId: string } 
}) {
  const { userId } = auth();
  if (!userId) redirect('/');

  const { shop, userRole } = await getShopData(params.shopId, userId);

  if (!shop) {
    notFound();
  }

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const customization = shop.customization || DEFAULT_CUSTOMIZATION;
  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={isSuperAdmin ? "Customize Appearance" : "Update Contact Information"}
      shopId={params.shopId}
      userRole={userRole as string}
      activeTab={isSuperAdmin ? "appearance" : "contact-settings"}
    >
      <CustomizationForm
        shopId={params.shopId}
        customization={customization}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href={`/shop/${params.shopId}/config/services`} className="group">
          <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">💇‍♀️ Services</h3>
            <p className="text-gray-400 text-sm">Manage your service menu, pricing, and duration.</p>
          </div>
        </Link>

        <Link href={`/shop/${params.shopId}/config/products`} className="group">
          <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">🛍️ Products</h3>
            <p className="text-gray-400 text-sm">Manage retail and backbar inventory, SKUs, and pricing.</p>
          </div>
        </Link>
      </div>
    </ShopAdminLayout>
  );
}
