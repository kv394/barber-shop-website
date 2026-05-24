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
import InventoryForecast from '@/components/shop-admin/InventoryForecast';

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
  const [shopFromDbArray, todayAppointments, allTrackedProducts, latestReports, activeLogs] = await Promise.all([
    isAll ? Promise.resolve([]) : prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: { orderBy: { type: 'asc' } },
        products: { orderBy: { name: 'asc' } },
        users: { orderBy: { role: 'asc' } },
      },
    }).then((res: any) => res ? [res] : []),
    prisma.appointment.findMany({
      where: { 
        shopId: { in: shopIds }, 
        startTime: { gte: today, lt: tomorrow },
        ...(data.userRole === 'STAFF' || data.userRole === 'BOOTH_RENTER' ? { staffId: data.user.id } : {})
      },
      include: { service: { select: { price: true, name: true } }, user: { select: { name: true } }, staff: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
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
                <h1 className="font-bold text-status-cancelled mb-4 text-2xl">Access Denied</h1>
                <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
            </div>
        </div>
    )
  }

  const isSiteAdmin = userRole === 'SITE_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isStaff = userRole === 'STAFF';
  const isBoothRenter = userRole === 'BOOTH_RENTER';
  const isStaffLike = isStaff || isBoothRenter;
  const canEditServices = isShopAdmin; // SITE_ADMIN CANNOT EDIT
  const showInventoryControls = isShopAdmin || (isStaff && canManageInventory); // SITE_ADMIN CANNOT MANAGE INVENTORY
  const resolvedSlug = shopSlug || shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={resolvedSlug}
      pageTitle={isBoothRenter ? 'Booth Renter Dashboard' : isStaff ? 'Staff Dashboard' : isSiteAdmin ? 'Platform Admin View' : 'Shop Admin Dashboard'}
      shopId={shopId}
      userRole={userRole as string}
      activeTab="dashboard"
    >
      <div className="space-y-8">
        
        {/* ── Today's Overview ── */}
        {todayStats && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg font-bold text-crm-text tracking-tight">Today&apos;s Overview</h2>
              <div className="text-xs font-semibold text-crm-muted bg-crm-surface px-3 py-1.5 rounded-full border border-crm-border self-start sm:self-auto">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
              {[
                { label: 'Bookings', value: todayStats.totalBookings, color: 'text-blue-600' },
                { label: 'Revenue', value: `$${todayStats.revenue.toFixed(0)}`, color: 'text-emerald-600' },
                { label: 'Tips', value: `$${todayStats.tips.toFixed(0)}`, color: 'text-amber-600' },
                { label: 'Completed', value: todayStats.completedCount, color: 'text-purple-600' },
                { label: 'Upcoming', value: todayStats.upcomingCount, color: 'text-cyan-600' },
              ].map((stat, i) => (
                <div key={i} className="min-w-[130px] sm:min-w-0 shrink-0 snap-start bg-crm-surface border border-crm-border p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-shadow">
                  <p className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</p>
                  <p className="text-[11px] font-bold text-crm-muted uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* ── Left Column: Action Items ── */}
          <div className="space-y-6">
            <h3 className="text-md font-bold text-crm-text flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crm-primary"></span>
              Needs Attention
            </h3>
            
            {/* Up Next Appointment */}
            {todayStats?.nextAppointment && (
              <div className="bg-crm-surface border-l-4 border-l-crm-primary border-y border-r border-crm-border p-5 rounded-r-xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-crm-primary mb-1 uppercase tracking-wider">
                      Up Next • {new Date(todayStats.nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h4 className="text-lg font-bold text-crm-text">{todayStats.nextAppointment.user?.name || 'Guest'}</h4>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-crm-muted mt-3 pt-3 border-t border-crm-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold">Service:</span>
                    <span className="font-medium text-crm-text">{todayStats.nextAppointment.service?.name}</span>
                  </div>
                  {todayStats.nextAppointment.staff?.name && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider font-semibold">Staff:</span>
                      <span className="font-medium text-crm-text">{todayStats.nextAppointment.staff.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Low Stock Alert (shop admin only) */}
            {isShopAdmin && lowStockItems.length > 0 && (
              <div className="bg-status-pending/5 border border-status-pending/20 rounded-xl p-5 shadow-sm">
                <p className="text-status-pending font-bold mb-3 text-[13px] uppercase tracking-wider">⚠️ {lowStockItems.length} Low-Stock Item{lowStockItems.length > 1 ? 's' : ''}</p>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-[13px] bg-white/50 px-3 py-2 rounded-md border border-status-pending/10">
                      <span className="text-crm-text font-medium truncate">{item.name}</span>
                      <span className="text-status-pending font-bold font-mono ml-2">{item.inventoryCount} left</span>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && <p className="text-crm-muted text-[11px] font-semibold mt-2">+{lowStockItems.length - 3} more items need restocking</p>}
                </div>
                <Link href={`/shop/${shopId}/config/products`} className="text-status-pending hover:text-crm-text font-semibold transition-colors text-[12px] underline mt-3 inline-flex items-center py-2">
                  Restock Inventory →
                </Link>
              </div>
            )}

            {/* Empty State */}
            {(!todayStats?.nextAppointment && (!isShopAdmin || lowStockItems.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-crm-surface/50 rounded-2xl border border-dashed border-crm-border">
                <span className="text-3xl mb-3 opacity-50">✨</span>
                <h2 className="text-lg font-bold text-crm-text mb-1">All Clear</h2>
                <p className="text-crm-muted text-[13px] max-w-[250px] mx-auto">
                  You have no pending action items right now. Great job!
                </p>
              </div>
            )}
          </div>

          {/* ── Right Column: Insights & Forecasts ── */}
          <div className="space-y-6">
            <h3 className="text-md font-bold text-crm-text flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-info"></span>
              Insights
            </h3>
            
            {showInventoryControls && (
              <InventoryForecast shopId={shopId} />
            )}
            
            {isShopAdmin && (
              <div className="p-4 rounded-xl border border-crm-border bg-crm-surface flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-crm-muted text-[10px] uppercase tracking-widest font-bold mb-0.5">System Identifier</p>
                  <p className="text-crm-text font-mono text-[12px] select-all">Shop ID: {shopId}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </ShopAdminLayout>
  );
}
