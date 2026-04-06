import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/superadmin/shops — Detailed shop listing for super admin
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  let userId = authUser?.id;
  const authUserEmail = authUser?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { role: true } });
  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          appointments: true,
          services: true,
          reviews: true,
        },
      },
      users: {
        where: { role: { in: ['SHOP_ADMIN', 'STAFF'] } },
        select: { id: true, role: true, name: true, email: true },
        orderBy: { role: 'asc' },
      },
    },
  });

  return NextResponse.json({ shops });
}

