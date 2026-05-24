import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { managementToken: token },
      include: {
        shop: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true } }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Already cancelled' }, { status: 400 });
    }

    // Cancel it
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' }
    });

    // Notify the staff member
    await NotificationService.send({
      shopId: appointment.shopId,
      userId: appointment.staffId,
      type: 'APPOINTMENT_CANCELLED',
      title: 'Appointment Cancelled by Client',
      message: `${appointment.user.name || 'A client'} just cancelled their appointment for ${new Date(appointment.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`,
    });

    logger.info(`Appointment ${appointment.id} cancelled via client management portal`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error cancelling appointment via token:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { newStartTime, newEndTime } = await request.json();

    if (!newStartTime || !newEndTime) {
      return NextResponse.json({ error: 'New start and end times are required' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { managementToken: token },
      include: {
        staff: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      }
    });

    if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    if (appointment.status === 'CANCELLED') return NextResponse.json({ error: 'Cannot reschedule a cancelled appointment' }, { status: 400 });

    const oldTimeStr = new Date(appointment.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const newTimeStr = new Date(newStartTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    // Update appointment
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime)
      }
    });

    // Notify staff
    await NotificationService.send({
      shopId: appointment.shopId,
      userId: appointment.staffId,
      type: 'APPOINTMENT_RESCHEDULED',
      title: 'Appointment Rescheduled',
      message: `${appointment.user.name || 'A client'} rescheduled their appointment from ${oldTimeStr} to ${newTimeStr}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error rescheduling appointment via token:', error);
    return NextResponse.json({ error: 'Failed to reschedule appointment' }, { status: 500 });
  }
}

