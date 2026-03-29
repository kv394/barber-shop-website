import { logger } from "@/lib/logger";
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const shopId = params.shopId;
    
    // Fetch from Redis Cache if available
    const services = await cacheService.getOrSet(
      `shop_services:${shopId}`,
      async () => {
        return await prisma.service.findMany({
          where: { shopId }
        });
      },
      300 // Cache for 5 minutes
    );

    return NextResponse.json(services, { status: 200 });
  } catch (error: any) {
    logger.error("Error fetching services:", error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const shopId = params.shopId;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || (user.role !== 'SUPER_ADMIN' && (user.role !== 'SHOP_ADMIN' || user.shopId !== shopId))) {
       return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, duration, trackInventory, type, itemType, brand } = body;

    if (!name || price === undefined || duration === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newService = await prisma.service.create({
      data: {
        name: String(name),
        description: description ? String(description) : null,
        price: Number(price),
        duration: Number(duration),
        trackInventory: Boolean(trackInventory),
        type: type === 'INTERNAL' ? 'INTERNAL' : 'CUSTOMER',
        itemType: itemType ? String(itemType) : null,
        brand: brand ? String(brand) : null,
        shopId: String(shopId)
      }
    });

    // Invalidate the cache since we just added a new service
    await cacheService.invalidate(`shop_services:${shopId}`);

    revalidatePath(`/shop/${shopId}`);

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating service:", error);
    return NextResponse.json({ error: error.message || 'Failed to create service' }, { status: 500 });
  }
}
