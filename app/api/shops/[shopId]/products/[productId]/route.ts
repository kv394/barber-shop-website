import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

export async function DELETE(
 req: Request,
 { params }: { params: Promise<{ shopId: string; productId: string }> }
) {
 try {
 const { shopId, productId } = await params;
    const tenantClient = await getTenantClient(shopId);

 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const deletedProduct = await tenantClient.product.delete({
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

export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ shopId: string; productId: string }> }
) {
 try {
 const { shopId, productId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const body = await req.json();

 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const updatedProduct = await tenantClient.product.update({
 where: {
 id: productId,
 shopId: shopId,
 },
 data: {
 name: body.name,
 price: body.price,
 type: body.type,
 trackInventory: body.trackInventory,
 isSellable: body.isSellable,
 imageUrl: (body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim() !== '') ? body.imageUrl.trim() : null,
 description: (body.description && typeof body.description === 'string' && body.description.trim() !== '') ? body.description.trim() : null,
 inventoryCount: body.inventoryCount,
 reorderPoint: body.reorderPoint,
 sku: (body.sku && typeof body.sku === 'string' && body.sku.trim() !== '') ? body.sku.trim() : null,
 barcode: (body.barcode && typeof body.barcode === 'string' && body.barcode.trim() !== '') ? body.barcode.trim() : null,
 },
 });

 return NextResponse.json(updatedProduct);
 } catch (error) {
 logger.error('Error updating product:', error);
 return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
 }
}

