import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { calculateUsageCostStrategy, getSaaSTiers } from '@/lib/cost-calculator';

export const dynamic = 'force-dynamic';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SITE_ADMIN' && user.role !== 'SHOP_ADMIN')) {
 return new Response("Forbidden", { status: 403 });
 }

 // If SHOP_ADMIN, ensure they belong to this shop
 if (user.role === 'SHOP_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response("Forbidden", { status: 403 });
 }

 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { name: true, aiTokens: true }
 });

 if (!shop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 }

 // Check for the latest hourly usage report
 const latestReport = await prisma.shopUsageReport.findFirst({
 where: { shopId },
 orderBy: { period: 'desc' }
 });

 let metrics;
 let analysis;

 if (latestReport) {
 metrics = {
 userCount: latestReport.userCount,
 appointmentCount: latestReport.appointmentCount,
 productCount: latestReport.productCount,
 serviceCount: latestReport.serviceCount,
 formSubmissionCount: latestReport.formSubmissionCount,
 portfolioImageCount: latestReport.portfolioImageCount,
 clientHistoryImageCount: latestReport.clientHistoryImageCount,
 clientFormulaCount: latestReport.clientFormulaCount,
 reviewCount: latestReport.reviewCount,
 aiTokenCount: shop.aiTokens || 0
 };
 analysis = {
 estimatedStorageMB: latestReport.estimatedStorageMB,
 suggestedMonthlyFeeUSD: latestReport.suggestedMonthlyFeeUSD,
 pricingTierName: latestReport.pricingTierName,
 strategyReasoning: `[Data aggregated hourly] Based on a usage volume of ${metrics.appointmentCount} appointments and ${metrics.userCount} users, the '${latestReport.pricingTierName}' tier is recommended. Storage is efficiently utilized at ${latestReport.estimatedStorageMB} MB, keeping infrastructure overhead balanced and minimizing extra costs.`
 };
 } else {
 // 1. Gather all resource usage metrics dynamically if no report exists yet
 const [
 userCount,
 appointmentCount,
 productCount,
 serviceCount,
 formSubmissionCount,
 portfolioImageCount,
 clientHistoryImageCount,
 clientFormulaCount,
 reviewCount
 ] = await Promise.all([
 prisma.user.count({ where: { shopId } }),
 prisma.appointment.count({ where: { shopId } }),
 prisma.product.count({ where: { shopId } }),
 prisma.service.count({ where: { shopId } }),
 prisma.formSubmission.count({ where: { appointment: { shopId } } }),
 prisma.portfolioImage.count({ where: { shopId } }),
 prisma.clientHistoryImage.count({ where: { shopId } }),
 prisma.clientFormula.count({ where: { shopId } }),
 prisma.review.count({ where: { shopId } })
 ]);

 metrics = {
 userCount,
 appointmentCount,
 productCount,
 serviceCount,
 formSubmissionCount,
 portfolioImageCount,
 clientHistoryImageCount,
 clientFormulaCount,
 reviewCount,
 aiTokenCount: shop.aiTokens || 0
 };

 const tiers = await getSaaSTiers();
 // 2. Use Deterministic Strategy
 analysis = calculateUsageCostStrategy(metrics, tiers);
 }

 return NextResponse.json({
 metrics,
 analysis
 });

 } catch (error: any) {
 logger.error('Usage analysis error:', error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
