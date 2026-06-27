import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/shops/[shopId]/gamification/active
 * Public endpoint — returns active gamification campaigns for the shop.
 * Only returns campaigns if the shop has gamification premium feature enabled.
 */
export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;

  try {
    // Check if gamification is enabled for this shop
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { premiumFeatures: true },
    });

    if (!shop) {
      return NextResponse.json([], { status: 200 });
    }

    const features = (shop.premiumFeatures as Record<string, boolean>) || {};
    if (!features.gamification) {
      return NextResponse.json([], { status: 200 });
    }

    const now = new Date();

    const campaigns = await prisma.gamificationCampaign.findMany({
      where: {
        shopId,
        status: 'ACTIVE',
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        config: true,
        startDate: true,
        endDate: true,
        totalPlays: true,
        maxPlaysPerUser: true,
        playLimitType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out campaigns past their end date
    const activeCampaigns = campaigns.filter(c => {
      if (!c.endDate) return true;
      return new Date(c.endDate) > now;
    });

    return NextResponse.json(activeCampaigns, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch active campaigns:', err);
    return NextResponse.json([], { status: 200 });
  }
}
