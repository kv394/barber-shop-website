import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import CreateServiceForm from '@/components/CreateServiceForm';
import DeleteServiceButton from '@/components/DeleteServiceButton';
import InventoryManager from '@/components/InventoryManager';
import Link from 'next/link';
import BarcodeScannerWrapper from '@/components/BarcodeScannerWrapper';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';

export const dynamic = 'force-dynamic';

async function getShopData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) {
    return { shop: null, userRole: null, canManageInventory: false, todayStats: null };
  }

  const shopFromDb = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      services: { orderBy: { type: 'asc' } },
      users: { orderBy: { role: 'asc' } },
    },
  });

  if (!shopFromDb) {
    return { shop: null, userRole: data.userRole, canManageInventory: false, todayStats: null };
  }

  // Today's snapshot
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await prisma.appointment.findMany({
    where: { shopId, startTime: { gte: today, lt: tomorrow } },
    include: { service: { select: { price: true, name: true } }, user: { select: { name: true } }, staff: { select: { name: true } } },
    orderBy: { startTime: 'asc' },
  });

  const completed = todayAppointments.filter(a => a.status === 'COMPLETED');
  const todayRevenue = completed.reduce((s, a) => s + (a.totalAmount > 0 ? a.totalAmount : ((a.service?.price || 0) - (a.discount || 0))), 0);
  const todayTips = completed.reduce((s, a) => s + (a.tipAmount || 0), 0);
  const upcoming = todayAppointments.filter(a => a.status === 'SCHEDULED' && new Date(a.startTime) > new Date());
  const nextAppointment = upcoming[0] || null;

  return { 
    shop: JSON.parse(JSON.stringify(shopFromDb)), 
    userRole: data.userRole,
    canManageInventory: data.canManageInventory,
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

export default async function ShopDashboardPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const { shop, userRole, canManageInventory, todayStats } = await getShopData(params.shopId, userId);

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
  const canEditServices = isSuperAdmin || isShopAdmin;
  const showInventoryControls = isSuperAdmin || isShopAdmin || (isStaff && canManageInventory);
  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={isStaff ? 'Staff Dashboard' : 'Shop Admin Dashboard'}
      shopId={params.shopId}
      userRole={userRole as string}
      activeTab="dashboard"
    >
      {/* Today's Snapshot */}
      {todayStats && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">📊 Today&apos;s Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 p-3 sm:p-4 rounded-xl text-center">
              <p className="text-2xl sm:text-3xl font-black text-blue-400">{todayStats.totalBookings}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Total Bookings</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 p-3 sm:p-4 rounded-xl text-center">
              <p className="text-2xl sm:text-3xl font-black text-green-400">${todayStats.revenue.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Revenue</p>
            </div>
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-500/30 p-3 sm:p-4 rounded-xl text-center">
              <p className="text-2xl sm:text-3xl font-black text-amber-400">${todayStats.tips.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Tips</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 p-3 sm:p-4 rounded-xl text-center">
              <p className="text-2xl sm:text-3xl font-black text-purple-400">{todayStats.completedCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Completed</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-500/30 p-3 sm:p-4 rounded-xl text-center col-span-2 sm:col-span-1">
              <p className="text-2xl sm:text-3xl font-black text-cyan-400">{todayStats.upcomingCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Upcoming</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Services & Inventory</h2>
              {showInventoryControls && (
                 <BarcodeScannerWrapper shopId={shop.id} services={shop.services} />
              )}
          </div>
          
          <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
            {shop.services.length > 0 ? (
              shop.services.map((service: any) => (
                <div key={service.id} className="bg-slate-900/70 p-3 sm:p-4 rounded-md border border-white/10 group">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base md:text-lg">{service.name}</h3>
                          {service.type === 'INTERNAL' && (
                             <span className="bg-gray-800 text-gray-300 text-[10px] sm:text-xs px-2 py-0.5 rounded border border-gray-600">{service.itemType || 'Item'}</span>
                          )}
                        </div>
                        {service.type === 'CUSTOMER' ? (
                            <p className="text-xs sm:text-sm text-gray-400">${service.price} - {service.duration} mins</p>
                        ) : (
                            <p className="text-xs sm:text-sm text-gray-400">{service.brand ? `${service.brand} - ` : ''} Cost: ${service.price}/unit</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
                        <div className="flex items-center">
                            <div className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded mr-2 sm:mr-3 ${service.type === 'INTERNAL' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-green-900/50 text-green-300 border border-green-500/30'}`}>{service.type}</div>
                            {canEditServices && (
                                <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <DeleteServiceButton shopId={shop.id} serviceId={service.id} />
                                </div>
                            )}
                        </div>
                        
                        {service.trackInventory ? (
                            <div className="flex items-center bg-gray-800 rounded px-2 py-1 border border-gray-700">
                                <span className="text-[10px] sm:text-xs text-gray-400 mr-2 sm:mr-3">Stock:</span>
                                {showInventoryControls ? (
                                    <InventoryManager shopId={shop.id} serviceId={service.id} currentCount={service.inventoryCount || 0} />
                                ) : (
                                    <span className="text-xs sm:text-sm font-mono text-white">{service.inventoryCount || 0}</span>
                                )}
                            </div>
                        ) : (
                            <div className="text-[10px] sm:text-xs text-gray-500 px-2 py-1">Inv. Off</div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic p-4 text-center text-sm border border-dashed border-white/20 rounded">No services configured for this shop yet.</p>
            )}
          </div>
          
          {canEditServices && (
            <CreateServiceForm shopId={shop.id} />
          )}
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6">Staff & Users</h2>
          <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
            {shop.users.length > 0 ? (
              shop.users.map((user: any) => (
                <div key={user.id} className="bg-slate-900/70 p-2.5 sm:p-3 rounded-md border border-white/10 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm truncate">{user.name || user.email}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shrink-0 ${user.role === 'SHOP_ADMIN' ? 'bg-brand-gold/20 text-brand-gold' : user.role === 'STAFF' ? 'bg-purple-900/50 text-purple-300' : user.role === 'ATTENDANCE_KIOSK' ? 'bg-blue-900/50 text-blue-300' : 'bg-white/10 text-gray-300'}`}>{user.role.replace('_', ' ')}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic p-4 text-center border border-dashed border-white/20 rounded">No users assigned to this shop yet.</p>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <Link href={`/shop/${shop.id}/settings/team`} className="text-sm text-brand-gold hover:underline">Manage Team Members</Link>
          </div>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
