import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string; clientId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const canView = currentUser?.role === 'SUPER_ADMIN' ||
      (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === params.shopId) ||
      (currentUser?.role === 'STAFF' && currentUser?.shopId === params.shopId);

    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const client = await prisma.user.findUnique({
      where: { id: params.clientId },
      select: {
        id: true, name: true, email: true, phone: true, 
        clientNotes: true, preferences: true, allergies: true,
        marketingConsent: true, smsConsent: true,
        barcode: true, createdAt: true,
        clientAppointments: {
          where: { shopId: params.shopId },
          include: {
            service: { select: { name: true, price: true, duration: true } },
            staff: { select: { name: true } },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
        },
        _count: {
          select: { clientAppointments: { where: { shopId: params.shopId } } },
        },
      },
    });

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    return NextResponse.json(client);
  } catch (error) {
    logger.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { shopId: string; clientId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const canEdit = currentUser?.role === 'SUPER_ADMIN' ||
      (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === params.shopId) ||
      (currentUser?.role === 'STAFF' && currentUser?.shopId === params.shopId);

    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updateData: any = {};

    if (body.clientNotes !== undefined) updateData.clientNotes = body.clientNotes;
    if (body.preferences !== undefined) updateData.preferences = body.preferences;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (body.marketingConsent !== undefined) updateData.marketingConsent = body.marketingConsent;
    if (body.smsConsent !== undefined) updateData.smsConsent = body.smsConsent;

    const updated = await prisma.user.update({
      where: { id: params.clientId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
