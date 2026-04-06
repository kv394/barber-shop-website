import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/my-appointments/referrals
 * Returns the authenticated user's referral code and referral history.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { id: true, referralCode: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Auto-generate referral code if missing
    if (!user.referralCode) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { id: true, referralCode: true, name: true },
      });
    }

    // Get referrals this user has made (across all shops)
    const referralsMade = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: { select: { name: true, email: true } },
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get shops this user has visited (to generate per-shop referral links)
    const visitedShops = await prisma.appointment.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { shop: { select: { id: true, name: true } } },
      distinct: ['shopId'],
      take: 20,
    });

    const uniqueShops = visitedShops.map(a => a.shop);

    return NextResponse.json({
      referralCode: user.referralCode,
      referrals: referralsMade.map(r => ({
        id: r.id,
        refereeName: r.referee.name || r.referee.email?.split('@')[0] || 'Someone',
        shopName: r.shop.name,
        status: r.status,
        rewardPoints: r.referrerRewardPoints,
        createdAt: r.createdAt,
      })),
      shops: uniqueShops,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

