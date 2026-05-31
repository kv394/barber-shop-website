import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cacheService } from '@/lib/cache';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SITE_ADMIN' && (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } }))))) {
 return new Response("Forbidden", { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const staffId = searchParams.get('staffId') || user.id;

 // SHOP_ADMINs can view anyone's portfolio in the shop.
 // STAFF can only view their own in this context (unless we want to let them see others, but editing is own).
 if (user.role === 'STAFF' && staffId !== user.id) {
 return new Response("Forbidden", { status: 403 });
 }

 const cacheKey = `portfolio:${shopId}:${staffId}`;
 const images = await cacheService.getOrSet(
 cacheKey,
 async () => {
 return await tenantClient.portfolioImage.findMany({
 where: { shopId, staffId },
 orderBy: { displayOrder: 'asc' }
 });
 },
 60 * 60 // cache for 1 hour
 );

 return NextResponse.json(images, { status: 200 });
 } catch (error: any) {
 logger.error("Error fetching portfolio:", error);
 return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || (user.role !== 'SITE_ADMIN' && user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF')) {
 return new Response("Forbidden", { status: 403 });
 }

 const body = await request.json();
 const { imageUrl, caption } = body;
 const staffId = body.staffId || user.id;

 // Verify permission to post to this portfolio
 if (user.role === 'STAFF' && staffId !== user.id) {
 return new Response("Forbidden", { status: 403 });
 }

 if (!imageUrl) {
 return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
 }

 const newImage = await tenantClient.portfolioImage.create({
 data: {
 imageUrl: String(imageUrl).trim(),
 caption: caption ? String(caption).trim().slice(0, 500) : null,
 staffId: String(staffId),
 shopId: String(shopId)
 }
 });

 await cacheService.invalidate(`portfolio:${shopId}:${staffId}`);
 await cacheService.invalidatePattern(`shop_portfolio_public:${shopId}*`);

 return NextResponse.json(newImage, { status: 201 });
 } catch (error: any) {
 logger.error("Error creating portfolio image:", error);
 return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
 }
}
