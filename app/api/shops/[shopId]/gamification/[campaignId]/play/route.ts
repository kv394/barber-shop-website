import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/shops/[shopId]/gamification/[campaignId]/play
 * Public endpoint — clients play a gamification campaign (spin/scratch/enter draw).
 * No auth required. Play limits enforced via userId or email.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string; campaignId: string }> }
) {
  const { shopId, campaignId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email } = body;

    // Fetch campaign
    const campaign = await prisma.gamificationCampaign.findFirst({
      where: {
        id: campaignId,
        shopId,
        status: 'ACTIVE',
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found or not active' }, { status: 404 });
    }

    // Check date bounds
    const now = new Date();
    if (campaign.startDate && now < campaign.startDate) {
      return NextResponse.json({ error: 'Campaign has not started yet' }, { status: 400 });
    }
    if (campaign.endDate && now > campaign.endDate) {
      return NextResponse.json({ error: 'Campaign has ended' }, { status: 400 });
    }

    // Check play limits
    if (userId || email) {
      const playFilter: any = { campaignId };

      if (userId) {
        playFilter.userId = userId;
      } else if (email) {
        playFilter.email = email;
      }

      // Apply time-based filter
      if (campaign.playLimitType === 'DAILY') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        playFilter.createdAt = { gte: startOfDay };
      } else if (campaign.playLimitType === 'WEEKLY') {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        playFilter.createdAt = { gte: startOfWeek };
      }

      const existingPlays = await prisma.gamificationPlay.count({
        where: playFilter,
      });

      if (existingPlays >= campaign.maxPlaysPerUser) {
        return NextResponse.json(
          { error: 'Play limit reached', limitReached: true },
          { status: 429 }
        );
      }
    }

    // Determine result using weighted random selection
    const config = campaign.config as any;
    const prizes: { label: string; value: string; probability: number }[] = config.prizes || [];

    let result = 'NO_WIN';
    let isWin = false;

    if (campaign.type === 'PRIZE_DRAW') {
      // Prize draws don't have immediate results — it's just an entry
      result = 'ENTERED';
    } else {
      // Spin wheel / scratch card — weighted random
      const totalWeight = prizes.reduce((sum: number, p: any) => sum + (p.probability || 0), 0);
      const rand = Math.random() * totalWeight;
      let cumulative = 0;

      for (const prize of prizes) {
        cumulative += prize.probability || 0;
        if (rand <= cumulative) {
          result = prize.label;
          isWin = prize.value !== 'NO_WIN' && prize.label !== 'No Win' && prize.label !== 'Try Again';
          break;
        }
      }
    }

    // Record the play
    const play = await prisma.gamificationPlay.create({
      data: {
        campaignId,
        userId: userId || null,
        email: email || null,
        result,
      },
    });

    // Update campaign counters
    await prisma.gamificationCampaign.update({
      where: { id: campaignId },
      data: {
        totalPlays: { increment: 1 },
        ...(isWin ? { totalWins: { increment: 1 } } : {}),
      },
    });

    return NextResponse.json({
      playId: play.id,
      result,
      isWin,
      message: isWin
        ? `Congratulations! You won: ${result}`
        : campaign.type === 'PRIZE_DRAW'
        ? 'You have been entered into the draw!'
        : 'Better luck next time!',
    });
  } catch (err: any) {
    console.error('Failed to process play:', err);
    return NextResponse.json({ error: 'Failed to process play' }, { status: 500 });
  }
}
