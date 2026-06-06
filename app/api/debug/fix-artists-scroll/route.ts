import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/debug/fix-artists-scroll
 * Makes the artists grid horizontally scrollable
 */
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

    // Replace artists-grid CSS with horizontal scroll
    const oldGrid = `.artists-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 36px;
      position: relative;
      z-index: 1;
    }`;

    const newGrid = `.artists-grid {
      display: flex;
      gap: 28px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 16px;
      position: relative;
      z-index: 1;
      scrollbar-width: thin;
      scrollbar-color: var(--rose-primary, #D4849C) transparent;
    }
    .artists-grid::-webkit-scrollbar { height: 6px; }
    .artists-grid::-webkit-scrollbar-track { background: transparent; }
    .artists-grid::-webkit-scrollbar-thumb { background: var(--rose-primary, #D4849C); border-radius: 3px; }
    .artists-grid .artist-card { min-width: 280px; max-width: 320px; flex-shrink: 0; scroll-snap-align: start; }`;

    if (html.includes(oldGrid)) {
      html = html.replace(oldGrid, newGrid);
      changes.push('Changed artists grid to horizontal scroll with snap');
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
