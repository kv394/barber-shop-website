import { logger } from "@/lib/logger";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const shopId = params.shopId;
    
    // Verify user is SUPER_ADMIN
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SUPER_ADMIN') {
       return new Response("Forbidden: Only Super Admins can delete shops", { status: 403 });
    }

    // Since Shop has relations (users, services, appointments, timeLogs), 
    // Prisma requires deleting those first or setting up cascading deletes in schema.
    // For now, we manually delete/unlink the relations to avoid constraint errors.
    
    // 1. Delete all TimeLogs associated with the shop
    await prisma.timeLog.deleteMany({
        where: { shopId: shopId }
    });

    // 2. Delete all appointments associated with the shop
    await prisma.appointment.deleteMany({
        where: { shopId: shopId }
    });

    // 3. Delete all services associated with the shop
    await prisma.service.deleteMany({
        where: { shopId: shopId }
    });
    
    // 4. Handle Users
    // First, permanently delete the auto-generated Kiosk user for this shop
    await prisma.user.deleteMany({
        where: { 
            shopId: shopId,
            role: 'ATTENDANCE_KIOSK'
        }
    });

    // Then, update real users who belong to this shop to not have a shop anymore
    // We downgrade them to CLIENT and reset their inventory permissions so they can
    // be cleanly assigned to a new shop later.
    await prisma.user.updateMany({
        where: { shopId: shopId },
        data: { 
            shopId: null, 
            role: 'CLIENT',
            canManageInventory: false 
        }
    });

    // 5. Finally, delete the shop itself
    await prisma.shop.delete({
        where: { id: shopId }
    });

    // Revalidate directory
    revalidatePath('/shops');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error("Error deleting shop:", error);
    return NextResponse.json({ error: error.message || 'Failed to delete shop' }, { status: 500 });
  }
}
