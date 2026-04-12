import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import StaffWorkingReport from '@/components/reports/StaffWorkingReport';

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

  const staffMembers = await prisma.user.findMany({
    where: {
      shopId: shopId,
      role: { in: ['STAFF', 'SHOP_ADMIN'] },
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
    shop: JSON.parse(JSON.stringify(shop)),
    userRole: userFromDb?.role,
    staffMembers: JSON.parse(JSON.stringify(staffMembers)),
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
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-botanical-muted">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Staff Working Report"
      shopId={shopId}
      userRole={userRole as string}
      activeTab="staff-report"
    >
      <StaffWorkingReport staffMembers={staffMembers} />
    </ShopAdminLayout>
  );
}

