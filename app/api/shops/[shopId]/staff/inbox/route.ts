import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
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

 const { searchParams } = new URL(request.url);
 const filterUserId = searchParams.get('userId') || user.id;

 // Staff can only view their own inbox
 if (user.role === 'STAFF' && user.id !== filterUserId) {
 return new Response('Forbidden', { status: 403 });
 }

 const now = new Date();
 const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

 // Get notifications explicitly for this user (if any exist)
 const notifications = await tenantClient.notification.findMany({
 where: { shopId, userId: filterUserId },
 orderBy: { id: 'desc' },
 take: 10
 });

 // Also inject some "virtual" notifications for upcoming appointments
 const upcomingAppointments = await tenantClient.appointment.findMany({
 where: { 
 shopId, 
 staffId: filterUserId,
 status: 'SCHEDULED',
 startTime: { gte: now, lte: next48Hours }
 },
 include: {
 user: { select: { name: true } },
 service: { select: { name: true } }
 },
 orderBy: { startTime: 'asc' },
 take: 5
 });

 const virtualNotifications = upcomingAppointments.map((apt: any) => ({
 id: `virt-${apt.id}`,
 type: 'UPCOMING_APPOINTMENT',
 title: 'Upcoming Appointment',
 message: `You have a ${apt.service?.name || 'Service'} with ${apt.user.name || 'a client'} at ${new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
 status: 'UNREAD',
 createdAt: apt.createdAt.toISOString() // using creation time of appointment
 }));

 // Merge actual db notifications and virtual ones
 let inboxItems = [...notifications, ...virtualNotifications];
 
 // Sort by most recently created (descending)
 inboxItems.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

 return NextResponse.json(inboxItems);
 } catch (error: any) {
 logger.error("Error fetching inbox:", error);
 return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 });
 }
}
