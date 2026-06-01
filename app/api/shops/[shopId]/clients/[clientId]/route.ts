import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { clientPatchSchema } from '@/lib/validations';
export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const currentUser = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canView = (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === shopId) ||
 (currentUser?.role === 'STAFF' && currentUser?.shopId === shopId);

 if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

 let clientCondition: any = {
 id: clientId,
 OR: [
 { shopId: shopId },
 { clientAppointments: { some: { shopId: shopId } } },
 ],
 };

 if (currentUser?.role === 'STAFF') {
 clientCondition = {
 id: clientId,
 clientAppointments: { some: { shopId: shopId, staffId: currentUser.id } }
 };
 }

 const client = await tenantClient.user.findFirst({
 where: clientCondition,
 select: {
 id: true, name: true, email: true,
 shopClients: { where: { shopId: shopId }, select: { phone: true, clientNotes: true, preferences: true, allergies: true, birthday: true } },
 marketingConsent: true, smsConsent: true,
 barcode: true, createdAt: true,
 clientAppointments: {
 where: { shopId: shopId },
 include: {
 service: { select: { name: true, price: true, duration: true } },
 staff: { select: { name: true } },
 },
 orderBy: { startTime: 'desc' },
 take: 50,
 },
 clientFormulas: {
 where: { shopId: shopId },
 include: { staff: { select: { name: true } } },
 orderBy: { date: 'desc' },
 },
 clientHistoryImages: {
 where: { shopId: shopId },
 orderBy: { date: 'desc' },
 },
 _count: {
 select: { clientAppointments: { where: { shopId: shopId } } },
 },
 },
 });

 if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

 return NextResponse.json(client);
 } catch (error) {
 logger.error('Error fetching client:', error);
 return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
 }
}

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const currentUser = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canEdit = (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === shopId) ||
 (currentUser?.role === 'STAFF' && currentUser?.shopId === shopId);

 if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

 let verifyClientCondition: any = {
 id: clientId,
 OR: [
 { shopId: shopId },
 { clientAppointments: { some: { shopId: shopId } } },
 ],
 };

 if (currentUser?.role === 'STAFF') {
 verifyClientCondition = {
 id: clientId,
 clientAppointments: { some: { shopId: shopId, staffId: currentUser.id } }
 };
 }

 // Verify the client has a relationship with this shop (or with this staff member)
 const client = await tenantClient.user.findFirst({
 where: verifyClientCondition,
 });
 if (!client) return NextResponse.json({ error: 'Client not found in this shop' }, { status: 404 });

  const body = await request.json();
  const validationResult = clientPatchSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.format() }, { status: 400 });
  }

  const validatedData = validationResult.data;
  const updateData: any = {};

  // SECURITY: Sanitize text fields — strip HTML tags and limit length (stored XSS prevention)
  if (validatedData.clientNotes !== undefined) updateData.clientNotes = typeof validatedData.clientNotes === 'string' ? validatedData.clientNotes.replace(/<[^>]*>/g, '') : null;
  if (validatedData.preferences !== undefined) updateData.preferences = typeof validatedData.preferences === 'string' ? validatedData.preferences.replace(/<[^>]*>/g, '') : null;
  if (validatedData.allergies !== undefined) updateData.allergies = typeof validatedData.allergies === 'string' ? validatedData.allergies.replace(/<[^>]*>/g, '') : null;
  
  const userUpdateData: any = {};
  if (validatedData.marketingConsent !== undefined) userUpdateData.marketingConsent = validatedData.marketingConsent;
  if (validatedData.smsConsent !== undefined) userUpdateData.smsConsent = validatedData.smsConsent;

 if (Object.keys(updateData).length > 0) {
 await tenantClient.shopClient.upsert({
 where: { userId_shopId: { userId: clientId, shopId } },
 create: {
 userId: clientId,
 shopId,
 ...updateData
 },
 update: updateData
 });
 }

 const updated = await tenantClient.user.update({
 where: { id: clientId },
 data: userUpdateData,
 select: {
 id: true, name: true, email: true,
 shopClients: { where: { shopId }, select: { phone: true, clientNotes: true, preferences: true, allergies: true, birthday: true } },
 marketingConsent: true, smsConsent: true,
 },
 });

 return NextResponse.json(updated);
 } catch (error) {
 logger.error('Error updating client:', error);
 return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
 }
}
