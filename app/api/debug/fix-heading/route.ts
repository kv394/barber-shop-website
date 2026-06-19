import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/fix-heading
 * Fixes the products section heading to match other section headings exactly
 */
export async function POST(request: Request) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const body = await request.json();
    const { shopId } = body;

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
    const changes: string[] = [];

    // Fix: Replace the products header to exactly match services/team pattern
    // Current: services__header > section-label + services__heading
    // Target:  services__header > section-label + gold-line + section-heading
    
    const oldProductsHeader = `<div class="services__header">
        <div class="section-label reveal">OUR COLLECTION</div>
        <h2 class="services__heading reveal">Premium <span style="color:#e9c176" class="italic">Products</span></h2>
      </div>`;

    const newProductsHeader = `<div class="services__header">
        <div class="section-label reveal">OUR COLLECTION</div>
        <div class="gold-line reveal reveal-delay-1"></div>
        <h2 class="section-heading reveal reveal-delay-2">Premium <span style="color:var(--gold-primary)" class="italic">Products</span></h2>
      </div>`;

    if (html.includes(oldProductsHeader)) {
      html = html.replace(oldProductsHeader, newProductsHeader);
      changes.push('Fixed products heading: added gold-line, changed to section-heading class, added reveal delays');
    } else {
      // Try a more flexible match
      if (html.includes('services__heading reveal">Premium')) {
        html = html.replace(
          'services__heading reveal">Premium',
          'section-heading reveal reveal-delay-2">Premium'
        );
        changes.push('Fixed h2 class from services__heading to section-heading');
      }

      // Add gold-line if missing in products header
      if (html.includes('OUR COLLECTION</div>') && !html.includes('OUR COLLECTION</div>\n        <div class="gold-line')) {
        html = html.replace(
          'OUR COLLECTION</div>',
          'OUR COLLECTION</div>\n        <div class="gold-line reveal reveal-delay-1"></div>'
        );
        changes.push('Added gold-line divider to products header');
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed or pattern not found', html_length: html.length });
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

    return NextResponse.json({ success: true, changes, html_length: html.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
