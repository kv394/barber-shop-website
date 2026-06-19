import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const adminCheck = await requireSiteAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { isActive } = await req.json();

    const shop = await prisma.shop.update({
      where: { id: (await params).shopId },
      data: { isActive },
    });

    return NextResponse.json({ success: true, shop });
  } catch (error) {
    console.error('Suspend shop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
