import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import CommissionSetup from '@/components/reports/CommissionSetup';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


export default async function CommissionsSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) notFound();
  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Commission Rates" shopId={shopId} userRole={data.userRole} activeTab="settings-commissions">
      <CommissionSetup shopId={shopId} />
    </ShopAdminLayout>
  );
}

