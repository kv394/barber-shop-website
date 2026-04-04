import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { revalidatePath } from 'next/cache';


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string, serviceId: string }> }
) {
  try {
    const { shopId, serviceId } = await params;

    const authResult = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    // Verify the service belongs to the shop before deleting
    const service = await prisma.service.findUnique({
        where: { id: serviceId }
    });

    if(!service || service.shopId !== shopId) {
        return NextResponse.json({ error: 'Service not found or does not belong to this shop' }, { status: 404 });
    }

    await prisma.service.delete({
        where: { id: serviceId }
    });

    revalidatePath(`/shop/${shopId}`);
    revalidatePath(`/shop/${shopId}/config/services`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error("Error deleting service:", error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
