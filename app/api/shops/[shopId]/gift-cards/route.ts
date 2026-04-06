import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

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
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shopId } = await params;
  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
  const canManage = user?.role === 'SUPER_ADMIN' ||
    (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cards = await prisma.giftCard.findMany({
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
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { shopId } = await params;
    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canManage = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { amount, recipientEmail, recipientName, purchaserEmail, expiresInDays } = body;

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10000) {
      return NextResponse.json({ error: 'Amount must be between $0.01 and $10,000' }, { status: 400 });
    }

    // Validate expiresInDays if provided
    if (expiresInDays !== undefined && expiresInDays !== null) {
      const days = parseInt(expiresInDays);
      if (isNaN(days) || days < 1 || days > 3650) {
        return NextResponse.json({ error: 'Expiry must be between 1 and 3650 days' }, { status: 400 });
      }
    }

    const code = generateGiftCardCode();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const giftCard = await prisma.giftCard.create({
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
          const recipientUser = await prisma.user.findFirst({
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

