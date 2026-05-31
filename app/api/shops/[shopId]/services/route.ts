import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';
import { z } from 'zod';

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
 where: isAdmin ? { shopId } : { shopId, type: 'CUSTOMER' as any }
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
 const { shopId: paramShopId } = await params; const url = new URL(request.url);
 const isAdmin = url.searchParams.get('admin') === 'true';

 const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 }
 const shopId = resolvedShop.id;

 const tenantClient = await getTenantClient(shopId);

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
 const { shopId: paramShopId } = await params; 
 const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 }
 const shopId = resolvedShop.id;

 const tenantClient = await getTenantClient(shopId);

 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return new Response("Forbidden", { status: 403 });
 }

 const serviceSchema = z.object({
   name: z.string().min(1).max(200),
   description: z.string().max(2000).nullable().optional(),
   price: z.number().min(0),
   duration: z.number().min(1).max(480),
   processingTime: z.number().min(0).optional().default(0),
   finishingTime: z.number().min(0).optional().default(0),
   type: z.enum(['CUSTOMER', 'INTERNAL']).optional().default('CUSTOMER'),
   itemType: z.string().max(100).nullable().optional(),
   brand: z.string().max(100).nullable().optional(),
   bufferMinutes: z.number().min(0).max(120).optional().default(0),
   imageUrl: z.string().url().max(500).nullable().optional().or(z.literal('')),
   addonIds: z.array(z.string()).optional(),
   isBookable: z.boolean().optional().default(true),
   requiresVirtualConsultation: z.boolean().optional().default(false),
   resourceRequirements: z.array(z.any()).optional(),
   productUsages: z.array(z.any()).optional(),
 });

 const body = await request.json();
 const validation = serviceSchema.safeParse(body);
 if (!validation.success) {
   return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
 }
 const validatedData = validation.data;
 const { name, description, price: parsedPrice, duration: parsedDuration, processingTime: parsedProcessingTime, finishingTime: parsedFinishingTime, type, itemType, brand, bufferMinutes: parsedBuffer, imageUrl, addonIds, isBookable, requiresVirtualConsultation, resourceRequirements, productUsages } = validatedData;

 const dataToCreate: any = {
 name: String(name).slice(0, 200),
 description: description ? String(description).slice(0, 2000) : null,
 price: parsedPrice,
 duration: parsedDuration,
 processingTime: parsedProcessingTime,
 finishingTime: parsedFinishingTime,
 isBookable: isBookable ?? true,
 requiresVirtualConsultation: requiresVirtualConsultation ?? false,
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
 newService = await tenantClient.service.create({
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

 newService = await tenantClient.service.create({
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
