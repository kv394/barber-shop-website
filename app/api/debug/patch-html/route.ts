import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { requireSiteAdmin } from '@/lib/auth';

/**
 * POST /api/debug/patch-html
 * 
 * Patches the customHtml for a shop to add missing nav items and sections.
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

    if (!html) {
      return NextResponse.json({ error: 'No customHtml found' }, { status: 400 });
    }

    const changes: string[] = [];

    // 1. Add Products and Reviews nav links (after Gallery link)
    const galleryNavPattern = /<li><a href="#gallery">Gallery<\/a><\/li>/i;
    if (galleryNavPattern.test(html) && !html.includes('href="#products"') && !html.includes('href="#testimonials"')) {
      html = html.replace(
        galleryNavPattern,
        `<li><a href="#gallery">Gallery</a></li>
        <li><a href="#products">Products</a></li>
        <li><a href="#testimonials">Reviews</a></li>`
      );
      changes.push('Added Products and Reviews to nav menu');
    }

    // Also update the mobile menu if it exists
    const mobileGalleryPattern = /<li><a href="#gallery" class="mobile-nav__link">Gallery<\/a><\/li>/i;
    if (mobileGalleryPattern.test(html)) {
      html = html.replace(
        mobileGalleryPattern,
        `<li><a href="#gallery" class="mobile-nav__link">Gallery</a></li>
        <li><a href="#products" class="mobile-nav__link">Products</a></li>
        <li><a href="#testimonials" class="mobile-nav__link">Reviews</a></li>`
      );
      changes.push('Added Products and Reviews to mobile nav');
    }

    // 2. Add Products section (before the testimonials section)
    if (!html.includes('id="products"')) {
      const testimonialsPattern = /<!-- =+\s*\n\s*8\. ABOUT \/ STORY|<section class="testimonials"/i;
      const productsSection = `
  <!-- ==========================================
       PRODUCTS
  ========================================== -->
  <section class="section" id="products">
    <div class="container">
      <div class="section__header">
        <h2 class="section__heading reveal">Our <span style="color:#e9c176" class="italic">Premium Products</span></h2>
      </div>
      <div id="products-loading" class="loading-placeholder">Loading Products...</div>
      <div id="products-list" class="services__grid" style="display:none"></div>
    </div>
  </section>

`;
      // Insert before testimonials section
      const testimonialsSectionStart = html.indexOf('<section class="testimonials"');
      if (testimonialsSectionStart > -1) {
        html = html.slice(0, testimonialsSectionStart) + productsSection + html.slice(testimonialsSectionStart);
        changes.push('Added Products section before testimonials');
      }
    }

    // 3. Add product loading script to the SDK data loading section
    if (!html.includes('products-list') || !html.includes('getSellableProducts')) {
      // Find the end of the reviews rendering code and add products rendering
      const reviewsRenderEnd = html.indexOf("document.getElementById('reviews-loading')");
      if (reviewsRenderEnd > -1) {
        // Find the closing of the reviews block
        let searchFrom = reviewsRenderEnd;
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
              var imgSrc = p.imageUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect fill=%22%23333%22 width=%22300%22 height=%22200%22/><text fill=%22%23666%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22>No Image</text></svg>';
              return '<div class="service-card reveal">' +
                '<div class="service-card__image-wrapper"><img src="' + imgSrc + '" alt="' + (p.name || '') + '" loading="lazy"></div>' +
                '<div class="service-card__body">' +
                '<h3 class="service-card__name">' + (p.name || 'Product') + '</h3>' +
                '<p class="service-card__desc">' + (p.description || '') + '</p>' +
                (p.price ? '<p class="service-card__price">$' + parseFloat(p.price).toFixed(2) + '</p>' : '') +
                '</div></div>';
            }).join('');
            loadEl.style.display = 'none';
            listEl.style.display = 'grid';
            // Re-observe for scroll animations
            if (typeof observer !== 'undefined') {
              listEl.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
            }
          }).catch(function(err) { console.warn('Products error:', err); });
`;
        // Insert after the reviews rendering section - find the catch block
        const reviewsCatch = html.indexOf("}).catch(function(err) { console.warn('Reviews error:', err); });");
        if (reviewsCatch > -1) {
          const insertPoint = reviewsCatch + "}).catch(function(err) { console.warn('Reviews error:', err); });".length;
          html = html.slice(0, insertPoint) + productsScript + html.slice(insertPoint);
          changes.push('Added products rendering script');
        }
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ message: 'No changes needed', html_length: html.length });
    }

    // Save updated HTML
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
      changes,
      html_length: html.length,
      slug
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
