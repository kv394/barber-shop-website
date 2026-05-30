import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';
import SocialMediaClient from './SocialMediaClient';

export const dynamic = 'force-dynamic';

export default async function AISocialMediaPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();

  const portfolioImages = await prisma.portfolioImage.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    include: { staff: { select: { name: true } } }
  });

  const shopDetails = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { aiTokens: true, name: true, baseLocation: true }
  });

  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="AI Social Media Manager" shopId={shopId} userRole={data.userRole}>
      <PremiumFeatureGate
        shopId={shopId}
        featureId="aiSocial"
        title="AI Social Media Manager"
        description="Auto-generate engaging, hashtag-rich Instagram and TikTok posts directly from your portfolio images using AI."
        price="$25/mo"
      >
        <SocialMediaClient 
          shopId={shopId} 
          shopName={shopDetails?.name || ''}
          shopLocation={shopDetails?.baseLocation || ''}
          initialImages={portfolioImages} 
          initialTokens={shopDetails?.aiTokens || 0}
        />
      </PremiumFeatureGate>
    </ShopAdminLayout>
  );
}
