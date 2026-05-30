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
 // TEMPORARY FIX: Force upgrade anyone trapped as a CLIENT to SITE_ADMIN
 if (dbUser.role === 'CLIENT' && user.email === 'siteadmin@kutzapp.com') {
   await prisma.user.updateMany({
     where: { email: user.email },
     data: { role: 'SITE_ADMIN' }
   });
   dbUser.role = 'SITE_ADMIN';
 }

 if (dbUser.role === 'CLIENT') {
 const targetSlug = dbUser.shop?.name ? dbUser.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : null;
 if (targetSlug) {
 redirect(`/shops/${targetSlug}`);
 } else {
 redirect('/shops');
 }
 } else if (dbUser.role === 'SHOP_ADMIN' || dbUser.role === 'STAFF') {
 if (dbUser.shopId) {
 redirect(`/shop/${dbUser.shopId}`);
 } else if (dbUser.shopAccesses && dbUser.shopAccesses.length > 0) {
 redirect(`/shop/${dbUser.shopAccesses[0].shopId}`);
 }
 }
 // If SITE_ADMIN or KIOSK, we stay here to let them see the platform dashboard / kiosk interface
 }
 }

 return <ClientHomePage />;
}
