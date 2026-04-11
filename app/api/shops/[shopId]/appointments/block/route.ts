import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || user.shopId !== shopId) {
        return new Response('Forbidden', { status: 403 });
    }

    // Only allow STAFF or SHOP_ADMIN/SUPER_ADMIN to block time
    if (user.role !== 'STAFF' && user.role !== 'SHOP_ADMIN' && user.role !== 'SUPER_ADMIN') {
        return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const targetStaffId = body.staffId;

    // Staff can only block their own time, unless they are admin
    if (user.role === 'STAFF' && user.id !== targetStaffId) {
        return new Response('Forbidden', { status: 403 });
    }

    if (!body.startTime || !body.endTime) {
        return NextResponse.json({ error: 'Missing start or end time' }, { status: 400 });
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    // Get an internal service or create a dummy one, or just create appointment without service.
    // The serviceId is optional in the Prisma schema (service Service? @relation)
    const appointment = await prisma.appointment.create({
      data: {
        shopId,
        staffId: targetStaffId,
        userId: targetStaffId, // Use staff's own ID as the client for internal blocks
        startTime,
        endTime,
        notes: body.notes || 'Blocked Time',
        status: 'SCHEDULED'
      },
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    logger.error("Error blocking time:", error);
    return NextResponse.json({ error: 'Failed to block time' }, { status: 500 });
  }
}
