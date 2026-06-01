import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const isSiteAdmin = user?.role === 'SITE_ADMIN';
 const isShopAdmin = user?.role === 'SHOP_ADMIN' && (user.shopId === shopId || !!(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId, role: 'SHOP_ADMIN' } })));

 if (!user || (!isSiteAdmin && !isShopAdmin)) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 const updateData: Record<string, any> = {};

 if (body.timezone && typeof body.timezone === 'string') {
 updateData.timezone = body.timezone;
 }
 if (body.name && typeof body.name === 'string') {
 updateData.name = body.name.trim();
 }
 if (body.description !== undefined) {
 updateData.description = body.description ? String(body.description).trim() : null;
 }
 if (body.slogan !== undefined) {
 updateData.slogan = body.slogan ? String(body.slogan).trim() : null;
 }
 if (body.shopType && typeof body.shopType === 'string' && ['PHYSICAL', 'MOBILE', 'HYBRID'].includes(body.shopType)) {
 updateData.shopType = body.shopType;
 }
 if (body.travelFee !== undefined) {
 updateData.travelFee = Math.max(0, parseFloat(body.travelFee) || 0);
 }
 if (body.maxTravelRadius !== undefined) {
 updateData.maxTravelRadius = body.maxTravelRadius ? parseInt(body.maxTravelRadius) || null : null;
 }
 if (body.baseLocation !== undefined) {
 updateData.baseLocation = body.baseLocation ? String(body.baseLocation).trim() : null;
 }
 // No-show deposit settings (C5)
 if (body.depositRequired !== undefined) {
 updateData.depositRequired = Boolean(body.depositRequired);
 }
 if (body.depositAmount !== undefined) {
 updateData.depositAmount = Math.max(0, parseFloat(body.depositAmount) || 0);
 }
 if (body.country && typeof body.country === 'string' && ['US', 'IN'].includes(body.country)) {
 updateData.country = body.country;
 }
 if (body.currency && typeof body.currency === 'string') {
 updateData.currency = body.currency.trim();
 }
 if (body.locale && typeof body.locale === 'string') {
 updateData.locale = body.locale.trim();
 }
 if (body.paymentGateway && typeof body.paymentGateway === 'string' && ['STRIPE', 'RAZORPAY', 'NONE'].includes(body.paymentGateway)) {
 updateData.paymentGateway = body.paymentGateway;
 }
 if (body.stripeAccountId !== undefined) {
 updateData.stripeAccountId = body.stripeAccountId ? String(body.stripeAccountId).trim() : null;
 }
 if (body.razorpayKeyId !== undefined) {
 updateData.razorpayKeyId = body.razorpayKeyId ? String(body.razorpayKeyId).trim() : null;
 }
 if (body.razorpayKeySecret !== undefined) {
 updateData.razorpayKeySecret = body.razorpayKeySecret ? String(body.razorpayKeySecret).trim() : null;
 }
 // Buffer time (I2) - shop-level setting handled at service level

 if (Object.keys(updateData).length === 0) {
 return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
 }

 const updated = await tenantClient.shop.update({
 where: { id: shopId },
 data: updateData,
 });

 return NextResponse.json(updated);
 } catch (error: any) {
 logger.error("Error updating shop:", error);
 return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
 }
}

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 // Verify user is SHOP_ADMIN with access
 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user) {
 return new Response("Unauthorized", { status: 401 });
 }

 let hasAccess = false;
 if (user.role === 'SITE_ADMIN') {
 hasAccess = true;
 }

 if (!hasAccess) {
 return new Response("Forbidden: Only Site Admins can delete entire shops. Shop Admins can only delete branches/locations.", { status: 403 });
 }

 // SECURITY: Wrap user cleanup and shop deletion in a transaction
 await tenantClient.$transaction(async (tx: any) => {
 // Handle Users: permanently delete the auto-generated Kiosk user
 await tx.user.deleteMany({
 where: { shopId: shopId, role: 'ATTENDANCE_KIOSK' }
 });

 // Downgrade remaining users to CLIENT (do this BEFORE shop deletion, 
 // otherwise the foreign key SetNull cascade will lose their shopId reference)
 await tx.user.updateMany({
 where: { shopId: shopId },
 data: { role: 'CLIENT', canManageInventory: false }
 });

 // Finally, delete the shop itself.
 // Note: All 20+ child tables (Appointments, Services, Reviews, etc.) have 
 // `onDelete: Cascade` defined in schema.prisma, so PostgreSQL will instantly 
 // wipe them automatically without needing manual Prisma round-trips.
 await tx.shop.delete({ where: { id: shopId } });
 }, { maxWait: 15000, timeout: 30000 });

 // Revalidate directory
 revalidatePath('/shops');
 
 const cacheIdentifier = authUserEmail || userId;
 if (cacheIdentifier) {
 const { cacheService } = await import('@/lib/cache');
 await cacheService.invalidatePattern(`shop_layout:${cacheIdentifier}:*`);
 }

 return NextResponse.json({ success: true }, { status: 200 });
 } catch (error: any) {
 logger.error("Error deleting shop:", error);
 return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
 }
}
