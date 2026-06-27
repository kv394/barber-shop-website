import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';

/**
 * GET /api/shops/[shopId]/chat-widget
 * Fetch chat widget settings and stats.
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
    const config = customization.chatWidget || null;

    // Basic stats — count chat-related notifications or bookings (placeholder)
    const stats = {
      totalConversations: 0,
      bookingsFromChat: 0,
      avgResponseTime: '<2s',
    };

    return NextResponse.json({ config, stats });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/shops/[shopId]/chat-widget
 * Update chat widget settings.
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
    const updated = { ...existing, chatWidget: config };

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: updated },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
