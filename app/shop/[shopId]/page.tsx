import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import { getTodayInShopTz, toShopTzDayBounds, formatInShopTz } from '@/lib/timezone';
import Link from 'next/link';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import StaffInbox from '@/components/shop-admin/StaffInbox';
import DirectClockInButton from '@/components/shop-admin/DirectClockInButton';
import ClientNameClickable from '@/components/clients/ClientNameClickable';
import { calculateUsageCostStrategy, getSaaSTiers } from '@/lib/cost-calculator';

export const dynamic = 'force-dynamic';

async function getShopData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) {
    return { shop: null, userRole: null, canManageInventory: false, shopSlug: '', lowStockItems: [], todayStats: null, billingAlert: null, isClockedIn: false };
  }

  // Today's date boundaries — use shop timezone
  const shopTz = data.shop?.timezone || 'America/New_York';
  const todayStr = getTodayInShopTz(shopTz);
  const { startOfDay: today, endOfDay: tomorrow } = toShopTzDayBounds(todayStr, shopTz);

  const isAll = shopId === 'all';
  const shopIds = isAll ? data.accessibleShops.map((s: any) => s.id) : [shopId];

  // Run queries
  const [shopFromDbArray, todayAppointments, allTrackedServices, allTrackedProducts, latestReports, activeLogs] = await Promise.all([
    isAll ? Promise.resolve([]) : prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: { orderBy: { type: 'asc' } },
        products: { orderBy: { name: 'asc' } },
        users: { orderBy: { role: 'asc' } },
      },
    }).then(res => res ? [res] : []),
    prisma.appointment.findMany({
      where: { 
        shopId: { in: shopIds }, 
        startTime: { gte: today, lt: tomorrow },
        ...(data.userRole === 'STAFF' ? { staffId: data.user.id } : {})
      },
      include: { service: { select: { price: true, name: true } }, user: { select: { name: true } }, staff: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    }),
    prisma.service.findMany({
      where: { shopId: { in: shopIds }, trackInventory: true },
      select: { id: true, name: true, inventoryCount: true },
    }),
    prisma.product.findMany({
      where: { shopId: { in: shopIds }, trackInventory: true },
      select: { id: true, name: true, inventoryCount: true, reorderPoint: true, type: true },
    }),
    prisma.shopUsageReport.findMany({
      where: { shopId: { in: shopIds } },
      orderBy: { period: 'desc' },
      distinct: ['shopId']
    }),
    prisma.timeLog.findMany({
      where: {
        userId: data.user.id,
        shopId: { in: shopIds },
        clockOut: null,
      },
    })
  ]);

  // Flag items at or below 5 units as low stock
  const lowStockItems = [
    ...allTrackedServices.filter((s: any) => (s.inventoryCount || 0) <= 5).map((s: any) => ({ ...s, isProduct: false })),
    ...allTrackedProducts.filter((p: any) => (p.inventoryCount || 0) <= (p.reorderPoint || 5)).map((p: any) => ({ ...p, isProduct: true }))
  ];

  const shopFromDb = isAll ? data.shop : shopFromDbArray[0];

  if (!shopFromDb) {
    return { shop: null, userRole: data.userRole, canManageInventory: false, shopSlug: data.shopSlug, lowStockItems: [], todayStats: null, billingAlert: null, isClockedIn: false };
  }

  const completed = todayAppointments.filter((a: any) => a.status === 'COMPLETED');
  const todayRevenue = completed.reduce((s: number, a: any) => s + (a.totalAmount > 0 ? a.totalAmount : ((a.service?.price || 0) - (a.discount || 0))), 0);
  const todayTips = completed.reduce((s: number, a: any) => s + (a.tipAmount || 0), 0);
  const upcoming = todayAppointments.filter((a: any) => a.status === 'SCHEDULED' && new Date(a.startTime) > new Date());
  const nextAppointment = upcoming[0] || null;

  // Billing Alert Logic
  let billingAlert: { message: string; type: 'warning' | 'error' } | null = null;
  const latestReport = latestReports[0]; // Simplified for 'all' mode
  if (latestReport && !isAll) {
    const tiers = await getSaaSTiers();
    const analysis = calculateUsageCostStrategy({
      userCount: latestReport.userCount,
      appointmentCount: latestReport.appointmentCount,
      productCount: latestReport.productCount,
      serviceCount: latestReport.serviceCount,
      formSubmissionCount: latestReport.formSubmissionCount,
      portfolioImageCount: latestReport.portfolioImageCount,
      clientHistoryImageCount: latestReport.clientHistoryImageCount,
      clientFormulaCount: latestReport.clientFormulaCount,
      reviewCount: latestReport.reviewCount,
      aiTokenCount: shopFromDbArray[0]?.aiTokens || 0
    }, tiers);

    // Dynamic warning: If they are approaching the limits of the chosen tier.
    // Check if they are > 90% of current tier capacity.
    const currentTier = tiers.find(t => t.id === analysis.tierId);
    if (currentTier) {
      const limitsApproaching = [];
      if (currentTier.maxAppointments < 999999 && latestReport.appointmentCount >= currentTier.maxAppointments * 0.9) limitsApproaching.push('appointments');
      if (currentTier.maxUsers < 999 && latestReport.userCount >= currentTier.maxUsers * 0.9) limitsApproaching.push('users');
      if (currentTier.maxFormSubmissions < 999999 && latestReport.formSubmissionCount >= currentTier.maxFormSubmissions * 0.9) limitsApproaching.push('intake forms');

      if (limitsApproaching.length > 0) {
        billingAlert = {
          message: `You are approaching the ${limitsApproaching.join(', ')} limits of the ${currentTier.name} tier. Consider upgrading.`,
          type: 'warning'
        };
      }
    }

    if (analysis.estimatedStorageMB > (currentTier?.storageLimitMB || 500) * 0.9) {
      billingAlert = {
        message: `You are approaching your ${(currentTier?.storageLimitMB || 500)}MB storage limit. Additional storage overages will apply.`,
        type: 'warning'
      };
    }
  }

  return { 
    shop: JSON.parse(JSON.stringify(shopFromDb)), 
    userRole: data.userRole,
    canManageInventory: data.canManageInventory,
    shopSlug: data.shopSlug,
    lowStockItems: JSON.parse(JSON.stringify(lowStockItems)),
    billingAlert,
    isClockedIn: activeLogs.length > 0,
    todayStats: {
      totalBookings: todayAppointments.length,
      completedCount: completed.length,
      upcomingCount: upcoming.length,
      revenue: todayRevenue,
      tips: todayTips,
      nextAppointment: nextAppointment ? JSON.parse(JSON.stringify(nextAppointment)) : null,
    }
  };
}

