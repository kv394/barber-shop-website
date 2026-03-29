import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import StaffWorkingReport from '@/components/StaffWorkingReport';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string) {
  const userFromDb = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isSuperAdmin = userFromDb?.role === 'SUPER_ADMIN';
  const isShopAdmin = userFromDb?.role === 'SHOP_ADMIN' && userFromDb?.shopId === shopId;

  if (!isSuperAdmin && !isShopAdmin) {
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

export default async function StaffWorkingPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const { shop, userRole, staffMembers } = await getPageData(params.shopId, userId);

  if (!shop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
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
      shopId={params.shopId}
      userRole={userRole as string}
      activeTab="staff-report"
    >
      <StaffWorkingReport staffMembers={staffMembers} />
    </ShopAdminLayout>
  );
}

