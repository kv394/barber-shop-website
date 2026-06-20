import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/siteadmin/shops — Detailed shop listing for site admin
 */
export async function GET() {
  try {
    const adminCheck = await requireSiteAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const shops = await prisma.shop.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        companyName: true,
        template: true,
        createdAt: true,
        isActive: true,
        supportAccessEnabled: true,
        supportAccessExpiresAt: true,
        deletedAt: true,
        aiTokens: true,
        premiumFeatures: true,
        customization: true,
        _count: {
          select: {
            users: true,
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
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
