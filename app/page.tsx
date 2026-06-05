import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ClientHomePage from './page.client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (user?.email) {
 const dbUser = await prisma.user.findUnique({
 where: { email: user.email },
 select: { role: true, shopId: true, shop: { select: { name: true } }, shopAccesses: { select: { shopId: true, shop: { select: { name: true } } } } }
 });

 if (dbUser) {
 if (dbUser.role === 'CLIENT') {
 const targetSlug = dbUser.shop?.name ? dbUser.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : null;
 if (targetSlug) {
 redirect(`/shops/${targetSlug}`);
 }
 // If CLIENT has no shop, fall through to ClientHomePage which shows "Account Not Configured"
 } else if (dbUser.role === 'SITE_ADMIN') {
 redirect('/siteadmin');
 } else if (dbUser.role === 'SHOP_ADMIN' || dbUser.role === 'STAFF' || dbUser.role === 'BOOTH_RENTER') {
 if (dbUser.shopId) {
 redirect(`/shop/${dbUser.shopId}`);
 } else if (dbUser.shopAccesses && dbUser.shopAccesses.length > 0) {
 redirect(`/shop/${dbUser.shopAccesses[0].shopId}`);
 }
 }
 // If ATTENDANCE_KIOSK or unassigned, we stay here to let them see the platform dashboard / kiosk interface
 // If user has a role but no shop assignment, ClientHomePage will show an "Account Not Configured" state
 }
 }

 return <ClientHomePage />;
}
