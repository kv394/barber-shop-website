import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/debug/fix-all
 * Fixes products section styling, review form background, and ensures all patches work
 */
export async function POST(request: Request) {
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

    // 1. Fix products section to use services styling
    const oldProductsSection = `<section class="section" id="products">
    <div class="container">
      <div class="section__header">
        <h2 class="section__heading reveal">Our <span style="color:#e9c176" class="italic">Premium Products</span></h2>
      </div>
      <div id="products-loading" class="loading-placeholder">Loading Products...</div>
      <div id="products-list" class="services__grid" style="display:none"></div>
    </div>
  </section>`;

    const newProductsSection = `<section class="services" id="products">
    <div class="container">
      <div class="services__header">
        <div class="section-label reveal">OUR COLLECTION</div>
        <h2 class="services__heading reveal">Premium <span style="color:#e9c176" class="italic">Products</span></h2>
      </div>
      <div id="products-loading" class="loading-placeholder" style="text-align:center;padding:40px;color:#777;">Loading Products...</div>
      <div id="products-list" class="services__grid" style="display:none"></div>
    </div>
  </section>`;

    if (html.includes('<section class="section" id="products">')) {
      html = html.replace('<section class="section" id="products">', '<section class="services" id="products">');
      changes.push('Fixed products section class to match services styling');
    }
    if (html.includes('section__header')) {
      html = html.replace(
        /<div class="section__header">\s*<h2 class="section__heading reveal">Our <span style="color:#e9c176" class="italic">Premium Products<\/span><\/h2>\s*<\/div>/,
        `<div class="services__header">
        <div class="section-label reveal">OUR COLLECTION</div>
        <h2 class="services__heading reveal">Premium <span style="color:#e9c176" class="italic">Products</span></h2>
      </div>`
      );
      changes.push('Updated products header to match services header style');
    }

    // 2. Fix review form background to match page dark theme
    const oldReviewFormCss = '.review-form { max-width: 600px; margin: 0 auto; padding: 32px; background: var(--bg-card, #252525); border-radius: 12px; border: 1px solid rgba(233,193,118,0.15); }';
    const newReviewFormCss = '.review-form { max-width: 600px; margin: 0 auto; padding: 32px; background: var(--bg-section, #1c1b1b); border-radius: 12px; border: 1px solid rgba(233,193,118,0.15); }';
    
    if (html.includes(oldReviewFormCss)) {
      html = html.replace(oldReviewFormCss, newReviewFormCss);
      changes.push('Fixed review form background to match page theme');
    }

    // Also fix the review form section background
    const oldFormSection = '.review-form-section { padding: 40px 0 0; }';
    const newFormSection = '.review-form-section { padding: 60px 0; background: var(--bg-main, #131313); }';
    if (html.includes(oldFormSection)) {
      html = html.replace(oldFormSection, newFormSection);
      changes.push('Fixed review form section padding and background');
    }

    // 3. Fix the products loading placeholder styling  
    if (html.includes('id="products-loading" class="loading-placeholder"') && !html.includes('id="products-loading" class="loading-placeholder" style=')) {
      html = html.replace(
        'id="products-loading" class="loading-placeholder"',
        'id="products-loading" class="loading-placeholder" style="text-align:center;padding:40px;color:#777;"'
      );
      changes.push('Added loading placeholder styling for products');
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed', html_length: html.length });
    }

    // Save
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
      changes,
      html_length: html.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
