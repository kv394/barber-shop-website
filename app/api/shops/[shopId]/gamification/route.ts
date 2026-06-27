import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

/**
 * GET /api/shops/[shopId]/gamification
 * List all gamification campaigns for this shop (admin only).
 */
export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  const campaigns = await prisma.gamificationCampaign.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { plays: true } },
    },
  });

  return NextResponse.json(campaigns);
}

/**
 * POST /api/shops/[shopId]/gamification
 * Create a new gamification campaign.
 */
export async function POST(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const data = await request.json();
    const { name, type, config, startDate, endDate, maxPlaysPerUser, playLimitType } = data;

    if (!name || !type || !config) {
      return NextResponse.json({ error: 'name, type, and config are required' }, { status: 400 });
    }

    if (!['SPIN_WHEEL', 'SCRATCH_CARD', 'PRIZE_DRAW'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const campaign = await prisma.gamificationCampaign.create({
      data: {
        shopId,
        name,
        type,
        config,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        maxPlaysPerUser: maxPlaysPerUser || 1,
        playLimitType: playLimitType || 'TOTAL',
      },
    });

    return NextResponse.json(campaign);
  } catch (err: any) {
    console.error('Failed to create gamification campaign:', err);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
