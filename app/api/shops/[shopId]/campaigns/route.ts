import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

// GET - List campaigns for a shop
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const campaigns = await prisma.campaign.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

// POST - Create a new campaign
export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { name, message, type, channel, targetSegment, scheduledAt } = body;

    if (!name || !message) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
    }

    // SECURITY: Validate enum values and sanitize text fields
    const validTypes = ['PROMO', 'REACTIVATION', 'BIRTHDAY', 'ANNOUNCEMENT'];
    const validChannels = ['EMAIL', 'SMS', 'BOTH'];
    const validSegments = ['ALL', 'INACTIVE_30', 'INACTIVE_60', 'INACTIVE_90', 'BIRTHDAY_THIS_MONTH'];

    const campaign = await prisma.campaign.create({
      data: {
        shopId,
        name: String(name).slice(0, 200),
        message: String(message).slice(0, 5000),
        type: validTypes.includes(type) ? type : 'PROMO',
        channel: validChannels.includes(channel) ? channel : 'EMAIL',
        targetSegment: validSegments.includes(targetSegment) ? targetSegment : 'ALL',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'DRAFT',
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    logger.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

// PATCH - Send/schedule a campaign
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { campaignId, action } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || (campaign.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: campaign.id, shopId } })))) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (action === 'send') {
      // Get target clients based on segment
      const clients = await getTargetClients(shopId, campaign.targetSegment);

      // Create notifications for each client
      const { NotificationService } = await import('@/lib/notifications');
      let sentCount = 0;

      for (const client of clients) {
        try {
          await NotificationService.send({
            shopId,
            userId: client.id,
            type: 'CAMPAIGN',
            channel: campaign.channel,
            title: campaign.name,
            message: campaign.message,
          });
          sentCount++;
        } catch {
          // Continue with other clients
        }
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          recipientCount: sentCount,
        },
      });

      return NextResponse.json({ success: true, recipientCount: sentCount });
    }

    if (action === 'cancel') {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'CANCELLED' },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

async function getTargetClients(shopId: string, segment: string) {
  const now = new Date();

  const baseWhere: any = {
    role: 'CLIENT' as const,
    OR: [
      { shopId },
      { clientAppointments: { some: { shopId } } },
    ],
  };

  switch (segment) {
    case 'INACTIVE_30': {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return prisma.user.findMany({
        where: {
          ...baseWhere,
          clientAppointments: {
            every: { OR: [{ shopId: { not: shopId } }, { startTime: { lt: cutoff } }] },
            some: { shopId },
          },
        },
        select: { id: true, name: true, email: true, phone: true },
      });
    }
    case 'INACTIVE_60': {
      const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return prisma.user.findMany({
        where: {
          ...baseWhere,
          clientAppointments: {
            every: { OR: [{ shopId: { not: shopId } }, { startTime: { lt: cutoff } }] },
            some: { shopId },
          },
        },
        select: { id: true, name: true, email: true, phone: true },
      });
    }
    case 'INACTIVE_90': {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return prisma.user.findMany({
        where: {
          ...baseWhere,
          clientAppointments: {
            every: { OR: [{ shopId: { not: shopId } }, { startTime: { lt: cutoff } }] },
            some: { shopId },
          },
        },
        select: { id: true, name: true, email: true, phone: true },
      });
    }
    case 'BIRTHDAY_THIS_MONTH': {
      const clients = await prisma.user.findMany({
        where: { ...baseWhere, birthday: { not: null } },
        select: { id: true, name: true, email: true, phone: true, birthday: true },
      });
      const month = now.getMonth();
      return clients.filter((c: any) => c.birthday && c.birthday.getMonth() === month);
    }
    default: // ALL
      return prisma.user.findMany({
        where: baseWhere,
        select: { id: true, name: true, email: true, phone: true },
      });
  }
}

