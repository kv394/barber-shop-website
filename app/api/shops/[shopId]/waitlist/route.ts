import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canView = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId) ||
      (user?.role === 'STAFF' && user?.shopId === params.shopId);
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const waitlist = await prisma.waitlist.findMany({
      where: {
        shopId: params.shopId,
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
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canAdd = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId) ||
      (user?.role === 'STAFF' && user?.shopId === params.shopId);
    if (!canAdd) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { clientName, clientPhone, partySize, serviceId, staffId } = body;

    if (!clientName) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    // Get next position
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastEntry = await prisma.waitlist.findFirst({
      where: { shopId: params.shopId, createdAt: { gte: today } },
      orderBy: { position: 'desc' },
    });

    const entry = await prisma.waitlist.create({
      data: {
        clientName,
        clientPhone: clientPhone || null,
        partySize: partySize || 1,
        serviceId: serviceId || null,
        staffId: staffId || null,
        position: (lastEntry?.position || 0) + 1,
        shopId: params.shopId,
      },
    });

    revalidatePath(`/shop/${params.shopId}/waitlist`);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    logger.error('Error adding to waitlist:', error);
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canUpdate = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId) ||
      (user?.role === 'STAFF' && user?.shopId === params.shopId);
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
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath(`/shop/${params.shopId}/waitlist`);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating waitlist:', error);
    return NextResponse.json({ error: 'Failed to update waitlist' }, { status: 500 });
  }
}
