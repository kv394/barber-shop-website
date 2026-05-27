import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const authResult = await requireShopRole(shopId, ['ATTENDANCE_KIOSK', 'SHOP_ADMIN', 'SITE_ADMIN']);
 if (authResult instanceof NextResponse) return authResult;

 const { phone } = await request.json();
 if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

 // Find the user by phone number
 const user = await prisma.user.findFirst({
 where: { phone: { contains: phone.trim() }, shopId }
 });

 if (!user) {
 return NextResponse.json({ error: 'No appointment found for this phone number today' }, { status: 404 });
 }

 // Find their appointment for today
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 const tomorrow = new Date(today);
 tomorrow.setDate(tomorrow.getDate() + 1);

 const appointment = await prisma.appointment.findFirst({
 where: {
 userId: user.id,
 shopId,
 startTime: { gte: today, lt: tomorrow },
 status: { in: ['SCHEDULED', 'ACCEPTED'] }
 },
 include: { staff: true, service: true }
 });

 if (!appointment) {
 return NextResponse.json({ error: 'No upcoming appointment found for today' }, { status: 404 });
 }

 // Update status to ARRIVED
 await prisma.appointment.update({
 where: { id: appointment.id },
 data: { status: 'ARRIVED' }
 });

 // Notify the staff member
 await NotificationService.send({
 shopId,
 userId: appointment.staffId,
 type: 'APPOINTMENT_ARRIVED',
 title: 'Client Arrived',
 message: `${user.name || 'Your client'} has arrived for their ${appointment.service?.name || 'appointment'}.`,
 });

 logger.info(`Client ${user.id} checked in for appointment ${appointment.id}`);

 return NextResponse.json({ success: true, appointmentId: appointment.id });
 } catch (error) {
 logger.error('Error checking in client from kiosk:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
