import { logger } from "@/lib/logger";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { shopId: string, serviceId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const shopId = params.shopId;
    const serviceId = params.serviceId;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Authorization: Super Admin, or Shop Admin
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isShopAdmin = user?.role === 'SHOP_ADMIN' && user?.shopId === shopId;

    if (!isSuperAdmin && !isShopAdmin) {
       return new Response("Forbidden: You do not have permission to modify barcodes", { status: 403 });
    }

    const body = await request.json();
    const { barcode } = body;

    if (!barcode) {
        return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    // Check if barcode is already used
    const existingBarcode = await prisma.service.findUnique({
        where: { barcode }
    });

    if (existingBarcode && existingBarcode.id !== serviceId) {
        return NextResponse.json({ error: 'This barcode is already assigned to another item.' }, { status: 400 });
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId, shopId: shopId },
        data: { barcode }
    });

    // Clear the cache
    revalidatePath(`/shop/${shopId}`);

    return NextResponse.json(updatedService, { status: 200 });
  } catch (error: any) {
    logger.error("Error updating barcode:", error);
    return NextResponse.json({ error: error.message || 'Failed to update barcode' }, { status: 500 });
  }
}
