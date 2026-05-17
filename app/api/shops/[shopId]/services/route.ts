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
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';

    // Fetch from Redis Cache if available
    const cacheKey = isAdmin ? `shop_services_admin:${shopId}` : `shop_services_public:${shopId}`;
    const services = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await prisma.service.findMany({
          where: isAdmin ? { shopId } : { shopId, type: 'CUSTOMER' },
          include: { 
            addons: true,
            resourceRequirements: true,
            productUsages: {
              include: { product: true }
            }
          }
        });
      },
      300 // Cache for 5 minutes
    );

    return NextResponse.json(services, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      }
    });
  } catch (error: any) {
    logger.error("Error fetching services:", error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    
    if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
       return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, duration, processingTime, finishingTime, trackInventory, type, itemType, brand, bufferMinutes, imageUrl, addonIds, isBookable, resourceRequirements, productUsages } = body;

    if (!name || price === undefined || duration === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ... Validation logic ...
    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);
    const parsedProcessingTime = processingTime ? Number(processingTime) : 0;
    const parsedFinishingTime = finishingTime ? Number(finishingTime) : 0;
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

    const dataToCreate: any = {
        name: String(name).slice(0, 200),
        description: description ? String(description).slice(0, 2000) : null,
        price: parsedPrice,
        duration: parsedDuration,
        processingTime: parsedProcessingTime,
        finishingTime: parsedFinishingTime,
        trackInventory: Boolean(trackInventory),
        isBookable: isBookable ?? true,
        type: type === 'INTERNAL' ? 'INTERNAL' : 'CUSTOMER',
        itemType: itemType ? String(itemType).slice(0, 100) : null,
        brand: brand ? String(brand).slice(0, 100) : null,
        bufferMinutes: Math.max(0, Math.min(120, parsedBuffer)),
        imageUrl: imageUrl ? String(imageUrl).slice(0, 500) : null,
        shopId: String(shopId)
    };

    if (Array.isArray(addonIds)) {
       dataToCreate.addons = {
           connect: addonIds.map(id => ({ id }))
       };
    }

    if (Array.isArray(resourceRequirements)) {
      dataToCreate.resourceRequirements = {
        create: resourceRequirements.map((req: any) => ({
          resourceType: req.resourceType,
          quantity: req.quantity || 1
        }))
      };
    }

    if (Array.isArray(productUsages)) {
      dataToCreate.productUsages = {
        create: productUsages.map((usage: any) => ({
          productId: usage.productId,
          servicesPerProduct: usage.servicesPerProduct || 1,
          currentServiceCount: 0
        }))
      };
    }

    const newService = await prisma.service.create({
      data: dataToCreate,
      include: { resourceRequirements: true, addons: true, productUsages: { include: { product: true } } }
    });

    // Invalidate the cache since we just added a new service
    await cacheService.invalidate(`shop_services_public:${shopId}`);
    await cacheService.invalidate(`shop_services_admin:${shopId}`);

    revalidatePath(`/shop/${shopId}`);

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating service:", error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
