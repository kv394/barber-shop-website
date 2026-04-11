import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import { getTodayInShopTz, toShopTzDayBounds } from '@/lib/timezone';
import Link from 'next/link';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import StaffInbox from '@/components/shop-admin/StaffInbox';
import { calculateUsageCostStrategy, getSaaSTiers } from '@/lib/cost-calculator';

export const dynamic = 'force-dynamic';

async function getShopData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) {
    return { shop: null, userRole: null, canManageInventory: false, shopSlug: '', lowStockItems: [], todayStats: null };
  }

  // Today's date boundaries — use shop timezone
  const shopTz = data.shop.timezone || 'America/New_York';
  const todayStr = getTodayInShopTz(shopTz);
  const { startOfDay: today, endOfDay: tomorrow } = toShopTzDayBounds(todayStr, shopTz);

  // Run both queries in parallel instead of sequentially
  const [shopFromDb, todayAppointments, allTrackedServices, allTrackedProducts, latestReport] = await Promise.all([
    prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        services: { orderBy: { type: 'asc' } },
        products: { orderBy: { name: 'asc' } },
        users: { orderBy: { role: 'asc' } },
      },
    }),
    prisma.appointment.findMany({
      where: { shopId, startTime: { gte: today, lt: tomorrow } },
      include: { service: { select: { price: true, name: true } }, user: { select: { name: true } }, staff: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    }),
    prisma.service.findMany({
      where: { shopId, trackInventory: true },
      select: { id: true, name: true, inventoryCount: true },
    }),
    prisma.product.findMany({
      where: { shopId, trackInventory: true },
      select: { id: true, name: true, inventoryCount: true, reorderPoint: true, type: true },
    }),
    prisma.shopUsageReport.findFirst({
      where: { shopId },
      orderBy: { period: 'desc' }
    })
  ]);

  // Flag items at or below 5 units as low stock
  const lowStockItems = [
    ...allTrackedServices.filter((s: any) => (s.inventoryCount || 0) <= 5).map((s: any) => ({ ...s, isProduct: false })),
    ...allTrackedProducts.filter((p: any) => (p.inventoryCount || 0) <= (p.reorderPoint || 5)).map((p: any) => ({ ...p, isProduct: true }))
  ];

  if (!shopFromDb) {
    return { shop: null, userRole: data.userRole, canManageInventory: false, shopSlug: data.shopSlug, lowStockItems: [], todayStats: null, billingAlert: null };
  }

  const completed = todayAppointments.filter((a: any) => a.status === 'COMPLETED');
  const todayRevenue = completed.reduce((s: number, a: any) => s + (a.totalAmount > 0 ? a.totalAmount : ((a.service?.price || 0) - (a.discount || 0))), 0);
  const todayTips = completed.reduce((s: number, a: any) => s + (a.tipAmount || 0), 0);
  const upcoming = todayAppointments.filter((a: any) => a.status === 'SCHEDULED' && new Date(a.startTime) > new Date());
  const nextAppointment = upcoming[0] || null;

  // Billing Alert Logic
  let billingAlert: { message: string; type: 'warning' | 'error' } | null = null;
  if (latestReport) {
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
      reviewCount: latestReport.reviewCount
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
  const { shop, userRole, canManageInventory, shopSlug, lowStockItems, todayStats, billingAlert } = await getShopData(shopId, userId);

  // SUPER_ADMIN is a site admin — redirect to team assignment page (they don't access shop operations)
  if (userRole === 'SUPER_ADMIN') {
    return redirect(`/shop/${shopId}/settings/team`);
  }

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

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isStaff = userRole === 'STAFF';
  const canEditServices = isShopAdmin; // SUPER_ADMIN CANNOT EDIT
  const showInventoryControls = isShopAdmin || (isStaff && canManageInventory); // SUPER_ADMIN CANNOT MANAGE INVENTORY
  const resolvedSlug = shopSlug || shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={resolvedSlug}
      pageTitle={isStaff ? 'Staff Dashboard' : isSuperAdmin ? 'Platform Admin View' : 'Shop Admin Dashboard'}
      shopId={shopId}
      userRole={userRole as string}
      activeTab="dashboard"
    >
      {isShopAdmin && billingAlert && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
          billingAlert.type === 'warning' 
            ? 'bg-amber-900/20 border-amber-500/30 text-amber-200' 
            : 'bg-red-900/20 border-red-500/30 text-red-200'
        }`}>
          <span className="text-2xl mt-0.5">⚠️</span>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">Billing & Usage Alert</h3>
            <p className="text-xs opacity-90">{billingAlert.message}</p>
            <Link href={`/shop/${shopId}/settings/billing`} className="mt-2 inline-block text-xs font-bold underline hover:no-underline">
              View Billing Report →
            </Link>
          </div>
        </div>
      )}

      {/* ── Booking Link + Quick Actions row (shop admin only) ── */}
      {isShopAdmin && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Online booking link */}
          <div className="flex-1 bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-4 flex items-center gap-4">
            <span className="text-2xl">🔗</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Your Booking Portal</p>
              <p className="text-white font-mono text-sm truncate">/shops/{resolvedSlug}</p>
            </div>
            <Link href={`/shops/${resolvedSlug}`} target="_blank"
              className="flex-shrink-0 px-3 py-1.5 bg-brand-gold text-black text-xs font-bold rounded-lg hover:bg-white transition-colors">
              Open →
            </Link>
          </div>
          {/* Quick Actions */}
          <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm mb-0.5">👥 Team Management</p>
              <p className="text-xs text-gray-400">Onboard staff or set working hours</p>
            </div>
            <Link href={`/shop/${shopId}/settings/team`}
              className="flex-shrink-0 px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors">
              Manage Team →
            </Link>
          </div>
          {/* Low-stock alert */}
          {lowStockItems.length > 0 && (
            <div className="flex-1 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
              <p className="text-orange-300 font-semibold text-sm mb-2">⚠️ {lowStockItems.length} Low-Stock Item{lowStockItems.length > 1 ? 's' : ''}</p>
              <div className="space-y-1">
                {lowStockItems.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-gray-300 truncate">{item.name}</span>
                    <span className="text-orange-300 font-mono ml-2 flex-shrink-0">{item.inventoryCount} left</span>
                  </div>
                ))}
                {lowStockItems.length > 3 && <p className="text-gray-500 text-xs">+{lowStockItems.length - 3} more</p>}
              </div>
              <Link href={`/shop/${shopId}/config/products`} className="text-orange-300 hover:text-orange-200 text-xs underline mt-2 inline-block">
                Restock now →
              </Link>
            </div>
          )}
        </div>
      )}
      {/* Today's Snapshot */}
      {todayStats && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">📊 Today&apos;s Snapshot</h2>
          <div className="bg-slate-900/80 backdrop-blur-xl shadow-lg rounded-2xl border border-white/10 mb-8 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80"></div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold truncate">Total Bookings</h3>
                <span className="text-blue-500 text-sm">📅</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white break-words leading-tight">{todayStats.totalBookings}</p>
            </div>
            <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80"></div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold truncate">Revenue</h3>
                <span className="text-green-500 text-sm">💵</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white break-words leading-tight">${todayStats.revenue.toFixed(0)}</p>
            </div>
            <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/80"></div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold truncate">Tips</h3>
                <span className="text-amber-500 text-sm">🪙</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white break-words leading-tight">${todayStats.tips.toFixed(0)}</p>
            </div>
            <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/80"></div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold truncate">Completed</h3>
                <span className="text-purple-500 text-sm">✅</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white break-words leading-tight">{todayStats.completedCount}</p>
            </div>
            <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/80"></div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold truncate">Upcoming</h3>
                <span className="text-cyan-500 text-sm">⏳</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white break-words leading-tight">{todayStats.upcomingCount}</p>
            </div>
          </div>
          {todayStats.nextAppointment && (
            <div className="mt-3 bg-slate-900/50 p-3 rounded-lg border border-white/5 flex items-center gap-3">
              <span className="text-brand-gold font-mono text-sm">
                {new Date(todayStats.nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-white text-sm font-medium">{todayStats.nextAppointment.user?.name || 'Guest'}</span>
              <span className="text-gray-400 text-xs">— {todayStats.nextAppointment.service?.name}</span>
              {todayStats.nextAppointment.staff?.name && <span className="text-purple-400 text-xs">✂️ {todayStats.nextAppointment.staff.name}</span>}
              <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wider">Next Up</span>
            </div>
          )}
        </div>
      )}
      
      {/* ── Inbox / Notifications (STAFF only) ── */}
      {isStaff && (
        <div className="mb-6 sm:mb-8">
          <StaffInbox shopId={shopId} userId={userId} />
        </div>
      )}

    </ShopAdminLayout>
  );
}
