import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-equal-size
 * Makes the reviews carousel and review form boxes the same size
 */
export async function POST(request: Request) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

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

    // 1. Fix row: stretch instead of flex-start
    if (html.includes('align-items: flex-start')) {
      html = html.replace(
        '.reviews-row { display: flex; gap: 40px; align-items: flex-start; max-width: 1200px; margin: 0 auto; }',
        '.reviews-row { display: flex; gap: 40px; align-items: stretch; max-width: 1200px; margin: 0 auto; }'
      );
      changes.push('Changed align-items to stretch for equal height');
    }

    // 2. Remove max-width from carousel so it fills its column
    if (html.includes('.reviews-carousel { position: relative; max-width: 700px;')) {
      html = html.replace(
        '.reviews-carousel { position: relative; max-width: 700px; margin: 0 auto; min-height: 200px; }',
        '.reviews-carousel { position: relative; width: 100%; min-height: 200px; }'
      );
      changes.push('Removed carousel max-width to fill column');
    }

    // 3. Make carousel slide fill height
    if (html.includes('.reviews-carousel__slide {')) {
      const oldSlide = html.match(/\.reviews-carousel__slide \{[^}]+\}/);
      if (oldSlide) {
        const newSlide = oldSlide[0]
          .replace('box-sizing: border-box;', 'box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; min-height: 100%;');
        html = html.replace(oldSlide[0], newSlide);
        changes.push('Made carousel slides vertically centered');
      }
    }

    // 4. Make review form fill its column height  
    if (html.includes('.review-form { max-width: 600px;')) {
      html = html.replace(
        '.review-form { max-width: 600px; margin: 0 auto;',
        '.review-form { max-width: 100%; margin: 0;'
      );
      changes.push('Made review form fill column width');
    }

    // 5. Make the left and right columns flex too so children stretch
    if (!html.includes('reviews-row__left { flex: 1; min-width: 0; display: flex;')) {
      html = html.replace(
        '.reviews-row__left { flex: 1; min-width: 0; }',
        '.reviews-row__left { flex: 1; min-width: 0; display: flex; flex-direction: column; }'
      );
      html = html.replace(
        '.reviews-row__right { flex: 1; min-width: 0; }',
        '.reviews-row__right { flex: 1; min-width: 0; display: flex; flex-direction: column; }'
      );
      changes.push('Made columns flex containers for equal sizing');
    }

    // 6. Make review form stretch to fill
    if (!html.includes('.reviews-row__right .review-form')) {
      const lastStyleClose = html.lastIndexOf('</style>');
      if (lastStyleClose > -1) {
        const extraCss = `
    .reviews-row__left .reviews-carousel { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .reviews-row__right .review-form { flex: 1; display: flex; flex-direction: column; justify-content: center; }`;
        html = html.slice(0, lastStyleClose) + extraCss + '\n' + html.slice(lastStyleClose);
        changes.push('Added flex grow rules for equal sizing');
      }
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
