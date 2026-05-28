import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET - Client engagement analytics for a shop
export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const now = new Date();
 const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
 const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
 const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

 const [
 totalClients,
 activeLastMonth,
 newLastMonth,
 completedAppointments,
 loyaltyProgram,
 totalLoyaltyAccounts,
 totalReferrals,
 completedReferrals,
 totalCampaignsSent,
 averageRating,
 ] = await Promise.all([
 // Total unique clients who have visited
 prisma.user.count({
 where: {
 role: 'CLIENT',
 clientAppointments: { some: { shopId, status: 'COMPLETED' } },
 },
 }),
 // Active in last 30 days
 prisma.user.count({
 where: {
 role: 'CLIENT',
 clientAppointments: {
 some: { shopId, status: 'COMPLETED', startTime: { gte: thirtyDaysAgo } },
 },
 },
 }),
 // New clients (first visit in last 30 days)
 prisma.user.count({
 where: {
 role: 'CLIENT',
 createdAt: { gte: thirtyDaysAgo },
 clientAppointments: { some: { shopId } },
 },
 }),
 // Completed appointments this month
 prisma.appointment.count({
 where: { shopId, status: 'COMPLETED', startTime: { gte: thirtyDaysAgo } },
 }),
 prisma.loyaltyProgram.findUnique({ where: { shopId } }),
 prisma.loyaltyAccount.count({ where: { shopId } }),
 prisma.referral.count({ where: { shopId } }),
 prisma.referral.count({ where: { shopId, status: { in: ['COMPLETED', 'REWARDED'] } } }),
 prisma.campaign.count({ where: { shopId, status: { in: ['SENT', 'COMPLETED', 'ACTIVE'] } } }),
 prisma.review.aggregate({ where: { shopId }, _avg: { rating: true } }),
 ]);

 // Retention: clients who visited both 60-30 days ago AND in last 30 days
 const retainedClients = await prisma.user.count({
 where: {
 role: 'CLIENT',
 clientAppointments: {
 some: { shopId, status: 'COMPLETED', startTime: { gte: thirtyDaysAgo } },
 },
 AND: {
 clientAppointments: {
 some: { shopId, status: 'COMPLETED', startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
 },
 },
 },
 });

 // At-risk clients (visited 60-90 days ago but not in last 60 days)
 const visitedBefore = await prisma.user.count({
 where: {
 role: 'CLIENT',
 clientAppointments: {
 some: { shopId, status: 'COMPLETED', startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
 },
 },
 });

 const retentionRate = visitedBefore > 0 ? Math.round((retainedClients / visitedBefore) * 100) : 0;

 // Top clients by spend (last 90 days)
 const topClients = await prisma.user.findMany({
 where: {
 role: 'CLIENT',
 clientAppointments: { some: { shopId, status: 'COMPLETED', startTime: { gte: ninetyDaysAgo } } },
 },
 select: {
 id: true,
 name: true,
 email: true,
 clientAppointments: {
 where: { shopId, status: 'COMPLETED', startTime: { gte: ninetyDaysAgo } },
 select: { totalAmount: true },
 },
 loyaltyAccounts: {
 where: { shopId },
 select: { pointsBalance: true },
 },
 },
 take: 10,
 });

 const topClientsSorted = topClients
 .map((c: any) => ({
 id: c.id,
 name: c.name,
 email: c.email,
 totalSpend: c.clientAppointments.reduce((s: number, a: any) => s + a.totalAmount, 0),
 visitCount: c.clientAppointments.length,
 loyaltyPoints: c.loyaltyAccounts[0]?.pointsBalance || 0,
 }))
 .sort((a: any, b: any) => b.totalSpend - a.totalSpend)
 .slice(0, 10);

 return NextResponse.json({
 overview: {
 totalClients,
 activeLastMonth,
 newLastMonth,
 completedAppointments,
 retentionRate,
 averageRating: averageRating._avg.rating?.toFixed(1) || 'N/A',
 },
 loyalty: {
 isActive: loyaltyProgram?.isActive || false,
 totalAccounts: totalLoyaltyAccounts,
 },
 referrals: {
 total: totalReferrals,
 completed: completedReferrals,
 },
 campaigns: {
 totalSent: totalCampaignsSent,
 },
 topClients: topClientsSorted,
 });
 } catch (error) {
 logger.error('Error fetching engagement analytics:', error);
 return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
 }
}

