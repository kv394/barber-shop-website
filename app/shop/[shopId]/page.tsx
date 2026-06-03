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
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import AIFinderFeeStats from '@/components/shop-admin/AIFinderFeeStats';
import { serialize } from '@/lib/serialize';

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
 shop: serialize(shopFromDb), 
 userRole: data.userRole,
 canManageInventory: data.canManageInventory,
 shopSlug: data.shopSlug,
 lowStockItems: serialize(lowStockItems),
 billingAlert,
 isClockedIn: activeLogs.length > 0,
 todayStats: {
 totalBookings: todayAppointments.length,
 completedCount: completed.length,
 upcomingCount: upcoming.length,
 revenue: todayRevenue,
 tips: todayTips,
 nextAppointment: nextAppointment ? serialize(nextAppointment) : null,
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
 
 {/* ── Staff Quick Actions ── */}
 {isStaffLike && (
 <section className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
 <DirectClockInButton shopId={shopId} initialIsClockedIn={isClockedIn} />
 <div className="flex-1 text-[13px] text-crm-muted bg-white/5 border border-white/10 rounded-xl px-4 py-3">
 {isClockedIn 
 ? <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-status-confirmed animate-pulse" /> You are currently clocked in</span>
 : <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-crm-muted" /> Clock in to start your shift</span>
 }
 </div>
 </section>
 )}
 
 {/* ── Today's Overview ── */}
 {todayStats && (
 <section>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
 <h2 className="text-xl font-bold text-crm-text tracking-tight flex items-center gap-3">
 <span className="text-2xl">📈</span> Today's Overview
 </h2>
 <div className="text-[13px] font-bold text-crm-muted bg-white/5 px-4 py-2 rounded-full border border-white/10 self-start sm:self-auto uppercase tracking-wider shadow-inner">
 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
 </div>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
 {[
 { label: 'Bookings', value: todayStats.totalBookings, color: 'text-blue-500', accent: 'bg-blue-500/10 border-blue-500/20' },
 { label: 'Revenue', value: `$${todayStats.revenue.toFixed(0)}`, color: 'text-emerald-500', accent: 'bg-emerald-500/10 border-emerald-500/20' },
 { label: 'Tips', value: `$${todayStats.tips.toFixed(0)}`, color: 'text-amber-500', accent: 'bg-amber-500/10 border-amber-500/20' },
 { label: 'Completed', value: todayStats.completedCount, color: 'text-purple-500', accent: 'bg-purple-500/10 border-purple-500/20' },
 { label: 'Upcoming', value: todayStats.upcomingCount, color: 'text-cyan-500', accent: 'bg-cyan-500/10 border-cyan-500/20' },
 ].map((stat, i) => (
 <div key={i} className={`flex-1 shrink-0 bg-white/40 border border-white/20 p-5 rounded-2xl text-center shadow-inner relative overflow-hidden group`}>
 <div className={`absolute inset-0 ${stat.accent} opacity-50 transition-opacity group-hover:opacity-100`}></div>
 <div className="relative z-10">
 <p className={`text-3xl font-black mb-1.5 ${stat.color} drop-shadow-sm`}>{stat.value}</p>
 <p className="text-[11px] font-black text-crm-muted uppercase tracking-widest">{stat.label}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* ── Left Column: Action Items ── */}
 <div className="space-y-6">
 {(() => {
  const hasAttentionItems = !!todayStats?.nextAppointment || (isShopAdmin && lowStockItems.length > 0);
  return (
  <h3 className="text-lg font-bold text-crm-text flex items-center gap-3">
  {hasAttentionItems ? (
  <>
  <span className="w-2.5 h-2.5 rounded-full bg-crm-primary shadow-[0_0_10px_rgba(var(--crm-primary-rgb),0.8)] animate-pulse"></span>
  Needs Attention
  </>
  ) : (
  <>
  <span className="w-2.5 h-2.5 rounded-full bg-status-confirmed shadow-[0_0_10px_rgba(var(--status-confirmed-rgb),0.5)]"></span>
  All Clear
  </>
  )}
  </h3>
  );
  })()}
 
 {/* Up Next Appointment */}
 {todayStats?.nextAppointment && (
 <PremiumGlassCard className="!p-0 overflow-hidden" accentColor="crm-primary">
 <div className="p-5">
 <div className="flex items-start justify-between mb-4">
 <div>
 <p className="text-[11px] font-black text-crm-primary mb-1.5 uppercase tracking-widest">
 Up Next • {new Date(todayStats.nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 <h4 className="text-xl font-bold text-crm-text">{todayStats.nextAppointment.user?.name || 'Guest'}</h4>
 </div>
 </div>
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm text-crm-muted mt-4 pt-4 border-t border-white/20 bg-crm-bg/50 -mx-5 px-5 -mb-5 pb-5">
 <div className="flex items-center gap-2">
 <span className="text-[11px] uppercase tracking-wider font-bold">Service:</span>
 <span className="font-bold text-crm-text">{todayStats.nextAppointment.service?.name}</span>
 </div>
 {todayStats.nextAppointment.staff?.name && (
 <div className="flex items-center gap-2">
 <span className="text-[11px] uppercase tracking-wider font-bold">Staff:</span>
 <span className="font-bold text-crm-text">{todayStats.nextAppointment.staff.name}</span>
 </div>
 )}
 </div>
 </div>
 </PremiumGlassCard>
 )}

 {/* Low Stock Alert (shop admin only) */}
 {isShopAdmin && lowStockItems.length > 0 && (
 <PremiumGlassCard className="!p-0 overflow-hidden" accentColor="brand-indigo">
 <div className="p-5 bg-status-pending/5">
 <p className="text-status-pending font-black mb-4 text-[13px] uppercase tracking-widest">⚠️ {lowStockItems.length} Low-Stock Item{lowStockItems.length > 1 ? 's' : ''}</p>
 <div className="space-y-3">
 {lowStockItems.slice(0, 3).map((item: any) => (
 <div key={item.id} className="flex justify-between items-center text-[13px] bg-black/20 px-4 py-3 rounded-lg border border-status-pending/20 shadow-inner">
 <span className="text-crm-text font-bold truncate">{item.name}</span>
 <span className="text-status-pending font-black font-mono ml-2 bg-status-pending/10 px-2 py-0.5 rounded">{item.inventoryCount} left</span>
 </div>
 ))}
 {lowStockItems.length > 3 && <p className="text-crm-muted text-[11px] font-bold mt-2 text-center uppercase tracking-wider">+{lowStockItems.length - 3} more items need restocking</p>}
 </div>
 <Link href={`/shop/${shopId}/config/products`} className="text-status-pending hover:text-crm-text font-bold transition-colors text-[12px] uppercase tracking-wider mt-4 flex items-center justify-center py-2 bg-status-pending/10 hover:bg-status-pending/20 rounded-lg border border-status-pending/20">
 Restock Inventory →
 </Link>
 </div>
 </PremiumGlassCard>
 )}

 {/* Empty State */}
 {(!todayStats?.nextAppointment && (!isShopAdmin || lowStockItems.length === 0)) && (
 <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
 <span className="text-4xl mb-4 opacity-50 drop-shadow-md">✨</span>
 <p className="text-crm-muted text-[14px] max-w-[250px] mx-auto font-medium">
 You have no pending action items right now. Great job!
 </p>
 </div>
 )}
 </div>

 {/* ── Right Column: Insights & Forecasts ── */}
 <div className="space-y-6">
 <h3 className="text-lg font-bold text-crm-text flex items-center gap-3">
 <span className="w-2.5 h-2.5 rounded-full bg-status-info shadow-[0_0_10px_rgba(var(--status-info-rgb),0.8)] animate-pulse"></span>
 Insights
 </h3>
 
 {showInventoryControls && (
 <InventoryForecast shopId={shopId} />
 )}

 {isShopAdmin && (
 <AIFinderFeeStats shopId={shopId} />
 )}

 {isStaffLike && (
 <StaffInbox shopId={shopId} userId={userId} />
 )}
 
 </div>

 </div>
 </div>
 </ShopAdminLayout>
 );
}
