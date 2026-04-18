import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
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
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) {
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
        <div className="bg-crm-bg/50 p-6 rounded-lg border border-crm-border shadow-sm">
          <h2 className="font-bold text-crm-text mb-4 text-xl font-bold">Shop Template</h2>
          <p className="text-crm-muted leading-relaxed mb-2 text-[13px]">
            Your shop is currently using the <strong>{data.shop.template || 'modern'}</strong> template.
          </p>
          <p className="text-crm-muted leading-relaxed text-[13px]">
            Template assignments are managed by Site Administrators. You can customize the content and appearance of your template in the <a href={`/shop/${shopId}/settings`} className="text-crm-accent hover:underline">Settings</a> tab.
          </p>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
