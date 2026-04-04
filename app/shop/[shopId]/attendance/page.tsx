import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null; // Allow SHOP_ADMIN, STAFF, and SUPER_ADMIN

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // STAFF can only see their own attendance; admins see all
  const where = data.isStaff
    ? { shopId, userId: data.user.id, clockIn: { gte: today, lt: tomorrow } }
    : { shopId, clockIn: { gte: today, lt: tomorrow } };

  const logs = await prisma.timeLog.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { clockIn: 'desc' },
  });

  return { 
    shop: data.shop,
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    isStaff: data.isStaff,
    logs: JSON.parse(JSON.stringify(logs))
  };
}

function formatDuration(milliseconds: number) {
    if (milliseconds < 0) return 'N/A';
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

export default async function AttendanceReportPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) redirect('/');

  const pageData = await getPageData(shopId, userId);

  if (!pageData) {
    notFound();
  }

  const { shop, shopSlug, userRole, isStaff, logs } = pageData;

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={isStaff ? `My Attendance — ${new Date().toLocaleDateString()}` : `Daily Attendance Report for ${new Date().toLocaleDateString()}`}
      shopId={shopId}
      userRole={userRole as string}
      activeTab="attendance"
    >
      {logs.length > 0 ? (
        <>
          {/* Mobile: Card layout */}
          <div className="sm:hidden space-y-3">
            {logs.map((log: any) => (
              <div key={log.id} className="bg-slate-900/70 p-3 rounded-lg border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm text-white">{log.user.name || log.user.email}</span>
                  {!log.clockOut && <span className="text-[10px] text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full font-bold animate-pulse">ACTIVE</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Clock In</span>
                    <span className="font-mono text-gray-300">{new Date(log.clockIn).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Clock Out</span>
                    <span className="font-mono text-gray-300">
                      {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Duration: </span>
                    <span className="font-mono text-white">
                      {log.clockOut ? formatDuration(new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs sm:text-sm">
                  <th className="p-3 sm:p-4 font-semibold">Staff Member</th>
                  <th className="p-3 sm:p-4 font-semibold">Clock In</th>
                  <th className="p-3 sm:p-4 font-semibold">Clock Out</th>
                  <th className="p-3 sm:p-4 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="p-3 sm:p-4 text-sm">{log.user.name || log.user.email}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm">{new Date(log.clockIn).toLocaleTimeString()}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm">
                      {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : (
                        <span className="text-green-400 animate-pulse">Clocked In</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-sm">
                      {log.clockOut ? formatDuration(new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 py-6 sm:py-8 text-sm">No attendance records for today yet.</p>
      )}
    </ShopAdminLayout>
  );
}