export default async function ShopDashboardPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const { shop, userRole, canManageInventory, shopSlug, lowStockItems, todayStats, billingAlert, isClockedIn } = await getShopData(shopId, userId);

  // SITE_ADMIN is a site admin — redirect to team assignment page (they don't access shop operations)
  if (userRole === 'SITE_ADMIN') {
    return redirect(`/shop/${shopId}/settings/team`);
  }

  if (!shop) {
    return (
        <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
            <div className="text-center">
                <h1 className="font-bold text-status-cancelled mb-4 text-2xl font-bold">Access Denied</h1>
                <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
            </div>
        </div>
    )
  }

  const isSiteAdmin = userRole === 'SITE_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isStaff = userRole === 'STAFF';
  const canEditServices = isShopAdmin; // SITE_ADMIN CANNOT EDIT
  const showInventoryControls = isShopAdmin || (isStaff && canManageInventory); // SITE_ADMIN CANNOT MANAGE INVENTORY
  const resolvedSlug = shopSlug || shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={resolvedSlug}
      pageTitle={isStaff ? 'Staff Dashboard' : isSiteAdmin ? 'Platform Admin View' : 'Shop Admin Dashboard'}
      shopId={shopId}
      userRole={userRole as string}
      activeTab="dashboard"
    >
      {/* ── Clock In Button (STAFF only) ── */}
      {isStaff && (
        <div className="mb-6">
          <DirectClockInButton shopId={shopId} initialIsClockedIn={isClockedIn} />
        </div>
      )}
      {isShopAdmin && billingAlert && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
          billingAlert.type === 'warning' 
            ? 'bg-amber-900/20 border-status-pending/30 text-amber-200' 
            : 'bg-status-cancelled/20 border-status-cancelled/30 text-red-200'
        }`}>
          <span className="text-base mt-0.5">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold mb-1 text-lg font-bold">Billing & Usage Alert</h3>
            <p className="opacity-90 text-[13px]">{billingAlert.message}</p>
            <Link href={`/shop/${shopId}/settings/billing`} className="mt-2 inline-block text-[11px] font-bold underline hover:no-underline">
              View Billing Report →
            </Link>
          </div>
        </div>
      )}

      {/* ── Low Stock Alert (shop admin only) ── */}
      {isShopAdmin && lowStockItems.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 bg-status-pending/10 border border-status-pending/30 rounded-xl p-4">
            <p className="text-status-pending font-semibold mb-2 text-[13px]">⚠️ {lowStockItems.length} Low-Stock Item{lowStockItems.length > 1 ? 's' : ''}</p>
            <div className="space-y-1">
              {lowStockItems.slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[11px]">
                  <span className="text-crm-muted truncate">{item.name}</span>
                  <span className="text-status-pending font-mono ml-2 flex-shrink-0">{item.inventoryCount} left</span>
                </div>
              ))}
              {lowStockItems.length > 3 && <p className="text-crm-muted text-[13px]">+{lowStockItems.length - 3} more</p>}
            </div>
            <Link href={`/shop/${shopId}/config/products`} className="text-status-pending hover:text-crm-text transition-colors text-[11px] underline mt-2 inline-block">
              Restock now →
            </Link>
          </div>
        </div>
      )}

    </ShopAdminLayout>
  );
}
