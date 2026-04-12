import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string, productId: string }> }
) {
  try {
    const { shopId, productId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    const userId = authUserSession?.id;
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

    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if(!product || product.shopId !== shopId) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.trackInventory) {
        return NextResponse.json({ error: 'Inventory tracking is disabled for this product' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { inventoryCount: count }
    });

    // Clear the cache
    revalidatePath(`/shop/${shopId}/config/products`);

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    logger.error("Error updating inventory:", error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
