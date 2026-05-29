import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ClientKiosk from './ClientKiosk';

export const dynamic = 'force-dynamic';

export default async function ClientKioskPage({ params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) return redirect('/sign-in');

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 
 // Allow ATTENDANCE_KIOSK, SHOP_ADMIN, or SITE_ADMIN to open this page
 if (!dbUser || !['ATTENDANCE_KIOSK', 'SHOP_ADMIN', 'SITE_ADMIN'].includes(dbUser.role)) {
 return redirect(`/shop/${shopId}`);
 }
 
 if (dbUser.role !== 'SITE_ADMIN' && dbUser.shopId !== shopId) {
 return redirect('/');
 }

 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { name: true }
 });

 if (!shop) notFound();

 const services = await prisma.service.findMany({
 where: { shopId, type: 'CUSTOMER', isBookable: true },
 select: { id: true, name: true, price: true, duration: true }
 });

 return (
 <div className="fixed inset-0 bg-gradient-to-br from-[#0f0c09] via-[#1a1410] to-[#0a0806] text-white flex items-center justify-center p-4 sm:p-8 z-[9999] overflow-hidden">
 <ClientKiosk shopName={shop.name} shopId={shopId} services={JSON.parse(JSON.stringify(services))} />
 </div>
 );
}
