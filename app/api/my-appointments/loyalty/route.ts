import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await prisma.loyaltyAccount.findMany({
    where: { userId },
    include: {
      shop: { select: { name: true } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  return NextResponse.json(
    accounts.map(a => ({
      shopName: a.shop.name,
      pointsBalance: a.pointsBalance,
      totalEarned: a.totalEarned,
      totalRedeemed: a.totalRedeemed,
      currentTier: a.currentTier,
      transactions: a.transactions.map(t => ({
        id: t.id,
        points: t.points,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    }))
  );
}

