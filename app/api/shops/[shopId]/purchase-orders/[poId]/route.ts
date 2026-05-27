import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string, poId: string }> }
) {
 try {
 const { shopId, poId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await request.json();
 const { status, receivedItems } = body;

 const currentPo = await prisma.purchaseOrder.findUnique({
 where: { id: poId, shopId },
 include: { items: true }
 });

 if (!currentPo) return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });

 const updateData: any = {};
 if (status) updateData.status = status;

 if (status === 'RECEIVED' && currentPo.status !== 'RECEIVED') {
 updateData.receivedAt = new Date();
 // Need a transaction to update inventory counts
 await prisma.$transaction(async (tx: any) => {
 // Update PO
 await tx.purchaseOrder.update({
 where: { id: poId },
 data: updateData
 });

 // Update items and inventory
 for (const item of currentPo.items) {
 const receivedQty = receivedItems?.[item.id] !== undefined ? receivedItems[item.id] : item.quantity;
 
 await tx.purchaseOrderItem.update({
 where: { id: item.id },
 data: { receivedQuantity: receivedQty }
 });

 if (receivedQty > 0) {
 await tx.product.update({
 where: { id: item.productId },
 data: { inventoryCount: { increment: receivedQty } }
 });
 }
 }
 });
 
 const updatedPo = await prisma.purchaseOrder.findUnique({
 where: { id: poId },
 include: { items: true }
 });
 return NextResponse.json(JSON.parse(JSON.stringify(updatedPo)));
 } else {
 const updatedPo = await prisma.purchaseOrder.update({
 where: { id: poId },
 data: updateData,
 include: { items: true }
 });
 return NextResponse.json(JSON.parse(JSON.stringify(updatedPo)));
 }
 } catch (error) {
 logger.error('Error updating purchase order:', error);
 return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
 }
}
