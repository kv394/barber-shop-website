import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response('Unauthorized', { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response('Forbidden', { status: 403 });
 }

 // Only allow STAFF or SHOP_ADMIN/SITE_ADMIN to block time
 if (user.role !== 'STAFF' && user.role !== 'SHOP_ADMIN' && user.role !== 'SITE_ADMIN') {
 return new Response('Forbidden', { status: 403 });
 }

 const body = await request.json();
 const targetStaffId = body.staffId;

 // Staff can only block their own time, unless they are admin
 if (user.role === 'STAFF' && user.id !== targetStaffId) {
 return new Response('Forbidden', { status: 403 });
 }

 if (!body.startTime || !body.endTime) {
 return NextResponse.json({ error: 'Missing start or end time' }, { status: 400 });
 }

 const startTime = new Date(body.startTime);
 const endTime = new Date(body.endTime);

 // Get an internal service or create a dummy one, or just create appointment without service.
 // The serviceId is optional in the Prisma schema (service Service? @relation)
 const appointment = await tenantClient.appointment.create({
 data: {
 shopId,
 staffId: targetStaffId,
 userId: targetStaffId, // Use staff's own ID as the client for internal blocks
 startTime,
 endTime,
 notes: body.notes || 'Blocked Time',
 status: 'SCHEDULED'
 },
 });

 return NextResponse.json(appointment);
 } catch (error: any) {
 logger.error("Error blocking time:", error);
 return NextResponse.json({ error: 'Failed to block time' }, { status: 500 });
 }
}
