import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string, productId: string }> }
) {
 try {
 const { shopId, productId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 const userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 // Authorization Logic:
 // 1. Site Admins can always do it.
 // 2. Shop Admins of this specific shop can always do it.
 // 3. Staff of this specific shop can do it ONLY IF they have the canManageInventory flag set to true.
 const isSiteAdmin = false;
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

 const product = await tenantClient.product.findUnique({
 where: { id: productId }
 });

 if(!product || (product.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: product.id, shopId } })))) {
 return NextResponse.json({ error: 'Product not found' }, { status: 404 });
 }

 if (!product.trackInventory) {
 return NextResponse.json({ error: 'Inventory tracking is disabled for this product' }, { status: 400 });
 }

 const updatedProduct = await tenantClient.product.update({
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
