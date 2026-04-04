import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    // SECURITY: Verify user belongs to this shop (IDOR prevention)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'SUPER_ADMIN' && user.shopId !== shopId)) {
      return new Response("Forbidden", { status: 403 });
    }

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
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || (user.role !== 'SUPER_ADMIN' && (user.role !== 'SHOP_ADMIN' || user.shopId !== shopId))) {
       return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, duration, trackInventory, type, itemType, brand, bufferMinutes, imageUrl } = body;

    if (!name || price === undefined || duration === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY: Validate numeric fields
    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);
    const parsedBuffer = bufferMinutes ? Number(bufferMinutes) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Price must be non-negative' }, { status: 400 });
    }
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 480) {
      return NextResponse.json({ error: 'Duration must be between 1 and 480 minutes' }, { status: 400 });
    }

    // SECURITY: Validate imageUrl if provided (must be a valid URL)
    if (imageUrl && typeof imageUrl === 'string') {
      try {
        const parsed = new URL(imageUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
      }
    }

    const newService = await prisma.service.create({
      data: {
        name: String(name).slice(0, 200),
        description: description ? String(description).slice(0, 2000) : null,
        price: parsedPrice,
        duration: parsedDuration,
        trackInventory: Boolean(trackInventory),
        type: type === 'INTERNAL' ? 'INTERNAL' : 'CUSTOMER',
        itemType: itemType ? String(itemType).slice(0, 100) : null,
        brand: brand ? String(brand).slice(0, 100) : null,
        bufferMinutes: Math.max(0, Math.min(120, parsedBuffer)),
        imageUrl: imageUrl ? String(imageUrl).slice(0, 500) : null,
        shopId: String(shopId)
      }
    });

    // Invalidate the cache since we just added a new service
    await cacheService.invalidate(`shop_services:${shopId}`);

    revalidatePath(`/shop/${shopId}`);

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating service:", error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
