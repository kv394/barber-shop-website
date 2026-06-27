import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

/**
 * GET /api/shops/[shopId]/gamification/[campaignId]/plays
 * Admin endpoint — view play history and analytics for a campaign.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string; campaignId: string }> }
) {
  const { shopId, campaignId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const campaign = await prisma.gamificationCampaign.findFirst({
      where: { id: campaignId, shopId },
      select: { totalPlays: true, totalWins: true, name: true, type: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const plays = await prisma.gamificationPlay.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Aggregate results
    const resultCounts: Record<string, number> = {};
    for (const play of plays) {
      resultCounts[play.result] = (resultCounts[play.result] || 0) + 1;
    }

    return NextResponse.json({
      campaign,
      plays,
      analytics: {
        totalPlays: campaign.totalPlays,
        totalWins: campaign.totalWins,
        winRate: campaign.totalPlays > 0 ? ((campaign.totalWins / campaign.totalPlays) * 100).toFixed(1) : '0',
        resultBreakdown: resultCounts,
        uniquePlayers: new Set(plays.map(p => p.userId || p.email).filter(Boolean)).size,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch plays:', err);
    return NextResponse.json({ error: 'Failed to fetch plays' }, { status: 500 });
  }
}
