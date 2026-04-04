import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * PATCH /api/my-appointments/[id]
 * Cancel or reschedule an upcoming appointment. Only the owning client can do this.
 * Enforces a 2-hour minimum notice window.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch the appointment and verify ownership
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, shop: { select: { name: true, timezone: true } } },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.userId !== userId) {
      return NextResponse.json({ error: 'You can only modify your own appointments' }, { status: 403 });
    }

    if (appointment.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Only scheduled appointments can be modified' }, { status: 400 });
    }

    // Enforce 2-hour minimum notice
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    if (appointment.startTime < twoHoursFromNow) {
      return NextResponse.json(
        { error: 'Appointments cannot be modified less than 2 hours before the start time. Please call the shop directly.' },
        { status: 400 }
      );
    }

    // ── Cancellation ──
    if (body.status === 'CANCELLED') {
      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      return NextResponse.json(updated);
    }

    // ── Reschedule (C3) ──
    if (body.startTime) {
      const newStart = new Date(body.startTime);
      const duration = appointment.service?.duration || 30;
      const newEnd = new Date(newStart.getTime() + duration * 60000);
      const newStaffId = body.staffId || appointment.staffId;

      // SECURITY: Validate the staff member belongs to the same shop
      if (newStaffId !== appointment.staffId) {
        const staffMember = await prisma.user.findUnique({ where: { id: newStaffId } });
        if (!staffMember || staffMember.shopId !== appointment.shopId || !['STAFF', 'SHOP_ADMIN'].includes(staffMember.role)) {
          return NextResponse.json({ error: 'Invalid staff member' }, { status: 400 });
        }
      }

      // Validate new time is in the future
      if (newStart < new Date()) {
        return NextResponse.json({ error: 'Cannot reschedule to a past time' }, { status: 400 });
      }

      // Check for conflicts with the new time
      const conflict = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          shopId: appointment.shopId,
          staffId: newStaffId,
          status: { not: 'CANCELLED' },
          startTime: { lt: newEnd },
          endTime: { gt: newStart },
        },
      });

      if (conflict) {
        return NextResponse.json({ error: 'The selected time slot is not available.' }, { status: 400 });
      }

      const oldStartTime = appointment.startTime;
      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          staffId: newStaffId,
        },
      });

      // Send reschedule confirmation email (fire-and-forget)
      try {
        const { NotificationService } = await import('@/lib/notifications');
        const staffUser = await prisma.user.findUnique({ where: { id: newStaffId }, select: { name: true } });
        if (appointment.shop) {
          NotificationService.sendRescheduleConfirmation({
            shopId: appointment.shopId,
            userId,
            shopName: appointment.shop.name,
            serviceName: appointment.service?.name || 'Service',
            staffName: staffUser?.name || 'Staff',
            oldDateTime: oldStartTime,
            newDateTime: newStart,
            duration,
            timezone: appointment.shop.timezone || 'America/New_York',
          }).catch(() => {});
        }
      } catch {}

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

