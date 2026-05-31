import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { giftCardSchema } from '@/lib/validations';
function generateGiftCardCode(): string {
 return crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{4}/g)!.join('-');
}

/**
 * GET /api/shops/[shopId]/gift-cards
 * List gift cards for a shop (admin only).
 */
export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const { shopId: paramShopId } = await params; const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 const shopId = resolvedShop.id;

 const tenantClient = await getTenantClient(shopId);

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canManage = user?.role === 'SITE_ADMIN' ||
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
 if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

 const cards = await tenantClient.giftCard.findMany({
 where: { shopId },
 orderBy: { createdAt: 'desc' },
 take: 200,
 });

 return NextResponse.json(cards);
}

/**
 * POST /api/shops/[shopId]/gift-cards
 * Create a new gift card (admin).
 */
export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 try {
 const { shopId: paramShopId } = await params; const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 const shopId = resolvedShop.id;

 const tenantClient = await getTenantClient(shopId);

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canManage = user?.role === 'SITE_ADMIN' ||
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
 if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const validationResult = giftCardSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.format() }, { status: 400 });
  }

  const { amount: parsedAmount, recipientEmail, recipientName, purchaserEmail, expiresInDays } = validationResult.data;

 const code = generateGiftCardCode();
  const expiresAt = expiresInDays
  ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  : null;

 const giftCard = await tenantClient.giftCard.create({
 data: {
 shopId,
 code,
 initialBalance: parsedAmount,
 currentBalance: parsedAmount,
 recipientEmail: recipientEmail ? String(recipientEmail).trim().toLowerCase().slice(0, 200) : null,
 recipientName: recipientName ? String(recipientName).trim().slice(0, 200) : null,
 purchaserEmail: purchaserEmail ? String(purchaserEmail).trim().toLowerCase().slice(0, 200) : null,
 expiresAt,
 },
 });

 // Send gift card email if recipient email provided
 if (recipientEmail) {
 try {
 const { NotificationService } = await import('@/lib/notifications');
 const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });
 if (shop) {
 const { giftCardEmail } = await import('@/lib/email-templates');
 const html = giftCardEmail({
 shopName: shop.name,
 senderName: purchaserEmail || 'Someone special',
 recipientName: recipientName || 'Friend',
 amount: giftCard.initialBalance,
 code: giftCard.code,
 });
 // Use notification system to deliver
 const recipientUser = await tenantClient.user.findFirst({
 where: { email: recipientEmail.trim().toLowerCase() },
 });
 if (recipientUser) {
 await NotificationService.send({
 shopId,
 userId: recipientUser.id,
 type: 'GIFT_CARD',
 title: `You received a gift card from ${shop.name}!`,
 message: html,
 });
 }
 }
 } catch (emailErr) {
 logger.error('Failed to send gift card email (non-critical):', emailErr);
 }
 }

 return NextResponse.json(giftCard, { status: 201 });
 } catch (error: any) {
 logger.error('Error creating gift card:', error);
 return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 });
 }
}

