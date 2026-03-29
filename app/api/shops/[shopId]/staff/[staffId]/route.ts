import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string, staffId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.shopId !== params.shopId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shop = await prisma.shop.findUnique({ where: { id: params.shopId } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const staffMember = await prisma.user.findUnique({
      where: { id: params.staffId, shopId: params.shopId, role: 'STAFF' },
      include: {
        leaves: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({
      shop: JSON.parse(JSON.stringify(shop)),
      userRole: user.role,
      staffMember: JSON.parse(JSON.stringify(staffMember)),
    });
  } catch (error) {
    logger.error('Error fetching schedule page data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
