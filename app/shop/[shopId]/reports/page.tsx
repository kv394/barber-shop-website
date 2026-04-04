import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ReportsClient from '@/components/ReportsClient';

export const revalidate = 30;

async function getPageData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null;

  const { isSuperAdmin, isShopAdmin } = data;
  if (!isSuperAdmin && !isShopAdmin) return null;

  // Run queries in parallel: aggregate for totals, capped query for table UI,
  // and a bounded query for the revenue-by-day chart (last 90 days only).
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const completedWhere = { shopId: shopId, status: 'COMPLETED' as const };

  const [recentCompletedAppointments, totals, chartAppointments] = await Promise.all([
    prisma.appointment.findMany({
      where: completedWhere,
      select: {
        id: true,
        updatedAt: true,
        status: true,
        tipAmount: true,
        discount: true,
        totalAmount: true,
        refundAmount: true,
        refundedAt: true,
        paymentMethod: true,
        service: { select: { name: true, price: true } },
        user: { select: { name: true, email: true } },
        staff: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    }),
    prisma.appointment.aggregate({
      where: completedWhere,
      _sum: { totalAmount: true, tipAmount: true, discount: true },
      _count: true,
    }),
    prisma.appointment.findMany({
      where: { ...completedWhere, updatedAt: { gte: ninetyDaysAgo } },
      select: { updatedAt: true, totalAmount: true, discount: true, service: { select: { price: true } } },
      orderBy: { updatedAt: 'asc' },
    }),
  ]);

  const totalRevenue = totals._sum.totalAmount ?? 0;
  const totalTips = totals._sum.tipAmount ?? 0;

  // Group by day for simple charting (last 90 days)
  const revenueByDayRecord: Record<string, number> = {};
  chartAppointments.forEach(apt => {
    const dateKey = apt.updatedAt.toISOString().split('T')[0];
    revenueByDayRecord[dateKey] = (revenueByDayRecord[dateKey] || 0) + (apt.totalAmount > 0 ? apt.totalAmount : ((apt.service?.price || 0) - (apt.discount || 0)));
  });

  const revenueByDay = Object.entries(revenueByDayRecord).map(([date, total]) => ({ date, total }));

  return { 
    shop: data.shop,
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    recentCompletedAppointments: JSON.parse(JSON.stringify(recentCompletedAppointments)),
    totalRevenue,
    totalTips,
    revenueByDay,
  };
}

export default async function ReportsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const pageData = await getPageData(shopId, userId);

  if (!pageData) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
            </div>
        </div>
    )
  }

  const { shop, shopSlug, userRole, recentCompletedAppointments, totalRevenue, totalTips } = pageData;

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Financial Reports & History"
      shopId={shopId}
      userRole={userRole as string}
      activeTab="reports"
    >
      <ReportsClient appointments={recentCompletedAppointments} totalRevenue={totalRevenue} totalTips={totalTips} shopId={shopId} />
    </ShopAdminLayout>
  );
}
