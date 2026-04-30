import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/my-appointments
 * Returns the authenticated client's upcoming and past appointments.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const now = new Date();

    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, shopId: true },
    });

    const [upcoming, past] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          OR: [
            { userId: userId },
            ...(authUserEmail ? [{ user: { email: authUserEmail } }] : [])
          ],
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
        take: limit,
        skip: skip,
      }),
      prisma.appointment.findMany({
        where: {
          OR: [
            { userId: userId },
            ...(authUserEmail ? [{ user: { email: authUserEmail } }] : [])
          ],
          AND: [
            {
              OR: [
                { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
                { startTime: { lt: now }, status: 'SCHEDULED' },
              ],
            }
          ]
        },
        include: {
          service: { select: { id: true, name: true, price: true, duration: true } },
          staff: { select: { name: true } },
          shop: { select: { id: true, name: true, timezone: true } },
          review: { select: { id: true } },
        },
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: skip,
      }),
    ]);

    return NextResponse.json({
      upcoming: JSON.parse(JSON.stringify(upcoming)),
      past: JSON.parse(JSON.stringify(past)),
      user: user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

