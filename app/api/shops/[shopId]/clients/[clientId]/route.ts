import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const currentUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canView = currentUser?.role === 'SITE_ADMIN' ||
 (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === shopId) ||
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

 const client = await prisma.user.findFirst({
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
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const currentUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canEdit = currentUser?.role === 'SITE_ADMIN' ||
 (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === shopId) ||
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
 const client = await prisma.user.findFirst({
 where: verifyClientCondition,
 });
 if (!client) return NextResponse.json({ error: 'Client not found in this shop' }, { status: 404 });

 const body = await request.json();
 const updateData: any = {};

 // SECURITY: Sanitize text fields — strip HTML tags and limit length (stored XSS prevention)
 if (body.clientNotes !== undefined) updateData.clientNotes = typeof body.clientNotes === 'string' ? body.clientNotes.replace(/<[^>]*>/g, '').slice(0, 5000) : null;
 if (body.preferences !== undefined) updateData.preferences = typeof body.preferences === 'string' ? body.preferences.replace(/<[^>]*>/g, '').slice(0, 2000) : null;
 if (body.allergies !== undefined) updateData.allergies = typeof body.allergies === 'string' ? body.allergies.replace(/<[^>]*>/g, '').slice(0, 2000) : null;
 const userUpdateData: any = {};
 if (body.marketingConsent !== undefined) userUpdateData.marketingConsent = Boolean(body.marketingConsent);
 if (body.smsConsent !== undefined) userUpdateData.smsConsent = Boolean(body.smsConsent);

 if (Object.keys(updateData).length > 0) {
 await prisma.shopClient.upsert({
 where: { userId_shopId: { userId: clientId, shopId } },
 create: {
 userId: clientId,
 shopId,
 ...updateData
 },
 update: updateData
 });
 }

 const updated = await prisma.user.update({
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
