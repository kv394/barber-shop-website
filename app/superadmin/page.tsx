import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
  // Fetch all platform-wide KPIs in parallel
  const [
    shopCount,
    userCounts,
    recentShops,
    unresolvedLogs,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    }),
    prisma.shop.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    }),
    prisma.systemLog.count({ where: { isResolved: false } }),
  ]);

  // Derive user counts
  const totalUsers = userCounts.reduce((acc: number, g: any) => acc + g._count.id, 0);
  const roleCounts: Record<string, number> = {};
  userCounts.forEach((g: any) => { roleCounts[g.role] = g._count.id; });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-brand-gold mb-2">Platform Dashboard</h1>
        <p className="text-gray-400">Overview of all shops and users across the platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <KpiCard label="Total Shops" value={shopCount} color="blue" />
        <KpiCard label="Total Users" value={totalUsers} color="purple" />
        <KpiCard label="Unresolved Errors" value={unresolvedLogs} color={unresolvedLogs > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Breakdown */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white mb-4">👥 Users by Role</h2>
          <div className="space-y-3">
            {(['SUPER_ADMIN', 'SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'] as const).map(role => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{role.replace(/_/g, ' ')}</span>
                <span className="text-sm font-mono text-white bg-white/5 px-3 py-1 rounded-lg">
                  {roleCounts[role] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Shops */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">🏪 Recent Shops</h2>
            <Link href="/superadmin/shops" className="text-brand-gold text-sm hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-white/10">
                  <th className="pb-3 font-medium">Shop Name</th>
                  <th className="pb-3 font-medium">Users</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentShops.map((shop: any) => (
                  <tr key={shop.id} className="hover:bg-white/5 transition">
                    <td className="py-3 text-white font-medium">{shop.name}</td>
                    <td className="py-3 text-gray-300">{shop._count.users}</td>
                    <td className="py-3 text-gray-400">{new Date(shop.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <Link href={`/shop/${shop.id}/settings/team`} className="text-brand-gold hover:underline text-xs">
                        Assign Team →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-900/40 to-blue-800/20 border-blue-500/30 text-blue-400',
    purple: 'from-purple-900/40 to-purple-800/20 border-purple-500/30 text-purple-400',
    green: 'from-green-900/40 to-green-800/20 border-green-500/30 text-green-400',
    amber: 'from-amber-900/40 to-amber-800/20 border-amber-500/30 text-amber-400',
    cyan: 'from-cyan-900/40 to-cyan-800/20 border-cyan-500/30 text-cyan-400',
    red: 'from-red-900/40 to-red-800/20 border-red-500/30 text-red-400',
  };
  const classes = colorMap[color] || colorMap.blue;
  const textColor = classes.split(' ').pop() || 'text-white';

  return (
    <div className={`bg-gradient-to-br ${classes} border p-4 rounded-xl text-center`}>
      <p className={`text-2xl sm:text-3xl font-black ${textColor}`}>{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
