import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ shopId: string; productId: string }> }
) {
  try {
    const { shopId, productId } = await params;

    const authResult = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const deletedProduct = await prisma.product.delete({
      where: {
        id: productId,
        shopId: shopId,
      },
    });

    return NextResponse.json(deletedProduct);
  } catch (error) {
    logger.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

