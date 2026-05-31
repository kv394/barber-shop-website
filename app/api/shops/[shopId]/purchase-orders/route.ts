import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const purchaseOrders = await tenantClient.purchaseOrder.findMany({
 where: { shopId },
 include: {
 items: {
 include: { product: true }
 }
 },
 orderBy: { createdAt: 'desc' }
 });

 return NextResponse.json(JSON.parse(JSON.stringify(purchaseOrders)));
 } catch (error) {
 logger.error('Error fetching purchase orders:', error);
 return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await request.json();
 const { supplier, totalAmount, expectedDeliveryDate, notes, items } = body;

 if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
 return NextResponse.json({ error: 'Supplier and items are required' }, { status: 400 });
 }

 const purchaseOrder = await tenantClient.purchaseOrder.create({
 data: {
 shopId,
 supplier,
 totalAmount: totalAmount || 0,
 expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
 notes,
 status: 'DRAFT',
 items: {
 create: items.map((item: any) => ({
 productId: item.productId,
 quantity: item.quantity,
 unitCost: item.unitCost || 0
 }))
 }
 },
 include: { items: true }
 });

 return NextResponse.json(JSON.parse(JSON.stringify(purchaseOrder)));
 } catch (error: any) {
 logger.error('Error creating purchase order:', error);
 return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 });
 }
}
