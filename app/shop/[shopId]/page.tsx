import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import Link from 'next/link';
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

  const isStaff = userRole === 'STAFF';
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
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Today&apos;s Overview</h2>
            <div className="text-sm font-medium text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 self-start sm:self-auto">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Bookings', value: todayStats.totalBookings, color: 'text-blue-400' },
              { label: 'Revenue', value: `$${todayStats.revenue.toFixed(0)}`, color: 'text-green-400' },
              { label: 'Tips', value: `$${todayStats.tips.toFixed(0)}`, color: 'text-amber-400' },
              { label: 'Completed', value: todayStats.completedCount, color: 'text-purple-400' },
              { label: 'Upcoming', value: todayStats.upcomingCount, color: 'text-cyan-400', colSpan: 'col-span-2 sm:col-span-1' },
            ].map((stat, i) => (
              <div key={i} className={`bg-slate-900/50 backdrop-blur-sm border border-white/10 p-5 rounded-2xl text-center shadow-lg hover:bg-slate-800/50 hover:border-white/20 transition-all duration-300 ${stat.colSpan || ''}`}>
                <p className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Appointment & Action Items */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
            Up Next
          </h3>
          
          {todayStats?.nextAppointment ? (
            <div className="bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 border border-brand-gold/20 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-brand-gold mb-1">
                    {new Date(todayStats.nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <h4 className="text-xl font-bold text-white">{todayStats.nextAppointment.user?.name || 'Guest'}</h4>
                </div>
                <div className="bg-brand-gold/20 text-brand-gold text-xs font-bold px-3 py-1 rounded-full border border-brand-gold/30">
                  Starts Soon
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300 mt-4 pt-4 border-t border-brand-gold/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium text-white">{todayStats.nextAppointment.service?.name}</span>
                </div>
                {todayStats.nextAppointment.staff?.name && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Barber:</span>
                    <span className="font-medium text-white">{todayStats.nextAppointment.staff.name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl text-center">
              <p className="text-gray-500 text-sm">No upcoming appointments today.</p>
            </div>
          )}
        </div>

        {/* Quick Links / Status */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Shop Status
          </h3>
          
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 shadow-lg">
             <div className="space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-white/5">
                 <div>
                   <p className="text-sm font-semibold text-white">Inventory Alerts</p>
                   <p className="text-xs text-gray-500 mt-0.5">Items running low on stock</p>
                 </div>
                 <div className="bg-green-500/10 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/20">
                   All Good
                 </div>
               </div>
               
               <div className="flex justify-between items-center pb-4 border-b border-white/5">
                 <div>
                   <p className="text-sm font-semibold text-white">Staff Attendance</p>
                   <p className="text-xs text-gray-500 mt-0.5">Currently clocked in</p>
                 </div>
                 <Link href={`/shop/${shop.id}/attendance`} className="text-xs font-medium text-brand-gold hover:underline">
                   View Log
                 </Link>
               </div>

               <div className="flex justify-between items-center">
                 <div>
                   <p className="text-sm font-semibold text-white">Pending Leave Requests</p>
                   <p className="text-xs text-gray-500 mt-0.5">Awaiting manager approval</p>
                 </div>
                 <Link href={`/shop/${shop.id}/leave`} className="text-xs font-medium text-brand-gold hover:underline">
                   Review
                 </Link>
               </div>
             </div>
          </div>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
