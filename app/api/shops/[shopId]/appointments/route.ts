import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';
import { toShopTzDayBounds } from '@/lib/timezone';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limiter';
import { getCalendarBusySlots } from '@/lib/google-calendar';

// Define the validation schema for booking an appointment
const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  startTime: z.string().datetime("Invalid start time format"),
  staffId: z.string().min(1, "Staff ID is required"),
  notes: z.string().max(1000).optional(),
  isWalkIn: z.boolean().optional().default(false),
  clientName: z.string().max(100).optional(),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  clientPhone: z.string().max(20).optional().or(z.literal('')),
  existingClientId: z.string().optional(),
  addonIds: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    // Fetch shop timezone to compute correct day boundaries
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { timezone: true },
    });
    const tz = shop?.timezone || 'America/New_York';
    const { startOfDay, endOfDay } = toShopTzDayBounds(dateStr, tz);

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId: shopId,
        startTime: { gte: startOfDay, lt: endOfDay },
      },
      select: { startTime: true, endTime: true, staffId: true },
    });

    // Fetch staff in this shop to check for Google Calendar sync
    const staffMembers = await prisma.user.findMany({
      where: {
        OR: [
          { shopId: shopId, role: 'STAFF' },
          { shopAccesses: { some: { shopId: shopId, role: 'STAFF' } } }
        ],
        googleRefreshToken: { not: null }
      },
      select: { id: true }
    });

    // Fetch busy slots from Google Calendar for each linked staff member
    const googleBusySlotsPromises = staffMembers.map(async (staff) => {
      const busySlots = await getCalendarBusySlots(staff.id, startOfDay, endOfDay);
      return busySlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        staffId: staff.id,
        isGoogleCalendarBlock: true
      }));
    });

    const googleBusySlotsNested = await Promise.all(googleBusySlotsPromises);
    const googleBusySlots = googleBusySlotsNested.flat();

    const allBusySlots = [...appointments, ...googleBusySlots];
    
    return NextResponse.json(allBusySlots);
  } catch (error) {
    logger.error("Error fetching appointments:", error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    
    const body = await request.json();
    
    // SECURITY: Strict Input Validation via Zod
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(`Invalid booking payload: ${validationResult.error.message}`);
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.format() }, { status: 400 });
    }

    const { serviceId, startTime, staffId, clientName, clientEmail, clientPhone, isWalkIn, notes, existingClientId, addonIds } = validationResult.data;

    // SECURITY: Ensure user is authenticated OR it is a public walk-in booking
    if (!userId && !isWalkIn) {
      return new Response('Unauthorized - Please sign in to book.', { status: 401 });
    }

    // SECURITY: Rate Limiting
    // Limit to 5 booking attempts per user/IP per minute to prevent bot spam
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = userId ? `booking:${userId}` : `booking-ip:${ip}`;
    const rateLimitResult = await rateLimit(rateLimitKey, 5, 60);
    if (!rateLimitResult.success) {
      logger.warn(`Rate limit exceeded for ${rateLimitKey} booking in shop ${shopId}`);
      return NextResponse.json({ error: 'Too many booking attempts. Please try again later.' }, { status: 429 });
    }

    // Run user + service lookups in parallel
    const [bookingUser, service] = await Promise.all([
      userId ? prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: authUserEmail || '' }] } }) : null,
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (userId && !bookingUser) {
        return NextResponse.json(
            { error: 'User profile is not yet initialized. Please try again in a moment.' },
            { status: 409 }
        );
    }
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    // SECURITY: Verify service belongs to this shop (prevent cross-shop booking/IDOR)
    if ((service.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: service.id, shopId } })))) {
      logger.warn(`IDOR attempt: User ${userId} tried to book service ${serviceId} for shop ${shopId} (Service belongs to ${service.shopId})`);
      return NextResponse.json({ error: 'Service not found in this shop' }, { status: 404 });
    }

    // Process Addons
    let addonsJson: any = null;
    let totalDuration = service.duration;
    let totalPrice = service.price;

    if (addonIds && addonIds.length > 0) {
      const dbAddons = await prisma.serviceAddon.findMany({
        where: { id: { in: addonIds }, shopId }
      });
      addonsJson = dbAddons.map(a => ({ id: a.id, name: a.name, price: a.price, durationMin: a.durationMin }));
      totalDuration += dbAddons.reduce((sum, a) => sum + a.durationMin, 0);
      totalPrice += dbAddons.reduce((sum, a) => sum + a.price, 0);
    }

    // SECURITY: Verify staff belongs to this shop (prevent cross-shop staff assignment)
    const staffMember = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staffMember || (staffMember.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: staffMember.id, shopId } })))) {
      return NextResponse.json({ error: 'Staff member not found in this shop' }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + totalDuration * 60000);
    const blockEnd = new Date(end.getTime() + (service.bufferMinutes || 0) * 60000);

    // Resolve the target user BEFORE the atomic transaction
    let targetUserId = bookingUser?.id || '';

    // Handle walk-in bookings made by an admin/staff, OR by unauthenticated users from the widget/SDK
    if (isWalkIn && (!bookingUser || bookingUser.role === 'SHOP_ADMIN' || bookingUser.role === 'STAFF' || bookingUser.role === 'SITE_ADMIN')) {
      // If an existing client was selected, use them directly
      if (existingClientId) {
        // SECURITY: Verify client belongs to this shop or has appointments here
        const existingClient = await prisma.user.findFirst({
          where: {
            id: existingClientId,
            OR: [
              { shopId: shopId },
              { clientAppointments: { some: { shopId: shopId } } },
            ],
          },
        });
        if (!existingClient) {
          return NextResponse.json({ error: 'Selected client not found in this shop' }, { status: 404 });
        }
        targetUserId = existingClient.id;
        // Update phone if provided and not already set
        if (clientPhone && !existingClient.phone) {
          await prisma.user.update({ where: { id: existingClient.id }, data: { phone: clientPhone } });
        }
      } else {
        if (!clientName) {
          return NextResponse.json({ error: 'Client name is required for walk-in bookings' }, { status: 400 });
        }
        const emailToUse = clientEmail?.trim().toLowerCase() || `walkin-${crypto.randomBytes(4).toString('hex')}@shophub.local`;
        const userBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();

        const guestUser = await prisma.user.upsert({
          where: { email: emailToUse },
          update: { phone: clientPhone || undefined },
          create: {
            id: `guest_${crypto.randomBytes(8).toString('hex')}`,
            email: emailToUse,
            name: clientName,
            phone: clientPhone || null,
            role: 'CLIENT',
            shopId: shopId,
            barcode: userBarcode,
          },
        });
        targetUserId = guestUser.id;
      }
    }

    // SECURITY: Atomic conflict-check + create inside a serializable transaction
    // to prevent double-booking race conditions (TOCTOU).
    const appointment = await prisma.$transaction(async (tx: any) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          shopId: shopId,
          staffId: staffId,
          status: { not: 'CANCELLED' },
          startTime: { lt: blockEnd },
          endTime: { gt: start },
        },
      });

      if (conflict) {
        throw new Error('CONFLICT');
      }

      return tx.appointment.create({
        data: {
          shopId: shopId,
          serviceId: serviceId,
          userId: targetUserId,
          staffId: staffId,
          startTime: start,
          endTime: end,
          notes: notes || null,
          addons: addonsJson || null,
        },
      });
    }, { isolationLevel: 'Serializable' });

    if (!appointment) {
      return NextResponse.json({ error: 'This staff member is not available at the selected time.' }, { status: 400 });
    }

    // Send booking confirmation + schedule reminder (fire-and-forget)
    try {
      const { NotificationService } = await import('@/lib/notifications');
      const { createCalendarEvent } = await import('@/lib/google-calendar');
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, timezone: true } });
      const staffUser = await prisma.user.findUnique({ where: { id: staffId }, select: { name: true } });
      if (shop) {
        // Immediate booking confirmation (C8)
        NotificationService.sendBookingConfirmation({
          shopId, userId: targetUserId, shopName: shop.name,
          serviceName: service.name + (addonsJson?.length ? ` + ${addonsJson.length} Add-on(s)` : ''), staffName: staffUser?.name || 'Staff',
          dateTime: start, duration: totalDuration, price: totalPrice,
          timezone: shop.timezone || 'America/New_York',
        }).catch(() => {});
        // 24h reminder
        NotificationService.scheduleAppointmentReminder(
          shopId, targetUserId, start, service.name + (addonsJson?.length ? ` + ${addonsJson.length} Add-on(s)` : ''), shop.name
        ).catch(() => {});
        
        // Push event to Google Calendar for Staff if linked
        createCalendarEvent(staffId, {
          startTime: start,
          endTime: end,
          serviceName: service.name + (addonsJson?.length ? ` + ${addonsJson.length} Add-on(s)` : ''),
          staffName: staffUser?.name || 'Staff',
          shopName: shop.name
        }).catch(() => {});
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'CONFLICT') {
      return NextResponse.json({ error: 'This staff member is not available at the selected time.' }, { status: 400 });
    }
    logger.error("Error creating appointment:", error);
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}
