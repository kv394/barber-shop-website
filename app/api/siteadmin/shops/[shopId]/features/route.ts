import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const { features } = await request.json();

    if (!features || typeof features !== 'object') {
      return NextResponse.json({ error: 'Invalid features payload' }, { status: 400 });
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        premiumFeatures: features
      },
      select: {
        id: true,
        premiumFeatures: true
      }
    });

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error('Failed to update shop features:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
