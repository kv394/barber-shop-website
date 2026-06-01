import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';


export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string, serviceId: string }> }
) {
 try {
 const { shopId, serviceId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 // Authorization: Site Admin, or Shop Admin
 const isSiteAdmin = false;
 const isShopAdmin = user?.role === 'SHOP_ADMIN' && user?.shopId === shopId;

 if (!isSiteAdmin && !isShopAdmin) {
 return new Response("Forbidden: You do not have permission to modify barcodes", { status: 403 });
 }

 const body = await request.json();
 const { barcode } = body;

 if (!barcode) {
 return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
 }

 // Check if barcode is already used
 const existingBarcode = await tenantClient.service.findUnique({
 where: { barcode }
 });

 if (existingBarcode && existingBarcode.id !== serviceId) {
 return NextResponse.json({ error: 'This barcode is already assigned to another item.' }, { status: 400 });
 }

 const updatedService = await tenantClient.service.update({
 where: { id: serviceId, shopId: shopId },
 data: { barcode }
 });

 // Clear the cache
 revalidatePath(`/shop/${shopId}`);

 return NextResponse.json(updatedService, { status: 200 });
 } catch (error: any) {
 logger.error("Error updating barcode:", error);
 return NextResponse.json({ error: 'Failed to update barcode' }, { status: 500 });
 }
}
