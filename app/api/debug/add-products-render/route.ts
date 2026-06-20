import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/add-products-render
 * Adds the products rendering code to the getPublicData().then() block
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

    if (html.includes('products-list') && html.includes('data.products')) {
      return NextResponse.json({ message: 'Products rendering already exists' });
    }

    // Find the testimonials display:none block which is at the end of the reviews rendering
    const marker = "testimonials').style.display = 'none'";
    const markerIdx = html.indexOf(marker);
    
    if (markerIdx === -1) {
      return NextResponse.json({ error: 'Could not find reviews end marker', searched: marker }, { status: 400 });
    }

    // Find the closing }); of the reviews catch/else block after this marker
    // Go forward until we find a line that looks like the end of the reviews block
    let pos = markerIdx + marker.length;
    // Skip to the next blank line or section comment
    let insertPos = pos;
    // Find next "} catch" or "// ---" pattern
    const nextSection = html.indexOf('// ---', pos);
    const nextCatch = html.indexOf('} catch', pos);
    
    // Insert before whichever comes first
    if (nextSection > -1 && (nextCatch === -1 || nextSection < nextCatch)) {
      insertPos = nextSection;
    } else if (nextCatch > -1) {
      insertPos = nextCatch;
    }

    const productsRenderCode = `
          // --- PRODUCTS ---
          try {
            var products = (data.products || []);
            if (products.length > 0) {
              var prodListEl = document.getElementById('products-list');
              var prodLoadEl = document.getElementById('products-loading');
              if (prodListEl && prodLoadEl) {
                prodListEl.innerHTML = products.map(function(p, i) {
                  var delay = Math.min(i + 1, 6);
                  var imgSrc = p.imageUrl || '';
                  var imgHtml = imgSrc ? '<div class="service-card__image-wrapper"><img src="' + imgSrc + '" alt="' + (p.name || '') + '" loading="lazy"></div>' : '';
                  return '<div class="service-card reveal reveal-delay-' + delay + '">' +
                    imgHtml +
                    '<div class="service-card__body">' +
                    '<h3 class="service-card__name">' + (p.name || 'Product') + '</h3>' +
                    '<p class="service-card__desc">' + (p.description || '') + '</p>' +
                    (p.price && parseFloat(p.price) > 0 ? '<p class="service-card__price">$' + parseFloat(p.price).toFixed(2) + '</p>' : '') +
                    '</div></div>';
                }).join('');
                prodLoadEl.style.display = 'none';
                prodListEl.style.display = 'grid';
                prodListEl.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
              }
            } else {
              var prodLoadEl2 = document.getElementById('products-loading');
              if (prodLoadEl2) prodLoadEl2.textContent = 'No products available.';
            }
          } catch (e) { console.error('Products render error:', e); }

`;

    html = html.slice(0, insertPos) + productsRenderCode + html.slice(insertPos);

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
      message: 'Products rendering code added to getPublicData block',
      html_length: html.length,
      insertedAt: insertPos
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
