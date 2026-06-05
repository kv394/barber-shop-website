import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SiteAdminDashboard() {
 // Dates for querying
 const startOfDay = new Date();
 startOfDay.setHours(0, 0, 0, 0);

 const endOfDay = new Date(startOfDay);
 endOfDay.setDate(endOfDay.getDate() + 1);

 const thirtyDaysAgo = new Date();
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

 // Fetch all platform-wide KPIs in parallel
 const [
 shopCount,
 userCounts,
 recentShops,
 unresolvedLogs,
 appointmentsToday,
 activeShopsData,
 estMRRData
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
 prisma.appointment.count({
 where: {
 startTime: {
 gte: startOfDay,
 lt: endOfDay,
 },
 },
 }),
 prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "shopId") as count 
      FROM "Appointment" 
      WHERE "startTime" >= ${thirtyDaysAgo}
    `,
 prisma.$queryRaw<Array<{ estMRR: number }>>`
      WITH RankedReports AS (
        SELECT "shopId", "suggestedMonthlyFeeUSD",
               ROW_NUMBER() OVER (PARTITION BY "shopId" ORDER BY "period" DESC) as rn
        FROM "ShopUsageReport"
      )
      SELECT COALESCE(SUM("suggestedMonthlyFeeUSD"), 0) as "estMRR"
      FROM RankedReports
      WHERE rn = 1
    `
 ]);

 const activeShopsCount = Number(activeShopsData[0]?.count || 0);
 const churnedShopsCount = Math.max(0, shopCount - activeShopsCount);
 
 const estMRR = Number(estMRRData[0]?.estMRR || 0);
 const formattedMRR = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(estMRR);

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
     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 mb-8">
     <KpiCard label="Total Shops" value={shopCount} color="blue" subtitle={`${shopCount} total registered`} />
     <KpiCard label="Active Shops" value={activeShopsCount} color="green" subtitle={`${churnedShopsCount} inactive (30d)`} />
     <KpiCard label="Total Users" value={totalUsers} color="purple" subtitle={`Across all roles`} />
     <KpiCard label="Appts Today" value={appointmentsToday} color="cyan" subtitle={`Platform-wide`} />
     <KpiCard label="Est. MRR" value={formattedMRR} color="amber" subtitle={`From usage reports`} />
     <KpiCard label="Unresolved Errors" value={unresolvedLogs} color={unresolvedLogs > 0 ? 'red' : 'green'} subtitle={unresolvedLogs > 0 ? 'Action required' : 'All clear'} />
     </div>
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
     {/* User Breakdown */}
     <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-indigo/5 p-6">
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
     <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-indigo/5 p-6">
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
     {/* Infrastructure Details */}
     <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-indigo/5 p-6 mb-8">
     <h2 className="font-bold text-crm-text mb-4 text-xl font-bold">⚙️ Infrastructure Details</h2>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     <InfraCard title="Database (Primary)" name="DATABASE_URL" value={process.env.DATABASE_URL} isUrl />
     <InfraCard title="Database (Pooled)" name="POSTGRES_URL" value={process.env.POSTGRES_URL} isUrl />
     <InfraCard title="Vercel Environment" name="VERCEL_ENV" value={process.env.VERCEL_ENV || 'local (or unconfigured)'} />
     <InfraCard title="Vercel Deployment URL" name="VERCEL_URL" value={process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL} />
     <InfraCard title="Vercel Region" name="VERCEL_REGION" value={process.env.VERCEL_REGION || 'local (or unconfigured)'} />
     <InfraCard title="Upstash Redis URL" name="UPSTASH_REDIS_REST_URL" value={process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL} isUrl />
     </div>
     </div>
   </div>
 );
}

function InfraCard({ title, name, value, isUrl = false }: { title: string; name: string; value?: string; isUrl?: boolean }) {
  let displayValue = value;
  let isNotConfigured = !value;
  
  if (value && isUrl) {
    try {
      const url = new URL(value);
      let maskedPath = url.pathname;
      if (maskedPath && maskedPath !== '/') {
        maskedPath = '/***';
      }
      if (url.password) {
        displayValue = `${url.protocol}//${url.username}:***@${url.host}${maskedPath}${url.search}`;
      } else if (maskedPath === '/***') {
        displayValue = `${url.protocol}//${url.host}${maskedPath}${url.search}`;
      }
    } catch (e) {
      // Keep displayValue as is if it's not a valid URL
    }
  }

 return (
    <div className="border border-crm-border rounded-xl p-5 bg-white/40 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-indigo to-crm-accent opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="text-[11px] font-mono text-crm-muted mb-1 flex items-center justify-between">
        <span>{name}</span>
        <span className={`w-2 h-2 rounded-full ${isNotConfigured ? 'bg-status-pending' : 'bg-status-confirmed'} animate-pulse`}></span>
      </div>
      <div className="font-bold text-[15px] text-crm-text mb-2">{title}</div>
      <div className={`text-[12px] font-mono break-all ${isNotConfigured ? 'text-status-pending italic' : 'text-crm-text/80'} bg-crm-bg/50 p-2 rounded-md border border-crm-border/50`}>
        {isNotConfigured ? 'Not Configured' : displayValue}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, subtitle }: { label: string; value: string | number; color: string; subtitle?: React.ReactNode }) {
 const colorMap: Record<string, string> = {
 blue: 'bg-white/60 border-white/40 shadow-brand-indigo/5 text-status-info',
 purple: 'bg-white/60 border-white/40 shadow-brand-indigo/5 text-crm-accent',
 green: 'bg-white/60 border-white/40 shadow-brand-indigo/5 text-status-confirmed',
 amber: 'bg-white/60 border-white/40 shadow-brand-indigo/5 text-status-pending',
 cyan: 'bg-white/60 border-white/40 shadow-brand-indigo/5 text-cyan-600',
 red: 'bg-white/60 border-white/40 shadow-brand-indigo/5 text-status-cancelled',
 };
 const classes = colorMap[color] || colorMap.blue;
 const textColor = classes.split(' ').pop() || 'text-crm-text';

 return (
 <div className={`backdrop-blur-xl ${classes} border shadow-sm p-4 rounded-xl text-center transition-all duration-300 hover:scale-105 hover:shadow-md relative overflow-hidden group`}>
 <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
 <p className={`font-black ${textColor} text-3xl sm:text-4xl relative z-10`}>{value}</p>
 <p className="text-[11px] text-crm-muted uppercase tracking-wider mt-1 relative z-10">{label}</p>
 {subtitle && <div className="text-[10px] text-crm-muted/80 mt-2 relative z-10 border-t border-crm-border/50 pt-1">{subtitle}</div>}
 </div>
 );
}
