import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/debug/fix-shopid
 * Fixes hardcoded shopId in customHtml to match the actual shop ID
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, oldShopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const customization = (shop.customization || {}) as any;
    let html = customization.customHtml || '';

    if (!html) {
      return NextResponse.json({ error: 'No customHtml' }, { status: 400 });
    }

    // Replace the old shopId with the correct one
    const wrongId = oldShopId || '';
    let count = 0;
    
    if (wrongId && html.includes(wrongId)) {
      const regex = new RegExp(wrongId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      count = (html.match(regex) || []).length;
      html = html.replace(regex, shopId);
    }

    if (count === 0) {
      // Find any shopId that's not the correct one
      const shopIdPattern = /var shopId = urlParams\.get\('shopId'\) \|\| '([^']+)'/g;
      let match;
      const wrongIds: string[] = [];
      while ((match = shopIdPattern.exec(html)) !== null) {
        if (match[1] !== shopId) {
          wrongIds.push(match[1]);
        }
      }
      
      for (const wid of wrongIds) {
        const regex = new RegExp(wid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        count += (html.match(regex) || []).length;
        html = html.replace(regex, shopId);
      }

      if (count === 0) {
        return NextResponse.json({ message: 'No wrong shopId found', shopId });
      }
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        customization: {
          ...customization,
          customHtml: html
        }
      }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Replaced ${count} occurrences of wrong shopId with ${shopId}`,
      replacedId: oldShopId || 'auto-detected',
      html_length: html.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
