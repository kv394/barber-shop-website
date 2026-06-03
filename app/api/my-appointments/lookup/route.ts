import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

/**
 * POST /api/my-appointments/lookup
 * Public endpoint: looks up upcoming appointments by client email address.
 * No authentication required – this is used by the self-service portal.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user(s) with this email
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // Return empty array rather than error – don't reveal whether an email exists
      return NextResponse.json({ appointments: [] });
    }

    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        status: 'SCHEDULED',
        startTime: { gte: now },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        managementToken: true,
        notes: true,
        service: { select: { id: true, name: true, price: true, duration: true } },
        staff: { select: { name: true, imageUrl: true } },
        shop: { select: { id: true, name: true, timezone: true, currency: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({
      appointments: serialize(appointments),
      clientName: user.name,
    });
  } catch (error: any) {
    console.error('Error in appointment lookup:', error);
    return NextResponse.json(
      { error: 'Failed to look up appointments' },
      { status: 500 }
    );
  }
}
