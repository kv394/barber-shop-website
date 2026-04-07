import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';
import { toShopTzDayBounds } from '@/lib/timezone';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limiter';

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
    
    return NextResponse.json(appointments);
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
    
    // SECURITY: Ensure user is authenticated
    if (!userId) {
      return new Response('Unauthorized - Please sign in to book.', { status: 401 });
    }

    // SECURITY: Rate Limiting
    // Limit to 5 booking attempts per user per minute to prevent bot spam
    const rateLimitResult = await rateLimit(`booking:${userId}`, 5, 60);
    if (!rateLimitResult.success) {
      logger.warn(`Rate limit exceeded for user ${userId} booking in shop ${shopId}`);
      return NextResponse.json({ error: 'Too many booking attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    
    // SECURITY: Strict Input Validation via Zod
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(`Invalid booking payload: ${validationResult.error.message}`);
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.format() }, { status: 400 });
    }

    const { serviceId, startTime, staffId, clientName, clientEmail, clientPhone, isWalkIn, notes, existingClientId } = validationResult.data;

    // Run user + service lookups in parallel
    const [bookingUser, service] = await Promise.all([
      prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!bookingUser) {
        return NextResponse.json(
            { error: 'User profile is not yet initialized. Please try again in a moment.' },
            { status: 409 }
        );
    }
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    // SECURITY: Verify service belongs to this shop (prevent cross-shop booking/IDOR)
    if (service.shopId !== shopId) {
      logger.warn(`IDOR attempt: User ${userId} tried to book service ${serviceId} for shop ${shopId} (Service belongs to ${service.shopId})`);
      return NextResponse.json({ error: 'Service not found in this shop' }, { status: 404 });
    }

    // SECURITY: Verify staff belongs to this shop (prevent cross-shop staff assignment)
    const staffMember = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staffMember || staffMember.shopId !== shopId) {
      return NextResponse.json({ error: 'Staff member not found in this shop' }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);
    const blockEnd = new Date(end.getTime() + (service.bufferMinutes || 0) * 60000);

    // Resolve the target user BEFORE the atomic transaction
    let targetUserId = userId;

    // Handle walk-in bookings made by an admin or staff member.
    if (isWalkIn && (bookingUser.role === 'SHOP_ADMIN' || bookingUser.role === 'STAFF' || bookingUser.role === 'SUPER_ADMIN')) {
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
        },
      });
    }, { isolationLevel: 'Serializable' });

    if (!appointment) {
      return NextResponse.json({ error: 'This staff member is not available at the selected time.' }, { status: 400 });
    }

    // Send booking confirmation + schedule reminder (fire-and-forget)
    try {
      const { NotificationService } = await import('@/lib/notifications');
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, timezone: true } });
      const staffUser = await prisma.user.findUnique({ where: { id: staffId }, select: { name: true } });
      if (shop) {
        // Immediate booking confirmation (C8)
        NotificationService.sendBookingConfirmation({
          shopId, userId: targetUserId, shopName: shop.name,
          serviceName: service.name, staffName: staffUser?.name || 'Staff',
          dateTime: start, duration: service.duration, price: service.price,
          timezone: shop.timezone || 'America/New_York',
        }).catch(() => {});
        // 24h reminder
        NotificationService.scheduleAppointmentReminder(
          shopId, targetUserId, start, service.name, shop.name
        ).catch(() => {});
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
