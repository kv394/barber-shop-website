import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import ReportsClient from '@/components/reports/ReportsClient';

export const dynamic = "force-dynamic";

async function getPageData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null;

  const { isSiteAdmin, isShopAdmin } = data;
  if (!isSiteAdmin && !isShopAdmin) return null;

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
  chartAppointments.forEach((apt: any) => {
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const pageData = await getPageData(shopId, userId);

  if (!pageData) {
    return (
        <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
            <div className="text-center">
                <h1 className="font-bold text-status-cancelled mb-4 text-2xl font-bold">Access Denied</h1>
                <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
            </div>
        </div>
    )
  }

  const { shop, shopSlug, userRole, recentCompletedAppointments, totalRevenue, totalTips } = pageData;

  const reportTabs = [
    { id: 'reports', label: 'Financial', href: `/shop/${shopId}/reports` },
    { id: 'staff-report', label: 'Staff Performance', href: `/shop/${shopId}/reports/staff-working` },
    { id: 'expenses', label: 'Expenses', href: `/shop/${shopId}/expenses` },
    { id: 'commissions', label: 'Commissions', href: `/shop/${shopId}/reports/commissions` }
  ];

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Financial Reports & History"
      shopId={shopId}
      userRole={userRole as string}
    >
      <ReportsClient appointments={recentCompletedAppointments} totalRevenue={totalRevenue} totalTips={totalTips} shopId={shopId} currency={shop.currency} />
    </ShopAdminLayout>
  );
}
