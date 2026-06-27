import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

/**
 * GET /api/shops/[shopId]/sms-settings
 * Fetch SMS reminder settings and delivery stats.
 */
export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true },
    });

    const customization = (shop?.customization as Record<string, any>) || {};
    const config = customization.smsSettings || null;

    // Get SMS delivery stats from the Notification table
    const [sent, pending, failed] = await Promise.all([
      prisma.notification.count({
        where: { shopId, channel: { in: ['SMS', 'BOTH'] }, status: 'SENT' },
      }),
      prisma.notification.count({
        where: { shopId, channel: { in: ['SMS', 'BOTH'] }, status: 'PENDING' },
      }),
      prisma.notification.count({
        where: { shopId, channel: { in: ['SMS', 'BOTH'] }, status: 'FAILED' },
      }),
    ]);

    const stats = {
      sent,
      pending,
      failed,
      totalCost: `$${((sent * 0.0079).toFixed(2))}`, // Twilio US SMS rate estimate
    };

    return NextResponse.json({ config, stats });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/shops/[shopId]/sms-settings
 * Update SMS reminder settings.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { config } = await request.json();

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true },
    });

    const existing = (shop?.customization as Record<string, any>) || {};
    const updated = { ...existing, smsSettings: config };

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: updated },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
