import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string, appointmentId: string }> }
) {
 try {
 const { shopId, appointmentId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 // Only Shop Admin, Staff, or Site Admin can mark an appointment as paid
 const canManage = user?.role === 'SITE_ADMIN' || 
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
 (user?.role === 'STAFF' && user?.shopId === shopId) ||
 (user?.role === 'BOOTH_RENTER' && user?.shopId === shopId);

 if (!canManage) {
 return new Response('Forbidden: Only staff can process payments.', { status: 403 });
 }

 // Verify appointment exists and belongs to the specified shop
 const appointment = await tenantClient.appointment.findUnique({
 where: { id: appointmentId }
 });

 if (!appointment || (appointment.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: appointment.id, shopId } })))) {
 return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
 }

 if (appointment.status === 'COMPLETED') {
 return NextResponse.json({ error: 'This appointment has already been checked out.' }, { status: 400 });
 }

 // Parse optional checkout fields
 let tipAmount = 0, discount = 0, paymentMethod = 'CASH';
 let discountCode: string | null = null;
 let cartItems: any[] = [];
 let payments: any[] = [];

 try {
 const body = await request.json();
 tipAmount = Math.max(0, parseFloat(body.tipAmount) || 0);
 discount = Math.max(0, parseFloat(body.discount) || 0);
 discountCode = body.discountCode ? String(body.discountCode).trim() : null;
 paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.slice(0, 50) : 'CASH';
 cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
 payments = Array.isArray(body.payments) ? body.payments : [];
 } catch {}

 // SECURITY: Validate cart items — prevent negative prices, quantities, or tax rates
 for (const item of cartItems) {
 if (typeof item.price !== 'number' || item.price < 0) {
 return NextResponse.json({ error: 'Invalid item price' }, { status: 400 });
 }
 if (typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
 return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
 }
 if (item.taxRate !== undefined && (typeof item.taxRate !== 'number' || item.taxRate < 0 || item.taxRate > 1)) {
 return NextResponse.json({ error: 'Invalid tax rate' }, { status: 400 });
 }
 }

 // SECURITY: Validate payment amounts
 for (const p of payments) {
 if (typeof p.amount !== 'number' || p.amount < 0) {
 return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
 }
 }

 // Calculate totals
 const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
 // Rough tax placeholder logic: sum of (price * quantity * taxRate)
 const taxAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity * (item.taxRate || 0)), 0);
 const totalAmount = subtotal + taxAmount - discount + tipAmount;

 // Build the transaction — SECURITY: all checks INSIDE the transaction to prevent
 // double-checkout race conditions and inventory underflow
 await tenantClient.$transaction(async (tx: any) => {
 // Re-check status inside the transaction to prevent double-checkout
 const freshAppointment = await tx.appointment.findUnique({
 where: { id: appointmentId },
 select: { status: true, shopId: true },
 });

 if (!freshAppointment || (freshAppointment.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: freshAppointment.id, shopId } })))) {
 throw new Error('NOT_FOUND');
 }
 if (freshAppointment.status === 'COMPLETED') {
 throw new Error('ALREADY_COMPLETED');
 }

 // 0. Process Discount/Gift Card Redemption
 if (discountCode && discount > 0) {
 const giftCard = await tx.giftCard.findUnique({
 where: { code: discountCode }
 });

 if (!giftCard || (giftCard.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: giftCard.id, shopId } })))) {
 throw new Error('INVALID_DISCOUNT');
 }
 if (giftCard.status !== 'ACTIVE' || (giftCard.expiresAt && giftCard.expiresAt < new Date()) || giftCard.currentBalance < discount) {
 throw new Error('DISCOUNT_NOT_APPLICABLE');
 }

 const newBalance = giftCard.currentBalance - discount;
 await tx.giftCard.update({
 where: { id: giftCard.id },
 data: {
 currentBalance: newBalance,
 status: newBalance <= 0 ? 'REDEEMED' : 'ACTIVE'
 }
 });
 }

 // 1. Mark appointment as completed
 await tx.appointment.update({
 where: { id: appointmentId },
 data: { 
 status: 'COMPLETED',
 tipAmount,
 discount,
 paymentMethod, // legacy field
 subtotal,
 taxAmount,
 totalAmount,
 paymentId: `sim_${paymentMethod.toLowerCase()}_${Date.now()}` 
 }
 });

 // 2. Create Appointment Items
 if (cartItems.length > 0) {
 await tx.appointmentItem.createMany({
 data: cartItems.map(item => ({
 appointmentId: appointmentId,
 productId: item.productId,
 serviceId: item.serviceId,
 name: String(item.name || 'Item').slice(0, 200),
 quantity: item.quantity,
 price: item.price,
 }))
 });

 // 3. Deduct Inventory for Products
 for (const item of cartItems) {
 // Direct product purchases
 if (item.productId && item.trackInventory) {
 const product = await tx.product.findUnique({
 where: { id: item.productId },
 select: { inventoryCount: true, shopId: true },
 });
 if (!product || (product.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: product.id, shopId } })))) {
 throw new Error('INVALID_PRODUCT');
 }
 if (product.inventoryCount < item.quantity) {
 throw new Error('INSUFFICIENT_INVENTORY');
 }
 await tx.product.update({
 where: { id: item.productId },
 data: { inventoryCount: { decrement: item.quantity } }
 });
 }

 // Service-to-Product automatic inventory deduction
 if (item.serviceId) {
 const usages = await tx.serviceProductUsage.findMany({
 where: { serviceId: item.serviceId }
 });
 for (const usage of usages) {
 const newCount = usage.currentServiceCount + (item.quantity || 1);
 const deductions = Math.floor(newCount / usage.servicesPerProduct);
 const remainder = newCount % usage.servicesPerProduct;

 await tx.serviceProductUsage.update({
 where: { id: usage.id },
 data: { currentServiceCount: remainder }
 });

 if (deductions > 0) {
 await tx.product.update({
 where: { id: usage.productId },
 data: { inventoryCount: { decrement: deductions } }
 });
 }
 }
 }
 }
 }

 // 4. Record separate Payment splits if provided
 if (payments.length > 0) {
 await tx.payment.createMany({
 data: payments.map(p => {
 const validMethods: PaymentMethod[] = ['CASH', 'CARD', 'MOBILE', 'GIFT_CARD', 'OTHER'];
 const raw = String(p.method || 'CASH').toUpperCase();
 const method: PaymentMethod = validMethods.includes(raw as PaymentMethod) ? (raw as PaymentMethod) : 'CASH';
 return {
 appointmentId: appointmentId,
 method,
 amount: p.amount,
 status: 'COMPLETED' as const,
 transactionId: p.stripeId ? String(p.stripeId).slice(0, 200) : null,
 };
 })
 });
 }
 });

 revalidatePath(`/shop/${shopId}/bookings`);

 // ── Engagement & Retention: Post-checkout hooks ──
 // Award loyalty points (fire-and-forget, don't block checkout)
 try {
 const { LoyaltyService } = await import('@/lib/loyalty');
 await LoyaltyService.awardPointsForCheckout(
 appointment.userId, shopId, totalAmount, appointmentId
 );

 // Complete any pending referral for this client
 const pendingReferral = await tenantClient.referral.findFirst({
 where: { shopId, refereeId: appointment.userId, status: 'PENDING' },
 });
 if (pendingReferral) {
 await tenantClient.referral.update({
 where: { id: pendingReferral.id },
 data: { status: 'COMPLETED' },
 });
 // Award referral bonus to both parties
 await LoyaltyService.awardReferralBonus(
 pendingReferral.referrerId, shopId, pendingReferral.referrerRewardPoints
 );
 await LoyaltyService.awardReferralBonus(
 pendingReferral.refereeId, shopId, pendingReferral.refereeRewardPoints
 );
 await tenantClient.referral.update({
 where: { id: pendingReferral.id },
 data: { status: 'REWARDED' },
 });
 }

 // Send review request notification
 const { NotificationService } = await import('@/lib/notifications');
 const shop = await tenantClient.shop.findUnique({ where: { id: shopId }, select: { name: true } });
 if (shop) {
 await NotificationService.sendReviewRequest(shopId, appointment.userId, shop.name, appointmentId);
 }
 } catch (engagementError) {
 // Don't fail checkout if engagement hooks fail
 logger.error('Engagement post-checkout hooks failed (non-critical):', engagementError);
 }

 return NextResponse.json({ success: true }, { status: 200 });
 } catch (error: any) {
 if (error?.message === 'ALREADY_COMPLETED') {
 return NextResponse.json({ error: 'This appointment has already been checked out.' }, { status: 400 });
 }
 if (error?.message === 'INVALID_DISCOUNT') {
 return NextResponse.json({ error: 'Invalid discount or gift card code.' }, { status: 400 });
 }
 if (error?.message === 'DISCOUNT_NOT_APPLICABLE') {
 return NextResponse.json({ error: 'Discount code is inactive, expired, or has insufficient balance.' }, { status: 400 });
 }
 if (error?.message === 'INSUFFICIENT_INVENTORY') {
 return NextResponse.json({ error: 'Insufficient inventory for one or more products.' }, { status: 400 });
 }
 if (error?.message === 'INVALID_PRODUCT') {
 return NextResponse.json({ error: 'Invalid product in cart.' }, { status: 400 });
 }
 logger.error("Error checking out appointment:", error);
 return NextResponse.json({ error: 'Failed to checkout' }, { status: 500 });
 }
}
