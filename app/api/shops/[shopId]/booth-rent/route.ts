import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const payments = await prisma.boothRentPayment.findMany({
      where: { shopId },
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
    const { shopId } = await params;
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
