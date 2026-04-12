import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { expandRecurrence, toRRule } from '@/lib/recurrence';
import crypto from 'crypto';

/**
 * POST /api/shops/[shopId]/appointments/recurring
 * Create a series of recurring appointments (standing bookings).
 * Only staff/admin can create these.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { shopId } = await params;
    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canManage = user?.role === 'SITE_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
      (user?.role === 'STAFF' && user?.shopId === shopId);

    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, staffId, clientId, startTime, frequency, count, notes } = body;

    if (!serviceId || !staffId || !clientId || !startTime || !frequency || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (count < 2 || count > 52) {
      return NextResponse.json({ error: 'Count must be between 2 and 52' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    // SECURITY: Verify service belongs to this shop (prevent cross-shop booking)
    if (service.shopId !== shopId) {
      return NextResponse.json({ error: 'Service not found in this shop' }, { status: 404 });
    }

    // SECURITY: Verify staff belongs to this shop
    const staffMember = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staffMember || staffMember.shopId !== shopId) {
      return NextResponse.json({ error: 'Staff not found in this shop' }, { status: 404 });
    }

    // SECURITY: Verify client has a relationship with this shop
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        OR: [
          { shopId },
          { clientAppointments: { some: { shopId } } },
        ],
      },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found in this shop' }, { status: 404 });
    }

    const baseStart = new Date(startTime);
    const dates = expandRecurrence(baseStart, { frequency, count });
    const duration = service.duration;
    const groupId = crypto.randomUUID();
    const rrule = toRRule({ frequency, count });

    // SECURITY: Atomic conflict-check + create in a serializable transaction
    // to prevent double-booking race conditions (TOCTOU).
    const appointments = await prisma.$transaction(async (tx: any) => {
      // Check for conflicts on all dates inside the transaction
      const conflicts: string[] = [];
      for (const date of dates) {
        const end = new Date(date.getTime() + duration * 60000);
        const conflict = await tx.appointment.findFirst({
          where: {
            shopId,
            staffId,
            status: { not: 'CANCELLED' },
            startTime: { lt: end },
            endTime: { gt: date },
          },
        });
        if (conflict) {
          conflicts.push(date.toISOString());
        }
      }

      if (conflicts.length > 0) {
        throw new Error(`CONFLICTS:${JSON.stringify(conflicts)}`);
      }

      // Create all appointments
      const created = [];
      for (let index = 0; index < dates.length; index++) {
        const date = dates[index];
        const end = new Date(date.getTime() + duration * 60000);
        const apt = await tx.appointment.create({
          data: {
            shopId,
            serviceId,
            staffId,
            userId: clientId,
            startTime: date,
            endTime: end,
            notes: typeof notes === 'string' ? notes.slice(0, 1000) : null,
            recurringGroupId: groupId,
            recurrenceRule: rrule,
            isRecurringParent: index === 0,
          },
        });
        created.push(apt);
      }
      return created;
    }, { isolationLevel: 'Serializable' });

    return NextResponse.json({
      groupId,
      count: appointments.length,
      appointments: appointments.map((a: any) => ({
        id: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    }, { status: 201 });
  } catch (error: any) {
    if (error?.message?.startsWith('CONFLICTS:')) {
      const conflicts = JSON.parse(error.message.replace('CONFLICTS:', ''));
      return NextResponse.json({
        error: `Conflicts found on ${conflicts.length} date(s)`,
        conflicts,
      }, { status: 409 });
    }
    logger.error('Error creating recurring appointments:', error);
    return NextResponse.json({ error: 'Failed to create recurring appointments' }, { status: 500 });
  }
}

