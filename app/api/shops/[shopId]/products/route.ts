import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { shopId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: (await fetch(`https://api.clerk.com/v1/users/${userId}`, { headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` } }).then(r => r.json())).email_addresses[0].email_address }
    });

    if (!user || !['SUPER_ADMIN', 'SHOP_ADMIN', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, sku, barcode, price, cost, taxRate, trackInventory, inventoryCount, reorderPoint, type, supplier } = await req.json();

    const product = await prisma.product.create({
      data: {
        shopId: params.shopId,
        name,
        description,
        sku,
        barcode,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        trackInventory: !!trackInventory,
        inventoryCount: inventoryCount ? parseInt(inventoryCount, 10) : 0,
        reorderPoint: reorderPoint ? parseInt(reorderPoint, 10) : 0,
        type: type || 'RETAIL',
        supplier,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { shopId: string } }) {
  try {
    const products = await prisma.product.findMany({
      where: { shopId: params.shopId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

