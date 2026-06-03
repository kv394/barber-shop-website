import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import WaitlistClient from '@/components/appointments/WaitlistClient';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function WaitlistPage({ params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) return redirect('/');

 // Uses React cache — free if layout already called this
 const data = await getShopLayoutData(userId, shopId);
 if (!data) return redirect('/');

 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: {
 id: true,
 name: true,
 services: { where: { type: 'CUSTOMER' }, select: { id: true, name: true, duration: true } },
 users: { where: { role: 'STAFF' }, select: { id: true, name: true, email: true } },
 },
 });
 if (!shop) return redirect('/');

 return (
 <ShopAdminLayout
 shopName={data.shop.name}
 shopSlug={data.shopSlug}
 pageTitle="Walk-in Waitlist"
 shopId={shopId}
 userRole={data.userRole}
 activeTab="waitlist"
 >
 <WaitlistClient
 shopId={shopId}
 services={serialize(shop.services)}
 staff={serialize(shop.users)}
 />
 </ShopAdminLayout>
 );
}
