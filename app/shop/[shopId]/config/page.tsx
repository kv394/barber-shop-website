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

 return (
 <ShopAdminLayout
 shopName={data.shop.name}
 shopSlug={data.shopSlug}
 pageTitle="Shop Configuration & Setup"
 shopId={shopId}
 userRole={data.userRole}
 >
 <div className="space-y-8">
 <div className="bg-crm-bg/50 p-6 rounded-lg border border-crm-border shadow-sm">
 <h2 className="font-bold text-crm-text mb-4 text-xl font-bold">General Configuration</h2>
 <p className="text-crm-muted leading-relaxed text-[13px]">
 Please use the <a href={`/shop/${shopId}/settings`} className="text-crm-accent hover:underline">Settings</a> tab to manage your Shop's profile, currency, and customization options.
 </p>
 </div>
 </div>
 </ShopAdminLayout>
 );
}
