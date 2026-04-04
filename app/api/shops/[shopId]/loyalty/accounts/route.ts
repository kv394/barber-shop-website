import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET - List all loyalty accounts (leaderboard) for a shop
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN', 'STAFF']);
    if (isAuthError(authResult)) return authResult;

    const accounts = await prisma.loyaltyAccount.findMany({
      where: { shopId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { pointsBalance: 'desc' },
      take: 100,
    });

    return NextResponse.json(accounts);
  } catch (error) {
    logger.error('Error fetching loyalty accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
