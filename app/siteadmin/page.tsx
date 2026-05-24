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
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        companyName: true,
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
        <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-crm-muted text-[13px]">Overview of all shops and users across the platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <KpiCard label="Total Shops" value={shopCount} color="blue" />
        <KpiCard label="Total Users" value={totalUsers} color="purple" />
        <KpiCard label="Unresolved Errors" value={unresolvedLogs} color={unresolvedLogs > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Breakdown */}
        <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-gold/5 p-6">
          <h2 className="font-bold text-crm-text mb-4 text-xl font-bold">👥 Users by Role</h2>
          <div className="space-y-3">
            {(['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'] as const).map(role => (
              <div key={role} className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
                <span className="text-[13px] text-crm-muted">{role.replace(/_/g, ' ')}</span>
                <span className="text-[13px] font-mono text-crm-text bg-crm-surface px-3 py-1 rounded-lg">
                  {roleCounts[role] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Shops */}
        <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-gold/5 p-6">
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
            <h2 className="font-bold text-crm-text text-xl font-bold">🏪 Recent Shops & Locations</h2>
            <Link href="/siteadmin/shops" className="text-crm-accent text-[13px] hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {Object.entries(
              recentShops.reduce((acc: any, shop: any) => {
                const key = shop.companyName || shop.name;
                if (!acc[key]) acc[key] = [];
                acc[key].push(shop);
                return acc;
              }, {})
            ).map(([companyName, shops]: [string, any]) => (
              <div key={companyName} className="border border-crm-border rounded-lg overflow-hidden">
                <div className="bg-crm-bg px-3 py-2 border-b border-crm-border text-sm font-bold text-crm-text">
                  <span className="text-crm-primary mr-2">🏢</span>
                  {companyName}
                </div>
                <div className="divide-y divide-white/5">
                  {shops.map((shop: any) => (
                    <div key={shop.id} className="p-3 hover:bg-crm-surface transition flex justify-between items-center text-[13px]">
                      <div>
                        <div className="text-crm-text font-medium">{shop.name}</div>
                        <div className="text-crm-muted text-[11px] mt-0.5">
                          {shop._count.users} users • Created {new Date(shop.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Link href={`/shop/${shop.id}/settings/team`} className="text-crm-accent hover:underline text-[11px] whitespace-nowrap ml-4">
                        Assign Team →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-white/60 border-white/40 shadow-brand-gold/5 text-status-info',
    purple: 'bg-white/60 border-white/40 shadow-brand-gold/5 text-crm-accent',
    green: 'bg-white/60 border-white/40 shadow-brand-gold/5 text-status-confirmed',
    amber: 'bg-white/60 border-white/40 shadow-brand-gold/5 text-status-pending',
    cyan: 'bg-white/60 border-white/40 shadow-brand-gold/5 text-cyan-600',
    red: 'bg-white/60 border-white/40 shadow-brand-gold/5 text-status-cancelled',
  };
  const classes = colorMap[color] || colorMap.blue;
  const textColor = classes.split(' ').pop() || 'text-crm-text';

  return (
    <div className={`backdrop-blur-xl ${classes} border shadow-sm p-4 rounded-xl text-center transition-transform hover:scale-105`}>
      <p className={`font-black ${textColor} text-3xl sm:text-4xl`}>{value}</p>
      <p className="text-[11px] text-crm-muted uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
