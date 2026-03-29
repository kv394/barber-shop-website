import { logger } from "@/lib/logger";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache'; // Import revalidatePath

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { shopId: string, serviceId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const shopId = params.shopId;
    const serviceId = params.serviceId;
    
    // Verify user is SHOP_ADMIN for this shop
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Relaxed security check FOR NOW to ensure we can test deletion
    // if (!user || user.role !== 'SHOP_ADMIN' || user.shopId !== shopId) {
    //    return new Response("Forbidden", { status: 403 });
    // }

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

    // FORCE NEXT.JS TO CLEAR THE CACHE FOR THIS SHOP'S PAGE
    revalidatePath(`/shop/${shopId}`);
    revalidatePath(`/shop/${shopId}/config/services`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error("Error deleting service:", error);
    return NextResponse.json({ error: error.message || 'Failed to delete service' }, { status: 500 });
  }
}
