import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
  try {
    const { shopId, clientId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canView = currentUser?.role === 'SUPER_ADMIN' ||
      (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === shopId) ||
      (currentUser?.role === 'STAFF' && currentUser?.shopId === shopId);

    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true, name: true, email: true, phone: true, 
        clientNotes: true, preferences: true, allergies: true,
        marketingConsent: true, smsConsent: true,
        barcode: true, createdAt: true,
        clientAppointments: {
          where: { shopId: shopId },
          include: {
            service: { select: { name: true, price: true, duration: true } },
            staff: { select: { name: true } },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
        },
        clientFormulas: {
          where: { shopId: shopId },
          include: { staff: { select: { name: true } } },
          orderBy: { date: 'desc' },
        },
        clientHistoryImages: {
          where: { shopId: shopId },
          orderBy: { date: 'desc' },
        },
        _count: {
          select: { clientAppointments: { where: { shopId: shopId } } },
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
  { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
  try {
    const { shopId, clientId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    const canEdit = currentUser?.role === 'SUPER_ADMIN' ||
      (currentUser?.role === 'SHOP_ADMIN' && currentUser?.shopId === shopId) ||
      (currentUser?.role === 'STAFF' && currentUser?.shopId === shopId);

    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Verify the client has a relationship with this shop (appointments or shopId)
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        OR: [
          { shopId: shopId },
          { clientAppointments: { some: { shopId: shopId } } },
        ],
      },
    });
    if (!client) return NextResponse.json({ error: 'Client not found in this shop' }, { status: 404 });

    const body = await request.json();
    const updateData: any = {};

    // SECURITY: Sanitize text fields — strip HTML tags and limit length (stored XSS prevention)
    if (body.clientNotes !== undefined) updateData.clientNotes = typeof body.clientNotes === 'string' ? body.clientNotes.replace(/<[^>]*>/g, '').slice(0, 5000) : null;
    if (body.preferences !== undefined) updateData.preferences = typeof body.preferences === 'string' ? body.preferences.replace(/<[^>]*>/g, '').slice(0, 2000) : null;
    if (body.allergies !== undefined) updateData.allergies = typeof body.allergies === 'string' ? body.allergies.replace(/<[^>]*>/g, '').slice(0, 2000) : null;
    if (body.marketingConsent !== undefined) updateData.marketingConsent = Boolean(body.marketingConsent);
    if (body.smsConsent !== undefined) updateData.smsConsent = Boolean(body.smsConsent);

    const updated = await prisma.user.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true,
        clientNotes: true, preferences: true, allergies: true,
        marketingConsent: true, smsConsent: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}
