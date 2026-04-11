import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { TemplateSelector } from '@/components/shop-admin/TemplateSelector';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';

export const dynamic = "force-dynamic";

export default async function ShopConfigPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');

  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) {
    notFound();
  }

  // Import prisma to fetch templates
  const { prisma } = await import('@/lib/prisma');
  const dynamicTemplates = await prisma.dynamicTemplate.findMany({
    where: {
      OR: [
        { shopId: null },
        { shopId: shopId }
      ]
    },
    select: { name: true, description: true }
  });

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Shop Configuration & Setup"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="setup"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-botanical-text mb-6">Select Template</h2>
          <p className="text-botanical-muted mb-6 text-sm leading-relaxed">
            Choose a layout for the public booking page. You can further customize colors in the Appearance tab.
          </p>
          <TemplateSelector
            currentTemplate={data.shop.template || 'modern'}
            shopId={shopId}
            dynamicTemplates={dynamicTemplates}
          />
        </div>
      </div>
    </ShopAdminLayout>
  );
}
