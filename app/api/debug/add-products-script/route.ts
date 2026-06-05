import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';

/**
 * POST /api/debug/add-products-script
 * 
 * Adds the products rendering script to the custom HTML.
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

    if (html.includes('getSellableProducts')) {
      return NextResponse.json({ message: 'Products script already exists' });
    }

    // Find the getReviews() call and add products loading after it
    const reviewsCallPattern = "KutzApp.getReviews()";
    const reviewsIdx = html.indexOf(reviewsCallPattern);
    
    if (reviewsIdx === -1) {
      return NextResponse.json({ error: 'Could not find KutzApp.getReviews() in HTML', html_sample: html.substring(0, 500) }, { status: 400 });
    }

    // Find the end of the reviews .then().catch() chain
    // We need to find the matching closing of the chain after getReviews()
    // Look for the pattern that ends the reviews block
    const searchAfter = html.substring(reviewsIdx);
    
    // Find "testimonials').style.display = 'none'" which is near the end of reviews block
    const endMarker = "testimonials').style.display = 'none'";
    const endIdx = searchAfter.indexOf(endMarker);
    
    if (endIdx === -1) {
      return NextResponse.json({ error: 'Could not find end of reviews block' }, { status: 400 });
    }
    
    // Find the closing of the catch block after this marker
    let pos = reviewsIdx + endIdx + endMarker.length;
    // Skip forward to find "});" pattern that closes the catch
    let braceCount = 0;
    let foundEnd = pos;
    for (let i = pos; i < Math.min(pos + 200, html.length); i++) {
      if (html[i] === '}') braceCount++;
      if (html[i] === ';' && braceCount >= 2) {
        foundEnd = i + 1;
        break;
      }
    }

    const productsScript = `

          // ---- Products ----
          KutzApp.getSellableProducts().then(function(products) {
            var listEl = document.getElementById('products-list');
            var loadEl = document.getElementById('products-loading');
            if (!listEl || !loadEl) return;
            if (!products || products.length === 0) {
              loadEl.textContent = 'No products available at this time.';
              return;
            }
            listEl.innerHTML = products.map(function(p) {
              var imgSrc = p.imageUrl || '';
              var imgHtml = imgSrc ? '<div class="service-card__image-wrapper"><img src="' + imgSrc + '" alt="' + (p.name || '') + '" loading="lazy"></div>' : '';
              return '<div class="service-card reveal">' +
                imgHtml +
                '<div class="service-card__body">' +
                '<h3 class="service-card__name">' + (p.name || 'Product') + '</h3>' +
                '<p class="service-card__desc">' + (p.description || '') + '</p>' +
                (p.price && parseFloat(p.price) > 0 ? '<p class="service-card__price">$' + parseFloat(p.price).toFixed(2) + '</p>' : '') +
                '</div></div>';
            }).join('');
            loadEl.style.display = 'none';
            listEl.style.display = 'grid';
            if (typeof observer !== 'undefined') {
              listEl.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
            }
          }).catch(function(err) { console.warn('Products error:', err); });`;

    html = html.slice(0, foundEnd) + productsScript + html.slice(foundEnd);

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

    // Invalidate caches
    const slug = shop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
    await cacheService.invalidate(`shop_public_page_data:${slug}`).catch(() => {});
    await cacheService.invalidate(`api_public_data:${shopId}`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Products rendering script added',
      html_length: html.length,
      insertedAt: foundEnd
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
