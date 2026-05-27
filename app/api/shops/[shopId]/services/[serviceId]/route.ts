import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cacheService } from '@/lib/cache';

export async function PUT(
 request: Request,
 { params }: { params: Promise<{ shopId: string, serviceId: string }> }
) {
 try {
 const { shopId, serviceId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 // Verify ownership
 const service = await prisma.service.findUnique({ where: { id: serviceId } });
 if (!service || (service.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: service.id, shopId } })))) {
 return NextResponse.json({ error: 'Service not found' }, { status: 404 });
 }

 const body = await request.json();
 const { addonIds, resourceRequirements, productUsages, ...rest } = body;

 const dataToUpdate: any = { ...rest };
 
 // Connect addons if provided
 if (Array.isArray(addonIds)) {
 dataToUpdate.addons = {
 set: addonIds.map(id => ({ id }))
 };
 }

 const isMissingTableError = (err: any, tableName: string) => {
 if (err?.code !== 'P2021') return false;
 if (err.message && err.message.includes(tableName)) return true;
 if (err.meta && typeof err.meta.table === 'string' && err.meta.table.includes(tableName)) return true;
 if (err.meta && typeof err.meta.modelName === 'string' && err.meta.modelName.includes(tableName)) return true;
 return false;
 };

 let skipResourceRequirements = false;
 let skipProductUsages = false;

 if (Array.isArray(resourceRequirements)) {
 try {
 // First delete existing, then create new ones
 await prisma.serviceResourceRequirement.deleteMany({
 where: { serviceId }
 });
 dataToUpdate.resourceRequirements = {
 create: resourceRequirements.map((req: any) => ({
 resourceType: req.resourceType,
 quantity: req.quantity || 1
 }))
 };
 } catch (err: any) {
 if (isMissingTableError(err, 'ServiceResourceRequirement')) {
 skipResourceRequirements = true;
 logger.warn('ServiceResourceRequirement table missing, skipping update');
 } else {
 throw err;
 }
 }
 }

 if (Array.isArray(productUsages)) {
 try {
 await prisma.serviceProductUsage.deleteMany({
 where: { serviceId }
 });
 dataToUpdate.productUsages = {
 create: productUsages.map((usage: any) => ({
 productId: usage.productId,
 servicesPerProduct: usage.servicesPerProduct || 1,
 currentServiceCount: 0
 }))
 };
 } catch (err: any) {
 if (isMissingTableError(err, 'ServiceProductUsage')) {
 skipProductUsages = true;
 logger.warn('ServiceProductUsage table missing, skipping update');
 } else {
 throw err;
 }
 }
 }

 const includeFull: any = { addons: true };
 if (!skipResourceRequirements) {
 includeFull.resourceRequirements = true;
 }
 if (!skipProductUsages) {
 includeFull.productUsages = { include: { product: true } };
 }

 let updatedService;
 try {
 updatedService = await prisma.service.update({
 where: { id: serviceId },
 data: dataToUpdate,
 include: includeFull
 });
 } catch (err: any) {
 const missingResource = isMissingTableError(err, 'ServiceResourceRequirement');
 const missingProduct = isMissingTableError(err, 'ServiceProductUsage');
 
 if (missingResource || missingProduct) {
 const fallbackInclude: any = { addons: true };
 if (!missingResource && !skipResourceRequirements) {
 fallbackInclude.resourceRequirements = true;
 } else {
 delete dataToUpdate.resourceRequirements;
 }
 if (!missingProduct && !skipProductUsages) {
 fallbackInclude.productUsages = { include: { product: true } };
 } else {
 delete dataToUpdate.productUsages;
 }
 
 updatedService = await prisma.service.update({
 where: { id: serviceId },
 data: dataToUpdate,
 include: fallbackInclude
 });
 } else {
 throw err;
 }
 }

 await cacheService.invalidate(`shop_services_public:${shopId}`);
 await cacheService.invalidate(`shop_services_admin:${shopId}`);
 revalidatePath(`/shop/${shopId}`);
 revalidatePath(`/shop/${shopId}/config/services`);

 return NextResponse.json(updatedService);
 } catch (error: any) {
 logger.error("Error updating service:", error);
 return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
 }
}

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string, serviceId: string }> }
) {
 try {
 const { shopId, serviceId } = await params;

 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 // Verify the service belongs to the shop before deleting
 const service = await prisma.service.findUnique({
 where: { id: serviceId }
 });

 if(!service || (service.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: service.id, shopId } })))) {
 return NextResponse.json({ error: 'Service not found or does not belong to this shop' }, { status: 404 });
 }

 await prisma.service.delete({
 where: { id: serviceId }
 });

 revalidatePath(`/shop/${shopId}`);
 revalidatePath(`/shop/${shopId}/config/services`);

 return NextResponse.json({ success: true }, { status: 200 });
 } catch (error: any) {
 logger.error("Error deleting service:", error);
 return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
 }
}
