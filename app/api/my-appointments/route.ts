import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/my-appointments
 * Returns the authenticated client's upcoming and past appointments.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    const [upcoming, past] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          userId,
          status: 'SCHEDULED',
          startTime: { gte: now },
        },
        include: {
          service: { select: { id: true, name: true, price: true, duration: true } },
          staff: { select: { name: true } },
          shop: { select: { id: true, name: true, timezone: true } },
          review: { select: { id: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 50,
      }),
      prisma.appointment.findMany({
        where: {
          userId,
          OR: [
            { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
            { startTime: { lt: now }, status: 'SCHEDULED' },
          ],
        },
        include: {
          service: { select: { id: true, name: true, price: true, duration: true } },
          staff: { select: { name: true } },
          shop: { select: { id: true, name: true, timezone: true } },
          review: { select: { id: true } },
        },
        orderBy: { startTime: 'desc' },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      upcoming: JSON.parse(JSON.stringify(upcoming)),
      past: JSON.parse(JSON.stringify(past)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

