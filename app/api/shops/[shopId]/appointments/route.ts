import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const [year, month, day] = dateStr.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId: params.shopId,
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
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response('Unauthorized - Please sign in to book.', { status: 401 });
    }

    const body = await request.json();
    const { serviceId, startTime, staffId, clientName, clientEmail, isWalkIn } = body;

    if (!serviceId || !startTime || !staffId) {
      return NextResponse.json({ error: 'Service, start time, and staff are required' }, { status: 400 });
    }

    // Run user + service lookups in parallel
    const [bookingUser, service] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!bookingUser) {
        return NextResponse.json(
            { error: 'User profile is not yet initialized. Please try again in a moment.' },
            { status: 409 }
        );
    }
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    const conflict = await prisma.appointment.findFirst({
      where: {
        staffId: staffId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: 'This staff member is not available at the selected time.' }, { status: 400 });
    }

    let targetUserId = userId;

    // Handle walk-in bookings made by an admin or staff member.
    if (isWalkIn && (bookingUser.role === 'SHOP_ADMIN' || bookingUser.role === 'STAFF' || bookingUser.role === 'SUPER_ADMIN')) {
      if (!clientName) {
        return NextResponse.json({ error: 'Client name is required for walk-in bookings' }, { status: 400 });
      }
      const emailToUse = clientEmail?.trim().toLowerCase() || `walkin-${crypto.randomBytes(4).toString('hex')}@barbersaas.local`;
      const userBarcode = crypto.createHash('sha256').update(`${emailToUse}-${process.env.JWT_SECRET || 'secret'}`).digest('hex').substring(0, 12).toUpperCase();

      const guestUser = await prisma.user.upsert({
        where: { email: emailToUse },
        update: {},
        create: {
          id: `guest_${crypto.randomBytes(8).toString('hex')}`,
          email: emailToUse,
          name: clientName,
          role: 'CLIENT',
          shopId: params.shopId,
          barcode: userBarcode,
        },
      });
      targetUserId = guestUser.id;
    }

    const appointment = await prisma.appointment.create({
      data: {
        shopId: params.shopId,
        serviceId: serviceId,
        userId: targetUserId,
        staffId: staffId,
        startTime: start,
        endTime: end,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating appointment:", error);
    return NextResponse.json({ error: error.message || 'Failed to book appointment' }, { status: 500 });
  }
}
