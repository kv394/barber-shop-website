import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

export const dynamic = 'force-dynamic';

export default async function SiteAdminPerformancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  });

  if (dbUser?.role !== 'SITE_ADMIN') {
    redirect('/');
  }

  // --- Data Fetching ---
  const [totalShops, totalUsers, totalAppointments, appointmentStatsRaw] = await Promise.all([
    prisma.shop.count(),
    prisma.user.count(),
    prisma.appointment.count({
      where: { status: { not: 'CANCELLED' } }
    }),
    prisma.appointment.groupBy({
      by: ['status'],
      _count: true
    })
  ]);

  const allReports = await prisma.shopUsageReport.findMany({
    orderBy: { period: 'desc' },
    include: { shop: { select: { name: true } } }
  });

  const latestReportsMap = new Map();
  for (const report of allReports) {
    if (!latestReportsMap.has(report.shopId)) {
      latestReportsMap.set(report.shopId, report);
    }
  }
  const latestReports = Array.from(latestReportsMap.values());

  const totalStorageMB = latestReports.reduce((acc, r) => acc + (r.estimatedStorageMB || 0), 0);
  const totalSuggestedRevenue = latestReports.reduce((acc, r) => acc + (r.suggestedMonthlyFeeUSD || 0), 0);
  const totalSMS = latestReports.reduce((acc, r) => acc + (r.formSubmissionCount || 0) * 2, 0); // Mock SMS if not specifically tracked but we want to show it based on some metric like form submissions sending notifications
  
  const topShops = [...latestReports].sort((a, b) => b.appointmentCount - a.appointmentCount).slice(0, 10);

  // Parse appointment stats
  const appointmentStatuses = appointmentStatsRaw.map(s => ({
    status: s.status,
    count: s._count
  }));
  const totalApptsCount = appointmentStatuses.reduce((acc, s) => acc + s.count, 0) || 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl">System Performance</h1>
        <p className="text-crm-muted text-[13px]">Monitor platform health, shop activity, and usage metrics across Kutzapp.</p>
      </div>

      <div className="space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <PremiumGlassCard accentColor="crm-primary" className="!p-6 text-center">
            <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">Total Shops</p>
            <p className="text-4xl font-black text-crm-text">{totalShops.toLocaleString()}</p>
          </PremiumGlassCard>
          
          <PremiumGlassCard accentColor="cyan-500" className="!p-6 text-center">
            <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">Platform Users</p>
            <p className="text-4xl font-black text-crm-text">{totalUsers.toLocaleString()}</p>
          </PremiumGlassCard>
          
          <PremiumGlassCard accentColor="emerald-500" className="!p-6 text-center">
            <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">Storage Used</p>
            <p className="text-4xl font-black text-crm-text">{totalStorageMB.toLocaleString(undefined, { maximumFractionDigits: 1 })}<span className="text-sm ml-1 text-crm-muted">MB</span></p>
          </PremiumGlassCard>
          
          <PremiumGlassCard accentColor="brand-indigo" className="!p-6 text-center">
            <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">MRR Potential</p>
            <p className="text-4xl font-black text-crm-text">${totalSuggestedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-crm-muted font-bold mt-1 uppercase tracking-widest">Suggested</p>
          </PremiumGlassCard>
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointment Breakdown Chart */}
          <PremiumGlassCard accentColor="brand-indigo" className="!p-6">
            <h2 className="text-sm uppercase tracking-widest font-black text-crm-muted mb-6">Appointments by Status</h2>
            <div className="space-y-4">
              {appointmentStatuses.sort((a,b) => b.count - a.count).map(stat => {
                const percentage = Math.round((stat.count / totalApptsCount) * 100);
                return (
                  <div key={stat.status}>
                    <div className="flex justify-between text-[12px] font-bold text-crm-text mb-1">
                      <span>{stat.status.replace('_', ' ')}</span>
                      <span>{stat.count.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden border border-white/5">
                      <div 
                        className={`h-2.5 rounded-full ${stat.status === 'COMPLETED' ? 'bg-emerald-500' : stat.status === 'CANCELLED' ? 'bg-red-500' : stat.status === 'NO_SHOW' ? 'bg-amber-500' : 'bg-crm-primary'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {appointmentStatuses.length === 0 && (
                <div className="text-center py-6 text-crm-muted text-sm font-bold">No appointments found</div>
              )}
            </div>
          </PremiumGlassCard>

          {/* Volume stats */}
          <PremiumGlassCard accentColor="amber-500" className="!p-6 flex flex-col justify-center">
            <h2 className="text-sm uppercase tracking-widest font-black text-crm-muted mb-6">Platform Volume</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-lg">📅</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-crm-muted">Total Active Appts</div>
                    <div className="text-xl font-black text-crm-text">{totalAppointments.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-lg">📱</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-crm-muted">Estimated Notifications</div>
                    <div className="text-xl font-black text-crm-text">{totalSMS.toLocaleString()} <span className="text-xs text-crm-muted font-normal">(proxy via forms)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </PremiumGlassCard>
        </div>

        {/* Top Shops Table */}
        <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h2 className="text-lg font-black text-crm-text">Most Active Shops</h2>
            <span className="text-[10px] uppercase tracking-widest font-bold text-crm-muted bg-black/20 px-3 py-1.5 rounded-full shadow-inner border border-white/10">By Appointment Volume</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/10">
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted">Shop Name</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted">Plan / Tier</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Appts (Mo)</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Users</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Storage</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[13px]">
                {topShops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-crm-muted font-bold">No shop usage data generated yet.</td>
                  </tr>
                ) : (
                  topShops.map((report, i) => (
                    <tr key={report.shopId} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-crm-text flex items-center gap-3">
                        <span className="text-[10px] text-crm-muted font-mono bg-black/20 w-6 h-6 flex items-center justify-center rounded-full shadow-inner border border-white/10">
                          {i + 1}
                        </span>
                        {report.shop.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-crm-bg border border-white/10 shadow-inner text-crm-primary">
                          {report.pricingTierName}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-crm-text">{report.appointmentCount.toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-crm-muted">{report.userCount}</td>
                      <td className="p-4 text-right font-mono text-[12px] text-crm-muted">{(report.estimatedStorageMB || 0).toFixed(1)} MB</td>
                      <td className="p-4 text-right font-black text-emerald-500">${(report.suggestedMonthlyFeeUSD || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PremiumGlassCard>
      </div>
    </div>
  );
}
