import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { LoyaltyService } from '@/lib/loyalty';

// GET - Fetch loyalty program config + tiers for a shop
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // SECURITY: Verify user belongs to this shop
    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.role !== 'SITE_ADMIN' && user.shopId !== shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: { shopId },
    });

    const tiers = LoyaltyService.getTiers(program);

    // Also get the user's loyalty account if they're a client
    let account = null;
    if (user.role === 'CLIENT') {
      account = await prisma.loyaltyAccount.findUnique({
        where: { userId_shopId: { userId, shopId } },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
    }

    return NextResponse.json({ program, tiers, account });
  } catch (error) {
    logger.error('Error fetching loyalty program:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty program' }, { status: 500 });
  }
}

// POST - Create or update loyalty program config (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || !['SITE_ADMIN', 'SHOP_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role === 'SHOP_ADMIN' && user.shopId !== shopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { pointsPerDollar, pointsPerVisit, redeemThreshold, redeemValue, isActive, tiers, pointExpiryDays } = body;

    const program = await prisma.loyaltyProgram.upsert({
      where: { shopId },
      update: {
        pointsPerDollar: pointsPerDollar ?? undefined,
        pointsPerVisit: pointsPerVisit ?? undefined,
        redeemThreshold: redeemThreshold ?? undefined,
        redeemValue: redeemValue ?? undefined,
        isActive: isActive ?? undefined,
        tiers: tiers !== undefined ? tiers : undefined,
        pointExpiryDays: pointExpiryDays ?? undefined,
      },
      create: {
        shopId,
        pointsPerDollar: pointsPerDollar ?? 1,
        pointsPerVisit: pointsPerVisit ?? 10,
        redeemThreshold: redeemThreshold ?? 100,
        redeemValue: redeemValue ?? 5,
        isActive: isActive ?? true,
        tiers: tiers ?? null,
        pointExpiryDays: pointExpiryDays ?? 0,
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    logger.error('Error updating loyalty program:', error);
    return NextResponse.json({ error: 'Failed to update loyalty program' }, { status: 500 });
  }
}
