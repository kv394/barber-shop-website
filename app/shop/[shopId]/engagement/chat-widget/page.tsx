import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import ChatWidgetSettings from '@/components/shop-admin/ChatWidgetSettings';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

export const dynamic = "force-dynamic";

export default async function ChatWidgetPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) return redirect('/');

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle={undefined}
      shopId={shopId}
      userRole={data.userRole}
    >
      <PremiumFeatureGate
        shopId={shopId}
        featureId="chatWidget"
        title="AI Chat Widget"
        description="Add a smart AI chat bubble to your booking page that answers client questions and books appointments 24/7. Powered by Gemini AI."
        price="$30/mo"
      >
        <ChatWidgetSettings shopId={shopId} />
      </PremiumFeatureGate>
    </ShopAdminLayout>
  );
}
