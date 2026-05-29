import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 // High Level KPIs
 const [totalShops, totalUsers, totalAppointments] = await Promise.all([
 prisma.shop.count(),
 prisma.user.count(),
 prisma.appointment.count({
 where: { status: { not: 'CANCELLED' } }
 })
 ]);

 // Fetch the most recent usage report per shop
 // We'll fetch all reports ordered by period DESC, and deduplicate in code
 // (A simpler approach for Prisma without DISTINCT ON)
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

 // Aggregate stats from latest reports
 const totalStorageMB = latestReports.reduce((acc, r) => acc + (r.estimatedStorageMB || 0), 0);
 const totalSuggestedRevenue = latestReports.reduce((acc, r) => acc + (r.suggestedMonthlyFeeUSD || 0), 0);
 
 // Top 10 Shops by Appointment Volume
 const topShops = [...latestReports].sort((a, b) => b.appointmentCount - a.appointmentCount).slice(0, 10);

 return NextResponse.json({
 kpis: {
 totalShops,
 totalUsers,
 totalAppointments,
 totalStorageMB,
 totalSuggestedRevenue
 },
 topShops: topShops.map(r => ({
 id: r.shopId,
 name: r.shop.name,
 tier: r.pricingTierName,
 users: r.userCount,
 appointments: r.appointmentCount,
 storageMB: r.estimatedStorageMB,
 suggestedFee: r.suggestedMonthlyFeeUSD,
 period: r.period
 }))
 });

 } catch (error) {
 console.error('Error fetching performance metrics:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
