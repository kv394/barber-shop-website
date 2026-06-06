import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId } = body;
    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { customization: true, name: true }
    });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const customization = (shop.customization || {}) as any;
    let html = customization.customHtml || '';
    const changes: string[] = [];

    // Hide scrollbar - change scrollbar-width from thin to none
    if (html.includes('scrollbar-width: thin;')) {
      html = html.replace('scrollbar-width: thin;', 'scrollbar-width: none;');
      changes.push('Set scrollbar-width to none');
    }

    // Hide webkit scrollbar
    if (html.includes(".artists-grid::-webkit-scrollbar { height: 6px; }")) {
      html = html.replace(
        ".artists-grid::-webkit-scrollbar { height: 6px; }",
        ".artists-grid::-webkit-scrollbar { display: none; }"
      );
      changes.push('Hidden webkit scrollbar');
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed' });
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: { customization: { ...customization, customHtml: html } }
    });

    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({ success: true, changes, html_length: html.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
