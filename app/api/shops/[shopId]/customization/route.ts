import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';

export async function POST(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin for this shop or a SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'SUPER_ADMIN' && (user.role !== 'SHOP_ADMIN' || user.shopId !== params.shopId))) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this shop' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { customization } = body;

    if (!customization) {
      return NextResponse.json(
        { error: 'Customization data is required' },
        { status: 400 }
      );
    }

    const updatedShop = await prisma.shop.update({
      where: { id: params.shopId },
      data: {
        customization,
      },
    });

    // Clear the Redis cache for anyone accessing this shop
    await cacheService.invalidatePattern(`shop_layout:*:${params.shopId}`);

    // Clear the Next.js router cache so the new customization is applied everywhere
    revalidatePath(`/shop/${params.shopId}`);
    revalidatePath(`/shop/${params.shopId}/config`);

    return NextResponse.json(updatedShop, { status: 200 });
  } catch (error: any) {
    logger.error('Error updating customization:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customization' },
      { status: 500 }
    );
  }
}
