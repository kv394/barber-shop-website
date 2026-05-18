import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';

const serviceInclude = {
  addons: true,
  productUsages: {
    include: { product: true }
  }
};

const isMissingTableError = (err: any, tableName: string) => {
  if (err?.code !== 'P2021') return false;
  if (err.message && err.message.includes(tableName)) return true;
  if (err.meta && typeof err.meta.table === 'string' && err.meta.table.includes(tableName)) return true;
  if (err.meta && typeof err.meta.modelName === 'string' && err.meta.modelName.includes(tableName)) return true;
  return false;
};

async function fetchShopServices(shopId: string, isAdmin: boolean) {
  const baseArgs = {
    where: isAdmin ? { shopId } : { shopId, type: 'CUSTOMER' }
  };

  const includeFull = {
    ...serviceInclude,
    resourceRequirements: true
  };

  try {
    return await prisma.service.findMany({
      ...baseArgs,
      include: includeFull
    });
  } catch (error: any) {
    const missingResourceRequirements = isMissingTableError(error, 'ServiceResourceRequirement');
    const missingProductUsage = isMissingTableError(error, 'ServiceProductUsage');

    if (!missingResourceRequirements && !missingProductUsage) {
      throw error;
    }

    logger.warn('Service related table is missing; retrying without the missing includes.', {
      shopId,
      isAdmin,
      missingResourceRequirements,
      missingProductUsage,
      errorMeta: error.meta
    });

    const includeRetry: any = { addons: true };
    if (!missingProductUsage) {
      includeRetry.productUsages = includeFull.productUsages;
    }
    if (!missingResourceRequirements) {
      includeRetry.resourceRequirements = true;
    }

    try {
      return await prisma.service.findMany({
        ...baseArgs,
        include: includeRetry
      });
    } catch (retryError: any) {
      const missingResourceRequirements2 = isMissingTableError(retryError, 'ServiceResourceRequirement');
      const missingProductUsage2 = isMissingTableError(retryError, 'ServiceProductUsage');
      if (missingResourceRequirements2 || missingProductUsage2) {
        logger.warn('Second retry still failed due to missing service relation tables; returning services with addons only.', {
          shopId,
          isAdmin,
          missingResourceRequirements2,
          missingProductUsage2,
          errorMeta: retryError.meta
        });
        return await prisma.service.findMany({
          ...baseArgs,
          include: { addons: true }
        });
      }
      throw retryError;
    }
  }
}

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
      async () => fetchShopServices(shopId, isAdmin),
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

    const includeFull: any = { addons: true, resourceRequirements: true, productUsages: { include: { product: true } } };
    let newService;

    try {
      newService = await prisma.service.create({
        data: dataToCreate,
        include: includeFull
      });
    } catch (err: any) {
      const isMissingResource = isMissingTableError(err, 'ServiceResourceRequirement');
      const isMissingProduct = isMissingTableError(err, 'ServiceProductUsage');
      
      if (isMissingResource || isMissingProduct) {
        logger.warn('Missing service relation tables during create, retrying without them.', {
          shopId,
          isMissingResource,
          isMissingProduct
        });
        
        const fallbackInclude: any = { addons: true };
        if (!isMissingResource) {
          fallbackInclude.resourceRequirements = true;
        } else {
          delete dataToCreate.resourceRequirements;
        }
        
        if (!isMissingProduct) {
          fallbackInclude.productUsages = { include: { product: true } };
        } else {
          delete dataToCreate.productUsages;
        }

        newService = await prisma.service.create({
          data: dataToCreate,
          include: fallbackInclude
        });
      } else {
        throw err;
      }
    }

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
