import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SiteAdminDashboard() {
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
        <h1 className="font-serif font-bold text-botanical-accent mb-2 text-4xl md:text-5xl lg:text-6xl">Platform Dashboard</h1>
        <p className="text-botanical-muted text-base md:text-lg">Overview of all shops and users across the platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <KpiCard label="Total Shops" value={shopCount} color="blue" />
        <KpiCard label="Total Users" value={totalUsers} color="purple" />
        <KpiCard label="Unresolved Errors" value={unresolvedLogs} color={unresolvedLogs > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Breakdown */}
        <div className="bg-botanical-surface rounded-xl border border-botanical-border shadow-sm p-6">
          <h2 className="font-bold text-botanical-text mb-4 text-3xl md:text-4xl">👥 Users by Role</h2>
          <div className="space-y-3">
            {(['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'] as const).map(role => (
              <div key={role} className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
                <span className="text-sm text-botanical-muted">{role.replace(/_/g, ' ')}</span>
                <span className="text-sm font-mono text-botanical-text bg-botanical-surface px-3 py-1 rounded-lg">
                  {roleCounts[role] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Shops */}
        <div className="bg-botanical-surface rounded-xl border border-botanical-border shadow-sm p-6">
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
            <h2 className="font-bold text-botanical-text text-3xl md:text-4xl">🏪 Recent Shops</h2>
            <Link href="/siteadmin/shops" className="text-botanical-accent text-sm hover:underline">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-botanical-muted text-left border-b border-botanical-border">
                  <th className="pb-3 font-medium">Shop Name</th>
                  <th className="pb-3 font-medium">Users</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentShops.map((shop: any) => (
                  <tr key={shop.id} className="hover:bg-botanical-surface transition">
                    <td className="py-3 text-botanical-text font-medium">{shop.name}</td>
                    <td className="py-3 text-botanical-muted">{shop._count.users}</td>
                    <td className="py-3 text-botanical-muted">{new Date(shop.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <Link href={`/shop/${shop.id}/settings/team`} className="text-botanical-accent hover:underline text-xs">
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
    blue: 'from-blue-900/40 to-blue-800/20 border-status-info/30 text-status-info',
    purple: 'from-purple-900/40 to-purple-800/20 border-purple-500/30 text-purple-400',
    green: 'from-green-900/40 to-green-800/20 border-status-confirmed/30 text-status-confirmed',
    amber: 'from-amber-900/40 to-amber-800/20 border-status-pending/30 text-status-pending',
    cyan: 'from-cyan-900/40 to-cyan-800/20 border-cyan-500/30 text-cyan-400',
    red: 'from-red-900/40 to-red-800/20 border-status-cancelled/30 text-status-cancelled',
  };
  const classes = colorMap[color] || colorMap.blue;
  const textColor = classes.split(' ').pop() || 'text-botanical-text';

  return (
    <div className={`bg-gradient-to-br ${classes} border p-4 rounded-xl text-center`}>
      <p className={`${` font-black ${textColor} text-base md:text-lg`}`}>{value}</p>
      <p className="text-botanical-muted uppercase tracking-wider mt-1 text-base md:text-lg">{label}</p>
    </div>
  );
}
