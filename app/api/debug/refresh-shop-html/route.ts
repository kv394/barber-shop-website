import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debug/refresh-shop-html
 * 
 * Force-refreshes the shop's customHtml from the database and clears all caches.
 * Public endpoint for debugging stale cache issues.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, slug } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    // 1. Directly query the DB for current customHtml
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const customization = (shop.customization || {}) as any;
    const htmlLen = customization.customHtml?.length || 0;
    const hasDeck = customization.customHtml?.includes('DECK OF CARDS') || false;
    const hasScrollSnap = customization.customHtml?.includes('scroll-snap') || false;

    // 2. Clear ALL caches for this shop
    const cacheKeys = [
      `shop_public_page_data:${slug || shopId}`,
      `api_public_data_v2:${shopId}`,
    ];

    for (const key of cacheKeys) {
      await cacheService.invalidate(key).catch(() => {});
    }

    // Also try pattern invalidation
    await cacheService.invalidatePattern(`*${shopId}*`).catch(() => {});
    if (slug) {
      await cacheService.invalidatePattern(`*${slug}*`).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      htmlLength: htmlLen,
      hasDeck,
      hasScrollSnap,
      clearedCaches: cacheKeys,
      shopName: shop.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
