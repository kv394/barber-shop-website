import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { serialize } from '@/lib/serialize';
import { rateLimit } from '@/lib/rate-limiter';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/my-appointments/lookup
 * Public endpoint: looks up upcoming appointments by client email address.
 * No authentication required – this is used by the self-service portal.
 * Rate-limited to prevent email enumeration abuse.
 */
export async function POST(request: Request) {
  try {
    // Rate limit: 20 requests per minute per IP
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const { success } = await rateLimit(`lookup:${ip}`, 20, 60);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

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
