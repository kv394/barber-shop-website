import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import SmsReminderSettings from '@/components/shop-admin/SmsReminderSettings';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

export const dynamic = "force-dynamic";

export default async function SmsRemindersPage({ params }: { params: Promise<{ shopId: string }> }) {
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
        featureId="smsReminders"
        title="SMS Reminders & Alerts"
        description="Reduce no-shows by 30-50% with automated SMS appointment reminders, review requests, and rebooking prompts. Powered by Twilio."
        price="$10/mo"
      >
        <SmsReminderSettings shopId={shopId} />
      </PremiumFeatureGate>
    </ShopAdminLayout>
  );
}
