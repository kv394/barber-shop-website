import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;

    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF']);
    if (isAuthError(authResult)) return authResult;

    const { name, description, sku, barcode, price, cost, taxRate, trackInventory, inventoryCount, reorderPoint, type, supplier, isSellable } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    // SECURITY: Validate numeric fields — prevent negative prices, costs, or inventory
    const parsedPrice = parseFloat(price);
    const parsedCost = cost ? parseFloat(cost) : null;
    const parsedTaxRate = taxRate ? parseFloat(taxRate) : 0;
    const parsedInventory = inventoryCount ? parseInt(inventoryCount, 10) : 0;

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 });
    }
    if (parsedCost !== null && (isNaN(parsedCost) || parsedCost < 0)) {
      return NextResponse.json({ error: 'Cost must be a non-negative number' }, { status: 400 });
    }
    if (isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 1) {
      return NextResponse.json({ error: 'Tax rate must be between 0 and 1' }, { status: 400 });
    }

    const validTypes = ['RETAIL', 'PROFESSIONAL', 'CONSUMABLE', 'BACKBAR'];

    const product = await prisma.product.create({
      data: {
        shopId: shopId,
        name: String(name).slice(0, 200),
        description: description ? String(description).slice(0, 2000) : null,
        sku: sku ? String(sku).slice(0, 50) : null,
        barcode: barcode ? String(barcode).slice(0, 50) : null,
        price: parsedPrice,
        cost: parsedCost,
        taxRate: parsedTaxRate,
        trackInventory: !!trackInventory,
        isSellable: isSellable ?? true,
        inventoryCount: Math.max(0, parsedInventory),
        reorderPoint: reorderPoint ? Math.max(0, parseInt(reorderPoint, 10) || 0) : 0,
        type: validTypes.includes(type) ? type : 'RETAIL',
        supplier: supplier ? String(supplier).slice(0, 200) : null,
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
    const { shopId } = await params;

    // SECURITY: Products include cost/supplier data — require shop membership
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF']);
    if (isAuthError(authResult)) return authResult;

    const products = await prisma.product.findMany({
      where: { shopId: shopId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

