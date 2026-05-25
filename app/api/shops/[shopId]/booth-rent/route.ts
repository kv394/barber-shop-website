import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

import { resolveShopId } from '@/lib/shop-resolution';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId: paramShopId } = await params;
    const shopId = await resolveShopId(paramShopId);
    if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'BOOTH_RENTER']);
    if (isAuthError(authResult)) return authResult;

    // If booth renter, only return their own payments
    const isBoothRenter = authResult.user.role === 'BOOTH_RENTER';
    const whereClause = isBoothRenter
      ? { shopId, userId: authResult.user.id }
      : { shopId };

    const payments = await prisma.boothRentPayment.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { periodStart: 'desc' }
    });

    return NextResponse.json(JSON.parse(JSON.stringify(payments)));
  } catch (error) {
    logger.error('Error fetching booth rent payments:', error);
    return NextResponse.json({ error: 'Failed to fetch booth rent payments' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId: paramShopId } = await params;
    const shopId = await resolveShopId(paramShopId);
    if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { userId, amount, periodStart, periodEnd } = body;

    if (!userId || !amount || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await prisma.boothRentPayment.create({
      data: {
        shopId,
        userId,
        amount,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: 'PENDING'
      }
    });

    return NextResponse.json(JSON.parse(JSON.stringify(payment)));
  } catch (error) {
    logger.error('Error creating booth rent payment:', error);
    return NextResponse.json({ error: 'Failed to create booth rent payment' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId: paramShopId } = await params;
    const shopId = await resolveShopId(paramShopId);
    if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { paymentId, status, paymentMethod } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const updated = await prisma.boothRentPayment.update({
      where: { id: paymentId },
      data: {
        status: status || 'COMPLETED',
        paidAt: status === 'COMPLETED' ? new Date() : null,
        paymentMethod: paymentMethod || null,
      }
    });

    return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (error) {
    logger.error('Error updating booth rent payment:', error);
    return NextResponse.json({ error: 'Failed to update booth rent payment' }, { status: 500 });
  }
}
