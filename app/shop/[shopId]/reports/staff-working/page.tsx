import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import StaffWorkingReport from '@/components/reports/StaffWorkingReport';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, email?: string) {
 const userFromDb = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: email || '' }] },
 });

 const isSiteAdmin = userFromDb?.role === 'SITE_ADMIN';
 const isShopAdmin = userFromDb?.role === 'SHOP_ADMIN' && userFromDb?.shopId === shopId;

 if (!isSiteAdmin && !isShopAdmin) {
 return { shop: null, userRole: null, staffMembers: [] };
 }

 const shop = await prisma.shop.findUnique({ where: { id: shopId } });

 if (!shop) {
 return { shop: null, userRole: userFromDb?.role, staffMembers: [] };
 }

 // Fetch last 90 days of data for performance
 const ninetyDaysAgo = new Date();
 ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

 const staffUsers = await prisma.user.findMany({
 where: {
 shopId: shopId,
 role: 'STAFF',
 },
 select: {
 id: true,
 name: true,
 email: true,
 timeLogs: {
 where: {
 shopId: shopId,
 clockIn: { gte: ninetyDaysAgo },
 },
 select: {
 id: true,
 clockIn: true,
 clockOut: true,
 },
 orderBy: { clockIn: 'desc' },
 take: 500,
 },
 staffAppointments: {
 where: {
 shopId: shopId,
 startTime: { gte: ninetyDaysAgo },
 },
 select: {
 id: true,
 startTime: true,
 status: true,
 service: { select: { name: true, price: true } },
 user: { select: { name: true, email: true } },
 },
 orderBy: { startTime: 'desc' },
 take: 500,
 },
 },
 orderBy: { name: 'asc' },
 });

 return {
 shop: serialize(shop),
 userRole: userFromDb?.role,
 staffMembers: serialize(staffUsers),
 };
}

export default async function StaffWorkingPage({ params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) return redirect('/');

 const { shop, userRole, staffMembers } = await getPageData(shopId, userId, user?.email);

 if (!shop) {
 return (
 <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
 <div className="text-center">
 <h1 className="font-bold text-status-cancelled mb-4 text-2xl font-bold">Access Denied</h1>
 <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
 </div>
 </div>
 );
 }

 const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

 const reportTabs = [
 { id: 'reports', label: 'Financial', href: `/shop/${shopId}/reports` },
 { id: 'staff-report', label: 'Staff Performance', href: `/shop/${shopId}/reports/staff-working` },
 { id: 'expenses', label: 'Expenses', href: `/shop/${shopId}/expenses` },
 { id: 'commissions', label: 'Commissions', href: `/shop/${shopId}/reports/commissions` },
 { id: 'booth-rent', label: 'Booth Rent', href: `/shop/${shopId}/booth-rent` }
 ];

 return (
 <ShopAdminLayout
 shopName={shop.name}
 shopSlug={shopSlug}
 pageTitle="Staff Working Report"
 shopId={shopId}
 userRole={userRole as string}
 >
 <StaffWorkingReport staffMembers={staffMembers} currency={shop.currency} />
 </ShopAdminLayout>
 );
}

