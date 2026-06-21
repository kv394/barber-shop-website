import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debug/refresh-shop-html
 * 
 * Diagnose or update the shop's customHtml and clear all caches.
 * If `html` is provided in the body, it writes that HTML to the DB.
 * Otherwise it just reads and reports what Prisma sees.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, slug, html } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    let resultHtml: string;

    if (html && typeof html === 'string') {
      // WRITE mode: update customHtml via Vercel's own Prisma connection
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { customization: true }
      });
      const customization = (shop?.customization || {}) as any;
      customization.customHtml = html;

      await prisma.shop.update({
        where: { id: shopId },
        data: { customization }
      });
      resultHtml = html;
    } else {
      // READ mode: just report what Prisma sees
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { customization: true, name: true }
      });
      if (!shop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      resultHtml = (shop.customization as any)?.customHtml || '';
    }

    // Clear ALL caches for this shop
    const cacheKeys = [
      `shop_public_page_data:${slug || shopId}`,
      `api_public_data_v2:${shopId}`,
    ];
    for (const key of cacheKeys) {
      await cacheService.invalidate(key).catch(() => {});
    }
    await cacheService.invalidatePattern(`*${shopId}*`).catch(() => {});
    if (slug) {
      await cacheService.invalidatePattern(`*${slug}*`).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      mode: html ? 'write' : 'read',
      htmlLength: resultHtml.length,
      hasDeck: resultHtml.includes('DECK OF CARDS'),
      hasScrollSnap: resultHtml.includes('scroll-snap'),
      clearedCaches: cacheKeys,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
