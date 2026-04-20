import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string, serviceId: string }> }
) {
  try {
    const { shopId, serviceId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    
    // Authorization Logic:
    // 1. Site Admins can always do it.
    // 2. Shop Admins of this specific shop can always do it.
    // 3. Staff of this specific shop can do it ONLY IF they have the canManageInventory flag set to true.
    const isSiteAdmin = user?.role === 'SITE_ADMIN';
    const isShopAdmin = user?.role === 'SHOP_ADMIN' && user?.shopId === shopId;
    const isAuthorizedStaff = user?.role === 'STAFF' && user?.shopId === shopId && user?.canManageInventory;

    if (!isSiteAdmin && !isShopAdmin && !isAuthorizedStaff) {
       return new Response("Forbidden: You do not have permission to manage inventory", { status: 403 });
    }

    const body = await request.json();
    const { count } = body;

    if (count === undefined || typeof count !== 'number' || count < 0) {
        return NextResponse.json({ error: 'Valid inventory count is required' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
        where: { id: serviceId }
    });

    if(!service || (service.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: service.id, shopId } })))) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (!service.trackInventory) {
        return NextResponse.json({ error: 'Inventory tracking is disabled for this service' }, { status: 400 });
    }

    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { inventoryCount: count }
    });

    // Clear the cache
    revalidatePath(`/shop/${shopId}`);

    return NextResponse.json(updatedService, { status: 200 });
  } catch (error: any) {
    logger.error("Error updating inventory:", error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
