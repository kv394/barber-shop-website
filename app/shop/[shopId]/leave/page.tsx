import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LeaveManager from '@/components/shop-admin/LeaveManager';
import { getShopLayoutData } from '@/lib/shop-data';

export default async function LeavePage({ params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user?.id) {
 redirect('/sign-in');
 }

 const data = await getShopLayoutData(user.id, shopId);
 if (!data) {
 redirect('/');
 }

 return (
 <ShopAdminLayout
 shopName={data.shop.name}
 shopSlug={data.shopSlug}
 pageTitle="My Leave"
 shopId={shopId}
 userRole={data.userRole}
 activeTab="leave"
 >
 <LeaveManager shopId={shopId} userId={data.user.id} />
 </ShopAdminLayout>
 );
}
