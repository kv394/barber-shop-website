import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canView = user?.role === 'SITE_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
      (user?.role === 'STAFF' && user?.shopId === shopId) ||
      (user?.role === 'ATTENDANCE_KIOSK' && user?.shopId === shopId);
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const waitlist = await prisma.waitlist.findMany({
      where: {
        shopId: shopId,
        createdAt: { gte: today },
        status: { in: ['WAITING', 'SERVING'] },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(waitlist);
  } catch (error) {
    logger.error('Error fetching waitlist:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canAdd = user?.role === 'SITE_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
      (user?.role === 'STAFF' && user?.shopId === shopId);
    if (!canAdd) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { clientName, clientPhone, partySize, serviceId, staffId } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    // SECURITY: Atomic position calculation + create to prevent duplicate positions
    const entry = await prisma.$transaction(async (tx: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastEntry = await tx.waitlist.findFirst({
        where: { shopId: shopId, createdAt: { gte: today } },
        orderBy: { position: 'desc' },
      });

      return tx.waitlist.create({
        data: {
          clientName: String(clientName).slice(0, 200),
          clientPhone: clientPhone ? String(clientPhone).slice(0, 30) : null,
          partySize: Math.max(1, parseInt(partySize) || 1),
          serviceId: serviceId || null,
          staffId: staffId || null,
          position: (lastEntry?.position || 0) + 1,
          shopId: shopId,
        },
      });
    }, { isolationLevel: 'Serializable' });

    revalidatePath(`/shop/${shopId}/waitlist`);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    logger.error('Error adding to waitlist:', error);
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canUpdate = user?.role === 'SITE_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
      (user?.role === 'STAFF' && user?.shopId === shopId);
    if (!canUpdate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, status, staffId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Valid id required' }, { status: 400 });
    }
    if (status && !['WAITING', 'SERVING', 'DONE', 'LEFT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (staffId !== undefined) dataToUpdate.staffId = staffId;

    const updated = await prisma.waitlist.update({
      where: { id, shopId },
      data: dataToUpdate,
    });

    revalidatePath(`/shop/${shopId}/waitlist`);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating waitlist:', error);
    return NextResponse.json({ error: 'Failed to update waitlist' }, { status: 500 });
  }
}
