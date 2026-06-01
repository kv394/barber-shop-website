import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

import { resolveShopId } from '@/lib/shop-resolution';
import { productSchema } from '@/lib/validations';

export async function POST(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
 try {
 const { shopId: paramShopId } = await params; const shopId = await resolveShopId(paramShopId);
 if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const tenantClient = await getTenantClient(shopId);

 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;

  const body = await req.json();
  const validationResult = productSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.format() }, { status: 400 });
  }

  const { name, description, sku, barcode, price, cost, taxRate, trackInventory, inventoryCount, reorderPoint, type, supplier, isSellable, imageUrl } = validationResult.data;

  const product = await tenantClient.product.create({
    data: {
      shopId: shopId,
      name,
      description,
      sku,
      barcode,
      price,
      cost,
      taxRate,
      trackInventory,
      isSellable,
      imageUrl: imageUrl || null,
      inventoryCount,
      reorderPoint,
      type,
      supplier,
    },
  });

 return NextResponse.json(product);
 } catch (error) {
 logger.error('Error creating product:', error);
 return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
 }
}

export async function GET(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
 try {
 const { shopId: paramShopId } = await params; const shopId = await resolveShopId(paramShopId);
 if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const tenantClient = await getTenantClient(shopId);

 // SECURITY: Products include cost/supplier data — require shop membership
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;

 const products = await tenantClient.product.findMany({
 where: { shopId: shopId },
 orderBy: { name: 'asc' },
 });
 return NextResponse.json(products);
 } catch (error) {
 logger.error('Error fetching products:', error);
 return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
 }
}

