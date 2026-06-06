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

    // Fix: remove the media query that overrides flex with grid
    const oldMedia = `.artists-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }`;
    if (html.includes(oldMedia)) {
      html = html.replace(oldMedia, `.artists-grid { max-width: 100%; }`);
      changes.push('Removed grid override in mobile media query');
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
