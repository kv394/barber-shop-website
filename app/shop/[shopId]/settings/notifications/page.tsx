import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import NotificationSettingsForm from '@/components/marketing/NotificationSettingsForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


export default async function NotificationsSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) notFound();
  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Notification Settings" shopId={shopId} userRole={data.userRole} activeTab="settings-notifications">
      <NotificationSettingsForm shopId={shopId} />
    </ShopAdminLayout>
  );
}

