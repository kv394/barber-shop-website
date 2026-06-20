import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';
import { prisma, getTenantClient } from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;
 const { searchParams } = new URL(request.url);
 const forceRefresh = searchParams.get('force') === 'true';

 // 0. Check database cache first (24-hour expiration)
 const shop = await tenantClient.shop.findUnique({
 where: { id: shopId },
 select: { inventoryForecast: true, inventoryForecastUpdatedAt: true }
 });

 if (!forceRefresh && shop?.inventoryForecast && shop.inventoryForecastUpdatedAt) {
 const cacheAgeMs = Date.now() - shop.inventoryForecastUpdatedAt.getTime();
 const twentyFourHoursMs = 24 * 60 * 60 * 1000;
 
 if (cacheAgeMs < twentyFourHoursMs) {
 // Return cached payload directly
 return NextResponse.json(shop.inventoryForecast);
 }
 }

 // 1. Fetch all tracked products
 const products = await tenantClient.product.findMany({
 where: { shopId, trackInventory: true },
 select: {
 id: true,
 name: true,
 inventoryCount: true,
 reorderPoint: true,
 type: true,
 cost: true,
 productUsages: {
 select: {
 serviceId: true,
 servicesPerProduct: true,
 currentServiceCount: true,
 service: { select: { name: true } },
 },
 },
 },
 });

 if (products.length === 0) {
 return NextResponse.json({
 insights: [],
 generatedAt: new Date().toISOString(),
 message: 'No tracked products found. Enable inventory tracking on products to get forecasts.',
 });
 }

 // 2. Get appointment counts for the last 30 and 60 days
 const now = new Date();
 const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
 const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

 const [last30DaysCount, prior30DaysCount] = await Promise.all([
 tenantClient.appointment.count({
 where: {
 shopId,
 status: 'COMPLETED',
 startTime: { gte: thirtyDaysAgo },
 },
 }),
 tenantClient.appointment.count({
 where: {
 shopId,
 status: 'COMPLETED',
 startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
 },
 }),
 ]);

 // Also get per-service appointment counts for the last 30 days
 const serviceAppointments = await tenantClient.appointment.groupBy({
 by: ['serviceId'],
 where: {
 shopId,
 status: 'COMPLETED',
 startTime: { gte: thirtyDaysAgo },
 serviceId: { not: null },
 },
 _count: { id: true },
 });

 const serviceCountMap = new Map<string, number>();
 for (const sa of serviceAppointments) {
 if (sa.serviceId) {
 serviceCountMap.set(sa.serviceId, sa._count.id);
 }
 }

 // 3. Compute raw metrics per product
 const productMetrics = products.map((product: any) => {
 let totalDailyUsage = 0;

 for (const usage of product.productUsages) {
 const serviceApptCount = serviceCountMap.get(usage.serviceId) || 0;
 // Each service appointment uses (1 / servicesPerProduct) units of this product
 const usagePerDay = (serviceApptCount / 30) / Math.max(1, usage.servicesPerProduct);
 totalDailyUsage += usagePerDay;
 }

 const estimatedDaysRemaining = totalDailyUsage > 0
 ? Math.round(product.inventoryCount / totalDailyUsage)
 : product.inventoryCount > 0 ? 999 : 0;

 // Usage trend: compare implied usage from last 30 vs prior 30
 let usageTrend: 'up' | 'down' | 'stable' | 'no_data' = 'no_data';
 if (last30DaysCount > 0 && prior30DaysCount > 0) {
 const ratio = last30DaysCount / prior30DaysCount;
 if (ratio > 1.15) usageTrend = 'up';
 else if (ratio < 0.85) usageTrend = 'down';
 else usageTrend = 'stable';
 }

 return {
 name: product.name,
 type: product.type,
 currentStock: product.inventoryCount,
 reorderPoint: product.reorderPoint,
 costPerUnit: product.cost,
 avgDailyUsage: Math.round(totalDailyUsage * 100) / 100,
 estimatedDaysRemaining,
 usageTrend,
 linkedServices: product.productUsages.map((u: any) => u.service?.name).filter(Boolean),
 };
 });

 // 4. Send to Gemini for narrative insights, with a programmatic fallback
 let insights = [];
 try {
 const prompt = `You are an inventory analyst for a barbershop/salon. Analyze the following product inventory data and generate actionable insights.

## INVENTORY DATA
${JSON.stringify(productMetrics, null, 2)}

## APPOINTMENT CONTEXT
- Completed appointments in last 30 days: ${last30DaysCount}
- Completed appointments in prior 30 days (31-60 days ago): ${prior30DaysCount}
- Overall appointment trend: ${last30DaysCount > prior30DaysCount ? 'increasing' : last30DaysCount < prior30DaysCount ? 'decreasing' : 'stable'}

## INSTRUCTIONS
Generate up to 5 inventory insights, sorted by urgency (most urgent first). For each insight:
1. Focus on products that need attention (running low, usage spike, overstock, etc.)
2. Skip products with no usage data or plenty of stock (estimatedDaysRemaining > 90)
3. Give specific, actionable recommendations

Return a JSON object:
{
 "insights": [
 {
 "productName": "Product name",
 "urgency": "critical" | "warning" | "info",
 "prediction": "Short prediction sentence (e.g., 'Will run out in ~12 days')",
 "recommendation": "Actionable recommendation (e.g., 'Order 24 units now to maintain 30-day buffer')",
 "estimatedDaysRemaining": number,
 "icon": "emoji icon for the insight type"
 }
 ]
}

Rules:
- "critical": product will run out within 7 days or is already at 0
- "warning": product will run out within 8-30 days or is near reorder point
- "info": usage trend changed significantly, or product is well-stocked
- If all products are well-stocked, return 1-2 "info" insights summarizing the healthy state
- Keep predictions and recommendations under 100 characters each
- Maximum 5 insights`;

 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: [
 {
 role: 'user',
 parts: [{ text: prompt }],
 },
 ],
 config: {
 responseMimeType: 'application/json',
 },
 });

 const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
 if (!resultText) {
 throw new Error('No response from AI');
 }

 const parsed = JSON.parse(resultText);
 insights = parsed.insights || [];
 } catch (aiError: any) {
 logger.warn('AI Forecast failed, falling back to programmatic algorithm:', aiError.message);
 
 // Basic algorithmic fallback
 const fallbackInsights = [];
 for (const pm of productMetrics) {
 if (pm.currentStock === 0) {
 fallbackInsights.push({
 productName: pm.name,
 urgency: 'critical',
 prediction: 'Out of stock',
 recommendation: 'Order more immediately',
 estimatedDaysRemaining: 0,
 icon: '🚨'
 });
 } else if (pm.estimatedDaysRemaining <= 7 && pm.avgDailyUsage > 0) {
 fallbackInsights.push({
 productName: pm.name,
 urgency: 'critical',
 prediction: `Will run out in ~${pm.estimatedDaysRemaining} days`,
 recommendation: 'Order more immediately to avoid stockout',
 estimatedDaysRemaining: pm.estimatedDaysRemaining,
 icon: '🚨'
 });
 } else if (pm.estimatedDaysRemaining <= 30 && pm.avgDailyUsage > 0) {
 fallbackInsights.push({
 productName: pm.name,
 urgency: 'warning',
 prediction: `Will run out in ~${pm.estimatedDaysRemaining} days`,
 recommendation: 'Consider reordering soon',
 estimatedDaysRemaining: pm.estimatedDaysRemaining,
 icon: '⚠️'
 });
 } else if (pm.reorderPoint !== null && pm.currentStock <= pm.reorderPoint) {
 fallbackInsights.push({
 productName: pm.name,
 urgency: 'warning',
 prediction: 'Stock is at or below reorder point',
 recommendation: 'Time to reorder',
 estimatedDaysRemaining: pm.estimatedDaysRemaining,
 icon: '⚠️'
 });
 }
 }
 
 if (fallbackInsights.length === 0 && productMetrics.length > 0) {
 fallbackInsights.push({
 productName: 'All Products',
 urgency: 'info',
 prediction: 'Inventory levels are healthy',
 recommendation: 'No immediate action required',
 estimatedDaysRemaining: 999,
 icon: '✅'
 });
 }

 // Sort by urgency
 const sortOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
 fallbackInsights.sort((a, b) => sortOrder[a.urgency] - sortOrder[b.urgency]);
 
 insights = fallbackInsights.slice(0, 5);
 }

 const payload = {
 insights: insights,
 generatedAt: new Date().toISOString(),
 productCount: products.length,
 appointmentCount30d: last30DaysCount,
 };

 // 5. Save the generated forecast to the database cache
 await tenantClient.shop.update({
 where: { id: shopId },
 data: {
 inventoryForecast: payload,
 inventoryForecastUpdatedAt: new Date(),
 }
 });

 return NextResponse.json(payload);
 } catch (err: any) {
 logger.error('Inventory Forecast Error:', err);
 return NextResponse.json(
 { error: 'Internal Server Error' },
 { status: 500 }
 );
 }
}
