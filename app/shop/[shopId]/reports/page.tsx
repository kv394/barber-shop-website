import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ReportsClient from '@/components/ReportsClient';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string) {
  const userFromDb = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isSuperAdmin = userFromDb?.role === 'SUPER_ADMIN';
  const isShopAdmin = userFromDb?.role === 'SHOP_ADMIN' && userFromDb?.shopId === shopId;

  if (!isSuperAdmin && !isShopAdmin) {
    return { shop: null, userRole: null, recentCompletedAppointments: [], totalRevenue: 0, totalTips: 0 };
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop) {
    return { shop: null, userRole: userFromDb?.role, recentCompletedAppointments: [], totalRevenue: 0, totalTips: 0 };
  }

  // Run queries in parallel: lightweight aggregate for totals, capped heavy query for table UI
  const [recentCompletedAppointments, allCompleted] = await Promise.all([
    prisma.appointment.findMany({
      where: { shopId: shopId, status: 'COMPLETED' },
      include: {
        service: { select: { name: true, price: true } },
        user: { select: { name: true, email: true } },
        staff: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200, // Capped for performance
    }),
    prisma.appointment.findMany({
      where: { shopId: shopId, status: 'COMPLETED' },
      include: {
        user: true,
        service: true,
      },
      orderBy: { startTime: 'desc' }
    })
  ]);

  const totalRevenue = allCompleted.reduce((sum, apt) => sum + (apt.totalAmount > 0 ? apt.totalAmount : ((apt.service?.price || 0) - (apt.discount || 0))), 0);
  const totalTips = allCompleted.reduce((sum, apt) => sum + (apt.tipAmount || 0), 0);

  // Group by day for simple charting
  const revenueByDayRecord: Record<string, number> = {};
  allCompleted.forEach(apt => {
    const dateKey = apt.updatedAt.toISOString().split('T')[0];
    revenueByDayRecord[dateKey] = (revenueByDayRecord[dateKey] || 0) + (apt.totalAmount > 0 ? apt.totalAmount : ((apt.service?.price || 0) - (apt.discount || 0)));
  });

  const revenueByDay = Object.entries(revenueByDayRecord).map(([date, total]) => ({ date, total }));

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    userRole: userFromDb?.role,
    recentCompletedAppointments: JSON.parse(JSON.stringify(recentCompletedAppointments)),
    totalRevenue,
    totalTips,
    revenueByDay,
  };
}

export default async function ReportsPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const { shop, userRole, recentCompletedAppointments, totalRevenue, totalTips } = await getPageData(params.shopId, userId);

  if (!shop) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
            </div>
        </div>
    )
  }

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Financial Reports & History"
      shopId={params.shopId}
      userRole={userRole as string}
      activeTab="reports"
    >
      <ReportsClient appointments={recentCompletedAppointments} totalRevenue={totalRevenue} totalTips={totalTips} />
    </ShopAdminLayout>
  );
}
