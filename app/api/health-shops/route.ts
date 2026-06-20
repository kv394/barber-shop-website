import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        companyName: true,
        template: true,
        createdAt: true,
        isActive: true,
        deletedAt: true,
        aiTokens: true,
        premiumFeatures: true,
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
    return NextResponse.json({ success: true, count: shops.length, error: null });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e.message || e) }, { status: 500 });
  }
}
